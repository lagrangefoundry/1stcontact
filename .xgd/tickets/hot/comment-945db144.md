---
uid: comment-945db144
id: COMMENT-2554
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T16:03:41.060435+00:00'
updated_at: '2026-09-10T16:03:41.060435+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-e3756541
  kind: note
---

**REPORT-3755 (`report-e3756541`) — FAIL: 1 violation, 1 warning, 0 needs_review.**

## What the check found

STORY-96 (Clean page URLs) is the only story in CAP-82 that BUNDLE-20's reconciliation never touched. Its siblings STORY-94 and STORY-95 were rewritten 2026-08-31 and carry `updated_by: bundle-b3b7c399`; STORY-96 still sits at 2026-08-16 with an empty `updated_by`.

The consequence is a live claim intent has retired. STORY-96's first in-scope bullet says the extensionless→`.html` mapping holds "for both the preview (snapshot-addressed) and published addressing forms". REQ-149 D7 (free_and_reconciled) dropped the sha-addressed draft snapshot channel outright, along with `1c deploy` (D6) that produced it and the manifest that vouched for it (D5).

Verified against code rather than the ticket graph alone:
- `apps/public-site/src/routes.ts:13` — "THERE IS ONE CHANNEL NOW (REQ-149 D7)"; `parseRoute` (`:112-142`) admits only apex/redirect/asset/not-found
- `tools/generate/src/deploy/` no longer exists
- `tests/req111-public-site-serving.test.ts:376-386` positively asserts `draft` is now an ordinary segment

So the behavior isn't merely uncited — it's absent, and a passing UAT asserts its absence. That makes it `story-body-edit`, not `needs_review`. Two dependent sentences carry the same premise (the warning): "the snapshot root's redirect" in bullet 5, and "the addressing forms" plural in Technical Context.

STORY-94 and STORY-95 verified aligned claim-by-claim against REQ-149 D1–D7. Coverage and exclusivity are clean across all three.

## Two things worth flagging beyond the report

**The ac-level cycle will re-fail unless the editor fixes AC-916 in the same pass.** It reproduces the retired premise in its title, its body ("under a snapshot-addressed preview URL"), and its Verification step — which instructs deploying "as a preview snapshot", an instruction no longer executable. AC-921 likewise says "snapshot root". I named these in the report so that cycle doesn't re-derive the intent history.

**The prior PASS at this level isn't evidence against this finding.** REPORT-2084 passed on 2026-08-16, two weeks before BUNDLE-20 landed; its ledger still describes the stories by their pre-rewrite titles. Given this scope reports 4 previous attempts, that distinction seemed worth putting in writing.

The tests are already correct here — REQ-149's own notes record `req113-worker-extensionless-urls` and `reconciliation-clean-page-urls` being rebuilt over a real-publish fixture. It's the matrix text that lags, and the repair is subtractive: REQ-149 removed a channel, not the mapping, so REQ-113 AC5–AC9 must survive intact.
