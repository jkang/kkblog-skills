# Gallery Incremental Processing — Scaling `build_index.py`

## Context

The gallery skill's `build_index.py` rebuilds the entire manifest from scratch on every invocation. It reads every `*video-lens*.html` report into memory, extracts the embedded JSON meta block via string search, writes a full `manifest.json`, and then inlines that manifest into `index.html`. There is no caching, no mtime tracking, and no incremental delta mechanism. As the report count grows, build time scales linearly — O(n) in the number of reports.

This document analyzes the bottlenecks, evaluates solution approaches, and recommends an implementation path.

---

## Current Behavior

### What happens on every `build_index.py` invocation

1. **Full directory scan** — `glob("*video-lens*.html")` in both `reports/` and the root directory (lines 100–127)
2. **Full file read per report** — `path.read_text()` loads the entire HTML file (~100–200 KB each) into memory (line 51)
3. **String search for meta block** — `content.find(SCRIPT_START)` scans the full file content to locate the `<script id="video-lens-meta">` block (line 52)
4. **JSON parse** — extracts and parses the meta JSON (lines 59–63)
5. **Channel sanitization** — regex-based cleanup per entry (line 111/126)
6. **Full manifest rewrite** — serializes the entire report list to `manifest.json` (line 139)
7. **Full index.html rewrite** — reads template, inlines the full manifest as `window.__MANIFEST__`, writes patched HTML (lines 144–158)

### Cost model

| Reports (N) | Disk read | Manifest write | Index write | Estimated wall time |
|---|---|---|---|---|
| 10 | ~1.5 MB | ~15 KB | ~200 KB | < 1 sec |
| 50 | ~7.5 MB | ~75 KB | ~260 KB | ~1–2 sec |
| 200 | ~30 MB | ~300 KB | ~500 KB | ~5–8 sec |
| 500 | ~75 MB | ~750 KB | ~950 KB | ~12–20 sec |

Assumes ~150 KB average report size, ~1.5 KB meta block per report. The dominant cost is disk I/O for reading N full HTML files when only a small meta block (~1% of file content) is needed.

### `backfill_meta.py` has the same pattern

`backfill_meta.py` reads every report file on every run (line 130). It early-exits per file if the meta block already exists (line 132), but the full file read has already happened by that point. For a mature gallery where all reports have meta blocks, it does N full reads to discover there's nothing to do.

---

## Bottleneck Analysis

### 1. Unnecessary full-file reads (dominant cost)

The meta block is a small JSON blob (~1–2 KB) injected just before `</body>`. The script reads the entire ~150 KB file to find it. For 200 reports, that's ~30 MB of I/O when ~400 KB of useful data exists.

### 2. No change detection

Every invocation reprocesses all files, even if nothing changed since the last build. Adding one new report triggers a full re-read of all existing reports.

### 3. Full manifest rewrite

`manifest.json` is serialized from scratch each time. With 500 reports, this is ~750 KB of JSON written on every build, even when only one entry changed.

### 4. Index.html inline duplication

The manifest is inlined into `index.html` as `window.__MANIFEST__`, meaning the gallery viewer file grows linearly with report count. At 500 reports, the HTML file approaches 1 MB.

---

## Solution Approaches

### Approach A: Mtime-Based Cache File

**Concept:** Maintain a `.build_cache.json` file that stores `{filename: mtime, meta: {...}}` for each processed report. On each build, compare file mtimes against the cache and only re-read files that are new or modified.

**Implementation:**
```python
cache_path = out_dir / ".build_cache.json"
cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}

for path in report_files:
    mtime = path.stat().st_mtime
    key = str(path.relative_to(scan_dir))
    if key in cache and cache[key]["mtime"] == mtime:
        reports.append(cache[key]["meta"])  # cache hit
    else:
        meta = extract_meta(path)           # cache miss — full read
        cache[key] = {"mtime": mtime, "meta": meta}
        reports.append(meta)

# Also prune cache entries for deleted files
cache = {k: v for k, v in cache.items() if (scan_dir / k).exists()}
```

**Complexity:** ~30 lines of changes to `build_index.py`.

### Approach B: Sidecar Meta Files

**Concept:** When a report is generated, write the meta block to a separate `.meta.json` sidecar file alongside the HTML. `build_index.py` reads only the small sidecar files instead of full HTML reports.

**Implementation:**
- At report generation time (in `render_report.py` / `SKILL.md`), write `{filename}.meta.json` alongside the HTML
- `build_index.py` reads `*.meta.json` files (~1–2 KB each) instead of `*.html` files (~150 KB each)
- Fallback to full HTML read if sidecar is missing (backward compat)
- `backfill_meta.py` gains a `--write-sidecars` mode to generate sidecars for existing reports

**Complexity:** Changes to report generation pipeline + `build_index.py` + new backfill mode. ~60–80 lines across 3 files.

### Approach C: Append-Only Manifest with Delta Updates

**Concept:** Instead of rebuilding `manifest.json` from scratch, detect new/changed files and append or update only their entries. Use a lock file or atomic rename for safe concurrent writes.

**Implementation:**
```python
existing = json.loads(manifest_path.read_text()) if manifest_path.exists() else {"reports": []}
existing_files = {r["filename"] for r in existing["reports"]}

# Only process files not already in manifest
new_reports = []
for path in report_files:
    fname = path.name
    if fname not in existing_files:
        meta = extract_meta(path)
        if meta:
            new_reports.append(meta)

if new_reports:
    existing["reports"].extend(new_reports)
    existing["reports"].sort(key=lambda m: m.get("filename", ""), reverse=True)
    existing["count"] = len(existing["reports"])
    # write manifest + rebuild index.html
```

**Complexity:** ~25 lines of changes to `build_index.py`. Requires handling deletions and edits separately.

### Approach D: Partial File Read (Tail Scan)

**Concept:** The meta block is always near the end of the file (injected before `</body>`). Read only the last N bytes instead of the full file.

**Implementation:**
```python
def extract_meta_fast(path: pathlib.Path, tail_bytes: int = 4096) -> dict | None:
    size = path.stat().st_size
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        if size > tail_bytes:
            f.seek(size - tail_bytes)
        chunk = f.read()
    # same string search as before, but on ~4 KB instead of ~150 KB
    i = chunk.find(SCRIPT_START)
    ...
```

**Complexity:** ~15 lines replacing `extract_meta()`. No external state needed.

### Approach E: Hybrid (Mtime Cache + Tail Read)

**Concept:** Combine Approach A and D. Use mtime cache to skip unchanged files entirely, and use tail-read for cache misses to minimize I/O on new files.

**Complexity:** ~40 lines total. Maximum I/O reduction.

---

## Comparison Matrix

| Criteria | A: Mtime Cache | B: Sidecar Files | C: Delta Manifest | D: Tail Read | E: Hybrid (A+D) |
|---|---|---|---|---|---|
| **I/O reduction (steady state)** | ~95% (cache hits skip reads) | ~99% (read 1 KB vs 150 KB) | ~95% (skip known files) | ~97% (read 4 KB vs 150 KB) | ~99% |
| **I/O reduction (cold start)** | 0% (no cache yet) | ~99% (sidecars exist) | 0% (no manifest yet) | ~97% | ~97% |
| **External state required** | `.build_cache.json` | `*.meta.json` sidecars | Existing `manifest.json` | None | `.build_cache.json` |
| **Handles file deletions** | Yes (prune stale cache entries) | Yes (no sidecar = no entry) | Needs explicit handling | N/A (no state) | Yes |
| **Handles file edits** | Yes (mtime changes) | Only if sidecar is regenerated | No (filename match = skip) | Yes (always re-reads) | Yes |
| **Backward compatibility** | Full (cache is additive) | Needs fallback for old reports | Full (manifest is additive) | Full (drop-in replacement) | Full |
| **Pipeline changes required** | `build_index.py` only | Report generation + build + backfill | `build_index.py` only | `build_index.py` only | `build_index.py` only |
| **Implementation effort** | Low (~30 lines) | Medium (~60–80 lines, 3 files) | Low (~25 lines) | Very low (~15 lines) | Low (~40 lines) |
| **Risk of stale data** | Low (mtime is reliable) | Medium (sidecar can drift from HTML) | Medium (deletions/edits missed) | None | Low |

---

## Recommendation: Approach E (Hybrid: Mtime Cache + Tail Read)

### Why this combination

1. **Best steady-state performance** — The mtime cache eliminates all I/O for unchanged files (the common case after the first build). When a cache miss does occur, the tail-read minimizes the I/O from ~150 KB to ~4 KB per file.

2. **No pipeline changes** — Changes are isolated to `build_index.py`. No modifications needed to report generation, `SKILL.md`, or `backfill_meta.py`.

3. **Graceful cold start** — Without a cache, the tail-read still provides a ~97% I/O reduction compared to the current full-file read. The first run is fast, and subsequent runs are near-instant.

4. **Handles all mutation scenarios** — New files, edited files (mtime changes), and deleted files (cache pruning) are all covered without special-case logic.

5. **No risk of stale data** — Unlike sidecar files or delta manifests, the source of truth remains the HTML file itself. The cache is purely a performance optimization that is safe to delete at any time.

### Implementation plan

**Step 1 — Add tail-read to `extract_meta()` (~15 min)**

Replace the full `path.read_text()` in `extract_meta()` with a tail-read of the last 4 KB. This is a drop-in improvement with zero external dependencies.

```python
def extract_meta(path: pathlib.Path, tail_bytes: int = 4096) -> dict | None:
    size = path.stat().st_size
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        if size > tail_bytes:
            f.seek(size - tail_bytes)
        content = f.read()
    i = content.find(SCRIPT_START)
    if i == -1:
        return None
    i += len(SCRIPT_START)
    j = content.find(SCRIPT_END, i)
    if j == -1:
        return None
    raw = content[i:j].strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"WARNING: invalid JSON in {path.name}: {e}", file=sys.stderr)
        return None
```

**Step 2 — Add mtime cache layer (~30 min)**

Wrap the file-processing loop with cache lookup/update logic. Store cache as `.build_cache.json` in the output directory.

```python
CACHE_FILENAME = ".build_cache.json"

def load_cache(out_dir: pathlib.Path) -> dict:
    cache_path = out_dir / CACHE_FILENAME
    if cache_path.exists():
        try:
            return json.loads(cache_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return {}
    return {}

def save_cache(out_dir: pathlib.Path, cache: dict):
    cache_path = out_dir / CACHE_FILENAME
    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
```

In the main loop:
```python
cache = load_cache(out_dir)
for path in report_files:
    key = str(path.relative_to(scan_dir))
    mtime = path.stat().st_mtime
    if key in cache and cache[key]["mtime"] == mtime:
        meta = cache[key]["meta"]       # cache hit
    else:
        meta = extract_meta(path)       # cache miss — tail read
        if meta:
            cache[key] = {"mtime": mtime, "meta": meta}
    if meta:
        reports.append(meta)

# Prune deleted files
live_files = {str(p.relative_to(scan_dir)) for p in report_files}
cache = {k: v for k, v in cache.items() if k in live_files}
save_cache(out_dir, cache)
```

**Step 3 — Add `--force` flag (~5 min)**

Add a `--force` / `--no-cache` flag that bypasses the cache for manual full rebuilds when needed.

**Step 4 — Apply same optimizations to `backfill_meta.py` (~15 min)**

`backfill_meta.py` can benefit from the same tail-read optimization. Since it checks for `META_SCRIPT_START` presence, a tail-read of the last 4 KB is sufficient for the early-exit check, avoiding the full file read for already-backfilled reports.

### Expected performance after implementation

| Reports (N) | Current (full read) | After (steady state) | After (cold start) |
|---|---|---|---|
| 50 | ~1–2 sec | < 0.1 sec | ~0.1 sec |
| 200 | ~5–8 sec | < 0.2 sec | ~0.3 sec |
| 500 | ~12–20 sec | < 0.3 sec | ~0.7 sec |

---

## Future Considerations

- **Manifest size in index.html** — As report count grows, the inlined `window.__MANIFEST__` blob in `index.html` will eventually become large. A future optimization could have the gallery viewer fetch `manifest.json` via XHR instead of inlining it, but this would break `file://` usage. A compromise: inline only the most recent N reports and lazy-load the rest.
- **Filesystem watch mode** — For the dev workflow, a `--watch` mode using `watchdog` or `fsevents` could rebuild incrementally on file changes without polling.
- **Database backend** — At very high report counts (1000+), a SQLite database could replace `manifest.json` entirely, enabling queries, pagination, and full-text search without loading the entire manifest into memory.
