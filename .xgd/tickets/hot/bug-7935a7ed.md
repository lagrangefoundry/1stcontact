---
uid: bug-7935a7ed
id: BUG-397
type: bug
title: 'Published sites: the hero title draws in a stand-in font, then jumps when
  the real font arrives'
created_by: EPIC-19
created_at: '2026-11-09T05:45:46.146920+00:00'
updated_at: '2026-11-09T05:45:46.146920+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Symptom

On a first, uncached visit to a published site (seen on a client jewelry site), the hero title first draws in a heavy stand-in font. A moment later it changes to the site's real font, at a different weight and width and with different line breaks. It looks broken and unprofessional, in the most prominent place on the page. Later visits mostly hide it because the font is cached.

**Operator decision (2026-11-08): the hero title must never be shown in a stand-in font.** It appears in its real font or not at all until that font is ready.

## Root cause

`packages/framework/src/l1/render.ts` (`fontFaceRules`, REQ-90) declares every site font with `font-display: swap`, so the browser draws text at once in its fallback and swaps when the font arrives. Two things make that visible:
- **The fonts are found late.** No `<link rel="preload">` is emitted for fonts; the browser only finds them after parsing the CSS. Images in the first screen are already preloaded (REQ-649); fonts aren't.
- **The fallback looks nothing like the real font.** The authored stack is emitted as written, with no fallback matched to the real font's metrics. A light or thin display face often has no near equivalent among system fonts, so the stand-in is heavier and a different width, and the swap reflows the title.

## Expected behaviour

1. **The hero title never shows a stand-in font.** The text of the first screen's main heading (the hero title and any text over the hero image or slideshow) is hidden until its font has loaded, then appears once in its real font. Its space is reserved, so nothing below it moves when it appears.
2. **The fonts the first screen uses are preloaded** from `<head>` (`<link rel="preload" as="font" type="font/woff2" crossorigin>`), alongside the hero image preloads (REQ-649), so the wait in item 1 is normally imperceptible. Only the faces (family and weight) the first screen actually uses are preloaded, not every font on the site.
3. **A font that fails to load doesn't hide the title for ever.** After a bounded wait (about 3 seconds, the browser's own block period), the title appears in the fallback rather than staying invisible. That's the only case where a stand-in may show.
4. **Body text below the first screen is never blocked:** it keeps swapping, but with a fallback tuned to the real font's metrics (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override` on a local fallback `@font-face`), so a swap changes only the letterforms and nothing moves.
5. **The fallback is the right weight.** The tuned fallback uses the same weight as the authored text, so light text doesn't stand in as regular or bold.
6. **Every published site, the builder's preview and the draft get this,** at their next build, with no consultant action.

## Test plan

UATs `test_UAT_FC_BUG-<n>_*` rendering a page with a hero title in a site font, in a real browser with the font response delayed (route interception):
- before the font arrives the hero title is not painted in any other font (no frame shows the title text in a fallback family); after it arrives it is painted once in the real font, and the elements below it don't move between the two moments;
- the rendered `<head>` carries a font preload for exactly the faces the first screen uses;
- with the font request failing, the title becomes visible in the fallback within the bounded wait;
- body text below the first screen is visible before the font arrives, and its box size is unchanged (within 1px) when the font swaps in.
