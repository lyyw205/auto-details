/**
 * Figma Plugin - Detail Page Layout Generator
 * AI 에이전트가 생성한 레이아웃 데이터를 Figma에 적용
 *
 * Composition types:
 *   - "stack" (default/legacy): VERTICAL auto-layout, center-aligned
 *   - "composed": 9-grid free placement, layers with zIndex, no auto-layout
 *   - "split": 2-panel horizontal/vertical split with ratio
 */

// ─── 9-Grid Constants ───
const GRID_COORDS = {
  TL: { col: 0, row: 0 }, TC: { col: 1, row: 0 }, TR: { col: 2, row: 0 },
  ML: { col: 0, row: 1 }, MC: { col: 1, row: 1 }, MR: { col: 2, row: 1 },
  BL: { col: 0, row: 2 }, BC: { col: 1, row: 2 }, BR: { col: 2, row: 2 },
};

/**
 * Convert a region string (e.g. "TL", "TL:BR") into pixel coordinates.
 * @param {string} region - Single cell ("TL") or span ("TL:BR")
 * @param {number} sectionWidth - Total section width in px
 * @param {number} sectionHeight - Total section height in px
 * @param {number} [padding=0] - Inner padding in px
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
function regionToRect(region, sectionWidth, sectionHeight, padding = 0) {
  const parts = region.split(':');
  const start = GRID_COORDS[parts[0]];
  const end = GRID_COORDS[parts[1] || parts[0]];

  if (!start || !end) throw new Error('Invalid region code: ' + region);

  const colStart = Math.min(start.col, end.col);
  const colEnd = Math.max(start.col, end.col);
  const rowStart = Math.min(start.row, end.row);
  const rowEnd = Math.max(start.row, end.row);

  const cellW = (sectionWidth - padding * 2) / 3;
  const cellH = (sectionHeight - padding * 2) / 3;

  return {
    x: padding + colStart * cellW,
    y: padding + rowStart * cellH,
    width: (colEnd - colStart + 1) * cellW,
    height: (rowEnd - rowStart + 1) * cellH,
  };
}

// UI 표시
figma.showUI(__html__, { width: 450, height: 650 });

// 메시지 수신
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-layout') {
    try {
      console.log('Received data:', msg.data);

      // JSON 구조 파싱 - data.layout 또는 직접 layout
      let layoutData = msg.data;
      if (layoutData.type === 'CREATE_LAYOUT' && layoutData.data) {
        layoutData = layoutData.data.layout;
      } else if (layoutData.layout) {
        layoutData = layoutData.layout;
      }

      console.log('Parsed layout:', layoutData);

      await createLayoutFromData(layoutData);
      figma.ui.postMessage({ type: 'success', message: '레이아웃이 성공적으로 생성되었습니다!' });
    } catch (error) {
      console.error('Error:', error);
      figma.ui.postMessage({ type: 'error', message: `오류: ${error.message}` });
    }
  } else if (msg.type === 'image-loaded') {
    // UI에서 로드된 이미지 데이터 적용
    try {
      await applyImageToNode(msg.nodeId, msg.imageBytes);
      console.log('Image applied to node:', msg.nodeId);
    } catch (error) {
      console.error('Image apply error:', error);
    }
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

/**
 * 레이아웃 데이터를 기반으로 Figma 노드 생성
 */
async function createLayoutFromData(layoutData) {
  const page = figma.currentPage;

  // 폰트 미리 로드 (JSON에서 fontFamily 읽기, 기본값: Inter)
  const fontFamily = layoutData.fontFamily || 'Inter';
  await loadFonts(fontFamily);

  // 메인 프레임 생성
  const mainFrame = figma.createFrame();
  mainFrame.name = layoutData.name || 'Detail Page';

  const pageWidth = layoutData.width || 860;
  mainFrame.resize(pageWidth, 100); // 초기 높이
  mainFrame.x = figma.viewport.center.x - pageWidth / 2;
  mainFrame.y = figma.viewport.center.y;

  // Auto Layout 설정
  mainFrame.layoutMode = 'VERTICAL';
  mainFrame.primaryAxisSizingMode = 'AUTO';
  mainFrame.counterAxisSizingMode = 'FIXED';
  mainFrame.itemSpacing = 0;

  // 배경색 설정
  mainFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

  // 섹션 생성
  if (layoutData.children && layoutData.children.length > 0) {
    for (const section of layoutData.children) {
      try {
        const sectionFrame = await createSection(section, pageWidth, fontFamily);
        mainFrame.appendChild(sectionFrame);
      } catch (e) {
        console.error('Section error:', section.name, e);
      }
    }
  }

  page.appendChild(mainFrame);
  figma.viewport.scrollAndZoomIntoView([mainFrame]);

  return mainFrame;
}

/**
 * 폰트 미리 로드
 * @param {string} fontFamily - 사용할 폰트 패밀리 (기본값: Inter)
 */
async function loadFonts(fontFamily) {
  const family = fontFamily || 'Inter';
  const styles = ['Regular', 'Medium', 'Semi Bold', 'Bold'];

  for (const style of styles) {
    try {
      await figma.loadFontAsync({ family, style });
    } catch (e) {
      console.log(`Font not available: ${family} ${style}`);
    }
  }

  // fontFamily가 Inter가 아닌 경우, Inter도 폴백으로 로드
  if (family !== 'Inter') {
    for (const style of styles) {
      try {
        await figma.loadFontAsync({ family: 'Inter', style });
      } catch (e) {
        // Inter 폴백 로드 실패는 무시
      }
    }
  }
}

/**
 * 섹션 배경색 적용 (공통)
 */
function applySectionBackground(frame, sectionData) {
  const bgColor = sectionData.background || sectionData.backgroundColor;
  if (bgColor) {
    if (bgColor.startsWith && bgColor.startsWith('gradient:')) {
      const colors = bgColor.replace('gradient:', '').split('-');
      const gradientStops = colors.map(function(c, i) {
        const rgb = hexToRgb(c);
        return {
          position: i / (colors.length - 1),
          color: { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 }
        };
      });
      frame.fills = [{
        type: 'GRADIENT_LINEAR',
        gradientStops: gradientStops,
        gradientTransform: [[0, 1, 0], [-1, 0, 1]]
      }];
    } else {
      frame.fills = [{ type: 'SOLID', color: hexToRgb(bgColor) }];
    }
  }
}

/**
 * 섹션 프레임 생성 — composition 타입별 분기
 */
async function createSection(sectionData, pageWidth, fontFamily) {
  const composition = sectionData.composition || 'stack';

  if (composition === 'composed') {
    return createComposedSection(sectionData, pageWidth, fontFamily);
  } else if (composition === 'split') {
    return createSplitSection(sectionData, pageWidth, fontFamily);
  } else {
    return createStackSection(sectionData, pageWidth, fontFamily);
  }
}

/**
 * Stack composition (기존/기본값 — 하위 호환)
 */
async function createStackSection(sectionData, pageWidth, fontFamily) {
  const frame = figma.createFrame();
  frame.name = sectionData.name || 'Section';
  frame.resize(pageWidth, sectionData.height || 600);

  frame.layoutMode = sectionData.layoutMode || 'VERTICAL';
  frame.primaryAxisSizingMode = 'FIXED';
  frame.counterAxisSizingMode = 'FIXED';
  frame.paddingTop = sectionData.padding?.top ?? 80;
  frame.paddingBottom = sectionData.padding?.bottom ?? 80;
  frame.paddingLeft = sectionData.padding?.left ?? 60;
  frame.paddingRight = sectionData.padding?.right ?? 60;
  frame.itemSpacing = sectionData.itemSpacing ?? 24;
  frame.primaryAxisAlignItems = sectionData.primaryAxisAlign || 'CENTER';
  frame.counterAxisAlignItems = sectionData.counterAxisAlign || 'CENTER';

  applySectionBackground(frame, sectionData);

  if (sectionData.children && sectionData.children.length > 0) {
    for (const child of sectionData.children) {
      try {
        const contentWidth = pageWidth - (sectionData.padding?.left ?? 60) - (sectionData.padding?.right ?? 60);
        const childNode = await createNode(child, contentWidth, fontFamily);
        if (childNode) {
          frame.appendChild(childNode);
        }
      } catch (e) {
        console.error('Child error:', child, e);
      }
    }
  }

  return frame;
}

/**
 * Composed composition — 9-grid 자유 배치 (auto-layout 없음)
 * layers 배열의 각 요소를 region 좌표로 절대 배치, zIndex 순 정렬
 */
async function createComposedSection(sectionData, pageWidth, fontFamily) {
  const frame = figma.createFrame();
  frame.name = sectionData.name || 'Section';
  const sectionW = pageWidth;
  const sectionH = sectionData.height || 600;
  frame.resize(sectionW, sectionH);

  // auto-layout 비활성 — 절대 좌표 배치
  frame.layoutMode = 'NONE';

  applySectionBackground(frame, sectionData);

  const padding = sectionData.padding
    ? Math.min(sectionData.padding.left ?? 0, sectionData.padding.top ?? 0)
    : 0;

  // layers를 zIndex 오름차순으로 정렬 후 순서대로 appendChild
  const layers = (sectionData.layers || []).slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  for (const layer of layers) {
    try {
      const rect = regionToRect(layer.region, sectionW, sectionH, padding);
      const contentWidth = rect.width;
      const element = layer.element;

      const childNode = await createNode(element, contentWidth, fontFamily);
      if (childNode) {
        childNode.x = rect.x;
        childNode.y = rect.y;
        childNode.resize(rect.width, rect.height);
        frame.appendChild(childNode);
      }
    } catch (e) {
      console.error('Composed layer error:', layer, e);
    }
  }

  return frame;
}

/**
 * Split composition — 2분할 레이아웃 (좌우 또는 상하)
 */
async function createSplitSection(sectionData, pageWidth, fontFamily) {
  const frame = figma.createFrame();
  frame.name = sectionData.name || 'Section';
  const sectionH = sectionData.height || 600;
  frame.resize(pageWidth, sectionH);

  const direction = sectionData.direction || 'horizontal';
  const ratio = sectionData.ratio || [1, 1];
  const totalRatio = ratio[0] + ratio[1];
  const gap = sectionData.gap || 0;

  frame.layoutMode = direction === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL';
  frame.primaryAxisSizingMode = 'FIXED';
  frame.counterAxisSizingMode = 'FIXED';
  frame.itemSpacing = gap;
  frame.primaryAxisAlignItems = 'MIN';
  frame.counterAxisAlignItems = 'MIN';

  applySectionBackground(frame, sectionData);

  const isHorizontal = direction === 'horizontal';
  const availableMain = isHorizontal ? pageWidth - gap : sectionH - gap;

  const panelConfigs = isHorizontal
    ? [{ data: sectionData.left, r: ratio[0] }, { data: sectionData.right, r: ratio[1] }]
    : [{ data: sectionData.top, r: ratio[0] }, { data: sectionData.bottom, r: ratio[1] }];

  for (const panel of panelConfigs) {
    if (!panel.data) continue;
    const panelSize = (panel.r / totalRatio) * availableMain;

    const panelFrame = figma.createFrame();
    panelFrame.name = (panel === panelConfigs[0] ? (isHorizontal ? 'left' : 'top') : (isHorizontal ? 'right' : 'bottom')) + '_panel';
    panelFrame.fills = [];
    panelFrame.layoutMode = 'VERTICAL';
    panelFrame.primaryAxisSizingMode = 'FIXED';
    panelFrame.counterAxisSizingMode = 'FIXED';
    panelFrame.itemSpacing = panel.data.itemSpacing ?? 16;
    panelFrame.paddingTop = panel.data.padding?.top ?? 24;
    panelFrame.paddingBottom = panel.data.padding?.bottom ?? 24;
    panelFrame.paddingLeft = panel.data.padding?.left ?? 24;
    panelFrame.paddingRight = panel.data.padding?.right ?? 24;

    if (isHorizontal) {
      panelFrame.resize(panelSize, sectionH);
    } else {
      panelFrame.resize(pageWidth, panelSize);
    }

    // 수직 정렬
    const valignMap = {
      TL: 'MIN', TC: 'MIN', TR: 'MIN',
      ML: 'CENTER', MC: 'CENTER', MR: 'CENTER',
      BL: 'MAX', BC: 'MAX', BR: 'MAX',
    };
    panelFrame.primaryAxisAlignItems = valignMap[panel.data.valign] || 'CENTER';
    panelFrame.counterAxisAlignItems = 'CENTER';

    const contentWidth = isHorizontal
      ? panelSize - (panel.data.padding?.left ?? 24) - (panel.data.padding?.right ?? 24)
      : pageWidth - (panel.data.padding?.left ?? 24) - (panel.data.padding?.right ?? 24);

    for (const child of (panel.data.children || [])) {
      try {
        const childNode = await createNode(child, contentWidth, fontFamily);
        if (childNode) panelFrame.appendChild(childNode);
      } catch (e) {
        console.error('Split panel child error:', child, e);
      }
    }

    frame.appendChild(panelFrame);
  }

  return frame;
}

/**
 * 노드 생성 (재귀적)
 */
async function createNode(nodeData, maxWidth, fontFamily) {
  if (!nodeData || !nodeData.type) return null;

  let node;
  const nodeType = nodeData.type.toUpperCase();

  switch (nodeType) {
    case 'TEXT':
      node = figma.createText();
      node.characters = nodeData.content || nodeData.text || 'Text';

      // 폰트 스타일 설정
      const family = nodeData.fontFamily || fontFamily || 'Inter';
      const weight = nodeData.fontWeight || 400;
      let fontStyle = 'Regular';
      if (weight >= 700) fontStyle = 'Bold';
      else if (weight >= 600) fontStyle = 'Semi Bold';
      else if (weight >= 500) fontStyle = 'Medium';

      try {
        node.fontName = { family, style: fontStyle };
      } catch (e) {
        try {
          node.fontName = { family: 'Inter', style: fontStyle };
        } catch (e2) {
          node.fontName = { family: 'Inter', style: 'Regular' };
        }
      }

      node.fontSize = nodeData.fontSize || 16;

      // 텍스트 색상
      var textColor = nodeData.color;
      if (!textColor && nodeData.fills && nodeData.fills[0] && nodeData.fills[0].color) {
        textColor = nodeData.fills[0].color;
      }
      if (textColor) {
        if (typeof textColor === 'string') {
          node.fills = [{ type: 'SOLID', color: hexToRgb(textColor) }];
        } else {
          node.fills = [{ type: 'SOLID', color: textColor }];
        }
      }

      // 텍스트 정렬
      if (nodeData.textAlign === 'CENTER') {
        node.textAlignHorizontal = 'CENTER';
      }

      // 최대 너비 설정 (JSON width 우선)
      const textWidth = nodeData.width || Math.min(maxWidth, 800);
      node.resize(textWidth, node.height);
      node.textAutoResize = 'WIDTH_AND_HEIGHT';
      break;

    case 'IMAGE':
    case 'IMAGE_AREA':
      node = await createImageNode(nodeData, maxWidth);
      break;

    case 'FRAME':
    case 'SECTION':
    case 'GRID':
    case 'STEPS':
    case 'CHECKLIST':
    case 'PRODUCTS':
    case 'REVIEWS':
    case 'FEATURES':
    case 'INGREDIENTS':
    case 'COMPARISON':
    case 'FAQ':
    case 'SPECS':
    case 'STEPS_VISUAL':
      node = await createComplexNode(nodeData, maxWidth);
      break;

    case 'BUTTON':
      node = await createButton(nodeData);
      break;

    case 'PRICE_BOX':
      node = await createPriceBox(nodeData);
      break;

    case 'STATS':
    case 'BADGES':
    case 'SAFETY_BADGE':
      node = await createBadgeRow(nodeData);
      break;

    case 'RECTANGLE':
      node = figma.createRectangle();
      node.resize(nodeData.width || 100, nodeData.height || 100);
      break;

    default:
      // 알 수 없는 타입은 텍스트로 표시
      if (nodeData.content || nodeData.text) {
        node = figma.createText();
        node.characters = nodeData.content || nodeData.text || '';
        node.fontSize = nodeData.fontSize || 16;
      }
      break;
  }

  if (node) {
    node.name = nodeData.name || nodeType;
  }

  return node;
}

/**
 * 복잡한 노드 (Grid, Steps 등) 생성
 */
async function createComplexNode(nodeData, maxWidth) {
  const frame = figma.createFrame();
  frame.name = nodeData.name || nodeData.type;
  frame.fills = [];

  // Auto Layout
  frame.layoutMode = nodeData.columns > 1 || nodeData.type === 'COMPARISON' ? 'HORIZONTAL' : 'VERTICAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.itemSpacing = nodeData.gap || 24;

  const items = nodeData.items || [];

  for (const item of items) {
    const itemFrame = figma.createFrame();
    const itemBg = nodeData.itemBackground ? hexToRgb(nodeData.itemBackground) : { r: 0.97, g: 0.96, b: 0.95 };
    itemFrame.fills = [{ type: 'SOLID', color: itemBg }];
    itemFrame.cornerRadius = nodeData.itemCornerRadius ?? 12;
    itemFrame.layoutMode = 'VERTICAL';
    itemFrame.primaryAxisSizingMode = 'AUTO';
    itemFrame.counterAxisSizingMode = 'AUTO';
    const itemPad = nodeData.itemPadding ?? 24;
    itemFrame.paddingTop = typeof itemPad === 'object' ? (itemPad.top ?? 24) : itemPad;
    itemFrame.paddingBottom = typeof itemPad === 'object' ? (itemPad.bottom ?? 24) : itemPad;
    itemFrame.paddingLeft = typeof itemPad === 'object' ? (itemPad.left ?? 24) : itemPad;
    itemFrame.paddingRight = typeof itemPad === 'object' ? (itemPad.right ?? 24) : itemPad;
    itemFrame.itemSpacing = nodeData.itemSpacing ?? 12;

    // 아이템 내용 추가
    if (typeof item === 'string') {
      const text = figma.createText();
      text.characters = item;
      text.fontSize = 16;
      itemFrame.appendChild(text);
    } else if (typeof item === 'object') {
      // 아이콘
      if (item.icon) {
        const icon = figma.createText();
        icon.characters = item.icon;
        icon.fontSize = 32;
        itemFrame.appendChild(icon);
      }
      // 제목
      if (item.title || item.name || item.q) {
        const title = figma.createText();
        title.characters = item.title || item.name || `Q. ${item.q}`;
        title.fontSize = 18;
        title.fontName = { family: 'Inter', style: 'Semi Bold' };
        itemFrame.appendChild(title);
      }
      // 설명
      if (item.desc || item.text || item.content || item.a || item.effect) {
        const desc = figma.createText();
        desc.characters = item.desc || item.text || item.content || `A. ${item.a}` || item.effect || '';
        desc.fontSize = 14;
        desc.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.45 } }];
        itemFrame.appendChild(desc);
      }
      // 포인트 리스트
      if (item.points) {
        for (const point of item.points) {
          const p = figma.createText();
          p.characters = `• ${point}`;
          p.fontSize = 14;
          itemFrame.appendChild(p);
        }
      }
      // features 리스트
      if (item.features) {
        for (const feat of item.features) {
          const f = figma.createText();
          f.characters = `✓ ${feat}`;
          f.fontSize = 14;
          itemFrame.appendChild(f);
        }
      }
    }

    frame.appendChild(itemFrame);
  }

  return frame;
}

/**
 * 버튼 생성
 */
async function createButton(nodeData) {
  const frame = figma.createFrame();
  frame.name = nodeData.name || 'Button';
  const btnBg = nodeData.backgroundColor ? hexToRgb(nodeData.backgroundColor) : { r: 1, g: 1, b: 1 };
  frame.fills = [{ type: 'SOLID', color: btnBg }];
  frame.cornerRadius = nodeData.cornerRadius ?? 100;
  frame.layoutMode = 'HORIZONTAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.primaryAxisAlignItems = 'CENTER';
  frame.counterAxisAlignItems = 'CENTER';
  const btnPad = nodeData.padding ?? { top: 20, bottom: 20, left: 48, right: 48 };
  frame.paddingTop = typeof btnPad === 'object' ? (btnPad.top ?? 20) : btnPad;
  frame.paddingBottom = typeof btnPad === 'object' ? (btnPad.bottom ?? 20) : btnPad;
  frame.paddingLeft = typeof btnPad === 'object' ? (btnPad.left ?? 48) : btnPad;
  frame.paddingRight = typeof btnPad === 'object' ? (btnPad.right ?? 48) : btnPad;

  const text = figma.createText();
  text.characters = nodeData.text || '버튼';
  text.fontSize = nodeData.fontSize ?? 18;
  text.fontName = { family: 'Inter', style: 'Bold' };
  text.fills = [{ type: 'SOLID', color: hexToRgb(nodeData.color || '#6B5FD5') }];

  frame.appendChild(text);
  return frame;
}

/**
 * 가격 박스 생성
 */
async function createPriceBox(nodeData) {
  const frame = figma.createFrame();
  frame.name = 'Price_Box';
  frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 0.15 } }];
  frame.cornerRadius = 16;
  frame.layoutMode = 'VERTICAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.paddingTop = 24;
  frame.paddingBottom = 24;
  frame.paddingLeft = 48;
  frame.paddingRight = 48;
  frame.itemSpacing = 8;
  frame.counterAxisAlignItems = 'CENTER';

  if (nodeData.original) {
    const original = figma.createText();
    original.characters = `정가 ${nodeData.original}`;
    original.fontSize = 16;
    original.fills = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.85 } }];
    frame.appendChild(original);
  }

  if (nodeData.sale) {
    const sale = figma.createText();
    sale.characters = nodeData.sale;
    sale.fontSize = 32;
    sale.fontName = { family: 'Inter', style: 'Bold' };
    sale.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    frame.appendChild(sale);
  }

  if (nodeData.discount) {
    const discount = figma.createText();
    discount.characters = nodeData.discount;
    discount.fontSize = 14;
    discount.fontName = { family: 'Inter', style: 'Semi Bold' };
    discount.fills = [{ type: 'SOLID', color: hexToRgb('#FFD700') }];
    frame.appendChild(discount);
  }

  return frame;
}

/**
 * 배지 행 생성
 */
async function createBadgeRow(nodeData) {
  const frame = figma.createFrame();
  frame.name = nodeData.type || 'Badges';
  frame.fills = [];
  frame.layoutMode = 'HORIZONTAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';
  frame.itemSpacing = 16;

  const items = nodeData.items || [];
  for (const item of items) {
    const badge = figma.createFrame();
    badge.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
    badge.cornerRadius = 8;
    badge.layoutMode = 'HORIZONTAL';
    badge.primaryAxisSizingMode = 'AUTO';
    badge.counterAxisSizingMode = 'AUTO';
    badge.paddingTop = 8;
    badge.paddingBottom = 8;
    badge.paddingLeft = 16;
    badge.paddingRight = 16;

    const text = figma.createText();
    text.characters = typeof item === 'string' ? item : item.toString();
    text.fontSize = 14;

    badge.appendChild(text);
    frame.appendChild(badge);
  }

  return frame;
}

/**
 * 이미지 노드 생성 (URL 또는 Base64 지원)
 */
async function createImageNode(nodeData, maxWidth) {
  const frame = figma.createFrame();
  frame.name = nodeData.name || 'Image_Area';

  const width = nodeData.width || maxWidth || 760;
  const height = nodeData.height || 400;
  frame.resize(width, height);

  // 기본 배경색 (이미지 로드 전 플레이스홀더)
  const placeholderColor = nodeData.placeholderColor || '#2A2A2A';
  frame.fills = [{ type: 'SOLID', color: hexToRgb(placeholderColor) }];

  // 이미지 URL이 있는 경우 로드 시도
  if (nodeData.imageUrl) {
    try {
      // Figma는 외부 URL 직접 로드 불가, 대신 플러그인 UI를 통해 fetch 필요
      // UI에 이미지 로드 요청 보내기
      figma.ui.postMessage({
        type: 'load-image',
        url: nodeData.imageUrl,
        nodeId: frame.id
      });
    } catch (e) {
      console.log('Image load error:', e);
    }
  }

  // Base64 이미지 데이터가 있는 경우
  if (nodeData.imageData) {
    try {
      const imageHash = figma.createImage(
        Uint8Array.from(atob(nodeData.imageData), c => c.charCodeAt(0))
      ).hash;
      frame.fills = [{
        type: 'IMAGE',
        imageHash: imageHash,
        scaleMode: nodeData.scaleMode || 'FILL'
      }];
    } catch (e) {
      console.log('Base64 image error:', e);
    }
  }

  // 이미지 레이블 추가 (선택적)
  if (nodeData.label) {
    frame.layoutMode = 'VERTICAL';
    frame.primaryAxisAlignItems = 'CENTER';
    frame.counterAxisAlignItems = 'CENTER';

    const labelText = figma.createText();
    labelText.characters = nodeData.label;
    labelText.fontSize = 14;
    labelText.fills = [{ type: 'SOLID', color: hexToRgb('#888888') }];
    frame.appendChild(labelText);
  }

  // ai_prompt 메타데이터 저장 (플러그인 데이터로)
  if (nodeData.ai_prompt) {
    const promptData = typeof nodeData.ai_prompt === 'string'
      ? nodeData.ai_prompt
      : JSON.stringify(nodeData.ai_prompt);
    frame.setPluginData('ai_prompt', promptData);
  }

  // 모서리 둥글기
  if (nodeData.cornerRadius) {
    frame.cornerRadius = nodeData.cornerRadius;
  }

  return frame;
}

/**
 * UI에서 로드된 이미지 데이터 적용
 */
async function applyImageToNode(nodeId, imageBytes) {
  try {
    const node = figma.getNodeById(nodeId);
    if (node && node.type === 'FRAME') {
      const imageHash = figma.createImage(new Uint8Array(imageBytes)).hash;
      node.fills = [{
        type: 'IMAGE',
        imageHash: imageHash,
        scaleMode: 'FILL'
      }];
      return true;
    }
  } catch (e) {
    console.error('Apply image error:', e);
  }
  return false;
}

/**
 * HEX to RGB 변환
 */
function hexToRgb(hex) {
  if (!hex) return { r: 1, g: 1, b: 1 };

  // RGB 객체인 경우 그대로 반환
  if (typeof hex === 'object' && hex.r !== undefined) {
    return hex;
  }

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      }
    : { r: 1, g: 1, b: 1 };
}
