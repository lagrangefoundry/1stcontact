---
uid: report-659fc3d0
id: REPORT-3663
type: report
title: 'Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
  (level=story)'
created_by: xgd
created_at: '2026-09-10T04:43:23.728746+00:00'
updated_at: '2026-09-10T04:43:23.728746+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-5d07b533
  level: story
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

The capability's behavioural surface is fully expressed — every reconciled intent's ask is
covered by STORY-119's tree, the eleven checks the story claims are the eleven the code
implements, and the boundaries drawn against CAP-103, CAP-101 and CAP-90 are clean in both
directions. What fails is factual: the story body still tells a reader that the control
application has never been deployed and that its hostname does not resolve, and derives a scope
limit from that. Two intents in the story's own `updated_by` bundle record the opposite,
empirically.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. STORY-119 carries
`intent_uid=bundle-77b28def` (BUNDLE-19, holding REQ-144) and `updated_by=bundle-78f4e2fe`
(BUNDLE-21); its own Reconciliation Decisions additionally name BUNDLE-20 (bundle-b3b7c399,
holding REQ-145 / REQ-147 / REQ-149), which is therefore in the ledger even though it is not in
the `updated_by` field.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-144 | free_and_reconciled | 2026-08-15 | The origin. `bin/build` (preflight + bundle against `[env.production]`), `bin/deploy` (rehearsal as a target, hook seam, discovery), `bin/smoke` (nine checks), the vars/bindings non-inheritance rule and its recurrence guard, the documented secret mechanism | YES |
| REQ-143 | free_and_reconciled | 2026-08-15 | Lands the D1 migration into the migrate hook — the seam only; behaviour owned by CAP-101 | YES (adjacent) |
| REQ-145 | free_and_reconciled | 2026-08-15 | `1c assets` must run before the typecheck (Worker source imports uncommitted generator output); introduces `ACCESS_DEV_OPEN` and requires it **absent** from `[env.production.vars]` — the one stated exception to the repetition rule | YES |
| REQ-146 | free_and_reconciled | 2026-08-15 | Lands the model key into the secrets hook — the seam only; behaviour owned by CAP-90 | YES (adjacent) |
| REQ-147 | free_and_reconciled | 2026-08-15 | Adds `--control-origin` / `--workers-dev-origin` to smoke (checks ten and eleven); `workers_dev = false` restated for production; explicitly widens the smoke pass criterion so the two new checks *skip* against a public-site origin, "which the assertion now names rather than forbids" | YES |
| REQ-149 | free_and_reconciled | 2026-08-17 | AC12: no module reachable from a Worker entrypoint imports a node-only module, **including through a type-only import** — a `bin/build` failure the runtime-import guard could not see. ACs 13–16: the secret hook's decision table (owned by CAP-90, AC-1410). Records `bin/deploy --dry-run control-app` reading the live store and reporting `ANTHROPIC_API_KEY already on 1stcontact-control-app` | YES |
| BUG-36 | free_and_reconciled | 2026-08-23 | Fresh-deployment tenant registration. Records production state empirically: the deployed D1 queried with `wrangler … --remote`, `GET https://app.1stcontact.io/api/sites` answering `302` to `lagrangefoundry.cloudflareaccess.com`, and a service-token identity added for `bin/publish` | YES |
| BUG-37 | free_and_reconciled | 2026-08-24 | Unsampled `[observability]` at the top level **and** under `[env.production]`, placed after that environment's bare keys so the route survives the table header. Diagnosed from a live Error 1102 on `app.1stcontact.io` in Edit mode | YES |
| REQ-154 | bundled (BUNDLE-22 is free_and_reconciled) | 2026-08-20 | `BROWSER` binding, repeated under `[env.production]` | imminent |
| REQ-162 | free_and_reconciled | 2026-08-31 | `BLOBS` binding, repeated under `[env.production]`; the shared ticket component named in the build report | YES |

Retired / not counted: none in this capability's tree. No intent in the ledger has retired a
behaviour STORY-119 describes.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-102 (capability body) | REQ-144 | aligned — the CAP-82 boundary it draws ("a *site's* rendered snapshot" vs "the platform's own Workers") matches how the two trees actually divide |
| STORY-119 — build half (preflight, assets-before-typecheck, production-environment bundle, type-program refusal) | REQ-144, REQ-145, REQ-149 | aligned. Verified against `bin/build`: four stages in the order the story states, exit 6 for the environment failure, `--env production` on every discovered app |
| STORY-119 — deploy half (rehearsal as target, hook contract, discovery, target refusal) | REQ-144 | aligned. `bin/deploy` matches the contract verbatim, including the six `DEPLOY_*` context variables and abort-before-upload |
| STORY-119 — smoke half (eleven checks, skip vocabulary, per-axis selection) | REQ-144, REQ-147 | aligned. `tools/generate/bin/smoke.mjs` implements exactly eleven named checks — nine public, `control_app_challenges_unauthenticated` and `control_app_workers_dev_closed` |
| STORY-119 — configuration rule (AC-1341) and its one exception | REQ-144, REQ-145, REQ-147, BUG-37 | aligned, and holds open correctly: REQ-154's `BROWSER` and REQ-162's `BLOBS` are both covered by the rule's universal form with no story edit, which is what "bindings identified structurally" was for |
| STORY-119 — retention (AC-1454, AC-1455) | BUG-37 | aligned |
| STORY-119 — Technical Context / Out of scope, on the deployment state of the control application | REQ-144 only | **gap: BUG-36 and BUG-37 (both in this story's own `updated_by` bundle) supersede REQ-144's finding. See findings 1 and 2** |
| STORY-119 — "Outstanding at reconciliation time", on the secret mechanism | REQ-144 only | **gap: REQ-149 records a positive read from the live secret store. See finding 3** |
| Boundary: two control-surface checks here vs the gate's behaviour in CAP-103 | REQ-147 | clean. AC-1341 explicitly delegates the platform-default-hostname repeat to "the criterion that owns it", and CAP-103's AC-1382 owns it — the handoff is stated from both sides, not assumed |
| Boundary: secret *hook* behaviour deferred to CAP-90 | REQ-146, REQ-149 | clean. STORY-119's out-of-scope defers it; CAP-90's AC-1410 picks it up ("the deploy asks the deployment whether it is already in place rather than the operator") — REQ-149 ACs 13–16 are covered, not dropped |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-119 (story-d5167ced), **Out of scope**, first bullet | story-body-edit | The bullet reads: "**Any live deployment of the control application.** It has never been deployed and its hostname does not resolve; both are deliberately left alone here… The two control-surface checks are therefore provable against a supplied origin and against a local deploy, **not against production**." Both premises are false and were false when the story was last updated. BUG-36 (free_and_reconciled, 2026-08-23, in `bundle-78f4e2fe` = this story's own `updated_by`) records `GET https://app.1stcontact.io/api/sites` returning `302` to `lagrangefoundry.cloudflareaccess.com/cdn-cgi/access/login/…`, and its production-state section reports the deployed D1 queried directly with `wrangler d1 execute … --remote`. BUG-37 (free_and_reconciled, 2026-08-24, same bundle) diagnoses a live Error 1102 in Edit mode on that same hostname. `apps/control-app/wrangler.toml` now carries real production Access identifiers (`ACCESS_TEAM_DOMAIN = "lagrangefoundry.cloudflareaccess.com"`), landed by `6b5761399d`, and `apps/control-app/ACCESS.md` §"Verifying it" documents running `bin/smoke --control-origin https://app.1stcontact.io` against production | Keep the exclusion — this story still does not own deploying the control application — but drop the two false premises and the "not against production" derivation. Restate as: the checks are asserted against a **supplied** origin, which is the seam every other check in the set uses and which is what keeps this story independent of any particular deployment's state; note that production is now one such origin (ACCESS.md records the invocation) rather than an unreachable one |
| 2 | warning | consistency | STORY-119, **Technical Context** → "Where the intent's premise was wrong on the facts, and what was found instead" | story-body-edit | The same two claims are stated in the present tense as standing facts — "The control application's hostname does **not resolve at all**" and "The control application **has never been deployed** to the account at all" — followed by "So the configuration bug was never live; it was a trap set for the first deploy, now sprung harmlessly." As a record of what REQ-144's investigation found in August that is accurate and worth keeping; as a present-tense statement it is contradicted by BUG-36 and BUG-37 above | Re-tense to the REQ-144 investigation ("At REQ-144's reconciliation the hostname did not resolve and the Worker had never been deployed, so the `[vars]` bug was never live"), then add one sentence recording that BUG-36 (2026-08-23) supersedes both: the Worker is deployed, the hostname resolves, and Access fronts it. The conclusion the passage exists to support — that no acceptance criterion here claims a live control-application deploy — is unaffected and should stay |
| 3 | warning | consistency | STORY-119, **Technical Context** → "Outstanding at reconciliation time, and why" | story-body-edit | Claims the secret mechanism "has **not** been proved end-to-end with a throwaway value against the live account — that means writing to production configuration, which was left for the operator to authorise." REQ-149 (free_and_reconciled) records the opposite: `bin/deploy --dry-run control-app` with `ANTHROPIC_API_KEY` unset reports `ANTHROPIC_API_KEY already on 1stcontact-control-app — would leave it`. By REQ-149's own decision table only a *positive* read of the live store satisfies that probe (a Worker absent on a first deploy counts as absent), so the store answered for that Worker and the name was in the answer — a real secret was written to the live account. CAP-90's AC-1404 independently asserts a whole turn running "on the deployed host with the model key read from a deploy secret" | Replace the "outstanding" framing with what is now true: the mechanism has been exercised against the live account (cite REQ-149's probe result), and the criterion here remains written about what this story can observe — nothing committed, nothing echoed (AC-1342) — because that is the durable property, not because the push was unproven |
| 4 | info | coverage | REQ-149 ACs 13–16 (secret-hook decision table) | — | Not a gap. STORY-119 deliberately excludes the hooks themselves, and the behaviour is expressed at CAP-90 / STORY-103 / AC-1410. Recorded here so a future check does not re-derive it | none |
| 5 | info | exclusivity | AC-1341 (here) vs AC-1398 (STORY-121) and AC-1490 (STORY-127) | — | Three criteria now say something about declarations appearing in both halves of a Worker's configuration. Not redundant: AC-1341 asserts **presence** universally and structurally; the other two additionally assert their own binding **names the same target** in each half, which AC-1341 does not check. Judged additive, not overlapping | none |
| 6 | info | coverage | REQ-154 (`BROWSER`), REQ-162 (`BLOBS`) | — | Both landed new top-level bindings on the operator surface after STORY-119's last update, and both are repeated under `[env.production]`. AC-1341's universal, structurally-identified form absorbs them with no story or AC edit — the design decision REQ-144 made against a hardcoded list of block kinds, working as intended | none |

## Notes for the Editor

**All three findings are one root cause, in three passages.** STORY-119 was last updated on
2026-08-31 reconciling BUNDLE-21, and that pass added the retention criteria (AC-1454, AC-1455)
from BUG-37 without revisiting the deployment-state narrative that BUG-36 and BUG-37 had already
made false. An editor fixing finding 1 should fix 2 and 3 in the same pass; they will read as
contradictory otherwise.

**No acceptance criterion needs to change.** This is worth stating plainly, because the natural
reading of "the control app is deployed now" is that the two control-surface checks should be
re-pointed at production. They should not. Every AC in this story is written about a **supplied**
origin or about the **parsed** configuration, and both of those choices survive the correction
intact — that is precisely why the story chose them. The drift is in the prose that explains
*why* those seams were chosen, not in the seams.

**The behavioural surface is in good shape.** Spot-checked against the tree rather than taken on
the story's word: `bin/build` runs the four stages in the stated order with exit 6 reserved for
the preflight; `bin/deploy` implements the hook contract including all six `DEPLOY_*` variables
and abort-before-upload; `tools/generate/bin/smoke.mjs` defines exactly eleven checks with the
names the story implies; and `apps/control-app/wrangler.toml` carries `ACCESS_DEV_OPEN` at the
top level and not under `[env.production.vars]`, which is the one stated exception holding.

**One cosmetic mismatch, outside this check's remit and not counted as a finding.** `bin/build`'s
own header comment says "Three stages, in this order and for this reason:" and then enumerates
four. The story body says four, and four is what the script does — so the story is right and the
comment's count is stale. Worth a one-word fix whenever that file is next touched; it is a code
comment, not matrix drift.
