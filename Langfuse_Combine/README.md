# Langfuse (React + Vite + JSX)
### 시작하기
1. git 저장소 다운로드 (JSX_Tracing 브랜치)
```shell 
$ git clone -b JSX_Tracing --single-branch https://github.com/dinoduck22/--react_langfuse.git
```
2. 다운로드 받은 파일로 이동
```shell
$ cd --react_langfuse
```
3. `.env` 파일 환경 생성 및 설정
```javascript
// 생성경로
// C:\<폴더경로>\--React_LANGFUSE/.env
; 도커내부 API 게이트웨이 사용시
VITE_INTERNAL_URL=//localhost:28099

; 로컬 API 게이트웨이 사용시
; VITE_INTERNAL_URL=//localhost:28099

; 로컬백엔드 사용시
; VITE_INTERNAL_URL=//localhost:8092

# Langfuse API credentials
VITE_LANGFUSE_BASE_URL="https://localhost:3000" # langfuse docker 주소
VITE_LANGFUSE_PUBLIC_KEY="pk-..." # 퍼블릭 키 수정 
VITE_LANGFUSE_SECRET_KEY="sk-..." # 시크릿 키 수정
```
4. npm 설치 [npm 설치 공식 사이트](https://nodejs.org/en/download)
5. npm 버전 확인
```
$ npm -v
10.9.3
```
6. 프로젝트 노드 모듈 설치
```shell
$ npm install
```
7. 프로젝트 실행
```shell
$ npm run dev
```
### 폴더구조
```
C:\<폴더경로>\--REACT_LANGFUSE
├─public
└─src
    ├─api : 컴포넌트 API 모음
    ├─components : 화면의 버튼 또는 달력창 등 컴포넌트 모음
    │  ├─AddToDatasetModal : 트레이싱 페이지 데이터셋 추가 버튼
    │  ├─ChatBox : 프롬프트 및 플레이그라운드 Chat 모드에서 사용하는 입력 칸
    │  ├─CodeBlock : 코드 블럭 텍스트 상자
    │  ├─Comments : 페이지 별 코멘트 작성
    │  ├─DataTable : 트레이싱 및 세션 페이지의 테이블
    │  ├─DateRange : 달력
    │  ├─FilterButton : 필터 버튼
    │  ├─FilterControls : 필터 버튼 종류 설정
    │  ├─Form : 입력 창
    │  ├─Layouts : 세부 화면 레이아웃 설정 파일
    │  ├─LineNumberedTextarea : 코드 블럭 텍스트 상자 (추후 삭제)
    │  ├─PageHeader : 페이지 헤더 부분 (모든 페이지 공통)
    │  ├─SearchInput : 검색 창
    │  ├─SidePanel : 오른쪽에서 나타나는 사이드 패널
    │  └─Toast : 알림 창
    ├─data : 더미(가짜) 데이터 파일 모음
    ├─hooks : 함수 기능 모음
    ├─layouts : 홈 화면 및 기본 페이지 레이아웃 모음
    ├─lib : langfuse 연결 초기 설정
    └─Pages : 각 페이지들 폴더별로 정리
        ├─Prompts : 프롬프트
        ├─Settings : 설정
        │  ├─form
        │  └─layout : 설정 페이지의 레이아웃 모음
        └─Tracing : 트레이싱
            └─Sessions : 세션
```