# /validator — 검증기 (파이프라인 전 단계 품질 게이트)

## 역할
모든 에이전트 산출물의 즉시 검증을 수행합니다.
매핑 정확도부터 최종 HTML까지 각 단계별 품질을 보장하는 게이트키퍼입니다.

## OMC 에이전트 매핑
- `verifier` (sonnet) — 기본 검증
- `vision` (sonnet) — Vision AI 대조 (매핑 정확도 검증 시)

## 검증 위치 — 끝이 아닌 매 단계
```
Analyzer → [Validator] → Builder → [Validator] → Planner → Composer → [Validator]
             매핑 정확도    위젯 품질                         최종 산출물
             (가장 중요)
```

## 담당 스킬
| 스킬 | 설명 | 통과 기준 | 상태 |
|------|------|----------|------|
| `/validate-mapping` | 매핑 JSON ↔ 레퍼런스 이미지 정확도 검증 | 전체 95%+ & mismatch=0 | 신규, 최우선 |
| `/validate-widgets` | JSON 위젯 스키마/좌표 무변형/메타데이터 검증 | 에러 0개 | 신규 |
| `/validate-output` | 최종 HTML 17개 체크리스트 자동 검증 | 전체 PASS | 신규 |
| `/coverage-report` | taxonomy별 위젯 커버리지 리포트 | 정보 제공 | 신규 |

### /validate-mapping (최우선)
실행 시점: Analyzer 완료 직후, 유저 편집 전

검증 3단계:
1. **구조 검증** (자동, 즉시) — 좌표 범위, 겹침, 노이즈, 타입별 비율
2. **Vision AI 대조** (핵심) — 오버레이 이미지 생성 → Vision AI 비교
3. **요소별 리포트** — 정확/부분일치/불일치/누락 판정 + 수정 제안

통과 기준: 전체 정확도 95%+ 이고 mismatch 0개

### /validate-widgets
실행 시점: Builder 완료 직후

검증 항목:
- JSON 스키마 검증 (필수 필드, 타입, 범위)
- 좌표 무변형 확인 (원본 매핑 JSON 대조)
- 메타데이터 정합성 (taxonomy, preset, figma_hints, sample_data)
- 중복 감지 (통일된 유사도 공식)

### /validate-output
실행 시점: Composer 완료 직후

17개 체크리스트:
- 구조 검증 (860px canvas, 섹션 수, id 속성)
- 스타일 검증 (CSS 변수, Tailwind CDN, Pretendard 폰트)
- 콘텐츠 검증 (placeholder 잔존 없음, ai-prompt 속성)
- 호환성 검증 (인라인 스타일, position 제한)

### /coverage-report
실행 시점: 온디맨드 또는 Pipeline C 시작 시

리포트 항목:
- taxonomy별 위젯 수 + 커버리지 %
- 스타일 다양성 (theme/composition 분포)
- 소스 레퍼런스 분포

## 실행 조건
- 입력: 각 단계의 산출물 + 원본 레퍼런스 이미지 (매핑 검증 시)
- 참조: `lib/widget-renderer/widget-schema.json` (JSON Schema)
- 참조: `skills/section-taxonomy.json`

## 완료 메시지 (검증별)
```
=== 매핑 검증 결과 ===
전체 정확도: {score}%
정확: {N}개 / 부분일치: {M}개 / 불일치: {K}개 / 누락: {L}개
결과: {PASS|FAIL}
{FAIL인 경우 수정 제안 목록}
```
