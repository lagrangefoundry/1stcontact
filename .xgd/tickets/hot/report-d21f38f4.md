---
uid: report-d21f38f4
id: REPORT-3665
type: report
title: 'Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
  (level=story)'
created_by: xgd
created_at: '2026-09-10T04:53:51.403144+00:00'
updated_at: '2026-09-10T04:53:51.403144+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-5d07b533
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Platform Build, Deploy & Live-Origin Verification
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Attempt 2. The three findings of REPORT-3663 (attempt 1) are resolved in the stored body, and
every fact the repair *added* was re-verified against its cited source rather than taken from the
fix report: `apps/control-app/ACCESS.md:140` does record
`bin/smoke --control-origin https://app.1stcontact.io`; BUG-36 does record the `302` to
`lagrangefoundry.cloudflareaccess.com/cdn-cgi/access/login/…` (line 126) and the remote D1 query
(line 86); BUG-37 does diagnose Error 1102 (line 4); REQ-149 does record
`ANTHROPIC_API_KEY already on 1stcontact-control-app — would leave it` from a shell with the
variable unset (lines 474-476). Coverage and exclusivity were re-derived independently and are
clean. One warning remains: a section label left over from the pre-repair narrative asserts a
residual failure that its own next clause says has since been closed.

## Cumulative Intent Considered

STORY-119 carries `intent_uid=bundle-77b28def` (BUNDLE-19, holding REQ-144) and
`updated_by=bundle-78f4e2fe` (BUNDLE-21, holding BUG-36 / BUG-37 / BUG-38). Its own
Reconciliation Decisions additionally name BUNDLE-20 (`bundle-b3b7c399`, holding REQ-145 /
REQ-147 / REQ-149), which is therefore in the ledger even though the single-valued `updated_by`
field cannot hold it. No AC on this story carries an `intent_uid` of its own, so the story's two
fields plus its stated decisions are the whole provenance record.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-144 | free_and_reconciled | 2026-08-15 | The origin. `bin/build` (preflight + bundle against `[env.production]`), `bin/deploy` (rehearsal as a target, hook seam, discovery), `bin/smoke` (nine checks), the vars/bindings non-inheritance rule and its structural recurrence guard, the documented secret mechanism. Also records the two production findings (no DNS, never deployed) and the two "Outstanding" items | YES |
| REQ-143 | free_and_reconciled | 2026-08-15 | Lands the D1 migration into the migrate hook — the seam only; behaviour owned by CAP-101 | YES (adjacent) |
| REQ-145 | free_and_reconciled | 2026-08-15 | `1c assets` must run before the typecheck (the Worker imports uncommitted generator output; a committed copy would be a second definition site); introduces `ACCESS_DEV_OPEN` and requires it **absent** from `[env.production.vars]` — the one stated exception to the repetition rule | YES |
| REQ-146 | free_and_reconciled | 2026-08-15 | Lands the model key into the secrets hook — the seam only; behaviour owned by CAP-90. With REQ-145, the runtime relocation that makes the builder origin stop being a laptop | YES (adjacent) |
| REQ-147 | free_and_reconciled | 2026-08-15 | Adds `--control-origin` / `--workers-dev-origin` to smoke (checks ten and eleven, line 76); `workers_dev = false` restated for production (line 72); explicitly widens the smoke pass criterion so the two new checks *skip* against a public-site origin, "which the assertion now names rather than forbids" (line 128) | YES |
| REQ-149 | free_and_reconciled | 2026-08-17 | AC12: no module reachable from a Worker entrypoint imports a node-only module, **including through a type-only import** — a `bin/build` failure the runtime-import guard could not see (lines 358-396). ACs 13-16: the secret hook's decision table (owned by CAP-90, AC-1410). Records the live-store probe (lines 474-476) | YES |
| BUG-36 | free_and_reconciled | 2026-08-23 | Fresh-deployment tenant registration, fixed in `apps/control-app/src/store.ts` (cold-path `createTenant`) — **not** in `bin/deploy`, so it lands no behaviour on this capability's surface. Records production state empirically: deployed D1 read with `wrangler d1 execute … --remote`, `GET /api/sites` → `302` to the Access login page | YES |
| BUG-37 | free_and_reconciled | 2026-08-24 | Unsampled `[observability]` at the top level **and** under `[env.production]`, placed after that environment's bare keys so the route survives the table header. Diagnosed from a live Error 1102 | YES |
| BUG-38 | free_and_reconciled | 2026-08-24 | Builder chat turn failure — assistant surface, nothing on this capability | YES (no ask here) |
| REQ-154 | bundled (BUNDLE-22 free_and_reconciled) | 2026-08-20 | `BROWSER` binding, declared top level and repeated under `[env.production]`; no build, deploy or smoke ask | imminent |
| REQ-162 | free_and_reconciled | 2026-08-31 | `BLOBS` binding, declared in both wrangler halves; the material store's shared component reaches the preflight's component list. No new build/deploy/smoke behaviour | YES |

Retired / not counted: none. No intent in this ledger has retired a behaviour STORY-119 describes.
REQ-155 through REQ-166 are `draft` and do not count; none of them touches build, deploy or smoke.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-102 (capability body) | REQ-144 | aligned — the CAP-82 boundary it draws (a *site's* rendered snapshot vs the platform's own Workers) matches how the two trees actually divide |
| STORY-119 — build half (four stages, assets-before-typecheck, production-environment bundle, type-program refusal) | REQ-144, REQ-145, REQ-149 | aligned. Re-verified against `bin/build`: `step "Preflight"` (l.88), `step "Control-app assets"` (l.98), `step "Typecheck and package builds"` (l.101), `step "Bundle …"` (l.106) with `--env production --dry-run --outdir dist` (l.112), `step "Artifacts"` (l.115); exit 6 reserved for the preflight (l.36) |
| STORY-119 — deploy half (rehearsal as target, hook contract, discovery, target refusal) | REQ-144 | aligned. `bin/deploy` composes one command line and appends `--dry-run` (l.187-191), runs executable-only hooks in sorted order before the upload (l.159), passes all six `DEPLOY_*` variables (l.162-167), and discovers apps by `find apps … -name wrangler.toml … | sort` (l.111) |
| STORY-119 — smoke half (eleven checks, skip vocabulary, per-axis selection) | REQ-144, REQ-147 | aligned. `tools/generate/bin/smoke.mjs` defines exactly eleven checks — nine public (l.175-273) plus `control_app_challenges_unauthenticated` (l.345) and `control_app_workers_dev_closed` (l.374), each skipped **by name** when its own option is absent (l.370, l.392); the summary counts skips (l.467-469) and names failures (l.472) |
| STORY-119 — configuration rule (AC-1341) and its one exception | REQ-144, REQ-145, REQ-147, BUG-37, REQ-154, REQ-162 | aligned, and holding open as designed. `apps/control-app/wrangler.toml` repeats `TENANT_ID` / `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD`, `ASSETS`, `DB`, `SITES`, `BLOBS` and `BROWSER` under `[env.production]`, and declares `ACCESS_DEV_OPEN = "1"` at the top level only (l.104, absent from l.209-212) — the one stated exception, holding. REQ-154's and REQ-162's new bindings were absorbed with no story or AC edit |
| STORY-119 — retention (AC-1454, AC-1455) | BUG-37 | aligned. `[observability]` at l.35-37 and `[env.production.observability]` at l.197-199, both `head_sampling_rate = 1`, the latter placed after `routes` with the table-header hazard written into the comment |
| STORY-119 — Technical Context, deployment-state narrative | REQ-144 (as history), BUG-36, BUG-37, REQ-145/REQ-146 | **repaired since attempt 1.** The two findings are now scoped to "at REQ-144's reconciliation" (l.193-201) and followed by an explicit supersession paragraph (l.203-211). One residual label — see finding 1 |
| STORY-119 — Technical Context, secret mechanism | REQ-144 (as history), REQ-149 | **repaired since attempt 1.** Now records the live-account probe and keeps AC-1342 written about the observable-from-the-repository property (l.219-228) |
| STORY-119 — In scope (10 bullets) vs the 18 ACs | all of the above | complete in both directions: every in-scope bullet has at least one AC (preflight→AC-1330; assets-before-typecheck→AC-1427; discovery+production bundle→AC-1331; type-program→AC-1426; deploy targets→AC-1332/AC-1335; hooks→AC-1333/AC-1334; the eleven checks→AC-1336/AC-1337/AC-1338/AC-1339/AC-1340/AC-1425; repetition rule→AC-1341; retention→AC-1454/AC-1455; secrets→AC-1342) and every AC maps to an in-scope bullet. No orphans either way |
| Boundary: the two control-surface checks here vs the gate's behaviour in CAP-103 | REQ-147 | clean, and stated from both sides. STORY-119 delegates the platform-default-hostname repeat to "the criterion that owns it"; AC-1382 (STORY-182e8cb9) owns it and asserts both declarations plus the surviving production route |
| Boundary: secret *hook* behaviour deferred to CAP-90 | REQ-146, REQ-149 | clean. REQ-149 ACs 13-16 are picked up by CAP-90's AC-1410, not dropped |
| Boundary: BUG-36's tenant fix | BUG-36 | clean. The fix is in the Worker's own bootstrap (`store.ts`), which BUG-36 chose over a seeding deploy hook — so nothing on this story's surface changed and no AC is owed here |
| Boundary: the two preflights | REQ-44, REQ-144 | clean. `tools/generate/src/cli/preflight.ts` (REQ-44, "is this tree installed at its lockfile?") and `shared-store.ts` (REQ-144) are separate checks with separate CLI help sections, exactly as the story's Technical Context describes |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-119 (story-d5167ced), **Technical Context** → the section labelled "A residual honest failure, recorded rather than absorbed" | story-body-edit | The bold label asserts a *residual* failure, and the clause immediately after it says the opposite: "the runtime relocation that makes it actually serve is owned elsewhere **and has since happened**." REQ-145 and REQ-146 — the two intents REQ-144 named as the point at which "the origin only stops being a laptop" (REQ-144 lines 18-21) — are both `free_and_reconciled`, so nothing is residual. This is the last piece of the pre-repair narrative that attempt 1 corrected around rather than through: a reader who stops at the bold label takes away a standing open failure, which is the same failure mode as REPORT-3663's findings 1 and 2 | Retitle the section so the label agrees with its own text — e.g. "**The honest failure this fix left behind, and where it was closed.**" — keeping both sentences as they are. No AC is affected: every criterion here is written about a supplied origin or the parsed configuration |
| 2 | info | consistency | STORY-119, **Out of scope** bullet 1, and Technical Context ¶2-4 | — | REPORT-3663's three violations/warnings are resolved, and each replacement fact was checked against its source rather than the fix report: `ACCESS.md:130-141` records the `bin/smoke --control-origin https://app.1stcontact.io` invocation; BUG-36:86 the remote D1 read; BUG-36:126-127 the `302` to `…/cdn-cgi/access/login/…`; BUG-37:4 Error 1102; REQ-149:474-476 the probe with `ANTHROPIC_API_KEY` unset. None of the retired premises (`has never been deployed`, `does not resolve at all`, `not against production`, `Outstanding at reconciliation time`, `has not been proved end-to-end`) survives anywhere in the body | none |
| 3 | info | coverage | REQ-154 (`BROWSER`), REQ-162 (`BLOBS`) | — | Both landed top-level bindings on the operator surface after STORY-119's last content pass, and both are repeated under `[env.production]`. AC-1341's universal, structurally-identified form absorbs them with no story or AC edit — the decision REQ-144 made against a hardcoded list of block kinds, working as intended for the second and third time | none |
| 4 | info | exclusivity | AC-1341 (here) vs AC-1398 (STORY-121), AC-1490 (STORY-127), AC-1382 (STORY-182e8cb9) | — | Four criteria now say something about declarations appearing in both halves of a Worker's configuration, but no two say the same thing: AC-1341 asserts **presence** universally and structurally; AC-1398 and AC-1490 additionally assert their own binding **names the same target** in each half; AC-1382 asserts a specific setting is **disabled** in both and that the production route survives. Additive, not overlapping. At story level this capability has a single story, so intra-capability exclusivity is vacuous | none |
| 5 | info | — | STORY-119 `updated_by` | — | The field holds only `bundle-78f4e2fe` (BUNDLE-21), while the story's own Reconciliation Decisions record a 2026-08-31 pass over BUNDLE-20 (REQ-145 / REQ-147 / REQ-149). The field is single-valued, so this is a provenance-recording limitation rather than drift; the decisions section is what carries the second bundle. Recorded so a future check reconstructs the same ledger instead of a narrower one | none |

## Notes for the Editor

**Finding 1 is a label, not a fact, and it is the only thing standing between this level and a
clean pass on substance.** Everything the paragraph *says* is true and worth keeping; only the
five words in bold are stale. Resist the pull to also re-point anything at production while in
there — every AC in this story is deliberately written about a **supplied** origin or the
**parsed** configuration, and that is precisely why the deployment state moving twice (never
deployed → deployed and gated → Error 1102 → serving) has cost this story no criterion changes.

**Two intents are absorbed by design and should not generate findings later.** REQ-154's
`BROWSER` and REQ-162's `BLOBS` are covered by AC-1341's universal form. If a future check sees a
new top-level binding and looks for a matching AC, the answer is AC-1341 and the answer is
correct — that generality is the criterion's whole point, and Reconciliation Decision 6 is what
keeps it safe (non-binding blocks such as `[observability]` must stay invisible to the structural
scan, which AC-1455 pins).

**Verified against the tree, not taken on the story's word**, so a later check need not repeat it:
`bin/build` runs four stages in the stated order with exit 6 reserved for the preflight;
`bin/deploy` implements the hook contract including all six `DEPLOY_*` variables, sorted
executable-only discovery, and one composed command line; `tools/generate/bin/smoke.mjs` defines
exactly eleven checks, skips the two control-surface ones by name when their options are absent,
and counts skips in the summary; `apps/control-app/wrangler.toml` repeats every var and binding
under `[env.production]`, keeps `ACCESS_DEV_OPEN` top-level only, and places
`[env.production.observability]` after `routes`.

**One cosmetic mismatch, outside this check's remit and deliberately not counted** (unchanged from
attempt 1): `bin/build`'s header comment says "Three stages, in this order and for this reason:"
and then enumerates four. The story says four and the script does four, so the story is right and
the comment's count is stale. It is a code comment, not matrix drift — worth a one-word fix
whenever that file is next touched.
