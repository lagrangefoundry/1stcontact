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
 * A RUNNER AND A REGISTRY OF NAMED CHECKS ([[REQ-429]]). The runner finds the
 * page's sections and offers what every check needs (what is shown, text boxes,
 * the ink of the letters, quoting, font sizes); each check in
 * {@link LAYOUT_CHECKS} is one entry — an id, the finding kinds it reports, and
 * its in-page body — with its thresholds under its id in `layout-check.json`.
 * Adding a check is adding an entry. A check that throws is reported against its
 * id and the others still run. Every check runs at every width in
 * `layout-check.json` (desktop, tablet, phone), each finding named by the section
 * it is in:
 *
 * - content wider than the screen; text, a control or an image drawn over text or
 *   a control; text clipped by its box (text a box SCROLLS to — a wide table on a
 *   phone, [[REQ-418]] — is reachable, so it is not reported as cut off); controls
 *   too close together; an empty or collapsed section; sibling sections whose
 *   content edges disagree;
 * - anything built as a table — a table, a grid of short cells, a list built as
 *   side-by-side columns — whose rows do not share a baseline or whose columns
 *   are not aligned; and a column-built list with numbers in it even when it does
 *   line up, because a name and its price in different columns line up only by luck;
 * - a heading that does not sit with its text, measured between the letters;
 *   a short word stranded on a line of large text; a menu label that wraps; menu
 *   links too small, or a menu taking over the first screen, on a phone.
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
import type { MeasureDeps } from './measure-core'
import layoutDocument from './layout-check.json'

export type LayoutWidthName = keyof typeof layoutDocument.widths

/** The widths every page is checked at (`layout-check.json`), by the names the consultant uses. */
export const LAYOUT_WIDTHS: readonly { name: LayoutWidthName; width: number; height: number }[] = (
  Object.entries(layoutDocument.widths) as [LayoutWidthName, { width: number; height: number }][]
).map(([name, w]) => ({ name, width: w.width, height: w.height }))

/**
 * Every check's thresholds, by check id, as the in-page script reads them: a
 * value given per width name becomes `{ '@width': { px: value } }`, resolved in
 * the page for the width it was laid out at.
 */
function byWidth(value: unknown): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value
  const entries = Object.entries(value as Record<string, unknown>)
  const widthOf = (name: string) => LAYOUT_WIDTHS.find((w) => w.name === name)?.width
  if (entries.length && entries.every(([k]) => widthOf(k) !== undefined)) {
    return { '@width': Object.fromEntries(entries.map(([k, v]) => [widthOf(k), byWidth(v)])) }
  }
  return Object.fromEntries(entries.map(([k, v]) => [k, byWidth(v)]))
}

const LAYOUT_THRESHOLDS = byWidth(
  Object.fromEntries(Object.entries(layoutDocument).filter(([key]) => key !== 'about' && key !== 'widths')),
)

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
  | 'ragged_column'
  | 'small_logo'
  | 'small_name'
  | 'loose_heading'
  | 'no_header'
  | 'name_smaller_than_headings'
  | 'stranded_word'
  | 'nav_wraps'
  | 'small_nav'
  | 'tall_menu'
  | 'crowded'
  /** A check that threw: a fault in the check, not in the page. */
  | 'check_failed'

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
 * One named check. `run` is the in-page source of `(H, C, add) => void`: `H` the
 * runner's helpers and sections, `C` this check's thresholds (its id's entry in
 * `layout-check.json`, resolved for the width), `add(section, kind, text)` to
 * report a finding of one of `kinds`.
 */
export interface LayoutCheck {
  id: string
  kinds: readonly Exclude<LayoutFindingKind, 'check_failed'>[]
  run: string
}

/*
 * THE CHECKS. Each body is a STRING, not a function's source: a bundler is free to
 * rewrite a function (injected helpers, renamed locals) into something that does
 * not run in a page.
 */
export const LAYOUT_CHECKS: readonly LayoutCheck[] = [
  {
    id: 'collapsed',
    kinds: ['collapsed', 'empty'],
    run: String.raw`(H, C, add) => {
      for (const S of H.parts) {
        if (S.el.getBoundingClientRect().height < 2) { add(S.address, 'collapsed', 'takes no height, so nothing in it can be seen'); continue; }
        if (H.style(S.el).display === 'none') continue;
        const bg = (el) => H.style(el).backgroundImage !== 'none';
        const hasMedia = S.el.querySelector(H.MEDIA) !== null || bg(S.el) || Array.from(S.el.querySelectorAll('*')).some(bg);
        if (H.words(S.el) === '' && !hasMedia) add(S.address, 'empty', 'has nothing in it to see');
      }
    }`,
  },
  {
    id: 'sideways',
    kinds: ['sideways'],
    run: String.raw`(H, C, add) => {
      if (document.documentElement.scrollWidth <= H.vw + 1) return;
      let named = false;
      for (const S of H.sections) {
        let right = 0; let left = 0; let culprit = null;
        for (const el of S.all) {
          const r = el.getBoundingClientRect();
          if (r.right > right) { right = r.right; if (r.right > H.vw + 1) culprit = el; }
          if (r.left < left) left = r.left;
        }
        if (right > H.vw + 1 || left < -1) {
          named = true;
          add(S.address, 'sideways', 'is wider than the screen, so the page scrolls sideways: it reaches ' + H.px(right) +
            ' on a ' + H.px(H.vw) + ' screen' + (culprit && H.words(culprit) ? ' (at ' + H.quote(culprit) + ')' : ''));
        }
      }
      if (!named) {
        add(null, 'sideways', 'is wider than the screen, so it scrolls sideways: it is ' +
          H.px(document.documentElement.scrollWidth) + ' wide on a ' + H.px(H.vw) + ' screen');
      }
    }`,
  },
  {
    // Text over text; and [[REQ-429]] a control or an image drawn over text, or over another control.
    id: 'overlap',
    kinds: ['overlap'],
    run: String.raw`(H, C, add) => {
      for (const S of H.sections) {
        const { texts, rects } = S;
        for (let a = 0; a < texts.length; a++) {
          for (let b = a + 1; b < texts.length; b++) {
            if (texts[a].contains(texts[b]) || texts[b].contains(texts[a])) continue;
            const hit = rects[a].some((ra) => rects[b].some((rb) => H.area(ra, rb) > C.minAreaPx));
            if (hit) add(S.address, 'overlap', H.quote(texts[a]) + ' and ' + H.quote(texts[b]) + ' are drawn on top of each other');
          }
        }
        const over = S.all.filter((el) => el.tagName === 'IMG' || H.buttonLike(el));
        for (let i = 0; i < over.length; i++) {
          const o = over[i];
          const box = o.getBoundingClientRect();
          // Over text: only when it is the one drawn on top, which text laid over a picture is not.
          for (let t = 0; t < texts.length; t++) {
            if (o.contains(texts[t]) || texts[t].contains(o)) continue;
            const hit = rects[t].find((r) => H.area(r, box) > C.minAreaPx);
            if (!hit) continue;
            const x = (Math.max(hit.left, box.left) + Math.min(hit.right, box.right)) / 2;
            const y = (Math.max(hit.top, box.top) + Math.min(hit.bottom, box.bottom)) / 2;
            const at = H.topAt(x, y);
            if (at && o.contains(at)) add(S.address, 'overlap', H.label(o) + ' is drawn over ' + H.quote(texts[t]));
          }
          for (let j = i + 1; j < over.length; j++) {
            const p = over[j];
            if (o.contains(p) || p.contains(o) || (o.tagName === 'IMG' && p.tagName === 'IMG')) continue;
            if (H.area(box, p.getBoundingClientRect()) > C.minAreaPx) {
              add(S.address, 'overlap', H.label(o) + ' and ' + H.label(p) + ' are drawn on top of each other');
            }
          }
        }
      }
    }`,
  },
  {
    id: 'clipped',
    kinds: ['clipped'],
    run: String.raw`(H, C, add) => {
      for (const S of H.sections) {
        for (let t = 0; t < S.texts.length; t++) {
          const el = S.texts[t];
          let clip = null;
          if (el.scrollHeight > el.clientHeight + 1 && el.clientHeight > 0 && H.style(el).overflowY !== 'visible') clip = el;
          if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && H.style(el).overflowX !== 'visible') clip = el;
          for (let up = el.parentElement; !clip && up && S.el.contains(up); up = up.parentElement) {
            const s = H.style(up);
            if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
            const c = up.getBoundingClientRect();
            const scrollsX = s.overflowX === 'auto' || s.overflowX === 'scroll';
            const scrollsY = s.overflowY === 'auto' || s.overflowY === 'scroll';
            if (S.rects[t].some((r) => (!scrollsX && (r.right > c.right + 1 || r.left < c.left - 1)) || (!scrollsY && (r.bottom > c.bottom + 1 || r.top < c.top - 1)))) clip = up;
          }
          if (clip) add(S.address, 'clipped', H.quote(el) + ' is cut off by the box it sits in');
        }
      }
    }`,
  },
  {
    // [[REQ-422]] the business at the top: its name or its logo, never smaller than the headings.
    id: 'business',
    kinds: ['no_header', 'name_smaller_than_headings'],
    run: String.raw`(H, C, add) => {
      const S = H.sections.find((s) => s.el === H.top);
      if (!S || H.brandWord === '') return;
      const marks = S.all.filter((el) => el.tagName === 'IMG' || el.tagName.toLowerCase() === 'svg');
      const named = S.texts.filter(H.namesBrand);
      if (!marks.length && !named.length) {
        add(S.address, 'no_header', 'is the top of the page and shows neither the business name nor a logo, so the page has no header: ' +
          "give it the site's shared header, or put the business name at its top");
      }
      const h2s = Array.from(document.querySelectorAll('h2')).filter(H.shown);
      const biggest = h2s.reduce((m, h) => (H.size(h) > H.size(m) ? h : m), h2s[0]);
      if (!biggest) return;
      const headingPx = H.size(biggest);
      const name = named.reduce((m, el) => (m && H.size(m) >= H.size(el) ? m : el), null);
      const tallest = marks.reduce((m, el) => Math.max(m, el.getBoundingClientRect().height), 0);
      if (name && H.size(name) < headingPx - 0.25) {
        add(S.address, 'name_smaller_than_headings', 'has the business name ' + H.quote(name) + ' at ' + H.px(H.size(name)) +
          ", smaller than the page's " + H.px(headingPx) + ' section heading ' + H.quote(biggest) +
          ': the name must never be smaller than the headings — make it at least ' + H.px(headingPx));
      } else if (!name && marks.length && tallest < headingPx * 0.7 - 0.5) {
        add(S.address, 'name_smaller_than_headings', 'has its logo only ' + H.px(tallest) + " tall, shorter than the capitals of the page's " +
          H.px(headingPx) + ' section heading ' + H.quote(biggest) + ': make it at least ' + H.px(headingPx * 0.7) + ' tall');
      }
    }`,
  },
  {
    // [[BUG-238]] the header: a logo too short, a business name no larger than the links.
    id: 'brand',
    kinds: ['small_logo', 'small_name'],
    run: String.raw`(H, C, add) => {
      const S = H.sections.find((s) => s.el === H.top);
      if (!S || !S.el.querySelector('a[href]')) return;
      const logos = S.all.filter((el) => el.tagName === 'IMG');
      const tallest = logos.reduce((m, el) => Math.max(m, el.getBoundingClientRect().height), 0);
      if (logos.length && tallest < C.logoMinPx - 0.5) {
        add(S.address, 'small_logo', 'has its logo only ' + H.px(tallest) + ' tall, too small to register as the business: make it at least ' +
          H.px(C.logoMinPx) + ' tall at this width');
      }
      const navs = []; const names = [];
      for (const el of S.texts) {
        const a = el.closest('a');
        if (a && S.el.contains(a) && !(H.homeLink(a) && !/^home$/i.test(H.words(a)))) navs.push(el); else names.push(el);
      }
      // A header of a logo and links only may carry its name in the logo, drawn or pictured.
      const marked = logos.length > 0 || S.all.some((el) => el.tagName.toLowerCase() === 'svg');
      if (navs.length < 2 || (!names.length && marked)) return;
      const navSize = H.median(navs.map(H.size));
      const want = navSize * C.nameOverNav;
      const pool = names.length ? names : S.texts;
      const name = pool.reduce((m, el) => (H.size(el) > H.size(m) ? el : m));
      if (H.size(name) < want - 0.25) {
        add(S.address, 'small_name', names.length
          ? 'has the business name ' + H.quote(name) + ' at ' + H.px(H.size(name)) + ', not clearly the largest text in the header beside its ' +
            H.px(navSize) + ' navigation links: make it at least ' + H.px(want)
          : 'has no text clearly larger than its ' + H.px(navSize) + ' navigation links, so the business name does not stand out: make it at least ' + H.px(want));
      }
    }`,
  },
  {
    // A heading that does not sit with its text — [[REQ-429]] measured between the letters.
    id: 'heading',
    kinds: ['loose_heading'],
    run: String.raw`(H, C, add) => {
      const column = (a, b) => b.right > a.left + 1 && b.left < a.right - 1;
      // The nearest shown thing above and below el in its column, by box.
      const near = (el, within) => {
        const r = el.getBoundingClientRect();
        let above = null; let below = null; let ab = 0; let bt = 0;
        for (const q of H.leaves) {
          if (el.contains(q) || q.contains(el) || (within && !within.contains(q))) continue;
          const b = q.getBoundingClientRect();
          if (!column(r, b)) continue;
          if (b.bottom <= r.top + 1 && (above === null || b.bottom > ab)) { above = q; ab = b.bottom; }
          if (b.top >= r.bottom - 1 && (below === null || b.top < bt)) { below = q; bt = b.top; }
        }
        return { above, below };
      };
      for (const S of H.sections) {
        for (const h of S.all.filter((el) => el.matches(H.HEADING))) {
          const { above, below: next } = near(h, null);
          // A heading straight above another is judged by the lower one.
          if (next === null || next.closest(H.HEADING)) continue;
          const ink = H.ink(h);
          const gapBelow = H.ink(next).top - ink.bottom;
          if (above !== null) {
            const gapAbove = ink.top - H.ink(above).bottom;
            if (gapAbove >= C.minAbovePx && gapBelow >= gapAbove * C.belowOverAbove) {
              add(S.address, 'loose_heading', 'has the heading ' + H.quote(h) + ' with ' + H.px(gapBelow) + ' of space below it and ' + H.px(gapAbove) +
                ' above, measured between the letters, so it floats between them instead of sitting with the text it introduces: make the space below it clearly smaller than the space above');
              continue;
            }
          }
          // Closer to its text than that text's paragraphs sit to each other.
          if (!H.ownText(next)) continue;
          const after = near(next, S.el).below;
          if (after === null || after.closest(H.HEADING) || !H.ownText(after)) continue;
          const gapText = H.ink(after).top - H.ink(next).bottom;
          if (gapText >= C.minParagraphGapPx && gapBelow >= gapText * C.belowOverParagraph) {
            add(S.address, 'loose_heading', 'has the heading ' + H.quote(h) + ' with ' + H.px(gapBelow) + ' of space below it, measured between the letters, where the text under it sits ' +
              H.px(gapText) + ' apart (' + H.quote(next) + ' to ' + H.quote(after) + '), so the heading does not sit with the text it introduces: make the space below it at most ' +
              H.px(gapText * C.belowOverParagraph * 0.9) + ', or the space between that text larger');
          }
        }
      }
    }`,
  },
  {
    // [[REQ-429]] a short word left alone on a line of large text.
    id: 'stranded_word',
    kinds: ['stranded_word'],
    run: String.raw`(H, C, add) => {
      for (const S of H.sections) {
        for (const el of S.texts) {
          if (H.inline(el) || H.size(el) < C.minFontPx) continue;
          const lines = H.lines(H.wordBoxes(el, true));
          if (lines.length < 2) continue;
          const lone = lines.find((l) => l.length === 1 && l[0].text.replace(/[^\p{L}\p{N}]/gu, '').length <= C.maxLetters);
          if (lone) {
            add(S.address, 'stranded_word', 'has ' + H.quote(el) + ' at ' + H.px(H.size(el)) + ' over ' + lines.length + ' lines with ' + H.q(lone[0].text) +
              ' alone on a line: change the words, the size or the width so the lines break between phrases');
          }
        }
      }
    }`,
  },
  {
    // [[REQ-429]] a menu label broken over two lines.
    id: 'nav_wraps',
    kinds: ['nav_wraps'],
    run: String.raw`(H, C, add) => {
      for (const S of H.sections) {
        for (const a of H.navLinks(S)) {
          if (H.words(a).split(' ').length > C.maxWords) continue;
          const n = H.lines(H.wordBoxes(a)).length;
          if (n > 1) {
            add(S.address, 'nav_wraps', 'has the menu link ' + H.quote(a) + ' broken over ' + n + ' lines: give the menu room at this width ' +
              '(shorter labels, fewer links, a smaller logo) or put its links behind a menu button');
          }
        }
      }
    }`,
  },
  {
    // [[REQ-429]] menu links too small to read and tap on a phone.
    id: 'small_nav',
    kinds: ['small_nav'],
    run: String.raw`(H, C, add) => {
      if (H.vw > C.maxWidthPx) return;
      for (const S of H.sections) {
        const small = H.navLinks(S).filter((a) => H.size(a) < C.minFontPx - 0.25);
        if (!small.length) continue;
        const least = Math.min.apply(null, small.map(H.size));
        add(S.address, 'small_nav', 'has its menu links at ' + H.px(least) + ' (' + small.slice(0, 3).map(H.quote).join(', ') +
          '), too small to read and tap on a phone: make them at least ' + H.px(C.minFontPx));
      }
    }`,
  },
  {
    // [[REQ-429]] a stacked menu that takes over the first screen of a phone.
    id: 'tall_menu',
    kinds: ['tall_menu'],
    run: String.raw`(H, C, add) => {
      if (H.vw > C.maxWidthPx) return;
      for (const S of H.sections) {
        const groups = new Map();
        for (const a of H.navLinks(S)) {
          const key = a.closest('nav') || S.el;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(a.getBoundingClientRect());
        }
        for (const boxes of groups.values()) {
          if (boxes.length < 2) continue;
          const span = Math.max.apply(null, boxes.map((b) => b.bottom)) - Math.min.apply(null, boxes.map((b) => b.top));
          if (span > H.vh * C.maxScreenShare) {
            add(S.address, 'tall_menu', 'has its ' + boxes.length + ' menu links stacked ' + H.px(span) + ' tall, more than ' +
              Math.round(C.maxScreenShare * 100) + '% of a ' + H.px(H.vh) + '-tall screen, so the menu takes over the first screen: ' +
              'put the links behind a menu button, or in a row');
          }
        }
      }
    }`,
  },
  {
    // Anything built as a table: rows share a baseline, columns share an edge or a centre.
    id: 'table',
    kinds: ['misaligned_rows', 'split_rows', 'ragged_column'],
    run: String.raw`(H, C, add) => {
      const spread = (ns) => Math.max.apply(null, ns) - Math.min.apply(null, ns);
      const filled = (c) => c && H.words(c) !== '';
      const extent = (c) => {
        const rs = H.textRects(c);
        return { left: Math.min.apply(null, rs.map((r) => r.left)), right: Math.max.apply(null, rs.map((r) => r.right)) };
      };
      const sideBySide = (cells) => {
        const bs = cells.map((c) => c.getBoundingClientRect()).sort((p, q) => p.left - q.left);
        return bs.every((r, k) => k === 0 || r.left >= bs[k - 1].right - 1);
      };
      // rows: cells by row. Answers why its rows do not line up, after reporting a ragged column.
      const judge = (S, rows, what) => {
        let wrong = null;
        for (let i = 0; i < rows.length && !wrong; i++) {
          const cells = rows[i].filter(filled);
          const lines = cells.map((c) => H.wordBoxes(c)[0]).filter(Boolean).map((w) => w.baseline);
          if (lines.length >= 2 && spread(lines) > C.tolerancePx) {
            wrong = 'its rows do not line up from row ' + (i + 1) + ': ' + cells.map(H.quote).join(' sits beside ');
          }
        }
        const cols = Math.max.apply(null, rows.map((r) => r.length));
        for (let c = 0; c < cols; c++) {
          const cells = rows.map((r) => r[c]).filter(filled);
          if (cells.length < 2) continue;
          const es = cells.map(extent);
          const aligned = [(e) => e.left, (e) => e.right, (e) => (e.left + e.right) / 2].some((f) => spread(es.map(f)) <= C.tolerancePx);
          if (!aligned) {
            add(S.address, 'ragged_column', 'has ' + what + ' whose column ' + (c + 1) + ' is not aligned: its cells (' + cells.slice(0, 3).map(H.quote).join(', ') +
              ') share neither a left edge, a right edge nor a centre. Align every cell of a column the same way');
            break;
          }
        }
        return wrong;
      };
      for (const S of H.sections) {
        // ── a table element ──
        for (const t of S.all.filter((el) => el.tagName === 'TABLE')) {
          let rows = Array.from(t.rows).filter(H.shown)
            .filter((tr) => !Array.from(tr.cells).every((c) => c.tagName === 'TH'))
            .map((tr) => Array.from(tr.cells).filter(H.shown));
          const width = H.median(rows.map((r) => r.length));
          rows = rows.filter((r) => r.length === width);
          // A table stacked for a phone ([[REQ-418]]) is a list of cards, not rows.
          if (width < 2 || !rows.length || !rows.every(sideBySide)) continue;
          const wrong = judge(S, rows, 'a table');
          if (wrong) add(S.address, 'misaligned_rows', 'has a table, and ' + wrong + ': give every cell of a row the same vertical alignment and padding');
        }
        // ── a grid of short text cells ──
        for (const g of S.all) {
          if (g.closest('table') || !/grid/.test(H.style(g).display)) continue;
          const tracks = H.style(g).gridTemplateColumns.split(/\s+/).filter((x) => /px$/.test(x)).length;
          if (tracks < 2) continue;
          const cells = H.real(g).filter(H.shown);
          if (cells.length < tracks * 3 || !cells.every((c) => H.leaf(c) && filled(c) && H.short(c))) continue;
          if (cells.some((c) => H.style(c).gridColumnEnd !== 'auto' || H.style(c).gridColumnStart !== 'auto')) continue;
          const rows = [];
          for (let k = 0; k < cells.length; k += tracks) rows.push(cells.slice(k, k + tracks));
          const wrong = judge(S, rows, 'a grid of ' + tracks + ' columns');
          if (wrong) add(S.address, 'misaligned_rows', 'has a grid of ' + tracks + ' columns, and ' + wrong + ': give every cell of a row the same vertical alignment and padding');
        }
        // ── a list built as side-by-side columns ──
        const used = new Set();
        for (const parent of S.all) {
          if (used.has(parent)) continue;
          const cols = H.real(parent).filter(H.shown);
          if (cols.length < 2 || !sideBySide(cols)) continue;
          const lists = cols.map((c) => H.real(c).filter((x) => H.style(x).display !== 'none'));
          const listy = lists.filter((items) => items.length >= 3 && items.every(H.leaf) && items.every(H.short));
          if (listy.length < 2) continue;
          // A list of items with numbers in it: a name and its price, say.
          const numeric = listy.some((items) => items.filter((x) => /\d/.test(H.words(x))).length >= items.length * 2 / 3);
          if (!numeric) continue;
          const counts = listy.map((items) => items.length);
          cols.forEach((c) => { used.add(c); c.querySelectorAll('*').forEach((x) => used.add(x)); });
          const empties = listy.some((items) => items.some((x) => x.getBoundingClientRect().height < 2));
          const what = 'a list built as ' + listy.length + ' side-by-side columns';
          const wrong = new Set(counts).size > 1
            ? 'its columns hold different numbers of entries (' + counts.join(', ') + ')'
            : judge(S, Array.from({ length: counts[0] }, (_, row) => listy.map((items) => items[row])), what);
          if (wrong) {
            add(S.address, 'misaligned_rows', 'has ' + what + ', and ' + wrong + (empties ? '; an empty cell takes no height' : '') +
              '. Build it as a table element, one row per item, with the item and its values in that row');
          } else {
            add(S.address, 'split_rows', 'has ' + what + ' of ' + counts[0] +
              ' entries, so each row is split across columns and lines up only by luck. Build it as a table element, one row per item');
          }
        }
      }
    }`,
  },
  {
    // [[REQ-429]] controls, or a control and the header's logo or name, too close to tell apart.
    id: 'crowded',
    kinds: ['crowded'],
    run: String.raw`(H, C, add) => {
      for (const S of H.sections) {
        const controls = S.all.filter((el) => H.control(el) && !el.matches('input[type=checkbox],input[type=radio]'));
        const marks = S.el !== H.top ? [] : S.all.filter((el) => (el.tagName === 'IMG' || el.tagName.toLowerCase() === 'svg' ||
          (H.ownText(el) && H.namesBrand(el))) && !controls.some((c) => c.contains(el) || el.contains(c)));
        const items = controls.filter((x) => !controls.some((c) => c !== x && c.contains(x))).concat(marks);
        const named = (el) => (H.control(el) ? H.label(el)
          : el.tagName === 'IMG' || el.tagName.toLowerCase() === 'svg' ? 'the logo' + (el.getAttribute('alt') ? ' ' + H.q(el.getAttribute('alt')) : '')
          : 'the business name ' + H.quote(el));
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const a = items[i]; const b = items[j];
            if (a.contains(b) || b.contains(a) || (!H.control(a) && !H.control(b))) continue;
            const A = H.seen(a); const B = H.seen(b);
            const across = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
            const down = Math.min(A.right, B.right) - Math.max(A.left, B.left);
            let gap = null;
            // Side by side; or one above the other, unless both are plain links (a list of links, set by its line height).
            if (across > 0 && down <= 0) gap = Math.max(B.left - A.right, A.left - B.right);
            else if (down > 0 && across <= 0 && (!H.plainLink(a) || !H.plainLink(b))) gap = Math.max(B.top - A.bottom, A.top - B.bottom);
            if (gap !== null && gap < C.minGapPx) {
              add(S.address, 'crowded', 'has ' + named(a) + ' and ' + named(b) + ' only ' + H.px(Math.max(0, gap)) +
                ' apart, so they read as one and are hard to tap: give them at least ' + H.px(C.minGapPx) + ' between them');
            }
          }
        }
      }
    }`,
  },
  {
    id: 'edges',
    kinds: ['edges'],
    run: String.raw`(H, C, add) => {
      const frames = [];
      for (const S of H.sections) {
        if (S.shared) continue;
        let frame = S.el;
        for (let next = H.real(frame).filter(H.shown); next.length === 1 && !H.leaf(next[0]); next = H.real(frame).filter(H.shown)) frame = next[0];
        const edges = H.contentBox(frame);
        if (edges.left > 1 || edges.right < H.vw - 1) frames.push({ address: S.address, left: Math.round(edges.left), right: Math.round(edges.right) });
      }
      if (frames.length < 2) return;
      const near = (a, b) => Math.abs(a.left - b.left) <= 2 && Math.abs(a.right - b.right) <= 2;
      let best = frames[0]; let bestCount = 0;
      for (const f of frames) {
        const n = frames.filter((g) => near(f, g)).length;
        if (n > bestCount) { best = f; bestCount = n; }
      }
      if (bestCount < 2) return;
      for (const f of frames) {
        if (!near(f, best)) {
          add(f.address, 'edges', 'has its content from ' + H.px(f.left) + ' to ' + H.px(f.right) +
            ', where the other sections on this page run from ' + H.px(best.left) + ' to ' + H.px(best.right));
        }
      }
    }`,
  },
]

/**
 * The in-page check: the runner, with `checks` in it. Run in the page after it has
 * laid out, at the width it was navigated at; answers `{ width, findings, errors }`.
 *
 * SECTIONS ARE FOUND THE WAY `SECTIONS_SCRIPT` FINDS THEM (`picture.ts`): the
 * n-th element child of the L1 root is the node at `0.n`, the address
 * `describe_page` gives it, and a root that only wraps one container is
 * descended through. A page with no L1 root answers no findings rather than
 * guessed ones. `H.parts` is every section; `H.sections` those laid out (not a
 * template, not collapsed, not hidden), with what is shown in each.
 */
export function layoutScript(checks: readonly LayoutCheck[] = LAYOUT_CHECKS): string {
  const registry = checks.map((c) => `{ id: ${JSON.stringify(c.id)}, kinds: ${JSON.stringify(c.kinds)}, run: ${c.run} }`).join(',\n')
  return String.raw`(() => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // A threshold given per width applies from that width up.
  const pick = (v) => {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return v;
    if (v['@width']) {
      const ws = Object.keys(v['@width']).map(Number).sort((p, q) => p - q);
      const w = ws.filter((x) => x <= vw).pop();
      return pick(v['@width'][w === undefined ? ws[0] : w]);
    }
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, pick(x)]));
  };
  const CFG = pick(${JSON.stringify(LAYOUT_THRESHOLDS)});
  const out = { width: vw, findings: [], errors: [] };
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
  const parts = [].concat(siteHeader ? [{ el: siteHeader, address: 'site-header', shared: true }] : [],
    kids.map((el, i) => ({ el, address: at + '.' + i, shared: false })),
    siteFooter ? [{ el: siteFooter, address: 'site-footer', shared: true }] : [])
    .filter((s) => s.el.tagName !== 'TEMPLATE');
  const brandMeta = document.querySelector('meta[name="application-name"]');
  const brandWord = ((brandMeta && brandMeta.getAttribute('content')) || '').toLowerCase().replace(/['’]/g, '')
    .split(/[^\p{L}\p{N}]+/u).find((w) => w.length >= 3) || '';
  const namesBrand = (el) => brandWord !== '' && (el.textContent || '').toLowerCase().replace(/['’]/g, '')
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
  const q = (w) => '"' + (w.length > 40 ? w.slice(0, 37) + '...' : w) + '"';
  const quote = (el) => q(words(el));
  const ownText = (el) => Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim() !== '');
  const inline = (el) => style(el).display.startsWith('inline');
  const leaf = (el) => real(el).every(inline);
  const size = (el) => parseFloat(style(el).fontSize) || 0;
  // At most two and a half lines tall: a cell or an entry, not a paragraph.
  const short = (el) => el.getBoundingClientRect().height <= (parseFloat(style(el).lineHeight) || size(el) * 1.3 || 20) * 2.5;
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
  const median = (ns) => { const o = ns.slice().sort((p, q) => p - q); return o[Math.floor(o.length / 2)]; };
  // A link to the home page: the business name, when it is a link, is one.
  const homeLink = (a) => {
    try { return /^(|index|home)(\.html?)?$/i.test(new URL(a.href, location.href).pathname.replace(/\/+$/, '').split('/').pop()); }
    catch (e) { return false; }
  };

  // ── [[REQ-429]] the ink: where the letters themselves are, from the font's own measure of the characters drawn ──
  const pen = document.createElement('canvas').getContext('2d');
  const measured = new Map();
  const metrics = (el, word) => {
    const s = style(el);
    const font = [s.fontStyle, s.fontWeight, s.fontSize, s.fontFamily].join(' ');
    const drawn = s.textTransform === 'uppercase' ? word.toUpperCase() : s.textTransform === 'lowercase' ? word.toLowerCase() : word;
    const key = font + '|' + drawn;
    if (!measured.has(key)) {
      pen.font = font;
      const m = pen.measureText(drawn);
      measured.set(key, { a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent, fa: m.fontBoundingBoxAscent, fd: m.fontBoundingBoxDescent });
    }
    return measured.get(key);
  };
  const blockOf = (el) => { let b = el; while (b.parentElement && inline(b)) b = b.parentElement; return b; };
  // Every word shown in el, with its box, baseline and ink; own: only el's own lines, not a block inside it.
  const wordBoxes = (el, own) => {
    const found = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const host = n.parentElement;
      if (!host || (own && blockOf(host) !== el)) continue;
      const re = /\S+/g;
      let m;
      while ((m = re.exec(n.data))) {
        const range = document.createRange();
        range.setStart(n, m.index);
        range.setEnd(n, m.index + m[0].length);
        const r = Array.from(range.getClientRects()).find((x) => x.width > 0 && x.height > 0);
        if (!r) continue;
        const k = metrics(host, m[0]);
        const baseline = r.top + r.height * k.fa / ((k.fa + k.fd) || 1);
        found.push({ text: m[0], rect: r, baseline, inkTop: baseline - k.a, inkBottom: baseline + k.d });
      }
    }
    return found;
  };
  // Words grouped into the lines they sit on.
  const lines = (ws) => {
    const out = [];
    for (const w of ws.slice().sort((p, q) => p.baseline - q.baseline || p.rect.left - q.rect.left)) {
      const line = out[out.length - 1];
      if (line && Math.abs(line[0].baseline - w.baseline) <= 3) line.push(w); else out.push([w]);
    }
    return out;
  };
  const opaque = (c) => { const m = /rgba?\(([^)]*)\)/.exec(c); if (!m) return c !== 'transparent'; const p = m[1].split(/[\s,\/]+/).filter(Boolean); return p.length < 4 || parseFloat(p[3]) > 0; };
  const boxed = (el) => {
    const s = style(el);
    return opaque(s.backgroundColor) || s.backgroundImage !== 'none' ||
      ['Top', 'Right', 'Bottom', 'Left'].some((k) => parseFloat(s['border' + k + 'Width']) > 0 && s['border' + k + 'Style'] !== 'none' && opaque(s['border' + k + 'Color']));
  };
  // What a reader sees of el: its letters' ink, or its box when it is a picture, a control or a filled box.
  // Where a reader sees el start and end: a plain link's words, not the padding round them.
  const seen = (el) => {
    const rs = el.matches(MEDIA) || boxed(el) ? [] : textRects(el);
    if (!rs.length) return el.getBoundingClientRect();
    return { top: Math.min.apply(null, rs.map((r) => r.top)), bottom: Math.max.apply(null, rs.map((r) => r.bottom)),
      left: Math.min.apply(null, rs.map((r) => r.left)), right: Math.max.apply(null, rs.map((r) => r.right)) };
  };
  const ink = (el) => {
    const ws = el.matches(MEDIA) || boxed(el) ? [] : wordBoxes(el);
    if (!ws.length) return el.getBoundingClientRect();
    return { top: Math.min.apply(null, ws.map((w) => w.inkTop)), bottom: Math.max.apply(null, ws.map((w) => w.inkBottom)),
      left: Math.min.apply(null, ws.map((w) => w.rect.left)), right: Math.max.apply(null, ws.map((w) => w.rect.right)) };
  };

  // ── [[REQ-429]] controls: what is pressed, as against what is read ──
  const FIELD = 'button,input:not([type=hidden]),select,textarea';
  const link = (el) => el.tagName === 'A' && el.hasAttribute('href');
  // A link inside a sentence is part of the text, not a control.
  const inRunningText = (a) => {
    for (let up = a.parentElement; up && up !== document.body; up = up.parentElement) {
      if (Array.from(up.childNodes).some((n) => n.nodeType === 3 && /[\p{L}\p{N}]/u.test(n.textContent))) return true;
      if (!inline(up)) return false;
    }
    return false;
  };
  const buttonLike = (el) => el.matches(FIELD) || (link(el) && boxed(el));
  const control = (el) => buttonLike(el) || (link(el) && !inRunningText(el));
  const plainLink = (el) => control(el) && !buttonLike(el);
  const label = (el) => {
    const kind = el.tagName === 'IMG' ? 'the image' : el.matches('input,select,textarea') ? 'the form field' : buttonLike(el) ? 'the button' : link(el) ? 'the link' : 'the logo';
    const name = words(el) || el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('placeholder') || el.getAttribute('name') || '';
    return kind + (name ? ' ' + q(name) : '');
  };
  // What is drawn on top at a point of the laid-out page, scrolled into view to ask.
  const topAt = (x, y) => {
    if (x < 0 || x >= vw) return null;
    window.scrollTo({ top: Math.max(0, y - vh / 2), left: 0, behavior: 'instant' });
    const hit = document.elementFromPoint(x, y - window.scrollY);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    return hit;
  };

  const HEADING = 'h1,h2,h3,h4,h5,h6';
  // Everything a reader sees on the page, as the content a heading sits between.
  const leaves = [root].concat(Array.from(root.querySelectorAll('*')))
    .filter((el) => (ownText(el) || el.matches(MEDIA)) && shown(el));
  const top = siteHeader || kids.find((k) => k.tagName !== 'TEMPLATE') || null;
  const sections = parts.filter((s) => s.el.getBoundingClientRect().height >= 2 && style(s.el).display !== 'none').map((s) => {
    const all = [s.el].concat(Array.from(s.el.querySelectorAll('*'))).filter(shown);
    const texts = all.filter(ownText);
    return Object.assign({}, s, { all, texts, rects: texts.map(textRects) });
  });
  // Links of a menu: in a nav, or in the page's header section, and not inside a sentence.
  const navLinks = (S) => S.all.filter((el) => link(el) && (el.closest('nav') || S.el === top) && words(el) !== '' && !inRunningText(el));

  const H = { vw, vh, root, top, parts, sections, leaves, brandWord, namesBrand, px, style, shown, words, q, quote, ownText, inline,
    leaf, short, real, size, median, homeLink, MEDIA, HEADING, textRects, area, contentBox, wordBoxes, lines, ink, seen, boxed,
    buttonLike, control, plainLink, inRunningText, label, topAt, navLinks };

  const CHECKS = [
${registry}
  ];
  for (const check of CHECKS) {
    const add = (section, kind, text) => {
      if (!check.kinds.includes(kind)) throw new Error('reported a finding of a kind it does not declare: ' + kind);
      out.findings.push({ section, kind, text });
    };
    try { check.run(H, CFG[check.id] || {}, add); }
    catch (e) { out.errors.push({ check: check.id, message: String((e && e.message) || e) }); }
    finally { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
  }
  return out;
})()`
}

/** The in-page check with every registered check: the script the host runs. */
export const LAYOUT_SCRIPT = layoutScript()

/** What {@link LAYOUT_SCRIPT} answers. */
interface RawLayout {
  width: number
  findings: RawLayoutFinding[]
  /** A check that threw, by its id. */
  errors?: { check: string; message: string }[]
}

/**
 * The page at `url`, checked at {@link LAYOUT_WIDTHS}. `sections` is how the page
 * stores its sections, in order, so a finding can name one the way the page does.
 * A check that threw is a `check_failed` finding for the page, naming the check.
 */
export async function checkLayoutAt(
  url: string,
  page: string,
  driverFactory: BrowserDriverFactory,
  sections: readonly string[] = [],
  checks: readonly LayoutCheck[] = LAYOUT_CHECKS,
): Promise<LayoutFinding[]> {
  const script = checks === LAYOUT_CHECKS ? LAYOUT_SCRIPT : layoutScript(checks)
  const found: LayoutFinding[] = []
  for (const { name, width, height } of LAYOUT_WIDTHS) {
    const driver = await driverFactory()
    try {
      await driver.navigate(url, { width, height })
      const raw = await driver.query<RawLayout>(script)
      const at = { page, width, widthName: name }
      for (const f of raw?.findings ?? []) found.push({ ...f, ...at, sectionName: sectionName(f.section, sections) })
      for (const e of raw?.errors ?? []) {
        found.push({
          section: null,
          kind: 'check_failed',
          text: `could not be checked for ${e.check}, a fault in the check rather than the page (${e.message})`,
          ...at,
          sectionName: null,
        })
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
