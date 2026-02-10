# 프로젝트 요약: 피그마 상세페이지 에이전트

## 한줄 요약

AI(Claude Code)에게 제품 정보를 입력하면, **24섹션 구조의 상세페이지 레이아웃 JSON**을 자동 생성하고, Figma 플러그인으로 바로 적용하는 시스템.

---

## 전체 워크플로우

```
제품 정보 입력 → Claude Code가 JSON 생성 → Figma 플러그인으로 레이아웃 적용 → 이미지 교체/편집
```

---

## 폴더 구조 및 파일 설명

```
figma-detail-page-agent-main/
│
├── CLAUDE.md                    # AI 에이전트 작업 지침서 (프로젝트 컨텍스트)
├── README.md                    # 프로젝트 소개 및 사용법
├── QUICKSTART-GUIDE.md          # 단계별 빠른 시작 가이드
├── PROJECT-SUMMARY.md           # 이 파일 (프로젝트 요약)
│
├── figma-plugin/                # Figma 플러그인 (3개 파일)
│   ├── manifest.json            # 플러그인 메타데이터 설정
│   ├── code.js                  # 플러그인 핵심 로직 (580줄)
│   └── ui.html                  # 플러그인 UI 인터페이스 (290줄)
│
├── templates/                   # 상세페이지 구조 정의
│   └── detail-page-structure.json  # 24섹션 템플릿 스키마 (~30KB)
│
└── 크래프트볼트/                 # 기준 예제 (실제 완성 결과물)
    └── craftvolt-chainsaw-v3-final.json  # 체인톱 상세페이지 (~55KB)
```

---

## 핵심 구성 요소 상세

### 1. Figma 플러그인 (`figma-plugin/`)

JSON 데이터를 Figma 캔버스에 자동으로 레이아웃으로 변환하는 플러그인.

| 파일 | 역할 | 주요 내용 |
|------|------|----------|
| `manifest.json` | 플러그인 설정 | 이름: "Detail Page Layout Generator", Figma API 1.0.0 |
| `code.js` | 메인 로직 | JSON 파싱 → Figma 노드 생성 (섹션, 텍스트, 이미지, 버튼 등) |
| `ui.html` | 사용자 인터페이스 | JSON 입력창 + 생성/취소 버튼 + 상태 표시 |

**code.js 주요 기능:**
- `createLayoutFromData()` - 전체 레이아웃 프레임 생성 (너비 860px, 수직 Auto Layout)
- `createSection()` - 개별 섹션 생성 (배경색, 패딩, 자식 요소 배치)
- `createNode()` - 노드 타입별 분기 처리 (TEXT, IMAGE, FRAME, BUTTON 등)
- `createComplexNode()` - 그리드/리스트형 복합 노드 (FAQ, 비교표, 리뷰 등)
- `createImageNode()` - 이미지 영역 (URL/Base64 지원, 플레이스홀더 표시)
- `createButton()` / `createPriceBox()` / `createBadgeRow()` - 특수 UI 요소
- `hexToRgb()` - HEX 색상 → Figma RGB 변환
- 폰트: Inter (Regular, Medium, Semi Bold, Bold)

**지원하는 노드 타입:**
`TEXT`, `IMAGE`, `IMAGE_AREA`, `FRAME`, `SECTION`, `GRID`, `STEPS`, `CHECKLIST`, `PRODUCTS`, `REVIEWS`, `FEATURES`, `INGREDIENTS`, `COMPARISON`, `FAQ`, `SPECS`, `BUTTON`, `PRICE_BOX`, `STATS`, `BADGES`, `SAFETY_BADGE`, `RECTANGLE`

### 2. 템플릿 구조 (`templates/detail-page-structure.json`)

24개 섹션의 표준 구조를 정의하는 스키마 파일. 각 섹션별로 다음을 포함:
- `order`, `id`, `name` - 섹션 식별 정보
- `purpose` - 섹션의 목적
- `height`, `background` - 레이아웃 기본값
- `required_elements` - 필수 구성 요소 (타입, 이름, 역할, 스타일)
- `copywriting_guide` - 카피라이팅 가이드

### 3. 기준 예제 (`크래프트볼트/craftvolt-chainsaw-v3-final.json`)

크래프트볼트 21V 체인톱 상세페이지의 완성된 JSON. 새로운 상세페이지 생성 시 이 파일의 구조와 패턴을 참고하여 작업.

---

## 24섹션 구조 요약

| # | 섹션 | 핵심 역할 |
|---|------|----------|
| 01 | **Hook** | 강렬한 메인 카피로 첫인상 |
| 02 | **WhatIsThis** | 제품을 한마디로 정의 |
| 03 | **BrandName** | 브랜드명의 의미/철학 |
| 04 | **SetContents** | 구성품 안내 |
| 05 | **WhyCore** | 핵심 기능의 중요성 |
| 06 | **PainPoint** | 고객 불편함 공감 |
| 07 | **Solution** | 해결책 제시 |
| 08 | **FeaturesOverview** | 6가지 핵심 기능 한눈에 |
| 09-14 | **Feature1~6_Detail** | 각 기능 Q&A 상세 (개별 섹션) |
| 15 | **Tips** | 사용 꿀팁 |
| 16 | **Differentiator** | 핵심 차별화 |
| 17 | **Comparison** | 경쟁사 비교표 |
| 18 | **Safety** | 안전/인증/신뢰 |
| 19 | **Target** | 추천 대상 |
| 20 | **Reviews** | 고객 후기 |
| 21 | **ProductSpec** | 제품 스펙 |
| 22 | **FAQ** | 자주 묻는 질문 |
| 23 | **Warranty** | 보증/A/S 정책 |
| 24 | **CTA** | 최종 구매 유도 |

---

## 디자인 시스템

### 색상
| 용도 | 값 |
|------|---|
| 배경 다크 1 | `#111111` |
| 배경 다크 2 | `#1A1A1A` |
| 이미지 플레이스홀더 | `#2A2A2A` |
| 서브 텍스트 | `#888888` |
| 뮤트 텍스트 | `#666666` |
| 브랜드 컬러 | 제품별로 지정 (예: `#FF6B00`) |
| 강조 컬러 | 제품별로 지정 (예: `#FFD700`) |

### 타이포그래피
| 용도 | 크기 | 굵기 |
|------|-----|------|
| 메인 카피 | 56px | 700 |
| 섹션 제목 | 40-48px | 700 |
| 기능 번호 | 72px | 700 |
| 서브 제목 | 26-32px | 500 |
| 본문 | 22px | 400 |

### 레이아웃
- 캔버스 너비: **860px**
- 이미지 영역 너비: **760px**
- 텍스트 정렬: 기본 **가운데 정렬**

---

## 필요 도구

| 도구 | 용도 |
|------|------|
| **Antigravity** | Claude Code 내장 에디터 |
| **Figma Desktop** | 레이아웃 적용 및 편집 |

---

## 사용 방법 (요약)

1. Antigravity에서 프로젝트 열기
2. Claude Code에게 제품 정보 + 6가지 핵심 기능 전달
3. Claude가 24섹션 JSON 생성 → `output/` 폴더에 저장
4. JSON 복사 → Figma 플러그인에 붙여넣기 → 생성
5. Figma에서 이미지 교체 및 텍스트 편집 → 내보내기

---

## 기술 스택

- **Figma Plugin API** 1.0.0
- **JavaScript** (Vanilla, 빌드 도구 없음)
- **JSON** 기반 레이아웃 데이터 포맷
- **AI**: Claude Code (Antigravity 내장)
