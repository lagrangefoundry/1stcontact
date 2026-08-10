---
uid: report-c670672e
id: REPORT-1766
type: report
title: 'UAT Coverage: In-Page Copy Editing: The Editable Render & The Click-to-Edit
  Gesture'
created_by: xgd
created_at: '2026-08-10T08:52:31.507674+00:00'
updated_at: '2026-08-10T08:52:31.507674+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-12fee326
  violations: 6
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture

**Result**: FAIL
**AC verdicts**: 23 pass, 5 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass (STORY-98), 1 fail (STORY-101), 0 stale, 0 needs_review
**Capability verdict**: fail

Assessed on `regression-50f23d80`. Every judgement below is grounded in a test
run I performed in this turn, not in a prior report:

```
npx vitest run tests/reconciliation-copy-edit-gesture-modal.test.ts \
                tests/reconciliation-copy-edit-gesture.test.ts \
                tests/reconciliation-edit-render-channel.test.ts \
                tests/req118-image-selection.test.ts

 tests/reconciliation-edit-render-channel.test.ts      13 passed
 tests/reconciliation-copy-edit-gesture.test.ts         9 passed
 tests/req118-image-selection.test.ts                  11 passed
 tests/reconciliation-copy-edit-gesture-modal.test.ts   5 FAILED (5/5)
 Test Files  1 failed | 3 passed (4)
      Tests  5 failed | 33 passed (38)
```

No `NOT VERIFIED` warning was emitted anywhere in the run, and AC-1002's
`it.skipIf(!WEBUI_INSTALLED)` executed rather than skipping — so on this machine
the shared `webui-fields` components are installed and Chromium is launchable.
The five failures are therefore genuine red, not the story's declared
skip-with-a-reason caveat.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-14 `bundle-0385746c` (BUG-31 + REQ-114 + REQ-116) | free_and_reconciled | 2026-08-06, merged `cd8f98c8` | Originated STORY-98 — the edit render channel: third output location, deliberate inertness, settled state, derived segmentation, addresses, outlines | YES |
| BUNDLE-16 `bundle-15c1f647` (REQ-117 + REQ-115 + REQ-44) | free_and_reconciled | 2026-08-07, merged `1741ee5d` | Originated STORY-101 — the click-to-edit gesture (click -> `webui-fields` modal -> validated diff -> re-render). Also updated STORY-98: page stamp, hover rule, vocabulary moved to the schema package, contact-form seam marker | YES |
| REQ-118 `request-66e4c630` | free_and_reconciled | created 2026-07-31, merged `b2b9208c` | Updated STORY-101 — image selection reaches the operator through the same kind-agnostic gesture; widened the field vocabulary by `enum` only (AC-1028) | YES |
| BUG-33 `bug-ede1fb8c` | ready_to_reconcile | 2026-08-08, `working_sha af78081b`, **`main_sha` null** | Names these same five modal tests as its symptom; records them as "already green" by the time work started and changes other files | imminent — but see Finding 1 |
| REQ-119 `request-64864801` | bundled (`main_sha` null) | 2026-07-31 | Request-time rendering replaces on-disk rendering. Would remove the *cause* AC-1003 guards, not the guard | imminent, retires nothing |
| REQ-121 `request-9707484c` | bundled (`main_sha` null) | 2026-08-07 | Modal chrome/theming/typeface. Additive to AC-994's dialog | imminent, retires nothing |
| REQ-128 `request-de67e1a1` | bundled (`main_sha` null) | 2026-08-08 | Background image selection for the painted container. Explicitly "no editor change" | imminent, retires nothing (see Notes) |
| REQ-129 `request-b1300473` | bundled (`main_sha` null) | 2026-08-09 | `get_l1`/`set_l1` on the control surface, "leaves the operator's click-to-edit modal exactly as it is" | imminent, retires nothing |

No intent in the ledger retires any behavior this capability's ACs describe.
Every one of the 28 ACs is **active**; none is deprecated and none is
unsupported.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-98 `story-af36c2cb` (upgrade, 13 ACs) | BUNDLE-14, BUNDLE-16 | aligned, covered | Every behavior the body claims — the third channel, the inert page, the settled state, derived segmentation, addresses, the page stamp, the module's own seam marker, renderer-drawn outlines, one published vocabulary, no leakage — has an AC and a green UAT driving `cmdRender`/`cmdPublish`/`cmdRevisions` over bytes on disk. 13/13 green. |
| STORY-101 `story-3bf94bd4` (feature, 15 ACs) | BUNDLE-16, REQ-118 | aligned, **not covered** | Body matches intent exactly (including the recorded intent/code divergence on the nothing-to-edit message and the known webui skip caveat). But the body's promise "click it and a form opens over exactly what that region exposes" and "two honest dead ends" is asserted only in the red file: 5 of its 15 ACs have no passing evidence. |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | uat | AC-1002 `acceptance_criterion-7d7a2789` | uat-edit | **Zero passing evidence anywhere.** The whole criterion is about the dialog, so the test is `it.skipIf(!WEBUI_INSTALLED)` with no component-independent half. It ran here and failed at the shared `open()` helper (`tests/reconciliation-copy-edit-gesture-modal.test.ts:345`, `expected [] to have a length of 1`). Where webui is absent it produces nothing; where webui is present it is red. | Fix the wait (below) — the assertions themselves are correct. |
| 2 | violation | uat | AC-1001 `acceptance_criterion-2f436fa0` | uat-edit | The AC's load-bearing claim — a *plain message naming the region's kind*, not an empty form and not silence — lives entirely after the `WEBUI_INSTALLED` guard and fails at line 313. What still passes proves only that `/api/copy` reports `kind: 'container', fields: []`, i.e. that the region exposes nothing — never that the operator is told so. | Same wait fix; keep `expect(modal.textContent).toContain('Nothing to edit on this container segment yet.')` verbatim. |
| 3 | violation | uat | AC-1003 `acceptance_criterion-5954a519` | uat-edit | Fails at line 479 on `expect(net.calls).toEqual([])`, receiving a leaked `GET /api/copy?slug=acme&page=home&path=0.0.0` — a request issued by an *earlier* test's editor whose `await fetchCopy` resolved after that test had already returned. So the criterion's core claim ("no edit request is sent") is currently contradicted by cross-test bleed rather than by the product: `openSegment`'s `!target.page` branch (`apps/control-app/src/builder/editor.js:80-87`) does return before any fetch. | Fix the wait so no editor outlives its test; then this assertion becomes a true statement about this click alone. |
| 4 | violation | uat | AC-1000 `acceptance_criterion-43e5a016` | uat-edit | Fails at line 419 with **2** modals where 1 is expected — AC-994's late-arriving dialog surviving into this test. The passing remainder proves only that a `GET` writes nothing; "confirming an untouched form sends nothing, exactly as cancelling does" — the actual criterion — is unproven. | Same wait fix. |
| 5 | violation | uat | AC-994 `acceptance_criterion-ce71a033` | uat-edit | Fails at line 254, `modals()` empty. The passing half is real and valuable (the bridge resolves the click to exactly one region at `0.0.0`, `defaultPrevented` is true, `/api/copy` returns `[{name:'text',type:'string'}]` pre-filled with the page's words), but three clauses of the AC — *a single dialog opens*, *it is the shared component's form*, *in `buffered` commit mode* — are only in the red half. | Same wait fix. |
| — | — | — | *(root cause shared by 1–5)* | uat-edit | `settle()` (`tests/reconciliation-copy-edit-gesture-modal.test.ts:181`) is a single `setTimeout(0)` macrotask, but `mountEditor`'s `openSegment` opens the dialog only after `await fetchCopy(target)` — a real HTTP round-trip to the builder origin. Product code awaits correctly; the *test* does not. One lost race then cascades across the file, which is why findings 3 and 4 see foreign modals and foreign requests. | Replace `settle()` with a condition wait (poll `modals().length`, or await the pending `fetchCopy`), and `await` each editor's teardown so nothing outlives its test. **Do not weaken any assertion** — every failing assertion is the correct one; only the wait is wrong. |
| 6 | violation | story | STORY-101 `story-3bf94bd4` | uat-edit | Independent story judgement: the body is fully aligned with cumulative intent, but the combined test set does not prove its central promise. "Click it and a form opens over exactly what that region exposes" and "two honest dead ends" are the two clauses the red file owns, so a third of the story's ACs currently rest on nothing. No AC is missing and no AC is wrong — this is an evidence-validity failure, not a matrix gap, so the fix is `uat-edit` and **not** ac-add. | Land the wait fix in findings 1–5; no story-body edit and no new ACs are needed. |
| 7 | warning | uat | AC-997 `acceptance_criterion-e2413484` | uat-edit | `test_UAT_AC997_one_confirmed_form_is_one_change_however_many_fields_it_held` (`tests/reconciliation-copy-edit-gesture.test.ts:526`) is green and proves the load-bearing half (nothing is written until Save; one Save moves exactly one file). But it only ever alters **one** field, so the clause "however many fields were edited in it" — and the AC's own verification instruction to "open a form over a region exposing more than one field where available" — is unexercised. Since REQ-118 such a region exists (an image exposes `src` + `alt`). The property is in fact proven by `test_UAT_FC_REQ-118_alt_text_is_editable_alongside_the_image_and_saved_in_the_same_diff` (`tests/req118-image-selection.test.ts:257`, asserting `changed: ['src','alt']` with `modified: ['pages/home.json']`), but under a name that traces to no AC. | Extend the AC-997 test with the two-field image region: alter both `src` and `alt` in one form, assert one POST, `changed` carrying both, exactly one modified file. |

## Notes for the Editor

- **One helper, five criteria, one fix.** Findings 1–5 are not five independent
  gaps. They are one broken wait in one file, and the two odd-looking failures
  (a foreign `GET` in AC-1003, two modals in AC-1000) are downstream of it.
  Fixing `settle()` and the editor teardown should turn all five green in a
  single pass; re-run the file **in isolation and inside a multi-file run** to
  confirm, since the cascade only shows up when the tests share a document.

- **Do not assume BUG-33 closes this.** BUG-33 (`bug-ede1fb8c`,
  `ready_to_reconcile`) names these exact five tests, but its `main_sha` is
  `null` and its body records them as *already green* by the time its work
  started — so whatever made them green lives on `af78081b` and is not on this
  branch. I reproduced the red here on `regression-50f23d80`. Re-check BUG-33
  against main rather than treating it as the fix.

- **The channel half needs nothing.** All 13 STORY-98 ACs are green with
  entry-point evidence, and several assert the criterion's *general* form rather
  than a worked instance — AC-954 iterates the behavior `registry` and proves the
  guard discriminates by constructing a synthetic newcomer, AC-1008 imports the
  vocabulary from both `site-schema` and `framework` and asserts identity rather
  than equality. Leave them alone.

- **Watch AC-1001's specimen when REQ-128 lands.** REQ-128 (bundled, not in main)
  gives the painted container a `backgroundImageUrl` field. AC-1001 currently
  uses that container as its "nothing to edit" example — exactly as it once used
  the image, before REQ-118 gave the image fields. The *property* survives (a
  region with no derived fields offers none), but the worked example will need
  moving again, and the story body already records this pattern. Nothing to do
  today; flagged so the reconcile of REQ-128 does not silently invalidate
  AC-1001's fixture.
