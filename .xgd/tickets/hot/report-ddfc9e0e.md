---
uid: report-ddfc9e0e
id: REPORT-2458
type: report
title: 'Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
  (level=ac)'
created_by: xgd
created_at: '2026-08-20T15:14:40.052997+00:00'
updated_at: '2026-08-20T15:14:40.052997+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-5d07b533
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

The capability (CAP-102) carries no `intent_uid`/`updated_by` of its own. Its single story,
STORY-119 (`story-d5167ced`, `story_kind=feature`), records `intent_uid: bundle-77b28def`
(BUNDLE-19). BUNDLE-19 bundles nine source tickets; exactly one of them addresses this
capability's subject — **REQ-144**. The other eight (REQ-133, BUG-35, REQ-131, REQ-140,
REQ-139, REQ-123, REQ-141, REQ-142) address palette/editor/KB/workerd-test/store subjects and
touch no element of this capability's tree.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-144 (via BUNDLE-19) | free_and_reconciled (bundle merged at `b18b859d`) | 2026-08-18 bundled, 2026-08-20 reconciled | `bin/build` (preflight → package builds → per-Worker bundle against `--env production`); `bin/deploy` (one path, `--dry-run` as a target, migration/secret hooks as seams); `bin/smoke` (nine live-origin checks, non-zero naming the failed assertion); the `[env.production]` vars/bindings inheritance rule checked across every Worker; a documented, never-committed secret mechanism | YES |
| REQ-143 (The Cloudflare SiteStore: definitions in D1, bytes in R2) | ready_to_reconcile | — | Lands a **migration hook file** into `bin/deploy.d/migrate/` — the seam REQ-144 owns; changes nothing in the deploy command itself | imminent — explicitly out of scope of STORY-119 ("the migration and secret hooks themselves"); will express as its own story, not as an AC here |
| REQ-146 (The AI host moves into workerd) | ready_to_reconcile | — | Lands `ANTHROPIC_API_KEY` into the **secret hook** seam | imminent — same disposition as REQ-143 |
| REQ-145 (control-app becomes the builder; proxy deleted) | ready_to_reconcile | — | Makes the builder client a build artifact and moves routes into workerd; STORY-119 records the residual bad-gateway as *its* intended outcome, resolved by REQ-145 | imminent — no AC here claims otherwise |
| REQ-147 (The builder is private: Cloudflare Access) | reconciling | — | Gates exposure of `app.1stcontact.io`; `depends_on` REQ-144 precisely so the control app is not deployed here | imminent — consistent with STORY-119's "no AC claims a live control-application deploy" |

At `ac` level the story body is the working reference; the intent ledger was consulted only to
confirm that the AC-level refinements not stated verbatim in the story body (browser/server
surface distinction, exit code 6, `--skip-preflight`, the `--max-assets` bound) are intent-backed
rather than invented. Each was confirmed — see Notes for the Editor.

## Alignment Ledger

Story-level scope bullets from STORY-119 mapped to the ACs that express them.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1330 — preflight reports every component and package, refuses naming absence and remedy | REQ-144 §3, §4.3 | aligned — matches story "In scope" bullet 1 (what it reports, what it refuses, distinct exit code, named remedy) |
| AC-1331 — build discovers every Worker, bundles against production, after preflight passes | REQ-144 §3, §4.3 | aligned — matches "In scope" bullet 2; ordering, `--skip-preflight` and the empty-tree refusal are intent-backed refinements |
| AC-1332 — rehearsal runs the same hooks and composes the same invocation, reported as rehearsed | REQ-144 §3, "design decisions" | aligned — matches "In scope" bullet 3 (rehearsal and real deploy on one path) |
| AC-1333 — executable hooks in sorted order before upload, with the deploy context | REQ-144 §3 | aligned — matches "In scope" bullet 4 (discovery by executability, sorted order, context) |
| AC-1334 — a failing hook aborts that app before anything is uploaded | REQ-144 §3 | aligned — matches "In scope" bullet 4 (abort-before-upload), incl. holding in a rehearsal |
| AC-1335 — targets default to all discovered apps, honour named apps, refuse an unknown one | REQ-144 "apps are discovered, not listed" | aligned — matches "In scope" bullet 3 (target selection, refusal of an unknown app) |
| AC-1336 — all nine checks pass, nothing skipped, exit zero, origin is a parameter | REQ-144 §3, §4.4 | aligned — matches "In scope" bullet 5 (pass reporting) and the story's "drivable against a supplied origin" |
| AC-1337 — each distinct silent breakage fails non-zero naming the check and its expectation | REQ-144 §4.5 | aligned — matches "In scope" bullet 5 (fail reporting and failure naming) |
| AC-1338 — a check with nothing to test against is skipped with its missing input, counted separately | REQ-144 §3 ("checks with nothing to test against report skip") | aligned — matches "In scope" bullet 5 (skip reporting) and the story's "a run that skipped everything has proved nothing and says so" |
| AC-1339 — same-origin asset coverage, one level into stylesheets, content-type table pinned | REQ-144 §3, "the smoke content-type table is a second statement of the Worker's" | aligned — depth on one of the nine checks; the cross-capability pinning to CAP-82's serving Worker is explicitly sanctioned by the story's Technical Context |
| AC-1340 — unpublished site indistinguishable from unknown, in status and body | REQ-144 §3 ("the 404-leak check … identical status *and body*") | aligned — depth on one of the nine checks; matches the story's leak argument verbatim in intent |
| AC-1341 — every named environment repeats every top-level var and binding, bindings found structurally | REQ-144 §1, §4.1, §4.2 | aligned — matches "In scope" bullet 6; the pre-fix-config regression fixture is intent-mandated ("a guard that has never been shown catching its bug is a guard nobody should trust") |
| AC-1342 — no secret value committed, documented push pipes and echoes only the name | REQ-144 §3, §4.6 | aligned — matches "In scope" bullet 7 and the story's narrowing of the criterion to what is observable (the end-to-end live push is recorded as Outstanding, and no AC claims it) |

Out-of-scope items in the story body were checked for AC leakage and none was found:

- **No live control-application deploy** — no AC asserts one. AC-1341 asserts only that the
  control app's `[env.production]` *declares* the builder origin, which is a configuration
  property of the tree, not a deployment.
- **The migration and secret hooks themselves** — AC-1333/AC-1334 are stated against a hook the
  verification *places*, i.e. the seam contract, not any shipped hook.
- **CI wiring to the build command** — no AC mentions CI.
- **Shipping or serving a site's snapshot (CAP-82)** — the only crossing is AC-1339's
  content-type pinning, which the story's Technical Context explicitly designates as a
  deliberate second statement rather than drift.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-119 (all 7 "In scope" bullets) | — | Every in-scope bullet of the story body is expressed by at least one AC, and no AC expresses an out-of-scope item; the 13 ACs map onto the 7 bullets with the smoke bullet carrying five (aggregate pass, aggregate fail, skip protocol, plus per-check depth on assets and on the 404 leak) | none |
| 2 | info | exclusivity | AC-1336 + AC-1337 vs AC-1339 + AC-1340 | — | The four smoke ACs share scenarios — AC-1337's breakage list includes a 404ing asset, a wrong content type and a leaking not-found, which AC-1339 and AC-1340 also exercise — but the *criteria* differ: AC-1336/AC-1337 fix the run-level protocol (aggregate pass/exit-zero; non-zero with the owning check named, non-empty detail, remaining checks still reporting), while AC-1339/AC-1340 fix the internal rules of two individual checks (same-origin queueing, one level into stylesheets, the bounded queue; identical status *and* body, and the nothing-to-compare pass). Judged complementary, not redundant | none |
| 3 | info | exclusivity | AC-1332 vs AC-1335 | — | Both are exercised by rehearsing a deploy, but AC-1332 fixes the one-path property (same hooks, same composed invocation ± one flag, rehearsed marker) and AC-1335 fixes target selection (default-all, named subset, unknown-app refusal, environment option). Distinct criteria | none |
| 4 | info | consistency | AC-1342 | — | The AC is deliberately narrower than a naive reading of REQ-144 §4.6 would suggest: it asserts what is observable (nothing committed, the documented mechanism echoes nothing) and does not claim the end-to-end throwaway-value push. This matches STORY-119's "Outstanding at reconciliation time" section, which records that push as unproved and blocked by the control app never having been deployed. Correctly aligned rather than drifted | none |
| 5 | info | consistency | AC-1341 | — | The AC's second half ("feed the check the exact configuration that shipped before the fix") is intent-mandated by REQ-144's recurrence-guard rationale, not an AC invention. Correctly aligned | none |

## Notes for the Editor

**Nothing to repair at this level.** Zero violations, zero warnings, zero needs_review — the AC
tree under STORY-119 is complete against the story's in-scope list, free of out-of-scope leakage,
and internally non-redundant.

**AC refinements not stated verbatim in the story body were checked against intent and code**
before being accepted as aligned, since inventing detail at the AC level is the usual shape of
ac-level drift. All four are grounded:

- AC-1330's **browser/server surface distinction** — `SHARED_SERVER_COMPONENTS` /
  `SharedComponentSurface` in `tools/generate/src/cli/shared-store.ts`, whose message appends
  *"the browser import map would name a module nothing serves"* for browser components only.
- AC-1330/AC-1331's **environment-specific exit code** — `bin/build` header: *"Exit codes: 0
  success; 6 environment (preflight); 1 anything else."*
- AC-1331's **skip option** and **empty-tree refusal** — `--skip-preflight` at `bin/build:43`,
  and `bin/build:76` *"no apps/*/wrangler.toml found — nothing to build"* with `exit 1`.
- AC-1339's **bounded, configurable asset queue** — `maxAssets` default 200 and the
  `--max-assets` option in `tools/generate/bin/smoke.mjs`, whose over-bound message is a failure
  telling the operator to raise it (line 314), exactly as the AC states.
- AC-1332's **"points at the command that proves it serves"** — `bin/deploy:207`,
  *"Now prove it serves:  bin/smoke"*, emitted only on the real-deploy path.

**Worktree caveat.** This regression branch's HEAD does **not** contain BUNDLE-19's merge commit
`b18b859d` (`git merge-base --is-ancestor` is false, and `bin/build`, `bin/deploy`, `bin/smoke`
are absent from the working tree). The code spot-checks above were therefore read from
`93c5a62ee` on `main` via `git show`. This is a property of the regression branch's cut point,
not evidence of missing implementation, and no finding was raised from it. A `uat`-level cycle
run in this worktree would find the tests and scripts absent and should either rebase onto a
commit containing `b18b859d` or read them the same way.

**For the imminent intents.** REQ-143 and REQ-146 each land a file into a hook directory that
STORY-119 owns as a *seam*; when they reconcile, their behaviour belongs in their own stories and
must **not** be folded into AC-1333/AC-1334, whose subject is the contract rather than any
particular hook. REQ-145's landing will retire STORY-119's "residual honest failure" note in the
Technical Context — a story-level edit at that point, not an AC-level one.
