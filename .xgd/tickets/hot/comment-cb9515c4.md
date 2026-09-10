---
uid: comment-cb9515c4
id: COMMENT-2556
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T16:13:34.016894+00:00'
updated_at: '2026-09-10T16:13:34.016894+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-2ab4e505
  kind: note
---

**REPORT-3757 (`report-2ab4e505`) — FAIL: 3 violations, 1 warning, 0 needs_review.**

## What I found

**Attempt 5's fixes are genuinely closed.** I verified STORY-96's current body (updated 16:05 today) rather than trusting the fix report: the snapshot-addressed channel clause is gone, and a term sweep across all three stories returns hits only inside explicit records of the retirement. STORY-94 and STORY-95 are aligned — every REQ-149 AC (1–9) and decision (D1–D7) maps to a live in-scope bullet.

**The remaining drift is one level up, in CAP-82's own body.** It was written to REQ-110's design and is the only element in this capability that BUNDLE-20's 2026-08-31 reconciliation never touched — the same root cause as attempt 5's finding, surfacing at the root instead of a leaf:

1. Scope bullet 2 still claims "a shareable, immutable preview that costs the site nothing (no revision number, no publish history entry)" — the channel REQ-149 D7 dropped *"not ported"*. It can't be read as the surviving builder draft preview: that one is behind Access (not shareable) and renders the mutable draft (not immutable). STORY-95 now says the opposite.
2. Scope bullet 1 claims artifacts are shipped by "naming it by its contents" — content-addressed identity, retired with `1c deploy` by D6. STORY-94: "The audit digest is not an address."
3. The out-of-scope parenthetical claims "site definitions stay canonical on the operator's machine" — contradicted by REQ-143 (definitions in D1) and REQ-149 AC-1 ("no filesystem anywhere on the path"). The exclusion is still right; its stated reason is false.

Warning 4 is the opening framing paragraph, which presumes the same local-origin model.

## Grounding

No finding rests on the ticket graph alone. Step 2.5's implementation check settles all three in the same direction — the retired behavior is absent from the code, so the capability text is what's wrong: `tools/generate/src/deploy/` doesn't exist, `parseRoute` (`apps/public-site/src/routes.ts:112-141`) admits only apex/redirect/asset/not-found with no draft/sha branch, and `routes.ts:13-22` documents the deletion. I also swept all 50 `request` and 38 `bug` tickets — nothing reconciled after BUNDLE-20 touches delivery — and read REQ-153 specifically to confirm its locale-slug guard is authoring-time validation with no delivery addressing ask.

**No production code change is implied by any finding, and none cascades to the ACs or to `uat_coverage`** (still `pass` across all three stories). This is a capability-body text repair only. I flagged in the Notes that all three stories already carry a house style for recording retirements rather than silently deleting text, which the fix should follow.
