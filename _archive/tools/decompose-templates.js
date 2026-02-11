#!/usr/bin/env node
/**
 * 기존 페이지 단위 템플릿을 섹션 위젯으로 분해하는 마이그레이션 스크립트.
 *
 * Usage: node tools/decompose-templates.js
 */

const fs = require('fs');
const path = require('path');

const WIDGETS_DIR = path.join(__dirname, '..', 'widgets');
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// 분해 대상 템플릿
const TEMPLATES = [
  {
    file: 'ref-reference3.template.json',
    sourceRef: 'ref-reference3',
    styleTags: ['내추럴', '우드톤', '따뜻한', '프리미엄', '베이지 팔레트'],
  },
  {
    file: 'ref-maru.template.json',
    sourceRef: 'ref-maru',
    styleTags: ['미니멀', '클린', '화이트 기반', '기업형'],
  },
  {
    file: 'ref-logitech-k120.template.json',
    sourceRef: 'ref-logitech-k120',
    styleTags: ['미니멀', '클린', '화이트 기조', '이미지 중심', '텍스트 최소화'],
  },
  {
    file: 'default-24section.template.json',
    sourceRef: 'default',
    styleTags: ['다크 기조', '프리미엄', 'Q&A 형식', '기능 6개 상세'],
  },
];

function getTheme(bgColor) {
  if (!bgColor || typeof bgColor !== 'string') return 'dark';
  const hex = bgColor.replace('#', '');
  if (hex.length < 6) return 'dark';
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? 'light' : 'dark';
}

function generateWidgetId(taxonomyId, sourceRef, section) {
  const inferred = taxonomyId || inferTaxonomyId(section);
  const base = (inferred || 'custom').toLowerCase();

  if (base === 'featuredetail') {
    // split 구분
    const comp = section.composition || 'stack';
    if (comp === 'split') {
      // left에 IMAGE_AREA가 있으면 lr, 아니면 rl
      const leftElements = section.left?.required_elements || [];
      const hasImageLeft = leftElements.some(el => el.type === 'IMAGE_AREA' || el.type === 'FRAME');
      const variant = hasImageLeft ? 'split-lr' : 'split-rl';
      return `${base}--${sourceRef}--${variant}`;
    }
    // dark/light theme 구분
    const theme = getTheme(section.layout?.background);
    return `${base}--${sourceRef}--${comp}-${theme}`;
  }

  if (!taxonomyId) {
    // custom section - use section name
    const customName = (section.name || 'unknown').replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase().substring(0, 30);
    return `${customName}--${sourceRef}`;
  }

  return `${base}--${sourceRef}`;
}

function getFolder(taxonomyId) {
  if (!taxonomyId) return '_custom';
  return taxonomyId.toLowerCase();
}

// Section ID에서 taxonomy_id 추론 (default-24section은 taxonomy_id 필드가 없음)
const TAXONOMY_IDS = [
  'Hook', 'WhatIsThis', 'BrandName', 'SetContents', 'WhyCore', 'PainPoint', 'Solution',
  'FeaturesOverview', 'FeatureDetail', 'Tips', 'Differentiator', 'StatsHighlight',
  'Comparison', 'Safety', 'Target', 'Reviews', 'ProductSpec', 'FAQ', 'Warranty',
  'CTABanner', 'EventPromo', 'CTA',
];

function inferTaxonomyId(section) {
  if (section.taxonomy_id) return section.taxonomy_id; // null이나 빈문자열이 아닌 경우만

  const id = (section.id || '').toLowerCase();
  const name = (section.name || '').toLowerCase();

  // Feature1_Detail ~ Feature6_Detail → FeatureDetail
  if (/feature\d+[_\s]*detail/i.test(section.id || '')) return 'FeatureDetail';

  for (const tid of TAXONOMY_IDS) {
    if (id.includes(tid.toLowerCase()) || name.includes(tid.toLowerCase())) {
      return tid;
    }
  }
  // 추가 패턴 매칭
  if (id.includes('safety') || name.includes('안전')) return 'Safety';
  if (id.includes('trust') || name.includes('신뢰')) return 'Safety';

  return null; // custom
}

function createPreset(template, sourceRef, styleTags) {
  return {
    type: 'STYLE_PRESET',
    id: `preset--${sourceRef}`,
    name: template.name || sourceRef,
    source_ref: sourceRef,
    style_tags: styleTags,
    global_layout: template.global_layout,
    color_system: template.color_system,
    typography: template.typography,
  };
}

function createWidget(section, sourceRef, styleTags, template) {
  const taxonomyId = inferTaxonomyId(section);
  const widgetId = generateWidgetId(taxonomyId, sourceRef, section);
  const theme = getTheme(section.layout?.background);

  const widget = {
    type: 'SECTION_WIDGET',
    version: '1.0',
    widget_id: widgetId,
    taxonomy_id: taxonomyId,
    category: getCategoryForTaxonomy(taxonomyId),
    provenance: {
      source_ref: sourceRef,
      extracted_date: new Date().toISOString().split('T')[0],
    },
    style_tags: styleTags.slice(0, 3), // 상위 3개만
    theme: theme,
    composition: section.composition || 'stack',
    layout: section.layout,
  };

  // composition별 추가 속성
  if (section.layers) widget.layers = section.layers;
  if (section.required_elements) widget.required_elements = section.required_elements;
  if (section.direction) widget.direction = section.direction;
  if (section.ratio) widget.ratio = section.ratio;
  if (section.left) widget.left = section.left;
  if (section.right) widget.right = section.right;
  if (section.copywriting_guide) widget.copywriting_guide = section.copywriting_guide;
  if (section.purpose) widget.copywriting_guide = widget.copywriting_guide || section.purpose;

  return widget;
}

function getCategoryForTaxonomy(id) {
  const map = {
    Hook: 'intro', WhatIsThis: 'intro', BrandName: 'intro', SetContents: 'intro',
    WhyCore: 'problem', PainPoint: 'problem', Solution: 'problem',
    FeaturesOverview: 'features', FeatureDetail: 'features', Tips: 'features',
    Differentiator: 'features', StatsHighlight: 'features',
    Comparison: 'trust', Safety: 'trust', Target: 'trust', Reviews: 'trust',
    ProductSpec: 'trust', FAQ: 'trust', Warranty: 'trust',
    CTABanner: 'conversion', EventPromo: 'conversion', CTA: 'conversion',
  };
  return map[id] || 'custom';
}

// 메인 실행
const registry = {
  type: 'WIDGET_REGISTRY',
  version: '1.0',
  total_widgets: 0,
  presets: [],
  widgets: {},
};

// 중복 widget_id 처리를 위한 추적
const seenWidgetIds = new Set();

for (const tmplConfig of TEMPLATES) {
  const filePath = path.join(TEMPLATES_DIR, tmplConfig.file);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${tmplConfig.file} not found`);
    continue;
  }

  const template = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`\n=== ${tmplConfig.sourceRef} (${template.sections.length} sections) ===`);

  // 1. 프리셋 생성
  const preset = createPreset(template, tmplConfig.sourceRef, tmplConfig.styleTags);
  const presetPath = path.join(WIDGETS_DIR, '_presets', `${preset.id}.json`);
  fs.writeFileSync(presetPath, JSON.stringify(preset, null, 2) + '\n');
  registry.presets.push(preset.id);
  console.log(`  Preset: ${preset.id}`);

  // 2. 섹션별 위젯 생성
  for (const section of template.sections) {
    const widget = createWidget(section, tmplConfig.sourceRef, tmplConfig.styleTags, template);

    // 중복 widget_id 처리 (같은 taxonomy_id의 같은 source에서 여러 개)
    let finalId = widget.widget_id;
    if (seenWidgetIds.has(finalId)) {
      // feature_index가 있으면 사용
      if (section.feature_index) {
        finalId = `${finalId}-f${section.feature_index}`;
      } else {
        let suffix = 2;
        while (seenWidgetIds.has(`${finalId}-${suffix}`)) suffix++;
        finalId = `${finalId}-${suffix}`;
      }
      widget.widget_id = finalId;
    }
    seenWidgetIds.add(finalId);

    const inferredTaxId = inferTaxonomyId(section);
    const folder = getFolder(inferredTaxId);
    const folderPath = path.join(WIDGETS_DIR, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const widgetPath = path.join(folderPath, `${finalId}.widget.json`);
    fs.writeFileSync(widgetPath, JSON.stringify(widget, null, 2) + '\n');

    // 레지스트리에 추가
    const key = inferredTaxId || '_custom';
    if (!registry.widgets[key]) registry.widgets[key] = [];

    const entry = {
      widget_id: finalId,
      file: `${folder}/${finalId}.widget.json`,
      source_ref: tmplConfig.sourceRef,
      style_tags: widget.style_tags,
      composition: widget.composition,
      theme: widget.theme,
    };

    // FeatureDetail 변형 정보
    if (section.taxonomy_id === 'FeatureDetail') {
      if (section.composition === 'split') {
        const leftElements = section.left?.required_elements || [];
        const hasImageLeft = leftElements.some(el => el.type === 'IMAGE_AREA' || el.type === 'FRAME');
        entry.variant = hasImageLeft ? 'image-left' : 'image-right';
      }
    }

    registry.widgets[key].push(entry);
    registry.total_widgets++;

    console.log(`  Widget: ${finalId} (${folder}/)`);
  }
}

// 레지스트리 저장
const registryPath = path.join(WIDGETS_DIR, '_registry.json');
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');

console.log(`\n=== DONE ===`);
console.log(`Total widgets: ${registry.total_widgets}`);
console.log(`Presets: ${registry.presets.length}`);
console.log(`Taxonomy groups: ${Object.keys(registry.widgets).length}`);
