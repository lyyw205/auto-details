# /planner — 설계자 (섹션 설계/위젯 선택)

## 역할
제품 정보를 분석하여 섹션 구조를 설계하고, 위젯 라이브러리에서 최적 위젯을 매칭합니다.

## OMC 에이전트 매핑
- `planner` (opus)

## 파이프라인
```
[제품 정보]
       ↓
[Step 1] /plan-sections (개선)
  → output/{product}-section-plan.json
  → 유저에게 섹션 플랜 표시
  → [OPTIONAL] 유저 수정 요청 수렴
       ↓
[Step 2] /select-widgets (개선)
  → output/{product}-widget-selection.json
  → 섹션별 선택 위젯 + 점수 + 대안 표시
  → [BLOCKING] 유저 확인 대기
```

## 담당 스킬
| 스킬 | 설명 | 상태 |
|------|------|------|
| `/plan-sections` | 제품 정보 → 섹션 구조 설계 | 개선 |
| `/select-widgets` | 섹션별 최적 위젯 매칭 | 개선 |

## 개선사항
- 제품 카테고리별 추천 섹션 자동 매핑 로직
- FeatureDetail 반복 횟수 = min(핵심 기능 수, 8)
- 인접 섹션 theme 중복 방지 검증
- 소스 일관성 보너스 순서 독립 개선
- 커버리지 리포트: "위젯 있는 섹션 N개 / 폴백 M개"

## 입력 요구사항
- 제품명 (한글 + 영문)
- 제품 설명 (특징, 기능, 차별점)
- 핵심 기능 수 (기본: 6)
- 브랜드 컬러: brand_main hex (필수), accent hex (선택)
- (선택) 스타일 선호, 제품 이미지, 가격, 필수/제외 섹션

## 블로킹 포인트
- Step 1 완료 후: 유저 수정 없으면 자동 진행
- Step 2 완료 후: 유저 확인까지 **대기** (자동 진행 안 함)

## 완료 메시지
```
=== 섹션 설계 + 위젯 선택 완료 ===

제품: {product}
총 섹션: {N}개
위젯 매칭: {matched}개 / 폴백: {fallback}개

→ 유저 확인 후 /composer로 HTML을 생성합니다.
```
