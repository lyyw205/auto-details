# /generate-html — HTML/CSS 상세페이지 조합

## Purpose
선택된 HTML 위젯들을 **조합하고 커스터마이징**하여
**self-contained HTML/CSS 단일 파일**을 생성합니다.
위젯이 이미 HTML이므로, JSON→HTML 변환 없이 **직접 조합**합니다.

## Context
- HTML 골격: `templates/html-base.html`
- **위젯 셀렉션**: `output/{product}-widget-selection.json` (`/select-widgets` 결과)
- 위젯 파일: `widgets/{taxonomy_id_lower}/*.widget.html`
- 스타일 프리셋: `widgets/_presets/preset--*.json`
- `skills/section-taxonomy.json`에서 **플랜 포함 섹션의 `copywriting_guide`만** selective 로딩
- 미리보기: 브라우저에서 직접 열기

## Input
1. **위젯 셀렉션**: `/select-widgets`에서 유저가 확인한 최종 선택 결과
   - `output/{product}-widget-selection.json`
   - 각 섹션별 선택된 위젯 ID, 파일 경로, 스타일 프리셋
2. **제품 정보**:
   - 제품명, 브랜드명
   - 제품 설명 텍스트
   - 핵심 기능 목록
   - 가격 정보 (선택)
   - 브랜드 컬러: `brand_main` (필수), `accent` (선택, 없으면 brand_main의 밝은 변형)
3. **수정 요청**: (선택) 위젯 구조에서 변경할 사항

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
    <!-- 위젯 HTML 순서대로 조합 -->
  </div>
</body>
</html>
```

**치환 규칙**:
- `{{PRODUCT_NAME}}` → 실제 제품명
- `{{BRAND_MAIN}}` → 실제 brand_main hex (예: `#2E7DF7`)
- `{{ACCENT}}` → 실제 accent hex (예: `#60A5FA`)
- `{{SECTIONS}}` → 조합된 섹션 HTML

### 2. 위젯 로딩 + 컬러 리매핑

위젯 셀렉션에서 각 섹션의 `.widget.html` 파일을 순서대로 로드합니다.

#### 컬러 리매핑 규칙

위젯 HTML에 포함된 소스 프리셋의 brand/accent hex 색상을 CSS 변수로 치환합니다:

1. **소스 프리셋 로드**: 위젯의 `source_ref`에 해당하는 프리셋 파일에서 `color_system` 읽기
2. **hex → CSS 변수 치환**:

| 위젯 HTML 내 색상 | 치환 대상 |
|-------------------|----------|
| 소스 프리셋의 `brand_main` hex | → `var(--brand-main)` |
| 소스 프리셋의 `accent` hex | → `var(--accent)` |
| `#FFFFFF`, `#888888`, `#666666` 등 중립색 | → 그대로 유지 |
| 소스 프리셋의 `dark_1`/`dark_2` | → 밝기 유지하며 다크 배경으로 사용 |

3. **컬러가 포함된 Tailwind 클래스**도 확인하여 필요시 인라인 스타일로 대체

### 3. 콘텐츠 치환

위젯 HTML 내 placeholder를 실제 제품 정보로 교체합니다:

| Placeholder | 치환 대상 |
|-------------|----------|
| `[브랜드명]` | 실제 브랜드명 |
| `[제품명]` | 실제 제품명 |
| `[메인 카피]` | 제품 특성 기반 생성 (taxonomy의 `copywriting_guide` 참고) |
| `[서브 카피]` | 제품 설명 기반 생성 |
| `[기능명]`, `[설명]` | 핵심 기능 목록에서 매핑 |
| `[가격]` | 실제 가격 정보 |
| `[product]` in `data-ai-prompt` | 실제 제품명 (영문) |

#### 카피라이팅 규칙
- **텍스트 정렬**: 기본 `text-center`, 나열형만 `text-left`
- **줄바꿈**: `<br>` 사용, 들여쓰기 금지
- **긴 텍스트**: `max-w-[760px]` 적용
- **시맨틱 컬러**: `style="color: var(--brand-main)"` 등 CSS 변수 사용
- **카피라이팅**: taxonomy의 `copywriting_guide` 참고

### 4. 섹션 조합 + 배경 교차 검증

위젯 HTML을 셀렉션 순서대로 `page-canvas` 안에 배치합니다.

#### 배경 교차 규칙
인접 섹션 배경이 겹치지 않도록 사후 검증:
- Hook, PainPoint, CTA: `composed` (배경 이미지 사용)
- Solution, BrandName, Target, Warranty: `bg-brand-gradient`
- Differentiator: `bg-accent-gradient`
- 나머지: `bg-dark-gradient-1` ↔ `bg-dark-gradient-2` 교차

같은 배경이 연속되면 위젯 HTML의 배경 클래스를 교체합니다.

### 5. FeatureDetail 좌우 교차

FeatureDetail 섹션은 split composition에서 **홀짝 교차**합니다:
- **홀수 번호** (01, 03, 05): 텍스트 좌측 / 이미지 우측
- **짝수 번호** (02, 04, 06): 이미지 좌측 / 텍스트 우측

위젯의 원래 방향과 다르면 `grid-cols-2` 내 child 순서를 swap합니다.

### 6. 이미지 플레이스홀더 커스터마이징

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

- `data-ai-prompt`의 `[product]` → 실제 제품명 (영문)
- 제품 특성 반영하여 프롬프트 보강
- `img-label`을 실제 제품에 맞게 업데이트

### 7. html.to.design 호환 규칙

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

### 8. 인라인 검증 체크리스트

HTML 조합 완료 후, 아래 항목을 자체 검증합니다:

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
- [ ] 소스 프리셋의 brand/accent hex가 CSS 변수로 치환되었는가
- [ ] 모든 placeholder(`[브랜드명]`, `[제품명]` 등)가 실제 값으로 치환되었는가

검증 통과 시 → 파일 저장
검증 실패 시 → 실패 항목 수정 후 재저장

## Output
- 파일: `output/{product}-detail.html`
- 미리보기 안내: `브라우저에서 직접 열어 확인 가능`
- Figma 변환: `html.to.design (Figma 플러그인)으로 가져오기`
