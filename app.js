// ============================================================
// 상태
// ============================================================

const state = {
  conversations: { meeting: [], Emma: [], James: [], Sarah: [] }, // key별 message[]: { sender, text, timestamp }
  currentConversation: "Emma",
  currentCounterpartCountry: "US",
};

// ============================================================
// DOM 참조
// ============================================================

const messagesEl = document.getElementById("messages");
const composerWrap = document.querySelector(".composer-wrap");
const composerColumn = document.querySelector(".composer-column");
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

const counterpartStatus = document.getElementById("counterpartStatus");
const counterpartBubbleText = document.getElementById("counterpartBubbleText");

const onepaceTrigger = document.getElementById("onepaceTrigger");
const rightPanel = document.getElementById("rightPanel");
const closePanel = document.getElementById("closePanel");
const summaryIntro = document.getElementById("summaryIntro");
const panelSettingsBtn = document.getElementById("panelSettingsBtn");
const summaryCriteriaSelect = document.getElementById("summaryCriteriaSelect");
const summaryBtn = document.getElementById("summaryBtn");
const summaryLoading = document.getElementById("summaryLoading");
const summaryError = document.getElementById("summaryError");
const summaryRetryBtn = document.getElementById("summaryRetryBtn");
const summaryResult = document.getElementById("summaryResult");
const summaryRegenerateBtn = document.getElementById("summaryRegenerateBtn");
const summaryGoal = document.getElementById("summaryGoal");
const summaryAssignee = document.getElementById("summaryAssignee");
const summaryDueDate = document.getElementById("summaryDueDate");
const summaryUrgency = document.getElementById("summaryUrgency");
const summaryUrgencyDot = document.getElementById("summaryUrgencyDot");
const summaryApprovalStatus = document.getElementById("summaryApprovalStatus");
const summaryFeedbackStatus = document.getElementById("summaryFeedbackStatus");
const summaryGeneratedAt = document.getElementById("summaryGeneratedAt");
const summarySourceLabel = document.getElementById("summarySourceLabel");
const copySummaryBtn = document.getElementById("copySummaryBtn");
const postSummary = document.getElementById("postSummary");

const workspaceMenuBtn = document.getElementById("workspaceMenuBtn");
const profileTrigger = document.getElementById("profileTrigger");

const meetingChannelBtn = document.getElementById("meetingChannelBtn");
const counterpartSelectBtns = document.querySelectorAll(".counterpart-select");

const channelHash = document.getElementById("channelHash");
const channelNameEl = document.getElementById("channelName");
const channelDescriptionEl = document.getElementById("channelDescription");
const largeHash = document.getElementById("largeHash");
const introTitle = document.getElementById("introTitle");
const introDescription = document.getElementById("introDescription");

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

summaryCriteriaSelect.addEventListener("click", () => {
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
  "ONE PACE": { img: "logo-icon.png", cls: "onepace" },
};

function formatKoreanTime(date) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const period = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${hour12}:${String(minute).padStart(2, "0")}`;
}

// DM 상대 국가는 사이드바 버튼의 data-country를 단일 출처로 사용한다.
const DM_COUNTRY = {};
counterpartSelectBtns.forEach((btn) => {
  DM_COUNTRY[btn.textContent.trim()] = btn.dataset.country;
});

const CONVERSATION_META = {
  meeting: {
    title: "weekly-meeting",
    description: "주간 프로젝트 회의 및 AI 요약 데모용 채널",
    introTitle: "weekly-meeting에 오신 것을 환영합니다!",
    introDescription: "이곳은 회의 내용을 정리하고 AI 요약을 데모하는 회의방입니다.",
    isChannel: true,
  },
  Emma: {
    title: "Emma",
    description: "Emma님과의 다이렉트 메시지",
    introTitle: "Emma님과의 대화",
    introDescription: "이곳은 Emma님과 나누는 1:1 다이렉트 메시지입니다.",
    isChannel: false,
  },
  James: {
    title: "James",
    description: "James님과의 다이렉트 메시지",
    introTitle: "James님과의 대화",
    introDescription: "이곳은 James님과 나누는 1:1 다이렉트 메시지입니다.",
    isChannel: false,
  },
  Sarah: {
    title: "Sarah",
    description: "Sarah님과의 다이렉트 메시지",
    introTitle: "Sarah님과의 대화",
    introDescription: "이곳은 Sarah님과 나누는 1:1 다이렉트 메시지입니다.",
    isChannel: false,
  },
};

function seedConversations() {
  const today = new Date();
  const at = (h, m) => {
    const d = new Date(today);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  state.conversations.meeting = [
    { sender: "Emma", text: "Hi everyone! Let's kick off the weekly sync. Main goal today is locking down the landing page launch.", timestamp: at(10, 0) },
    { sender: "James", text: "From the dev side, the API integration is done. We just need final copy and design assets.", timestamp: at(10, 2) },
    { sender: "Sarah", text: "Design is about 90% done. I can have the final mockups ready by tomorrow.", timestamp: at(10, 5) },
    { sender: "Emma", text: "Great, let's decide: we'll launch the landing page next Monday.", timestamp: at(10, 8) },
    { sender: "James", text: "Agreed. I'll deploy the API changes to staging by Friday so we have time to test.", timestamp: at(10, 10) },
    { sender: "Sarah", text: "Sounds good. I'll send the final design files to James by tomorrow EOD.", timestamp: at(10, 12) },
    { sender: "Emma", text: "Perfect. I'll write the launch announcement and share it for review by Thursday.", timestamp: at(10, 15) },
    { sender: "James", text: "One more thing — we should also fix the mobile nav bug before launch, it's been reported twice.", timestamp: at(10, 18) },
    { sender: "Emma", text: "Good catch. James, can you own that fix as well?", timestamp: at(10, 19) },
    { sender: "James", text: "Sure, I'll take care of it along with the staging deploy on Friday.", timestamp: at(10, 20) },
  ];

  state.conversations.Emma = [
    { sender: "Emma", text: "Hi! Do you have a minute to check the landing page copy?", timestamp: at(9, 58) },
    { sender: "You", text: "Sure, I'll take a look and send feedback shortly.", timestamp: at(10, 2) },
    { sender: "Emma", text: "Thank you so much, I really appreciate it!", timestamp: at(10, 3) },
  ];

  state.conversations.James = [
    { sender: "James", text: "Could we finish the design today? We need to move on to development.", timestamp: at(11, 10) },
    { sender: "You", text: "I think that's doable, let me confirm with the team.", timestamp: at(11, 14) },
  ];

  state.conversations.Sarah = [
    { sender: "Sarah", text: "I checked with the design team, they can deliver by Friday.", timestamp: at(13, 40) },
    { sender: "You", text: "Great, thanks for confirming!", timestamp: at(13, 42) },
  ];
}

function renderConversation(key) {
  messagesEl.querySelectorAll(".message").forEach((el) => el.remove());
  (state.conversations[key] || []).forEach(renderMessage);
}

function switchConversation(key, { silent = false } = {}) {
  if (!silent && state.currentConversation === key) return;

  state.currentConversation = key;
  const meta = CONVERSATION_META[key];

  channelHash.style.display = meta.isChannel ? "" : "none";
  channelNameEl.textContent = meta.title;
  channelDescriptionEl.textContent = meta.description;
  largeHash.textContent = meta.isChannel ? "#" : meta.title[0];
  introTitle.textContent = meta.introTitle;
  introDescription.textContent = meta.introDescription;

  state.currentCounterpartCountry = meta.isChannel ? CHANNEL_COUNTRY_MAP.meeting || "GB" : DM_COUNTRY[key];
  updateCounterpartStatus();

  // 대화방을 옮기면 작성 중이던 메시지와 그에 딸린 분석 상태를 모두 초기화한다.
  messageInput.innerHTML = "";
  clearRiskyWord();
  cultureAnalyzing.classList.add("hidden");
  lastAnalyzedText = "";
  if (abortController) abortController.abort();
  clearTimeout(debounceTimer);

  syncComposerPadding();
  renderConversation(key);

  counterpartSelectBtns.forEach((b) => b.classList.toggle("active", !meta.isChannel && b.textContent.trim() === key));
  meetingChannelBtn.classList.toggle("active", meta.isChannel);

  if (!silent) {
    showToast(meta.isChannel ? `#${meta.title} 채널로 이동했어요` : `${DM_COUNTRY[key] ? COUNTRY_NATIONALITY[DM_COUNTRY[key]] : ""} ${key}님과의 대화로 전환됐어요`);
  }
}

// composer-wrap은 메시지 영역 위에 절대 위치로 겹쳐지므로, 실제 높이만큼 messages의
// 하단 패딩을 맞춰줘야 최신 메시지가 입력창에 가려지지 않는다.
// 지구본 말풍선/문화번역기 팝업이 열리고 닫힐 때마다 composer-wrap 높이가 바뀌므로 ResizeObserver로 추적한다.
function syncComposerPadding() {
  messagesEl.style.paddingBottom = `${composerWrap.offsetHeight + 20}px`;
}

new ResizeObserver(syncComposerPadding).observe(composerWrap);
syncComposerPadding();

function scrollMessagesToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderMessage(message) {
  const avatar = AVATAR_MAP[message.sender] || { initial: message.sender[0] || "?", cls: "" };

  const article = document.createElement("article");
  article.className = "message";

  const avatarDiv = document.createElement("div");
  avatarDiv.className = `avatar ${avatar.cls}`;
  if (avatar.img) {
    const img = document.createElement("img");
    img.src = avatar.img;
    img.alt = message.sender;
    avatarDiv.appendChild(img);
  } else {
    avatarDiv.textContent = avatar.initial;
  }

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";

  const metaDiv = document.createElement("div");
  metaDiv.className = "message-meta";
  const strong = document.createElement("strong");
  strong.textContent = message.sender;
  metaDiv.appendChild(strong);

  const senderCountry = DM_COUNTRY[message.sender];
  if (senderCountry && COUNTRY_FLAG_SVG[senderCountry]) {
    const flagSpan = document.createElement("span");
    flagSpan.className = "message-flag-icon";
    flagSpan.innerHTML = COUNTRY_FLAG_SVG[senderCountry];
    metaDiv.appendChild(flagSpan);
  }

  const span = document.createElement("span");
  span.textContent = formatKoreanTime(new Date(message.timestamp));
  metaDiv.appendChild(span);

  const p = document.createElement("p");
  p.textContent = message.text;

  contentDiv.append(metaDiv, p);
  article.append(avatarDiv, contentDiv);
  messagesEl.appendChild(article);
  scrollMessagesToBottom();
}

function getComposerText() {
  return messageInput.innerText;
}

function sendMessage() {
  const text = getComposerText().trim();
  if (!text) return;

  const message = { sender: "You", text, timestamp: new Date().toISOString() };
  state.conversations[state.currentConversation].push(message);
  renderMessage(message);

  messageInput.innerHTML = "";
  clearRiskyWord();
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
// Windows에서는 국기 이모지가 실제 국기 대신 국가 코드 텍스트로 렌더링되므로 인라인 SVG로 대체한다.
const COUNTRY_FLAG_SVG = {
  GB: `<svg viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none">
    <rect width="40" height="20" fill="#00247d"/>
    <path d="M0 0 L40 20 M40 0 L0 20" stroke="#fff" stroke-width="4"/>
    <path d="M0 0 L40 20 M40 0 L0 20" stroke="#cf142b" stroke-width="1.5"/>
    <path d="M20 0 V20 M0 10 H40" stroke="#fff" stroke-width="6"/>
    <path d="M20 0 V20 M0 10 H40" stroke="#cf142b" stroke-width="3"/>
  </svg>`,
  US: `<svg viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none">
    <rect width="40" height="20" fill="#fff"/>
    <g fill="#b22234">
      <rect y="0" width="40" height="1.54"/>
      <rect y="3.08" width="40" height="1.54"/>
      <rect y="6.15" width="40" height="1.54"/>
      <rect y="9.23" width="40" height="1.54"/>
      <rect y="12.31" width="40" height="1.54"/>
      <rect y="15.38" width="40" height="1.54"/>
      <rect y="18.46" width="40" height="1.54"/>
    </g>
    <rect width="17" height="10.77" fill="#3c3b6e"/>
    <g fill="#fff">
      <circle cx="3" cy="2.2" r="0.8"/>
      <circle cx="8" cy="2.2" r="0.8"/>
      <circle cx="13" cy="2.2" r="0.8"/>
      <circle cx="5.5" cy="5" r="0.8"/>
      <circle cx="10.5" cy="5" r="0.8"/>
      <circle cx="3" cy="7.8" r="0.8"/>
      <circle cx="8" cy="7.8" r="0.8"/>
      <circle cx="13" cy="7.8" r="0.8"/>
    </g>
  </svg>`,
  JP: `<svg viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none">
    <rect width="40" height="20" fill="#fff"/>
    <circle cx="20" cy="10" r="6" fill="#bc002d"/>
  </svg>`,
};
const COUNTRY_CITY = { GB: "런던", US: "뉴욕", JP: "도쿄" };
const COUNTRY_NATIONALITY = { GB: "영국인", US: "미국인", JP: "일본인" };

// DM 목록에 팀원 국적 국기를 표시한다.
counterpartSelectBtns.forEach((btn) => {
  const statusDot = btn.querySelector(".status");
  const flagSvg = COUNTRY_FLAG_SVG[btn.dataset.country];
  if (statusDot && flagSvg) {
    statusDot.insertAdjacentHTML("afterend", `<span class="dm-flag-icon">${flagSvg}</span>`);
  }
});

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

// 지구본 + 말풍선: 상대 팀원의 국적 및 현지 시간을 항상 표시 (백엔드 호출 없는 순수 프론트 로직)
function updateCounterpartStatus() {
  const country = getCurrentCounterpartCountry();
  if (!country || !COUNTRY_NATIONALITY[country]) {
    counterpartStatus.classList.add("hidden");
    return;
  }
  const timeInfo = getCounterpartTimeInfo(country);
  counterpartBubbleText.textContent = `${COUNTRY_NATIONALITY[country]} 팀원과 대화중이에요. (현지 시간 ${timeInfo.timeStr})`;
  counterpartStatus.classList.remove("hidden");
}

updateCounterpartStatus();
setInterval(updateCounterpartStatus, 60000);

// DM(Emma/James/Sarah) 클릭 시 해당 상대와의 1:1 대화로 전환한다.
counterpartSelectBtns.forEach((btn) => {
  btn.addEventListener("click", () => switchConversation(btn.textContent.trim()));
});

meetingChannelBtn.addEventListener("click", () => switchConversation("meeting"));

let debounceTimer = null;
let abortController = null;
let lastAnalyzedText = "";
let lastCultureData = null;
let activeRiskySpan = null; // 밑줄 쳐진 위험 단어 <span>. 클릭해야 팝업이 뜬다.

const CULTURE_DEBOUNCE_MS = 300; // 실시간에 가깝게 느껴지도록 최소한으로만 대기

// contenteditable 안의 caret 위치를 문자 오프셋으로 저장/복원한다.
// span으로 감싸는 DOM 변경(innerHTML 재작성) 후에도 커서가 튀지 않도록 하기 위함.
function getCaretOffset() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return 0;
  const range = selection.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(messageInput);
  preRange.setEnd(range.endContainer, range.endOffset);
  return preRange.toString().length;
}

function setCaretOffset(offset) {
  const range = document.createRange();
  const selection = window.getSelection();
  let remaining = offset;
  let found = false;

  (function walk(node) {
    if (found) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent.length;
      if (remaining <= len) {
        range.setStart(node, remaining);
        range.collapse(true);
        found = true;
      } else {
        remaining -= len;
      }
    } else {
      for (const child of node.childNodes) {
        walk(child);
        if (found) return;
      }
    }
  })(messageInput);

  if (!found) {
    range.selectNodeContents(messageInput);
    range.collapse(false);
  }
  selection.removeAllRanges();
  selection.addRange(range);
}

// 위험 단어 밑줄을 벗겨내고 원래 순수 텍스트로 되돌린다 (새 분석 전, 전송 전, 대화방 전환 시 호출).
function clearRiskyWord() {
  hideCulturePopup();
  if (activeRiskySpan && activeRiskySpan.isConnected) {
    const caretOffset = getCaretOffset();
    activeRiskySpan.replaceWith(document.createTextNode(activeRiskySpan.textContent));
    messageInput.normalize();
    setCaretOffset(caretOffset);
  }
  activeRiskySpan = null;
}

// 분석 결과로 감지된 표현을 입력창 안에서 찾아 밑줄 <span>으로 감싼다. 이 시점엔 팝업을 띄우지 않는다.
function markRiskyWord(data) {
  clearRiskyWord();

  const text = messageInput.textContent;
  const idx = text.indexOf(data.detectedExpression);
  if (idx === -1) return;

  const caretOffset = getCaretOffset();
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + data.detectedExpression.length);
  const after = text.slice(idx + data.detectedExpression.length);

  messageInput.innerHTML = "";
  messageInput.appendChild(document.createTextNode(before));
  const span = document.createElement("span");
  span.className = "risky-word";
  span.textContent = match;
  messageInput.appendChild(span);
  messageInput.appendChild(document.createTextNode(after));

  activeRiskySpan = span;
  lastCultureData = data;
  setCaretOffset(caretOffset);
}

messageInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  clearRiskyWord(); // 텍스트가 바뀌면 이전 분석 결과에 딸린 밑줄은 더 이상 유효하지 않다.
  if (messageInput.textContent.trim() === "") messageInput.innerHTML = "";

  const text = getComposerText();
  if (text.length < 5) {
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

// 밑줄 쳐진 단어를 클릭하면 그 위에 말풍선처럼 팝업을 띄운다.
messageInput.addEventListener("click", (e) => {
  const span = e.target.closest(".risky-word");
  if (!span || !lastCultureData) return;
  span.classList.add("highlighted"); // 회색 형광펜 박스
  showCulturePopupNear(span, lastCultureData);
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
    if (getComposerText() !== text) return; // 이미 텍스트가 바뀐 경우 무시

    if (data.riskDetected) {
      markRiskyWord(data);
    }
  } catch (e) {
    if (e.name !== "AbortError") console.error("문화번역기 분석 실패", e);
  } finally {
    if (abortController === myController) cultureAnalyzing.classList.add("hidden");
  }
}

function showCulturePopupNear(span, data) {
  const country = getCurrentCounterpartCountry();
  const timeInfo = getCounterpartTimeInfo(country);

  cultureFlag.innerHTML = COUNTRY_FLAG_SVG[country] || "";
  cultureCountryLabel.textContent = timeInfo.label;
  cultureTimeInfo.textContent = `${COUNTRY_CITY[country] || ""} ${timeInfo.timeStr}(${timeInfo.statusText})`;
  cultureDetected.textContent = data.detectedExpression;
  cultureNuance.textContent = data.nuanceExplanation;
  cultureSuggested.textContent = data.suggestedText;

  culturePopup.classList.remove("hidden");

  // 클릭한 단어 바로 위에 말풍선처럼 붙도록 팝업 위치를 매번 재계산한다.
  const spanRect = span.getBoundingClientRect();
  const colRect = composerColumn.getBoundingClientRect();

  culturePopup.style.bottom = `${colRect.bottom - spanRect.top + 8}px`;

  const popupWidth = culturePopup.offsetWidth;
  let left = spanRect.left - colRect.left - 20;
  left = Math.max(0, Math.min(left, colRect.width - popupWidth));
  culturePopup.style.left = `${left}px`;

  const tailLeft = spanRect.left + spanRect.width / 2 - colRect.left - left;
  culturePopup.style.setProperty("--tail-left", `${Math.max(16, Math.min(tailLeft, popupWidth - 16))}px`);
}

function hideCulturePopup() {
  culturePopup.classList.add("hidden");
  if (activeRiskySpan) activeRiskySpan.classList.remove("highlighted");
}

culturePopupClose.addEventListener("click", hideCulturePopup);
cultureDismiss.addEventListener("click", hideCulturePopup);

cultureAccept.addEventListener("click", () => {
  if (!lastCultureData || !activeRiskySpan) return;
  activeRiskySpan.replaceWith(document.createTextNode(lastCultureData.suggestedText));
  messageInput.normalize();
  activeRiskySpan = null;
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

panelSettingsBtn.addEventListener("click", () => {
  showToast("데모 버전에서는 지원하지 않는 기능이에요");
});

function setSummaryView(view) {
  summaryIntro.classList.toggle("hidden", view !== "idle");
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
      body: JSON.stringify({ messages: state.conversations[state.currentConversation] }),
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

function getUrgencyDotClass(urgency) {
  const text = urgency || "";
  if (/높음|긴급|urgent|high/i.test(text)) return "high";
  if (/낮음|여유|low/i.test(text)) return "low";
  return "";
}

function renderSummaryResult(data) {
  const detail = (data.actionItems && data.actionItems[0]) || {};

  summaryGoal.textContent = data.goal || "";
  summaryAssignee.textContent = detail.assignee || "";
  summaryDueDate.textContent = detail.dueDate || "";
  summaryUrgency.textContent = detail.urgency || "";
  summaryUrgencyDot.className = "urgency-dot " + getUrgencyDotClass(detail.urgency);
  summaryApprovalStatus.textContent = detail.approvalStatus || "";
  summaryFeedbackStatus.textContent = detail.feedbackStatus || "";

  summaryGeneratedAt.textContent = `${formatKoreanTime(new Date())} 기준`;
  summarySourceLabel.textContent = CONVERSATION_META[state.currentConversation].title;
}

function buildSummaryLines(data) {
  const detail = (data.actionItems && data.actionItems[0]) || {};

  return [
    `목표: ${data.goal}`,
    `담당자: ${detail.assignee}`,
    `마감기한: ${detail.dueDate}`,
    `긴급도: ${detail.urgency}`,
    `승인 상태: ${detail.approvalStatus}`,
    `피드백 상태: ${detail.feedbackStatus}`,
  ];
}

summaryBtn.addEventListener("click", generateMeetingSummary);
summaryRetryBtn.addEventListener("click", generateMeetingSummary);
summaryRegenerateBtn.addEventListener("click", generateMeetingSummary);

copySummaryBtn.addEventListener("click", async () => {
  if (!lastSummaryData) return;
  try {
    await navigator.clipboard.writeText(buildSummaryLines(lastSummaryData).join("\n"));
    showToast("요약 텍스트를 복사했어요");
  } catch (e) {
    showToast("복사에 실패했어요");
  }
});

postSummary.addEventListener("click", () => {
  if (!lastSummaryData) return;

  const message = { sender: "ONE PACE", text: buildSummaryLines(lastSummaryData).join("\n"), timestamp: new Date().toISOString() };
  state.conversations[state.currentConversation].push(message);
  renderMessage(message);

  rightPanel.classList.add("hidden");
  showToast("슬랙 채널에 공유했어요");
});

// ============================================================
// 초기화
// ============================================================

seedConversations();
switchConversation(state.currentConversation, { silent: true });
