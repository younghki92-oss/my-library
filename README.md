# My Library

맥과 갤럭시에서 같은 방식으로 쓰는 전자책 리더(PWA)입니다. 빌드 과정 없이 정적 파일만으로 동작합니다.

## 로컬에서 실행
```
python3 -m http.server 8765
```
→ http://localhost:8765

## GitHub Pages로 배포하기
1. GitHub에서 새 저장소를 만들어요 (예: `my-library`, Public).
2. 이 폴더의 파일을 저장소에 올려요 (`git push` 또는 웹에서 Add file → Upload files).
3. 저장소 Settings → Pages → Branch를 `main` / `(root)`로 정하고 Save.
4. 1~2분 뒤 `https://<아이디>.github.io/my-library/` 에서 열려요.

## 맥·갤럭시에 설치하기
- **Mac (Chrome/Edge)**: 주소창 오른쪽 설치 아이콘 또는 서재의 ‘앱으로 설치’ → Dock에 추가되고, .epub 파일을 이 앱으로 열 수 있어요.
- **Mac (Safari)**: 파일 → Dock에 추가
- **갤럭시 (Chrome / 삼성 인터넷)**: 메뉴 → 홈 화면에 추가(앱 설치)

앱을 고친 뒤 다시 올릴 때는 `sw.js`의 `CACHE` 이름(예: `mylibrary-v1` → `v2`)을 바꿔야 설치된 앱에도 새 버전이 반영돼요.

## 파일 구성
| 파일 | 역할 |
|---|---|
| index.html | 앱 전체 (UI, EPUB/TXT 파서, 쪽 나누기, 하이라이트) |
| sw.js | 오프라인 캐시 |
| manifest.webmanifest | 설치 정보, .epub 파일 연결 |
| icon-*.png | 앱 아이콘 |

## 데이터
책, 읽은 위치, 하이라이트, 책갈피는 기기의 IndexedDB에만 저장됩니다. 기기 간 동기화는 아직 없습니다.
