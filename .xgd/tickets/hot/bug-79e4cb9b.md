---
uid: bug-79e4cb9b
id: BUG-402
type: bug
title: 'Contact form: the spam-trap field ("Leave this field empty" and a text box)
  shows under Send in the builder preview'
created_by: EPIC-19
created_at: '2026-11-09T06:34:54.266122+00:00'
updated_at: '2026-11-09T14:55:44.895303+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-856dc2de
  commits:
  - working_sha: 7479d3477d22f21fc78200c639847ff2c6f4ef95
    reconcile_sha: null
    main_sha: null
  - working_sha: faac8d838e03b8126661e60deb7e93293384109e
    reconcile_sha: null
    main_sha: null
  version: 0.2.845
  story_points: 3
---

## Symptom

On a client test site in production (2026-11-09), the operator saw under the contact form's **Send** button the text "Leave this field empty" and an empty text box, in the builder preview with the width control on **Fit pane** narrowed towards phone width. That is the form's honeypot, the spam trap that must be invisible to people. A person who types in it has their enquiry discarded as spam, so a visible honeypot silently loses real leads. The consultant's own render at 418px, outside the preview, showed the form ending at Send with no box, so it reported a preview-only fault. That's not established: the same session found that the hero title's "preview fault" was a renderer fault below 375px (BUG-401).

## What is known

- The markup (`packages/framework/src/modules/contact-form/component.ts`): `<div class="contact-form__honeypot" data-fc-invariant aria-hidden="true">` holding the label and an `<input tabindex="-1" autocomplete="off">`, placed inside `<form data-l1-slot="form">` right after the form's L1 slot content.
- It's hidden **only** by the module stylesheet (`contact-form/styles.css`, folded into each site's `theme.css`): `.contact-form__honeypot { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap }`. That's a single-class selector, and `clip` only takes effect while the element is absolutely positioned. So any later rule of equal or higher specificity that changes `position` (or a stale or missing `theme.css`) makes the whole block visible. The page's L1 CSS is emitted after `theme.css`.
- The form's programmatic labels (`.contact-form__label`) are hidden by the same stylesheet and were not reported visible, which suggests the stylesheet loaded and a page rule overrode the honeypot specifically.

## Expected behaviour

1. **The honeypot is never visible to a person,** at any width, in the published site, the preview (View and Edit) and the draft, whatever the page's own layout CSS says. It's hidden in a way no page or L1 rule can undo: a module-owned rule that can't be overridden (scoped to the form and marked `!important` on every hiding property), with `clip-path: inset(50%)` alongside the legacy `clip`, and position, size and overflow all fixed. It still isn't `display: none`, which some bots skip.
2. **It is never reachable by keyboard or assistive technology** (as now: `tabindex="-1"`, `aria-hidden`, `autocomplete="off"`).
3. **Find the actual trigger and fix it there too.** Whatever un-hid it (a page rule changing `position` on slot children, a width-dependent rule, a stale `theme.css` in the preview) is identified and fixed, so the robust rule in item 1 isn't masking a second fault.
4. **The layout check flags it.** A rendered page where any `data-fc-invariant` element that should be hidden (honeypot, programmatic label) has a painted box larger than 1×1px is a layout fault at that width, so the consultant's check catches it instead of the client.

## Test plan

UATs `test_UAT_FC_BUG-402_*` in a real browser, on a page whose contact form slot uses a stacked layout with styled controls (like the reported form):
- at 320, 374, 375, 768 and 1280px the honeypot's bounding box is at most 1×1px and its label text isn't painted (no pixels at its position differ from the background), in the published render and in the builder preview's View and Edit channels;
- a page rule that sets `position: relative` and `width: 100%` on the form's children doesn't make it visible;
- the honeypot input is not focusable by Tab;
- the layout check reports a fault on a fixture where the honeypot is forced visible.


## What changed (implemented)

- **The honeypot hides itself.** `contact-form/component.ts` gives the honeypot `<div>` an inline style with `!important` on every hiding property: `position:absolute`, `width/height:1px`, `min-width/min-height:0`, `margin/padding/border:0`, `overflow:hidden`, `clip:rect(0 0 0 0)`, `clip-path:inset(50%)`, `white-space:nowrap`. An inline `!important` declaration beats every stylesheet rule, so no page rule can undo it, and it doesn't depend on `theme.css` loading. It is still not `display:none`.
- **The stylesheet rule is hardened too.** `.contact-form__honeypot` in `contact-form/styles.css` (folded into `theme.css`; `module-assets.ts` regenerated) marks every property `!important` and adds `clip-path: inset(50%)` and `min-width/min-height: 0`. L1 never emits `!important`, so no page rule beats it either. The selector stays single-class, and the stylesheet doesn't zero padding/border/margin, because REQ-96 / AC-809 pin the module's selectors and allow `padding`/`border` only as `0`. The inline copy zeroes them instead.
- **Keyboard and assistive technology are unchanged:** `tabindex="-1"`, `aria-hidden="true"` on the wrapper, `autocomplete="off"`.
- **Hidden invariants are marked.** The honeypot and the form's programmatic labels (`.contact-form__label`) are now `data-fc-invariant="hidden"`. Every existing reader checks only that `data-fc-invariant` is present, so they're unaffected. REQ-223's literal markup pin was updated for the new attribute value.
- **The layout check flags it.** The new check `hidden_invariant` (kind `shown_hidden`, in `tools/generate/src/cli/ai/layout-check.ts`) reports any visible `[data-fc-invariant="hidden"]` element that isn't a box of at most 1×1px clipping its content. The finding quotes the element's text ("Leave this field empty") and gives the section address, at every checked width.

## The trigger (item 3): what was and wasn't established

Not reproduced offline. Rendering the stacked contact-form preset through the real renderer in Chromium (draft/View and Edit channels) at 320, 374, 375, 768 and 1280px leaves the honeypot hidden on the old code. The only rules that match it are the module rule and the `box-sizing` reset. No renderer (L1) rule targets the form's children: the only broad `> *` rules are button groups, tables and dialogs, and none reach the form. The builder injects no style into the preview frame that reaches it (`points.js` adds overlay marks, `page-style.js` copies font faces). The client site's own definition isn't available here.

What *does* reproduce it on the old code: a page rule putting the form's children in flow (`position: relative; width: 100%; height: auto; overflow: visible`) gives a 320×40 visible block. So does a missing or stale `theme.css`: this hides the programmatic labels too, but they read as ordinary labels and are easy to miss. Both are now closed by construction (inline `!important`), so the fix doesn't depend on which one hit the client site. If it reappears, the layout check now names it at the width where it happens.

## Tests (as implemented)

`tests/test_UAT_FC_BUG-402_honeypot_never_shown.test.ts` (real Chromium):
- `honeypot_hidden_at_every_width_in_view_and_edit`: at 320, 374, 375, 768 and 1280px, in the draft (preview View) render and the edit render, the honeypot's box is ≤1×1px and it paints nothing (a screenshot around it is pixel-identical with it hidden).
- `no_page_rule_or_missing_stylesheet_reveals_it`: with a page rule putting every form child in flow, full width and unclipped, and then with `theme.css` removed, it is still 1×1 and paints nothing at every width, and it isn't `display:none`. Fails on the old code (320×40, painted).
- `honeypot_is_not_reachable_by_tab`: `tabindex=-1`, `autocomplete=off`, `aria-hidden`. Tabbing through the page reaches the fields but never the trap.
- `layout_check_reports_a_shown_honeypot`: an unstyled `data-fc-invariant="hidden"` honeypot is reported as `shown_hidden`, quoting its text, in its section. A properly hidden one isn't.

The builder's own preview frame (Fit pane) isn't driven in a UAT. The preview's View and Edit channels render through the same `renderSite` the tests use.