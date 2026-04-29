const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const CONTENT_DIR = path.join(process.cwd(), 'content/blogs');

// 默认封面配置
const DEFAULT_COVER_NAME = 'sample_blog_cover.png'; // 修正为存在的默认封面
const DEFAULT_COVER_ABS_PATH = path.join(CONTENT_DIR, DEFAULT_COVER_NAME);
// 如果 content 下有默认封面，则使用相对路径（走 API），否则使用 public 下的绝对路径
const DEFAULT_COVER = fs.existsSync(DEFAULT_COVER_ABS_PATH) ? DEFAULT_COVER_NAME : '/blogs/blog1-cover.png';

function formatDate(date) {
    if (!date) return new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function organizeBlogs() {
    if (!fs.existsSync(CONTENT_DIR)) {
        console.error(`目录不存在: ${CONTENT_DIR}`);
        return;
    }

    const files = fs.readdirSync(CONTENT_DIR);
    const mdFiles = files.filter(file => file.endsWith('.md'));

    console.log(`🔍 扫描到 ${mdFiles.length} 个博客文件...`);
    console.log(`ℹ️  模式: 直接引用 content/blogs 下的图片资源 (API 代理)`);

    mdFiles.forEach(file => {
        const slug = file.replace(/\.md$/, '');
        const filePath = path.join(CONTENT_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // 1. 解析 Frontmatter
        let { data, content } = matter(fileContent);
        let changed = false;
        let contentChanged = false;

        console.log(`\n📄 处理: ${file}`);

        // --- 图片资源处理 ---
        const resourceDir = path.join(CONTENT_DIR, slug);
        const hasResourceDir = fs.existsSync(resourceDir) && fs.statSync(resourceDir).isDirectory();

        if (hasResourceDir) {
            console.log(`  📂 发现资源目录: ${slug}/`);
            const images = fs.readdirSync(resourceDir).filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f));
            
            if (images.length > 0) {
                images.forEach(img => {
                    const relativePath = `${slug}/${img}`; // content/blogs 下的相对路径
                    const absolutePath = `/blogs/${slug}/${img}`; // 旧的 public 路径

                    // 修正 1: 将 /blogs/slug/img 替换为 slug/img
                    if (content.includes(absolutePath)) {
                        content = content.split(absolutePath).join(relativePath);
                        console.log(`    > 修正路径: ${absolutePath} -> ${relativePath}`);
                        contentChanged = true;
                    }

                    // 修正 2: 规范化引用
                    const patterns = [
                        new RegExp(`\\!\\[(.*?)\\]\\(\\./${img}\\)`, 'g'),
                        new RegExp(`\\!\\[(.*?)\\]\\(${img}\\)`, 'g')
                    ];
                    
                    patterns.forEach(regex => {
                        if (regex.test(content)) {
                            content = content.replace(regex, `![$1](${relativePath})`);
                            console.log(`    > 规范化引用: ${img} -> ${relativePath}`);
                            contentChanged = true;
                        }
                    });

                    // 修正 Cover 字段 (精确匹配)
                    if (data.cover === absolutePath) {
                        data.cover = relativePath;
                        changed = true;
                        console.log(`    > 修正封面路径: ${absolutePath} -> ${relativePath}`);
                    }
                });
            }
        }

        // 处理特殊映射: /assets/img/... -> slug/xxx.png
        // 匹配所有 /assets/ 开头的图片引用
        const assetImgRegex = /!\[(.*?)\]\((\/assets\/.*?)\)/g;
        let assetMatch;
        const assetReplacements = [];

        while ((assetMatch = assetImgRegex.exec(content)) !== null) {
            const originalUrl = assetMatch[2];
            const originalName = path.basename(originalUrl); // e.g. blogs4-0.png
            
            // 查找逻辑
            let foundName = null;

            if (hasResourceDir) {
                // 1. 精确匹配文件名
                if (fs.existsSync(path.join(resourceDir, originalName))) {
                    foundName = originalName;
                }
                
                // 2. 模糊匹配 (blogsX -> blogX)
            if (!foundName) {
                const correctedName = originalName.replace('blogs', 'blog');
                if (fs.existsSync(path.join(resourceDir, correctedName))) {
                    foundName = correctedName;
                    console.log(`    > 模糊匹配成功: ${originalName} -> ${correctedName}`);
                }
            }

            // 3. 扩展名模糊匹配 (jpg <-> jpeg)
            if (!foundName) {
                const nameNoExt = path.parse(originalName).name;
                const ext = path.parse(originalName).ext.toLowerCase();
                const altExt = ext === '.jpg' ? '.jpeg' : (ext === '.jpeg' ? '.jpg' : null);
                
                if (altExt) {
                    const altName = nameNoExt + altExt;
                    if (fs.existsSync(path.join(resourceDir, altName))) {
                        foundName = altName;
                        console.log(`    > 扩展名匹配成功: ${originalName} -> ${altName}`);
                    }
                }
            }
            }

            if (foundName) {
                const newRef = `${slug}/${foundName}`;
                assetReplacements.push({
                    original: originalUrl,
                    new: newRef
                });
            }
        }

        assetReplacements.forEach(rep => {
            if (content.includes(rep.original)) {
                content = content.split(rep.original).join(rep.new);
                console.log(`    > 更新 Assets 引用: ${rep.original} -> ${rep.new}`);
                contentChanged = true;
            }
        });

        // --- Frontmatter 规范化 ---
        
        if (!data.author) { data.author = 'KKJM'; changed = true; }
        else if (typeof data.author === 'string') {
             const cleanAuthor = data.author.replace(/\s+/g, ' ').trim();
             const parts = cleanAuthor.split(' ');
             if (parts.length > 1 && parts[0] === parts[1]) data.author = parts[0];
             else data.author = cleanAuthor;
             if (data.author !== cleanAuthor) changed = true;
        }

        const originalDate = data.date;
        data.date = formatDate(data.date);
        if (data.date !== originalDate) changed = true;

        if (!data.tags || (Array.isArray(data.tags) && data.tags.length === 0)) {
            data.tags = ['AI', '产品经理'];
            changed = true;
        }

        if (!data.summary) {
            const plainText = content.replace(/[#*`\[\]]/g, '').replace(/\n+/g, ' ').trim();
            data.summary = plainText.substring(0, 150) + '...';
            changed = true;
        }

        // --- Cover Check (Enhanced) ---
        if (data.cover) {
            data.cover = data.cover.replace(/['"]/g, '');
            
            let cleanCover = data.cover;
            // 移除常见前缀
            if (cleanCover.startsWith('/blogs/')) cleanCover = cleanCover.replace(/^\/blogs\//, '');
            if (cleanCover.startsWith('/assets/')) cleanCover = path.basename(cleanCover); // 只取文件名

            let found = false;
            let newPath = cleanCover;

            // A. 直接相对 content/blogs 存在
            if (fs.existsSync(path.join(CONTENT_DIR, cleanCover))) {
                found = true;
                newPath = cleanCover;

                // 优化：如果存在资源子目录，且图片还在根目录下，将其移动到子目录
                if (hasResourceDir && !cleanCover.includes('/')) {
                    const srcPath = path.join(CONTENT_DIR, cleanCover);
                    const destPath = path.join(resourceDir, cleanCover);
                    
                    try {
                        fs.renameSync(srcPath, destPath);
                        newPath = `${slug}/${cleanCover}`;
                        console.log(`    > 📦 移动封面到子目录: ${cleanCover} -> ${newPath}`);
                    } catch (e) {
                        console.error(`    ! 移动失败: ${e.message}`);
                    }
                }
            }

            // B. 尝试在 slug 子目录下查找 (如果 cleanCover 只是文件名)
            if (!found && hasResourceDir) {
                const name = path.basename(cleanCover);
                if (fs.existsSync(path.join(resourceDir, name))) {
                    found = true;
                    newPath = `${slug}/${name}`;
                }
            }

            // C. 尝试在根目录下查找 (如果 cleanCover 包含子目录但文件在根目录)
            if (!found) {
                const name = path.basename(cleanCover);
                if (fs.existsSync(path.join(CONTENT_DIR, name))) {
                    found = true;
                    newPath = name;
                }
            }

            // D. 模糊匹配 (针对 blog4-0.png vs blogs4-0.png)
            if (!found && hasResourceDir) {
                const name = path.basename(cleanCover); // blogs4-0.png
                // 尝试去掉 's' 或其他微小差异
                const correctedName = name.replace('blogs', 'blog');
                if (fs.existsSync(path.join(resourceDir, correctedName))) {
                    found = true;
                    newPath = `${slug}/${correctedName}`;
                }
            }
            
            // E. 自动发现封面 (如果还是没找到)
            if (!found && hasResourceDir) {
                 const candidates = [
                     `${slug}-cover.png`, `${slug}-cover.jpg`, 
                     `${slug}.png`, `cover.png`, `cover.jpg`,
                     `${slug}-0.png`, `${slug}-0.jpg`, // 新增：尝试 -0 后缀
                     `blog${slug.replace('blog', '')}-0.png` // blog4 -> blog4-0.png
                 ];
                 for (const c of candidates) {
                     if (fs.existsSync(path.join(resourceDir, c))) {
                         found = true;
                         newPath = `${slug}/${c}`;
                         console.log(`    > 自动发现封面: ${newPath}`);
                         break;
                     }
                 }
            }

            if (found) {
                if (data.cover !== newPath) {
                    data.cover = newPath;
                    changed = true;
                    console.log(`    > 修正封面路径: ${cleanCover} (raw: ${data.cover}) -> ${newPath}`);
                }
            } else {
                 console.warn(`    ! 警告: 封面图不存在 "${data.cover}"，替换为默认`);
                 data.cover = DEFAULT_COVER;
                 changed = true;
            }
        } else {
            data.cover = DEFAULT_COVER;
            changed = true;
        }

        // --- 保存更改 ---
        if (changed || contentChanged) {
            const newContent = matter.stringify(content, data);
            fs.writeFileSync(filePath, newContent);
            console.log(`  ✅ 文件已更新`);
        } else {
            console.log(`  ✨ 无需更改`);
        }
    });
    
    console.log(`\n🎉 整理完成！`);
}

organizeBlogs();