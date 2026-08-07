---
uid: report-524e3cf7
id: REPORT-1598
type: report
title: 'UAT Coverage: In-Page Copy Editing'
created_by: xgd
created_at: '2026-08-07T18:01:53.655656+00:00'
updated_at: '2026-08-07T18:01:53.655656+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-12fee326
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: In-Page Copy Editing

**Result**: PASS
**AC verdicts**: 28 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 2 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

**Matrix at this level**: 28 active ACs across 2 stories — STORY-98
(`story-af36c2cb`) 13, STORY-101 (`story-3bf94bd4`) 15. Every one carries at
least one `test_UAT_AC<n>_*` test, and every one of those tests drives real
entry points.

**Executed evidence, this worktree, this attempt**:
`npx vitest run` over the four owning files
(`reconciliation-edit-render-channel`, `reconciliation-copy-edit-gesture`,
`reconciliation-copy-edit-gesture-modal`, `req118-image-selection`)
→ **37 passed, 1 skipped, 0 failed** in 7.45s. The one skip is AC-1002's sole
test, gated on `WEBUI_INSTALLED`, which is false here
(`node_modules/@gendevlabs` absent). No launchable Chromium in this run, so the
optional browser halves of AC-993 / AC-997 / AC-998 / AC-999 / AC-1006 reported
UNVERIFIED via `console.warn` and their unconditional cores ran and passed.

**Note on the stale index**: `.xgd/uat_index.json` (updated
2026-08-07T15:22:56Z) reports every one of these ACs as `status: "missing"` and
has no entry at all for AC-1002 or AC-1028. That is the index lagging, not a
coverage gap — all 30 test functions were located in the working tree and
executed. Judgment below is from the test sources and the run, not the index.

## Cumulative Intent Considered

Chronological by `merged_at_commit`. All three are `free_and_reconciled`, so all
count. Nothing in the ledger is abandoned, deprecated, draft, or imminent-only,
and no later intent retires anything either story describes — REQ-118 is the
most recent intent in the repository touching this capability.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-14 `bundle-0385746c` (BUG-31 + REQ-114 + **REQ-116**) | free_and_reconciled | `cd8f98c8` 2026-08-06 | REQ-116 created STORY-98 — the edit render channel: a third non-functional render mode, settled state, derived segmentation, render-scoped addresses, renderer-drawn outlines, no leakage | YES |
| BUNDLE-16 `bundle-15c1f647` (**REQ-117** + REQ-115 + REQ-44) | free_and_reconciled | `1741ee5d` 2026-08-06 | REQ-117 created STORY-101 — the click-to-edit gesture end to end; also updated STORY-98 with the page stamp (`data-fc-page`), the hover treatment, the vocabulary's move into `site-schema`, and the contact form's seam marker | YES |
| REQ-118 `request-66e4c630` | free_and_reconciled | `b2b9208c` 2026-08-06 | Updated STORY-101 — image selection reaches the operator through the same gesture, the same `/api/copy` transport and the same validator; added AC-1028 | YES |

ACs carry no `intent_uid` / `updated_by`; lineage is held at story level.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-98 `story-af36c2cb` (upgrade) | REQ-116 (BUNDLE-14); page stamp / hover / vocabulary-move / contact-form seam from REQ-117 (BUNDLE-16) | aligned | Every in-scope bullet of the body maps to an AC: third channel → AC-958; inertness → AC-948; settled state → AC-949 + AC-950; derived segmentation → AC-951; addresses → AC-953/954/955; page stamp → AC-1007; module marks its own seam → AC-954; renderer-drawn outlines incl. hover → AC-952; one published vocabulary → AC-1008; no leakage → AC-956; author identifier preserved → AC-957. Nothing in the body is orphaned and nothing intent asked for is missing |
| STORY-101 `story-3bf94bd4` (feature) | REQ-117 (BUNDLE-16), REQ-118 | aligned | Every in-scope bullet maps to an AC: seeing what is about to be edited → AC-993; innermost resolution → AC-995; module-seam scoping → AC-996; the form over exposed fields → AC-994 (copy) + AC-1028 (image, kind-agnostic); one form = one change → AC-997; opening to look is not an edit → AC-1000; the page updating and staying editable → AC-998; refusal without loss → AC-999; two dead ends → AC-1001 + AC-1002 + AC-1003; overflowing copy legible → AC-1004; viewing is not editing → AC-1005; one address-resolution implementation → AC-1006 |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | AC-1002 | — (no change now) | `test_UAT_AC1002_the_nothing_to_edit_message_is_dismissible_by_button_escape_and_backdrop` is `it.skipIf(!WEBUI_INSTALLED)` and is the **only** AC in this capability with no unconditionally-asserted core — every other gated test asserts a component-independent half and reports the rest as UNVERIFIED. On a machine without the out-of-band `@gendevlabs/webui-*` install (this one), AC-1002 has zero executed evidence | None available today: `apps/control-app/src/builder/editor.js:1` imports `mountFields` from `@gendevlabs/webui-fields` at **module scope**, so the file cannot load at all without the components — the dismissal routes are structurally unreachable from any other entry point. The gate is correct and the skip is loud. Revisit when the private registry lands (already named in STORY-101's ratified coverage caveat) |
| 2 | warning | uat | AC-951 | uat-edit | The AC states that "whether a container paints is decided by whether the renderer *would* paint it, not by a separately maintained list", but `test_UAT_AC951_...` seeds exactly one painted container and its paint is `surfaceFill` alone. The test would pass unchanged against a hardcoded `axes.surfaceFill !== undefined` check — i.e. against precisely the separately-maintained list the AC forbids. (The implementation is correct: `render.ts:1753` calls `surfaceDecls(node.axes)`) | In `tests/reconciliation-edit-render-channel.test.ts` `seedPage`, add a third container painted by a **different** axis in the same surface group — `surfaceGradient`, `backgroundImageUrl`, `pattern`, `overlay`, `borderRadiusPx` or `opacity` (`render.ts:461-501`) — carrying **no** `surfaceFill`, and assert it is stamped `data-l1-segment="container"`. Then bump the expected container count from 1 to 2 |

Neither finding affects pass/fail. Warnings only; zero violations, zero
needs_review.

## Notes for the Editor

**One documented intent/code divergence, deliberately not raised as
`needs_review`.** REQ-117's acceptance criterion 1 reads "clicking a segment
with no editable fields **opens nothing**". The implementation opens a plain
*Nothing to edit on this container segment yet.* message, and AC-1001 / AC-1002
follow the implementation, not the intent's literal wording. This is not
undocumented drift: STORY-101's Technical Context carries it as an explicit
"Intent/code divergence, deliberate and recorded" entry with its rationale
(silence reads as breakage; a sentence reads as "not this one, try the text
inside it"), and records that AC-1002 exists as its own criterion precisely
because the first version of that message could not be dismissed by any route.
The intent-alignment workflow examined exactly this question and passed it at
both story level (REPORT-1591) and AC level (REPORT-1594). Re-raising it here
would re-litigate a settled ruling, so it is recorded rather than escalated.

**The two ratified environmental caveats are working as designed.** Both are
named in the story bodies rather than being silent skips: the `WEBUI_INSTALLED`
gate (STORY-101's "Known coverage caveat") and the absent-Chromium gate. In
this run they cost the optional browser halves of five criteria and the whole of
AC-1002. Every other assertion executed. `tests/req118-image-selection.test.ts`
is correctly **ungated** — its second `describe` documents why (it only fetches
`/api/copy`, `/api/assets` and `/preview/…`, none of which touch a component),
which is what makes AC-1028's transport clause executable here.

**Evidence quality across the set is high and worth preserving.** These are not
assertion-shaped stubs: the render-channel suite drives `cmdRender` /
`cmdPublish` / `cmdRevisions` and diffs real emitted bytes; the gesture suite
parses the bytes `1c render --edit` actually wrote with a real DOM, dispatches
real pointer and mouse events through the real `mountL1EditBridge`, and does its
reads and writes over HTTP against a real `startBuilder` origin; AC-954 reads
its loop membership from the behavior registry itself and includes two negative
guards proving the loop would fail for a seam-bearing module with no case rather
than silently skipping it. AC-1006's source-text assertions are structural, but
legitimately so — the criterion *is* about delivery topology ("no second
implementation exists in the workspace's browser source"), and the test also
fetches, type-checks and (where a browser exists) genuinely `import`s the served
module.
