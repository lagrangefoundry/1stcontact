---
uid: report-920fcded
id: REPORT-2052
type: report
title: 'Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated
  & Audited (level=story)'
created_by: xgd
created_at: '2026-08-16T02:51:46.377295+00:00'
updated_at: '2026-08-16T02:51:46.377295+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-00e77e55
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Control Surface: Declared, Granted, Validated & Audited
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

All intent for this capability arrives through **BUNDLE-17** (`bundle-e59210c5`,
`free_and_reconciled`, merged at `0198704b7e29db3c53cf569070042cec0eb467bc`,
2026-08-10). STORY-105's `fields.intent_uid` is the bundle; the ledger below is
its eight source requests, of which five carry asks against this capability.

| Intent ID | UID | Status | When | Asked / changed (CAP-92 portion) | Counts? |
|---|---|---|---|---|---|
| REQ-122 | request-58b6a329 | free_and_reconciled | 2026-08-07 | First declared tool surface as data; manual as a projection, not authored beside it; declared `absent:` list; refusal carries code back to the model; site binding structural (no `slug` parameter) | YES (declaration half largely superseded by REQ-126/127) |
| REQ-126 | request-d9407f80 | free_and_reconciled | 2026-08-08 | **Primary.** The declaration as data (`ai/l1-surface.json`): envelope, 16 operations covering all of `edit.ts`, param types, return shapes, six `ErrorCode`s with caller-facing meanings, effect-homogeneous groups, sequences, absences, `surface_version`. Plus `toolbox.ts` binding, `instances.json` grant narrowing, provenance `untrusted` on reads, an audit sink, an author-time SDK-free validator | YES |
| REQ-127 | request-22a6521a | free_and_reconciled | 2026-08-08 | Configuration carries selection/policy/binding only — no prose; read/write classification becomes **enforced** rather than an unchecked flag. **Withdraws its own "site binding becomes a declared scope predicate" clause** (would reopen an error class by handing the model a `slug`). Session binding relocates to CAP-90 | YES (incl. one withdrawal) |
| REQ-129 | request-b1300473 | free_and_reconciled | 2026-08-09 | Declaration discipline: `get_copy`/`set_copy` retire in favour of `get_l1`/`set_l1`; group `WriteCopy` becomes `AuthorPages`; two absences deleted, one added; `surface_version` 1 to 2; upstream refusal-specificity gap recorded, not claimed closed | YES (contract portion; reach is CAP-93) |
| REQ-130 | request-ed6ba145 | free_and_reconciled | 2026-08-09 | Five operations added (`add_component`, `configure_component`, `remove_component`, `list_behaviors`, `write_image`); `DrawImages` declared as its own group **separate from `ManageAssets` so it can be withheld**; `surface_version` to 3 | YES (contract portion; reach is CAP-94) |
| REQ-119 | — | free_and_reconciled | — | Request-time draft/edit renders — no CAP-92 ask | YES, but out of this capability |
| REQ-121 | — | free_and_reconciled | — | Copy-edit modal elegance — no CAP-92 ask | YES, but out of this capability |
| REQ-128 | — | free_and_reconciled | — | Background-image picker — no CAP-92 ask | YES, but out of this capability |

No intent in the ledger is `abandoned`, `deprecated`, `wont_fix`, `draft` or
`ready_to_implement`; nothing was discounted. One clause was retired **by its own
author** (REQ-127's scope predicate) and is treated as retired below.

## Alignment Ledger

CAP-92 holds exactly one story. The sibling capabilities that consume it are
listed for the exclusivity check.

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-105 (`story-93905de4`, `feature`, completed) | REQ-126 (primary), REQ-122, REQ-127, REQ-129, REQ-130 | **aligned** — every in-scope bullet traces to a counting intent; the two divergences and one upstream gap are recorded in-body rather than absorbed |
| — its 12 ACs (AC-1071 to AC-1082) | as above | aligned; one coverage thinness noted (finding 1) |
| STORY-106 (`story-189fc1ac`, CAP-93) | REQ-129 | no overlap — body states "this story adds reach, not governance… argument checking, the error taxonomy, provenance marking and the per-call audit record are CAP-92's and are unchanged here" |
| STORY-107 (`story-b3de4571`, CAP-94) | REQ-130 | no overlap — body defers declaration, grant, error taxonomy, provenance and audit to "item 6 of this bundle" |
| STORY-103 (`story-a58a0974`, CAP-90) / STORY-104 (`story-7f437d57`, CAP-91) | REQ-122, REQ-127 | no overlap — session binding and pane, correctly outside CAP-92 |

### Claims verified against the tree

STORY-105's Technical Context makes three checkable factual claims. All three hold:

| Claim | Verified against | Result |
|---|---|---|
| "the surface in the tree carries twenty-one [operations]… its own version reads 3" | `tools/generate/src/cli/ai/l1-surface.json` | 21 operations (9 read / 12 write); `surface_version: 3` beside format `version: 1` — matches AC-1072's "distinct from the version of the format" |
| "granted neither the management of image and font files nor publishing" | `tools/generate/src/cli/ai/instances.json` | `caretaker.l1.groups` = ReadSite, AuthorPages, ManagePages, ManageComponents, WriteConfig, DrawImages. Declared but ungranted: **ManageAssets**, **Publish** — exactly the two named |
| "the criteria below therefore say 'an operation is declared and not granted'" | AC-1074 + `tests/test_UAT_FC_REQ-126_l1_surface.test.ts:195-218` | AC-1074 names both instances; the UAT asserts `add_asset`/`remove_asset`/`publish` are declared, absent from what is offered, and absent from the manual |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | STORY-105 / AC-1080 | ac-add | The declaration's **worked sequences** are named in the capability scope, in the story body's declaration bullet, and shipped (`l1-surface.json` carries 6 named sequences with steps and notes), but no CAP-92 AC covers them. AC-1080 — the projection criterion — enumerates "every offered operation, the error meanings, and the declared absences" and stops short of sequences; AC-1081 covers addressing only. The single assertion over `L1_DECLARATION.sequences` in the tree lives in CAP-93's `tests/reconciliation-page-composition-surface.test.ts:472-475` and reaches only the add/remove sequence | Author an AC under STORY-105 asserting the declared sequences are part of the projection: each names steps that are all declared operations, and a sequence naming an ungranted operation does not reach a consumer that lacks it. Action at the **ac-level** cycle — story body needs no change |
| 2 | info | consistency | STORY-105 | — | STORY-105 diverges from REQ-126's stated grant ("copy, pages, config and publish are granted") by withholding publishing as well as asset management. This is **recorded divergence, not drift**: the story names it under "Divergences from the intent, recorded rather than absorbed", gives the reason (the upstream invocation path is synchronous, so an operation awaiting a published render cannot be hosted correctly yet — a limit REQ-126's own comment thread records confirming empirically, COMMENT-869), and the ACs are deliberately written independent of the granted set. REQ-126's body was never amended, so a future reader could mistake this for drift | none — see Notes for the Editor |
| 3 | info | consistency | STORY-105 | — | REQ-127's withdrawn clause ("the site binding becomes a declared scope predicate the tooling object enforces") is correctly **absent** from the story body. The story instead reflects the shipped decision — site binding is construction-time and no operation declares a `slug`. Had the story claimed a scope predicate, that would have been a violation | none |
| 4 | info | consistency | STORY-105 | — | The "known upstream gap" the story declines to claim closed (the Toolbox renders a declared class meaning and drops the host's per-call pointer) is consistent with how AC-1077 is written — it asserts the code and its **declared** caller-facing meaning, not a per-call hint the surface cannot deliver. The matrix asserts the mitigation that exists, not the fix that does not | none |
| 5 | info | exclusivity | STORY-105 vs STORY-106/107 | — | No overlap. Both consuming stories name CAP-92 as owner of declaration, grant, error taxonomy, provenance and audit, and list `story-93905de4` in their Dependencies. STORY-106's "the narrower copy-field pair retires from this surface" is the specific retirement REQ-129 performed, not a restatement of STORY-105's general declaration discipline | none |
| 6 | info | — | STORY-105 cross-references | — | Every capability/story reference in the body resolves correctly: CAP-86 = `capability-f753cecd` (`story-37a3921b` = STORY-100), CAP-90 = `capability-7e4714b7` (`story-a58a0974` = STORY-103), CAP-91 = `capability-44a04848`. The "authoring stories" it defers to exist as CAP-93 (`capability-fe236246`) and CAP-94 (`capability-2d32662d`) | none |

## Notes for the Editor

**The capability is well aligned; the story body needs no edit.** Every bullet in
STORY-105's in-scope list traces to a counting intent, and the three factual
claims it makes about the shipped surface were checked against the declaration and
the grant rather than taken on trust.

Two things a downstream reader should carry forward:

1. **The publish divergence is the one place matrix and intent-body disagree, and
   the matrix is right.** REQ-126's body still reads "copy, pages, config and
   publish are granted"; the tree withholds `Publish`. The story flags this
   explicitly, the reason is grounded in REQ-126's own comment thread, and AC-1074
   plus `test_UAT_FC_REQ-126_l1_surface.test.ts:195-218` evidence the shipped
   state. Repairing this by editing STORY-105 would make the matrix *less* true.
   If anything is to be reconciled, it is REQ-126's body — outside this check's
   read-only remit, and noted here so the next cycle does not re-litigate it.

2. **`sequences` is the one declared element with no criterion of its own**
   (finding 1). The declaration has seven top-level content parts — operations,
   param_types, shapes, errors, groups, sequences, absences — and six of them are
   pinned by an AC. Sequences are the exception, and their only assertion in the
   tree sits under a different capability. Worth closing at the **ac** level of
   this same validation cycle, where the fix is one AC rather than a story edit.

Cross-cutting observation: this capability is unusual in that its intent arrives
as one bundle of eight requests, five of which touch it, and two of those five
(REQ-129, REQ-130) extend the declaration while placing their *reach* in sibling
capabilities. The boundary held — both sibling stories explicitly disclaim
governance — but it is the seam most likely to blur under future work, because the
natural place to describe a new operation is the story that adds it. The
discipline that kept it clean is STORY-105's ACs being written about the
declaration's *properties* rather than about its *contents* (AC-1073 asserts
declared is equivalent to callable rather than naming operations), and that should
be preserved.
