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
 * content wider than the screen; text overlapping text, or clipped by its box; an
 * empty or collapsed section; sibling sections whose content edges disagree; and a
 * list of items with numbers in it built as side-by-side columns — misaligned when
 * its rows no longer line up, and reported even when they do, because a name and
 * its price in different columns line up only by luck.
 *
 * PROCESSING IS CHEAP, LOOKING IS NOT. The host runs this freely — after every
 * builder session that writes a page, and on every page map — so the consultant's
 * looking can be pointed at what is wrong rather than spread over everything.
 *
 * WHAT IS DELIBERATELY NOT HERE: taste. Every finding is a fault on any site, in
 * any style; nothing here says a page is ugly.
 */

import type { BrowserDriverFactory } from '../capture/types'
import { VIEWPORTS } from '../capture/screenshot'
import type { MeasureDeps } from './measure-core'

/** The two widths every page is checked at, by the names the consultant uses. */
export const LAYOUT_WIDTHS: readonly { name: LayoutWidthName; width: number }[] = [
  { name: 'desktop', width: VIEWPORTS.desktop.width },
  { name: 'phone', width: VIEWPORTS.mobile.width },
]

export type LayoutWidthName = 'desktop' | 'phone'

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
 */
export const LAYOUT_SCRIPT = String.raw`(() => {
  const vw = window.innerWidth;
  const out = { width: vw, findings: [] };
  const add = (section, kind, text) => out.findings.push({ section, kind, text });
  const real = (el) => Array.from(el.children).filter((c) => c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE');
  let root = document.querySelector('body > .l1-0');
  if (!root) return out;
  let at = '0';
  let kids = real(root);
  while (kids.length === 1 && real(kids[0]).length > 0) { at += '.0'; root = kids[0]; kids = real(root); }
  const px = (n) => Math.round(n) + 'px';
  const style = (el) => getComputedStyle(el);
  const shown = (el) => {
    const s = style(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
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
  let sidewaysNamed = false;

  kids.forEach((section, i) => {
    const address = at + '.' + i;
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
        if (rects[t].some((r) => r.right > c.right + 1 || r.left < c.left - 1 || r.bottom > c.bottom + 1 || r.top < c.top - 1)) clip = up;
      }
      if (clip) add(address, 'clipped', quote(el) + ' is cut off by the box it sits in');
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
          (empties ? '; an empty cell takes no height' : '') + '. Build it as one row per item, with the item and its values in that row');
      } else {
        add(address, 'split_rows', 'has a list built as ' + listy.length + ' side-by-side columns of ' + counts[0] +
          ' entries, so each row is split across columns and lines up only by luck. Build it as one row per item');
      }
    }

    // ── the section's content edges, compared below ──
    let frame = section;
    for (let next = real(frame).filter(shown); next.length === 1 && !leaf(next[0]); next = real(frame).filter(shown)) frame = next[0];
    const edges = contentBox(frame);
    if (edges.left > 1 || edges.right < vw - 1) frames.push({ address, left: Math.round(edges.left), right: Math.round(edges.right) });
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
