# /product-to-html — 제품 → HTML 상세페이지 에이전트 (v2)

## 역할
제품 정보를 받아 섹션 설계 → **위젯 선택** → **HTML 조합**까지의
3단계 파이프라인을 오케스트레이션합니다.

위젯 시스템을 사용하여 섹션별로 최적의 HTML 위젯을 선택하고,
브랜드 컬러를 리매핑하여 self-contained HTML 파일을 생성합니다.
위젯이 이미 HTML이므로 변환 없이 **직접 조합**합니다.

## 워크플로우

```
제품 정보 제공
       ↓
[Step 1] /plan-sections          (기존 스킬, 변경 없음)
  → skills/plan-sections.skill.md 실행
  → output/{product}-section-plan.json 저장
  → 유저에게 섹션 플랜 표시:
    • 총 섹션 수 (12~16개)
    • 섹션 목록 (순서 + ID + 카테고리)
    • 카테고리 분포
  → [OPTIONAL] 유저 수정 요청 수렴 → 플랜 업데이트
       ↓
[Step 2] /select-widgets
  → skills/select-widgets.skill.md 실행
  → output/{product}-widget-selection.json 저장
  → 섹션별 선택된 위젯 표시:
    • 각 위젯의 소스, 점수, 대안
    • 스타일 프리셋
    • 폴백 섹션 (위젯 없어서 자동 생성)
  → [BLOCKING] 유저가 위젯 선택을 확인/교체할 때까지 대기
       ↓
[Step 3] /generate-html          (조합 스킬)
  → skills/generate-html.skill.md 실행
  → 선택된 .widget.html 파일들을 읽어 조합
  → 컬러 리매핑: 소스 프리셋 hex → CSS 변수
  → 콘텐츠 치환: placeholder → 실제 제품 정보
  → output/{product}-detail.html 저장
  → 브라우저 프리뷰 안내
```

## 입력 요구사항
- **제품명** (한글 + 영문)
- **제품 설명** (특징, 기능, 차별점)
- **핵심 기능 수** (기본: 6)
- **브랜드 컬러**: `brand_main` hex (필수), `accent` hex (선택)
- (선택) **스타일 선호**:
  - 프리셋 ID: `"preset--ref-reference3"` (특정 레퍼런스 스타일)
  - style_tags: `["미니멀", "클린"]` (키워드 기반)
  - `"auto"` (자동 추천)
- (선택) 가격, 필수/제외 섹션

## 블로킹 포인트
- **Step 1 완료 후**: 유저 수정 요청 없으면 자동 진행
- **Step 2 완료 후**: 유저가 위젯 선택을 확인할 때까지 **대기** (자동 진행 안 함)

## 생성되는 파일들
| 단계 | 파일 | 설명 |
|------|------|------|
| Step 1 | `output/{product}-section-plan.json` | 섹션 플랜 |
| Step 2 | `output/{product}-widget-selection.json` | 위젯 선택 결과 |
| Step 3 | `output/{product}-detail.html` | HTML/CSS 상세페이지 (최종) |

## 에러 처리
- **Step 3 검증 실패 → 자동 수정 후 재저장** (1회)
  - generate-html의 인라인 검증 체크리스트 기반
  - 실패 항목을 수정하여 HTML 재생성
- **2회 연속 실패**: 에러 상세 표시 + 수동 수정 안내

## 참조 스킬/파일
- `skills/plan-sections.skill.md` (변경 없음)
- `skills/select-widgets.skill.md`
- `skills/generate-html.skill.md` (조합 스킬)
- `widgets/_registry.json` (위젯 레지스트리)
- `widgets/_presets/*.json` (스타일 프리셋)
- `widgets/**/*.widget.html` (HTML 위젯 파일)
- `templates/html-base.html` (HTML 골격)
- `templates/html-section-patterns.md` (섹션 CSS 패턴)
