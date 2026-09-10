---
uid: comment-42c1895e
id: COMMENT-2507
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T09:40:10.982736+00:00'
updated_at: '2026-09-10T09:40:10.982736+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-e9695d41
  kind: note
---

**Verdict: PASS** — REPORT-3708 (`report-e9695d41`), 0 violations, 1 warning, 0 needs_review.

## What I checked

Attempt 8 on a story-level alignment check for CAP-85, which has exactly one story (STORY-99, 36 ACs) — so exclusivity is trivially satisfied intra-capability and I checked it across capabilities instead.

**All five REPORT-3706 findings are closed**, and I re-derived each against the source rather than trusting the attempt-7 fix report:

- The two capability-body over-claims (standing since 2026-08-16) are gone and now defer explicitly to CAP-86/AC-992 and CAP-87/AC-1006 — both confirmed to exist and be active.
- The BUG-37 reuse passage now matches the code: `store.ts:79-96` builds a fresh handle per request with the tenant-check rationale, `router.ts:82` keys `PREVIEWS` on the store object, so the withdrawn "equivalent there" claim is genuinely withdrawn. Cited AC-1447/AC-1448 verified to exist.
- The provenance header names BUG-36 as item 1, with a new BUG-37 block for item 2; both divergence notes re-verified accurate against `toolbar.js:100` and `router.ts:76`.

**Intent sweep found nothing new.** Bundle and bug lists read complete; no reconciled intent has landed since 2026-08-31. BUNDLE-22's REQ-154 lands `shot.ts` but explicitly no route (`"NO ROUTE ANSWERS THIS YET, on purpose"`, deferred to REQ-157 which is draft), and REQ-162's `tickets.ts` is unrouted — both verified against the router's actual route inventory. REQ-158/161 would retire the single-tab claim but are still `draft`; `TABS = [SITE_TAB]` is what ships.

## The one new finding (warning, non-blocking)

Attempt 7's new paragraph asserts without qualification that *"the deployed origin builds a fresh handle on every request."* `router.ts:84-111` documents a deliberate exception: the chat host is held **one per isolate**, giving up mid-isolate deactivation re-checks on `/api/ai/*` only. That's REQ-146's stated deviation and CAP-90's STORY-103 already records it — *"Every other route on that origin builds its store per request … the conversation routes cannot."*

I kept it at warning rather than violation: no CAP-85 AC asserts handle lifetime, the passage's subject is the `PREVIEWS` render cache which the chat routes don't use (so its conclusion stays true), and the exception is expressed where it's owned. But the two capabilities currently state contradictory absolutes about the same origin, which is a ready-made false positive for whichever cycle reads the other's body next. The fix is one subordinate clause — no new AC, which would recreate the duplication findings 2/3 were repaired to remove.

Two items I deliberately did not act on: `uat_coverage: fail` on both tickets is the UAT-coverage cycle's field, not mine; and AC-992's stale on-disk verification text belongs to CAP-86's own cycle — I flagged it forward a second time so the trail doesn't go cold.
