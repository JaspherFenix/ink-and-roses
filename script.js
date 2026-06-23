const petalField = document.querySelector(".petal-field");
const searchInput = document.querySelector("#searchName");
const searchResults = document.querySelector("#searchResults");
const resultSummary = document.querySelector("#resultSummary");
const archiveResults = document.querySelector("#archiveResults");
const confessionForm = document.querySelector("#confessionForm");
const recipientInput = document.querySelector("#recipientName");
const messageInput = document.querySelector("#confessionMessage");
const wordCount = document.querySelector("#wordCount");
const inkMood = document.querySelector("#inkMood");
const formResponse = document.querySelector(".form-response");
const detailResponse = document.querySelector(".detail-response");
const canvas = document.querySelector("#loveSketch");
const colorInput = document.querySelector("#inkColor");
const brushInput = document.querySelector("#brushSize");
const toolButtons = document.querySelectorAll("[data-tool]");
const undoButton = document.querySelector("#undoSketch");
const clearButton = document.querySelector("#clearSketch");
const downloadButton = document.querySelector("#downloadSketch");
const copyConfessionButton = document.querySelector("#copyConfession");
const downloadConfessionButton = document.querySelector("#downloadConfession");
const scrollTriggers = document.querySelectorAll("[data-scroll-target]");
const sealedTo = document.querySelector(".sealed-to");
const sealedMessage = document.querySelector(".sealed-message");
const sealedSketch = document.querySelector("#sealedSketch");
const letterStage = document.querySelector("#letterStage");
const letterSealName = document.querySelector("#letterSealName");
const confessionStorageKey = "roseboundLettersConfessions";
const legacyArchiveStorageKey = ["face", "less", "Dream", "Confessions"].join("");
const legacyConfessionStorageKey = ["face", "less", "Dream", "LastConfession"].join("");
const nonDemoCleanupStorageKey = "roseboundLettersNonDemoCleanupV1";
const homeArtworkPath = ["assets", `${["medieval", "dream", "garden"].join("-")}.png`].join("/");

let activeTool = "pen";
let isDrawing = false;
let lastPoint = null;
let sketchHistory = [];
let latestConfession = null;
let confessions = [];
let ctx = null;

function demoSketchData(seed, ink = "#541928") {
  const offset = seed * 7;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 520">
      <rect width="420" height="520" fill="#fffaf0"/>
      <path d="M120 ${154 + offset} C146 72 274 72 300 ${154 + offset} C324 230 302 346 210 390 C118 346 96 230 120 ${154 + offset}Z" fill="none" stroke="${ink}" stroke-width="10" stroke-linecap="round"/>
      <path d="M132 180 C150 142 184 122 210 124 C250 126 282 152 294 190" fill="none" stroke="#253d2d" stroke-width="8" stroke-linecap="round"/>
      <path d="M160 254 C178 242 194 242 210 256 C226 242 244 242 262 254" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round"/>
      <path d="M166 320 C190 342 232 342 258 320" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>
      <path d="M104 416 C142 392 176 398 210 430 C246 398 280 392 316 416" fill="none" stroke="#8c6b2a" stroke-width="8" stroke-linecap="round"/>
      <circle cx="${138 + offset}" cy="96" r="16" fill="#8f2f47" opacity=".35"/>
      <circle cx="${296 - offset}" cy="446" r="18" fill="#8f2f47" opacity=".32"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function blankSketchData() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 520">
      <rect width="420" height="520" fill="#fffaf0"/>
      <path d="M78 138 H342 M78 382 H342" stroke="#c9a24d" stroke-width="6" stroke-linecap="round" opacity=".42"/>
      <path d="M132 248 C166 212 246 212 288 248 M150 308 C184 336 238 336 270 308" fill="none" stroke="#541928" stroke-width="8" stroke-linecap="round" opacity=".42"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const demoConfessions = [
  {
    id: "demo-elena",
    recipient: "Elena",
    message: "I pass your name like a candle from one quiet thought to another. If I ever seem brave, it is because your smile taught my heart to stand still.",
    sketch: demoSketchData(1),
    sealedAt: "2026-06-23T19:20:00.000Z",
    demo: true,
  },
  {
    id: "demo-mira",
    recipient: "Mira",
    message: "There are halls in me that were only stone until you laughed. Now even the shadows know where to place their flowers.",
    sketch: demoSketchData(2, "#253d2d"),
    sealedAt: "2026-06-23T18:10:00.000Z",
    demo: true,
  },
  {
    id: "demo-aurora",
    recipient: "Aurora",
    message: "Your name sounds like morning entering a castle window. I keep it carefully, as if one careless word could wake the whole kingdom.",
    sketch: demoSketchData(3),
    sealedAt: "2026-06-23T17:45:00.000Z",
    demo: true,
  },
  {
    id: "demo-luna",
    recipient: "Luna",
    message: "If the moon ever asks why I look up so often, I will tell it the truth: I am searching for the same light I found in you.",
    sketch: demoSketchData(4, "#8c6b2a"),
    sealedAt: "2026-06-23T16:05:00.000Z",
    demo: true,
  },
  {
    id: "demo-seraphina",
    recipient: "Seraphina",
    message: "I have written your name only in my mind, but every rose in this garden has learned it from the way I become quiet.",
    sketch: demoSketchData(5),
    sealedAt: "2026-06-23T14:50:00.000Z",
    demo: true,
  },
  {
    id: "demo-celeste",
    recipient: "Celeste",
    message: "You are the soft thunder before rain, the small golden fear before confession, the reason my silence keeps turning into poetry.",
    sketch: demoSketchData(6, "#253d2d"),
    sealedAt: "2026-06-23T13:35:00.000Z",
    demo: true,
  },
  {
    id: "demo-isabelle",
    recipient: "Isabelle",
    message: "If courage were a letter, this would be mine: I like you more gently than a song, and more honestly than I know how to hide.",
    sketch: demoSketchData(7),
    sealedAt: "2026-06-23T12:15:00.000Z",
    demo: true,
  },
  {
    id: "demo-rosalie",
    recipient: "Rosalie",
    message: "Every rose here is only pretending to be a flower. I know the truth. They are all small red witnesses to how much I think of you.",
    sketch: demoSketchData(8, "#8f2f47"),
    sealedAt: "2026-06-23T11:00:00.000Z",
    demo: true,
  },
];

function createPetal() {
  if (!petalField || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const petal = document.createElement("span");
  const duration = 8 + Math.random() * 8;
  const drift = Math.round((Math.random() - 0.5) * 180);

  petal.className = "petal";
  petal.style.left = `${Math.random() * 100}%`;
  petal.style.animationDuration = `${duration}s`;
  petal.style.setProperty("--drift", `${drift}px`);
  petal.style.setProperty("--petal-scale", `${0.75 + Math.random() * 0.75}`);
  petal.style.animationDelay = `${Math.random() * 1.5}s`;

  petalField.appendChild(petal);
  window.setTimeout(() => petal.remove(), (duration + 2) * 1000);
}

window.setInterval(createPetal, 850);

if (window.lucide) {
  window.lucide.createIcons();
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `confession-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function normalizeConfession(confession) {
  const savedSketch = String(confession.sketch || "");
  const sketch = savedSketch === homeArtworkPath ? "" : savedSketch;

  return {
    id: confession.id || makeId(),
    recipient: String(confession.recipient || "The moonlit dream").trim(),
    message: String(confession.message || "").trim(),
    sketch: sketch || blankSketchData(),
    sealedAt: confession.sealedAt || new Date().toISOString(),
    demo: Boolean(confession.demo),
  };
}

function sortByNewest(items) {
  return [...items].sort((a, b) => new Date(b.sealedAt) - new Date(a.sealedAt));
}

function saveConfessions() {
  try {
    window.localStorage.setItem(confessionStorageKey, JSON.stringify(confessions));
  } catch (error) {
    console.warn("Rosebound Letters could not keep these confessions.", error);
  }
}

function clearSavedNonDemoConfessionsOnce() {
  try {
    if (window.localStorage.getItem(nonDemoCleanupStorageKey)) {
      return;
    }

    window.localStorage.removeItem(confessionStorageKey);
    window.localStorage.removeItem(legacyArchiveStorageKey);
    window.localStorage.removeItem(legacyConfessionStorageKey);
    window.localStorage.setItem(nonDemoCleanupStorageKey, "true");
  } catch (error) {
    console.warn("Rosebound Letters could not clear older saved confessions.", error);
  }
}

function loadConfessions() {
  try {
    clearSavedNonDemoConfessionsOnce();

    const savedArchive = JSON.parse(window.localStorage.getItem(confessionStorageKey) || "[]");
    const savedLegacyArchive = JSON.parse(window.localStorage.getItem(legacyArchiveStorageKey) || "[]");
    const savedLegacy = JSON.parse(window.localStorage.getItem(legacyConfessionStorageKey) || "null");
    const archiveItems = Array.isArray(savedArchive) ? savedArchive : [];
    const legacyArchiveItems = Array.isArray(savedLegacyArchive) ? savedLegacyArchive : [];
    const mergedItems = savedLegacy
      ? [savedLegacy, ...archiveItems, ...legacyArchiveItems, ...demoConfessions]
      : [...archiveItems, ...legacyArchiveItems, ...demoConfessions];
    const byId = new Map();

    mergedItems.map(normalizeConfession).forEach((confession) => {
      if (confession.message) {
        byId.set(confession.id, confession);
      }
    });

    confessions = sortByNewest([...byId.values()]);
    saveConfessions();
  } catch (error) {
    console.warn("The letter registry could not be opened.", error);
    confessions = sortByNewest(demoConfessions.map(normalizeConfession));
  }
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch (error) {
    return "Moonlit hour";
  }
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name) || "";
}

function scrollToPageSection(targetId) {
  const section = document.getElementById(targetId);

  if (!section) {
    window.location.href = `index.html#${encodeURIComponent(targetId)}`;
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  section.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });

  if (window.history && typeof window.history.replaceState === "function") {
    window.history.replaceState(null, "", `#${targetId}`);
  }
}

function findMatches(query) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return confessions.slice(0, 8);
  }

  return confessions.filter((confession) => confession.recipient.toLowerCase().includes(normalized));
}

function renderEmptySearch(text) {
  if (!searchResults) {
    return;
  }

  searchResults.replaceChildren();
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = text;
  searchResults.appendChild(empty);
}

function renderSearchResults(matches, query) {
  if (!searchResults || !resultSummary) {
    return;
  }

  if (matches.length === 0) {
    resultSummary.textContent = query ? `No sealed names matched "${query}".` : "No sealed names are showing yet.";
    renderEmptySearch("No matching names in the candlelit registry.");
    return;
  }

  resultSummary.textContent = query
    ? `${matches.length} sealed ${matches.length === 1 ? "name" : "names"} matched "${query}".`
    : "Showing the newest sealed names in the registry.";

  searchResults.replaceChildren();

  matches.forEach((confession) => {
    const link = document.createElement("a");
    const name = document.createElement("span");
    const preview = document.createElement("span");
    const date = document.createElement("span");

    link.className = "search-result";
    link.href = `confession.html?id=${encodeURIComponent(confession.id)}`;
    name.className = "result-name";
    preview.className = "result-preview";
    date.className = "result-date";

    name.textContent = confession.recipient;
    preview.textContent = confession.demo ? "Demo sealed paper" : "Sealed paper";
    date.textContent = formatDate(confession.sealedAt);

    link.append(name, preview, date);
    searchResults.appendChild(link);
  });
}

function renderArchive() {
  if (!archiveResults) {
    return;
  }

  archiveResults.replaceChildren();

  if (confessions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No paper letters are sealed yet.";
    archiveResults.appendChild(empty);
    return;
  }

  confessions.forEach((confession) => {
    const link = document.createElement("a");
    const paper = document.createElement("span");
    const icon = document.createElement("i");
    const copy = document.createElement("span");
    const name = document.createElement("span");
    const preview = document.createElement("span");
    const date = document.createElement("span");

    link.className = "archive-card";
    link.href = `confession.html?id=${encodeURIComponent(confession.id)}`;
    paper.className = "archive-paper";
    icon.setAttribute("data-lucide", "mail");
    copy.className = "archive-copy";
    name.className = "result-name";
    preview.className = "result-preview";
    date.className = "result-date";

    name.textContent = confession.recipient;
    preview.textContent = confession.demo ? "Demo paper letter" : "Anonymous paper letter";
    date.textContent = formatDate(confession.sealedAt);

    paper.appendChild(icon);
    copy.append(name, preview, date);
    link.append(paper, copy);
    archiveResults.appendChild(link);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function setStatus(text) {
  if (formResponse) {
    formResponse.textContent = text;
  }

  if (detailResponse) {
    detailResponse.textContent = text;
  }
}

function closeLetter() {
  if (!letterStage) {
    return;
  }

  letterStage.classList.remove("is-open");
}

function openLetter() {
  if (!letterStage || !latestConfession) {
    return;
  }

  letterStage.classList.toggle("is-open");
}

function renderSelectedLetter(confession) {
  if (!sealedTo || !sealedMessage || !sealedSketch) {
    return;
  }

  latestConfession = confession;
  sealedTo.textContent = `To ${confession.recipient}`;
  sealedMessage.textContent = confession.message;
  sealedSketch.src = confession.sketch;
  sealedSketch.alt = `Sketch attached to the confession for ${confession.recipient}.`;

  if (letterSealName) {
    letterSealName.textContent = confession.recipient;
  }

  closeLetter();
}

function initResultsPage() {
  if (!searchResults) {
    return;
  }

  const query = getQueryParam("q");

  if (searchInput) {
    searchInput.value = query;
  }

  renderSearchResults(findMatches(query), query);
}

function initConfessionPage() {
  if (!letterStage) {
    return;
  }

  const id = getQueryParam("id");
  const confession = confessions.find((item) => item.id === id) || confessions[0];

  if (confession) {
    renderSelectedLetter(confession);
  }
}

function fillSketchPaper() {
  if (!ctx || !canvas) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function resetSketch() {
  sketchHistory = [];
  fillSketchPaper();
  saveSketchState();
}

function saveSketchState() {
  if (!ctx || !canvas) {
    return;
  }

  if (sketchHistory.length > 18) {
    sketchHistory.shift();
  }

  sketchHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

function restoreSketchState() {
  if (!ctx || !canvas || sketchHistory.length === 0) {
    return;
  }

  const previousState = sketchHistory.pop();
  ctx.putImageData(previousState, 0, 0);
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function drawLine(from, to) {
  if (!ctx) {
    return;
  }

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Number(brushInput?.value || 7);

  if (activeTool === "eraser") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Number(brushInput?.value || 7) * 2.2;
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = colorInput?.value || "#541928";
  }

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function startSketch(event) {
  if (!canvas) {
    return;
  }

  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  saveSketchState();
  isDrawing = true;
  lastPoint = getCanvasPoint(event);
  drawLine(lastPoint, lastPoint);
}

function moveSketch(event) {
  if (!isDrawing || !lastPoint) {
    return;
  }

  event.preventDefault();
  const nextPoint = getCanvasPoint(event);
  drawLine(lastPoint, nextPoint);
  lastPoint = nextPoint;
}

function endSketch(event) {
  if (!canvas) {
    return;
  }

  isDrawing = false;
  lastPoint = null;

  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

function setActiveTool(tool) {
  activeTool = tool;

  toolButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tool === tool);
  });
}

function downloadSketch() {
  if (!canvas) {
    return;
  }

  const link = document.createElement("a");
  link.download = "rosebound-letter-sketch.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function updateMessageMetrics() {
  if (!messageInput || !wordCount || !inkMood) {
    return;
  }

  const words = messageInput.value.trim().split(/\s+/).filter(Boolean);
  const wordTotal = words.length;
  wordCount.textContent = `${wordTotal} ${wordTotal === 1 ? "word" : "words"}`;

  if (wordTotal >= 60) {
    inkMood.textContent = "Moonlit vow";
  } else if (wordTotal >= 24) {
    inkMood.textContent = "Hidden letter";
  } else {
    inkMood.textContent = "Rose ink";
  }
}

function wrapCardText(cardContext, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let linesDrawn = 0;

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const testLine = line ? `${line} ${word}` : word;
    const isLastWord = index === words.length - 1;

    if (cardContext.measureText(testLine).width > maxWidth && line) {
      cardContext.fillText(line, x, y + linesDrawn * lineHeight);
      line = word;
      linesDrawn += 1;

      if (linesDrawn >= maxLines) {
        return;
      }
    } else {
      line = testLine;
    }

    if (isLastWord && line && linesDrawn < maxLines) {
      cardContext.fillText(line, x, y + linesDrawn * lineHeight);
      linesDrawn += 1;
    }
  }
}

function getConfessionText() {
  if (!latestConfession) {
    return "";
  }

  return `To ${latestConfession.recipient}\n\n${latestConfession.message}`;
}

async function copyConfessionText() {
  if (!latestConfession) {
    return;
  }

  const text = getConfessionText();

  try {
    await navigator.clipboard.writeText(text);
    setStatus("The sealed confession text has been copied.");
  } catch (error) {
    setStatus("The confession is sealed in Rosebound Letters, but copying was blocked.");
  }
}

function downloadConfessionCard() {
  if (!latestConfession) {
    return;
  }

  const cardCanvas = document.createElement("canvas");
  const cardContext = cardCanvas.getContext("2d");
  const sketchImage = new Image();

  cardCanvas.width = 1200;
  cardCanvas.height = 760;

  sketchImage.addEventListener("load", () => {
    cardContext.fillStyle = "#fff8e8";
    cardContext.fillRect(0, 0, cardCanvas.width, cardCanvas.height);
    cardContext.fillStyle = "#f3e8cf";
    cardContext.fillRect(36, 36, cardCanvas.width - 72, cardCanvas.height - 72);
    cardContext.strokeStyle = "#c9a24d";
    cardContext.lineWidth = 4;
    cardContext.strokeRect(56, 56, cardCanvas.width - 112, cardCanvas.height - 112);
    cardContext.strokeStyle = "rgba(84, 25, 40, 0.35)";
    cardContext.lineWidth = 2;
    cardContext.strokeRect(76, 76, cardCanvas.width - 152, cardCanvas.height - 152);

    cardContext.fillStyle = "#541928";
    cardContext.font = "700 30px Georgia";
    cardContext.fillText(`To ${latestConfession.recipient}`, 108, 142);

    cardContext.fillStyle = "#201712";
    cardContext.font = "italic 32px Georgia";
    wrapCardText(cardContext, latestConfession.message, 108, 210, 620, 46, 8);

    cardContext.fillStyle = "#8c6b2a";
    cardContext.font = "italic 28px Georgia";
    cardContext.fillText("Sent from Rosebound Letters", 108, 650);

    cardContext.drawImage(sketchImage, 790, 168, 300, 300);
    cardContext.strokeStyle = "#541928";
    cardContext.lineWidth = 3;
    cardContext.strokeRect(790, 168, 300, 300);

    const link = document.createElement("a");
    link.download = "rosebound-letter-confession.png";
    link.href = cardCanvas.toDataURL("image/png");
    link.click();
    setStatus("The confession card has been downloaded.");
  });

  sketchImage.src = latestConfession.sketch;
}

function sealConfession(event) {
  event.preventDefault();

  if (!recipientInput || !messageInput || !canvas) {
    return;
  }

  const recipient = recipientInput.value.trim();
  const message = messageInput.value.trim();

  if (!recipient || !message) {
    setStatus("The rose seal needs a name and a message.");
    return;
  }

  const confession = normalizeConfession({
    id: makeId(),
    recipient,
    message,
    sketch: canvas.toDataURL("image/png"),
    sealedAt: new Date().toISOString(),
  });

  confessions = sortByNewest([confession, ...confessions]);
  saveConfessions();
  renderArchive();
  confessionForm.reset();
  resetSketch();
  updateMessageMetrics();
  setStatus("Your anonymous confession has been sent to the archive.");
  scrollToPageSection("archive");
}

if (canvas) {
  ctx = canvas.getContext("2d", { willReadFrequently: true });
  fillSketchPaper();
  saveSketchState();
  canvas.addEventListener("pointerdown", startSketch);
  canvas.addEventListener("pointermove", moveSketch);
  canvas.addEventListener("pointerup", endSketch);
  canvas.addEventListener("pointercancel", endSketch);
  canvas.addEventListener("pointerleave", endSketch);
}

toolButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTool(button.dataset.tool));
});

undoButton?.addEventListener("click", restoreSketchState);

clearButton?.addEventListener("click", () => {
  saveSketchState();
  fillSketchPaper();
});

downloadButton?.addEventListener("click", downloadSketch);
copyConfessionButton?.addEventListener("click", copyConfessionText);
downloadConfessionButton?.addEventListener("click", downloadConfessionCard);
messageInput?.addEventListener("input", updateMessageMetrics);
confessionForm?.addEventListener("submit", sealConfession);

scrollTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    scrollToPageSection(trigger.dataset.scrollTarget);
  });
});

letterStage?.addEventListener("click", openLetter);
letterStage?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openLetter();
  }
});

loadConfessions();
initResultsPage();
initConfessionPage();
renderArchive();
updateMessageMetrics();
