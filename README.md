# KKuTu on Discord

현재 탭을 감지해 끄투 사이트에 접속시 Discord Rich Presence를 갱신하는 브라우저 익스텐션입니다.

## 1) Discord 앱 생성

1. Discord Developer Portal에서 새 앱 생성
2. 앱의 Client ID 복사
3. (선택) Rich Presence Asset에 `browser` 이미지 키 등록

## 2) 브리지 서버 실행

`bridge` 폴더에서 아래 명령 실행:

```powershell
npm install
npm start
```

기본 수신 주소: `http://127.0.0.1:32145`

## 3) 확장 로드

1. 브라우저의 확장 프로그램 페이지 열기
2. 개발자 모드 켜기
3. 압축해제된 확장 프로그램 로드에서 현재 폴더 선택
4. 팝업에서 Client ID 입력 후 저장

## 4) 동작 방식

- 탭 전환/업데이트 이벤트를 `background.js`가 감지
- `POST /activity`로 제목/주소 전달
- 브리지 서버가 Discord RPC에 `setActivity` 호출

## 주의사항

- Discord 데스크톱 앱이 실행 중이어야 합니다.
- 주소 노출이 민감하면 팝업에서 "도메인 대신 경로 포함 URL 전송" 옵션을 끄세요.
- 브리지 서버는 로컬(127.0.0.1)에서만 리슨합니다.

## 라이센스

Apache License 2.0