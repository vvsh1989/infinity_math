// 문제 생성기 불변 조건 검사 스크립트 (Node 전용, 앱에는 포함되지 않음)
// 실행: cat src/utils.js src/problemGenerators.js scripts/checkGenerators.js | node

const ITERATIONS = 2000;
const issues = [];

function normalizeChoice(value) {
  return String(value).trim();
}

function parseQuestionNumbers(question) {
  return [...question.matchAll(/-?\d+/g)].map((match) => Number(match[0]));
}

function evalFactorization(choice) {
  return String(choice)
    .replaceAll("²", "^2")
    .replaceAll("³", "^3")
    .split("×")
    .reduce((total, part) => {
      const match = part.match(/^(\d+)(?:\^(\d+))?$/);
      if (!match) return NaN;
      return total * Math.pow(Number(match[1]), Number(match[2] || 1));
    }, 1);
}

function parseTerm(term) {
  const match = term.match(/^(?:(\d+))?([a-z])$/);
  if (!match) return null;
  return {
    coef: Number(match[1] || 1),
    variable: match[2],
  };
}

function expectedAnswerOf(problem) {
  const nums = parseQuestionNumbers(problem.question);

  if (problem.category === "integer-arithmetic") {
    if (problem.question.includes(" + ")) return nums[0] + nums[1];
    if (problem.question.includes(" - ")) return nums[0] - nums[1];
    if (problem.question.includes("×")) return nums[0] * nums[1];
    if (problem.question.includes("÷")) return nums[0] / nums[1];
  }

  if (problem.category === "gcd-lcm") {
    const [a, b] = nums;
    return problem.question.includes("최대공약수") ? gcd(a, b) : lcm(a, b);
  }

  if (problem.category === "prime-factorization") {
    return nums[0];
  }

  if (problem.category === "like-terms") {
    const match = problem.question.match(/^([0-9a-z]+) ([+-]) ([0-9a-z]+) = \?$/);
    if (!match) return undefined;
    const left = parseTerm(match[1]);
    const right = parseTerm(match[3]);
    if (!left || !right || left.variable !== right.variable) return undefined;
    const coef = match[2] === "+" ? left.coef + right.coef : left.coef - right.coef;
    return `${coef === 1 ? "" : coef}${left.variable}`;
  }

  if (problem.category === "linear-equation") {
    let match = problem.question.match(/^x \+ (-?\d+) = (-?\d+), x는\?$/);
    if (match) return Number(match[2]) - Number(match[1]);

    match = problem.question.match(/^(\d+)x = (-?\d+), x는\?$/);
    if (match) return Number(match[2]) / Number(match[1]);

    match = problem.question.match(/^(\d+)x \+ (-?\d+) = (-?\d+), x는\?$/);
    if (match) return (Number(match[3]) - Number(match[2])) / Number(match[1]);
  }

  if (problem.category === "coordinates") {
    const [x, y] = nums;
    if (x > 0) return y > 0 ? "제1사분면" : "제4사분면";
    return y > 0 ? "제2사분면" : "제3사분면";
  }

  if (problem.category === "ratio") {
    const [a, b, ak] = nums;
    return (b * ak) / a;
  }

  if (problem.category === "average") {
    return nums.reduce((sum, n) => sum + n, 0) / nums.length;
  }

  return undefined;
}

function logicallyMatches(category, choice, expected) {
  if (category === "prime-factorization") return evalFactorization(choice) === expected;
  if (typeof expected === "number") return Number(choice) === expected;
  return normalizeChoice(choice) === normalizeChoice(expected);
}

for (let i = 0; i < ITERATIONS; i++) {
  const p = generateProblem();

  if (!p.category || !p.question || !p.answer || !p.explanation) {
    issues.push(`[${p.category}] 필드 누락: ${JSON.stringify(p)}`);
    continue;
  }
  if (!Array.isArray(p.choices) || p.choices.length !== 4) {
    issues.push(`[${p.category}] 보기 개수 오류: ${JSON.stringify(p.choices)}`);
    continue;
  }
  // trim 비교: 공백만 다른 "시각적 중복" 보기도 잡는다
  if (new Set(p.choices.map(normalizeChoice)).size !== 4) {
    issues.push(`[${p.category}] 보기 중복: ${p.question} → ${JSON.stringify(p.choices)}`);
  }
  // 최후 보정 표식(*)이 실제 문제에 노출되면 생성기의 오답 공급이 부족한 것
  if (p.choices.some((c) => c.includes("*"))) {
    issues.push(`[${p.category}] 보정 표식 노출: ${p.question} → ${JSON.stringify(p.choices)}`);
  }
  if (!p.choices.includes(p.answer)) {
    issues.push(`[${p.category}] 정답이 보기에 없음: ${p.question} → ${p.answer}`);
  }

  const expected = expectedAnswerOf(p);
  if (expected === undefined || Number.isNaN(expected)) {
    issues.push(`[${p.category}] 정답 검증 불가: ${p.question}`);
    continue;
  }

  const logicalAnswers = p.choices.filter((choice) => logicallyMatches(p.category, choice, expected));
  if (logicalAnswers.length !== 1 || normalizeChoice(logicalAnswers[0]) !== normalizeChoice(p.answer)) {
    issues.push(
      `[${p.category}] 논리적 정답 오류: ${p.question} → 보기 ${JSON.stringify(p.choices)}, ` +
        `표시 정답 ${p.answer}, 실제 정답 후보 ${JSON.stringify(logicalAnswers)}`,
    );
  }
}

if (issues.length) {
  console.log(`실패 ${issues.length}건 / ${ITERATIONS}회`);
  console.log(issues.slice(0, 10).join("\n"));
  process.exit(1);
} else {
  console.log(`통과: ${ITERATIONS}개 문제 모두 보기 4개, 중복 없음, 정답 포함, 논리 정답 1개.`);
  // 카테고리별 샘플 출력
  const seen = {};
  while (Object.keys(seen).length < 8) {
    const p = generateProblem();
    if (!seen[p.category]) {
      seen[p.category] = true;
      console.log(`- [${p.category}] ${p.question} | 보기: ${p.choices.join(", ")} | 정답: ${p.answer}`);
    }
  }
}
