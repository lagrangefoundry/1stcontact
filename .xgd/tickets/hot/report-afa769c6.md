---
uid: report-afa769c6
id: REPORT-2363
type: report
title: 'Capability-Intent Alignment: 1c Capture & Diff Fidelity (level=story)'
created_by: xgd
created_at: '2026-08-20T04:23:25.673209+00:00'
updated_at: '2026-08-20T04:23:25.673209+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-aa030c83
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Capture & Diff Fidelity
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Attempt 11. **Attempt 10's repair is verified landed and correct, and it closed
both halves of the recurring finding** — the violation (`--assign` unregistered)
and the warning that caused it to recur (evidence pinned the registry to itself).
`BOOLEAN_FLAGS` now has 14 members including `assign`, and the new derived-set
UAT makes completeness a standing test result rather than a claim. I re-derived
the boolean set independently rather than trusting the report, and the suite is
green. Coverage was re-checked as a delta and nothing has reconciled into this
capability's scope.

The one new observation is an **imminent-intent retirement** that every prior
ledger classified out of scope for the wrong reason (info 2), plus a residual
narrowing in the new evidence (warning 1). Neither blocks this level.

## Cumulative Intent Considered

The bundled ledger is carried forward from report-cb71281a (attempt 9), which
rebuilt it from scratch, and report-f9f7075d (attempt 10), which re-ran the
delta. This attempt I re-ran the delta again — every `request`, `bug` and
`bundle` in the store, ordered by `updated_at` — and additionally re-read the
two tickets whose *status* is the thing that matters (REQ-150, REQ-148) plus
BUNDLE-19's full member list, which has changed since attempt 10's ledger.

### Bundled intents (carried forward, unchanged)

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUNDLE-1…5 | — | free_and_reconciled | 2026-06-30 … 07-13 | REQ-12/13 capture+shot, REQ-31 values-diff loop, REQ-35 tolerances, REQ-38 pixel diff, REQ-47/48 fidelity gate, REQ-51/53 object-grouped + exact-by-default | pre-matrix-genesis (contiguous unreferenced prefix, no interior hole) |
| BUNDLE-6 (REQ-58/59/61/62) | bundle-ab9e0cb6 | free_and_reconciled | 2026-07-17 | Viewport ladder; boolean-flag parse; `--json` stdout hygiene; gradient stop positions; panel surface gradients; `--size`; `responsive-diff` | YES — origin intent of STORY-75/76/77/78/79 |
| BUNDLE-7 (REQ-63 + REQ-79 + REQ-82…86) | bundle-31e474b9 | free_and_reconciled | 2026-07-22 | Coverage audit; fontLoad false-positive fix; `aligned-crops --sandbox` propagation | YES |
| BUNDLE-8 (BUG-7 + REQ-89…92 + 5 more) | bundle-cceaba25 | free_and_reconciled | 2026-07-29 | Pages-directory warning suppressed at source; Astro-free render path; painted-marker precondition | YES |
| BUNDLE-10 (BUG-12…25, REQ-88, REQ-93) | bundle-4ff83a8b | free_and_reconciled | 2026-07-29 | BUG-15/16/22/24/25 capture-spine members | YES — repaired attempt 7; re-verified in STORY-75 `updated_by` this attempt |
| BUNDLE-11 (BUG-27 + REQ-94 + REQ-96 + 12 more) | bundle-ee56a66e | free_and_reconciled | 2026-08-05 | Painted band extent, document-wide backdrops, background-image axis, module-invariant exclusion | YES |
| BUNDLE-16 (REQ-117 + REQ-115 + REQ-44) | bundle-15c1f647 | free_and_reconciled | 2026-08-07 | Install preflight at dispatch | YES |
| BUNDLE-13, BUNDLE-14, BUNDLE-17, BUNDLE-18 | — | free_and_reconciled | 2026-08-06 … 08-13 | control-app, builder, palette, deploy sandbox | YES (no CAP-63 ask) |
| BUNDLE-19 (9 members, enumerated below) | bundle-77b28def | **reconciling** | 2026-08-18 | Palette popup, copy modal, draft journal, editor colour/locks, KB, workerd test project, deploy scripts, async SiteStore | imminent — **no CAP-63-scope member** (info 3) |
| BUNDLE-12, BUNDLE-15 | bundle-0e41ff44, bundle-7985e0d1 | abandoned | 2026-08-06 | superseded duplicates | NO |

### Unbundled intents — attribution re-verified from story fields this attempt

| Intent ID | UID | Status | Asked | In CAP-63 scope? |
|---|---|---|---|---|
| REQ-64 | request-07d0e3e1 | free_and_reconciled | Noise audit, `--collapse`, Type-A/B repair order | YES — STORY-116 `intent_uid` ✅ (read from fields) |
| REQ-76 | request-3a11304d | free_and_reconciled | `--clusters` ranked causes + dispositions | YES — STORY-116 `updated_by` ✅ |
| REQ-72 | request-0698bbdf | free_and_reconciled | In-browser hexification of gradient stop colours | YES — STORY-76 `updated_by` ✅ |
| REQ-73 | request-859652ae | free_and_reconciled | Adjacent-gap axis + band-padding retirement | YES — STORY-75 `updated_by` ✅ |
| REQ-66 | request-b94426f4 | free_and_reconciled | `adopt-values` Type-A copy | Correctly absent — retired; STORY-84 records the supersession |
| REQ-74, REQ-78 | request-69ca5755, request-6ae3512a | free_and_reconciled | `adopt-gaps` repair-writing; `aligned-crops` verb meaning | NO — repair-writing / verb meaning, per the CLI ownership rule |
| BUG-5 | bug-5b7153d2 | free_and_reconciled | Text-leaf pairing in `sampleFidelityProbe` | NO — scoped under REQ-88 → CAP-71. **Re-verified unstoried** (info 4) |
| **REQ-148** | request-7ae3c2cc | **ready_to_reconcile** | Behavior modules render in workerd; Astro leaves the render path | Its *new* behavior is another capability's, but it **retires** STORY-79 §4 / AC-739 — see info 2 |
| **REQ-150** | request-34dd9049 | **free_coding** (re-read, unchanged) | Boot a plain Vite SSR server, not Astro's | Would retire STORY-79 §4 + §2's bootstrap clause. `free_coding` is neither reconciled nor `ready_to_reconcile` → **does NOT count** |
| REQ-143, 145, 146, 147 | — | ready_to_reconcile | Cloudflare SiteStore, workerd builder/AI host, Access | NO — other capabilities |
| REQ-149 | request-554ac441 | draft | Cloud publish: revisions, history | NO — not active, other capability |
| BUG-33, BUG-34 | bug-ede1fb8c, bug-13082cb4 | free_and_reconciled | Builder chrome suites; copy-modal gradient preview | NO — builder/control-app capability |

**Nothing new is in CAP-63 scope.** The most recent intent touching this
capability's declared surface remains BUNDLE-16 (2026-08-07) plus the four
unbundled requests already carried. Coverage at story level is clean.

## Alignment Ledger

| Element | Kind | Intents aligned to | Outcome |
|---|---|---|---|
| STORY-75 (capture blind spots) | upgrade | bundle-ab9e0cb6; updated_by bundle-31e474b9, bundle-cceaba25, bundle-4ff83a8b, bundle-ee56a66e, request-859652ae | **aligned** — BUNDLE-10 and REQ-73 attribution present in `updated_by`; body scanned clean of all seven stale capability tokens |
| STORY-76 (gradients first-class) | feature | bundle-ab9e0cb6 (REQ-59 + REQ-62); updated_by request-0698bbdf | **aligned** — REQ-72 carried; body clean of stale tokens |
| STORY-77 (size-aware diffing) | feature | bundle-ab9e0cb6 (REQ-61) | **aligned** — body clean |
| STORY-78 (responsive-diff N-way) | feature | bundle-ab9e0cb6 (REQ-61) | **aligned** — body clean; attempt 9's CAP-65 miscitation stays fixed |
| STORY-79 (1c CLI correctness) | upgrade | bundle-ab9e0cb6; updated_by bundle-31e474b9, bundle-cceaba25, bundle-15c1f647 | **aligned** — §1 now names `colors --assign <slug>` among the fault's verb instances and asserts the derived-from-source discipline; Technical Context records both drift episodes and no longer claims a point-in-time count. §4 remains accurate against today's tree but is on a retirement clock (info 2) |
| STORY-116 (noise management / report surface) | feature | request-07d0e3e1 (REQ-64); updated_by request-3a11304d (REQ-76) | **aligned** — carried forward from attempt 10; body clean of stale tokens; five ACs present |
| capability-aa030c83 | — | — | Body reads current (9959 chars, both repair paragraphs present). Scope's five bullets each map to exactly one story (§1→STORY-75, §2→STORY-76, §3→STORY-116, §4→STORY-77/78, §5→STORY-79). Scope §5's CLI-wide boolean claim is now true in code and enforced by a test |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | `tests/req58-multi-viewport.test.ts:96` (`CLI_SOURCES`) | `uat-edit` | The derivation that closed attempt 10's warning reads its input from a **hand-maintained one-element literal**: `const CLI_SOURCES = ['../tools/generate/src/cli/index.ts']`. The derived set is therefore only as complete as that list, so a boolean flag read from a *new* file under `tools/generate/src/cli/` is invisible to the UAT and reopens the same hole one level up. This is the same failure shape the derivation was introduced to eliminate — a manually-kept list believed complete — which is what makes it worth recording rather than accepting. Exposure is low today: a binary-safe `grep -ran "flags\."` over `tools/generate/src` (binary-safe because several files in this repo carry NUL bytes and are skipped by a plain grep) returns exactly `cli/index.ts` and `cli/args.ts`, and the story's own §1 does not overclaim — it says the set is derived from the CLI source, which it is | Replace the literal with a directory read over `tools/generate/src/cli/*.ts`. Verified safe to widen: adding `args.ts` changes nothing, because its only writes are `flags[name] = true` — a computed, unquoted subscript that the read regex (`flags(?:\.name\|\['name'\])`) does not match |
| 2 | info | consistency | STORY-79 §4 + AC-739 (`acceptance_criterion-fcf814b5`) vs REQ-148 (`request-7ae3c2cc`) | — | **An imminent intent retires a behavior this capability describes, and three ledgers have missed it.** REQ-148 is `ready_to_reconcile` (imminent → counts YES per the status table) and its §2 deletion table explicitly removes `astroContainer()`, `RenderSiteOptions.createContainer`, `renderSiteFilesNode`, and **"the `needsAstro` branch in `renderSiteFiles`"** — stating "there is one render path". That is precisely what STORY-79 §4 and AC-739 assert conditionally ("An Astro container is constructed only for pages that carry behavior modules"; "A site with at least one behavior-module page creates the container on demand"). Attempt 10 dismissed REQ-148 as "NO — other capabilities", which is correct about who owns its *new* behavior but does not reach its *retiring* effect, and a retirement lands in the capability owning the retired behavior regardless of where the replacement is owned. **Not a violation this cycle**: the code has not landed — `tools/generate/src/render/render.ts:264` still reads `const needsAstro = site.pages.some((p) => p.modules.length > 0)` with the `if (needsAstro)` branch at `:266`, and both `.astro` sources (`packages/framework/src/modules/{contact-form,carousel}/index.astro`) are still present — so §4 and AC-739 are accurate against today's tree, and the status table treats imminent intents as live *but not yet enforced*. Editing the story now to describe code that does not exist would itself be drift | No edit now. When REQ-148 reconciles, STORY-79 §4 becomes unconditional ("the render path is Astro-free", no on-demand container) and AC-739 needs `ac-deprecate` or a rewrite. REQ-150 (`free_coding`, depends on REQ-148) compounds it and would additionally retire §2's bootstrap clause — re-check both together |
| 3 | info | — | `cli/args.ts`, `tests/req58-multi-viewport.test.ts`, STORY-79, AC-1290 | — | **Attempt 10 verified resolved, independently.** (a) `'assign'` is registered at `args.ts:41`; the registry is 14 members. (b) I re-derived the boolean set from scratch rather than trusting the report: all 35 distinct `flags.*` / `flags['*']` names in `cli/index.ts`, classified by consumption — exactly 14 are read in boolean context (`sandbox force json tolerant compare-years multi-viewport classify collapse clusters edit dry-run prune apply assign`) and the other 21 are `typeof`-guarded or parser-fed. Derived set == registry. (c) Cross-checked from the *other* direction too: every flag documented in `--help` without a value placeholder is registered, so there is no bare-toggle left unregistered. (d) `vitest run tests/req58-multi-viewport.test.ts` → **20 passed, 2 skipped, 0 failed** (the 2 skips are the Chromium-gated tests; no browser in this environment). (e) The new UAT is load-bearing by construction: it asserts set *equality*, so unregistering a flag whose boolean read remains leaves the derived set larger and the assert fails. (f) STORY-79 §1 + Technical Context carry the revised discipline; AC-1290 (`acceptance_criterion-cf26bae1`) states it, is `uat_coverage: pass`, and does not duplicate AC-656 (which is the per-flag positional guarantee, a different criterion). `pending` status on AC-1290 is normal — all 7 pending ACs in the store were created 2026-08-20 by the same fix cycles | none |
| 4 | info | — | BUG-5 (`bug-5b7153d2`), BUNDLE-19 (`bundle-77b28def`) | — | BUG-5 **re-verified unstoried this attempt**, not carried on assertion: `xgd ticket list --type story --filter "fields.intent_uid=bug-5b7153d2"` and the same on `fields.updated_by` both return empty across all 31 stories. Its body scopes it under REQ-88, the fold/gate pipeline this capability puts out of scope → CAP-71. BUNDLE-19's membership has grown since attempt 10's ledger and is now enumerable from its body: REQ-133, BUG-35, REQ-131, REQ-140, REQ-139, REQ-123, REQ-141, REQ-144, REQ-142. I read each title and checked REQ-144 (deploy/build scripts + the `[vars]` inheritance bug) and REQ-142 (async SiteStore port) specifically, as the two with any plausible CLI adjacency — both are verb *meaning* / store internals, not dispatcher mechanism. **No CAP-63-scope member**; the in-flight reconcile should still attribute the bundle somewhere | File BUG-5 against CAP-71; no CAP-63 edit |

## Notes for the Editor

**This level passes; there is nothing an editor must change.** Warning 1 is
opportunistic and is a two-line test edit with the safety of widening already
verified. Info 2 is a scheduled re-check, not work.

**On the recurrence that is now closed.** The `--assign` finding survived two
attempts because each sweep was a grep for one read form. Attempt 10 replaced
the sweep with a test, and that is the right shape — I confirmed it by
re-deriving the set by a third method (classify every `flags.*` read by how it
is consumed) and by a fourth (cross-check `--help` bare toggles against the
registry). All three methods agree on the same 14 names. The class of drift that
produced this finding is now caught by CI rather than by an assessor's grep, so
it should not return.

**On info 2, which is the one thing worth carrying forward.** The ledger has a
systematic blind spot: an intent is classified in/out of CAP-63 scope by *who
owns the behavior it adds*, and that test silently misses an intent that adds
behavior elsewhere while **deleting** behavior a CAP-63 story describes. REQ-148
is exactly that shape. When re-running this check, the scope question should be
asked twice — "does this intent add anything this capability owns?" and "does
this intent remove anything this capability's stories currently assert?" — since
only the first has been asked so far.

**Still outstanding matrix-wide, unchanged**: the unbundled-intent sweep has been
run for CAP-63 only. REQ-67/68/70/71/75/77/87 (CAP-70) and BUG-5 / REQ-74 /
REQ-78 (CAP-71) remain reconciled, unbundled, and referenced by no story
anywhere. That remains the highest-yield next move matrix-wide, and it is out of
scope here.
