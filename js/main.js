/* =====================================================================
   «Лилии» — логика сайта
   Здесь ничего не нужно менять, чтобы заменить фото, тексты или музыку:
   всё это лежит в index.html.
   ===================================================================== */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Уведомление ---------- */
  var toastEl = $("#toast"), toastTimer;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 3800);
  }


  /* =====================================================================
     Музыка
     Браузеры не дают запускать звук без действия пользователя,
     поэтому музыка включается по нажатию «Открыть письмо» или кнопки-пластинки.
     ===================================================================== */
  var audio = $("#bg-music");
  var musicBtn = $("#music-btn");
  var musicBroken = false;
  var mStart = parseFloat(audio.getAttribute("data-start")) || 0;
  var mEnd = parseFloat(audio.getAttribute("data-end")) || 0;
  var startedOnce = false;

  // начинаем с нужной секунды и крутим по кругу только выбранный кусок
  function toStart() { try { audio.currentTime = mStart; } catch (e) {} }
  audio.addEventListener("loadedmetadata", function () { if (!startedOnce && mStart) toStart(); });
  audio.addEventListener("timeupdate", function () { if (mEnd && audio.currentTime >= mEnd) toStart(); });
  audio.addEventListener("ended", function () { toStart(); audio.play(); });

  function setPlayingUI(on) {
    musicBtn.classList.toggle("is-playing", on);
    musicBtn.setAttribute("aria-pressed", on ? "true" : "false");
    musicBtn.setAttribute("aria-label", on ? "Выключить музыку" : "Включить музыку");
  }

  function playMusic() {
    if (musicBroken) {
      toast("Не получилось загрузить музыку — проверь файл в папке music/");
      return;
    }
    if (!startedOnce && audio.readyState >= 1 && mStart) toStart();
    startedOnce = true;
    var p = audio.play();
    if (p && p.catch) {
      p.catch(function () {
        // ошибку загрузки файла покажет обработчик 'error' ниже
        if (!musicBroken) toast("Нажми на пластинку внизу, чтобы включить музыку ♪");
      });
    }
  }

  audio.addEventListener("play", function () { setPlayingUI(true); });
  audio.addEventListener("pause", function () { setPlayingUI(false); });
  audio.addEventListener("error", function () {
    musicBroken = true;
    setPlayingUI(false);
    toast("Не получилось загрузить музыку — проверь файл в папке music/");
  });

  musicBtn.addEventListener("click", function () {
    if (audio.paused) playMusic(); else audio.pause();
  });

  // если вкладку свернули — ставим на паузу, вернулись — продолжаем
  var pausedByHide = false;
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && !audio.paused) { audio.pause(); pausedByHide = true; }
    else if (!document.hidden && pausedByHide) { pausedByHide = false; playMusic(); }
  });


  /* ---------- Кнопка «Открыть письмо» ---------- */
  $("#open-btn").addEventListener("click", function () {
    if (audio.paused) playMusic();
    $("#ch1").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });


  /* ---------- Появление блоков при прокрутке ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }


  /* ---------- Полоса прогресса ---------- */
  var bar = $("#progress-bar"), ticking = false;
  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();


  /* ---------- Лепестки (немного, ради плавности на телефонах) ---------- */
  if (!reduceMotion) {
    var petals = $("#petals");
    var count = window.innerWidth < 600 ? 7 : 11;
    for (var i = 0; i < count; i++) {
      var p = document.createElement("span");
      p.className = "petal";
      p.style.setProperty("--x", (Math.random() * 100).toFixed(1) + "vw");
      p.style.setProperty("--s", (9 + Math.random() * 9).toFixed(1) + "px");
      p.style.setProperty("--t", (14 + Math.random() * 10).toFixed(1) + "s");
      p.style.setProperty("--delay", (3 + Math.random() * 16).toFixed(1) + "s");
      p.style.setProperty("--drift", (Math.random() * 120 - 60).toFixed(0) + "px");
      petals.appendChild(p);
    }
  }


  /* =====================================================================
     Лента «Ты»
     ===================================================================== */
  var reel = $("#reel");
  var items = $$(".reel__item", reel);
  var dotsWrap = $("#reel-dots");
  items.forEach(function () { dotsWrap.appendChild(document.createElement("i")); });
  var dots = $$("i", dotsWrap);

  function currentIndex() {
    var center = reel.scrollLeft + reel.clientWidth / 2, best = 0, bestDist = Infinity;
    items.forEach(function (it, i) {
      var d = Math.abs(it.offsetLeft + it.offsetWidth / 2 - center);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }
  function updateDots() {
    var idx = currentIndex();
    dots.forEach(function (d, i) { d.classList.toggle("on", i === idx); });
  }
  function goTo(i) {
    i = Math.max(0, Math.min(items.length - 1, i));
    var it = items[i];
    reel.scrollTo({ left: it.offsetLeft - (reel.clientWidth - it.offsetWidth) / 2, behavior: reduceMotion ? "auto" : "smooth" });
  }
  var reelTick = false;
  reel.addEventListener("scroll", function () {
    if (!reelTick) { reelTick = true; requestAnimationFrame(function () { updateDots(); reelTick = false; }); }
  }, { passive: true });
  $("#reel-prev").addEventListener("click", function () { goTo(currentIndex() - 1); });
  $("#reel-next").addEventListener("click", function () { goTo(currentIndex() + 1); });
  updateDots();


  /* =====================================================================
     Просмотр фото на весь экран
     Фото из ленты «Ты» листаются между собой, остальные — по всей истории.
     ===================================================================== */
  var lb = $("#lightbox"), lbImg = $("#lb-img"), lbCap = $("#lb-caption");
  var group = [], gIndex = 0, lastFocus = null;

  function showAt(i) {
    gIndex = (i + group.length) % group.length;
    var img = group[gIndex];
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = img.getAttribute("data-caption") || "";
  }
  function openLightbox(img) {
    var name = img.getAttribute("data-lightbox") || "";
    group = $$("img[data-lightbox]").filter(function (el) { return (el.getAttribute("data-lightbox") || "") === name; });
    lastFocus = document.activeElement;
    showAt(group.indexOf(img));
    lb.classList.toggle("single", group.length < 2);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { lb.classList.add("open"); });
    $("#lb-close").focus();
  }
  function closeLightbox() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(function () { lb.hidden = true; lbImg.removeAttribute("src"); }, 350);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  $$("img[data-lightbox]").forEach(function (img) {
    img.addEventListener("click", function () { openLightbox(img); });
  });
  $("#lb-close").addEventListener("click", closeLightbox);
  $("#lb-prev").addEventListener("click", function (e) { e.stopPropagation(); showAt(gIndex - 1); });
  $("#lb-next").addEventListener("click", function (e) { e.stopPropagation(); showAt(gIndex + 1); });
  lb.addEventListener("click", function (e) {
    if (e.target === lb || e.target.classList.contains("lightbox__figure")) closeLightbox();
  });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft" && group.length > 1) showAt(gIndex - 1);
    else if (e.key === "ArrowRight" && group.length > 1) showAt(gIndex + 1);
  });

  // свайпы в просмотрщике
  var sx = 0, sy = 0;
  lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && group.length > 1) showAt(gIndex + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) closeLightbox();
  }, { passive: true });


  /* =====================================================================
     Бутоны «Почему ты»
     ===================================================================== */
  var buds = $$(".reason");
  var counter = $("#reasons-counter"), done = $("#reasons-done");
  buds.forEach(function (bud) {
    bud.addEventListener("click", function () {
      var open = bud.classList.toggle("is-open");
      bud.setAttribute("aria-pressed", open ? "true" : "false");
      var opened = buds.filter(function (b) { return b.classList.contains("is-open"); }).length;
      counter.textContent = "открыто " + opened + " из " + buds.length;
      if (opened === buds.length) done.classList.add("show");
      if (open) {
        var r = bud.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, 7);
      }
    });
  });


  /* =====================================================================
     Финал: сердечки
     ===================================================================== */
  var colors = ["#741E31", "#F6BAD6", "#F1D3DF", "#420D19", "#FFF0DC"];
  var buttonStickers = ["button-heart-pink", "button-star-pink", "button-flower-pink", "button-heart-cream", "button-star-cream", "button-flower-cream"];
  function burst(x, y, n) {
    if (reduceMotion) return;
    for (var i = 0; i < n; i++) {
      var svg;
      if (i % 3 === 2) {               // каждая третья — настоящая пуговица-стикер
        svg = document.createElement("img");
        svg.src = "stickers/" + buttonStickers[i % buttonStickers.length] + ".webp";
        svg.alt = "";
      } else {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
        use.setAttribute("href", "#i-heart");
        svg.appendChild(use);
      }
      svg.setAttribute("class", "fly");
      var ang = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 130;
      svg.style.left = x + "px";
      svg.style.top = y + "px";
      svg.style.setProperty("--s", ((i % 3 === 2 ? 26 : 12) + Math.random() * 16).toFixed(0) + "px");
      svg.style.setProperty("--c", colors[i % colors.length]);
      svg.style.setProperty("--dx", (Math.cos(ang) * dist).toFixed(0) + "px");
      svg.style.setProperty("--dy", (Math.sin(ang) * dist - 60).toFixed(0) + "px");
      svg.style.setProperty("--r", (Math.random() * 80 - 40).toFixed(0) + "deg");
      document.body.appendChild(svg);
      svg.addEventListener("animationend", function () { this.remove(); });
    }
  }

  var loveBtn = $("#love-btn"), answer = $("#love-answer");
  loveBtn.addEventListener("click", function () {
    var r = loveBtn.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 22);
    answer.classList.add("show");
  });

})();
