// 새총 피젯 — 규칙은 단 하나: 당긴 만큼 반대로 튕겨 나간다.
// 날아가는 물건은 아무거나, 비행 물리는 제멋대로여도 된다.

const FLING_OBJECTS = [
  "🚗", "🚌", "🚜", "🛻", "🪙", "📺", "🪑", "🛁", "📦", "🧱",
  "🍩", "🍕", "🥔", "🧀", "🥖", "⚽", "🎲", "🧦", "👟", "🎩",
  "🦆", "🐢", "🐡", "🛹", "🚀", "☂️", "📞", "🧯", "🪣", "🧲",
];

const MAX_ACTIVE = 12; // 동시에 날아다니는 물건 수 제한 (성능)
const MAX_PULL = 70;   // 고무줄 최대 당김 거리(px)
const MIN_PULL = 12;   // 이보다 짧게 당기면 발사 취소

const JACKPOT_CHANCE = 0.001; // 극악의 확률 (0.1%)
const JACKPOT_MULTIPLIER = 4444;

const REST = { x: 100, y: 56 };  // 파우치 기본 위치 (런처 내부 좌표, 200x130 기준)

(function initSlingshot() {
  const launcher = document.getElementById("slingshot");
  const pouch = document.getElementById("pouch");
  const bandLeft = document.getElementById("band-left");
  const bandRight = document.getElementById("band-right");
  const flyLayer = document.getElementById("fly-layer");
  const resultEl = document.getElementById("sling-result");
  const topEl = document.getElementById("sling-top");
  if (!launcher || !pouch || !flyLayer || !resultEl || !topEl) return;

  let topRecords = loadSlingTop();

  let nextObject = pick(FLING_OBJECTS);
  let dragging = false;
  let dragStart = { x: 0, y: 0 };
  let pull = { x: 0, y: 0 };
  const flying = [];
  let loopRunning = false;

  pouch.textContent = nextObject;

  function clampPull(dx, dy) {
    const len = Math.hypot(dx, dy);
    if (len <= MAX_PULL) return { x: dx, y: dy };
    const k = MAX_PULL / len;
    return { x: dx * k, y: dy * k };
  }

  function renderPouch() {
    pouch.style.transform = `translate(calc(-50% + ${pull.x}px), calc(-50% + ${pull.y}px))`;
    const px = REST.x + pull.x;
    const py = REST.y + pull.y;
    bandLeft.setAttribute("x2", px);
    bandLeft.setAttribute("y2", py);
    bandRight.setAttribute("x2", px);
    bandRight.setAttribute("y2", py);
  }

  function spawn(vx, vy) {
    if (flying.length >= MAX_ACTIVE) {
      removeObject(flying[0]); // 가장 오래된 것부터 치운다
    }

    const rect = pouch.getBoundingClientRect();
    const el = document.createElement("span");
    el.className = "fly";
    el.textContent = nextObject;
    el.style.fontSize = `${randomInt(18, 34)}px`;
    flyLayer.appendChild(el);

    flying.push({
      el,
      emoji: nextObject,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      vx,
      vy,
      // 제멋대로 비행 성격: 중력이 약하거나, 거꾸로거나, 비틀거리거나
      g: pick([0.7, 0.45, 0.2, 0.05, -0.15]),
      spin: randomInt(-18, 18),
      rot: 0,
      wobble: Math.random() < 0.3,
      // 비거리는 발사 속도와 대체로 일치해야 한다 (속도² 비례 + 약간의 바람빨)
      launchSpeed: Math.hypot(vx, vy),
      windFactor: 0.85 + Math.random() * 0.4,
      born: performance.now(),
    });

    nextObject = pick(FLING_OBJECTS);
    pouch.textContent = nextObject;

    if (!loopRunning) {
      loopRunning = true;
      requestAnimationFrame(tick);
    }
  }

  function removeObject(obj) {
    const i = flying.indexOf(obj);
    if (i !== -1) flying.splice(i, 1);
    obj.el.remove();
  }

  function formatMeters(meters) {
    return meters >= 100
      ? Math.round(meters).toLocaleString("ko-KR")
      : meters.toFixed(1);
  }

  function renderTop() {
    topEl.innerHTML = "";
    const medals = ["🥇", "🥈", "🥉"];
    topRecords.forEach((r, i) => {
      const li = document.createElement("li");
      li.textContent = `${medals[i]} ${formatMeters(r.meters)}m ${r.emoji}`;
      topEl.appendChild(li);
    });
  }

  function updateTop(emoji, meters) {
    topRecords.push({ emoji, meters });
    topRecords.sort((a, b) => b.meters - a.meters);
    topRecords = topRecords.slice(0, 3);
    saveSlingTop(topRecords);
    renderTop();
  }

  function reportDistance(o) {
    // 포물선 사거리처럼 속도의 제곱에 비례. 살짝 튕기면 몇 m, 풀로 당기면 수백 m.
    let meters = o.launchSpeed * o.launchSpeed * 0.35 * o.windFactor;
    const jackpot = Math.random() < JACKPOT_CHANCE;
    if (jackpot) meters *= JACKPOT_MULTIPLIER;

    resultEl.textContent = jackpot
      ? `${o.emoji} ${formatMeters(meters)}m 날아감!!! 4,444배 돌풍`
      : `${o.emoji} ${formatMeters(meters)}m 날아감`;
    updateTop(o.emoji, meters);
  }

  function tick(now) {
    const maxX = window.innerWidth;
    const maxY = window.innerHeight;

    for (let i = flying.length - 1; i >= 0; i--) {
      const o = flying[i];
      const age = now - o.born;

      o.vy += o.g;
      if (o.wobble) o.vx += Math.sin(age / 80) * 0.5;
      o.x += o.vx;
      o.y += o.vy;
      o.rot += o.spin;

      // 벽에서 안 튕긴다. 화면 밖으로 그냥 보내주고 비거리만 기록.
      // (느리게 떠도는 것들을 위한 8초 수명 폴백 포함)
      if (o.x < -80 || o.x > maxX + 80 || o.y < -120 || o.y > maxY + 80 || age > 8000) {
        reportDistance(o);
        removeObject(o);
        continue;
      }

      o.el.style.transform = `translate(${o.x}px, ${o.y}px) rotate(${o.rot}deg)`;
    }

    if (flying.length > 0) {
      requestAnimationFrame(tick);
    } else {
      loopRunning = false;
    }
  }

  function release() {
    if (!dragging) return;
    dragging = false;
    pouch.classList.remove("grabbing");

    const len = Math.hypot(pull.x, pull.y);
    if (len >= MIN_PULL) {
      // 새총의 법칙: 당긴 방향의 반대로, 당긴 만큼 세게
      const power = 0.22 + Math.random() * 0.18;
      spawn(-pull.x * power * 1.6, -pull.y * power * 1.6);
    }

    pull = { x: 0, y: 0 };
    renderPouch();
  }

  pouch.addEventListener("pointerdown", (e) => {
    dragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    pouch.classList.add("grabbing");
    pouch.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  pouch.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    pull = clampPull(e.clientX - dragStart.x, e.clientY - dragStart.y);
    renderPouch();
  });

  pouch.addEventListener("pointerup", release);
  pouch.addEventListener("pointercancel", release);

  // 키보드 사용자: Enter/Space로 임의 방향 발사
  pouch.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const angle = (-110 + randomInt(-40, 40)) * (Math.PI / 180); // 대체로 위쪽
    const speed = randomInt(14, 22);
    spawn(Math.cos(angle) * speed, Math.sin(angle) * speed);
  });

  // 메인의 "기록 초기화"와 연동 (main.js가 stats-reset 이벤트를 쏜다)
  document.addEventListener("stats-reset", () => {
    topRecords = [];
    saveSlingTop(topRecords);
    renderTop();
    resultEl.textContent = "";
  });

  renderPouch();
  renderTop();
})();
