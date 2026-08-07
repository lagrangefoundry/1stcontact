---
uid: report-afb07aaa
id: REPORT-1591
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing (level=story)'
created_by: xgd
created_at: '2026-08-07T17:14:15.273264+00:00'
updated_at: '2026-08-07T17:14:15.273264+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: story
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

Attempt 2. The three violations and one warning of report-bf64e711 were
re-checked against the current ticket state rather than assumed fixed; all four
are verifiably repaired (see *Prior-Attempt Verification*). Two residual
warnings remain, neither of which blocks this level.

## Cumulative Intent Considered

CAP-87 carries no `intent_uid` of its own. The ledger is built from its two
stories' `intent_uid` / `updated_by` chains, then widened to every intent whose
asked behaviour lands between the pointer and the write path.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-116 (`request-41796766`, via BUNDLE-14 `bundle-0385746c`) | free_and_reconciled | 2026-07-31 (merged `cd8f98c8`) | The edit render: third non-functional channel, settled state, derived segmentation, render-scoped L1 addresses, renderer-drawn outlines, no leakage into the shipped channels | YES |
| REQ-117 (`request-395b67e6`, via BUNDLE-16 `bundle-15c1f647`) | free_and_reconciled | 2026-07-31 (merged `1741ee5d`) | The gesture: click→target (innermost-wins, module/slot scoping), `mountFields` modal in buffered commit, one Save = one diff, re-render + refresh, refusal keeps the words, View mode unaffected. Back-filled the render: stamp vocabulary moved to `site-schema`, `data-fc-page` page stamp, hover treatment homed in `L1_EDIT_CSS`, `contact-form` marks its seam. Two later free-coded fixes under the same ticket: the stale-address refusal (`69f06deb`) and the dismissible fieldless modal (`9fcba993`) | YES |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | 2026-07-31 (merged `b2b9208c`) | Image selection as the **second half of the same loop**: an image region exposes `src` (closed enum, current handle always included) + `alt`; `L1FieldDescriptor.type` widened to `'string' \| 'enum'`; explicitly **no editor change** — the loop is kind-agnostic. Retires REQ-117's "Images — T4" non-goal | YES |
| REQ-115 (`request-a6740b4a`, via BUNDLE-16) | free_and_reconciled | 2026-07-31 | Builder shell, origin, View/Edit modes, and the viewport-fill follow-up — CAP-85, and the ticket says so itself ("This is T1 chrome, not copy editing") | YES (adjacent, out of capability) |
| BUG-32 (`bug-5cabb340`) | free_coded | 2026-08-05 | `@gendevlabs` → `@lagrangefoundry` webui scope rename. Neither story body names the scope; the only residue in this capability is a docstring in `tests/support/webui-installed.ts` | not yet reconciled; no behavioural ask here |
| REQ-119 (`request-64864801`) | draft | 2026-07-31 | Request-time draft/edit renders inside control-app — would retire the stale-rendering failure mode | NO — draft |
| REQ-44 (via BUNDLE-16) | free_and_reconciled | 2026-07-03 | Tooling hygiene | NO (out of capability) |

**Walking chronologically**: REQ-116 establishes the render; REQ-117 adds the
gesture and back-fills the render it needs (page stamp, one published
vocabulary, seam-marking obligation, renderer-owned hover treatment); REQ-118
retires REQ-117's images non-goal by routing image selection through the
*identical* gesture rather than a second one. The current cumulative intent is
**copy and image selection through one kind-agnostic
click → form → save → re-render loop over one edit render.**

Two behaviours in the ledger live in REQ-117's **comment thread**
(`comment-40779c8d`) and its free-coded commits rather than in its body, and are
recorded here so a future check does not read them as unsupported story text:

- **The "nothing to edit" message and its dismissal.** REQ-117's body AC-1 still
  reads "clicking a segment with no editable fields opens nothing". The operator
  saw the message in-session, objected only that *"the 'Close' CTA doesn't work
  it can't be dismissed"*, and the fix was the dismissal (`9fcba993`, a TDZ
  `ReferenceError` killing Close/Escape/backdrop together) — not the message.
  The message is adopted intent by that exchange; STORY-101's "Intent/code
  divergence, deliberate and recorded" note is accurate.
- **The stale-rendering refusal** (`69f06debd`), added in the same session after
  the operator hit `Page 'null' not found`.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-98 (`story-af36c2cb`, upgrade) | REQ-116 (intent), REQ-117 (updated_by BUNDLE-16) | **aligned** — every REQ-116 AC and every REQ-117 renderer-side addition is expressed: third channel, deliberate inertness, settled state, derived segmentation (including what is deliberately *not* a segment), render-scoped addresses, `data-fc-page`, the published stamp vocabulary, the catalog-wide seam obligation, renderer-drawn outline + hover, no leakage. Body carries no reference to a superseded element. Its two standing notes were re-verified, not assumed — see findings 3 and 4 |
| STORY-101 (`story-3bf94bd4`, feature) | REQ-117 (intent), REQ-118 (updated_by `request-66e4c630`) | **aligned** — the REQ-118 drift that failed attempt 1 is repaired: `images` is gone from the non-goals (replaced by image *framing*, upload and processing, which REQ-118 does still defer), the form bullet is stated kind-agnostically, the post-save clause reads "the new words, the chosen image", the CAP-84 reference now points at STORY-98 in this capability, and the lineage field records REQ-118. Its kind-agnosticism claim is true in code: `editor.js` reads `loaded.kind` only to name the region in the dead-end message (which AC-1001 requires) and never to build the field list |
| CAP-87 body | REQ-116 + REQ-117 | aligned in its scope bullets, which are kind-neutral; one summary clause still narrows the post-save outcome to copy — finding 1 |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | CAP-87 body (`capability-12fee326`) | story-body-edit (capability body) | Under *The click-to-edit gesture*, "What the operator sees afterwards — the page showing **the new words**" narrows the post-save outcome to copy. REQ-118 (free_and_reconciled, merged `b2b9208c`) put image selection through this same gesture, and STORY-101's matching sentence was widened to "the new words, the chosen image" in the attempt-1 fix. This is the last residue of the root cause report-bf64e711 named — REQ-118 reconciled into CAP-86 and CAP-88 but not CAP-87. The sibling bullet ("the form that opens over that region's **exposed fields**") is already kind-neutral, so the drift is one clause, not the section | Widen the clause to match STORY-101 ("the new words, the chosen image"). Do **not** rename the capability: REQ-118 §"Design decisions" explicitly chose to extend `copyFieldsOf` rather than rename it, for the same reason |
| 2 | warning | coverage | AC-1028 (`acceptance_criterion-26ffac6d`) | ac-edit | The AC authored in attempt 1 to cover REQ-118's gesture-side ask sits at status `pending`, while 310 of the project's 313 acceptance criteria are `active`. Its intent is `free_and_reconciled` and its evidence already exists (`tests/req118-image-selection.test.ts::test_UAT_FC_REQ-118_clicking_an_image_segment_offers_a_picker_of_the_sites_assets`). The other two pending ACs (AC-718, AC-719) have sat that way since 2026-07-22 — one of them with `uat_coverage: pass` — so `pending` is a state ACs linger in unnoticed rather than one anything drains | Activate AC-1028 (an ac-level action; recorded here so the ac cycle does not read the criterion as newly proposed). Story-level coverage of REQ-118 is satisfied by STORY-101's body regardless |
| 3 | info | consistency | STORY-98 / AC-956 | — | Re-verified rather than assumed. STORY-98's Technical Context claims the leakage criterion is about *edit-channel artefacts* rather than byte-identity, "which the marker would falsify" — true: `data-l1-slot` is emitted ungated in every channel at `packages/framework/src/modules/contact-form/index.astro:88` and `carousel/index.astro:77`, and REQ-117 added the contact-form one. AC-956's corrected text now states the artefact + idempotence property and explicitly disclaims byte-identity with a pre-edit-channel build. Story, AC and code agree | none |
| 4 | info | consistency | STORY-98 "placement note (resolved)" | — | Re-verified. STORY-85 (`story-179b8c06`, CAP-70) now reads "the zero-CSS obligation and its **two** declared carve-outs (invariant elements, and the edit-channel settled state)", bounded to the edit channel by the document-level marker and to release-not-paint properties. The matrix no longer holds a proposition and its negation, and the two stories' criteria stay split along ownership rather than duplicated | none |
| 5 | info | exclusivity | STORY-98 vs STORY-101 | — | Clean split, each disclaiming the other's half: STORY-98 owns what a hot segment *looks like* and explicitly excludes *choosing* it; STORY-101 owns which segment is live and explicitly defers the treatment to STORY-98. No overlapping intent | none |
| 6 | info | coverage | STORY-101 stale-rendering guard | — | Framed as "a standing failure mode … until request-time rendering replaces on-disk renderings". REQ-119 is still `draft`, so the framing is correct today; revisit when it reconciles | none |
| 7 | info | coverage | STORY-101 webui skip caveat | — | The "out-of-band install that nothing in this repository's manifests records" caveat still holds: `tests/support/webui-installed.ts` computes `WEBUI_INSTALLED` by resolution and suites skip loudly when absent. BUG-32 (`free_coded`) renamed the scope but did not make the dependency explicit, so the caveat is not stale | none |

## Prior-Attempt Verification

report-bf64e711's four repairable findings, checked against current ticket state:

| Prior finding | Claimed fix | Verified |
|---|---|---|
| 1 — STORY-101 non-goals still excluded `images` | non-goal replaced with image *framing* / upload / processing | ✅ body reads "image **framing** — crop, scale, scrim, rotation, edge effects and free positioning — together with asset upload and any image processing"; every other REQ-117 non-goal preserved |
| 2 — REQ-118's gesture-side ask unowned | story prose stated kind-agnostically + AC-1028 added | ✅ "The gesture is deliberately **kind-agnostic** … which is exactly how image selection arrived"; AC-1028 exists (but see finding 2). No parallel image-gesture story was created |
| 3 — AC-956 rested on a falsified byte-identity claim | criterion + verification + title restated | ✅ see finding 3 |
| 4 — STORY-101 depended on superseded CAP-84 | repointed at STORY-98 | ✅ "Depends on the edit rendering (STORY-98, in this capability)"; no `CAP-84` string remains in either story body, and every remaining cross-reference (CAP-85, CAP-86, STORY-98/99/100) resolves to an active element |

## Notes for the Editor

**Both warnings are one-line edits and neither blocks this level.** Finding 1 is
the tail of the REQ-118 reconciliation gap, now reduced from a story body to a
single clause in the capability body. Finding 2 is a lifecycle state, not a
content problem — the criterion itself is correct and already evidenced.

**Lineage-field inconsistency worth knowing, not worth fixing here.** STORY-98
records `updated_by: bundle-15c1f647` (the bundle) while STORY-101 records
`updated_by: request-66e4c630` (the source request), as does STORY-100 in CAP-86.
Both resolve, and neither convention is wrong — but a check that walks
`updated_by` expecting one shape will miss the other.

**Where this capability's intent actually lives.** Four of the behaviours the
matrix asserts (the nothing-to-edit message, its three dismissal routes, the
stale-address refusal, and the no-op-close guarantee) are grounded in REQ-117's
operator dialogue and free-coded commits rather than in any ticket body's
acceptance criteria. They are legitimate cumulative intent, and the reconciliation
UATs in `tests/reconciliation-copy-edit-gesture-modal.test.ts` evidence them — but
a future check that reads only ticket bodies will judge them unsupported. That is
the single most likely source of false drift on this capability.
