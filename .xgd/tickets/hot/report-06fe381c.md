---
uid: report-06fe381c
id: REPORT-3689
type: report
title: 'Capability-Intent Alignment: System Knowledge Base: The Corpus, Its Index
  & Its Generated Map (level=story)'
created_by: xgd
created_at: '2026-09-10T07:22:28.100615+00:00'
updated_at: '2026-09-10T07:22:28.100615+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-45acba5e
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: System Knowledge Base: The Corpus, Its Index & Its Generated Map
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a · Capability: capability-45acba5e (CAP-100) · Previous attempts: 0

## Cumulative Intent Considered

The capability ticket carries no `intent_uid`/`updated_by`. Its single story
(STORY-117 / story-c4f329d3, `feature`, completed) names `intent_uid:
bundle-77b28def` (BUNDLE-19) and has no `updated_by` chain. BUNDLE-19 bundles
nine source tickets; exactly one of them concerns this capability — **REQ-123
(request-488d874b), "1st contact system KB"**. The other eight (REQ-133, BUG-35,
REQ-131, REQ-140, REQ-139, REQ-141, REQ-144, REQ-142) belong to the palette,
journal, page-editor, workers-runtime, deploy and site-store capabilities and
make no ask of this one.

A store-wide sweep for further KB-touching intents (title match on
kb/knowledge/corpus/awareness/landscape/embed across request+bug types) found
five more, all `draft`, plus one `abandoned` unrelated crawler ticket.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-123 (request-488d874b) | free_and_reconciled | created 2026-08-07, completed 2026-08-20 | The whole capability: corpus export from the ticket store, doc + chunk indexes, generated awareness map, the declaration, opt-in membership on the document, one embedding model both sides, `1c kb build/export/status`; plus §3 session wiring (belongs to CAP-90) | YES |
| BUNDLE-19 (bundle-77b28def) | free_and_reconciled | merged at b18b859d | Carrier for REQ-123 (result=pass, merged_at_commit set); adds no ask of its own | YES (carrier) |
| REQ-158 (request-6893f6ea) | draft | 2026-08-28 | System KB in the Worker: bundle-resident index, AI binding, knowledge surface on the builder toolbox | NO (draft) |
| REQ-159 (request-119dd4af) | draft | 2026-08-30 | Project (tenant-scoped) KB, incremental index, map's two triggers | NO (draft) |
| REQ-160 (request-bbff35c7) | draft | 2026-08-30 | Two-KB priming, change cursor, delta channel | NO (draft) |
| REQ-164 (request-909e42f8) | draft | 2026-08-31 | Replace the `system_kb` boolean with `doc_kind: system_kb`; unrestricted shipped corpus (`corpus: {}`); exhaustive `readDocTickets` | NO (draft) |
| REQ-166 (request-20bd7d63) | draft | 2026-08-31 | Bundles become corpus members | NO (draft) |
| REQ-18 | abandoned | 2026-07-02 | Crawler corpus (unrelated sense of "corpus") | NO |

Cumulative intent for this capability is therefore **REQ-123 alone**, in full,
with nothing retired by any later counting intent.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-117 (story-c4f329d3) | REQ-123 (via BUNDLE-19) | **aligned** — every in-scope bullet traces to a REQ-123 §1/§2 ask or a numbered decision; every out-of-scope bullet traces to a REQ-123 exclusion, "Open" or "Deferred" item |
| STORY-117 — "Building it" (one command, corpus-only form, status form, usage refusal) | REQ-123 "What was built" (`1c kb build` — export, index, chunk, map, in that order; `build`/`export`/`status` in `cli/kb.ts`) | aligned; matches `KB_USAGE` at `tools/generate/src/cli/kb.ts:737` |
| STORY-117 — "Membership, opt-in, per document, on the document" | REQ-123 decision 2 (`fields.system_kb: true`, inclusion-not-exclusion, fails safe, on the ticket not in a list) | aligned; the story's "genuine boolean" tightening matches `optedIn()` at `kb.ts:199` (`=== true`) |
| STORY-117 — "Identity that survives a retitle" | REQ-123 §1 (filename from human id; `DocDirStore`'s uid *is* the path) | aligned |
| STORY-117 — "Withdrawal is deletion" | REQ-123 §1 ("re-runs whenever the design docs move", reconciles against the store) | aligned; implemented as the sweep at `kb.ts:322-331` |
| STORY-117 — "Rebuilds are incremental and honest about it" | REQ-123 "Two things found along the way" (`DocDirStore` ignores frontmatter stamps; the manifest keys on `updated_at`) | aligned; byte-compare before write at `kb.ts:314-315` |
| STORY-117 — "The map is generated, always" | REQ-123 §2 + decision 3 (cluster → describe → validate; no hand-authored map; `landscape: authored` on disk is the shipped-KB contract) | aligned; the story's Technical Context restates the `authored`/`derived` reasoning rather than contradicting it |
| STORY-117 — "The declaration is the thing in force" | REQ-123 §2 (`knowledge_bases.yaml` declaring `source: shipped`) | aligned; the story's Technical Context explicitly records the letter-not-substance divergence (shipped as JSON, `kb/knowledge_bases.json`), and "scaffold once, never overwrite" matches `ensureConfig` |
| STORY-117 — "One embedding model on both sides" | REQ-123 decision 4 (Workers AI `@cf/baai/bge-small-en-v1.5`, no local stand-in) | aligned |
| STORY-117 — out of scope: session/priming/degradation | REQ-123 §3 "Wiring" + "Degradation, not failure" | aligned — the ask is not dropped, it is expressed in CAP-90 / STORY-103 (see finding 2) |
| STORY-117 — out of scope: tenant KBs and the D1 store | REQ-123 "The D1 ticket store is not in this ticket" + decisions 6/7 + the Tenancy section ("design inherited by the D1 store ticket, not built here") | aligned |
| STORY-117 — out of scope: corpus curation | REQ-123 "Open — Corpus editorial pass" and decision 2's closing paragraph | aligned |
| STORY-117 — out of scope: corpus residency for a deployed worker | REQ-123 "Deferred — Corpus residency for a deployed Worker" + decision 8 | aligned |

**Coverage of REQ-123 within this capability**: complete. Every §1 and §2 ask, and
decisions 1–8, are expressed. **Exclusivity**: the capability has exactly one
story, and its only neighbouring claim (CAP-90 / STORY-103) states the reciprocal
boundary by UID in both directions — no overlap.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-117 ("Named exclusions" in scope: "never counted and never silent") | code-issue | `readDocTickets` (`tools/generate/src/cli/kb.ts:157-165`) reads `parsed.items` and ignores the envelope's `next_cursor`, so the export sees only the first page of `xgd ticket list --type doc --view --json`. Verified latent, not live: the store holds **38** doc tickets and the unlimited call returns all 38 with `truncated: false`, `next_cursor: null`. Past the page boundary a document would be neither exported nor named in `skipped` — silently absent, which is precisely the failure the story's guarantee forbids. Draft REQ-164 §3 already names this line. | Make `readDocTickets` exhaustive (xgd REQ-825's affordance, per REQ-164 §3) so the named-exclusions guarantee holds at any corpus size. No matrix edit — the story text is correct; the code does not yet hold to it at scale. |
| 2 | info | coverage | REQ-123 §3 "Wiring" / "Degradation, not failure" | — | REQ-123's third scope section (KnowledgeDocs landscape-first priming, KnowledgeToolbox granted read-only on both scope axes, degradation when nothing is built) is deliberately outside this capability and is expressed in CAP-90 / STORY-103 (story-a58a0974, `upgrade`), which names story-c4f329d3 by UID in its own "not here" list. Not a coverage gap. | none |
| 3 | info | consistency | STORY-117 Technical Context ("one place the 'name it, never count it' rule is not followed") | — | The story records its own deliberate exception — the no-documents-opted-in refusal reports a count, not a list. Confirmed at `kb.ts:672-681`. Correctly documented rather than drifted. | none |
| 4 | info | consistency | STORY-117 "The declaration ... a build never overwrites it" vs "the corpus-only form ... writes the declaration too" | — | Read alone these look opposed; AC-1305 resolves them as one rule (scaffold when absent, never overwrite when present), and `ensureConfig` implements exactly that. Not an internal inconsistency. | none |

## Notes for the Editor

- **This capability's matrix is currently single-intent.** Everything in STORY-117
  answers to REQ-123 and nothing else. That makes the ledger unusually clean now
  and unusually brittle later: five draft intents (REQ-158, REQ-159, REQ-160,
  REQ-164, REQ-166) all target this capability, and none has reconciled.

- **The membership bullet is the one to watch.** REQ-164 (draft) settles
  membership as `doc_kind: system_kb` — a *kind*, not a boolean — per DOC-39 §3.3,
  and states the `system_kb: true` boolean "has already been cleared from all 38
  doc tickets". Independently verified in the store today: **0 of 38 doc tickets
  carry `system_kb: true`**, and their `doc_kind` values are
  architecture(32)/project_context_summary/project_context/interface_design_policy/
  test_asset_catalogue/security_policy/architecture_policy — none is `system_kb`
  (blocked on xgd REQ-827, which adds the enum value). So `1c kb build` refuses
  today with the "no doc ticket has opted into the system KB" error.

  This is **not** story-level drift and was not scored as one: REQ-164 is `draft`
  and does not count toward cumulative intent, while REQ-123 (the only counting
  intent) mandates exactly the boolean mechanism the story describes and the code
  implements. The data state is corpus-content in flight, not a matrix claim.
  Flagging it so a later cycle does not re-derive it: **when REQ-164 reconciles,
  STORY-117's "Membership, opt-in, per document, on the document" bullet needs a
  `story-body-edit`, and AC-1295 ("only as a genuine boolean") and AC-1300 (the
  nothing-opted-in refusal naming the opt-in mechanism) need matching `ac-edit`s.**
  REQ-164 also retires the query-time `system_kb` predicate in the declaration
  (`corpus: {}`), which touches the story's "The declaration is the thing in
  force" bullet — the *predicate* half of it, not the prompt/weight half.

- **Finding 1 and the REQ-164 note are the same class of problem** the story's own
  Technical Context is alert to: a corpus that is quietly smaller than intended,
  whose symptom ("the assistant doesn't know that") surfaces far from the cause.
  Neither is matrix drift today.

- **Story-level evidence basis.** Consistency was checked against REQ-123's body
  and its single comment (COMMENT-831, the originating operator-Claude dialogue),
  and spot-verified against the implementation at `tools/generate/src/cli/kb.ts`
  (command forms, `optedIn`, `exportCorpus` byte-compare and removal sweep,
  `kbStatus`, `KB_USAGE`). Step 2.5 was not triggered: no story text names an
  abandoned/deprecated/wont_fix ticket as a delivery vehicle.
