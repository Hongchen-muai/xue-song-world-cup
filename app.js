const TRACKS = [
  "媚人", "人字拖", "顽疾", "湖泊", "霸王别姬", "金斧子银斧子", "跃", "平庸",
  "农民与土地", "来日方长", "守村人", "银河少年", "AI", "Nothing", "禁忌", "怪咖",
  "租购", "在那天回不去的路上", "念", "无数", "风尘留白", "变成什么", "你不是一个人", "可",
  "男二号", "守候", "洛城", "被人", "关于你", "天外来物", "迟迟", "把你揉碎成苹果",
  "野心", "彩券", "不要我", "潘金莲", "耗尽", "小尖尖", "纸船", "木偶人",
  "慢半拍", "这么久没见", "笑场", "病态", "小", "陪你去流浪", "配合", "丑",
  "那是你离开了北京的生活", "醒来", "失落", "刚刚好", "暧昧", "哑巴", "像风一样", "遗憾",
  "动物世界", "骆驼", "像风一样", "高尚", "绅士", "别", "火星人来过", "丑八怪",
  "凄", "我害怕", "初学者", "刚刚好", "我好像在哪见过你", "演员", "绅士", "一半",
  "小孩", "Stay Here", "花儿和少年", "下雨了", "十八岁", "意外", "你还要我怎样", "有没有",
  "潮流", "等我回家", "我终于成了别人的女人", "其实", "方圆几里", "我知道你都知道", "几个你", "伏笔",
  "为什么", "我终于成了别人的女人", "疯子", "我们爱过就好", "萧河以南", "为了遇见你", "未完成的歌", "我的雅典娜",
  "传说", "马戏小丑", "你还要我怎样", "红尘女子", "Memory", "暧昧", "我们的世界", "给我的爱人",
  "爱的期限", "黄色枫叶", "认真的雪", "Let You Go", "深深爱过你（前世）", "苏黎世的从前", "爱我的人 谢谢你", "星河之役",
  "深深爱过你（今生）", "梦开始的原点", "苏黎世的从前", "爱的宝贝", "朋友你们还好吗", "关于爱", "疼", "王子归来",
  "爱不在", "找不到", "我的Show", "倾城风", "方的言", "崇拜", "聊表心意", "违背的青春"
];

const STORAGE_KEY = "joker-xue-song-world-cup-v1";
const el = (id) => document.getElementById(id);
const state = { rounds: [], round: 0, match: 0, history: [], started: false, sound: false };
let soundContext;
let soundTimer;

function buildRounds() {
  state.rounds = [TRACKS.map((name, index) => ({ name, seed: index + 1 }))];
  let count = TRACKS.length;
  while (count > 1) {
    count /= 2;
    state.rounds.push(new Array(count).fill(null));
  }
}

function ordinal(value) { return String(value).padStart(3, "0"); }
function roundLabel(round) { return ["第一轮", "第二轮", "第三轮", "八强赛", "四强赛", "半决赛", "最终选择"][round] || `第 ${round + 1} 轮`; }
function roundKicker(round) { const current = TRACKS.length / (2 ** round); const next = current / 2; return `ROUND ${String(round + 1).padStart(2, "0")} / ${current} 进 ${next}`; }

function currentPair() {
  const pairStart = state.match * 2;
  return [state.rounds[state.round][pairStart], state.rounds[state.round][pairStart + 1]];
}

function setGameView() {
  const [left, right] = currentPair();
  if (!left || !right) return;
  const total = TRACKS.length / (2 ** (state.round + 1));
  el("round-kicker").textContent = roundKicker(state.round);
  el("round-title").textContent = roundLabel(state.round);
  el("match-number").textContent = String(state.match + 1).padStart(2, "0");
  el("match-total").textContent = String(total).padStart(2, "0");
  el("left-song").textContent = left.name;
  el("right-song").textContent = right.name;
  el("left-index").textContent = ordinal(left.seed);
  el("right-index").textContent = ordinal(right.seed);
  const resolved = state.history.length;
  el("progress-bar").style.width = `${(resolved / (TRACKS.length - 1)) * 100}%`;
  el("selection-note").textContent = state.round === 6 ? "最后一票，决定你的冠军曲目。" : "凭直觉选择，答案会被记录。";
  el("undo-button").disabled = state.history.length === 0;
  saveState();
}

function choose(side) {
  const [left, right] = currentPair();
  const winner = side === "left" ? left : right;
  const loser = side === "left" ? right : left;
  state.history.push({ round: state.round, match: state.match, winner, loser });
  state.rounds[state.round + 1][state.match] = winner;
  const duel = el("duel");
  duel.classList.add("is-selecting");
  window.setTimeout(() => {
    duel.classList.remove("is-selecting");
    state.match += 1;
    const total = state.rounds[state.round].length / 2;
    if (state.match === total) { state.round += 1; state.match = 0; }
    if (state.round === state.rounds.length - 1) showResult(winner);
    else setGameView();
  }, 160);
}

function undo() {
  const prior = state.history.pop();
  if (!prior) return;
  state.round = prior.round;
  state.match = prior.match;
  state.rounds[prior.round + 1][prior.match] = null;
  setGameView();
}

function showResult(winner) {
  el("game-screen").classList.add("is-hidden");
  el("result-screen").classList.remove("is-hidden");
  el("result-title").textContent = winner.name;
  el("progress-bar").style.width = "100%";
  saveState();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startGame() {
  state.started = true;
  el("intro-screen").classList.add("is-hidden");
  el("game-screen").classList.remove("is-hidden");
  setGameView();
}

function resetGame() {
  state.round = 0; state.match = 0; state.history = []; state.started = true;
  buildRounds();
  el("result-screen").classList.add("is-hidden");
  el("game-screen").classList.remove("is-hidden");
  setGameView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ history: state.history, started: state.started }));
}

function restoreState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    if (!data.started || !Array.isArray(data.history)) return;
    buildRounds();
    state.started = true;
    for (const item of data.history) {
      const originalWinner = state.rounds[item.round][item.match * 2];
      const alternative = state.rounds[item.round][item.match * 2 + 1];
      const winner = originalWinner?.name === item.winner.name ? originalWinner : alternative;
      const loser = winner === originalWinner ? alternative : originalWinner;
      if (!winner || !loser) throw new Error("invalid saved bracket");
      state.rounds[item.round + 1][item.match] = winner;
      state.history.push({ round: item.round, match: item.match, winner, loser });
    }
    const last = state.history.at(-1);
    if (state.history.length === TRACKS.length - 1) {
      showResult(last.winner);
      return;
    }
    state.round = last ? last.round : 0;
    state.match = last ? last.match + 1 : 0;
    const total = state.rounds[state.round].length / 2;
    if (state.match === total) { state.round += 1; state.match = 0; }
    el("intro-screen").classList.add("is-hidden");
    el("game-screen").classList.remove("is-hidden");
    setGameView();
  } catch { localStorage.removeItem(STORAGE_KEY); buildRounds(); }
}

function renderTrackList() {
  const fragment = document.createDocumentFragment();
  TRACKS.forEach((track) => { const item = document.createElement("li"); item.textContent = track; fragment.appendChild(item); });
  el("track-list").appendChild(fragment);
}

function toggleDrawer(open) {
  const drawer = el("track-drawer");
  drawer.classList.toggle("is-open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  document.body.style.overflow = open ? "hidden" : "";
}

function setSound(active) {
  state.sound = active;
  const button = el("sound-toggle");
  button.setAttribute("aria-pressed", String(active));
  button.setAttribute("aria-label", active ? "关闭环境音效" : "开启环境音效");
  if (!active) { clearInterval(soundTimer); soundContext?.close(); soundContext = null; return; }
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return;
  soundContext = new Context();
  const chime = () => {
    if (!soundContext) return;
    const oscillator = soundContext.createOscillator(); const gain = soundContext.createGain();
    oscillator.type = "sine"; oscillator.frequency.value = 173 + Math.random() * 70;
    gain.gain.setValueAtTime(.0001, soundContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.018, soundContext.currentTime + .08);
    gain.gain.exponentialRampToValueAtTime(.0001, soundContext.currentTime + 1.8);
    oscillator.connect(gain).connect(soundContext.destination); oscillator.start(); oscillator.stop(soundContext.currentTime + 1.9);
  };
  chime(); soundTimer = setInterval(chime, 2900);
}

function drawPoster() {
  const canvas = el("poster-canvas");
  const scale = 2; const width = 1080; const rowHeight = 32; const top = 420;
  const height = top + 8 * 52 + (TRACKS.length * rowHeight) + 120;
  canvas.width = width * scale; canvas.height = height * scale;
  const ctx = canvas.getContext("2d"); ctx.scale(scale, scale);
  ctx.fillStyle = "#e9e4d9"; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#19191b"; ctx.fillRect(50, 52, 8, 190);
  ctx.fillStyle = "#a6342c"; ctx.fillRect(50, 254, 8, 80);
  ctx.fillStyle = "#a6342c"; ctx.font = "500 17px DM Mono, monospace"; ctx.fillText("JOKER XUE / SONG ARCHIVE", 88, 84);
  ctx.fillStyle = "#19191b"; ctx.font = "500 58px Noto Serif SC, serif"; ctx.fillText("我的歌曲淘汰赛", 88, 166);
  ctx.fillStyle = "#766f66"; ctx.font = "400 22px Noto Serif SC, serif"; ctx.fillText("从 128 首候选曲目里，留下这一首。", 88, 212);
  const winner = state.history.at(-1)?.winner?.name || "";
  ctx.strokeStyle = "#19191b"; ctx.lineWidth = 1; ctx.strokeRect(740, 74, 270, 172);
  ctx.fillStyle = "#a6342c"; ctx.font = "500 13px DM Mono, monospace"; ctx.fillText("FINAL KEEP", 766, 108);
  ctx.fillStyle = "#19191b"; ctx.font = "500 39px Noto Serif SC, serif"; drawWrapped(ctx, winner, 766, 165, 215, 48);
  ctx.fillStyle = "#a6342c"; ctx.fillRect(50, 372, width - 100, 2);
  ctx.fillStyle = "#19191b"; ctx.font = "500 15px DM Mono, monospace"; ctx.fillText("完整晋级记录", 50, 408);
  const headings = ["128 进 64", "64 进 32", "32 进 16", "16 进 8", "八强", "四强", "半决赛", "冠军"];
  let y = top;
  headings.forEach((heading, round) => {
    const entries = state.history.filter((item) => item.round === round);
    ctx.fillStyle = "#a6342c"; ctx.font = "500 13px DM Mono, monospace"; ctx.fillText(`${String(round + 1).padStart(2, "0")}  ${heading}`, 50, y);
    y += 26;
    entries.forEach((item, index) => {
      ctx.strokeStyle = "rgba(25,25,27,.22)"; ctx.beginPath(); ctx.moveTo(50, y + 10); ctx.lineTo(width - 50, y + 10); ctx.stroke();
      ctx.fillStyle = "#766f66"; ctx.font = "400 12px DM Mono, monospace"; ctx.fillText(String(index + 1).padStart(2, "0"), 52, y + 3);
      ctx.fillStyle = "#19191b"; ctx.font = "500 17px Noto Serif SC, serif"; ctx.fillText(item.winner.name, 104, y + 3);
      ctx.fillStyle = "#766f66"; ctx.font = "400 13px Noto Serif SC, serif"; ctx.fillText(`胜出 · ${item.loser.name}`, 690, y + 3);
      y += rowHeight;
    });
    y += 26;
  });
  ctx.fillStyle = "#19191b"; ctx.fillRect(50, height - 67, width - 100, 1);
  ctx.fillStyle = "#766f66"; ctx.font = "400 12px DM Mono, monospace"; ctx.fillText("LOCAL EDITION · JOKER XUE SONG WORLD CUP", 50, height - 35);
  return canvas;
}

function drawWrapped(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = [...text]; let line = ""; let lineY = y;
  chars.forEach((char) => { if (ctx.measureText(line + char).width > maxWidth && line) { ctx.fillText(line, x, lineY); line = char; lineY += lineHeight; } else line += char; });
  if (line) ctx.fillText(line, x, lineY);
}

function savePoster() {
  const canvas = drawPoster();
  const link = document.createElement("a"); link.download = `薛之谦歌曲淘汰赛-${state.history.at(-1).winner.name}.png`; link.href = canvas.toDataURL("image/png"); link.click();
  el("save-status").textContent = "完整晋级长图已生成。";
}

buildRounds(); renderTrackList(); restoreState();
el("start-button").addEventListener("click", startGame);
el("choice-left").addEventListener("click", () => choose("left"));
el("choice-right").addEventListener("click", () => choose("right"));
el("undo-button").addEventListener("click", undo);
el("restart-button").addEventListener("click", resetGame);
el("save-poster").addEventListener("click", savePoster);
el("open-track-list").addEventListener("click", () => toggleDrawer(true));
el("close-track-list").addEventListener("click", () => toggleDrawer(false));
el("track-drawer").addEventListener("click", (event) => { if (event.target === el("track-drawer")) toggleDrawer(false); });
el("sound-toggle").addEventListener("click", () => setSound(!state.sound));
document.addEventListener("keydown", (event) => { if (event.key === "Escape") toggleDrawer(false); });
