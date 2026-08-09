# PWA Optical Transfer — 오프라인 광학 파일 전송

> 빛으로 파일을 전송하세요. 화면과 카메라만 있으면 됩니다.

두 기기 사이에 **네트워크 없이** 파일이나 텍스트를 전송하는 PWA입니다.
한 화면이 파일을 분산 코드(fountain code) 애니메이션 QR로 표시하고,
다른 기기가 카메라로 스캔하여 파일을 복원합니다. **네트워크 경로, 계정,
페어링이 필요 없습니다.**

## 특징

- 🔒 **완전 오프라인** — 한 번 방문하면 서비스 워커로 캐싱되어 오프라인 작동
- 📦 **포터블** — 단일 HTML 파일(`dist-standalone/`)로도 작동, USB나 어디서든 사용 가능
- 🌐 **다국어 지원** — 한국어(기본), English, 日本語, 简体中文
- 📱 **PWA 설치** — iOS/Android 홈 화면에 앱처럼 설치 가능
- ⚡ **고속 전송** — 분산 코드로 최대 ~130 KB/s (기기 간)
- ✅ **무결성 보장** — SHA-256 검증, gzip 압축, 원본 파일명/미디어 타입 보존

## 사용하기

### **→ [GitHub Pages에서 열기](https://cskwork.github.io/pwa-optical-transfer/)**

두 기기에서 모두 열고 시작하면 됩니다. 설치 없이 사용 가능하며, 첫 방문 후 오프라인으로 작동합니다.

- **전송 화면**: `/send/`에서 파일이나 텍스트를 선택
- **수신 화면**: `/receive/`에서 카메라를 켜고 전송 화면을 비춤
- 최대 64 MB 파일 또는 4 MB 텍스트

### 오프라인 독립 실행 파일

`npm run build:standalone`로 생성되는 단일 HTML 파일은 네트워크 없이도 완전히 작동합니다:

- `decimen-sender.html` — 전송 전용 (USB, 이메일, 어디서든 배포)
- `decimen-receiver.html` — 수신 전용

## 직접 빌드하기

```bash
npm install
npm run dev               # 개발 서버 (HTTPS, HMR)
npm run build             # 프로덕션 빌드 → dist/
npm run build:standalone  # 독립 실행 파일 → dist-standalone/
npm run build:all         # 전체 빌드
npm test                  # 단위 테스트 (74개)
```

## 언어 전환

모든 페이지 우측 상단의 언어 스위처(KO · EN · JA · 中)로 언어를 변경할 수 있습니다.
선택은 `localStorage`에 저장되며, 브라우저 언어가 감지되지 않으면 한국어가 기본입니다.

## 기술

분산 코드(Luby Transform)를 사용하여 **어떤 순서로든** 약 K×1.15개의 프레임을 수집하면
파일을 복원할 수 있습니다. 드롭된 프레임은 시간 비용만 발생시키며, 정확성에는 영향이 없습니다.

## 라이선스

MIT — [원본 프로젝트](https://github.com/bashalarmistalt/decimen-optical-transfer) by Evan Crawley (Bash Alarmist).
