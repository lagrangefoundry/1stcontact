---
uid: report-b7fbc162
id: REPORT-1620
type: report
title: 'Fix Builder Workspace: Chrome, Origin & Display Panel (story) — attempt 2'
created_by: xgd
created_at: '2026-08-07T20:15:49.644859+00:00'
updated_at: '2026-08-07T20:15:49.644859+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a994b8f3
  level: story
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-17a279f7
---

# Fix Summary — Builder Workspace: Chrome, Origin & Display Panel (story)

**Attempt**: 2
**Fixes applied this call**: 6
**Violations remaining**: 0
**Needs more work**: false

All four actionable findings (#1 violation, #2/#3/#4 warnings) are resolved.
Findings #5–#10 are `info` with "none" as their own suggested edit; #6 and #7 are
explicitly deferred by the assessor to other cycles and are re-forwarded below.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | code-issue | `tools/generate/src/cli/builder.ts` `json()` | Added `'cache-control': NO_STORE` to the single JSON emitter, so all five JSON routes (`/api/sites`, `/api/publish`, `/api/assets`, `/api/copy`, the `CommandError` 400 envelope, the 500) inherit it. Introduced the `NO_STORE` constant so the directive is stated once |
| 2 | code-issue | `tools/generate/src/cli/builder.ts` bare status-line writes | Added the same directive to the four plain-text refusals (`Unknown channel` 404, `Unknown component` 404, top-level `Not found` 404, `serveTree` 403/404). Harmonised the `/framework/*.js` route's `no-store` to `NO_STORE`. Corrected the `/` route comment, which asserted the false universal ("the shell was the last cacheable response … every other route goes through `sendFile`") |
| 3 | uat-edit | `test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable` | Widened the probe from 7 routes to 17. Now covers the served bridge (`/framework/{edit-client,site-schema-edit}.js`), the three operations (`/api/sites`, `/api/assets`, `/api/copy` GET) and — the structural fix — **refusals**: the header is asserted independently of status, so 400/404 responses are probed rather than skipped by a 200-only helper |
| 4 | story-body-edit | STORY-99 (story-e674c60a) | Finding #3: the origin enumeration in "A single workspace, at one address" now includes the shared client code the editing gesture runs, served rather than reimplemented so it cannot drift from the markup it reads; the ownership split is stated (this story owns reachability, CAP-87 owns what the code does) and the Out-of-scope editing bullet carries the matching half. Finding #4: the "One tab, filling the window" bullet now carries the declaration-integrity guarantee — a tab is declared once and whole, an added option needs no change at the mounting step, and no declared option is silently discarded |
| 5 | story-body-edit | CAP-85 (capability-a994b8f3) | Finding #3, capability half: same addition to the "The workspace origin" scope bullet, and the "Edit semantics" out-of-scope bullet extended so the gesture's client code is split the same way the edit transport already is |
| 6 | ac-edit | AC-977 (acceptance_criterion-76d3ad8f) | Paired with #3. The AC's own Verification enumerated only four route classes — which is *why* the UAT probed a subset. Criterion and Verification now name the served client code, the operations, and refusals, and direct that the assertion be on the header alone rather than on a success status |

## Code Edits

| File | Lines | Evidence chain |
|---|---|---|
| `tools/generate/src/cli/builder.ts` | 129-152 (`NO_STORE` + `json()`), 179-187 (`/` comment), 299-305, 340, 352-358, 366, 390-397 | STORY-99's "Freshness over caching" bullet, AC-977's title and criterion, and the code's own `/` comment all state the same universal; the shipped origin exempted every JSON route and every bare text refusal. The assessor verified this empirically against a running origin. The widened UAT was confirmed RED against the pre-fix code (`git stash` of builder.ts alone → `test_UAT_AC977…` fails on `/api/sites`) and GREEN after. The change is the one the assessor named as preferred, using the directive `sendFile` already uses (`serve.ts:118-123`) |

Assessor's preferred resolution was taken (fix the code), not the alternative
(narrowing the story and AC), for the reason given in the report: narrowing would
weaken a guarantee the author believed shipped and leave the stale-modal case
uncovered.

### Verification run

- `npx vitest run tests/reconciliation-builder-workspace-origin.test.ts` — **11 passed**.
- `npx vitest run` over the three suites that exercise these responses
  (`…-workspace-origin`, `…-copy-edit-write-path`, `…-copy-edit-image-selection`)
  — **33 passed, 0 failed**. No suite I did not touch regressed.
- `npx tsc --noEmit -p tools/generate/tsconfig.json` — clean.
- **Empirical, matching the assessor's method**: started `bin/1c builder --port 4297`
  against this checkout and read response headers. The two routes the report names
  as failing now answer `cache-control: no-store, must-revalidate` —
  `GET /api/sites` → 200, `GET /api/assets?slug=1stcontact` → 200 — as do
  `GET /api/assets` (400), `GET /no/such/route` (404) and
  `GET /framework/edit-client.js` (200).
- Component-dependent probes (`/`, `/webui/*`) remain unverifiable on this
  machine: `@gendevlabs/webui-*` is not installed, the known coverage gap the
  story's Technical Context declares. The UAT reports it loudly rather than
  passing silently; that behaviour is unchanged.

## Uncommitted work — needs the workflow's commit step

The three ticket edits auto-committed (`4b8553945`, `78d9281b5`, `10b063d34`).
**The code and test changes are in the working tree and NOT committed** — I did
not commit them because nothing in this workflow state asked for it and the
prior `Workflow fix_story_validation completed` commit is an empty marker. Two
modified files: `tools/generate/src/cli/builder.ts`,
`tests/reconciliation-builder-workspace-origin.test.ts`. If the state machine
does not commit on exit, these must be committed before the assessor re-runs, or
finding #1 will read as unrepaired.

## Environment note — stale ticket reads under sparse checkout

`.xgd/tickets/` is excluded by this worktree's sparse-checkout (`git ls-files -v`
reports `S`), so tickets exist as committed blobs without being materialised on
disk. `xgd ticket get capability-a994b8f3` returned a body **predating attempt
1's repair** (0 occurrences of "transport"), while `HEAD:.xgd/tickets/hot/
capability-a994b8f3.md` carried the repaired version (2 occurrences, plus the
"Edit semantics" bullet) — matching the assessor's verification and the injected
context. I therefore based the CAP-85 edit on the committed blob, not on the CLI
read, so attempt 1's repair is preserved; the written file now carries both
repairs and reads correctly. **Any session editing a non-materialised ticket in
this worktree via `--body-file` risks silently reverting prior repairs.** Worth
raising outside this capability.

## needs_review Items Forwarded

None blocking. Two assessor-deferred items re-forwarded so the next cycle need
not rediscover them:

| Element | Assessor said | Where it belongs |
|---|---|---|
| STORY-99 ACs (finding #6, info) | No AC covers the edit transport attempt 1 added to the story body; should be about reachability and the shape of the refusal (the write path's own code/path/hint), never about what the write path validates | The `ac` level cycle, not this one |
| STORY-100 (story-37a3921b) line 138 (finding #7, info) | Still points at CAP-84, which is `superseded_by` CAP-87 | Out of this capability's scope; sweep when CAP-86 is validated |
