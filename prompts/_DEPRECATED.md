# DEPRECATED — 이 폴더의 프롬프트는 더 이상 사용되지 않습니다

## 마이그레이션 안내

이 폴더의 프롬프트들은 `skills/` 폴더의 스킬 파일로 리팩토링되었습니다.

| 기존 프롬프트 | 신규 스킬 |
|--------------|----------|
| `analyze-reference.md` | `skills/analyze-ref.skill.md` |
| `generate-template.md` | `skills/generate-template.skill.md` + `skills/register-template.skill.md` |
| `recommend-template.md` | `skills/plan-sections.skill.md` + `skills/match-template.skill.md` |
| `generate-page.md` | `skills/generate-page.skill.md` + `skills/validate-layout.skill.md` |

## 에이전트 오케스트레이터

워크플로우 실행은 에이전트 파일을 참조하세요:
- `agents/ref-to-template.md` — 레퍼런스 → 템플릿 (3단계)
- `agents/product-to-page.md` — 제품 → 상세페이지 (4단계)

## 기존 파일은 참조용으로 보존됩니다
삭제하지 마세요 — 원본 로직 확인 시 유용합니다.
