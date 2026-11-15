"""Authored area boundaries, not building buffers. Coordinates are metres, east/north.
Reference pixels are observations, NOT surveyed coordinates. Similarity fit has no shear.
Re-run this file only to revise the authored source, then compile-landuse31.py.
"""
import json,pathlib,math
R=pathlib.Path(__file__).resolve().parents[1]
A=[]
T=dict(a=.311030855423916,b=-.00074414334562606,c=-523.1888459741493,d=-93.61396655465386)
def point(p):
 x,y=p; a,b,c,d=T.values();return [round(a*x-b*y+c,3),round(-(b*x+a*y+d),3)]
def points(s):return [list(map(float,p.split(',')))for p in s.split()]
def add(id,zone,kind,s,source='user-naver-20261113',pixels=True,note='',density=0):
 ps=points(s);A.append(dict(id=id,zone=zone,kind=kind,outer=[point(p)for p in ps]if pixels else ps,referencePixels=ps if pixels else None,source=source,confidence='interpreted-boundary',heightPolicy='inherit-canonical-ground',note=note or 'Observed surface/canopy boundary; concealed edges and exact dimensions estimated.',treeDensity=density))
def p(id,z,k,s,**kw):add(id,z,k,s,**kw)
def w(id,z,k,s,source,note='',density=0):add(id,z,k,s,source,False,note,density)
# Satellite crop: broad paved domains first; planting/canopy islands subtract from them.
p('science-north-court','science','plaza','1110,275 1190,290 1285,323 1315,365 1280,439 1200,463 1134,419')
p('science-26-27-28-court','science','plaza','1152,430 1270,451 1372,486 1394,531 1331,826 1260,863 1147,818 1102,750 1119,607')
p('science-west-service','science','parking','916,519 1044,551 1062,605 1008,673 909,641 872,589')
p('science-56-service','science','parking','1533,644 1617,671 1641,754 1598,883 1505,852 1516,790')
p('science-561-forecourt','science','plaza','1463,516 1570,533 1632,588 1620,661 1547,691 1457,651')
p('science-south-entry','science','plaza','1206,819 1315,842 1372,843 1423,875 1400,922 1320,922 1280,885 1203,879')
p('science-court-garden-north','science','planting','1200,455 1263,477 1306,509 1287,575 1232,588 1195,551',density=.018)
p('science-court-garden-middle','science','planting','1189,581 1259,598 1276,647 1236,690 1172,670',density=.017)
p('science-court-garden-south','science','planting','1168,711 1229,709 1258,751 1234,782 1163,762',density=.016)
p('science-28-wooded-edge','science','wood','1099,786 1164,807 1233,853 1260,879 1201,910 1100,869 1044,852',density=.024)
p('science-56-planting','science','planting','1474,697 1504,709 1496,800 1463,834 1438,805',density=.019)
p('science-561-wooded-edge','science','wood','1434,451 1480,481 1520,524 1485,560 1424,542 1386,499',density=.024)
p('science-24-court','science','plaza','1077,136 1170,153 1225,211 1198,273 1139,296 1060,262')
p('science-24-garden','science','planting','1093,190 1129,195 1137,236 1100,244 1083,224',density=.018)
p('science-22-east-planting','science','planting','1418,618 1451,630 1439,782 1408,813 1394,773',density=.016)
# CALS: observed forecourts/vehicular bays, a shared plaza, separate western forest.
p('cals-front-court','agriculture','plaza','742,605 794,616 827,710 840,877 815,966 760,983 745,929 747,805')
p('cals-interbuilding-court','agriculture','plaza','544,755 696,747 790,770 801,814 695,835 550,834')
p('cals-south-service','agriculture','parking','704,920 788,926 830,963 822,1035 742,1026 693,997')
p('cals-201-east-court','agriculture','plaza','701,1033 790,1045 830,1102 844,1182 785,1221 701,1164')
p('cals-751-forecourt','agriculture','plaza','704,1190 821,1186 874,1230 868,1316 790,1330 728,1285')
p('cals-west-garden','agriculture','wood','464,620 548,604 557,711 555,825 576,914 552,1013 520,1001 475,870',density=.022)
p('cals-central-planting','agriculture','planting','583,772 649,767 693,779 697,802 632,817 576,805',density=.018)
p('cals-forecourt-garden','agriculture','planting','770,836 793,838 806,900 791,924 772,899',density=.015)
p('cals-201-entry-garden','agriculture','planting','740,1076 779,1088 794,1147 758,1147 729,1117',density=.019)
p('cals-751-west-wood','agriculture','wood','560,1037 619,1037 656,1136 724,1248 748,1345 677,1332 613,1233 553,1119',density=.024)
# Engineering courtyards: do not infer a red pigment solely from the place name.
p('eng-31-32-court','engineering','plaza','1001,1034 1151,1018 1255,1027 1293,1109 1281,1237 1170,1263 1062,1220 1004,1133')
p('eng-33-34-36-37-court','engineering','plaza','1238,1286 1439,1275 1519,1340 1528,1478 1436,1544 1291,1524 1229,1417')
p('eng-33-south-service','engineering','parking','1154,1297 1235,1295 1243,1399 1208,1431 1143,1393')
p('eng-34-east-service','engineering','parking','1557,1297 1632,1304 1652,1413 1610,1482 1560,1476')
p('eng-35-east-forecourt','engineering','plaza','1664,1038 1708,1040 1750,1156 1738,1293 1667,1306 1650,1207')
p('eng-43-forecourt','engineering','plaza','1416,910 1539,924 1632,942 1648,1017 1565,1040 1446,1008')
p('eng-31-32-court-garden','engineering','planting','1191,1075 1244,1084 1255,1130 1237,1188 1194,1180 1176,1127',density=.020)
p('eng-32-court-west-garden','engineering','planting','1029,1103 1064,1102 1093,1166 1082,1222 1039,1194',density=.020)
p('eng-red-court-garden','engineering','planting','1325,1337 1389,1320 1439,1346 1450,1394 1391,1416 1329,1384',density=.014)
p('eng-red-court-stone','engineering','plazaBand','1374,1431 1440,1407 1485,1434 1496,1477 1421,1502 1369,1471')
p('eng-35-west-garden','engineering','wood','1531,1049 1592,1050 1596,1143 1563,1239 1510,1228 1520,1157',density=.025)
p('eng-west-forest','engineering','wood','825,1040 901,1059 936,1208 998,1338 1072,1535 1036,1604 945,1598 865,1430 811,1243',density=.023)
# Library/pharmacy: the open lower passage and roofs/deck cuts retain BUILD29/30 heights.
p('pharmacy-20-service','library','parking','1865,412 1971,438 1984,492 1898,588 1823,552 1818,497')
p('pharmacy-21-forecourt','library','plaza','1692,579 1809,618 1849,725 1816,836 1730,879 1685,825 1714,730')
p('pharmacy-143-court','library','plaza','1906,552 1973,556 2004,618 1978,674 1908,688 1873,644')
p('pharmacy-garden','library','planting','1808,635 1845,649 1852,709 1816,753 1792,722',density=.017)
p('pharmacy-east-wood','library','wood','2025,340 2149,364 2210,445 2154,582 2059,644 2011,624 2047,533 2006,478',density=.024)
# Beodeulgol: asymmetric open lawn; dense wooded flank rather than scattered balls on grass.
p('beodeul-open-lawn','beodeul','lawn','2751,119 2873,81 3008,129 3035,226 3005,356 2972,491 2929,639 2906,778 2834,911 2734,959 2631,923 2538,835 2527,709 2590,633 2709,617 2770,524 2775,407 2709,342')
p('beodeul-west-forest','beodeul','wood','2254,277 2400,255 2530,292 2547,402 2491,522 2460,659 2373,711 2300,671 2180,572 2181,406',density=.027)
p('beodeul-east-forest','beodeul','wood','3065,93 3137,107 3134,527 3074,771 3030,1002 2942,1175 2855,1165 2870,1009 2958,889 3009,745 3045,575 3056,381',density=.026)
p('faculty-club-forecourt','beodeul','plaza','2112,630 2235,641 2325,695 2367,763 2338,806 2244,794 2171,756 2097,711')
p('faculty-club-parking','beodeul','parking','2296,785 2412,803 2475,878 2480,922 2400,931 2318,866')
p('faculty-club-garden','beodeul','planting','2174,766 2218,785 2273,808 2275,845 2220,848 2188,811',density=.016)
p('pungsan-entrance-apron','beodeul','plaza','2525,404 2594,416 2625,456 2605,499 2539,526 2507,483')
p('pungsan-south-apron','beodeul','plaza','2578,624 2634,650 2730,624 2773,588 2784,621 2725,677 2652,710 2596,695')
p('faculty-south-wood','beodeul','wood','2024,817 2138,819 2247,883 2317,994 2305,1077 2213,1084 2167,995 2066,956 1997,891',density=.025)
# Additional direct Naver observations outside the supplied crop. Hand-fit in the
# unchanged metre coordinate system. These are not cadastral or survey boundaries.
H='naver-humanities-20261113';E='naver-education-20261113';S='naver-social-20261113';U='naver-engineering-build30'
w('humanities-1-2-court','humanities','plaza','32,160 68,173 97,164 97,138 69,126 31,136',H,'1·2동 사이 포장과 정원. 수목 아래 경계는 추정.')
w('humanities-abang-garden','humanities','planting','45,158 68,162 81,154 78,142 57,139 43,147',H,density=.020)
w('humanities-3-4-court','humanities','plaza','79,197 102,222 131,231 151,214 136,188 109,179',H)
w('humanities-3-4-trees','humanities','planting','95,199 110,214 123,218 133,207 122,194 106,190',H,density=.020)
w('humanities-5-7-court','humanities','plaza','162,188 187,206 220,193 239,174 222,137 199,127 169,146',H)
w('humanities-5-7-garden','humanities','planting','182,179 197,188 217,174 203,153 190,149 176,161',H,density=.020)
w('humanities-5-front','humanities','plaza','143,154 165,169 183,141 188,127 174,116 156,130',H)
w('humanities-north-grove','humanities','wood','22,180 42,208 75,235 94,239 91,215 70,194 45,175',H,density=.022)
w('jahayeon-north-approach','humanities','plaza','24,124 39,130 54,119 49,103 34,99 20,109',H,'연못·기존 목재 데크는 보존. 영상에 드러난 북측 접근 포장만 보정.')
w('education-inner-court','education','plaza','246,142 271,159 299,138 292,116 266,75 244,87 238,113',E)
w('education-inner-garden','education','planting','259,132 274,141 285,130 270,102 255,99 249,113',E,density=.024)
w('education-south-court','education','plaza','227,90 244,95 265,70 266,51 253,33 235,39 220,63',E)
w('education-east-grove','education','wood','316,136 344,126 344,93 317,53 282,31 270,43 282,71 306,116',E,density=.026)
w('education-13-approach','education','plaza','117,2 137,22 195,47 218,42 207,26 171,7 139,-8',E,'관정관 쪽 기존 상하 동선은 변경하지 않음.')
w('education-13-grove','education','wood','193,1 215,13 236,22 244,6 237,-16 219,-30 198,-22',E,density=.026)
# Social: directly inspected November Naver capture. The western construction
# site is NOT asserted to be the completed Agora; leave that area unresolved.
w('social-east-parking','social','parking','-76,575 -51,573 -27,548 -30,505 -50,480 -78,479 -87,503',S,'16동 동측 차량 공간. 서측 공사 구역·아고라 경계는 확정하지 않음.')
w('social-south-forecourt','social','plaza','-112,482 -91,484 -62,457 -41,438 -55,418 -75,429 -99,454',S)
w('social-north-garden','social','planting','-46,580 -14,571 1,549 -17,535 -30,548 -45,557',S,density=.019)
w('social-east-garden','social','wood','-32,476 -14,477 6,459 13,432 -10,428 -35,445 -48,459',S,density=.024)
w('social-west-entry','social','plaza','-172,492 -154,493 -124,466 -112,439 -138,428 -166,452',S,'101동 동측의 드러난 포장 접근면. 서측 공사 영역은 제외.')
# Engineering: directly inspected BUILD30 Naver satellite, ground parking west
# of 303 and west of 301. Existing elevated plaza is kept as a separate floor.
w('upper-303-west-parking','upper','parking','-135,-947 -115,-929 -88,-928 -78,-955 -75,-1007 -109,-1020 -137,-1013',U)
w('upper-301-west-service','upper','parking','-18,-949 8,-949 11,-1048 -10,-1058 -22,-1035',U)
w('upper-301-entry','upper','plaza','9,-1048 24,-1050 25,-1085 -4,-1090 -15,-1069',U)
w('upper-302-north-forecourt','upper','plaza','-7,-1098 62,-1098 65,-1119 21,-1129 -9,-1120',U,'302동 북측 접근면. 영상 하단에 가려진 남측 경계는 이번 재분류에서 제외.')
w('upper-303-north-forecourt','upper','plaza','-76,-924 -43,-917 -11,-918 2,-939 -26,-949 -54,-938',U,'기존 공학관 데크의 지상 투영을 새 지면으로 메우지 않음.')
w('upper-west-forest','upper','wood','-165,-919 -139,-916 -137,-946 -146,-988 -142,-1021 -111,-1032 -78,-1025 -68,-1057 -97,-1093 -147,-1105 -169,-1051',U,density=.026)
w('upper-east-forest','upper','wood','77,-947 112,-956 130,-1011 124,-1088 113,-1141 82,-1148 74,-1103 78,-1044 70,-987',U,density=.025)
w('upper-301-south-garden','upper','planting','5,-1088 64,-1088 69,-1098 53,-1106 13,-1100',U,density=.018)
source={'version':31,'units':'metres','axes':'x east; z north; y up','originLonLat':[126.952,37.459], 'registration':{'userImage':T,'type':'orientation-preserving similarity; no individual-building scale changes','precision':'manual interpretation, not survey; roof parallax and legacy footprint errors remain'},'areas':A}
(R/'sources/landuse31.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n')
print('Authored',len(A),'area polygons')
