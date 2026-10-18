---
uid: request-08503f7a
id: REQ-405
type: request
title: 'Consultant guidance: offer motion unprompted, and tell the client to use "Open
  in a tab" to see it'
created_by: xgd
created_at: '2026-10-18T00:32:51.422686+00:00'
updated_at: '2026-10-18T00:32:51.422686+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-8f2789ce
---

## What happened
During a first-time site build, the client (a novice) had to ask "What about some movement on the page — isn't that normal these days?" before motion came up at all. The consultant then added gentle scroll fade-ins and hover effects, and told the client to look in the preview. The effects are hard to see there; they show much more clearly when the page is opened in its own browser tab.

## Gaps in the consultant's guidance
1. **Motion is never proposed.** The plan has an `animation` decision ("Animation approach — 'none' is a valid answer", `settle: offer`) and a `motion_offer` check (triggered on `revision_once`). In practice, the consultant didn't raise it, and a novice client can't be expected to know it's an option. The playbook should say plainly: once the layout is approved (or at the Colours & fonts / Finishing touches stage), the consultant **offers** motion with a recommendation, e.g. "gentle fade-ins as you scroll and a slight lift on buttons; no sliding banners". It shouldn't wait to be asked.
2. **No instruction on how the client should view motion.** After adding scroll reveals or hover effects, the consultant should tell the client to use **"Open in a tab"** beside the preview to see the effect properly, because the in-builder preview makes motion harder to notice. Phones (via "View on your phone") show the scroll fade-ins but not the hover effects, and that's worth saying too.

## What would close it
- A section in the consultation playbook (DOC-33 / DOC-64 territory) and the per-turn reminder covering: when to offer motion, a default recommendation, and how to show it to the client ("Open in a tab"; phone shows scroll motion only).
- Optionally, make the `motion_offer` check fall due when the layout is approved, rather than only after a revision round, so the per-turn plan entry prompts the consultant.

This is a documentation and guidance gap, not a defect in the motion features themselves. The scroll-reveal, hover and transition fields worked as expected.