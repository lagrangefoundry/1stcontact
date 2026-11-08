---
uid: comment-9505f88d
id: COMMENT-7979
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-11-08T08:05:14.176853+00:00'
updated_at: '2026-11-08T08:05:14.176853+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-e09677c5
  kind: note
---

I fixed the review's two matrix findings and left the third (the misjudged override) unchanged, because this fixer can't act on it. I didn't run the new tests, as instructed; the workflow's full suite will be their first run. I filed the completion report as REPORT-11351 with `progress_made=true`, `needs_more_work=false`.

**1. AC-2337 contradicts REQ-205 (invite sender)**
- I set AC-2337 to `superseded` with `superseded_by_uid: bundle-c0301347`, as the review asked.
- I created **AC-2409** under story-7b1025b8 to replace it. It keeps all of AC-2337's other clauses. The only change is that From is now the invite template's own address, falling back to `MAIL_FROM` (per AC-2371).
- The review said to retarget the old `test_UAT_AC2337_*` UATs, but the fixer rules say not to edit a UAT that pins retracted behaviour. So I left them as they are and wrote two new AC-2409 UATs:
  - `tests/test_reconciliation_contacts_add_invite.workers.test.ts`: the invite draft and every sent message come from `1st Contact <invite@1stcontact.io>`, and a spoofed `from` in the request is ignored.
  - `tests/test_reconciliation_contacts_add_invite_tab.test.ts`: the invite modal shows the template's address as read-only text.

**2. AC-2376 and AC-2377 had no AC-tagged UATs**
- **AC-2376 (single cache boundary):** I added five UATs to `tests/reconciliation-assistant-priming-delivery.test.ts`. They check that:
  - each priming list declares exactly one boundary, last;
  - with or without a knowledge base, the cached part of what the model is sent covers the whole priming;
  - the marker leaves no text in the priming;
  - the landscape and the manual are read once over three turns, not once per turn.
- **AC-2377 (no document names in priming):** every test in the BUG-65 FC file was AC-2377 evidence, so I renamed the file to `tests/reconciliation-assistant-priming-names-no-documents.test.ts` and its tests to `test_UAT_AC2377_*`. I also added checks for:
  - every subject the AC lists;
  - the "work from the map" line;
  - every reminder entry;
  - both priming orders.
- I set both ACs to `active`.

**3. Misjudged override (report-7519d965)**
The gate has already denied that override for this batch (report-40bf3ba2). The `systemText()` helper it flagged is still used by the AC-2378 UAT, so removing it would break active evidence. The planner decides what happens next.

**Risks for the next run**
- One AC-2376 test assumes the backend sends nothing uncached after the priming. That is what AC-2376 claims, but if it doesn't hold, that test fails.
- The AC-2376 and AC-2377 tests run in the node suite. The AC-2409 server test is a workers test, and the reviewer couldn't run those in this sandbox (local port binding is refused), so its first run will be the gate's.
- The REQ-182 FC file is still there. Its cache-boundary tests now have AC-2376 copies, so a later FC-orphan check will flag the file.
- Nothing is committed: the test edits and the rename are in the working tree for the workflow to commit. The ticket changes were saved through `xgd ticket`.