---
uid: request-08503f7a
id: REQ-405
type: request
title: 'Consultant guidance: offer motion unprompted, and tell the client to use "Open
  in a tab" to see it'
created_by: xgd
created_at: '2026-10-18T00:32:51.422686+00:00'
updated_at: '2026-10-18T13:23:30.919898+00:00'
completed_at: null
last_field_updated: status
status: legacy_done
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



## Resolution (agreed with operator, 2026-10-18)
Reframed: the real gap is that the consultant had no idea what DONE looks like for each stage, so she waited to be asked for things a novice cannot know exist. Fixed with a prompt change only, no code and no UAT.

- tools/generate/src/cli/ai/priming.json: the plan-panel paragraph (in both the priming and priming_without_corpus variants) now gives each of the seven stages a finish line, and says getting the client there is the consultant's job. Finishing touches is framed as where the site goes from correct to finished and where we stand out. She raises motion herself (gentle scroll fade-ins and a slight lift on buttons; the top banner stays still; nothing slides or spins), then anything else that would lift this particular site, and the client says yes or no to each. She tells the client to use "Open in new tab" beside the preview (the real button label, not "Open in a tab") and that "View on your phone" shows the scroll fade-ins but not the hover effects.
- tools/generate/src/cli/ai/plan-seed.json: an about note pairing the stage list with those finish lines.
- Not changed: the motion_offer check's trigger revision_once is never fired by the host, so it never falls due. Left alone, because the stage guidance now covers it.

Commit: 533cdd9fe854d9d3a5f2f86c482c7d156dac025a. Priming and plan UATs pass (11 files, 75 tests).


- Follow-up: the motion_offer check's trigger is now revision_round_finished, not revision_once, in plan-seed.json (commit 7763c25e1c16451cf818555b69cea0ddc7607bb9). It falls due after the first round of changes, usually in Refining. That is earlier than Finishing touches; the operator chose it to see how it plays out in practice. Tying checks to a stage starting would need a small host change and wasn't done. This seed edit applies only to plans created from now on.