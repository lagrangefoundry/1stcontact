---
uid: report-5a8ec0a7
id: REPORT-1628
type: report
title: 'Fix Builder Workspace: Chrome, Origin & Display Panel (uat) — attempt 1'
created_by: xgd
created_at: '2026-08-07T21:09:12.242981+00:00'
updated_at: '2026-08-07T21:09:12.242981+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a994b8f3
  level: uat
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-17a279f7
---

# Fix Summary — Builder Workspace: Chrome, Origin & Display Panel (uat)

**Attempt**: 1
**Fixes applied this call**: 3
**Violations remaining**: 0
**Needs more work**: false

Both violations were evidence gaps, exactly as report-92b9aee8 categorised them.
No production code was touched, and none was warranted.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1029 (`acceptance_criterion-f1115dda`) | Authored `test_UAT_AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel` in the new `tests/reconciliation-builder-workspace-mounted.test.ts`. |
| 2 | uat-edit | AC-972 (`acceptance_criterion-285b8c08`) | Rewrote `test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site` to add the displayed-site half — the workspace's own publish control is clicked after `setSite('beta')` — keeping every assertion the old version made. |
| 3 | uat-edit (mechanical) | `tests/reconciliation-builder-workspace-origin.test.ts` | Removed the superseded AC-972 test and its now-unused `cmdRevisions` import; left a breadcrumb naming where the criterion's evidence now lives and why. |

## Why a new suite file

Both criteria need a **mounted workspace and a live origin at the same time**,
and neither sibling suite can host that: the chrome suite is jsdom with no
origin, and the origin suite is node with no DOM. `tests/reconciliation-builder-workspace-mounted.test.ts`
(jsdom) starts the real `startBuilder` origin over a real two-site store, so
both halves are available in one test. The 1:1 AC↔UAT mapping is preserved —
exactly one `test_UAT_AC1029_*` and one `test_UAT_AC972_*` exist in the tree.

## What each test now proves

**AC-1029** — unconditional half: the edit channel is a distinct address from
the ordinary one and this origin serves that site's real edit rendering there,
byte-identical to disk and not the draft served twice. Mounted half (components
required): `panel.getModes()` offers `edit` alongside `view` **with no
`registerMode` call in the test** — every mode comes out of `mountBuilder`;
selecting `edit` makes the displayed address the current site's edit channel,
distinct from the view address; fetching *the address the pane is displaying*
over the origin returns that site's edit rendering; and mode and site compose —
`setSite('beta')` follows to beta's edit channel, `setMode('view')` returns to
beta's ordinary channel.

**AC-972** — unconditional half unchanged (origin publish operation, revision
appended to the right site, same locked form as a CLI publish, published channel
rendered and served). Added mounted half: `mountBuilder` is given the app's own
`publishSite` from `api.js` aimed at the real origin (only the URL base is
rebound, because jsdom is not that origin); the panel opens on `alpha`,
`setSite('beta')` is the operator's selection, the real `publish` control is
**clicked**, and beta reaches revision 2 while alpha stays at 1. A regression
sending `sites[0].slug` or a stale captured slug now fails here — which is the
clause the old direct `POST {slug:'beta'}` could not touch.

## Verification run on this machine

```
tests/reconciliation-builder-workspace-mounted.test.ts   2 passed
tests/reconciliation-builder-workspace-origin.test.ts + -chrome.test.ts   11 passed | 9 skipped
tests/req115-builder-*.test.ts + req117-*.test.ts        3 passed | 19 skipped
```

No test that was passing before is failing now.

**The mounted halves of both new/edited tests report themselves UNVERIFIED here**
(`console.warn` naming the missing components and the install command), because
the `@gendevlabs/webui-*` components are not installed on this machine. That is
the coverage gap the story's Technical Context declares, and the discipline the
assessor asked for was followed literally: the component-independent half of each
criterion runs unconditionally against the real origin, no stand-in panel is
substituted to buy a green run, and nothing is mocked.

## Code Edits (if any)

None this call. Both violations were missing evidence; the behaviour already
exists at `apps/control-app/src/builder/app.js:64-69` (edit-mode registration)
and `apps/control-app/src/builder/toolbar.js:196` (`const slug = panel.getSite()`),
as the report stated.

## Finding 3 (warning, AC-973) — not addressed this call

Deliberate. It does not gate, and both repairs the assessor offered have costs
that want an explicit decision:

- *Move/mirror the drag into the real-browser suite* — the browser path needs the
  mounted chrome, so it is unverifiable on this machine for the same reason
  AC-975 is; and a mirrored `test_UAT_AC973_*` in a second file would break the
  1:1 AC↔UAT mapping the ledger checks. Dispatching pointer events in jsdom is
  not a substitute: `webui-split`'s drag handler reads `getBoundingClientRect()`,
  which is zero there, so the assertion would be noise.
- *Amend AC-973's verification* — weakens stated intent to match the environment,
  which is not obviously right for a warning whose untested residue is the shared
  component's own gesture and paint (listed out of scope by the story).

Recommendation for the operator: leave AC-973 as-is until the components are
installable in CI, then add the drag to the real-browser suite in place of the
jsdom model assertions.

## needs_review Items Forwarded

None. The report recorded zero `needs_review`.

## Notes

- `uat_coverage` was **not** set on either AC: no acceptance criterion in this
  project carries that field (theirs are `story_uid` / `kind` / `regression_only`),
  and introducing an unmodelled field would be a structural change, not a fix.
- Test changes committed on `regression-5096fbee` as `787c0f491`.
