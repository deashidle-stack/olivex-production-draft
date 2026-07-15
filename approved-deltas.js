(function () {
  "use strict";

  const STUDY_REFERENCES = [
    {
      number: "01",
      url: "https://www.nature.com/articles/437045a"
    },
    {
      number: "02",
      url: "https://www.nejm.org/doi/full/10.1056/NEJMoa1800389"
    },
    {
      number: "03",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7601817/"
    },
    {
      number: "04",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5504696/"
    },
    {
      number: "05",
      url: "https://www.clinicalnutritionjournal.com/article/S0261-5614%2823%2900212-1/fulltext"
    }
  ];

  let selectedInterval = "30";
  let applyQueued = false;
  let cartOpenFrom = null;
  let cartScrollPosition = 0;

  function createStudyLink(reference, title) {
    const link = document.createElement("a");
    link.className = "olivex-study-link";
    link.href = reference.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `Åpne studien «${title}» i en ny fane`);

    const icon = document.createElement("span");
    icon.className = "olivex-icon olivex-icon--external";
    icon.setAttribute("aria-hidden", "true");
    link.append(icon);
    return link;
  }

  function createAprilStudy() {
    const study = document.createElement("article");
    // This card is appended after Jakob's reveal observer has already bound.
    // Keep it visible inside the horizontal rail instead of leaving it at the
    // observer's pre-animation opacity.
    study.className = "study in-view";
    study.innerHTML = [
      '<span class="study-journal">Clinical Nutrition</span>',
      '<h3>APRIL-studien (Clinical Nutrition)</h3>',
      '<p>Randomisert klinisk studie av høyfenolisk extra virgin olivenolje og kardiometabolske markører.</p>'
    ].join("");
    return study;
  }

  function updateStudyCarousel(carousel) {
    const viewport = carousel.querySelector("[data-olivex-study-viewport]");
    const rail = carousel.querySelector(".studies");
    const next = carousel.querySelector("[data-olivex-study-next]");
    if (!viewport || !rail) return;

    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const atEnd = maxScroll <= 2 || viewport.scrollLeft >= maxScroll - 2;
    carousel.classList.toggle("is-at-end", atEnd);
    if (next) {
      next.disabled = atEnd;
      next.setAttribute("aria-disabled", String(atEnd));
    }
  }

  function studyScrollAmount(carousel) {
    const card = carousel.querySelector(".study");
    const rail = carousel.querySelector(".studies");
    if (!card || !rail) return 320;
    const styles = window.getComputedStyle(rail);
    return card.getBoundingClientRect().width + (parseFloat(styles.columnGap || styles.gap) || 18);
  }

  function initializeStudyCarousel(carousel) {
    if (carousel.dataset.olivexStudyReady === "true") return;
    const viewport = carousel.querySelector("[data-olivex-study-viewport]");
    const next = carousel.querySelector("[data-olivex-study-next]");
    if (!viewport || !next) return;
    carousel.dataset.olivexStudyReady = "true";

    let scrollFrame = 0;
    const scheduleUpdate = () => {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(() => updateStudyCarousel(carousel));
    };
    const scrollByCard = (direction) => viewport.scrollBy({
      left: studyScrollAmount(carousel) * direction,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });

    next.addEventListener("click", () => scrollByCard(1));
    viewport.addEventListener("scroll", scheduleUpdate, { passive: true });
    viewport.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      scrollByCard(event.key === "ArrowRight" ? 1 : -1);
    });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    scheduleUpdate();
  }

  function ensureReferences() {
    document.querySelectorAll(".olivex-approved-references, .olivex-reference-index").forEach((section) => section.remove());

    const research = document.querySelector("#forskning");
    const studies = research?.querySelector(":scope .studies");
    if (!research || !studies) return;

    if (studies.children.length === 4) studies.append(createAprilStudy());
    Array.from(studies.querySelectorAll(":scope > .study")).forEach((study, index) => {
      // Horizontal discovery is handled by the carousel itself. Cards that
      // begin outside the viewport must still paint when the user scrolls to
      // them, including the dynamically-added APRIL card.
      study.classList.remove("reveal");
      study.classList.add("in-view");
      const reference = STUDY_REFERENCES[index];
      if (!reference) return;
      let number = study.querySelector(":scope > .olivex-study-number");
      if (!number) {
        number = document.createElement("span");
        number.className = "olivex-study-number";
        study.prepend(number);
      }
      number.textContent = reference.number;
      if (!study.querySelector(":scope > .olivex-study-link")) {
        study.append(createStudyLink(reference, study.querySelector("h3")?.textContent.trim() || "forskningsreferanse"));
      }
    });

    let carousel = studies.closest("[data-olivex-study-carousel]");
    if (!carousel) {
      carousel = document.createElement("div");
      carousel.className = "olivex-study-carousel";
      carousel.dataset.olivexStudyCarousel = "";

      const viewport = document.createElement("div");
      viewport.className = "olivex-study-viewport";
      viewport.dataset.olivexStudyViewport = "";
      viewport.tabIndex = 0;
      viewport.setAttribute("role", "region");
      viewport.setAttribute("aria-label", "Fem forskningsstudier. Bruk piltastene for å bla horisontalt.");

      studies.insertAdjacentElement("beforebegin", carousel);
      carousel.append(viewport);
      viewport.append(studies);
    }

    carousel.querySelector(".olivex-study-controls")?.remove();
    if (!carousel.querySelector("[data-olivex-study-next]")) {
      const edgeButton = document.createElement("button");
      edgeButton.className = "olivex-study-edge-control";
      edgeButton.type = "button";
      edgeButton.dataset.olivexStudyNext = "";
      edgeButton.setAttribute("aria-label", "Vis neste studie");
      edgeButton.innerHTML = '<span class="olivex-icon olivex-icon--right" aria-hidden="true"></span>';
      carousel.append(edgeButton);
    }
    initializeStudyCarousel(carousel);
  }

  function ensureEditorialSections() {
    const props = document.querySelector("section.props");
    const howto = document.querySelector("section.howto");
    props?.setAttribute("data-olivex-editorial-branch", "five");
    howto?.setAttribute("data-olivex-editorial-branch", "three");
    const propsCta = Array.from(props?.querySelectorAll(".prop-card") || []).find(
      (card) => card.querySelector("h3")?.textContent.trim() === "Smak forskjellen selv"
    );
    propsCta?.remove();
    props?.querySelectorAll(".prop-card .prop-num").forEach((number, index) => {
      number.textContent = String(index + 1).padStart(2, "0");
    });

    const buySection = document.querySelector("#bestill");
    if (buySection && !buySection.querySelector(".olivex-buy-product-art")) {
      const productArt = document.createElement("img");
      productArt.className = "olivex-buy-product-art";
      productArt.src = "./assets/productbilde-1-1.webp";
      productArt.alt = "";
      productArt.width = 1200;
      productArt.height = 900;
      productArt.loading = "lazy";
      productArt.decoding = "async";
      productArt.setAttribute("aria-hidden", "true");
      buySection.prepend(productArt);
    }
  }

  function createVideoControls() {
    const fragment = document.createDocumentFragment();
    const embed = document.createElement("div");
    const play = document.createElement("button");
    const disc = document.createElement("span");
    const icon = document.createElement("img");
    const status = document.createElement("p");

    embed.className = "olivex-grove-video-embed";
    embed.dataset.olivexGroveVideoEmbed = "";

    play.className = "olivex-grove-video-play";
    play.type = "button";
    play.dataset.olivexGroveVideoPlay = "";
    play.setAttribute("aria-label", "Spill av video fra olivenlunden i Hellas");

    disc.className = "olivex-grove-play-disc";
    disc.setAttribute("aria-hidden", "true");
    icon.src = "./icon-play-fill.svg";
    icon.alt = "";
    icon.width = 256;
    icon.height = 256;
    disc.append(icon);
    play.append(disc);

    status.className = "olivex-video-status";
    status.dataset.olivexGroveVideoStatus = "";
    status.setAttribute("aria-live", "polite");

    fragment.append(embed, play, status);
    return fragment;
  }

  function initializeVideo(frame) {
    if (frame.dataset.olivexVideoInitialized === "true") return;

    const play = frame.querySelector("[data-olivex-grove-video-play]");
    const disc = frame.querySelector(".olivex-grove-play-disc");
    const embed = frame.querySelector("[data-olivex-grove-video-embed]");
    const status = frame.querySelector("[data-olivex-grove-video-status]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!play || !embed) return;
    frame.dataset.olivexVideoInitialized = "true";

    play.addEventListener("click", () => {
      if (frame.classList.contains("is-video-active")) return;

      const iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/P5aSmPtzSaM?rel=0&playsinline=1&autoplay=1";
      iframe.title = "Video fra olivenlunden i Hellas";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.tabIndex = 0;

      embed.replaceChildren(iframe);
      frame.classList.add("is-video-active");
      frame.closest(".heritage")?.classList.add("is-video-active");
      play.remove();
      if (status) status.textContent = "Videoen er lastet og spiller.";

      iframe.addEventListener("load", () => iframe.focus({ preventScroll: true }), { once: true });
      window.requestAnimationFrame(() => iframe.focus({ preventScroll: true }));
    });

    if (disc && window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reducedMotion.matches) {
      play.addEventListener("pointermove", (event) => {
        const rect = play.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
        const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
        disc.style.setProperty("--olivex-video-magnet-x", `${relativeX * 36}px`);
        disc.style.setProperty("--olivex-video-magnet-y", `${relativeY * 28}px`);
      });
      play.addEventListener("pointerleave", () => {
        disc.style.setProperty("--olivex-video-magnet-x", "0px");
        disc.style.setProperty("--olivex-video-magnet-y", "0px");
      });
    }
  }

  function initializeGroveScrollReveal(frame, heritage) {
    if (frame.dataset.olivexScrollRevealReady === "true") return;
    frame.dataset.olivexScrollRevealReady = "true";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    // Ported from the approved checkpoint choreography:
    //   clip inset 7% / 5% -> 0
    //   section top 85% -> 22% of the viewport
    // The requestAnimationFrame interpolation reproduces GSAP's scrubbed
    // response without adding a new runtime dependency to Jakob's bundle.
    let current = 0;
    let target = 0;
    let animationFrame = 0;
    let lastTime = performance.now();

    const progressForPosition = () => {
      const sectionTop = heritage.getBoundingClientRect().top;
      const start = window.innerHeight * 0.85;
      const end = window.innerHeight * 0.22;
      return Math.min(1, Math.max(0, (start - sectionTop) / Math.max(1, start - end)));
    };

    const render = (progress) => {
      const remaining = 1 - progress;
      frame.style.clipPath = `inset(${(7 * remaining).toFixed(3)}% ${(5 * remaining).toFixed(3)}% round ${(8 * remaining).toFixed(3)}px)`;
    };

    const animate = (time) => {
      const elapsed = Math.min(64, Math.max(0, time - lastTime));
      lastTime = time;
      current += (target - current) * (1 - Math.exp(-elapsed / 170));

      if (Math.abs(target - current) < 0.001) current = target;
      render(current);

      if (current !== target) {
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        animationFrame = 0;
      }
    };

    const update = () => {
      target = progressForPosition();
      if (!animationFrame) {
        lastTime = performance.now();
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    current = target = progressForPosition();
    frame.classList.add("olivex-grove-scroll-reveal");
    render(current);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
  }

  function ensureVideo() {
    document.querySelectorAll('[data-olivex-approved-delta="producer-video"]').forEach((section) => section.remove());

    const heritage = document.querySelector("section.heritage");
    const imageSlot = heritage?.querySelector("#grove-full");
    if (!heritage || !imageSlot) return;

    imageSlot.removeAttribute("data-olivex-video-frame");
    imageSlot.removeAttribute("data-olivex-approved-delta");
    imageSlot.querySelectorAll(".olivex-grove-video-embed, .olivex-grove-video-play, .olivex-video-status").forEach((control) => control.remove());

    let frame = heritage.querySelector("[data-olivex-video-frame]");
    if (!frame || !frame.contains(imageSlot)) {
      frame?.remove();
      frame = document.createElement("div");
      frame.className = "olivex-grove-video-frame";
      frame.dataset.olivexVideoFrame = "";
      frame.dataset.olivexApprovedDelta = "grove-video";
      imageSlot.insertAdjacentElement("beforebegin", frame);
      frame.append(imageSlot);
    }
    if (!frame.querySelector("[data-olivex-grove-video-embed]")) {
      frame.append(createVideoControls());
    }
    initializeGroveScrollReveal(frame, heritage);
    initializeVideo(frame);
  }

  function formatNok(value) {
    const hasDecimals = Math.round(value * 100) % 100 !== 0;
    return `${new Intl.NumberFormat("nb-NO", {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2
    }).format(value)} kr`;
  }

  function parseNok(value) {
    const normalized = String(value || "")
      .replace(/\s/g, "")
      .replace(/kr/gi, "")
      .replace(",", ".")
      .replace(/[^0-9.-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function readPurchaseSelection() {
    const purchase = document.querySelector("#bestill");
    const selected = purchase?.querySelector(".plan-list > .plan-card.selected");
    if (!selected) return null;

    const nameNode = selected.querySelector(".plan-name")?.cloneNode(true);
    nameNode?.querySelector(".plan-badge")?.remove();
    const name = nameNode?.textContent.trim() || "Olive X";
    const isSubscription = Boolean(selected.querySelector(".plan-badge"));
    const isSample = /smaksprøve/i.test(name);
    const quantityValue = Number(selected.querySelector(".qty-num")?.textContent.trim());
    const quantity = isSample ? 1 : Math.min(12, Math.max(1, Number.isFinite(quantityValue) ? quantityValue : 1));
    const unitPrice = parseNok(selected.querySelector(".plan-price strong")?.textContent);
    const comparePrice = parseNok(selected.querySelector(".plan-compare")?.textContent);
    const intervalButton = selected.querySelector(".interval-pill.selected");
    const interval = intervalButton?.dataset.olivexInterval
      || intervalButton?.textContent.trim().match(/^(30|60|90)/)?.[1]
      || selectedInterval;

    return {
      name,
      quantity,
      unitPrice,
      total: unitPrice * quantity,
      compareTotal: comparePrice > unitPrice ? comparePrice * quantity : 0,
      meta: isSample
        ? "100 ml · Engangskjøp"
        : isSubscription
          ? `500 ml · Levering hver ${interval}. dag`
          : "500 ml · Engangskjøp"
    };
  }

  function closePreviewCart() {
    const shell = document.querySelector("[data-olivex-preview-cart]");
    if (!shell || shell.hidden) return;

    shell.hidden = true;
    document.body.classList.remove("olivex-cart-is-open");
    document.body.style.removeProperty("--olivex-cart-scroll-offset");
    window.scrollTo({ top: cartScrollPosition, left: 0, behavior: "instant" });
    const returnTarget = cartOpenFrom?.isConnected
      ? cartOpenFrom
      : document.querySelector("#bestill .buy-widget > .btn.btn-primary");
    if (returnTarget) {
      window.requestAnimationFrame(() => returnTarget.focus({ preventScroll: true }));
    }
    cartOpenFrom = null;
  }

  function openPreviewCart(opener) {
    const selection = readPurchaseSelection();
    const shell = document.querySelector("[data-olivex-preview-cart]");
    if (!selection || !shell) return;

    shell.querySelector("[data-preview-cart-name]").textContent = selection.name;
    shell.querySelector("[data-preview-cart-meta]").textContent = selection.meta;
    shell.querySelector("[data-preview-cart-quantity]").textContent = String(selection.quantity);
    shell.querySelector("[data-preview-cart-line-total]").textContent = formatNok(selection.total);
    shell.querySelector("[data-preview-cart-total]").textContent = formatNok(selection.total);

    const compare = shell.querySelector("[data-preview-cart-compare]");
    compare.hidden = !selection.compareTotal;
    compare.textContent = selection.compareTotal ? formatNok(selection.compareTotal) : "";

    shell.querySelector("[data-preview-cart-content]").hidden = false;
    shell.querySelector("[data-preview-cart-empty]").hidden = true;
    shell.querySelector("[data-preview-cart-summary]").hidden = false;
    shell.querySelector("[data-preview-cart-live]").textContent = `${selection.name} er lagt i handlekurven.`;

    cartOpenFrom = opener;
    cartScrollPosition = window.scrollY;
    document.body.style.setProperty("--olivex-cart-scroll-offset", `${-cartScrollPosition}px`);
    shell.hidden = false;
    document.body.classList.add("olivex-cart-is-open");
    window.requestAnimationFrame(() => shell.querySelector("#olivex-preview-cart-title")?.focus({ preventScroll: true }));
  }

  function createPreviewCart() {
    const shell = document.createElement("div");
    shell.className = "olivex-preview-cart";
    shell.dataset.olivexPreviewCart = "";
    shell.hidden = true;
    shell.innerHTML = [
      '<div class="olivex-preview-cart__backdrop" data-preview-cart-dismiss aria-hidden="true"></div>',
      '<aside class="olivex-preview-cart__drawer" role="dialog" aria-modal="true" aria-labelledby="olivex-preview-cart-title" tabindex="-1">',
      '  <header class="olivex-preview-cart__header">',
      '    <div><p class="eyebrow">Bestilling</p><h2 id="olivex-preview-cart-title" tabindex="-1">Handlekurv</h2></div>',
      '    <button type="button" class="olivex-preview-cart__close" data-preview-cart-dismiss>Lukk</button>',
      '  </header>',
      '  <div class="olivex-preview-cart__content" data-preview-cart-content>',
      '    <article class="olivex-preview-cart__item">',
      '      <div class="olivex-preview-cart__item-copy"><h3 data-preview-cart-name></h3><p data-preview-cart-meta></p></div>',
      '      <div class="olivex-preview-cart__item-total"><span>Antall <strong data-preview-cart-quantity></strong></span><span data-preview-cart-compare hidden></span><strong data-preview-cart-line-total></strong></div>',
      '      <button type="button" class="olivex-preview-cart__remove" data-preview-cart-remove>Fjern</button>',
      '    </article>',
      '  </div>',
      '  <div class="olivex-preview-cart__empty" data-preview-cart-empty hidden><p>Handlekurven er tom.</p></div>',
      '  <footer class="olivex-preview-cart__summary" data-preview-cart-summary>',
      '    <div><span>Totalt</span><strong data-preview-cart-total></strong></div>',
      '    <button type="button" class="btn btn-primary" data-preview-cart-dismiss>Fortsett å handle</button>',
      '  </footer>',
      '  <p class="olivex-video-status" aria-live="polite" data-preview-cart-live></p>',
      '</aside>'
    ].join("");
    return shell;
  }

  function ensurePreviewCart() {
    let shell = document.querySelector("[data-olivex-preview-cart]");
    if (shell) return;

    shell = createPreviewCart();
    document.body.append(shell);

    shell.querySelectorAll("[data-preview-cart-dismiss]").forEach((control) => {
      control.addEventListener("click", closePreviewCart);
    });

    shell.querySelector("[data-preview-cart-remove]")?.addEventListener("click", () => {
      shell.querySelector("[data-preview-cart-content]").hidden = true;
      shell.querySelector("[data-preview-cart-empty]").hidden = false;
      shell.querySelector("[data-preview-cart-summary]").hidden = true;
      shell.querySelector("[data-preview-cart-live]").textContent = "Varen er fjernet fra handlekurven.";
      shell.querySelector(".olivex-preview-cart__close")?.focus({ preventScroll: true });
    });
  }

  function ensureDocumentLinks() {
    const certificates = Array.from(document.querySelectorAll("#lab .certs > a.cert"));
    if (certificates.length !== 4) return;

    certificates.slice(0, 3).forEach((link) => {
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
      link.dataset.olivexMissingDocument = "true";
    });

    const efsa = certificates[3];
    efsa.href = "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:02012R0432-20160620";
    efsa.target = "_blank";
    efsa.rel = "noopener noreferrer";
    efsa.removeAttribute("aria-disabled");
    efsa.removeAttribute("tabindex");
  }

  function ensurePurchaseOptions() {
    const purchase = document.querySelector("#bestill");
    if (!purchase) return;

    const cards = Array.from(purchase.querySelectorAll(".plan-list > .plan-card"));
    const subscription = cards.find((card) => card.querySelector(".plan-badge"));
    if (!subscription) return;

    const stockNote = purchase.querySelector(".stock-note");
    if (stockNote?.textContent.includes("[FRAKTINFO]")) {
      stockNote.textContent = "På lager — sendes innen 1–2 virkedager · Gratis frakt over 800,–";
    }

    const savings = subscription.querySelector(".plan-perks li:first-child");
    if (savings && savings.textContent.trim() === "Du sparer 15 % hver gang") {
      savings.textContent = "Du sparer 10 % hver gang";
    }

    const intervalRow = subscription.querySelector(".interval-row");
    if (intervalRow) {
      let ninety = intervalRow.querySelector('[data-olivex-interval="90"]');
      if (!ninety) {
        ninety = document.createElement("button");
        ninety.type = "button";
        ninety.className = "interval-pill";
        ninety.dataset.olivexInterval = "90";
        ninety.textContent = "90 dager";
        intervalRow.append(ninety);
      }

      intervalRow.querySelectorAll(".interval-pill").forEach((button) => {
        const interval = button.dataset.olivexInterval || button.textContent.trim().match(/^(30|60)/)?.[1];
        const isSelected = interval === selectedInterval;
        button.classList.toggle("selected", isSelected);
        button.setAttribute("aria-pressed", isSelected ? "true" : "false");
      });
    }

    purchase.querySelectorAll(".qty-stepper").forEach((stepper) => {
      const buttons = stepper.querySelectorAll(".qty-btn");
      const value = Number(stepper.querySelector(".qty-num")?.textContent.trim());
      if (buttons.length < 2 || !Number.isFinite(value)) return;

      buttons[0].setAttribute("aria-label", "Reduser antall");
      buttons[1].setAttribute("aria-label", "Øk antall");
      buttons[0].disabled = value <= 1;
      buttons[1].disabled = value >= 12;
      buttons[0].setAttribute("aria-disabled", buttons[0].disabled ? "true" : "false");
      buttons[1].setAttribute("aria-disabled", buttons[1].disabled ? "true" : "false");
    });
  }

  function removeUnresolvedFooterPlaceholder() {
    const footerMeta = document.querySelector(".footer-meta");
    if (!footerMeta?.textContent.includes("[ORG.NR]")) return;
    footerMeta.textContent = "Olive X · Norge · Importør av høyfenolisk olivenolje fra Hellas";
  }

  function applyApprovedDeltas() {
    applyQueued = false;
    ensureVideo();
    ensureEditorialSections();
    ensurePreviewCart();
    ensureReferences();
    ensureDocumentLinks();
    ensurePurchaseOptions();
    removeUnresolvedFooterPlaceholder();
  }

  function scheduleApply() {
    if (applyQueued) return;
    applyQueued = true;
    window.requestAnimationFrame(applyApprovedDeltas);
  }

  document.addEventListener("click", (event) => {
    const addToCart = event.target.closest?.("#bestill .buy-widget > .btn.btn-primary");
    if (addToCart) {
      event.preventDefault();
      openPreviewCart(addToCart);
      return;
    }

    const blockedDocument = event.target.closest?.('[data-olivex-missing-document="true"]');
    if (blockedDocument) {
      event.preventDefault();
      return;
    }

    const intervalButton = event.target.closest?.("#bestill .interval-pill");
    if (intervalButton) {
      const interval = intervalButton.dataset.olivexInterval || intervalButton.textContent.trim().match(/^(30|60)/)?.[1];
      if (interval) selectedInterval = interval;

      if (interval === "90") {
        event.preventDefault();
        event.stopPropagation();
        scheduleApply();
      }
    }

    const quantityButton = event.target.closest?.("#bestill .qty-btn");
    if (quantityButton) {
      const stepper = quantityButton.closest(".qty-stepper");
      const buttons = Array.from(stepper?.querySelectorAll(".qty-btn") || []);
      const value = Number(stepper?.querySelector(".qty-num")?.textContent.trim());
      if (quantityButton === buttons[1] && value >= 12) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }
  }, true);

  document.addEventListener("keydown", (event) => {
    const shell = document.querySelector("[data-olivex-preview-cart]");
    if (!shell || shell.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closePreviewCart();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(shell.querySelectorAll([
      "button:not([disabled])",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])'
    ].join(","))).filter((element) => !element.hidden && element.getClientRects().length > 0);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const dialog = shell.querySelector('[role="dialog"]');
    const title = shell.querySelector("#olivex-preview-cart-title");
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog || document.activeElement === title)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const observer = new MutationObserver(scheduleApply);
  observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleApply, { once: true });
  } else {
    scheduleApply();
  }
})();
