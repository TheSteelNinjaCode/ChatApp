(() => {
  /* ──────────────────────────────────────────────────────────────
   * 1.  keep references to the native methods
   * ────────────────────────────────────────────────────────────── */
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const originalRemoveEventListener = EventTarget.prototype.removeEventListener;
  /* ──────────────────────────────────────────────────────────────
   * 2.  internal registry of attached listeners
   * ────────────────────────────────────────────────────────────── */
  const listeners = new Map();
  /* ──────────────────────────────────────────────────────────────
   * 3.  events that should be passive by default
   * ────────────────────────────────────────────────────────────── */
  const passiveEvents = new Set([
    "wheel",
    "mousewheel",
    "touchstart",
    "touchmove",
    "touchend",
    "touchcancel",
    "scroll",
  ]);
  /* ──────────────────────────────────────────────────────────────
   * 4.  patched addEventListener
   * ────────────────────────────────────────────────────────────── */
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    // ——— ensure passive = true for the events above ———
    let opts = options;
    if (passiveEvents.has(type)) {
      if (opts === undefined) {
        // caller passed nothing -> supply { passive:true }
        opts = { passive: true };
      } else if (typeof opts === "boolean") {
        // caller used the capture flag -> turn into an object
        opts = { capture: opts, passive: true };
      } else if (opts && opts.passive === undefined) {
        // caller passed an object without passive -> extend it
        opts = { ...opts, passive: true };
      }
      // if opts.passive is already defined we leave it alone
    }
    // ——— bookkeeping (unchanged) ———
    if (!listeners.has(this)) listeners.set(this, new Map());
    const typeMap = listeners.get(this);
    const set = typeMap.get(type) || new Set();
    set.add(listener);
    typeMap.set(type, set);
    // ——— delegate to the native method ———
    originalAddEventListener.call(this, type, listener, opts);
  };
  /* ──────────────────────────────────────────────────────────────
   * 5.  patched removeEventListener (unchanged except for bookkeeping)
   * ────────────────────────────────────────────────────────────── */
  EventTarget.prototype.removeEventListener = function (
    type,
    listener,
    options
  ) {
    if (listeners.has(this) && listeners.get(this).has(type)) {
      const set = listeners.get(this).get(type);
      set.delete(listener);
      if (set.size === 0) listeners.get(this).delete(type);
    }
    originalRemoveEventListener.call(this, type, listener, options);
  };
  /* ──────────────────────────────────────────────────────────────
   * 6.  helper to purge *all* listeners of a given type
   * ────────────────────────────────────────────────────────────── */
  EventTarget.prototype.removeAllEventListeners = function (type) {
    if (!listeners.has(this)) return;
    const set = listeners.get(this).get(type);
    if (!set) return;
    set.forEach((listener) => {
      originalRemoveEventListener.call(this, type, listener);
    });
    listeners.get(this).delete(type);
  };
})();
(function patchConsoleForPPHP() {
  const orig = console.log;
  console.log = (...args) => {
    const mapped = args.map((a) =>
      typeof a === "function" && a.__isReactiveProxy ? a() : a
    );
    orig.apply(console, mapped);
  };
})();
class PPHP {
  props = {};
  _isNavigating = false;
  _responseData = null;
  _elementState = {
    checkedElements: new Set(),
  };
  _activeAbortController = null;
  _reservedWords;
  _declaredStateRoots = new Set();
  _arrayMethodCache = new WeakMap();
  _updateScheduled = false;
  _pendingBindings = new Set();
  _effects = new Set();
  _pendingEffects = new Set();
  _processedPhpScripts = new WeakSet();
  _bindings = [];
  _templateStore = new WeakMap();
  _inlineDepth = 0;
  _proxyCache = new WeakMap();
  _rawProps = {};
  _refs = new Map();
  _wheelHandlersStashed = false;
  _evaluatorCache = new Map();
  _depsCache = new Map();
  _dirtyDeps = new Set();
  _handlerCache = new Map();
  _handlerProxyCache = new WeakMap();
  _sharedStateMap = new Set();
  _processedLoops = new WeakSet();
  _hydrated = false;
  _currentProcessingHierarchy = null;
  _stateHierarchy = new Map();
  _currentTemplateHierarchy = null;
  _inlineModuleFns = new Map();
  _currentExecutionScope = null;
  _eventHandlers;
  _redirectRegex = /redirect_7F834\s*=\s*(\/[^\s]*)/;
  _assignmentRe = /^\s*[\w.]+\s*=(?!=)/;
  _mustacheRe = /\{\{\s*([\s\S]+?)\s*\}\}/gu;
  _mutators;
  _boolAttrs = new Set([
    "allowfullscreen",
    "async",
    "autofocus",
    "autoplay",
    "checked",
    "controls",
    "default",
    "defer",
    "disabled",
    "formnovalidate",
    "hidden",
    "inert",
    "ismap",
    "itemscope",
    "loop",
    "multiple",
    "muted",
    "nomodule",
    "novalidate",
    "open",
    "playsinline",
    "readonly",
    "required",
    "reversed",
    "selected",
    "truespeed",
  ]);
  static _instance;
  static _effectCleanups;
  static _debounceTimers = new Map();
  static _shared = new Map();
  static _cryptoKey = null;
  static _cancelableEvents = new Set(["click", "submit", "change"]);
  static _mustacheTest = /\{\{\s*[\s\S]+?\s*\}\}/;
  static _mustachePattern = /\{\{\s*([\s\S]+?)\s*\}\}/g;
  static _passiveEvents = new Set([
    "wheel",
    "mousewheel",
    "touchstart",
    "touchmove",
    "touchend",
    "touchcancel",
    "scroll",
  ]);
  constructor() {
    const elementEvents = Object.getOwnPropertyNames(
      HTMLElement.prototype
    ).filter((p) => p.startsWith("on"));
    const documentEvents = Object.getOwnPropertyNames(
      Document.prototype
    ).filter((p) => p.startsWith("on"));
    const windowEvents = Object.getOwnPropertyNames(Window.prototype).filter(
      (p) => p.startsWith("on")
    );
    this._eventHandlers = new Set(
      [...elementEvents, ...documentEvents, ...windowEvents].map((e) =>
        e.toLowerCase()
      )
    );
    this._reservedWords = new Set([
      "null",
      "undefined",
      "true",
      "false",
      "await",
      "break",
      "case",
      "catch",
      "class",
      "const",
      "continue",
      "debugger",
      "default",
      "delete",
      "do",
      "else",
      "export",
      "extends",
      "finally",
      "for",
      "function",
      "if",
      "import",
      "in",
      "instanceof",
      "let",
      "new",
      "return",
      "super",
      "switch",
      "this",
      "throw",
      "try",
      "typeof",
      "var",
      "void",
      "while",
      "with",
      "yield",
      "async",
      "await",
      "implements",
      "interface",
      "event",
      "NaN",
      "Infinity",
      "Number",
      "String",
      "Boolean",
      "Object",
      "Array",
      "Function",
      "Date",
      "RegExp",
      "Error",
      "JSON",
      "Math",
      "Map",
      "Set",
    ]);
    this._mutators = new Set([
      "push",
      "pop",
      "shift",
      "unshift",
      "splice",
      "sort",
      "reverse",
      "copyWithin",
      "fill",
    ]);
    this.handlePopState();
    this._proxyCache = new WeakMap();
    this._evaluatorCache.clear();
    this._depsCache.clear();
    this.props = this.makeReactive(this._rawProps);
    this.scheduleInitialHydration();
  }
  static get instance() {
    if (!PPHP._instance) {
      PPHP._instance = new PPHP();
    }
    return PPHP._instance;
  }
  debugProps() {
    console.group("%cPPHP Debug Snapshot", "font-weight:bold; color:teal");
    // 1. Raw props tree
    console.groupCollapsed("📦 Raw props");
    console.log(JSON.stringify(this.props, null, 2));
    console.groupEnd();
    // 2. State hierarchy
    console.groupCollapsed("🔖 State hierarchy");
    console.table(
      Array.from(this._stateHierarchy.entries()).map(([scopedKey, info]) => ({
        scopedKey,
        originalKey: info.originalKey,
        level: info.level,
        value: this.formatValue(this.getNested(this.props, scopedKey)),
        path: info.hierarchy.join(" → "),
      }))
    );
    console.groupEnd();
    // 3. Reactive internals
    console.groupCollapsed("⚙️ Reactive internals");
    console.log("Bindings total:", this._bindings.length);
    console.log("Pending bindings:", this._pendingBindings.size);
    console.log("Effects:", this._effects.size);
    console.log("Pending effects:", this._pendingEffects.size);
    console.log(
      "Dirty deps:",
      Array.from(this._dirtyDeps).join(", ") || "(none)"
    );
    console.groupEnd();
    // 4. Refs
    console.groupCollapsed("🔗 Refs");
    console.table(
      Array.from(this._refs.entries()).map(([key, els]) => ({
        key,
        count: els.length,
        selectors: els.map((el) => el.tagName.toLowerCase()).join(", "),
      }))
    );
    console.groupEnd();
    // 5. Inline modules
    console.groupCollapsed("📦 Inline modules");
    this._inlineModuleFns.forEach((fnMap, scope) => {
      console.log(`${scope}:`, [...fnMap.keys()]);
    });
    console.groupEnd();
    // 6. Hydration flag
    console.log("Hydrated:", this._hydrated);
    // 7. Conditionals (pp-if / pp-elseif / pp-else)
    console.groupCollapsed("🔀 Conditionals (pp-if chains)");
    const condEls = Array.from(
      document.querySelectorAll("[pp-if], [pp-elseif], [pp-else]")
    );
    condEls.forEach((el, idx) => {
      const type = el.hasAttribute("pp-if")
        ? "if"
        : el.hasAttribute("pp-elseif")
        ? "elseif"
        : "else";
      const rawExpr = el.getAttribute(`pp-${type}`) ?? null;
      let result = null;
      if (rawExpr) {
        const expr = rawExpr.replace(/^{\s*|\s*}$/g, "");
        const hierarchy = this.detectElementHierarchy(el);
        try {
          const fn = this.makeScopedEvaluator(expr, hierarchy);
          result = !!fn(this._createScopedPropsContext(hierarchy));
        } catch {
          result = null;
        }
      }
      console.log(`#${idx}`, {
        element: el.tagName + (el.id ? `#${el.id}` : ""),
        type,
        expr: rawExpr,
        visible: !el.hasAttribute("hidden"),
        result,
      });
    });
    console.groupEnd();
    /* 8. Loops (pp-for) ────────────────────────────────────────────── */
    console.groupCollapsed("🔁 Loops (pp-for)");
    const loopTpls = Array.from(document.querySelectorAll("template[pp-for]"));
    if (loopTpls.length === 0) {
      console.log("(none)");
    } else {
      const loopRows = loopTpls.map((tpl, idx) => {
        // Re-use the built-in helper to break down the directive
        const { itemName, idxName, arrExpr } = this.parseForExpression(tpl);
        // Count how many sibling nodes the loop has already rendered.
        // We look forward from the comment marker (<!-- pp-for -->) until the
        // next element that *is not* part of this loop instance.
        let rendered = 0;
        const marker = tpl.previousSibling;
        if (
          marker?.nodeType === Node.COMMENT_NODE &&
          marker.data === "pp-for"
        ) {
          let n = marker.nextSibling;
          while (
            n &&
            !(n instanceof HTMLTemplateElement && n.hasAttribute("pp-for"))
          ) {
            rendered += 1;
            n = n.nextSibling;
          }
        }
        return {
          "#": idx,
          "(expr)": arrExpr,
          item: itemName || "(default)",
          idx: idxName || "(—)",
          rendered,
        };
      });
      console.table(loopRows);
    }
    console.groupEnd(); // end “Loops”
    console.groupEnd();
  }
  scheduleInitialHydration() {
    /** micro-yield helper — lets the event-loop breathe */
    const tick = () => new Promise((r) => setTimeout(r, 0));
    const hydrate = async () => {
      try {
        /* ── 1.  DOM-only scans can run together ─────────────────────── */
        await Promise.all([
          this.initRefs(), // < 1–2 ms on most pages
          this.bootstrapDeclarativeState(), // < 1 ms
          this.processInlineModuleScripts(), // heavy but CPU-bound
        ]);
        await tick(); // paint / events
        /* ── 2.  the remaining steps depend on the previous results ──── */
        await this.initializeAllReferencedProps();
        await tick();
        await this.manageAttributeBindings();
        await tick();
        await this.processIfChains();
        await tick();
        await this.initLoopBindings();
        await tick();
        await this.attachWireFunctionEvents();
        /* ── 3.  flush bindings in small batches (keeps UI responsive) ─ */
        const CHUNK = 250; // update 250 nodes, yield, repeat
        for (let i = 0; i < this._bindings.length; i += CHUNK) {
          this._bindings.slice(i, i + CHUNK).forEach((b) => {
            try {
              b.update();
            } catch (err) {
              console.error("Initial binding update error:", err);
            }
          });
          await tick();
        }
        /* ── 4.  finally reveal the page ─────────────────────────────── */
        document.body.removeAttribute("hidden");
        this._hydrated = true;
      } catch (error) {
        console.error("Hydration failed:", error);
        document.body.removeAttribute("hidden");
      }
    };
    /* ── 5.  defer until DOM is ready — but don't wait if we're late ─ */
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", hydrate, { once: true });
    } else {
      void hydrate(); // already loaded – start now
    }
  }
  async initCryptoKey() {
    // 1) grab the JWT (no need for a separate key cookie)
    const jwt = document.cookie
      .split("; ")
      .find((c) => c.startsWith("pphp_function_call_jwt="))
      ?.split("=", 2)[1];
    if (!jwt) throw new Error("Missing function-call token");
    // 2) split into header.payload.signature
    const [, payloadB64] = jwt.split(".");
    // 3) decode the payload WITHOUT verifying (we'll verify on the server)
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const { k: aesB64, exp } = JSON.parse(payloadJson);
    if (Date.now() / 1000 > exp) {
      throw new Error("Function-call token expired");
    }
    // 4) import the AES key
    const rawKey = Uint8Array.from(atob(aesB64), (c) => c.charCodeAt(0));
    PPHP._cryptoKey = await crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "AES-CBC" },
      false,
      ["encrypt", "decrypt"]
    );
  }
  async encryptCallbackName(name) {
    await this.initCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const data = new TextEncoder().encode(name);
    const ct = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      PPHP._cryptoKey,
      data
    );
    const ivB64 = btoa(String.fromCharCode(...iv));
    const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ct)));
    return `${ivB64}:${ctB64}`;
  }
  async decryptCallbackName(payload) {
    await this.initCryptoKey();
    const [ivB64, ctB64] = payload.split(":", 2);
    const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(ctB64), (c) => c.charCodeAt(0)).buffer;
    const pt = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      PPHP._cryptoKey,
      ct
    );
    return new TextDecoder().decode(pt);
  }
  qsa(root, selector) {
    return root.querySelectorAll(selector);
  }
  // TODO: Reactivity Start
  async bootstrapDeclarativeState(root = document.body) {
    this.qsa(root, "[pp-init-state]").forEach((el) => {
      let raw = el.getAttribute("pp-init-state").trim();
      if (!raw) {
        el.removeAttribute("pp-init-state");
        return;
      } // empty ⇒ skip
      let spec;
      try {
        spec = JSON5.parse(raw);
      } catch (e) {
        console.error("Bad pp-init-state JSON:", raw);
        return;
      }
      const hierarchy = this.detectElementHierarchy(el);
      const prevScope = this._currentProcessingHierarchy;
      this._currentProcessingHierarchy = hierarchy; // ➤ key step
      Object.entries(spec).forEach(([key, val]) => {
        this.state(key, val); // scoped here
      });
      this._currentProcessingHierarchy = prevScope;
      el.removeAttribute("pp-init-state"); // keep DOM clean
    });
  }
  _inferHierarchyFromEvent() {
    // 1) try the most recent event *if* the environment gives us one
    const evt = globalThis.event;
    const el = evt?.target ?? document.activeElement;
    if (!el || !el.closest) return ["app"];
    const path = [];
    let cur = el;
    while (cur && cur !== document.documentElement) {
      const id = cur.getAttribute("pp-component");
      if (id) path.unshift(id);
      cur = cur.parentElement;
    }
    return path.length ? path : ["app"];
  }
  callParent(functionNameOrFn, ...args) {
    try {
      /* figure out where we are */
      const currentHierarchy =
        this._currentExecutionScope?.split(".") ||
        this._currentProcessingHierarchy ||
        this._inferHierarchyFromEvent(); // ← NEW
      /* 1) a direct Function ref ------------------------------------- */
      if (typeof functionNameOrFn === "function") {
        const fn = functionNameOrFn;
        return fn.name
          ? this.callParentByName(fn.name, currentHierarchy, args)
          : this.executeInParentContext(fn, currentHierarchy, args);
      }
      /* 2) normalise & quick-outs ------------------------------------ */
      const str = String(functionNameOrFn).trim();
      if (!str) {
        console.warn("callParent: empty functionNameOrFn");
        return null;
      }
      /* 2a) arrow literal "() => …" ---------------------------------- */
      if (str.includes("=>")) {
        try {
          /* eslint-disable-next-line no-eval */
          const arrow = eval(str);
          if (typeof arrow === "function") return this.callParent(arrow);
        } catch {
          /* swallow */
        }
      }
      /* 2b) named call "fnName(arg1,…)" ------------------------------ */
      const callMatch = str.match(/^([A-Za-z_$]\w*)\s*\(\s*([\s\S]*)\)$/);
      if (callMatch) {
        const [, fnName, rawArgs] = callMatch;
        /* parse arg list (JSON5 first, fallback to loose split) */
        let parsedArgs;
        try {
          parsedArgs = JSON5.parse(`[${rawArgs}]`);
        } catch {
          parsedArgs = rawArgs
            .split(/\s*,\s*/)
            .filter(Boolean)
            .map((x) => {
              try {
                return JSON5.parse(x);
              } catch {
                return x;
              }
            });
        }
        /* 2b-i) walk parents / self */
        const result = this.callParentByName(
          fnName,
          currentHierarchy,
          parsedArgs
        );
        if (result !== null) return result;
        /* 2b-ii) shared setter - only if it already exists */
        if (fnName.startsWith("set")) {
          const key = fnName[3].toLowerCase() + fnName.slice(4);
          const shared = PPHP._shared.get(key);
          if (shared) {
            shared.setter(parsedArgs[0]);
            return null;
          }
          /* 2b-iii) local state setter – execute one level up */
          const anonSetter = function (...a) {
            return this[fnName](...a);
          };
          return this.executeInParentContext(
            anonSetter,
            currentHierarchy,
            parsedArgs
          );
        }
        console.warn(`❌ Parent function '${fnName}' not found`);
        return null;
      }
      /* 2c) assignment "foo = expr" ---------------------------------- */
      const assign = str.match(/^\s*([A-Za-z_$]\w*)\s*=\s*([\s\S]+)$/);
      if (assign) {
        const [, prop, rhs] = assign;
        const evaluator = new Function("ctx", `with(ctx){ return (${rhs}); }`);
        const value = evaluator(
          this._createScopedPropsContext(currentHierarchy)
        );
        /* (i) parent setter if exists */
        const setterName = "set" + prop[0].toUpperCase() + prop.slice(1);
        const ok = this.callParentByName(setterName, currentHierarchy, [value]);
        if (ok !== null) return ok;
        /* (ii) shared setter */
        const shared = PPHP._shared.get(prop);
        if (shared) {
          shared.setter(value);
          return null;
        }
        /* (iii) write directly into props */
        const parentScope = currentHierarchy.slice(0, -1).join(".");
        const fullKey = parentScope ? `${parentScope}.${prop}` : prop;
        this.setNested(this.props, fullKey, value);
        this.scheduleFlush();
        return null;
      }
      /* 2d) bare name → no-arg call ---------------------------------- */
      return this.callParentByName(str, currentHierarchy, args);
    } catch (err) {
      console.error("callParent: unexpected error", err);
      return null;
    }
  }
  callParentByName(functionName, currentHierarchy, args) {
    /* 1) walk strictly upwards */
    for (let i = currentHierarchy.length - 1; i >= 0; i--) {
      const scope = currentHierarchy.slice(0, i).join(".");
      const fns = this._inlineModuleFns.get(scope);
      if (fns?.has(functionName)) {
        return fns.get(functionName)(...args);
      }
    }
    /* 2) current scope (may be where the state lives) */
    const selfScope = currentHierarchy.join(".");
    const selfFns = this._inlineModuleFns.get(selfScope);
    if (selfFns?.has(functionName)) {
      return selfFns.get(functionName)(...args);
    }
    /* 3) last-chance: any other registered component */
    for (const [, fnMap] of this._inlineModuleFns) {
      if (fnMap.has(functionName)) {
        return fnMap.get(functionName)(...args);
      }
    }
    return null;
  }
  executeInParentContext(fn, currentHierarchy, args) {
    // Start from the immediate parent, not the current scope
    for (let i = currentHierarchy.length - 1; i >= 0; i--) {
      const parentHierarchy = currentHierarchy.slice(0, i);
      try {
        // Create parent context with all parent scope functions and state
        const parentContext = this.createParentScopeContext(parentHierarchy);
        // Execute the anonymous function with parent context
        const result = this.executeWithContext(fn, parentContext, args);
        return result;
      } catch (error) {
        console.error(
          `Error executing anonymous function in parent context (${parentHierarchy.join(
            "."
          )}):`,
          error
        );
        // Continue to next parent level instead of returning null
        continue;
      }
    }
    console.warn("No parent scope found for anonymous function execution");
    return null;
  }
  createParentScopeContext(hierarchy, additionalContext = {}) {
    const scopedKey = hierarchy.join(".");
    const componentProps = this.getNested(this.props, scopedKey) || {};
    const self = this;
    return new Proxy(additionalContext, {
      /* ─────────────── get ─────────────── */
      get(target, prop, receiver) {
        /* 0. AUTO-UNWRAP primitive state — works for counter, total, etc. */
        if (typeof prop === "string") {
          const v = Reflect.get(target, prop, receiver);
          if (typeof v === "function" && v.__isReactiveProxy) {
            try {
              return v();
            } catch {
              // unwrap primitive
              /* fall through if the call throws */
            }
          }
        }
        /* 1. additional loop / inline variables */
        if (prop in target) return Reflect.get(target, prop, receiver);
        /* 2. scoped inline-module functions (current component) */
        const scopedFn = self.getScopedFunction(prop, hierarchy);
        if (scopedFn) return scopedFn;
        /* 3. current component’s state / props */
        if (componentProps && prop in componentProps) {
          return componentProps[prop];
        }
        /* 4. implicit setter helpers  (setFoo → writes Foo upwards) */
        if (typeof prop === "string" && prop.startsWith("set")) {
          const stateVar = prop.charAt(3).toLowerCase() + prop.slice(4);
          for (const [stateKey, info] of self._stateHierarchy.entries()) {
            if (info.originalKey === stateVar) {
              return (val) => {
                self.setNested(self.props, stateKey, val);
                self._dirtyDeps.add(stateKey);
                self.scheduleFlush();
              };
            }
          }
        }
        /* 5. walk parent component hierarchy (closest first) */
        for (let i = hierarchy.length - 1; i >= 0; i--) {
          const parentScope = hierarchy.slice(0, i).join(".");
          /* 5a. parent inline-module fns */
          const parentFns = self._inlineModuleFns.get(parentScope);
          if (parentFns?.has(prop)) return parentFns.get(prop);
          /* 5b. parent state / props */
          const parentProps = parentScope
            ? self.getNested(self.props, parentScope)
            : self.props;
          if (parentProps && prop in parentProps) return parentProps[prop];
        }
        /* 6. finally: globalThis */
        if (prop in globalThis) return globalThis[prop];
        return undefined;
      },
      /* ─────────────── set ─────────────── */
      set(target, prop, value, receiver) {
        return Reflect.set(target, prop, value, receiver);
      },
      /* ─────────────── has ─────────────── */
      has(target, prop) {
        if (typeof prop !== "string") return false;
        return (
          prop in target ||
          !!self.getScopedFunction(prop, hierarchy) ||
          (componentProps && prop in componentProps) ||
          prop in globalThis ||
          hierarchy.some((_, i) => {
            const parentScope = hierarchy.slice(0, i).join(".");
            const parentProps = parentScope
              ? self.getNested(self.props, parentScope)
              : self.props;
            return parentProps && prop in parentProps;
          })
        );
      },
    });
  }
  executeWithContext(fn, context, args) {
    try {
      // For arrow functions, we need to use a different approach
      const fnString = fn.toString();
      if (fnString.includes("=>")) {
        return this.executeArrowFunctionWithContext(fn, context);
      }
      // For regular functions, try different approaches
      if (args.length > 0) {
        return fn.apply(context, args);
      } else {
        return fn.call(context);
      }
    } catch (error) {
      console.error("🚀 ~ executeWithContext ~ error:", error);
      throw error;
    }
  }
  executeArrowFunctionWithContext(fn, context) {
    // For arrow functions, we need to create a new function that has access to the context
    // This is a bit hacky but necessary for arrow function support
    const fnString = fn.toString();
    // Check if it's an arrow function
    if (fnString.includes("=>")) {
      try {
        // Extract the body of the arrow function
        const arrowMatch = fnString.match(/(?:\([^)]*\)|[^=])\s*=>\s*(.+)/);
        if (arrowMatch) {
          let body = arrowMatch[1].trim();
          // If the body is wrapped in braces, remove them
          if (body.startsWith("{") && body.endsWith("}")) {
            body = body.slice(1, -1);
          }
          // Create a new function that executes in the context
          const contextualFn = new Function(
            "context",
            `with (context) { return (${body}); }`
          );
          return contextualFn(context);
        }
      } catch (error) {
        console.error("Failed to execute arrow function with context:", error);
      }
    }
    // Fallback: try to execute normally
    return fn();
  }
  detectComponentHierarchy(script) {
    const hierarchy = [];
    let current = script;
    // Walk up the DOM tree including body as potential component
    while (current && current !== document.documentElement) {
      const componentId = current.getAttribute("pp-component");
      if (componentId) {
        hierarchy.unshift(componentId); // Add to beginning for correct order
      }
      current = current.parentElement;
    }
    // If no components found, something is wrong with setup
    if (hierarchy.length === 0) {
      console.warn(
        'PPHP: No component hierarchy found - ensure <body data-component="app"> exists'
      );
      return ["app"]; // Fallback to app
    }
    return hierarchy;
  }
  // Detect which component hierarchy an element belongs to
  detectElementHierarchy(element) {
    const hierarchy = [];
    let current = element;
    while (current && current !== document.documentElement) {
      const componentId = current.getAttribute("pp-component");
      if (componentId) {
        hierarchy.unshift(componentId);
      }
      current = current.parentElement;
    }
    return hierarchy.length > 0 ? hierarchy : ["app"];
  }
  // Generate scoped key with full hierarchy
  generateScopedKey(hierarchy, key) {
    return hierarchy.join(".") + "." + key;
  }
  ref(key, index) {
    /* 1️⃣  get all elements registered under this key ---------------- */
    const els = this._refs.get(key) ?? [];
    /* 2️⃣  index handling ------------------------------------------- */
    if (index != null) {
      const el = els[index];
      if (!el) {
        throw new Error(
          `pphp.ref('${key}', ${index}) — no element at that index`
        );
      }
      return el;
    }
    /* 3️⃣  ensure at least one element exists ----------------------- */
    if (els.length === 0) {
      throw new Error(`pphp.ref('${key}') failed — no element was found`);
    }
    /* 4️⃣  return single element or the whole array ----------------- */
    return els.length === 1 ? els[0] : els;
  }
  effect(fn, deps) {
    /* 0. basic flags -------------------------------------------------- */
    const hasExplicit = Array.isArray(deps);
    const rawDeps = hasExplicit ? deps : [];
    const isStatic = hasExplicit && rawDeps.length === 0;
    /* 1. Enhanced dependency resolution for shared state -------------- */
    const hierarchy = this._currentProcessingHierarchy || ["app"];
    const depKeys = rawDeps
      .map((d) => {
        if (typeof d === "function") {
          const key = d.__pphp_key;
          if (key) return key;
          try {
            const funcStr = d.toString();
            const propMatch = funcStr.match(
              /([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)/
            );
            if (propMatch) {
              const propPath = propMatch[1];
              return this.resolveDependencyPath(propPath, hierarchy);
            }
          } catch (e) {
            // Function inspection failed
          }
          return null;
        }
        if (typeof d === "string") {
          return this.resolveDependencyPath(d, hierarchy);
        }
        return null;
      })
      .filter((key) => Boolean(key));
    const functionDeps = rawDeps.filter(
      (d) => typeof d === "function" && !d.__pphp_key
    );
    const depSet = new Set(depKeys);
    /* 2. snapshot current values for change detection ----------------- */
    const lastValues = new Map();
    for (const k of depKeys) {
      try {
        lastValues.set(k, this.getResolvedValue(k));
      } catch (e) {
        lastValues.set(k, undefined);
      }
    }
    const lastFunctionResults = new Map();
    for (const f of functionDeps) {
      try {
        const result = f();
        lastFunctionResults.set(f, result);
      } catch (e) {
        lastFunctionResults.set(f, Symbol("error"));
      }
    }
    /* 3. cleanup + loop guard bookkeeping ----------------------------- */
    const MAX_RUNS = 100;
    let runCount = 0;
    let lastRunTime = 0;
    const MIN_INTERVAL = 16;
    if (!PPHP._effectCleanups) PPHP._effectCleanups = new WeakMap();
    const cleanups = PPHP._effectCleanups;
    const guarded = () => {
      const dispose = cleanups.get(guarded);
      if (dispose) {
        try {
          dispose();
        } catch (e) {
          console.error("cleanup error:", e);
        }
        cleanups.delete(guarded);
      }
      const now = performance.now();
      if (now - lastRunTime < MIN_INTERVAL) {
        requestAnimationFrame(() => {
          if (performance.now() - lastRunTime >= MIN_INTERVAL) {
            guarded();
          }
        });
        return;
      }
      lastRunTime = now;
      if (++runCount > MAX_RUNS) {
        console.error(
          `PPHP: effect exceeded ${MAX_RUNS} runs - possible infinite loop`
        );
        console.error("Effect function:", fn.toString());
        console.error("Dependencies:", Array.from(depSet));
        throw new Error(`PPHP: effect ran >${MAX_RUNS} times — possible loop`);
      }
      if (!isStatic) {
        let changed = false;
        const changedDeps = [];
        // ✅ Enhanced dependency checking for shared state
        if (depKeys.length > 0) {
          for (const k of depKeys) {
            try {
              const curr = this.getResolvedValue(k);
              const last = lastValues.get(k);
              if (this.hasValueChanged(curr, last)) {
                changed = true;
                changedDeps.push(k);
                lastValues.set(k, curr);
              }
            } catch (e) {
              changed = true;
              changedDeps.push(k);
              lastValues.set(k, undefined);
            }
          }
        }
        for (const f of functionDeps) {
          try {
            const curr = f();
            const last = lastFunctionResults.get(f);
            if (this.hasValueChanged(curr, last)) {
              changed = true;
              changedDeps.push("(function)");
              lastFunctionResults.set(f, curr);
            }
          } catch (e) {
            const last = lastFunctionResults.get(f);
            if (last !== Symbol("error")) {
              changed = true;
              changedDeps.push("(function-error)");
              lastFunctionResults.set(f, Symbol("error"));
            }
          }
        }
        if (
          hasExplicit &&
          (depKeys.length > 0 || functionDeps.length > 0) &&
          !changed
        ) {
          return;
        }
      }
      try {
        const maybeCleanup = fn();
        if (typeof maybeCleanup === "function") {
          cleanups.set(guarded, maybeCleanup);
        }
        runCount = 0;
      } catch (err) {
        console.error("effect error:", err);
        console.error("Effect function:", fn.toString());
      }
    };
    Object.assign(guarded, {
      __deps: depSet,
      __static: isStatic,
      __functionDeps: functionDeps,
      __hierarchy: hierarchy,
      __isEffect: true,
    });
    try {
      const maybeCleanup = fn();
      if (typeof maybeCleanup === "function") {
        cleanups.set(guarded, maybeCleanup);
      }
      runCount = 0;
    } catch (err) {
      console.error("effect error (initial):", err);
    }
    const bucket = !hasExplicit
      ? this._effects
      : this._inlineDepth > 0
      ? this._pendingEffects
      : this._effects;
    if (!isStatic) bucket.add(guarded);
    else this._effects.add(guarded);
    return () => {
      const dispose = cleanups.get(guarded);
      if (dispose) {
        try {
          dispose();
        } catch (e) {
          console.error("cleanup error:", e);
        }
        cleanups.delete(guarded);
      }
      this._effects.delete(guarded);
      this._pendingEffects.delete(guarded);
    };
  }
  resolveDependencyPath(path, hierarchy) {
    // Handle shared state dependencies
    const cleanPath = path.startsWith("app.") ? path.substring(4) : path;
    const rootKey = cleanPath.split(".")[0];
    if (PPHP._shared.has(rootKey)) {
      return cleanPath; // Return clean path for shared state
    }
    // Check current scope
    const scopedPath = hierarchy.join(".") + "." + path;
    if (this.hasNested(this.props, scopedPath)) {
      return scopedPath;
    }
    // Check if path exists as-is
    if (this.hasNested(this.props, path)) {
      return path;
    }
    // Check parent scopes
    for (let i = hierarchy.length - 1; i >= 0; i--) {
      const parentScope = hierarchy.slice(0, i).join(".");
      const parentPath = parentScope ? parentScope + "." + path : path;
      if (this.hasNested(this.props, parentPath)) {
        return parentPath;
      }
    }
    return path; // Fallback to original path
  }
  getResolvedValue(path) {
    // Check shared state first
    const pathParts = path.split(".");
    const rootKey = pathParts[0];
    // Handle app.voucherData.cash1110 -> voucherData.cash1110
    const cleanPath = path.startsWith("app.") ? path.substring(4) : path;
    const cleanParts = cleanPath.split(".");
    const cleanRootKey = cleanParts[0];
    const shared = PPHP._shared.get(cleanRootKey);
    if (shared) {
      if (cleanParts.length === 1) {
        // Return the entire shared object
        return shared.getter();
      } else {
        // Get nested property from shared state
        const obj = shared.getter();
        const nestedPath = cleanParts.slice(1).join(".");
        return this.getNested(obj, nestedPath);
      }
    }
    // Fallback to regular props
    return this.getNested(this.props, path);
  }
  hasValueChanged(current, previous) {
    if (current === previous) return false;
    if (current == null || previous == null) {
      return current !== previous;
    }
    if (typeof current !== "object" || typeof previous !== "object") {
      return current !== previous;
    }
    try {
      return JSON.stringify(current) !== JSON.stringify(previous);
    } catch (e) {
      return true;
    }
  }
  resetProps() {
    // ─── 0) abort & nav flags ──────────────────────────────────────────
    this._isNavigating = false;
    if (this._activeAbortController) {
      this._activeAbortController.abort();
    }
    this._activeAbortController = null;
    this._responseData = null;
    // ─── 1) clear window globals & raw props ─────────────────────────
    Object.keys(this._rawProps).forEach((key) => {
      if (window.hasOwnProperty(key)) {
        const desc = Object.getOwnPropertyDescriptor(window, key);
        if (desc?.configurable) {
          delete window[key];
        }
      }
    });
    this._rawProps = {};
    this.clearShare();
    // ─── 2) clear all of your WeakMaps & caches ───────────────────────
    this._proxyCache = new WeakMap();
    this._templateStore = new WeakMap();
    this._arrayMethodCache = new WeakMap();
    this._handlerProxyCache = new WeakMap();
    this._processedLoops = new WeakSet();
    this._depsCache.clear();
    this._evaluatorCache.clear();
    this._handlerCache.clear();
    this._sharedStateMap.clear();
    // ─── 3) clear PHP sections & scripts ─────────────────────────────
    this._processedPhpScripts = new WeakSet();
    this._declaredStateRoots.clear();
    // ─── 4) clear inline‐module bookkeeping ───────────────────────────
    this._inlineModuleFns.clear();
    this._inlineDepth = 0;
    // ✅ ADD THESE MISSING RESETS:
    this._currentProcessingHierarchy = null;
    this._currentTemplateHierarchy = null;
    this._currentExecutionScope = null;
    this._stateHierarchy.clear(); // ← This is important!
    // ─── 5) clear binding & effect queues ─────────────────────────────
    this._bindings = [];
    this._pendingBindings.clear();
    this._effects.clear();
    this._pendingEffects.clear();
    // reset any stored effect cleanup hooks
    PPHP._effectCleanups = new WeakMap();
    // ─── 6) clear refs ────────────────────────────────────────────────
    this._refs.clear();
    // ─── 7) clear timers & scheduled flags ───────────────────────────
    PPHP._debounceTimers.forEach((t) => clearTimeout(t));
    PPHP._debounceTimers.clear();
    this._updateScheduled = false;
    this._wheelHandlersStashed = false;
    // ─── 8) Force garbage collection of any lingering references ──────
    // *** NEW: Try to clean up any global variables that might interfere ***
    try {
      // Clear any global variables that might have been created by previous modules
      const globalThis = window;
      Object.getOwnPropertyNames(globalThis).forEach((prop) => {
        if (prop.startsWith("__pphp_") || prop.startsWith("_temp_")) {
          try {
            delete globalThis[prop];
          } catch (e) {
            // Ignore errors for non-configurable properties
          }
        }
      });
    } catch (e) {
      // Ignore cleanup errors
    }
    // ─── 9) rebuild your reactive root ────────────────────────────────
    this.props = this.makeReactive(this._rawProps);
    this._hydrated = false;
  }
  async initReactiveOn(root = document.body) {
    const tick = () => new Promise((r) => setTimeout(r, 0));
    await Promise.all([
      this.initRefs(root),
      this.bootstrapDeclarativeState(),
      this.processInlineModuleScripts(root),
      (this._hydrated = true),
    ]);
    await tick(); // allow paint / input events
    /* ── 2. initialize bindings step by step ─────────────────────── */
    await this.initializeAllReferencedProps(root);
    await tick();
    await this.processIfChains(root);
    await tick();
    await this.manageAttributeBindings(root);
    await tick();
    await this.initLoopBindings(root);
    await tick();
    const CHUNK = 250;
    for (let i = 0; i < this._bindings.length; i += CHUNK) {
      this._bindings.slice(i, i + CHUNK).forEach((b) => b.update());
      await tick();
    }
    if (root === document.body) {
      document.body.removeAttribute("hidden");
    }
  }
  async initLoopBindings(root = document.body) {
    this.qsa(root, "template[pp-for]").forEach((tpl) => {
      if (!this._processedLoops.has(tpl)) {
        this._processedLoops.add(tpl);
        this.registerLoop(tpl);
      }
    });
  }
  registerLoop(tpl) {
    const loopConfig = this.parseForExpression(tpl);
    const { marker, parent, templateHierarchy } = this.setupLoopMarker(tpl);
    const loopState = this.initializeLoopState();
    const updater = this.createLoopUpdater(
      tpl,
      loopConfig,
      marker,
      parent,
      templateHierarchy,
      loopState
    );
    const allDeps = this.extractComprehensiveLoopDependencies(
      tpl,
      loopConfig,
      templateHierarchy
    );
    const loopBinding = {
      dependencies: allDeps,
      update: updater,
      __isLoop: true,
    };
    this._bindings.push(loopBinding);
  }
  processIfChainsInFragment(
    frag,
    loopConfig,
    templateHierarchy,
    item,
    index,
    itemBindings
  ) {
    const processed = new WeakSet();
    // Find all pp-if elements in the fragment
    frag.querySelectorAll("[pp-if]").forEach((ifEl) => {
      if (processed.has(ifEl)) return;
      // Build the conditional chain
      const chain = [];
      let cur = ifEl;
      while (cur) {
        if (cur.hasAttribute("pp-if")) {
          chain.push({ el: cur, expr: cur.getAttribute("pp-if") });
        } else if (cur.hasAttribute("pp-elseif")) {
          chain.push({ el: cur, expr: cur.getAttribute("pp-elseif") });
        } else if (cur.hasAttribute("pp-else")) {
          chain.push({ el: cur, expr: null });
        } else {
          break;
        }
        processed.add(cur);
        cur = cur.nextElementSibling;
      }
      // Compile expressions with loop context
      chain.forEach((chainItem) => {
        if (chainItem.expr !== null) {
          const raw = chainItem.expr.replace(/^{\s*|\s*}$/g, "");
          chainItem.deps = this.extractScopedDependencies(
            raw,
            templateHierarchy
          );
          const fn = this.makeScopedEvaluator(raw, templateHierarchy);
          chainItem.evaluate = () => {
            // Create loop context for evaluation
            const scopedProps =
              this._createScopedPropsContext(templateHierarchy);
            const loopContext = {
              ...scopedProps,
              [loopConfig.itemName]: item,
            };
            if (loopConfig.idxName) loopContext[loopConfig.idxName] = index;
            return !!fn(loopContext);
          };
        }
      });
      // Initial evaluation and setup
      let shown = false;
      for (const { el, expr, evaluate } of chain) {
        if (!shown && expr !== null && evaluate()) {
          el.removeAttribute("hidden");
          shown = true;
        } else if (!shown && expr === null) {
          el.removeAttribute("hidden");
          shown = true;
        } else {
          el.setAttribute("hidden", "");
        }
      }
      // Create updater for this chain that will be called when dependencies change
      const allDeps = new Set();
      chain.forEach((chainItem) =>
        chainItem.deps?.forEach((dep) => allDeps.add(dep))
      );
      // Add dependency on the entire array to ensure updates when loop changes
      const scopedPrefix = templateHierarchy.join(".");
      const fullArrayPath = scopedPrefix
        ? `${scopedPrefix}.${loopConfig.arrExpr}`
        : loopConfig.arrExpr;
      allDeps.add(fullArrayPath);
      const updater = () => {
        // Get current item from the array using the item key
        const evalArr = this.makeScopedEvaluator(
          loopConfig.arrExpr,
          templateHierarchy
        );
        const currentArr = evalArr(
          this._createScopedPropsContext(templateHierarchy)
        );
        if (Array.isArray(currentArr)) {
          // Find current item and index
          const itemKey = this.getItemKey(item, index);
          const currentItem = this.findItemByKey(currentArr, itemKey, item);
          const currentIndex = currentArr.findIndex(
            (arrayItem) =>
              this.getItemKey(arrayItem, currentArr.indexOf(arrayItem)) ===
              itemKey
          );
          if (currentItem && currentIndex !== -1) {
            // Re-evaluate all conditions in the chain with current data
            let shown = false;
            for (const { el, expr, evaluate } of chain) {
              if (expr !== null) {
                // Update the evaluate function with current item data
                const fn = this.makeScopedEvaluator(
                  expr.replace(/^{\s*|\s*}$/g, ""),
                  templateHierarchy
                );
                const scopedProps =
                  this._createScopedPropsContext(templateHierarchy);
                const loopContext = {
                  ...scopedProps,
                  [loopConfig.itemName]: currentItem,
                };
                if (loopConfig.idxName)
                  loopContext[loopConfig.idxName] = currentIndex;
                const result = !!fn(loopContext);
                if (!shown && result) {
                  el.removeAttribute("hidden");
                  shown = true;
                } else {
                  el.setAttribute("hidden", "");
                }
              } else if (!shown) {
                // pp-else case
                el.removeAttribute("hidden");
                shown = true;
              } else {
                el.setAttribute("hidden", "");
              }
            }
          }
        }
      };
      // Add this updater to the item bindings
      itemBindings.push({
        dependencies: allDeps,
        update: updater,
        __isLoop: true,
      });
    });
  }
  extractComprehensiveLoopDependencies(tpl, loopConfig, templateHierarchy) {
    const deps = new Set();
    // ✅ CRITICAL FIX: Find the actual array path by walking up the hierarchy
    let actualArrayPath = null;
    // Try different hierarchy levels to find where the array actually exists
    for (let i = templateHierarchy.length; i >= 0; i--) {
      const testHierarchy = templateHierarchy.slice(0, i);
      const testPath =
        testHierarchy.length > 0
          ? `${testHierarchy.join(".")}.${loopConfig.arrExpr}`
          : loopConfig.arrExpr;
      // Check if array exists at this path
      try {
        const value = this.getNested(this.props, testPath);
        if (Array.isArray(value)) {
          actualArrayPath = testPath;
          break;
        }
      } catch {
        // Continue searching
      }
    }
    // If not found in hierarchy, try direct path
    if (!actualArrayPath) {
      try {
        const value = this.getNested(this.props, loopConfig.arrExpr);
        if (Array.isArray(value)) {
          actualArrayPath = loopConfig.arrExpr;
        }
      } catch {
        // Fallback to originally calculated path
        actualArrayPath =
          templateHierarchy.length > 0
            ? `${templateHierarchy.join(".")}.${loopConfig.arrExpr}`
            : loopConfig.arrExpr;
      }
    }
    const fullArrayPath = actualArrayPath;
    // Always depend on the entire array
    if (fullArrayPath !== null) {
      deps.add(fullArrayPath);
    }
    // *** Add pattern-based dependencies for array items ***
    const itemProperties = this.extractItemPropertiesFromTemplate(
      tpl,
      loopConfig
    );
    for (const prop of itemProperties) {
      // Add both wildcard and specific index patterns
      deps.add(`${fullArrayPath}.*`); // Any array change
      deps.add(`${fullArrayPath}.*.${prop}`); // Any item property change
      // Also add indexed patterns for existing items
      if (typeof fullArrayPath === "string") {
        const currentArray = this.getNested(this.props, fullArrayPath);
        if (Array.isArray(currentArray)) {
          for (let i = 0; i < currentArray.length; i++) {
            deps.add(`${fullArrayPath}.${i}.${prop}`);
          }
        }
      }
    }
    // ✅ ENSURE: Always add wildcard pattern for arrays
    if (!Array.from(deps).some((dep) => dep.includes("*"))) {
      deps.add(`${fullArrayPath}.*`);
    }
    return deps;
  }
  extractItemPropertiesFromTemplate(tpl, loopConfig) {
    const properties = new Set();
    const itemRegex = new RegExp(
      `\\b${loopConfig.itemName}\\.(\\w+(?:\\.\\w+)*)`,
      "g"
    );
    // Get all text content
    const walker = document.createTreeWalker(
      tpl.content,
      NodeFilter.SHOW_ALL,
      null
    );
    while (walker.nextNode()) {
      const node = walker.currentNode;
      let textToCheck = "";
      if (node.nodeType === Node.TEXT_NODE) {
        textToCheck = node.nodeValue || "";
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        // Check all attributes
        for (const attr of Array.from(element.attributes)) {
          textToCheck += " " + attr.value;
        }
      }
      // Extract item properties
      const matches = textToCheck.matchAll(itemRegex);
      for (const match of matches) {
        properties.add(match[1]);
      }
    }
    return properties;
  }
  parseForExpression(tpl) {
    const forExpr = tpl.getAttribute("pp-for").trim();
    const [vars, arrExpr] = forExpr.split(/\s+in\s+/);
    const [itemName, idxName] = vars
      .replace(/^\(|\)$/g, "")
      .split(",")
      .map((v) => v.trim());
    return { forExpr, vars, arrExpr, itemName, idxName };
  }
  setupLoopMarker(tpl) {
    const parent = tpl.parentNode;
    const marker = document.createComment("pp-for");
    const templateHierarchy = this.detectElementHierarchy(tpl);
    parent.insertBefore(marker, tpl);
    parent.removeChild(tpl);
    return { marker, parent, templateHierarchy };
  }
  initializeLoopState() {
    return {
      previousList: [],
      renderedItems: new Map(),
    };
  }
  createItemNodes(tpl, item, index, loopConfig, templateHierarchy) {
    /* ── 1. preparar el contexto local del bucle ────────────────────── */
    this._currentTemplateHierarchy = templateHierarchy;
    const scopedProps = this._createScopedPropsContext(templateHierarchy);
    const loopContext = {
      ...scopedProps,
      [loopConfig.itemName]: item,
    };
    if (loopConfig.idxName) loopContext[loopConfig.idxName] = index;
    /* ── 2. clonar el contenido del <template> ──────────────────────── */
    const frag = tpl.content.cloneNode(true);
    const itemBindings = [];
    /* ── 3. generar una clave estable para diffing ──────────────────── */
    const itemKey = this.getItemKey(item, index);
    /* ── 4. procesar textos, atributos y eventos ────────────────────── */
    this.processTextNodesInFragment(
      frag,
      loopConfig,
      templateHierarchy,
      itemKey,
      item,
      index,
      itemBindings
    );
    this.processElementBindingsInFragment(
      frag,
      loopConfig,
      templateHierarchy,
      itemKey,
      item,
      index,
      itemBindings
    );
    this.processEventHandlersInFragment(
      frag,
      loopConfig,
      templateHierarchy,
      item,
      index
    );
    /* ── 5. NEW: process pp-if chains within the fragment ──────────── */
    this.processIfChainsInFragment(
      frag,
      loopConfig,
      templateHierarchy,
      item,
      index,
      itemBindings
    );
    /* ── 6. registrar los bindings como pertenecientes al bucle ─────── */
    itemBindings.forEach((binding) => {
      binding.__isLoop = true;
      this._bindings.push(binding);
    });
    this._currentTemplateHierarchy = null;
    /* ── 7. devolver nodos y bindings creados ───────────────────────── */
    return { nodes: Array.from(frag.childNodes), bindings: itemBindings };
  }
  processTextNodesInFragment(
    frag,
    loopConfig,
    templateHierarchy,
    itemKey, // clave estable (id_…, idx_…)
    item,
    index, // ← índice real del ítem
    itemBindings
  ) {
    const walker = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const t = walker.currentNode;
      const originalText = t.nodeValue || "";
      if (PPHP._mustacheTest.test(originalText)) {
        /* ── dependencias: todo el array ─────────────────────────────── */
        const deps = new Set();
        const scopedPrefix = templateHierarchy.join(".");
        const fullArrayPath = scopedPrefix
          ? `${scopedPrefix}.${loopConfig.arrExpr}`
          : loopConfig.arrExpr;
        deps.add(fullArrayPath);
        for (const m of originalText.matchAll(PPHP._mustachePattern)) {
          this.extractScopedDependencies(m[1], templateHierarchy).forEach((d) =>
            deps.add(d)
          );
        }
        /* ── updater que re-evalúa cuando cambie el array ────────────── */
        const updater = this.createTextNodeUpdaterWithItemKey(
          t,
          originalText,
          loopConfig,
          templateHierarchy,
          itemKey,
          item
        );
        itemBindings.push({ dependencies: deps, update: updater });
        /* ── primer pintado con el índice correcto ───────────────────── */
        this.renderTextNode(
          t,
          originalText,
          loopConfig,
          templateHierarchy,
          item,
          index // ← ahora sí, 0 → 1 → 2…
        );
      }
    }
  }
  createTextNodeUpdaterWithItemKey(
    textNode,
    originalText,
    loopConfig,
    templateHierarchy,
    itemKey,
    originalItem
  ) {
    const evalArr = this.makeScopedEvaluator(
      loopConfig.arrExpr,
      templateHierarchy
    );
    return () => {
      const currentArr = evalArr(
        this._createScopedPropsContext(templateHierarchy)
      );
      if (Array.isArray(currentArr)) {
        // *** CRITICAL FIX: Find item by key instead of using fixed index ***
        const currentItem = this.findItemByKey(
          currentArr,
          itemKey,
          originalItem
        );
        const currentIndex = currentArr.findIndex(
          (item) => this.getItemKey(item, currentArr.indexOf(item)) === itemKey
        );
        if (currentItem && currentIndex !== -1) {
          const currentLoopContext = {
            ...this._createScopedPropsContext(templateHierarchy),
            [loopConfig.itemName]: currentItem,
          };
          if (loopConfig.idxName)
            currentLoopContext[loopConfig.idxName] = currentIndex;
          const newText = this.renderMustacheText(
            originalText,
            templateHierarchy,
            currentLoopContext
          );
          if (textNode.nodeValue !== newText) {
            textNode.nodeValue = newText;
          }
        }
      }
    };
  }
  findItemByKey(array, itemKey, fallbackItem) {
    // First try to find by the same key logic
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (this.getItemKey(item, i) === itemKey) {
        return item;
      }
    }
    // If key-based lookup fails, try to find by item properties
    if (fallbackItem && typeof fallbackItem === "object" && fallbackItem.id) {
      return array.find((item) => item && item.id === fallbackItem.id);
    }
    return null;
  }
  processElementBindingsInFragment(
    frag,
    loopConfig,
    templateHierarchy,
    itemKey, // clave estable del ítem
    item,
    index, // ← índice real dentro del array
    itemBindings
  ) {
    frag.querySelectorAll("*").forEach((el) => {
      this.processElementBindings(
        el,
        loopConfig,
        templateHierarchy,
        itemKey, // mantiene la referencia por clave
        item,
        index, // ← ahora propagamos el índice correcto
        itemBindings
      );
    });
  }
  processElementBindings(
    el,
    loopConfig,
    templateHierarchy,
    itemKey,
    item,
    index,
    itemBindings
  ) {
    // ✅ NEW: Track which attributes have templates vs bindings
    const templateAttributes = new Set();
    const bindingAttributes = new Set();
    // ✅ First pass: identify template attributes
    for (const { name, value } of Array.from(el.attributes)) {
      if (PPHP._mustacheTest.test(value) && !name.startsWith("pp-bind")) {
        templateAttributes.add(name);
      } else if (name.startsWith("pp-bind-")) {
        const attr = name.replace(/^pp-bind-/, "");
        bindingAttributes.add(attr);
      }
    }
    // ✅ Second pass: process attributes with priority rules
    for (const { name, value } of Array.from(el.attributes)) {
      if (name === "pp-bind") {
        this.createElementBindingWithItemKey(
          el,
          value,
          "text",
          loopConfig,
          templateHierarchy,
          itemKey,
          item,
          index,
          itemBindings
        );
      } else if (name === "pp-bind-expr") {
        const decoded = this.decodeEntities(value);
        this.createElementBindingWithItemKey(
          el,
          decoded,
          "text",
          loopConfig,
          templateHierarchy,
          itemKey,
          item,
          index,
          itemBindings
        );
      } else if (name.startsWith("pp-bind-")) {
        const attr = name.replace(/^pp-bind-/, "");
        // ✅ CRITICAL: Skip pp-bind if there's already a template for this attribute
        if (templateAttributes.has(attr)) {
          if (this._boolAttrs.has(attr)) {
            el.removeAttribute(attr);
          } else {
            continue;
          }
        }
        this.createElementBindingWithItemKey(
          el,
          value,
          attr,
          loopConfig,
          templateHierarchy,
          itemKey,
          item,
          index,
          itemBindings
        );
      }
      // ✅ Process template attributes (mustache in regular attributes)
      else if (PPHP._mustacheTest.test(value)) {
        this.createElementAttributeTemplateBindingWithItemKey(
          el,
          name,
          value,
          loopConfig,
          templateHierarchy,
          itemKey,
          item,
          index,
          itemBindings
        );
      }
    }
  }
  createElementAttributeTemplateBindingWithItemKey(
    el,
    attributeName,
    template,
    loopConfig,
    templateHierarchy,
    itemKey,
    item,
    index,
    itemBindings
  ) {
    const deps = new Set();
    const scopedPrefix = templateHierarchy.join(".");
    const fullArrayPath = scopedPrefix
      ? `${scopedPrefix}.${loopConfig.arrExpr}`
      : loopConfig.arrExpr;
    deps.add(fullArrayPath);
    for (const m of template.matchAll(PPHP._mustachePattern)) {
      this.extractScopedDependencies(m[1], templateHierarchy).forEach((d) =>
        deps.add(d)
      );
    }
    const updater = this.createAttributeTemplateUpdaterWithItemKey(
      el,
      attributeName,
      template,
      loopConfig,
      templateHierarchy,
      itemKey,
      item
    );
    itemBindings.push({ dependencies: deps, update: updater });
    // Initial render
    this.renderAttributeTemplate(
      el,
      attributeName,
      template,
      loopConfig,
      templateHierarchy,
      item,
      index
    );
  }
  createAttributeTemplateUpdaterWithItemKey(
    el,
    attributeName,
    template,
    loopConfig,
    templateHierarchy,
    itemKey,
    originalItem
  ) {
    const evalArr = this.makeScopedEvaluator(
      loopConfig.arrExpr,
      templateHierarchy
    );
    return () => {
      const currentArr = evalArr(
        this._createScopedPropsContext(templateHierarchy)
      );
      if (Array.isArray(currentArr)) {
        const currentItem = this.findItemByKey(
          currentArr,
          itemKey,
          originalItem
        );
        const currentIndex = currentArr.findIndex(
          (item) => this.getItemKey(item, currentArr.indexOf(item)) === itemKey
        );
        if (currentItem && currentIndex !== -1) {
          this.renderAttributeTemplate(
            el,
            attributeName,
            template,
            loopConfig,
            templateHierarchy,
            currentItem,
            currentIndex
          );
        }
      }
    };
  }
  renderAttributeTemplate(
    el,
    attributeName,
    template,
    loopConfig,
    templateHierarchy,
    item,
    index
  ) {
    const scopedProps = this._createScopedPropsContext(templateHierarchy);
    const loopContext = {
      ...scopedProps,
      [loopConfig.itemName]: item,
    };
    if (loopConfig.idxName) loopContext[loopConfig.idxName] = index;
    const rendered = template.replace(PPHP._mustachePattern, (_m, expr) => {
      try {
        const evaluator = this.makeScopedEvaluator(expr, templateHierarchy);
        return this.formatValue(evaluator(loopContext));
      } catch (e) {
        console.error("PPHP: mustache token error:", expr, e);
        return "";
      }
    });
    if (el.getAttribute(attributeName) !== rendered) {
      el.setAttribute(attributeName, rendered);
    }
  }
  createElementBindingWithItemKey(
    el,
    value,
    bindingType,
    loopConfig,
    templateHierarchy,
    itemKey, // clave estable del ítem
    item,
    index, // ← índice real (0-based)
    itemBindings
  ) {
    /* ── 1. dependencias: todo el array que se itera ────────────────── */
    const deps = new Set();
    const scopedPrefix = templateHierarchy.join(".");
    const fullArrayPath = scopedPrefix
      ? `${scopedPrefix}.${loopConfig.arrExpr}`
      : loopConfig.arrExpr;
    deps.add(fullArrayPath);
    // 🆕 incluye deps de la expresión (selectedChat, isDark, etc.)
    this.extractScopedDependencies(value, templateHierarchy).forEach((d) =>
      deps.add(d)
    );
    /* ── 2. updater que localizará el ítem mediante itemKey ─────────── */
    const updater = this.createElementBindingUpdaterWithItemKey(
      el,
      value,
      bindingType,
      loopConfig,
      templateHierarchy,
      itemKey,
      item
    );
    itemBindings.push({ dependencies: deps, update: updater });
    /* ── 3. primer render con el índice correcto ────────────────────── */
    this.renderElementBinding(
      el,
      value,
      bindingType,
      loopConfig,
      templateHierarchy,
      item,
      index // ← ahora se usa el index real
    );
  }
  createElementBindingUpdaterWithItemKey(
    el,
    value,
    bindingType,
    loopConfig,
    templateHierarchy,
    itemKey,
    originalItem
  ) {
    const evalArr = this.makeScopedEvaluator(
      loopConfig.arrExpr,
      templateHierarchy
    );
    return () => {
      const currentArr = evalArr(
        this._createScopedPropsContext(templateHierarchy)
      );
      if (Array.isArray(currentArr)) {
        // *** CRITICAL FIX: Find item by key instead of using fixed index ***
        const currentItem = this.findItemByKey(
          currentArr,
          itemKey,
          originalItem
        );
        const currentIndex = currentArr.findIndex(
          (item) => this.getItemKey(item, currentArr.indexOf(item)) === itemKey
        );
        if (currentItem && currentIndex !== -1) {
          const currentLoopContext = {
            ...this._createScopedPropsContext(templateHierarchy),
            [loopConfig.itemName]: currentItem,
          };
          if (loopConfig.idxName)
            currentLoopContext[loopConfig.idxName] = currentIndex;
          this.updateElementBinding(
            el,
            value,
            bindingType,
            templateHierarchy,
            currentLoopContext
          );
        }
      }
    };
  }
  getItemKey(item, index) {
    if (item && typeof item === "object") {
      // Check the most common ID patterns
      if ("id" in item && item.id != null) {
        return `id_${item.id}`;
      }
      if ("key" in item && item.key != null) {
        return `key_${item.key}`;
      }
      if ("_id" in item && item._id != null) {
        return `_id_${item._id}`;
      }
      // Generic check for any field that looks like a unique identifier
      // This catches uuid, cuid, ulid, nanoid, etc. without being specific
      const idFields = Object.keys(item).filter(
        (key) =>
          (key.toLowerCase().includes("id") ||
            key.toLowerCase().includes("uuid")) &&
          item[key] != null &&
          (typeof item[key] === "string" || typeof item[key] === "number")
      );
      if (idFields.length > 0) {
        const field = idFields[0]; // Use the first ID-like field found
        return `${field}_${item[field]}`;
      }
    }
    return `idx_${index}`;
  }
  renderTextNode(
    textNode,
    originalText,
    loopConfig,
    templateHierarchy,
    item,
    index
  ) {
    /* 1. construir el contexto local del bucle ─────────────────────── */
    const scopedProps = this._createScopedPropsContext(templateHierarchy);
    const loopContext = {
      ...scopedProps,
      [loopConfig.itemName]: item,
    };
    if (loopConfig.idxName) loopContext[loopConfig.idxName] = index;
    /* 2. evaluar las expresiones mustache y actualizar el nodo ─────── */
    textNode.nodeValue = this.renderMustacheText(
      originalText,
      templateHierarchy,
      loopContext
    );
  }
  renderMustacheText(text, templateHierarchy, context) {
    return text.replace(PPHP._mustachePattern, (_m, expr) => {
      try {
        const evaluator = this.makeScopedEvaluator(expr, templateHierarchy);
        return this.formatValue(evaluator(context));
      } catch {
        return "";
      }
    });
  }
  updateElementBinding(el, value, bindingType, templateHierarchy, context) {
    const evaluator = this.makeScopedEvaluator(value, templateHierarchy);
    const result = evaluator(context);
    if (bindingType === "text") {
      const newContent = this.formatValue(result);
      if (el.textContent !== newContent) {
        el.textContent = newContent;
      }
    } else {
      this.applyAttributeBinding(el, bindingType, result);
    }
  }
  renderElementBinding(
    el,
    value,
    bindingType,
    loopConfig,
    templateHierarchy,
    item, // objeto actual de la iteración
    index // posición actual dentro del array
  ) {
    /* 1. construir el contexto local del bucle */
    const scopedProps = this._createScopedPropsContext(templateHierarchy);
    const loopContext = {
      ...scopedProps,
      [loopConfig.itemName]: item, // ej.  item  ->  { id, name, price, … }
    };
    if (loopConfig.idxName) {
      loopContext[loopConfig.idxName] = index; // ej. idx  -> 0,1,2…
    }
    /* 2. delegar la actualización al helper genérico */
    this.updateElementBinding(
      el,
      value,
      bindingType,
      templateHierarchy,
      loopContext
    );
  }
  applyAttributeBinding(el, attr, val) {
    if (this._boolAttrs.has(attr)) {
      const shouldHave = !!val;
      const hasAttr = el.hasAttribute(attr);
      if (shouldHave !== hasAttr) {
        shouldHave ? el.setAttribute(attr, "") : el.removeAttribute(attr);
      }
      if (attr in el && el[attr] !== shouldHave) {
        el[attr] = shouldHave;
      }
    } else {
      const strVal = String(val);
      if (attr in el && el[attr] !== strVal) {
        el[attr] = strVal;
      }
      if (el.getAttribute(attr) !== strVal) {
        el.setAttribute(attr, strVal);
      }
    }
  }
  processEventHandlersInFragment(
    frag,
    loopConfig,
    templateHierarchy,
    item,
    index
  ) {
    frag.querySelectorAll("*").forEach((el) => {
      for (const { name, value } of Array.from(el.attributes)) {
        const attrName = name.toLowerCase();
        if (!this._eventHandlers.has(attrName)) continue;
        let code = value;
        // ✅ FIX: Use a safe serialization approach
        const safeSerialize = (obj) => {
          try {
            // For complex objects, store them in a data attribute and reference them
            if (obj && typeof obj === "object" && !Array.isArray(obj)) {
              const dataKey = `__pphp_data_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 7)}`; // ✅ FIXED: Use slice instead of substr
              el[dataKey] = obj;
              return `(event.currentTarget.${dataKey} || event.target.${dataKey})`;
            } else {
              // For primitives and arrays, use JSON.stringify with proper escaping
              return JSON.stringify(obj);
            }
          } catch (e) {
            console.error("Failed to serialize item:", e);
            return "null";
          }
        };
        code = code.replace(
          new RegExp(`\\b${loopConfig.itemName}\\b`, "g"),
          safeSerialize(item)
        );
        if (loopConfig.idxName) {
          const idxExpr = `(globalThis.pphp._idxOf(${safeSerialize(item)}, '${
            loopConfig.arrExpr
          }', ${JSON.stringify(templateHierarchy)}))`;
          code = code.replace(
            new RegExp(`\\b${loopConfig.idxName}\\b`, "g"),
            idxExpr
          );
        }
        el.setAttribute(name, code);
      }
    });
  }
  _idxOf(item, arrExpr, hierarchy) {
    try {
      const evalArr = this.makeScopedEvaluator(arrExpr, hierarchy);
      const arr = evalArr(this._createScopedPropsContext(hierarchy));
      return Array.isArray(arr) ? arr.findIndex((i) => i === item) : -1;
    } catch {
      return -1;
    }
  }
  updateItemNodes(
    nodes,
    oldItem,
    newItem,
    newIndex,
    loopConfig,
    templateHierarchy
  ) {
    // Quick check if items are identical
    if (oldItem === newItem) return;
    // If items are different objects, check if they're deep equal
    if (typeof oldItem === "object" && typeof newItem === "object") {
      if (JSON.stringify(oldItem) === JSON.stringify(newItem)) return;
    }
    this._currentTemplateHierarchy = templateHierarchy;
    const scopedProps = this._createScopedPropsContext(templateHierarchy);
    const loopContext = { ...scopedProps, [loopConfig.itemName]: newItem };
    if (loopConfig.idxName) loopContext[loopConfig.idxName] = newIndex;
    this.updateNodesContent(nodes, templateHierarchy, loopContext);
    // NEW: Update pp-if conditions in the updated nodes
    this.updateConditionalNodes(nodes, templateHierarchy, loopContext);
    this._currentTemplateHierarchy = null;
  }
  updateConditionalNodes(nodes, templateHierarchy, loopContext) {
    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        // Update pp-if elements
        element
          .querySelectorAll("[pp-if], [pp-elseif], [pp-else]")
          .forEach((el) => {
            const condition =
              el.getAttribute("pp-if") || el.getAttribute("pp-elseif");
            if (condition) {
              const expr = condition.replace(/^{\s*|\s*}$/g, "");
              try {
                const fn = this.makeScopedEvaluator(expr, templateHierarchy);
                const result = !!fn(loopContext);
                if (result) {
                  el.removeAttribute("hidden");
                } else {
                  el.setAttribute("hidden", "");
                }
              } catch (error) {
                console.error("Error evaluating pp-if condition:", expr, error);
              }
            } else if (el.hasAttribute("pp-else")) {
              // pp-else logic would need to check if previous siblings are hidden
              // This is simplified - you might need more complex logic for pp-else
              const prevSibling = el.previousElementSibling;
              if (prevSibling && prevSibling.hasAttribute("hidden")) {
                el.removeAttribute("hidden");
              } else {
                el.setAttribute("hidden", "");
              }
            }
          });
      }
    });
  }
  updateNodesContent(nodes, templateHierarchy, loopContext) {
    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        this.updateElementContent(node, templateHierarchy, loopContext);
      }
    });
  }
  updateElementContent(element, templateHierarchy, loopContext) {
    // Update text nodes with mustaches
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        const text = n.nodeValue || "";
        return text.includes("{{") && text.includes("}}")
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });
    while (walker.nextNode()) {
      const t = walker.nextNode();
      const originalText = t.nodeValue || "";
      const newText = this.renderMustacheText(
        originalText,
        templateHierarchy,
        loopContext
      );
      if (t.nodeValue !== newText) {
        t.nodeValue = newText;
      }
    }
    // Update bound attributes AND template attributes
    element.querySelectorAll("*").forEach((el) => {
      this.updateElementBindingsContent(el, templateHierarchy, loopContext);
      // ✅ NEW: Also update template attributes
      this.updateElementTemplateAttributes(el, templateHierarchy, loopContext);
    });
  }
  updateElementTemplateAttributes(el, templateHierarchy, loopContext) {
    for (const { name, value } of Array.from(el.attributes)) {
      // Skip pp-bind attributes as they're handled elsewhere
      if (name.startsWith("pp-bind")) continue;
      // Process regular attributes with mustache expressions
      if (PPHP._mustacheTest.test(value)) {
        const rendered = value.replace(PPHP._mustachePattern, (_m, expr) => {
          try {
            const evaluator = this.makeScopedEvaluator(expr, templateHierarchy);
            return this.formatValue(evaluator(loopContext));
          } catch (e) {
            console.error("PPHP: mustache token error:", expr, e);
            return "";
          }
        });
        if (el.getAttribute(name) !== rendered) {
          el.setAttribute(name, rendered);
        }
      }
    }
  }
  updateElementBindingsContent(el, templateHierarchy, loopContext) {
    for (const { name, value } of Array.from(el.attributes)) {
      if (name === "pp-bind") {
        this.updateElementBinding(
          el,
          value,
          "text",
          templateHierarchy,
          loopContext
        );
      } else if (name.startsWith("pp-bind-")) {
        const attr = name.replace(/^pp-bind-/, "");
        this.updateElementBinding(
          el,
          value,
          attr,
          templateHierarchy,
          loopContext
        );
      }
    }
  }
  createLoopUpdater(
    tpl,
    loopConfig,
    marker,
    parent,
    templateHierarchy,
    loopState
  ) {
    // ✅ CRITICAL FIX: Find the correct evaluator for the array
    let evalArr;
    // Try to find the array in different scopes
    for (let i = templateHierarchy.length; i >= 0; i--) {
      const testHierarchy = templateHierarchy.slice(0, i);
      try {
        const testEvaluator = this.makeScopedEvaluator(
          loopConfig.arrExpr,
          testHierarchy
        );
        const testContext = this._createScopedPropsContext(testHierarchy);
        const testResult = testEvaluator(testContext);
        if (Array.isArray(testResult)) {
          evalArr = testEvaluator;
          break;
        }
      } catch {
        // Continue searching
      }
    }
    // Fallback to original hierarchy if not found
    evalArr = this.makeScopedEvaluator(loopConfig.arrExpr, templateHierarchy);
    return () => {
      this.performLoopUpdate(
        tpl,
        loopConfig,
        marker,
        parent,
        templateHierarchy,
        loopState,
        evalArr
      );
    };
  }
  captureFocusState(parent) {
    const active = document.activeElement;
    const hadFocus = active && parent.contains(active);
    const focusKey = hadFocus
      ? active.closest("[key]")?.getAttribute("key")
      : null;
    const caretPos =
      hadFocus && active instanceof HTMLInputElement
        ? active.selectionStart
        : null;
    return { active, hadFocus, focusKey, caretPos };
  }
  restoreFocusState(focusInfo, parent) {
    if (focusInfo.focusKey) {
      const row = parent.querySelector(`[key="${focusInfo.focusKey}"]`);
      const tgt = row?.querySelector("input,textarea");
      if (tgt) {
        tgt.focus({ preventScroll: true });
        if (focusInfo.caretPos !== null && tgt instanceof HTMLInputElement) {
          const pos = Math.min(focusInfo.caretPos, tgt.value.length);
          tgt.setSelectionRange(pos, pos);
        }
      }
    }
  }
  calculateLoopDiff(previousList, currentList) {
    const oldKeyMap = new Map();
    const newKeyMap = new Map();
    // Build maps with current state
    previousList.forEach((item, index) => {
      const key = this.getItemKey(item, index);
      oldKeyMap.set(key, { item, index });
    });
    currentList.forEach((item, index) => {
      const key = this.getItemKey(item, index);
      newKeyMap.set(key, { item, index });
    });
    const toDelete = new Set();
    const toInsert = new Map();
    const toUpdate = new Map();
    // Find deletions - items that exist in old but not in new
    for (const [key] of oldKeyMap) {
      if (!newKeyMap.has(key)) {
        toDelete.add(key);
      }
    }
    // Find insertions and updates
    for (const [key, { item, index }] of newKeyMap) {
      if (!oldKeyMap.has(key)) {
        // New item - insert
        toInsert.set(key, { item, index });
      } else {
        // Existing item - check if it needs update
        const oldData = oldKeyMap.get(key);
        // Only update if the item data changed OR the position changed
        if (oldData.item !== item || oldData.index !== index) {
          toUpdate.set(key, {
            oldItem: oldData.item,
            newItem: item,
            newIndex: index,
            oldIndex: oldData.index,
          });
        }
      }
    }
    return { toDelete, toInsert, toUpdate };
  }
  applyLoopChanges(
    diffResult,
    loopState,
    loopConfig,
    marker,
    parent,
    templateHierarchy,
    tpl
  ) {
    // Apply deletions first
    this.applyLoopDeletions(diffResult.toDelete, loopState);
    // Apply updates second
    this.applyLoopUpdates(
      diffResult.toUpdate,
      loopState,
      loopConfig,
      templateHierarchy
    );
    // Apply insertions last
    this.applyLoopInsertions(
      diffResult.toInsert,
      loopState,
      loopConfig,
      marker,
      parent,
      templateHierarchy,
      tpl
    );
  }
  applyLoopUpdates(toUpdate, loopState, loopConfig, templateHierarchy) {
    for (const [key, { oldItem, newItem, newIndex, oldIndex }] of toUpdate) {
      const rendered = loopState.renderedItems.get(key);
      if (rendered) {
        // Update the item content
        this.updateItemNodes(
          rendered.nodes,
          oldItem,
          newItem,
          newIndex,
          loopConfig,
          templateHierarchy
        );
        // Update stored references
        rendered.item = newItem;
        rendered.index = newIndex;
        // Update reactive bindings
        rendered.bindings.forEach((binding) => {
          binding.update();
        });
      }
    }
  }
  applyLoopInsertions(
    toInsert,
    loopState,
    loopConfig,
    marker,
    parent,
    templateHierarchy,
    tpl
  ) {
    if (toInsert.size === 0) return;
    // Sort insertions by their target index
    const sortedInsertions = Array.from(toInsert.entries()).sort(
      ([, a], [, b]) => a.index - b.index
    );
    for (const [key, { item, index }] of sortedInsertions) {
      // *** CRITICAL FIX: Check if item already exists ***
      if (loopState.renderedItems.has(key)) {
        console.warn(`Item with key ${key} already exists, skipping insertion`);
        continue;
      }
      const { nodes, bindings } = this.createItemNodes(
        tpl,
        item,
        index,
        loopConfig,
        templateHierarchy
      );
      // Find correct insertion point by looking at the actual DOM order
      let insertAfter = marker;
      // Build a sorted list of existing items by their current index
      const existingItems = Array.from(loopState.renderedItems.entries())
        .map(([k, data]) => ({ key: k, ...data }))
        .sort((a, b) => a.index - b.index);
      // Find the item that should come immediately before this insertion
      for (let i = existingItems.length - 1; i >= 0; i--) {
        if (existingItems[i].index < index) {
          insertAfter =
            existingItems[i].nodes[existingItems[i].nodes.length - 1];
          break;
        }
      }
      // Insert nodes
      nodes.forEach((node) => {
        parent.insertBefore(node, insertAfter.nextSibling);
        insertAfter = node;
      });
      // Store the new item
      loopState.renderedItems.set(key, { nodes, item, index, bindings });
    }
  }
  performLoopUpdate(
    tpl,
    loopConfig,
    marker,
    parent,
    templateHierarchy,
    loopState,
    evalArr
  ) {
    // Remember focus/caret
    const focusInfo = this.captureFocusState(parent);
    // Get current items - try multiple contexts
    let currentList = [];
    let scopedProps;
    for (let i = templateHierarchy.length; i >= 0; i--) {
      const testHierarchy = templateHierarchy.slice(0, i);
      try {
        scopedProps = this._createScopedPropsContext(testHierarchy);
        const raw = evalArr(scopedProps);
        if (Array.isArray(raw) && raw.length >= 0) {
          currentList = raw;
          break;
        }
      } catch (e) {
        console.log(
          "🔥 Debug: Failed to evaluate at hierarchy:",
          testHierarchy,
          e
        );
      }
    }
    // Fallback if no array found
    if (!scopedProps) {
      scopedProps = this._createScopedPropsContext(templateHierarchy);
      const raw = evalArr(scopedProps);
      currentList = Array.isArray(raw) ? raw : [];
    }
    // *** ENHANCED: Validate array data ***
    if (!Array.isArray(currentList)) {
      console.warn("Loop expression did not return an array:", currentList);
      return;
    }
    // Perform diffing
    const diffResult = this.calculateLoopDiff(
      loopState.previousList,
      currentList
    );
    // Apply changes
    this.applyLoopChanges(
      diffResult,
      loopState,
      loopConfig,
      marker,
      parent,
      templateHierarchy,
      tpl
    );
    // *** CRITICAL: Update previous list reference ***
    loopState.previousList = [...currentList];
    // Restore focus/caret
    this.restoreFocusState(focusInfo, parent);
    // Wire up new nodes
    this.attachWireFunctionEvents();
  }
  applyLoopDeletions(toDelete, loopState) {
    for (const key of toDelete) {
      const rendered = loopState.renderedItems.get(key);
      if (rendered) {
        // Remove bindings
        rendered.bindings.forEach((binding) => {
          const index = this._bindings.indexOf(binding);
          if (index > -1) {
            this._bindings.splice(index, 1);
          }
        });
        // Remove nodes
        rendered.nodes.forEach((node) => {
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
        });
        loopState.renderedItems.delete(key);
      }
    }
  }
  async initRefs(root = document.body) {
    this.qsa(root, "[pp-ref]").forEach((el) => {
      const key = el.getAttribute("pp-ref");
      /* global ref table ------------------------------------------- */
      const list = this._refs.get(key) ?? [];
      list.push(el);
      this._refs.set(key, list);
      el.removeAttribute("pp-ref");
    });
  }
  scheduleBindingUpdate(binding) {
    this._pendingBindings.add(binding);
    if (!this._updateScheduled) {
      this._updateScheduled = true;
      requestAnimationFrame(() => {
        this.flushBindings();
      });
    }
  }
  makeReactive(obj, path = []) {
    // ⬇️ 1.  NO tocar instancias de Date, RegExp, Error, etc.
    if (
      obj instanceof Date ||
      obj instanceof RegExp ||
      obj instanceof Error ||
      obj instanceof URLSearchParams ||
      obj instanceof URL ||
      obj instanceof Promise // por si acaso
    ) {
      return obj; // ← devuélvelo tal cual, sin Proxy
    }
    const cached = this._proxyCache.get(obj);
    if (cached) return cached;
    if (
      obj instanceof Map ||
      obj instanceof Set ||
      typeof obj !== "object" ||
      obj === null
    ) {
      return obj;
    }
    if (obj.__isReactiveProxy) {
      return obj;
    }
    const self = this;
    const proxy = new Proxy(obj, {
      get(target, key, receiver) {
        if (key === "__isReactiveProxy") return true;
        const value = Reflect.get(target, key, receiver);
        // Handle array mutators
        if (
          Array.isArray(target) &&
          typeof key === "string" &&
          self._mutators.has(key)
        ) {
          let methodMap = self._arrayMethodCache.get(target);
          if (!methodMap) {
            methodMap = new Map();
            self._arrayMethodCache.set(target, methodMap);
          }
          if (!methodMap.has(key)) {
            const original = value.bind(receiver);
            const fullPath = path.join(".");
            const wrapped = function (...args) {
              const result = original(...args);
              queueMicrotask(() => {
                self._bindings.forEach((b) => {
                  const bindingType = self.getBindingType(b);
                  // ✅ FIX: Check ALL dependencies, not just the first one
                  for (const dep of b.dependencies) {
                    if (self.dependencyMatches(fullPath, dep, bindingType)) {
                      self.scheduleBindingUpdate(b);
                      break; // Exit inner loop once we find a match
                    }
                  }
                });
              });
              return result;
            };
            methodMap.set(key, wrapped);
          }
          return methodMap.get(key);
        }
        // Recurse into nested objects/arrays
        if (
          value !== null &&
          typeof value === "object" &&
          !value.__isReactiveProxy
        ) {
          return self.makeReactive(value, [...path, key]);
        }
        // Autobind array methods
        if (Array.isArray(target) && typeof value === "function") {
          let cache = self._arrayMethodCache.get(target);
          if (!cache) {
            cache = new Map();
            self._arrayMethodCache.set(target, cache);
          }
          if (!cache.has(key)) {
            cache.set(key, value.bind(target));
          }
          return cache.get(key);
        }
        return value;
      },
      set(target, key, rawValue, receiver) {
        if (key === "__isReactiveProxy") return true;
        let newValue = rawValue;
        if (
          rawValue !== null &&
          typeof rawValue === "object" &&
          !rawValue.__isReactiveProxy
        ) {
          newValue = self.makeReactive(rawValue, [...path, key]);
        }
        const oldValue = target[key];
        const result = Reflect.set(target, key, newValue, receiver);
        if (oldValue === newValue) return result;
        // ✅ ENHANCED: More precise dirty path tracking
        const fullPath = [...path, key].join(".");
        self._dirtyDeps.add(fullPath);
        // ✅ FIXED: Only add clean path for shared state, not all state
        if (fullPath.startsWith("app.")) {
          const cleanPath = fullPath.substring(4);
          const rootKey = cleanPath.split(".")[0];
          if (PPHP._shared.has(rootKey)) {
            self._dirtyDeps.add(cleanPath);
          }
        }
        // Array handling
        if (Array.isArray(target) && /^\d+$/.test(String(key))) {
          const arrayPath = path.join(".");
          self._dirtyDeps.add(`${arrayPath}.*`);
          if (arrayPath.startsWith("app.")) {
            const cleanPath = arrayPath.substring(4);
            const rootKey = cleanPath.split(".")[0];
            if (PPHP._shared.has(rootKey)) {
              self._dirtyDeps.add(`${cleanPath}.*`);
            }
          }
          if (newValue && typeof newValue === "object") {
            Object.keys(newValue).forEach((p) => {
              self._dirtyDeps.add(`${arrayPath}.*.${p}`);
              if (arrayPath.startsWith("app.")) {
                const cleanPath = arrayPath.substring(4);
                const rootKey = cleanPath.split(".")[0];
                if (PPHP._shared.has(rootKey)) {
                  self._dirtyDeps.add(`${cleanPath}.*.${p}`);
                }
              }
            });
          }
        }
        if (path.length >= 2 && /^\d+$/.test(path[path.length - 1])) {
          const arrayPath = path.slice(0, -1).join(".");
          self._dirtyDeps.add(`${arrayPath}.*.${String(key)}`);
          if (arrayPath.startsWith("app.")) {
            const cleanPath = arrayPath.substring(4);
            const rootKey = cleanPath.split(".")[0];
            if (PPHP._shared.has(rootKey)) {
              self._dirtyDeps.add(`${cleanPath}.*.${String(key)}`);
            }
          }
        }
        // ✅ ENHANCED: Check ALL dependencies for each binding
        self._bindings.forEach((b) => {
          const bindingType = self.getBindingType(b);
          for (const dep of b.dependencies) {
            if (self.dependencyMatches(fullPath, dep, bindingType)) {
              self.scheduleBindingUpdate(b);
              break; // Exit inner loop once we find a match
            }
            // Only check clean path for shared state
            if (fullPath.startsWith("app.")) {
              const cleanPath = fullPath.substring(4);
              const rootKey = cleanPath.split(".")[0];
              if (
                PPHP._shared.has(rootKey) &&
                self.dependencyMatches(cleanPath, dep, bindingType)
              ) {
                self.scheduleBindingUpdate(b);
                break;
              }
            }
          }
        });
        // ✅ FIXED: Only schedule flush for hydrated state
        if (self._hydrated) {
          self.scheduleFlush();
        }
        return result;
      },
    });
    this._proxyCache.set(obj, proxy);
    return proxy;
  }
  getBindingType(binding) {
    // Check if this is an effect (has __deps property from effect function)
    if (binding.__isEffect) {
      return "effect";
    }
    // ✅ ENHANCED: Better loop detection
    // Check if this binding was created from a loop (has loop-specific markers)
    if (binding.__isLoop) {
      return "loop";
    }
    // Check if this is a loop binding by looking at dependencies
    for (const dep of binding.dependencies) {
      // Loop bindings typically have array paths or wildcard patterns
      if (dep.includes("*") || dep.match(/\.\d+\./) || dep.endsWith(".*")) {
        return "loop";
      }
    }
    // ✅ NEW: Check if any dependency points to an array in the current state
    for (const dep of binding.dependencies) {
      try {
        const value = this.getNested(this.props, dep);
        if (Array.isArray(value)) {
          return "loop";
        }
      } catch {
        // Ignore errors when checking nested values
      }
    }
    return "binding";
  }
  makeAttrTemplateUpdater(el, attrName, deps, templateSrc) {
    /* 1. remember the *original* template string just once ------------ */
    let map = this._templateStore.get(el);
    if (!map) {
      map = new Map();
      this._templateStore.set(el, map);
    }
    if (!map.has(attrName)) {
      map.set(attrName, el.getAttribute(attrName) || "");
    }
    const template = templateSrc ?? map.get(attrName);
    // *** NEW: Get element's component hierarchy ***
    const elementHierarchy = this.detectElementHierarchy(el);
    /* 2. collect dependencies from each {{ … }} token ----------------- */
    (template.match(this._mustacheRe) || []).forEach((tok) => {
      const inner = tok.replace(/^\{\{\s*|\s*\}\}$/g, "");
      this.extractScopedDependencies(inner, elementHierarchy).forEach((d) =>
        deps.add(d)
      );
    });
    /* 3. return the live updater -------------------------------------- */
    return () => {
      try {
        const rendered = template.replace(this._mustacheRe, (_m, inner) => {
          try {
            const evaluate = this.makeScopedEvaluator(inner, elementHierarchy);
            const scopedContext =
              this._createScopedPropsContext(elementHierarchy);
            return this.formatValue(evaluate(scopedContext));
          } catch (e) {
            console.error("PPHP: mustache token error:", inner, e);
            return "";
          }
        });
        if (el.getAttribute(attrName) !== rendered) {
          el.setAttribute(attrName, rendered);
        }
      } catch (err) {
        console.error(
          `PPHP: failed to render attribute "${attrName}" with template "${template}"`,
          err
        );
      }
    };
  }
  formatValue(value) {
    if (typeof value === "function") {
      if (value.__isReactiveProxy) {
        try {
          return this.formatValue(value());
        } catch {
          /* ignore and fall through */
        }
      }
      return ""; // plain functions → render nothing
    }
    if (value && typeof value === "object") {
      /* 1-a.  proxy-function wrapper with `.value`                     */
      if (value.__isReactiveProxy && "value" in value) {
        try {
          return this.formatValue(value.value);
        } catch {
          return String(value);
        }
      }
      /* 1-b.  reactive proxy objects – strip meta keys, json-ify       */
      if (value.__isReactiveProxy) {
        try {
          const plain = {};
          for (const k in value) {
            if (k !== "__isReactiveProxy" && k !== "__pphp_key") {
              try {
                plain[k] = value[k];
              } catch {
                /* skip */
              }
            }
          }
          return Object.keys(plain).length
            ? JSON.stringify(plain, null, 2)
            : "";
        } catch {
          return String(value);
        }
      }
      /* 1-c.  regular objects – safe JSON stringify                    */
      try {
        return JSON.stringify(
          value,
          (k, v) => {
            if (k === "__isReactiveProxy" || k === "__pphp_key")
              return undefined;
            if (v && typeof v === "object" && v.__isReactiveProxy) {
              if (typeof v === "function" && "value" in v) return v.value;
              return "[Reactive Object]";
            }
            return v;
          },
          2
        );
      } catch {
        return String(value);
      }
    }
    /* 2.  Boxed primitive like { value: 42 } – unwrap                  */
    if (
      value !== null &&
      typeof value === "object" &&
      Object.keys(value).length === 1 &&
      Object.prototype.hasOwnProperty.call(value, "value")
    ) {
      return this.formatValue(value.value);
    }
    /* 3.  Booleans                                                     */
    if (typeof value === "boolean") return value ? "true" : "false";
    /* 4.  Arrays – join, stringifying nested objects                   */
    if (Array.isArray(value)) {
      return value
        .map((v) =>
          typeof v === "object" && v !== null
            ? (() => {
                try {
                  return JSON.stringify(v);
                } catch {
                  return String(v);
                }
              })()
            : String(v)
        )
        .join(", ");
    }
    /* 5.  All other primitives                                         */
    return value?.toString() ?? "";
  }
  registerBinding(el, expr, kind = "text", attributeName) {
    /* 0️⃣ ignore plain assignments like `foo = bar` -------------------- */
    if (this._assignmentRe.test(expr)) return;
    // *** NEW: Get element's component hierarchy ***
    const elementHierarchy = this.detectElementHierarchy(el);
    /* 1️⃣ gather deps & evaluator WITH SCOPING ----------------------- */
    const deps = this.extractScopedDependencies(expr, elementHierarchy);
    // *** CHANGED: Use scoped evaluator instead of flat evaluator ***
    const evaluate = this.makeScopedEvaluator(expr, elementHierarchy);
    /* 2️⃣ fast path for value / checked bindings ---------------------- */
    if (attributeName === "value" || attributeName === "checked") {
      const updater = () => {
        try {
          // *** CHANGED: Use scoped context ***
          const scopedContext =
            this._createScopedPropsContext(elementHierarchy);
          const raw = evaluate(scopedContext);
          const value = this.formatValue(raw);
          let didChange = false;
          if (attributeName === "value") {
            const input = el;
            if ("value" in el && input.value !== value) {
              input.value = value;
              didChange = true;
            } else if (!("value" in el)) {
              el.setAttribute("value", value);
              didChange = true;
            }
          } else {
            const input = el;
            const newState = value === "true";
            if ("checked" in el && input.checked !== newState) {
              input.checked = newState;
              didChange = true;
            } else if (!("checked" in el)) {
              el.setAttribute("checked", value);
              didChange = true;
            }
          }
          if (
            !didChange ||
            !this._hydrated ||
            (el instanceof HTMLInputElement &&
              (el.type === "hidden" || el.disabled || el.readOnly))
          ) {
            return;
          }
          const dynamicEventMap = {};
          this._eventHandlers.forEach((onName) => {
            if (onName.startsWith("on")) {
              const ev = onName.slice(2);
              dynamicEventMap[ev] = ev;
            }
          });
          dynamicEventMap.value = "input";
          dynamicEventMap.checked = "change";
          const eventName = dynamicEventMap[attributeName] || attributeName;
          const evt =
            eventName === "click"
              ? new MouseEvent(eventName, { bubbles: true, cancelable: true })
              : new Event(eventName, { bubbles: true });
          el.dispatchEvent(evt);
        } catch (err) {
          console.error(`Error evaluating attribute "${attributeName}":`, err);
        }
      };
      this._bindings.push({ dependencies: deps, update: updater });
      return;
    }
    /* 3️⃣ ATTRIBUTE BINDINGS (pp-bind-*) ------------------------------- */
    if (attributeName) {
      const attrLower = attributeName.toLowerCase();
      /* 3-a  boolean attributes (disabled, readonly …) ---------------- */
      if (this._boolAttrs.has(attrLower)) {
        el.removeAttribute(attrLower);
        const updater = () => {
          try {
            // *** CHANGED: Use scoped context ***
            const scopedContext =
              this._createScopedPropsContext(elementHierarchy);
            const truthy = !!evaluate(scopedContext);
            if (el[attributeName] !== truthy) el[attributeName] = truthy;
            truthy
              ? el.setAttribute(attrLower, "")
              : el.removeAttribute(attrLower);
          } catch (err) {
            console.error(
              `PPHP: error evaluating boolean attribute ${attributeName}="${expr}"`,
              err
            );
          }
        };
        this._bindings.push({ dependencies: deps, update: updater });
        return;
      }
      /* 3-b  mustache template inside attribute ---------------------- */
      const attrTemplate = el.getAttribute(attributeName) ?? "";
      if (this._mustacheRe.test(expr) || this._mustacheRe.test(attrTemplate)) {
        const updater = this.makeAttrTemplateUpdater(
          el,
          attributeName,
          deps,
          attrTemplate
        );
        this._bindings.push({ dependencies: deps, update: updater });
        return;
      }
      /* 3-c  plain expression attribute ------------------------------ */
      const updater = () => {
        try {
          // *** CHANGED: Use scoped context ***
          const scopedContext =
            this._createScopedPropsContext(elementHierarchy);
          const raw = evaluate(scopedContext);
          const value = this.formatValue(raw);
          if (attributeName in el) el[attributeName] = value;
          el.setAttribute(attributeName, value);
        } catch (err) {
          console.error(
            `Error evaluating attribute ${attributeName}="${expr}"`,
            err
          );
        }
      };
      this._bindings.push({ dependencies: deps, update: updater });
      return;
    }
    /* 4️⃣ TEXT / VALUE / CHECKED bindings on nodes ---------------------- */
    const setter = {
      text(e, v) {
        if (e.textContent !== v) e.textContent = v;
      },
      value(e, v) {
        if (
          e instanceof HTMLInputElement ||
          e instanceof HTMLTextAreaElement ||
          e instanceof HTMLSelectElement
        ) {
          if (e.value !== v) e.value = v;
        } else {
          e.setAttribute("value", v);
        }
      },
      checked(e, v) {
        if (e instanceof HTMLInputElement) {
          e.checked = v === "true";
        } else {
          e.setAttribute("checked", v);
        }
      },
      attr(e, v) {
        e.setAttribute("attr", v);
      },
    };
    const updater = () => {
      try {
        // *** CHANGED: Use scoped context ***
        const scopedContext = this._createScopedPropsContext(elementHierarchy);
        const raw = evaluate(scopedContext);
        const value = this.formatValue(raw);
        setter[kind](el, value);
      } catch (err) {
        console.error(`Error evaluating expression "${expr}"`, err);
      }
    };
    this._bindings.push({ dependencies: deps, update: updater });
  }
  makeSafeEvaluator(expr) {
    const trimmed = expr.trim();
    const isAssignment = /^\s*[\w.]+\s*=(?!=)/.test(trimmed);
    const returnLine = isAssignment
      ? `${trimmed}; return "";`
      : `return (${trimmed});`;
    const fnBody = `
    try {
      with (ctx) {
        ${returnLine}
      }
    } catch {
      return "";
    }
  `;
    let safeFn;
    try {
      safeFn = new Function("ctx", fnBody);
    } catch (compileError) {
      const literal = JSON.stringify(expr);
      safeFn = new Function(
        "ctx",
        `try { return ${literal}; } catch { return ""; }`
      );
    }
    return (ctx) => {
      try {
        const result = safeFn(ctx);
        return result == null ? "" : result;
      } catch {
        return "";
      }
    };
  }
  makeScopedEvaluator(expr, hierarchy) {
    const trimmed = expr.trim();
    const isAssignment = /^\s*[\w.]+\s*=(?!=)/.test(trimmed);
    const returnLine = isAssignment
      ? `${trimmed}; return "";`
      : `return (${trimmed});`;
    const fnBody = `
    try {
      with (ctx) {
        ${returnLine}
      }
    } catch {
      return "";
    }
  `;
    let safeFn;
    try {
      safeFn = new Function("ctx", fnBody);
    } catch (compileError) {
      const literal = JSON.stringify(expr);
      safeFn = new Function(
        "ctx",
        `try { return ${literal}; } catch { return ""; }`
      );
    }
    return (ctx) => {
      try {
        // ✅ ENHANCED: Try multiple scoped contexts to find the array
        for (let i = hierarchy.length; i >= 0; i--) {
          const testHierarchy = hierarchy.slice(0, i);
          try {
            const scopedContext = this._createScopedPropsContext(
              testHierarchy,
              ctx
            );
            const result = safeFn(scopedContext);
            // If we get a valid array result, use it
            if (Array.isArray(result) && expr === "voucherItems") {
              return result;
            }
            // For non-array expressions, use the result if it's not empty/undefined
            if (result != null && result !== "" && expr !== "voucherItems") {
              return result;
            }
          } catch {
            // Continue to next hierarchy level
          }
        }
        // Fallback to original context
        const scopedContext = this._createScopedPropsContext(hierarchy, ctx);
        const result = safeFn(scopedContext);
        return result == null ? "" : result;
      } catch {
        return "";
      }
    };
  }
  _createScopedPropsContext(hierarchy, additionalContext = {}) {
    const scopedKey = hierarchy.join(".");
    const componentProps = this.getNested(this.props, scopedKey) || {};
    const self = this;
    return new Proxy(additionalContext, {
      /* ─────────────── get ─────────────── */
      get(target, prop, receiver) {
        /* 0.  AUTO-UNWRAP primitive state  (counter, total, …) */
        if (typeof prop === "string") {
          const v = Reflect.get(target, prop, receiver);
          if (typeof v === "function" && v.__isReactiveProxy) {
            try {
              return v();
            } catch {
              // unwrap number/string
              /* ignore if the call fails */
            }
          }
        }
        /* 1.  additional loop / inline variables */
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        /* 2.  scoped inline-module functions (current component) */
        const scopedFn = self.getScopedFunction(prop, hierarchy);
        if (scopedFn) return scopedFn;
        /* 3.  current component state / props */
        if (componentProps && prop in componentProps) {
          return componentProps[prop];
        }
        /* 4.  walk parent scopes for fns & state */
        for (let i = hierarchy.length - 1; i >= 0; i--) {
          const parentScopeKey = hierarchy.slice(0, i).join(".");
          // 4a functions
          const maybeFn = self.getScopedFunction(prop, hierarchy.slice(0, i));
          if (maybeFn) return maybeFn;
          // 4b state / props
          const parentProps = parentScopeKey
            ? self.getNested(self.props, parentScopeKey)
            : self.props;
          if (parentProps && prop in parentProps) {
            return parentProps[prop];
          }
        }
        /* 5.  globalThis fallback */
        if (prop in globalThis) return globalThis[prop];
        return undefined;
      },
      /* ─────────────── set ─────────────── */
      set(target, prop, value, receiver) {
        if (typeof prop !== "string") {
          return Reflect.set(target, prop, value, receiver);
        }
        /* 1. write into additional context if it exists there */
        if (prop in target) {
          return Reflect.set(target, prop, value, receiver);
        }
        /* 2. overwrite existing state somewhere up the hierarchy */
        for (let i = hierarchy.length; i >= 0; i--) {
          const scopeKey = hierarchy.slice(0, i).join(".");
          const scopedPath = scopeKey ? `${scopeKey}.${prop}` : prop;
          if (self.hasNested(self.props, scopedPath)) {
            self.setNested(self.props, scopedPath, value);
            self._dirtyDeps.add(scopedPath);
            self.scheduleFlush();
            return true;
          }
        }
        /* 3. create new key in current component scope */
        const newPath = scopedKey ? `${scopedKey}.${prop}` : prop;
        self.setNested(self.props, newPath, value);
        self._dirtyDeps.add(newPath);
        self.scheduleFlush();
        return true;
      },
      /* ─────────────── has ─────────────── */
      has(target, prop) {
        if (typeof prop !== "string") return false;
        return (
          prop in target ||
          !!self.getScopedFunction(prop, hierarchy) ||
          (componentProps && prop in componentProps) ||
          prop in globalThis ||
          hierarchy.some((_, i) => {
            const parentScopeKey = hierarchy.slice(0, i).join(".");
            const parentProps = parentScopeKey
              ? self.getNested(self.props, parentScopeKey)
              : self.props;
            return parentProps && prop in parentProps;
          })
        );
      },
    });
  }
  extractScopedDependencies(expr, hierarchy) {
    const baseDeps = this.extractDependencies(expr);
    const scopedDeps = new Set();
    const scopedPrefix = hierarchy.join(".");
    for (const dep of baseDeps) {
      // skip any “dependencies” that are actually built-ins
      if (this._reservedWords.has(dep.split(".")[0])) {
        continue;
      }
      // Check if this dependency exists in current component scope
      const scopedPath = scopedPrefix + "." + dep;
      // First check if we have a declared state for this scoped path
      if (this._stateHierarchy.has(scopedPath)) {
        scopedDeps.add(scopedPath);
        continue;
      }
      // Then check if the nested property exists
      if (this.hasNested(this.props, scopedPath)) {
        scopedDeps.add(scopedPath);
        continue;
      }
      // Check parent scopes
      let found = false;
      for (let i = hierarchy.length - 1; i >= 0 && !found; i--) {
        const parentScope = hierarchy.slice(0, i).join(".");
        const parentPath = parentScope ? parentScope + "." + dep : dep;
        // Check state hierarchy first
        if (this._stateHierarchy.has(parentPath)) {
          scopedDeps.add(parentPath);
          found = true;
          continue;
        }
        // Then check if nested property exists
        if (this.hasNested(this.props, parentPath)) {
          scopedDeps.add(parentPath);
          found = true;
          continue;
        }
      }
      if (!found) {
        // For dependencies that don't exist yet, assume they belong to current component scope
        // This handles forward references to state that will be created
        const assumedScopedPath = scopedPrefix + "." + dep;
        scopedDeps.add(assumedScopedPath);
      }
    }
    return scopedDeps;
  }
  async processIfChains(root = document.body) {
    const processed = new WeakSet();
    this.qsa(root, "[pp-if]").forEach((ifEl) => {
      if (processed.has(ifEl)) return;
      // Build the conditional chain
      const elementHierarchy = this.detectElementHierarchy(ifEl);
      const chain = [];
      let cur = ifEl;
      while (cur) {
        if (cur.hasAttribute("pp-if")) {
          chain.push({ el: cur, expr: cur.getAttribute("pp-if") });
        } else if (cur.hasAttribute("pp-elseif")) {
          chain.push({ el: cur, expr: cur.getAttribute("pp-elseif") });
        } else if (cur.hasAttribute("pp-else")) {
          chain.push({ el: cur, expr: null });
        } else {
          break;
        }
        processed.add(cur);
        cur = cur.nextElementSibling;
      }
      // Compile expressions into dependencies + evaluators
      chain.forEach((item) => {
        if (item.expr !== null) {
          const raw = item.expr.replace(/^{\s*|\s*}$/g, "");
          item.deps = this.extractScopedDependencies(raw, elementHierarchy);
          const fn = this.makeScopedEvaluator(raw, elementHierarchy);
          item.evaluate = () => {
            const ctx = this._createScopedPropsContext(elementHierarchy);
            return !!fn(ctx);
          };
        }
      });
      // Collect all dependencies
      const allDeps = new Set();
      chain.forEach((item) => item.deps?.forEach((dep) => allDeps.add(dep)));
      // Single updater for the entire chain
      const updater = () => {
        let shown = false;
        for (const { el, expr, evaluate } of chain) {
          if (!shown && expr !== null && evaluate()) {
            el.removeAttribute("hidden");
            shown = true;
          } else if (!shown && expr === null) {
            el.removeAttribute("hidden");
            shown = true;
          } else {
            el.setAttribute("hidden", "");
          }
        }
      };
      this._bindings.push({ dependencies: allDeps, update: updater });
    });
  }
  async manageAttributeBindings(root = document.body) {
    this.qsa(root, "*").forEach((el) => {
      // 2.a text binds: pp-bind / pp-bind-expr
      ["pp-bind", "pp-bind-expr"].forEach((attr) => {
        const expr = el.getAttribute(attr);
        if (expr) {
          this.registerBinding(el, expr, "text");
        }
      });
      // 2.b auto-bind boolean attributes (e.g., disabled)
      Array.from(el.attributes).forEach((attr) => {
        const nameLower = attr.name.toLowerCase();
        const raw = attr.value.trim();
        if (
          this._boolAttrs.has(nameLower) &&
          !attr.name.startsWith("pp-bind-") &&
          /^[A-Za-z_$][\w$]*$/.test(raw)
        ) {
          el.removeAttribute(attr.name);
          this.registerBinding(el, raw, "text", nameLower);
        }
      });
      // 2.c explicit pp-bind-XYZ (excluding spread)
      Array.from(el.attributes).forEach((attr) => {
        if (!attr.name.startsWith("pp-bind-")) return;
        const name = attr.name;
        if (["pp-bind", "pp-bind-expr", "pp-bind-spread"].includes(name))
          return;
        const raw = this.decodeEntities(attr.value);
        const expr = raw.replace(/^{{\s*|\s*}}$/g, "");
        const attributeName = name.replace(/^pp-bind-/, "");
        const kind =
          attributeName === "value"
            ? "value"
            : attributeName === "checked"
            ? "checked"
            : "text";
        this.registerBinding(el, expr, kind, attributeName);
      });
      // 2.d pp-bind-spread
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name !== "pp-bind-spread") return;
        const elementHierarchy = this.detectElementHierarchy(el);
        const sources = this.decodeEntities(attr.value)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const deps = new Set();
        sources.forEach((src) => {
          this.extractScopedDependencies(src, elementHierarchy).forEach((dep) =>
            deps.add(dep)
          );
        });
        const applied = new Set();
        const updater = () => {
          try {
            const merged = {};
            const ctx = this._createScopedPropsContext(elementHierarchy);
            sources.forEach((src) => {
              const fn = this.makeScopedEvaluator(src, elementHierarchy);
              const obj = fn(ctx) ?? {};
              Object.assign(merged, obj);
            });
            // Remove stale attrs
            applied.forEach((k) => {
              if (!(k in merged) && !el.hasAttribute(k)) {
                el.removeAttribute(k);
                applied.delete(k);
              }
            });
            // Apply new/update existing
            Object.entries(merged).forEach(([k, v]) => {
              if (!applied.has(k) && el.hasAttribute(k)) return;
              if (v == null || v === false) {
                if (applied.has(k)) {
                  el.removeAttribute(k);
                  applied.delete(k);
                }
                return;
              }
              const str = typeof v === "object" ? JSON.stringify(v) : String(v);
              if (el.getAttribute(k) !== str) {
                el.setAttribute(k, str);
              }
              applied.add(k);
            });
          } catch (err) {
            console.error("pp-bind-spread error:", err);
          }
        };
        this._bindings.push({ dependencies: deps, update: updater });
      });
    });
  }
  callInlineModule(name, ...args) {
    // Try to find the function in the current processing hierarchy
    const hierarchy = this._currentProcessingHierarchy || ["app"];
    const fn = this.getScopedFunction(name, hierarchy);
    if (!fn) {
      throw new Error(
        `PPHP: no inline module named "${name}" in scope ${hierarchy.join(".")}`
      );
    }
    return fn(...args);
  }
  getScopedFunction(
    fnName, // ← accept symbols too
    elementHierarchy
  ) {
    /* ── 0. ignore non-string look-ups (symbols, numbers, etc.) ────── */
    if (typeof fnName !== "string") return null;
    /* ── 1. walk current → parent scopes for inline-module functions ─ */
    for (let i = elementHierarchy.length; i >= 0; i--) {
      const scopeKey = elementHierarchy.slice(0, i).join(".");
      const scopedFns = this._inlineModuleFns.get(scopeKey);
      if (scopedFns && scopedFns.has(fnName)) {
        return scopedFns.get(fnName);
      }
    }
    /* ── 2. implicit state setters  (setFoo → updates Foo) ─────────── */
    if (fnName.startsWith("set")) {
      const stateVar = fnName.charAt(3).toLowerCase() + fnName.slice(4);
      // walk up the hierarchy until we find the state key
      for (let i = elementHierarchy.length; i >= 0; i--) {
        const scopeKey = elementHierarchy.slice(0, i).join(".");
        const fullStateKey = scopeKey ? `${scopeKey}.${stateVar}` : stateVar;
        if (this.hasNested(this.props, fullStateKey)) {
          /* build and return a setter */
          return (val) => {
            this.setNested(this.props, fullStateKey, val);
            this._dirtyDeps.add(fullStateKey);
            this.scheduleFlush();
          };
        }
      }
    }
    /* ── 3. no match ───────────────────────────────────────────────── */
    return null;
  }
  async processInlineModuleScripts(root = document.body) {
    this._inlineDepth++;
    try {
      const scripts = Array.from(
        this.qsa(root, 'script[type="text/php"]:not([src])')
      ).filter((s) => !this._processedPhpScripts.has(s));
      if (scripts.length === 0) return;
      // ✅ ENHANCED: Better debugging of script hierarchy
      const scriptsByDepth = scripts
        .map((script, index) => {
          const hierarchy = this.detectComponentHierarchy(script);
          const content = (script.textContent || "").trim().substring(0, 100);
          return {
            script,
            hierarchy,
            depth: hierarchy.length,
          };
        })
        .sort((a, b) => a.depth - b.depth);
      // Process scripts...
      for (const { script, hierarchy } of scriptsByDepth) {
        this._currentProcessingHierarchy = hierarchy;
        const hierarchyKey = hierarchy.join(".");
        let src = (script.textContent || "").trim();
        src = this.decodeEntities(src);
        src = this.stripComments(src);
        src = this.transformStateDeclarations(src);
        // ✅ This is where the injection happens
        src = this.injectScopedVariables(src, hierarchy);
        // ... rest of the processing
        const rawSetters = this.extractSetters(src);
        if (rawSetters.length) {
          src += "\n\n";
          for (const fn of rawSetters) {
            src += `pphp._registerScopedFunction('${hierarchyKey}', '${fn}', ${fn});\n`;
          }
        }
        src = src.replace(
          /pphp\.(state|share)\(\s*(['"])([^'" ]+)\2\s*,/g,
          (_m, fn, _q, key) => `pphp.${fn}('${key}',`
        );
        const exportStubs = [];
        for (const [, name] of [
          ...src.matchAll(/export\s+function\s+([A-Za-z_$]\w*)/g),
          ...src.matchAll(/export\s+const\s+([A-Za-z_$]\w*)/g),
        ]) {
          exportStubs.push(
            `pphp._registerScopedFunction('${hierarchyKey}', '${name}', ${name});`
          );
        }
        if (exportStubs.length) src += "\n\n" + exportStubs.join("\n");
        const blob = new Blob([src], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);
        try {
          const mod = await import(url);
          if (!this._inlineModuleFns.has(hierarchyKey)) {
            this._inlineModuleFns.set(hierarchyKey, new Map());
          }
          const scopedFns = this._inlineModuleFns.get(hierarchyKey);
          for (const [name, fn] of Object.entries(mod)) {
            if (typeof fn === "function" && !scopedFns.has(name)) {
              scopedFns.set(name, fn);
            }
          }
        } catch (err) {
          console.error("❌ Inline module import failed:", err);
          console.error("📄 Generated source:", src);
        } finally {
          URL.revokeObjectURL(url);
          this._processedPhpScripts.add(script);
          this._currentProcessingHierarchy = null;
        }
      }
    } finally {
      this._inlineDepth--;
      if (this._inlineDepth === 0) {
        requestAnimationFrame(() => {
          this._pendingEffects.forEach((fn) => this._effects.add(fn));
          this._pendingEffects.clear();
        });
      }
    }
  }
  injectScopedVariables(src, hierarchy) {
    // Find all variable references in the script
    const variableRefs = this.extractVariableReferences(src);
    // ✅ SPECIAL DEBUG: If isOpen should be there but isn't, debug why
    if (src.includes("isOpen") && !variableRefs.has("isOpen")) {
      // Re-run extraction with detailed logging
      let cleanSrc = src
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/\/\/.*$/gm, " ")
        .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, " ");
      const variablePattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
      let match;
      const allMatches = [];
      while ((match = variablePattern.exec(cleanSrc)) !== null) {
        allMatches.push({
          name: match[1],
          index: match.index,
          context: cleanSrc.substring(
            Math.max(0, match.index - 20),
            match.index + match[1].length + 20
          ),
        });
      }
      // Find isOpen specifically
      const isOpenMatches = allMatches.filter((m) => m.name === "isOpen");
      // Test each match
      isOpenMatches.forEach((m, i) => {
        const beforeMatch = cleanSrc.substring(
          Math.max(0, m.index - 50),
          m.index
        );
        const afterMatch = cleanSrc.substring(
          m.index + m.name.length,
          m.index + m.name.length + 10
        );
      });
    }
    // Find variables that are declared in this script
    const declaredVars = this.extractDeclaredVariables(src);
    const stateVars = this.extractStateVariables(src);
    const allDeclaredVars = new Set([...declaredVars, ...stateVars]);
    // Create variable injections
    const injections = [];
    const injectedVars = new Set();
    for (const varName of variableRefs) {
      if (injectedVars.has(varName)) continue;
      if (allDeclaredVars.has(varName)) {
        continue;
      }
      // Check if this variable exists in the scoped context
      if (this.hasInScopedContext(varName, hierarchy)) {
        const scopedKey = this.findScopedKeyForVariable(varName, hierarchy);
        injections.push(`
const ${varName} = (() => {
  const fn = () => {
    const ctx = globalThis.pphp._createScopedPropsContext(${JSON.stringify(
      hierarchy
    )});
    return ctx.${varName};
  };
  
  fn.__isReactiveProxy = true;
  fn.__pphp_key = '${scopedKey}';
  
  Object.defineProperty(fn, 'value', {
    get() {
      const ctx = globalThis.pphp._createScopedPropsContext(${JSON.stringify(
        hierarchy
      )});
      return ctx.${varName};
    },
    configurable: true
  });
  
  fn.valueOf = function() { return this.value; };
  fn.toString = function() { return String(this.value); };
  
  return fn;
})();`);
        injectedVars.add(varName);
        const setterName = `set${varName
          .charAt(0)
          .toUpperCase()}${varName.slice(1)}`;
        if (
          this.hasInScopedContext(setterName, hierarchy) &&
          !allDeclaredVars.has(setterName)
        ) {
          injections.push(`
const ${setterName} = (...args) => {
  const ctx = globalThis.pphp._createScopedPropsContext(${JSON.stringify(
    hierarchy
  )});
  return ctx.${setterName}(...args);
};`);
          injectedVars.add(setterName);
        }
      }
    }
    if (injections.length > 0) {
      return injections.join("\n") + "\n\n" + src;
    }
    return src;
  }
  extractStateVariables(src) {
    const stateVars = new Set();
    // Pattern for pphp.state calls: const [varName, setterName] = pphp.state(...)
    const statePattern =
      /\b(?:const|let|var)\s+\[\s*([^,\]]+)(?:\s*,\s*([^,\]]+))?\s*\]\s*=\s*pphp\.state/g;
    let match;
    while ((match = statePattern.exec(src)) !== null) {
      const varName = match[1]?.trim();
      const setterName = match[2]?.trim();
      if (varName) stateVars.add(varName);
      if (setterName) stateVars.add(setterName);
    }
    // Also check for direct state calls: pphp.state('varName', ...)
    const directStatePattern = /pphp\.state\s*\(\s*['"]([^'"]+)['"]/g;
    while ((match = directStatePattern.exec(src)) !== null) {
      const varName = match[1];
      if (varName) {
        stateVars.add(varName);
        // Also add the likely setter name
        const setterName = `set${varName
          .charAt(0)
          .toUpperCase()}${varName.slice(1)}`;
        stateVars.add(setterName);
      }
    }
    return stateVars;
  }
  extractDeclaredVariables(src) {
    const declared = new Set();
    // Remove string literals and comments to avoid false matches
    let cleanSrc = src
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
      .replace(/\/\/.*$/gm, "") // Remove line comments
      .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, ""); // Remove string literals
    // Find variable declarations
    const patterns = [
      // const/let/var declarations
      /\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      // Array destructuring declarations - use [^\]] for arrays
      /\b(?:const|let|var)\s+\[\s*([^\]]+?)\s*\]/g,
      // Object destructuring declarations - use [^}] for objects
      /\b(?:const|let|var)\s+\{\s*([^}]+?)\s*\}/g,
      // Function declarations
      /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      // Arrow function assignments: const foo = () => ...
      /\b(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:\([^)]*\))?\s*=>/g,
      // declarations
      /\bexport\s+(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*))/g,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(cleanSrc)) !== null) {
        const varName = match[1] || match[2];
        if (pattern.source.includes("\\[") && !pattern.source.includes("\\{")) {
          // Handle ARRAY destructuring: [foo, bar, baz]
          const destructured = varName
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
            .map((v) => {
              if (v.startsWith("...")) {
                return v.substring(3).trim();
              }
              return v;
            });
          for (const dVar of destructured) {
            if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(dVar)) {
              declared.add(dVar);
            }
          }
        } else if (
          pattern.source.includes("\\{") &&
          !pattern.source.includes("\\[")
        ) {
          // Handle OBJECT destructuring: {foo, bar: baz}
          const destructured = varName
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
            .map((v) => {
              const colonIndex = v.indexOf(":");
              if (colonIndex !== -1) {
                return v.substring(colonIndex + 1).trim();
              }
              if (v.startsWith("...")) {
                return v.substring(3).trim();
              }
              return v;
            });
          for (const dVar of destructured) {
            if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(dVar)) {
              declared.add(dVar);
            }
          }
        } else if (varName) {
          declared.add(varName);
        }
      }
    }
    return declared;
  }
  findScopedKeyForVariable(varName, hierarchy) {
    // Check current component scope
    const scopedKey = hierarchy.join(".");
    const componentProps = this.getNested(this.props, scopedKey) || {};
    if (componentProps && varName in componentProps) {
      return `${scopedKey}.${varName}`;
    }
    // Check parent scopes
    for (let i = hierarchy.length - 1; i >= 0; i--) {
      const parentScope = hierarchy.slice(0, i);
      const parentScopeKey = parentScope.join(".");
      const parentProps = parentScopeKey
        ? this.getNested(this.props, parentScopeKey)
        : this.props;
      if (
        parentProps &&
        typeof parentProps === "object" &&
        varName in parentProps
      ) {
        return parentScopeKey ? `${parentScopeKey}.${varName}` : varName;
      }
    }
    // Fallback to current scope
    return `${scopedKey}.${varName}`;
  }
  extractVariableReferences(src) {
    const variables = new Set();
    // Remove string literals and comments to avoid false matches
    let cleanSrc = src
      .replace(/\/\*[\s\S]*?\*\//g, " ") // Remove block comments -> replace with space
      .replace(/\/\/.*$/gm, " ") // Remove line comments -> replace with space
      .replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, " "); // Remove string literals -> replace with space
    const variablePattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    let match;
    while ((match = variablePattern.exec(cleanSrc)) !== null) {
      const varName = match[1];
      const matchIndex = match.index;
      // Skip JavaScript keywords and built-ins
      if (this._reservedWords.has(varName)) continue;
      // ✅ CRITICAL FIX: More precise context checking
      const beforeMatch = cleanSrc.substring(
        Math.max(0, matchIndex - 50),
        matchIndex
      );
      const afterMatch = cleanSrc.substring(
        matchIndex + varName.length,
        matchIndex + varName.length + 10
      );
      // Skip if it's part of a declaration
      if (/\b(?:const|let|var|function|class|export)\s+$/.test(beforeMatch))
        continue;
      // Skip if it's a property being accessed (foo.bar -> skip 'bar')
      if (matchIndex > 0 && cleanSrc[matchIndex - 1] === ".") continue;
      // Skip if it's an object key (key: value)
      if (/^\s*:/.test(afterMatch)) continue;
      // ✅ CRITICAL FIX: Don't skip variables inside function bodies
      // The old logic was incorrectly flagging variables inside arrow functions as parameters
      if (this.isActualFunctionParameter(cleanSrc, matchIndex, varName))
        continue;
      // ✅ CRITICAL FIX: Better destructuring detection
      if (this.isInDestructuringDeclaration(cleanSrc, matchIndex, varName))
        continue;
      variables.add(varName);
    }
    return variables;
  }
  isActualFunctionParameter(src, index, varName) {
    // Look for the pattern: function(param) or (param) => or function name(param)
    // First, find if we're between parentheses
    let openParenIndex = -1;
    let closeParenIndex = -1;
    let parenDepth = 0;
    // Look backwards for opening paren
    for (let i = index - 1; i >= 0; i--) {
      const char = src[i];
      if (char === ")") parenDepth++;
      else if (char === "(") {
        if (parenDepth === 0) {
          openParenIndex = i;
          break;
        } else {
          parenDepth--;
        }
      }
    }
    if (openParenIndex === -1) return false;
    // Look forwards for closing paren
    parenDepth = 0;
    for (let i = index + varName.length; i < src.length; i++) {
      const char = src[i];
      if (char === "(") parenDepth++;
      else if (char === ")") {
        if (parenDepth === 0) {
          closeParenIndex = i;
          break;
        } else {
          parenDepth--;
        }
      }
    }
    if (closeParenIndex === -1) return false;
    // Check what comes before the opening paren
    const beforeParen = src
      .substring(Math.max(0, openParenIndex - 20), openParenIndex)
      .trim();
    // Check what comes after the closing paren
    const afterParen = src
      .substring(
        closeParenIndex + 1,
        Math.min(src.length, closeParenIndex + 10)
      )
      .trim();
    // It's a function parameter if:
    // 1. Before paren: 'function' or 'function name'
    // 2. After paren: '=>' (arrow function)
    const isFunctionDeclaration = /\bfunction(?:\s+[a-zA-Z_$]\w*)?\s*$/.test(
      beforeParen
    );
    const isArrowFunction = afterParen.startsWith("=>");
    // ✅ IMPORTANT: Only return true if it's actually a parameter declaration
    // Variables used INSIDE function bodies should NOT be flagged as parameters
    if (isFunctionDeclaration || isArrowFunction) {
      // Double-check: make sure we're actually in the parameter list, not the body
      const paramSection = src.substring(openParenIndex + 1, closeParenIndex);
      // If there's a '=>' or '{' between the variable and the end, it's probably in the body
      const afterVar = src.substring(index + varName.length, closeParenIndex);
      if (afterVar.includes("=>") || afterVar.includes("{")) {
        return false; // It's in the function body, not parameters
      }
      return true;
    }
    return false;
  }
  isInDestructuringDeclaration(src, index, varName) {
    // Look backwards for destructuring patterns
    const before = src.substring(Math.max(0, index - 100), index);
    // Check for array destructuring: const [var] = ...
    const arrayMatch = before.match(/\b(?:const|let|var)\s+\[\s*[^\]]*$/);
    if (arrayMatch) {
      // Make sure we can find the closing bracket after this variable
      const after = src.substring(
        index + varName.length,
        Math.min(src.length, index + varName.length + 100)
      );
      if (/[^\]]*\]\s*=/.test(after)) {
        return true;
      }
    }
    // Check for object destructuring: const {var} = ...
    const objectMatch = before.match(/\b(?:const|let|var)\s+\{\s*[^}]*$/);
    if (objectMatch) {
      // Make sure we can find the closing brace after this variable
      const after = src.substring(
        index + varName.length,
        Math.min(src.length, index + varName.length + 100)
      );
      if (/[^}]*\}\s*=/.test(after)) {
        return true;
      }
    }
    return false;
  }
  hasInScopedContext(varName, hierarchy) {
    // Check scoped functions
    const scopedFn = this.getScopedFunction(varName, hierarchy);
    if (scopedFn) return true;
    // Check current component scope
    const scopedKey = hierarchy.join(".");
    const componentProps = this.getNested(this.props, scopedKey) || {};
    if (componentProps && varName in componentProps) return true;
    // *** IMPROVED: Check parent scopes more thoroughly ***
    for (let i = hierarchy.length - 1; i >= 0; i--) {
      const parentScope = hierarchy.slice(0, i);
      const parentScopeKey = parentScope.join(".");
      // Check parent scope functions
      const parentFn = this.getScopedFunction(varName, parentScope);
      if (parentFn) return true;
      // Check parent scope state/props
      const parentProps = parentScopeKey
        ? this.getNested(this.props, parentScopeKey)
        : this.props;
      if (
        parentProps &&
        typeof parentProps === "object" &&
        varName in parentProps
      ) {
        return true;
      }
      // *** NEW: Also check state hierarchy for this variable ***
      const possibleStateKey = parentScopeKey
        ? `${parentScopeKey}.${varName}`
        : varName;
      if (this._stateHierarchy.has(possibleStateKey)) {
        return true;
      }
    }
    return false;
  }
  _registerScopedFunction(hierarchyKey, name, fn) {
    if (!this._inlineModuleFns.has(hierarchyKey)) {
      this._inlineModuleFns.set(hierarchyKey, new Map());
    }
    // *** WRAP FUNCTION TO TRACK EXECUTION CONTEXT ***
    const wrappedFn = (...args) => {
      const previousScope = this._currentExecutionScope;
      this._currentExecutionScope = hierarchyKey;
      try {
        // *** FIXED: For setter functions, pass arguments directly ***
        if (name.startsWith("set") && args.length > 0) {
          return fn(args[0]); // Pass the first argument directly for setters
        }
        return fn(...args);
      } finally {
        this._currentExecutionScope = previousScope;
      }
    };
    this._inlineModuleFns.get(hierarchyKey).set(name, wrappedFn);
  }
  extractSetters(src) {
    const setters = [];
    const rx =
      /\[\s*([A-Za-z_$]\w*)\s*,\s*([A-Za-z_$]\w*)\s*\]\s*=\s*pphp\.(state|share)\(/g;
    let m;
    while ((m = rx.exec(src))) {
      const [, varName, setterName, fnKind] = m;
      if (fnKind === "share") this.markShared(varName);
      if (this._sharedStateMap.has(varName)) continue;
      setters.push(setterName);
    }
    return setters;
  }
  markShared(key) {
    this._sharedStateMap.add(key);
  }
  transformStateDeclarations(src) {
    /* — A. two-item destructuring: const [foo,setFoo] = pphp.state(…) */
    src = src.replace(
      /(\b(?:const|let|var)\s+\[\s*)([A-Za-z_$]\w*)\s*,\s*([A-Za-z_$]\w*)\s*(\]\s*=\s*pphp\.(?:state|share)\s*\(\s*)/g,
      (_m, pre, key, setter, post) => `${pre}${key}, ${setter}${post}'${key}', `
    );
    /* — B. single-item destructuring: const [foo] = pphp.state(…) */
    src = src.replace(
      /(\b(?:const|let|var)\s+\[\s*)([A-Za-z_$]\w*)(\s*\]\s*=\s*pphp\.(?:state|share)\s*\(\s*)/g,
      (_m, pre, key, post) => `${pre}${key}${post}'${key}', `
    );
    /* — C. simple assignment: const foo = pphp.state(…)               */
    src = src.replace(
      /(\b(?:const|let|var)\s+)([A-Za-z_$]\w*)(\s*=\s*pphp\.(?:state|share)\s*\(\s*)/g,
      (_m, pre, key, post) => `${pre}[${key}] = pphp.state('${key}', `
    );
    return src;
  }
  stripComments(source) {
    let code = "";
    let i = 0,
      inString = false,
      strChar = "",
      inBlock = false;
    while (i < source.length) {
      const ch = source[i],
        next = source[i + 1];
      /* 1 — entrar / salir de string -------------------------------- */
      if (
        !inBlock &&
        (ch === "'" || ch === '"' || ch === "`") &&
        source[i - 1] !== "\\"
      ) {
        inString = !inString; // cambia estado
        strChar = inString ? ch : "";
        code += ch;
        i++;
        continue;
      }
      if (inString) {
        code += ch;
        i++;
        continue;
      }
      /* 2 — comentario /* … *\/ ------------------------------------ */
      if (!inBlock && ch === "/" && next === "*") {
        inBlock = true;
        i += 2;
        continue;
      }
      if (inBlock) {
        if (ch === "*" && next === "/") {
          inBlock = false;
          i += 2;
        } else i++;
        continue;
      }
      /* 3 — comentario // … ---------------------------------------- */
      if (ch === "/" && next === "/") {
        // descarta hasta fin de línea
        while (i < source.length && source[i] !== "\n") i++;
        continue;
      }
      /* 4 — copia normal ------------------------------------------- */
      code += ch;
      i++;
    }
    return code;
  }
  flushBindings() {
    const touched = new Set(this._dirtyDeps);
    // *** CRITICAL: Update ALL bindings that match dependencies ***
    this._bindings.forEach((binding) => {
      let shouldUpdate = false;
      const bindingType = this.getBindingType(binding); // ✅ Get binding type first
      for (const dep of binding.dependencies) {
        for (const touchedPath of touched) {
          if (this.dependencyMatches(touchedPath, dep, bindingType)) {
            // ✅ Add bindingType parameter
            shouldUpdate = true;
            break;
          }
        }
        if (shouldUpdate) break;
      }
      if (shouldUpdate) {
        try {
          binding.update();
        } catch (err) {
          console.error("Binding update error:", err);
        }
      }
    });
    // Also update pending bindings
    this._pendingBindings.forEach((binding) => {
      try {
        binding.update();
      } catch (err) {
        console.error("Pending binding update error:", err);
      }
    });
    this._pendingBindings.clear();
    this._dirtyDeps.clear();
    this._updateScheduled = false;
    // *** ENHANCED: Update effects with proper dependency matching ***
    this._effects.forEach((effect) => {
      if (effect.__static) return;
      const deps = effect.__deps || new Set();
      const functionDeps = effect.__functionDeps || [];
      if (deps.size === 0 && functionDeps.length === 0) {
        try {
          effect();
        } catch (err) {
          console.error("effect error:", err);
        }
        return;
      }
      // Enhanced dependency matching for effects with STRICT matching
      const stringDepChanged = [...deps].some((dep) => {
        return [...touched].some((touchedPath) => {
          return this.dependencyMatches(touchedPath, dep, "effect"); // ✅ Add 'effect' type
        });
      });
      const hasFunctionDeps = functionDeps.length > 0;
      if (stringDepChanged || hasFunctionDeps) {
        try {
          effect();
        } catch (err) {
          console.error("effect error:", err);
        }
      }
    });
  }
  static ARRAY_INTRINSICS = (() => {
    const mutators = new Set([
      "push",
      "pop",
      "shift",
      "unshift",
      "splice",
      "sort",
      "reverse",
      "copyWithin",
      "fill",
    ]);
    return new Set(
      Object.getOwnPropertyNames(Array.prototype).filter(
        (name) => !mutators.has(name)
      )
    );
  })();
  static headMatch(full, head) {
    return full === head || full.startsWith(head + ".");
  }
  dependencyMatches(changedPath, dependencyPattern, bindingType = "binding") {
    /* 0. shared-state alias normalisation (unchanged) */
    const normalize = (p) => {
      if (p.startsWith("app.")) {
        const clean = p.slice(4);
        const root = clean.split(".")[0];
        if (PPHP._shared.has(root)) return clean;
      }
      return p;
    };
    const c = normalize(changedPath);
    const p = normalize(dependencyPattern);
    if (c === p || changedPath === dependencyPattern) return true;
    /* 1. broaden “arr.length / arr.join …” to “arr.*” */
    const parts = p.split(".");
    if (
      parts.length > 1 &&
      PPHP.ARRAY_INTRINSICS.has(parts.at(-1)) &&
      PPHP.headMatch(c, parts.slice(0, -1).join("."))
    ) {
      return true;
    }
    /* 2. delegate to the existing specialised rules */
    switch (bindingType) {
      case "effect":
        return this.matchEffectDependency(c, p);
      case "loop":
        if (PPHP.headMatch(c, p) || PPHP.headMatch(p, c)) return true;
        if (p.includes("*") || this.matchesArrayIndexPattern(c, p))
          return this.matchLoopDependency(c, p);
        return false;
      default: // 'binding'
        if (PPHP.headMatch(c, p)) return true;
        if (p.includes("*") || this.matchesArrayIndexPattern(c, p))
          return this.matchBindingDependency(c, p);
        return false;
    }
  }
  matchEffectDependency(changedPath, pattern) {
    // ✅ STRICT: Only match direct properties, not nested ones
    if (changedPath.startsWith(pattern + ".")) {
      // But make sure it's not triggering on sibling properties
      const remainingPath = changedPath.substring(pattern.length + 1);
      // Only trigger if we're watching the parent or it's a direct property change
      return !remainingPath.includes(".");
    }
    // Wildcard patterns for effects
    if (pattern.includes("*")) {
      return this.matchesWildcardPattern(changedPath, pattern);
    }
    return false;
  }
  matchLoopDependency(changedPath, pattern) {
    // ✅ BROAD: Match nested properties more liberally for loops
    if (
      changedPath.startsWith(pattern + ".") ||
      pattern.startsWith(changedPath + ".")
    ) {
      return true;
    }
    // ✅ ENHANCED: Special handling for array changes
    // If pattern is an array path and changedPath is an array item or property
    if (
      this.isArrayPath(pattern) &&
      this.isArrayItemPath(changedPath, pattern)
    ) {
      return true;
    }
    // Enhanced wildcard matching for loops
    if (pattern.includes("*")) {
      return this.matchesWildcardPattern(changedPath, pattern);
    }
    // Array index pattern matching
    return this.matchesArrayIndexPattern(changedPath, pattern);
  }
  // ✅ NEW: Helper methods for array path detection
  isArrayPath(path) {
    try {
      const value = this.getNested(this.props, path);
      return Array.isArray(value);
    } catch {
      return false;
    }
  }
  isArrayItemPath(changedPath, arrayPath) {
    // Check if changedPath is like arrayPath.0, arrayPath.1, etc.
    const pattern = new RegExp(
      `^${arrayPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.\\d+($|\\.)`
    );
    return pattern.test(changedPath);
  }
  matchBindingDependency(changedPath, pattern) {
    // ✅ BALANCED: More precise than loops, less strict than effects
    if (changedPath.startsWith(pattern + ".")) {
      const remainingPath = changedPath.substring(pattern.length + 1);
      // Allow one level of nesting for bindings
      return remainingPath.split(".").length <= 2;
    }
    // Wildcard pattern matching
    if (pattern.includes("*")) {
      return this.matchesWildcardPattern(changedPath, pattern);
    }
    // Array index pattern matching
    return this.matchesArrayIndexPattern(changedPath, pattern);
  }
  matchesWildcardPattern(changedPath, pattern) {
    const pathParts = changedPath.split(".");
    const patternParts = pattern.split(".");
    if (pathParts.length !== patternParts.length) return false;
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];
      if (patternPart === "*") continue;
      if (patternPart !== pathPart) return false;
    }
    return true;
  }
  matchesArrayIndexPattern(changedPath, pattern) {
    const pathParts = changedPath.split(".");
    const patternParts = pattern.split(".");
    if (pathParts.length !== patternParts.length) return false;
    for (let i = 0; i < patternParts.length; i++) {
      const pathPart = pathParts[i];
      const patternPart = patternParts[i];
      if (pathPart === patternPart) continue;
      // Both are numbers (array indices)
      if (/^\d+$/.test(pathPart) && /^\d+$/.test(patternPart)) {
        continue;
      }
      return false;
    }
    return true;
  }
  scheduleFlush() {
    if (this._updateScheduled) return;
    this._updateScheduled = true;
    requestAnimationFrame(() => {
      this._updateScheduled = false;
      this.flushBindings();
    });
  }
  getNested(obj, path) {
    return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
  }
  setNested(obj, path, value) {
    const parts = path.split(".");
    const last = parts.pop();
    const tgt = parts.reduce((o, k) => (o[k] ??= {}), obj);
    // *** NEW: Don't wrap primitive values in proxies ***
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      // Only make objects reactive if they're not already reactive
      if (!value.__isReactiveProxy) {
        tgt[last] = this.makeReactive(value, parts.concat(last));
      } else {
        tgt[last] = value;
      }
    } else {
      // For primitives and arrays, set directly
      tgt[last] = value;
    }
  }
  hasNested(obj, path) {
    return this.getNested(obj, path) !== undefined;
  }
  share(key, initial) {
    /* 0. sanity ------------------------------------------------------- */
    if (typeof key !== "string" || key.trim() === "") {
      throw new Error("PPHP.share: key must be a non-empty string.");
    }
    if (this._reservedWords.has(key)) {
      throw new Error(`'${key}' is reserved – choose another share key.`);
    }
    /* 1. reuse if it already exists ---------------------------------- */
    const cached = PPHP._shared.get(key);
    if (cached) return [cached.getter, cached.setter];
    /* 2. otherwise create normal state and cache it ------------------ */
    const [getter, setter] = this.state(key, initial);
    PPHP._shared.set(key, { getter, setter });
    return [getter, setter];
  }
  clearShare = (key) => {
    key ? PPHP._shared.delete(key) : PPHP._shared.clear();
  };
  state(key, initial) {
    /* 0. sanity checks ------------------------------------------------ */
    if (typeof key !== "string" || key.trim() === "") {
      throw new Error(
        "PPHP.state: missing or invalid key—make sure the build-time " +
          "injector rewrote your declaration to pphp.state('foo', 0)."
      );
    }
    if (arguments.length < 2) initial = undefined;
    if (this._reservedWords.has(key)) {
      throw new Error(`'${key}' is reserved – choose another state key.`);
    }
    /* 1. determine component scope ------------------------------------ */
    const hierarchy = this._currentProcessingHierarchy || ["app"];
    const scopedKey = this.generateScopedKey(hierarchy, key);
    // Store hierarchy info for debugging / dev-tools
    this._stateHierarchy.set(scopedKey, {
      originalKey: key,
      hierarchy: [...hierarchy],
      level: hierarchy.length,
    });
    /* 2. initialise exactly once per navigation ----------------------- */
    if (!this.hasNested(this.props, scopedKey)) {
      this.setNested(this.props, scopedKey, initial);
    }
    /* 3. getter + setter ---------------------------------------------- */
    const getter = () => this.getNested(this.props, scopedKey);
    const setter = (v) => {
      const prev = getter();
      const next = typeof v === "function" ? v(prev) : v;
      this.setNested(this.props, scopedKey, next);
      // mark dirty & flush
      this._dirtyDeps.add(scopedKey);
      if (next && typeof next === "object") {
        this.markNestedPropertiesDirty(scopedKey, next);
      }
      this.scheduleFlush();
    };
    /* 4. expose callable fn with `.value` convenience ----------------- */
    const fn = () => getter();
    Object.defineProperty(fn, "value", {
      get: () => getter(),
      set: (nv) => setter(nv),
    });
    Object.defineProperties(fn, {
      valueOf: { value: () => getter() },
      toString: { value: () => String(getter()) },
      __isReactiveProxy: { value: true, writable: false },
    });
    fn.__pphp_key = scopedKey;
    /* 5. if stored value is object / array, create enhanced proxy ------ */
    const stored = getter();
    if (stored === null || typeof stored !== "object") {
      return [fn, setter]; // primitive state
    }
    /* 6. proxy that lets us use dot-notation on the object itself ------ */
    const self = this;
    const proxyFn = new Proxy(fn, {
      apply(target, thisArg, args) {
        return Reflect.apply(target, thisArg, args);
      },
      get(target, prop, receiver) {
        if (prop === "value") return getter();
        if (prop === "__pphp_key") return scopedKey;
        if (prop === "__isReactiveProxy") return true;
        if (prop === "valueOf" || prop === "toString") {
          return Reflect.get(target, prop, receiver);
        }
        // — dot-notation access: return the actual value ---------------
        if (typeof prop === "string") {
          const currentObj = getter();
          if (currentObj && typeof currentObj === "object") {
            const hasOwn = Object.prototype.hasOwnProperty.call(
              currentObj,
              prop
            );
            const builtin =
              prop in target && typeof target[prop] !== "undefined";
            if (hasOwn || !builtin) {
              let val = currentObj[prop];
              // keep nested objects reactive
              if (val && typeof val === "object" && !val.__isReactiveProxy) {
                val = self.makeReactive(val, [...scopedKey.split("."), prop]);
              }
              return val; //  ⬅ NEW behaviour
            }
          }
        }
        // fall back to any helper props sitting on the function itself
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        const obj = getter();
        return obj && typeof obj === "object" ? obj[prop] : undefined;
      },
      set(_t, prop, value) {
        if (prop === "value") {
          setter(value);
          return true;
        }
        if (prop === "__isReactiveProxy") return true;
        const obj = getter();
        if (obj && typeof obj === "object") {
          obj[prop] = value;
          self._dirtyDeps.add(`${scopedKey}.${String(prop)}`);
          self.scheduleFlush();
        }
        return true;
      },
      has(_t, prop) {
        if (prop === "value" || prop === "__isReactiveProxy" || prop in fn) {
          return true;
        }
        const obj = getter();
        return obj && typeof obj === "object" && prop in obj;
      },
    });
    return [proxyFn, setter];
  }
  markNestedPropertiesDirty(baseKey, obj, visited = new WeakSet()) {
    if (!obj || typeof obj !== "object" || visited.has(obj)) return;
    visited.add(obj);
    Object.keys(obj).forEach((prop) => {
      const fullPath = `${baseKey}.${prop}`;
      this._dirtyDeps.add(fullPath);
      // Recursively mark nested objects (but limit depth to avoid infinite recursion)
      const value = obj[prop];
      if (value && typeof value === "object" && !visited.has(value)) {
        this.markNestedPropertiesDirty(fullPath, value, visited);
      }
    });
  }
  static _isBuiltIn = (() => {
    const cache = new Map();
    const prototypes = [
      Object.prototype,
      Function.prototype,
      Array.prototype,
      String.prototype,
      Number.prototype,
      Boolean.prototype,
      Date.prototype,
      RegExp.prototype,
      Map.prototype,
      Set.prototype,
      WeakMap.prototype,
      WeakSet.prototype,
      Error.prototype,
      Promise.prototype,
    ];
    return (name) => {
      const hit = cache.get(name);
      if (hit !== undefined) return hit;
      const found = name in globalThis || prototypes.some((p) => name in p);
      cache.set(name, found);
      return found;
    };
  })();
  extractDependencies(expr) {
    // Early exit for plain text that's not valid JavaScript
    const trimmed = expr.trim();
    // Use improved plain text detection
    if (this.isPlainText(trimmed)) {
      return new Set(); // No dependencies for plain text
    }
    // 1️⃣  normalize optional-chaining: foo?.bar → foo.bar
    let cleaned = expr.replace(/\?\./g, ".");
    // 2️⃣  collect arrow-function parameter names
    const paramNames = new Set();
    const arrowRx =
      /(?:^|[^\w$])(?:\(\s*([^)]*?)\s*\)|([A-Za-z_$][\w$]*))\s*=>/g;
    for (let m; (m = arrowRx.exec(cleaned)); ) {
      const list = (m[1] ?? m[2] ?? "")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      list.forEach((p) => paramNames.add(p));
    }
    // 3️⃣  collect classic function-expression params
    const funcRx = /function\s*(?:[A-Za-z_$][\w$]*\s*)?\(\s*([^)]*?)\s*\)/g;
    for (let m; (m = funcRx.exec(cleaned)); ) {
      m[1]
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .forEach((p) => paramNames.add(p));
    }
    // 4️⃣  inline all template-literals, properly handling nested `${…}` blocks
    const inlineTemplates = (src) => {
      let out = "";
      let i = 0;
      while (i < src.length) {
        if (src[i] === "`") {
          // skip literal text; only extract `${…}` expressions
          i++;
          while (i < src.length) {
            if (src[i] === "\\") {
              i += 2; // skip escapes
            } else if (src[i] === "$" && src[i + 1] === "{") {
              i += 2; // skip ${
              let depth = 1;
              const start = i;
              while (i < src.length && depth > 0) {
                if (src[i] === "{") depth++;
                else if (src[i] === "}") depth--;
                i++;
              }
              // grab the inside of this `${…}` and recurse
              const inner = src.slice(start, i - 1);
              out += inlineTemplates(inner) + " ";
            } else if (src[i] === "`") {
              i++; // end of this template-literal
              break;
            } else {
              i++;
            }
          }
        } else {
          out += src[i++];
        }
      }
      return out;
    };
    cleaned = inlineTemplates(cleaned);
    // 5️⃣  strip plain string literals '…' or "…"
    cleaned = cleaned.replace(/(['"])(?:\\.|[^\\])*?\1/g, "");
    // 6️⃣  strip RegExp literals /…/g
    cleaned = cleaned.replace(/\/(?:\\.|[^\/\\])+\/[gimsuy]*/g, "");
    // 7️⃣  grab identifiers and filter out locals & built-ins
    const deps = new Set();
    const idRx = /\b[A-Za-z_$]\w*(?:\.[A-Za-z_$]\w*)*\b/g;
    for (const tok of cleaned.match(idRx) ?? []) {
      const [root, ...rest] = tok.split(".");
      // • skip any parameter we collected
      if (paramNames.has(root)) continue;
      // • skip true prototype methods used alone (e.g. `.join`)
      if (
        rest.length === 0 &&
        PPHP._isBuiltIn(root) &&
        new RegExp(`\\.${root}\\b`).test(expr)
      ) {
        continue;
      }
      // • otherwise it’s a real external dependency
      deps.add(tok);
    }
    return deps;
  }
  isPlainText(expr) {
    const trimmed = expr.trim();
    // If it starts with quotes, it's already a string literal
    if (/^['"`]/.test(trimmed)) {
      return false;
    }
    // Check for JavaScript operators and syntax
    const jsPatterns = [
      /[+\-*/%=<>!&|?:]/, // operators
      /\.\w+/, // property access
      /\[\s*\w+\s*\]/, // array access
      /\(\s*[^)]*\s*\)/, // function calls or grouping
      /=>/, // arrow functions
      /\b(true|false|null|undefined|typeof|new|delete|void|in|of|instanceof)\b/, // keywords
      /\?\./, // optional chaining
      /\?\?/, // nullish coalescing
      /\.\.\./, // spread operator
      /\{[^}]*\}/, // object literals
      /\[[^\]]*\]/, // array literals
    ];
    // If it contains any JavaScript syntax, it's not plain text
    if (jsPatterns.some((pattern) => pattern.test(trimmed))) {
      return false;
    }
    // If it contains spaces but no JS syntax, it might be plain text
    // But also check if it's a valid identifier with spaces (unlikely but possible)
    if (trimmed.includes(" ")) {
      // If it's multiple words with no JS syntax, treat as plain text
      return !/\w+\.\w+/.test(trimmed) && !/\w+\[\w+\]/.test(trimmed);
    }
    // Single word without JS syntax - could be a variable name, so don't quote
    return false;
  }
  async initializeAllReferencedProps(root = document.body) {
    const mustacheRx = PPHP._mustachePattern;
    const mustacheChk = PPHP._mustacheTest;
    const props = this.props;
    const seenPaths = new Set();
    /* 1️⃣  scan attributes with component context ------------------- */
    this.qsa(root, "*").forEach((el) => {
      // *** NEW: Get element's component hierarchy ***
      const elementHierarchy = this.detectElementHierarchy(el);
      for (const { name, value } of Array.from(el.attributes)) {
        if (!value) continue;
        /* {{ mustache }} inside attribute value */
        if (mustacheChk.test(value)) {
          for (const m of value.matchAll(mustacheRx)) {
            // *** NEW: Use scoped dependency extraction ***
            this.extractScopedDependencies(m[1], elementHierarchy).forEach(
              (dep) => seenPaths.add(dep)
            );
          }
        }
        /* structural directives */
        if (
          name === "pp-if" ||
          name === "pp-elseif" ||
          name.startsWith("pp-bind")
        ) {
          // *** NEW: Use scoped dependency extraction ***
          this.extractScopedDependencies(value, elementHierarchy).forEach(
            (dep) => seenPaths.add(dep)
          );
        }
      }
    });
    /* 2️⃣  scan mustache in text nodes with component context ------- */
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) =>
        mustacheChk.test(n.nodeValue ?? "")
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    });
    while (true) {
      const txt = walker.nextNode();
      if (!txt) break;
      // *** NEW: Get text node's component hierarchy ***
      const textElement = txt.parentElement;
      if (!textElement) continue;
      const elementHierarchy = this.detectElementHierarchy(textElement);
      for (const m of txt.nodeValue.matchAll(mustacheRx)) {
        // *** NEW: Use scoped dependency extraction ***
        this.extractScopedDependencies(m[1], elementHierarchy).forEach((dep) =>
          seenPaths.add(dep)
        );
      }
    }
    /* 3️⃣  materialise every collected SCOPED path in props --------- */
    const sorted = Array.from(seenPaths).sort(
      (a, b) => b.split(".").length - a.split(".").length // longest first
    );
    for (const path of sorted) {
      const keys = path.split(".");
      let cur = props;
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const isLeaf = i === keys.length - 1;
        const currentPath = keys.slice(0, i + 1).join(".");
        /* create missing branch (but don't stomp on existing state) */
        if (
          !(k in cur) ||
          (!isLeaf && (cur[k] == null || typeof cur[k] !== "object"))
        ) {
          // *** MODIFIED: Check against state hierarchy instead of _declaredStateRoots ***
          const existingState = this._stateHierarchy.has(currentPath);
          if (!(isLeaf && existingState)) {
            cur[k] = isLeaf ? undefined : {};
          }
        }
        cur = cur[k];
      }
    }
  }
  setNestedProperty(obj, path, value) {
    const keys = path.split(".");
    let current = obj;
    // Traverse to the appropriate nested object.
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {}; // Create an object if it doesn't exist.
      }
      current = current[keys[i]];
    }
    // Set the final property.
    current[keys[keys.length - 1]] = value;
  }
  // TODO: Reactivity End
  async attachWireFunctionEvents() {
    /* 1. simple housekeeping ---------------------------------------- */
    this.handleHiddenAttribute();
    this.handleAnchorTag();
    /* 2. selector: every element that still carries an “on...” attr -- */
    const selector = Array.from(this._eventHandlers)
      .map((evt) => `[${evt}]`) // [onclick] [onchange] ...
      .join(",");
    const elements = this.qsa(document.body, selector);
    for (const el of elements) {
      for (const fullOnName of this._eventHandlers) {
        /* raw inline handler body ----------------------------------- */
        const raw = el.getAttribute(fullOnName);
        if (!raw) continue;
        const decoded = this.decodeEntities(raw).trim();
        if (!decoded) {
          el.removeAttribute(fullOnName);
          continue;
        }
        /* build + unwrap → single JS body --------------------------- */
        const body = this.unwrapArrowBody(
          this.buildHandlerFromRawBody(decoded)
        );
        const arrow = `(event) => { ${body} }`;
        /* tidy: strip attribute from DOM ---------------------------- */
        el.removeAttribute(fullOnName);
        /* wire ------------------------------------------------------ */
        const evtType = fullOnName.slice(2); // "click", "input", ...
        el.removeAllEventListeners(evtType); // clear older listeners
        if (el instanceof HTMLInputElement) {
          this.handleInputAppendParams(el, evtType);
        }
        this.handleDebounce(el, evtType, arrow);
      }
    }
    /* 3. re-enable any wheel/passive stashes ------------------------ */
    this.handlePassiveWheelStashes(document);
    return Promise.resolve();
  }
  decodeEntities = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    // ① primera pasada
    let out = txt.value;
    // ② si venía doblemente escapado (&amp;amp;), repite hasta que no cambie
    while (out.includes("&")) {
      txt.innerHTML = out;
      const next = txt.value;
      if (next === out) break;
      out = next;
    }
    return out;
  };
  unwrapArrowBody = (code) => {
    if (!code.trim()) return "";
    // a) match () => { … }
    const braceMatch = code.match(
      /^\s*(?:\([\w\s,]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{([\s\S]*)\}\s*$/
    );
    if (braceMatch) {
      let inner = braceMatch[1].trim();
      // Ensure it ends with semicolon
      if (inner && !inner.endsWith(";")) {
        inner += ";";
      }
      return inner;
    }
    // b) match single‐expr arrow "() => doSomething()"
    const arrowMatch = code.match(
      /^\s*(?:\([\w\s,]*\)|[A-Za-z_$][\w$]*)\s*=>\s*/
    );
    if (arrowMatch) {
      let inner = code.substring(arrowMatch[0].length).trim();
      // Ensure it ends with semicolon
      if (inner && !inner.endsWith(";")) {
        inner += ";";
      }
      return inner;
    }
    // c) fallback (no "=>"), return verbatim with semicolon
    let result = code.trim();
    if (result && !result.endsWith(";")) {
      result += ";";
    }
    return result;
  };
  buildHandlerFromRawBody(raw) {
    /* 0️⃣  PHP style calls  → await pphp.handleParsedCallback(...) ---- */
    let code = raw.trim();
    // Instance methods   Foo->bar(arg1, arg2)
    code = code.replace(
      /([A-Za-z_$][\w$]*)->([A-Za-z_$][\w$]*)\s*\(\s*([^)]*?)\s*\)/g,
      (_, cls, mtd, args) => {
        const callText = `${cls}->${mtd}(${args.trim()})`;
        return `await pphp.handleParsedCallback(this, ${JSON.stringify(
          callText
        )}, event);`;
      }
    );
    // Static methods     Foo::baz(arg1, arg2)
    code = code.replace(
      /([A-Za-z_$][\w$]*)::([A-Za-z_$][\w$]*)\s*\(\s*([^)]*?)\s*\)/g,
      (_, cls, mtd, args) => {
        const callText = `${cls}::${mtd}(${args.trim()})`;
        return `await pphp.handleParsedCallback(this, ${JSON.stringify(
          callText
        )}, event);`;
      }
    );
    /* 1️⃣  Ensure arrow-function syntax + capture original param ------ */
    const { normalized, originalParam } = this.normalizeToArrow(code);
    /* 2️⃣  Rename param to “event” (if it was something else) ---------- */
    const renamed = this.renameEventParam(normalized, originalParam);
    /* 3️⃣  Re-route `this.` references to `event.target.` -------------- */
    const thisSafe = this.replaceThisReferences(renamed);
    /* 4️⃣  No more identifier prefixing (single global namespace) ----- */
    return thisSafe;
  }
  replaceThisReferences(code) {
    // Replace this.property with event.target.property
    // Use word boundary to avoid replacing parts of other words
    return code.replace(/\bthis\./g, "event.target.");
  }
  normalizeToArrow(raw) {
    const arrowSigMatch = raw.match(
      /^\s*(?:\([\w\s,]*\)|[A-Za-z_$][\w$]*)\s*=>/
    );
    if (!arrowSigMatch) {
      return { normalized: `() => { ${raw} }`, originalParam: null };
    }
    const signature = arrowSigMatch[0];
    const inside = signature.replace(/\s*=>\s*$/, "").trim();
    const plain = inside.replace(/^\(|\)$/g, "").trim();
    const originalParam = /^[A-Za-z_$]\w*$/.test(plain) ? plain : null;
    return { normalized: raw, originalParam };
  }
  renameEventParam(body, originalParam) {
    if (!originalParam || originalParam === "event") return body;
    // Create a more precise regex that avoids false matches
    const paramRe = new RegExp(`\\b${this.escapeRegex(originalParam)}\\b`, "g");
    return body.replace(paramRe, (match, offset, string) => {
      // Additional safety check - don't replace if it's part of a larger identifier
      const beforeChar = string[offset - 1];
      const afterChar = string[offset + match.length];
      if (
        (beforeChar && /[\w$]/.test(beforeChar)) ||
        (afterChar && /[\w$]/.test(afterChar))
      ) {
        return match; // Don't replace
      }
      return "event";
    });
  }
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  async handleDebounce(element, eventType, originalHandler) {
    /* 1️⃣  read helper attributes once -------------------------------- */
    const debounceAttr = element.getAttribute("pp-debounce");
    const wait = debounceAttr ? this.parseTime(debounceAttr) : 0;
    const beforeHook = element.getAttribute("pp-before-request") ?? "";
    const afterHook = element.getAttribute("pp-after-request") ?? "";
    const cancelable = PPHP._cancelableEvents;
    /* 2️⃣  build the combined handler -------------------------------- */
    const runHandler = async (evt) => {
      if (cancelable.has(eventType) && evt.cancelable) {
        evt.preventDefault();
      }
      try {
        if (beforeHook) await this.invokeHandler(element, beforeHook, evt);
        await this.invokeHandler(element, originalHandler, evt);
        if (afterHook && !afterHook.startsWith("@close")) {
          await this.invokeHandler(element, afterHook, evt);
        }
        this.handlerAutofocusAttribute();
      } catch (err) {
        console.error("Error in debounced handler:", err);
      }
    };
    /* 3️⃣  listener options ------------------------------------------ */
    const listenerOpts = {
      passive: PPHP._passiveEvents.has(eventType) && !cancelable.has(eventType),
    };
    /* 4️⃣  timer key for shared registry ----------------------------- */
    const timerKey = `${eventType}::${element.__pphpId || element.tagName}`;
    /* 5️⃣  debounce wrapper ------------------------------------------ */
    const wrapper = (evt) => {
      if (wait > 0) {
        const existing = PPHP._debounceTimers.get(timerKey);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
          PPHP._debounceTimers.delete(timerKey);
          runHandler(evt);
        }, wait);
        PPHP._debounceTimers.set(timerKey, timer);
      } else {
        runHandler(evt);
      }
    };
    /* 6️⃣  install the listener -------------------------------------- */
    if (element instanceof HTMLFormElement && eventType === "submit") {
      element.addEventListener(
        "submit",
        (evt) => {
          if (evt.cancelable) evt.preventDefault();
          wrapper(evt);
        },
        listenerOpts
      );
    } else {
      element.addEventListener(eventType, wrapper, listenerOpts);
    }
  }
  debounce(func, wait = 300, immediate = false) {
    let timeout;
    return function (...args) {
      const context = this;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        if (!immediate) func.apply(context, args);
      }, wait);
      if (immediate && !timeout) {
        func.apply(context, args);
      }
    };
  }
  handlerAutofocusAttribute() {
    // 1) if there’s an open dialog, focus inside it first
    const openDialog = document.querySelector("dialog[open]");
    let el = null;
    if (openDialog) {
      // find the pp-autofocus inside that open dialog
      el = openDialog.querySelector("[pp-autofocus]");
    }
    // 2) otherwise fall back to the first on the page
    if (!el) {
      el = document.querySelector("[pp-autofocus]");
    }
    if (!el) return;
    // parse your config as before…
    const raw = el.getAttribute("pp-autofocus");
    if (!this.isJsonLike(raw)) return;
    const config = this.parseJson(raw);
    requestAnimationFrame(() => {
      el.focus();
      if (
        (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) &&
        typeof this.setCursorPosition === "function"
      ) {
        if (el instanceof HTMLInputElement && el.type === "number") {
          el.type = "text";
          this.setCursorPosition(el, config);
          el.type = "number";
        } else {
          this.setCursorPosition(el, config);
        }
      }
    });
  }
  async invokeHandler(element, handler, event) {
    try {
      const trimmedHandler = handler.trim();
      // Check cache first
      let parsedHandler = this._handlerCache.get(trimmedHandler);
      if (!parsedHandler) {
        parsedHandler = this.parseHandler(trimmedHandler);
        this._handlerCache.set(trimmedHandler, parsedHandler);
      }
      // Execute based on parsed type
      await this.executeHandler(parsedHandler, element, event, trimmedHandler);
    } catch (error) {
      this.handleInvokeError(error, handler, element);
    } finally {
      this.scheduleFlush();
    }
  }
  parseHandler(handler) {
    // Remove comments and normalize whitespace
    const normalized = handler
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .trim();
    // Check for arrow function (most common case first)
    if (this.isArrowFunction(normalized)) {
      return this.parseArrowFunction(normalized);
    }
    // Check for function call
    const callMatch = normalized.match(/^(\w+(?:\.\w+)*)\s*\(\s*(.*?)\s*\)$/s);
    if (callMatch) {
      return {
        type: "call",
        name: callMatch[1],
        args: callMatch[2],
        isAsync: this.isAsyncFunction(callMatch[1]),
      };
    }
    // Check for simple identifier
    const simpleMatch = normalized.match(/^(\w+)$/);
    if (simpleMatch) {
      return {
        type: "simple",
        name: simpleMatch[1],
        isAsync: this.isAsyncFunction(simpleMatch[1]),
      };
    }
    // Complex expression
    return {
      type: "complex",
      body: normalized,
      isAsync: false,
    };
  }
  isArrowFunction(handler) {
    // Look for => but exclude it if it's in strings
    let inString = false;
    let stringChar = "";
    let depth = 0;
    for (let i = 0; i < handler.length - 1; i++) {
      const char = handler[i];
      const next = handler[i + 1];
      if (!inString && (char === '"' || char === "'" || char === "`")) {
        inString = true;
        stringChar = char;
        continue;
      }
      if (inString && char === stringChar && handler[i - 1] !== "\\") {
        inString = false;
        stringChar = "";
        continue;
      }
      if (!inString) {
        if (char === "(") depth++;
        if (char === ")") depth--;
        if (char === "=" && next === ">" && depth >= 0) {
          return true;
        }
      }
    }
    return false;
  }
  parseArrowFunction(handler) {
    const arrowIndex = this.findArrowIndex(handler);
    let body = handler.substring(arrowIndex + 2).trim();
    if (body.startsWith("{") && body.endsWith("}")) {
      body = body.slice(1, -1).trim();
    }
    return {
      type: "arrow",
      body,
      isAsync: handler.includes("async") || this.containsAwait(body),
    };
  }
  findArrowIndex(handler) {
    let inString = false;
    let stringChar = "";
    for (let i = 0; i < handler.length - 1; i++) {
      const char = handler[i];
      const next = handler[i + 1];
      if (!inString && (char === '"' || char === "'" || char === "`")) {
        inString = true;
        stringChar = char;
        continue;
      }
      if (inString && char === stringChar && handler[i - 1] !== "\\") {
        inString = false;
        continue;
      }
      if (!inString && char === "=" && next === ">") {
        return i;
      }
    }
    return -1;
  }
  async executeArrowHandler(parsed, element, event) {
    const statements = this.parseStatements(parsed.body);
    let hasHandledStatements = false;
    for (const statement of statements) {
      if (await this.executeSingleStatement(statement, element, event)) {
        hasHandledStatements = true;
      }
    }
    if (!hasHandledStatements) {
      // Fall back to dynamic execution
      await this.executeDynamic(parsed.body, element, event);
    }
  }
  async executeComplexHandler(parsed, element, event) {
    await this.executeDynamic(parsed.body, element, event);
  }
  parseStatements(body) {
    const statements = [];
    let current = "";
    let depth = 0;
    let inString = false;
    let stringChar = "";
    for (let i = 0; i < body.length; i++) {
      const char = body[i];
      if (!inString && (char === '"' || char === "'" || char === "`")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && body[i - 1] !== "\\") {
        inString = false;
        stringChar = "";
      }
      if (!inString) {
        if (char === "(" || char === "{" || char === "[") depth++;
        if (char === ")" || char === "}" || char === "]") depth--;
        if (char === ";" && depth === 0) {
          if (current.trim()) {
            statements.push(current.trim());
            current = "";
          }
          continue;
        }
      }
      current += char;
    }
    if (current.trim()) {
      statements.push(current.trim());
    }
    return statements;
  }
  async executeInlineModule(fnName, args, element, event, originalExpr) {
    // If no arguments, call handleParsedCallback instead of direct inline module call
    if (!args || !args.trim()) {
      await this.handleParsedCallback(element, originalExpr, event);
      return;
    }
    if (this.isJsonLike(args)) {
      const parsed = this.parseJson(args);
      if (parsed !== null && typeof parsed === "object") {
        await this.callInlineModule(fnName, { ...parsed });
      } else {
        await this.callInlineModule(fnName, parsed);
      }
    } else {
      try {
        // *** NEW: Use scoped context ***
        const elementHierarchy = this.detectElementHierarchy(element);
        const scopedContext = this._createScopedPropsContext(elementHierarchy);
        const evaluator = this.makeScopedEvaluator(args, elementHierarchy);
        const value = evaluator(scopedContext);
        await this.callInlineModule(fnName, value);
      } catch {
        await this.callInlineModule(fnName, { element, event });
      }
    }
  }
  async executeSingleStatement(statement, element, event) {
    const trimmed = statement.trim();
    if (!trimmed) return false;
    // 1) Nested arrow
    const nestedMatch = trimmed.match(/^\(\s*\)\s*=>\s*(.+)$/);
    if (nestedMatch) {
      return this.executeSingleStatement(nestedMatch[1], element, event);
    }
    // 2) Complex statements
    const isComplex =
      /^\s*(if|for|while|switch|try|return|throw|var|let|const|function|class)\b/.test(
        trimmed
      );
    if (isComplex) {
      await this.executeDynamic(trimmed, element, event);
      return true;
    }
    const callMatch = trimmed.match(/^(\w+)\s*\(\s*(.*?)\s*\)$/s);
    if (callMatch) {
      const [, fnName, rawArgs] = callMatch;
      const elementHierarchy = this.detectElementHierarchy(element);
      const resolvedName = this.resolveFunctionName(fnName, elementHierarchy);
      const needArgs = rawArgs.trim() !== "";
      let argsArray = [];
      if (needArgs) {
        try {
          argsArray = JSON5.parse(`[${rawArgs}]`);
        } catch {
          try {
            const scopedContext =
              this._createScopedPropsContext(elementHierarchy);
            const proxy = this.getOrCreateProxy(scopedContext);
            const usesEvent = /\bevent\b/.test(rawArgs);
            const argExpr = usesEvent
              ? rawArgs.replace(/\bevent\b/g, "_evt")
              : rawArgs;
            const evalArgs = new Function(
              "_evt",
              "proxy",
              "props",
              `with (proxy) { return [ ${argExpr} ]; }`
            );
            argsArray = evalArgs(event, proxy, scopedContext);
          } catch (err) {
            argsArray = [];
          }
        }
      }
      // 3a) Inline-module → keep rawArgs, let executeInlineModule parse it
      if (resolvedName) {
        const fn = this.getScopedFunction(resolvedName, elementHierarchy);
        if (fn) {
          if (argsArray.length > 0) {
            await fn(...argsArray);
          } else {
            await this.executeInlineModule(
              resolvedName,
              rawArgs,
              element,
              event,
              trimmed
            );
          }
          return true;
        }
      }
      // 3b) Global function
      if (resolvedName) {
        const globalFn = globalThis[resolvedName];
        if (typeof globalFn === "function") {
          globalFn.apply(globalThis, argsArray);
          return true;
        }
      }
      // 3c) Server fallback
      await this.handleParsedCallback(element, trimmed, event);
      return true;
    }
    // 4) Simple fn reference
    const simpleMatch = trimmed.match(/^(\w+)$/);
    if (simpleMatch) {
      const fnName = simpleMatch[1];
      const elementHierarchy = this.detectElementHierarchy(element);
      const resolvedName = this.resolveFunctionName(fnName, elementHierarchy);
      if (resolvedName) {
        const fn = this.getScopedFunction(resolvedName, elementHierarchy);
        if (fn) {
          await this.handleParsedCallback(element, `${resolvedName}()`, event);
          return true;
        }
      }
      if (resolvedName) {
        const globalFn = globalThis[resolvedName];
        if (typeof globalFn === "function") {
          globalFn.call(globalThis, event);
          return true;
        }
      }
      await this.handleParsedCallback(element, `${fnName}()`, event);
      return true;
    }
    // 5) Fallback to dynamic
    await this.executeDynamic(trimmed, element, event);
    return true;
  }
  async executeCallHandler(parsed, element, event, originalHandler) {
    const { name, args } = parsed;
    // *** Get element hierarchy for scoped lookup ***
    const elementHierarchy = this.detectElementHierarchy(element);
    const resolvedName = this.resolveFunctionName(name, elementHierarchy);
    if (resolvedName) {
      // *** Check scoped inline modules first ***
      const scopedFn = this.getScopedFunction(resolvedName, elementHierarchy);
      if (scopedFn) {
        await this.executeInlineModule(
          resolvedName,
          args || "",
          element,
          event,
          originalHandler
        );
        return;
      }
      // Check global functions
      const globalFn = globalThis[resolvedName];
      if (typeof globalFn === "function") {
        await this.executeGlobalFunction(globalFn, args || "", element, event);
        return;
      }
    }
    // Fall back to server callback
    await this.handleParsedCallback(element, originalHandler, event);
  }
  resolveFunctionName(fnName, elementHierarchy) {
    // If we have element hierarchy, try scoped lookup first
    if (elementHierarchy) {
      // Try current scope and walk up the hierarchy
      for (let i = elementHierarchy.length; i >= 0; i--) {
        const scopeKey = elementHierarchy.slice(0, i).join(".");
        const scopedFns = this._inlineModuleFns.get(scopeKey);
        if (scopedFns && scopedFns.has(fnName)) {
          return fnName; // Found in this scope
        }
      }
    }
    // Fallback to global scope
    if (typeof globalThis[fnName] === "function") {
      return fnName;
    }
    return null;
  }
  async executeSimpleHandler(parsed, element, event) {
    const { name } = parsed;
    const elementHierarchy = this.detectElementHierarchy(element);
    // Resolve the function name with fallback logic
    const resolvedName = this.resolveFunctionName(name, elementHierarchy);
    if (resolvedName) {
      // Check scoped inline modules - call handleParsedCallback for consistency
      const fn = this.getScopedFunction(resolvedName, elementHierarchy);
      if (fn) {
        await this.handleParsedCallback(element, `${resolvedName}()`, event);
        return;
      }
      // Check global functions
      const globalFn = globalThis[resolvedName];
      if (typeof globalFn === "function") {
        globalFn.call(globalThis, event);
        return;
      }
    }
    // Fall back to server callback
    await this.handleParsedCallback(element, `${name}()`, event);
  }
  async executeHandler(parsed, element, event, originalHandler) {
    switch (parsed.type) {
      case "arrow":
        await this.executeArrowHandler(parsed, element, event);
        break;
      case "call":
        await this.executeCallHandler(parsed, element, event, originalHandler);
        break;
      case "simple":
        await this.executeSimpleHandler(parsed, element, event);
        break;
      case "complex":
        await this.executeComplexHandler(parsed, element, event);
        break;
      default:
        await this.handleParsedCallback(element, originalHandler, event);
    }
  }
  async executeGlobalFunction(globalFn, args, element, event) {
    if (!args.trim()) {
      globalFn.call(globalThis, event);
      return;
    }
    if (this.isJsonLike(args)) {
      const parsed = this.parseJson(args) ?? {};
      globalFn.call(globalThis, { ...parsed });
    } else {
      // *** NEW: Use scoped context ***
      const elementHierarchy = this.detectElementHierarchy(element);
      const scopedContext = this._createScopedPropsContext(elementHierarchy);
      const proxy = this.getOrCreateProxy(scopedContext);
      const executor = new Function(
        "event",
        "proxy",
        "props",
        "fn",
        `with (proxy) { return fn(${args}); }`
      );
      executor.call(element, event, proxy, scopedContext, globalFn);
    }
  }
  async executeDynamic(code, element, event) {
    // *** NEW: Get element's component hierarchy ***
    const elementHierarchy = this.detectElementHierarchy(element);
    // *** CHANGED: Create scoped context instead of using raw props ***
    const scopedContext = this._createScopedPropsContext(elementHierarchy);
    const proxy = this.getOrCreateProxy(scopedContext);
    /* Always run as statement(s) inside a `with (proxy)` block so the
       user can reference reactive state keys directly.                */
    const executor = new PPHP.AsyncFunction(
      "event",
      "proxy",
      "props",
      `
    with (proxy) {
      ${code}
    }`
    );
    try {
      await executor.call(element, event, proxy, scopedContext);
    } finally {
      // Ensure bindings are updated after any property changes
      this.scheduleFlush();
    }
  }
  static AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
  getOrCreateEvaluator(expr) {
    let evaluator = this._evaluatorCache.get(expr);
    if (!evaluator) {
      evaluator = this.makeSafeEvaluator(expr);
      this._evaluatorCache.set(expr, evaluator);
    }
    return evaluator;
  }
  getOrCreateProxy(source) {
    let proxy = this._handlerProxyCache.get(source);
    if (!proxy) {
      proxy = this.createHandlerProxy(source);
      this._handlerProxyCache.set(source, proxy);
    }
    return proxy;
  }
  createHandlerProxy(base) {
    const elementHierarchy = this._currentProcessingHierarchy || ["app"];
    // Define native functions that need special handling
    const nativeFunctions = {
      alert: window.alert.bind(window),
      confirm: window.confirm.bind(window),
      prompt: window.prompt.bind(window),
      console: window.console,
      setTimeout: window.setTimeout.bind(window),
      setInterval: window.setInterval.bind(window),
      clearTimeout: window.clearTimeout.bind(window),
      clearInterval: window.clearInterval.bind(window),
      fetch: window.fetch.bind(window),
    };
    return new Proxy(base, {
      get: (target, prop, receiver) => {
        if (typeof prop === "string") {
          // Check for native functions first
          if (nativeFunctions.hasOwnProperty(prop)) {
            return nativeFunctions[prop];
          }
          // Check scoped inline modules
          const scopedFn = this.getScopedFunction(prop, elementHierarchy);
          if (scopedFn) {
            return scopedFn;
          }
          // Check target properties
          if (prop in target) {
            const value = Reflect.get(target, prop, receiver);
            const globalValue = globalThis[prop];
            // Skip placeholder values
            const isPlaceholder =
              value == null ||
              (typeof value === "object" && Object.keys(value).length === 0) ||
              (PPHP._isBuiltIn(prop) && typeof value !== typeof globalValue);
            if (!isPlaceholder) return value;
          }
          // Check global scope (but not for functions we've already handled)
          if (prop in globalThis && !nativeFunctions.hasOwnProperty(prop)) {
            const global = globalThis[prop];
            return typeof global === "function" && /^[a-z]/.test(prop)
              ? global.bind(globalThis)
              : global;
          }
        }
        return Reflect.get(target, prop, receiver);
      },
      set: (target, prop, value, receiver) => {
        return Reflect.set(target, prop, value, receiver);
      },
      has: (target, prop) => {
        if (typeof prop === "string") {
          const elementHierarchy = this._currentProcessingHierarchy || ["app"];
          return (
            nativeFunctions.hasOwnProperty(prop) ||
            !!this.getScopedFunction(prop, elementHierarchy) ||
            prop in target ||
            prop in globalThis
          );
        }
        return prop in target || prop in globalThis;
      },
    });
  }
  isAsyncFunction(name) {
    const fn = this._inlineModuleFns.get(name) || globalThis[name];
    return (
      fn &&
      (fn.constructor.name === "AsyncFunction" ||
        fn.toString().includes("async "))
    );
  }
  containsAwait(code) {
    return /\bawait\s+/.test(code);
  }
  handleInvokeError(error, handler, element) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const elementInfo = element.tagName + (element.id ? `#${element.id}` : "");
    console.error(
      `Handler execution failed on ${elementInfo}:\n` +
        `Handler: "${handler}"\n` +
        `Error: ${errorMsg}`,
      error
    );
    // Optional: Emit custom event for error handling
    element.dispatchEvent(
      new CustomEvent("pphp:handler-error", {
        detail: { handler, error, element },
        bubbles: true,
      })
    );
  }
  clearHandlerCaches() {
    this._handlerCache.clear();
    this._evaluatorCache.clear();
    // Note: Don't clear _handlerProxyCache as it uses WeakMap and will auto-cleanup
  }
  async handleParsedCallback(element, handler, event) {
    /* 1️⃣  parse "Foo->bar({x:1})" → { funcName, data } -------------- */
    const { funcName, data } = this.parseCallback(element, handler);
    if (!funcName) return;
    /* 2️⃣  names may come back as array (fallback list) -------------- */
    const names = Array.isArray(funcName) ? funcName : [funcName];
    const elementHierarchy = this.detectElementHierarchy(element);
    /* 3️⃣  try to resolve the function locally ----------------------- */
    let targetFunc;
    for (const name of names) {
      // Check scoped inline modules first
      const scopedFn = this.getScopedFunction(name, elementHierarchy);
      if (scopedFn) {
        targetFunc = scopedFn;
        break;
      }
      if (typeof this[name] === "function") {
        targetFunc = this[name];
        break;
      }
      if (typeof window[name] === "function") {
        targetFunc = window[name];
        break;
      }
    }
    /* 4️⃣  invoke if found ------------------------------------------ */
    if (targetFunc) {
      const isAfter = element.hasAttribute("pp-after-request");
      const willCloseAfterReq =
        element.getAttribute("pp-after-request") === "@close";
      const args = Array.isArray(data.args) ? data.args : [];
      let params = { args, element, data, event };
      if (isAfter && !willCloseAfterReq) {
        const resp = this._responseData
          ? this.parseJson(this._responseData)
          : { response: this._responseData };
        params = { ...params, ...resp };
      }
      await targetFunc.call(this, params);
      return;
    }
    /* 5️⃣  otherwise: wire-to-backend ------------------------------- */
    this._responseData = null;
    this._responseData = await this.handleUndefinedFunction(
      element,
      Array.isArray(funcName) ? funcName[0] : funcName,
      data
    );
  }
  async handleUndefinedFunction(element, funcName, data) {
    const encryptedFuncName = await this.encryptCallbackName(funcName);
    const body = { callback: encryptedFuncName, ...data };
    const firstFetchOptions = this.createFetchOptions(body);
    const secondFetchOptions = this.createFetchOptions({
      secondRequestC69CD: true,
      ...this.getUrlParams(),
    });
    try {
      this.saveElementOriginalState(element);
      this.handleSuspenseElement(element);
      const url = new URL(window.location.href);
      let firstResponseText = "";
      let firstResponseJSON = "";
      let jsonResponse = { success: false };
      const fileUpload = element.querySelector("input[type='file']");
      if (fileUpload) {
        // Instead of only sending the file, pass the additional data as well.
        firstResponseText = await this.fetchFileWithData(
          url.href,
          funcName,
          fileUpload,
          data
        );
        firstResponseJSON = this.extractJson(firstResponseText) || "";
        // Continue processing response as usual...
        if (firstResponseJSON) {
          try {
            jsonResponse = this.parseJson(firstResponseJSON);
          } catch (error) {
            console.error(
              `Error parsing JSON response. Please ensure the response is in valid JSON format.`,
              error
            );
          }
        }
      } else {
        const firstResponse = await this.fetch(url.href, firstFetchOptions);
        firstResponseText = await firstResponse.text();
        if (this.getRedirectUrl(firstResponseText)) {
          await this.redirect(this.getRedirectUrl(firstResponseText) || "");
          return;
        }
        firstResponseJSON = this.extractJson(firstResponseText) || "";
        if (firstResponseJSON) {
          try {
            jsonResponse = this.parseJson(firstResponseJSON);
          } catch (error) {
            console.error(
              `Error parsing JSON response. Please ensure the response is in valid JSON format.`,
              error
            );
          }
        }
      }
      const beforeRequestAttribute =
        element.getAttribute("pp-before-request") || "";
      const afterRequestAttribute =
        element.getAttribute("pp-after-request") || "";
      if (
        beforeRequestAttribute ||
        (afterRequestAttribute && jsonResponse.success)
      ) {
        this.restoreSuspenseElement(element);
      }
      if (beforeRequestAttribute || afterRequestAttribute) {
        let contentToAppend = "";
        if (jsonResponse.success) {
          const remainder = firstResponseText.replace(firstResponseJSON, "");
          contentToAppend = remainder;
        } else {
          contentToAppend = firstResponseText;
        }
        this.appendAfterbegin(contentToAppend);
        if (!afterRequestAttribute && !jsonResponse.success) return;
      }
      if (afterRequestAttribute && jsonResponse.success) {
        this.handleAfterRequest(afterRequestAttribute, firstResponseJSON);
        const remainder = firstResponseText.replace(firstResponseJSON, "");
        this.appendAfterbegin(remainder);
        return firstResponseJSON;
      }
      if (afterRequestAttribute === "@close") {
        if (jsonResponse.success) {
          return firstResponseJSON;
        }
        return;
      }
      const secondResponse = await this.fetch(url.href, secondFetchOptions);
      const secondResponseText = await secondResponse.text();
      if (this.getRedirectUrl(secondResponseText)) {
        await this.redirect(this.getRedirectUrl(secondResponseText) || "");
        return;
      }
      await this.handleResponseRedirectOrUpdate(
        firstResponseText,
        secondResponseText,
        firstResponseJSON,
        jsonResponse
      );
    } catch (error) {
      console.error(
        `Error handling undefined function "${funcName}". Please ensure the function is defined and accessible.`,
        error
      );
    }
  }
  handleAfterRequest(functionOnlyAttribute, firstResponseText) {
    if (!this.isJsonLike(functionOnlyAttribute)) return;
    const functionOnlyData = this.parseJson(functionOnlyAttribute);
    const responseData = firstResponseText
      ? this.parseJson(firstResponseText)
      : null;
    const targets = functionOnlyData.targets; // Assuming targets is an array of objects
    if (Array.isArray(targets)) {
      targets.forEach((targetData) => {
        const { id, ...restData } = targetData;
        const targetToProcess = document.querySelector(id);
        let targetAttributes = {};
        if (responseData) {
          for (const key in restData) {
            if (restData.hasOwnProperty(key)) {
              switch (key) {
                case "innerHTML":
                case "outerHTML":
                case "textContent":
                case "innerText":
                  if (restData[key] === "response") {
                    targetAttributes[key] = targetData.responseKey
                      ? responseData[targetData.responseKey]
                      : responseData.response;
                  }
                  break;
                default:
                  targetAttributes[key] = restData[key];
                  break;
              }
            }
          }
        } else {
          targetAttributes = restData;
        }
        if (targetToProcess) {
          this.updateElementAttributes(targetToProcess, targetAttributes);
        }
      });
    }
  }
  sanitizePassiveHandlers(html) {
    return (
      html
        // ① pull out the inline onwheel, decode any HTML entities, escape quotes, and stash it
        .replace(/\s+onwheel\s*=\s*(['"])([\s\S]*?)\1/gi, (_m, _q, code) => {
          const decoded = this.decodeEntities(code);
          const escaped = decoded.replace(/"/g, "&quot;");
          return ` data-onwheel-code="${escaped}"`;
        })
        // ② drop any onmousewheel entirely
        .replace(/\s+onmousewheel\s*=\s*(['"])[\s\S]*?\1/gi, "")
    );
  }
  handlePassiveWheelStashes(root) {
    const container = root instanceof Document ? root.body : root;
    container.querySelectorAll("[data-onwheel-code]").forEach((el) => {
      /* ① grab & clear inline code -------------------------------- */
      const code = this.decodeEntities(el.dataset.onwheelCode || "").trim();
      delete el.dataset.onwheelCode;
      el.onwheel = null; // remove any leftover inline attr
      if (!code) return;
      /* ② re-install as passive wheel handler (debounced) ---------- */
      el.removeAllEventListeners("wheel");
      this.handleDebounce(el, "wheel", code);
    });
  }
  async handleResponseRedirectOrUpdate(
    firstResponseText,
    secondResponseText,
    firstResponseJSON,
    jsonResponse
  ) {
    /* a)  scrub inline wheel handlers *before* DOMParser runs */
    const safeHTML = this.sanitizePassiveHandlers(secondResponseText);
    /* b)  normal work … */
    const updatedContent = this.getUpdatedHTMLContent(
      firstResponseText,
      firstResponseJSON,
      jsonResponse
    );
    const doc = new DOMParser().parseFromString(safeHTML, "text/html");
    if (updatedContent) {
      doc.body.insertAdjacentElement("afterbegin", updatedContent);
    }
    this.updateBodyContent(doc.body.outerHTML);
  }
  getUpdatedHTMLContent(responseText, firstResponseJSON, jsonResponse) {
    const combinedHTML = document.createElement("div");
    combinedHTML.id = "afterbegin-8D95D";
    if (jsonResponse && firstResponseJSON?.success) {
      // Remove JSON content from the response text
      const remainder = responseText.replace(jsonResponse, "");
      combinedHTML.innerHTML = remainder;
    } else {
      combinedHTML.innerHTML = responseText;
    }
    return combinedHTML.innerHTML ? combinedHTML : null;
  }
  async updateBodyContent(data) {
    const scrollPositions = this.saveScrollPositions();
    this.saveElementState();
    const newDoc = new DOMParser().parseFromString(data, "text/html");
    this.scrubTemplateValueAttributes(newDoc);
    await this.appendCallbackResponse(newDoc);
    await this.processInlineModuleScripts(newDoc);
    await this.initializeAllReferencedProps(newDoc);
    await this.manageAttributeBindings(newDoc);
    await this.populateDocumentBody(newDoc);
    await this.initRefs();
    await this.bootstrapDeclarativeState();
    await this.processIfChains();
    await this.initLoopBindings();
    for (const b of this._bindings) {
      try {
        b.update();
      } catch (e) {
        console.error(e);
      }
    }
    this.restoreScrollPositions(scrollPositions);
    this.attachWireFunctionEvents();
    this.handlerAutofocusAttribute();
    document.body.removeAttribute("hidden");
  }
  restoreElementState() {
    if (this._elementState.focusId) {
      const newFocusElement =
        document.getElementById(this._elementState.focusId) ||
        document.querySelector(`[name="${this._elementState.focusId}"]`);
      if (newFocusElement instanceof HTMLInputElement) {
        const length = newFocusElement.value.length || 0;
        if (
          this._elementState.focusSelectionStart !== undefined &&
          this._elementState.focusSelectionEnd !== null
        ) {
          newFocusElement.setSelectionRange(length, length);
        }
        if (this._elementState.focusValue) {
          if (
            newFocusElement.type === "checkbox" ||
            newFocusElement.type === "radio"
          ) {
            newFocusElement.checked = !!this._elementState.focusChecked;
          } else if (
            newFocusElement.type === "number" ||
            newFocusElement.type === "email"
          ) {
            newFocusElement.type = "text"; // Temporarily set to text
            newFocusElement.setSelectionRange(length, length);
            newFocusElement.type =
              newFocusElement.type === "number" ? "number" : "email"; // Restore original type
          } else if (
            newFocusElement.type === "date" ||
            newFocusElement.type === "month" ||
            newFocusElement.type === "week" ||
            newFocusElement.type === "time" ||
            newFocusElement.type === "datetime-local" ||
            newFocusElement.type === "color"
          ) {
            // Skip setting selection range for these types
            // You can add specific handling if needed (e.g., setting a value or focusing the input)
          } else if (newFocusElement.type === "file") {
            // Skip setting value for file inputs
          } else {
            if (newFocusElement.value !== "") {
              newFocusElement.value = this._elementState.focusValue;
            }
          }
        }
        newFocusElement.focus();
      } else if (newFocusElement instanceof HTMLTextAreaElement) {
        const length = newFocusElement.value.length || 0;
        if (
          this._elementState.focusSelectionStart !== undefined &&
          this._elementState.focusSelectionEnd !== null
        ) {
          newFocusElement.setSelectionRange(length, length);
        }
        if (this._elementState.focusValue) {
          if (newFocusElement.value !== "")
            newFocusElement.value = this._elementState.focusValue;
        }
        newFocusElement.focus();
      } else if (newFocusElement instanceof HTMLSelectElement) {
        if (this._elementState.focusValue) {
          if (newFocusElement.value !== "")
            newFocusElement.value = this._elementState.focusValue;
        }
        newFocusElement.focus();
      }
    }
    this._elementState.checkedElements.forEach((id) => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.checked = true;
      }
    });
  }
  async appendCallbackResponse(newDoc) {
    const callbackResponseText = newDoc.getElementById("afterbegin-8D95D");
    if (callbackResponseText) {
      const callbackResponseContent =
        document.getElementById("afterbegin-8D95D");
      if (callbackResponseContent) {
        callbackResponseContent.innerHTML = callbackResponseText.innerHTML;
      } else {
        document.body.insertAdjacentHTML(
          "afterbegin",
          callbackResponseText.outerHTML
        );
      }
    }
  }
  saveElementState() {
    const focusElement = document.activeElement;
    this._elementState.focusId = focusElement?.id || focusElement?.name;
    this._elementState.focusValue = focusElement?.value;
    this._elementState.focusChecked = focusElement?.checked;
    this._elementState.focusType = focusElement?.type;
    this._elementState.focusSelectionStart = focusElement?.selectionStart;
    this._elementState.focusSelectionEnd = focusElement?.selectionEnd;
    this._elementState.isSuspense = focusElement.hasAttribute("pp-suspense");
    this._elementState.checkedElements.clear();
    document
      .querySelectorAll('input[type="checkbox"]:checked')
      .forEach((el) => {
        this._elementState.checkedElements.add(el.id || el.name);
      });
    document.querySelectorAll('input[type="radio"]:checked').forEach((el) => {
      this._elementState.checkedElements.add(el.id || el.name);
    });
  }
  updateElementAttributes(element, data) {
    for (const key in data) {
      if (!data.hasOwnProperty(key)) continue;
      switch (key) {
        case "innerHTML":
        case "outerHTML":
        case "textContent":
        case "innerText":
          element[key] = this.decodeHTML(data[key]);
          break;
        case "insertAdjacentHTML":
          element.insertAdjacentHTML(
            data.position || "beforeend",
            this.decodeHTML(data[key].html)
          );
          break;
        case "insertAdjacentText":
          element.insertAdjacentText(
            data.position || "beforeend",
            this.decodeHTML(data[key].text)
          );
          break;
        case "setAttribute":
          element.setAttribute(data.attrName, this.decodeHTML(data[key]));
          break;
        case "removeAttribute":
          element.removeAttribute(data[key]);
          break;
        case "className":
          element.className = this.decodeHTML(data[key]);
          break;
        case "classList.add":
          element.classList.add(...this.decodeHTML(data[key]).split(","));
          break;
        case "classList.remove":
          element.classList.remove(...this.decodeHTML(data[key]).split(","));
          break;
        case "classList.toggle":
          element.classList.toggle(this.decodeHTML(data[key]));
          break;
        case "classList.replace":
          const [oldClass, newClass] = this.decodeHTML(data[key]).split(",");
          element.classList.replace(oldClass, newClass);
          break;
        case "dataset":
          element.dataset[data.attrName] = this.decodeHTML(data[key]);
          break;
        case "style":
          Object.assign(element.style, data[key]);
          break;
        case "value":
          element.value = this.decodeHTML(data[key]);
          break;
        case "checked":
          element.checked = data[key];
          break;
        default:
          element.setAttribute(key, this.decodeHTML(data[key]));
      }
    }
  }
  decodeHTML(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }
  appendAfterbegin(content) {
    if (!content) return;
    const contentId = "afterbegin-8D95D";
    let afterBeginNode = document.getElementById(contentId);
    if (afterBeginNode) {
      afterBeginNode.innerHTML = content;
      document.body.insertAdjacentElement("afterbegin", afterBeginNode);
    } else {
      afterBeginNode = document.createElement("div");
      afterBeginNode.id = contentId;
      afterBeginNode.innerHTML = content;
      document.body.insertAdjacentElement("afterbegin", afterBeginNode);
    }
  }
  restoreSuspenseElement(element) {
    const originalStateAttribute = element.getAttribute("pp-original-state");
    if (element.hasAttribute("pp-suspense") && originalStateAttribute) {
      const restoreElement = (element, data) => {
        // Restore attributes and properties
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            if (key === "textContent") {
              element.textContent = data[key];
            } else if (key === "innerHTML") {
              element.innerHTML = data[key];
            } else if (key === "disabled") {
              if (data[key] === true) {
                element.setAttribute("disabled", "true");
              } else {
                element.removeAttribute("disabled");
              }
            } else {
              element.setAttribute(key, data[key]);
            }
          }
        }
        // Remove attributes that were not in the original state
        for (const attr of Array.from(element.attributes)) {
          if (!data.hasOwnProperty(attr.name)) {
            element.removeAttribute(attr.name);
          }
        }
      };
      const restoreFormElement = (form, data) => {
        for (const key in data) {
          if (!data.hasOwnProperty(key)) continue;
          for (const formElement of Array.from(form.elements)) {
            if (
              formElement instanceof HTMLInputElement ||
              formElement instanceof HTMLButtonElement ||
              formElement instanceof HTMLTextAreaElement ||
              formElement instanceof HTMLSelectElement
            ) {
              const originalStateAttribute =
                formElement.getAttribute("pp-original-state") || "";
              if (originalStateAttribute) {
                if (this.isJsonLike(originalStateAttribute)) {
                  const originalData = this.parseJson(originalStateAttribute);
                  restoreElement(formElement, originalData);
                } else {
                  restoreElementTextContent(
                    formElement,
                    originalStateAttribute
                  );
                }
                formElement.removeAttribute("pp-original-state");
              }
            }
          }
        }
      };
      const restoreElementTextContent = (element, data) => {
        if (element instanceof HTMLInputElement) {
          element.value = data;
        } else {
          element.textContent = data;
        }
      };
      const restoreTargetElement = (element, data) => {
        if (element instanceof HTMLFormElement) {
          restoreFormElement(element, data);
        } else {
          restoreElement(element, data);
        }
      };
      try {
        const data = this.parseJson(originalStateAttribute);
        if (data) {
          if (element instanceof HTMLFormElement) {
            const formId = element.id;
            // Try to restore the invoker if the form has an ID
            if (formId) {
              const invoker = document.querySelector(`[form="${formId}"]`);
              if (invoker) {
                const invokerState = invoker.getAttribute("pp-original-state");
                if (invokerState && this.isJsonLike(invokerState)) {
                  const invokerData = this.parseJson(invokerState);
                  restoreElement(invoker, invokerData);
                }
              }
            }
            // Always restore the form itself
            const formData = new FormData(element);
            const formDataToProcess = {};
            formData.forEach((value, key) => {
              formDataToProcess[key] = value;
            });
            restoreFormElement(element, formDataToProcess);
            if (element.hasAttribute("pp-suspense")) {
              const suspenseDataAttribute =
                element.getAttribute("pp-suspense") || "";
              const suspenseData = this.parseJson(suspenseDataAttribute);
              if (suspenseData.disabled) {
                for (const formElement of Array.from(element.elements)) {
                  if (
                    formElement instanceof HTMLInputElement ||
                    formElement instanceof HTMLButtonElement ||
                    formElement instanceof HTMLTextAreaElement ||
                    formElement instanceof HTMLSelectElement
                  ) {
                    formElement.removeAttribute("disabled");
                  }
                }
              }
            }
          } else if (data.targets) {
            data.targets.forEach((target) => {
              const { id, ...rest } = target;
              const targetElement = document.querySelector(id);
              if (targetElement) {
                restoreTargetElement(targetElement, rest);
              }
            });
            const { targets, ...restData } = data;
            restoreElement(element, restData);
          } else {
            const { empty, ...restData } = data;
            restoreElement(element, restData);
          }
        }
      } catch (error) {
        console.error(
          `Error parsing JSON: ${
            error instanceof Error ? error.message : "Unknown error"
          }. Please ensure the JSON string is valid.`,
          error
        );
      }
    }
    // Restore child elements with pp-suspense attribute
    const childrenWithSuspense = element.querySelectorAll("[pp-suspense]");
    childrenWithSuspense.forEach((child) => this.restoreSuspenseElement(child));
    // Clean up the saved state after restoration
    element.removeAttribute("pp-original-state");
  }
  extractJson(responseText) {
    const jsonMatch = responseText?.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : null;
  }
  getRedirectUrl(responseText) {
    const match = responseText.match(this._redirectRegex);
    return match ? match[1] : null;
  }
  async fetchFileWithData(url, functionName, fileInput, additionalData = {}) {
    const formData = new FormData();
    // Append all selected files
    const files = fileInput.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append("file[]", files[i]);
      }
    }
    // Append the callback parameter
    formData.append("callback", functionName);
    // Append additional non-file data
    for (const key in additionalData) {
      if (additionalData.hasOwnProperty(key)) {
        formData.append(key, additionalData[key]);
      }
    }
    const response = await this.fetch(url, {
      method: "POST",
      // Do not set Content-Type header; let the browser set it with the boundary
      headers: {
        HTTP_PPHP_WIRE_REQUEST: "true",
      },
      body: formData,
    });
    return await response.text();
  }
  async handleSuspenseElement(element) {
    let suspenseElement = element.getAttribute("pp-suspense") || "";
    const handleFormElement = (form, data) => {
      for (const key in data) {
        if (!data.hasOwnProperty(key)) continue;
        for (const formElement of form.elements) {
          if (
            formElement instanceof HTMLInputElement ||
            formElement instanceof HTMLButtonElement ||
            formElement instanceof HTMLTextAreaElement ||
            formElement instanceof HTMLSelectElement
          ) {
            const suspenseElement =
              formElement.getAttribute("pp-suspense") || "";
            if (suspenseElement) {
              if (this.isJsonLike(suspenseElement)) {
                const suspenseData = this.parseJson(suspenseElement);
                if (suspenseData.onsubmit !== "disabled") {
                  this.updateElementAttributes(formElement, suspenseData);
                }
                if (suspenseData.targets) {
                  suspenseData.targets.forEach((target) => {
                    const { id, ...rest } = target;
                    const targetElement = document.querySelector(id);
                    if (targetElement) {
                      handleTargetElement(targetElement, rest);
                    }
                  });
                }
              } else {
                updateElementTextContent(formElement, suspenseElement);
              }
            }
          }
        }
      }
    };
    const updateElementTextContent = (element, data) => {
      if (element instanceof HTMLInputElement) {
        element.value = data;
      } else {
        element.textContent = data;
      }
    };
    const handleTargetElement = (element, data) => {
      if (element instanceof HTMLFormElement) {
        handleFormElement(element, data);
      } else {
        this.updateElementAttributes(element, data);
      }
    };
    try {
      if (suspenseElement && this.isJsonLike(suspenseElement)) {
        const data = this.parseJson(suspenseElement);
        if (data) {
          if (element instanceof HTMLFormElement) {
            const formData = new FormData(element);
            const formDataToProcess = {};
            formData.forEach((value, key) => {
              formDataToProcess[key] = value;
            });
            if (data.disabled) {
              this.toggleFormElements(element, true);
            }
            const { disabled, ...restData } = data;
            this.updateElementAttributes(element, restData);
            handleFormElement(element, formDataToProcess);
          } else if (data.targets) {
            data.targets.forEach((target) => {
              const { id, ...rest } = target;
              const targetElement = document.querySelector(id);
              if (targetElement) {
                handleTargetElement(targetElement, rest);
              }
            });
            const { targets, ...restData } = data;
            this.updateElementAttributes(element, restData);
          } else {
            if (data.empty === "disabled" && element.value === "") return;
            const { empty, ...restData } = data;
            this.updateElementAttributes(element, restData);
          }
        }
      } else if (suspenseElement) {
        updateElementTextContent(element, suspenseElement);
      } else {
        if (element instanceof HTMLFormElement) {
          const formData = new FormData(element);
          const formDataToProcess = {};
          formData.forEach((value, key) => {
            formDataToProcess[key] = value;
          });
          handleFormElement(element, formDataToProcess);
        }
      }
    } catch (error) {
      console.error(
        `Error parsing JSON: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Please ensure the JSON string is valid.`,
        error
      );
    }
  }
  toggleFormElements(form, disable) {
    Array.from(form.elements).forEach((element) => {
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLButtonElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
      ) {
        element.disabled = disable;
      }
    });
  }
  saveElementOriginalState(element) {
    if (
      element.hasAttribute("pp-suspense") &&
      !element.hasAttribute("pp-original-state")
    ) {
      const originalState = {};
      // Save text content if the element has it
      if (element.textContent) {
        originalState.textContent = element.textContent.trim();
      }
      // Save innerHTML if the element has it
      if (element.innerHTML) {
        originalState.innerHTML = element.innerHTML.trim();
      }
      // Save value for input, textarea, and select elements
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        originalState.value = element.value;
      }
      // Save other attributes if necessary
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        originalState[attr.name] = attr.value;
      }
      // Save the original state as a JSON string in a custom attribute
      element.setAttribute("pp-original-state", JSON.stringify(originalState));
    }
    // Special handling for forms
    if (element instanceof HTMLFormElement) {
      let invoker = null;
      // Check if the form has an ID
      const formId = element.id;
      if (formId) {
        // Search for elements with the matching 'form' attribute
        invoker = document.querySelector(`[form="${formId}"]`);
      }
      // If no ID or invoker is found, assume it's within the form itself
      if (!formId || !invoker) {
        invoker = Array.from(element.elements).find(
          (formElement) =>
            formElement instanceof HTMLButtonElement ||
            formElement instanceof HTMLInputElement
        );
      }
      if (invoker) {
        // Save the invoker state
        if (!invoker.hasAttribute("pp-original-state")) {
          this.saveElementOriginalState(invoker);
        }
      } else {
        console.warn(
          "Warning: No invoker detected for the form. Ensure the form has an associated invoker or an ID for proper handling."
        );
      }
    }
    // Save the state of child elements with pp-suspense attribute
    const childrenWithSuspense = element.querySelectorAll("[pp-suspense]");
    childrenWithSuspense.forEach((child) =>
      this.saveElementOriginalState(child)
    );
  }
  getUrlParams() {
    const params = {};
    const urlParams = new URLSearchParams(window.location.search);
    // Loop through each parameter in the URL and add it to the params object
    urlParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }
  createFetchOptions(body) {
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        HTTP_PPHP_WIRE_REQUEST: "true",
      },
      body: JSON.stringify(body),
    };
  }
  parseCallback(element, callback) {
    let data = {};
    // 1) Gather form or single‐input data as before
    const form = element.closest("form");
    if (form) {
      const formData = new FormData(form);
      formData.forEach((value, key) => {
        if (data[key]) {
          if (Array.isArray(data[key])) {
            data[key].push(value);
          } else {
            data[key] = [data[key], value];
          }
        } else {
          data[key] = value;
        }
      });
    } else {
      if (element instanceof HTMLInputElement) {
        data = this.handleInputElement(element);
      } else if (element instanceof HTMLSelectElement) {
        data[element.name] = element.value;
      } else if (element instanceof HTMLTextAreaElement) {
        data[element.name] = element.value;
      }
    }
    // 2) Extract function name and raw args
    const match = callback.match(/^([^(]+)\(([\s\S]*)\)$/);
    if (match) {
      const funcName = match[1].trim();
      const rawArgs = match[2].trim();
      const topLevelComma = /,(?=(?:[^'"]*['"][^'"]*['"])*[^'"]*$)/;
      // 3) JSON‐style args (object or array literal)
      if (
        (rawArgs.startsWith("{") && rawArgs.endsWith("}")) ||
        (rawArgs.startsWith("[") && rawArgs.endsWith("]"))
      ) {
        if (this.isJsonLike(rawArgs)) {
          try {
            const parsed = this.parseJson(rawArgs);
            if (Array.isArray(parsed)) {
              data.args = parsed;
            } else if (parsed && typeof parsed === "object") {
              data = { ...data, ...parsed };
            }
          } catch (e) {
            console.error("Error parsing JSON args:", e);
            data.rawArgs = rawArgs;
          }
        } else {
          try {
            const evaluated = this.evaluateJavaScriptObject(rawArgs);
            if (Array.isArray(evaluated)) {
              data.args = evaluated;
            } else if (evaluated && typeof evaluated === "object") {
              data = { ...data, ...evaluated };
            } else {
              data.rawArgs = rawArgs;
            }
          } catch (e) {
            console.error("Error evaluating JS object args:", e);
            data.rawArgs = rawArgs;
          }
        }
      }
      // 4) Pure literals (strings, numbers, arrays/objects) → array-wrapper
      else if (/^[\s\d"'[\{]/.test(rawArgs)) {
        try {
          // Turn "'a',42,true" into ["a",42,true]
          const arr = new Function(`return [${rawArgs}];`)();
          data.args = Array.isArray(arr) ? arr : [arr];
        } catch {
          // Fallback: split on top‐level commas
          if (topLevelComma.test(rawArgs)) {
            data.args = rawArgs
              .split(topLevelComma)
              .map((a) => a.trim().replace(/^['"]|['"]$/g, ""));
          } else {
            data.args = [rawArgs.replace(/^['"]|['"]$/g, "")];
          }
        }
      }
      // 5) Everything else → safe evaluator against this.props
      else {
        try {
          const value = this.getOrCreateEvaluator(rawArgs)(this.props);
          data.args = [value];
        } catch {
          data.args = rawArgs
            .split(topLevelComma)
            .map((a) => a.trim().replace(/^['"]|['"]$/g, ""));
        }
      }
      return { funcName, data };
    }
    // no‐parens form
    return { funcName: callback, data };
  }
  evaluateJavaScriptObject(objectCode) {
    try {
      // Create a safe evaluation context
      const proxy = this.getOrCreateProxy(this.props);
      // Use Function constructor to evaluate the object literal
      const evaluator = new Function(
        "proxy",
        "Date",
        "Math",
        "JSON",
        `
      with (proxy) {
        return ${objectCode};
      }
      `
      );
      // Execute with safe globals
      return evaluator.call(null, proxy, Date, Math, JSON);
    } catch (error) {
      console.error("Failed to evaluate JavaScript object:", error);
      throw error;
    }
  }
  handleInputElement(element) {
    let data = {};
    // Only proceed if the element has a name
    if (element.name) {
      // Handle checkboxes
      if (element.type === "checkbox") {
        data[element.name] = {
          value: element.value,
          checked: element.checked,
        };
      } else if (element.type === "radio") {
        // Handle radio buttons
        const checkedRadio = document.querySelector(
          `input[name="${element.name}"]:checked`
        );
        data[element.name] = checkedRadio ? checkedRadio.value : null;
      } else {
        // Handle other input types
        data[element.name] = element.value;
      }
    } else {
      // Handle cases where the element does not have a name
      if (element.type === "checkbox" || element.type === "radio") {
        data.value = element.checked;
      } else {
        data.value = element.value;
      }
    }
    return data;
  }
  setCursorPosition(el, config) {
    if (config.start) {
      el.setSelectionRange(0, 0);
    } else if (config.end) {
      const length = el.value.length || 0;
      el.setSelectionRange(length, length);
    } else if (config.length) {
      const length = parseInt(config.length, 10) || 0;
      el.setSelectionRange(length, length);
    }
  }
  handleInputAppendParams(element, eventType) {
    const appendParams = element.getAttribute("pp-append-params");
    const appendParamsSync = element.getAttribute("pp-append-params-sync");
    if (appendParams === "true") {
      // Use the input's name or fallback to its id as the key if 'pp-append-params-sync' is true
      if (appendParamsSync === "true") {
        const key = element.name || element.id;
        if (key) {
          // On page load, check if the URL contains a parameter with this key
          const url = new URL(window.location.href);
          const params = new URLSearchParams(url.search);
          if (params.has(key)) {
            element.value = params.get(key) || "";
          }
        }
      }
      // Add event listener to update the URL on input events
      element.addEventListener(eventType, (event) => {
        const input = event.currentTarget;
        const value = input.value;
        // Retrieve the current URL parameters
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        // Use the input's name or fallback to its id as the parameter key
        const key = input.name || input.id;
        if (key) {
          if (value) {
            // If the value is not empty, update or add the parameter
            params.set(key, value);
          } else {
            // If the value is empty, remove the parameter
            params.delete(key);
          }
          // Construct the new URL, avoiding a trailing '?' if there are no params
          const newUrl = params.toString()
            ? `${url.pathname}?${params.toString()}`
            : url.pathname;
          history.replaceState(null, "", newUrl);
        }
      });
    }
  }
  handleHiddenAttribute() {
    const visibilityElements = document.querySelectorAll("[pp-visibility]");
    const displayNoneElements = document.querySelectorAll("[pp-display]");
    // bind `this` so inside handleElementVisibility, `this` is your PPHP instance
    const visHandler = this.handleElementVisibility.bind(this);
    const dispHandler = this.handleElementDisplay.bind(this);
    visibilityElements.forEach((el) =>
      this.handleVisibilityElementAttribute(el, "pp-visibility", visHandler)
    );
    displayNoneElements.forEach((el) =>
      this.handleVisibilityElementAttribute(el, "pp-display", dispHandler)
    );
  }
  handleVisibilityElementAttribute(element, attributeName, handler) {
    const attributeValue = element.getAttribute(attributeName);
    if (!attributeValue) return;
    if (this.isJsonLike(attributeValue)) {
      const config = this.parseJson(attributeValue);
      handler(element, config);
    } else {
      const timeout = this.parseTime(attributeValue);
      if (timeout > 0) {
        // Map attribute names to style properties
        const styleProperty =
          attributeName === "pp-visibility" ? "visibility" : "display";
        const hiddenValue = styleProperty === "visibility" ? "hidden" : "none";
        this.scheduleChange(element, timeout, styleProperty, hiddenValue);
      }
    }
  }
  handleElementVisibility(element, config) {
    this.handleElementChange(
      element,
      config,
      "visibility",
      "hidden",
      "visible"
    );
  }
  handleElementDisplay(element, config) {
    this.handleElementChange(element, config, "display", "none", "block");
  }
  handleElementChange(
    element,
    config,
    styleProperty,
    hiddenValue,
    visibleValue
  ) {
    const startTimeout = config.start ? this.parseTime(config.start) : 0;
    const endTimeout = config.end ? this.parseTime(config.end) : 0;
    if (startTimeout > 0) {
      element.style[styleProperty] = hiddenValue;
      this.scheduleChange(element, startTimeout, styleProperty, visibleValue);
      if (endTimeout > 0) {
        this.scheduleChange(
          element,
          startTimeout + endTimeout,
          styleProperty,
          hiddenValue
        );
      }
    } else if (endTimeout > 0) {
      this.scheduleChange(element, endTimeout, styleProperty, hiddenValue);
    }
  }
  handleAnchorTag() {
    document.querySelectorAll("a").forEach((anchor) => {
      anchor.addEventListener("click", async (event) => {
        const anchor = event.currentTarget;
        const href = anchor.getAttribute("href");
        const target = anchor.getAttribute("target");
        // Allow default behavior for special cases
        if (!href || target === "_blank" || event.metaKey || event.ctrlKey) {
          return;
        }
        event.preventDefault(); // Prevent the default navigation
        if (this._isNavigating) return; // Prevent multiple navigations
        this._isNavigating = true;
        try {
          const isExternal =
            /^(https?:)?\/\//i.test(href) &&
            !href.startsWith(window.location.origin);
          if (isExternal) {
            window.location.href = href;
          } else {
            const anchorPpAppendParams =
              anchor.getAttribute("pp-append-params");
            if (href.startsWith("?") && anchorPpAppendParams === "true") {
              const url = new URL(window.location.href);
              // Handle query parameter updates
              const params = new URLSearchParams(url.search); // Retain existing parameters
              // Extract the hash if it exists
              let hash = "";
              const [queryPart, hashPart] = href.split("#");
              if (hashPart) {
                hash = `#${hashPart}`;
              }
              // Get new parameters from the href and update/add them
              const newParams = new URLSearchParams(queryPart.split("?")[1]);
              newParams.forEach((value, key) => {
                params.set(key, value);
              });
              // Construct the new URL with merged parameters
              const newUrl = `${url.pathname}?${params.toString()}${hash}`;
              history.pushState(null, "", newUrl);
            } else {
              // Handle path navigation and retain hash
              const [path, hash] = href.split("#");
              const newUrl = `${path}${hash ? `#${hash}` : ""}`;
              history.pushState(null, "", newUrl);
            }
            const hashIndex = href.indexOf("#");
            if (hashIndex !== -1) {
              const hash = href.slice(hashIndex + 1);
              const targetElement = document.getElementById(hash);
              if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth" });
              } else {
                await this.handleNavigation();
                const newTargetElement = document.getElementById(hash);
                if (newTargetElement) {
                  newTargetElement.scrollIntoView({ behavior: "smooth" });
                }
              }
            } else {
              await this.handleNavigation();
            }
          }
        } catch (error) {
          console.error("Anchor click error:", error);
        } finally {
          this._isNavigating = false;
        }
      });
    });
  }
  handlePopState() {
    window.addEventListener("popstate", async () => {
      await this.handleNavigation();
    });
  }
  async handleNavigation() {
    try {
      // 1) Attempt partial “loading” update from #loading-file-1B87E (if it exists)
      const parentElement = document.getElementById("loading-file-1B87E");
      if (parentElement) {
        const loadingElement = this.findLoadingElement(
          parentElement,
          window.location.pathname
        );
        if (loadingElement) {
          await this.updateContentWithTransition(loadingElement);
        }
      }
      // 2) Now fetch the real page content from the server
      const response = await this.fetch(window.location.href);
      const data = await response.text();
      if (!response.ok) {
        await this.updateDocumentContent(data);
        console.error(
          `Navigation error: ${response.status} ${response.statusText}`
        );
        // Decide how to handle errors (reload page, show alert, etc.)
        return;
      }
      // 3) If server sends a special “redirect_7F834 = /somewhere” marker, handle it
      const match = data.match(this._redirectRegex);
      if (match && match[1]) {
        await this.redirect(match[1]);
        return;
      }
      // 4) Otherwise, update the document with the fetched HTML
      await this.updateDocumentContent(data);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }
  findLoadingElement(parent, route) {
    let currentRoute = route;
    // Keep climbing up the path (e.g. /dashboard/settings -> /dashboard -> /)
    // until you find a matching <div pp-loading-url="..."> or reach root
    while (true) {
      // Look for an exact match inside #loading-file-1B87E
      const candidate = parent.querySelector(
        `div[pp-loading-url='${currentRoute}']`
      );
      if (candidate) {
        return candidate;
      }
      // If we’re already at "/", no further up to go—break
      if (currentRoute === "/") {
        break;
      }
      // Otherwise, chop off the last segment
      const lastSlashIndex = currentRoute.lastIndexOf("/");
      if (lastSlashIndex <= 0) {
        // Once we hit something like "/foo" -> lastSlash=0 -> fallback to "/"
        currentRoute = "/";
      } else {
        currentRoute = currentRoute.substring(0, lastSlashIndex);
      }
    }
    // Fallback: try a <div pp-loading-url="/"> if it exists
    return parent.querySelector(`div[pp-loading-url='/' ]`);
  }
  async updateContentWithTransition(loadingElement) {
    const pageContent =
      document.querySelector("[pp-loading-content='true']") || document.body;
    if (!pageContent) return;
    // Parse fade durations (defaults: 250ms each)
    const { fadeIn: fadeInDuration, fadeOut: fadeOutDuration } =
      this.parseTransition(loadingElement);
    // Fade out, replace, fade in
    await this.fadeOut(pageContent, fadeOutDuration);
    pageContent.innerHTML = loadingElement.innerHTML;
    this.fadeIn(pageContent, fadeInDuration);
  }
  parseTransition(element) {
    let fadeIn = 250;
    let fadeOut = 250;
    const child = element.querySelector("[pp-loading-transition]");
    const raw = child?.getAttribute("pp-loading-transition");
    if (raw) {
      const cfg = this.parseJson(raw);
      // ✅  Asegúrese de que sea un objeto antes de usarlo
      if (cfg && typeof cfg === "object") {
        fadeIn = this.parseTime(cfg.fadeIn ?? fadeIn);
        fadeOut = this.parseTime(cfg.fadeOut ?? fadeOut);
      } else {
        console.warn(
          "pp-loading-transition is not valid JSON → default values (250 ms) will be used. String:",
          raw
        );
      }
    }
    return { fadeIn, fadeOut };
  }
  fadeOut(element, duration) {
    return new Promise((resolve) => {
      element.style.transition = `opacity ${duration}ms ease-out`;
      element.style.opacity = "0";
      setTimeout(() => {
        // Reset transition property to avoid messing future animations
        element.style.transition = "";
        resolve();
      }, duration);
    });
  }
  fadeIn(element, duration) {
    element.style.transition = `opacity ${duration}ms ease-in`;
    element.style.opacity = "1";
    setTimeout(() => {
      element.style.transition = "";
    }, duration);
  }
  reconcileHead(newDoc) {
    const SCRIPT_ATTR = "pp-dynamic-script";
    const META_ATTR = "pp-dynamic-meta";
    const LINK_ATTR = "pp-dynamic-link";
    /* 1.  purga anteriores ------------------------------------------- */
    document.head.querySelectorAll(`[${META_ATTR}]`).forEach((n) => n.remove());
    document.head.querySelectorAll(`[${LINK_ATTR}]`).forEach((n) => n.remove());
    document.head
      .querySelectorAll(`[${SCRIPT_ATTR}]`)
      .forEach((n) => n.remove());
    /* 2.  fusiona/actualiza ------------------------------------------ */
    Array.from(newDoc.head.children).forEach((child) => {
      switch (child.tagName) {
        case "SCRIPT":
          if (child.hasAttribute(SCRIPT_ATTR)) {
            const s = document.createElement("script");
            Array.from(child.attributes).forEach((a) =>
              s.setAttribute(a.name, a.value)
            );
            s.textContent = child.textContent;
            document.head.appendChild(s);
          }
          break;
        case "META": {
          const me = child;
          if (me.getAttribute("charset") || me.name === "viewport") break;
          const sel = me.name
            ? `meta[name="${me.name}"]`
            : `meta[property="${me.getAttribute("property")}"]`;
          const clone = me.cloneNode(true);
          const existing = document.head.querySelector(sel);
          existing
            ? document.head.replaceChild(clone, existing)
            : document.head.insertBefore(
                clone,
                document.head.querySelector("title")?.nextSibling || null
              );
          break;
        }
        case "TITLE": {
          const clone = child.cloneNode(true);
          const existing = document.head.querySelector("title");
          existing
            ? document.head.replaceChild(clone, existing)
            : document.head.appendChild(clone);
          break;
        }
        case "LINK": {
          const li = child;
          if (li.rel === "icon") {
            const clone = li.cloneNode(true);
            const existing = document.head.querySelector('link[rel="icon"]');
            existing
              ? document.head.replaceChild(clone, existing)
              : document.head.appendChild(clone);
          } else if (li.hasAttribute(LINK_ATTR)) {
            document.head.appendChild(li.cloneNode(true));
          }
          break;
        }
      }
    });
  }
  async updateDocumentContent(data) {
    try {
      /* 1.  parseo + saneado inicial --------------------------------- */
      const scrollPos = this.saveScrollPositions();
      const safeHTML = this.sanitizePassiveHandlers(data);
      const newDoc = new DOMParser().parseFromString(safeHTML, "text/html");
      this.scrubTemplateValueAttributes(newDoc);
      /* 1-bis. recolectar scripts PHP inline ------------------------- */
      const phpScripts = [];
      Array.from(
        newDoc.body.querySelectorAll('script[type="text/php"]:not([src])')
      ).forEach((old, idx) => {
        const id = `pphp-inline-script-${idx}`;
        old.dataset.pphpInlineScript = id;
        phpScripts.push({
          id,
          attrs: Array.from(old.attributes),
          code: old.textContent ?? "",
        });
      });
      /* 2.  reconciliar <head> -------------------------------------- */
      this.reconcileHead(newDoc);
      /* 3.  reinicializar estado/reactividad ------------------------ */
      this.resetProps();
      await this.bootstrapDeclarativeState(newDoc);
      await this.processInlineModuleScripts(newDoc);
      await this.initializeAllReferencedProps(newDoc);
      await this.manageAttributeBindings(newDoc);
      /* 4.  fusionar <body> ----------------------------------------- */
      await this.populateDocumentBody(newDoc);
      /* 5.  refrescar cada script PHP inline ------------------------ */
      phpScripts.forEach(({ id, attrs, code }) => {
        const sel = `script[type="text/php"][data-pphp-inline-script="${id}"]`;
        const placeholder = document.querySelector(sel);
        if (!placeholder) return;
        const fresh = document.createElement("script");
        attrs.forEach((a) => {
          if (a.name !== "data-pphp-inline-script")
            fresh.setAttribute(a.name, a.value);
        });
        fresh.type = "text/php";
        fresh.textContent = code;
        placeholder.replaceWith(fresh); // ⇒ ejecuta in-place
      });
      /* 6.  re-hidratación y efectos ------------------------------- */
      await this.processInlineModuleScripts();
      await this.initRefs();
      await this.processIfChains();
      await this.initLoopBindings();
      this._bindings.forEach((b) => {
        try {
          b.update();
        } catch (e) {
          console.error(e);
        }
      });
      /* 7.  restaurar scroll y hooks finales ----------------------- */
      this.restoreScrollPositions(scrollPos);
      this.attachWireFunctionEvents();
      this.handlerAutofocusAttribute();
    } finally {
      /* 8.  mostrar de nuevo sin parpadeo --------------------------- */
      document.body.removeAttribute("hidden");
      this._hydrated = true;
    }
  }
  scrubTemplateValueAttributes(doc) {
    const selector =
      'input[value*="{{"], textarea[value*="{{"], select[value*="{{"],' +
      '[checked*="{{"], [selected*="{{"]';
    doc.querySelectorAll(selector).forEach((el) => {
      if (el.hasAttribute("value")) el.removeAttribute("value");
      if (el.hasAttribute("checked")) el.removeAttribute("checked");
      if (el.hasAttribute("selected")) el.removeAttribute("selected");
    });
  }
  restoreScrollPositions(positions) {
    requestAnimationFrame(() => {
      const windowScroll = positions["window"];
      if (windowScroll) {
        window.scrollTo(windowScroll.scrollLeft, windowScroll.scrollTop);
      }
      document.querySelectorAll("*").forEach((el) => {
        const key = this.getElementKey(el);
        if (positions[key]) {
          el.scrollTop = positions[key].scrollTop;
          el.scrollLeft = positions[key].scrollLeft;
        }
      });
    });
  }
  PRESERVE_HANDLERS = {
    DETAILS(from, to) {
      to.open = from.open;
      return true;
    },
    INPUT(from, to) {
      const src = from;
      const dst = to;
      if (src.value !== dst.value) dst.value = src.value;
      dst.checked = src.checked;
      if (document.activeElement === src) {
        if (src.selectionStart != null) {
          dst.selectionStart = src.selectionStart;
          dst.selectionEnd = src.selectionEnd;
        }
        return false;
      }
      return true;
    },
    TEXTAREA(from, to) {
      const src = from;
      const dst = to;
      if (src.value !== dst.value) dst.value = src.value;
      if (document.activeElement === src) {
        dst.selectionStart = src.selectionStart;
        dst.selectionEnd = src.selectionEnd;
        return false;
      }
      return true;
    },
    SELECT(from, to) {
      const src = from;
      const dst = to;
      dst.selectedIndex = src.selectedIndex;
      return document.activeElement !== src;
    },
    VIDEO(from, to) {
      const src = from;
      const dst = to;
      dst.currentTime = src.currentTime;
      src.paused ? dst.pause() : dst.play();
      return true;
    },
    AUDIO: (from, to) => {
      // call VIDEO handler logic
      return this.PRESERVE_HANDLERS.VIDEO(from, to);
    },
    CANVAS: () => false,
  };
  async populateDocumentBody(src) {
    try {
      /* ── 0. Normaliza el origen ────────────────────────────────── */
      const oldBody = document.body;
      const newBody = src instanceof Document ? src.body : src;
      /* ── 1. Una sola vez: pasa los onwheel a listeners pasivos ─── */
      if (!this._wheelHandlersStashed) {
        document.querySelectorAll("[onwheel]").forEach((el) => {
          const code = el.getAttribute("onwheel").trim();
          el.removeAttribute("onwheel");
          if (code) {
            const fn = new Function("event", code);
            el.addEventListener("wheel", fn, { passive: true });
          }
        });
        this._wheelHandlersStashed = true;
      }
      /* ── 2. morphdom con reglas de preservación personalizadas ─── */
      const preserve = this.PRESERVE_HANDLERS; // alias local
      morphdom(oldBody, newBody, {
        /** Mantiene nodos estables usando key o pp-sync-script */
        getNodeKey(node) {
          if (node.nodeType !== Node.ELEMENT_NODE) return undefined;
          const el = node;
          if (el.hasAttribute("pp-sync-script")) {
            return `pp-sync-script:${el.getAttribute("pp-sync-script")}`;
          }
          return el.getAttribute("key") || undefined;
        },
        /** Decide si un nodo existente debe actualizarse o conservarse */
        onBeforeElUpdated(fromEl, toEl) {
          const tag = fromEl.tagName;
          if (tag === "SCRIPT" || fromEl.hasAttribute("data-nomorph")) {
            return false; // nunca volver a ejecutar <script>
          }
          const handler = preserve[tag];
          return handler ? handler(fromEl, toEl) : true;
        },
        /** Limpieza de timers asociados a nodos descartados */
        onBeforeNodeDiscarded(node) {
          if (node instanceof HTMLElement && node.dataset.timerId) {
            clearTimeout(Number(node.dataset.timerId));
          }
          return true;
        },
      });
    } catch (err) {
      console.error("Error populating document body:", err);
    }
  }
  saveScrollPositions() {
    const scrollPositions = {
      window: {
        scrollTop: window.scrollY || document.documentElement.scrollTop,
        scrollLeft: window.scrollX || document.documentElement.scrollLeft,
      },
    };
    document.querySelectorAll("*").forEach((el) => {
      if (el.scrollTop || el.scrollLeft) {
        scrollPositions[this.getElementKey(el)] = {
          scrollTop: el.scrollTop,
          scrollLeft: el.scrollLeft,
        };
      }
    });
    return scrollPositions;
  }
  getElementKey(el) {
    return el.id || el.className || el.tagName;
  }
  async redirect(url) {
    if (!url) return;
    try {
      const fullUrl = new URL(url, window.location.origin);
      const isExternal = fullUrl.origin !== window.location.origin;
      if (isExternal) {
        window.location.href = url;
      } else {
        history.pushState(null, "", url);
        await this.handleNavigation();
      }
    } catch (error) {
      console.error("Redirect error:", error);
    }
  }
  abortActiveRequest() {
    if (this._activeAbortController) {
      this._activeAbortController.abort();
    }
  }
  async fetch(url, options, abortPrevious = false) {
    // If abortPrevious is true, cancel any pending request and use the global controller.
    let controller;
    if (abortPrevious) {
      if (this._activeAbortController) {
        this._activeAbortController.abort();
      }
      this._activeAbortController = new AbortController();
      controller = this._activeAbortController;
    } else {
      // Otherwise, create a new local controller that doesn't affect other calls.
      controller = new AbortController();
    }
    return fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options?.headers,
        "X-PPHP-Navigation": "partial",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
  }
  isJsonLike(raw) {
    if (typeof raw !== "string") return false;
    const s = raw.trim();
    // 1) Must be wrapped in {…} or […]
    if (!(/^\{[\s\S]*\}$/.test(s) || /^\[[\s\S]*\]$/.test(s))) {
      return false;
    }
    // 2) Reject if it looks like code (function calls, arrow fns, etc.)
    if (s.includes("(") || s.includes(")") || s.includes("=>")) {
      return false;
    }
    return true;
  }
  parseJson(jsonString) {
    try {
      return JSON5.parse(jsonString);
    } catch (error) {
      console.error(
        `Error parsing JSON: ${error.message}. Please ensure the JSON string is valid.`,
        error
      );
      return {};
    }
  }
  parseTime(time) {
    if (typeof time === "number") {
      return time;
    }
    const match = time.match(/^(\d+)(ms|s|m)?$/);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2] || "ms"; // Default to milliseconds if no unit specified
      switch (unit) {
        case "ms":
          return value;
        case "s":
          return value * 1000;
        case "m":
          return value * 60 * 1000;
        default:
          return value; // Default to milliseconds
      }
    }
    return 0; // Default to 0 if parsing fails
  }
  scheduleChange(element, timeout, styleProperty, value) {
    setTimeout(() => {
      requestAnimationFrame(() => {
        element.style[styleProperty] = value;
      });
    }, timeout);
  }
  async fetchFunction(functionName, data = {}, abortPrevious = false) {
    try {
      const encryptedFuncName = await this.encryptCallbackName(functionName);
      const callbackData = { callback: encryptedFuncName, ...data };
      const url = window.location.href;
      let fetchOptions;
      // Check if any property is a File or a FileList with files
      const containsFile = Object.keys(callbackData).some((key) => {
        const value = callbackData[key];
        return (
          value instanceof File ||
          (value instanceof FileList && value.length > 0)
        );
      });
      if (containsFile) {
        const formData = new FormData();
        // Append each property to formData
        Object.keys(callbackData).forEach((key) => {
          const value = callbackData[key];
          if (value instanceof File) {
            formData.append(key, value);
          } else if (value instanceof FileList) {
            // If it's a FileList, append each file
            Array.from(value).forEach((file) => formData.append(key, file));
          } else {
            formData.append(key, value);
          }
        });
        fetchOptions = {
          method: "POST",
          // Let the browser set the Content-Type with the correct boundary
          headers: {
            HTTP_PPHP_WIRE_REQUEST: "true",
          },
          body: formData,
        };
      } else {
        fetchOptions = this.createFetchOptions(callbackData);
      }
      const response = await this.fetch(url, fetchOptions, abortPrevious);
      if (!response.ok) {
        throw new Error(
          `Fetch failed with status: ${response.status} ${response.statusText}`
        );
      }
      const textData = await response.text();
      try {
        return JSON.parse(textData);
      } catch {
        return textData;
      }
    } catch (error) {
      console.error("Error in fetchFunction:", error);
      throw new Error("Failed to fetch data.");
    }
  }
  async sync(...prefixes) {
    try {
      /* 1️⃣  preserve the current UI state */
      const scrollPositions = this.saveScrollPositions();
      this.saveElementState();
      /* 2️⃣  which fragments to refresh (raw names, not the full selector) */
      const names = prefixes.length ? prefixes : ["true"]; // 'true' ↔ pp-sync="true"
      const cssSelFrom = (n) => `[pp-sync="${n}"]`;
      /* 3️⃣  hit the same URL but ask for partial render  */
      const response = await this.fetch(
        window.location.href,
        this.createFetchOptions({
          pphpSync71163: true, // 🔑 tells the server “partial please”
          selectors: names, // ["user-table", …]
          secondRequestC69CD: true,
          ...this.getUrlParams(),
        })
      );
      /* 4️⃣  get the fragments */
      let fragments;
      if (response.headers.get("content-type")?.includes("application/json")) {
        const json = await response.json();
        fragments = json.fragments;
      } else {
        // only one selector → raw HTML
        fragments = { [names[0]]: await response.text() };
      }
      /* 5️⃣  create a detached doc we can hydrate for refs/effects */
      const stubHtml = `<body>${Object.values(fragments).join("")}</body>`;
      const doc = new DOMParser().parseFromString(stubHtml, "text/html");
      await this.initReactiveOn(doc);
      /* 6️⃣  swap each targeted fragment */
      names.forEach((name) => {
        const sel = cssSelFrom(name);
        const current = document.querySelectorAll(sel);
        const freshEl = doc.body.querySelector(sel);
        if (!freshEl) return;
        current.forEach((el) => (el.innerHTML = freshEl.innerHTML));
      });
      /* 7️⃣  restore UI state & re-attach handlers */
      this.restoreElementState();
      this.restoreScrollPositions(scrollPositions);
      this.attachWireFunctionEvents();
    } catch (err) {
      console.error("pphp.sync failed:", err);
    }
  }
  async fetchAndUpdateBodyContent() {
    const secondOptions = this.createFetchOptions({
      secondRequestC69CD: true,
      ...this.getUrlParams(),
    });
    this.abortActiveRequest();
    const response = await this.fetch(
      window.location.href,
      secondOptions,
      true
    );
    const responseText = await response.text();
    await this.updateBodyContent(responseText);
  }
  copyCode(
    btnElement,
    containerClass,
    initialIconAttr,
    successIconAttr,
    iconSelector = "img",
    timeout = 2000
  ) {
    // Ensure btnElement is an instance of HTMLElement
    if (!(btnElement instanceof HTMLElement)) return;
    // Find the closest container with the specified class relative to the button
    const codeBlock = btnElement
      .closest(`.${containerClass}`)
      ?.querySelector("pre code");
    const textToCopy = codeBlock?.textContent?.trim() || ""; // Get the text content of the code block and trim whitespace
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(
        () => {
          // Clipboard successfully set
          const icon = btnElement.querySelector(iconSelector); // Use the icon selector
          if (icon) {
            // Apply success attributes dynamically
            for (const [key, value] of Object.entries(successIconAttr)) {
              if (key in icon) {
                // If key exists as a property, set it dynamically (e.g., innerHTML, textContent)
                icon[key] = value;
              } else {
                // Otherwise, treat it as an attribute
                icon.setAttribute(key, value);
              }
            }
          }
          // Set a timeout to revert back to initial attributes
          setTimeout(() => {
            if (icon) {
              for (const [key, value] of Object.entries(initialIconAttr)) {
                if (key in icon) {
                  icon[key] = value; // Revert DOM property
                } else {
                  icon.setAttribute(key, value); // Revert attribute
                }
              }
            }
          }, timeout);
        },
        () => {
          // Clipboard write failed
          alert("Failed to copy command to clipboard");
        }
      );
    } else {
      alert("Failed to find the code block to copy");
    }
  }
  getCookie(name) {
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith(name + "="))
        ?.split("=")[1] || null
    );
  }
}
// TODO: END OF PPHP class
class PPHPLocalStore {
  state;
  static instance = null;
  listeners;
  pphp;
  STORAGE_KEY; // Now dynamically set from cookie
  lastSyncedState = null;
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = [];
    this.pphp = PPHP.instance;
    this.STORAGE_KEY =
      this.pphp.getCookie("pphp_local_store_key") || "pphp_local_store_59e13";
    // Initialize lastSyncedState to whatever is in storage at startup
    this.lastSyncedState = localStorage.getItem(this.STORAGE_KEY);
    this.loadState(); // Load state immediately after instance creation
  }
  static getInstance(initialState = {}) {
    if (!PPHPLocalStore.instance) {
      PPHPLocalStore.instance = new PPHPLocalStore(initialState);
    }
    return PPHPLocalStore.instance;
  }
  setState(update, syncWithBackend = false) {
    // Compute the potential new state
    const newState = { ...this.state, ...update };
    // Only proceed if state has actually changed
    if (JSON.stringify(newState) === JSON.stringify(this.state)) {
      return;
    }
    this.state = newState;
    this.listeners.forEach((listener) => listener(this.state));
    this.saveState();
    // Sync with backend if enabled, but only when storage differs
    if (syncWithBackend) {
      const storedState = localStorage.getItem(this.STORAGE_KEY);
      if (storedState && storedState !== this.lastSyncedState) {
        this.pphp.fetchFunction(this.STORAGE_KEY, {
          [this.STORAGE_KEY]: storedState,
        });
        this.lastSyncedState = storedState;
      }
    }
  }
  saveState() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
  }
  loadState() {
    const storedState = localStorage.getItem(this.STORAGE_KEY);
    if (storedState) {
      this.state = this.pphp.parseJson(storedState);
      this.listeners.forEach((listener) => listener(this.state));
    }
  }
  resetState(id, syncWithBackend = false) {
    if (id) {
      delete this.state[id];
      this.saveState();
    } else {
      this.state = {};
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.listeners.forEach((listener) => listener(this.state));
    if (syncWithBackend) {
      const storedState = id ? localStorage.getItem(this.STORAGE_KEY) : null;
      this.pphp.fetchFunction(this.STORAGE_KEY, {
        [this.STORAGE_KEY]: storedState,
      });
      this.lastSyncedState = storedState;
    }
  }
}
class SearchParamsManager {
  static instance = null;
  listeners = [];
  constructor() {}
  static getInstance() {
    if (!SearchParamsManager.instance) {
      SearchParamsManager.instance = new SearchParamsManager();
    }
    return SearchParamsManager.instance;
  }
  get params() {
    return new URLSearchParams(window.location.search);
  }
  get(key) {
    return this.params.get(key);
  }
  set(key, value) {
    const params = this.params;
    params.set(key, value);
    this.updateURL(params);
  }
  delete(key) {
    const params = this.params;
    params.delete(key);
    this.updateURL(params);
  }
  replace(params) {
    const newParams = new URLSearchParams();
    for (const key in params) {
      const value = params[key];
      if (value !== null) newParams.set(key, value);
    }
    this.updateURL(newParams, true);
  }
  updateURL(params, replace = false) {
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    replace
      ? history.replaceState(null, "", newUrl)
      : history.pushState(null, "", newUrl);
    this.notifyListeners(params);
  }
  listen(callback) {
    this.listeners.push(callback);
  }
  notifyListeners(params) {
    for (const cb of this.listeners) {
      cb(params);
    }
  }
  // Optional: auto-listen to popstate (browser back/forward)
  enablePopStateListener() {
    window.addEventListener("popstate", () => {
      this.notifyListeners(this.params);
    });
  }
}
var pphp = PPHP.instance;
var store = PPHPLocalStore.getInstance();
var searchParams = SearchParamsManager.getInstance();
