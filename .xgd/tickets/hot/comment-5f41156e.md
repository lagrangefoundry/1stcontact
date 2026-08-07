---
uid: comment-5f41156e
id: COMMENT-816
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T21:54:47.519883+00:00'
updated_at: '2026-08-07T21:54:47.519883+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ba028ef4
  kind: note
---

**REPORT-1636 (report-ba028ef4) — FAIL: 1 violation, 3 warnings, 0 needs_review.**

Checked 36 active ACs across STORY-94 (13), STORY-95 (14), STORY-96 (9) against their story bodies, with the intent ledger (REQ-110, REQ-111, REQ-113, BUG-31 — all `free_and_reconciled`) re-derived from the bundle bodies rather than inherited from the story-level cycle.

**The violation — AC-906 contradicts AC-910.**

AC-906 requires four not-found cases to be "indistinguishable in status, **headers** and body" and byte-compared. Two of them necessarily sit on different channels, where AC-910 mandates exactly one header difference:

- "a preview identifier that names no snapshot" → draft-channel 404 → **must** carry `x-robots-tag: noindex`
- "a known site with nothing published" → published-channel 404 → **must not**

Confirmed in code (`apps/public-site/src/index.ts:151,171`; `routes.ts:170`). AC-906 is also broader than its own story body, which scopes the property to "tell an unknown site from one that has not published" — both published-channel — and broader than its evidence: `tests/req111-public-site-serving.test.ts:302` byte-compares only the two published-channel cases. As written it drives either a UAT that fails against correct code, or a "fix" that strips the no-index directive and regresses AC-910. Resolution is `ac-edit` on AC-906 alone; the server is behaving correctly.

**Warnings:** two exclusivity duplications from BUG-31's criteria being woven into pre-existing ACs *and* given their own (AC-892/896 vs AC-925; AC-905 vs AC-927), and one coverage gap where AC-901's lost-update guard is grounded only in STORY-94's Technical Context, not its In-scope list.

Spot-checks of AC-901, AC-914, AC-899, AC-917 and AC-921 against the implementation all came back clean — no `code-issue` finding was warranted. AC-908's extension list exceeds REQ-111's but matches `content-type.ts` exactly, so it records what shipped rather than over-claiming.

Two notes outside the task: the prior cycle's unrepaired warning on AC-913's story-body grounding is carried forward in the ledger but deliberately not re-counted here, since it is a story-level repair. Separately, the claude.ai Gmail/Calendar/Drive MCP connectors need authorization via claude.ai connector settings before their tools can be used — not needed for this assessment, which used only `xgd` and the repo.
