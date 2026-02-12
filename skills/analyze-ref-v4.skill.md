# /analyze-ref-v4 — 레퍼런스 이미지 픽셀 좌표 분석

## 목표

레퍼런스 이미지의 모든 텍스트·이미지 요소를 **픽셀 좌표**로 추출한다.
생성된 와이어프레임 HTML을 레퍼런스 이미지 위에 오버레이했을 때 **100% 겹치는 것**이 유일한 성공 기준이다.

## Input

- 레퍼런스 이미지 파일 (예: `references/test-sample.png`)
- 레퍼런스 이름 (예: `test-sample`)

## Output

- `output/analysis-v4-{name}.json`

---

## Process

### 1단계: 이미지 실제 크기 확인

```bash
file references/{name}.png
# 또는
identify references/{name}.png  # ImageMagick
```

실제 픽셀 크기를 기록한다: `image_width × image_height`

### 2단계: 캔버스 설정

캔버스는 860px 고정 너비. 이미지를 860px로 스케일한다.

```
scale = 860 / image_width
canvas_width = 860
canvas_height = round(image_height × scale)
```

이후 모든 좌표는 **860px 캔버스 기준 페이지 절대 좌표**로 기록한다.

### 3단계: 비율 기반 좌표 추출

> **핵심: 픽셀을 직접 추측하지 말고, 비율(%)로 먼저 추정한 뒤 픽셀로 변환한다.**

이미지를 위에서 아래로 스캔하며 모든 시각 요소를 추출한다.

#### 추출 방법

1. 이미지 전체에서 요소의 **상대 위치를 %로 추정**한다:
   - "이 텍스트는 왼쪽에서 약 21%, 위에서 약 4% 지점에 시작"
   - "이 이미지는 폭의 약 43%, 왼쪽 5% 지점부터"
2. **비율 → 픽셀 변환**: `x = canvas_width × ratio_x`, `y = canvas_height × ratio_y`
3. **5px 단위로 반올림** (위치), **10px 단위로 반올림** (크기)

#### 요소 타입

| type | 설명 | 필수 필드 |
|------|------|----------|
| `text` | 텍스트 블록 (제목, 본문, 캡션 등) | `content` (읽히는 텍스트), `fontSize` (추정) |
| `image` | 사진/이미지 영역 | `label` (한글 설명) |
| `badge` | 작은 배지/태그/라벨 | `content` (배지 텍스트) |

- 순수 장식 요소(선, 점, 그라데이션 오버레이)는 **생략**한다.
- 버튼이 있으면 `text` + `"role": "button"`으로 기록한다.
- 카드 컨테이너 안의 요소도 **각각 독립 요소로** 기록한다 (중첩 없이 플랫하게).

#### 좌표 규칙

- 모든 좌표는 **페이지 절대 좌표** (페이지 좌상단 = 0, 0)
- `x`, `y`: 5px 단위 반올림
- `w`, `h`: 10px 단위 반올림
- `x + w ≤ 860`

### 4단계: 섹션 분할

배경색이 바뀌거나 시각적으로 구분되는 영역을 섹션으로 분할한다.
각 섹션에 속한 요소를 그룹핑한다. 요소 좌표는 여전히 **페이지 절대**다.

### 5단계: 자가 검증

분석 완료 후 아래를 반드시 검증한다:

- [ ] 모든 요소의 `x + w ≤ 860` 인가?
- [ ] 모든 요소의 `y + h ≤ canvas_height` 인가?
- [ ] 대칭 배치 요소 (2열 카드 등) 의 x좌표가 실제로 대칭인가?
  - 예: 왼쪽 카드 x=30, w=390 → 끝 420. 오른쪽 카드 x=440, w=390 → 끝 830. 여백 대칭 확인.
- [ ] 섹션 높이 합 = canvas_height 인가?
- [ ] 이미지에 보이는 모든 텍스트와 이미지가 빠짐없이 추출되었는가?
- [ ] content 필드가 이미지에서 읽히는 **원문 그대로**인가? (재해석/의역 금지)

---

## Output 포맷

```json
{
  "version": "4.0",
  "reference": "ref-{name}",
  "image_file": "references/{name}.png",
  "image_size": { "width": 430, "height": 1450 },
  "canvas": { "width": 860, "height": 2900 },
  "scale": 2.0,
  "sections": [
    {
      "order": 1,
      "label": "섹션 한글 설명",
      "y": 0,
      "height": 1570,
      "background": "#F5F0E8",
      "elements": [
        {
          "type": "text",
          "x": 180, "y": 60, "w": 500, "h": 30,
          "content": "이미지에서 읽히는 원문 텍스트",
          "fontSize": 18
        },
        {
          "type": "image",
          "x": 40, "y": 165, "w": 370, "h": 390,
          "label": "한글 이미지 설명"
        },
        {
          "type": "badge",
          "x": 365, "y": 15, "w": 130, "h": 30,
          "content": "Point 03"
        }
      ]
    }
  ]
}
```

- `image_size`: 원본 이미지 실제 픽셀
- `canvas`: 860px 기준 스케일된 크기
- `scale`: canvas_width / image_width
- 좌표: 모두 canvas 기준 페이지 절대값

---

## 유저에게 표시

```
=== ref-{name} v4 분석 완료 ===

이미지: {image_width}×{image_height}px → 캔버스: 860×{canvas_height}px (scale: {scale})
섹션: {N}개
요소: 텍스트 {T}개, 이미지 {I}개, 배지 {B}개

output/analysis-v4-{name}.json 저장 완료
→ 다음: /extract-widgets-v5 로 오버레이 와이어프레임 생성
```
