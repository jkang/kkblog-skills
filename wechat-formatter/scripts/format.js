const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

// Brand palette
// Brand palette - Inspire (Enterprise Tech)
const PRIMARY = '#10213E'; // Starry Blues
const ACCENT = '#5DB2E2';  // Creative Blue
const SECONDARY = '#625D9C'; // Amethyst
const MUTED = '#64748B';    // Text Secondary
const BG_ALT = '#F5F5F6';   // Tech Gray
const FONT = "MiSans, 'PingFang SC', system-ui, -apple-system, sans-serif";

// Helper for Base64 encoding
function getBase64Image(imgSource, baseDir) {
    try {
        let imgPath = path.resolve(baseDir, imgSource);
        if (fs.existsSync(imgPath)) {
            const ext = path.extname(imgPath).toLowerCase().replace('.', '');
            const mime = ext === 'jpg' ? 'jpeg' : ext;
            const data = fs.readFileSync(imgPath).toString('base64');
            return `data:image/${mime};base64,${data}`;
        }
    } catch (e) {
        console.warn('Could not base64 encode image: ' + imgSource);
    }
    return imgSource;
}

// CLI Args
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node format.js <input-md> <output-html>');
    process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];
const inputDir = path.dirname(inputFile);

if (!fs.existsSync(inputFile)) {
    console.error('Input file not found: ' + inputFile);
    process.exit(1);
}

const fileContent = fs.readFileSync(inputFile, 'utf-8');
const parsed = matter(fileContent);

// custom renderer for base64 injection
const renderer = new marked.Renderer();

renderer.heading = function (text, level) {
    if (level === 2) {
        // H2: Decorative Icon + Vertical Bar + Text
        const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="${ACCENT}" style="display:inline-block;vertical-align:middle;margin-right:8px;opacity:0.8;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
        return `\n<h2 style="font-size:22px;font-weight:bold;line-height:1.7em;font-family:${FONT};color:${PRIMARY};margin-top:32px;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid ${BG_ALT};display:flex;align-items:center;">` +
            `${icon}<span style="border-left:4px solid ${ACCENT};padding-left:12px;display:inline-block;">${text}</span></h2>\n`;
    }
    if (level === 3) {
        // H3: Diamond Marker + Underlined Text
        const marker = `<span style="color:${ACCENT};margin-right:8px;font-size:16px;">◆</span>`;
        return `\n<h3 style="font-size:20px;font-weight:bold;line-height:1.7em;font-family:${FONT};color:${PRIMARY};margin-top:28px;margin-bottom:12px;display:flex;align-items:center;">` +
            `${marker}<span style="border-bottom:2px solid ${ACCENT};padding-bottom:4px;">${text}</span></h3>\n`;
    }
    if (level === 4) {
        // H4: Badge style with Arrow Icon
        const arrow = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" style="display:inline-block;vertical-align:middle;margin-right:6px;"><path d="m9 18 6-6-6-6"/></svg>`;
        return `\n<p style="margin-top:22px;margin-bottom:12px;"><span style="font-size:15px;font-weight:bold;color:#ffffff;background:linear-gradient(135deg, ${PRIMARY} 0%, ${ACCENT} 100%);padding:5px 14px;border-radius:6px;display:inline-flex;align-items:center;box-shadow:0 4px 10px ${ACCENT}33;">${arrow}${text}</span></p>\n`;
    }
    return `\n<h${level}>${text}</h${level}>\n`;
};

renderer.image = function (href, title, text) {
    const b64 = getBase64Image(href, inputDir);
    return `<img src="${b64}" alt="${text || ''}" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:12px 0;box-shadow:0 4px 8px rgba(0,0,0,0.1);">`;
};

function clean(s) { return s.replace(/\n/g, ' '); }

renderer.paragraph = function (text) {
    if (!text) return '\n<p></p>\n';
    if (text.trim().startsWith('<img') || text.trim().startsWith('<figure')) {
        return '\n' + text + '\n';
    }
    return `\n<p style="font-weight:400;font-family:${FONT};word-break:break-all;color:${PRIMARY};font-size:15px;line-height:1.8;margin:18px 0;">${clean(text)}</p>\n`;
};

renderer.blockquote = function (text) {
    return `\n<section style="font-family:${FONT};margin:20px 0;padding:16px;background-color:${BG_ALT};border-left:4px solid ${SECONDARY};border-radius:8px;color:${MUTED};">\n${text}\n</section>\n`;
};

renderer.list = function (body, ordered) {
    const type = ordered ? 'ol' : 'ul';
    return '\n<' + type + ' style="font-family:' + FONT + ';line-height:30px;padding-left:0;list-style:none;">\n' + body + '\n</' + type + '>\n';
};

renderer.listitem = function (text) {
    return `<li style="list-style:none;margin:8px 0;display:flex;align-items:flex-start;">` +
        `<span style="font-family:${FONT};font-size:15px;color:${ACCENT};margin-right:8px;font-weight:bold;">•</span>` +
        `<span style="font-family:${FONT};font-size:15px;color:${PRIMARY}; flex: 1;">${clean(text)}</span>` +
        `</li>\n`;
};

renderer.strong = function (text) {
    return `<span style="font-weight:bold;color:${SECONDARY};">${text}</span>`;
};

renderer.codespan = function (code) {
    return `<code style="background-color:${BG_ALT};padding:2px 6px;border-radius:4px;font-family:Consolas,Monaco,monospace;font-size:13px;color:${PRIMARY};border:1px solid ${ACCENT}33;">${code}</code>`;
};

renderer.code = function (code, lang) {
    const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return '\n<section style="margin:12px 0;background-color:#282c34;border-radius:5px;">' +
        '<pre style="margin:0;"><code style="overflow-x:auto;padding:12px 16px;color:#abb2bf;background:#282c34;border-radius:5px;display:block;font-family:Consolas,Monaco,Menlo,monospace;font-size:10px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word;">' +
        escaped + '</code></pre></section>\n';
};

marked.setOptions({ renderer });

const htmlContent = marked.parse(parsed.content);
const title = parsed.data.title || '微信公众号排版';
const author = parsed.data.author || 'KKJM';
const coverB64 = parsed.data.cover ? getBase64Image(parsed.data.cover, inputDir) : '';
const tags = parsed.data.tags || [];

let date = '';
if (parsed.data.date) {
    const d = new Date(parsed.data.date);
    date = !isNaN(d) ? d.toISOString().split('T')[0] : String(parsed.data.date);
}

const coverHtml = coverB64 ? `<img src="${coverB64}" alt="${title}" style="max-width:100%;height:auto;border-radius:12px;display:block;margin:0 0 24px 0;box-shadow:0 10px 30px rgba(16, 33, 62, 0.1);">` : '';
const tagsHtml = tags.length > 0 ? `\n<section style="font-family:${FONT};margin:32px 0 12px 0;padding:0;">\n${tags.map(t => `<span style="display:inline-block;font-size:12px;color:${PRIMARY};background-color:${BG_ALT};padding:4px 14px;border-radius:20px;margin:4px 8px 4px 0;border:1px solid ${ACCENT}44;font-weight:bold;"># ${t}</span>`).join('\n')}\n</section>\n` : '';

const html = `<!DOCTYPE html>
<html lang="zh_CN">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { background: #ffffff; color: ${PRIMARY}; margin: 0; padding: 20px; font-family: ${FONT}; }
    #page-content { max-width: 667px; margin: 0 auto; }
    .rich_media_title { font-size: 24px; font-weight: bold; line-height: 1.4; color: ${PRIMARY}; margin-bottom: 16px; }
    .rich_media_meta_list { color: ${MUTED}; font-size: 14px; margin-bottom: 32px; }
    .rich_media_meta_text { margin-right: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px; }
    th, td { padding: 12px 10px; border: 1px solid ${BG_ALT}; text-align: left; vertical-align: top; }
    thead th { background-color: ${PRIMARY}; color: #ffffff; font-weight: bold; }
    tbody tr:nth-child(even) { background-color: ${BG_ALT}; }
  </style>
</head>
<body>
<div id="page-content">
  ${coverHtml}
  <h1 class="rich_media_title">${title}</h1>
  <div class="rich_media_meta_list">
    <span class="rich_media_meta_text">${author}</span>
    <span class="rich_media_meta_text">${date}</span>
  </div>
  <div id="js_content">
    ${htmlContent}
    ${tagsHtml}
  </div>
</div>
</body>
</html>`;

fs.writeFileSync(outputFile, html, 'utf-8');
console.log('Successfully generated ' + outputFile + ' with Base64 images.');
