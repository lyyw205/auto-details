# /product-to-html — 제품 → HTML 상세페이지 에이전트 (v2)

## 역할
제품 정보를 받아 섹션 설계 → 템플릿 매칭 → **HTML/CSS 생성**까지의
3단계 파이프라인을 오케스트레이션합니다.

v1(`/product-to-page`)의 JSON 출력 대신 **self-contained HTML 파일**을 생성합니다.
기존 plan-sections, match-template 스킬을 재사용하고, generate-page 대신 generate-html을 사용합니다.

## 워크플로우

```
제품 정보 제공
       ↓
[Step 1] /plan-sections  ← v1과 동일 (재사용)
  → skills/plan-sections.skill.md 실행
  → output/{product}-section-plan.json 저장
  → 유저에게 섹션 플랜 표시:
    • 총 섹션 수
    • 섹션 목록 (순서 + ID + 카테고리)
    • 카테고리 분포
  → [OPTIONAL] 유저 수정 요청 수렴 → 플랜 업데이트
       ↓
[Step 2] /match-template  ← v1과 동일 (재사용)
  → skills/match-template.skill.md 실행
  → output/{product}-template-match.json 저장
  → 상위 3개 템플릿 추천 표시:
    • 각 템플릿의 매칭 점수
    • 매칭/누락/추가 섹션
    • 수정 필요 사항
  → [BLOCKING] 유저가 템플릿을 선택할 때까지 대기
       ↓
[Step 3] /generate-html  ← 새 스킬 (v2 핵심)
  → skills/generate-html.skill.md 실행
  → output/{product}-detail.html 저장
  → 브라우저 프리뷰 안내
  → html.to.design → Figma 가져오기 안내
```

## v1 output 재사용

이미 `/product-to-page`로 Step 1~2를 완료한 경우:
- `output/{product}-section-plan.json` 존재 → Step 1 스킵
- `output/{product}-template-match.json` 존재 → Step 2 스킵
- 바로 Step 3 (`/generate-html`)부터 실행 가능

유저에게 확인: "이전에 생성된 섹션 플랜과 템플릿 매칭 결과가 있습니다. 재사용할까요?"

## 입력 요구사항
- **제품명** (한글 + 영문)
- **제품 설명** (특징, 기능, 차별점)
- **핵심 기능 수** (기본: 6)
- **브랜드 컬러**: `brand_main` hex (필수), `accent` hex (선택)
- (선택) 선호 스타일, 가격, 필수/제외 섹션

## 블로킹 포인트
- **Step 1 완료 후**: 유저 수정 요청 없으면 자동 진행
- **Step 2 완료 후**: 유저가 템플릿을 선택할 때까지 **대기** (자동 진행 안 함)

## 생성되는 파일들
| 단계 | 파일 | 설명 |
|------|------|------|
| Step 1 | `output/{product}-section-plan.json` | 섹션 플랜 |
| Step 2 | `output/{product}-template-match.json` | 템플릿 매칭 결과 |
| Step 3 | `output/{product}-detail.html` | HTML/CSS 상세페이지 (최종) |

## 에러 처리
- **Step 3 검증 실패 → 자동 수정 후 재저장** (1회)
  - generate-html의 인라인 검증 체크리스트 기반
  - 실패 항목을 수정하여 HTML 재생성
- **2회 연속 실패**: 에러 상세 표시 + 수동 수정 안내
  - `output/{product}-detail.html`을 직접 편집
  - 브라우저에서 결과 확인 후 수정

## v1 vs v2 비교

| 항목 | v1 (product-to-page) | v2 (product-to-html) |
|------|---------------------|---------------------|
| Step 1~2 | plan-sections → match-template | 동일 (재사용) |
| Step 3 | generate-page (JSON) | **generate-html (HTML/CSS)** |
| Step 4 | validate-layout | **인라인 검증 (별도 스킬 불필요)** |
| 출력 | layout JSON | **self-contained HTML** |
| 프리뷰 | tools/preview.html | **브라우저에서 직접 열기** |
| Figma | Figma Plugin (code.js) | **html.to.design** |
| 시각 효과 | 제한적 | **그라데이션, 글래스, 섀도우 등** |

## 참조 스킬
- `skills/plan-sections.skill.md` (재사용)
- `skills/match-template.skill.md` (재사용)
- `skills/generate-html.skill.md` (신규)
