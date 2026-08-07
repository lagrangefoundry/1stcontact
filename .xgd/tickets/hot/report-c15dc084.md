---
uid: report-c15dc084
id: REPORT-1596
type: report
title: Fix In-Page Copy Editing (uat) — attempt 1
created_by: xgd
created_at: '2026-08-07T17:49:46.428773+00:00'
updated_at: '2026-08-07T17:49:46.428773+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-12fee326
  level: uat
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-17a279f7
---

# Fix Summary — In-Page Copy Editing (uat)

**Attempt**: 1
**Fixes applied this call**: 3
**Violations remaining**: 0
**Needs more work**: false

Both findings carrying a resolution category (`uat-edit` ×2) are applied. Findings
3 and 4 are `info` with an explicit "none" resolution and were not acted on.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1028 clause / `tests/req118-image-selection.test.ts:365-367` | Dropped `describe.skipIf(!WEBUI_INSTALLED)` from `REQ-118 image selection over the builder origin`, removed the now-unused `webui-installed` import and its `console.warn`, and left a comment naming the actual dependency boundary (`GET /` → `chromeHtml()`) plus the rule for future tests in the block (gate the `it`, never the `describe`) |
| 2 | uat-edit | AC-954 / `tests/reconciliation-edit-render-channel.test.ts` | Made the catalog the index instead of the literal: added `seamCaseFor(def)`, and rewrote the AC-954 loop to iterate `registry` (filtered to entries declaring slots) rather than `SEAM_CASES`. A seam-exposing module with no entry now throws with a message quoting the criterion; a case naming a seam its module does not declare also throws. Imported `registry` / `BehaviorDefinition` from `packages/framework/src/modules/` |
| 3 | uat-edit | AC-954 (same test) | Made the new guard self-proving, per this capability's own convention: the test fabricates a `BehaviorDefinition` the catalog could hold tomorrow and asserts `seamCaseFor` throws `/no SEAM_CASES entry/`, and a slot-renamed one throws `/does not declare/` — so "every module in the catalog" is a claim the loop demonstrably makes rather than one the comment merely asserted |

### Evidence for finding 1 (why the gate was safe to drop)

Verified before editing, not assumed:
- `startBuilder` (`tools/generate/src/cli/builder.ts:386-404`) only calls `ctxOf` and
  `http.createServer` — no webui touched at bind time.
- In `handleBuilderRequest`, `chromeHtml()` is reached from exactly one branch,
  `p === '/' || p === '/index.html'` (line ~162). The four tests in the describe hit
  `/api/copy` (GET + POST), `/api/assets` and `/preview/<slug>/<channel>/` only;
  the `beforeAll` uses `cmdNew` / `cmdRender` / `startBuilder`. None reaches `/`.

Result: the suite went from **8 passed / 3 skipped** to **11 passed / 0 skipped**.
AC-1028's transport clause now has executed evidence on this machine.

## Verification

| Scope | Before (per REPORT-1595) | After |
|---|---|---|
| `tests/req118-image-selection.test.ts` | 8 passed, 3 skipped | **11 passed, 0 skipped** |
| `tests/reconciliation-edit-render-channel.test.ts` | 13 passed | **13 passed** |
| The capability's four owning files | 33 passed, 5 skipped | **37 passed, 1 skipped** |
| Whole repo (`npx vitest run`) | — | **1184 passed, 113 skipped, 0 failed** (182 files) |

The one remaining skip in the capability is AC-1002 — finding 3, correctly gated
and environmental.

Typecheck: `npx tsc --noEmit -p tsconfig.base.json` produces a byte-identical error
set for the two edited files before and after (baseline captured via `git stash`);
the three errors on `req118-image-selection.test.ts` are pre-existing and
repo-wide (`jsdom` has no `@types`, `@1stcontact/site-schema` does not resolve
under that config, one `unknown` narrow), and `reconciliation-edit-render-channel.test.ts`
reports none. No new type errors introduced.

## Code Edits (if any)

None. Both mutations are test edits. No production file was modified.

## needs_review Items Forwarded

| Element | Observation | Operator decision needed |
|---|---|---|
| AC-1028 | **The ticket does not exist.** REPORT-1595's ledger lists AC-1028 as an AC of STORY-101 and counts "28 active ACs across the capability's two stories", but querying the matrix gives STORY-98 = 13 ACs (AC-948…958, AC-1007, AC-1008) and STORY-101 = 14 (AC-993…AC-1006) — 27, with no AC-1028. Across all 312 acceptance_criterion tickets the highest AC-10xx is AC-1027. REQ-118's criteria are in fact carried by **AC-1024–AC-1027** under STORY-100 (`story-37a3921b`, capability-f753cecd *Structured Copy Editing*) and **AC-1020–AC-1023** under STORY-102 (`story-c46abfa6`, capability-105cfacf), i.e. by the two capabilities this one names as out of scope. So the two `test_UAT_AC1028_*` tests in `tests/req118-image-selection.test.ts` are named for a criterion no ticket defines | Is AC-1028 a criterion that was intended for STORY-101 and never created (→ `ac-add` on STORY-101), or are the two tests misnamed and should carry `AC-1024`/`AC-1026` under STORY-100 (→ rename, and the coverage belongs to *Structured Copy Editing*, not here)? I did not guess: renaming would silently move evidence between capabilities, and creating an AC would add intent the ledger does not authorise me to invent. The finding's own fix was applied either way — the transport clause now runs regardless of which ticket ends up owning it |

## Notes

Finding 3 (AC-1002) left untouched as directed — the assessor's resolution is
explicitly "none — environmental". Worth recording for whoever reruns: the
components *are* present on this machine at
`/Users/martin/lagrangefoundry/node_modules/@gendevlabs/`, which is not an
ancestor of this worktree, so Node's upward resolution misses them and
`WEBUI_INSTALLED` is false here. Changing `webuiPackageDir`'s resolution would
also change what the builder origin serves in production, so it is a deliberate
non-action rather than an oversight.

Finding 4 (AC-1028 exclusivity) needed no action.
