---
uid: comment-7a9da93a
id: COMMENT-6242
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-11-01T22:24:00.284399+00:00'
updated_at: '2026-11-01T22:24:00.284399+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-0bd4cc6a
  kind: note
---

I've made a change for all seven review gaps (G1–G7). I did not run the new tests, as the fix instructions say, so it's unconfirmed until the workflow runs the full suite. The control-app typecheck (`tsc --noEmit`) passes. I filed the completion report as `report-0bd4cc6a` with `needs_more_work=false`, `progress_made=true`.

**G1 – grant routes (code change).**
- `POST /api/grants` and `/api/grants/revoke` now require the 1st Contact operator (`ownsPlatformBusiness`). Any other caller gets a 403, including a customer business's own owner, as REQ-183 §6 and REQ-180 D2 require.
- A grant can only name, or revoke on, a business someone in the caller's scoped business holds a membership on. An out-of-scope business gets a 400 ("No such business among these contacts." / "No such grant."), the same answer as an unknown id.
- The login-status route still uses `ownsBusiness`.
- The Contacts panel now shows Withdraw only when `canFulfil` is true.
- AC-2200 is restated to match, and AC-2233 is new (the scope rule). The UATs are updated, plus a new browser (jsdom) case that a customer owner sees no Withdraw control.

**G2.** I rewrote story-a55c2f35's description and its two stale decisions as resolved, with the history (as landed, then the override, then the review verdict, then the current gate).

**G3.** New UATs go through the real entry points: AC-2165 and AC-2168 through the Worker, AC-2229 through `provisionBusiness`. To hit the colliding-slug case, the AC-2229 test pins the business id the code would otherwise generate randomly. All three ACs are now active.

**G4.** The AC-2219 browser case loads the served portal against the real builder, presses Delete account and Close, and records the page's own requests: only GETs, no form submits, store unchanged, portal and builder still load. I removed the workers test's source-text scan and its log of the test's own requests.

**G5.** New AC-2234 and a UAT where the caller's account lives in a customer business (Salon) while the Worker's `TENANT_ID` is the platform. The caller gets Salon's portal.

**G6.** I narrowed AC-2230 to requests that go through `send()`. In story-e674c60a I recorded that `reader.js` fetches material files directly, which conflicts with BUG-52. Moving the reader onto `send()` is left as a follow-up code change.

**G7.** The criteria of AC-1748 and AC-1760 still hold, so I rewrote only their Verification to the invite + `provisionBusiness` sequence instead of superseding them. AC-1741 and AC-2075 got the same wording fix.

Things to watch:
- Two new test mechanisms carry the most risk: mocking `crypto.getRandomValues` inside workerd (AC-2229) and capturing `console.warn` (AC-2168).
- The code and test edits are uncommitted in the working tree. The ticket edits committed locally, but the sandbox blocked pushing them to `github.com`.
- The older `test_UAT_FC_REQ-185_*` and `test_UAT_FC_BUG-51_*` files are still there. There was no FC orphan report this time, so I left them; the orphan check will probably flag them later.
