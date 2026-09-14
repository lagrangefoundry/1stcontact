---
uid: report-902ce086
id: REPORT-4267
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-09-14T09:38:48.636039+00:00'
updated_at: '2026-09-14T09:38:48.636039+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-8e1807f6
  anchor_uid: bundle-8e1807f6
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: (n/a)
**Anchor**: bundle-8e1807f6
**Stories Reviewed**: 10 (the 9 distinct UIDs in the dispatched list — story-0cb7f25b,
story-046cfc56, story-e15a19ef, story-d5167ced, story-a58a0974, story-3cf3d57b,
story-6ccaedd5, story-1500b111, story-7f437d57 — plus story-4cabde9a, item 7's
second target, which the dispatched list omits)

This is the **third** review of this anchor. REPORT-4261 failed on AC-1819 (left at
the creation default, no UAT); REPORT-4262 fixed it. REPORT-4264 confirmed that and
failed on a larger, different problem — a fatal `ReferenceError` in `streamPrompt`
that made 21 active criteria unevidenceable. REPORT-4265 fixed that. This review
confirms the second fix and finds no further gap.

## What was read, and what was executed

Intent first: the 66,290-char `bundle-8e1807f6` body — all eight source tickets
(REQ-155, BUG-40, REQ-160, BUG-41, BUG-42, REQ-172, REQ-156, BUG-43) with their
appended mid-implementation corrections. Then the code, independently, at the sites
named below. Then the ten stories and all 72 acceptance criteria, read from the
ticket store directly.

Executed in this session, to completion:

| Suites | Result |
|---|---|
| `reconciliation-reference-bundle-storage`, `-in-repo-png-codec`, `-1c-install-preflight`, `-1c-crop-offline-verb`, `-platform-asset-tree-swap` | **35 passed, 1 failed** (AC-1775, `listen EPERM` — environmental) |
| `reconciliation-assistant-conversation-knowledge`, `-assistant-arrival-notice-budget`, `-builder-markdown-readiness`, `-library-reader`, `-library-tab` | **18 passed, 0 failed** (5 files) |
| `reconciliation-assistant-arrival-notice-budget`, `-assistant-conversation`, `-assistant-turn-change-signal`, `-builder-assistant-pane`, `-builder-markdown-readiness`, `-library-reader`, `-library-tab` | **23 passed, 16 skipped**; 2 files could not start (`listen EPERM` in `beforeAll`) |
| `reconciliation-platform-build-deploy-smoke` | **13 passed** |
| `npx tsc --noEmit` (`tools/generate`) | **clean** (exit 0) |
| `npx tsc --noEmit` (`apps/control-app`) | **clean** (exit 0) |
| workers project (all 50 files) | **could not run** — `listen EPERM` at miniflare startup |

**Verification caveat, stated rather than buried.** This session's sandbox denies
`listen`, exactly as REPORT-4264's did. The whole workerd project is therefore
unrunnable here, and the two node suites that start a real `startBuilder` server
(`-assistant-conversation`, `-assistant-turn-change-signal`) time out in `beforeAll`
and skip their tests. Those were assessed by reading, plus REPORT-4265's own full
run. This is **not** mistaken for a pass I observed.

## Behavior Inventory

38 behaviours, spot-verified independently in the tree this session (not taken from
the plan):

| # | Behavior | Verified at |
|---|----------|-------------|
| 1-3 | `ReferenceBundle`/`ReferenceStore`/`ReferenceStoreRoot`; three backings; `forTenant` + `t/<tenant>/ref/<name>/<member>` | `tools/generate/src/store/{reference-store,fs-,r2-,memory-reference-store}.ts` |
| 4-7 | No `node:` import in `capture/bundle.ts`; async cascade; `reextract` node-only; `--ref` polymorphism in the CLI | `capture/{bundle,reextract}.ts` |
| 8-14 | PNG decode/encode over `DecompressionStream('deflate')`; sRGB expansion; five filters, split IDAT, sub-byte depths; three named refusals; greyscale heatmaps; `perceptual-core.ts` split verbatim | `cli/png.ts`, `cli/perceptual-core.ts`, `tests/fixtures/png/` |
| 15 | Preflight map is exactly `capture, shot, values-diff, adopt-gaps, diff, gate, aligned-crops`, each naming `playwright` alone; `crop` has no entry; `sharp` absent from `tools/generate/package.json` | `cli/preflight.ts:70-76` |
| 16-17 | `1c assets` stages and swaps: `rmSync(retired)` → `rename(out→retired)` → `rename(stage→out)` → `rmSync(retired)` | `cli/assets.ts:551,596-600` |
| 18-21 | `TicketSessionArchive` over the D1 ticket store; `R2TranscriptArchive` gone; `kb_cursor` on the chat schema; node keeps `FileArchive` | `apps/control-app/src/ai.ts`, `tickets.ts` |
| 22-28 | Both landscapes in one section, project first; `coRank` fan-out merged on the component's own scores; per-turn `changedSince`→`deltaLine`→advance; cap with exact count; boundary uids; chat tickets excluded from the delta alone; delta last in the reminder | `session-knowledge.ts`, `session-delta.ts`, `roles.ts` |
| 29-32 | `resolveContentType` repairs absent/octet-stream only, called once at `ingest()`'s head; `content_type` on the row with a filename fallback for legacy rows; front-matter title | `material.ts:226,421,697` |
| 33 | `builder/markdown.js` owns both engines; `markdownReady` never rejects; `showSite` awaits it in parallel with `openSession`; the failure branch waits too | `builder/markdown.js`, `builder/app.js:357,362` |
| 34-35 | Reader selects by content type, PDF in a frame, `markdownReady.then(repaint)`, `destroy()`; description cell painted through the shared `renderSafe` seam | `builder/reader.js:40,116,187,229`, `builder/library.js` |
| 36-38 | `SITE_CHANGED` yielded after each `tool_activity` when the counter moved; no declared L1 operation for it; `app.js` passes the same `reload()` | `cli/ai/host-core.ts:765-782`, `builder/app.js` |

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1-7 | Reference bundle port, three backings, tenancy, async cascade, `reextract` node-only, `--ref` polymorphism | Covered | story-0cb7f25b | AC-1762…AC-1775. Out-of-scope decisions (repro/adopt-gaps still fs-only, no delete verb, non-atomic fs write) stated in the story and deliberately not made ACs. |
| 8-14 | PNG codec, sRGB expansion, decode paths, named refusals, greyscale heatmaps, pure core | Covered | story-046cfc56 | AC-1776…AC-1789. Executed: all node-side pass. |
| 15 | Preflight membership: 7 verbs / `playwright` only, `crop` offline, `sharp` undeclared | Covered | story-e15a19ef | AC-1013/AC-1017 restated; AC-1790 added. Executed: pass. Verified against `preflight.ts` directly. |
| 16-17 | Atomic asset swap | Covered | story-d5167ced | AC-1791 added; AC-1331 split into its two true legs. Executed: both pass (13 tests). |
| 18-21 | Conversation as a chat ticket, CAS, tenancy via `forTenant`, cursor's home, CLI keeps its file archive | Covered | story-a58a0974 | AC-1792/1793/1794 added; AC-1057/1405/1409 restated. Workers-side evidence read, not executed (see caveat). |
| 22-28 | Two-KB seeding, co-ranked search, per-turn delta, cap, count, cursor semantics, self-exclusion, ordering | Covered | story-3cf3d57b | AC-1795…AC-1808. AC-1800/1801 executed and pass; the other twelve route through `/api/ai/prompt` in the workers project. |
| 29-30, 32 | Content type resolved once at the head; front-matter title | Covered | story-6ccaedd5 + story-4cabde9a | AC-1682 restated; AC-1809/1810 added; AC-1689/1694 restated on the description story. The split is correct — "once, at the head, for all three consumers" is only observable at the ingestion boundary. |
| 31, 34-35 | Document reader, expand-to-modal, `content_type` on the row, rendered description | Covered | story-1500b111 | AC-1811…AC-1815 added; AC-1717/1718 restated. Executed (node half): pass. |
| 33 | One engine pair for the workspace, readiness settles either way | Covered | story-7f437d57 | AC-1816 added; AC-1063 gains the ordering precondition. Executed: pass. |
| 36-37 | Host-produced per-write change signal, unskippable by the model | Covered | story-a58a0974 | AC-1817/1818 added; AC-1054 restated. |
| 38 | The pane acts on the signal by reloading the displayed page | Covered | story-7f437d57 | AC-1819 active with `test_UAT_AC1819_*`. Executed: pass. |
| — | BUG-40 cause 1 (half-finished `pnpm install`) | Not covered — correctly | — | Environmental. No product behaviour, no matrix delta. |
| — | BUG-40 cause 3 (eleven superseded UATs) | Covered | — | The re-pins moved *tests*, not criteria; only AC-1331 needed text, and item 4 changed it. |
| — | REQ-155's ~40-suite `await` cascade | Covered by the stories that own those suites | — | Predicted by REQ-155's own "Blast radius" section. |

No uncovered behaviour found. No partially-covered behaviour found.

## Intent Fidelity

Two pieces the intent declares and the code does **not** deliver. Both are flagged
rather than absorbed, and I re-verified both absences in the tree this session:

1. **REQ-156 AC5** (`1c gate` end-to-end in workerd). `cmdGate` still resolves its
   reference with `fsReferenceBundle(opts.ref)` — confirmed at
   `tools/generate/src/cli/gate.ts:433`, import at `:55`. story-046cfc56's Technical
   Context states it flatly (*"unblocked is not delivered, and no criterion of this
   story may claim it"*) and no AC claims it. **Correct.**
2. **REQ-160's declared change-feed operation.** Grepping `session-knowledge.ts` and
   `session-delta.ts` for `changeFeed` / `change_feed` / `changesSince` /
   `KnowledgeChanges` returns nothing. story-3cf3d57b's Reconciliation Decisions
   record it as scoped out by the intent's own *Depends on* section
   (lagrange-framework REQ-112, "genuinely blocked and waits") and explicitly decline
   to formalize it; AC-1800 stops at truncation and the exact count. **Correct.**

Every one of the ten stories carries a dated `## Reconciliation Decisions` section
(2026-09-13 / 2026-09-14) attributing each intent-silent formalization with a
rationale. **No unattributed claims found. No absorbed divergence found.**

story-e15a19ef additionally flags a code/documentation contradiction — the CLI's
`USAGE` text still lists `crop` among the preflight-gated verbs — with an explicit
*"do NOT encode this as an AC"*. That is the right call under the chain of authority:
it is a docs defect, not a criterion.

## Ungrounded Stories

None. Every story claim I sampled resolved to code at the site named in the behavior
inventory. No story describes behaviour neither intent nor code supports.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Reference bundle storage (1c capture) | story-0cb7f25b (STORY-147, new, feature) | OK — AC-1762…AC-1775 |
| 2. PNG codec and the fidelity arithmetic core | story-046cfc56 (STORY-148, new, feature) | OK — AC-1776…AC-1789 |
| 3. 1c install preflight and declared dependencies | story-e15a19ef (STORY-79, upgrade) | OK — AC-1790 added, AC-1013/1017 restated |
| 4. Platform build: generated asset stage | story-d5167ced (STORY-119, upgrade) | OK — AC-1791 added, AC-1331 split |
| 5. Session storage: the conversation as a chat ticket | story-a58a0974 (STORY-103, upgrade) | OK — AC-1792/1793/1794 added, AC-1057/1405/1409 restated |
| 6. Session seeding across both KBs, and the per-turn delta | story-3cf3d57b (STORY-149, new, feature) | OK — AC-1795…AC-1808 |
| 7. Material ingestion: content type resolved from the filename | story-6ccaedd5 (STORY-140) + story-4cabde9a (STORY-141), upgrade | OK — both targets updated |
| 8. Library detail: the document reader | story-1500b111 (STORY-144, upgrade) | OK — AC-1811…AC-1815 added, AC-1717/1718 restated |
| 9. Assistant pane: markdown engines settle before the transcript paints | story-7f437d57 (STORY-104, upgrade) | OK — AC-1816 added, AC-1063 restated |
| 10. The preview follows the assistant's writes | story-a58a0974 + story-7f437d57 | OK — AC-1817/1818 on the host, AC-1819 on the pane |

Ten `reconciliation_story_generation` reports exist on the anchor (REPORT-4227,
4231, 4235, 4238, 4241, 4244, 4248, 4251, 4254, 4257) — one per item. **No plan item
was dropped.** Story types match the plan exactly: 3 feature, 7 upgrade.

## Evidence Sufficiency (Step 5b)

All **72 active criteria** across the ten stories carry a `test_UAT_AC{N}_*` UAT.
I re-derived that mapping mechanically from the ticket store against a full scan of
`tests/`, including `tests/support/`.

**One correction to the mechanical scan, worth recording.** A scan restricted to
`tests/**/*.test.ts` reports five criteria with no UAT — AC-1768, AC-1769, AC-1770,
AC-1771, AC-1774, all on story-0cb7f25b. They are not missing. They live in the
shared contract body `tests/support/reference-bundle-contract.ts:90-195`, which
`registerReferenceBundleContract` mounts against the filesystem and in-memory
backings in `reconciliation-reference-bundle-storage.test.ts:81,99` and against R2 in
`reconciliation-reference-bundle-storage.workers.test.ts:75`. Each of those five is
therefore asserted three times, once per backing, which is stronger than a per-suite
UAT and is exactly what the story's "one shared contract body asserted against each"
claim requires. The node-side two-thirds executed and passed this session.

On **validity** — no source-inspection-only evidence, no internal mocking, no UAT
that would pass with its behaviour removed, among the criteria I checked:

- `reconciliation-assistant-turn-change-signal.test.ts` drives real HTTP against a
  real `startBuilder` — real session manager, real role assembly, real tool loop,
  real `edit.ts` writes against the filesystem store, real SSE. One double, the
  Anthropic client, which is the network. AC-1817 asserts the interleaved event
  *order* (`tool_activity, site_changed, tool_activity, site_changed, text, done`)
  rather than a total, so it fails an implementation that collected signals at the
  end of the turn. AC-1818 asserts the property from both sides — a silent
  assistant's write is announced; a talkative assistant's non-write is not — and
  additionally asserts that no offered operation matches
  `/reload|refresh|announce|notify|signal|changed/`, which is the criterion's whole
  point.
- `reconciliation-assistant-two-knowledge-bases.workers.test.ts` enters through the
  real `route` with real D1 and R2 via `cloudflare:test`; only the model client and
  the embedder are stubbed, both external boundaries. AC-1798 — the sentence the
  story exists for — asserts the map is `null` **before and after** the turn, that
  the document is named in the singular, and that it is retrievable through an
  ordinary search. It could not pass with the delta channel removed.
- `reconciliation-assistant-conversation-ticket-archive.workers.test.ts` posts to
  the real `/api/ai/prompt` against a real D1 ticket store.

## Gaps

**None.** REPORT-4264's Gap 1 is resolved, verified three independent ways:

1. **The fatal line is gone.** `tools/generate/src/cli/ai/host-core.ts:769` now reads
   `let seen = await store.counter(slug)` where it read `let seen = at`.
2. **The oracle REPORT-4264 itself named is green.** `npx tsc --noEmit` exits 0 for
   **both** `tools/generate` and `apps/control-app` (was 5 errors). The other two
   remediations are confirmed in place: `CARETAKER_PURPOSE` is declared once at
   `roles.ts:159` and re-exported from `host-core.ts:281`, so `host.ts:49`'s import
   path is unchanged; `SHIPPED_SOURCE` is re-exported at `system-knowledge.ts:59`.
3. **The suite that demonstrated the defect now passes.**
   `tests/reconciliation-assistant-conversation-knowledge.test.ts` — the suite in
   which REPORT-4264 observed `ReferenceError: at is not defined` at
   `streamPrompt (host-core.ts:774:14)` — ran to completion this session with 0
   failures.

REPORT-4265's three further runtime fixes are also confirmed in the tree:
`sessionPriming` now declares `[...knowledge.perKb.keys()]` on the map axis
(`session-knowledge.ts:355,403`) rather than the static `SESSION_KBS` pair; and
`turnDelta` now persists the cursor whenever `stored === null`
(`session-delta.ts:280`), not only when it moved, with the reasoning stated in a
comment at the site.

## Judgment Calls

- **Not failing on what this sandbox cannot execute.** 30-odd criteria route through
  the workerd project, which will not start here. Failing again on that would spin
  the fix loop against a gap that is already closed — the inverse of the BUG-1047
  hazard. The bar I applied instead: the *named* defect's source line is fixed, the
  *named* oracle is clean, and the *named* suite that exhibited it passes. All three
  hold, and REPORT-4265 reports a full workers run of 324 passed / 0 failed across 50
  files. That is sufficient to certify.
- **AC-1775's failure is environmental and is not counted.** It drives a real
  loopback navigation of mirrored bytes by design — that *is* the criterion — and
  this sandbox denies socket binds. Identical to REPORT-4261 and REPORT-4264.
- **The 12 pre-existing node failures REPORT-4265 documented are out of scope.** They
  belong to story-e674c60a (AC-964/965/1400), story-c4f329d3 (AC-1292/1295/1296/1297,
  a test harness with undefined symbols *in the test file*), story-ab1ecd62 (AC-1477,
  upstream component drift) and to FC orphans of tickets not in this bundle. None is
  among this anchor's ten stories and all were failing before this bundle's commits.
  This review's bar is this anchor's criteria.
- **The two FC deletions are `fc_orphan_gate`'s business, not this review's.**
  REPORT-4265 removed `test_UAT_FC_REQ-160_two_kb_session.workers.test.ts` and
  `test_UAT_FC_BUG-42_markdown_rendering.test.ts`, each justified test-by-test
  against reconciled criteria that now pass. Eleven of the bundle's thirteen FC files
  remain. The next FSM state enumerates them with its own report; I neither endorse
  nor block those deletions here.
- **BUG-40's eleven re-pins collapsing to one plan item — accepted.** The earlier
  reconciliations had already moved the criteria; BUG-40 moved the tests to catch up.
  Only AC-1331 needed text.
- **REQ-155 and REQ-156 as features, not refactors — accepted.** The matrix said
  nothing at all about where a capture bundle lives or how bytes become pixels. The
  reuse-first bias was applied where it bites: item 3 pulled REQ-156's preflight
  consequence out into an upgrade of STORY-79 rather than letting the codec story
  restate install gating.
- **BUG-42 split across items 8 and 9 — accepted.** Two surfaces, two capabilities
  (capability-e9324eb7 and capability-44a04848), two different failures.
- **Item 7 targeting two stories — accepted and verified.** story-4cabde9a was
  omitted from the dispatched list but was updated; AC-1689/AC-1694 are active and
  restated.
- **Item 10 leaving STORY-99 off its target list — accepted.** AC-1033 already states
  that a definition changed outside the workspace is shown on the next request, so
  the workspace's obligation is unchanged; what is new is that the conversation now
  tells it when to ask. The story records this as a decision rather than an omission.

## Process Observation (not a gap, and not blocking)

The scoped quality gate on this branch is **inert**, and this is worth recording
because it is why two prior reviews were the only net beneath this bundle. The latest
quality report (REPORT-4266, commit `380c188f`) reads:

```
"build": { "status": "success", "stdout": "No tsconfig.json — type-check skipped (JS-only project)" }
"suites": {}
"overall": { "status": "success" }
```

The worktree root has `tsconfig.base.json` but no `tsconfig.json`, so the
build/typecheck step is a no-op, and no suites are configured, so the test step runs
nothing — yet the gate reports `success`. A fatal `ReferenceError` in the conversation
host survived a story cycle, a review, a `fix_reconciliation_review` and a
`reconciliation_test_fix` through this gap. Per-project tsconfigs do exist
(`tools/generate/tsconfig.json`, `apps/control-app/tsconfig.json`) and both are
clean, so the fix is a gate configuration change, not a code change. Surfaced here
for the operator rather than filed, since this is a reconcile-tooling matter and does
not affect this anchor's verdict.

## Verdict

**PASS.**

Stories accurately and completely document the behaviour surface, and they document
the operator's *intent* rather than merely the code's behaviour. All ten plan items
produced output; all 72 criteria are active and each carries a behavioural UAT that
enters through a real boundary and would fail if its criterion's behaviour were
removed. Both undelivered intent pieces — REQ-156's AC5 and REQ-160's change-feed
operation — are flagged with their code absence re-verified, not absorbed. Every
intent-silent formalization is attributed under `## Reconciliation Decisions` with a
date and a reason, and one code/documentation contradiction is correctly routed away
from the criteria.

REPORT-4264's sole failure is closed: the `ReferenceError` that made no turn
completable is gone from the source, `tsc --noEmit` — the oracle that review named —
is clean for both projects, and the suite in which the error was observed now passes.

A developer reading these stories would have a correct mental model of what this code
does and of what the operator set out to build.

**Verification caveat, repeated so it is not lost:** this session's sandbox denies
`listen`, so the workerd project could not be executed at all and two node suites that
start a builder server skip their tests. Those criteria were assessed by reading their
evidence design plus REPORT-4265's reported full run. AC-1775's single failure is the
same socket restriction and is not a product defect.
