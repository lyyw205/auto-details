# /extract-widgets-v5 — 분석 좌표 → 오버레이 와이어프레임 HTML

## 목표

v4 분석 JSON의 좌표를 **레퍼런스 이미지와 1:1 오버레이 가능한 와이어프레임 HTML**로 변환한다.
브라우저에서 열면 레퍼런스 이미지 위에 와이어프레임이 겹쳐 보이고, 모든 요소가 정확히 일치해야 한다.

## Input

- `output/analysis-v4-{name}.json`
- 레퍼런스 이미지: `references/{name}.png`

## Output

- `output/overlay-{name}.html` — 단일 HTML 파일 (브라우저에서 바로 확인 가능)

---

## Process

### 1. 분석 JSON 로딩

`output/analysis-v4-{name}.json` 읽기.
`canvas.width`, `canvas.height`, `image_file` 확인.

### 2. 요소별 HTML 생성

#### text 요소

```html
<div class="el el-text" style="left:{x}px; top:{y}px; width:{w}px; height:{h}px;">
  {content}
</div>
```

#### image 요소

```html
<div class="el el-image" style="left:{x}px; top:{y}px; width:{w}px; height:{h}px;">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
  <span>{label}</span>
</div>
```

#### badge 요소

```html
<div class="el el-badge" style="left:{x}px; top:{y}px; width:{w}px; height:{h}px;">
  {content}
</div>
```

### 3. 전체 HTML 조립

아래 템플릿에 요소들을 삽입한다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width={canvas_width}">
<title>Overlay — ref-{name}</title>
<link rel="stylesheet" as="style" crossorigin
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Pretendard', system-ui, sans-serif;
    background: #1a1a1a;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* === 컨트롤 패널 === */
  .controls {
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 1000;
    background: rgba(0,0,0,0.85);
    color: white;
    padding: 16px;
    border-radius: 10px;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 200px;
  }
  .controls label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  .controls input[type="range"] {
    flex: 1;
  }

  /* === 캔버스 === */
  .canvas {
    position: relative;
    width: {canvas_width}px;
    height: {canvas_height}px;
    overflow: hidden;
    margin-top: 20px;
  }

  /* === 레퍼런스 이미지 배경 === */
  .ref-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: {canvas_width}px;
    height: {canvas_height}px;
    object-fit: fill;
    z-index: 0;
    pointer-events: none;
  }

  /* === 와이어프레임 요소 공통 === */
  .el {
    position: absolute;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 12px;
    line-height: 1.3;
    transition: opacity 0.2s;
  }

  /* === 텍스트 === */
  .el-text {
    background: rgba(100, 149, 237, 0.45);
    border: 1.5px solid rgba(100, 149, 237, 0.8);
    border-radius: 4px;
    color: #1a3a6a;
    font-weight: 500;
    padding: 2px 4px;
    overflow: hidden;
    word-break: keep-all;
  }

  /* === 이미지 === */
  .el-image {
    background: rgba(76, 175, 80, 0.35);
    border: 1.5px solid rgba(76, 175, 80, 0.8);
    border-radius: 6px;
    color: #1b5e20;
    font-weight: 500;
    flex-direction: column;
    gap: 4px;
  }
  .el-image svg {
    opacity: 0.6;
    flex-shrink: 0;
  }

  /* === 배지 === */
  .el-badge {
    background: rgba(255, 152, 0, 0.45);
    border: 1.5px solid rgba(255, 152, 0, 0.8);
    border-radius: 4px;
    color: #e65100;
    font-weight: 600;
    font-size: 11px;
  }

  /* === 섹션 구분선 === */
  .section-line {
    position: absolute;
    left: 0;
    width: 100%;
    height: 0;
    border-top: 2px dashed rgba(255, 0, 0, 0.5);
    z-index: 2;
    pointer-events: none;
  }
  .section-line::after {
    content: attr(data-label);
    position: absolute;
    left: 8px;
    top: 4px;
    background: rgba(255, 0, 0, 0.7);
    color: white;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 3px;
  }
</style>
</head>
<body>

<div class="controls">
  <strong>ref-{name} Overlay</strong>
  <label>
    <input type="checkbox" id="toggleRef" checked>
    레퍼런스 이미지
  </label>
  <label>
    레퍼런스 투명도
    <input type="range" id="refOpacity" min="0" max="100" value="40">
  </label>
  <label>
    <input type="checkbox" id="toggleWf" checked>
    와이어프레임
  </label>
  <label>
    와이어프레임 투명도
    <input type="range" id="wfOpacity" min="0" max="100" value="100">
  </label>
  <label>
    <input type="checkbox" id="toggleSections" checked>
    섹션 구분선
  </label>
</div>

<div class="canvas">
  <!-- 레퍼런스 이미지 -->
  <img class="ref-bg" src="../references/{name}.png" id="refImg">

  <!-- 섹션 구분선 -->
  <!-- {SECTION_LINES} -->

  <!-- 와이어프레임 요소 -->
  <!-- {ELEMENTS} -->
</div>

<script>
  const refImg = document.getElementById('refImg');
  const els = document.querySelectorAll('.el');
  const lines = document.querySelectorAll('.section-line');

  document.getElementById('toggleRef').addEventListener('change', e => {
    refImg.style.display = e.target.checked ? 'block' : 'none';
  });
  document.getElementById('refOpacity').addEventListener('input', e => {
    refImg.style.opacity = e.target.value / 100;
  });
  document.getElementById('toggleWf').addEventListener('change', e => {
    els.forEach(el => el.style.display = e.target.checked ? 'flex' : 'none');
  });
  document.getElementById('wfOpacity').addEventListener('input', e => {
    els.forEach(el => el.style.opacity = e.target.value / 100);
  });
  document.getElementById('toggleSections').addEventListener('change', e => {
    lines.forEach(l => l.style.display = e.target.checked ? 'block' : 'none');
  });

  // 초기 투명도 설정
  refImg.style.opacity = 0.4;
</script>

</body>
</html>
```

### 4. 섹션 구분선

각 섹션 시작점에 빨간 점선을 추가한다:

```html
<div class="section-line" style="top: {section_y}px;" data-label="#{order} {label}"></div>
```

---

## 검증 방법

브라우저에서 `output/overlay-{name}.html`을 열고:

1. **레퍼런스 100% + 와이어프레임 100%**: 모든 파란 박스가 텍스트 위에, 초록 박스가 이미지 위에 정확히 겹치는지 확인
2. **레퍼런스 OFF + 와이어프레임 ON**: 와이어프레임만 보고 레이아웃이 자연스러운지 확인
3. **레퍼런스 40% + 와이어프레임 ON**: 기본 모드. 반투명 레퍼런스 위에 요소가 겹쳐 보임

불일치가 있으면 analysis JSON 좌표를 수정하고 다시 생성한다.

---

## Validation

- [ ] 모든 요소에 `position: absolute` + `left/top/width/height`가 있는가?
- [ ] 좌표가 analysis JSON의 값과 정확히 일치하는가?
- [ ] 레퍼런스 이미지 경로가 올바른가? (`../references/{name}.png`)
- [ ] 컨트롤 패널의 토글이 동작하는가?
- [ ] 브라우저에서 레퍼런스와 와이어프레임이 겹쳐 보이는가?

---

## 유저에게 표시

```
=== ref-{name} 오버레이 와이어프레임 생성 완료 ===

요소: 텍스트 {T}개, 이미지 {I}개, 배지 {B}개
섹션: {N}개

output/overlay-{name}.html 저장 완료
→ 브라우저에서 열어 오버레이 정합성 확인
```
