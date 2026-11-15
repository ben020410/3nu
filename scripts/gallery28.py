"""Publish our own rendered comparison frames; no external reference images."""
from pathlib import Path
from html import escape
import shutil

R = Path(__file__).resolve().parents[1]
out = R / 'dist/gallery/build28'
out.mkdir(parents=True, exist_ok=True)
items = [
    ('광장 · 네 개의 표시', '어긋난 접근 계단참, 바늘 모양 포장 틈, 삼각형 잔디·도로 조각, 건물 앞 접근면을 정리했습니다. 연속 포장면과 두 개의 식재 구획으로 교체하고 기존 중앙 계단의 높이는 보존했습니다.'),
    ('계단 상단 · 옆 통로', '작은 연결 판을 제거하고 계단과 옆 통로가 같은 높이로 만나는 넓은 회전 공간으로 교체했습니다. 기존 본관 벽의 윤곽을 빼고 통로 쪽 난간을 열었습니다.'),
    ('뒤쪽 상부 보행면 · 약학관 계단', '옥상 슬래브·보행면·지형의 중복을 제거했습니다. 위쪽 보행면과 아래 야외 통로는 별개의 높이로 유지하고 연결교는 보존했습니다.'),
    ('같은 계단의 반대 방향', '사진 3과 같은 pharmacy-near23 계단입니다. 계단을 가로지르던 도로·지형을 잘라내고 계단 밑 지면을 다시 만들었습니다. 빠져 있던 지형 경계의 옆면을 닫아 하늘색 틈을 없앴습니다.'),
    ('반대편 뒤쪽 계단', '좁은 기존 계단을 폭 6m, 두 계단 구간과 깊이 5m의 중간참으로 교체했습니다. 위·아래 접속면과 주변 사면을 같은 높이 정의로 정리했습니다.'),
    ('큰 계단의 중간참', '계단과 계단참의 폭·축을 맞추고 독립적으로 돌출된 윤곽을 정리했습니다. 낙차가 있는 가장자리에는 충돌이 있는 난간을 두고, 상부 계단으로 꺾이는 길은 열었습니다. 기존 아래 공간과 지지 구조는 유지했습니다.'),
]
ground = [
    ('2', '계단 상단으로 접근'), ('3', '상부 보행면과 옥상 경계'),
    ('4', '약학관 방향 계단 아래'), ('5', '반대편 뒤쪽 계단 아래'),
    ('6', '큰 계단의 중간참'), ('passage', '연결교 아래 통로'),
    ('plaza', '정리한 낮은 광장'), ('roof-reverse', '상부 보행면 반대 방향'),
]
for i in range(1, 7):
    for prefix in ('before', 'after'):
        shutil.copy2(R / f'reports/build28/{prefix}-{i}.png', out)
for key, _ in ground:
    shutil.copy2(R / f'reports/build28/ground-{key}.png', out)

css = '''*{box-sizing:border-box}body{margin:0;background:#f5f6f8;color:#202a3a;font:16px/1.65 system-ui,sans-serif}main{max-width:1440px;margin:auto;padding:28px}a{color:#183d83}h1{font-size:30px;line-height:1.25}h2{font-size:22px;margin:0 0 10px}p{max-width:1100px}header{margin-bottom:28px}.tag{color:#385278;font-size:13px;letter-spacing:.12em}.pair,.ground{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}article{padding:24px;margin:24px 0;background:white;border:1px solid #dce1e8;border-radius:12px}figure{margin:0;min-width:0}img{display:block;width:100%;height:auto;border-radius:6px}figcaption{padding:7px 0;font-size:14px;font-weight:600}.note{color:#566273;font-size:14px}ul{padding-left:22px}@media(max-width:700px){main{padding:16px}.pair,.ground{grid-template-columns:1fr}article{padding:14px}h1{font-size:26px}}'''
parts = []
for i, (title, desc) in enumerate(items, 1):
    parts.append(f'''<article id="photo-{i}"><h2>{i:02d} · {escape(title)}</h2><p>{escape(desc)}</p><div class="pair">''')
    for prefix, label in [('before','수정 전 · BUILD27'), ('after','수정 후 · BUILD28')]:
        parts.append(f'<figure><a href="{prefix}-{i}.png"><img src="{prefix}-{i}.png" alt="사진 {i} 대응 {label}" loading="lazy" width="1280" height="720"></a><figcaption>{label}</figcaption></figure>')
    parts.append(f'</div><p class="note"><a href="../../?review=mark28-{i}">이 시점으로 3NU 열기</a></p></article>')
ground_html=''.join(f'<figure><a href="ground-{k}.png"><img src="ground-{k}.png" alt="{escape(label)}" loading="lazy" width="1280" height="720"></a><figcaption>{escape(label)}</figcaption></figure>' for k,label in ground)
head=f'<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>3NU · BUILD28 접합부 수정 비교</title><style>{css}</style>'
(out/'index.html').write_text(f'''<!doctype html><html lang="ko"><head>{head}</head><body><main>
<header><p class="tag">3NU / BUILD 28</p><h1>표시한 접합부, 여섯 장면 비교</h1><p>관정관·본관 주변 광장과 계단, 뒤쪽 상·하부 통로만 수정했습니다. 건물의 배치·외형, 조명·색감·UI는 유지했습니다.</p><p><a href="../../">3NU에서 탐험하기</a> · <a href="overview.html">수정 후 6장 모아보기</a></p>
<p class="note">사용자 사진의 표시 지점에 대응하도록 비교 카메라를 마련했습니다. 각 전후 쌍의 카메라 위치·방향은 동일하며, 사용자 캡처의 구도를 픽셀 단위로 복원한 것은 아닙니다. 이 페이지에는 직접 렌더링한 화면만 포함했습니다. 이미지를 누르면 원본 크기로 볼 수 있습니다.</p></header>
{''.join(parts)}<article><h2>지상과 반대 방향에서도 확인</h2><div class="ground">{ground_html}</div></article>
<article><h2>형상 확인과 별도로 수행한 이동 검증</h2><ul><li>실행 중인 브라우저에서 10개 동선 왕복, 총 20회 통과. 마지막 상단 회전 공간 보정 뒤 해당 동선 왕복 2회 재검증.</li><li>계단 가장자리·회전·난간·점프 착지 추가 검사 43개 통과.</li><li>연결교 아래 통로와 위쪽 보행면을 각각 이동. 3층 연결교와 5층 옥상정원 동선 분리 유지.</li><li>캐릭터 변경 후 지상 착지, 점프, 설정 창 복귀 확인.</li></ul><p class="note">계단 폭·계단참과 국소 지면은 자연스러운 연결을 위한 설계값입니다. 실측 치수 또는 실제 캠퍼스의 정확도 수치가 아닙니다. 확인 범위는 표시한 접합부와 연결 동선이며, 모바일 Safari 실기기는 이번에 검증하지 않았습니다.</p></article>
</main></body></html>''')
cards=''.join(f'<figure><img src="after-{i}.png" alt="사진 {i} 수정 후"><figcaption>{i:02d} · {escape(title)}</figcaption></figure>' for i,(title,_)in enumerate(items,1))
(out/'overview.html').write_text(f'''<!doctype html><html lang="ko"><head>{head}<style>main{{max-width:1440px;padding:18px 24px}}h1{{font-size:24px;margin:0 0 4px}}header{{margin-bottom:14px}}.ground{{gap:14px 18px}}figure{{background:white;padding:6px;border:1px solid #dce1e8;border-radius:8px}}figcaption{{padding:4px 6px;font-size:13px}}p{{margin:4px 0}}@media(max-width:700px){{.ground{{grid-template-columns:1fr}}}}</style></head><body><main><header><p class="tag">3NU / BUILD 28</p><h1>표시 지점 수정 후</h1><p class="note">사진 1~6에 대응하는 모델 화면 · <a href="index.html">동일 시점 전후 비교</a></p></header><div class="ground">{cards}</div></main></body></html>''')
print(out)
