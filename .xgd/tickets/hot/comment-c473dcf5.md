---
uid: comment-c473dcf5
id: COMMENT-7772
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-04T18:46:47.467852+00:00'
updated_at: '2026-11-04T18:46:47.467852+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-06a422ea
  kind: note
---

I filed the fix plan for iteration 1 as **REPORT-10900 (report-06a422ea)**, with subject report-3f77b790. The run tried to reach `github.com:22` at the same time, and the sandbox refused it, so the report may exist only in the local ticket store.

**Root cause:** the failing tests were written by earlier bundles for the old database layout, and nobody moved them onto this bundle's new one. They still read and write `users.email` and `users.display_name`, use business ids starting `acct_`, serve sites at `/site/<slug>/`, and test the slug claim that has since been deleted. The workerd error in the report is literally `D1_ERROR: no such column: email`. The production code and the ACs are already right: the story cycle superseded AC-1422 and reworded AC-2157, AC-2179 and AC-2188. Only the tests need to change, so the plan grants no mode override.

**Batch 0: the people and business suites (33 tests).** These are the contacts tab and its editing, the customer portal, business fulfilment, and the ownership/bypass split.
- Contacts are seeded through `tests/support/contact.ts`, the one helper that writes both rows a contact needs.
- People are looked up by address through `user_emails`, and names are read from the name table.
- The businesses payload is read as `person`, and business ids are minted the way production does (never `acct_`).
- Kept green alongside: the REQ-191, REQ-193 and REQ-194 suites.

**Batch 1: publishing, serving and the two-knowledge-base assistant (17 tests plus 4 ACs with no test).**
- The AC-1422 test is deleted, because that AC is superseded.
- The serving tests address sites by the site's own key, obtained through `siteKey`.
- New tests are written for AC-2244, AC-2245, AC-2246 and AC-2237, which currently have none.
- The two-knowledge-base suite (AC1795–1808) is brought up to the current read path from BUG-55 and the new site keys. It was last edited on 09-02, before both landed.
- Kept green alongside: the BUG-55 suite.

The batches split along the test helpers each one uses, so they shouldn't collide. The knowledge suite sits in batch 1 because it creates its sites through the same store as the publishing tests.

**What I couldn't verify:**
- I couldn't run any of the workerd tests, because the sandbox blocks binding a local port (`listen EPERM`). Turning on `sandbox.network.allowLocalBinding` would let them run here.
- So for the AC1795–1808 suite I had to infer the cause from what's on disk. It is not the priming skew BUG-55 left out of scope: both the repo and the installed `ai-knowledge` have already moved off `KnowledgeDocs`. The plan tells the builder to run that suite and read the real error before changing anything.
- I confirmed the three node-test failures (AC2188, AC2179, AC2182) by running them. The customer-portal node file hung, so I stopped that run.