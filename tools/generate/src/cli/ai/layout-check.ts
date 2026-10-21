/**
 * [[REQ-415]] — a mechanical look at a rendered page, for the faults a reading of
 * its words cannot see.
 *
 * THE FAILURE THIS EXISTS FOR. On 2026-10-20 a client opened their Prices page
 * just before publishing and found the colour price table misaligned — every
 * treatment name had slid up a row beside the wrong prices — and sections with
 * ragged edges. The consultant had signed the page off on a check of its WORDS,
 * which were right: the table was built as two columns, and an empty first cell
 * in the name column took no height. Nothing that reads the stored page could
 * have said so. A browser laying the page out can.
 *
 * WHAT IS CHECKED, at desktop and phone width, each named by the section it is in:
 * content wider than the screen; text overlapping text, or clipped by its box (text a box SCROLLS to — a wide
 * table on a phone, [[REQ-418]] — is reachable, so it is not reported as cut off); an
 * empty or collapsed section; sibling sections whose content edges disagree; and a
 * list of items with numbers in it built as side-by-side columns — misaligned when
 * its rows no longer line up, and reported even when they do, because a name and
 * its price in different columns line up only by luck.
 *
 * PROCESSING IS CHEAP, LOOKING IS NOT. The host runs this freely — after every
 * builder session that writes a page, and on every page map — so the consultant's
 * looking can be pointed at what is wrong rather than spread over everything.
 *
 * ONLY TEXT A READER CAN SEE IS MEASURED ([[BUG-237]]). Text inside a box of at
 * most a pixel that clips its content — the visually-hidden pattern a form uses
 * for its accessible labels and its honeypot — and a `<template>`'s inert content
 * are not on the page to anyone looking, so they are neither text over text, nor
 * cut off, nor a section that takes no height.
 *
 * TWO CRAFT DEFAULTS ARE MEASURED TOO ([[BUG-238]]), because a reminder in the
 * priming did not hold: a header whose logo renders too short or whose business
 * name is not clearly its largest text, and a heading that floats between the
 * content above and below it instead of sitting with the text it introduces.
 * Their thresholds are `layout-check.json`'s, not constants here.
 *
 * THE BUSINESS AT THE TOP OF EVERY PAGE ([[REQ-422]]). A page whose top shows
 * neither the business name nor a logo has no header, and a business name smaller
 * than the page's section headings does not read as the business. Both need to
 * know the name, which a site page states in `<meta name="application-name">`; a
 * page that does not (a bare L1 fixture) is not checked for either. The site's
 * shared header, drawn outside the page's own root, is measured as a section of
 * its own (`site-header`), and when there is one it IS the page's header.
 *
 * WHAT IS DELIBERATELY NOT HERE: taste. Every finding is a fault on any site, in
 * any style; nothing here says a page is ugly.
 */

import { L1_KEEP_ATTR } from '@1stcontact/site-schema'
import type { BrowserDriverFactory } from '../capture/types'
import { VIEWPORTS } from '../capture/screenshot'
import type { MeasureDeps } from './measure-core'
import layoutDocument from './layout-check.json'

/** The two widths every page is checked at, by the names the consultant uses. */
export const LAYOUT_WIDTHS: readonly { name: LayoutWidthName; width: number }[] = [
  { name: 'desktop', width: VIEWPORTS.desktop.width },
  { name: 'phone', width: VIEWPORTS.mobile.width },
]

export type LayoutWidthName = 'desktop' | 'phone'

/** [[BUG-238]] — the thresholds `layout-check.json` sets, as the in-page script reads them. */
const LAYOUT_THRESHOLDS = {
  /** The least logo height, by the width in px it applies from. */
  logoMinPx: Object.fromEntries(LAYOUT_WIDTHS.map((w) => [w.width, layoutDocument.brand.logoMinPx[w.name]])),
  nameOverNav: layoutDocument.brand.nameOverNav,
  belowOverAbove: layoutDocument.heading.belowOverAbove,
  minAbovePx: layoutDocument.heading.minAbovePx,
}

/** What the in-page script reports for one fault. */
export interface RawLayoutFinding {
  /** The section's address (`0.2`), or `null` for a fault of the page as a whole. */
  section: string | null
  kind: LayoutFindingKind
  /** What is wrong, in a sentence that does not name the section or the width. */
  text: string
}

export type LayoutFindingKind =
  | 'sideways'
  | 'overlap'
  | 'clipped'
  | 'collapsed'
  | 'empty'
  | 'edges'
  | 'misaligned_rows'
  | 'split_rows'
  | 'small_logo'
  | 'small_name'
  | 'loose_heading'
  | 'no_header'
  | 'name_smaller_than_headings'

/** One fault, on one page at one width. */
export interface LayoutFinding extends RawLayoutFinding {
  /** The page, as the consultant names it (its slug). */
  page: string
  width: number
  widthName: LayoutWidthName
  /** The section as the page stores it (`price-list`), else its address. */
  sectionName: string | null
}

/**
 * The in-page check. Run in the page after it has laid out, at the width it was
 * navigated at; answers `{ width, findings }`.
 *
 * SECTIONS ARE FOUND THE WAY `SECTIONS_SCRIPT` FINDS THEM (`picture.ts`): the
 * n-th element child of the L1 root is the node at `0.n`, the address
 * `describe_page` gives it, and a root that only wraps one container is
 * descended through. A page with no L1 root answers no findings rather than
 * guessed ones.
 *
 * A STRING, not a function's source: a bundler is free to rewrite a function
 * (injected helpers, renamed locals) into something that does not run in a page.
 * The thresholds are written into it from `layout-check.json`.
 */
export const LAYOUT_SCRIPT = String.raw`(() => {
  const CFG = ${JSON.stringify(LAYOUT_THRESHOLDS)};
  const vw = window.innerWidth;
  const out = { width: vw, findings: [] };
  const add = (section, kind, text) => out.findings.push({ section, kind, text });
  // [[REQ-420]] — a keep-with-next wrapper is not a node; its members are.
  const real = (el) => Array.from(el.children).filter((c) => c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE')
    .flatMap((c) => (c.hasAttribute('${L1_KEEP_ATTR}') ? real(c) : [c]));
  let root = document.querySelector('body > .l1-0');
  if (!root) return out;
  let at = '0';
  let kids = real(root);
  while (kids.length === 1 && real(kids[0]).length > 0) { at += '.0'; root = kids[0]; kids = real(root); }
  // [[REQ-422]] — the site's shared parts sit beside the page's root, each its own section.
  const part = (name) => { const w = document.querySelector('body > [data-l1-part="' + name + '"]'); return w ? real(w)[0] || null : null; };
  const siteHeader = part('header');
  const siteFooter = part('footer');
  const sections = [].concat(siteHeader ? [{ el: siteHeader, address: 'site-header', shared: true }] : [],
    kids.map((el, i) => ({ el, address: at + '.' + i, shared: false })),
    siteFooter ? [{ el: siteFooter, address: 'site-footer', shared: true }] : []);
  const brandMeta = document.querySelector('meta[name="application-name"]');
  const brandWord = ((brandMeta && brandMeta.getAttribute('content')) || '').toLowerCase().replace(/['\u2019]/g, '')
    .split(/[^\p{L}\p{N}]+/u).find((w) => w.length >= 3) || '';
  const namesBrand = (el) => brandWord !== '' && (el.textContent || '').toLowerCase().replace(/['\u2019]/g, '')
    .split(/[^\p{L}\p{N}]+/u).includes(brandWord);
  const px = (n) => Math.round(n) + 'px';
  const style = (el) => getComputedStyle(el);
  // A box of at most a pixel that clips what is in it shows none of it: the
  // visually-hidden (sr-only) pattern an accessible label or a honeypot uses.
  const sealed = new Map();
  const unseen = (el) => {
    if (!el || el === document.body) return false;
    if (sealed.has(el)) return sealed.get(el);
    const s = style(el);
    const r = el.getBoundingClientRect();
    const clips = s.overflowX !== 'visible' || s.overflowY !== 'visible' || s.clip !== 'auto' || s.clipPath !== 'none';
    const hidden = (clips && (r.width <= 1 || r.height <= 1)) || unseen(el.parentElement);
    sealed.set(el, hidden);
    return hidden;
  };
  const shown = (el) => {
    const s = style(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !unseen(el);
  };
  const words = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
  const quote = (el) => { const w = words(el); return '"' + (w.length > 40 ? w.slice(0, 37) + '...' : w) + '"'; };
  const ownText = (el) => Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim() !== '');
  const inline = (el) => style(el).display.startsWith('inline');
  const leaf = (el) => real(el).every(inline);
  const MEDIA = 'img,svg,video,picture,canvas,iframe,input,textarea,select,button';
  const textRects = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
  };
  const area = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
    Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const contentBox = (el) => {
    const r = el.getBoundingClientRect();
    const s = style(el);
    const l = parseFloat(s.paddingLeft) + parseFloat(s.borderLeftWidth);
    const rr = parseFloat(s.paddingRight) + parseFloat(s.borderRightWidth);
    return { left: r.left + l, right: r.right - rr };
  };
  const frames = [];
  const sideways = document.documentElement.scrollWidth > vw + 1;
  const size = (el) => parseFloat(style(el).fontSize) || 0;
  const median = (ns) => { const o = ns.slice().sort((p, q) => p - q); return o[Math.floor(o.length / 2)]; };
  // The least logo height configured for the widest checked width this screen reaches.
  const logoWidths = Object.keys(CFG.logoMinPx).map(Number).sort((p, q) => p - q);
  const minLogo = CFG.logoMinPx[logoWidths.filter((w) => w <= vw).pop() ?? logoWidths[0]];
  // A link to the home page: the business name, when it is a link, is one.
  const homeLink = (a) => {
    try { return /^(|index|home)(\.html?)?$/i.test(new URL(a.href, location.href).pathname.replace(/\/+$/, '').split('/').pop()); }
    catch (e) { return false; }
  };
  const HEADING = 'h1,h2,h3,h4,h5,h6';
  // Everything a reader sees on the page, as the content a heading sits between.
  const leaves = [root].concat(Array.from(root.querySelectorAll('*')))
    .filter((el) => (ownText(el) || el.matches(MEDIA)) && shown(el));
  const top = siteHeader || kids.find((k) => k.tagName !== 'TEMPLATE') || null;
  let sidewaysNamed = false;

  sections.forEach(({ el: section, address, shared }) => {
    if (section.tagName === 'TEMPLATE') return;
    const box = section.getBoundingClientRect();
    if (box.height < 2) { add(address, 'collapsed', 'takes no height, so nothing in it can be seen'); return; }
    if (style(section).display === 'none') return;
    const hasText = words(section) !== '';
    const bg = (el) => style(el).backgroundImage !== 'none';
    const hasMedia = section.querySelector(MEDIA) !== null || bg(section) ||
      Array.from(section.querySelectorAll('*')).some(bg);
    if (!hasText && !hasMedia) add(address, 'empty', 'has nothing in it to see');
    const all = [section].concat(Array.from(section.querySelectorAll('*'))).filter(shown);

    // ── wider than the screen ──
    if (sideways) {
      let right = 0; let left = 0; let culprit = null;
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.right > right) { right = r.right; if (r.right > vw + 1) culprit = el; }
        if (r.left < left) left = r.left;
      }
      if (right > vw + 1 || left < -1) {
        sidewaysNamed = true;
        add(address, 'sideways', 'is wider than the screen, so the page scrolls sideways: it reaches ' + px(right) +
          ' on a ' + px(vw) + ' screen' + (culprit && words(culprit) ? ' (at ' + quote(culprit) + ')' : ''));
      }
    }

    // ── text over text, and text cut off by its box ──
    const texts = all.filter(ownText);
    const rects = texts.map(textRects);
    for (let a = 0; a < texts.length; a++) {
      for (let b = a + 1; b < texts.length; b++) {
        if (texts[a].contains(texts[b]) || texts[b].contains(texts[a])) continue;
        const hit = rects[a].some((ra) => rects[b].some((rb) => area(ra, rb) > 16));
        if (hit) add(address, 'overlap', quote(texts[a]) + ' and ' + quote(texts[b]) + ' are drawn on top of each other');
      }
    }
    for (let t = 0; t < texts.length; t++) {
      const el = texts[t];
      let clip = null;
      if (el.scrollHeight > el.clientHeight + 1 && el.clientHeight > 0 && style(el).overflowY !== 'visible') clip = el;
      if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && style(el).overflowX !== 'visible') clip = el;
      for (let up = el.parentElement; !clip && up && section.contains(up); up = up.parentElement) {
        const s = style(up);
        if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
        const c = up.getBoundingClientRect();
        const scrollsX = s.overflowX === 'auto' || s.overflowX === 'scroll';
        const scrollsY = s.overflowY === 'auto' || s.overflowY === 'scroll';
        if (rects[t].some((r) => (!scrollsX && (r.right > c.right + 1 || r.left < c.left - 1)) || (!scrollsY && (r.bottom > c.bottom + 1 || r.top < c.top - 1)))) clip = up;
      }
      if (clip) add(address, 'clipped', quote(el) + ' is cut off by the box it sits in');
    }

    // ── the header: a logo too short, a business name no larger than the links ──
    // ── [[REQ-422]] the business at the top: its name or its logo, never smaller than the headings ──
    if (section === top && brandWord !== '') {
      const marks = all.filter((el) => el.tagName === 'IMG' || el.tagName.toLowerCase() === 'svg');
      const named = texts.filter(namesBrand);
      if (!marks.length && !named.length) {
        add(address, 'no_header', 'is the top of the page and shows neither the business name nor a logo, so the page has no header: ' +
          "give it the site's shared header, or put the business name at its top");
      }
      const h2s = Array.from(document.querySelectorAll('h2')).filter(shown);
      const biggest = h2s.reduce((m, h) => (size(h) > size(m) ? h : m), h2s[0]);
      if (biggest) {
        const headingPx = size(biggest);
        const name = named.reduce((m, el) => (m && size(m) >= size(el) ? m : el), null);
        const tallest = marks.reduce((m, el) => Math.max(m, el.getBoundingClientRect().height), 0);
        if (name && size(name) < headingPx - 0.25) {
          add(address, 'name_smaller_than_headings', 'has the business name ' + quote(name) + ' at ' + px(size(name)) +
            ', smaller than the page\'s ' + px(headingPx) + ' section heading ' + quote(biggest) +
            ': the name must never be smaller than the headings — make it at least ' + px(headingPx));
        } else if (!name && marks.length && tallest < headingPx * 0.7 - 0.5) {
          add(address, 'name_smaller_than_headings', 'has its logo only ' + px(tallest) + ' tall, shorter than the capitals of the page\'s ' +
            px(headingPx) + ' section heading ' + quote(biggest) + ': make it at least ' + px(headingPx * 0.7) + ' tall');
        }
      }
    }

    if (section === top && section.querySelector('a[href]')) {
      const logos = all.filter((el) => el.tagName === 'IMG');
      const tallest = logos.reduce((m, el) => Math.max(m, el.getBoundingClientRect().height), 0);
      if (logos.length && tallest < minLogo - 0.5) {
        add(address, 'small_logo', 'has its logo only ' + px(tallest) + ' tall, too small to register as the business: make it at least ' +
          px(minLogo) + ' tall at this width');
      }
      const navs = []; const names = [];
      for (const el of texts) {
        const a = el.closest('a');
        if (a && section.contains(a) && !(homeLink(a) && !/^home$/i.test(words(a)))) navs.push(el); else names.push(el);
      }
      // A header of a logo and links only may carry its name in the logo, drawn or pictured.
      const marked = logos.length > 0 || all.some((el) => el.tagName.toLowerCase() === 'svg');
      if (navs.length >= 2 && (names.length || !marked)) {
        const navSize = median(navs.map(size));
        const want = navSize * CFG.nameOverNav;
        const pool = names.length ? names : texts;
        const name = pool.reduce((m, el) => (size(el) > size(m) ? el : m));
        if (size(name) < want - 0.25) {
          add(address, 'small_name', names.length
            ? 'has the business name ' + quote(name) + ' at ' + px(size(name)) + ', not clearly the largest text in the header beside its ' +
              px(navSize) + ' navigation links: make it at least ' + px(want)
            : 'has no text clearly larger than its ' + px(navSize) + ' navigation links, so the business name does not stand out: make it at least ' + px(want));
        }
      }
    }

    // ── a heading that floats instead of sitting with its text ──
    for (const h of all.filter((el) => el.matches(HEADING))) {
      const r = h.getBoundingClientRect();
      let above = null; let below = null; let next = null;
      for (const el of leaves) {
        if (h.contains(el) || el.contains(h)) continue;
        const q = el.getBoundingClientRect();
        if (q.right <= r.left + 1 || q.left >= r.right - 1) continue;
        if (q.bottom <= r.top + 1 && (above === null || q.bottom > above)) above = q.bottom;
        if (q.top >= r.bottom - 1 && (below === null || q.top < below)) { below = q.top; next = el; }
      }
      // A heading straight above another is judged by the lower one.
      if (above === null || below === null || next.closest(HEADING)) continue;
      const gapAbove = r.top - above; const gapBelow = below - r.bottom;
      if (gapAbove >= CFG.minAbovePx && gapBelow >= gapAbove * CFG.belowOverAbove) {
        add(address, 'loose_heading', 'has the heading ' + quote(h) + ' with ' + px(gapBelow) + ' of space below it and ' + px(gapAbove) +
          ' above, so it floats between them instead of sitting with the text it introduces: make the space below it clearly smaller than the space above');
      }
    }

    // ── a list of items built as side-by-side columns ──
    const used = new Set();
    for (const parent of all) {
      if (used.has(parent)) continue;
      const cols = real(parent).filter(shown);
      if (cols.length < 2) continue;
      const boxes = cols.map((c) => c.getBoundingClientRect()).sort((p, q) => p.left - q.left);
      const sideBySide = boxes.every((r, k) => k === 0 || r.left >= boxes[k - 1].right - 1);
      if (!sideBySide) continue;
      const lists = cols.map((c) => real(c).filter((x) => style(x).display !== 'none'));
      const listy = lists.filter((items) => items.length >= 3 && items.every(leaf) && items.every((x) => {
        const r = x.getBoundingClientRect();
        const line = parseFloat(style(x).lineHeight) || parseFloat(style(x).fontSize) * 1.3 || 20;
        return r.height <= line * 2.5;
      }));
      if (listy.length < 2) continue;
      const numeric = listy.some((items) => items.filter((x) => /\d/.test(words(x))).length >= items.length * 2 / 3);
      if (!numeric) continue;
      cols.forEach((c) => { used.add(c); c.querySelectorAll('*').forEach((x) => used.add(x)); });
      const counts = listy.map((items) => items.length);
      const empties = listy.some((items) => items.some((x) => x.getBoundingClientRect().height < 2));
      let wrong = null;
      if (new Set(counts).size > 1) {
        wrong = 'its columns hold different numbers of entries (' + counts.join(', ') + ')';
      } else {
        for (let row = 0; row < counts[0] && !wrong; row++) {
          const cells = listy.map((items) => items[row]);
          const tops = cells.map((x) => x.getBoundingClientRect().top);
          if (Math.max.apply(null, tops) - Math.min.apply(null, tops) > 4) {
            wrong = 'its rows do not line up from row ' + (row + 1) + ': ' + cells.map(quote).join(' sits beside ');
          }
        }
      }
      if (wrong) {
        add(address, 'misaligned_rows', 'has a list built as ' + listy.length + ' side-by-side columns, and ' + wrong +
          (empties ? '; an empty cell takes no height' : '') + '. Build it as a table element, one row per item, with the item and its values in that row');
      } else {
        add(address, 'split_rows', 'has a list built as ' + listy.length + ' side-by-side columns of ' + counts[0] +
          ' entries, so each row is split across columns and lines up only by luck. Build it as a table element, one row per item');
      }
    }

    // ── the section's content edges, compared below ──
    let frame = section;
    for (let next = real(frame).filter(shown); next.length === 1 && !leaf(next[0]); next = real(frame).filter(shown)) frame = next[0];
    const edges = contentBox(frame);
    if (!shared && (edges.left > 1 || edges.right < vw - 1)) frames.push({ address, left: Math.round(edges.left), right: Math.round(edges.right) });
  });

  if (sideways && !sidewaysNamed) {
    add(null, 'sideways', 'is wider than the screen, so it scrolls sideways: it is ' +
      px(document.documentElement.scrollWidth) + ' wide on a ' + px(vw) + ' screen');
  }

  // ── sibling sections that disagree about where content starts and ends ──
  if (frames.length >= 2) {
    const near = (a, b) => Math.abs(a.left - b.left) <= 2 && Math.abs(a.right - b.right) <= 2;
    let best = frames[0]; let bestCount = 0;
    for (const f of frames) {
      const n = frames.filter((g) => near(f, g)).length;
      if (n > bestCount) { best = f; bestCount = n; }
    }
    if (bestCount >= 2) {
      for (const f of frames) {
        if (!near(f, best)) {
          add(f.address, 'edges', 'has its content from ' + px(f.left) + ' to ' + px(f.right) +
            ', where the other sections on this page run from ' + px(best.left) + ' to ' + px(best.right));
        }
      }
    }
  }
  return out;
})()`

/** What {@link LAYOUT_SCRIPT} answers. */
interface RawLayout {
  width: number
  findings: RawLayoutFinding[]
}

/**
 * The page at `url`, checked at {@link LAYOUT_WIDTHS}. `sections` is how the page
 * stores its sections, in order, so a finding can name one the way the page does.
 */
export async function checkLayoutAt(
  url: string,
  page: string,
  driverFactory: BrowserDriverFactory,
  sections: readonly string[] = [],
): Promise<LayoutFinding[]> {
  const found: LayoutFinding[] = []
  for (const { name, width } of LAYOUT_WIDTHS) {
    const driver = await driverFactory()
    try {
      await driver.navigate(url, { width, height: 900 })
      const raw = await driver.query<RawLayout>(LAYOUT_SCRIPT)
      for (const f of raw?.findings ?? []) {
        found.push({ ...f, page, width, widthName: name, sectionName: sectionName(f.section, sections) })
      }
    } finally {
      await driver.close()
    }
  }
  return found
}

/** A section's stored name when the address is one of the page's own sections. */
function sectionName(address: string | null, sections: readonly string[]): string | null {
  if (address === null) return null
  const m = /^0\.(\d+)$/.exec(address)
  return m && sections[Number(m[1])] !== undefined ? sections[Number(m[1])] : address
}

/** Checks one page of the draft by its slug. */
export type LayoutChecker = (pageSlug: string, sections?: readonly string[]) => Promise<LayoutFinding[]>

/**
 * A layout checker over the same preview channel `screenshot` and the page
 * measurer use, so what is checked is exactly what is looked at.
 */
export function browserLayoutChecker(deps: MeasureDeps): LayoutChecker {
  return (pageSlug, sections = []) =>
    checkLayoutAt(
      new URL(
        `/preview/${encodeURIComponent(deps.slug)}/draft/${encodeURIComponent(pageSlug)}.html`,
        new URL(deps.origin),
      ).toString(),
      pageSlug,
      deps.driverFactory,
      sections,
    )
}

/** One finding as a plain line: page, width, section, what is wrong. */
export function layoutLine(f: LayoutFinding): string {
  const where = f.sectionName === null ? 'the page' : `section ${f.sectionName}`
  return `${f.page}, ${f.widthName} (${f.width}px): ${where} ${f.text}.`
}
