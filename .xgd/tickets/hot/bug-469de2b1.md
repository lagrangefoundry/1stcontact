---
uid: bug-469de2b1
id: BUG-237
type: bug
title: Post-build layout check reports contact-form component's visually-hidden labels
  and honeypot as overlapping/clipped text
created_by: xgd
created_at: '2026-10-20T23:07:08.842467+00:00'
updated_at: '2026-10-20T23:16:17.637378+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-63119bf2
  commits:
  - working_sha: 1000060aa77bbeb16ddb5a92d619e5cd89f55a5b
    reconcile_sha: null
    main_sha: null
  - working_sha: 1d7b57cfb260dafbf6f8f46f495c07d9be9248ea
    reconcile_sha: null
    main_sha: null
  version: 0.2.559
  story_points: 1
---

## What I was doing
I delegated builder work on a page that contains a `contact-form` component instance (v7 per REF-behaviors) with four fields (text, tel, email, textarea), each set to `labelMode: "visible"` with empty placeholders. After each Delegate result, the host's layout check (desktop 1280px and phone 375px) ran on the page.

## Expected
No layout faults: the rendered form shows each visible label above its own input, with nothing overlapping or clipped. This was confirmed both by screenshot and by the human user's own visual inspection.

## What happened
The layout check reports, at both widths, for every field pair:
- "<FieldA>" and "<FieldB>" are drawn on top of each other (all pairs, including "Name" on top of "Name")
- each field label "is cut off by the box it sits in"
- "Leave this field empty" (the honeypot label) "is cut off by the box it sits in"

The "Name" on "Name" pair is the giveaway: the visible label and the component's own visually-hidden accessible label occupy the same spot. The component renders hidden labels (clipped out of flow) and an off-screen honeypot internally, and these are not exposed in L1 or as component settings. The check measures them as visible text.

## Why it matters
- It can't be fixed: the only field-level setting is `labelMode` (visible|placeholder), and neither value clears it. Changing container sizing (hug/fluid) and padding had no effect either.
- The Delegate result marks the build "NOT DONE" and the host re-prompts every turn to brief a builder to fix it. This creates an unresolvable loop and pushes the consultant to keep spending builder runs. It also pressures removing a working form.
- Because the same faults recur after every build, they mask real layout faults.

## Reproduce
1. On a page, add a `contact-form` component with 4 fields, all with `labelMode: "visible"`.
2. Delegate any builder change to that page.
3. Observe the layout check in the Delegate result at 1280px and 375px.

## Suggested fix (suggestion only)
Exclude visually-hidden elements (clip/sr-only patterns, off-screen honeypots, aria-hidden) from the overlap and clipping measurement, or have the component mark its internal hidden elements so the checker skips them.


## Fix (as implemented)
The layout check (`tools/generate/src/cli/ai/layout-check.ts`, `LAYOUT_SCRIPT`) now measures only what a reader can see:

- **Visually-hidden text is not measured.** An element is treated as unseen when it, or an ancestor, is a box of at most 1px in width or height that clips its content (overflow not visible, or a `clip` / `clip-path` set). That is the sr-only pattern the contact form uses for its accessible labels and for its honeypot. Unseen elements are dropped from every measurement: overlap, clipping, sideways overflow, column lists, and section edges. The rule is stated generally, with no contact-form marker, so any component using the same pattern is covered.
- **A `<template>` is never a section.** Its content is inert, so it is no longer reported as "takes no height". It still counts in the section addressing, so addresses stay identical to `SECTIONS_SCRIPT` (`picture.ts`) and `describe_page`.
- **`aria-hidden` alone is deliberately NOT a reason to skip.** It is a statement to assistive technology, not to the eye. Visible decorative text marked aria-hidden can still overlap other text, and that is a real fault. The honeypot is skipped because it is visually hidden, not because it is aria-hidden.

Real faults in visible text (overlap, clipping, sideways overflow, misaligned columns, edges) are reported exactly as before.

## Test plan
- `tests/test_UAT_FC_BUG-237_hidden_text_is_not_checked.test.ts`: a real `contact-form` with four visibly-labelled fields (text, tel, email, textarea, empty placeholders), laid out by the framework's `contactFormPreset`, rendered into an L1 seam by the conformance harness and checked at 1280px and 375px. Asserts the page carries the hidden labels and honeypot, and that the check reports no findings. Before the fix it reported 36 findings, the ones in this ticket plus a collapsed `<template>` section.
- Regression scope: `test_UAT_FC_REQ-415_layout_check`, `test_UAT_FC_REQ-418_table`, `test_UAT_FC_REQ-415_the_host_looks.workers`, `test_UAT_FC_BUG-235_build_sooner_checks.workers`. All pass.