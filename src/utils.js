// 공용 헬퍼 함수

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(array) {
  return array[randomInt(0, array.length - 1)];
}

function shuffle(array) {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 정답 1개 + 오답 3개로 중복 없는 4지선다 보기를 만든다.
// wrongGen은 오답 후보(문자열) 하나를 반환하는 함수.
function makeChoices(correctAnswer, wrongGen) {
  const correct = String(correctAnswer);
  const correctKey = correct.trim();
  const wrongs = new Map();
  let attempts = 0;

  while (wrongs.size < 3 && attempts < 60) {
    const candidate = String(wrongGen());
    const key = candidate.trim();
    if (key !== correctKey && !wrongs.has(key)) wrongs.set(key, candidate);
    attempts++;
  }

  // 최후 보정: 후보가 모자라면 숫자 정답은 ± k 로 채운다.
  // 문자열 정답은 의미 있는 오답을 일반적으로 만들 수 없으므로,
  // 생성기가 반드시 서로 다른 오답 후보를 3개 이상 공급해야 한다.
  // 여기서는 무한 루프만 막고 눈에 띄는 표식을 붙여 채운다.
  let filler = 1;
  const numeric = Number(correct);
  while (wrongs.size < 3 && filler < 10) {
    const candidate = Number.isFinite(numeric)
      ? String(numeric + filler)
      : `${correct}${"*".repeat(filler)}`;
    const key = candidate.trim();
    if (key !== correctKey && !wrongs.has(key)) wrongs.set(key, candidate);
    filler++;
  }

  return shuffle([correct, ...wrongs.values()]);
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}
