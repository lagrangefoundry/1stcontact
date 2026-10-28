---
uid: report-35fe09d3
id: REPORT-6820
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-10-28T03:57:35.847936+00:00'
updated_at: '2026-10-28T03:57:35.847936+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-31204812
  parent_report_uid: report-7713f9da
  batch_index: '0'
---

All six failing tests in this batch now pass. Running `tests/test_reconciliation_capture_site_egress.test.ts` directly gives 10/10, up from 6 failed and 4 passed. The REQ-157 file (`tests/test_UAT_FC_REQ-157_fidelity_surface.test.ts`) still passes 27/27. I didn't touch any production code. The test edit is not committed; I'm leaving that to the workflow.

Because the code is frozen, I followed the planner's ruling: each test now describes what the code actually does, and the affected ACs and the story were rewritten to match. Test names are unchanged; only the `describe` titles and comments were reworded. No tests are skipped. Where clauses were removed, the remaining assertions are exact:

| Test | What it now checks |
|---|---|
| **AC2045** | Removed the case for a bundle with no capture record (`readCapture` throws on it). The remaining checks on the empty list and the two recorded captures are kept. |
| **AC2046** | An unknown name returns an error containing `Bundle '<name>' has no capture.json.` instead of `NOT_FOUND`. The full report assertions are kept. |
| **AC2047** | Scheme refusals must name the scheme. Credential refusals must say "username or password" and must not contain `secret`, so the URL is never echoed. Address refusals must still name the address. |
| **AC2048** | Checked on both hosts: a request for a page image at the private metadata address is never sent and is reported. Redirect-hop checking is asserted on the Worker only, because Playwright doesn't pass redirect hops through its request hook. |
| **AC2049** | A 7-hop chain on the Worker returns a result with exactly one `redirect-cap` refusal naming `https://hop6.test/`. Hops 1–5 are sent and hops 6–8 are not. The clause saying requests to many different sites for page resources don't count as hops was retired. |
| **AC2050** | Worker only. A 33 MiB response trips the 32 MiB cap with the exact `response-cap` refusal, the next image is never sent, and the capture is still returned and listed. The 60-second time limit and the Node byte cap were retired because neither exists in the code. |

**Tickets:** I rewrote AC-2045 to AC-2050 with `xgd ticket update`, each with a note pointing at the iteration-6 ruling. STORY-159's body has a new "Known gaps (aligned to code, see fix_plan iteration 6)" section, so these can be filed as explicit fix tickets. It lists:
1. The redirect cap counts every distinct site the page loads from, not redirect hops.
2. Node captures have no byte limit.
3. The 60-second time limit is never applied.
4. A capture that blows a budget is still returned as a reference instead of being refused.
5. Node doesn't check redirect hops, so a redirect into private address space is followed (a server-side request forgery gap).
6. The not-found paths for missing capture records can't be reached, so `list_references` fails outright if any bundle lacks one.

**Not checked:** I couldn't lint the test file. This project has no local eslint, and the sandbox blocked fetching it from the npm registry. No typecheck config covers `tests/`, so that wasn't run either.

The suite-level "executed 0 tests" entry is the known XGD plugin defect BUG-1574, which the planner ruled out of scope, so I didn't try to fix it.

```yaml
## Assessment
blocked_by: null
```
