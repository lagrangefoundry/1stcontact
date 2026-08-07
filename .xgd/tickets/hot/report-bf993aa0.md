---
uid: report-bf993aa0
id: REPORT-1597
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing (level=uat)'
created_by: xgd
created_at: '2026-08-07T17:53:17.443479+00:00'
updated_at: '2026-08-07T17:53:17.443479+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Attempt 2. REPORT-1595 (attempt 1) raised 1 violation + 1 warning; REPORT-1596
(`report-c15dc084`, fix attempt 1) applied both. Both are **re-verified as fixed
here from the diff and from a fresh test run**, not taken on the fix report's
word. The fix report also forwarded one `needs_review` — that claim is **false**
and is refuted below with direct evidence, so it is not carried forward as an
escalation.

Story level (REPORT-1591) and AC level (REPORT-1594) both PASS, so the AC bodies
remain the working reference and intent was consulted only for the ledger.

**Matrix at this level**: 28 active ACs — STORY-98 (`story-af36c2cb`) 13, STORY-101
(`story-3bf94bd4`) 15. Every one carries at least one `test_UAT_AC<n>_*` test.

**Executed evidence, this worktree, this attempt**: `npx vitest run` over the four
owning files → **37 passed, 1 skipped, 0 failed** (was 33/5 at attempt 1). A
launchable Chromium was present, so the real-browser halves of AC-993 (1116 ms)
and AC-1006 (672 ms) ran.

## Cumulative Intent Considered

Chronological by `merged_at_commit` in this branch's history. Unchanged from
attempt 1; all three are `free_and_reconciled`, so all count.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-14 `bundle-0385746c` (BUG-31 + REQ-114 + REQ-116) | free_and_reconciled | cd8f98c8 2026-08-06 15:43 | Created STORY-98 — the edit render channel: segmentation, addressing, inertness, settled state | YES |
| BUNDLE-16 `bundle-15c1f647` (REQ-117 + REQ-115 + REQ-44) | free_and_reconciled | 1741ee5d 2026-08-06 21:16 | Created STORY-101 — the click-to-edit gesture; updated STORY-98 with the page stamp, hover treatment, vocabulary-to-schema move, contact-form seam marker | YES |
| REQ-118 `request-66e4c630` | free_and_reconciled | b2b9208c 2026-08-06 22:32 | Updated STORY-101 — image selection reaches the operator through the same gesture and the same copy transport (AC-1028) | YES |

Nothing abandoned, deprecated, draft, or imminent-only. ACs carry no
`intent_uid`/`updated_by`; lineage is held at the story level.

## Alignment Ledger

Only rows whose state changed since REPORT-1595 are expanded. The remaining 25 ACs
were assessed in attempt 1 as `aligned`, their tests were not touched by the fix
(`git diff 51d1a535a..HEAD` shows exactly two test files changed), and all of them
pass in this run — so those ledger rows carry forward unchanged.

| Element | Test | Intents aligned to | Outcome |
|---|---|---|---|
| AC-1028 | `test_UAT_AC1028_clicking_an_image_segment_offers_a_picker_of_the_sites_assets` **+** `test_UAT_AC1028_the_modal_reads_its_picker_from_the_same_copy_transport` | REQ-118 | **aligned (was violation)** — the transport clause's test is no longer gated and now executes and passes (19 ms). Both clauses of the AC have executed evidence on this machine |
| AC-954 | `test_UAT_AC954_seam_content_is_addressable_rooted_at_the_behavior_instance` | BUNDLE-14, BUNDLE-16 | **aligned (was warning)** — the loop's membership is now the catalog's, so "for every module in the catalog" is a claim the test makes rather than one its comment asserted |
| AC-1002 | `test_UAT_AC1002_the_nothing_to_edit_message_is_dismissible_by_button_escape_and_backdrop` | BUNDLE-16 | aligned in shape; still the one skip here, correctly gated and environmental — unchanged, see finding 3 |
| AC-948…953, 955…958, 1007, 1008 (STORY-98) | 12 tests | BUNDLE-14, BUNDLE-16 | aligned — carried forward from REPORT-1595; untouched by the fix; all pass |
| AC-993…1001, 1003…1006 (STORY-101) | 13 tests | BUNDLE-16 | aligned — carried forward from REPORT-1595; untouched by the fix; all pass. Six report an UNVERIFIED half under the story's ratified `WEBUI_INSTALLED` caveat |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | AC-1028 / `tests/req118-image-selection.test.ts:364-380` | — | REPORT-1595 finding 1 (violation) is **fixed and verified**. `describe.skipIf(!WEBUI_INSTALLED)` is gone from `REQ-118 image selection over the builder origin`, the now-unused `webui-installed` import and its `console.warn` are removed, and a comment records the real dependency boundary (`GET /` → `chromeHtml()`) plus the rule for future tests in the block: gate the `it`, never the `describe`. Confirmed by diff and by run — that suite went 8 passed/3 skipped → **11 passed/0 skipped**, and `test_UAT_AC1028_the_modal_reads_its_picker_from_the_same_copy_transport` now passes | none |
| 2 | info | consistency | AC-954 / `tests/reconciliation-edit-render-channel.test.ts:243-270, 631-657` | — | REPORT-1595 finding 2 (warning) is **fixed and verified**, and fixed at the right level. The AC-954 loop now iterates `registry` filtered to slot-declaring entries instead of the `SEAM_CASES` literal, and `seamCaseFor()` throws when a seam-exposing module has no case (message quotes the criterion) or when a case names a seam its module does not declare. Crucially the guard is **self-proving**: the test fabricates a `BehaviorDefinition` the catalog could hold tomorrow and asserts `/no SEAM_CASES entry/`, plus a slot-renamed one asserting `/does not declare/` — so the guard is shown to discriminate before it is relied on, matching this capability's existing convention (AC-995's nesting check, AC-1005's positive control). A third behavior module can no longer be added to the catalog and pass AC-954 by never being iterated | none |
| 3 | info | coverage | AC-1002 | — | Unchanged from REPORT-1595 and correctly left alone by the fix. `test_UAT_AC1002_*` is `it.skipIf(!WEBUI_INSTALLED)` and remains the only skip in the capability. The gate is correct: the criterion is wholly about dismissing the dialog `mountEditor` builds from `@gendevlabs/webui-fields`, which cannot be exercised without the component and which the story forbids mocking. STORY-101's Technical Context records exactly this, and story level passed on that body. Matrix and intent agree — no drift | none — environmental; resolved by `bin/install --lang js --component all` in lagrange-framework |
| 4 | info | — | AC-1028 / REPORT-1596's forwarded `needs_review` | — | **The escalation is refuted; do not act on it.** REPORT-1596 forwarded a `needs_review` asserting "AC-1028 — the ticket does not exist", that STORY-101 has 14 ACs, and that the capability has 27. All three are wrong. `xgd ticket get acceptance_criterion-26ffac6d` returns **AC-1028, status `active`, `story_uid: story-3bf94bd4`**, titled "Clicking an image region opens a form offering a picker of the site's images, with its current handle always among them"; `xgd ticket list --type acceptance_criterion --filter fields.story_uid=story-3bf94bd4` returns **15** items including AC-1028. The capability total is 13 + 15 = **28**, as REPORT-1595 stated. Root cause is a tooling defect, not a matrix defect — see Notes | none on the matrix; the ticket is correctly placed and correctly named |
| 5 | info | exclusivity | AC-1028 vs AC-1024/AC-1025 (capability-f753cecd), AC-1020–1023 (capability-105cfacf) | — | Checked because REPORT-1596's escalation raised it. Those eight ACs are real, active, and each has its own `test_UAT_AC<n>_*` in its own file (`tests/reconciliation-copy-edit-image-selection.test.ts`, `tests/reconciliation-site-asset-listing.test.ts`). The division is the one this capability's own "Out of scope" declares: AC-1024–1027 own REQ-118's **derivation and write path** (Structured Copy Editing), AC-1020–1023 own the **asset store**, and AC-1028 owns the **gesture** clause — that a click resolving to an image opens the same single form a copy region does, over the same transport, with no image-specific route. Different criteria, different tests, different capabilities. Not duplication | none |

## Notes for the Editor

**The human-ID index is missing entries, and it has already caused one false
escalation.** `xgd ticket get AC-1028` fails with `TICKET_ID_NOT_FOUND` while
`xgd ticket get acceptance_criterion-26ffac6d` returns the ticket, and the
story-filtered list returns it too. The same failure shape hit `REPORT-1594`
earlier in this session (`TICKET_ID_NOT_FOUND` by ID, resolvable by UID). So
lookups and enumerations keyed on the human ID are silently incomplete, which is
how REPORT-1596 reached "the ticket does not exist" and then went hunting for
where REQ-118's criteria "really" live. This is a defect in the XGD ticketing
tool, not in the capability matrix, and it is worth an operator's attention
because the failure mode is *silent* — the escalation it produced was
well-argued, specific, and wrong. I have not filed a todo: this check is
read-only and the finding belongs in this report. **Downstream: resolve ACs by
UID or by `--filter fields.story_uid=…`, and treat an ID-keyed miss as unproven
rather than as absence.**

**Both fixes were made at the correct altitude.** Neither reached for the easy
version. Finding 1 could have been "move the one test out of the describe";
instead the fix removed the over-broad gate, deleted the dead import, and wrote
down the boundary so the next test added to that block does not reintroduce the
bug. Finding 2 could have been "add a comment admitting the table is manual";
instead it inverted the indexing so the catalog drives the loop, and then proved
the new guard discriminates. Test-only changes; no production file touched
(confirmed by `git diff --stat 51d1a535a..HEAD`).

**Standing caveat, unchanged.** `@gendevlabs/webui-*` resolve from
`/Users/martin/lagrangefoundry/node_modules/@gendevlabs/`, which is not an
ancestor of this worktree (`/Users/martin/.xgd/worktrees/…/regression-5096fbee`),
so Node's upward resolution misses them and `WEBUI_INSTALLED` is false here even
though the components exist on this machine. Six ACs report a partial UNVERIFIED
half and AC-1002 skips entirely because of it. Rerunning where resolution
succeeds should turn all seven fully green; a failure there would be new
information, not a regression from this report.

**Assessment of the evidence base, carried forward.** These tests drive real CLI
entry points and a real HTTP origin, read bytes actually written to disk, and
prove their fixtures discriminate before asserting on them. Attempt 1 noted that
pattern; the AC-954 fix extended it rather than diluting it. Nothing here is an
AST-shaped stand-in for behaviour.
