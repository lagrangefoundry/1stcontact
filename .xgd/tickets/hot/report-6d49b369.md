---
uid: report-6d49b369
id: REPORT-2324
type: report
title: 'Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
  (level=uat)'
created_by: xgd
created_at: '2026-08-20T02:43:10.535366+00:00'
updated_at: '2026-08-20T02:43:10.535366+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-a994b8f3
  level: uat
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Builder Workspace: Chrome, Origin & Display Panel
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-2485c83c · Capability: capability-a994b8f3 (CAP-85) ·
Story: story-e674c60a (STORY-99, `story_kind=upgrade`) · Level `uat` ·
Previous attempts: 4

**Supersedes REPORT-2309 (`report-9f5abb58`, 2026-08-20T02:13Z, FAIL 2/1/0).**
The `fix_uat_validation` cycle (REPORT-2316, `report-06d9a4da`, attempt 4,
commit `ded80daa8`) claimed three fixes. All three were **re-verified against
the current source in this run, not taken on the fix report's word** — including
its execution claim, which was reproduced independently (see below).

**Level discipline.** The `ac` level passed at 02:06Z (report-46c342b8, 0/1/0).
AC bodies are the working reference. Confirmed unmoved since: the three ACs
edited this cycle still carry `updated_at` of 2026-08-20T01:54Z and STORY-99's
body 01:54:14Z — the uat fix changed **no ticket body or field**, so the ac-level
verdict above this one is still standing on the text it was issued against.
`git show ded80daa8 --stat` confirms the commit touches exactly two files, both
tests, and the working tree is clean.

## Cumulative Intent Considered

Statuses re-read directly from the ticket store, ordered by `merged_at_commit`
where present, else `created_at`. Unchanged from REPORT-2309 — no intent has
moved in the fifteen minutes between the two.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| BUG-32 | `bug-5cabb340` | merged | created 2026-08-05, merged `125f1dcc` | Component scope rename in lockstep; one definition site; declared browser-source exception; consumption evidence made unconditional. Rewrote AC-960/961/963; the window AC-1030 was authored in | YES |
| REQ-115 + REQ-117 + REQ-44 | `bundle-15c1f647` (BUNDLE-16) | free_and_reconciled | created 2026-08-07, merged `1741ee5d` | REQ-115: the chrome — component consumption, `site` tab, multi-mode panel, mode-declared toolbar, split + persistence, confinement, the Node origin behind a verbatim front. REQ-117: the `/api/copy` transport and **the gesture's client bytes derived from the renderer's own source** (ask (b) — now evidenced, see AC-1240). REQ-44: preflight, expressed elsewhere | YES |
| BUG-33 | `bug-ede1fb8c` | free_and_reconciled | created 2026-08-08, merged `f1664c55` | Toolbar re-derives on mode **and** site; a replaced control is inert by design. Origin of AC-1110, widened AC-970 | YES |
| REQ-119 + REQ-122 + 6 more | `bundle-e59210c5` (BUNDLE-17) | free_and_reconciled | created 2026-08-10, merged `0198704b` | REQ-119: request-time draft-side renders, one implementation behind a writer and a reader, no artifact on disk, invalid draft surfaced, `published` untouched. Origin of AC-1031…AC-1036. REQ-122: the chat panel now filling the secondary pane | YES |

Nothing in the ledger is `abandoned`, `deprecated`, `wont_fix`, `draft` or
`ready_to_implement`; nothing is merely imminent; nothing is retired. The
cumulative picture is purely additive, so every one of the 31 criteria is
expected to be live and evidenced.

## Execution status — reproduced, not accepted

The fix report flagged that two of its three UATs could not be executed on its
machine. That claim was checked rather than believed, because a fix that cannot
run its own evidence is exactly where a false green enters.

| File | Ran here? | Result |
|---|---|---|
| `tests/reconciliation-builder-workspace-chrome.test.ts` | yes | **9 passed / 9**, including the rewritten `test_UAT_AC973_…` |
| `tests/reconciliation-builder-workspace-origin.test.ts` | **no** | aborts in `beforeAll`: `Error: listen EPERM: operation not permitted 0.0.0.0` at `tools/generate/src/cli/builder.ts:623` (`server.listen`), reached from `startBuilder`. A second EPERM on `127.0.0.1` follows from AC-965's own two-Worker probe. 1 failed / 1 passed / 9 skipped |

The EPERM is an **environment restriction of this sandbox, not a defect in the
tests or the origin** — the file binds an ephemeral local port and the sandbox
permits no `listen` on any address. It is also **not new and not confined to
this cycle's work**: eleven CAP-85 UATs live in that file, nine of them
untouched and previously green, and the same block hits all of them. The
component store is installed
(`@lagrangefoundry/webui-{shell,split,fields,chat,markdown}` all present under
`/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry/`), so this is
unrelated to the silent-skip hazard AC-1030 exists to rule out.

**What this means for the verdict.** This check's subject is *alignment* — does
each test exercise what its AC claims — and that is answerable by reading the
test against the criterion, which was done clause by clause below. Whether the
evidence **passes** is the `uat_coverage_check`'s subject, and it must be run
where a local port can be bound. Recorded as info 2 so the downstream coverage
pass does not read this PASS as "the origin suite is green".

## Alignment Ledger

**31 criteria ↔ 38 AC-traceable UAT functions across 8 files.** Every criterion
now carries at least one `test_UAT_AC<n>_*`, verified by enumerating the
identifiers out of `tests/` rather than from `.xgd/uat_index.json`. No test was
lost in the rewrites: the two changed files still declare all 20 of the UAT
names they declared before, plus AC-1240's new one. The mapping is 1:1 except
AC-960 (×3), AC-970 (×2) and AC-1030 (×5), where one criterion has clauses
needing different test shapes.

| Element | UAT | Outcome |
|---|---|---|
| AC-959, AC-968, AC-969, AC-971, AC-974, AC-976 | chrome:108/238/268/351/470/129 | aligned — carried forward; criteria unmoved since 2026-08-16, and the file passes 9/9 here |
| AC-960 | chrome:193; bug32:176; bug32:222 | aligned — three tests, one per clause; the criterion covers two distinct names |
| AC-961, AC-962, AC-963, AC-964, AC-965 | origin:545/664/602/736/778 | aligned — carried forward. AC-961 asserts `WEBUI_INSTALLED` as an *outcome*, which is what keeps "renamed upstream" distinguishable from "never installed" |
| **AC-966** | `test_UAT_AC966_the_pane_shows_the_selected_sites_whole_rendering_over_this_origin` (origin:125-200) | **repaired — violation 2 of REPORT-2309 closed.** Re-read clause by clause against the criterion: the address is taken from the workspace's own `previewUrl` rather than a literal (`:139-166`); real content is asserted by a marker written into the site's *own definition* (`:146,175`), not by byte-equality with `dist`, which the criterion cedes to AC-1032; stylesheet `href`s and image `src`s are parsed **out of the returned document** (`:180-183`), asserted non-empty, resolved against the displayed URL, checked same-origin, 200 and non-empty body (`:187-195`), with `text/css` on the stylesheet (`:198-199`); and the guard runs against a site created in the real store and **never rendered**, asserted non-vacuously (`:159-162`). The old `expect(await res.text()).toBe(onDisk)` and the directory glob are gone. The test was also renamed off `…byte_identical`, which was the claim the criterion no longer makes |
| AC-967 | mounted:299 | aligned — expected set read off the store, a site created after boot |
| AC-970 | chrome:303; toolbar-lifetime:203 | aligned — the two tests split the criterion's two triggers (mode, site) |
| AC-972 | mounted:217 | aligned — publish is *clicked* on the real control |
| **AC-973** | `test_UAT_AC973_the_split_drags_collapses_to_a_rail_and_reopens_to_its_width` (chrome:384-468) | **repaired — warning 1 of REPORT-2309 closed, with a residue.** `app.split.setSplit(37)` is replaced by a real `pointerdown` on the divider followed by `pointermove`/`pointerup` (`:431-433`), and the assertion is on both the resulting ratio and the width the component **writes onto the primary pane** (`:437-445`) — so gesture → model → layout is what is evidenced. The rail is asserted as rendered (`is-rail`, `split--collapsed`, divider withdrawn, restore control present, `:451-454`) rather than as `isCollapsed()`. **Executed here: passes.** Residue recorded as warning 1 |
| AC-975 | origin:861 | aligned — real chromium, three viewport heights (unexecuted here; see execution status) |
| AC-977 | origin:384 | aligned — parses the routing table out of `builder.ts` and requires a probe per declared route. Note it probes `/framework/edit-client.js` for *cacheability* only, which is why it was never AC-1240's evidence |
| AC-978, AC-979 | origin:319/290 | aligned — three trees × three encodings plus the uniformity assertion; 404 for both unserved classes |
| AC-1029 | mounted:151 | aligned — the shipped workspace's own modes, none registered by the test |
| AC-1030 | five `…AC1030_*` (component-resolution-anchor) | aligned — four checkout shapes as fixture trees running the shipped resolver in a real `node`, plus the real-installation equality |
| AC-1031 … AC-1035 | request-time-render:168/218/271/309/356 | aligned — carried forward; criteria unmoved |
| AC-1036 | request-time-render:395-461 | aligned — re-checked against the 2026-08-20 edit in REPORT-2309 and unchanged since. The edit relabelled the confinement paragraph a regression rider naming AC-978/AC-979 as owners; the test was already written that way |
| AC-1110 | toolbar-lifetime | aligned — subscriptions counted at the panel across repeated re-derivations |
| **AC-1240** | `test_UAT_AC1240_the_edit_client_is_served_derived_from_the_renderers_own_source` (origin:202-278) | **repaired — violation 1 of REPORT-2309 closed.** The criterion's Verification is met clause by clause: the route is fetched over the running origin with 200 and a JavaScript content type (`:212-216`); the source is located in the framework package and **derived here exactly as the origin derives it**, with `served === derived` asserted (`:221-235`); browser-executability is asserted *both ways* — the source is shown to carry build-time-only syntax and the answer to carry none (`:239-241`); the package import is shown rewritten to a sibling this origin answers for (`:245-246`); and no second copy exists under `apps/control-app/src`, detected by content (`:248-277`). **Grounded, not assumed:** the test's derivation is byte-for-byte the shipped one — `ts.transpileModule` at `ES2022`/`ESNext` then the `@1stcontact/site-schema` → `/framework/site-schema-edit.js` rewrite — which is `transpileForBrowser` at `tools/generate/src/cli/builder.ts:123-135`, serving the route matched at `:462-468`. So the equality is against the shipped implementation rather than a guess at it |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-973 (`acceptance_criterion-e1acae35`) | `uat-edit` | Residue of an otherwise sound repair, raised because it was introduced by this cycle rather than carried forward. To make the drag reachable under jsdom (which computes no layout, so every box measures 0×0 and the gesture would be reduced to a no-op by arithmetic rather than by the component), `tests/reconciliation-builder-workspace-chrome.test.ts:393-406` replaces **`HTMLElement.prototype.getBoundingClientRect`** — for every element, not just the container — with a fixed 1000×800 box. The stand-in is declared in the test's own comment, is geometry rather than behaviour, and is properly restored in a `finally` (`:465-467`), which the file's 9/9 pass here confirms leaks into no sibling. The weakness is narrow but real: because *every* element reports the same 1000px width, the test cannot distinguish "the component reduces the delta against its container" from "against the divider, or the primary pane, or the document body" — a mis-measured element yields an identical ratio. The criterion's subject (the gesture is wired to the ratio) is still evidenced; what is not, is *which* box the reduction divides by | Patch the container element's own `getBoundingClientRect` (an own-property override on `app.split.element`, restored the same way) instead of the prototype, and leave the other elements measuring 0×0. The drag arithmetic then only works if the component measures the element the test intended, and the assertion at `:438` becomes evidence of that too. Low priority — the criterion passes as written |
| 2 | info | exclusivity | AC-1240 (`acceptance_criterion-bd9ce1d6`) ↔ AC-1006 (`acceptance_criterion-a5d4eb9c`, `story_uid=story-3bf94bd4`) | — | REPORT-2309's finding 4 constrained this fix to avoid cloning the neighbouring capability's test, and the constraint was honoured — recorded here so a later pass does not re-derive the question. The two are **complementary by detector**, not merely by wording: AC-1240 asserts `served === derived` (byte equality with the origin's own derivation, which is the criterion's actual subject and a claim AC-1006 does not make — AC-1006 asserts only that the same `export function` *names* survive, `reconciliation-copy-edit-gesture.test.ts:850-863`); and AC-1240 detects a second copy by **content** (verbatim statements of the derived module, `:263-277`) where AC-1006 detects by **declaration** (`function resolveEditTarget\|mountL1EditBridge` plus the four stamp attributes, `:928-940`). AC-1240 deliberately restates neither AC-1006's browser-runtime claim nor its single-delivery-point claim. Residual overlap is three supporting assertions — status/content-type, no-TS-syntax-survives, and the fact of walking `apps/control-app/src` — none of which is either test's load-bearing claim | None. The overlap is supporting context under two different load-bearing assertions, which is not "the same scenario in the same way" |
| 3 | info | — | `tests/reconciliation-builder-workspace-origin.test.ts` | — | Eleven CAP-85 UATs — AC-961/962/963/964/965/966/975/977/978/979/1240 — cannot execute in this sandbox: `listen EPERM` on both `0.0.0.0` and `127.0.0.1` at `tools/generate/src/cli/builder.ts:623`, aborting `beforeAll` before any test body runs. Reproduced directly in this run rather than accepted from REPORT-2316. Pre-existing and environment-scoped; nine of the eleven are untouched by this cycle. Not drift, and not a defect in the tests | None at this level. The `uat_coverage_check` must run where a local ephemeral port can be bound, or its verdict on these eleven is uninformative |
| 4 | info | — | AC-1240 (`acceptance_criterion-bd9ce1d6`) | — | `status=pending` while its thirty siblings are `active`. Established at the ac level and unchanged: `pending` is the schema default for `acceptance_criterion`, the capability tree applies no status filter to criteria, and AC-1240 carries a `uat_coverage` verdict — so it is in the matrix and is evaluated, which is why its evidence gap was a violation rather than a deferral | None. The `pending` status is not itself drift |

## Notes for the Editor

**This level is clean; the single warning is optional and will not gate.** Both
of REPORT-2309's violations are closed by evidence that was read against the
criterion clause by clause, and the one carried-forward warning (AC-973, open
since REPORT-1627) is closed by a test that was executed here.

**The fix cycle broke the pattern that produced the last three failures, and
that is worth recording.** The failure mode across attempts was a criterion
moving and its evidence not following — most sharply in commit `2a663c06d`,
which edited AC-966's test comment to rationalise assertions the new criterion
disclaimed while changing no assertion at all. This cycle did the opposite:
`ded80daa8` changed two test files and **no ticket body or field**, so the
ac-level verdict above it still stands on the text it was issued against, and
nothing needs re-checking upward.

**Two things a later pass should not undo:**

- **AC-966's never-rendered guard is load-bearing, not decoration.** It is what
  distinguishes "produced from the definition on request" from "handed back off
  a shelf", and the old test could not make that distinction *in principle*
  because it read its expectation out of `dist`. If AC-966 is ever narrowed
  again, keep the guard. The test correctly reuses AC-1031's *technique* without
  restating AC-1031's guarantee ("serving materialises nothing").
- **AC-1240's `served === derived` is the criterion, not an implementation
  detail.** A weaker check — the export names, or a substring — would readmit
  exactly the hand-written second copy the criterion exists to forbid. It is
  currently anchored to `transpileForBrowser` (`builder.ts:123-135`); if that
  function's compiler options or its import rewrite ever change, this test must
  change with it, and it *should* fail loudly in the meantime rather than being
  relaxed.

**Deliberate non-findings, recorded so a later pass does not re-derive them:**

- **AC-1036 ↔ AC-978 traversal overlap is closed** by the ac-level relabelling of
  AC-1036's confinement paragraph as a regression rider naming AC-978/AC-979 as
  owners. No test change is or was needed.
- **AC-977 and AC-960 read repository source, and neither is structural in the
  disqualifying sense.** AC-960's subject *is* what the repository says; AC-977
  parses the routing table only to *enumerate* routes that are then probed over
  real HTTP, which is what makes a newly added route fail the freshness
  criterion until someone states what it returns.
- **The mount-evidence skip gate is test policy, not product behaviour**, and
  correctly has no criterion. The consumption evidence that must never skip does
  have one — AC-961.
- **REQ-119's declared deviation (render inside the edge Worker) is correctly
  unevidenced**, because no AC claims it. AC-964 is written about one origin and
  what an operator observes, so it survives the eventual runtime relocation.
- **AC-1030's five tests are not duplicates of one another** — four checkout
  shapes plus the real-installation equality, each a distinct branch of the
  anchoring rule the criterion states.
