---
uid: report-5f9b493a
id: REPORT-1864
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-08-12T18:10:26.283342+00:00'
updated_at: '2026-08-12T18:10:26.283342+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: request-a8ccd0dd
  plan_item_index: '1'
---

All mutations applied and committed; no runtime code touched.

**Notes for the record:**

- **One intent/implementation divergence, recorded rather than absorbed.** REQ-135 §4 says a run declaring no size of its own should seed its control from the rendered value, so the first change writes an explicit axis. What shipped *withholds* the size control from such a run instead. §9.1 reports the case has no instance on measured data. I documented the shipped behaviour in the derivation AC (it is what regression must enforce) and recorded the divergence explicitly in the story's existing "Where the intent and the implementation differ" bullet, so the intent's version stays open rather than looking refuted.
- **Phase B stayed out.** No AC mentions colour or the panel escalation. The story's out-of-scope section now names colour with its actual reason (it needs the palette control, REQ-133) rather than the stale blanket "Text properties (size, colour, weight, family)".
- **Two out-of-scope items promoted from the ticket to the story**: alignment (intent §6, decided out) and per-run restyling (intent §1), which the old wording bundled into one line.
- `xgd ticket get story-37a3921b --related` lists AC-980/988/991 twice. That is the reconcile worktree's overlay plus main's base store — one file per UID on disk, and `xgd ticket get` resolves overlay-first. Not duplicated tickets.

```
Upgrade mutations applied for plan item 1 of 2

Target Stories: story-37a3921b
Primary Story UID: story-37a3921b
Stories Modified: 1
ACs Modified: 3
ACs Added: 6
ACs Removed: 0

tickets_modified:
  stories:
    - "story-37a3921b"
  acceptance_criteria:
    modified: ["acceptance_criterion-e817ae96", "acceptance_criterion-08c7ebe8", "acceptance_criterion-97f5dee6"]
    added: ["acceptance_criterion-0c85504b", "acceptance_criterion-1eb99338", "acceptance_criterion-74446275", "acceptance_criterion-3235871e", "acceptance_criterion-db9faa7b", "acceptance_criterion-66f57a24"]
    removed: []

Progress: 1 of 2 plan items complete
```

| AC | Change | Claim |
|---|---|---|
| AC-980 | modified | copy field **leads** the list and holds the draft's words (was: is the only field) |
| AC-988 | modified | per-descriptor shape check + read-only refusal (was: "a value that is not text") |
| AC-991 | modified | four control shapes, each narrower than a free string (was: two) |
| AC-1117 | added | derivation: size/weight/italic/capitalisation beside the words, closed against the document's declared faces, page's own faces inside a module slot |
| AC-1118 | added | a resize scales every keyframe of the responsive rule by one ratio |
| AC-1119 | added | weights = declared faces for the **first family of the stack** ∪ the run's own weight |
| AC-1120 | added | italic read-only only on positive evidence of absence; a post for it is refused |
| AC-1121 | added | the bound binds a change, never the status quo; refused, never clamped |
| AC-1122 | added | writes into existing parameters, absent-is-the-default, a no-op produces no diff |
