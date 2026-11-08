---
uid: acceptance_criterion-09f39ffa
id: AC-2375
type: acceptance_criterion
title: A reminder entry whose condition does not hold is absent from the turn together
  with its separator, and the assembly is bounded by a declared 60,000-character budget
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T05:11:04.211270+00:00'
updated_at: '2026-11-08T10:08:55.229905+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

- **A condition that does not hold drops its entry whole.** A provider entry whose condition does not hold answers nothing. Examples: the site has not changed, or the corpus has not grown. The entry is then dropped **together with its separator**, so the assembled text has no empty section, no placeholder residue, and no doubled or trailing separator. (The reminder's two signals are the case AC-2109 pins. A session without a knowledge base is handled by the second declared order, AC-2374, not by a drop. That the drop is the only mechanism, with no separate guard editing a string afterwards, is a structural decision recorded in STORY-103's Reconciliation Decisions.)
- **The budget is declared, not inherited.** The session's assembled priming is capped at **60,000 characters**, a number this host declares rather than the framework's 200,000-character default. A real consultant session with a knowledge base and the shipped corpus primes well under it, leaving headroom for the client's landscape, which is the part that grows.
- **Overflow is loud.** A configuration whose assembled priming exceeds the cap stops the session with an error **naming the entry** that crossed it. No truncated priming is produced and no turn runs on one.

## Verification

Assemble the priming for a consultant session over the real configuration: it is under 60,000 characters with clear headroom. Inflate one entry (for example the role text) past the cap. Assembly is refused with an error that names that entry, and no priming text is returned. Render a reminder in which a conditional entry answers nothing. The output contains neither that entry's text nor an extra blank-line separator where it would have been, and it does not end in a separator.
