const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

// Brand palette
// Brand palette - Premium Zen
const BLUE = '#3b82f6'; // Blue 500
const DARK = '#0f172a'; // Slate 900
const ACCENT = '#8b5cf6'; // Violet 500
const FONT = "Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, 'PingFang SC', Cambria, Cochin, Georgia, Times, 'Times New Roman', serif";

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
        return '\n<h2 style="font-size:22px;font-weight:bold;line-height:1.7em;font-family:' + FONT + ';color:' + DARK + ';margin-top:22px;margin-bottom:8px;padding-left:12px;border-left:4px solid ' + BLUE + ';display:block;">' +
            '<span style="font-size:inherit;color:inherit;font-weight:bold;white-space:pre-wrap;">' + text + '</span></h2>\n';
    }
    if (level === 3) {
        return '\n<h3 style="font-size:20px;font-weight:bold;line-height:1.7em;font-family:' + FONT + ';color:' + DARK + ';margin-top:20px;margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid ' + BLUE + ';display:block;width:100%;">' +
            '<span style="font-size:20px;color:' + DARK + ';font-weight:bold;white-space:pre-wrap;">' + text + '</span></h3>\n';
    }
    if (level === 4) {
        return '\n<p style="margin-top:18px;margin-bottom:8px;"><span style="font-size:15px;font-weight:bold;color:#ffffff;background-color:' + BLUE + ';padding:3px 10px;border-radius:4px;">' + text + '</span></p>\n';
    }
    return '\n<h' + level + '>' + text + '</h' + level + '>\n';
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
    return '\n<p style="font-weight:400;font-family:' + FONT + ';word-break:break-all;color:' + DARK + ';font-size:14px;line-height:1.8;margin:16px 0;">' + clean(text) + '</p>\n';
};

renderer.blockquote = function (text) {
    return '\n<section style="font-family:' + FONT + ';margin:16px 0;padding:12px;background-color:rgba(248,249,250,1);border-radius:12px;color:#8f959e;">\n' + text + '\n</section>\n';
};

renderer.list = function (body, ordered) {
    const type = ordered ? 'ol' : 'ul';
    return '\n<' + type + ' style="font-family:' + FONT + ';line-height:30px;padding-left:0;list-style:none;">\n' + body + '\n</' + type + '>\n';
};

renderer.listitem = function (text) {
    return '<li style="list-style:none;margin:4px 0;">' +
        '<span style="font-family:' + FONT + ';font-size:14px;color:' + BLUE + ';margin-right:8px;margin-left:18px;font-weight:bold;">*</span>' +
        '<span style="font-family:' + FONT + ';font-size:14px;color:' + DARK + ';">' + clean(text) + '</span>' +
        '</li>\n';
};

renderer.strong = function (text) {
    return '<span style="font-weight:bold;color:' + BLUE + ';">' + text + '</span>';
};

renderer.codespan = function (code) {
    return '<code style="background-color:#f0f4ff;padding:2px 6px;border-radius:3px;font-family:Consolas,Monaco,monospace;font-size:10px;color:#4A90E2;">' + code + '</code>';
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

const coverHtml = coverB64 ? `<img src="${coverB64}" alt="${title}" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:0 0 16px 0;box-shadow:0 4px 8px rgba(0,0,0,0.1);">` : '';
const tagsHtml = tags.length > 0 ? `\n<section style="font-family:${FONT};margin:24px 0 8px 0;padding:0;">\n${tags.map(t => `<span style="display:inline-block;font-size:12px;color:${BLUE};background-color:#f0f4ff;padding:4px 12px;border-radius:16px;margin:4px 6px 4px 0;border:1px solid #d0ddf5;">#${t}</span>`).join('\n')}\n</section>\n` : '';

const html = `<!DOCTYPE html>
<html lang="zh_CN">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { background: #ffffff; color: ${DARK}; margin: 0; padding: 20px; font-family: ${FONT}; }
    #page-content { max-width: 667px; margin: 0 auto; }
    .rich_media_title { font-size: 22px; font-weight: bold; line-height: 1.4; color: #1a1a1a; margin-bottom: 12px; }
    .rich_media_meta_list { color: #888; font-size: 13px; margin-bottom: 24px; }
    .rich_media_meta_text { margin-right: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10px; }
    th, td { padding: 10px 8px; border: 1px solid #e0e0e0; text-align: left; vertical-align: top; }
    thead th { background-color: #f0f4ff; color: ${DARK}; font-weight: bold; }
    tbody tr:nth-child(even) { background-color: #f8f9fa; }
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
