---
uid: report-9f7e2b43
id: REPORT-1592
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing (level=ac)'
created_by: xgd
created_at: '2026-08-07T17:20:49.930206+00:00'
updated_at: '2026-08-07T17:20:49.930206+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: ac
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

First `ac`-level cycle for CAP-87 (`previous_attempt_count=1` is carried from
the story cycle — `xgd ticket list --type report --filter
fields.subject_uid=capability-12fee326` returns only story-level reports:
report-bf64e711 fail → report-415b9b22 fix → report-afb07aaa pass).

Per the level cascade, the story cycle passed at 2026-08-07T17:14
(report-afb07aaa), so STORY-98 and STORY-101 bodies are the working reference
here. Intent was consulted only where a story body was silent (finding 2) and
to confirm the deferred item the story cycle explicitly handed down (finding 1).

Scope: 28 acceptance criteria — 15 under STORY-101, 13 under STORY-98. Both
stories are `feature`/`upgrade` (`story_kind` = `feature` and `upgrade`
respectively), so both are in the Capability Matrix and both are expected to
carry ACs.

## Cumulative Intent Considered

Unchanged from report-afb07aaa's ledger, which was rebuilt rather than assumed.
Reproduced in compressed form; the story-level report holds the full walk.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-116 (`request-41796766`, via BUNDLE-14 `bundle-0385746c`) | free_and_reconciled | merged `cd8f98c8` | The edit render: third non-functional channel, settled state, derived segmentation, render-scoped addresses, renderer-drawn outlines, no leakage | YES |
| REQ-117 (`request-395b67e6`, via BUNDLE-16 `bundle-15c1f647`) | free_and_reconciled | merged `1741ee5d` | The gesture: click→target, `mountFields` in buffered commit, one Save = one diff, re-render + refresh, refusal keeps the words, View mode unaffected. Back-filled the render (`data-fc-page`, vocabulary → `site-schema`, hover in `L1_EDIT_CSS`, contact-form seam). Free-coded follow-ons: stale-address refusal (`69f06deb`), dismissible fieldless modal (`9fcba993`) | YES |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | merged `b2b9208c` | Image selection through the **same** loop: `copyFieldsOf` returns `src` (closed enum incl. the current handle) + `alt`; `L1FieldDescriptor.type` widened to `'string' \| 'enum'`; **no editor change**. Retires REQ-117's "Images — T4" non-goal | YES |
| REQ-115 (`request-a6740b4a`, via BUNDLE-16) | free_and_reconciled | 2026-07-31 | Builder shell/origin/modes — CAP-85 | YES (adjacent, out of capability) |
| BUG-32 (`bug-5cabb340`) | free_coded | 2026-08-05 | `@gendevlabs` → `@lagrangefoundry` scope rename | no behavioural ask; no AC in this capability names a package scope |
| REQ-119 (`request-64864801`) | draft | 2026-07-31 | Request-time renders (would retire the stale-rendering failure mode) | NO — draft; AC-1003 correctly still stands |
| REQ-44 (via BUNDLE-16) | free_and_reconciled | 2026-07-03 | Tooling hygiene | NO (out of capability) |

Cumulative intent at this level: **copy and image selection through one
kind-agnostic click → form → save → re-render loop over one edit render.**

## Alignment Ledger

### STORY-98 (`story-af36c2cb`, upgrade) — 13 ACs, all `active`

Every "In scope" bullet of the story body maps to exactly one owning AC, and no
AC claims behaviour the body does not carry.

| Story-body bullet | AC | Outcome |
|---|---|---|
| A third channel (own output location, always draft, no revision) | AC-958 | aligned |
| Deliberately non-functional (link target, form action/verb, no behaviour bundle beside it) | AC-948 | aligned |
| The settled state — scroll-reveal copy | AC-949 | aligned |
| The settled state — carousel, module declares its own behaviour-off state | AC-950 | aligned |
| Derived segmentation (incl. what is deliberately *not* a segment) | AC-951 | aligned |
| Addresses resolve to exactly one node, unique per namespace | AC-953 | aligned |
| Addresses are render-scoped, not persisted | AC-955 | aligned |
| Content in a seam is instance-rooted; every module marks its seam | AC-954 | aligned — the catalog-wide obligation is stated in the AC, not just the story |
| The page stamped on the document (id, not slug/filename) | AC-1007 | aligned |
| Outlines drawn by the renderer, hover included, nothing moves | AC-952 | aligned |
| One published vocabulary for the stamp | AC-1008 | aligned |
| No leakage into the shipped channels | AC-956 | aligned |
| (Technical Context) the definition's own element identifier is untouched | AC-957 | aligned — Technical Context is its only source, which is appropriate for a non-goal-shaped guard |

### STORY-101 (`story-3bf94bd4`, feature) — 15 ACs, 14 `active` + 1 `pending`

| Story-body bullet | AC | Outcome |
|---|---|---|
| Seeing what is about to be edited (one region, no layout shift) | AC-993 | aligned |
| Resolving a click — innermost | AC-995 | aligned |
| Resolving a click — module instance + seam scoping | AC-996 | aligned |
| A form over a copy region's fields (shared component, buffered, no markup route) | AC-994 | aligned |
| A form over an **image** region's fields (closed picker, current handle always present, kind-agnostic) | AC-1028 | **gap: status `pending` — finding 1** |
| One confirmed form is one change | AC-997 | aligned |
| The page updating (new content, no further step, still editable) | AC-998 | aligned |
| Being told no, without losing anything | AC-999 | aligned |
| Dead end 1 — nothing editable says so plainly | AC-1001 | aligned; correctly exemplified by the painted **container**, not the image (REQ-118 took that role away) |
| Dead end 1 — dismissible by three routes | AC-1002 | aligned; separate AC is deliberate per the story's `9fcba993` note |
| Dead end 2 — rendering too old to carry the coordinate | AC-1003 | aligned |
| Copy that no longer fits | AC-1004 | aligned |
| Viewing is not editing | AC-1005 | aligned |
| (Technical Context) one implementation of the address reading | AC-1006 | aligned |
| — no corresponding bullet — | AC-1000 | **finding 2**: criterion is real and tested, but the story body never states it |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | AC-1028 (`acceptance_criterion-26ffac6d`) | ac-edit | The AC covering REQ-118's gesture-side ask sits at `status: pending`, so it is **not in the enforced matrix**. `xgd_source/quality/ac_coverage_gate.py:14` — the gate queries "all `acceptance_criterion` tickets whose `status` is `active`" — so a `pending` AC is invisible to it, and 310 of the project's 313 ACs are `active`. REQ-118 is `free_and_reconciled` (merged `b2b9208c`) and STORY-101's body carries image selection as in-scope ("an image region exposes **which image goes here** — a closed picker of the site's own assets, always including the handle already in place — alongside its alt text"). AC-1028 is also the only AC carrying the kind-agnosticism property ("no second modal, no image-specific route, no separate transport"), so the gap is not merely the image kind. `pending` is the ticket type's `default` (`ticket_types.yaml` → `acceptance_criterion.properties.status.default: pending`) and nothing in `xgd_source/prompts/` or `xgd_source/workflows/` drains it — AC-718 and AC-719 have sat `pending` since 2026-08-05. report-afb07aaa finding 2 explicitly deferred this as "an ac-level action"; this is that level | `xgd ticket update acceptance_criterion-26ffac6d --fields '{"status":"active"}'`. No body change needed — the criterion text already matches STORY-101 and REQ-118 clause for clause |
| 2 | warning | consistency | AC-1000 (`acceptance_criterion-43e5a016`) | story-body-edit | AC-1000 ("Closing a form in which nothing was changed writes nothing and re-renders nothing — opening a form to look is not an edit") has **no counterpart in STORY-101's In-scope list**. The nearest text, "One confirmed form is **one** change no matter how many fields it held", is the n>1 case; the n=0 case is a separate assertion and is not implied by it. The behaviour is genuine, not invented: `apps/control-app/src/builder/editor.js:222-227` guards the Save ("Posting an empty change map would re-render the site for no diff") and `tests/reconciliation-copy-edit-gesture-modal.test.ts:387` (`test_UAT_AC1000_...`) proves confirm and cancel are the same answer when nothing changed. No intent in the ledger contradicts it; REQ-117 §2 is simply silent. So the AC is right and the story body is short — the criterion currently lives nowhere in the narrative layer | Add a clause to STORY-101's "A form over that region's fields" bullet, e.g. "…and a form the operator changed nothing in is not an edit: confirming it and cancelling it are the same answer — nothing written, nothing re-rendered." |
| 3 | info | coverage | AC-1028 | — | Forward notice for the `uat` cycle, not an ac-level fix. Once activated, AC-1028 has **no `test_UAT_AC1028_*` test**. Its evidence is `tests/req118-image-selection.test.ts::test_UAT_FC_REQ-118_clicking_an_image_segment_offers_a_picker_of_the_sites_assets`, whose name yields no AC id through `xgd_source/quality/uat_discovery.extract_ac_id_from_test_name`, so `check_active_ac_coverage` will report it as an orphaned active AC. Every other AC in this capability is covered by an `AC`-named test (AC-948…AC-958, AC-1007, AC-1008 in `tests/reconciliation-edit-render-channel.test.ts`; AC-993…AC-1006 across `tests/reconciliation-copy-edit-gesture.test.ts` and `…-gesture-modal.test.ts`) | none at this level — the uat cycle adds or renames the test |
| 4 | info | consistency | CAP-87 body (`capability-12fee326`) | — | report-afb07aaa finding 1 is **unrepaired**: the capability body still reads "the page showing **the new words**", narrowing the post-save outcome to copy while REQ-118 put image selection through the same gesture. Recorded for continuity only — the capability body is an upper-layer element, the story cycle passed with it as a warning, and no AC inherits the narrowing (AC-998 is scoped to copy by design and AC-1028 owns the image case) | none at this level |
| 5 | info | exclusivity | AC-952 + AC-1007 vs AC-956 | — | Examined and judged acceptable. AC-956 is the dedicated no-leakage criterion enumerating five absent artefacts; AC-952 closes with "The preview render of the same page carries neither treatment" and AC-1007 with "The shipped channels carry no such stamp", each restating one of those five. These are per-criterion contrast clauses that make each AC self-contained, not two ACs describing the same criterion — and the overlap is asymmetric (AC-956 is the only one asserting idempotence across repeated edit renders) | none |
| 6 | info | exclusivity | STORY-101 AC-997 vs AC-1000 | — | Adjacent but distinct: AC-997 is "many altered fields → one change", AC-1000 is "zero altered fields → no change and no re-render". Different scenarios, different failure modes, separate UATs. Not duplicates | none |

## Notes for the Editor

**The one blocking action is a single field write.** Finding 1 needs
`xgd ticket update acceptance_criterion-26ffac6d --fields '{"status":"active"}'`
and nothing else — the AC's body was authored in the story-level fix attempt and
already tracks REQ-118 and STORY-101 precisely. Do not rewrite it, and in
particular do not rename anything toward `segmentFieldsOf`: REQ-118's "Design
decisions" section explicitly chose to extend `copyFieldsOf` rather than rename
it.

**Sequence findings 1 and 3 together if the run permits.** Activating AC-1028
makes it visible to `check_active_ac_coverage`, which will then flag it as
orphaned until a test named `test_UAT_AC1028_*` exists. The evidence already
exists under a REQ-scoped name, so the uat-level work is a rename or an alias,
not new test authorship — but activating without it converts a silent gap into a
loud gate failure downstream.

**`pending` is a systemic trap, not a one-off.** The AC ticket type defaults
`status` to `pending`, the story-generation prompts
(`generate_story_feature.yaml:202`, `generate_story_upgrade.yaml:216`,
`generate_story_reconciliation.yaml:213`, `reconciliation_story_feature.yaml:318`)
create ACs by passing `"status":"pending"` inside `--fields`, and nothing in the
prompt or workflow tree ever moves an AC to `active`. AC-718 and AC-719 have sat
`pending` since 2026-08-05, one of them already carrying passing evidence. Any AC
authored by a validation-fix cycle will land the same way and be silently exempt
from the coverage gate. That is an XGD-tool concern rather than a project one and
is out of this report's scope to fix, but a future `ac`-level cycle on any
capability should expect to find it again.

**STORY-98 needs no work at this level.** Its 13 ACs are a clean one-to-one
cover of the story body's in-scope bullets with no orphans and no overlap beyond
the contrast clauses in finding 5.
