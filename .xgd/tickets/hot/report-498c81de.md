---
uid: report-498c81de
id: REPORT-1594
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing (level=ac)'
created_by: xgd
created_at: '2026-08-07T17:33:01.384512+00:00'
updated_at: '2026-08-07T17:33:01.384512+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Attempt 2 at `ac` level. The one violation and one warning of report-9f7e2b43
were **re-checked against current ticket, test and git state rather than assumed
fixed**; both are verifiably repaired, and the `info` forward-notice (finding 3)
was closed in the same fix call. Three `info` observations remain, none of which
blocks this level.

Per the level cascade, the story cycle passed at 2026-08-07T17:14
(report-afb07aaa), so STORY-98 and STORY-101 bodies are the working reference.
Intent was consulted only to confirm the story body's new clause is not
contradicted and to re-confirm REQ-118's status.

Scope: 28 acceptance criteria — 15 under STORY-101 (`feature`), 13 under
STORY-98 (`upgrade`). Both story kinds are in the Capability Matrix and are
expected to carry ACs. **All 28 are now `active`**; the capability holds zero
`pending` ACs (project-wide `pending` fell from 3 to 2, the remaining two being
AC-718/AC-719 in another capability).

## Cumulative Intent Considered

Unchanged since report-9f7e2b43; re-confirmed rather than copied forward.

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

## Prior-Attempt Verification

report-9f7e2b43 raised one violation and one warning; report-c5644f16 claimed
four fixes. Each was checked against the artefact itself, not the fix report.

| Prior finding | Claim | Independent check | Verdict |
|---|---|---|---|
| 1 (violation) — AC-1028 `pending` | `status: pending → active`, body untouched | `xgd ticket get acceptance_criterion-26ffac6d` → `status: active`, `updated_at 17:25:05`; body re-read in full and byte-for-byte the criterion reported last attempt — no rename toward `segmentFieldsOf`, `fields` still `{story_uid, kind: behavior, regression_only: false}`. Commit `3893e61a0`. Project-wide `pending` ACs now 2 (was 3), neither in this capability | **repaired** |
| 2 (warning) — AC-1000 unsupported by STORY-101 | n=0 clause appended to the "A form over that region's fields" bullet | STORY-101 body re-read in full (`updated_at 17:25:14`, commit `cf3d14309`). The bullet now ends "…so the operator's Save is the single moment anything is written — **and a form the operator changed nothing in is not an edit at all: confirming it and cancelling it are the same answer, with nothing written and nothing re-rendered. Opening a form to look is not an edit.**" That is AC-1000's criterion clause for clause. Every other bullet, the Out-of-scope list and all eleven Technical Context notes are unchanged | **repaired** |
| 3 (info, forward notice) — no `test_UAT_AC1028_*` test | two `it()` titles renamed from `test_UAT_FC_REQ-118_*` | `git log -p -- tests/req118-image-selection.test.ts` shows commit `7d834b257` changing exactly two title strings and nothing else — no assertion, fixture or entry point touched. Both names now yield `AC-1028` through `extract_ac_id_from_test_name` | **repaired** |

**Tests re-run rather than trusted.** `npx vitest run` over
`tests/req118-image-selection.test.ts`,
`tests/reconciliation-copy-edit-gesture.test.ts`,
`tests/reconciliation-copy-edit-gesture-modal.test.ts` and
`tests/reconciliation-edit-render-channel.test.ts`:

```
Test Files  4 passed (4)
     Tests  33 passed | 5 skipped (38)
```

matching report-c5644f16's claimed 7+26 passed / 4+1 skipped. Per-test verbose
run confirms
`test_UAT_AC1028_clicking_an_image_segment_offers_a_picker_of_the_sites_assets`
**passes** (51ms) — so AC-1028 has a passing AC-named UAT and
`check_active_ac_coverage` will not orphan it. The second,
`test_UAT_AC1028_the_modal_reads_its_picker_from_the_same_copy_transport`, skips
with the whole `describe.skipIf(!WEBUI_INSTALLED)` origin suite, reporting
"webui components not installed — run `bin/install --lang js --component all`".
That is STORY-101's declared **Known coverage caveat** (the deliberately loud
skip), not a regression. Working tree is clean.

## Alignment Ledger

### STORY-98 (`story-af36c2cb`, upgrade) — 13 ACs, all `active`, untouched this cycle

Body `updated_at 16:17:14` — predates both fix calls; the ledger below was
re-derived from the current body, not carried forward.

| Story-body bullet | AC | Outcome |
|---|---|---|
| A third channel (own output location, always draft, no revision) | AC-958 | aligned |
| Deliberately non-functional (link target, form action/verb, no behaviour bundle beside it) | AC-948 | aligned |
| The settled state — scroll-reveal copy | AC-949 | aligned |
| The settled state — carousel, module declares its own behaviour-off state | AC-950 | aligned |
| Derived segmentation (incl. what is deliberately *not* a segment) | AC-951 | aligned |
| Addresses resolve to exactly one node, unique per namespace | AC-953 | aligned |
| Addresses are render-scoped, not persisted | AC-955 | aligned |
| Content in a seam is instance-rooted; every module marks its seam | AC-954 | aligned — the catalog-wide obligation is stated in the AC, not only the story |
| The page stamped on the document (id, not slug/filename) | AC-1007 | aligned |
| Outlines drawn by the renderer, hover included, nothing moves | AC-952 | aligned |
| One published vocabulary for the stamp | AC-1008 | aligned |
| No leakage into the shipped channels | AC-956 | aligned |
| (Technical Context) the definition's own element identifier is untouched | AC-957 | aligned |

### STORY-101 (`story-3bf94bd4`, feature) — 15 ACs, all `active`

| Story-body bullet | AC | Outcome |
|---|---|---|
| Seeing what is about to be edited (one region, no layout shift) | AC-993 | aligned |
| Resolving a click — innermost | AC-995 | aligned |
| Resolving a click — module instance + seam scoping | AC-996 | aligned |
| A form over a copy region's fields (shared component, buffered, no markup route) | AC-994 | aligned |
| A form over an **image** region's fields (closed picker, current handle always present, kind-agnostic) | AC-1028 | **aligned — repaired this cycle**; `active`, in the enforced matrix, one passing AC-named UAT |
| One confirmed form is one change (n>1) | AC-997 | aligned |
| A form nothing was changed in is not an edit (n=0) | AC-1000 | **aligned — repaired this cycle**; the story body now carries the clause |
| The page updating (new content, no further step, still editable) | AC-998 | aligned |
| Being told no, without losing anything | AC-999 | aligned |
| Dead end 1 — nothing editable says so plainly | AC-1001 | aligned; correctly exemplified by the painted **container**, not the image (REQ-118 took that role away) |
| Dead end 1 — dismissible by three routes | AC-1002 | aligned; separate AC is deliberate per the story's `9fcba993` note |
| Dead end 2 — rendering too old to carry the coordinate | AC-1003 | aligned |
| Copy that no longer fits | AC-1004 | aligned |
| Viewing is not editing | AC-1005 | aligned |
| (Technical Context) one implementation of the address reading | AC-1006 | aligned |

**Three properties, current state:**

- **Consistency** — every one of the 28 ACs states a criterion that follows from
  its story body. The only body change this cycle (STORY-101's n=0 clause)
  introduces no criterion that no AC carries and contradicts nothing: it is the
  other end of AC-997's assertion and is exactly AC-1000's.
- **Coverage** — both stories' ACs collectively cover their behavioural surface,
  with no bullet unaddressed and no AC orphaned from the narrative. Every AC is
  `active`, so none is invisible to `check_active_ac_coverage`.
- **Exclusivity** — no two ACs within a story describe the same criterion. The
  two near-misses were examined and judged acceptable (findings 2 and 3 below).

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | CAP-87 body (`capability-12fee326`) | — | **Unrepaired across three cycles, and deliberately so.** The capability body still reads "What the operator sees afterwards — the page showing **the new words**", narrowing the post-save outcome to copy after REQ-118 (free_and_reconciled, merged `b2b9208c`) put image selection through the same gesture. Raised as report-afb07aaa finding 1 (warning, story level — the level passed), restated as report-9f7e2b43 finding 4, and explicitly forwarded-not-fixed by report-c5644f16 on the grounds that the capability body is an upper-layer element that an `ac`-level fix should not edit. That reasoning holds and the drift is contained: no AC inherits the narrowing (AC-998 is copy-scoped by design, AC-1028 owns the image case) and the sibling capability-body bullet ("the form that opens over that region's **exposed fields**") is already kind-neutral | Not an `ac`-level action. When a capability- or story-level cycle takes it up: "the page showing the change — the new words, the chosen image", matching STORY-101's own "The page updating" bullet. Do **not** rename the capability — REQ-118 §"Design decisions" chose to extend `copyFieldsOf` rather than rename it |
| 2 | info | exclusivity | AC-952 + AC-1007 vs AC-956 | — | Re-examined, judgement unchanged. AC-956 is the dedicated no-leakage criterion enumerating five absent artefacts; AC-952 closes with "The preview render of the same page carries neither treatment" and AC-1007 with "The shipped channels carry no such stamp", each restating one of those five. Per-criterion contrast clauses that make each AC self-contained, not two ACs describing the same criterion — and the overlap is asymmetric, since AC-956 alone asserts idempotence across repeated edit renders | none |
| 3 | info | exclusivity | AC-997 vs AC-1000 | — | Now adjacent in the story body as well as in the matrix, which makes the split easier to read rather than harder: AC-997 is "many altered fields → one change", AC-1000 is "zero altered fields → no change and no re-render". Distinct scenarios, distinct failure modes, separate UATs (`…gesture.test.ts:526` and `…gesture-modal.test.ts:387`). The fix appended to the existing sentence rather than adding a bullet, which correctly signals they are two ends of one rule | none |
| 4 | info | coverage | `tests/req118-image-selection.test.ts` | — | **Nine** `test_UAT_FC_REQ-118_*` names remain in the file after the two AC-1028 renames. `FREE-CODING.md` §"The FC orphan invariant" (verified at `xgd_source/system_docs/FREE-CODING.md:862-885`) obliges reconciliation to rename or delete *every* such test, while its `check_fc_orphans` gate scans only for `test_UAT_FC_*` **files** — so a REQ-named file's `it()` titles were never gated, exactly as report-c5644f16 described. **This is not an `ac`-level gap for CAP-87**: all nine cover write-path and asset-store behaviour (validator sharing, refusal of an unknown asset, alt in the same diff, baking nothing, the independent asset listing, the field-scoped 400), which CAP-87's body explicitly places out of scope — "The validated write path itself and its addressing contract — owned by **Structured Copy Editing**." They belong to CAP-86's matrix | none here. Flagged so a `uat` cycle maps them under CAP-86 rather than misfiling them against this capability's ACs |

## Notes for the Editor

**Nothing to do at this level.** Both actionable findings from report-9f7e2b43
are closed and independently verified; the remaining four items are `info` and
three of them are explicit "examined, no action" judgements.

**The one loose thread worth tracking is finding 1.** The CAP-87 body clause has
now survived three consecutive reports, each correctly declining to fix it from
the wrong level. It is genuinely minor — no AC inherits the narrowing — but it
will keep reappearing in every future ledger until a capability- or story-level
cycle takes it. The exact replacement wording is in the findings table.

**AC-1028's second UAT is unverified on this machine, by design.** The origin
half of its evidence skips because `@lagrangefoundry/webui-fields` comes from an
out-of-band install no manifest records. STORY-101 declares this as its "Known
coverage caveat" and the skip is loud and reported, so this is a stated limit
rather than hidden drift — but a `uat` cycle assessing AC-1028's *substantive*
coverage should know that only the derivation half actually executes here.

**The systemic `pending` trap is now half-drained but not fixed.**
`acceptance_criterion.status` still defaults to `pending` in `ticket_types.yaml`,
the story-generation prompts still create ACs with `"status":"pending"` inside
`--fields`, and nothing in the prompt or workflow tree drains it. This
capability is clear, but AC-718 and AC-719 remain `pending` elsewhere — one
already carrying passing evidence and therefore silently exempt from
`check_active_ac_coverage`. Any AC authored by a future validation-fix cycle
will land the same way. An XGD-tool concern, out of scope for this capability,
recorded so the next check does not have to rediscover it.
