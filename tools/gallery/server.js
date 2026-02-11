const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3333;
const ROOT = path.resolve(__dirname, '..', '..');
const GALLERY_DIR = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function readJSON(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf-8'));
}

function sendJSON(res, data) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function send404(res, msg) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(msg || 'Not Found');
}

function send500(res, err) {
  res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(err.message || 'Internal Server Error');
}

// ── WIDGET_META parser ──
function parseWidgetMeta(html) {
  const match = html.match(/<!--WIDGET_META\s*([\s\S]*?)-->/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (_) {
    return null;
  }
}

// ── Demo mode: apply sample_data substitutions ──
function applyDemoMode(html, meta) {
  if (!meta || !meta.sample_data) return html;
  const sd = meta.sample_data;

  // Text replacements: placeholder → sample text
  if (sd.texts) {
    for (const [placeholder, sample] of Object.entries(sd.texts)) {
      html = html.split(placeholder).join(sample);
    }
  }

  // Image replacements: match by img-label → replace img-placeholder div with <img>
  if (sd.images) {
    for (const img of sd.images) {
      const escapedLabel = img.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(
        `<div[^>]*\\bimg-placeholder\\b[^>]*>[\\s\\S]*?<span class="img-label">${escapedLabel}</span>[\\s\\S]*?</div>`,
        'g'
      );
      html = html.replace(regex,
        `<img src="${img.src}" alt="${img.alt}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
      );
    }
  }

  return html;
}

// GET /api/registry
function handleRegistry(res) {
  try {
    sendJSON(res, readJSON('widgets/_registry.json'));
  } catch (e) { send500(res, e); }
}

// GET /api/presets
function handlePresets(res) {
  try {
    const dir = path.join(ROOT, 'widgets/_presets');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    const presets = files.map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')));
    sendJSON(res, presets);
  } catch (e) { send500(res, e); }
}

// GET /api/taxonomy
function handleTaxonomy(res) {
  try {
    sendJSON(res, readJSON('skills/section-taxonomy.json'));
  } catch (e) { send500(res, e); }
}

// GET /api/widget-preview/:id?brand_main=HEX&accent=HEX&mode=demo|raw
function handleWidgetPreview(res, widgetId, query) {
  try {
    const registry = readJSON('widgets/_registry.json');

    // Find widget in registry
    let widget = null;
    for (const widgets of Object.values(registry.widgets)) {
      widget = widgets.find(w => w.widget_id === widgetId);
      if (widget) break;
    }
    if (!widget) return send404(res, `Widget not found: ${widgetId}`);

    // Read widget HTML
    const widgetPath = path.join(ROOT, 'widgets', widget.file);
    if (!fs.existsSync(widgetPath)) return send404(res, `Widget file not found: ${widget.file}`);
    let widgetHtml = fs.readFileSync(widgetPath, 'utf-8');

    // Parse WIDGET_META for demo mode
    const meta = parseWidgetMeta(widgetHtml);

    // Apply demo mode if requested (default: demo)
    const mode = query.mode || 'demo';
    if (mode === 'demo') {
      widgetHtml = applyDemoMode(widgetHtml, meta);
    }

    // Read html-base.html
    const baseHtml = fs.readFileSync(path.join(ROOT, 'templates/html-base.html'), 'utf-8');

    // Determine colors: query params > preset > defaults
    let brandMain = '#FF6B00';
    let accent = '#FFD700';

    // Try to find preset for this widget's source_ref
    if (widget.source_ref) {
      try {
        const presetPath = path.join(ROOT, 'widgets/_presets', `preset--${widget.source_ref}.json`);
        const preset = JSON.parse(fs.readFileSync(presetPath, 'utf-8'));
        if (preset.color_system) {
          brandMain = preset.color_system.brand_main || brandMain;
          accent = preset.color_system.accent || accent;
        }
      } catch (_) { /* preset not found, use defaults */ }
    }

    // Override with query params
    if (query.brand_main) brandMain = '#' + query.brand_main.replace(/^#/, '');
    if (query.accent) accent = '#' + query.accent.replace(/^#/, '');

    // Assemble
    const html = baseHtml
      .replace('{{SECTIONS}}', widgetHtml)
      .replace('{{BRAND_MAIN}}', brandMain)
      .replace('{{ACCENT}}', accent)
      .replace('{{PRODUCT_NAME}}', '위젯 미리보기');

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (e) { send500(res, e); }
}

// DELETE /api/widget/:id
function handleWidgetDelete(res, widgetId) {
  try {
    const registryPath = path.join(ROOT, 'widgets/_registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));

    // Find and remove widget from registry
    let found = false;
    let widgetFile = null;
    for (const [taxonomyId, widgets] of Object.entries(registry.widgets)) {
      const idx = widgets.findIndex(w => w.widget_id === widgetId);
      if (idx !== -1) {
        widgetFile = widgets[idx].file;
        widgets.splice(idx, 1);
        // Remove empty taxonomy arrays
        if (widgets.length === 0) {
          delete registry.widgets[taxonomyId];
        }
        found = true;
        break;
      }
    }

    if (!found) return send404(res, `Widget not found: ${widgetId}`);

    // Delete widget file
    const filePath = path.join(ROOT, 'widgets', widgetFile);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update total_widgets count
    let total = 0;
    for (const widgets of Object.values(registry.widgets)) {
      total += widgets.length;
    }
    registry.total_widgets = total;

    // Save updated registry
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');

    sendJSON(res, { success: true, deleted: widgetId, total_widgets: total });
  } catch (e) { send500(res, e); }
}

// Static file serving from gallery directory
function handleStatic(res, urlPath) {
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(GALLERY_DIR, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(GALLERY_DIR)) return send404(res);

  fs.readFile(filePath, (err, data) => {
    if (err) return send404(res);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsed.pathname;
  const query = Object.fromEntries(parsed.searchParams);

  if (pathname === '/api/registry') return handleRegistry(res);
  if (pathname === '/api/presets') return handlePresets(res);
  if (pathname === '/api/taxonomy') return handleTaxonomy(res);

  const previewMatch = pathname.match(/^\/api\/widget-preview\/(.+)$/);
  if (previewMatch) return handleWidgetPreview(res, decodeURIComponent(previewMatch[1]), query);

  // DELETE /api/widget/:id
  if (req.method === 'DELETE') {
    const deleteMatch = pathname.match(/^\/api\/widget\/(.+)$/);
    if (deleteMatch) return handleWidgetDelete(res, decodeURIComponent(deleteMatch[1]));
  }

  handleStatic(res, pathname);
});

server.listen(PORT, () => {
  console.log(`위젯 갤러리 서버 시작: http://localhost:${PORT}`);
});
