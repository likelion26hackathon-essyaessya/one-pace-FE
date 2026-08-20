// ============================================================
// 상태
// ============================================================

const state = {
  messages: [], // { sender, text, timestamp }
  currentChannel: "general",
  currentCounterpartCountry: CHANNEL_COUNTRY_MAP["general"] || "GB",
};

// ============================================================
// DOM 참조
// ============================================================

const messagesEl = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const culturePopup = document.getElementById("culturePopup");
const culturePopupClose = document.getElementById("culturePopupClose");
const cultureFlag = document.getElementById("cultureFlag");
const cultureCountryLabel = document.getElementById("cultureCountryLabel");
const cultureTimeInfo = document.getElementById("cultureTimeInfo");
const cultureDetected = document.getElementById("cultureDetected");
const cultureNuance = document.getElementById("cultureNuance");
const cultureSuggested = document.getElementById("cultureSuggested");
const cultureAccept = document.getElementById("cultureAccept");
const cultureDismiss = document.getElementById("cultureDismiss");
const cultureAnalyzing = document.getElementById("cultureAnalyzing");

const onepaceTrigger = document.getElementById("onepaceTrigger");
const rightPanel = document.getElementById("rightPanel");
const closePanel = document.getElementById("closePanel");
const summaryBtn = document.getElementById("summaryBtn");
const summaryLoading = document.getElementById("summaryLoading");
const summaryError = document.getElementById("summaryError");
const summaryRetryBtn = document.getElementById("summaryRetryBtn");
const summaryResult = document.getElementById("summaryResult");
const summaryText = document.getElementById("summaryText");
const summaryDecisions = document.getElementById("summaryDecisions");
const summaryActionItems = document.getElementById("summaryActionItems");
const postSummary = document.getElementById("postSummary");

const workspaceMenuBtn = document.getElementById("workspaceMenuBtn");
const profileTrigger = document.getElementById("profileTrigger");

const toast = document.getElementById("toast");

// ============================================================
// 토스트 (9절 정책)
// ============================================================

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2000);
}

workspaceMenuBtn.addEventListener("click", () => {
  showToast("데모 버전에서는 지원하지 않는 기능이에요");
});

profileTrigger.addEventListener("click", () => {
  showToast("데모 버전에서는 지원하지 않는 기능이에요");
});

// ============================================================
// 메시지 렌더링 / 전송
// ============================================================

const AVATAR_MAP = {
  Emma: { initial: "E", cls: "emma" },
  James: { initial: "J", cls: "james" },
  Sarah: { initial: "S", cls: "sarah" },
  You: { initial: "Y", cls: "me" },
  "ONE PACE": { initial: "✦", cls: "onepace" },
};

function formatKoreanTime(date) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const period = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${hour12}:${String(minute).padStart(2, "0")}`;
}

function seedInitialMessages() {
  const today = new Date();
  const at = (h, m) => {
    const d = new Date(today);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  state.messages.push(
    {
      sender: "Emma",
      text: "Hi everyone! We need to finalize the landing page this week.",
      timestamp: at(10, 24),
    },
    {
      sender: "James",
      text: "Could we finish the design today? We need to move on to development.",
      timestamp: at(10, 27),
    },
    {
      sender: "Sarah",
      text: "I think that should be possible. I'll check with the design team.",
      timestamp: at(10, 31),
    }
  );
}

function renderMessage(message) {
  const avatar = AVATAR_MAP[message.sender] || { initial: message.sender[0] || "?", cls: "" };

  const article = document.createElement("article");
  article.className = "message";

  const avatarDiv = document.createElement("div");
  avatarDiv.className = `avatar ${avatar.cls}`;
  avatarDiv.textContent = avatar.initial;

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";

  const metaDiv = document.createElement("div");
  metaDiv.className = "message-meta";
  const strong = document.createElement("strong");
  strong.textContent = message.sender;
  const span = document.createElement("span");
  span.textContent = formatKoreanTime(new Date(message.timestamp));
  metaDiv.append(strong, span);

  const p = document.createElement("p");
  p.textContent = message.text;

  contentDiv.append(metaDiv, p);
  article.append(avatarDiv, contentDiv);
  messagesEl.appendChild(article);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const message = { sender: "You", text, timestamp: new Date().toISOString() };
  state.messages.push(message);
  renderMessage(message);

  messageInput.value = "";
  hideCulturePopup();
  cultureAnalyzing.classList.add("hidden");
  lastAnalyzedText = "";
  if (abortController) abortController.abort();
  clearTimeout(debounceTimer);
}

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ============================================================
// 문화번역기 (6.3, 6.4)
// ============================================================

const TIMEZONE_MAP = { GB: "Europe/London", US: "America/New_York", JP: "Asia/Tokyo" };
const COUNTRY_LABEL = { GB: "UK Business Culture", US: "US Business Culture", JP: "Japan Business Culture" };
const COUNTRY_FLAG = { GB: "🇬🇧", US: "🇺🇸", JP: "🇯🇵" };
const COUNTRY_CITY = { GB: "런던", US: "뉴욕", JP: "도쿄" };

function getCounterpartTimeInfo(countryCode) {
  const tz = TIMEZONE_MAP[countryCode];
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(now));
  const timeStr = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(now);
  const isAfterWork = hour < 9 || hour >= 18;
  return { label: COUNTRY_LABEL[countryCode], timeStr, statusText: isAfterWork ? "퇴근 후" : "업무 시간" };
}

function getCurrentCounterpartCountry() {
  return state.currentCounterpartCountry;
}

let debounceTimer = null;
let abortController = null;
let lastAnalyzedText = "";
let lastCultureData = null;

const CULTURE_DEBOUNCE_MS = 300; // 실시간에 가깝게 느껴지도록 최소한으로만 대기

messageInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const text = messageInput.value;
  if (text.length < 5) {
    hideCulturePopup();
    cultureAnalyzing.classList.add("hidden");
    return;
  }

  cultureAnalyzing.classList.remove("hidden"); // 대기 중임을 즉시 보여줘 반응성 체감 향상

  debounceTimer = setTimeout(() => {
    if (text === lastAnalyzedText) {
      cultureAnalyzing.classList.add("hidden");
      return;
    }
    lastAnalyzedText = text;
    analyzeCultureTranslation(text);
  }, CULTURE_DEBOUNCE_MS);
});

async function analyzeCultureTranslation(text) {
  if (abortController) abortController.abort();
  const myController = new AbortController();
  abortController = myController;

  try {
    const res = await fetch(`${API_BASE_URL}/api/culture-translation/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, counterpartCountry: getCurrentCounterpartCountry() }),
      signal: myController.signal,
    });

    if (!res.ok) throw new Error("문화번역기 요청 실패");

    const data = await res.json();
    if (messageInput.value !== text) return; // 이미 텍스트가 바뀐 경우 무시

    if (data.riskDetected) {
      showCulturePopup(data);
    } else {
      hideCulturePopup();
    }
  } catch (e) {
    if (e.name !== "AbortError") console.error("문화번역기 분석 실패", e);
  } finally {
    if (abortController === myController) cultureAnalyzing.classList.add("hidden");
  }
}

function showCulturePopup(data) {
  lastCultureData = data;
  const country = getCurrentCounterpartCountry();
  const timeInfo = getCounterpartTimeInfo(country);

  cultureFlag.textContent = COUNTRY_FLAG[country] || "🏳️";
  cultureCountryLabel.textContent = timeInfo.label;
  cultureTimeInfo.textContent = `${COUNTRY_CITY[country] || ""} ${timeInfo.timeStr}(${timeInfo.statusText})`;
  cultureDetected.textContent = data.detectedExpression;
  cultureNuance.textContent = data.nuanceExplanation;
  cultureSuggested.textContent = data.suggestedText;

  culturePopup.classList.remove("hidden");
}

function hideCulturePopup() {
  culturePopup.classList.add("hidden");
}

culturePopupClose.addEventListener("click", hideCulturePopup);
cultureDismiss.addEventListener("click", hideCulturePopup);

cultureAccept.addEventListener("click", () => {
  if (!lastCultureData) return;
  messageInput.value = lastCultureData.suggestedText;
  hideCulturePopup();
});

// ============================================================
// AI 회의 요약 (6.5)
// ============================================================

let lastSummaryData = null;

onepaceTrigger.addEventListener("click", () => {
  rightPanel.classList.remove("hidden");
});

closePanel.addEventListener("click", () => {
  rightPanel.classList.add("hidden");
});

function setSummaryView(view) {
  summaryLoading.classList.toggle("hidden", view !== "loading");
  summaryError.classList.toggle("hidden", view !== "error");
  summaryResult.classList.toggle("hidden", view !== "result");
}

async function generateMeetingSummary() {
  setSummaryView("loading");

  try {
    const res = await fetch(`${API_BASE_URL}/api/meeting-summary/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: state.messages }),
    });

    if (!res.ok) throw new Error("AI 요약 요청 실패");

    const data = await res.json();
    lastSummaryData = data;
    renderSummaryResult(data);
    setSummaryView("result");
  } catch (e) {
    console.error("AI 요약 실패", e);
    setSummaryView("error");
  }
}

function renderSummaryResult(data) {
  summaryText.textContent = data.summary || "";

  summaryDecisions.innerHTML = "";
  (data.decisions || []).forEach((d) => {
    const li = document.createElement("li");
    li.textContent = `${d.decisionText} — ${d.decidedBy}`;
    summaryDecisions.appendChild(li);
  });

  summaryActionItems.innerHTML = "";
  (data.actionItems || []).forEach((a) => {
    const li = document.createElement("li");
    li.textContent = `${a.title} (담당: ${a.assignee}, 기한: ${a.dueDate})`;
    summaryActionItems.appendChild(li);
  });
}

summaryBtn.addEventListener("click", generateMeetingSummary);
summaryRetryBtn.addEventListener("click", generateMeetingSummary);

postSummary.addEventListener("click", () => {
  if (!lastSummaryData) return;

  const lines = [`요약: ${lastSummaryData.summary}`];

  if ((lastSummaryData.decisions || []).length) {
    lines.push("결정 사항:");
    lastSummaryData.decisions.forEach((d) => lines.push(`- ${d.decisionText} (${d.decidedBy})`));
  }

  if ((lastSummaryData.actionItems || []).length) {
    lines.push("미결 업무:");
    lastSummaryData.actionItems.forEach((a) =>
      lines.push(`- ${a.title} (담당: ${a.assignee}, 기한: ${a.dueDate})`)
    );
  }

  const message = { sender: "ONE PACE", text: lines.join("\n"), timestamp: new Date().toISOString() };
  state.messages.push(message);
  renderMessage(message);

  rightPanel.classList.add("hidden");
});

// ============================================================
// 초기화
// ============================================================

seedInitialMessages();
