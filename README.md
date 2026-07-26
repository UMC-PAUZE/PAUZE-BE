# PAUZE-BE

### 배포 (Elastic Beanstalk)

- `main` push 또는 Actions `workflow_dispatch` → `.github/workflows/deploy.yml`
- 환경: `pauze-dev` / `Pauze-dev-env` (`ap-northeast-2`)
- Health: `GET /api/health` (예: `https://pauze.cloud/api/health`)
- 앱 env는 GitHub Secret **`APP_ENV`** 하나에 `.env` 전체를 넣고, 배포 시 EB로 자동 반영

**필수 Secrets**

| Secret | 값 |
| --- | --- |
| `AWS_ROLE_TO_ASSUME` | `arn:aws:iam::693517970690:role/pauze-be-github-actions` |
| `APP_ENV` | 로컬 `.env` 파일 내용 전체 (KEY=VALUE 줄들) |

`APP_ENV`에 최소 포함: `DB_*`, `REDIS_*`, `JWT_*`, `SMTP_*`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_PUBLIC_BASE_URL`. `PORT`는 있어도 무시됨.

### 브랜치 전략

- `feat -> develop -> main` 순으로 merge
- 브랜치명: `타입/이슈번호-기능명`
    - `feat`: 각 기능 개발 브랜치
        - ex) feat/8~~
    - `develop`: 각 기능 개발 완료 및 테스트 완료 후 병합하는 브랜치
    - `main`: 최종 배포 브랜치


### 이슈 규칙

- 제목 형식: `[FEAT] 이슈명`
- 작성자 Assign 등록
- label 설정
- type 설정
- todo 체크리스트 작성


### PR 규칙

- 제목 형식: [FEAT] PR제목
- label 설정
- Code Review 요청 / 작성자 Assign
- PR 확인한 사람은 확인 코멘트 달기
- 작성자 외 1명 확인 후 merge

### 라벨

| **type** | **의미** | **예시** |
| --- | --- | --- |
| ⭐ **feat** | 새로운 기능 | 로그인 API 구현 |
| 🐞 bug | 버그 수정 | NPE 해결 |
| 📖 **docs** | 문서 수정 | README 업데이트 |
| ⚙️ **setting** | 프로젝트/환경 설정 | yml, CI, Gradle 설정 변경 |
| **♻️ refactor** | 기능 변화 없는 코드 리팩터링 | Service 분리 |
| 🎨 **style** | 포맷/세미콜론/네이밍 등 | 포맷팅, 공백 |
| 🧪 **test** | 테스트 코드 | Controller 단위 테스트 |
| 🚀 deploy | 배포, dev→main |  |

### 커밋메시지

- ✅ Good

```tsx
feat: 핀 삭제 기능 추가
fix: 내용이 200자 미만일 경우 요청 전송 방지
```

- ❌ Bad

```tsx
수정함
업데이트함
최종
최최종
최최최종
진짜마지막최종
```

### 네이밍 및 키

- 카멜케이스

```tsx
// Good
userName
createdAt
orderItemCount
```

```tsx
// Bad
BunYukByunSoo
int TotalAmount = 1000;
int order_name = "치킨";
```

- 키
    - .env 파일로 관리
    - ‼️‼️‼️push하기 전 .gitignore파일에 .env 있는지 확인‼️‼️‼️
