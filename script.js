const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

const themeToggle = document.querySelector(".theme-toggle");
const themeColor = document.querySelector('meta[name="theme-color"]');
const systemTheme = matchMedia("(prefers-color-scheme: dark)");

function applyTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-pressed", String(dark));
  themeToggle.setAttribute("aria-label", dark ? "切換為淺色模式" : "切換為深色模式");
  themeColor.content = dark ? "#17131e" : "#7c5ce5";
}

applyTheme(document.documentElement.dataset.theme || "light");
themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});
systemTheme.addEventListener("change", (event) => applyTheme(event.matches ? "dark" : "light"));

const rows = [...document.querySelectorAll(".price-row")];
const totalOutput = document.querySelector("#estimate-total");
const countOutput = document.querySelector("#estimate-count");
const resetButton = document.querySelector("#estimate-reset");
const copyEstimateButton = document.querySelector("#estimate-copy");
let savedEstimate = [];

try {
  savedEstimate = JSON.parse(localStorage.getItem("alma-estimate") || "[]");
} catch {
  savedEstimate = [];
}

function setQuantity(row, nextQuantity) {
  const quantity = Math.max(0, Math.min(99, nextQuantity));
  const checkbox = row.querySelector('input[type="checkbox"]');
  const output = row.querySelector("output");
  checkbox.checked = quantity > 0;
  output.value = quantity;
  output.textContent = quantity;
  row.dataset.quantity = String(quantity);
}

function updateEstimate() {
  let total = 0;
  let selectedKinds = 0;
  let totalQuantity = 0;

  rows.forEach((row) => {
    const quantity = Number(row.dataset.quantity || 0);
    if (quantity > 0) {
      selectedKinds += 1;
      totalQuantity += quantity;
      total += Number(row.dataset.price) * quantity;
    }
  });

  totalOutput.textContent = currency.format(total).replace("$", "NT$ ");
  copyEstimateButton.disabled = selectedKinds === 0;
  countOutput.textContent = selectedKinds
    ? `已選 ${selectedKinds} 個品項，共 ${totalQuantity} 件`
    : "尚未選擇項目";
  localStorage.setItem("alma-estimate", JSON.stringify(rows.map((row) => Number(row.dataset.quantity || 0))));
}

rows.forEach((row, index) => {
  setQuantity(row, Number(savedEstimate[index] || 0));
  const checkbox = row.querySelector('input[type="checkbox"]');
  const stepButtons = row.querySelectorAll("[data-step]");

  checkbox.addEventListener("change", () => {
    setQuantity(row, checkbox.checked ? Math.max(1, Number(row.dataset.quantity)) : 0);
    updateEstimate();
  });

  stepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setQuantity(row, Number(row.dataset.quantity) + Number(button.dataset.step));
      updateEstimate();
    });
  });
});

updateEstimate();

resetButton.addEventListener("click", () => {
  rows.forEach((row) => setQuantity(row, 0));
  updateEstimate();
});

function buildEstimateSummary() {
  const selected = rows
    .map((row) => {
      const quantity = Number(row.dataset.quantity || 0);
      if (!quantity) return null;
      const name = row.dataset.name;
      const unitPrice = Number(row.dataset.price);
      return `- ${name} × ${quantity}（${currency.format(unitPrice).replace("$", "NT$ ")}／件，小計 ${currency.format(unitPrice * quantity).replace("$", "NT$ ")}）`;
    })
    .filter(Boolean);

  return [
    "你好，我想洽談 VRChat Avatar 改造委託，以下是預估的內容：",
    "",
    ...selected,
    "",
    `網站參考總額：${totalOutput.textContent}`,
    "希望完成日期：［請填寫］",
    "Avatar 封面：［請填入］",
    "Avatar 名稱：［請填入］",
    "Avatar 簡介：［請填入］",
    "素材／商品頁：［請貼上連結］",
    "其他需求：［請補充］",
  ].join("\n");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const temporary = document.createElement("textarea");
    temporary.value = text;
    temporary.style.position = "fixed";
    temporary.style.opacity = "0";
    document.body.append(temporary);
    temporary.select();
    const copied = document.execCommand("copy");
    temporary.remove();
    return copied;
  }
}

const lightbox = document.querySelector("#lightbox");
const lightboxStage = lightbox.querySelector(".lightbox-stage");
const lightboxClose = lightbox.querySelector(".lightbox-close");
const lightboxPrev = lightbox.querySelector(".lightbox-prev");
const lightboxNext = lightbox.querySelector(".lightbox-next");
const lightboxCounter = lightbox.querySelector(".lightbox-counter");
const lightboxTitle = lightbox.querySelector(".lightbox-title");
const lightboxDescription = lightbox.querySelector(".lightbox-description");
const lightboxCards = [...document.querySelectorAll("[data-lightbox], [data-lightbox-video]")];
let lightboxIndex = 0;

const lightboxDetails = [
  ["藍髮夏日造型", "藍髮貓耳角色的清爽夏日造型展示。"],
  ["黑色皮革造型", "以黑色皮革服飾呈現俐落氣質的角色造型。"],
  ["星空狐耳造型", "以星空氛圍呈現的狐耳角色造型。"],
  ["睡眠動態展示", "白髮狐耳角色的睡眠動態作品。"],
  ["紅黑正裝造型", "紅黑配色的龍族正式服裝造型。"],
  ["白色睡衣造型", "白髮狐耳角色的柔和睡衣造型。"],
  ["柔和黑髮妝面", "黑髮角色的柔和妝面與整體造型。"],
  ["海灘泳裝造型", "海灘場景中的夏日泳裝角色造型。"],
  ["親吻動態展示", "角色互動的親吻動態作品。"],
  ["黑白短髮造型", "以黑白色調呈現的短髮角色造型。"],
  ["紅黑異手造型", "以紅黑異手為重點的角色造型展示。"],
];

function showLightboxItem(index) {
  const previousVideo = lightboxStage.querySelector("video");
  if (previousVideo) previousVideo.pause();

  lightboxIndex = (index + lightboxCards.length) % lightboxCards.length;
  const card = lightboxCards[lightboxIndex];
  let media;

  if (card.dataset.lightboxVideo) {
    media = document.createElement("video");
    media.src = card.dataset.lightboxVideo;
    media.controls = true;
    media.autoplay = true;
    media.loop = true;
    media.playsInline = true;
  } else {
    media = document.createElement("img");
    media.src = card.dataset.lightbox;
    media.alt = card.querySelector("img")?.alt || "VRChat Avatar 改造作品";
  }

  lightboxStage.replaceChildren(media);
  const [title, description] = lightboxDetails[lightboxIndex];
  lightboxCounter.textContent = `${lightboxIndex + 1} / ${lightboxCards.length}`;
  lightboxTitle.textContent = title;
  lightboxDescription.textContent = description;
}

function moveLightbox(direction) {
  showLightboxItem(lightboxIndex + direction);
}

function closeLightbox() {
  const video = lightboxStage.querySelector("video");
  if (video) video.pause();
  lightbox.close();
  lightboxStage.replaceChildren();
  document.body.classList.remove("lightbox-open");
}

lightboxCards.forEach((card, index) => {
  if (card.dataset.lightboxVideo) {
    const filename = card.dataset.lightboxVideo.split("/").pop();
    card.setAttribute("aria-label", `開啟影片作品：${filename}`);
  }
  card.addEventListener("click", () => {
    showLightboxItem(index);
    lightbox.showModal();
    document.body.classList.add("lightbox-open");
  });
});

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", () => moveLightbox(-1));
lightboxNext.addEventListener("click", () => moveLightbox(1));
lightbox.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveLightbox(-1);
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveLightbox(1);
  }
});
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox || event.target === lightboxStage) closeLightbox();
});
lightbox.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeLightbox();
});

const motionCards = document.querySelectorAll(".work-card video");
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.play().catch(() => {});
        else entry.target.pause();
      });
    },
    { threshold: 0.55 },
  );
  motionCards.forEach((video) => observer.observe(video));
}

const masonryViewport = document.querySelector(".masonry-viewport");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const galleryLeft = document.querySelector(".gallery-arrow-left");
const galleryRight = document.querySelector(".gallery-arrow-right");
let galleryDragging = false;
let galleryDragged = false;
let galleryStartX = 0;
let galleryStartScroll = 0;

function updateGalleryArrows() {
  const maxScroll = masonryViewport.scrollWidth - masonryViewport.clientWidth;
  const canScroll = maxScroll > 1;
  galleryLeft.hidden = !canScroll;
  galleryRight.hidden = !canScroll;
  galleryLeft.disabled = masonryViewport.scrollLeft <= 1;
  galleryRight.disabled = masonryViewport.scrollLeft >= maxScroll - 1;
}

function scrollGallery(direction) {
  masonryViewport.scrollBy({
    left: direction * 120,
    behavior: reduceMotion.matches ? "auto" : "smooth",
  });
}

let galleryHoldTimer = 0;
let galleryHoldFrame = 0;
let galleryHoldLastTime = 0;
let galleryHoldActive = false;

function stopGalleryHold() {
  clearTimeout(galleryHoldTimer);
  cancelAnimationFrame(galleryHoldFrame);
  galleryHoldTimer = 0;
  galleryHoldFrame = 0;
  galleryHoldLastTime = 0;
}

function runGalleryHold(direction, time) {
  if (!galleryHoldLastTime) galleryHoldLastTime = time;
  const elapsed = Math.min(time - galleryHoldLastTime, 32);
  masonryViewport.scrollLeft += direction * elapsed * 0.18;
  galleryHoldLastTime = time;

  const maxScroll = masonryViewport.scrollWidth - masonryViewport.clientWidth;
  if (masonryViewport.scrollLeft <= 0 || masonryViewport.scrollLeft >= maxScroll - 1) {
    stopGalleryHold();
    return;
  }

  galleryHoldFrame = requestAnimationFrame((nextTime) => runGalleryHold(direction, nextTime));
}

function bindGalleryArrow(button, direction) {
  button.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    galleryHoldActive = false;
    galleryHoldTimer = setTimeout(() => {
      galleryHoldActive = true;
      galleryHoldFrame = requestAnimationFrame((time) => runGalleryHold(direction, time));
    }, 220);
  });

  button.addEventListener("pointerup", stopGalleryHold);
  button.addEventListener("pointercancel", stopGalleryHold);
  button.addEventListener("pointerleave", stopGalleryHold);
  button.addEventListener("click", (event) => {
    if (galleryHoldActive) {
      event.preventDefault();
      galleryHoldActive = false;
      return;
    }
    scrollGallery(direction);
  });
}

bindGalleryArrow(galleryLeft, -1);
bindGalleryArrow(galleryRight, 1);
masonryViewport.addEventListener("scroll", updateGalleryArrows, { passive: true });
window.addEventListener("resize", updateGalleryArrows);
window.addEventListener("load", updateGalleryArrows);

if ("ResizeObserver" in window) {
  const galleryResizeObserver = new ResizeObserver(updateGalleryArrows);
  galleryResizeObserver.observe(masonryViewport);
  galleryResizeObserver.observe(masonryViewport.firstElementChild);
}

masonryViewport.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse" || event.button !== 0) return;
  galleryDragging = true;
  galleryDragged = false;
  galleryStartX = event.clientX;
  galleryStartScroll = masonryViewport.scrollLeft;
  masonryViewport.classList.add("is-dragging");
});

masonryViewport.addEventListener("pointermove", (event) => {
  if (!galleryDragging) return;
  const distance = event.clientX - galleryStartX;
  if (Math.abs(distance) > 5 && !galleryDragged) {
    galleryDragged = true;
    masonryViewport.setPointerCapture(event.pointerId);
  }
  masonryViewport.scrollLeft = galleryStartScroll - distance;
  event.preventDefault();
});

function endGalleryDrag(event) {
  if (!galleryDragging) return;
  galleryDragging = false;
  masonryViewport.classList.remove("is-dragging");
  if (masonryViewport.hasPointerCapture(event.pointerId)) masonryViewport.releasePointerCapture(event.pointerId);
}

masonryViewport.addEventListener("pointerup", endGalleryDrag);
masonryViewport.addEventListener("pointercancel", endGalleryDrag);
masonryViewport.addEventListener("click", (event) => {
  if (!galleryDragged) return;
  event.preventDefault();
  event.stopPropagation();
  galleryDragged = false;
}, true);

updateGalleryArrows();

const toast = document.querySelector(".toast");
let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

copyEstimateButton.addEventListener("click", async () => {
  const copied = await copyText(buildEstimateSummary());
  showToast(copied ? "需求摘要已複製，接著開啟 Discord 貼上即可" : "無法複製，請允許剪貼簿權限後再試一次");
});

document.querySelector("#year").textContent = new Date().getFullYear();
