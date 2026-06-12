// 새총 시나리오 테스트 — slingshotTest.js(스텁) + slingshot.js 뒤에 결합해 실행

const pouch = els.pouch;
const layer = els["fly-layer"];

// 1) 짧게 당기면(MIN_PULL 미만) 발사되지 않아야 함
pouch.listeners.pointerdown({ clientX: 0, clientY: 0, pointerId: 1, preventDefault() {} });
pouch.listeners.pointermove({ clientX: 4, clientY: 4 });
pouch.listeners.pointerup({});
if (layer.children.length !== 0) { console.log("실패: 짧은 당김인데 발사됨"); process.exit(1); }

// 2) 제대로 당기면 발사
pouch.listeners.pointerdown({ clientX: 0, clientY: 0, pointerId: 1, preventDefault() {} });
pouch.listeners.pointermove({ clientX: 50, clientY: 60 }); // 오른쪽 아래로 당김
pouch.listeners.pointerup({});
if (layer.children.length !== 1) { console.log("실패: 발사 안 됨"); process.exit(1); }
const obj = layer.children[0];
if (!obj.textContent) { console.log("실패: 날아가는 물건이 비어 있음"); process.exit(1); }

// 3) rAF 틱을 돌리면 transform이 갱신되고, 당김 반대 방향(왼쪽 위)으로 움직여야 함
nowMs = 16;
rafQueue.shift()(nowMs);
const t = obj.style.transform;
const m = t.match(/translate\((-?[\d.]+)px, (-?[\d.]+)px\)/);
if (!m) { console.log("실패: transform 미갱신:", t); process.exit(1); }
const x = Number(m[1]);
const y = Number(m[2]);
// 시작점은 파우치 중심 (122, 422)
if (x >= 122 || y >= 422) { console.log(`실패: 당김 반대 방향이 아님 (${x}, ${y})`); process.exit(1); }

// 4) 벽에서 튕기지 않고 화면 밖으로 나가면 제거되고, 비행체가 없으면 rAF 루프도 멈춰야 함
//    또한 제거되면서 비거리(m)가 기록되어야 함
for (let i = 0; i < 600 && rafQueue.length; i++) { nowMs += 16; rafQueue.shift()(nowMs); }
if (!obj.removed) { console.log("실패: 화면 밖으로 나갔는데 제거 안 됨"); process.exit(1); }
if (rafQueue.length !== 0) { console.log("실패: 비행체 없는데 rAF 루프 계속 돔"); process.exit(1); }
const result = els["sling-result"].textContent;
if (!/m 날아감$/.test(result)) { console.log("실패: 비거리 기록 안 됨:", JSON.stringify(result)); process.exit(1); }
console.log("풀 당김 비거리:", result);

// 4-1) 비거리는 발사 속도와 일치해야 함: 살짝 당기면 풀 당김보다 짧아야 함
const parseMeters = (s) => Number(s.replace(/[^\d.]/g, ""));
const strongMeters = parseMeters(result);
pouch.listeners.pointerdown({ clientX: 0, clientY: 0, pointerId: 1, preventDefault() {} });
pouch.listeners.pointermove({ clientX: 10, clientY: 10 }); // 살짝만 당김 (길이 약 14px)
pouch.listeners.pointerup({});
for (let i = 0; i < 600 && rafQueue.length; i++) { nowMs += 16; rafQueue.shift()(nowMs); }
const weakMeters = parseMeters(els["sling-result"].textContent);
console.log("살짝 당김 비거리:", els["sling-result"].textContent);
if (!(weakMeters < strongMeters)) {
  console.log(`실패: 살짝 당김(${weakMeters}m)이 풀 당김(${strongMeters}m)보다 멀리 감`);
  process.exit(1);
}

// 5) 키보드(Enter/Space) 발사
pouch.listeners.keydown({ key: "Enter", preventDefault() {} });
if (layer.children.filter((c) => !c.removed).length !== 1) { console.log("실패: 키보드 발사 안 됨"); process.exit(1); }

// 6) MAX_ACTIVE 초과 시 오래된 것부터 정리되어 동시 비행 수가 제한을 넘지 않아야 함
for (let i = 0; i < 20; i++) pouch.listeners.keydown({ key: " ", preventDefault() {} });
const active = layer.children.filter((c) => !c.removed).length;
if (active > 12) { console.log("실패: 동시 비행 제한 초과:", active); process.exit(1); }

// 7) 순위판: 최대 3개, 비거리 내림차순으로 정렬되어야 함
for (let i = 0; i < 600 && rafQueue.length; i++) { nowMs += 16; rafQueue.shift()(nowMs); }
const topItems = els["sling-top"].children.map((li) => li.textContent);
if (topItems.length === 0 || topItems.length > 3) { console.log("실패: 순위판 개수 오류:", topItems); process.exit(1); }
const topMeters = topItems.map(parseMeters);
for (let i = 1; i < topMeters.length; i++) {
  if (topMeters[i] > topMeters[i - 1]) { console.log("실패: 순위판 정렬 오류:", topItems); process.exit(1); }
}
if (!topItems[0].startsWith("🥇")) { console.log("실패: 1위 메달 없음:", topItems[0]); process.exit(1); }
console.log("순위판:", topItems.join(" / "));

// 8) 잭팟: Math.random을 0으로 고정하면 4,444배 돌풍이 터져야 함
const realRandom = Math.random;
Math.random = () => 0;
pouch.listeners.keydown({ key: "Enter", preventDefault() {} });
for (let i = 0; i < 600 && rafQueue.length; i++) { nowMs += 16; rafQueue.shift()(nowMs); }
Math.random = realRandom;
const jackpotText = els["sling-result"].textContent;
if (!jackpotText.includes("4,444배 돌풍")) { console.log("실패: 잭팟 미발동:", jackpotText); process.exit(1); }
console.log("잭팟 발동:", jackpotText);

console.log("새총 런타임 테스트 8종 통과 (발사 취소 / 발사 / 반대 방향 비행 / 화면 밖 제거 + 루프 정지 / 키보드 / 개수 제한 / 순위판 / 잭팟)");
