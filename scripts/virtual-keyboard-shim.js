/**
 * Test keyboard for Playwright and the critic. Not imported by the app.
 * Inject with page.addInitScript({ path }) or paste into browser_evaluate.
 *
 * Playwright, phone viewport 390x844, keyboard height K = 300:
 *
 *   await page.addInitScript({ path: "scripts/virtual-keyboard-shim.js" });
 *   await page.setViewportSize({ width: 390, height: 844 });
 *   await page.goto("/coach");
 *   await page.evaluate(() => window.__kbd.auto("chrome", { height: 300 }));
 *   await page.locator("textarea").focus();
 *   await page.evaluate(() => window.__kbd.report());
 *
 * Models:
 *   chrome  - innerHeight fixed, visualViewport.height shrinks by K.
 *             If the focused field would sit under the keyboard, offsetTop
 *             pans to reveal it and visualViewport fires "scroll".
 *   edge    - like chrome, but visualViewport.height over-reports by inset
 *             N (default 24). navigator.virtualKeyboard.boundingRect is the
 *             TRUE keyboard rect and fires geometrychange, but only while
 *             overlaysContent is true. While it is true, the visual
 *             viewport does not shrink or pan.
 *   ios     - no navigator.virtualKeyboard. The visual viewport shrinks,
 *             offsetTop pans, and the document can scroll.
 *   content - innerHeight and visualViewport.height shrink together.
 *
 * Every model draws an opaque keyboard at the true rect (fixed, topmost,
 * pointer-events: none).
 *
 *   window.__kbd.open(model, { height, inset })
 *   window.__kbd.close()
 *   window.__kbd.auto(model, opts)
 *   window.__kbd.report()
 *     { model, keyboardTop, visibleTop, focused: { tag, name, top, bottom },
 *       covered, hiddenAbove, overlaps }
 *     All numbers are client coordinates (getBoundingClientRect's space, the
 *     LAYOUT viewport). The phone screen shows [visibleTop, keyboardTop]; a
 *     pan moves both down by the pan offset. covered = the focused field's
 *     bottom is below keyboardTop. hiddenAbove = its top is above visibleTop
 *     (panned off-screen). overlaps lists fixed/sticky elements that
 *     intersect it. A desktop browser cannot pan, so pan models draw a
 *     hatched band over [0, visibleTop): anything under it is off-screen.
 *   content only fakes the JS readings; it cannot shrink the CSS viewport.
 */
(function () {
  if (window.__kbd && window.__kbd.__shim) return;

  const PLATE_ID = "__kbd-plate";
  const BAND_ID = "__kbd-pan";
  const state = {
    model: null,
    open: false,
    K: 300,
    N: 24,
    installed: false,
    offsetTop: 0,
    baseInnerHeight: 0,
    baseVVHeight: 0,
    vk: null,
    autoOn: false,
    autoModel: "chrome",
    autoOpts: null,
    emitting: false,
  };

  const saved = {
    inner: null,
    vv: {},
  };

  function origInnerHeight() {
    const d = saved.inner;
    if (d && typeof d.get === "function") return d.get.call(window);
    if (d && "value" in d) return d.value;
    return window.innerHeight;
  }

  function origVV(prop) {
    const vv = window.visualViewport;
    const d = saved.vv[prop];
    if (d && typeof d.get === "function") return d.get.call(vv);
    if (d && "value" in d) return d.value;
    return vv ? vv[prop] : 0;
  }

  function editable(el) {
    if (!el || el.nodeType !== 1) return null;
    if (el.matches("input, textarea")) return el;
    if (el.isContentEditable) return el;
    return null;
  }

  /* Client coordinates (getBoundingClientRect's space = the LAYOUT viewport).
     A pan moves the visible area down by offsetTop, and the keyboard's top
     moves with it. */
  function keyboardTopPx() {
    return state.baseInnerHeight - state.K + state.offsetTop;
  }

  function overlaying() {
    return state.model === "edge" && state.vk && state.vk.overlaysContent === true;
  }

  function metrics() {
    const realIH = state.installed ? origInnerHeight() : window.innerHeight;
    const realVH = state.installed ? origVV("height") : window.visualViewport ? window.visualViewport.height : realIH;
    const realOT = state.installed ? origVV("offsetTop") : window.visualViewport ? window.visualViewport.offsetTop : 0;
    if (!state.open) {
      return { innerHeight: realIH, vvHeight: realVH, offsetTop: realOT, keyboardTop: null };
    }
    const baseIH = state.baseInnerHeight;
    const baseVH = state.baseVVHeight;
    if (state.model === "content") {
      return { innerHeight: baseIH - state.K, vvHeight: baseVH - state.K, offsetTop: 0, keyboardTop: baseIH - state.K };
    }
    if (overlaying()) {
      return { innerHeight: baseIH, vvHeight: baseVH, offsetTop: 0, keyboardTop: baseIH - state.K };
    }
    if (state.model === "edge") {
      return {
        innerHeight: baseIH,
        vvHeight: baseVH - state.K + state.N,
        offsetTop: state.offsetTop,
        keyboardTop: baseIH - state.K,
      };
    }
    return {
      innerHeight: baseIH,
      vvHeight: baseVH - state.K,
      offsetTop: state.offsetTop,
      keyboardTop: baseIH - state.K,
    };
  }

  function installOverrides() {
    if (state.installed) return;
    const vv = window.visualViewport;
    state.baseInnerHeight = window.innerHeight;
    state.baseVVHeight = vv ? vv.height : window.innerHeight;

    saved.inner = Object.getOwnPropertyDescriptor(window, "innerHeight") ||
      Object.getOwnPropertyDescriptor(Window.prototype, "innerHeight");
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      enumerable: true,
      get() {
        return metrics().innerHeight;
      },
    });

    const vvProps = ["height", "offsetTop", "pageTop"];
    vvProps.forEach((prop) => {
      saved.vv[prop] =
        Object.getOwnPropertyDescriptor(vv, prop) ||
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(vv), prop);
      Object.defineProperty(vv, prop, {
        configurable: true,
        enumerable: true,
        get() {
          const m = metrics();
          if (prop === "height") return m.vvHeight;
          return m.offsetTop;
        },
      });
    });
    state.installed = true;
  }

  function restoreOverrides() {
    if (!state.installed) return;
    const vv = window.visualViewport;
    if (saved.inner) {
      Object.defineProperty(window, "innerHeight", saved.inner);
    } else {
      delete window.innerHeight;
    }
    Object.keys(saved.vv).forEach((prop) => {
      const d = saved.vv[prop];
      if (d) Object.defineProperty(vv, prop, d);
      else delete vv[prop];
    });
    saved.vv = {};
    saved.inner = null;
    state.installed = false;
  }

  function restoreVirtualKeyboard() {
    try {
      delete navigator.virtualKeyboard;
    } catch {
      /* prototype owns it */
    }
    state.vk = null;
  }

  function hideVirtualKeyboard() {
    Object.defineProperty(navigator, "virtualKeyboard", {
      configurable: true,
      enumerable: true,
      get() {
        return undefined;
      },
    });
    state.vk = null;
  }

  function installEdgeKeyboard() {
    const vk = new EventTarget();
    let overlays = false;
    Object.defineProperty(vk, "overlaysContent", {
      configurable: true,
      enumerable: true,
      get() {
        return overlays;
      },
      set(value) {
        const next = Boolean(value);
        if (next === overlays) return;
        overlays = next;
        /* Overlay mode never pans; leaving it lets the browser pan again. */
        applyPan();
        emit();
      },
    });
    Object.defineProperty(vk, "boundingRect", {
      configurable: true,
      enumerable: true,
      get() {
        if (!overlays || !state.open) return new DOMRect(0, 0, 0, 0);
        return new DOMRect(0, keyboardTopPx(), window.innerWidth, state.K);
      },
    });
    Object.defineProperty(navigator, "virtualKeyboard", {
      configurable: true,
      enumerable: true,
      get() {
        return vk;
      },
    });
    state.vk = vk;
  }

  function applyModelChrome() {
    if (state.model === "edge") {
      if (!state.vk) installEdgeKeyboard();
    } else {
      hideVirtualKeyboard();
    }
  }

  function renderPlate() {
    let plate = document.getElementById(PLATE_ID);
    if (!state.open) {
      if (plate) plate.remove();
      return;
    }
    if (!plate) {
      plate = document.createElement("div");
      plate.id = PLATE_ID;
      plate.setAttribute("data-kbd-plate", "1");
      plate.style.position = "fixed";
      plate.style.left = "0";
      plate.style.right = "0";
      plate.style.zIndex = "2147483646";
      plate.style.pointerEvents = "none";
      plate.style.background = "#2a2a2e";
      plate.style.color = "#f4f4f5";
      plate.style.font = "13px/1.2 sans-serif";
      plate.style.padding = "8px 12px";
      plate.style.boxSizing = "border-box";
      plate.style.borderTop = "3px solid #8d8d96";
      document.documentElement.appendChild(plate);
    }
    const top = keyboardTopPx();
    plate.style.top = top + "px";
    plate.style.height = state.K + "px";
    plate.textContent = "keyboard " + state.model + "  " + state.K + "px";
    renderPanBand();
  }

  /* A pan hides [0, offsetTop) above the screen. A desktop browser cannot
     pan, so draw that strip instead: anything under it is off-screen. */
  function renderPanBand() {
    let band = document.getElementById(BAND_ID);
    if (!state.open || !(state.offsetTop > 0)) {
      if (band) band.remove();
      return;
    }
    if (!band) {
      band = document.createElement("div");
      band.id = BAND_ID;
      band.setAttribute("data-kbd-pan", "1");
      band.style.position = "fixed";
      band.style.left = "0";
      band.style.right = "0";
      band.style.top = "0";
      band.style.zIndex = "2147483646";
      band.style.pointerEvents = "none";
      band.style.background =
        "repeating-linear-gradient(135deg, rgba(42,42,46,0.82) 0 10px, rgba(70,70,76,0.82) 10px 20px)";
      band.style.color = "#f4f4f5";
      band.style.font = "13px/1.2 sans-serif";
      band.style.padding = "8px 12px";
      band.style.boxSizing = "border-box";
      document.documentElement.appendChild(band);
    }
    band.style.height = state.offsetTop + "px";
    band.textContent = "panned off-screen " + Math.round(state.offsetTop) + "px";
  }

  function applyPan() {
    state.offsetTop = 0;
    if (!state.open) return;
    if (state.model === "content") return;
    if (overlaying()) return;
    const field = editable(document.activeElement);
    if (!field) return;
    const rect = field.getBoundingClientRect();
    const top = keyboardTopPx();
    if (rect.bottom <= top) return;
    /* Browsers scroll the document first, then pan the visual viewport for
       whatever is left. */
    let need = rect.bottom - (top - 4);
    const se = document.scrollingElement;
    if (se && se.scrollHeight - se.clientHeight > 1) {
      const before = se.scrollTop;
      se.scrollTop = Math.min(se.scrollHeight - se.clientHeight, before + need);
      need -= se.scrollTop - before;
    }
    /* Sub-pixel leftovers from the document scroll are not a pan. */
    state.offsetTop = need < 0.5 ? 0 : Math.min(need, state.K);
  }

  function emit() {
    if (state.emitting) return;
    state.emitting = true;
    try {
      renderPlate();
      const vv = window.visualViewport;
      if (vv) {
        vv.dispatchEvent(new Event("resize"));
        vv.dispatchEvent(new Event("scroll"));
      }
      window.dispatchEvent(new Event("resize"));
      if (state.vk) state.vk.dispatchEvent(new Event("geometrychange"));
    } finally {
      state.emitting = false;
    }
  }

  function onAutoFocusIn(event) {
    if (!state.autoOn) return;
    if (!editable(event.target)) return;
    api.open(state.autoModel, state.autoOpts || {});
  }

  function onAutoFocusOut(event) {
    if (!state.autoOn) return;
    const next = event.relatedTarget;
    if (editable(next)) return;
    window.setTimeout(() => {
      if (!state.autoOn) return;
      if (!editable(document.activeElement)) api.close();
    }, 0);
  }

  const api = {
    __shim: true,
    open(model, opts) {
      const name = String(model || "chrome");
      if (["chrome", "edge", "ios", "content"].indexOf(name) === -1) {
        throw new Error("Unknown keyboard model: " + name);
      }
      const options = opts || {};
      state.model = name;
      state.K = Number.isFinite(options.height) ? options.height : 300;
      state.N = Number.isFinite(options.inset) ? options.inset : 24;
      installOverrides();
      applyModelChrome();
      state.open = true;
      applyPan();
      emit();
    },
    close() {
      if (!state.open && !state.installed) return;
      state.open = false;
      state.offsetTop = 0;
      renderPlate();
      restoreOverrides();
      /* auto("edge") keeps the fake API between keyboards, as a real page
         keeps its overlaysContent opt-in. */
      const keepVk = state.autoOn && state.autoModel === "edge" && state.vk;
      if (keepVk) state.vk.dispatchEvent(new Event("geometrychange"));
      else restoreVirtualKeyboard();
      state.model = null;
      const vv = window.visualViewport;
      if (vv) vv.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("resize"));
    },
    auto(model, opts) {
      state.autoOn = true;
      state.autoModel = model || "chrome";
      state.autoOpts = opts || {};
      /* A real page opts into overlaysContent long before any keyboard, so
         install the fake API now and let the page see it on its next resize. */
      if (state.autoModel === "edge" && !state.vk) {
        installEdgeKeyboard();
        window.dispatchEvent(new Event("resize"));
      }
      if (!state.autoBound) {
        document.addEventListener("focusin", onAutoFocusIn, true);
        document.addEventListener("focusout", onAutoFocusOut, true);
        state.autoBound = true;
      }
      if (editable(document.activeElement)) api.open(state.autoModel, state.autoOpts);
    },
    report() {
      const field = editable(document.activeElement);
      const top = state.open ? keyboardTopPx() : null;
      let focused = null;
      let covered = false;
      let hiddenAbove = false;
      const overlaps = [];
      if (field) {
        const rect = field.getBoundingClientRect();
        const name = field.getAttribute("name") || field.getAttribute("aria-label") || "";
        focused = {
          tag: field.tagName.toLowerCase(),
          name,
          top: rect.top,
          bottom: rect.bottom,
        };
        covered = top != null && rect.bottom > top + 0.5;
        hiddenAbove = state.open && rect.top < state.offsetTop - 0.5;
        const nodes = document.body.querySelectorAll("*");
        for (let i = 0; i < nodes.length; i++) {
          const el = nodes[i];
          if (el.id === PLATE_ID || el.id === BAND_ID) continue;
          const cs = getComputedStyle(el);
          if (cs.position !== "fixed" && cs.position !== "sticky") continue;
          if (cs.display === "none" || cs.visibility === "hidden") continue;
          const r = el.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) continue;
          const hit = !(r.right < rect.left || r.left > rect.right || r.bottom < rect.top || r.top > rect.bottom);
          if (!hit) continue;
          const label = (el.getAttribute("aria-label") || el.className || el.tagName || "").toString();
          overlaps.push(label.slice(0, 80));
        }
      }
      return {
        model: state.model,
        keyboardTop: top,
        visibleTop: state.open ? state.offsetTop : 0,
        focused,
        covered,
        hiddenAbove,
        overlaps,
      };
    },
  };

  window.__kbd = api;
})();
