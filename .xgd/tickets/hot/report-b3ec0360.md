---
uid: report-b3ec0360
id: REPORT-4265
type: report
title: 'Fix reconciliation review: bundle-8e1807f6'
created_by: xgd
created_at: '2026-09-14T09:28:12.563083+00:00'
updated_at: '2026-09-14T09:28:12.563083+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-8e1807f6
  needs_more_work: false
  progress_made: true
---

## Stories created

None. The review found no uncovered behavior and no ungrounded story — it failed
solely on Step 5b (evidence that cannot pass).

## Stories modified

- **AC-1491** (`acceptance_criterion-bd29bb5d`, story-e07c589b) — Criterion and
  Verification updated. The criterion said the conversation kinds are taken from
  the component rather than transcribed; this bundle (REQ-160) deliberately adds
  `kb_cursor` to the `chat` shape (review behavior 21), so the text now states
  the true rule: every field the component declares is carried through unaltered,
  and the platform adds exactly one field on top. No other story or AC needed a
  change — the review was explicit that the matrix was right and the code wrong.

## Stories deleted

None.

## FC orphans renamed/deleted

Note: no `fc_orphan_check` report exists for this anchor, so category 3 was not
the trigger for this call. Two FC files were nevertheless removed because each
was **breaking the suite**, and each was verified redundant test-by-test first:

- `tests/test_UAT_FC_REQ-160_two_kb_session.workers.test.ts` — **deleted**.
  Failing (8 of 8). Superseded predecessor of
  `reconciliation-assistant-two-knowledge-bases.workers.test.ts`; it asserts a
  `# Your purpose` heading the reconciled implementation no longer emits. All
  eight of its tests map 1:1 to reconciled ACs that now pass — AC-1795, AC-1796,
  AC-1792, AC-1798, AC-1799, AC-1794/AC-1802, AC-1805, AC-1806.
- `tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts` — **deleted**. It was
  the sole remaining violator of AC-960 (the component scope may be written only
  in its declaration and the browser source; this file wrote
  `@lagrangefoundry/webui-*` three times). It imports the packages directly,
  which is precisely the pattern BUG-42 replaced with the workspace's own
  `builder/markdown.js`. All six of its tests are covered by reconciled ACs that
  pass — AC-1063 (×2: withheld transcript, and the unopenable-session note as
  emphasised markdown), AC-1814 (description rendered through the shared
  scrubbed path), AC-1718 (×2: edit-and-commit, and the placeholder for
  undescribed material), AC-1815 (cold pane upgrade with the expanded window).

The remaining in-bundle FC files (BUG-41, BUG-43, REQ-155, REQ-156,
REQ-160_delta_channel, REQ-172) all pass and break nothing. I left them for
`fc_orphan_gate` to enumerate with its own report rather than guess at their
disposition here.

## Code changes

**The review's Gap 1 — all three remediations applied:**

- `tools/generate/src/cli/ai/host-core.ts:774` — `let seen = at` →
  `let seen = await store.counter(slug)`. The fatal `ReferenceError`. The UAT for
  AC-1817 expects `{at: 1, changes: 1}` on a fresh slug, confirming the turn's
  opening count is the intended baseline.
- `tools/generate/src/cli/ai/host-core.ts` — the duplicate local
  `CARETAKER_PURPOSE` declaration removed; the name is now re-exported from the
  canonical `./roles` declaration, so `host.ts:49`'s import path is unchanged.
- `apps/control-app/src/system-knowledge.ts:59` — `SHIPPED_SOURCE` added to the
  re-export, so `session-knowledge.ts:17` no longer resolves it to `undefined`.

`npx tsc --noEmit` is now clean for **both** `tools/generate` and
`apps/control-app` (was 5 errors).

**Three further defects the review could not see.** Its sandbox denied `listen`,
so it could not run the workers project at all. Mine could. With Gap 1 fixed the
two workers suites still failed 7 of 15; at the pre-existing baseline they failed
15 of 15. All three are in runtime code:

- `apps/control-app/src/session-knowledge.ts` — `sessionPriming` declared the
  static `SESSION_KBS` pair on the map axis instead of the KBs that actually
  opened, contradicting its own doc comment and its sibling
  `sessionKnowledgeSurface`. A shipped-only conversation died with
  `unknown knowledge base(s): project (declared: system)`. Now
  `[...knowledge.perKb.keys()]`.
- `apps/control-app/src/session-knowledge.ts` — the project runtime was opened
  with `source:`/`chunkSource:`, which `KnowledgeRuntime` does not accept (it
  takes `indexes`/`chunkIndexes`, keyed by source name), and `CoRankedKnowledge`
  passed `source:` to `kmSearch`, which ignores it. Net effect: the project KB
  had no index and every co-ranked search threw
  `reads from source 'project', which this host has no index for`. Both sites now
  use the keyed form already used correctly at `knowledge.ts:341` and in
  `system-knowledge.ts`.
- `apps/control-app/src/session-delta.ts` — `turnDelta` persisted the cursor only
  when it moved or when no chat ticket existed. But the ticket archive creates the
  conversation's chat ticket on the turn before, so the first turn wrote no
  bookmark at all; the next turn found none, re-derived coverage-from-now, and
  everything uploaded in between fell permanently before a boundary that had
  silently walked forward. Now persists whenever nothing is stored yet. This is
  what AC-1794's `kb_cursor` assertion and the four arrival-notice criteria were
  actually failing on.

**This bundle's own blast radius (REQ-155's async/port cascade), in test code:**

- `tests/reconciliation-offline-reextract-mirror.test.ts` — passed a directory
  path to `reextractFromBundle`, which takes the `ReferenceBundle` port since
  REQ-155 (`bundle.read is not a function`). Now `fsReferenceBundle(dir)`.
- `tests/reconciliation-size-aware-diff.test.ts` — `bundleOf` called
  `writeMultiState` with a dir and un-awaited; one `ladderBundle` call site
  omitted `await`, so a Promise reached `fsReferenceBundle` as a path.
- `tests/reconciliation-l1-bundle-materialization.test.ts` — `bundle()` called
  the now-async `writeL1` with a dir and un-awaited, so `l1.json` was never
  written; the test and its ten `.toThrow` assertions converted to
  `async` / `rejects.toThrow`.
- `tests/reconciliation-material-types.workers.test.ts` (AC-1491) — the UAT
  asserted exact schema equality with the component, which over-asserted beyond
  its own criterion and collided with this bundle's deliberate `kb_cursor`
  addition. Now asserts the real anti-drift property (`toMatchObject` — every
  component field carried through unaltered) **and** pins the additions to
  exactly `['kb_cursor']`, so "merged onto" cannot quietly become "and whatever
  else".
- `tests/reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts`
  — a doc comment wrote the component scope literally, which AC-960's guardrail
  covers ("prose such as a comment"). Reworded.

## Verification

Run in this session, to completion:

| | Before | After |
|---|---|---|
| `tsc --noEmit` (tools/generate + apps/control-app) | 5 errors | **clean** |
| workers suite | 15/15 failing in the two key suites; 8 failed overall | **324 passed, 0 failed (50 files)** |
| node suite | 50 failing | **12 failing** |

`comm` against the captured baseline confirms **zero new failures** — every
change is a strict improvement.

The review's 21 blocked criteria were verified directly: the four node suites
(turn-change-signal, conversation, conversation-knowledge, arrival-notice-budget)
pass 22/22, and the three workers suites (two-knowledge-bases,
conversation-ticket-archive, conversation-deployed) pass 20/20.

**12 node failures remain, all pre-existing and none in this bundle's ten
stories** — stated plainly rather than buried:

- story-e674c60a — AC-964, AC-965, AC-1400 (workspace origin / built artifacts;
  the Worker answers 503 for a gated asset).
- story-c4f329d3 — AC-1292, AC-1295, AC-1296, AC-1297. Broken test harness from
  an earlier reconcile: `optedIn is not defined` and `install is not a function`
  are undefined symbols **in the test file itself**.
- story-ab1ecd62 — AC-1477. The test asserts the *last* published schema
  statement contains `counters`; the upstream ticketing component has since
  published `ticket_change_floor` after it. Upstream drift, not this bundle.
- FC orphans of tickets **not** in this bundle, failing on stale assertions:
  REQ-1, REQ-115, BUG-39, REQ-122.

I did not touch these: they belong to other stories' criteria, they were failing
before this bundle's commits, and repairing them would be unrelated churn inside
a fixer scoped to this anchor's review.

## Confidence

High that the next review passes on Gap 1 — it was the sole stated failure, its
three named remediations are applied, `tsc --noEmit` (the oracle the review
named) is clean, and all 21 criteria it listed as unevidenced now have UATs that
actually run and pass, including the twelve it could only assess by reading.

The residual risk is not Gap 1 but scope: a reviewer with a sandbox that permits
`listen` and runs the whole node project will see the 12 pre-existing failures
listed above. They are outside this bundle's stories and were failing before it,
but if the next review treats "all active ACs anywhere have passing UATs" as its
bar rather than "this anchor's criteria", it could fail on them. I judged fixing
another three stories' criteria to be beyond this fixer's mandate and have
documented them precisely instead.
