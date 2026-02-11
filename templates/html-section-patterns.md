# HTML 섹션 패턴 라이브러리

> `generate-html` 스킬이 참조하는 섹션별 HTML/CSS 스니펫.
> 각 패턴은 `html-base.html`의 Tailwind 설정과 유틸리티 클래스를 사용합니다.

---

## Composition 타입별 CSS 매핑

### `stack` — 수직 나열 (기본값)
```html
<section class="flex flex-col items-center gap-6 section-padding bg-dark-gradient-1">
  <div class="content-narrow flex flex-col items-center gap-6 text-center">
    <!-- children -->
  </div>
</section>
```

### `split` — 2분할 레이아웃
```html
<section class="grid grid-cols-2 min-h-[500px] bg-dark-gradient-2">
  <div class="flex flex-col justify-center px-[50px] py-[60px] gap-4">
    <!-- 좌측 콘텐츠 -->
  </div>
  <div class="flex items-center justify-center">
    <!-- 우측 콘텐츠 (주로 이미지) -->
  </div>
</section>
```
비율 조정: `grid-cols-[3fr_2fr]`, `grid-cols-[2fr_3fr]` 등

### `composed` — 절대 위치 레이어 (9-grid)
```html
<section class="composed-section relative h-[600px] bg-dark-gradient-1">
  <!-- layer 0: 배경 이미지 -->
  <div class="composed-layer inset-0">
    <div class="img-placeholder w-full h-full" data-ai-prompt="...">
      <span class="img-label">배경 이미지 설명</span>
    </div>
  </div>
  <!-- layer 1: 그라데이션 오버레이 -->
  <div class="composed-layer inset-0 hero-overlay"></div>
  <!-- layer 2: 텍스트 오버레이 -->
  <div class="composed-layer bottom-0 left-0 right-0 p-[50px]">
    <h2 class="text-hero text-white text-shadow-hero">메인 카피</h2>
  </div>
</section>
```

---

## 이미지 플레이스홀더 패턴

```html
<div class="img-placeholder w-[760px] h-[500px] rounded-lg"
     data-ai-prompt="Professional product photography, studio lighting, 8k"
     data-ai-style="product_hero"
     data-ai-ratio="4:3">
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
  <span class="img-label">메인 제품 이미지 - 정면 스튜디오 촬영</span>
</div>
```

---

## 섹션별 HTML 패턴

---

### 1. Hook (후킹) — `composed`

```html
<section class="composed-section relative h-[1200px]" id="section-hook">
  <!-- 배경 이미지 -->
  <div class="composed-layer inset-0">
    <div class="img-placeholder w-full h-full"
         data-ai-prompt="[product] hero shot, dramatic lighting, dark background, premium feel, 8k"
         data-ai-style="product_hero">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">메인 제품 히어로 이미지</span>
    </div>
  </div>
  <!-- 하단 그라데이션 오버레이 -->
  <div class="composed-layer inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
  <!-- 상단 브랜드명 -->
  <div class="composed-layer top-0 left-0 right-0 px-[50px] pt-[60px]">
    <p class="text-small tracking-[0.2em] uppercase" style="color: var(--brand-main);">브랜드명</p>
  </div>
  <!-- 하단 메인 카피 -->
  <div class="composed-layer bottom-0 left-0 right-0 px-[50px] pb-[80px] flex flex-col gap-4">
    <h1 class="text-hero text-white text-shadow-hero tracking-tight">
      강렬한 메인 카피<br>두 줄까지 가능
    </h1>
    <p class="text-sub text-white/80 text-shadow-subtle">핵심 스펙 또는 혜택 서브 카피</p>
    <div class="flex flex-col gap-1 mt-2">
      <p class="text-small text-white/50">부가 설명 1</p>
      <p class="text-small text-white/50">부가 설명 2</p>
    </div>
  </div>
</section>
```

---

### 2. WhatIsThis (이게 뭔가요?) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-dark-gradient-2" id="section-whatisthis">
  <div class="content-narrow flex flex-col items-center gap-8 text-center">
    <p class="text-question" style="color: var(--brand-main);">이게 정확히 뭔가요?</p>
    <h2 class="text-item text-white font-bold">한마디로, [제품]은 [핵심 가치]입니다</h2>
    <div class="img-placeholder w-[760px] h-[300px] rounded-xl"
         data-ai-prompt="[product] overview, clean composition, white background"
         data-ai-style="product_hero">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">제품 구성 이미지</span>
    </div>
    <div class="glass-card p-8 w-full flex flex-col gap-4">
      <p class="text-body text-white/90 font-semibold">간단 사용법</p>
      <div class="flex flex-col gap-3">
        <p class="text-body text-white/70"><span class="text-body font-bold mr-2" style="color: var(--brand-main);">1.</span>첫 번째 단계</p>
        <p class="text-body text-white/70"><span class="text-body font-bold mr-2" style="color: var(--brand-main);">2.</span>두 번째 단계</p>
        <p class="text-body text-white/70"><span class="text-body font-bold mr-2" style="color: var(--brand-main);">3.</span>세 번째 단계</p>
      </div>
      <p class="text-body font-semibold mt-2" style="color: var(--brand-main);">사용법 요약 한 줄</p>
    </div>
  </div>
</section>
```

---

### 3. BrandName (브랜드 의미) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-brand-gradient" id="section-brandname">
  <div class="content-narrow flex flex-col items-center gap-6 text-center">
    <p class="text-item text-white/80">[브랜드명]은 어떤 의미인가요?</p>
    <div class="divider-gradient my-2"></div>
    <div class="flex flex-col gap-3">
      <p class="text-body text-white/90"><strong class="text-white">단어 1</strong> = 의미 설명</p>
      <p class="text-body text-white/90"><strong class="text-white">단어 2</strong> = 의미 설명</p>
    </div>
    <h2 class="text-sub text-white font-bold mt-4">"최종 해석 문장"</h2>
    <p class="text-body text-white/70">브랜드 철학 설명</p>
    <div class="glass-card px-8 py-4 mt-4">
      <p class="text-item text-white/90 tracking-wide">슬로건</p>
    </div>
  </div>
</section>
```

---

### 4. SetContents (세트 구성품) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-dark-gradient-1" id="section-setcontents">
  <div class="content-narrow flex flex-col items-center gap-8 text-center">
    <h2 class="text-section text-white">구매 시 이 모든 것을 드립니다</h2>
    <p class="text-body" style="color: var(--brand-main);">세트명</p>
    <div class="img-placeholder w-[760px] h-[350px] rounded-xl"
         data-ai-prompt="[product] flat lay, all components arranged, top-down view"
         data-ai-style="product_flat">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">구성품 전체 이미지</span>
    </div>
    <div class="w-full flex flex-col gap-6 mt-4">
      <!-- 구성품 카드 반복 -->
      <div class="glass-card p-6 text-left border-brand-left">
        <h3 class="text-item text-white mb-2">구성품 1 제목</h3>
        <p class="text-body text-white/60">설명 1</p>
        <p class="text-body text-white/60">설명 2</p>
        <p class="text-body text-white/60">설명 3</p>
      </div>
      <div class="glass-card p-6 text-left border-brand-left">
        <h3 class="text-item text-white mb-2">구성품 2 제목</h3>
        <p class="text-body text-white/60">설명 1</p>
        <p class="text-body text-white/60">설명 2</p>
      </div>
    </div>
  </div>
</section>
```

---

### 5. WhyCore (핵심 기능 중요성) — `split`

```html
<section class="grid grid-cols-2 min-h-[1000px] bg-dark-gradient-2" id="section-whycore">
  <div class="flex flex-col justify-center px-[50px] py-[60px] gap-6">
    <p class="text-question" style="color: var(--brand-main);">Q. 왜 [핵심 기술]이 중요한가요?</p>
    <h2 class="text-answer text-white">핵심 답변</h2>
    <div class="divider-gradient my-2"></div>
    <div class="flex flex-col gap-4">
      <p class="text-body text-white/60">비교 제목</p>
      <div class="glass-card p-4 flex justify-between items-center">
        <span class="text-body text-sub">일반 제품</span>
        <span class="text-body text-muted">수치</span>
      </div>
      <div class="glass-card-strong p-4 flex justify-between items-center" style="border-color: var(--brand-main);">
        <span class="text-body" style="color: var(--brand-main);">우리 제품</span>
        <span class="text-body font-bold" style="color: var(--accent);">수치 (강조)</span>
      </div>
    </div>
    <p class="text-body text-white/70 mt-2">결론 메시지</p>
  </div>
  <div class="flex items-center justify-center p-8">
    <div class="img-placeholder w-full h-[400px] rounded-xl"
         data-ai-prompt="[product] infographic, comparison chart, data visualization"
         data-ai-style="infographic">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">비교 인포그래픽</span>
    </div>
  </div>
</section>
```

---

### 6. PainPoint (페인포인트 공감) — `composed`

```html
<section class="composed-section relative h-[1000px]" id="section-painpoint">
  <div class="composed-layer inset-0">
    <div class="img-placeholder w-full h-full"
         data-ai-prompt="frustrated person, problem scenario, dark moody atmosphere"
         data-ai-style="mood">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">페인포인트 상황 이미지</span>
    </div>
  </div>
  <div class="composed-layer inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30"></div>
  <div class="composed-layer bottom-0 left-0 right-0 px-[50px] pb-[80px] flex flex-col items-center gap-6 text-center">
    <h2 class="text-answer text-white text-shadow-hero font-bold">혹시 이런 경험 있으신가요?</h2>
    <p class="text-body text-white/60">아래 항목 중 하나라도 해당된다면...</p>
    <div class="flex flex-col gap-3 w-full max-w-[600px]">
      <p class="check-item text-body text-white/80">체크리스트 항목 1</p>
      <p class="check-item text-body text-white/80">체크리스트 항목 2</p>
      <p class="check-item text-body text-white/80">체크리스트 항목 3</p>
      <p class="check-item text-body text-white/80">체크리스트 항목 4</p>
    </div>
    <p class="text-body font-semibold mt-4" style="color: var(--brand-main);">해결 암시 메시지</p>
  </div>
</section>
```

---

### 7. Solution (해결책 제시) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-brand-gradient" id="section-solution">
  <div class="content-narrow flex flex-col items-center gap-8 text-center">
    <h2 class="text-section text-white text-shadow-subtle">[제품명]이 해결합니다</h2>
    <div class="img-placeholder w-[760px] h-[350px] rounded-xl"
         data-ai-prompt="[product] in use, solution moment, bright positive atmosphere"
         data-ai-style="product_lifestyle">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">해결 후 모습 이미지</span>
    </div>
    <div class="w-full grid grid-cols-3 gap-4">
      <div class="glass-card p-6 flex flex-col items-center gap-3 text-center">
        <h3 class="text-item text-white">해결점 1</h3>
        <p class="text-body text-white/60">설명</p>
      </div>
      <div class="glass-card p-6 flex flex-col items-center gap-3 text-center">
        <h3 class="text-item text-white">해결점 2</h3>
        <p class="text-body text-white/60">설명</p>
      </div>
      <div class="glass-card p-6 flex flex-col items-center gap-3 text-center">
        <h3 class="text-item text-white">해결점 3</h3>
        <p class="text-body text-white/60">설명</p>
      </div>
    </div>
    <p class="text-body text-white font-semibold mt-4">결과 요약</p>
  </div>
</section>
```

---

### 8. FeaturesOverview (핵심 기능 개요) — `stack`

```html
<section class="flex flex-col items-center section-padding-lg bg-dark-gradient-1" id="section-featuresoverview">
  <div class="content-narrow flex flex-col items-center gap-10 text-center">
    <div class="flex flex-col items-center gap-3">
      <h2 class="text-section text-white">핵심 기능을 소개합니다</h2>
      <p class="text-body text-white/50">N가지 핵심 기능</p>
    </div>
    <div class="img-placeholder w-[760px] h-[350px] rounded-xl"
         data-ai-prompt="[product] feature overview, annotated, clean layout"
         data-ai-style="infographic">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">기능 개요 이미지</span>
    </div>
    <div class="w-full grid grid-cols-2 gap-4">
      <!-- 기능 카드 반복 -->
      <div class="glass-card p-5 flex items-center gap-4 text-left">
        <span class="num-badge shrink-0">01</span>
        <p class="text-item text-white">기능 1 제목</p>
      </div>
      <div class="glass-card p-5 flex items-center gap-4 text-left">
        <span class="num-badge shrink-0">02</span>
        <p class="text-item text-white">기능 2 제목</p>
      </div>
      <div class="glass-card p-5 flex items-center gap-4 text-left">
        <span class="num-badge shrink-0">03</span>
        <p class="text-item text-white">기능 3 제목</p>
      </div>
      <div class="glass-card p-5 flex items-center gap-4 text-left">
        <span class="num-badge shrink-0">04</span>
        <p class="text-item text-white">기능 4 제목</p>
      </div>
      <div class="glass-card p-5 flex items-center gap-4 text-left">
        <span class="num-badge shrink-0">05</span>
        <p class="text-item text-white">기능 5 제목</p>
      </div>
      <div class="glass-card p-5 flex items-center gap-4 text-left">
        <span class="num-badge shrink-0">06</span>
        <p class="text-item text-white">기능 6 제목</p>
      </div>
    </div>
  </div>
</section>
```

---

### 9. FeatureDetail (기능 상세) — `split` (반복 가능)

```html
<!-- 홀수 기능: 이미지 우측 -->
<section class="grid grid-cols-2 min-h-[1000px] bg-dark-gradient-2" id="section-feature1-detail">
  <div class="flex flex-col justify-center px-[50px] py-[60px] gap-6">
    <p class="text-feature-num text-gradient-brand tracking-tight">01</p>
    <p class="text-question" style="color: var(--brand-main);">Q. 왜 [기능명]인가요?</p>
    <h2 class="text-answer text-white">A. [핵심 혜택 설명]</h2>
    <div class="divider-gradient my-2"></div>
    <h3 class="text-item text-white">이 기능의 혜택</h3>
    <div class="flex flex-col gap-3">
      <p class="check-item text-body text-white/70">혜택 1</p>
      <p class="check-item text-body text-white/70">혜택 2</p>
      <p class="check-item text-body text-white/70">혜택 3</p>
    </div>
    <p class="text-body font-semibold mt-2" style="color: var(--accent);">스펙 강조 수치</p>
  </div>
  <div class="flex items-center justify-center p-8 bg-dark-brand-glow">
    <div class="img-placeholder w-full h-[400px] rounded-xl"
         data-ai-prompt="[product] [feature] detail, macro closeup, 8k"
         data-ai-style="product_detail">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">기능 상세 이미지</span>
    </div>
  </div>
</section>

<!-- 짝수 기능: 이미지 좌측 (좌우 반전) -->
<section class="grid grid-cols-2 min-h-[1000px] bg-dark-gradient-1" id="section-feature2-detail">
  <div class="flex items-center justify-center p-8 bg-dark-brand-glow">
    <div class="img-placeholder w-full h-[400px] rounded-xl"
         data-ai-prompt="[product] [feature] in action, 8k"
         data-ai-style="product_lifestyle">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">기능 상세 이미지</span>
    </div>
  </div>
  <div class="flex flex-col justify-center px-[50px] py-[60px] gap-6">
    <p class="text-feature-num text-gradient-brand tracking-tight">02</p>
    <p class="text-question" style="color: var(--brand-main);">Q. 왜 [기능명]인가요?</p>
    <h2 class="text-answer text-white">A. [핵심 혜택 설명]</h2>
    <div class="divider-gradient my-2"></div>
    <h3 class="text-item text-white">이 기능의 혜택</h3>
    <div class="flex flex-col gap-3">
      <p class="check-item text-body text-white/70">혜택 1</p>
      <p class="check-item text-body text-white/70">혜택 2</p>
      <p class="check-item text-body text-white/70">혜택 3</p>
    </div>
    <p class="text-body font-semibold mt-2" style="color: var(--accent);">스펙 강조 수치</p>
  </div>
</section>
```

> **규칙**: 홀수 번호 기능은 텍스트 좌/이미지 우, 짝수 번호는 이미지 좌/텍스트 우로 교차 배치합니다.

---

### 10. Tips (사용 꿀팁) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-dark-gradient-2" id="section-tips">
  <div class="content-narrow flex flex-col items-center gap-8 text-center">
    <h2 class="text-answer text-white">사용 꿀팁</h2>
    <div class="w-full flex flex-col gap-4">
      <!-- 팁 카드 반복 -->
      <div class="glass-card p-6 flex flex-col gap-3 text-center">
        <div class="flex items-center justify-center gap-3">
          <span class="text-small font-bold px-3 py-1 rounded-full" style="background: color-mix(in srgb, var(--brand-main), transparent 85%); color: var(--brand-main);">TIP 1</span>
          <h3 class="text-body font-semibold" style="color: var(--brand-main);">팁 제목</h3>
        </div>
        <p class="text-body text-white/60">팁 설명 텍스트. 2-3줄로 분리하여<br>자연스럽게 읽히도록 작성합니다.</p>
      </div>
      <div class="glass-card p-6 flex flex-col gap-3 text-center">
        <div class="flex items-center justify-center gap-3">
          <span class="text-small font-bold px-3 py-1 rounded-full" style="background: color-mix(in srgb, var(--brand-main), transparent 85%); color: var(--brand-main);">TIP 2</span>
          <h3 class="text-body font-semibold" style="color: var(--brand-main);">팁 제목</h3>
        </div>
        <p class="text-body text-white/60">팁 설명 텍스트.</p>
      </div>
    </div>
  </div>
</section>
```

---

### 11. Differentiator (핵심 차별화) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-accent-gradient" id="section-differentiator">
  <div class="content-narrow flex flex-col items-center gap-8 text-center">
    <span class="text-small font-bold px-4 py-2 rounded-full bg-black/20 text-white">국내 최초</span>
    <h2 class="text-section text-white text-shadow-subtle">차별화 포인트</h2>
    <p class="text-body text-white/70">부가 설명</p>
    <div class="img-placeholder w-[760px] h-[300px] rounded-xl"
         data-ai-prompt="[product] comparison, before and after, split view"
         data-ai-style="comparison">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">차별화 비교 이미지</span>
    </div>
    <div class="w-full grid grid-cols-2 gap-6">
      <div class="glass-card p-6 text-center">
        <h3 class="text-item text-white/70 mb-3">기존 문제</h3>
        <p class="text-body text-white/50">문제 설명</p>
      </div>
      <div class="glass-card-strong p-6 text-center" style="border-color: var(--brand-main);">
        <h3 class="text-item text-white mb-3">우리의 해결책</h3>
        <p class="text-body text-white/80">해결책 설명</p>
      </div>
    </div>
    <p class="text-body text-white font-semibold mt-2">결과 강조</p>
  </div>
</section>
```

---

### 12. StatsHighlight (핵심 수치 강조) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-dark-gradient-1" id="section-statshighlight">
  <div class="content-narrow flex flex-col items-center gap-10 text-center">
    <div>
      <h2 class="text-sub text-white font-bold">섹션 제목</h2>
      <p class="text-caption text-sub mt-1 tracking-widest uppercase">IN NUMBERS</p>
    </div>
    <div class="w-full grid grid-cols-3 gap-6">
      <div class="glass-card p-8 flex flex-col items-center gap-2">
        <p class="text-hero text-gradient-brand">150+</p>
        <p class="text-small text-white/50">라벨</p>
      </div>
      <div class="glass-card p-8 flex flex-col items-center gap-2">
        <p class="text-hero text-gradient-brand">98%</p>
        <p class="text-small text-white/50">라벨</p>
      </div>
      <div class="glass-card p-8 flex flex-col items-center gap-2">
        <p class="text-hero text-gradient-brand">24h</p>
        <p class="text-small text-white/50">라벨</p>
      </div>
    </div>
  </div>
</section>
```

---

### 13. Comparison (경쟁사 비교) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-dark-gradient-1" id="section-comparison">
  <div class="content-narrow flex flex-col items-center gap-8 text-center">
    <h2 class="text-section text-white">직접 비교해 보세요</h2>
    <p class="text-body text-white/50">서브 카피</p>
    <div class="img-placeholder w-[760px] h-[400px] rounded-xl"
         data-ai-prompt="comparison infographic, side by side chart, clean data visualization"
         data-ai-style="infographic">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">비교표 인포그래픽</span>
    </div>
    <!-- 비교 테이블 -->
    <div class="w-full flex flex-col gap-3">
      <!-- 헤더 -->
      <div class="grid grid-cols-3 gap-4 px-4 py-3">
        <span class="text-body text-white/50 text-left font-semibold">비교 항목</span>
        <span class="text-body text-sub text-center">경쟁사</span>
        <span class="text-body text-center font-semibold" style="color: var(--brand-main);">우리 제품</span>
      </div>
      <div class="divider-gradient"></div>
      <!-- 비교 행 반복 -->
      <div class="grid grid-cols-3 gap-4 glass-card px-4 py-4">
        <span class="text-body text-white font-semibold text-left">항목 1</span>
        <span class="text-body text-sub text-center">수치</span>
        <span class="text-body text-center font-bold" style="color: var(--brand-main);">수치 (승)</span>
      </div>
      <div class="grid grid-cols-3 gap-4 glass-card px-4 py-4">
        <span class="text-body text-white font-semibold text-left">항목 2</span>
        <span class="text-body text-sub text-center">수치</span>
        <span class="text-body text-center font-bold" style="color: var(--brand-main);">수치 (승)</span>
      </div>
    </div>
    <p class="text-body font-semibold mt-2" style="color: var(--accent);">결론</p>
  </div>
</section>
```

---

### 14. Safety (안전/신뢰) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-dark-gradient-2" id="section-safety">
  <div class="content-narrow flex flex-col items-center gap-8 text-center">
    <h2 class="text-section text-white">안전하게 설계했습니다</h2>
    <div class="img-placeholder w-[760px] h-[300px] rounded-xl"
         data-ai-prompt="safety certifications, quality badges, trust symbols, clean layout"
         data-ai-style="infographic">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">안전/인증 이미지</span>
    </div>
    <div class="w-full grid grid-cols-2 gap-4">
      <!-- 안전 포인트 카드 반복 -->
      <div class="glass-card p-5 flex flex-col gap-2 text-center">
        <h3 class="text-body font-semibold" style="color: var(--brand-main);">안전 포인트 1</h3>
        <p class="text-body text-white/60">설명</p>
      </div>
      <div class="glass-card p-5 flex flex-col gap-2 text-center">
        <h3 class="text-body font-semibold" style="color: var(--brand-main);">안전 포인트 2</h3>
        <p class="text-body text-white/60">설명</p>
      </div>
      <div class="glass-card p-5 flex flex-col gap-2 text-center">
        <h3 class="text-body font-semibold" style="color: var(--brand-main);">안전 포인트 3</h3>
        <p class="text-body text-white/60">설명</p>
      </div>
      <div class="glass-card p-5 flex flex-col gap-2 text-center">
        <h3 class="text-body font-semibold" style="color: var(--brand-main);">안전 포인트 4</h3>
        <p class="text-body text-white/60">설명</p>
      </div>
    </div>
  </div>
</section>
```

---

### 15. Target (추천 대상) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-brand-gradient" id="section-target">
  <div class="content-narrow flex flex-col items-center gap-8 text-center">
    <h2 class="text-section text-white text-shadow-subtle">이런 분들께 추천합니다</h2>
    <div class="img-placeholder w-[760px] h-[300px] rounded-xl"
         data-ai-prompt="happy customer using [product], lifestyle, warm atmosphere"
         data-ai-style="product_lifestyle">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">타겟 고객 이미지</span>
    </div>
    <div class="w-full flex flex-col gap-3 max-w-[600px]">
      <p class="check-item text-body text-white/90">추천 대상 1</p>
      <p class="check-item text-body text-white/90">추천 대상 2</p>
      <p class="check-item text-body text-white/90">추천 대상 3</p>
      <p class="check-item text-body text-white/90">추천 대상 4</p>
      <p class="check-item text-body text-white/90">추천 대상 5</p>
      <p class="check-item text-body text-white/90">추천 대상 6</p>
    </div>
  </div>
</section>
```

---

### 16. Reviews (고객 후기) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-dark-gradient-1" id="section-reviews">
  <div class="content-narrow flex flex-col items-center gap-8 text-center">
    <h2 class="text-section text-white">실제 사용자 후기</h2>
    <p class="text-body text-white/50">서브 카피</p>
    <div class="w-full flex flex-col gap-4">
      <!-- 리뷰 카드 반복 -->
      <div class="glass-card p-6 flex flex-col gap-3 text-center">
        <span class="text-small font-semibold" style="color: var(--brand-main);">리뷰어 유형</span>
        <h3 class="text-body text-white font-semibold">"리뷰 핵심 문구"</h3>
        <p class="text-body text-white/60">리뷰 상세 내용. 실제 사용 경험을<br>생생하게 전달합니다.</p>
      </div>
      <div class="glass-card p-6 flex flex-col gap-3 text-center">
        <span class="text-small font-semibold" style="color: var(--brand-main);">리뷰어 유형</span>
        <h3 class="text-body text-white font-semibold">"리뷰 핵심 문구"</h3>
        <p class="text-body text-white/60">리뷰 상세 내용.</p>
      </div>
      <div class="glass-card p-6 flex flex-col gap-3 text-center">
        <span class="text-small font-semibold" style="color: var(--brand-main);">리뷰어 유형</span>
        <h3 class="text-body text-white font-semibold">"리뷰 핵심 문구"</h3>
        <p class="text-body text-white/60">리뷰 상세 내용.</p>
      </div>
    </div>
    <p class="text-small text-muted mt-2">만족도 통계</p>
  </div>
</section>
```

---

### 17. ProductSpec (제품 스펙) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-dark-gradient-2" id="section-productspec">
  <div class="content-narrow flex flex-col items-center gap-8 text-center">
    <h2 class="text-section text-white">제품 사양</h2>
    <div class="img-placeholder w-[760px] h-[350px] rounded-xl"
         data-ai-prompt="[product] dimensions diagram, technical drawing, specifications"
         data-ai-style="infographic">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">제품 스펙 이미지</span>
    </div>
    <div class="w-full flex flex-col gap-6 text-left">
      <!-- 카테고리 그룹 -->
      <div>
        <h3 class="text-item mb-3" style="color: var(--brand-main);">카테고리 1</h3>
        <div class="flex flex-col gap-2">
          <div class="flex justify-between py-2 border-b border-white/5">
            <span class="text-body text-white/60">항목</span>
            <span class="text-body text-white">수치</span>
          </div>
          <div class="flex justify-between py-2 border-b border-white/5">
            <span class="text-body text-white/60">항목</span>
            <span class="text-body text-white">수치</span>
          </div>
        </div>
      </div>
      <div>
        <h3 class="text-item mb-3" style="color: var(--accent);">카테고리 2</h3>
        <div class="flex flex-col gap-2">
          <div class="flex justify-between py-2 border-b border-white/5">
            <span class="text-body text-white/60">항목</span>
            <span class="text-body text-white">수치</span>
          </div>
        </div>
      </div>
      <p class="text-body text-white/40 text-center mt-2">공통 정보 (제조국, A/S 등)</p>
    </div>
  </div>
</section>
```

---

### 18. FAQ (자주 묻는 질문) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-dark-gradient-1" id="section-faq">
  <div class="content-narrow flex flex-col items-center gap-8 text-center">
    <h2 class="text-section text-white">자주 묻는 질문</h2>
    <div class="w-full flex flex-col gap-3">
      <!-- FAQ 아이템 반복 -->
      <div class="glass-card p-6 flex flex-col gap-3 text-center">
        <h3 class="text-body text-white font-semibold">Q. 질문 텍스트?</h3>
        <p class="text-body text-white/60">A. 답변 텍스트. 구매 전 궁금증을<br>해소할 수 있도록 친절하게 답변합니다.</p>
      </div>
      <div class="glass-card p-6 flex flex-col gap-3 text-center">
        <h3 class="text-body text-white font-semibold">Q. 질문 텍스트?</h3>
        <p class="text-body text-white/60">A. 답변 텍스트.</p>
      </div>
      <div class="glass-card p-6 flex flex-col gap-3 text-center">
        <h3 class="text-body text-white font-semibold">Q. 질문 텍스트?</h3>
        <p class="text-body text-white/60">A. 답변 텍스트.</p>
      </div>
    </div>
  </div>
</section>
```

---

### 19. Warranty (보증/정책) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-brand-gradient" id="section-warranty">
  <div class="content-narrow flex flex-col items-center gap-8 text-center">
    <h2 class="text-section text-white text-shadow-subtle">품질에 대한 자신감</h2>
    <p class="text-body text-white/70">서브 카피</p>
    <div class="w-full grid grid-cols-3 gap-4">
      <div class="glass-card p-6 flex flex-col items-center gap-3">
        <h3 class="text-item text-white">보증 항목 1</h3>
        <p class="text-body text-white/60">설명</p>
      </div>
      <div class="glass-card p-6 flex flex-col items-center gap-3">
        <h3 class="text-item text-white">보증 항목 2</h3>
        <p class="text-body text-white/60">설명</p>
      </div>
      <div class="glass-card p-6 flex flex-col items-center gap-3">
        <h3 class="text-item text-white">보증 항목 3</h3>
        <p class="text-body text-white/60">설명</p>
      </div>
    </div>
    <p class="text-body text-white/80 mt-2">연락처 정보</p>
  </div>
</section>
```

---

### 20. CTABanner (중간 CTA 배너) — `stack` (반복 가능)

```html
<section class="flex items-center justify-center py-8 px-[50px] bg-dark-gradient-1" id="section-ctabanner">
  <div class="glass-card-strong w-full flex items-center justify-between px-8 py-6">
    <div class="flex flex-col gap-1">
      <h3 class="text-body text-white font-bold">배너 제목</h3>
      <p class="text-caption text-white/50">배너 설명 (선택)</p>
    </div>
    <button class="px-6 py-3 rounded-full text-small font-bold text-white" style="background: var(--brand-main);">
      신청하기
    </button>
  </div>
</section>
```

---

### 21. EventPromo (이벤트/프로그램 안내) — `stack`

```html
<section class="flex flex-col items-center section-padding bg-dark-gradient-2" id="section-eventpromo">
  <div class="content-narrow flex flex-col items-center gap-6 text-center">
    <h2 class="text-body text-white font-bold">이벤트 제목</h2>
    <p class="text-caption text-sub">이벤트 설명</p>
    <div class="flex gap-3">
      <button class="px-5 py-3 rounded-full text-small font-semibold border border-white/20 text-white/80 bg-transparent">
        옵션 1
      </button>
      <button class="px-5 py-3 rounded-full text-small font-bold text-white" style="background: var(--brand-main);">
        옵션 2
      </button>
    </div>
  </div>
</section>
```

---

### 22. CTA (구매 유도) — `composed`

```html
<section class="composed-section relative h-[800px]" id="section-cta">
  <div class="composed-layer inset-0">
    <div class="img-placeholder w-full h-full"
         data-ai-prompt="[product] emotional hero shot, cinematic, premium atmosphere"
         data-ai-style="mood">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span class="img-label">제품 감성 이미지</span>
    </div>
  </div>
  <div class="composed-layer inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
  <div class="composed-layer inset-0 bg-radial-glow opacity-30"></div>
  <div class="composed-layer bottom-0 left-0 right-0 px-[50px] pb-[80px] flex flex-col items-center gap-6 text-center">
    <h2 class="text-[48px] font-bold text-white text-shadow-hero tracking-tight leading-tight">
      액션 유도 카피
    </h2>
    <p class="text-sub" style="color: var(--brand-main);">메인 카피 반복</p>
    <div class="glass-card px-8 py-4 flex flex-col items-center gap-2">
      <p class="text-body text-white/50">가격 정보</p>
      <p class="text-answer text-white font-bold">₩000,000</p>
    </div>
    <button class="px-12 py-5 rounded-full text-[18px] font-bold text-white shadow-lg shadow-black/30" style="background: linear-gradient(135deg, var(--brand-main), var(--accent));">
      지금 구매하기
    </button>
    <p class="text-small text-white/40">무료배송 · 30일 환불보장 · 1년 무상A/S</p>
  </div>
</section>
```

---

## 시각 효과 요약

| 효과 | CSS 클래스/속성 | 사용처 |
|------|----------------|--------|
| 섹션 배경 그라데이션 | `bg-dark-gradient-1`, `bg-dark-gradient-2`, `bg-brand-gradient` | 모든 섹션 |
| 글래스 카드 | `glass-card`, `glass-card-strong` | FAQ, 리뷰, 팁, 스펙 카드 |
| 그라데이션 텍스트 | `text-gradient-brand`, `text-gradient-white` | 기능 번호, 핵심 수치 |
| 텍스트 섀도우 | `text-shadow-hero`, `text-shadow-subtle` | Hook, CTA, 브랜드 |
| 장식 분리선 | `divider-gradient`, `divider-brand` | 섹션 내 구분 |
| 브랜드 보더 | `border-brand-left` | 구성품, 포인트 카드 |
| 히어로 오버레이 | `hero-overlay`, `bg-gradient-to-t` | Hook, PainPoint, CTA |
| 브랜드 글로우 | `bg-dark-brand-glow`, `bg-radial-glow` | FeatureDetail, CTA |
| 번호 배지 | `num-badge` | FeaturesOverview |
| 체크 아이콘 | `check-item` | PainPoint, Target |
