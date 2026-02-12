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

// ── Read POST/PATCH body ──
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

// ── Duplicate detection: Jaccard similarity ──
function computeSimilarity(a, b) {
  // style_tags Jaccard × 0.5
  const tagsA = new Set(a.style_tags || []);
  const tagsB = new Set(b.style_tags || []);
  const intersection = [...tagsA].filter(t => tagsB.has(t)).length;
  const union = new Set([...tagsA, ...tagsB]).size;
  const jaccard = union === 0 ? 0 : intersection / union;

  // composition match × 0.3
  const compMatch = (a.composition || 'stack') === (b.composition || 'stack') ? 1.0 : 0.0;

  // theme match × 0.2
  const themeMatch = (a.theme || 'dark') === (b.theme || 'dark') ? 1.0 : 0.0;

  return jaccard * 0.5 + compMatch * 0.3 + themeMatch * 0.2;
}

// ── Helper: find widget in registry ──
function findWidget(registry, widgetId) {
  for (const [taxonomyId, widgets] of Object.entries(registry.widgets)) {
    const w = widgets.find(w => w.widget_id === widgetId);
    if (w) return { widget: w, taxonomyId };
  }
  return null;
}

// ── Helper: save registry ──
function saveRegistry(registry) {
  const registryPath = path.join(ROOT, 'widgets/_registry.json');
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf-8');
}

// ── Helper: recount total widgets ──
function recountWidgets(registry) {
  let total = 0;
  for (const widgets of Object.values(registry.widgets)) {
    total += widgets.length;
  }
  registry.total_widgets = total;
  return total;
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

    // Read base HTML — wireframe widgets use wireframe-base.html
    const isWireframe = meta && meta.composition === 'wireframe';
    const baseTemplate = isWireframe ? 'templates/wireframe-base.html' : 'templates/html-base.html';
    const baseHtml = fs.readFileSync(path.join(ROOT, baseTemplate), 'utf-8');

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
    let html = baseHtml
      .replace('{{SECTIONS}}', widgetHtml)
      .replace('{{PRODUCT_NAME}}', isWireframe ? '와이어프레임 미리보기' : '위젯 미리보기');

    // Wireframe template has no color variables; only apply to standard template
    if (!isWireframe) {
      html = html
        .replace('{{BRAND_MAIN}}', brandMain)
        .replace('{{ACCENT}}', accent);
    }

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
        if (widgets.length === 0) delete registry.widgets[taxonomyId];
        found = true;
        break;
      }
    }

    if (!found) return send404(res, `Widget not found: ${widgetId}`);

    // Delete widget file
    const filePath = path.join(ROOT, 'widgets', widgetFile);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const total = recountWidgets(registry);
    saveRegistry(registry);

    sendJSON(res, { success: true, deleted: widgetId, total_widgets: total });
  } catch (e) { send500(res, e); }
}

// GET /api/widgets/new
function handleNewWidgets(res) {
  try {
    const registry = readJSON('widgets/_registry.json');
    const newWidgets = [];

    for (const [taxonomyId, widgets] of Object.entries(registry.widgets)) {
      for (const w of widgets) {
        if (w.status === 'new') {
          const entry = { ...w, taxonomy_id: taxonomyId };
          // Attach duplicate widget info if present
          if (w.duplicate_of) {
            const dup = findWidget(registry, w.duplicate_of);
            if (dup) entry.duplicate_widget = { ...dup.widget, taxonomy_id: dup.taxonomyId };
          }
          newWidgets.push(entry);
        }
      }
    }

    sendJSON(res, { widgets: newWidgets, total_new: newWidgets.length });
  } catch (e) { send500(res, e); }
}

// PATCH /api/widget/:id — update widget status
async function handleWidgetPatch(req, res, widgetId) {
  try {
    const body = await readBody(req);
    const registryPath = path.join(ROOT, 'widgets/_registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));

    const found = findWidget(registry, widgetId);
    if (!found) return send404(res, `Widget not found: ${widgetId}`);

    const w = found.widget;
    if (body.status) {
      w.status = body.status;
      // When marking as reviewed, remove duplicate tracking fields
      if (body.status === 'reviewed') {
        delete w.duplicate_of;
        delete w.similarity_score;
      }
    }

    saveRegistry(registry);
    sendJSON(res, { success: true, widget_id: widgetId, status: w.status });
  } catch (e) { send500(res, e); }
}

// ── Unmapped sections helpers ──
const UNMAPPED_DIR = path.join(ROOT, 'skills/unmapped-sections');

function readUnmappedReports() {
  if (!fs.existsSync(UNMAPPED_DIR)) return [];
  return fs.readdirSync(UNMAPPED_DIR)
    .filter(f => f.startsWith('unmapped-') && f.endsWith('.json'))
    .map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(UNMAPPED_DIR, f), 'utf-8'));
      return { ...data, _filename: f };
    });
}

function saveUnmappedReport(filename, data) {
  const clone = { ...data };
  delete clone._filename;
  fs.writeFileSync(path.join(UNMAPPED_DIR, filename), JSON.stringify(clone, null, 2) + '\n', 'utf-8');
}

function saveTaxonomy(tax) {
  fs.writeFileSync(path.join(ROOT, 'skills/section-taxonomy.json'), JSON.stringify(tax, null, 2) + '\n', 'utf-8');
}

// GET /api/unmapped — pending unmapped sections
function handleUnmapped(res) {
  try {
    const reports = readUnmappedReports();
    const sections = [];
    for (const report of reports) {
      if (report.status === 'resolved') continue;
      if (!report.unmapped_sections || report.unmapped_sections.length === 0) continue;
      for (const s of report.unmapped_sections) {
        sections.push({
          report_file: report._filename,
          reference: report.reference,
          report_date: report.report_date,
          ...s,
        });
      }
    }
    sendJSON(res, { sections, total: sections.length });
  } catch (e) { send500(res, e); }
}

// POST /api/unmapped/approve — approve as new taxonomy section
async function handleUnmappedApprove(req, res) {
  try {
    const body = await readBody(req);
    const { report_file, suggested_id } = body;
    if (!report_file || !suggested_id) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: '"report_file" and "suggested_id" required' }));
    }

    const reportPath = path.join(UNMAPPED_DIR, report_file);
    if (!fs.existsSync(reportPath)) return send404(res, `Report not found: ${report_file}`);

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    const idx = (report.unmapped_sections || []).findIndex(s => s.suggested_id === suggested_id);
    if (idx === -1) return send404(res, `Section "${suggested_id}" not found in report`);

    const section = report.unmapped_sections[idx];

    // Add to taxonomy
    const tax = readJSON('skills/section-taxonomy.json');
    if (tax.sections.some(s => s.id === suggested_id)) {
      res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: `Section "${suggested_id}" already exists in taxonomy` }));
    }

    tax.sections.push({
      id: section.suggested_id,
      name: section.suggested_name || section.suggested_id,
      category: section.suggested_category || 'features',
      purpose: section.description || '',
      is_required: false,
      frequency: 0.3,
      keywords: section.suggested_keywords || [],
      visual_cues: section.suggested_visual_cues || [],
      typical_compositions: ['stack', 'split'],
      composition_examples: [],
      copywriting_guide: '',
      required_elements: [],
    });

    // Bump version
    const parts = (tax.version || '1.0').split('.');
    parts[1] = String(parseInt(parts[1] || '0', 10) + 1);
    tax.version = parts.join('.');
    tax.updated = new Date().toISOString().slice(0, 10);

    saveTaxonomy(tax);

    // Move to resolved
    if (!report.resolved_sections) report.resolved_sections = [];
    report.resolved_sections.push({
      ...section,
      resolved: `taxonomy v${tax.version}에 새 섹션으로 승인`,
    });
    report.unmapped_sections.splice(idx, 1);
    report.unmapped_count = report.unmapped_sections.length;
    report.resolved_count = report.resolved_sections.length;

    if (report.unmapped_sections.length === 0) {
      report.status = 'resolved';
      report.resolved_date = new Date().toISOString().slice(0, 10);
    }

    saveUnmappedReport(report_file, report);

    sendJSON(res, { success: true, approved: suggested_id, taxonomy_version: tax.version });
  } catch (e) { send500(res, e); }
}

// POST /api/unmapped/reject — reassign to existing taxonomy section
async function handleUnmappedReject(req, res) {
  try {
    const body = await readBody(req);
    const { report_file, suggested_id, assign_to } = body;
    if (!report_file || !suggested_id || !assign_to) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: '"report_file", "suggested_id", and "assign_to" required' }));
    }

    const reportPath = path.join(UNMAPPED_DIR, report_file);
    if (!fs.existsSync(reportPath)) return send404(res, `Report not found: ${report_file}`);

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    const idx = (report.unmapped_sections || []).findIndex(s => s.suggested_id === suggested_id);
    if (idx === -1) return send404(res, `Section "${suggested_id}" not found in report`);

    const section = report.unmapped_sections[idx];

    // Move to resolved
    if (!report.resolved_sections) report.resolved_sections = [];
    report.resolved_sections.push({
      ...section,
      resolved: `기존 섹션 '${assign_to}'에 배정`,
    });
    report.unmapped_sections.splice(idx, 1);
    report.unmapped_count = report.unmapped_sections.length;
    report.resolved_count = report.resolved_sections.length;

    if (report.unmapped_sections.length === 0) {
      report.status = 'resolved';
      report.resolved_date = new Date().toISOString().slice(0, 10);
    }

    saveUnmappedReport(report_file, report);

    sendJSON(res, { success: true, rejected: suggested_id, assigned_to: assign_to });
  } catch (e) { send500(res, e); }
}

// POST /api/widgets/bulk-review — review all non-duplicate new widgets
async function handleBulkReview(req, res) {
  try {
    await readBody(req); // consume body
    const registryPath = path.join(ROOT, 'widgets/_registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    let count = 0;

    for (const widgets of Object.values(registry.widgets)) {
      for (const w of widgets) {
        if (w.status === 'new' && !w.duplicate_of) {
          w.status = 'reviewed';
          delete w.similarity_score;
          count++;
        }
      }
    }

    saveRegistry(registry);
    sendJSON(res, { success: true, reviewed_count: count });
  } catch (e) { send500(res, e); }
}

// POST /api/widgets/resolve-duplicate — keep one, delete the other
async function handleResolveDuplicate(req, res) {
  try {
    const body = await readBody(req);
    const { keep, delete: deleteId } = body;
    if (!keep || !deleteId) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'Both "keep" and "delete" fields required' }));
    }

    const registryPath = path.join(ROOT, 'widgets/_registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));

    // Mark kept widget as reviewed
    const keepFound = findWidget(registry, keep);
    if (keepFound) {
      keepFound.widget.status = 'reviewed';
      delete keepFound.widget.duplicate_of;
      delete keepFound.widget.similarity_score;
    }

    // Delete the other widget
    let deletedFile = null;
    for (const [taxonomyId, widgets] of Object.entries(registry.widgets)) {
      const idx = widgets.findIndex(w => w.widget_id === deleteId);
      if (idx !== -1) {
        deletedFile = widgets[idx].file;
        widgets.splice(idx, 1);
        if (widgets.length === 0) delete registry.widgets[taxonomyId];
        break;
      }
    }

    // Delete widget file from disk
    if (deletedFile) {
      const filePath = path.join(ROOT, 'widgets', deletedFile);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    recountWidgets(registry);
    saveRegistry(registry);

    sendJSON(res, { success: true, kept: keep, deleted: deleteId });
  } catch (e) { send500(res, e); }
}

// POST /api/widgets/keep-both — mark both as reviewed
async function handleKeepBoth(req, res) {
  try {
    const body = await readBody(req);
    const { widget_a, widget_b } = body;
    if (!widget_a || !widget_b) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'Both "widget_a" and "widget_b" required' }));
    }

    const registryPath = path.join(ROOT, 'widgets/_registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));

    for (const id of [widget_a, widget_b]) {
      const found = findWidget(registry, id);
      if (found) {
        found.widget.status = 'reviewed';
        delete found.widget.duplicate_of;
        delete found.widget.similarity_score;
      }
    }

    saveRegistry(registry);
    sendJSON(res, { success: true, kept: [widget_a, widget_b] });
  } catch (e) { send500(res, e); }
}

// POST /api/widgets/delete-both — delete both widgets
async function handleDeleteBoth(req, res) {
  try {
    const body = await readBody(req);
    const { widget_a, widget_b } = body;
    if (!widget_a || !widget_b) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'Both "widget_a" and "widget_b" required' }));
    }

    const registryPath = path.join(ROOT, 'widgets/_registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));

    for (const id of [widget_a, widget_b]) {
      for (const [taxonomyId, widgets] of Object.entries(registry.widgets)) {
        const idx = widgets.findIndex(w => w.widget_id === id);
        if (idx !== -1) {
          const filePath = path.join(ROOT, 'widgets', widgets[idx].file);
          widgets.splice(idx, 1);
          if (widgets.length === 0) delete registry.widgets[taxonomyId];
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          break;
        }
      }
    }

    recountWidgets(registry);
    saveRegistry(registry);
    sendJSON(res, { success: true, deleted: [widget_a, widget_b] });
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

  // GET routes
  if (pathname === '/api/registry') return handleRegistry(res);
  if (pathname === '/api/presets') return handlePresets(res);
  if (pathname === '/api/taxonomy') return handleTaxonomy(res);
  if (pathname === '/api/widgets/new') return handleNewWidgets(res);
  if (pathname === '/api/unmapped') return handleUnmapped(res);

  const previewMatch = pathname.match(/^\/api\/widget-preview\/(.+)$/);
  if (previewMatch) return handleWidgetPreview(res, decodeURIComponent(previewMatch[1]), query);

  // PATCH /api/widget/:id
  if (req.method === 'PATCH') {
    const patchMatch = pathname.match(/^\/api\/widget\/(.+)$/);
    if (patchMatch) return handleWidgetPatch(req, res, decodeURIComponent(patchMatch[1]));
  }

  // POST routes
  if (req.method === 'POST') {
    if (pathname === '/api/widgets/bulk-review') return handleBulkReview(req, res);
    if (pathname === '/api/widgets/resolve-duplicate') return handleResolveDuplicate(req, res);
    if (pathname === '/api/widgets/keep-both') return handleKeepBoth(req, res);
    if (pathname === '/api/widgets/delete-both') return handleDeleteBoth(req, res);
    if (pathname === '/api/unmapped/approve') return handleUnmappedApprove(req, res);
    if (pathname === '/api/unmapped/reject') return handleUnmappedReject(req, res);
  }

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
