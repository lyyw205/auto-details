#!/usr/bin/env node

const puppeteer = require('puppeteer');
const sharp = require('sharp');
const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');

// ── Config ──────────────────────────────────────────────
const CANVAS_WIDTH = 860;
const REFERENCES_DIR = path.resolve(__dirname, '../../references');

// ── CLI Args ────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Usage: node scrape-behance.js <behance-url> [--name <ref-name>]

Examples:
  node scrape-behance.js "https://www.behance.net/gallery/123456/project" --name ref-terive
  node scrape-behance.js "https://www.behance.net/gallery/123456/project"
`);
    process.exit(0);
  }

  const url = args[0];
  if (!url.includes('behance.net/gallery/')) {
    console.error('Error: URL must be a Behance gallery URL (e.g. https://www.behance.net/gallery/...)');
    process.exit(1);
  }

  let name = null;
  const nameIdx = args.indexOf('--name');
  if (nameIdx !== -1 && args[nameIdx + 1]) {
    name = args[nameIdx + 1];
  }

  return { url, name };
}

// ── Helpers ─────────────────────────────────────────────

/** Extract a slug name from Behance URL if --name not provided */
function slugFromUrl(url) {
  // URL format: https://www.behance.net/gallery/123456/project-name
  const match = url.match(/\/gallery\/\d+\/([^/?#]+)/);
  if (match) {
    return 'ref-' + match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  }
  return 'ref-behance-' + Date.now();
}

/** Convert Behance CDN URL to highest available resolution */
function toHighRes(url) {
  // Behance CDN pattern: project_modules/{size}/{hash}
  // Sizes: disp < 1400 < fs < max_3840
  // Try fs first (full-size original), fall back to max_3840
  return url.replace(
    /\/project_modules\/(?:disp|1400|1400_opt_1|2800|max_1200|max_1200_webp|source)/,
    '/project_modules/fs'
  );
}

/** Download a URL to a Buffer */
function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/** Log with checkmark */
function log(msg) {
  console.log(`  ✓ ${msg}`);
}

// ── Main ────────────────────────────────────────────────
async function main() {
  const { url, name: nameArg } = parseArgs();
  const refName = nameArg || slugFromUrl(url);

  console.log(`\nBehance Scraper → ${refName}`);
  console.log('─'.repeat(50));

  // 1. Launch browser & navigate
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    // Set a realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    console.log('  Loading page...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    log('페이지 로딩 완료');

    // 2. Scroll to trigger lazy-loaded images
    console.log('  Scrolling to load all images...');
    await autoScroll(page);
    // Wait a bit for images to finish loading after scroll
    await new Promise((r) => setTimeout(r, 2000));
    log('스크롤 완료');

    // 3. Extract image URLs from project modules area
    const imageUrls = await page.evaluate(() => {
      const imgs = [];
      // Behance project content is inside project modules
      // Multiple possible selectors for the main content area
      const selectors = [
        '.project-styles .main-content img',
        '#project-modules img',
        '.ProjectModules-projectModules-MoX img',
        '[class*="ProjectModules"] img',
        '[class*="project-module"] img',
        // Broader fallback: images in the main project area
        'main img',
        '.Project-project-ZJi img',
        '[class*="Project-project"] img',
      ];

      // Try specific selectors first
      for (const sel of selectors) {
        const elements = document.querySelectorAll(sel);
        if (elements.length > 0) {
          elements.forEach((img) => {
            const src = img.src || img.getAttribute('data-src') || '';
            if (src && src.includes('project_modules')) {
              imgs.push(src);
            }
          });
          if (imgs.length > 0) break;
        }
      }

      // If nothing found with selectors, grab all imgs with project_modules in src
      if (imgs.length === 0) {
        document.querySelectorAll('img').forEach((img) => {
          const src = img.src || img.getAttribute('data-src') || '';
          if (src && src.includes('project_modules')) {
            imgs.push(src);
          }
        });
      }

      // Deduplicate while preserving order
      return [...new Set(imgs)];
    });

    if (imageUrls.length === 0) {
      console.error('\n  Error: 이미지를 찾을 수 없습니다. Behance 페이지 구조가 변경되었을 수 있습니다.');
      process.exit(1);
    }
    log(`${imageUrls.length}개 이미지 발견`);

    // 4. Convert to high-res URLs
    const highResUrls = imageUrls.map(toHighRes);
    log('고해상도 URL 변환 완료');

    // 5. Download all images
    console.log('  Downloading images...');
    const buffers = [];
    let downloaded = 0;
    for (const imgUrl of highResUrls) {
      try {
        const buf = await downloadBuffer(imgUrl);
        buffers.push(buf);
        downloaded++;
        // Progress indicator
        process.stdout.write(`\r  Downloading... ${downloaded}/${highResUrls.length}`);
      } catch (err) {
        // If fs fails, try max_3840
        const fallbackUrl = imgUrl.replace('/project_modules/fs/', '/project_modules/max_3840/');
        try {
          const buf = await downloadBuffer(fallbackUrl);
          buffers.push(buf);
          downloaded++;
          process.stdout.write(`\r  Downloading... ${downloaded}/${highResUrls.length}`);
        } catch (err2) {
          // Try original URL as last resort
          try {
            const origBuf = await downloadBuffer(imageUrls[highResUrls.indexOf(imgUrl)]);
            buffers.push(origBuf);
            downloaded++;
            process.stdout.write(`\r  Downloading... ${downloaded}/${highResUrls.length}`);
          } catch (err3) {
            console.warn(`\n  Warning: 다운로드 실패 — ${imgUrl.substring(0, 80)}...`);
          }
        }
      }
    }
    console.log('');
    log(`다운로드 완료 (${buffers.length}/${highResUrls.length})`);

    if (buffers.length === 0) {
      console.error('\n  Error: 다운로드된 이미지가 없습니다.');
      process.exit(1);
    }

    // 6. Resize all images to CANVAS_WIDTH and stitch vertically
    console.log('  Compositing images...');
    const resizedImages = [];
    for (const buf of buffers) {
      try {
        const resized = await sharp(buf)
          .resize({ width: CANVAS_WIDTH, withoutEnlargement: false })
          .png()
          .toBuffer();
        const meta = await sharp(resized).metadata();
        resizedImages.push({ buffer: resized, width: meta.width, height: meta.height });
      } catch (err) {
        console.warn(`  Warning: 이미지 처리 실패, 건너뜀`);
      }
    }

    if (resizedImages.length === 0) {
      console.error('\n  Error: 처리 가능한 이미지가 없습니다.');
      process.exit(1);
    }

    const totalHeight = resizedImages.reduce((sum, img) => sum + img.height, 0);

    // Composite: stack vertically
    const composites = [];
    let yOffset = 0;
    for (const img of resizedImages) {
      composites.push({ input: img.buffer, left: 0, top: yOffset });
      yOffset += img.height;
    }

    const finalImage = await sharp({
      create: {
        width: CANVAS_WIDTH,
        height: totalHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite(composites)
      .png()
      .toBuffer();

    log(`이미지 합성 완료 (${CANVAS_WIDTH} x ${totalHeight}px)`);

    // 7. Save
    if (!fs.existsSync(REFERENCES_DIR)) {
      fs.mkdirSync(REFERENCES_DIR, { recursive: true });
    }
    const outputPath = path.join(REFERENCES_DIR, `${refName}.png`);
    fs.writeFileSync(outputPath, finalImage);
    const sizeMB = (finalImage.length / 1024 / 1024).toFixed(1);
    log(`저장: references/${refName}.png (${sizeMB}MB)`);

    console.log('─'.repeat(50));
  } finally {
    await browser.close();
  }
}

/** Scroll the page slowly to trigger lazy-loading */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          // Scroll back to top and then to bottom once more for good measure
          window.scrollTo(0, 0);
          setTimeout(() => {
            window.scrollTo(0, document.body.scrollHeight);
            setTimeout(resolve, 1000);
          }, 500);
        }
      }, 200);
    });
  });
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
});
