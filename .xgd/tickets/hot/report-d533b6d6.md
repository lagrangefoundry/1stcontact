---
uid: report-d533b6d6
id: REPORT-2048
type: report
title: 'Capability-Intent Alignment: Page Authoring Through The Control Surface: Read
  & Replace The Element Tree (level=story)'
created_by: xgd
created_at: '2026-08-16T02:07:52.735205+00:00'
updated_at: '2026-08-16T02:07:52.735205+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-fe236246
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Page Authoring Through The Control Surface: Read & Replace The Element Tree
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Anchor report: report-7ef6a9ea. CAP-93 (`capability-fe236246`), one story
(STORY-106 / `story-189fc1ac`, `story_kind=feature`, status `completed`), 12 active
ACs (AC-1083 … AC-1094), 0 deprecated.

## Cumulative Intent Considered

STORY-106's `fields.intent_uid` is **BUNDLE-17** (`bundle-e59210c5`,
`free_and_reconciled`, `merged_at_commit 0198704b7e29db3c53cf569070042cec0eb467bc`),
which rolls up eight source requests. Dereferencing the bundle, exactly one of the eight
is the governing intent for this capability; the rest land on sibling capabilities.
Later requests (REQ-131 … REQ-148) were swept for asks that would touch this
capability's surface; two are imminent and are carried below.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-126 | free_and_reconciled | 2026-08-08 | Declared the control surface (16 ops, error taxonomy, addressing contract). **Depended on, owned by CAP-92** | YES (dependency, not this capability) |
| REQ-127 | free_and_reconciled | 2026-08-08 | Tooling configuration over the surface, deletes `declare.ts`. **Owned by CAP-92** | YES (dependency, not this capability) |
| REQ-129 | free_and_reconciled | 2026-08-09 | **The governing intent.** `describe_page` widened to every node; verbatim `get_l1`; subtree-replacing `set_l1`; `get_copy`/`set_copy` retired from the AI surface; security guarantee relocated to L1's closed schema; operator modal unchanged | YES — primary |
| REQ-130 | free_and_reconciled | 2026-08-09 | Beyond the element tree: config, components, page metadata, generated assets. **Owned by CAP-94** | YES (sibling, explicitly out of scope here) |
| REQ-119 / REQ-121 / REQ-122 / REQ-128 | free_and_reconciled | 2026-07-31 … 2026-08-08 | Request-time render; copy-modal chrome; chat panel; background-image picker. No reach into this capability's surface | YES (unrelated to this capability) |
| REQ-131 | ready_to_reconcile | 2026-08-11 | Draft change journal. Clause *"every mutating operation returns the resulting counter"* would extend `set_l1`'s result contract | **imminent — not landed** |
| REQ-137 | bundled | 2026-08-12 | L1 palette: `steps` deleted from the entry, `shade` added to the reference — changes the vocabulary `get_l1` returns verbatim | **imminent — not landed** |
| REQ-134 | abandoned | 2026-08-12 | Image-generation component | NO |

Both imminent intents were checked against the working tree and **neither has landed on
this branch**: no journal/counter symbol exists under `tools/generate/src/cli/` or
`packages/site-schema/src/`, and `packages/site-schema/src/l1/palette.ts:72` still
carries `steps` with no `shade`. Neither is therefore enforceable against the matrix
today, and neither is recorded as drift.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-93 (capability body) | REQ-129 | aligned — scope bullets (map / verbatim read / bounded replace / closed vocabulary / one write path) restate REQ-129's four delivered parts; out-of-scope correctly cedes governance to CAP-92 and beyond-the-tree to CAP-94 |
| STORY-106 | REQ-129 (primary); REQ-126, REQ-127 (depended-on) | aligned — every in-scope bullet, both recorded divergences, and both out-of-scope items trace to REQ-129 text |
| STORY-106 | REQ-131 (imminent) | aligned today; `set_l1`'s result contract will need a story-body edit **at reconcile, not now** |
| STORY-106 | REQ-137 (imminent) | aligned, and durably so — story and AC-1085 speak of "a reference to a site-level value" generically, never of `steps`, so the entry-model change needs no matrix edit |

### Consistency — story body against intent

Every substantive claim in STORY-106's body is traceable:

- "roughly half the elements were invisible" ← REQ-129's measured 67/122 (54%) visible.
- "no styling ... reachable at all" ← REQ-129's "86 nodes carrying `axes` — exposed nowhere".
- "the narrower copy-field pair retires **from this surface**" — correctly scoped: the pair
  is gone from `l1-surface.json` (verified: no `get_copy`/`set_copy`), while `copyFieldsOf`
  survives at `packages/site-schema/src/l1/edit.ts:700` for the operator modal, which is
  what AC-1093/AC-1094 and REQ-129's "untouched" section require.
- The two recorded divergences — degraded refusal specificity, and the vestigial `nav` key —
  are REQ-129's own "Upstream finding" and "Not in scope" sections, carried as known limits
  rather than claimed as correct behaviour. AC-1090's body asserts the mitigation (recovery
  strategy) and explicitly disclaims the field name, exactly as REQ-129 instructs.

No text was found in the story body that no intent supports.

### Coverage — intent expressed in the story tree

REQ-129's delivered asks map onto the AC set without residue: map-emits-every-node (AC-1083),
label-not-values and no-axes (AC-1084), verbatim read (AC-1085), read→write→unchanged
(AC-1086), subtree replace with siblings intact (AC-1087), add/remove as group replacement
(AC-1088), closed-vocabulary refusal byte-unchanged (AC-1089), correctable refusal (AC-1090),
bad address (AC-1091), retirement + declared↔implemented correspondence + grant (AC-1092),
and the two modal invariants (AC-1093, AC-1094).

Implementation symbols named in the story all exist: `replaceL1Node`
(`packages/site-schema/src/l1/edit.ts:134`), `editL1Get` / `editL1Set` /
`writeSegmentRoots` (`tools/generate/src/cli/edit.ts:595`, `:634`, `:383`), `AuthorPages`
declared in `l1-surface.json:457` and granted in `instances.json:6`.

### Exclusivity

No overlap. STORY-105 (CAP-92) names "how far the surface reaches into a page and beyond
it" as out of scope and defers it to the authoring stories; STORY-106 reciprocally cedes
argument-checking, the error taxonomy, provenance and audit to CAP-92; STORY-107 (CAP-94)
takes everything outside the element tree, which STORY-106 lists as out of scope. The
three story bodies partition the surface cleanly.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-106 | — | REQ-129 asked that the surface's declared *absences* be rewritten (two deleted, one added for whole-document submission). No CAP-93 AC asserts absence content — correctly, because STORY-105 (CAP-92) owns "declared absences" under self-documentation. Verified present in `l1-surface.json` as "Replacing a whole page in one call", with both retired absences gone | none — coverage sits in CAP-92 by design |
| 2 | info | consistency | STORY-106 | — | REQ-131 (`ready_to_reconcile`) will make every mutating operation return a draft counter, extending `set_l1`'s result. Code not on this branch; editing the story now would describe behaviour that does not exist | none now — revisit when REQ-131 reconciles |
| 3 | info | consistency | AC-1085 | — | REQ-137 (`bundled`) deletes `steps` and adds `shade`. AC-1085 and the story body describe the verbatim guarantee generically ("a reference ... comes back as that reference"), so the palette model change requires no matrix edit | none — wording is already model-agnostic |
| 4 | info | — | CAP-93 | — | The capability ticket carries no `intent_uid`/`updated_by`; its only path to intent is through STORY-106, whose `intent_uid` is a bundle of eight requests, of which one (REQ-129) governs | none — traceability observation, see notes |

## Notes for the Editor

**Traceability friction, not drift.** Establishing what intent governs this capability
required dereferencing BUNDLE-17 into its eight constituent requests and discarding seven.
CAP-93 itself carries no `intent_uid`, and STORY-106's points at the bundle rather than at
REQ-129. Nothing is *wrong* — the chain resolves — but every future alignment check on this
capability pays the same cost, and the risk is that a later check attributes a sibling
request's asks (REQ-130's beyond-L1 work is the likely confusion) to this capability. If
bundle-level `intent_uid` is the house pattern, this is systemic rather than a CAP-93
defect and should be raised once at the tooling level rather than repaired here.

**Two imminent intents are queued against this capability and neither has landed.** That
combination — reconciled matrix, unlanded imminent intent — is the state most likely to
produce a false drift finding on the next run. Both were verified absent from the working
tree this cycle (`palette.ts:72` still has `steps`; no journal symbol anywhere). Re-verify
rather than assume when REQ-131 or REQ-137 changes status.

**Scope note on `surface_version`.** REQ-129 bumped it 1→2; the tree now reads 3
(`l1-surface.json:4`), REQ-130 having bumped it again. Neither STORY-106 nor any AC pins a
version number, so this is correctly not drift — worth stating because a version literal in
the matrix would have broken here.

**Method.** Static analysis only. The suite was not executed: this session's permission mode
denies the test runner, a limit carried from the preceding cycles on this branch. Every
alignment judgement above is a reading of ticket text against ticket text, corroborated by
grep/read of the named production symbols; no claim is made that CAP-93's UATs currently
pass. That verification remains outstanding for this branch and is not something a
story-level alignment check would establish in any case.
