# /scrape-reference — Behance 레퍼런스 이미지 스크래핑

## 목적

Behance 갤러리 URL에서 프로젝트 모듈 이미지를 자동 수집하고, 860px 너비로 스티칭하여 `references/{ref-name}/` 폴더에 저장합니다. Pipeline A의 첫 번째 단계로, 이후 `/map-reference` 스킬에서 사용할 레퍼런스 이미지를 준비합니다.

## 사전 조건

- Node.js 18+ 필요
- puppeteer, sharp 의존성 설치 필요 (최초 1회):
  ```bash
  cd tools/scraper && npm install
  ```
- 유효한 Behance 갤러리 URL 필요 (형식: `https://www.behance.net/gallery/{id}/{slug}`)
- 인터넷 연결 필요 (Behance 접근)

## 입력

| 항목 | 필수 | 설명 |
|------|------|------|
| `behance-url` | 필수 | Behance 갤러리 URL (예: `https://www.behance.net/gallery/123456/project-name`) |
| `--name <ref-name>` | 선택 | 레퍼런스 이름 (영문 소문자 + 하이픈, 예: `ref-terive`). 미입력 시 URL 슬러그에서 자동 생성 (`ref-{slug}`) |

## 실행 단계

### 1. 의존성 확인

```bash
cd tools/scraper && npm install
```

이미 설치된 경우 재실행해도 무방합니다.

### 2. 스크래퍼 실행

```bash
node tools/scraper/scrape-behance.js "<behance-url>" --name <ref-name>
```

**예시:**
```bash
# --name 지정
node tools/scraper/scrape-behance.js "https://www.behance.net/gallery/123456/project-name" --name ref-terive

# --name 생략 (URL 슬러그에서 자동 생성: ref-project-name)
node tools/scraper/scrape-behance.js "https://www.behance.net/gallery/123456/project-name"
```

스크래퍼는 내부적으로 다음을 수행합니다:
1. Puppeteer로 Behance 갤러리 페이지 열기
2. 페이지를 끝까지 스크롤하여 모든 이미지 로드
3. 프로젝트 모듈 이미지 다운로드
4. Sharp로 각 이미지를 860px 너비로 리사이즈
5. 전체 이미지를 세로 방향으로 스티칭하여 `full-page.png` 생성

### 3. 출력 확인

실행 완료 후 아래 파일이 생성됐는지 확인합니다:

```
references/{ref-name}/full-page.png       ← 스티칭된 전체 이미지
references/{ref-name}/modules/            ← 개별 모듈 이미지들
references/{ref-name}/modules/module-001.png
references/{ref-name}/modules/module-002.png
...
```

## 출력

| 파일 | 설명 |
|------|------|
| `references/{ref-name}/full-page.png` | 전체 페이지 스티칭 이미지 (860px 너비) |
| `references/{ref-name}/modules/*.png` | 개별 모듈 이미지 (860px 너비로 리사이즈) |

## 에러 처리

| 에러 상황 | 원인 | 대처 방법 |
|-----------|------|-----------|
| `Cannot find module 'puppeteer'` | 의존성 미설치 | `cd tools/scraper && npm install` 실행 후 재시도 |
| `Error: URL must be a Behance gallery URL` | 잘못된 URL 형식 | URL이 `https://www.behance.net/gallery/{id}/{slug}` 형식인지 확인 |
| 이미지 0개 수집 | 페이지 로딩 실패 또는 비공개 갤러리 | 브라우저에서 URL 직접 접근 가능한지 확인; 공개 갤러리인지 확인 |
| 네트워크 오류 / 타임아웃 | 인터넷 연결 불안정 또는 Behance 일시 오류 | 잠시 후 재시도 |
| `references/{ref-name}/` 폴더가 비어있음 | 스크래핑 도중 중단 | 폴더 삭제 후 재실행 |

## 유저 확인 메시지

```
=== 스크래핑 완료 ===

저장 위치: references/{ref-name}/
- full-page.png : 전체 스티칭 이미지 (860px)
- modules/      : 개별 모듈 이미지 {N}장

다음 단계: /map-reference 스킬로 레퍼런스를 분석하세요.
```

## 다음 단계

스크래핑 완료 후 `/map-reference` 스킬로 레퍼런스 이미지를 분석하여 섹션 바운드를 추출합니다.
