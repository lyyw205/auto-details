# /product-to-page — 제품 → 상세페이지 에이전트

## 역할
제품 정보를 받아 섹션 설계 → 템플릿 매칭 → 레이아웃 생성 → 검증까지의
4단계 파이프라인을 오케스트레이션합니다.

## 워크플로우

```
제품 정보 제공
       ↓
[Step 1] /plan-sections
  → skills/plan-sections.skill.md 실행
  → output/{product}-section-plan.json 저장
  → 유저에게 섹션 플랜 표시:
    • 총 섹션 수
    • 섹션 목록 (순서 + ID + 카테고리)
    • 카테고리 분포
  → [OPTIONAL] 유저 수정 요청 수렴 → 플랜 업데이트
       ↓
[Step 2] /match-template
  → skills/match-template.skill.md 실행
  → output/{product}-template-match.json 저장
  → 상위 3개 템플릿 추천 표시:
    • 각 템플릿의 매칭 점수
    • 매칭/누락/추가 섹션
    • 수정 필요 사항
  → [BLOCKING] 유저가 템플릿을 선택할 때까지 대기
       ↓
[Step 3] /generate-page
  → skills/generate-page.skill.md 실행
  → output/{product}-layout.json 저장
  → 미리보기 안내 (tools/preview.html)
       ↓
[Step 4] /validate-layout
  → skills/validate-layout.skill.md 실행
  → output/{product}-validation.json 저장
  → PASS: "Figma 플러그인 적용 가능합니다"
  → FAIL: 에러 표시 + Step 3 자동 재실행 (1회)
```

## 입력 요구사항
- **제품명** (한글 + 영문)
- **제품 설명** (특징, 기능, 차별점)
- **핵심 기능 수** (기본: 6)
- (선택) 선호 스타일, 브랜드 컬러, 가격, 필수/제외 섹션

## 블로킹 포인트
- **Step 1 완료 후**: 유저 수정 요청 없으면 자동 진행
- **Step 2 완료 후**: 유저가 템플릿을 선택할 때까지 **대기** (자동 진행 안 함)

## 생성되는 파일들
| 단계 | 파일 | 설명 |
|------|------|------|
| Step 1 | `output/{product}-section-plan.json` | 섹션 플랜 |
| Step 2 | `output/{product}-template-match.json` | 템플릿 매칭 결과 |
| Step 3 | `output/{product}-layout.json` | 레이아웃 JSON (최종) |
| Step 4 | `output/{product}-validation.json` | 검증 결과 |

## 에러 처리
- **Step 4 FAIL → Step 3 자동 재실행** (1회)
  - 검증 에러를 반영하여 JSON 수정 후 재생성
- **2회 연속 FAIL**: 에러 상세 표시 + 수동 수정 안내
  - `output/{product}-layout.json`을 직접 편집
  - 수정 후 `/validate-layout`만 단독 실행 가능

## 참조 스킬
- `skills/plan-sections.skill.md`
- `skills/match-template.skill.md`
- `skills/generate-page.skill.md`
- `skills/validate-layout.skill.md`
