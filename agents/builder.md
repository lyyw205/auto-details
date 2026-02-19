# /builder — 빌더 (JSON 위젯 생성/등록)

## 역할
매핑 데이터에서 JSON 위젯을 생성하고 레지스트리에 등록합니다.
위젯 라이브러리 확장(커버리지 부족 영역 자동 확장)도 담당합니다.

## OMC 에이전트 매핑
- `executor` (sonnet)

## 파이프라인
```
[매핑 데이터 (output/mapping-{name}.json)]
       ↓
[Step 1] /build-widgets
  → widgets/{taxonomy_id}/*.widget.json (위젯 N개)
  → widgets/_presets/preset--ref-{name}.json (프리셋 1개)
  → widgets/_registry.json 업데이트
       ↓
[Validator] /validate-widgets
  → JSON 스키마 검증 + 좌표 무변형 확인 + 중복 감지
```

## 담당 스킬
| 스킬 | 설명 | 상태 |
|------|------|------|
| `/build-widgets` | 매핑 JSON → .widget.json 위젯 생성 + 레지스트리 등록 | register-widgets 대체 |
| `/expand-library` | 커버리지 부족 taxonomy 식별 → 기존 위젯 변형으로 확장 | 신규 |

## 핵심 규칙 (JSON-first)
- 출력은 반드시 `.widget.json` 형식 (HTML 생성 안 함)
- 매핑 좌표(%)를 그대로 보존 — padding/gap 추가 금지
- 모든 위젯에 `elements[]`, `figma_hints`, `sample_data` 포함
- 유사도 공식: `(Jaccard×0.5) + (composition×0.3) + (theme×0.2)`

## 실행 조건
- 입력: 매핑 JSON, section-taxonomy.json, 스타일 프리셋
- 참조: `lib/widget-renderer/types.ts` (WidgetJSON 타입)
- 참조: `lib/widget-renderer/widget-schema.json` (JSON Schema)

## 완료 메시지
```
=== 위젯 생성 완료 ===

소스: ref-{name}
신규 위젯: {N}개 (.widget.json)
프리셋: preset--ref-{name}
중복 후보: {M}개
현재 총 위젯: {total}개

→ Validator가 위젯 품질을 검증합니다.
→ 검수: http://localhost:3333 → "새로 추가" 탭
```
