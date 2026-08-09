---
uid: comment-fcb82f99
id: COMMENT-873
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-09T03:17:47.460203+00:00'
updated_at: '2026-08-09T03:17:47.460203+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d040fcd0
  kind: note
---

Report created: **REPORT-1725** (`report-d040fcd0`) — **FAIL**, 4 violations, 1 warning, 0 needs_review.

## Findings

**1a — coverage violation (no owner).** REQ-93 (free_and_reconciled, 2026-07-25) replaced REQ-88's module/L1 XOR with five validated slot-binding rules. All five are live in `packages/site-schema/src/schema.ts:478-599` (unbound module, dangling seam, duplicate seam name, double-bound seam, `moduleInstanceSchema.slot`). No CAP-70 story body expresses any of it. STORY-84 (CAP-71) explicitly disclaims it, so it isn't parked next door — it's unowned.

**1b — consistency violation, STORY-83.** The body states a slot renders as an inert placeholder "with no module code and no behaviour attached." REQ-93 changed exactly that: `renderL1Document` takes a `mounts` map (`packages/framework/src/l1/render.ts:1714`) and emits the mounted module's HTML inside the slot div (`:2011-2014`), fed by `tools/generate/src/render/render.ts:140-145`. Same root cause as 1a — fix both together or each leaves the other broken.

**2 — consistency violation, STORY-82.** Describes contact-form's current surfaces as the `submit` and `intro` slots. REQ-96 deleted both in favour of one required `form` slot with `control` leaves — and STORY-85 records that supersession explicitly. Two stories in one capability now describe incompatible module surfaces.

**3 — consistency violation, STORY-82.** Uses "capability module / capability config / capability validators / the Capability Modules story" in present tense throughout. REQ-87 renamed the type to *behavior module* precisely to end that collision and forbids a back-compat alias; grep confirms zero `Capability*` identifiers remain in `packages/framework/src` or `packages/site-schema/src`.

**4 — warning, STORY-83.** Its merge note calls STORY-81 "(CAP-68, now archived)". STORY-81 is active under CAP-70, revived by REQ-104.

STORY-82 is the outlier: written just after the pivot and never re-touched for REQ-87 or REQ-96, while every other story absorbed both. STORY-83, STORY-85, STORY-90 and STORY-91 are well aligned.

One process note worth your attention: every story here carries a **bundle** UID in `intent_uid`/`updated_by`, and those bundles group 3–15 unrelated intents (BUNDLE-11 spans fifteen). The field can't answer "which intents does this story owe?", so the ledger had to be rebuilt by sweeping the request corpus — and three intents' worth of missed supersession on one story is the predictable cost of that indirection.

Method caveat: `xgd ticket list` was unusable for most of this session (30s index-lock timeouts against the main worktree, contended by three dashboard servers and a long-running `resync`). I worked from the derived search index at `.xgd/tickets/search/metadata.json` for the uid↔id map, then read every ticket through `xgd ticket get <uid>`, which bypasses the index. No ticket `.md` file was read directly.
