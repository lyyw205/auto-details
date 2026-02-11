# /generate-html — HTML/CSS 상세페이지 생성

## Purpose
선택된 템플릿과 섹션 플랜을 기반으로, 제품 콘텐츠를 채워 넣어
**self-contained HTML/CSS 단일 파일**을 생성합니다.
Figma 플러그인 대신 **브라우저 프리뷰 → html.to.design → Figma** 워크플로우에 사용됩니다.

## Context
- HTML 골격: `templates/html-base.html`
- 섹션 패턴: `templates/html-section-patterns.md`
- 선택된 템플릿: `templates/[선택].template.json`
- 섹션 플랜: `output/{product}-section-plan.json`
- `skills/section-taxonomy.json`에서 **플랜 포함 섹션의 `copywriting_guide` + `required_elements`만** selective 로딩
- 미리보기: 브라우저에서 직접 열기

## Input
1. **선택된 템플릿**: `/match-template`에서 유저가 선택한 템플릿
2. **섹션 플랜**: 수정 사항 반영된 최종 플랜
3. **제품 정보**:
   - 제품명, 브랜드명
   - 제품 설명 텍스트
   - 핵심 기능 목록
   - 가격 정보 (선택)
   - 브랜드 컬러: `brand_main` (필수), `accent` (선택, 없으면 brand_main의 밝은 변형)
4. **수정 요청**: (선택) 추천된 템플릿에서 변경할 사항

## Processing

### 1. HTML 전체 구조

`templates/html-base.html`을 참조하여 완전한 HTML 파일을 생성합니다:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <!-- Tailwind CDN -->
  <!-- Pretendard 폰트 CDN -->
  <!-- tailwind.config 인라인 -->
  <!-- CSS 변수: --brand-main, --accent -->
  <!-- 유틸리티 CSS (glass-card, text-gradient 등) -->
</head>
<body>
  <div class="page-canvas">
    <!-- 섹션들 -->
  </div>
</body>
</html>
```

**치환 규칙**:
- `{{PRODUCT_NAME}}` → 실제 제품명
- `{{BRAND_MAIN}}` → 실제 brand_main hex (예: `#2E7DF7`)
- `{{ACCENT}}` → 실제 accent hex (예: `#60A5FA`)
- `{{SECTIONS}}` → 생성된 섹션 HTML

### 2. 섹션별 HTML 생성

`templates/html-section-patterns.md`를 참조하여 각 섹션의 HTML을 생성합니다.

#### Composition별 매핑

| Composition | CSS 패턴 | 용도 |
|-------------|---------|------|
| `stack` | `flex flex-col items-center gap-6 section-padding` | 기본 수직 나열 |
| `split` | `grid grid-cols-2` (비율 조정 가능) | 좌우 분할 |
| `composed` | `composed-section relative` + 절대 위치 레이어 | 이미지 위 텍스트 오버레이 |

#### 섹션별 composition 선택 가이드

| 섹션 | 우선 composition | 비고 |
|------|-----------------|------|
| Hook | `composed` | 배경 이미지 + 텍스트 오버레이 |
| WhatIsThis | `stack` | 질문 → 이미지 → 설명 |
| BrandName | `stack` | 브랜드 배경 + 텍스트 중심 |
| SetContents | `stack` | 이미지 → 구성품 카드 |
| WhyCore | `split` | 텍스트/비교 좌 + 이미지 우 |
| PainPoint | `composed` | 어두운 이미지 + 공감 텍스트 |
| Solution | `stack` | 브랜드 배경 + 해결 포인트 |
| FeaturesOverview | `stack` | 이미지 + 기능 그리드 |
| FeatureDetail | `split` | Q&A + 이미지 (좌우 교차) |
| Tips | `stack` | 팁 카드 나열 |
| Differentiator | `stack` | 배지 + 비교 카드 |
| StatsHighlight | `stack` | 수치 그리드 |
| Comparison | `stack` | 비교 테이블 |
| Safety | `stack` | 인증 이미지 + 포인트 그리드 |
| Target | `stack` | 체크리스트 |
| Reviews | `stack` | 리뷰 카드 나열 |
| ProductSpec | `stack` | 스펙 테이블 |
| FAQ | `stack` | Q&A 카드 나열 |
| Warranty | `stack` | 보증 카드 그리드 |
| CTABanner | `stack` | 컴팩트 배너 |
| EventPromo | `stack` | 듀얼 버튼 |
| CTA | `composed` | 감성 이미지 + 구매 버튼 |

### 3. 콘텐츠 채우기 규칙

기존 `generate-page.skill.md`와 **동일한 카피라이팅 규칙**을 따릅니다:

- **텍스트 정렬**: 기본 `text-center`, 나열형만 `text-left`
- **줄바꿈**: `<br>` 사용 (`\n` 대신), 들여쓰기 금지
- **긴 텍스트**: `max-w-[760px]` 적용
- **시맨틱 컬러**: `style="color: var(--brand-main)"` 등 CSS 변수 사용
- **카피라이팅**: taxonomy의 `copywriting_guide` 참고

### 4. 시각 효과 가이드라인 (Distilled Aesthetics)

**v2의 핵심 차별점: 모든 섹션에 시각 효과를 반드시 적용합니다.**

#### 배경
- **단색 금지**: 모든 섹션 배경은 subtle gradient 사용
  - `bg-dark-gradient-1` (dark_1 계열)
  - `bg-dark-gradient-2` (dark_2 계열)
  - `bg-brand-gradient` (brand 계열)
  - `bg-accent-gradient` (accent 계열)
- 인접 섹션 배경은 반드시 교차: `gradient-1` → `gradient-2` → `brand` → `gradient-1` ...

#### 카드
- 모든 카드/리스트 아이템에 glassmorphism 적용
  - 기본: `glass-card` (`bg-white/5 backdrop-blur border-white/8`)
  - 강조: `glass-card-strong` (`bg-white/8 backdrop-blur border-white/12`)

#### 타이포그래피
- `tracking-tight` (hero, section title, answer)
- `text-shadow-hero` (composed 섹션의 텍스트)
- `text-shadow-subtle` (brand 배경 위 텍스트)
- `text-gradient-brand` (기능 번호, 핵심 수치)

#### 섹션 전환
- 장식 분리선: `divider-gradient` 또는 `divider-brand`
- 배경 교차로 자연스러운 전환

#### 브랜드 컬러 활용
- 카드 좌측 보더: `border-brand-left`
- 번호 배지: `num-badge`
- 텍스트 강조: `style="color: var(--brand-main)"` / `style="color: var(--accent)"`
- CTA 버튼: `linear-gradient(135deg, var(--brand-main), var(--accent))`

#### 이미지 오버레이 (composed 섹션)
- 하단 페이드: `bg-gradient-to-t from-black/80 via-black/30 to-transparent`
- 브랜드 글로우: `bg-radial-glow opacity-30`
- 항상 텍스트 위에 `text-shadow` 병행

### 5. 이미지 플레이스홀더 규칙

```html
<div class="img-placeholder w-[760px] h-[500px] rounded-xl"
     data-ai-prompt="실제 AI 이미지 프롬프트"
     data-ai-style="product_hero"
     data-ai-ratio="4:3">
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
  <span class="img-label">구체적 한글 설명</span>
</div>
```

- **`data-ai-prompt`**: 영문 AI 이미지 생성 프롬프트 (`[product]` → 실제 제품명 영문)
- **`data-ai-style`**: 스타일 타입 (`product_hero`, `product_lifestyle`, `product_detail`, `product_flat`, `infographic`, `mood`, `comparison`, `background_only`)
- **`data-ai-ratio`**: 종횡비 (`4:3`, `16:9`, `1:1`, `3:4`)
- **`img-label`**: 이미지 내 표시되는 구체적 한글 설명
- **배경색**: 다크 배경 → `#2A2A2A` (기본), 밝은 배경 → `#E8E8E8`

#### ai_prompt 커스터마이징
1. `[product]` → 실제 제품명 (영문)
2. 제품 특성 반영 추가
3. style별 핵심 키워드:

| style | 핵심 프롬프트 요소 |
|-------|-----------------|
| `product_hero` | front/45-degree view, white background, studio lighting |
| `product_lifestyle` | in-use scenario, natural lighting, real environment |
| `product_detail` | macro closeup, texture detail, extreme detail |
| `product_flat` | top-down flat lay, organized arrangement |
| `infographic` | clean design, icons, data visualization |
| `mood` | atmospheric, brand mood, cinematic |
| `comparison` | side-by-side, before/after |
| `background_only` | simple background, gradient, space for text overlay |

### 6. html.to.design 호환 규칙

**반드시 준수**해야 Figma 변환 시 정확하게 반영됩니다:

| 규칙 | 이유 |
|------|------|
| **JS 의존 레이아웃 금지** | html.to.design은 CSS만 해석 |
| **`position: fixed/sticky` 금지** | Figma에 해당 개념 없음 |
| **CSS 애니메이션/트랜지션 금지** | Figma에 해당 개념 없음 |
| **실제 HTML 텍스트만** | SVG/canvas 텍스트는 Figma에서 편집 불가 |
| **`overflow: hidden` 명시** | 원치 않는 영역 노출 방지 |
| **절대값 크기 선호** | `w-[760px]`, `h-[500px]` 등 |
| **Tailwind CDN 사용** | 인라인 스타일 최소화 |

### 7. 인라인 검증 체크리스트

HTML 생성 완료 후, 아래 항목을 자체 검증합니다 (별도 validate 스킬 불필요):

- [ ] `<!DOCTYPE html>` + `<html lang="ko">` 존재
- [ ] Tailwind CDN `<script>` 태그 존재
- [ ] Pretendard 폰트 `<link>` 태그 존재
- [ ] `--brand-main`, `--accent` CSS 변수 정의
- [ ] `.page-canvas` 래퍼 860px 고정
- [ ] 모든 섹션에 고유 `id` 속성 부여
- [ ] 모든 이미지에 `img-placeholder` 클래스 + `data-ai-prompt` 속성
- [ ] 인접 섹션 배경 교차 (같은 배경 연속 금지)
- [ ] `position: fixed/sticky` 사용하지 않음
- [ ] CSS 애니메이션/트랜지션 사용하지 않음
- [ ] 모든 카드에 `glass-card` 적용
- [ ] composed 섹션에 그라데이션 오버레이 + text-shadow 적용
- [ ] 버튼에 그라데이션 배경 적용
- [ ] 텍스트 가운데 정렬 기본, 나열형만 좌측 정렬

검증 통과 시 → 파일 저장
검증 실패 시 → 실패 항목 수정 후 재저장

## Output
- 파일: `output/{product}-detail.html`
- 미리보기 안내: `브라우저에서 직접 열어 확인 가능`
- Figma 변환: `html.to.design (Figma 플러그인)으로 가져오기`

## FeatureDetail 좌우 교차 규칙

FeatureDetail 섹션은 split composition에서 **홀짝 교차**합니다:
- **홀수 번호** (01, 03, 05): 텍스트 좌측 / 이미지 우측
- **짝수 번호** (02, 04, 06): 이미지 좌측 / 텍스트 우측

이를 통해 시각적 단조로움을 방지합니다.

## 배경 교차 패턴

```
Section 1  → bg-dark-gradient-1  (또는 composed)
Section 2  → bg-dark-gradient-2
Section 3  → bg-brand-gradient
Section 4  → bg-dark-gradient-1
Section 5  → bg-dark-gradient-2
...
```

- Hook, PainPoint, CTA: `composed` (배경 이미지 사용)
- Solution, BrandName, Target, Warranty: `bg-brand-gradient`
- Differentiator: `bg-accent-gradient`
- 나머지: `bg-dark-gradient-1` ↔ `bg-dark-gradient-2` 교차
