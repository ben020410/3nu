# BUILD91 복구 기준

BACKUP.json의 backupDirectory에 workspace.tar, history.bundle, FILE_INVENTORY.csv와 SHA-256 기록이 있다.
원래 작업 폴더를 덮어쓰지 않고 비어 있는 새 폴더에 복구한다.

1. archiveSha256와 bundleSha256를 실제 파일의 SHA-256와 대조한다.
2. 새 복구 폴더에 workspace.tar를 푼다. 파일 경로는 3NU 루트 기준이다.
3. Git 이력이 필요하면 history.bundle을 별도 새 폴더로 git clone한다. bundle의 HEAD는 BACKUP.json commit과 같아야 한다.
4. 아카이브에는 미커밋 HANDOFF_MAIN.md와 BUILD91 배포 영수증도 포함된다. bundle만으로 미커밋 파일이 복원된다고 가정하지 않는다.
5. 복구본의 dist를 로컬 정적 서버로 열어 확인한 뒤 기존 Sites 프로젝트에 정식 배포 절차로 재배포한다. 원본 저장소를 reset --hard하거나 강제 push하지 않는다.

게시 장애라면 해당 배포 ID·버전과 오류 시각을 먼저 남긴다. 정상 버전으로 되돌릴 때도 이미 저장된 정확한 버전 ID를 사용하고 기존 프로젝트를 유지한다. 롤백 완료는 배포 도구 성공 응답으로 확인한다.

현재 검증은 Git bundle 복제·HEAD 대조와 아카이브 4개 핵심 파일의 해시 대조다. 모든 게임 기능을 복원 환경에서 재검사했다는 뜻은 아니다.

이 백업은 같은 Mac의 다른 폴더에 있으므로 기기 분실·디스크 고장 대비가 완료된 것은 아니다. 외장 저장장치 또는 본인이 선택한 비공개 원격 저장소로 한 벌을 옮겨야 한다. 원격 복사가 끝나기 전에는 offDeviceCopy를 true로 기록하지 않는다.
