---
uid: comment-6c2674e5
id: COMMENT-2517
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-09-10T11:10:20.922814+00:00'
updated_at: '2026-09-10T11:10:20.922814+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-da8d1618
  kind: note
---

## UAT Coverage: CAP-85 — **PASS**

**REPORT-3718** (`report-da8d1618`). 36 AC verdicts `pass`, STORY-99 `pass`, CAP-85 `pass`. 0 violations, 3 warnings, 0 blocking needs_review.

**What the `fail` actually was.** Not a live evidence gap. The last coverage cycle ran 2026-08-16 and graded 30 ACs; six more were created 2026-08-31 out of the REQ-145/BUG-36 work — AC-1399, AC-1400, AC-1401, AC-1402, AC-1403, AC-1449 — and no cycle had ever visited them. They carried no `uat_coverage` value at all, which is what held the capability at `fail` through three attempts. All six read end-to-end this run; all six are substantively covered, and by the strongest evidence in the capability (real Worker `fetch` in workerd over real D1/R2, a real Access team, the real `BOOT_GUARD` executed in jsdom, a forwarding `Proxy` over the real D1 binding to assert work *not* performed).

I also re-read the seven ACs whose bodies were rewritten today rather than carrying the August verdict forward, and confirmed the intent ledger independently: all eight intents `free_and_reconciled`, nothing retired. REQ-161 (the Library tab) would retire AC-959's "exactly one tab" — but it's `draft`, and `config.js:50` still declares `TABS = [SITE_TAB]`, so AC-959 stands.

**Three warnings, all the same shape** — a claim asserted somewhere other than where its AC says it lives:
1. AC-972's test restates AC-1035's `/preview/beta/published/` probe, which its Verification explicitly forbids (also raised independently by this morning's alignment cycle).
2. AC-977 says "assert through **both** front doors"; its own test drives only the local one — the deployed half is covered incidentally by AC-1401's `transport-contract.ts` freshness field, with nothing recording that dependency.
3. AC-1400's "a build that has not been run says so, naming `1c assets`" leg is guarded by `if (res.status !== 200)`, which a built checkout never satisfies.

None costs evidence today; all are `uat-edit` for the editor.

**Execution, honestly.** 19 tests ran green (chrome, toolbar-lifetime, component-resolution-anchor, bug32, boot-guard) — which also confirms `WEBUI_INSTALLED` is true here, so the `skipIf` mount suites genuinely ran. Nine suites could not run: this sandbox denies binding a listening socket (`listen EPERM` at `builder.ts:363`, and the same in miniflare). That's environmental, not a defect — the same restriction the alignment cycle hit — and for those suites the verdicts rest on a full read of the test source against the AC body.

One tooling note worth surfacing: `.xgd/uat_index.json` on this branch is empty (`acs: {}`), so anything reading it to find an AC's tests will conclude there are none. I rebuilt the index by scanning `tests/` directly.
