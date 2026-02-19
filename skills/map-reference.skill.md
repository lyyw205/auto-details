# /map-reference — 레퍼런스 이미지 매핑 스킬

## 개요

Gemini Vision API 기반 매핑 시스템(Next.js 웹앱)을 사용하여 레퍼런스 이미지의 요소를 정확한 좌표로 감지하고, 인터랙티브하게 편집합니다.

## 사전 조건

- `mapping/.env.local`에 `GEMINI_API_KEY` 설정 필요
- Node.js 18+ 필요

### HF_TOKEN (선택)
- Hugging Face 모델 기반 Pass 2 감지에 필요
- 미설정 시 경고 표시 + Pass 1 결과만으로 진행 여부 유저에게 확인
- 없어도 기본 매핑은 정상 동작

## 실행 방법

### 1. 매핑 서버 시작

```bash
cd mapping && npm install && npm run dev
```

서버가 `http://localhost:3000`에서 실행됩니다.

### 2. 워크플로우

1. **브라우저에서 `http://localhost:3000` 접속**
2. **레퍼런스 이미지 업로드** — 드래그앤드롭 또는 파일 선택
3. **Gemini 2.5 Flash 자동 감지** — 이미지 내 요소(텍스트, 이미지, 버튼, 아이콘 등)를 자동으로 바운드 감지
4. **인터랙티브 편집** — 유저가 바운드를 직접 수정:
   - 바운드 이동 (드래그)
   - 바운드 리사이즈 (핸들 드래그)
   - 타입 변경 (text, image, background, button, icon, input, container, other)
   - 라벨 수정
   - 바운드 추가/삭제
5. **Export** — 편집 완료 후 결과물 저장

### 3. 결과물 저장

Export 후 결과물이 자동으로 프로젝트 루트 `output/` 폴더에 저장됩니다:

- `output/mapping-{name}.json` — 바운드 데이터 (요소 좌표 + 타입 + 라벨)

## Input

| 항목 | 설명 |
|------|------|
| 레퍼런스 이미지 | PNG/JPG (1장 이상) |
| 레퍼런스 이름 | 영문 소문자 + 하이픈 (예: `ref-terive`) |

## Output

### Bounds JSON (`output/mapping-{name}.json`)

```json
[
  {
    "id": "uuid",
    "type": "text|image|background|button|icon|input|container|other",
    "label": "메인 카피",
    "x": 15.5,
    "y": 8.2,
    "w": 69.0,
    "h": 5.3,
    "zIndex": 2,
    "content": "감지된 텍스트 내용"
  }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 고유 UUID |
| `type` | string | 요소 타입 (`text`, `image`, `background`, `button`, `icon`, `input`, `container`, `other`) |
| `label` | string | 요소 라벨 (한글) |
| `x`, `y` | number | 좌상단 좌표 (% 단위, 0-100) |
| `w`, `h` | number | 너비/높이 (% 단위, 0-100) |
| `zIndex` | number | z-index 순서 |
| `content` | string | 감지된 텍스트 내용 (텍스트 요소의 경우) |

## 유저에게 표시

```
=== 매핑 서버 안내 ===

1. 매핑 서버를 시작합니다: cd mapping && npm run dev
2. 브라우저에서 http://localhost:3000 접속
3. 레퍼런스 이미지를 업로드하세요
4. Gemini가 자동 감지한 바운드를 확인/편집하세요
5. 편집 완료 후 Export 버튼을 클릭하세요

결과물:
- output/mapping-{name}.json (바운드 데이터)

편집이 완료되면 알려주세요. register-widgets로 위젯을 등록하겠습니다.
```

## 다음 단계

매핑 완료 후 `/register-widgets` 스킬로 위젯을 레지스트리에 등록합니다.
