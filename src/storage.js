// localStorage 입출력

const STORAGE_KEY = "mathPopStats";

const DEFAULT_STATS = {
  totalSolved: 0,
  totalCorrect: 0,
  totalWrong: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedDate: "",
};

function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_STATS };
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    // 저장 실패해도 앱은 계속 동작
  }
}

function resetStats() {
  const fresh = { ...DEFAULT_STATS };
  saveStats(fresh);
  return fresh;
}

// 새총 비거리 순위 (1~3위)

const SLING_KEY = "mathPopSlingTop";

function loadSlingTop() {
  try {
    const raw = localStorage.getItem(SLING_KEY);
    if (!raw) return [];
    const records = JSON.parse(raw);
    return Array.isArray(records) ? records.slice(0, 3) : [];
  } catch (e) {
    return [];
  }
}

function saveSlingTop(records) {
  try {
    localStorage.setItem(SLING_KEY, JSON.stringify(records));
  } catch (e) {
    // 저장 실패해도 앱은 계속 동작
  }
}
