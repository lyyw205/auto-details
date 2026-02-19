# /validate-mapping — 매핑 정확도 검증

## 목적

매핑 JSON(`output/mapping-{name}.json`)의 바운드 데이터를 원본 레퍼런스 이미지와 대조하여 정확도를 검증합니다. Analyzer 완료 직후, 유저 편집 전에 실행하여 오탐·누락·이상치를 사전에 걸러냅니다.

## 사전 조건

- `output/mapping-{name}.json` 존재
- `references/{name}/full-page.png` 존재
- `GEMINI_API_KEY` 환경변수 설정 (`mapping/.env.local`)
- 참조 스키마: `lib/widget-renderer/widget-schema.json` (요소 타입 정의)
- 참조 분류체계: `skills/section-taxonomy.json` (유효 taxonomy ID 목록)

## 입력

| 항목 | 경로 | 설명 |
|------|------|------|
| 매핑 JSON | `output/mapping-{name}.json` | 바운드 배열 (x, y, w, h, zIndex, type, label) |
| 레퍼런스 이미지 | `references/{name}/full-page.png` | 원본 레퍼런스 전체 페이지 이미지 |

---

## 실행 단계

### Step 1: 구조 검증 (자동)

매핑 JSON을 파싱하여 아래 규칙을 자동으로 검사합니다. Vision AI 호출 없이 즉시 실행됩니다.

#### 1-1. 캔버스 범위 초과 검사
- 조건: `x + w > 100` 또는 `y + h > 100`
- 판정: ❌ 범위 초과 (캔버스 밖으로 벗어난 바운드)

#### 1-2. 비정상 중복 감지
- 조건: 동일 `zIndex`를 가진 두 요소가 **90% 이상 겹침**
- 겹침 면적 계산: IoU (Intersection over Union) ≥ 0.9
- 판정: ⚠️ 중복 의심 (동일 레이어에 거의 같은 위치의 두 바운드)

#### 1-3. 최소 크기 검사
- 조건: `w < 1` (너비 1% 미만) 또는 `h < 0.5` (높이 0.5% 미만)
- 판정: ⚠️ 노이즈 의심 (너무 작은 바운드)

#### 1-4. 타입-크기 비율 검사
- 조건: `type === "text"` 이고 `w > 90`
- 판정: ⚠️ 컨테이너 의심 (텍스트 타입이지만 너비가 90% 이상 → `container`로 변경 필요)

구조 검증 오류/경고 요약을 Step 3 리포트에 포함합니다.

---

### Step 2: Vision AI 대조 검증 (핵심)

Gemini Vision API를 사용하여 원본 이미지와 바운드 오버레이를 비교합니다.

#### 2-1. 오버레이 이미지 생성

매핑 JSON의 각 바운드를 레퍼런스 이미지 위에 시각적으로 렌더링합니다.

- 각 바운드를 반투명 색상 사각형으로 표시 (타입별 색상 구분)
- 사각형 내부 또는 좌상단에 `id` + `label` 텍스트 오버레이
- 타입별 색상:
  - `text`: 파란색 (#3B82F6, 투명도 30%)
  - `image`: 초록색 (#10B981, 투명도 30%)
  - `background`: 회색 (#6B7280, 투명도 20%)
  - `button`: 주황색 (#F59E0B, 투명도 30%)
  - `icon`: 보라색 (#8B5CF6, 투명도 30%)
  - `input`: 하늘색 (#06B6D4, 투명도 30%)
  - `container`: 분홍색 (#EC4899, 투명도 20%)
  - `other`: 빨간색 (#EF4444, 투명도 30%)

#### 2-2. Vision AI 요청

원본 레퍼런스 이미지 + 오버레이 이미지 2장을 Gemini Vision에 전송합니다.

**프롬프트:**
```
다음 두 이미지를 비교하세요:
1) 원본 레퍼런스 이미지
2) 매핑 바운드가 오버레이된 이미지

각 바운드(id, label)에 대해 원본 이미지의 실제 요소와 정확히 일치하는지 평가하세요.

각 요소에 대해 다음 형식으로 답변하세요:
- verdict: "accurate" | "partial" | "mismatch" | "missed"
- score: 0-100 (일치도)
- suggestion: 수정 제안 (partial/mismatch인 경우만, 한글로)

또한 원본 이미지에서 바운드가 없는 중요 요소가 있으면 missed로 보고하세요.
```

#### 2-3. 판정 기준

| 판정 | 기호 | 기준 | score 범위 |
|------|------|------|-----------|
| 정확 | ✅ | 바운드가 요소를 정밀하게 감싸고 있음 | 95~100 |
| 부분 일치 | ⚠️ | 방향은 맞으나 크기/위치 오차 존재 | 70~94 |
| 불일치 | ❌ | 대상 영역이 크게 벗어나거나 빈 공간 포함 | 0~69 |
| 누락 | ❓ | 이미지에 보이지만 바운드가 없음 | — |

---

### Step 3: 요소별 리포트 출력

Step 1 + Step 2 결과를 통합하여 리포트를 생성합니다.

- **전체 정확도 점수** (0–100%)
  - `정확` 수 / (`전체 요소 수` + `누락 수`) × 100
- **요소별 판정 목록**: id, label, verdict, score, suggestion
- **구조 검증 이슈 목록**: 범위 초과, 중복 의심, 노이즈, 컨테이너 의심
- **통과 여부**: `overall_accuracy ≥ 95` AND `mismatch 수 = 0`

---

## 통과 기준

| 조건 | 값 |
|------|-----|
| 전체 정확도 | **95% 이상** |
| 불일치(`mismatch`) 수 | **0** |

두 조건을 모두 만족해야 `"pass": true`입니다.

---

## 출력

### 검증 결과 JSON (`output/validation-{name}.json`)

```json
{
  "type": "MAPPING_VALIDATION",
  "ref_name": "{name}",
  "validated_at": "ISO 8601 형식 현재 시각",
  "overall_accuracy": 87,
  "total_elements": 15,
  "accurate": 11,
  "partial": 2,
  "mismatch": 1,
  "missed": 1,
  "pass": false,
  "threshold": 95,
  "structural_issues": [
    { "id": "text-3", "label": "설명 텍스트", "issue": "container_suspect", "detail": "type=text 이지만 w=92.4%, container 타입 변경 권장" }
  ],
  "details": [
    { "id": "text-1", "label": "메인 카피", "verdict": "accurate", "score": 98 },
    { "id": "img-2", "label": "제품 이미지", "verdict": "partial", "score": 82,
      "suggestion": "하단 경계를 3% 아래로 확장 필요" },
    { "id": "text-4", "label": "CTA 버튼", "verdict": "mismatch", "score": 45,
      "suggestion": "x 좌표를 35%로, w를 30%로 수정 필요" },
    { "id": null, "label": "배경 그라디언트", "verdict": "missed", "score": null,
      "suggestion": "전체 배경 요소(x:0, y:0, w:100, h:100) 바운드 추가 필요" }
  ]
}
```

| 필드 | 설명 |
|------|------|
| `overall_accuracy` | 전체 정확도 (0–100 정수) |
| `total_elements` | 매핑 JSON의 전체 바운드 수 |
| `accurate` | verdict가 `accurate`인 수 |
| `partial` | verdict가 `partial`인 수 |
| `mismatch` | verdict가 `mismatch`인 수 |
| `missed` | 이미지에 있지만 바운드 없는 수 |
| `pass` | 통과 여부 (boolean) |
| `threshold` | 통과 기준 점수 (항상 95) |
| `structural_issues` | Step 1 구조 검증 이슈 목록 |
| `details` | 요소별 상세 판정 |

---

## 실패 시 처리

### 통과 기준 미달 (`pass: false`)

수정이 필요한 영역을 우선순위 순으로 안내합니다:

1. **❌ 불일치 요소** — 즉시 수정 필수
2. **❓ 누락 요소** — 바운드 추가 필요
3. **⚠️ 부분 일치 요소** — 미세 조정 권장
4. **구조 검증 이슈** — 타입/크기 수정 권장

유저가 매핑 편집기(`http://localhost:3000`)에서 수정 후 재검증을 진행할 수 있도록 안내합니다.

### Vision AI 호출 실패

- Gemini API 오류 시 Step 1 구조 검증 결과만으로 부분 리포트 생성
- `"vision_skipped": true` 필드를 결과 JSON에 추가
- 유저에게 Vision AI 없이 구조 검증만 완료되었음을 알림

---

## 유저 표시 메시지

### 통과 시 (pass: true)

```
=== 매핑 검증 완료 ✅ ===

전체 정확도: {overall_accuracy}% ({accurate}/{total_elements} 요소 정확)
결과: 통과 (기준 95%)

검증 결과가 output/validation-{name}.json에 저장되었습니다.
다음 단계: 매핑 편집기에서 최종 확인 후 register-widgets를 실행하세요.
```

### 미달 시 (pass: false)

```
=== 매핑 검증 결과 ⚠️ ===

전체 정확도: {overall_accuracy}% (기준 95% 미달)
- ✅ 정확: {accurate}개
- ⚠️ 부분 일치: {partial}개  (미세 조정 권장)
- ❌ 불일치: {mismatch}개    (수정 필수)
- ❓ 누락: {missed}개        (바운드 추가 필요)

수정이 필요한 요소:
{mismatch/missed/partial 요소 목록 + suggestion}

매핑 편집기(http://localhost:3000)에서 위 항목을 수정해 주세요.
수정 완료 후 /validate-mapping을 다시 실행하여 재검증합니다.

검증 상세 리포트: output/validation-{name}.json
```

---

## 다음 단계

- **통과 시**: 유저가 편집기에서 최종 검토 후 `/register-widgets` 실행
- **미달 시**: 유저가 매핑 편집기에서 수정 → `/validate-mapping` 재실행 → 통과 후 `/register-widgets` 실행
