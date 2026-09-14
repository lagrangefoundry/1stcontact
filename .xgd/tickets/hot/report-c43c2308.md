---
uid: report-c43c2308
id: REPORT-4261
type: report
title: 'Reconciliation Review: commits'
created_by: xgd
created_at: '2026-09-14T08:19:31.436877+00:00'
updated_at: '2026-09-14T08:19:31.436877+00:00'
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
**Stories Reviewed**: 10 (9 distinct: story-0cb7f25b, story-046cfc56, story-e15a19ef, story-d5167ced, story-a58a0974, story-3cf3d57b, story-6ccaedd5, story-1500b111, story-7f437d57 — plus story-4cabde9a, item 7's second target, which the dispatched list omitted)

## What was read

Intent first: the whole 66k-char `bundle-8e1807f6` body — all eight source tickets
(REQ-155, BUG-40, REQ-160, BUG-41, BUG-42, REQ-172, REQ-156, BUG-43) including each
ticket's appended mid-implementation corrections. Then the code, independently. Then
the ten stories, their 58 new/modified acceptance criteria, and their evidence.

## Behavior Inventory

38 behaviours identified in the code, verified in the tree rather than taken from
the plan:

| # | Behavior | Verified at |
|---|----------|-------------|
| 1 | `ReferenceBundle`/`ReferenceStore`/`ReferenceStoreRoot` port | `tools/generate/src/store/reference-store.ts` |
| 2 | Three backings: filesystem, R2, memory | `{fs,r2,memory}-reference-store.ts` (all three present) |
| 3 | `forTenant` refuses unknown/inactive tenant; keys under `t/<tenant>/ref/<name>/<member>` | `r2-reference-store.ts` |
| 4 | `capture/bundle.ts` carries no `node:` import; pipeline reaches no `node:fs` | module loads and completes a capture inside workerd |
| 5 | Async cascade through repro/refold/gate/coverage/responsive-diff | signatures |
| 6 | `reextract` reads through the port, stays node-only (`createServer`) | `capture/reextract.ts` |
| 7 | `--ref` polymorphism stays in the CLI | `perceptual.ts` |
| 8 | PNG decode/encode over `DecompressionStream`/`CompressionStream('deflate')` | `cli/png.ts` |
| 9 | sharp's sRGB expansion reproduced (grey→3ch, grey+alpha→4ch, indexed→4ch only with tRNS) | `png.ts:315` "expand to sRGB, the way sharp does" |
| 10 | Five row filters, split IDAT, odd strides, sub-byte depths, palette ±tRNS | `png.ts` + 11 hand-authored fixtures |
| 11 | `PngFeatureError` / `PngCorruptError` / `UnsupportedImageError` kept distinct | `png.ts` |
| 12 | Greyscale heatmaps written as colour type 0 | `png.ts:471` |
| 13 | `perceptual-core.ts` split verbatim so the isolate imports the diff without `node:fs` | `perceptual-core.ts:5` |
| 14 | No `sharp` import anywhere under `tools/generate/src`; absent from `tools/generate/package.json` | grep: only prose comments remain |
| 15 | Preflight map is exactly 7 verbs, each naming `playwright` alone; `crop` has no entry | `cli/preflight.ts:70-76` |
| 16 | `1c assets` assembles in `dist-assets.staging/` and swaps with two renames | `cli/assets.ts:551-600` |
| 17 | Failed build leaves the previous tree standing | same |
| 18 | `TicketSessionArchive` over the D1 ticket store; `R2TranscriptArchive` deleted | `apps/control-app/src/ai.ts:98`; grep for `R2TranscriptArchive` returns nothing |
| 19 | `kb_cursor` merged onto the component's chat schema | `tickets.ts:277` |
| 20 | `CURSOR_FIELD = 'kb_cursor'` — the cursor is a field on the chat ticket | `session-delta.ts:55` |
| 21 | Node's `1c builder` keeps `FileArchive` | `ai.ts:14` |
| 22 | Both KB landscapes in one section, project first | `session-knowledge.ts` / `roles.ts` |
| 23 | `coRank` fans search to each KB's runtime and merges on the component's own scores | `session-knowledge.ts` |
| 24 | `changedSince` → `deltaLine` → advance → write, per turn | `session-delta.ts:159,267` |
| 25 | Empty delta emits nothing; delta placed LAST in the reminder, after the draft-change clause | `roles.ts:116-131` ("the corpus delta, LAST and only when there is one") |
| 26 | `DELTA_BUDGET_CHARS` cap with an exact, never-truncated count | `session-delta.ts` |
| 27 | Cursor carries boundary timestamp + the uids that sat on it | `session-delta.ts` |
| 28 | Chat tickets excluded from the delta alone | `session-delta.ts` |
| 29 | `resolveContentType(contentType, filename)` repairs absent/octet-stream only | `material.ts:226` |
| 30 | Called once at the head of `ingest()` | `material.ts:421` |
| 31 | `content_type` also resolved for rows predating the field | `material.ts:692-697` |
| 32 | `titleFromText` skips front matter, prefers a declared `title:` | `material.ts` / `describe.ts` |
| 33 | `builder/markdown.js` owns both engines, exports `markdownReady` (never rejects) and re-exports `renderSafe`/`setParser`/`setSanitizer` | `markdown.js:28-68` |
| 34 | Reader selects by content type; PDF gets an `<iframe>` at the file route; reader has `destroy()` | `builder/reader.js:107,163-166,269` |
| 35 | Library description cell painted as rendered markdown, element kept | `builder/library.js` |
| 36 | `SITE_CHANGED` yielded after each `tool_activity` when the counter moved | `host-core.ts:105,786` |
| 37 | Signal produced by the host, no declared L1 operation for it | `host-core.ts` — no tool declaration |
| 38 | `app.js` passes the same `reload()` the palette popup and segment editor pass | `builder/app.js` |

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1-7 | Reference bundle storage port, three backings, tenancy, async cascade, `reextract` node-only, `--ref` polymorphism | Covered | story-0cb7f25b | AC-1762…AC-1775. Out-of-scope decisions (repro/adopt-gaps still fs-only, no delete verb, non-atomic fs write) are stated in the story and deliberately not made ACs. |
| 8-14 | PNG codec, sRGB expansion, decode paths, three named refusals, greyscale heatmaps, pure core, sharp gone | Covered | story-046cfc56 | AC-1776…AC-1789. |
| 15 | Preflight membership: 7 verbs / `playwright` only, `crop` offline | Covered | story-e15a19ef | AC-1013 and AC-1017 restated; AC-1790 added for the observable ("`1c crop` completes on a tree where nothing is installed"). |
| 16-17 | Atomic asset swap | Covered | story-d5167ced | AC-1791 added; AC-1331's skip clause split into its two true legs. |
| 18-21 | Conversation as a chat ticket, CAS, tenancy by `forTenant`, cursor's home, CLI keeps its file archive | Covered | story-a58a0974 | AC-1792/1793/1794 added; AC-1057, AC-1405, AC-1409 restated to the new carrier with the property kept host-neutral. |
| 22-28 | Two-KB seeding, co-ranked search, per-turn delta, cap, count, cursor semantics, self-exclusion, ordering | Covered | story-3cf3d57b | AC-1795…AC-1808 — one criterion per REQ-160 acceptance line that shipped. |
| 29-30, 32 | Content type resolved once at the head; front-matter title | Covered | story-6ccaedd5 (ordering) + story-4cabde9a (branch reached) | AC-1682 restated to repair the *type* and not the kind alone; AC-1809/1810 added; AC-1689/AC-1694 restated on the description story. The split is argued in both stories and is correct: the "once, at the head, for all three consumers" claim is only observable at the ingestion boundary. |
| 31, 34-35 | Document reader, expand-to-modal, `content_type` on the row, rendered description | Covered | story-1500b111 | AC-1811…AC-1815 added; AC-1717 and AC-1718 restated. |
| 33 | One engine pair for the workspace, readiness settles on load or failure | Covered | story-7f437d57 | AC-1816 added; AC-1063 gains the ordering precondition. |
| 36-37 | Host-produced per-write change signal, unskippable by the model | Covered | story-a58a0974 | AC-1817/1818 added; AC-1054 restated. |
| 38 | The pane acts on the signal by re-fetching the displayed page | **Partial** | story-7f437d57 | AC-1819 exists and states it correctly, but is status `pending` (the creation default) and has no reconciliation UAT. See Gap 1. |
| — | BUG-40 cause 1 (half-finished `pnpm install`) | Not covered — correctly | — | Environmental; a hand-repaired `node_modules`. No product behaviour, no matrix delta. |
| — | BUG-40 cause 3 (eleven superseded UATs) | Covered | — | Spot-checked the plan's claim that only AC-1331 needed a change: AC-1682, AC-1409, AC-1017 and AC-1331 read as the plan describes. The re-pins moved *tests*, not criteria. |
| — | REQ-155's ~40-suite `await` cascade | Covered by the stories that already own those suites | — | Predicted by REQ-155's own "Blast radius"; no criteria change. |
| — | BUG-40's AC-960 prose reword in `knowledge.ts` + two test headers | Not an item — correctly | — | Guard is right, criterion unchanged. |

## Intent Fidelity

Two pieces the intent declares and the code does **not** deliver. Both are flagged
rather than absorbed, and I verified both absences in the tree:

1. **REQ-156 AC5** (`1c gate` end-to-end in workerd). `cmdGate` still resolves its
   reference with `fsReferenceBundle(opts.ref)` (`tools/generate/src/cli/gate.ts:433`)
   and passes a filesystem path down. story-046cfc56's Technical Context states this
   flatly — *"unblocked is not delivered, and no criterion of this story may claim
   it"* — and no AC claims it. Correct handling.
2. **REQ-160's declared change-feed operation.** `session-delta.ts` exposes
   `changedSince` as a host function; there is no declared operation on the knowledge
   surface. story-3cf3d57b's Reconciliation Decisions record it as scoped out by the
   intent's own *Depends on* section and explicitly do not formalize it; AC-1800 stops
   at truncation and the exact count. Correct handling.

Intent-silent behaviour formalized into ACs is recorded under
`## Reconciliation Decisions` in every story that formalized any (all ten), each with
a date and a rationale. No unattributed claims found. No absorbed divergence found.

One further piece of correct handling worth recording: story-e15a19ef flags a
code/documentation contradiction — the CLI's own `USAGE` text still lists `crop`
among the preflight-gated verbs, contradicting both REQ-156 and the shipped map —
and routes it to `fix_uat_coverage` with an explicit *"do NOT encode this as an AC"*.
Per the chain of authority that is the right call: the criteria record the intent and
the help text is what needs correcting.

## Ungrounded Stories

None. Every story claim I sampled resolved to code (see the behavior inventory's
"Verified at" column). No story describes behaviour neither intent nor code supports.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Reference bundle storage (1c capture) | story-0cb7f25b (STORY-147, new) | OK |
| 2. PNG codec and the fidelity arithmetic core | story-046cfc56 (STORY-148, new) | OK |
| 3. 1c install preflight and declared dependencies | story-e15a19ef (STORY-79) | OK — AC-1790 added, AC-1013/AC-1017 restated |
| 4. Platform build: generated asset stage | story-d5167ced (STORY-119) | OK — AC-1791 added, AC-1331 split |
| 5. Session storage: the conversation as a chat ticket | story-a58a0974 (STORY-103) | OK — AC-1792/1793/1794 added, AC-1057/1405/1409 restated |
| 6. Session seeding across both KBs, and the per-turn delta | story-3cf3d57b (STORY-149, new) | OK — AC-1795…AC-1808 |
| 7. Material ingestion: content type resolved from the filename | story-6ccaedd5 (STORY-140) + story-4cabde9a (STORY-141) | OK — both targets updated; AC-1809/1810 added, AC-1682/1689/1694 restated |
| 8. Library detail: the document reader | story-1500b111 (STORY-144) | OK — AC-1811…AC-1815 added, AC-1717/1718 restated |
| 9. Assistant pane: markdown engines settle before the transcript paints | story-7f437d57 (STORY-104) | OK — AC-1816 added, AC-1063 restated |
| 10. The preview follows the assistant's writes | story-a58a0974 + story-7f437d57 | **Partial** — the host half landed (AC-1817/1818 active, AC-1054/1066 restated); the pane half (AC-1819) is `pending` with no UAT |

Ten `reconciliation_story_generation` reports exist on the anchor, one per item. No
item was silently dropped.

## Evidence Sufficiency (Step 5b)

Every acceptance criterion this bundle created carries a `test_UAT_AC{N}_*`
reconciliation UAT — **AC-1762 through AC-1818, with no holes** — except AC-1819.

What I executed, and what it said:

- `tests/reconciliation-reference-bundle-storage.test.ts`,
  `reconciliation-in-repo-png-codec.test.ts`, `reconciliation-library-reader.test.ts`,
  `reconciliation-assistant-arrival-notice-budget.test.ts` — 32 passed, 1 failed.
- `tests/req44-install-preflight.test.ts`,
  `reconciliation-1c-install-preflight.test.ts`,
  `test_UAT_FC_REQ-155_reference_store.test.ts`,
  `test_UAT_FC_REQ-156_png_codec.test.ts` — 60 passed.
- `test_UAT_FC_BUG-41_markdown_material`, `test_UAT_FC_BUG-42_markdown_rendering`,
  `test_UAT_FC_BUG-43_preview_follows_the_assistant`,
  `test_UAT_FC_REQ-172_library_document_preview`,
  `test_UAT_FC_REQ-160_delta_channel` — 40 passed, 0 skipped (`WEBUI_INSTALLED` true,
  so the real components really were mounted).

The one failure is `test_UAT_AC1775_reextraction_reads_the_stored_bundle_and_still_really_navigates`,
and it is **not a product defect**: it dies on `listen EPERM: operation not permitted
127.0.0.1`. The test drives a real loopback navigation of mirrored bytes by design
(that is the criterion), and this review session's sandbox denies socket binds. The
same restriction makes the **entire workers project unrunnable here** — miniflare
cannot bind its loopback socket — so every `*.workers.test.ts` in this bundle was
verified by reading rather than by running. **Stated plainly so it is not mistaken for
a pass I observed.**

On validity rather than passing, for the suites I read:

- `reconciliation-reference-bundle-storage.workers.test.ts` drives the real
  `cmdCapturePage` inside workerd against `env.BLOBS` and a real D1 tenant registry;
  the only double is the browser behind the driver seam. AC-1762 is proved by the run
  (the module could not load if the pipeline still reached `node:fs`), not by a source
  scan — which is the right conversion of REQ-155's own structurally-asserted AC1.
- `reconciliation-assistant-two-knowledge-bases.workers.test.ts` goes through
  `/api/ai/session` and `/api/ai/prompt` against real D1/R2, with the transcript and
  the bookmark on a real chat ticket written by the component's own archive. Two
  doubles, both model boundaries (Anthropic client, embedder).
- `reconciliation-material-row-content-type.workers.test.ts` and
  `test_UAT_FC_REQ-172_material_content_type.workers.test.ts` assert every claim of
  AC-1813 through `route()` against real D1 and two real R2 buckets; the legacy-row
  case is written through the store directly, which is what "created before the field
  existed" *is*.
- `reconciliation-platform-asset-tree-swap.test.ts` reads the served path
  concurrently with a real `1c assets` run and distinguishes a single rename from a
  refill by the directory's inode. Nothing internal is mocked.

No source-inspection-only evidence, no internal mocking, and no AC whose UAT would
pass with the behaviour removed, among the criteria I checked.

## Gaps

### Gap 1 (the failure) — plan item 10's pane-side criterion is neither active nor evidenced

`AC-1819` — *"The page beside the conversation follows the assistant's writes as they
land, and a failed reload never costs the reply"* — on `story-7f437d57` (STORY-104):

- **status is `pending`**, which is the *creation default* for an
  `acceptance_criterion`. Every other criterion this bundle created (AC-1762…AC-1818,
  57 of them) was advanced to `active`. It is the only one left behind, which makes
  this a dropped step rather than a staging decision.
- **no `test_UAT_AC1819_*` reconciliation UAT exists.** A full sweep of `tests/`
  (with `grep -a`, since two suites embed a literal NUL and are otherwise skipped as
  binary) finds a UAT for every AC from 1762 to 1818 and none for 1819.

Why this is material rather than bookkeeping: a `pending` criterion is not asserted by
the matrix, so BUG-43's central pane-side deliverable — the one the operator actually
reported ("a manual browser refresh does show the change") — is currently unclaimed.
The story's own text contradicts that state twice: its Description lists **"Following
the assistant's writes"** as an in-scope guarantee, and its Reconciliation Decisions
say **"Acting on the change report is claimed here"**. A developer reading STORY-104's
active criteria would not find the guarantee the story body promises.

**Remediation (narrow — the behaviour is already proven):**

1. Advance `AC-1819` to `active`.
2. Add its reconciliation UAT. The evidence already exists and passes:
   `tests/test_UAT_FC_BUG-43_preview_follows_the_assistant.test.ts` covers all three
   of the criterion's claims against the real installed `webui-chat` and the real
   `mountBuilder`, with only the HTTP transport injected —
   `test_UAT_FC_BUG-43_a_write_reloads_the_preview_frame` (two writes → `reloads === 2`,
   asserted per-write rather than once at the end),
   `test_UAT_FC_BUG-43_a_question_leaves_the_frame_alone` (no writes → `reloads === 0`),
   and `test_UAT_FC_BUG-43_a_failing_host_does_not_take_the_turn_with_it` (a throwing
   `onSiteChanged` still leaves the assistant's full reply in the transcript). I ran
   these; they pass. The reconciliation UAT is a port of those three, named
   `test_UAT_AC1819_*`, in the same file as `test_UAT_AC1816_*`.
3. Do **not** add a criterion to STORY-99. story-a58a0974 and story-7f437d57 both
   argue that AC-1033 already carries the workspace's obligation, and I agree: what is
   new is that the conversation now tells the workspace when to ask.

## Judgment Calls

- **AC-1791's Verification over-claims by one clause — noted, not failed.** Its
  verification sentence says *"no read is answered not-found"*, but taking the served
  path is a rename onto an occupied name, so the path is unoccupied for the single
  syscall between the two renames. The UAT is candid about this and bounds it (`≤5`
  reads out of >1000, every one of them provably at the boundary between the two
  trees), which is exactly the distinction the criterion body draws — a *refill*
  would leave hundreds of consecutive reads unanswered. The criterion's substantive
  claim ("the previous tree or the new tree, each complete, never a partial state of
  either") is satisfied and is what BUG-40 asked for. The verification clause should
  be tightened to match; this is AC wording, which structural validation owns, and it
  does not warrant a fix cycle on its own.
- **BUG-40's eleven re-pins collapsing to one plan item — accepted.** I spot-read
  AC-1682, AC-1409, AC-1017 and AC-1331 and they do read as the plan claims: the
  earlier reconciliations had already moved the criteria, and BUG-40 was moving the
  tests to catch up. Only AC-1331 needed text, and item 4 changed it.
- **REQ-155 and REQ-156 classified as features, not refactors — accepted.** Both look
  like refactors from the diff, but the matrix said nothing at all about where a
  capture bundle lives or how bytes become pixels. Those are capability buckets that
  never existed. The reuse-first bias was applied where it bites: item 3 pulled the
  preflight consequence out into an upgrade of STORY-79 rather than letting the codec
  story restate install gating.
- **BUG-42 split across items 8 and 9 — accepted.** Two surfaces, two capabilities,
  two different failures (the Library never rendered markdown at all; the transcript
  lost a cold-load race). Folding the Library half into item 8 avoids two items
  colliding on STORY-144 with an ordering dependency between them.
- **Item 7 targeting two stories — accepted and verified.** story-4cabde9a was omitted
  from the dispatched story list but was updated, and its AC-1689/AC-1694 restatements
  landed. The ordering claim sits on the ingestion story and the per-branch claims on
  the description story, which is where each is observable.
- **Two test suites embed a literal NUL byte** (`bytesOf('\x00binary')`) in
  `reconciliation-material-row-content-type.workers.test.ts` and
  `test_UAT_FC_REQ-172_material_content_type.workers.test.ts`, so `file` reports them
  as `data` and `grep` skips them as binary. Harmless to vitest, but it hides those
  suites from every text tool — it hid AC-1813's UAT from this review's own first
  sweep, and it would hide them from an orphan or coverage scan too. Worth replacing
  with a `\0` escape. Not a coverage failure; recorded so the next reader is not
  misled the way I initially was.

## Verdict

**FAIL** — on one specific, narrow gap.

Nine of ten plan items are complete and, in my judgment, unusually well reconciled:
intent is the stated authority throughout, both undelivered intent pieces (REQ-156
AC5, REQ-160's change-feed operation) are flagged with their code absence rather than
absorbed, every intent-silent formalization is attributed under
`## Reconciliation Decisions` with a date and a reason, one code/documentation
contradiction is correctly routed to the fix loop instead of being encoded as a
criterion, and every criterion from AC-1762 to AC-1818 carries a behavioural
reconciliation UAT that enters through a real boundary.

The failure is item 10's pane half: `AC-1819` was created and then left at the default
`pending` status with no reconciliation UAT, while story-7f437d57's own text claims the
guarantee is asserted there. The matrix therefore does not assert BUG-43's central
pane-side deliverable. The behaviour itself is implemented and proven by a passing FC
suite, so the fix is to activate the criterion and port that suite's three assertions
into a `test_UAT_AC1819_*` UAT.

**Verification caveat, stated rather than buried:** this review session's sandbox
denies `listen` on `127.0.0.1`, so the workers project could not be executed at all
and `test_UAT_AC1775` fails here for that reason alone. Those suites were assessed by
reading; the node-project suites were executed and, apart from AC-1775's socket bind,
all passed.
