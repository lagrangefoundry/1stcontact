---
uid: report-86fe6cea
id: REPORT-4264
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-09-14T08:45:49.923510+00:00'
updated_at: '2026-09-14T08:45:49.923510+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-8e1807f6
  anchor_uid: bundle-8e1807f6
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: (n/a)
**Anchor**: bundle-8e1807f6
**Stories Reviewed**: 10 (9 distinct in the dispatched list — story-0cb7f25b,
story-046cfc56, story-e15a19ef, story-d5167ced, story-a58a0974, story-3cf3d57b,
story-6ccaedd5, story-1500b111, story-7f437d57 — plus story-4cabde9a, item 7's
second target, which the dispatched list omits)

This is the **second** review of this anchor. REPORT-4261 failed on one gap
(AC-1819 left at the creation default with no UAT); REPORT-4262 fixed it. I
confirmed that fix and then found a different, larger problem that the first
review could not have seen, because the suite that exposes it was not among the
ones it ran.

## What was read, and what was executed

Intent first: the whole 66,290-char `bundle-8e1807f6` body — all eight source
tickets (REQ-155, BUG-40, REQ-160, BUG-41, BUG-42, REQ-172, REQ-156, BUG-43)
including each ticket's appended mid-implementation corrections. Then the code,
independently. Then the ten stories and all 72 acceptance criteria on them.

Executed in this session (node project):

| Suites | Result |
|---|---|
| `reconciliation-reference-bundle-storage`, `-in-repo-png-codec`, `-1c-install-preflight`, `-1c-crop-offline-verb`, `-platform-asset-tree-swap` | 35 passed, 1 failed (AC-1775, `listen EPERM` — environmental) |
| `reconciliation-library-reader`, `-library-tab`, `-builder-markdown-readiness`, `-assistant-arrival-notice-budget` | 14 passed |
| `test_UAT_FC_REQ-160_delta_channel` | 9 passed |
| `reconciliation-assistant-conversation-knowledge` | **2 failed** — `ReferenceError: at is not defined` |
| `reconciliation-assistant-turn-change-signal`, `-assistant-conversation` | could not run — `listen EPERM` |
| `npx tsc --noEmit` (tools/generate) | **5 errors** |

This session's sandbox denies `listen`, so the entire workers project is
unrunnable here and two node suites that start a real builder server time out.
Those were assessed by reading. **Stated plainly so it is not mistaken for a pass
I observed.**

## Behavior Inventory

38 behaviours, independently verified in the tree (not taken from the plan).
Spot-verified this session at the named sites:

| # | Behavior | Verified at |
|---|----------|-------------|
| 1-3 | `ReferenceBundle`/`ReferenceStore`/`ReferenceStoreRoot` port; three backings; `forTenant` + `t/<tenant>/ref/<name>/<member>` | `tools/generate/src/store/{reference-store,fs-,r2-,memory-reference-store}.ts` |
| 4-7 | No `node:` import in `capture/bundle.ts`; async cascade; `reextract` node-only; `--ref` polymorphism in the CLI | `capture/{bundle,reextract}.ts`, `perceptual.ts` |
| 8-14 | PNG decode/encode over `DecompressionStream('deflate')`; sRGB expansion; five filters + split IDAT + sub-byte depths; three named refusals; greyscale heatmaps; `perceptual-core.ts` split verbatim; no `sharp` under `tools/generate/src` | `cli/png.ts`, `cli/perceptual-core.ts`, `tests/fixtures/png/` |
| 15 | Preflight map = 7 verbs, each naming `playwright` alone; `crop` has no entry | `cli/preflight.ts` |
| 16-17 | `1c assets` stages and swaps: `rmSync(retired)` → `rename(out→retired)` → `rename(stage→out)` → `rmSync(retired)` | `cli/assets.ts:597-600` |
| 18-21 | `TicketSessionArchive` over the D1 ticket store; `R2TranscriptArchive` gone; `kb_cursor` on the chat schema; node keeps `FileArchive` | `apps/control-app/src/ai.ts:98`, `tickets.ts` |
| 22-28 | Both landscapes in one section (project first); `coRank` fan-out + merge on the component's own scores; per-turn `changedSince`→`deltaLine`→advance; cap with exact count; boundary uids; chat tickets excluded from the delta alone; delta last in the reminder | `session-knowledge.ts`, `session-delta.ts`, `roles.ts` |
| 29-32 | `resolveContentType` repairs absent/octet-stream only; called once at `ingest()`'s head; `content_type` on the row with a filename fallback for legacy rows; front-matter title | `material.ts:226,421,460,471,692-697` |
| 33 | `builder/markdown.js` owns both engines; `markdownReady` never rejects; re-exports `renderSafe`/`setParser`/`setSanitizer` | `builder/markdown.js` |
| 34-35 | Reader selects by content type, PDF gets an `<iframe>` at the file route, `markdownReady.then(repaint)`, `destroy()`; description cell painted as rendered markdown | `builder/reader.js:40,106-116,163-166,185-187,229,269`, `builder/library.js` |
| 36-38 | `SITE_CHANGED` yielded after each `tool_activity` when the counter moved; no declared L1 operation for it; `app.js` passes the same `reload()` | `cli/ai/host-core.ts:753-795`, `builder/app.js` |

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1-7 | Reference bundle storage port, three backings, tenancy, async cascade, `reextract` node-only, `--ref` polymorphism | Covered | story-0cb7f25b | AC-1762…AC-1775. Out-of-scope decisions (repro/adopt-gaps still fs-only, no delete verb, non-atomic fs write) stated in the story and deliberately not made ACs. |
| 8-14 | PNG codec, sRGB expansion, decode paths, three named refusals, greyscale heatmaps, pure core, sharp gone | Covered | story-046cfc56 | AC-1776…AC-1789. Executed: all pass. |
| 15 | Preflight membership: 7 verbs / `playwright` only, `crop` offline | Covered | story-e15a19ef | AC-1013/AC-1017 restated; AC-1790 added for the observable. Executed: pass. |
| 16-17 | Atomic asset swap | Covered | story-d5167ced | AC-1791 added (Verification tightened by REPORT-4262); AC-1331 split into its two true legs. |
| 18-21 | Conversation as a chat ticket, CAS, tenancy via `forTenant`, cursor's home, CLI keeps its file archive | **Covered but unevidenced** | story-a58a0974 | AC-1792/1793/1794 added; AC-1057/1405/1409 restated. See Gap 1 — every covering UAT drives a turn. |
| 22-28 | Two-KB seeding, co-ranked search, per-turn delta, cap, count, cursor semantics, self-exclusion, ordering | **Partially evidenced** | story-3cf3d57b | AC-1795…AC-1808. AC-1800/1801 executed and pass; the other twelve route through `/api/ai/prompt`. See Gap 1. |
| 29-30, 32 | Content type resolved once at the head; front-matter title | Covered | story-6ccaedd5 + story-4cabde9a | AC-1682 restated; AC-1809/1810 added; AC-1689/1694 restated on the description story. The split is correct — the "once, at the head, for all three consumers" claim is only observable at the ingestion boundary. |
| 31, 34-35 | Document reader, expand-to-modal, `content_type` on the row, rendered description | Covered | story-1500b111 | AC-1811…AC-1815 added; AC-1717/1718 restated. Executed (node half): pass. |
| 33 | One engine pair for the workspace, readiness settles either way | Covered | story-7f437d57 | AC-1816 added; AC-1063 gains the ordering precondition. Executed: pass. |
| 36-37 | Host-produced per-write change signal, unskippable by the model | **Covered but unevidenced** | story-a58a0974 | AC-1817/1818 added; AC-1054 restated. See Gap 1. |
| 38 | The pane acts on the signal by re-fetching the displayed page | Covered | story-7f437d57 | AC-1819 now `active` with `test_UAT_AC1819_*` in `reconciliation-builder-markdown-readiness.test.ts`. **REPORT-4261's Gap 1 is resolved** — executed this session, passes. |
| — | BUG-40 cause 1 (half-finished `pnpm install`) | Not covered — correctly | — | Environmental. No product behaviour, no matrix delta. |
| — | BUG-40 cause 3 (eleven superseded UATs) | Covered | — | The re-pins moved *tests*, not criteria; only AC-1331 needed text, and item 4 changed it. |
| — | REQ-155's ~40-suite `await` cascade | Covered by the stories that own those suites | — | Predicted by REQ-155's own "Blast radius". |

## Intent Fidelity

Two pieces the intent declares and the code does **not** deliver. Both are
flagged rather than absorbed, and I re-verified both absences in the tree:

1. **REQ-156 AC5** (`1c gate` end-to-end in workerd). `cmdGate` still resolves
   its reference with `fsReferenceBundle(opts.ref)`
   (`tools/generate/src/cli/gate.ts:433`, import at `:55`). story-046cfc56's
   Technical Context states it flatly — *"unblocked is not delivered, and no
   criterion of this story may claim it"* — and no AC claims it. Correct.
2. **REQ-160's declared change-feed operation.** No `KnowledgeChanges` /
   change-feed declaration exists in `session-knowledge.ts` or
   `session-delta.ts`. story-3cf3d57b's Reconciliation Decisions record it as
   scoped out by the intent's own *Depends on* section and explicitly do not
   formalize it; AC-1800 stops at truncation and the exact count. Correct.

Intent-silent behaviour formalized into ACs is recorded under
`## Reconciliation Decisions` in every story that formalized any, each with a
date and a rationale. **No unattributed claims found. No absorbed divergence
found.** story-e15a19ef additionally flags a code/documentation contradiction
(the CLI's `USAGE` text still lists `crop` among the preflight-gated verbs) with
an explicit *"do NOT encode this as an AC"* — the right call under the chain of
authority.

The stories' handling of the Gap 1 defect is likewise **correct on fidelity
grounds**: story-a58a0974's Technical Context names all three compile errors,
says "the intent is unambiguous, so the criteria are written to it and the code
is what is wrong", and declines to change runtime code. That is exactly what
reconciliation should do. This review does not fail on fidelity; it fails on
evidence (Step 5b).

## Ungrounded Stories

None. Every story claim I sampled resolved to code at the site named in the
behavior inventory. No story describes behaviour neither intent nor code
supports.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Reference bundle storage (1c capture) | story-0cb7f25b (STORY-147, new) | OK — AC-1762…AC-1775 |
| 2. PNG codec and the fidelity arithmetic core | story-046cfc56 (STORY-148, new) | OK — AC-1776…AC-1789 |
| 3. 1c install preflight and declared dependencies | story-e15a19ef (STORY-79) | OK — AC-1790 added, AC-1013/1017 restated |
| 4. Platform build: generated asset stage | story-d5167ced (STORY-119) | OK — AC-1791 added, AC-1331 split |
| 5. Session storage: the conversation as a chat ticket | story-a58a0974 (STORY-103) | OK — AC-1792/1793/1794 added, AC-1057/1405/1409 restated |
| 6. Session seeding across both KBs, and the per-turn delta | story-3cf3d57b (STORY-149, new) | OK — AC-1795…AC-1808 |
| 7. Material ingestion: content type resolved from the filename | story-6ccaedd5 (STORY-140) + story-4cabde9a (STORY-141) | OK — both targets updated |
| 8. Library detail: the document reader | story-1500b111 (STORY-144) | OK — AC-1811…AC-1815 added, AC-1717/1718 restated |
| 9. Assistant pane: markdown engines settle before the transcript paints | story-7f437d57 (STORY-104) | OK — AC-1816 added, AC-1063 restated |
| 10. The preview follows the assistant's writes | story-a58a0974 + story-7f437d57 | OK — AC-1817/1818 active on the host, **AC-1819 now active with its UAT** |

Ten `reconciliation_story_generation` reports exist on the anchor, one per item.
**No plan item was dropped.** All 72 criteria across the ten stories are
`active`; none is left at the creation default.

## Evidence Sufficiency (Step 5b)

Every active AC in this bundle carries a `test_UAT_AC{N}_*` UAT — **AC-1762
through AC-1819, with no holes**, plus the restated AC-1013, AC-1017, AC-1063,
AC-1066, AC-1054, AC-1057, AC-1331, AC-1405, AC-1409, AC-1682, AC-1689, AC-1694,
AC-1717, AC-1718. I re-derived that mapping mechanically from the ticket store
against a full scan of `tests/`. No AC has no UAT.

On *validity* — no source-inspection-only evidence, no internal mocking, no UAT
that would pass with its behaviour removed, among the criteria I checked. The
UAT for AC-1817 is notably good: it asserts the interleaved event *order*
(activity, signal, activity, signal, text, completion) rather than a total, so it
would fail an implementation that collected signals at the end of the turn.

On *passing* — this is where it fails. See Gap 1.

## Gaps

### Gap 1 (the failure) — the turn stream throws on every turn, so 21 active ACs have evidence that cannot pass

**Observed at runtime, not inferred:**

```
FAIL |node| tests/reconciliation-assistant-conversation-knowledge.test.ts
ReferenceError: at is not defined
 ❯ streamPrompt tools/generate/src/cli/ai/host-core.ts:774:14
    774|   let seen = at
```

`tools/generate/src/cli/ai/host-core.ts:774` reads `let seen = at`, and nothing
named `at` is in scope in `streamPrompt`. The comment two lines above says
"`at` itself must survive for the baseline arithmetic" — it did not. The only
`at` binding in the module is `const at` inside `reminderFor`
(`host-core.ts:644`), a different function. `streamPrompt` therefore throws
before it yields a single event, on **both** hosts:

- node: `tools/generate/src/cli/ai/host.ts:235` → `streamPromptCore`
- workerd: `apps/control-app/src/router.ts:1134` (the `/api/ai/prompt` route)

**Why this is a Step 5b failure and not a note.** No turn can complete, so every
UAT whose scenario is "drive a turn" fails or errors. That is 21 of this
bundle's active criteria:

| Story | Criteria | Covering UAT |
|---|---|---|
| story-a58a0974 (STORY-103) | AC-1054, AC-1817, AC-1818 | `tests/reconciliation-assistant-turn-change-signal.test.ts` |
| story-a58a0974 | AC-1057, AC-1405 | `reconciliation-assistant-conversation.test.ts`, `-conversation-deployed.workers.test.ts` |
| story-a58a0974 | AC-1409 | `reconciliation-assistant-conversation-deployed.workers.test.ts` (`/api/ai/prompt` at :307, :388, :438, :572, :616) |
| story-a58a0974 | AC-1792, AC-1793, AC-1794 | `reconciliation-assistant-conversation-ticket-archive.workers.test.ts` (`/api/ai/prompt` at :273) |
| story-3cf3d57b (STORY-149) | AC-1795, AC-1796, AC-1797, AC-1798, AC-1799, AC-1802, AC-1803, AC-1804, AC-1805, AC-1806, AC-1807, AC-1808 | `reconciliation-assistant-two-knowledge-bases.workers.test.ts` (`/api/ai/prompt` at :275, :642) |

AC-1800 and AC-1801 are the exception on STORY-149 — their UAT
(`reconciliation-assistant-arrival-notice-budget.test.ts`) exercises the delta
arithmetic directly and **passes**. AC-1063/1066/1816/1819 on STORY-104 use an
injected transport and **pass**.

BUG-43's whole deliverable — "the page updates while the assistant works" —
therefore does not work at all in the shipped tree, and REQ-160's two-KB session
cannot take a turn either. The matrix asserts both as delivered.

**Nothing downstream will catch this automatically.** The scoped quality gate on
this branch reports `"No tsconfig.json — type-check skipped (JS-only project)"`
and `"suites": {}` (REPORT-4263, REPORT-4259, REPORT-4256 — every scoped quality
report in this reconcile is `pass (0 tests, 0 failed)`). The worktree root has
`tsconfig.base.json` but no `tsconfig.json`, so the build/typecheck step is
inert, and no suites are configured, so the test step runs nothing. That is why
the defect has survived a story cycle, a review, a `fix_reconciliation_review`
and a `reconciliation_test_fix` untouched.

**Remediation (three edits, all in runtime code):**

1. **`tools/generate/src/cli/ai/host-core.ts:774` — fatal.** Bind the counter
   before the loop. The intent (BUG-43) and the criterion (AC-1817) both want
   the turn's opening count as the first baseline, so:
   `let seen = await store.counter(slug)` — or restore the
   `const at = await store.counter(slug)` the comment assumes and leave `:774`
   alone. `store` and `slug` are already in scope two lines above.
2. **`tools/generate/src/cli/ai/host-core.ts:55` and `:283` — type error, not
   currently fatal at runtime.** `CARETAKER_PURPOSE` is both imported from
   `./roles` and declared locally. The two string literals are byte-identical
   today, which is precisely how they will silently drift. `roles.ts:159` is the
   canonical declaration (`tests/reconciliation-assistant-conversation-knowledge.test.ts:41`
   imports it from there). Delete one; note `host.ts:49` imports the name from
   `./host-core`, so if the local declaration goes, host-core must re-export it
   or `host.ts` must take it from `./roles`.
3. **`apps/control-app/src/session-knowledge.ts:17` — type error, silently
   degrading.** It imports `SHIPPED_SOURCE` from `./system-knowledge`, which
   imports the name from `../../../tools/generate/src/cli/kb-model` but does not
   export it (`system-knowledge.ts:59` exports `SYSTEM_KB` alone). Under Vite's
   SSR transform this resolves to `undefined` rather than throwing, so
   `session-knowledge.ts:394`'s re-export hands consumers `undefined`. Either
   re-export it from `system-knowledge.ts` or import it directly from
   `kb-model`.

`npx tsc --noEmit` in `tools/generate` reports exactly these five errors and
nothing else; it is green when they are fixed.

**No matrix change is required by this gap.** The criteria are written to the
intent and the intent is unambiguous — story-a58a0974 is right about that, and
its Technical Context note should stay until the code is fixed. What is wrong is
the code, and the reconcile cannot honestly certify criteria whose evidence
cannot run.

**One process note for the fixer.** story-a58a0974 routes this to
`fix_uat_coverage`, but `fix_uat_coverage` is not a state in
`reconciliation.yaml` — the reconcile FSM goes `reconciliation_review` →
`fc_orphan_gate` → `code_review_state` → `auto_merge_back_state`, and on failure
→ `fix_reconciliation_review` → `reconciliation_test_fix` → back here. So the
named destination does not exist on this path; this fix loop is where it has to
land.

## Judgment Calls

- **Failing on a production-code defect from a matrix review — deliberate.**
  Step 5b is in this review's scope and its PASS bar is "all active ACs have
  passing UATs". Twenty-one do not, and the cause is one line. I considered
  passing and leaving it to `code_review_state`, which does read code and can
  fix it — but the quality gate on this branch runs zero tests and skips the
  typecheck, so there is no mechanical net beneath this review, and a silent
  merge-back of a conversation host that throws on every turn is the outcome
  this gate exists to prevent.
- **AC-1775's failure is environmental and is not counted.** It drives a real
  loopback navigation of mirrored bytes by design — that *is* the criterion —
  and this sandbox denies socket binds. Same as REPORT-4261 found.
- **REPORT-4261's Gap 1 is genuinely closed.** AC-1819 is `active`, its UAT
  exists in `reconciliation-builder-markdown-readiness.test.ts`, and I ran that
  suite: 3 passed, `WEBUI_INSTALLED` true. REPORT-4262's UAT is a *stronger*
  port than the remediation asked for (it asserts the `[0,0,1,1,2,2]`
  interleaving sequence rather than a total), which is a deviation in the right
  direction. I also confirmed its second edit: the NUL/SOH literals in the two
  workers suites are now unicode escapes and both files are visible to `grep`.
- **AC-1791's Verification rewrite — accepted.** REPORT-4262 tightened the
  over-claiming "no read is answered not-found" clause even though REPORT-4261
  said it did not warrant a cycle. The Criterion body is untouched and the new
  Verification matches what `test_UAT_AC1791_*` asserts. Better than the
  original.
- **BUG-40's eleven re-pins collapsing to one plan item — accepted.** The
  earlier reconciliations had already moved the criteria; BUG-40 moved the
  tests to catch up. Only AC-1331 needed text.
- **REQ-155 and REQ-156 as features, not refactors — accepted.** The matrix said
  nothing at all about where a capture bundle lives or how bytes become pixels.
  The reuse-first bias was applied where it bites: item 3 pulled the preflight
  consequence out into an upgrade of STORY-79.
- **BUG-42 split across items 8 and 9 — accepted.** Two surfaces, two
  capabilities, two different failures.
- **Item 7 targeting two stories — accepted and verified.** story-4cabde9a was
  omitted from the dispatched list but was updated; AC-1689/AC-1694 landed.

## Verdict

**FAIL** — on evidence sufficiency, not on coverage or fidelity.

The matrix work in this bundle is, with one exception, excellent: all ten plan
items produced output, every criterion is active and carries a behavioural UAT
that enters through a real boundary, both undelivered intent pieces (REQ-156 AC5,
REQ-160's change-feed operation) are flagged with their code absence rather than
absorbed, every intent-silent formalization is attributed under
`## Reconciliation Decisions` with a date and a reason, and one
code/documentation contradiction is correctly routed away from the criteria. A
developer reading these stories would have an accurate picture of what the
operator intended to build.

What they would *not* have is a working system. `streamPrompt` throws
`ReferenceError: at is not defined` on its first statement, so no turn completes
on either host, and 21 active criteria across STORY-103 and STORY-149 — the whole
of BUG-43's host half and almost all of REQ-160 — are asserted by UATs that
cannot pass. The stories are right and the code is wrong; the fix is three edits
in runtime code, listed above with file and line, and `tsc --noEmit` is the
oracle for all three.

**Verification caveat, stated rather than buried:** this session's sandbox denies
`listen`, so the workers project could not be executed at all and two node suites
that start a builder server time out. The `ReferenceError` itself was observed at
runtime in a suite that *did* run; which suites it blocks was established by
reading the call path (`host.ts:235` and `router.ts:1134` both reach
`streamPrompt`, and every listed suite posts to `/api/ai/prompt` or drives a turn
directly). AC-1775's failure is the same socket restriction and is not a product
defect.
