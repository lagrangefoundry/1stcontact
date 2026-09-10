---
uid: report-c57d06bc
id: REPORT-3739
type: report
title: 'UAT Coverage: Framework Substrate: L1 Layout, Values & Behavior Modules'
created_by: xgd
created_at: '2026-09-10T13:57:11.018425+00:00'
updated_at: '2026-09-10T13:57:11.018425+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ae9d65d6
  violations: 0
  warnings: 6
  needs_review_count: 0
---

# UAT Coverage Assessment: Framework Substrate: L1 Layout, Values & Behavior Modules

**Result**: PASS
**AC verdicts**: 108 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 7 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Anchor report: report-e37a6b4a · Capability: capability-ae9d65d6 (CAP-70) · Previous attempts: 7

Scope: **7 stories**, **108 live ACs** (44 STORY-83, 20 STORY-85, 19 STORY-90,
10 STORY-91, 7 STORY-80, 6 STORY-81, 2 STORY-82). The AC set did not move since
REPORT-705e0a60 — no AC added, deprecated, or retired this cycle.

## Headline: the last three violations are closed, and this is the first clean cycle

REPORT-705e0a60 (attempt 7) left exactly three violations, all the same act on the
same file: rename four `test_UAT_FC_REQ-93_*` definitions in
`tests/req93-l1-slot-mounted-behaviors.test.ts` and add the missing arms. The fix
pass (REPORT-3738) did it. **Verified independently, not taken on report:**

| Prior finding | State now | Evidence I checked |
|---|---|---|
| **F1** AC-1622 had no `test_UAT_AC1622_*` | **closed** | `:543` `test_UAT_AC1622_mounted_fragment_replaces_the_inert_placeholder`. Real `renderL1Document`, both states. The four added assertions are the ones asked for and they are not vacuous: fragment **inside** `data-l1-slot="form-0"`'s own element (`:559-561`); seam opening tag byte-identical mounted vs unmounted; the seam's own rule identical **with an explicit non-empty guard** (`:567`) so the comparison cannot pass on two empty strings; whole stylesheet identical. **Runs and passes here.** |
| **F2** AC-1623 had no `test_UAT_AC1623_*` | **closed** | `:324` and `:348`. The five-rejection arm is table-driven against real `validateSite`, each case asserting both the message **and** a machine-readable path (`pages/0/modules/0/slot` etc.). The two added accept-cases are the criterion's two legal states — the starter page, and the **orphan seam** (`docWithSlot('unbound')`, no module binding it) — which is what makes the rule one-directional. **Both run and pass here.** |
| **F3** AC-1624 had no `test_UAT_AC1624_*` | **closed as authored**, but see Warning 1 | `:625`, `:651`, `:694`, `:725` — four arms covering the Verification's four clauses. Content is substantive at real entry points. Only `:651` **executes in this sandbox**; see below. |
| **W4** three ACs stuck `status: pending` | **closed** | All 108 ACs now read `status: active`. |

**Full sweep, not a spot-check.** I re-derived the AC→test map for all 108 ACs by
scanning `tests/` directly (the index is still empty — Warning 4). **Every one of
the 108 resolves to at least one `test_UAT_AC<n>_*` definition; zero missing.** That
is the first time this capability has had no naming gap.

## Execution — I ran every test file carrying an AC of this capability

23 files carry the 108 ACs. I ran **all 23**. Aggregate: **~112 passed, 4 failed,
8 skipped**, plus one file that cannot start.

**Every one of the 4 failures is the same sandbox limitation. There is not a single
assertion failure anywhere in this capability.** All four are `listen EPERM:
operation not permitted` — the sandbox forbids binding a port:

| AC | File | Shape |
|---|---|---|
| AC-703 | `reconciliation-behavior-modules.test.ts` | via `serveOneModulePage` (`conformance/harness.ts:201`) |
| AC-888 | `reconciliation-l1-relocatable-output.test.ts:169` | binds its own server |
| AC-1624 arm 1 | `req93-…:625` | via `serveOneModulePage` |
| AC-1624 arm 3 | `req93-…:694` | via `reportedAcs` → `assertModuleConforms` → `serveOneModulePage` |

Plus `reconciliation-behavior-edge-runtime.workers.test.ts` (AC-1412, AC-1413),
which **cannot start at all** — miniflare dies on `listen EPERM 127.0.0.1`.

The 8 skips are the honest `it.runIf(HAVE_CHROMIUM)` gates working as REPORT-705e0a60's
Finding 5 and Warning 8 asked (AC-683, AC-688, AC-1009, AC-1011, AC-1012, AC-1624
arm 4, and two more) — reported as *skipped*, not as a silent pass.

**Two corrections to the record**, both material for the next cycle:

1. **REPORT-3738 claimed the EPERM gate "did not reproduce — in this run it binds."
   It reproduces here.** The gate is environment-variant between runs on the same
   machine. Verdicts in this capability must not be driven by which side of that
   coin a given run lands on, or the loop will oscillate forever.
2. **The EPERM class is wider than Warning 5 recorded** — 5 ACs and a whole file,
   not 2. And REPORT-705e0a60's proposed remedy needs amending: the workers file
   binds `127.0.0.1` and is **still** denied, so "bind loopback instead of 0.0.0.0"
   would not help. Only a genuinely in-process handler would.

None of this is a coverage defect or a code defect, and it is not a verdict-changer:
the tests are substantive at real entry points, and per the rubric `fail` means
missing / trivial / over-mocked / structural. None of those apply. This follows the
precedent REPORT-705e0a60 set for AC-703 and keeps the assessment deterministic in
the code rather than in the sandbox. **The fix loop must not chase these.**

## Cumulative Intent Considered

Re-derived this cycle. **The ledger is unchanged from REPORT-705e0a60** — no intent
touching this capability changed status, and no new intent landed since 2026-08-31.
Rows through REQ-137 are compressed; nothing in them moved.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (REQ-58/59/61/62) | free_and_reconciled | 2026-07-17 | Pre-pivot capture/diff value work; original home of STORY-80/81/82 | YES |
| BUNDLE-7 (REQ-79/82/84/85) | free_and_reconciled | 2026-07-22 | **The pivot.** L1 typed substrate + envelope + sole renderer; deletes semantic layout modules and their ~20 dials | YES (retires module dials) |
| REQ-87 (`request-84af044b`) | free_and_reconciled | 2026-07-21 | `capability module` → **behavior module**, no alias | YES |
| REQ-93 (`request-f26cbe32`) | free_and_reconciled | 2026-07-25 | Page-level slot binding + five rejections, renderer mount, `mountInL1`, `fields[].labelMode` | **YES — fully claimed by the matrix as of this cycle** |
| BUNDLE-8 (REQ-90/91) | free_and_reconciled | 2026-07-29 | Resource table + `@font-face`; captured pixel-mover axes | YES |
| BUNDLE-11 (REQ-96/97/98/103…107) | free_and_reconciled | 2026-08-05 | `control` leaf; `intro`/`submit` → one required `form` slot; shared axis groups; per-width layout track | YES (retires the two slots) |
| BUNDLE-13 (REQ-99/100/108…111, BUG-28/30) | free_and_reconciled | 2026-08-06 | Interaction state, scroll reveal, pointer accent, safety floor; relocatable URLs | YES |
| BUNDLE-14 (REQ-114/116) | free_and_reconciled | 2026-08-06 | Deletes the closed colour-role vocabulary; edit-channel carve-out | YES |
| BUNDLE-16 (REQ-115/117) | free_and_reconciled | 2026-08-07 | Navigation/link role; nowrap width floor | YES |
| REQ-136 (`request-8a132869`) | free_and_reconciled | 2026-08-12 | Non-destructive image framing + typed colour adjustment + typed shape | YES |
| REQ-137 (`request-d2980a95`, BUNDLE-18) | free_and_reconciled | reconciled 2026-08-17 | Deletes palette `steps`; continuous Oklab `shade` on the reference | YES |
| REQ-148 (`request-7ae3c2cc`, BUNDLE-20) | free_and_reconciled | 2026-08-31 | Behavior modules render in workerd; contact-form precompiled to props-to-markup | YES |
| REQ-151 / REQ-152 / REQ-153 | free_and_reconciled | 2026-08-20 | Locale identity → `lang`/`dir`; money/time seam; reserved slugs | YES, but **claimed outside this capability** (AC-1428…1433) — boundary re-confirmed |
| REQ-154 (BUNDLE-22) | **bundled** (was free_and_reconciled) | 2026-08-20 | Browser Rendering driver behind the headless-browser port | imminent — capture capability, not this one |
| REQ-162 | free_and_reconciled | 2026-08-31 | Product ticket store: D1 schema, TypePack | YES, but a different capability entirely |
| REQ-155…161, 163…166 | `draft` | 2026-08-20 … 08-31 | Capture in workerd, image layer, KB work, Library tab | NO (not yet active) |

**No intent retired anything this cycle**, so no AC was a deprecation candidate and
`deprecated` count is 0.

## Alignment Ledger

Story bodies were re-read against the ledger. REPORT-705e0a60 closed the last
staleness (STORY-82, stale for five cycles); the fix pass touched only tests, AC
fields and three additive test-infra exports, so no body could have regressed — and
I confirmed the load-bearing sections are still present rather than assuming it.

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-80 Absolute values re-homed in L1 | BUNDLE-6 → REQ-114 → REQ-137 | aligned | 7/7 ACs substantive; all green |
| STORY-81 Responsive layout track | BUNDLE-6 → REQ-104 | aligned | 6/6 ACs substantive; all green |
| STORY-82 Reproduction treatments | BUNDLE-7 → REQ-87, REQ-93, REQ-96 | aligned | 2/2 green. Its single `capability module` occurrence is the deliberate REQ-87 **vocabulary note** explaining the rename ("with no back-compat alias… this story uses the post-REQ-87 names throughout"), not a stale usage — checked in context |
| STORY-83 L1 layout substrate | BUNDLE-7 → REQ-93, REQ-136 | **aligned, now fully covered** | §"What a `slot` emits: placeholder, or a mounted fragment" present with both trust preconditions; `capability module` count 0; STORY-81 recorded as live. 44/44 ACs pass — AC-1622's gap closed |
| STORY-85 Behavior modules | BUNDLE-7 → REQ-116, REQ-148 | **aligned, now fully covered** | `mountInL1` present ×4; `capability module` count 0; carries a `## Reconciliation Decisions` section. 20/20 ACs pass — AC-1623/1624's gaps closed |
| STORY-90 Interaction / motion / pointer accent | BUNDLE-13 | aligned | 19/19 ACs substantive; all green |
| STORY-91 L1 navigation | REQ-106 / REQ-115 | aligned | 10/10 ACs substantive; all green |

Every behavior either story body describes traces to a reconciled intent. **No story
required the BUG-1306 impact screen this cycle. needs_review_count = 0.**

## Evidence Assessment

Screened all 108 for the four disqualifying shapes:

- **Missing**: none. 108/108 resolve to a `test_UAT_AC<n>_*` definition.
- **Existence-only assertions**: none.
- **Source-text-only (structural) tests**: none.
- **Internal mocking**: exactly one, AC-702's negative arm
  (`reconciliation-behavior-modules.test.ts:561`, `vi.doMock('…/framework/src/worker')`).
  Not a finding — AC-702's body names the substitution as the arm's premise and
  states its retirement condition. Left untouched, as directed. The
  `vi.spyOn(mounted.form, 'getAttribute')` in AC-877/878 fakes a DOM API, an
  external boundary.

The three arms authored this cycle, judged on content:

- **AC-1624 `:651` (clause a)** — the strongest of the three and the one that runs
  everywhere. Pure page data via the newly-exported `oneModulePage`: `l1.widths` and
  the seam's keyframe `at` list both equal `RESPONSIVE_WIDTHS`, and every keyframe
  asserts `x === 0 && width === at`. It then proves mounting only *adds* a position
  by deep-equalling the mounted instance to the standalone one modulo `slot`. This
  turns "the host is deliberately non-interfering" from a comment into a check.
- **AC-1624 `:694` (clause b)** — the headline non-weakening claim, and well built:
  it iterates the harness's own `CONFORMANCE_DIMENSIONS` (asserted to be exactly the
  five) rather than restating the list, and asserts a **named** owed check-id set per
  dimension in both positions. Naming the sets rather than just comparing mounted to
  standalone means a dimension that silently ran nothing, or ran a reduced set of its
  own checks, fails here — a clean-fixture comparison would catch neither. The
  supporting type change (deriving `ConformanceDimension` from an `as const` tuple)
  is what makes a sixth dimension unable to slip past this UAT. **Cannot execute in a
  sandboxed run — Warning 1.**
- **AC-1624 `:725` (clause c)** — chromium-gated, skipped here. Uses the existing
  REQ-41 `fc-mobile-overflow` fixture and pairs the positive (flagged at 320/375)
  with a desktop-only sweep that stays clean, so the flag is attributable to the
  module rather than the seam.

The three test-infrastructure exports the fix added (`oneModulePage`,
`RESPONSIVE_WIDTHS`, `CONFORMANCE_DIMENSIONS`) are additive, follow the precedent
already stated in `harness.ts:152-154` for `serveOneModulePage`, and change no
runtime behaviour. Not a production change in any meaningful sense.

## Findings — Categorized by Editor Action

**Zero violations. Zero blocking needs_review.** All six findings are warnings and
do not affect pass/fail.

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-1624 (`req93-…:694`) | uat-edit | Clause (b) — the criterion's **headline claim** — routes through `reportedAcs` → `assertModuleConforms` → `serveOneModulePage`, so it EPERM-fails in a sandboxed run. REPORT-705e0a60 asked specifically for arms (a) and (b) to be assertable "over `oneModulePage(...)`'s returned object and the dimension list, which need no loopback server", and warned that bundling them behind the server "means AC-1624 is unverifiable in every sandboxed run". Arm (a) got that treatment and runs everywhere; **arm (b) did not**, and the predicted consequence has now occurred: of AC-1624's four arms, only (a) executes here. Not a violation — the evidence is substantive and passes where a port can bind | If sandbox-provable evidence is wanted, split the dimension-set assertion off the served harness: assert the check-ids each dimension *registers* against the harness's own tables in both positions, keeping only the actual defective-fixture run behind the server. This is the single highest-value test edit left in the capability |
| 2 | warning | uat | AC-703, AC-888, AC-1412, AC-1413, AC-1624 (arms 1, 3) | — (environment) | The EPERM class, **wider than Warning 5 recorded**: 5 ACs plus the whole `reconciliation-behavior-edge-runtime.workers.test.ts` file, which cannot even start. Two amendments to the prior record: (i) REPORT-3738 reported the gate "did not reproduce"; it reproduces here, so the gate is run-variant on the same machine; (ii) the workers file binds `127.0.0.1` and is still denied, so the prior "bind loopback" reading of the remedy is wrong | No repair, and **the fix loop must not read these as regressions**. If mounted/served evidence must be provable in a sandboxed run, the ask is an in-process handler in place of a real listener — infrastructure, not an AC or test edit |
| 3 | warning | uat | AC-703, AC-888, AC-1624 (arms 1, 3) | test-infra | The four EPERM tests fail by **timeout**, not fast: 60s + 180s + 60s + 60s ≈ 6 minutes of wall clock burned per full run, and `req93-l1-slot-mounted-behaviors.test.ts` alone takes 241s. Every cycle of this loop has paid this | Have the harness probe bindability once and convert an unbindable environment into an `it.runIf`-style skip, exactly as `HAVE_CHROMIUM` already does. Cheap, and it turns four red timeouts into honest skips |
| 4 | warning | — | `.xgd/uat_index.json` | test-infra | Still `{"acs": {}}` (`updated_at` 2026-09-09T22:50:28Z) — **third consecutive cycle**. The prescribed index lookup returns nothing for all 108 ACs, so every assessor must fall back to scanning `tests/` directly | Rebuild the index. Outside a coverage pass, but it has now cost three cycles of manual scanning and will cost a fourth |
| 5 | warning | ac | AC-1624 | ac-edit | Internal tension in the AC's own text, surfaced honestly by the fixer rather than silently narrowed. The Criterion guarantees a "deliberately non-interfering" host pinning the seam to exactly the viewport at every probed width; the Verification then asks for "a fixture that is clean standalone but overflows its container" once pinned. Given the pinning guarantee, mounted and standalone hand the module the same available width, so that fixture class is **not constructible** against the current harness. The fixer used clean-at-desktop/overflows-at-mobile instead. Low impact — the non-weakening claim is proven more strongly by arm (b) than the suggested fixture would prove it | Reword the Verification to what the Criterion actually admits: the same defect is flagged in the mounted position exactly as standalone. If the stricter class is genuinely intended, it needs a harness option for a *narrower* seam — an infrastructure ask, not an AC edit |
| 6 | warning | uat | AC-702 (`reconciliation-behavior-modules.test.ts:561`) | — (informational) | The one internal mock in 108 UATs survives, declared in AC-702's body as the arm's premise with a stated retirement condition. Positive arm still runs against the real pipeline | No action. Listed only so the retirement condition stays visible and does not quietly become precedent |

## Notes for the Editor

**There is nothing to fix. Do not open a fix pass on this capability.** Result is
PASS with zero violations; the six findings above are warnings, and by the workflow's
own rule warnings do not affect pass/fail. Findings 3 and 4 are test-infrastructure
chores and Finding 5 is a wording tidy — none is a coverage gap, and none should be
converted into one to manufacture work.

**Field writes this cycle: one.** All 108 ACs and all 7 stories already carried the
correct `uat_coverage: pass` from the fix pass; I verified each rather than
re-committing 115 identical values, and wrote only `capability-ae9d65d6`
(`fail` → `pass`). That is the aggregate rule applied: every story passes, so the
capability passes.

**The one thing to protect: do not let the sandbox flip this verdict.** Four of this
capability's tests fail here purely because the sandbox refuses to bind a port, and
REPORT-3738 saw the same tests bind and pass. An assessor who reads `EPERM` as a
coverage failure will drive this capability back to FAIL on attempt 9 and a fix loop
will start "repairing" tests that are already correct. The verdict belongs to the
code, not to the run. If anyone wants that fragility gone rather than annotated,
Finding 3 is the fix and it is small.

**Perspective on the seven attempts.** For five cycles the refrain was "matrix prose
lagging behind code that is already correct and already tested"; REPORT-705e0a60
narrowed that to a rename and seven assertions, and the fix pass executed it. This
capability is now current: bodies match intent, all 108 ACs have named substantive
evidence, and every test that can execute in this environment is green.
