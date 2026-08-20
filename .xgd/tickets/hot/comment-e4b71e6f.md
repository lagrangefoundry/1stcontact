---
uid: comment-e4b71e6f
id: COMMENT-1294
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T11:32:37.807835+00:00'
updated_at: '2026-08-20T11:32:37.807835+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3ab559cc
  kind: note
---

Done — all four findings of `report-2e87dfd7` resolved by story-body edits, the category the assessor assigned to every row.

**STORY-84 (the fold)** — 4 mutations
- **Finding 1 (violation)**: the backdrop/section-background bullet now carries the band's **translucent scrim** (colour with its own alpha, layered above the background image in the same box), the image-**or**-scrim fold condition, and the per-axis widest read. Corrected "full-bleed **opaque** panel fill" → "opaque or translucent" — that phrase was actively stating the opposite of the case BUG-24 was filed for. In scope gains the scrim; Out of scope now defers scrim *detection/projection* to CAP-63, mirroring STORY-75's own Out-of-scope line; Technical Context gains a BUG-24 bullet separating the capture half from the fold half.
- **Finding 3 (warning)**: the reconstructed-run-surfaces bullet gains the full-bleed bar as a second band-seeding path (space-between footer/nav strip, dominant-gap test discriminating it from a tile grid), with a Technical Context bullet ordering it as additive to the majority rule.

**STORY-86 (the gate)** — 4 mutations
- **Finding 2 (violation)**: the sample-fidelity probe now reports **three** channels — residuals, unmatched, and `mounted` — with the rationale (grading L1 on markup it does not emit would fail a correct reproduction) and an explicit contrast against the classifier's control/empty exclusion, which is a different mechanism. The fold-residual sentence that named only two channels is corrected; In scope and Technical Context updated.
- **Finding 4 (warning)**: the oracle admits the **width ladder only**; the height-probe re-shoot is deduped on `(width, state)` locally so `OracleSource` stays structural.

I verified each behaviour against the source before writing it rather than trusting the report's summary. One thing that check changed: `pass` is `residuals.length === 0 && unmatched.length === 0` (`probes.ts:705`), so `mounted` is a report field that can neither fail nor rescue a run — the body now says that, and that the diversion happens on the text pairing path only.

`npm test -- tests/bug24-scrim-alpha.test.ts` → 7 passed, 2 skipped, confirming the scrim behaviour I documented is live.

No ACs created — the assessor explicitly deferred that to the next level. The report (`report-3ab559cc`, `needs_more_work=false`, `violations_remaining=0`) carries forward the three `ac-add` items, notes the `mounted` channel needs `uat-add` too (no test references it), and repeats the unaddressable-at-this-level hygiene item: all 34 ACs carry `intent_uid: None`, which is why each cycle re-derives coverage by whatever sweep it happens to run.

One caveat: the ticket store's `git push` failed (`Broken pipe`) — the sandbox has no network. All three ticket mutations are committed locally and will need a push from an environment that has remote access.
