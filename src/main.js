// 앱 메인 로직

const NEXT_DELAY_MS = 750;

const CORRECT_MESSAGES = [
  "뽁. 정답.",
  "좋음. 뇌가 방금 기지개 켰음.",
  "깔끔하게 잡힘.",
  "뽁뽁. 리듬 탔음.",
  "오케이. 다음 거.",
];

const WRONG_MESSAGES = [
  "삐끗. 정답은 {answer}.",
  "괜찮음. 정답은 {answer}이었음.",
  "뇌가 잠깐 창문 봄. 정답은 {answer}.",
  "도망갔지만 다시 잡으면 됨. 정답은 {answer}.",
];

const el = {
  question: document.getElementById("question"),
  choices: document.getElementById("choices"),
  feedback: document.getElementById("feedback"),
  nextBtn: document.getElementById("next-btn"),
  resetBtn: document.getElementById("reset-btn"),
  statStreak: document.getElementById("stat-streak"),
  statBest: document.getElementById("stat-best"),
  statSolved: document.getElementById("stat-solved"),
  statCorrect: document.getElementById("stat-correct"),
  statWrong: document.getElementById("stat-wrong"),
  card: document.getElementById("problem-card"),
};

let stats = loadStats();
let currentProblem = null;
let answered = false;
let nextTimer = null;

function renderStats() {
  el.statStreak.textContent = stats.currentStreak;
  el.statBest.textContent = stats.bestStreak;
  el.statSolved.textContent = stats.totalSolved;
  el.statCorrect.textContent = stats.totalCorrect;
  el.statWrong.textContent = stats.totalWrong;
}

function showProblem() {
  clearTimeout(nextTimer);
  currentProblem = generateProblem();
  answered = false;

  el.question.textContent = currentProblem.question;
  el.feedback.textContent = "";
  el.feedback.className = "feedback";
  el.nextBtn.hidden = true;
  el.card.classList.remove("pop", "shake");

  el.choices.innerHTML = "";
  currentProblem.choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn";
    btn.textContent = choice;
    btn.addEventListener("click", () => handleAnswer(btn, choice));
    el.choices.appendChild(btn);
  });
}

function handleAnswer(selectedBtn, choice) {
  if (answered) return;
  answered = true;

  const correct = choice === currentProblem.answer;
  const buttons = el.choices.querySelectorAll(".choice-btn");

  buttons.forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === currentProblem.answer) {
      btn.classList.add("is-correct");
    }
  });

  if (correct) {
    selectedBtn.classList.add("is-correct");
    el.feedback.textContent = "⭕ " + pick(CORRECT_MESSAGES);
    el.feedback.className = "feedback feedback-correct";
    el.card.classList.add("pop");

    stats.currentStreak += 1;
    stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    stats.totalCorrect += 1;
  } else {
    selectedBtn.classList.add("is-wrong");
    el.feedback.textContent =
      "❌ " + pick(WRONG_MESSAGES).replace("{answer}", currentProblem.answer);
    el.feedback.className = "feedback feedback-wrong";
    el.card.classList.add("shake");

    stats.currentStreak = 0;
    stats.totalWrong += 1;
  }

  stats.totalSolved += 1;
  stats.lastPlayedDate = new Date().toISOString().slice(0, 10);
  saveStats(stats);
  renderStats();

  el.nextBtn.hidden = false;
  nextTimer = setTimeout(showProblem, correct ? NEXT_DELAY_MS : NEXT_DELAY_MS + 400);
}

el.nextBtn.addEventListener("click", showProblem);

el.resetBtn.addEventListener("click", () => {
  if (confirm("기록을 전부 지울까?")) {
    stats = resetStats();
    renderStats();
    document.dispatchEvent(new CustomEvent("stats-reset")); // 새총 순위도 함께 초기화
  }
});

// 키보드 1~4로도 답 선택 가능
document.addEventListener("keydown", (e) => {
  const idx = ["1", "2", "3", "4"].indexOf(e.key);
  if (idx === -1) return;
  const buttons = el.choices.querySelectorAll(".choice-btn");
  if (buttons[idx] && !buttons[idx].disabled) buttons[idx].click();
});

renderStats();
showProblem();
