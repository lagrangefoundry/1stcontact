---
uid: report-c11303d1
id: REPORT-1625
type: report
title: 'Fix Builder Workspace: Chrome, Origin & Display Panel (ac) — attempt 1'
created_by: xgd
created_at: '2026-08-07T20:49:05.317385+00:00'
updated_at: '2026-08-07T20:49:05.317385+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a994b8f3
  level: ac
  fixes_applied: 2
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-17a279f7
---

# Fix Summary — Builder Workspace: Chrome, Origin & Display Panel (ac)

**Attempt**: 1
**Fixes applied this call**: 2
**Violations remaining**: 0
**Needs more work**: false

Both actionable findings in report-7285dd57 are discharged in this call. The
report's own instruction — "exactly one repair belongs to this cycle: finding
#1" — was followed, and the opportunistic warning (#2) was taken at the same
time because it is a single self-contained AC rewrite with no dependants.
Findings #3–#7 are explicit *do-not-act* / informational rows and were
deliberately left alone; see below.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-add | **AC-1029** (`acceptance_criterion-f1115dda`), new under STORY-99 | Authored "The workspace registers an editable mode, and selecting it displays that site's edit channel". Closes violation #1 |
| 2 | ac-edit | **AC-964** (`acceptance_criterion-46d5804e`) | Rewrote title, criterion and verification so the operator-observable invariant is separated from the transitional front-vs-origin mechanism. Closes warning #2 |

### 1. AC-1029 — the missing editable-mode registration (violation #1)

Created `active`, `kind: behavior`, `regression_only: false`, `story_uid:
story-e674c60a`. STORY-99's body was **not** opened, per the report's explicit
instruction — the gap was the missing AC, not the story text, which already
describes this behaviour three times.

Scoped exactly as directed — registration and *which channel the mode points
at*, nothing more:

- **Criterion**: the panel the workspace mounts offers an editable mode
  alongside the normal view; selecting it displays the current site's **edit**
  channel rather than the channel view mode displays; mode and site compose
  (changing site while editable is active follows to that site's edit channel;
  returning to view returns to the ordinary channel).
- **Explicit non-duplication clause** written into the body: AC-969 (a mode
  contributed from outside works end to end) and AC-968 (switching preserves
  the pane) are mode-agnostic *by design* and a workspace shipping no editable
  mode of its own would still satisfy both — AC-1029 is what makes the mode
  contract true of two *real* modes. AC-968/AC-969 were left untouched, per the
  report's "do not weaken them to absorb it".
- **Boundary stated in the body**: what the edit channel *contains* is CAP-87 /
  STORY-98 (AC-948…AC-958); what the gesture *does* is STORY-101. Neither is
  asserted.

Shipped behaviour re-confirmed against source this call: `apps/control-app/src/
builder/app.js:64-68` registers `{ id: 'edit', label: 'Edit', src: ({site}) =>
previewUrl(site, 'edit') }` as the second entry in the same registry as `view`
(which points at `draft`), and `apps/control-app/src/builder/api.js`
`previewUrl(slug, channel)` resolves to the relative `/preview/<slug>/<channel>/`
— so "the displayed address is the edit channel" is a directly observable
property, which is how the verification is phrased.

### 2. AC-964 — proxy framing removed (warning #2)

The defect was that the criterion was written about a *front* ("forwarded
verbatim", "the front reinterprets nothing", verification comparing each route
"against the same route fetched directly from the origin"), which STORY-99's
Technical Context says the ACs are explicitly not — and which would become
**vacuously true** rather than failing once REQ-119 deletes the front.

Applied exactly the split the report suggested:

- **Criterion** now states the operator-observable invariant only: everything is
  reachable from one host; nothing is reinterpreted between the operator and the
  origin; the frame's document URL and the host's origin match, so no request is
  cross-origin. A parenthetical notes the current local-Node-behind-an-edge-front
  arrangement is the story's own declared transitional detail, not the claim.
- **Verification** keeps the byte-comparison but **explicitly conditioned on a
  front being interposed**, with the added instruction that when the host *is*
  the origin the step "must be skipped with a stated reason, rather than
  degenerating into a route compared with itself and passing vacuously". The
  loss-of-force failure mode is now named in the criterion itself, so a future
  cycle cannot re-introduce it silently.
- Title changed from "…forwarded verbatim" to "…with nothing reinterpreted in
  between" for the same reason.

Shipped behaviour is unchanged and still correctly described (`apps/control-app/
src/index.ts:38-41` forwards the `Request` unaltered).

## Findings Deliberately Not Actioned

| # | Row | Why not actioned |
|---|---|---|
| 3 | report-774ff873 finding #1 (edit transport reachability + refusal shape) | **Explicit do-not-act.** Already claimed exactly once by AC-992 (STORY-100, CAP-86). Authoring it under STORY-99 would put the same criterion in two capabilities. Any move of that half to CAP-85 is a cross-capability decision, not an ac-cycle addition |
| 4 | Served edit bridge `/framework/edit-client.js` | **Explicit do-not-act.** Claimed once by AC-1006 (STORY-101, CAP-87) |
| 5 | AC-977 probe set vs STORY-102 | `none — do not narrow AC-977`. Untouched. Narrowing the probe set would reintroduce the single-hole hazard COMMENT-601 describes |
| 6 | AC-979 lacking a story-body anchor | Recorded by the assessor for a *later story-level* cycle to add a half-sentence. No ac-level action, and no `story-body-edit` is in scope here. Untouched |
| 7 | AC-969 vs AC-970 toolbar overlap | Judged not-duplicate by the assessor. Untouched |

Per the report, no AC under STORY-99 is a candidate for `ac-deprecate`: nothing
in the intent ledger is retired (REQ-119 is `draft`; BUG-32 is `free_coded` and
uncounted, re-confirmed this call at `tools/generate/src/cli/webui.ts:33`, which
still reads `WEBUI_SCOPE = '@gendevlabs'`).

## Code Edits

None this call. There is no `code-issue` in report-7285dd57, and the report
verified every named behaviour present in source. The working tree contains no
non-`.xgd/` modifications (`git status --porcelain` filtered on non-ticket
paths: empty). No tests were run because no code or test file was touched.

## Note Forwarded to the uat Cycle

AC-1029 is new and therefore an immediate uat-level coverage gap by
construction. Deliberately **not** paired with a `uat-add` here, for a reason
worth carrying forward rather than rediscovering:

- The behaviour can only be observed by mounting the real workspace
  (`mountBuilder`), which imports `@gendevlabs/webui-*` by bare specifier. Every
  such suite is `describe.skipIf(!WEBUI_INSTALLED)`-gated on the implicit,
  out-of-band component install (`tests/support/webui-installed.ts`;
  `tests/req115-builder-composition.test.ts:26/77/136/190`). A UAT for AC-1029
  placed there proves nothing on a fresh clone — the report flags this.
- `createDisplayPanel` (`apps/control-app/src/builder/panel.js`) imports no
  webui component and could be mounted ungated, but the registration AC-1029
  asserts happens in `app.js`, so panel-only evidence would prove the panel's
  registry works, not that *the workspace registers an editable mode* — which is
  precisely the distinction AC-1029 exists to draw, and precisely what AC-969
  already covers.
- Recommendation for the uat cycle: place it in the gated composition suite
  alongside the other REQ-115 mode evidence, accepting the same declared,
  reported skip STORY-99's Technical Context already names as a known coverage
  gap — not to weaken the AC to fit an ungated harness. The existing
  `..._mode_switch_swaps_the_source_without_remounting` will **not** discharge
  it (mode-agnostic by design).

## needs_review Items Forwarded

None. report-7285dd57 recorded `needs_review_count: 0`, and nothing in this
call's work surfaced an ambiguity requiring an operator decision.
