---
uid: bug-702efd90
id: BUG-373
type: bug
title: 'Checkout: the delivery-region select is full page width, unpadded, and its
  text is oversized and unstyled'
created_by: EPIC-19
created_at: '2026-11-06T19:07:32.242400+00:00'
updated_at: '2026-11-06T20:29:35.753067+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  parent_uid: epic-ce0874f2
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-5680b786
  commits:
  - working_sha: 875f4d5e9b11c41893240940f97b62b0453d2643
    reconcile_sha: null
    main_sha: null
  - working_sha: 18631da52e6da084c2b21d6f21291962e66c76ad
    reconcile_sha: null
    main_sha: null
  version: 0.2.806
  story_points: 5
---

## Symptom

On a checkout page where the region has to be chosen (shipping costs differ by zone), the "Select region for delivery" dropdown is drawn across the full width of the page on desktop, and its text sits against the box edge with no inner padding. It is the only field on the page and it is required, yet it reads as a stray full-width bar rather than a form field.

## Root cause (as far as known)

The checkout module (`packages/framework/src/modules/checkout/component.ts`, control `ship-to`) supplies the `<select>` as a control dropped into a slot in the page's own layout. Its size and padding come only from whatever the page's layout gives that slot. When the page stretches the slot to the column and sets no padding, nothing in the module or the renderer gives the field a sensible default, so it fills the page and its text touches the edge. The renderer already gives controls some defaults (centred button labels, BUG-367; link padding, BUG-369; dimmed when disabled), but none for a select's width or inner padding.

## Expected behaviour

1. **Sensible width.** On desktop the delivery select is sized like a form field, not the page: as wide as its longest option needs, within a readable maximum (about the width of a normal form field), and never wider than the column. On phones it may fill the column, as form fields usually do there.
2. **Centred with the checkout's content.** When the checkout's content is centred, the select is centred with it, and it lines up with the Cancel / Continue to payment row beneath it (BUG-370), not off to one side.
3. **Inner padding.** The text inside the select has inner padding matching the page's other form fields and buttons, so it never touches the border, and its height matches the action buttons next to it.
4. **The page can't undo it.** As with the action-button order in BUG-370, these are defaults the module and renderer always apply to the ship-to control. A page layout can style the field (colour, border, type) but cannot stretch it to full page width or remove its padding.
5. **The layout check catches it.** A form control (select, input) on a checkout or form page that spans the full page width on desktop, or has no inner padding, is reported to the consultant as a layout problem to fix.

## Why free-coded

Small, visible defect on the first shop's checkout; scoped to the checkout control and the renderer's control defaults.

## Test plan

UATs `test_UAT_FC_BUG-<n>_*` rendering a checkout page whose layout stretches the ship-to slot and sets no padding:
- desktop width: the select's rendered width is at most the readable maximum and less than the column; it is horizontally centred in a centred checkout; its computed inner padding is non-zero and its height matches the Continue button;
- phone width: the select fills the column;
- the layout check reports a full-width, unpadded form control on a desktop checkout page.

## Added 2026-11-06: the select's text is large and unstyled

The operator reports the region names look large and unstyled. Cause, found in `packages/framework/src/l1/render.ts` (the control case, "the zero-look baseline"): every form control is reset to `appearance: none; padding: 0; border: 0; background: transparent; font: inherit; color: inherit`, and then only the axes the page wrote on that node are applied. For the ship-to select the page wrote little or nothing, so:
- **the text takes whatever type the slot it sits in has.** That can be heading or display size, not the size of the page's form fields and buttons, and it isn't the site's body or form type style;
- **padding: 0** is the missing padding above;
- **appearance: none with no border, background or arrow** strips every sign that it's a dropdown. It shows as plain text across the page, which is why it looks "unstyled".

Additional expected behaviour (extends items 1–5 above):
6. **Form type.** The select's text, and the region names in its list, use the site's form-field type style: the same family, size and weight as the page's other fields and button labels. They don't use the surrounding slot's heading or display size.
7. **It looks like a dropdown.** When the page gives the select no look of its own, it gets a visible border or fill and a dropdown arrow drawn by the renderer, matching the site's other fields, so it's recognisable as something to choose from.
8. **Applies to every select a module draws,** not only checkout: the defaults belong to the renderer's select control, so any form with a dropdown gets them.

Extra UATs: the rendered select's computed font size and family equal the page's form-field type and not the enclosing heading slot's; an unstyled select shows a non-zero border or fill and an arrow indicator.
## What landed (BUG-373)

**Renderer — every select a module draws** (`packages/framework/src/l1/render.ts`, `selectDecls`), applied after the node's own axes, on top of the zero-look baseline:
- **Width:** `width: fit-content` (as wide as its longest choice) unless the page wrote a fixed px width; always `max-width: min(480px, 100%)` (`FORM_FIELD_MAX_PX`), so a `fluid` width or an oversize fixed width the page writes can't stretch it across the page. Below 768px (`FORM_FIELD_FILL_BELOW_PX`) it fills its column.
- **Placement:** it stands where its container aligns its items (start/center/end), else where its own text aligns. When centred it also gets `margin-left/right: auto`, so it is centred in a block too.
- **Padding:** each side with no padding of the page's own (absent or 0, and no per-width track) gets one in `em`: 0.6em top/bottom, 0.75em left, 2.25em right (room for the arrow). Padding the page writes itself wins.
- **Looks like a dropdown:** with no fill and no border of the page's own, it gets a 1px border in its text colour at 40%, plus a 4px radius unless the page set one. It always gets an arrow drawn with CSS gradients in `currentColor` (no image URL), unless the page paints its own picture or gradient behind it. Pointer cursor.

**Form type — every control** (`packages/site-schema/src/l1/text-style.ts`, `resolveL1Type`): a `control` node (field, select, button, link control) no longer inherits type from its containers (a heading or display slot). It resolves from its own values, then its own role, then the design's `body`. This changes the precedence for controls only; text runs are unchanged.

**Checkout** (`packages/framework/src/l2/checkout.ts`, `shipToLikeContinue`, run inside `checkoutActions`, so on every checkout page):
- A Ship to with no type of its own takes Continue's role (else `label`) and lettering.
- A Ship to with no padding of its own takes Continue's: top and bottom less the border Ship to has beyond the action row's tallest button (Continue, or Cancel in its outline), Continue's left side, and Continue's right side +16px for the arrow.
- **One line height:** at `line-height: normal` Chromium gives a select an 18px line and a button a 20px one (16px type), so equal padding left Ship to 2px short. Where neither Continue nor its role states a line height, Ship to, Continue and both Cancels get `lineHeightPx` = round(1.25 × Continue's size). `lineHeightPx` is now part of the lettering Cancel copies from Continue.
- The default checkout preset's Ship to now has role `label`, no padding and no width of its own (all supplied as above). It keeps its colours, white fill and 1px border.

**Layout check** (`tools/generate/src/cli/ai/layout-check.ts`, check `form_field`, kinds `wide_field` / `unpadded_field`; thresholds in `layout-check.json` → `form_field`): a select or text-like input inside a `form` or `[data-checkout]` is reported
- `wide_field` when, on a screen ≥ 1024px, it is wider than 560px **and** spans ≥ 75% of the screen. A field in an ordinary content column (e.g. 700px of 1280) is not reported; the ticket's "full page width" is the trigger.
- `unpadded_field` at any width when its left or right padding is under 4px.

## Design decisions made during implementation

- The form-type rule went into type resolution for all controls, not a select-only CSS override. The renderer only sees resolved literals, so it can't tell a page's own font size from one inherited from a heading slot.
- The arrow is CSS gradients in `currentColor`, not an SVG data URI: it follows the field's colour and opens no URL sink.
- Matching Continue's height needed the explicit shared line height (above). Padding alone can't match across fonts.
- `wide_field` requires spanning the page, not just exceeding 560px. Otherwise every ordinary contact form in a 720px column would be reported to the consultant.
- BUG-237's "hidden text is not checked" UAT now also filters `wide_field`: its bare fixture page draws its fields edge to edge, which is not what that UAT is about.

## Test plan (as built)

`tests/test_UAT_FC_BUG-373_checkout_select.test.ts`. The Chromium legs need `CHROMIUM_LAUNCH_ARGS=--single-process` in the agent sandbox. The site's own checkout page is centred and set in a 40px/700 heading type, with its Ship to `fluid` and with no padding, look or type of its own:
- `desktop_select_is_field_width_centred_padded_and_as_tall_as_continue` (1280): width ≤ 480 and < the column; centred within 1px; all four paddings > 0; height within 1px of Continue's.
- `select_is_set_in_the_form_type_not_the_heading_slot`: font size isn't 40px; family, size and weight equal Continue's.
- `unstyled_select_shows_a_border_and_an_arrow`: border > 0, and the background image contains the gradient arrow.
- `phone_select_fills_the_column` (375): width equals the column within 1px.
- `default_checkout_select_is_field_width_and_as_tall_as_continue`: the default preset page gets the same width, padding, height and type.
- `layout_check_reports_a_full_width_unpadded_select`: desktop gets `wide_field` + `unpadded_field`; phone gets only `unpadded_field`.
- `layout_check_passes_a_field_width_padded_select` and `layout_check_passes_a_padded_field_in_an_ordinary_content_column`: no findings.

Regression scope: the checkout, control, form, type-role and layout-check suites (~150 files). Every failure there is also red on the clean xgd-working baseline: the consultant-role, build/deploy, money/time, BUG-53, REQ-308, REQ-349, REQ-350 browser, REQ-415/418, BUG-276, REQ-454, REQ-105, AC718, REQ-9 and REQ-269 suites.