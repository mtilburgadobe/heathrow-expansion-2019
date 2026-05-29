import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  getMetadata,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/* =====================================================================
   STATIC-TO-EDS OVERLAY ENGINE

   See experiments/knowledge/architecture.md for the design.

   Flow:
     1. Page loads — main contains DA-authored block tables.
     2. readBlockSlots() captures slot data from the current DOM.
     3. fetch /templates/<template-name>.html — the original static
        page's <main> structure with [data-slot] markers.
     4. applySlotsToTemplate() writes slot content into the template.
     5. main.innerHTML is replaced with the populated template.
     6. Standard EDS decoration is skipped on overlay-controlled main.
   ===================================================================== */

/**
 * Read block-table content from a DA-shaped main element.
 * Block layout (post-pipeline):
 *   main > div(section) > div.blockname > div(row) > div(cell)
 * Returns { blockClassName: { slotName: htmlString, ... } }.
 */
function readBlockSlots(main) {
  const slots = {};
  main.querySelectorAll(':scope > div > div').forEach((block) => {
    const blockName = block.className.trim().split(/\s+/)[0];
    if (!blockName) return;
    slots[blockName] = slots[blockName] || {};
    block.querySelectorAll(':scope > div').forEach((row) => {
      const cells = row.querySelectorAll(':scope > div');
      if (cells.length >= 2) {
        const name = cells[0].textContent.trim();
        if (name) slots[blockName][name] = cells[1].innerHTML.trim();
      }
    });
  });
  return slots;
}

/**
 * Parse an HTML fragment string and return the first matching element,
 * or null if none. Used to lift element-typed values out of DA cells.
 */
function parseFirst(value, selector) {
  const tmp = document.createElement('div');
  tmp.innerHTML = value;
  return tmp.querySelector(selector);
}

/**
 * Write a slot value into a template element. Behavior is element-typed.
 */
function writeSlot(el, value) {
  const { tagName } = el;
  if (tagName === 'IMG') {
    // If the DA cell contains a <picture>, upgrade the template <img> to the
    // full picture so WebP/AVIF <source> elements are preserved. Copy
    // loading and fetchpriority from the template img to the new inner img.
    const newPic = parseFirst(value, 'picture');
    if (newPic) {
      const newImg = newPic.querySelector('img');
      if (newImg) {
        const loading = el.getAttribute('loading');
        const fetchpriority = el.getAttribute('fetchpriority');
        if (loading) newImg.setAttribute('loading', loading);
        if (fetchpriority) newImg.setAttribute('fetchpriority', fetchpriority);
        if (el.alt && !newImg.alt) newImg.alt = el.alt;
      }
      el.replaceWith(newPic);
      return;
    }
    const img = parseFirst(value, 'img');
    if (img) {
      el.src = img.getAttribute('src');
      if (img.alt) el.alt = img.alt;
    }
    return;
  }
  if (tagName === 'PICTURE') {
    const newPic = parseFirst(value, 'picture');
    if (newPic) el.replaceWith(newPic);
    return;
  }
  // Background-image slots on <a> must be handled before the link branch —
  // otherwise the link writer replaces the inner tile structure with just
  // the DA cell's <img>, wiping nested [data-slot] children (e.g. tile labels).
  if (tagName === 'A' && !(el.style && el.style.backgroundImage)) {
    const a = parseFirst(value, 'a');
    if (a) {
      el.href = a.getAttribute('href');
      el.innerHTML = a.innerHTML;
    } else {
      el.innerHTML = value;
    }
    return;
  }
  // Background-image slot: target element has an inline
  // style="background-image:url(...)". DA cell carries an <img>;
  // extract its src and replace just the background-image URL,
  // preserving any other inline styles on the element. Lets pages
  // with CSS-driven photos (hero backdrops, card tiles where the
  // image is the container's background) expose those images as DA
  // slots without restructuring source markup.
  if (el.style && el.style.backgroundImage) {
    const img = parseFirst(value, 'img');
    if (img) {
      const newSrc = img.getAttribute('src');
      // Double-quote — URLs more commonly contain ' than " (which
      // would have to be percent-encoded), so " is the safer wrap.
      el.style.backgroundImage = `url("${newSrc}")`;
    }
    return;
  }
  // Heading slots: if the DA cell value is wrapped in a same-tag heading
  // (e.g. <h1>...</h1> for a <h1 data-slot>), setting innerHTML directly
  // triggers the browser's auto-close — the parser ends the outer <h1>
  // before opening the inner one, producing an empty template <h1>
  // followed by an orphaned <h1> sibling. Unwrap the inner heading's
  // content and use that as innerHTML to keep a single clean heading.
  if (/^H[1-6]$/.test(tagName)) {
    const tmp = document.createElement('div');
    tmp.innerHTML = value;
    const inner = tmp.querySelector(tagName.toLowerCase());
    el.innerHTML = inner ? inner.innerHTML : value;
    return;
  }
  // Default: text / inline-HTML slot
  el.innerHTML = value;
}

/**
 * Walk template sections, match each section's first class to a block
 * in `slots`, and write slot values into [data-slot] markers.
 */
function applySlotsToTemplate(templateMain, slots) {
  templateMain.querySelectorAll('section[class]').forEach((section) => {
    const blockName = section.className.trim().split(/\s+/)[0];
    const blockSlots = slots[blockName];
    if (!blockSlots) return;
    section.querySelectorAll('[data-slot]').forEach((el) => {
      const slotName = el.getAttribute('data-slot');
      if (slotName in blockSlots) writeSlot(el, blockSlots[slotName]);
    });
  });
}

/**
 * Resolve the template name from page metadata, body[data-template], or
 * null if no overlay applies.
 */
function resolveTemplateName() {
  const meta = getMetadata('template');
  if (meta) return meta;
  return document.body.getAttribute('data-template') || null;
}

/**
 * Apply the static-page overlay to main.
 * Returns true if the overlay ran, false otherwise.
 */
async function applyTemplateOverlay(main) {
  const templateName = resolveTemplateName();
  if (!templateName) return false;

  const slots = readBlockSlots(main);

  // Preload the LCP hero image as soon as its URL is known from the DA
  // slot data — before the template fetch completes. Eliminates the
  // discovery delay where the browser can't see the image URL until after
  // main.innerHTML is replaced.
  const heroImageHtml = slots['hero-block']?.['hero.image'];
  if (heroImageHtml) {
    const tmp = document.createElement('div');
    tmp.innerHTML = heroImageHtml;
    // Prefer the mobile WebP source (no media query) so the preload matches
    // the resource the browser actually renders. Fall back to img.src (PNG).
    const mobileWebP = tmp.querySelector('source[type="image/webp"]:not([media])');
    const heroImg = tmp.querySelector('img');
    const rawSrc = (mobileWebP?.getAttribute('srcset') ?? heroImg?.src ?? '').trim().split(/[\s,]+/)[0];
    if (rawSrc) {
      const preload = document.createElement('link');
      preload.rel = 'preload';
      preload.as = 'image';
      preload.href = rawSrc;
      preload.fetchPriority = 'high';
      document.head.appendChild(preload);
    }
  }

  // Load template-scoped CSS in parallel with the template HTML.
  // Cannot use loadCSS() here: it short-circuits on any <link href="...">
  // match, including rel="preload" links, so a preload in head.html would
  // prevent the stylesheet from ever being created. This inline loader
  // checks specifically for rel="stylesheet" so the preload and stylesheet
  // can coexist and the browser serves the stylesheet from the preload cache.
  const cssHref = `${window.hlx.codeBasePath}/styles/${templateName}.css`;
  const cssLoaded = (() => {
    if (document.querySelector(`head > link[rel="stylesheet"][href="${cssHref}"]`)) {
      return Promise.resolve();
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssHref;
    const p = new Promise((res, rej) => { link.onload = res; link.onerror = rej; });
    document.head.append(link);
    return p;
  })();

  const resp = await fetch(`${window.hlx.codeBasePath}/templates/${templateName}.html`, { credentials: 'omit' });
  if (!resp.ok) {
    // eslint-disable-next-line no-console
    console.warn(`[overlay] template not found: ${templateName}`);
    return false;
  }
  const templateHtml = await resp.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<!DOCTYPE html><html><body>${templateHtml}</body></html>`, 'text/html');
  const newMain = doc.body.querySelector('main');
  if (!newMain) {
    // eslint-disable-next-line no-console
    console.warn(`[overlay] template "${templateName}" has no <main>`);
    return false;
  }

  // Lift any top-level <link> resources the template declares into
  // <head>. Lets a template self-describe its head needs (font
  // preconnects, Google Fonts stylesheet, etc) without forcing those
  // links into the shared head.html for every page. Dedupe by the
  // resolved href + rel string so a template doesn't double-load a
  // resource that head.html already brings in.
  const existingLinks = [...document.head.querySelectorAll('link')];
  doc.body.querySelectorAll(':scope > link').forEach((link) => {
    const clone = link.cloneNode(true);
    if (existingLinks.some((l) => l.href === clone.href && l.rel === clone.rel)) return;
    document.head.appendChild(clone);
    existingLinks.push(clone);
  });

  applySlotsToTemplate(newMain, slots);

  main.innerHTML = newMain.innerHTML;
  main.dataset.overlay = templateName;

  await cssLoaded;
  return true;
}

/* =====================================================================
   Boilerplate decoration kept for non-overlay pages
   ===================================================================== */

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    if (h1.closest('.hero') || picture.closest('.hero')) return;
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

function buildAutoBlocks(main) {
  try {
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();
    if (a.querySelector('img') || p.textContent.trim() !== text) return;
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;
    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) {
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (!main) return;

  const overlayApplied = await applyTemplateOverlay(main);
  if (overlayApplied) {
    // Overlay-controlled main: template provides its own structure and
    // styles. Skip EDS section/block decoration to preserve the
    // original DOM exactly as the static page intended.
    document.body.classList.add('appear');
  } else {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

async function loadLazy(doc) {
  const main = doc.querySelector('main');

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  if (!main.dataset.overlay) {
    await loadSections(main);
  }

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  const loadQuickEdit = async (...args) => {
    // eslint-disable-next-line import/no-cycle
    const { default: initQuickEdit } = await import('../tools/quick-edit/quick-edit.js');
    initQuickEdit(...args);
  };

  const addSidekickListeners = (sk) => {
    sk.addEventListener('custom:quick-edit', loadQuickEdit);
  };

  const sk = document.querySelector('aem-sidekick');
  if (sk) {
    addSidekickListeners(sk);
  } else {
    document.addEventListener('sidekick-ready', () => {
      addSidekickListeners(document.querySelector('aem-sidekick'));
    }, { once: true });
  }
}

function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
}

export async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

(() => {
  const hasQE = new URL(window.location.href).searchParams.has('quick-edit');
  if (hasQE) import('../tools/quick-edit/quick-edit.js').then((mod) => mod.default());
})();
