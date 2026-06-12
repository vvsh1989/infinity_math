// 새총 런타임 검증용 DOM 스텁 (Node 전용, 앱에는 포함되지 않음)
// 실행: cat src/utils.js src/storage.js scripts/slingshotTest.js src/slingshot.js scripts/slingshotScenario.js | node
// (이 파일은 slingshot.js "앞"에, slingshotScenario.js 는 "뒤"에 결합해야 한다)

function stubEl(name) {
  return {
    name,
    listeners: {},
    style: {},
    children: [],
    textContent: "",
    classList: { add() {}, remove() {} },
    setAttribute() {},
    addEventListener(type, fn) { this.listeners[type] = fn; },
    setPointerCapture() {},
    getBoundingClientRect() { return { left: 100, top: 400, width: 44, height: 44 }; },
    appendChild(child) { this.children.push(child); },
    remove() { this.removed = true; },
    get innerHTML() { return ""; },
    set innerHTML(v) { this.children = []; },
  };
}

const els = {
  slingshot: stubEl("slingshot"),
  pouch: stubEl("pouch"),
  "band-left": stubEl("band-left"),
  "band-right": stubEl("band-right"),
  "fly-layer": stubEl("fly-layer"),
  "sling-result": stubEl("sling-result"),
  "sling-top": stubEl("sling-top"),
};

const document = {
  getElementById(id) { return els[id] || null; },
  createElement() { return stubEl("fly"); },
  addEventListener() {},
};

const localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = v; },
};
const window = { innerWidth: 400, innerHeight: 800 };
let nowMs = 0;
const performance = { now: () => nowMs };
const rafQueue = [];
function requestAnimationFrame(fn) { rafQueue.push(fn); }
