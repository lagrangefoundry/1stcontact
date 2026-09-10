---
uid: report-3b9a77bb
id: REPORT-3780
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=uat)'
created_by: xgd
created_at: '2026-09-10T19:11:21.447277+00:00'
updated_at: '2026-09-10T19:11:21.447277+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: uat
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

Anchor report: report-e37a6b4a · Capability: capability-f753cecd (CAP-86) ·
Story: story-37a3921b (STORY-100, `story_kind: upgrade`) · 43 active ACs ·
previous_attempt_count: 4.

The three violations and two warnings of the previous cycle
(report-0cde712b, 2026-09-10 18:52) were re-checked against the current tree
and **all five are repaired** — verified by reading the current test bodies,
not by trusting the fix report (report-5a9c920c). No new violation was found.

## Cumulative Intent Considered

The capability carries one story, whose `intent_uid` is BUNDLE-16
(`free_and_reconciled`, merged at `1741ee5d`) and whose `updated_by` is
BUNDLE-19 (`free_and_reconciled`, merged at `b18b859d`). Every intent the
in-scope UATs cite by ID was re-read this cycle and **every one is
`free_and_reconciled`**. No intent in this capability's ledger is
`abandoned`, `deprecated` or `wont_fix`, so no UAT rests on a retired
behaviour and Step 2.5's stale-vehicle-citation case is not triggered
anywhere.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-82 | free_and_reconciled | 2026-07-20 | L1 substrate + safety envelope — the structured-only invariant this surface inherits | YES |
| REQ-117 | free_and_reconciled | 2026-07-31 | Copy editing end-to-end: address → fields → validated diff → re-render (the write path itself) | YES |
| REQ-118 | free_and_reconciled | 2026-07-31 | Image selection as the second half of the same surface (`src`, `alt`) | YES |
| REQ-119 | free_and_reconciled | 2026-07-31 | Request-time draft/edit renders — moved *where* "both views current" is observed | YES |
| BUNDLE-16 | free_and_reconciled | 2026-08-07 | REQ-117 + REQ-115 + REQ-44 — the story's originating intent | YES |
| REQ-131 | free_and_reconciled | 2026-08-11 | Draft change journal | YES |
| REQ-132 | free_and_reconciled | 2026-08-12 | `format: 'image'` declared on the field itself | YES |
| REQ-133 | free_and_reconciled | 2026-08-12 | Palette popup — the component a colour field opens | YES |
| REQ-135 | free_and_reconciled | 2026-08-12 | Text properties: size, weight, italic, capitalisation beside the words | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Non-destructive image framing and colour adjustment | YES |
| REQ-137 | free_and_reconciled | 2026-08-12 | `shade` on the reference replaces named steps | YES |
| REQ-139 | free_and_reconciled | 2026-08-12 | Lock a control that cannot express what the element holds, with its reason | YES |
| BUG-35 | free_and_reconciled | 2026-08-13 | Capitalisation preview | YES |
| REQ-140 | free_and_reconciled | 2026-08-15 | Colour: a run's text colour and a panel's fill, from the palette | YES |
| BUNDLE-19 | free_and_reconciled | 2026-08-18 | REQ-133 + BUG-35 + REQ-131 + REQ-140 + REQ-139 + REQ-123 + REQ-141 + REQ-144 + REQ-142 — the story's `updated_by` | YES |

## Alignment Ledger

Every one of the 43 active ACs has at least one substantively-named UAT: 53
test functions across the 7 in-scope files, all driving **real entry points
only** — the command line through `run(argv)` (argv in, `{ok,data}` /
`{ok,error}` envelope and exit code out), the builder origin over HTTP through
`startBuilder`, and the bytes of the draft page document and the rendered
channels on disk. A grep of the seven files for `vi.mock` / `vi.fn` / `.skip` /
`.only` / `.todo` / `stub` returns **nothing**: no internal component is mocked
anywhere in the evidence set and no test is skipped, focused or `todo`. The
evidence-validity rules are satisfied.

| Element | AC(s) | Intents aligned to | Outcome |
|---|---|---|---|
| `reconciliation-copy-edit-write-path.test.ts` | 980–992 (13) | REQ-117, REQ-119, REQ-82 | aligned |
| `reconciliation-copy-edit-image-selection.test.ts` | 1024–1027, 981, 986, 988, 991, 992 | REQ-118, REQ-136 | aligned |
| `reconciliation-copy-edit-background-selection.test.ts` | 1045–1049 (5) | REQ-118, REQ-140 | aligned — F1 and F4 repaired (palette seeded and asserted at `:130`, `:349`, `:398`; a no-fill panel written, rendered and its clear-refusal field-scoped at `:419`–`:462`) |
| `reconciliation-copy-edit-field-format.test.ts` | 1111 | REQ-132, REQ-140 | aligned |
| `reconciliation-copy-edit-typography.test.ts` | 1117–1122, 980, 988, 991 | REQ-135, REQ-140 | aligned — F2 repaired (`A_UNWEIGHTED` at `:173`, seed reported and echoed at `:427`–`:449`); AC-1120 carries W1 |
| `reconciliation-copy-edit-image-framing.test.ts` | 1129–1132, 1121, 1122 | REQ-136 | aligned — F3 repaired (`hueRotateDeg`/`blurPx` written un-converted, rendered, and returned to identity with `contrastPct` at `:368`–`:444`) |
| `reconciliation-copy-edit-colour-and-availability.test.ts` | 1269–1278 (10) | REQ-140, REQ-133, REQ-137, REQ-139 | aligned — F5 repaired (`shadeHex(ink, -0.25)` asserted in the render at `:618`–`:620`) |

Exclusivity: seven ACs carry more than one test (980, 981, 986, 988, 991, 992,
1121, 1122). Each multi-test AC was re-inspected this cycle; none is a
redundant duplicate — every copy adds a distinct region kind or a distinct
claim its sibling cannot make (a run vs an image for AC-988's per-field shape
check; words vs images over the origin for AC-992; a run's size vs a picture's
bounds for AC-1121/AC-1122, which `image-framing.test.ts:493-498` records as
REQ-136 widening what "every bounded control" means).

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-1120 / `test_UAT_AC1120_italic_is_read_only_only_on_positive_evidence_of_absence` (`tests/reconciliation-copy-edit-typography.test.ts:533`) | uat-edit | One clause of AC-1120's own Verification is absent from its own test: "Post its *unchanged* italic value alongside new words and assert the save succeeds and the words land." The test asserts the lock (`:536`), the two live contrasts (`:541`, `:544`), the refusal of a *changed* value (`:554`) and the live set/unset pair (`:562`–`:569`) — but never re-posts `italic: false` for `A_HEADLINE` alongside new words. The behaviour is implemented generically in `lockError` (`packages/site-schema/src/l1/edit.ts:1130-1139`: `const unchanged = field.type === 'color' ? sameColor(...) : value === current`), and its non-colour branch has no covering assertion anywhere in the seven files. It is proven cross-AC for the *colour* branch by `test_UAT_AC1276` (`colour-and-availability.test.ts:924-930`), and the derived `italic` value it would compare against is pinned by `test_UAT_AC1117` (`typography.test.ts:391`) — which is why this is a warning rather than a violation. | Add to the AC-1120 test: `set(A_HEADLINE, { text: <new>, italic: false })`, asserting `ok`, `changed === ['text']` and `draftAxes(A_HEADLINE)` still without `fontStyle`; or record the cross-AC delegation to AC-1276 in the test comment |
| 2 | warning | consistency | AC-988 / its three tests (`write-path.test.ts:506`, `image-selection.test.ts:530`, `typography.test.ts:719`) | uat-edit | Two of the five refusal kinds AC-988's Verification enumerates are not exercised under any AC-988-named test. (a) "Submit, for a colour field, an entry name the site's palette does not hold, a free colour value, a position outside the range the reference admits, and a value carrying a part a reference has no business carrying" — no AC-988 test posts a colour at all. (b) "Then re-post that field's *existing* value alongside a genuine edit to another field, and assert the save succeeds and the other field lands" — the three tests assert the read-only *refusal* (`typography.test.ts:786-790`) but never the status-quo pass. Both are covered cross-AC and by the same production code paths: (a) by `test_UAT_AC1271` (`colour-and-availability.test.ts:975-1026`, all five colour refusals, path `0.1/color`, draft byte-identical) and (b) by `test_UAT_AC1276` and `test_UAT_AC1272`. So the behaviours are proven; what is missing is the record of the delegation. | Either add a one-line colour case and a status-quo re-post to one AC-988 test, or name the delegating tests in the AC-988 test headers so a future reader does not read the omission as a hole |
| 3 | info | consistency | AC-1045, AC-1049, AC-1117, AC-1130, AC-1269 | — | The five findings of report-0cde712b are repaired and were re-verified by reading the current tests (see the ledger rows above). Each repair extended a fixture and added assertions; none rewrote a test, none re-pinned a deliberately relaxed count (`toBeGreaterThan(0)`, `.slice(0, 2)`), and no production code was changed — `git status` is clean and the work is committed at `9765693389`. | none |
| 4 | info | exclusivity | AC-980, AC-981, AC-986, AC-988, AC-991, AC-992, AC-1121, AC-1122 (multi-test) | — | Each multi-test AC divides complementary ground rather than repeating: AC-980's write-path copy asserts the words are first, typography's asserts they stay first now the list is longer than one; AC-981 contrasts an empty list against a copy region and against an image region; AC-986 covers a copy edit, an image edit and a background edit against the same planted whole-definition violation; AC-991 covers literal text, the alt-attribute escape path and the five-shape sweep; AC-992 covers words and images over the origin. Kept as deliberate re-assertion. | none |

## Notes for the Editor

**Both warnings are the same shape and neither blocks this level.** Each is a
clause of an AC's own `## Verification` whose behaviour is proven by a
*neighbouring* AC's test through the identical production code path — the
locked-field status-quo carve-out in `edit.ts:1130-1139` and the field-scoped
colour check in `colorError`. A regression in either would turn
`test_UAT_AC1276` or `test_UAT_AC1271` red, so no regression ships green
because of them. If they are repaired, the cheapest correct fix is a comment
recording the delegation rather than a new fixture; do **not** widen either
test's absence-assertions, for the reason the previous cycle recorded — the 43
ACs are densely cross-referential and several deliberately assert the absence
of a field a neighbouring AC asserts the presence of.

**On the local test run — read this before treating a red suite as a
regression.** `npm test -- <the 7 files>` was run twice in this session. Both
runs report **45 passed / 7 failed / 1 skipped of 53**, and *every* failure is
the same environment artifact: `Error: listen EPERM: operation not permitted
0.0.0.0`, thrown from `server.listen` in `tools/generate/src/cli/builder.ts:363`.
This assessor session runs in a sandbox that denies binding a listening socket,
so every test that calls `startBuilder`/`withOrigin` hangs (the promise at
`builder.ts:362` has no `'error'` path, so the EPERM never rejects it) until
vitest's timeout. The eight affected specs are exactly the origin-driven ones —
AC-1045, AC-1048, AC-1273, AC-1111, AC-1024, AC-1026, AC-992 (image-selection),
and the write-path origin `describe` whose `beforeAll` timed out (that is the
"1 skipped"). **All 45 non-origin assertions pass**, including every assertion
added by the previous fix cycle. The origin-side assertions could not be
executed here; they are read-verified only, and report-5a9c920c records them
green in the workflow environment.

**A latent robustness point, out of scope for this check.**
`startBuilder` (`tools/generate/src/cli/builder.ts:356-374`) resolves its
promise only from the `listening` callback and attaches no `'error'` handler,
so any bind failure turns into a 60–120 s hang and an opaque timeout rather
than a fast, legible failure. That is production code and belongs to whichever
story owns the builder transport, not to CAP-86's matrix; it is noted here only
because it is what makes a sandboxed run look like seven unrelated timeouts.

**On the aggregate fields.** `capability-f753cecd.uat_coverage` and
`story-37a3921b.uat_coverage` both still read `fail`, while all 43 ACs that
carry the field read `pass`. Those fields are owned by
check/fix_uat_coverage, not by this check, and this report does not set them.
This level found zero violations independently of whatever the coverage gate
is separately reporting.

**Scope confirmed clean.** `reconciliation-copy-edit-colour-row.test.ts`,
`reconciliation-copy-edit-control-availability.test.ts`,
`reconciliation-copy-edit-parameter-sheet.test.ts` and the other
`reconciliation-copy-edit-*` suites also name copy-edit ACs, but those ACs
belong to the browser-gesture/chrome capability that CAP-86's body explicitly
places out of scope ("how a click becomes an address in a browser… the chrome
that hosts it"). They were not counted as evidence for any of the 43 ACs here,
and the pre-existing `parameter-sheet` failure report-5a9c920c flagged
(`test_UAT_AC1123`, story-3bf94bd4) remains that story's to own.
