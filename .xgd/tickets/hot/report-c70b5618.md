---
uid: report-c70b5618
id: REPORT-3833
type: report
title: 'Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated
  & Audited (level=story)'
created_by: xgd
created_at: '2026-09-11T01:05:05.781035+00:00'
updated_at: '2026-09-11T01:05:05.781035+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-00e77e55
  level: story
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated & Audited
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

CAP-92 (`capability-00e77e55`) holds exactly one story, STORY-105
(`story-93905de4`, `story_kind: upgrade`, status `updated`, body last rewritten
2026-08-31).

The previous story-level check (REPORT-2052, 2026-08-16, PASS) predates two
reconciled bundles — BUNDLE-19 (completed 2026-08-20) and BUNDLE-20 (completed
2026-08-31) — and predates the story body's own rewrite. This is the first
story-level assessment against the current ledger.

## Cumulative Intent Considered

STORY-105's recorded chain is `fields.intent_uid = bundle-e59210c5` (BUNDLE-17)
and `fields.updated_by = [bundle-b3b7c399]` (BUNDLE-20). A third reconciled
bundle — **BUNDLE-19** (`bundle-77b28def`) — also carries asks against this
capability and is **absent from that chain**; it is included below because the
ledger is built from what touched the capability, not from what the ticket
records.

| Intent ID | Bundle | Status | When | Asked / changed (CAP-92 portion) | Counts? |
|---|---|---|---|---|---|
| REQ-122 | BUNDLE-17 | free_and_reconciled | 2026-08-07 | First tool surface declared as data; manual as a projection not authored beside it; declared `absent:` list; a refusal comes back correctable within the turn; site binding structural (no `slug` parameter) | YES (declaration half later superseded by REQ-126/127) |
| REQ-126 | BUNDLE-17 | free_and_reconciled | 2026-08-08 | **Primary.** `ai/l1-surface.json` as data: envelope, **16 operations** covering all of `edit.ts`, param types, return shapes, six `ErrorCode`s with caller-facing meanings, effect-homogeneous groups, sequences, absences, `surface_version` beside the format version. Plus `toolbox.ts` over `edit.ts`, `instances.json` as a separate grant, `provenance: untrusted` on reads, an audit sink per call, an author-time SDK-free validator | YES |
| REQ-127 | BUNDLE-17 | free_and_reconciled | 2026-08-08 | Read/write classification becomes **enforced**, not an unchecked flag. Withdraws its own "site binding becomes a declared scope predicate" clause; session binding relocates to CAP-90 | YES (incl. one self-withdrawal) |
| REQ-129 | BUNDLE-17 | free_and_reconciled | 2026-08-09 | Declaration discipline: `get_copy`/`set_copy` retire for `get_l1`/`set_l1`; `WriteCopy` → `AuthorPages`; upstream refusal-specificity gap recorded, **not** claimed closed | YES (governance portion; reach is CAP-93) |
| REQ-130 | BUNDLE-17 | free_and_reconciled | 2026-08-09 | Five operations added; `DrawImages` declared as its own group **separate from `ManageAssets` so it can be withheld** | YES (governance portion; reach is CAP-94) |
| **REQ-133** | **BUNDLE-19** | free_and_reconciled | 2026-08-12 | **Declares `get_palette` into `ReadSite` and a new `ManagePalette` group (4 writes) granted to `caretaker`** — "the read grantable separately from the writes" | **YES — not in STORY-105's chain** |
| **REQ-131** | **BUNDLE-19** | free_and_reconciled | 2026-08-11 | **Declares `list_changes` into `ReadSite` with `returns.provenance: "untrusted"`; adds a `sequences` entry and an `overview` paragraph; widens `change` / `publish_result` shapes.** Its AC7 (projected into the manual only for a session granted `ReadSite`) and AC8 (slice marked untrusted) are CAP-92 governance asks | **YES — not in STORY-105's chain** |
| REQ-146 | BUNDLE-20 | free_and_reconciled | 2026-08-15 | Audit becomes **durable** and survives the host (AC3); the surface splits into a portable core plus the host's own operations, so "everything declared is callable" is a claim about their composition; `publish` **stays ungranted**, by name (AC7, §4) | YES |
| REQ-149 | BUNDLE-20 | free_and_reconciled | 2026-08-17 | Revisions move onto the storage port, so `publish` becomes an ordinary portable-half operation; `add_asset` becomes the sole disk-bound operation; the operator publishes from the toolbar / CLI | YES |
| REQ-119, REQ-121, REQ-128 | BUNDLE-17 | free_and_reconciled | 2026-08 | No CAP-92 ask | YES, but out of this capability |
| BUG-35, REQ-137, REQ-139, REQ-140 | BUNDLE-18/19 | free_and_reconciled | 2026-08 | No CAP-92 ask (editor/modal/palette-model) | YES, but out of this capability |
| REQ-154 | — | bundled | 2026-08-20 | Browser Rendering driver — no CAP-92 ask | imminent, no effect here |
| REQ-155/156/157/158/159/160 | — | draft | 2026-08-20…30 | Fidelity surface, KB in the Worker, session seeding — would extend this surface, **not yet active** | NO (draft) |

Nothing in the ledger is `abandoned`, `deprecated` or `wont_fix`. One clause was
retired by its own author (REQ-127's scope predicate) and is correctly absent
from the story body.

### Declaration growth, measured against the ledger

`tools/generate/src/cli/ai/l1-surface.json` at each landing commit:

| Commit | Date | Intent | Ops | `surface_version` | Groups |
|---|---|---|---|---|---|
| `c8a4a6c56e` | 2026-08-08 | REQ-126 (BUNDLE-17) | **16** | 1 | 6 |
| `bb00892aa2` | 2026-08-09 | REQ-129 (BUNDLE-17) | 16 | 2 | 6 |
| `734bf5db11` | 2026-08-09 | REQ-130 (BUNDLE-17) | **21** | 3 | 8 |
| `5e11ffd777` | 2026-08-13 | **REQ-133 (BUNDLE-19)** | 26 | 3 | **9** (`ManagePalette`) |
| `c745a1184d` | 2026-08-14 | **REQ-131 (BUNDLE-19)** | **27** | **4** | 9 |
| `HEAD` | — | — | 27 | 4 | 9 |

BUNDLE-17 closed on 2026-08-10 at **21** operations. The six operations beyond
that — `get_palette`, `set_palette_color`, `add_palette_color`,
`remove_palette_color`, `rename_palette_color`, `list_changes` — are BUNDLE-19's.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-105 (`story-93905de4`) — Description, in-scope bullets | REQ-122, REQ-126, REQ-127, REQ-129, REQ-130, REQ-146, REQ-149 | **aligned** — every bullet traces to a counting intent (declaration, grant, one-declaration-two-runtimes, effect enforcement, validation-before-invocation, refusal as information, provenance, durable audit, self-documentation, one write path) |
| STORY-105 — "Divergences from the intent", bullet 2 (operation count) | BUNDLE-17 only | **gap: finding 1** — attributes the surface's growth to "later work in this same bundle"; six of the eleven extra operations are BUNDLE-19's (REQ-133, REQ-131) |
| STORY-105 — "Divergences", bullet 1 (publish ungranted) | REQ-126 → superseded by REQ-146 AC7/§4 | aligned, and now **ratified** rather than divergent — see finding 3 |
| STORY-105 — "Reconciliation Decisions" (all three) | REQ-146, REQ-149 | aligned; verified against the tree (below) |
| STORY-105 — `fields.updated_by` | `[bundle-b3b7c399]` | **gap: finding 1** — BUNDLE-19 (`bundle-77b28def`) touched the declaration and is not recorded |
| STORY-105 — Dependencies vs Technical Context | — | **warning: finding 2** — internal contradiction |
| AC-1411 (durability) | REQ-146 AC3 | expressed as its own criterion exactly as the Reconciliation Decisions say; `status: pending`, no `uat_coverage` — finding 4, for the ac/uat cycles |
| STORY-103 (CAP-90), STORY-106 (CAP-93), STORY-107 (CAP-94), STORY-113/114 (CAP-98, palette), STORY-115 (CAP-99, change journal) | REQ-122/127, REQ-129, REQ-130, REQ-133, REQ-131 | **no overlap** — each defers declaration, grant, taxonomy, provenance and audit to this capability by name |

### Story-body claims verified against the tree

| Claim (STORY-105) | Verified against | Result |
|---|---|---|
| "today the builder's assistant is granted neither the management of image and font files nor publishing" | `tools/generate/src/cli/ai/instances.json` | holds — `caretaker.l1.groups` = ReadSite, AuthorPages, ManagePages, ManageComponents, WriteConfig, ManagePalette, DrawImages; **ManageAssets** and **Publish** declared and withheld |
| "an operation genuinely needing the operator's own disk lives with the host that has one, and is absent where there is none" | `tools/generate/src/cli/ai/toolbox.ts:117-124` | holds — `nodeOperations` supplies `add_asset` and nothing else; its doc comment records the REQ-149 move of `publish` into `toolbox-core.ts` |
| "The intent names sixteen operations" | `l1-surface.json` @ `c8a4a6c56e` | holds — 16 |
| "site content coming back from a read is marked … a consumer's own change confirmations are not marked" | `l1-surface.json` `returns.provenance` | holds — all ten site-content reads are `untrusted`; every `write` returns unmarked (`list_behaviors`, a framework catalog rather than site prose, is likewise unmarked) |
| "one object per record under distinct keys … flushed while the response is still open and inside a `finally`" | `apps/control-app/src/ai.ts:124-151`, `router.ts:659-700` | holds |
| "a refusal … reports the declared class meaning and drops the host's own pointer into the offending value" (declared *not* closed) | BUNDLE-17 §"Upstream finding — refusal specificity"; `l1-surface.json` `errors.SCHEMA_INVALID` | holds — the declared meaning carries a recovery strategy rather than a per-call pointer it cannot deliver |
| Cross-references CAP-86 = `story-37a3921b`, CAP-90 = `story-a58a0974`, site-store = `capability-c4c7a854` | ticket store | all three resolve (STORY-100 / `capability-f753cecd`; STORY-103 / `capability-7e4714b7`; CAP-101) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-105 (`story-93905de4`), Technical Context → "Divergences from the intent, recorded rather than absorbed", bullet 2 | story-body-edit | The body says: *"the surface in the tree carries more, because later work **in this same bundle** extended the same declaration."* The ledger does not support "this same bundle". BUNDLE-17 (`bundle-e59210c5`, free_and_reconciled, completed 2026-08-10) closed the declaration at **21** operations / `surface_version: 3` (`l1-surface.json` @ `734bf5db11`). The tree carries **27** at `surface_version: 4`. The six extra were declared by **BUNDLE-19** (`bundle-77b28def`, free_and_reconciled, completed 2026-08-20): REQ-133 added `get_palette` plus the new `ManagePalette` group (`5e11ffd777`, 2026-08-13) and REQ-131 added `list_changes` (`c745a1184d`, 2026-08-14). The same omission is in the ticket fields — `fields.updated_by` is `[bundle-b3b7c399]` and does not include `bundle-77b28def` — so a reader reconstructing this capability's intent from STORY-105 alone misses a whole reconciled bundle that extended the declaration it owns | Rewrite the bullet to name the actual extending intents: within BUNDLE-17, REQ-129 and REQ-130; afterwards, REQ-133 (`ManagePalette` + `get_palette`, granted) and REQ-131 (`list_changes`, `ReadSite`, `untrusted`) from BUNDLE-19. Keep the existing "the criteria here are about the declaration's discipline and are deliberately independent of the count" sentence — it is correct and is why this is a provenance error rather than a coverage gap. Additionally add `bundle-77b28def` to `fields.updated_by` |
| 2 | warning | consistency | STORY-105, "## Dependencies" vs "## Technical Context" | story-body-edit | The body's first Technical Context bullet says *"**Depends on CAP-86** (`story-37a3921b`, structured editing) for the single validated, atomic write path"*, while the Dependencies section says *"None."* and lists only consumers and the audit's storage capability. The two sections contradict each other on the same fact | Either record CAP-86 / `story-37a3921b` under Dependencies, or qualify the "None." (e.g. "None outstanding — CAP-86's write path is already built; see Technical Context") so the two sections agree |
| 3 | info | consistency | STORY-105, "Divergences", bullet 1 (publish declared but not granted) | — | This is framed as an unreconciled divergence from REQ-126 ("the intent's scope says the builder-chat grant includes publishing"). It is no longer one: **REQ-146** (free_and_reconciled) AC7 states *"The `publish` operation is not reachable from the assistant"* and its §4 says publish *"is not in the `caretaker` grant today and must not arrive with this change"* — a later counting intent ratifying the shipped grant. REQ-149 then made publish portable without re-granting it, and made the operator's toolbar/CLI the publishing path. The story's Reconciliation Decisions already record this correctly; the Divergences bullet is historically accurate and need not change | none — noted so a future check does not re-open it as drift |
| 4 | info | coverage | AC-1411 (`acceptance_criterion-cb6e1b58`) | — | REQ-146 AC3's durability ask **is** expressed in the story tree, as its own criterion, exactly as the Reconciliation Decisions say it should be — so story-level coverage is satisfied. But AC-1411 carries `status: pending` and no `uat_coverage`, while STORY-105 and CAP-92 both read `uat_coverage: pass`. The three prior ac/uat-level reports (REPORT-2055/2058/2059, all 2026-08-16) predate AC-1411's creation (2026-08-31) and cannot have assessed it | none at story level — surface to the `ac` and `uat` cycles, which have not yet run against this criterion |
| 5 | info | exclusivity | STORY-105 vs STORY-103 / 106 / 107 / 113 / 115 | — | No overlap. STORY-103 (CAP-90) lists "the declaration, grant, parameter validation, error taxonomy and audit" as out of scope and names this capability as their owner; STORY-115 (change journal) lists CAP-92 under "Related" as "the assistant's session and its declared, granted, audited control surface" and claims only that its operation is "a declared read operation in the group it is already granted"; STORY-113 claims only that the five palette operations are "declared to the site assistant, the read grantable separately from the writes". Each declares reach, none restates governance | none |

## Notes for the Editor

**One repair, and it is a citation repair, not a behavioural one.** Every
behavioural bullet in STORY-105's in-scope list traces to a counting intent, and
every checkable factual claim it makes about the shipped surface was verified
against the tree in this pass (table above). The capability is substantively
aligned. What is wrong is the story's account of **where its own surface came
from**.

**The BUNDLE-19 omission is the pattern worth watching.** REQ-131 and REQ-133
both landed operations in `l1-surface.json` — the artifact CAP-92 exists to
govern — but their stories were filed under the capabilities that own the
*reach* (the change journal, the palette). Nothing linked them back to CAP-92,
so neither the story's `updated_by` nor its body knows they happened. The same
shape will recur: REQ-157 (fidelity surface) and REQ-158/160 (the knowledge
surface on the toolbox) are all `draft` today and all extend this same
declaration. When they reconcile, CAP-92's story will need the link even though
its own criteria will not change.

**Why this is a violation and not a warning.** The count-independence sentence
that follows it is correct, so no criterion is wrong and no AC is missing —
which is exactly why the error survived a fix cycle. Left alone it compounds:
the next alignment check re-derives the BUNDLE-19 link from git history, as this
one had to, and finds the story still pointing at one bundle.

**REPORT-2052 is stale, not wrong.** Its "21 operations … `surface_version` 3"
was accurate on 2026-08-16 for the tree it read; the story body it assessed
carried that count verbatim. The body has since been rewritten to be
count-independent, which is an improvement — the misattributed *cause* is what
survived the rewrite.
