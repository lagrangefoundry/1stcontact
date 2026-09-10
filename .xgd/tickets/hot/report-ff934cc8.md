---
uid: report-ff934cc8
id: REPORT-3698
type: report
title: 'Capability-Intent Alignment: Draft Change Journal: What Changed On The Draft,
  And Who Changed It (level=story)'
created_by: xgd
created_at: '2026-09-10T08:20:40.500068+00:00'
updated_at: '2026-09-10T08:20:40.500068+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-702b7c02
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Draft Change Journal: What Changed On The Draft, And Who Changed It
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Attempt 2 of this check. Both findings from report-642edd91 (attempt 1) were repaired
by report-1359729f and are verified closed below. This pass re-derived the ledger
independently rather than trusting the prior one, and it found **four intents the prior
sweep did not list** — all of them imminent (`ready_to_reconcile` / `free_coded`) and
none of them adding, refining or retiring CAP-99 behaviour. One prior-ledger entry
(REQ-160) has since moved `draft` → `ready_to_reconcile`; re-checked, still out of this
capability.

## Cumulative Intent Considered

CAP-99 (`capability-702b7c02`) carries no `intent_uid` of its own. Its single story
STORY-115 (`story-6cd17452`) carries `intent_uid: bundle-77b28def` (BUNDLE-19,
`free_and_reconciled`, `merged_at_commit: b18b859d7414a049be45e09f48426d73742e5bf2`).
Of BUNDLE-19's nine member intents, exactly one is about this capability: **REQ-131**.
None of the 16 ACs carries an `intent_uid` or `updated_by` chain, so REQ-131 is the
whole *enforced* ledger.

The sweep for a second intent went wider than a title scan: every `request-*` and
`bug-*` ticket body in the main store was searched for `REQ-131`, "change journal",
`.journal.json`, `1c changes`, "draft counter" and "change count". Five later intents
reference the change count; each was read for whether it moves CAP-99's own behaviour.

**Store note.** Intent statuses below are read from the **main** store
(`/Users/martin/lagrangefoundry/1stcontact/.xgd/tickets`), which is ahead of this
regression worktree's store — REQ-160 reads `draft` here and `ready_to_reconcile` on
main (updated 2026-09-09). Main is the authority for intent status; the worktree copy
is stale.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-131 (`request-5d3bf630`) | free_and_reconciled (via BUNDLE-19) | created 2026-08-11, reconciled 2026-08-20 | The whole capability: monotone per-site count returned by **every** write; bounded window of self-describing records; a declared `ReadSite` read marked untrusted; the operator's CLI read; the per-turn push signal; the manual's overview paragraph + `sequences` entry + `absences`-on-undo adjustment. Plus an appended **"As built"** half pinning four open decisions and recording one divergence. | **YES — the whole ledger** |
| REQ-157 (`request-3f8737f2`) | ready_to_reconcile | 2026-08-20 | The fidelity surface (look/compare/judge). Its AC8 asserts *"no operation on this surface moves the site's change counter"* — an invariant **about** the count, stated on another capability's surface. Adds nothing to CAP-99. | imminent — out of this capability |
| REQ-160 (`request-bbff35c7`) | ready_to_reconcile *(was `draft` at attempt 1)* | 2026-08-30 | Session seeding, the **knowledge-corpus** cursor and its per-turn delta channel. Re-read in full this pass: it reuses the cursor-and-delta *pattern* for the KB corpus and never touches the draft, the journal or `list_changes`. | imminent — out of this capability |
| REQ-171 (`request-72001560`) | ready_to_reconcile | 2026-09-01 | Session-prompt/reminder review. Amendment 1 explicitly **keeps** REQ-131's draft-change signal in the per-turn channel as a named exception (*"a per-turn channel is the only place a per-turn signal can go"*). Confirms AC-1266's behaviour; changes none of it. | imminent — confirms, does not change |
| BUG-43 (`bug-360c5a44`) | ready_to_reconcile | 2026-09-01 | Builder preview never reloads after an assistant turn. Fix emits a per-write `{kind:'site_changed'}` turn-stream event derived from **the draft change count**, so the preview frame reloads as writes land. A new *consumer* of the count; the count itself, the records and the reads are unchanged. | imminent — see editor note 2 |
| REQ-182 (`request-8c474a78`) | free_coded | 2026-09-03 | DOC-22 session priming. The reminder becomes six declared entries and REQ-131's change signal becomes a **provider returning `null` when no changes landed** — which *is* AC-1266's "told when it moved, not told when it did not", in a different delivery shape. Its own success criteria require the existing REQ-131 UATs to keep passing. | coded, not reconciled — preserves CAP-99 behaviour |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-99 (`capability-702b7c02`) — capability body | REQ-131 | **aligned.** Per-site monotone count, bounded window of self-describing records, baseline-advances-so-no-actor-filtering, explicitly-not-a-revision, explicitly-not-`status`, losing-it-is-never-incorrectness — every claim traces to named REQ-131 text. |
| STORY-115 (`story-6cd17452`), `story_kind: feature`, `status: completed` — Story + "In scope" | REQ-131 Parts 1–3 | **aligned, and the attempt-1 gap is closed.** Six in-scope bullets now map onto Part 1 (count / self-describing records / bounded window / a read for both callers), Part 3 (the push signal) and — new since attempt 1 — Part 2 bullets 3–4 (*"The manual guidance that tells the assistant what to do when the signal fires"*, naming the **overview** rule and the named **sequence**, signal → read the changes → act). |
| STORY-115 — "Out of scope" | REQ-131 out-of-scope list | **aligned 1:1.** Undo, the revisions model, client-facing UI surfacing, divergence detection against the ledger, and `status`. The Undo bullet also carries REQ-131 Part 2's `absences` adjustment (*"no longer has to narrate old values into the conversation"*) — verified against `l1-surface.json:1165`, which now reads exactly that way. |
| STORY-115 — Technical Context | REQ-131 "As built" half | **aligned, and complete since attempt 1.** Window 500 / 300 chars, per-site grain, actor attribution defaulting to the operator's own tools, record-at-return, journal kept outside the draft and un-version-controlled, degradation-never-failure, label from the shared segment derivation, baseline recorded *after* the turn, every-write-returns-the-count including the asset-shaped answers, **the no-op rule** (added by the attempt-1 fix), and **why the cross-cutting rule lives in the overview** (added by the attempt-1 fix). |
| STORY-115 — divergence handling | REQ-131 (spec says *"transactionally with the write it describes"*) | **aligned.** The story carries the divergence forward explicitly rather than absorbing it, and states the failure direction (a *stale* count over-reports; it never loses an edit). Recording rather than silently reconciling is the correct handling. |
| STORY-115 — cross-references | — | **aligned.** CAP-86 *"Structured Copy Editing: One Validated, Atomic Write Path"*, CAP-87 *"In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture"*, CAP-90 *"AI Site Assistant: Per-Site Conversations"*, CAP-92 *"Site Control Surface: Declared, Granted, Validated & Audited"* all exist and are what the story says they are. |
| STORY-115 — exclusivity | — | **N/A.** CAP-99 has exactly one story. A corpus scan of all 45 stories for change-count / journal language found only STORY-118 and STORY-121 (both CAP-c4c7a854, the storage port), neither of which expresses CAP-99 behaviour. |
| AC tree (AC-1253…AC-1268, 16 ACs) — surveyed only to settle story-level coverage | REQ-131 | REQ-131's nine ACs all land: AC1→AC-1253, AC2→AC-1256, AC3→AC-1257, AC4→AC-1258, AC5→AC-1259, AC6→AC-1260, AC7→AC-1264, AC8→AC-1265, AC9→AC-1266. Seven extras trace to the "As built" half or body prose: AC-1254 (no-op), AC-1255 (asset-shaped answers), AC-1261 (bounded/visibly cut), AC-1262 (unreadable store), AC-1263 (not a revision / byte-identity), AC-1267 + AC-1268 (the operator's CLI, human and machine-readable). Story-level coverage is therefore complete; whether the newly-expressed overview/sequence behaviour needs its own AC is an `ac`-level question (editor note 1). |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-115 — "In scope", bullet 6 | — | **Attempt-1 finding 1 (violation) verified closed.** The story now names both REQ-131 Part 2 deliverables that were previously unexpressed. Both are present in the shipped surface: the overview paragraph *"Your user can change the site themselves, while you are working on it…"* at `tools/generate/src/cli/ai/l1-surface.json:7`, and the sequence *"Pick up after your user has been editing"* (`list_changes` → …) at `l1-surface.json:1107-1109`. Matrix and code now agree. | none |
| 2 | info | consistency | STORY-115 — Technical Context | — | **Attempt-1 finding 2 (warning) verified closed.** The no-op rule is present: *"**A no-op advances nothing.** A write that changes no field — a copy save where the text is unchanged, a dry-run gap fix — returns the current count and appends no record."* Matches REQ-131's "As built" text and AC-1254. | none |
| 3 | info | consistency | STORY-115 — the operator's read | — | Story claim *"The operator reads the same log from the command line, in human and machine-readable form. One implementation, so the two cannot come to disagree"* verified against `tools/generate/src/cli/index.ts:1610` — `1c changes <slug> [--since n]` dispatches to `editChanges`, the same journal read the surface operation uses, and the source comment states the same reason the story gives. | none |
| 4 | info | coverage | BUG-43 (`bug-360c5a44`), imminent | — | Adds a per-write `site_changed` turn-stream event derived from the draft change count so the builder preview reloads mid-turn. Not yet reconciled, so its absence from the story tree is not drift at this gate. See editor note 2 for where it should land when it reconciles. | none |
| 5 | info | coverage | REQ-171, REQ-182, REQ-157, REQ-160 — all imminent | — | Each references the change count and none moves CAP-99's behaviour: REQ-171 and REQ-182 restructure *where and how* the reminder is assembled while preserving "told when it moved, not told when it did not"; REQ-157 asserts an invariant about the count from another surface; REQ-160 reuses the cursor pattern for the knowledge corpus. No story-tree change is called for. | none |

## Notes for the Editor

1. **The overview/sequence behaviour now has story text but no AC.** The attempt-1 fix
   put REQ-131 Part 2 bullets 3–4 into the story body, which closes the story-level
   gap. At `ac` level the question becomes whether AC-1264 (*"the change-reading
   operation is in the manual of a session granted the site-reading group"*) is
   stretched to cover the projected **overview paragraph** and **sequence**, or whether
   an `ac-add` is warranted. It is not a story-level finding and is deliberately not
   raised as one here — flagged so the `ac`-level pass does not have to re-derive it.

2. **BUG-43 is the next placement decision, and it is genuinely ambiguous.** Its
   `site_changed` event is read *from* this capability's count, but the value it
   delivers is builder-preview freshness — and STORY-115's out-of-scope list already
   excludes *"surfacing the log to the client in the builder UI"*. The recommendation is
   that it lands on the builder-preview capability with CAP-99 named as the mechanism it
   consumes, **not** as a new CAP-99 story. Decide it deliberately when BUG-43
   reconciles; do not let it widen CAP-99 by default.

3. **The cross-cutting-guidance shape remains the thing to watch.** REQ-131 deliberately
   put the change-detection rule in the surface *overview* rather than repeating it
   per-operation. Matrix elements are written per-behaviour, so overview-level and
   `sequences`-level content has no natural home — which is exactly how attempt 1's
   violation arose. Other capabilities that contribute overview prose deserve the same
   check.

4. **Ledger note for future checks.** As of 2026-09-10, CAP-99's enforced cumulative
   intent is still REQ-131 alone, via BUNDLE-19 (`free_and_reconciled`, merged at
   `b18b859d7414a049be45e09f48426d73742e5bf2`). Five further intents (REQ-157, REQ-160,
   REQ-171, BUG-43, REQ-182) reference the change count and are imminent or coded; none
   retires any CAP-99 behaviour. A future check that sees a **sixth** intent here, or any
   of these five reconciled with story-tree consequences, should re-open the coverage
   question — starting with BUG-43 per note 2.

5. **Status is stale in this worktree.** REQ-160 reads `draft` in the regression
   worktree's ticket store and `ready_to_reconcile` on main. Any future check running
   from a branch worktree should read intent status from main, not from the local copy.
