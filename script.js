import {
  hasFirebaseConfig,
  loadFirebaseConfessions,
  saveFirebaseConfession,
} from "./firebase-client.js";

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
const chooseReferenceButton = document.querySelector("#chooseReference");
const referenceImageInput = document.querySelector("#referenceImageInput");
const referenceWindow = document.querySelector("#referenceWindow");
const referenceWindowBar = document.querySelector("#referenceWindowBar");
const referenceImage = document.querySelector("#referenceImage");
const closeReferenceButton = document.querySelector("#closeReference");
const referenceResizeHandle = document.querySelector("#referenceResizeHandle");
const referenceCropDialog = document.querySelector("#referenceCropDialog");
const referenceCropViewport = document.querySelector("#referenceCropViewport");
const referenceCropImage = document.querySelector("#referenceCropImage");
const referenceCropZoom = document.querySelector("#referenceCropZoom");
const cancelReferenceCropButton = document.querySelector("#cancelReferenceCrop");
const discardReferenceCropButton = document.querySelector("#discardReferenceCrop");
const applyReferenceCropButton = document.querySelector("#applyReferenceCrop");
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
const confessionStorageKey = "inkAndRosesConfessions";
const previousConfessionStorageKey = "roseboundLettersConfessions";
const legacyArchiveStorageKey = ["face", "less", "Dream", "Confessions"].join("");
const legacyConfessionStorageKey = ["face", "less", "Dream", "LastConfession"].join("");
const nonDemoCleanupStorageKey = "roseboundLettersNonDemoCleanupV1";
const homeArtworkPath = ["assets", `${["medieval", "dream", "garden"].join("-")}.png`].join("/");
const firebaseConfig = window.INK_AND_ROSES_FIREBASE_CONFIG || {};
const maximumSketchStrokes = 240;
const maximumSketchPoints = 12000;
const maximumPointsPerStroke = 1600;
const minimumPointDistance = 0.0015;

let activeTool = "pen";
let isDrawing = false;
let lastPoint = null;
let sketchStrokes = [];
let currentStroke = null;
let sketchPointCount = 0;
let latestConfession = null;
let confessions = [];
let ctx = null;
let referenceImageUrl = "";
let referenceInteraction = null;
let referenceCropSourceUrl = "";
let referenceCropState = null;
let referenceCropDrag = null;
let restoreReferenceAfterCrop = false;

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

function roundSketchValue(value) {
  return Math.round(value * 100000) / 100000;
}

function normalizeSketchPoint(point) {
  return {
    x: roundSketchValue(clamp(Number(point?.x) || 0, 0, 1)),
    y: roundSketchValue(clamp(Number(point?.y) || 0, 0, 1)),
  };
}

function normalizeSketchStroke(stroke) {
  const tool = stroke?.tool === "eraser" ? "eraser" : "pen";
  const color = /^#[0-9a-f]{6}$/i.test(String(stroke?.color || ""))
    ? String(stroke.color).toLowerCase()
    : "#541928";
  const size = roundSketchValue(clamp(Number(stroke?.size) || 0.008, 0.001, 0.12));
  const points = Array.isArray(stroke?.points)
    ? stroke.points.slice(0, maximumPointsPerStroke).map(normalizeSketchPoint)
    : [];

  return { tool, color, size, points };
}

function normalizeSketchData(sketch) {
  if (!sketch || typeof sketch !== "object" || !Array.isArray(sketch.strokes)) {
    return null;
  }

  const strokes = [];
  let pointCount = 0;

  for (const savedStroke of sketch.strokes.slice(0, maximumSketchStrokes)) {
    const stroke = normalizeSketchStroke(savedStroke);

    if (stroke.points.length === 0 || pointCount + stroke.points.length > maximumSketchPoints) {
      continue;
    }

    strokes.push(stroke);
    pointCount += stroke.points.length;
  }

  return {
    version: 1,
    strokes,
    strokeCount: strokes.length,
    pointCount,
  };
}

function createSketchData(strokes = sketchStrokes) {
  const normalized = normalizeSketchData({ version: 1, strokes });

  return normalized || {
    version: 1,
    strokes: [],
    strokeCount: 0,
    pointCount: 0,
  };
}

function normalizeConfession(confession) {
  const savedSketch = typeof confession.sketch === "string" ? confession.sketch : "";
  const legacySketch = savedSketch === homeArtworkPath ? "" : savedSketch;
  const sketchData = normalizeSketchData(
    confession.sketchData || (confession.sketch && typeof confession.sketch === "object" ? confession.sketch : null),
  );

  return {
    id: confession.id || makeId(),
    recipient: String(confession.recipient || "The moonlit dream").trim(),
    message: String(confession.message || "").trim(),
    sketchData,
    legacySketch: legacySketch || (sketchData ? "" : blankSketchData()),
    sealedAt: confession.sealedAt || new Date().toISOString(),
    demo: Boolean(confession.demo),
  };
}

function sortByNewest(items) {
  return [...items].sort((a, b) => new Date(b.sealedAt) - new Date(a.sealedAt));
}

function saveConfessions() {
  try {
    const storedConfessions = confessions.map((confession) => ({
      id: confession.id,
      recipient: confession.recipient,
      message: confession.message,
      sketch: confession.sketchData || confession.legacySketch,
      sealedAt: confession.sealedAt,
      demo: confession.demo,
    }));

    window.localStorage.setItem(confessionStorageKey, JSON.stringify(storedConfessions));
  } catch (error) {
    console.warn("Ink and Roses could not keep these confessions.", error);
  }
}

function clearSavedNonDemoConfessionsOnce() {
  try {
    if (window.localStorage.getItem(nonDemoCleanupStorageKey)) {
      return;
    }

    window.localStorage.removeItem(previousConfessionStorageKey);
    window.localStorage.removeItem(legacyArchiveStorageKey);
    window.localStorage.removeItem(legacyConfessionStorageKey);
    window.localStorage.setItem(nonDemoCleanupStorageKey, "true");
  } catch (error) {
    console.warn("Ink and Roses could not clear older saved confessions.", error);
  }
}

function loadConfessions() {
  try {
    clearSavedNonDemoConfessionsOnce();

    const savedArchive = JSON.parse(window.localStorage.getItem(confessionStorageKey) || "[]");
    const previousSavedArchive = JSON.parse(window.localStorage.getItem(previousConfessionStorageKey) || "[]");
    const savedLegacyArchive = JSON.parse(window.localStorage.getItem(legacyArchiveStorageKey) || "[]");
    const savedLegacy = JSON.parse(window.localStorage.getItem(legacyConfessionStorageKey) || "null");
    const archiveItems = Array.isArray(savedArchive) ? savedArchive : [];
    const previousArchiveItems = Array.isArray(previousSavedArchive) ? previousSavedArchive : [];
    const legacyArchiveItems = Array.isArray(savedLegacyArchive) ? savedLegacyArchive : [];
    const mergedItems = savedLegacy
      ? [savedLegacy, ...archiveItems, ...previousArchiveItems, ...legacyArchiveItems, ...demoConfessions]
      : [...archiveItems, ...previousArchiveItems, ...legacyArchiveItems, ...demoConfessions];
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

function mergeConfessions(items) {
  const byId = new Map(confessions.map((confession) => [confession.id, confession]));

  items.map(normalizeConfession).forEach((confession) => {
    if (confession.message) {
      byId.set(confession.id, confession);
    }
  });

  confessions = sortByNewest([...byId.values()]);
  saveConfessions();
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

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function clearReferenceImage() {
  closeReferenceCrop(false);

  if (referenceImageUrl) {
    URL.revokeObjectURL(referenceImageUrl);
    referenceImageUrl = "";
  }

  if (referenceImage) {
    referenceImage.removeAttribute("src");
  }

  if (referenceImageInput) {
    referenceImageInput.value = "";
  }

  if (referenceWindow) {
    referenceWindow.hidden = true;
    referenceWindow.removeAttribute("style");
  }
}

function showReferenceImage(imageBlob) {
  if (!referenceWindow || !referenceImage || !imageBlob?.type.startsWith("image/")) {
    return;
  }

  if (referenceImageUrl) {
    URL.revokeObjectURL(referenceImageUrl);
  }

  referenceImageUrl = URL.createObjectURL(imageBlob);
  referenceImage.src = referenceImageUrl;
  referenceWindow.hidden = false;
}

function releaseReferenceCropSource() {
  if (referenceCropSourceUrl) {
    URL.revokeObjectURL(referenceCropSourceUrl);
    referenceCropSourceUrl = "";
  }

  if (referenceCropImage) {
    referenceCropImage.removeAttribute("src");
    referenceCropImage.removeAttribute("style");
  }

  referenceCropState = null;
  referenceCropDrag = null;
  referenceCropViewport?.classList.remove("is-dragging");
}

function closeReferenceCrop(restoreReference = true) {
  releaseReferenceCropSource();

  if (referenceCropDialog) {
    referenceCropDialog.hidden = true;
  }

  document.body.classList.remove("is-cropping-reference");

  if (referenceImageInput) {
    referenceImageInput.value = "";
  }

  if (restoreReference && restoreReferenceAfterCrop && referenceWindow && referenceImageUrl) {
    referenceWindow.hidden = false;
  }

  restoreReferenceAfterCrop = false;
}

function clampReferenceCropPosition() {
  if (!referenceCropState || !referenceCropViewport) {
    return;
  }

  const viewportWidth = referenceCropViewport.clientWidth;
  const viewportHeight = referenceCropViewport.clientHeight;
  const imageWidth = referenceCropState.naturalWidth * referenceCropState.scale;
  const imageHeight = referenceCropState.naturalHeight * referenceCropState.scale;

  referenceCropState.x = clamp(referenceCropState.x, viewportWidth - imageWidth, 0);
  referenceCropState.y = clamp(referenceCropState.y, viewportHeight - imageHeight, 0);
}

function renderReferenceCrop() {
  if (!referenceCropImage || !referenceCropState) {
    return;
  }

  const imageWidth = referenceCropState.naturalWidth * referenceCropState.scale;
  const imageHeight = referenceCropState.naturalHeight * referenceCropState.scale;
  referenceCropImage.style.width = `${imageWidth}px`;
  referenceCropImage.style.height = `${imageHeight}px`;
  referenceCropImage.style.left = `${referenceCropState.x}px`;
  referenceCropImage.style.top = `${referenceCropState.y}px`;
}

function initializeReferenceCrop() {
  if (!referenceCropImage || !referenceCropViewport || !referenceCropImage.naturalWidth) {
    return;
  }

  const viewportWidth = referenceCropViewport.clientWidth;
  const viewportHeight = referenceCropViewport.clientHeight;
  const naturalWidth = referenceCropImage.naturalWidth;
  const naturalHeight = referenceCropImage.naturalHeight;
  const minimumScale = Math.max(viewportWidth / naturalWidth, viewportHeight / naturalHeight);

  referenceCropState = {
    naturalWidth,
    naturalHeight,
    minimumScale,
    scale: minimumScale,
    x: (viewportWidth - naturalWidth * minimumScale) / 2,
    y: (viewportHeight - naturalHeight * minimumScale) / 2,
  };

  if (referenceCropZoom) {
    referenceCropZoom.value = "100";
  }

  renderReferenceCrop();
}

function openReferenceCrop(file) {
  if (!referenceCropDialog || !referenceCropImage || !file?.type.startsWith("image/")) {
    return;
  }

  releaseReferenceCropSource();
  restoreReferenceAfterCrop = Boolean(referenceImageUrl && referenceWindow && !referenceWindow.hidden);

  if (referenceWindow) {
    referenceWindow.hidden = true;
  }

  referenceCropSourceUrl = URL.createObjectURL(file);
  referenceCropDialog.hidden = false;
  document.body.classList.add("is-cropping-reference");
  referenceCropImage.src = referenceCropSourceUrl;
}

function updateReferenceCropZoom() {
  if (!referenceCropState || !referenceCropViewport || !referenceCropZoom) {
    return;
  }

  const previousScale = referenceCropState.scale;
  const nextScale = referenceCropState.minimumScale * (Number(referenceCropZoom.value) / 100);
  const viewportCenterX = referenceCropViewport.clientWidth / 2;
  const viewportCenterY = referenceCropViewport.clientHeight / 2;
  const sourceCenterX = (viewportCenterX - referenceCropState.x) / previousScale;
  const sourceCenterY = (viewportCenterY - referenceCropState.y) / previousScale;

  referenceCropState.scale = nextScale;
  referenceCropState.x = viewportCenterX - sourceCenterX * nextScale;
  referenceCropState.y = viewportCenterY - sourceCenterY * nextScale;
  clampReferenceCropPosition();
  renderReferenceCrop();
}

function startReferenceCropDrag(event) {
  if (!referenceCropState || (event.pointerType === "mouse" && event.button !== 0)) {
    return;
  }

  event.preventDefault();
  referenceCropDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    imageX: referenceCropState.x,
    imageY: referenceCropState.y,
  };
  referenceCropViewport?.classList.add("is-dragging");
}

function moveReferenceCrop(event) {
  if (!referenceCropDrag || !referenceCropState || event.pointerId !== referenceCropDrag.pointerId) {
    return;
  }

  referenceCropState.x = referenceCropDrag.imageX + event.clientX - referenceCropDrag.startX;
  referenceCropState.y = referenceCropDrag.imageY + event.clientY - referenceCropDrag.startY;
  clampReferenceCropPosition();
  renderReferenceCrop();
}

function endReferenceCropDrag(event) {
  if (referenceCropDrag && event.pointerId === referenceCropDrag.pointerId) {
    referenceCropDrag = null;
    referenceCropViewport?.classList.remove("is-dragging");
  }
}

async function applyReferenceCrop() {
  if (!referenceCropImage || !referenceCropViewport || !referenceCropState) {
    return;
  }

  const cropCanvas = document.createElement("canvas");
  const cropContext = cropCanvas.getContext("2d");
  const cropSize = referenceCropViewport.clientWidth;
  const sourceX = clamp(-referenceCropState.x / referenceCropState.scale, 0, referenceCropState.naturalWidth);
  const sourceY = clamp(-referenceCropState.y / referenceCropState.scale, 0, referenceCropState.naturalHeight);
  const sourceSize = cropSize / referenceCropState.scale;

  cropCanvas.width = 900;
  cropCanvas.height = 900;
  cropContext.drawImage(
    referenceCropImage,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    cropCanvas.width,
    cropCanvas.height,
  );

  const croppedImage = await new Promise((resolve) => cropCanvas.toBlob(resolve, "image/jpeg", 0.92));

  if (!croppedImage) {
    return;
  }

  restoreReferenceAfterCrop = false;
  closeReferenceCrop(false);
  showReferenceImage(croppedImage);
}

function keepReferenceWindowOnScreen() {
  if (!referenceWindow || referenceWindow.hidden) {
    return;
  }

  const bounds = referenceWindow.getBoundingClientRect();
  const width = Math.min(bounds.width, window.innerWidth - 8);
  const height = Math.min(bounds.height, window.innerHeight - 8);

  referenceWindow.style.width = `${width}px`;
  referenceWindow.style.height = `${height}px`;
  referenceWindow.style.left = `${clamp(bounds.left, 4, Math.max(4, window.innerWidth - width - 4))}px`;
  referenceWindow.style.top = `${clamp(bounds.top, 4, Math.max(4, window.innerHeight - height - 4))}px`;
  referenceWindow.style.right = "auto";
}

function startReferenceInteraction(event, mode) {
  if (!referenceWindow || referenceWindow.hidden || (event.pointerType === "mouse" && event.button !== 0)) {
    return;
  }

  if (mode === "drag" && event.target.closest("button")) {
    return;
  }

  event.preventDefault();
  const bounds = referenceWindow.getBoundingClientRect();
  referenceWindow.style.left = `${bounds.left}px`;
  referenceWindow.style.top = `${bounds.top}px`;
  referenceWindow.style.right = "auto";

  referenceInteraction = {
    mode,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startLeft: bounds.left,
    startTop: bounds.top,
    startWidth: bounds.width,
    startHeight: bounds.height,
  };
}

function moveReferenceWindow(event) {
  if (!referenceWindow || !referenceInteraction || event.pointerId !== referenceInteraction.pointerId) {
    return;
  }

  const deltaX = event.clientX - referenceInteraction.startX;
  const deltaY = event.clientY - referenceInteraction.startY;

  if (referenceInteraction.mode === "drag") {
    const maxLeft = Math.max(0, window.innerWidth - referenceInteraction.startWidth);
    const maxTop = Math.max(0, window.innerHeight - referenceInteraction.startHeight);
    referenceWindow.style.left = `${clamp(referenceInteraction.startLeft + deltaX, 0, maxLeft)}px`;
    referenceWindow.style.top = `${clamp(referenceInteraction.startTop + deltaY, 0, maxTop)}px`;
    return;
  }

  const maxWidth = Math.max(180, window.innerWidth - referenceInteraction.startLeft);
  const maxHeight = Math.max(220, window.innerHeight - referenceInteraction.startTop);
  referenceWindow.style.width = `${clamp(referenceInteraction.startWidth + deltaX, 180, maxWidth)}px`;
  referenceWindow.style.height = `${clamp(referenceInteraction.startHeight + deltaY, 220, maxHeight)}px`;
}

function endReferenceInteraction(event) {
  if (referenceInteraction && event.pointerId === referenceInteraction.pointerId) {
    referenceInteraction = null;
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
  sealedSketch.src = getConfessionSketchImage(confession);
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

function fillSketchPaper(targetContext = ctx, targetCanvas = canvas) {
  if (!targetContext || !targetCanvas) {
    return;
  }

  targetContext.save();
  targetContext.globalCompositeOperation = "source-over";
  targetContext.fillStyle = "#ffffff";
  targetContext.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
  targetContext.restore();
}

function drawStrokeSegment(targetContext, targetCanvas, stroke, from, to) {
  if (!targetContext || !targetCanvas || !stroke) {
    return;
  }

  const canvasScale = Math.min(targetCanvas.width, targetCanvas.height);
  const fromX = from.x * targetCanvas.width;
  const fromY = from.y * targetCanvas.height;
  const toX = to.x * targetCanvas.width;
  const toY = to.y * targetCanvas.height;

  targetContext.save();
  targetContext.globalCompositeOperation = "source-over";
  targetContext.lineCap = "round";
  targetContext.lineJoin = "round";
  targetContext.lineWidth = Math.max(1, stroke.size * canvasScale);
  targetContext.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
  targetContext.fillStyle = targetContext.strokeStyle;

  if (fromX === toX && fromY === toY) {
    targetContext.beginPath();
    targetContext.arc(fromX, fromY, targetContext.lineWidth / 2, 0, Math.PI * 2);
    targetContext.fill();
  } else {
    targetContext.beginPath();
    targetContext.moveTo(fromX, fromY);
    targetContext.lineTo(toX, toY);
    targetContext.stroke();
  }

  targetContext.restore();
}

function renderSketchData(targetContext, targetCanvas, sketchData) {
  fillSketchPaper(targetContext, targetCanvas);

  if (!sketchData) {
    return;
  }

  sketchData.strokes.forEach((stroke) => {
    if (stroke.points.length === 1) {
      drawStrokeSegment(targetContext, targetCanvas, stroke, stroke.points[0], stroke.points[0]);
      return;
    }

    for (let index = 1; index < stroke.points.length; index += 1) {
      drawStrokeSegment(targetContext, targetCanvas, stroke, stroke.points[index - 1], stroke.points[index]);
    }
  });
}

function renderCurrentSketch() {
  if (!ctx || !canvas) {
    return;
  }

  renderSketchData(ctx, canvas, createSketchData());
}

function sketchDataToDataUrl(sketchData, size = 900) {
  const previewCanvas = document.createElement("canvas");
  const previewContext = previewCanvas.getContext("2d");
  previewCanvas.width = size;
  previewCanvas.height = size;
  renderSketchData(previewContext, previewCanvas, sketchData);
  return previewCanvas.toDataURL("image/png");
}

function getConfessionSketchImage(confession) {
  if (confession?.sketchData) {
    return sketchDataToDataUrl(confession.sketchData);
  }

  return confession?.legacySketch || blankSketchData();
}

function resetSketch() {
  sketchStrokes = [];
  currentStroke = null;
  sketchPointCount = 0;
  renderCurrentSketch();
}

function restoreSketchState() {
  if (sketchStrokes.length === 0) {
    return;
  }

  const removedStroke = sketchStrokes.pop();
  sketchPointCount = Math.max(0, sketchPointCount - removedStroke.points.length);
  currentStroke = null;
  renderCurrentSketch();
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();

  return normalizeSketchPoint({
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  });
}

function pointDistance(from, to) {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function createCurrentStroke(point) {
  const brushPixels = Number(brushInput?.value || 7);
  const normalizedSize = brushPixels / Math.min(canvas.width, canvas.height);

  return {
    tool: activeTool,
    color: colorInput?.value || "#541928",
    size: roundSketchValue(activeTool === "eraser" ? normalizedSize * 2.2 : normalizedSize),
    points: [point],
  };
}

function activeToolDraws() {
  return activeTool === "pen" || activeTool === "eraser";
}

function startSketch(event) {
  if (!canvas || !activeToolDraws() || sketchStrokes.length >= maximumSketchStrokes) {
    return;
  }

  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  isDrawing = true;
  lastPoint = getCanvasPoint(event);
  currentStroke = createCurrentStroke(lastPoint);
  sketchStrokes.push(currentStroke);
  sketchPointCount += 1;
  drawStrokeSegment(ctx, canvas, currentStroke, lastPoint, lastPoint);
}

function moveSketch(event) {
  if (!isDrawing || !lastPoint || !currentStroke) {
    return;
  }

  event.preventDefault();
  const nextPoint = getCanvasPoint(event);

  if (pointDistance(lastPoint, nextPoint) < minimumPointDistance) {
    return;
  }

  if (
    currentStroke.points.length >= maximumPointsPerStroke
    || sketchPointCount >= maximumSketchPoints
  ) {
    endSketch(event);
    setStatus("The sketch reached its point limit. Undo or clear strokes to continue.");
    return;
  }

  currentStroke.points.push(nextPoint);
  sketchPointCount += 1;
  drawStrokeSegment(ctx, canvas, currentStroke, lastPoint, nextPoint);
  lastPoint = nextPoint;
}

function endSketch(event) {
  if (!canvas) {
    return;
  }

  isDrawing = false;
  lastPoint = null;
  currentStroke = null;

  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

function setActiveTool(tool) {
  activeTool = tool;

  toolButtons.forEach((button) => {
    const isActive = button.dataset.tool === tool;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (canvas) {
    canvas.classList.toggle("is-navigation-mode", !activeToolDraws());
  }
}

function downloadSketch() {
  if (!canvas) {
    return;
  }

  const link = document.createElement("a");
  link.download = "ink-and-roses-sketch.png";
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
    setStatus("The confession is sealed in Ink and Roses, but copying was blocked.");
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
    cardContext.fillText("Sent from Ink and Roses", 108, 650);

    cardContext.drawImage(sketchImage, 790, 168, 300, 300);
    cardContext.strokeStyle = "#541928";
    cardContext.lineWidth = 3;
    cardContext.strokeRect(790, 168, 300, 300);

    const link = document.createElement("a");
    link.download = "ink-and-roses-confession.png";
    link.href = cardCanvas.toDataURL("image/png");
    link.click();
    setStatus("The confession card has been downloaded.");
  });

  sketchImage.src = getConfessionSketchImage(latestConfession);
}

async function sealConfession(event) {
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
    sketch: createSketchData(),
    sealedAt: new Date().toISOString(),
    demo: false,
  });

  confessions = sortByNewest([confession, ...confessions]);
  saveConfessions();
  renderArchive();
  confessionForm.reset();
  clearReferenceImage();
  resetSketch();
  updateMessageMetrics();
  setStatus("Saving your confession...");
  scrollToPageSection("archive");

  try {
    const savedRemotely = await saveFirebaseConfession(firebaseConfig, {
      id: confession.id,
      recipient: confession.recipient,
      message: confession.message,
      sketch: confession.sketchData,
      sealedAt: confession.sealedAt,
      demo: false,
    });

    setStatus(
      savedRemotely
        ? "Your anonymous confession has been saved to the shared archive."
        : "Your confession was saved on this browser. Add Firebase configuration to share it.",
    );
  } catch (error) {
    console.warn("Ink and Roses could not save this confession to Firebase.", error);
    setStatus("Your confession was saved on this browser, but Firebase could not be reached.");
  }
}

if (canvas) {
  ctx = canvas.getContext("2d", { willReadFrequently: true });
  resetSketch();
  canvas.addEventListener("pointerdown", startSketch);
  canvas.addEventListener("pointermove", moveSketch);
  canvas.addEventListener("pointerup", endSketch);
  canvas.addEventListener("pointercancel", endSketch);
  canvas.addEventListener("pointerleave", endSketch);
}

toolButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedTool = button.dataset.tool;
    const toggledDrawingTool = selectedTool === activeTool && activeToolDraws();
    setActiveTool(toggledDrawingTool ? "" : selectedTool);
  });
});

setActiveTool(activeTool);

undoButton?.addEventListener("click", restoreSketchState);

clearButton?.addEventListener("click", () => {
  resetSketch();
});

downloadButton?.addEventListener("click", downloadSketch);
copyConfessionButton?.addEventListener("click", copyConfessionText);
downloadConfessionButton?.addEventListener("click", downloadConfessionCard);
chooseReferenceButton?.addEventListener("click", () => referenceImageInput?.click());
referenceImageInput?.addEventListener("change", () => {
  const [file] = referenceImageInput.files;
  openReferenceCrop(file);
});
closeReferenceButton?.addEventListener("click", clearReferenceImage);
referenceCropImage?.addEventListener("load", initializeReferenceCrop);
referenceCropImage?.addEventListener("error", () => closeReferenceCrop());
referenceCropZoom?.addEventListener("input", updateReferenceCropZoom);
referenceCropViewport?.addEventListener("pointerdown", startReferenceCropDrag);
cancelReferenceCropButton?.addEventListener("click", () => closeReferenceCrop());
discardReferenceCropButton?.addEventListener("click", () => closeReferenceCrop());
applyReferenceCropButton?.addEventListener("click", applyReferenceCrop);
referenceWindowBar?.addEventListener("pointerdown", (event) => startReferenceInteraction(event, "drag"));
referenceResizeHandle?.addEventListener("pointerdown", (event) => startReferenceInteraction(event, "resize"));
window.addEventListener("pointermove", moveReferenceWindow);
window.addEventListener("pointermove", moveReferenceCrop);
window.addEventListener("pointerup", endReferenceInteraction);
window.addEventListener("pointerup", endReferenceCropDrag);
window.addEventListener("pointercancel", endReferenceInteraction);
window.addEventListener("pointercancel", endReferenceCropDrag);
window.addEventListener("resize", () => {
  keepReferenceWindowOnScreen();

  if (referenceCropDialog && !referenceCropDialog.hidden) {
    initializeReferenceCrop();
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && referenceCropDialog && !referenceCropDialog.hidden) {
    closeReferenceCrop();
  }
});
window.addEventListener("beforeunload", () => {
  if (referenceImageUrl) {
    URL.revokeObjectURL(referenceImageUrl);
  }

  if (referenceCropSourceUrl) {
    URL.revokeObjectURL(referenceCropSourceUrl);
  }
});
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

function renderCurrentViews() {
  initResultsPage();
  initConfessionPage();
  renderArchive();
}

async function initializeRegistry() {
  loadConfessions();
  renderCurrentViews();

  if (!hasFirebaseConfig(firebaseConfig)) {
    document.documentElement.dataset.firebase = "local";
    console.info("Ink and Roses is using local storage until firebase-config.js is completed.");
    return;
  }

  try {
    document.documentElement.dataset.firebase = "connecting";
    const remoteConfessions = await loadFirebaseConfessions(firebaseConfig);
    mergeConfessions(remoteConfessions);
    renderCurrentViews();
    document.documentElement.dataset.firebase = "connected";
  } catch (error) {
    document.documentElement.dataset.firebase = "offline";
    console.warn("Ink and Roses could not load Firebase confessions.", error);
  }
}

initializeRegistry();
updateMessageMetrics();
