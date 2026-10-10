# My Library (구 '여백 리더')

Google Drive 폴더의 EPUB·PDF·TXT를 **맥북(Chrome)과 갤럭시 폴드(Chrome/삼성 인터넷)**에서 이어 읽는 개인용 전자책 리더. 빌드 과정 없는 PWA(정적 파일)이고, GitHub Pages로 배포한다.

- 배포 주소: https://younghki92-oss.github.io/my-library/ (저장소 `younghki92-oss/my-library`, 예전 이름 `yeobaek`)
- 사용자는 한국어로 대화한다. 답변·UI 문구·커밋 메시지 모두 한국어.
- 사용자가 GitHub Desktop에서 **직접 Push**한다. 커밋까지만 하고, push는 사용자에게 안내한다.
- 비용이 드는 서비스는 쓰지 않는다(유료 API·서버 없음). AI 기능은 사용자가 원하지 않아 제거했다.
- 예전에 만든 '서재' 앱(github.com/younghki92-oss/reader, epub.js 기반)의 사용감이 나빠 새로 만든 앱이다. 비교 기준은 **Apple Books(아이북스)**.

## 파일

| 파일 | 역할 |
|---|---|
| `index.html` | 앱 전체(HTML·CSS·JS 한 파일, 약 2900줄) |
| `sw.js` | 서비스 워커(오프라인 캐시) |
| `manifest.webmanifest` | 설치 정보 |
| `icon-*.png` | 앱 아이콘(도서관 아치 서가, PIL로 그림) |
| `.claude/launch.json` | 로컬 미리보기 서버 설정(git에서 제외) |

로컬 실행: `python3 -m http.server 8766` → http://localhost:8766/

## index.html 구조 (섹션 주석 `/* ===== … ===== */` 기준)

storage(IndexedDB `yeobaek`: books/files/state, 실패 시 메모리) → settings(`S`, localStorage `yb-settings`) → helpers → book loaders(EPUB은 JSZip으로 직접 파싱, TXT는 EUC-KR 자동 판별) → sample book → library(사이드바·검색·카드) → reader state(`R`) → rendering & pagination(CSS 다단으로 쪽 나눔) → progress → bookmarks → highlights(주석·브라켓 손잡이·선택 메뉴 `selbar`·터치 선택) → input → sheets(목차·검색·하이라이트/메모/책갈피·보기 설정·메모) → translate & dictionary → PDF(pdf.js) → 예전 '서재' 하이라이트 옮기기 → collections → Google Drive(서재 폴더 + 동기화) → device niceties.

## 핵심 설계와 이유

- **쪽 나누기는 직접 구현**(epub.js 안 씀). 예전 앱의 사용감 문제가 epub.js 보정 코드에서 왔기 때문.
- **위치·하이라이트는 "블록 번호 + 글자 오프셋"**(`{b, o}`)으로 저장한다. 글자 크기가 바뀌어도 제자리. PDF 하이라이트는 쪽 기준 비율 사각형(`rects: [{p,x,y,w,h}]`).
- 하이라이트 종류: `kind:'hl'`(노랑·색 고르기 5색) / `kind:'ul'`(빨간 밑줄, 하이라이트 위에 겹침). 메모는 `note`.
- **동기화**: Drive 앱 전용 폴더(appDataFolder)의 `yeobaek-state.json` 하나. 책별로 항목 ID + 수정 시각(`mt`, `stampItems`)으로 병합, 지운 항목은 `tomb`에 기록해 되살아나지 않게. 읽은 위치는 `locAt`이 최신인 쪽. 컬렉션은 `cols`(전체를 최신 `at`으로). Drive 책 ID는 `d:<파일ID>`.
- Google 로그인: 예전 '서재' 앱과 **같은 OAuth 클라이언트 ID**(코드의 `DEFAULT_CID`), 같은 책 폴더(`DEFAULT_FID`). 그래서 예전 앱의 `seojae-state.json`을 읽어 하이라이트를 옮길 수 있다(`applyLegacy`, 한 번만).
- **사전**: 사용자의 Apps Script 중계(`DEFAULT_RELAY`) → 표준국어대사전(`src=stdict`)·Merriam-Webster(`mw`, `mwth`). 없으면 위키낱말사전. 결과는 출처별로 도착하는 대로 표시하고 기기에 캐시(`yb-lk`).
- **번역**: Chrome 내장 Translator(기기 안) → 중계 `src=tr`(Apps Script `LanguageApp`, 사용자가 아직 안 붙였을 수 있음, 하루 한 번 지원 여부 확인) → MyMemory. 기본 방향은 **영어→한국어, 한국어→영어** 고정, 프랑스어는 그때그때 선택.
- 번역·사전·메모 창(`#pop`)은 **선택한 글 옆**에 화살표와 함께 뜬다(넓은 화면). 좁으면 위/아래.
- **터치 선택은 앱이 직접 관리**(`TS.range`, `setTouchRange`, `.tsel-rect`로 칠함). 터치 기기에서는 본문 `user-select:none`이고 0.3초 길게 누르면 그 순간 낱말 선택을 확정한다. 브라우저 선택을 쓰면 안드로이드 Chrome이 자기 손잡이·메뉴를 띄우고, 오래 누르면 터치를 가져가(pointercancel) 선택이 사라졌기 때문. 선택을 읽을 때는 항상 `curRange()`/`selText()`/`clearSel()`을 쓸 것. 칠(`.tsel-rect`)은 `#reader` 안에 그린다(body에 그리면 책 화면에 가려졌음).
- 오른쪽 클릭(맥)은 브라우저 메뉴 대신 여백 메뉴만.
- 메모를 쓰는 동안: 키보드는 화면을 줄이지 않고 덮는다(viewport `interactive-widget=resizes-visual`), 입력 중엔 쪽을 다시 나누지 않는다(`typing()`, `R.relayoutLater`), 다른 기기 변경은 창을 닫은 뒤 항목별로 합친다(`R.pendingRemote`, `mergeBook`). 예전엔 키보드가 올라오면 쪽이 밀리고, 동기화가 화면을 다시 그려 쓰던 메모가 사라질 수 있었다.
- 메모가 달린 문장 옆 여백에 메모 아이콘(`paintNoteMarks`, `.note-mark`): 두 쪽 보기의 왼쪽 쪽은 왼쪽 여백, 그 외엔 오른쪽 여백. 누르면 메모 창.
- `overscroll-behavior:none`으로 안드로이드의 당겨서 새로고침을 막는다. 열려 있던 책은 `yb-open`에 기억해, 새로고침되거나 앱이 다시 열려도 그 책으로 돌아간다.
- 맥(마우스·트랙패드)에서는 서재에서 책을 누르면 **책마다 새 창**(`openFromShelf`, 주소 `?book=<id>`, 창 이름 `book-<id>`라 같은 책은 기존 창을 앞으로). 책 창(`BOOK_WIN`)은 `yb-open`을 쓰지 않고, ‹를 누르면 창을 닫는다. 터치 기기는 같은 창. Cmd/Ctrl-클릭은 항상 새 창.
- 어두운 지면에서는 하이라이트를 불투명에 가까운 색 + 어두운 글자(`--hl-ink`)로(`#reader.darkpage`, 실제 바탕 밝기로 판단). 기본은 은은한 금빛 톤, 보기 설정 '어두운 화면의 하이라이트: 선명하게'(`S.hlTone`, `.hl-vivid`)면 진한 형광펜. 진한 형광펜이 기본이었을 때 맥에서 너무 쨍하다고 했음. 반투명이면 갈색으로 보였음. `<meta name="color-scheme" content="light dark">`로 브라우저의 강제 다크를 막는다. 안드로이드 Chrome의 '사이트에 어두운 테마 적용'이 켜져 있으면 노랑이 겨자·갈색으로 보인다.
- **문장 속 작은 그림**(원어 음역 낱말 등을 그림으로 넣은 책): 같은 문단에 글이 있고 높이 120px 이하면 `img.inl`로 글자처럼 줄 안에(1.15em). 흰 바탕은 `clearPaper()`가 canvas로 투명하게 바꾸고(`.ink`), 어두운 지면에선 `invert`. `mix-blend-mode`는 Chrome에서 제대로 안 그려져 쓰지 않는다. `sanitize()`가 책의 style을 지우므로 크기는 이렇게 추정한다.
- 서재: Apple Books식 사이드바(전체·읽는 중·다 읽음·표시한 책·PDF·나의 컬렉션). 표지를 컬렉션으로 끌어다 놓기(마우스는 바로, 터치는 길게). 표지 이미지는 `draggable=false`(브라우저 이미지 끌기가 우리 끌기를 취소했었음). PDF 표지엔 빨간 모서리 띠.

## 꼭 지킬 것 (실수했던 것들)

- **앱을 고치면 `sw.js`의 `CACHE`(`mylibrary-vN`)와 `index.html`의 `APP_VERSION`(`vN`)을 같이 올린다.** 안 올리면 설치된 앱에 반영이 늦다. 사이드바 아래에 버전이 보여서, 폰이 최신인지 사용자와 확인할 수 있다.
- **manifest의 `id`는 `/my-library/` 그대로.** `"./"`는 사이트 맨 앞(`/`)으로 해석되어, 같은 사이트의 **원어 성경 앱**(`/biblical-language-study-app/`, id `"./"`)과 같은 앱으로 인식됐다(Chrome이 "이름 업데이트"를 띄우고 원어 성경으로 열려 함). 원어 성경 쪽 id는 설치된 앱이 깨지지 않게 그대로 둔다.
- 서비스 워커는 앱 파일·글꼴·cdnjs만 캐시한다. 번역·사전 API를 캐시하면 다른 검색어에 예전 결과가 나왔다(`ignoreSearch` 사고).
- PDF 그리기(canvas)는 기다리지 않는다(`R.pdfDrawn`). 창이 가려져 있으면 그리기가 멈춰 열기가 멈췄었다. PDF 표지 생성은 6초 제한(`withTimeout`).
- PDF는 크기·두 쪽 보기·맞춤 설정이 바뀔 때만 다시 그린다(`pdfSizeKey`). 아니면 선택이 사라진다.
- PDF 선택 사각형은 실제 글자만(빈칸·줄바꿈 조각 제외), 선택 중엔 `.endOfContent`로 다른 쪽으로 튀지 않게.

## 테스트 방법

- 내장 브라우저 패널에서 `http://localhost:8766/` 열고 `javascript_tool`로 함수 직접 호출해 확인. 휴대폰은 `resize_window` mobile 프리셋(터치·coarse 흉내).
- 패널이 가려져 있으면 `requestAnimationFrame`과 canvas 그리기가 멈춘다 → 테스트에서 rAF 기다리지 말 것.
- Drive는 `window.gapi`/`window.getToken`을 가짜로 바꿔 시험(실제 Google 계정으로 로그인하지 않는다).
- 테스트로 만든 책·상태·파일은 끝나면 지운다.
- 커밋 전에 페이지를 새로고침하고 콘솔 오류(SyntaxError 등)를 꼭 확인한다. 한 줄 코드 안에 `//` 주석을 넣었다가 뒤의 괄호까지 주석이 되어 앱 전체가 멈춘 적이 있다.

## 커밋

한국어 메시지, 마지막 줄에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
