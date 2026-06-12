// 카테고리별 문제 생성기
// 모든 생성기는 { category, question, choices, answer, explanation } 객체를 반환한다.

// 1. 정수 사칙연산
function generateIntegerArithmeticProblem() {
  const op = pick(["+", "-", "×", "÷"]);
  let a, b, answer, question;

  if (op === "+") {
    a = randomInt(-20, 20);
    b = randomInt(-20, 20);
    answer = a + b;
    question = `${a} + ${b < 0 ? `(${b})` : b} = ?`;
  } else if (op === "-") {
    a = randomInt(-20, 20);
    b = randomInt(-20, 20);
    answer = a - b;
    question = `${a} - ${b < 0 ? `(${b})` : b} = ?`;
  } else if (op === "×") {
    a = randomInt(2, 9) * pick([1, -1]);
    b = randomInt(2, 9);
    answer = a * b;
    question = `${a} × ${b} = ?`;
  } else {
    b = randomInt(2, 9);
    answer = randomInt(2, 9) * pick([1, -1]);
    a = b * answer;
    question = `${a} ÷ ${b} = ?`;
  }

  return {
    category: "integer-arithmetic",
    question,
    choices: makeChoices(answer, () => answer + pick([-3, -2, -1, 1, 2, 3]) * pick([1, 2])),
    answer: String(answer),
    explanation: `${question.replace(" = ?", "")} = ${answer}`,
  };
}

// 2. 약수와 배수 (최대공약수 / 최소공배수)
function generateGcdLcmProblem() {
  const common = pick([2, 3, 4, 5, 6]);
  let m = randomInt(2, 6);
  let n = randomInt(2, 6);
  while (m === n) n = randomInt(2, 6);
  const a = common * m;
  const b = common * n;

  if (pick([true, false])) {
    const answer = gcd(a, b);
    return {
      category: "gcd-lcm",
      question: `${a}와 ${b}의 최대공약수는?`,
      choices: makeChoices(answer, () => pick([answer * 2, answer + 1, answer - 1, Math.max(2, Math.floor(answer / 2)), answer + 2])),
      answer: String(answer),
      explanation: `${a}와 ${b}의 공약수 중 가장 큰 수는 ${answer}`,
    };
  }

  const small = randomInt(2, 6);
  const big = randomInt(2, 9);
  const answer = lcm(small, big);
  return {
    category: "gcd-lcm",
    question: `${small}과 ${big}의 최소공배수는?`,
    choices: makeChoices(answer, () => pick([answer * 2, answer + small, answer - small, small * big, answer + big])),
    answer: String(answer),
    explanation: `${small}과 ${big}의 공배수 중 가장 작은 수는 ${answer}`,
  };
}

// 3. 소인수분해 (작은 수만)
function generatePrimeFactorizationProblem() {
  const SUP = { 1: "", 2: "²", 3: "³" };
  const fmt = (base, exp) => `${base}${SUP[exp]}`;
  const fmtAll = (pairs) => pairs.filter(([, e]) => e > 0).map(([p, e]) => fmt(p, e)).join("×");

  const [p, q] = pick([[2, 3], [2, 5], [2, 7], [3, 5]]);
  const e1 = randomInt(1, 3);
  const e2 = randomInt(1, 2);
  const n = Math.pow(p, e1) * Math.pow(q, e2);
  const answer = fmtAll([[p, e1], [q, e2]]);

  // (e1, e2)를 제외한 모든 지수 조합 → 항상 서로 다른 오답 5개가 보장된다
  const wrongPool = [];
  for (let a = 1; a <= 3; a++) {
    for (let b = 1; b <= 2; b++) {
      if (a !== e1 || b !== e2) wrongPool.push(fmtAll([[p, a], [q, b]]));
    }
  }

  return {
    category: "prime-factorization",
    question: `${n}을(를) 소인수분해하면?`,
    choices: makeChoices(answer, () => pick(wrongPool)),
    answer,
    explanation: `${n} = ${answer}`,
  };
}

// 4. 동류항 정리
function generateLikeTermsProblem() {
  const variable = pick(["a", "x", "y", "b"]);
  const term = (coef) => (coef === 1 ? variable : `${coef}${variable}`);
  const c1 = randomInt(2, 9);
  const isAdd = pick([true, false]);
  // 뺄셈일 때는 결과 계수가 1 이상이 되도록 c2를 제한
  const c2 = isAdd ? randomInt(2, 9) : randomInt(1, c1 - 1 > 0 ? c1 - 1 : 1);
  const result = isAdd ? c1 + c2 : c1 - c2;
  const answer = term(result);
  const question = `${term(c1)} ${isAdd ? "+" : "-"} ${term(c2)} = ?`;

  return {
    category: "like-terms",
    question,
    choices: makeChoices(answer, () => {
      const wrongCoef = result + pick([-2, -1, 1, 2]);
      if (wrongCoef <= 0) return `${term(result)}²`;
      return term(wrongCoef);
    }),
    answer,
    explanation: `계수끼리 계산: ${c1} ${isAdd ? "+" : "-"} ${c2} = ${result}`,
  };
}

// 5. 일차방정식
function generateLinearEquationProblem() {
  const form = pick(["x+a=b", "ax=b", "ax+b=c"]);
  const x = randomInt(-9, 9) || 2; // 0이면 2로 대체
  let question, explanation;

  if (form === "x+a=b") {
    const a = randomInt(1, 15);
    const b = x + a;
    question = `x + ${a} = ${b}, x는?`;
    explanation = `x = ${b} - ${a} = ${x}`;
  } else if (form === "ax=b") {
    const a = randomInt(2, 9);
    const b = a * x;
    question = `${a}x = ${b}, x는?`;
    explanation = `x = ${b} ÷ ${a} = ${x}`;
  } else {
    const a = randomInt(2, 6);
    const b = randomInt(1, 10);
    const c = a * x + b;
    question = `${a}x + ${b} = ${c}, x는?`;
    explanation = `${a}x = ${c - b} → x = ${x}`;
  }

  return {
    category: "linear-equation",
    question,
    choices: makeChoices(x, () => x + pick([-3, -2, -1, 1, 2, 3])),
    answer: String(x),
    explanation,
  };
}

// 6. 좌표 (사분면 판별)
function generateQuadrantProblem() {
  const x = randomInt(1, 9) * pick([1, -1]);
  const y = randomInt(1, 9) * pick([1, -1]);
  const quadrant = x > 0 ? (y > 0 ? 1 : 4) : (y > 0 ? 2 : 3);
  const labels = ["제1사분면", "제2사분면", "제3사분면", "제4사분면"];

  return {
    category: "coordinates",
    question: `점 (${x}, ${y})는 어느 사분면에 있을까?`,
    choices: shuffle(labels),
    answer: labels[quadrant - 1],
    explanation: `x가 ${x > 0 ? "양수" : "음수"}, y가 ${y > 0 ? "양수" : "음수"}이면 ${labels[quadrant - 1]}`,
  };
}

// 7. 비례식
function generateRatioProblem() {
  const [a, b] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [1, 3], [5, 6]]);
  const k = randomInt(2, 5);
  const answer = b * k;

  return {
    category: "ratio",
    question: `${a} : ${b} = ${a * k} : ?`,
    choices: makeChoices(answer, () => pick([answer + b, answer - b, a * k, answer + k, answer - k])),
    answer: String(answer),
    explanation: `${a} × ${k} = ${a * k}이므로 ${b} × ${k} = ${answer}`,
  };
}

// 8. 평균
function generateAverageProblem() {
  const count = randomInt(3, 4);
  const avg = randomInt(4, 12);
  const nums = Array(count).fill(avg);

  // 합을 유지한 채 숫자를 흩어서 자연스럽게 만든다
  for (let t = 0; t < count; t++) {
    const i = randomInt(0, count - 1);
    const j = randomInt(0, count - 1);
    const d = randomInt(1, 3);
    if (i !== j && nums[j] - d >= 1) {
      nums[i] += d;
      nums[j] -= d;
    }
  }

  const shuffled = shuffle(nums);
  const sum = avg * count;

  return {
    category: "average",
    question: `${shuffled.join(", ")}의 평균은?`,
    choices: makeChoices(avg, () => avg + pick([-3, -2, -1, 1, 2, 3])),
    answer: String(avg),
    explanation: `합 ${sum} ÷ ${count} = ${avg}`,
  };
}

const PROBLEM_GENERATORS = [
  generateIntegerArithmeticProblem,
  generateGcdLcmProblem,
  generatePrimeFactorizationProblem,
  generateLikeTermsProblem,
  generateLinearEquationProblem,
  generateQuadrantProblem,
  generateRatioProblem,
  generateAverageProblem,
];

function generateProblem() {
  return pick(PROBLEM_GENERATORS)();
}
