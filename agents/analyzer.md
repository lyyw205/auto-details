# /analyzer — 분석가 (레퍼런스 분석)

## 역할
레퍼런스 이미지를 분석하여 원본 좌표 그대로의 매핑 데이터를 생성합니다.
Behance 스크래핑부터 Gemini Vision 기반 요소 감지까지 레퍼런스 분석의 전 과정을 담당합니다.

## OMC 에이전트 매핑
- `explorer` (haiku) — 탐색/조사
- `analyst` (opus) — 심층 분석

## 파이프라인
```
[Behance URL / 이미지]
       ↓
[Step 1] /scrape-reference (신규)
  → references/{name}/ 이미지 저장
       ↓
[Step 2] /map-reference (개선)
  → http://localhost:3000 에서 인터랙티브 매핑
  → output/mapping-{name}.json (바운드 데이터, % 좌표)
  (오버레이 프리뷰는 웹앱에서 실시간 — 별도 HTML 파일 불필요)
       ↓
[Validator] /validate-mapping
  → 매핑 정확도 95%+ 검증
  → PASS → 유저 편집 단계로
  → FAIL → 문제 요소 리포트 + 재실행 또는 수동 보정
       ↓
[유저 편집/검수] (매핑 웹앱에서 바운드 조정)
```

## 담당 스킬
| 스킬 | 설명 | 상태 |
|------|------|------|
| `/scrape-reference` | Behance URL에서 레퍼런스 이미지 스크래핑 | 신규 |
| `/map-reference` | Gemini Vision 기반 요소 매핑 | 개선 |

## 실행 조건
- 입력: Behance URL 또는 레퍼런스 이미지 + 레퍼런스 이름
- 필요: `mapping/.env.local`에 `GEMINI_API_KEY` 설정
- 참조: `skills/section-taxonomy.json`

## 개선사항 (vs AS-IS)
- Behance 스크래핑을 스킬로 승격 (tools/ CLI → 에이전트 직접 호출)
- HF_TOKEN 없을 때 명시적 경고 + Pass 1만으로 진행 확인
- 매핑 결과 → output/ 자동 저장 (수동 복사 제거)
- 오버레이 HTML 파일 생성 불필요 (웹앱에서 실시간 렌더링)
- Analyzer 완료 직후 Validator가 매핑 정확도 검증 (신규)

## 완료 메시지
```
=== 레퍼런스 분석 완료 ===

소스: ref-{name}
매핑 요소: {N}개
출력: output/mapping-{name}.json

→ Validator가 매핑 정확도를 검증합니다.
→ 검증 통과 후 매핑 웹앱에서 편집/검수하세요.
→ 편집 완료 후 /builder로 위젯을 생성할 수 있습니다.
```
