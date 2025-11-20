// 足利シティマスター メインロジック

// ===== ゲームの状態（データ） =====
const state = {
  year: 1,
  maxYear: 10,
  budgetPerYear: 100,
  // 各分野への配分（コイン数）
  allocations: {
    education: 15,      // 教育・子ども
    welfare: 25,        // 福祉・高齢者
    medical: 10,        // 医療・衛生
    safety: 10,         // 防災・安全
    infrastructure: 10, // 道路・インフラ
    vitality: 10,       // まちのにぎわい・産業
    admin: 5,           // 行政運営
    debt: 15            // 借金返済・貯金
  },
  // 3つの指標（0〜100）
  stats: {
    citizen: 50, // 市民満足度
    future: 50,  // 将来の安心度
    fiscal: 50   // 財政の健全さ
  },
  history: [] // 年ごとのメモ
};

// 参考になる「標準配分」（この値付近なら大きくは変化しない）
const referenceAllocation = {
  education: 15,
  welfare: 25,
  medical: 10,
  safety: 10,
  infrastructure: 10,
  vitality: 10,
  admin: 5,
  debt: 15
};

// ===== DOM要素をまとめて取得 =====
const sliders = {
  education: document.getElementById('slider-education'),
  welfare: document.getElementById('slider-welfare'),
  medical: document.getElementById('slider-medical'),
  safety: document.getElementById('slider-safety'),
  infrastructure: document.getElementById('slider-infrastructure'),
  vitality: document.getElementById('slider-vitality'),
  admin: document.getElementById('slider-admin'),
  debt: document.getElementById('slider-debt')
};

const labelsAlloc = {
  education: document.getElementById('val-education'),
  welfare: document.getElementById('val-welfare'),
  medical: document.getElementById('val-medical'),
  safety: document.getElementById('val-safety'),
  infrastructure: document.getElementById('val-infrastructure'),
  vitality: document.getElementById('val-vitality'),
  admin: document.getElementById('val-admin'),
  debt: document.getElementById('val-debt')
};

const totalCoinsEl = document.getElementById('total-coins');
const budgetRestEl = document.getElementById('budget-rest');
const yearLabelEl = document.getElementById('year-label');
const hintTextEl = document.getElementById('hint-text');
const nextYearBtn = document.getElementById('next-year-btn');
const resetBtn = document.getElementById('reset-btn');

const barCitizen = document.getElementById('bar-citizen');
const barFuture = document.getElementById('bar-future');
const barFiscal = document.getElementById('bar-fiscal');

const labelCitizen = document.getElementById('label-citizen');
const labelFuture = document.getElementById('label-future');
const labelFiscal = document.getElementById('label-fiscal');

const eventMessageEl = document.getElementById('event-message');
const citizenVoicesListEl = document.getElementById('citizen-voices-list');
const historyListEl = document.getElementById('history-list');

const resultSection = document.getElementById('result-section');
const resultText = document.getElementById('result-text');
const resultCitizen = document.getElementById('result-citizen');
const resultFuture = document.getElementById('result-future');
const resultFiscal = document.getElementById('result-fiscal');

// ===== ゲーム初期化 =====
function initGame() {
  state.year = 1;
  state.stats.citizen = 50;
  state.stats.future = 50;
  state.stats.fiscal = 50;
  state.history = [];

  // 初期配分を標準値に戻す
  Object.keys(state.allocations).forEach(key => {
    state.allocations[key] = referenceAllocation[key];
  });

  // スライダーに反映
  Object.keys(sliders).forEach(key => {
    sliders[key].value = state.allocations[key];
  });

  resultSection.classList.add('hidden');
  eventMessageEl.textContent = 'まだゲームははじまったばかり。どんな足利市にしたいか考えてみよう。';
  historyListEl.innerHTML = '';
  citizenVoicesListEl.innerHTML = '';

  updateUI();
}

// ===== UIを更新 =====
function updateUI() {
  // 年表示
  yearLabelEl.textContent = state.year + '年目 / ' + state.maxYear + '年';

  // スライダーの数字をラベルに反映
  Object.keys(sliders).forEach(key => {
    const val = parseInt(sliders[key].value, 10);
    labelsAlloc[key].textContent = val;
  });

  const total = getTotalAllocation();
  totalCoinsEl.textContent = total;

  const rest = state.budgetPerYear - total;
  if (rest > 0) {
    budgetRestEl.textContent = 'あと ' + rest + ' コイン 予算が残っています。';
  } else if (rest === 0) {
    budgetRestEl.textContent = 'ちょうど 100 コイン になりました！';
  } else {
    budgetRestEl.textContent = '予算オーバーです！ ' + Math.abs(rest) + ' コイン減らしてください。';
  }

  // 「すすむ」ボタンの有効/無効
  nextYearBtn.disabled = (rest !== 0 || state.year > state.maxYear);

  // 指標メーター
  labelCitizen.textContent = Math.round(state.stats.citizen);
  labelFuture.textContent = Math.round(state.stats.future);
  labelFiscal.textContent = Math.round(state.stats.fiscal);

  barCitizen.style.width = clampPercent(state.stats.citizen) + '%';
  barFuture.style.width = clampPercent(state.stats.future) + '%';
  barFiscal.style.width = clampPercent(state.stats.fiscal) + '%';

  // 10年目をすぎたらヒントを変える
  if (state.year > state.maxYear) {
    hintTextEl.textContent = '10年分の予算を決めました。下の結果を見てみよう。';
  } else {
    hintTextEl.textContent = '8つの分野の合計が 100 コインになるようにスライダーを動かしてね。';
  }
}

// 合計コインを計算
function getTotalAllocation() {
  let total = 0;
  Object.keys(sliders).forEach(key => {
    total += parseInt(sliders[key].value, 10);
  });
  return total;
}

// 0〜100の範囲におさめてパーセント値にする
function clampPercent(v) {
  if (v < 0) return 0;
  if (v > 100) return 100;
  return v;
}

// ===== 1年進める処理 =====
function goNextYear() {
  if (state.year > state.maxYear) return;

  // スライダーの値をstate.allocationsに反映
  Object.keys(sliders).forEach(key => {
    state.allocations[key] = parseInt(sliders[key].value, 10);
  });

  // 予算の配分に応じて指標を変化させる
  applyBudgetEffect();

  // ランダムイベント
  const eventText = applyRandomEvent();

  // 市民の声を生成
  const voices = generateCitizenVoices();
  renderCitizenVoices(voices);

  // この年の記録をhistoryに追加
  state.history.push({
    year: state.year,
    alloc: { ...state.allocations },
    stats: { ...state.stats },
    event: eventText,
    voices
  });

  // 履歴表示を更新
  renderHistory();

  // イベントを画面に表示
  eventMessageEl.textContent = state.year + '年目：' + eventText;

  // 年を進める
  state.year += 1;

  // もし10年を終えたら結果表示
  if (state.year > state.maxYear) {
    showResult();
  }

  updateUI();
}

// 予算配分による指標の変化
function applyBudgetEffect() {
  const a = state.allocations;
  const s = state.stats;
  const ref = referenceAllocation;

  // --- 教育・子どもの影響を強める（①） ---
  // 市民満足度：福祉・医療・にぎわい・インフラ・教育など
  s.citizen +=
    0.3 * (a.education - ref.education) + // ← 0.1 から 0.3 に強化
    0.3 * (a.welfare - ref.welfare) +
    0.2 * (a.medical - ref.medical) +
    0.2 * (a.vitality - ref.vitality) +
    0.2 * (a.infrastructure - ref.infrastructure) -
    0.1 * (a.admin - ref.admin);

  // 将来の安心度：教育・防災・医療・インフラ
  s.future +=
    0.6 * (a.education - ref.education) + // ← 0.4 から 0.6 に強化
    0.4 * (a.safety - ref.safety) +
    0.2 * (a.medical - ref.medical) +
    0.2 * (a.infrastructure - ref.infrastructure);

  // --- 道路・インフラを増やすと財政がよりマイナス（②） ---
  // 財政の健全さ：借金返済・貯金が増えると上がるが、
  // 福祉・医療・にぎわい・インフラ・教育に入れすぎると下がることも
  s.fiscal +=
    0.7 * (a.debt - ref.debt) +
    0.1 * (a.admin - ref.admin) -
    0.3 * (a.welfare - ref.welfare) -
    0.2 * (a.medical - ref.medical) -
    0.2 * (a.vitality - ref.vitality) -
    0.3 * (a.infrastructure - ref.infrastructure) - // ← −0.1 から −0.3 に強化
    0.15 * (a.education - ref.education); // 教育にたくさん振ると財政には少しマイナス

  // 何もしなくても少しずつバランスが崩れるイメージ
  s.citizen -= 0.5;
  s.future -= 0.5;
  s.fiscal -= 0.5;

  // 値を0〜100におさめる
  s.citizen = clampPercent(s.citizen);
  s.future = clampPercent(s.future);
  s.fiscal = clampPercent(s.fiscal);
}

// ランダムイベント（複数パターン）
function applyRandomEvent() {
  const a = state.allocations;
  const s = state.stats;
  const idx = Math.floor(Math.random() * 10); // 0〜9（③：イベント増量）
  let text = '';

  switch (idx) {
    case 0:
      // 大雨・河川の増水
      if (a.safety >= referenceAllocation.safety + 5) {
        s.future += 3;
        s.citizen += 2;
        text = '大雨で川が増水しましたが、防災への投資のおかげで大きな被害はなく、市民は安心しました。';
      } else if (a.safety <= referenceAllocation.safety - 5) {
        s.future -= 6;
        s.citizen -= 4;
        text = '大雨で川が増水し、通学路や道路に大きなダメージが出てしまいました。防災への投資が足りなかったようです。';
      } else {
        s.future -= 2;
        text = '大雨で一部の道路が通行止めになりました。市民は少し不安を感じています。';
      }
      break;

    case 1:
      // 熱中症・感染症など健康イベント
      if (a.medical >= referenceAllocation.medical + 5) {
        s.citizen += 2;
        s.future += 3;
        text = '熱中症や感染症の流行がありましたが、医療・衛生への投資のおかげで被害をおさえることができました。';
      } else if (a.medical <= referenceAllocation.medical - 5) {
        s.citizen -= 3;
        s.future -= 4;
        text = '健康相談や医療体制が十分でなく、熱中症などのトラブルが目立ちました。';
      } else {
        s.citizen -= 1;
        text = '健康に関する不安の声が少し増えています。';
      }
      break;

    case 2:
      // 子ども・若者イベント（教育強化版）
      if (a.education >= referenceAllocation.education + 5) {
        s.future += 6;
        s.citizen += 3;
        text = '学校や子ども・若者への投資が実を結び、中学生ボランティアなどの活動が盛んになりました。将来への期待が高まっています。';
      } else if (a.education <= referenceAllocation.education - 5) {
        s.future -= 5;
        s.citizen -= 2;
        text = '教育・子どもへの投資が少なく、学びの機会が足りないという声が出ています。';
      } else {
        s.future += 1;
        text = '教育・子ども分野はおおむねよい評価ですが、さらに力を入れてほしいという声もあります。';
      }
      break;

    case 3:
      // 工場の新設・撤退など産業イベント
      if (a.vitality >= referenceAllocation.vitality + 5 && a.infrastructure >= referenceAllocation.infrastructure) {
        s.citizen += 3;
        s.fiscal += 3;
        text = '企業誘致やインフラ整備が進み、新しい工場が進出しました。雇用と税収が増えています。';
      } else if (a.vitality <= referenceAllocation.vitality - 5) {
        s.citizen -= 3;
        s.fiscal -= 2;
        text = 'まちなかのにぎわいづくりが足りず、工場やお店の撤退が目立つようになりました。';
      } else {
        s.citizen += 1;
        text = '商店街や観光地では、少しずつにぎわいが戻りつつあります。';
      }
      break;

    case 4:
      // 高齢化の進行
      if (a.welfare >= referenceAllocation.welfare + 5) {
        s.citizen += 3;
        text = '高齢者向けの福祉サービスが充実し、地域で安心して暮らせるという声が増えました。';
      } else if (a.welfare <= referenceAllocation.welfare - 5) {
        s.citizen -= 4;
        s.future -= 2;
        text = '高齢化が進む中で、福祉サービスが足りないという不安の声が多くなっています。';
      } else {
        s.citizen -= 1;
        text = '福祉サービスは一定の評価がありますが、今後の高齢化に備えた取組が課題となっています。';
      }
      break;

    case 5:
      // 大型プロジェクト（道路・公共施設）
      if (a.infrastructure >= referenceAllocation.infrastructure + 5) {
        s.citizen += 3;
        s.future += 2;
        s.fiscal -= 3;
        text = '大きな道路や公共施設の整備が進み、生活は便利になりましたが、維持管理費もふえていきそうです。';
      } else {
        s.future += 1;
        text = '小さな修繕や改善を重ねて、インフラをなんとか維持しています。';
      }
      break;

    case 6:
      // 税収の増減（財政イベント）
      if (a.vitality >= referenceAllocation.vitality + 5) {
        s.fiscal += 3;
        text = '観光や産業がうまくいき、税収が少し増えました。';
      } else if (a.debt <= referenceAllocation.debt - 5) {
        s.fiscal -= 4;
        text = '借金の返済や貯金にあまり回してこなかったため、将来の財政にやや不安が残っています。';
      } else {
        s.fiscal -= 1;
        text = '全国的な景気の影響で、税収がわずかに減りました。';
      }
      break;

    case 7:
      // 行政のデジタル化・窓口改善（admin）
      if (a.admin >= referenceAllocation.admin + 5) {
        s.citizen += 2;
        s.future += 1;
        text = '市役所の手続きがオンライン化され、窓口の待ち時間も短くなりました。市民の便利さが向上しています。';
      } else {
        s.citizen -= 1;
        text = '市役所の手続きが分かりにくいという声が続いています。行政のデジタル化が課題です。';
      }
      break;

    case 8:
      // 文化・観光イベント（にぎわい + 教育）
      if (a.vitality >= referenceAllocation.vitality + 5 && a.education >= referenceAllocation.education) {
        s.citizen += 3;
        s.fiscal += 2;
        text = '歴史や文化を活かしたイベントが成功し、多くの人が足利市を訪れました。市民の誇りと税収が高まりました。';
      } else if (a.vitality <= referenceAllocation.vitality - 5) {
        s.citizen -= 2;
        text = '観光やイベントが少なく、まちなかが少しさみしいという声が聞かれます。';
      } else {
        s.citizen += 1;
        text = '小さなイベントがいくつか開かれ、地域のつながりが少しずつ育っています。';
      }
      break;

    case 9:
      // 若者の定住・流出（教育 + にぎわい）
      if (a.education >= referenceAllocation.education + 5 && a.vitality >= referenceAllocation.vitality) {
        s.future += 4;
        s.citizen += 2;
        text = '教育や仕事の環境が評価され、若者が足利市に残ったり戻ってきたりする動きが見られます。';
      } else if (a.education <= referenceAllocation.education - 5 || a.vitality <= referenceAllocation.vitality - 5) {
        s.future -= 4;
        s.citizen -= 2;
        text = '進学や就職で若者の市外流出が目立ち、「戻ってこないかも」という声も聞かれます。';
      } else {
        s.future -= 1;
        text = '若者の定住と流出は拮抗しています。今後の取り組み次第で変わっていきそうです。';
      }
      break;
  }

  // 値を0〜100におさめる
  s.citizen = clampPercent(s.citizen);
  s.future = clampPercent(s.future);
  s.fiscal = clampPercent(s.fiscal);

  return text;
}

// 市民の声を生成（最大3つ）
function generateCitizenVoices() {
  const a = state.allocations;
  const s = state.stats;
  const voices = [];

  // プラスの声（分野ごと）
  if (a.education >= referenceAllocation.education + 5) {
    voices.push('中学生の居場所や学びの場が増えてきてうれしいです。（中学生）');
  }
  if (a.debt >= referenceAllocation.debt + 5) {
    voices.push('将来のために借金を減らしているのは安心ですね。（保護者）');
  }
  if (a.vitality >= referenceAllocation.vitality + 5) {
    voices.push('まちなかのイベントが増えて、週末が楽しみになりました。（お店の人）');
  }
  if (a.safety >= referenceAllocation.safety + 5) {
    voices.push('通学路の街灯が明るくなって、安心して登下校できます。（小学生の保護者）');
  }
  if (a.welfare >= referenceAllocation.welfare + 5) {
    voices.push('高齢者サロンが増えて、外に出るきっかけになりました。（高齢者）');
  }
  if (a.infrastructure >= referenceAllocation.infrastructure + 5) {
    voices.push('道路や公園が整って、家族で出かけやすくなりました。（保護者）');
  }
  if (a.medical >= referenceAllocation.medical + 5) {
    voices.push('健康づくり教室に参加して、体調がよくなりました。（市民）');
  }
  if (a.admin >= referenceAllocation.admin + 5) {
    voices.push('市役所の手続きがオンラインでできて助かります。（保護者）');
  }

  // マイナス寄りの声（指標や配分が低いとき）
  if (s.fiscal <= 40) {
    voices.push('将来の借金が心配だという声も出ています。（市民）');
  }
  if (s.future <= 40) {
    voices.push('災害への備えや子どもの学びに、もっと力を入れてほしいです。（市民）');
  }
  if (a.education <= referenceAllocation.education - 5) {
    voices.push('進学や仕事のことで、将来が少し心配です。（高校生）');
  }
  if (a.vitality <= referenceAllocation.vitality - 5) {
    voices.push('夜は人通りが少なくて、まちなかがさみしく感じます。（市民）');
  }

  // いつでも出る共通コメント（④ 種類増量）
  const generic = [
    '市役所の広報が分かりやすくなってきました。（市民）',
    '若い人の意見をもっと聞いてほしいという声もあります。（高校生）',
    '地域のつながりを強くしていきたいですね。（町内会）',
    '子どもから高齢者まで、みんなが参加できるイベントがあるとうれしいです。（市民）',
    '足利市の良さを、もっと市外の人にも知ってほしいです。（商店街）'
  ];

  voices.push(...generic);

  // シャッフルして3つだけ取り出す
  const shuffled = voices.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

// 市民の声を画面に表示
function renderCitizenVoices(voices) {
  citizenVoicesListEl.innerHTML = '';
  voices.forEach(v => {
    const li = document.createElement('li');
    li.textContent = v;
    citizenVoicesListEl.appendChild(li);
  });
}

// 履歴表示
function renderHistory() {
  historyListEl.innerHTML = '';
  state.history.forEach(item => {
    const li = document.createElement('li');
    li.textContent =
      item.year + '年目： ' +
      '教' + item.alloc.education +
      ' / 福' + item.alloc.welfare +
      ' / 医' + item.alloc.medical +
      ' / 防' + item.alloc.safety +
      ' / 道' + item.alloc.infrastructure +
      ' / にぎ' + item.alloc.vitality +
      ' / 行' + item.alloc.admin +
      ' / 借' + item.alloc.debt +
      ' → [' +
      '満足度' + Math.round(item.stats.citizen) +
      ' / 将来' + Math.round(item.stats.future) +
      ' / 財政' + Math.round(item.stats.fiscal) +
      ']';
    historyListEl.appendChild(li);
  });
}

// 結果表示
function showResult() {
  resultSection.classList.remove('hidden');

  const c = Math.round(state.stats.citizen);
  const f = Math.round(state.stats.future);
  const fi = Math.round(state.stats.fiscal);

  resultCitizen.textContent = c;
  resultFuture.textContent = f;
  resultFiscal.textContent = fi;

  let msg = '';

  if (c >= 70 && f >= 70 && fi >= 70) {
    msg = '市民の満足度も高く、将来への安心もあり、財政も安定した「バランス型シティマスター」です！';
  } else if (c >= 70 && fi < 50) {
    msg = '市民には人気ですが、財政は少しきびしい状態です。「人気市長タイプ」。これからは財政も意識してみましょう。';
  } else if (fi >= 70 && (c < 50 || f < 50)) {
    msg = '財政はとても健全ですが、市民満足度や将来の安心が少し物足りないかもしれません。「節約市長タイプ」です。';
  } else if (f >= 70 && c < 60) {
    msg = '将来への投資をとてもがんばりました。「未来重視市長タイプ」です。今度は市民満足度も意識してみましょう。';
  } else {
    msg = 'いろいろなバランスを試した「チャレンジ市長タイプ」です。配分を変えて、別のエンディングもためしてみよう。';
  }

  resultText.textContent = msg;
}

// ===== イベントリスナー =====
// スライダーが変わったとき
Object.keys(sliders).forEach(key => {
  sliders[key].addEventListener('input', () => {
    updateUI();
  });
});

// 「この予算で1年すすむ」ボタン
nextYearBtn.addEventListener('click', () => {
  goNextYear();

  // 1年進んだあと、ページの一番上へスクロール
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

// 「はじめからやり直す」ボタン
resetBtn.addEventListener('click', () => {
  initGame();
});

// ページ読み込み時に初期化
initGame();
