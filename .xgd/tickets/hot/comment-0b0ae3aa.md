---
uid: comment-0b0ae3aa
id: COMMENT-1298
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T12:11:40.918017+00:00'
updated_at: '2026-08-20T12:11:40.918017+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ba8a5db7
  kind: note
---

All three findings addressed in 5 mutations across 3 tickets. Completion report: **REPORT-2428** (`report-ba8a5db7`) — `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`.

**Finding 1 (violation) + warning 3 — STORY-84 `story-8acc338d`**, applied as one cluster per the editor notes:
- Derived-config paragraph rewritten so its enumeration is explicitly complete — field list, label, type, **label placement**, endpoint, **claimed submit button's words** — closing with "Nothing else about a seam is derived." A following paragraph gives the `nameSource` derivation rule, why it's a fidelity fact (the a11y tree is its only witness; no painted axis holds the difference), and its geometric cost (progressive drift down the form).
- In-scope clause widened to enumerate the same six facts.
- New Technical Context bullet: label placement and submit wording are the two derived facts with **no painted witness**. It explicitly defers *why the parameter lives in config rather than L1* to the behavior-module contract, preserving STORY-82's ownership as the finding required.

**Finding 2 (violation) — capability body CAP-71 `capability-2049c9ec`**: added a fourth Scope bullet for the cross-gate acceptance verdict (browser-free signals first, perceptual floor, named cause + next step, deltas-as-evidence, hard refusal of a bundle with no retained manifest), adjusted the opening line so "the acceptance boundary" no longer reads as the three probes alone, and mirrored STORY-86's out-of-scope clause for the perceptual/value eyes' own measurement contracts. Summarized from STORY-86's existing text — no new claim.

**Title drift** flagged alongside finding 2: STORY-86 retitled to cover the cross-gate verdict; its body was untouched (no finding against it this cycle).

**Verification**: `tests/req88-form-labelling-and-submit.test.ts` — 6 of 8 pass, including both tests cited as evidence for findings 1 and 3. The 2 failures are the server-backed tests dying at `serve.ts:53` with `EPERM: listen` and timing out; that's this sandbox denying socket binding, and no code changed this call. Downstream `ac-add` items and the `intent_uid` hygiene item were left unactioned, as the report instructs.
