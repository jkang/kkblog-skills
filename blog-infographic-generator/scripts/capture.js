const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

/**
 * Capture an infographic HTML and save as JPG.
 * 
 * Usage: node capture.js <source_html_path> [output_jpg_path]
 */

async function processFile(page, absolutePath, outputArg) {
  let outputPath = outputArg;
  if (!outputPath) {
    outputPath = absolutePath.replace(/\.html$/, '.jpg');
  }

  console.log(`Processing: ${absolutePath}`);
  await page.goto(`file://${absolutePath}`, { waitUntil: 'networkidle' });

  await page.waitForFunction(() => {
    const icons = document.querySelectorAll('[data-lucide]');
    return icons.length === 0 || document.querySelectorAll('svg.lucide').length === icons.length;
  }, { timeout: 5000 });

  await page.waitForTimeout(500);

  const container = await page.$('.infographic-container');
  if (container) {
    const box = await container.boundingBox();
    if (box) {
      await page.setViewportSize({ width: 800, height: Math.ceil(box.height) });
    }
  }

  console.log(`  -> Capturing to: ${outputPath}`);
  await page.screenshot({
    path: outputPath,
    type: 'jpeg',
    quality: 90,
    fullPage: false
  });
}

async function run() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Error: Please provide source HTML path or directory.');
    process.exit(1);
  }

  const absoluteInputPath = path.resolve(inputPath);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 800, height: 1000 });

  if (fs.statSync(absoluteInputPath).isDirectory()) {
    console.log(`Scanning directory: ${absoluteInputPath}`);
    const files = fs.readdirSync(absoluteInputPath).filter(f => f.endsWith('.html'));
    for (const file of files) {
      await processFile(page, path.join(absoluteInputPath, file));
    }
  } else {
    await processFile(page, absoluteInputPath, process.argv[3]);
  }

  await browser.close();
  console.log('Done.');
}

run().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
