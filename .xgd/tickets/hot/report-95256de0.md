---
uid: report-95256de0
id: REPORT-3861
type: report
title: 'UAT Coverage: Site Control Surface: Declared, Granted, Validated & Audited'
created_by: xgd
created_at: '2026-09-11T01:51:37.032791+00:00'
updated_at: '2026-09-11T01:51:37.032791+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-00e77e55
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: Site Control Surface: Declared, Granted, Validated & Audited

**Result**: PASS
**AC verdicts**: 14 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Anchor report: report-e37a6b4a. Capability: capability-00e77e55 (CAP-92).
Scope path `xgd/structural_validation/report-e37a6b4a/cap/capability-00e77e55/19/1`.
Previous round: report-b8a37c51 (2026-08-16, PASS, 13 ACs, 2 warnings).

Tree: one story (STORY-105 / `story-93905de4`, `story_kind=upgrade`, status
`updated`), fourteen acceptance criteria — AC-1071 … AC-1082, AC-1142 and
AC-1411. All `kind=behavior`, none `regression_only`. AC-1411 is new since the
last round (created 2026-08-31 by the BUNDLE-20 reconciliation) and carried no
`uat_coverage` value at all before this assessment.

Evidence, two files:

- `tests/reconciliation-assistant-control-surface.test.ts` — 631 lines, thirteen
  `it(...)` blocks, one per AC-1071…AC-1082 + AC-1142.
- `tests/reconciliation-assistant-control-surface-audit.workers.test.ts` — 428
  lines, four `it(...)` blocks, all AC-1411, one per property the criterion
  claims (survives the host / loses nothing to a concurrent caller / records an
  abandoned turn / a failed audit write does not fail the turn).

## Method note — the evidence was EXECUTED this round

The previous three rounds were static: the runner was refused, and
`@lagrangefoundry/ai` was absent from the worktree. Both have changed.

- `npm test -- tests/reconciliation-assistant-control-surface.test.ts` →
  **13 passed (13)**, 471ms. The shared `@lagrangefoundry/*` store is now
  installed in this worktree, so the ten tests that call `aiCore()` /
  `createL1Toolbox()` resolved and ran for real.
- The AC-1411 file is a `.workers.test.ts` and **cannot run in this sandbox**:
  `Error: listen EPERM: operation not permitted 127.0.0.1` kills workerd before
  a single test starts. That is the sandbox, not the suite. AC-1411 was
  therefore verified by reading its four cases against the shipped
  implementation — see "Substantive-Coverage Judgments" — which is the same
  bound the previous round carried for all thirteen, now narrowed to four.

`.xgd/uat_index.json` is **still empty** (`acs: {}`, stamped
`2026-09-09T22:50:28Z`) while 14 ACs and a fully conventional `test_UAT_AC*` set
exist. This prompt's lookup snippet resolves every AC to `MISSING` through it.
Test discovery was done by grepping the tree instead. Unchanged XGD-tooling
observation from the last round, not a finding against this capability.

## Cumulative Intent Considered

STORY-105 carries `fields.intent_uid = bundle-e59210c5` (BUNDLE-17) and
`fields.updated_by = [bundle-b3b7c399 (BUNDLE-20), bundle-77b28def (BUNDLE-19)]`.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-125 (`request-dbdc904a`) | legacy_done | 2026-08-08 | DOC-30 — the L1 control-surface API design and its gap list | YES |
| REQ-122 (`request-58b6a329`) | free_and_reconciled | 2026-08-07 | Builder chat panel: AI session, declared tool surface, per-site sessions | YES |
| REQ-126 (`request-d9407f80`) | free_and_reconciled | 2026-08-08 | Built the surface: declaration as data, error taxonomy with caller-facing meanings, effect-homogeneous groups, sequences, absences, addressing contract, surface version, grant, provenance, audit, CI validator | YES — the base for AC-1071…AC-1082 |
| REQ-127 (`request-22a6521a`) | free_and_reconciled | 2026-08-08 | L1 tooling configuration projected over the surface | YES |
| REQ-129 (`request-b1300473`) | free_and_reconciled | 2026-08-09 | `get_l1`/`set_l1` replace `get_copy`/`set_copy`; `WriteCopy` → `AuthorPages`; sequences rewritten around read-then-replace + explicit add/remove | YES — AC-1142 |
| REQ-130 (`request-ed6ba145`) | free_and_reconciled | 2026-08-09 | Five operations added; `DrawImages` declared as its own withholdable group | YES |
| BUNDLE-17 (`bundle-e59210c5`) | free_and_reconciled | merged `0198704b7e` | Umbrella for the above | YES |
| REQ-131 (`request-5d3bf630`) | free_and_reconciled | 2026-08-11 | Draft change journal: declared `list_changes` into `ReadSite`, returning an untrusted slice, with its own sequence entry and overview paragraph | YES — **landed since last round** (was `ready_to_reconcile` then) |
| REQ-133 (`request-8467b1a3`) | free_and_reconciled | 2026-08-12 | Palette: `get_palette` into `ReadSite` plus a `ManagePalette` group of four writes, read grantable separately from the writes | YES — **landed since last round** |
| BUNDLE-19 (`bundle-77b28def`) | free_and_reconciled | 2026-08-20, merged `b18b859d74` | Umbrella for REQ-131 / REQ-133 | YES |
| REQ-146 (`request-0cdfdc5b`) | free_and_reconciled | 2026-08-15 | The AI host moves into workerd: the surface splits into a portable core and a host half; audit becomes a buffered sink + durable per-record R2 flush. Its AC3 — *"Every AI write is audited durably; the audit survives a Worker restart"* — is the intent AC-1411 is carried from | YES — **landed since last round** (was `draft` then) |
| REQ-149 (`request-554ac441`) | free_and_reconciled | 2026-08-17 | Publish in the cloud: revisions onto the storage port, so `publish` graduates from the host half into the portable core, leaving `add_asset` as the only disk-bound operation | YES |
| BUNDLE-20 (`bundle-b3b7c399`) | free_and_reconciled | 2026-08-31, merged `eef7a8b48b` | Umbrella for REQ-146 / REQ-149 | YES |
| BUNDLE-21 (`bundle-78f4e2fe`) | free_and_reconciled | 2026-08-31 | BUG-36/37/38 — deployment 503s, `bin/publish` auth, bootstrap. Does not touch this surface | YES (not applicable here) |
| BUNDLE-22 (`bundle-8eef3846`) | free_and_reconciled | 2026-08-31 | BUG-39 (the chat-host model double's streaming contract — CAP-90's test support) + REQ-154 (Browser Rendering driver). Neither adds or retires an operation | YES (not applicable here) |

Every counting intent is fully reconciled; nothing in the ledger is `draft`,
`abandoned` or `deprecated`. **No intent retires any behavior this tree claims**,
so no AC is `deprecated` and no story body clause is `stale`. Every AC's behavior
traces to a counting intent — none is `needs_review`, so the BUG-1306 impact
screen was not reached for any element.

Two ledger entries changed the shape of this tree since the last round and both
are absorbed correctly:

- **REQ-146 restated AC-1073.** The intent's evidence section records that three
  landed assertions compared the declaration against the *portable half alone*
  and so asserted a declared operation was unimplemented. AC-1073's title and
  criterion were rewritten on 2026-08-31 to measure over the composition, and
  the UAT was rewritten with it (`l1Operations` ∪ `nodeOperations`). Verified in
  the test at lines 209–234.
- **REQ-146 AC3 became AC-1411.** The story records the reasoning under
  `## Reconciliation Decisions`: durability is independently observable from
  *what* is recorded (AC-1079) and fails independently, so it is carried as its
  own criterion rather than folded into AC-1079. Grounded — not a
  reconciliation-decided gap, an intent-stated one.

**Nothing extends the declaration since BUNDLE-19.** `git log` on
`tools/generate/src/cli/ai/l1-surface.json` ends at REQ-131's commit
(`c745a1184d`); the shipped file carries 27 operations at `surface_version: 4`
against format `version: 1`. The story's own standing instruction — *"a later
intent adding an operation belongs in `updated_by` even when none of the criteria
below move"* — is therefore satisfied: BUNDLE-21 and BUNDLE-22 added none, so
`updated_by` needs no further entry.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-105 (`story-93905de4`) | REQ-125, REQ-122, REQ-126, REQ-127, REQ-129, REQ-130, REQ-131, REQ-133, REQ-146, REQ-149 | aligned | Every in-scope bullet maps to a counting intent and to at least one AC. The two bullets that are new since the last round — "One declaration, two runtimes" and the durability sentence under "Audit" — are REQ-146's and REQ-149's, and land on AC-1073 and AC-1411 respectively. The three recorded divergences were re-verified against the shipped artifacts (below). |

Story-body claims re-checked against the tree rather than taken on trust:

- **"today the builder's assistant is granted neither the management of image and
  font files nor publishing."** Holds. `test_UAT_AC1074` derives the withheld set
  as `groups ∖ grant` and **passed** this round, with `add_asset`, `remove_asset`
  and `publish` absent from `toolNames()` and from the manual.
- **"an operation genuinely needing the operator's own disk lives with the host
  that has one, and is absent where there is none."** Holds.
  `nodeOperations()` (`toolbox.ts:117`) returns exactly `{ add_asset }`, and its
  docstring records REQ-149 moving `publish` out. See warning 3 for the one
  assertion AC-1073's UAT does not make about it.
- **"it writes one object per record under distinct keys … flushed while the
  response is still open and inside a `finally`."** Holds, and is the exact shape
  of the shipped code: `flushAudit` (`apps/control-app/src/ai.ts:136`) puts one
  object per line at `audit/<tenant>/<session>/<stamp>-<i>.json`; `streamTurn`
  (`apps/control-app/src/router.ts:700-708`) awaits `host.flush` in a `finally`
  *inside* the `ReadableStream.start`, wrapped in its own `try/catch` so a failed
  flush cannot fail the turn.

Story-level coverage (step 2b) judged **pass** independently of the AC verdicts.
Walking the body's in-scope bullets: declaration (AC-1071/1072/1073/1081/1142),
grant (AC-1074), two runtimes (AC-1073), effect enforced (AC-1075), validation
before invocation (AC-1076), refusal as information (AC-1077), provenance
(AC-1078), audit content (AC-1079), audit durability (AC-1411),
self-documentation (AC-1080), one write path unbypassed (AC-1082). No behavioral
claim in the body is left without a test. The two clauses the last round chased
down separately — "what comes back" (declared `returns` + 12 `shapes`, which
DOC-30 states document rather than validate) and "how it can fail" (per-operation
`errors` typed against a closed `ErrorCode`, enforced by the format check
AC-1071 runs) — are unchanged and still covered transitively.

## Substantive-Coverage Judgments

**The thirteen executed.** All drive real entry points — `createL1Toolbox`,
`l1Operations`, `nodeOperations`, `editL1Set`, `validateData`, `cmdNew` against a
per-test `mkdtemp` site — and read the draft's bytes back from disk. No internal
component is mocked anywhere in the file. None is trivial, structural or
over-mocked. Non-tautology properties worth recording, all now observed passing
rather than reasoned about:

- **AC-1073** composes `l1Operations` with `nodeOperations`, asserts the two
  halves are **disjoint before composing** (a spread would collapse an overlap
  silently, and `createL1Toolbox` passes `nodeOperations` as `extraOps`, so a
  duplicated host copy would shadow the core's at runtime), then asserts set
  equality against the declaration and that the 16-name write set matches
  exactly. The palette writes REQ-133 added are in that list, so the closure
  bites on the current surface and not a stale one.
- **AC-1081** selects addressing operations *structurally* (`params.module &&
  params.slot`), so it cannot pass by tautology against the type under test.
- **AC-1082** makes the change through the surface, captures the draft bytes,
  rewinds the file, makes the *same* change through `editL1Set` directly, and
  asserts byte-identity. A proof of "one write path", not an assertion about it.
- **AC-1076** asserts all three schema refusals are audited with
  `{decision: 'refuse', rule: 'schema'}` — i.e. decided on the declaration, not
  reported back from the write path, which is the AC's actual claim.

**AC-1411's four, verified statically against the implementation.** Each runs
inside workerd through the Worker's own `fetch`, against a real D1 database and a
real R2 bucket, reading the trail back out of the bucket by prefix listing rather
than from any buffer. Two doubles, both at an external boundary and both declared
in the file's docstring: the Anthropic client (the network — speaking the real
streaming wire protocol via the shared transcription BUG-39 landed), and, in the
fourth case only, an R2 `put` proxy that refuses writes **under the `audit/`
prefix alone** — scoped deliberately, because a bucket refusing every write would
fail the turn through `chat/` and `draft/` and the case would then pass while
proving nothing. Nothing internal is faked. Each case was checked against the
shipped code and is consistent with it:

- *survives the host* — asserts the full record (surface, effect, params,
  policy decision, outcome, session) after `resetAiHost()` / `resetChatHost()`
  discard everything the host held. Matches `flushAudit`'s stored shape.
- *loses none to a concurrent caller* — two turns genuinely in flight
  (`Promise.all` over two `post`s, both responses obtained before either body is
  read), measured as a **delta** rather than an absolute so it stays a statement
  about those two turns. This one bites harder than it reads: `workerHost` gives
  the isolate **one shared audit buffer**, and `flush(sessionId)` calls
  `audit.drain()` on it, so a drain that lost entries under interleaving would
  show a delta below 2. See warning 2 for what it still cannot distinguish.
- *an abandoned turn still records* — the model connection throws mid-stream
  after the tool call has run; asserts the record reached R2 anyway. This is the
  `finally`-placement argument in `router.ts:700` made executable.
- *a failed durable write does not fail the turn* — asserts the operator's full
  answer arrived and that the audit prefix is empty afterwards, i.e. the cost is
  the declared one and not a silent one. Matches the `catch {}` at
  `router.ts:706`.

None of the four is trivial, structural or over-mocked. Verdict `pass`, bounded
by the sandbox's inability to execute workerd.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-1142 | uat-edit | **Carried unchanged from report-b8a37c51 finding 1 — not addressed.** The grant-filtering clause is *conditionally* vacuous: `expect(manual).not.toContain(seq.name)` over ungranted sequences (line 624) and the follow-up over `list.filter(s => manual.includes(s.name))` (line 627) are both satisfied trivially if the upstream renderer projects **no** sequences at all. It does hold today — `@lagrangefoundry/ai/src/toolbox/manual.js:136` filters sequences by `grant.enabled` and emits the survivors — but nothing in this repo witnesses that, so the test cannot distinguish "filtered correctly" from "never projected". It still catches the regression that matters (an *unfiltered* projection fails it). | Add one positive assertion that at least one *granted* sequence's name appears in `box.manual()`, so the filtering clause bites from both sides. Two lines, no restructuring. |
| 2 | warning | uat | AC-1411 | uat-edit | The concurrency case runs its two turns on **two different sessions**, so the two flushes write under two different key prefixes. That excludes a per-*tenant* fold, but not the realistic wrong implementation the criterion names — a per-*session* read-modify-write of one `.jsonl`, whose "read the trail, another appends, write the older version back" window only opens when two callers share a key. The same-session pair *is* asserted elsewhere (`tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts:274-275` flushes two concurrent `flushAudit` calls on one session), so the property is proven in the tree — just not under the AC's own name. | Add a fifth case, or extend the existing one: two concurrent `/api/ai/prompt` turns on the **same** `sessionId`, asserting the delta is the sum. That is where a fold actually loses a record. |
| 3 | warning | uat | AC-1073 | uat-edit | AC-1073's *Verification* asks for three assertions about the split and the UAT makes two. Union-equality and disjointness are both asserted (lines 231–234); the third — *"the operation needing the operator's own disk is present in the host's half and absent from the portable one"* — is only stated in a comment (lines 213–220). With disjointness plus union-equality alone, an implementation that put `add_asset` back into `l1Operations` and left `nodeOperations` empty still passes, which is precisely the REQ-146 regression the criterion was rewritten to catch. The property is proven inside workerd by `test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts:352` (`expect(Object.keys(operations)).not.toContain('add_asset')`), so this is a naming/placement gap rather than an uncovered behavior. | Two assertions next to the disjointness check: `expect(host).toContain('add_asset')` and `expect(core).not.toContain('add_asset')`. |

**Violations: 0. Needs review: 0. Warnings: 3.**

No finding reached the BUG-1306 impact screen: nothing in this tree is
intent-silent. All three findings are warnings against test *sharpness*, not
against coverage, and none affects pass/fail.

## Notes for the Editor

**The confidence caveat that stood for three rounds is now mostly discharged.**
report-b8a37c51 closed by warning that the evidence had gone three consecutive
rounds unexecuted and that `@lagrangefoundry/ai` was missing from the worktree.
Both conditions are gone: the shared store resolves here, and the thirteen-test
file ran green in 471ms. What remains is narrower and structural — the AC-1411
file is a workerd suite and `listen EPERM` stops workerd from starting in this
sandbox at all, so four of eighteen tests are still judged by reading rather than
by running. If the regression runner has network-namespace permissions this
repo's sandbox lacks, that last four should be executed before the next round and
the caveat retired entirely.

**All three warnings are the same shape, and a single pass closes them.** Each is
a test that proves the *headline* of its criterion but leaves one clause of that
criterion's own Verification section unasserted, where the unasserted clause
happens to be covered by a differently-named test elsewhere in the tree. None is
a coverage gap; all three are cheap (two to four lines each) and all three make
the UAT self-sufficient rather than depending on a sibling file nobody reading
the AC would think to look for. Worth batching into one edit of the two test
files.

**AC-1411 carries `status: pending` while its thirteen siblings carry
`status: active`.** It was created by the BUNDLE-20 reconciliation on 2026-08-31
and never advanced. Its behavior is landed, its UATs are written, and this
assessment records `uat_coverage: pass` for it — the status is stale bookkeeping,
not a statement about the work. Not written here because status is not this
prompt's field to move outside deprecation; flagging it so the structural pass
picks it up.

**`.xgd/uat_index.json` is still empty**, now with a fresher timestamp
(`2026-09-09T22:50:28Z`) than the one the last round reported — so it is being
regenerated and coming back empty, rather than simply never written. Every prompt
that resolves tests through `idx['acs']` reads `MISSING` for all 14 ACs here and,
if it trusted the index over the tree, would report a total coverage gap that
does not exist. Unchanged XGD-tooling defect; noted again because two consecutive
assessments have now had to work around it.
