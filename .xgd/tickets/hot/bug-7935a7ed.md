---
uid: bug-7935a7ed
id: BUG-397
type: bug
title: 'Published sites: the first screen appears piecemeal (header alone, then the
  hero; the title in a stand-in font) instead of all at once'
created_by: EPIC-19
created_at: '2026-11-09T05:45:46.146920+00:00'
updated_at: '2026-11-09T14:47:36.118829+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-e9060200
  commits:
  - working_sha: 43b94f0d01fab2e4c78887e052f2fe37e7adf5a0
    reconcile_sha: null
    main_sha: null
  - working_sha: aba2399dd02c09e9217ec9597f19d09036d88590
    reconcile_sha: null
    main_sha: null
  version: 0.2.844
  story_points: 8
---

## Symptom

On a first, uncached visit to a published site, the hero title first draws in a heavy stand-in font. A moment later it changes to the site's real font, at a different weight and width and with different line breaks. It looks broken and unprofessional, in the most prominent place on the page. Later visits mostly hide it because the font is cached.

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

## Added 2026-11-08: the whole first screen, not only the title's font

The operator reports that on opening the site, the logo and the three menu links appear on their own first, and the rest of the page "loads for real" a moment later. **Operator decision: the page waits and draws the first screen whole, styled, in CSS.** No partial header-only frame, no unstyled or half-built frame, and no visible assembly.

What the code does today (`tools/generate/src/render/render.ts`, the page `<head>`): the page CSS, the header and footer part CSS and the L1 CSS are all in `<head>`, so the header is styled when it first paints. But it paints as soon as its HTML arrives. The hero (a large still photo or poster, then a clip) arrives later, and until then the hero box is empty page background. White lettering over that background is effectively invisible. So the first frame a visitor sees is the header alone. Separately, several modules (catalog, carousel, checkout, contact form) write their `<style>` *after* their own HTML in the body, so a module can paint for a moment before its styles apply.

Additional expected behaviour (with items 1–6 above):

7. **The first screen is revealed as one.** The header, the hero and its overlay and lettering, and whatever else is in the first screen stay unpainted until the first screen's critical resources are ready: its CSS, the hero still or poster (already preloaded, REQ-649) and the first-screen fonts (item 2). Then they appear together, at most with a short fade (≤150 ms). This is done in CSS, set in `<head>`, so it doesn't depend on the page's script having run.
8. **Bounded wait.** If those resources aren't ready within a short limit (about 1.5 s), the first screen is revealed anyway, so a slow photo never leaves the page blank. A CSS-only timer is the fallback, so a page with no script still appears.
9. **No module paints before its styles.** Every module's `<style>` is emitted before the markup it styles (or folded into the head), so no component ever shows unstyled.
10. **The builder's preview behaves the same,** so the operator sees what a visitor sees.

Extra UATs: with the hero photo's response delayed, no frame shows the header without the hero (screenshots sampled through the load); with the photo stalled past the limit, the page is revealed within the bounded wait; each module page's first painted frame already has the module's styles applied.


## Implementation (as landed, 2026-11-08)

Not a duplicate: REQ-649 (hero poster preload) and BUG-260 (fonts bound site-wide) are related but cover neither the font swap nor the piecemeal reveal.

**Fonts (`packages/framework/src/l1/render.ts`, new `l1/font-loading.ts`)**
- Every served face is declared twice: as before (`font-display: swap`), and as the first screen's alias `"fc-first <Family>"` (same file, `font-display: block`).
- Every served family and style also gets three local stand-in faces, `"fc-fallback <Family>"`, one per weight band (`1 349`, `350 549`, `550 1000`). Each band lists weight-matched local fonts: a light face first where the system has one (Helvetica Neue Light, Segoe UI Light), then Arial or Arial Bold, or the Times New Roman cuts for a serif family. Each is tuned with `size-adjust`, `ascent-override`, `descent-override` and `line-gap-override` from the real font's metrics. A family the metrics table doesn't know (a font the client brought) gets the weight-matched stand-ins, untuned.
- A run whose leading family is one the site serves names `"<Family>", "fc-fallback <Family>"` and then the rest of the authored stack. In the first screen (the header part, and every text run in the page's first section, not only the `<h1>`) it names `"fc-first <Family>"` first. So first-screen text is never painted in a stand-in. If the font is still missing after the browser's block period (~3 s), the swap face's stand-in takes over; a failed request shows the stand-in at once. System or generic leading families (Georgia, sans-serif…) are emitted exactly as written. The edit channel gets no alias.
- `renderL1Document` returns `firstScreenFonts` (family, weight, style asked for by first-screen text). A new `faceFamilies` option tells a part (the header) which families the site serves when the page binds the faces.
- The metrics come from a generated table, `packages/framework/src/l1/font-metrics.ts`, written by the new `1c fonts metrics` command (`tools/generate/src/fonts/metrics.ts`). For each family in `fonts/platform.json`, it reads the regular face's `hhea` ascent, descent and line gap and its frequency-weighted `hmtx` lower-case width. It also reads the two stand-ins' own metrics (Arial, Times New Roman) from the system's files, and the serif flag from the catalogue. It is committed, like REQ-655's advance table, so the renderer needs no IO (Worker-safe).

**The page head (`tools/generate/src/render/render.ts`)**
- `<link rel="preload" as="font" type="font/woff2" href crossorigin>` for exactly the faces the first screen paints: the header's and the first section's runs, resolved to the nearest served face by family, style and weight. Only `woff2` sources are preloaded.
- The reveal gate (`firstScreenGate`), on every non-edit render, so the published site, the draft and the builder's preview all get it:
  - A `<style>` holds `body` at `opacity: 0`.
  - An inline script adds `fc-shown` to `<html>` once the document is parsed and both the first-screen fonts (`document.fonts.load` of each `fc-first` face) and every non-lazy `<img>` inside the first viewport (`decode()`) are ready. The body then fades in over 120 ms (no transition under reduced motion).
  - A CSS animation shows the body anyway at 1.5 s, so a page whose script never runs still appears.
  - `<noscript>` shows it at once.

**Modules**
- `checkout`, `contact-form`, `account-chrome`, `carousel`, `account-portal` and `catalog` (grid and product page) now write their `<style>` as the first thing inside their root, before the markup it styles.

**Capture (`tools/generate/src/cli/capture/extract.ts`)**
- A captured `font-family` drops the `fc-first …` and `fc-fallback …` tokens. They are loading machinery, not the author's typography, so the L1 round trip (REQ-82) and re-captures of our own sites read the authored stack.

**Known limits**
- A hero photo painted as a CSS `background-image` (a surface layer, not an `<img>`) isn't waited on by the reveal script. The 1.5 s limit still bounds the wait.

**Existing UATs adjusted to the new output (intent unchanged)**
- AC-727: face rules still come before the first run that names the family; the run's stack may now lead with the alias.
- AC-685: the off-allowlist sources still produce no rule; a served face is now two URL rules plus URL-less stand-ins.
- AC-1041: only `@font-face` rules cross into the workspace. Its rule-prelude regex now reads several consecutive rules.
- REQ-88 and REQ-90: the run still names the face, now with its stand-in.

## UATs (`tests/test_UAT_FC_BUG-397_first_screen_arrives_whole.test.ts`)
- `head_preloads_exactly_the_first_screen_faces`: a 600 hero face is preloaded; a 400 face used below and a 300 face used nowhere are not.
- `first_screen_text_names_the_block_alias_and_body_text_does_not`: covers the alias and swap `@font-face` rules, the two stacks, and `firstScreenFonts`.
- `the_stand_in_is_tuned_to_the_font_and_matches_its_weight`: three bands (light, regular, bold locals), each tuned.
- `published_and_preview_pages_reveal_whole_and_the_edit_render_does_not`
- `every_module_writes_its_styles_before_its_markup`
- `a_capture_of_a_rendered_page_reads_the_authors_stack_without_the_stand_ins`: needs `captureL1`'s Chromium and skips where that is unavailable, as REQ-649's capture UAT does.
- In Chromium, with responses delayed, stalled or failed through `tab.route`, sampled every frame:
  - `title_waits_for_its_font_then_appears_once_and_nothing_below_moves`
  - `a_stalled_font_shows_the_page_by_the_timer_and_the_title_after_the_block_period`
  - `a_failed_font_shows_the_title_in_the_stand_in_without_waiting`
  - `body_text_below_shows_before_its_font_and_does_not_change_size_when_it_swaps`
  - `no_frame_shows_the_page_without_its_hero_photo`
  - `a_stalled_photo_does_not_keep_the_page_blank`