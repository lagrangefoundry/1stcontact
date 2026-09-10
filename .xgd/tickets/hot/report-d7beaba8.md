---
uid: report-d7beaba8
id: REPORT-3781
type: report
title: 'UAT Coverage: Structured Copy Editing: One Validated, Atomic Write Path'
created_by: xgd
created_at: '2026-09-10T19:20:34.862764+00:00'
updated_at: '2026-09-10T19:20:34.862764+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-f753cecd
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: Structured Copy Editing: One Validated, Atomic Write Path

**Result**: FAIL
**AC verdicts**: 42 pass, 1 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 0 pass, 1 fail, 0 stale, 0 needs_review
**Capability verdict**: fail

Anchor report: report-e37a6b4a · Capability: capability-f753cecd (CAP-86) ·
Story: story-37a3921b (STORY-100, `story_kind: upgrade`) · 43 active ACs ·
53 UAT functions across 7 files · previous_attempt_count: 3.

One violation, one warning, zero needs_review. The violation is a single
uncovered clause of AC-1120 whose production branch has no covering assertion
anywhere in the evidence set; the fix is roughly four lines in one existing
test.

## Cumulative Intent Considered

The capability carries one story. Its `intent_uid` is BUNDLE-16
(`free_and_reconciled`, merged at `1741ee5d`) and its `updated_by` is BUNDLE-19
(`free_and_reconciled`, merged at `b18b859d`). Every intent below was re-read
this cycle from the ticket store; **all are `free_and_reconciled`**. The store's
retired intents (REQ-7, 17, 18, 19, 34, 43, 80, 112, 134 — all `abandoned`)
were checked and none touches a behaviour this capability describes, so **no AC
in this capability is retired** and Step 1a's deprecation case is not triggered
anywhere.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-44 | free_and_reconciled | 2026-07-03 | Tooling hygiene (bundled with the story's originating intent) | YES |
| REQ-82 | free_and_reconciled | 2026-07-20 | L1 substrate + safety envelope — the structured-only invariant this surface inherits (AC-991) | YES |
| REQ-114 | free_and_reconciled | 2026-07-31 | L1 palette colour model — the substrate a colour reference names | YES |
| REQ-115 | free_and_reconciled | 2026-07-31 | Builder shell — the origin AC-992 is asserted over | YES |
| REQ-117 | free_and_reconciled | 2026-07-31 | Copy editing end-to-end: address → fields → validated diff → re-render (AC-980–992) | YES |
| REQ-118 | free_and_reconciled | 2026-07-31 | Image selection as the second half of the same surface (AC-1024–1027, AC-1045–1049) | YES |
| REQ-119 | free_and_reconciled | 2026-07-31 | Request-time draft/edit renders — moved *where* "both views current" is observed (AC-992) | YES |
| BUNDLE-16 | free_and_reconciled | 2026-08-07 | REQ-117 + REQ-115 + REQ-44 — the story's originating intent | YES |
| REQ-131 | free_and_reconciled | 2026-08-11 | Draft change journal | YES |
| REQ-132 | free_and_reconciled | 2026-08-12 | `format: 'image'` declared on the field itself (AC-1111) | YES |
| REQ-133 | free_and_reconciled | 2026-08-12 | Palette popup — the component a colour field opens | YES |
| REQ-135 | free_and_reconciled | 2026-08-12 | Text properties: size, weight, italic, capitalisation beside the words (AC-1117–1122) | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Non-destructive image framing and colour adjustment (AC-1129–1132; widened AC-1121/1122) | YES |
| REQ-137 | free_and_reconciled | 2026-08-12 | `shade` on the reference replaces named steps | YES |
| REQ-139 | free_and_reconciled | 2026-08-12 | Lock a control that cannot express what the element holds, with its reason (AC-1273–1277) | YES |
| BUG-35 | free_and_reconciled | 2026-08-13 | Capitalisation preview | YES |
| REQ-140 | free_and_reconciled | 2026-08-15 | Colour: a run's text colour and a panel's fill, from the palette (AC-1269–1272, 1274–1276, 1278) | YES |
| REQ-141 / 142 / 144 / 123 | free_and_reconciled | 2026-08-15 | Also bundled into BUNDLE-19; no behaviour of this capability | YES |
| BUNDLE-19 | free_and_reconciled | 2026-08-18 | REQ-133 + BUG-35 + REQ-131 + REQ-140 + REQ-139 + REQ-123 + REQ-141 + REQ-144 + REQ-142 — the story's `updated_by` | YES |

Two ACs were checked individually against intent because they are the least
obviously derivable from a headline: **AC-1278** (a run also answers with the
nearest painted panel behind it) is REQ-140 §"The escalation row" and its
acceptance point 5; **AC-1275** (a sibling parameter is not occlusion) is
REQ-139's stated test — *"is the write observable and complete?", NOT "is
another axis present" … A sibling axis is not occlusion"* — and its named
`..._a_scrim_over_a_photograph_is_not_occlusion` verification. Both are
supported outright; neither is intent-silent, so neither is `needs_review`.

## Alignment Ledger

The story body was read in full (53,352 chars) and compared clause by clause
against the ledger. Every behaviour it describes traces to a reconciled intent;
no behaviour any reconciled intent called for is missing from it. It carries no
`## Reconciliation Decisions` heading and needs none — nothing in it is
intent-silent. Its "Where the intent and the implementation differ" section
records the two known divergences (the empty-region message, and the withheld
size control on a run declaring no size) as open rather than absorbed, which is
the honest form.

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-100 | REQ-82, REQ-114, REQ-115, REQ-117, REQ-118, REQ-119, REQ-131, REQ-132, REQ-133, REQ-135, REQ-136, REQ-137, REQ-139, REQ-140, BUG-35 (via BUNDLE-16, BUNDLE-19) | **aligned**, coverage `fail` | Body matches cumulative intent; one behavioural claim it makes — the status-quo carve-out for an unavailable **non-colour** field — is proven nowhere in the evidence set (Finding 1) |

Per-file evidence, all read this cycle:

| File | ACs | Outcome |
|---|---|---|
| `reconciliation-copy-edit-write-path.test.ts` | 980–992 (13) | covered |
| `reconciliation-copy-edit-image-selection.test.ts` | 1024–1027, 981, 986, 988, 991, 992 | covered |
| `reconciliation-copy-edit-background-selection.test.ts` | 1045–1049 (5) | covered |
| `reconciliation-copy-edit-field-format.test.ts` | 1111 | covered |
| `reconciliation-copy-edit-typography.test.ts` | 1117–1122, 980, 988, 991 | covered except AC-1120's re-post clause |
| `reconciliation-copy-edit-image-framing.test.ts` | 1129–1132, 1121, 1122 | covered |
| `reconciliation-copy-edit-colour-and-availability.test.ts` | 1269–1278 (10) | covered |

**Evidence validity.** All 53 tests drive real entry points only: the command
line through `run(argv)` (argv in, `{ok,data}` / `{ok,error}` envelope and exit
code out), the builder origin over HTTP through `startBuilder`, and the bytes of
the draft page document and the rendered channels on disk. A sweep of the seven
files for `vi.mock` / `vi.fn` / `.skip` / `.only` / `.todo` / `stub` returns
nothing — no internal component is mocked and no test is skipped, focused or
`todo`. No test is trivial or structural: none reads source text to assert a
name appears. Several deliberately guard against vacuity (`fieldsSeen > 0`,
`closedListsSeen > 0`, `unavailable > 0`, "the sweep saw both shapes"), which is
the right instinct for the sweep-shaped ACs.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | ac | AC-1120 (`acceptance_criterion-3235871e`) / `tests/reconciliation-copy-edit-typography.test.ts:533` | uat-edit | AC-1120's criterion states in bold: *"**Re-posting the value the field already holds is not a change and passes**"*, and its Verification asks for *"Post its **unchanged** italic value alongside new words and assert the save succeeds and the words land."* No test does this. The production branch is `packages/site-schema/src/l1/edit.ts:1136` — `const unchanged = field.type === 'color' ? sameColor(value, current) : value === current`. The **colour** side is proven by `test_UAT_AC1276` (`colour-and-availability.test.ts:924-930`). The **non-colour** side is proven by nothing: no test anywhere in the seven files posts an unchanged value for a locked non-colour field. Verified exhaustively — the only locked non-colour field in any fixture is `italic` on the Satoshi runs, and every save touching one (`typography.test.ts:623` on `A_GIANT`, `:679`/`:687` on `A_HEADLINE`) omits `italic` from the change map; the two whole-form re-posts (`typography.test.ts:710` on `A_FULL`, `image-framing.test.ts:593` on `A_PLAIN`) are on regions with nothing locked. Mutating `edit.ts:1136` to `field.type === 'color' ? sameColor(value, current) : false` leaves all 53 tests green while making an unavailable italic freeze the whole run — its words included — which is precisely the failure AC-1120 exists to forbid. | In `test_UAT_AC1120_italic_is_read_only_only_on_positive_evidence_of_absence`, after the refusal at `:554`, add: `const saved = await set(A_HEADLINE, { text: 'Reworded, italic untouched.', italic: false })`; assert `saved.ok`, `saved.data!.changed` equals `['text']`, `draftNode(A_HEADLINE).text` is the new string, and `draftAxes(A_HEADLINE)` still has no `fontStyle`. `A_HEADLINE` already reports `italic: false` (pinned at `typography.test.ts:391`), so no fixture change is needed. |
| 2 | warning | ac | AC-988 (`acceptance_criterion-97f5dee6`) / `write-path.test.ts:506`, `image-selection.test.ts:530`, `typography.test.ts:719` | uat-edit | Two of the five refusal kinds AC-988 enumerates are exercised under a *neighbouring* AC's name rather than under an AC-988 test. (a) The colour refusals — unknown entry, free colour value, unrecognised part, out-of-range part — are fully covered by `test_UAT_AC1271` (`colour-and-availability.test.ts:975-1026`, all five cases, path `<addr>/color`, draft byte-identical after all of them), but no AC-988 test posts a colour at all. (b) The closing status-quo clause — *"re-post that field's existing value alongside a genuine edit to another field, and assert the save succeeds"* — is covered for colour by `test_UAT_AC1272` (`:1038-1041`) and `test_UAT_AC1276` (`:924-930`), and for bounds by `test_UAT_AC1121`. Both behaviours are therefore proven through the identical production paths; what is missing is only the record of the delegation, so a future reader does not read the omission as a hole. This is a warning, not a violation: unlike Finding 1, no code branch is left unasserted. | Name the delegating tests in the AC-988 test headers (one comment line each), or add a single colour case and a status-quo re-post to `typography.test.ts:719`. Prefer the comment — do not widen these tests' absence-assertions. |

## Notes for the Editor

**Finding 1 is the only thing standing between this capability and a pass.**
It is one assertion in one existing test, on a fixture that already reports the
value needed. No new fixture, no new file, no production change. Everything else
in the matrix is substantively covered.

**Do not "fix" Finding 1 by widening a neighbouring test's absence-assertions.**
The 43 ACs here are densely cross-referential and several deliberately assert
the *absence* of a field a neighbouring AC asserts the *presence* of
(`AC-1045` on an image region's `backgroundImageUrl`, `AC-1270` on a run's
`surfaceFill`, `AC-1117` on `fontFamily`). Several also deliberately relax a
count to `toBeGreaterThan(0)` or `.slice(0, 2)` precisely because a later phase
grew the field list; re-pinning those counts would manufacture failures that
say nothing about correctness.

**On the local test run — read this before treating a red suite as a
regression.** `npm test -- <the 7 files>` was run once in this session, to
completion: **45 passed / 7 failed / 1 skipped of 53**, duration 181s. *Every*
failure is the same environment artifact — `Error: listen EPERM: operation not
permitted 0.0.0.0`, thrown from `server.listen` at
`tools/generate/src/cli/builder.ts:363`. This assessor session runs in a sandbox
that denies binding a listening socket, so every test reaching
`startBuilder`/`withOrigin` dies there. The eight affected specs are exactly the
origin-driven ones — AC-1024, AC-1026, AC-992 (image-selection), AC-1048,
AC-1111, AC-1273, and the write-path origin `describe` whose `beforeAll` failed
(that is the "1 skipped", which carries the second AC-992 test). **All 45
non-origin assertions pass.** The origin-side assertions could not be executed
here and are read-verified only; report-5a9c920c records them green in the
workflow environment. None of the seven failures is evidence of a coverage gap
and none affected a verdict above.

**A latent robustness point, out of scope for this check.** `startBuilder`
(`tools/generate/src/cli/builder.ts:356-374`) resolves its promise only from the
`listening` callback and attaches no `'error'` handler, so any bind failure
becomes an opaque uncaught exception rather than a fast, legible test failure.
That is production code belonging to whichever story owns the builder transport,
not to CAP-86's matrix; it is noted only because it is what makes a sandboxed
run look like seven unrelated failures.

**Scope confirmed clean.** `reconciliation-copy-edit-colour-row.test.ts`,
`reconciliation-copy-edit-control-availability.test.ts` and
`reconciliation-copy-edit-parameter-sheet.test.ts` also name copy-edit ACs, but
those ACs belong to the browser-gesture/chrome capability that CAP-86's body
explicitly places out of scope ("how a click becomes an address in a browser…
the chrome that hosts it"). They were not counted as evidence for any of the 43
ACs here.
