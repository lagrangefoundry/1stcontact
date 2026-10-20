---
uid: bug-469de2b1
id: BUG-237
type: bug
title: Post-build layout check reports contact-form component's visually-hidden labels
  and honeypot as overlapping/clipped text
created_by: xgd
created_at: '2026-10-20T23:07:08.842467+00:00'
updated_at: '2026-10-20T23:13:16.385682+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-63119bf2
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