---
uid: report-642edd91
id: REPORT-3696
type: report
title: 'Capability-Intent Alignment: Draft Change Journal: What Changed On The Draft,
  And Who Changed It (level=story)'
created_by: xgd
created_at: '2026-09-10T08:11:28.952584+00:00'
updated_at: '2026-09-10T08:11:28.952584+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-702b7c02
  level: story
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Draft Change Journal: What Changed On The Draft, And Who Changed It
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

CAP-99 carries no `intent_uid` of its own. Its single story (STORY-115) carries
`intent_uid: bundle-77b28def` (BUNDLE-19, `free_and_reconciled`,
`merged_at_commit: b18b859d7414a049be45e09f48426d73742e5bf2`). Of BUNDLE-19's nine
member intents, exactly one is about this capability: **REQ-131**. No AC under the
story carries an `intent_uid` or `updated_by` chain, so REQ-131 is the whole ledger.

A full-corpus sweep (3038 tickets; title scan for journal / change count / counter /
"since you last" / reminder / "what changed", plus a body search and a grep for
`REQ-131` back-references) surfaced no second intent that adds to, refines or retires
any of this capability's behaviour.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-131 (`request-5d3bf630`) | free_and_reconciled (via BUNDLE-19) | created 2026-08-18, reconciled 2026-08-20 | The whole capability: monotone per-site counter returned by every write; bounded window of self-describing records; a read for the assistant (declared op, `ReadSite`, untrusted) and for the operator (CLI); the per-turn push signal. Plus an appended **"As built"** half pinning the four open decisions and recording one divergence. | **YES** |
| REQ-160 (`request-bbff35c7`) | draft | 2026-09 | Session seeding + a **knowledge-corpus** cursor and delta channel. Reuses the cursor *pattern* but for the KB, not the draft; does not touch CAP-99's surface. | **NO** (draft, and out of this capability) |

**Reading REQ-131 as a whole.** Its body is the usual two halves — the planning spec
(Problem / Behaviour Parts 1-3 / nine ACs / four decisions to pin / out-of-scope) and an
appended **"As built"** section (`ceed377a03f`, v0.1.45). Both halves are cumulative
intent. The "As built" half states *"Nothing in the design above changed"*, then pins the
four open decisions (gitignored `storage/sites/<slug>/.journal.json`; window 500 records
/ 300 chars; actor attribution shipped via `GlobalOptions.actor`; per-site grain), adds
one thing the spec did not anticipate (every write returns the count, *including*
`add_asset` / `write_image`, whose answers are assets), and records a deliberate
divergence (recording is post-write, not transactional).

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-99 (`capability-702b7c02`) — capability body | REQ-131 | **aligned.** Per-site monotone count, bounded window of self-describing records, baseline-advances-so-no-actor-filter, explicitly-not-a-revision, explicitly-not-`status`, losing-it-is-never-incorrectness — each traces to named REQ-131 text. |
| STORY-115 (`story-6cd17452`), `story_kind: feature`, `status: completed` — Story + Description ("In scope" / "Out of scope") | REQ-131 (spec half) | **aligned with one coverage gap.** In-scope bullets map 1:1 onto Part 1 (count, self-describing records, bounded window, read for both callers) and Part 3 (push signal). Out-of-scope bullets map 1:1 onto REQ-131's own out-of-scope list (undo, revisions model, client-facing UI, divergence detection, `status`). **Gap:** REQ-131 Part 2's third and fourth bullets — the `overview` paragraph and the `sequences` entry — appear nowhere in the story tree. See finding 1. |
| STORY-115 — Technical Context | REQ-131 ("As built" half) | **aligned, and unusually faithful.** Window 500 / 300 chars, per-site grain, actor attribution defaulting to the operator's own tools, record-at-return, journal kept outside the draft and un-version-controlled, degradation-never-failure, label from the shared segment derivation, baseline recorded *after* the turn, every-write-returns-the-count including the asset-shaped answers — all present and correctly attributed. The bullet *"Divergence from the intent, recorded not absorbed"* explicitly carries REQ-131's post-write-not-transactional divergence forward rather than absorbing it; that is the correct handling (info 3). One omission: the no-op rule (warning 2). |
| STORY-115 — cross-references | — | **aligned.** CAP-86 "Structured Copy Editing: One Validated, Atomic Write Path", CAP-87 "In-Page Copy Editing…", CAP-90 "AI Site Assistant: Per-Site Conversations", CAP-92 "Site Control Surface: Declared, Granted, Validated & Audited" all exist, are `active`, and are what the story says they are. |
| STORY-115 — exclusivity | — | **N/A.** CAP-99 has exactly one story; no overlap is possible. |
| AC tree (AC-1253…AC-1268, 16 ACs, all `active`) — surveyed only to settle story-level coverage | REQ-131 | REQ-131's nine ACs all land: AC1→AC-1253, AC2→AC-1256, AC3→AC-1257, AC4→AC-1258, AC5→AC-1259, AC6→AC-1260, AC7→AC-1264, AC8→AC-1265, AC9→AC-1266. The seven extras trace to the "As built" half or to body prose: AC-1254 (no-op), AC-1255 (asset-shaped answers), AC-1261 (bounded/visibly cut), AC-1262 (unreadable store), AC-1263 (not a revision / byte-identity), AC-1267 + AC-1268 (operator CLI, human and machine-readable). No AC covers REQ-131 Part 2 bullets 3-4. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-115 (`story-6cd17452`) | story-body-edit | REQ-131 (free_and_reconciled) Part 2 names four surface deliverables. Two are expressed: the declared `ReadSite` read operation and `returns.provenance: "untrusted"` (story "A read for both callers"; AC-1264, AC-1265). A third — the `absences`-on-undo adjustment — is expressed in the story's Out-of-scope/Undo bullet. The remaining two are expressed **nowhere in the story tree**: *"**The `overview` gains one paragraph**: the site can change under you between turns, here is how you find out. This is a cross-cutting rule…"* and *"**A `sequences` entry** — signal → read the changes → act."* Both **shipped** — `tools/generate/src/cli/ai/l1-surface.json` carries the overview paragraph *"Your user can change the site themselves, while you are working on it…"* and the sequence *"Pick up after your user has been editing"* (`list_changes` → `describe_page` → `get_l1`). So the drift is in the matrix, not the code: the story describes the signal being *delivered* (Part 3) but never the manual guidance that tells the assistant what to *do* when it fires. AC-1266 covers only the reminder line itself, not the manual. | Extend the story's "A read for both callers" (or "The push signal") in-scope bullet to state that the manual carries the cross-cutting rule in its overview and a signal → read → act sequence, so the assistant knows how to respond to the signal without it being repeated per-operation. An AC for the projected overview/sequence follows at `ac` level. |
| 2 | warning | consistency | STORY-115 (`story-6cd17452`) — Technical Context | story-body-edit | REQ-131's "As built" half records *"**A no-op advances nothing.** A copy save that changes no field, and a dry-run gap fix, return the current count without appending — otherwise every no-op save from the modal would look, to the assistant, exactly like the operator rewriting a heading."* The story's Technical Context reproduces every other "As built" implementation point but omits this one, even though it is the rule that keeps the mechanism from crying wolf on the editor's most common write. Not a coverage cliff — AC-1254 expresses it — so this is non-blocking. | Add one line to Technical Context beside "Records are written at the *return* of a mutating command": a write that changes nothing returns the current count and appends no record. |
| 3 | info | consistency | STORY-115 — "Divergence from the intent, recorded not absorbed" | — | The story body explicitly carries REQ-131's transactionality divergence forward (spec says *"transactionally with the write it describes"*; as built, recording is post-write and a store that cannot take the record leaves the count where it was). It states the failure direction — a *stale* count over-reports rather than under-reports — and why. This is the correct handling of a spec/implementation divergence: recorded in the matrix so regression can see it, not silently absorbed. No action. | none |
| 4 | info | coverage | STORY-115 Technical Context — window and grain | — | Story body's pinned decisions verified against the implementation: `JOURNAL_WINDOW = 500` and `JOURNAL_TEXT_LIMIT = 300` in `tools/generate/src/store/journal-model.ts:74,77`; `1c changes` exists at `tools/generate/src/cli/index.ts:1367,1433`. Matrix and code agree. No action. | none |
| 5 | info | — | REQ-160 (`request-bbff35c7`) | — | `draft`, so it does not count toward cumulative intent. Noted because it reuses the same cursor-and-delta pattern for the **knowledge corpus**, not the draft. If it later reconciles, confirm it lands on its own capability and does not silently widen CAP-99. | none |

## Notes for the Editor

- **The single repair is small and additive.** Finding 1 does not contest anything the
  story says — it asks for one sentence naming manual guidance that already exists in
  `l1-surface.json`. Nothing in the story body needs to be removed or rewritten.
- **The cross-cutting-guidance shape is the thing to watch.** REQ-131 deliberately put
  the change-detection rule in the surface *overview* rather than repeating it
  per-operation ("[[DOC-30]]'s stated reason for having an overview at all"). Matrix
  elements are written per-behaviour, so overview-level and `sequences`-level content
  has no natural home and is the shape most likely to go unexpressed. Other capabilities
  that contribute overview prose are worth the same check.
- **Do not read finding 1 as a code gap.** Both artifacts are present and correct in
  `tools/generate/src/cli/ai/l1-surface.json`. Resolution is `story-body-edit` (then
  `ac-add` downstream), never `code-issue`.
- **Ledger note for future checks.** As of this check, CAP-99's entire cumulative intent
  is REQ-131 via BUNDLE-19 (`free_and_reconciled`, merged at
  `b18b859d7414a049be45e09f48426d73742e5bf2`). No intent has retired any CAP-99
  behaviour. If a future check sees a second intent here, it is genuinely new.
