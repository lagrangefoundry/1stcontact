---
uid: comment-197c1838
id: COMMENT-805
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-07T20:49:26.153177+00:00'
updated_at: '2026-08-07T20:49:26.153177+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c11303d1
  kind: note
---

Done — both actionable findings in report-7285dd57 are discharged. Completion report: **REPORT-1625** (`report-c11303d1`).

## Mutations (2)

**1. `ac-add` — AC-1029 (`acceptance_criterion-f1115dda`)**, new under STORY-99, closing violation #1: the workspace registers an editable mode and selecting it displays that site's **edit** channel. Scoped strictly to registration + which channel it points at, with the boundaries written into the body (contents of the edit channel → STORY-98; what the gesture does → STORY-101). It carries an explicit non-duplication clause explaining why AC-968/AC-969 don't cover it — both are mode-agnostic by design and a workspace with zero shipped edit mode satisfies both — so a future cycle doesn't collapse them together. AC-968/AC-969 left untouched.

Re-confirmed against source: `app.js:64-68` registers `{id: 'edit', src: ({site}) => previewUrl(site, 'edit')}` beside `view`→`draft`, and `previewUrl` resolves to relative `/preview/<slug>/<channel>/`, so "displayed address is the edit channel" is directly observable — that's how the verification is phrased.

**2. `ac-edit` — AC-964**, closing warning #2: the criterion had been written about a *proxy*, which STORY-99's Technical Context says the ACs are not, and would have gone **vacuously true** (not failing) once REQ-119 deletes the front. Criterion now states only the operator-observable invariant (one host, nothing reinterpreted, frame URL == host origin); the front-vs-origin byte comparison survives as a verification step **explicitly conditioned on a front being interposed**, with instructions to skip-with-reason once the host *is* the origin. Title updated to match.

## Not actioned, deliberately

report-774ff873's finding #1 was **not** implemented — the report closes it as already claimed by AC-992 (CAP-86), and authoring it here would duplicate a criterion across capabilities. Same for the edit bridge (AC-1006, CAP-87). AC-977's probe set not narrowed, AC-979 untouched, STORY-99's body not opened — all per the report's explicit directions.

## No code or test changes

No `code-issue` in the report; working tree has no non-`.xgd/` modifications, so no tests were run.

One thing worth your attention: AC-1029 is an immediate uat-level gap by construction, and I did **not** pair a `uat-add`. The behaviour is only observable by mounting `mountBuilder`, which pulls `@gendevlabs/webui-*` by bare specifier — every such suite is `describe.skipIf(!WEBUI_INSTALLED)`-gated on the out-of-band component install, so a UAT there proves nothing on a fresh clone. `createDisplayPanel` is ungated but testing it would prove the panel's registry works, not that *the workspace* registers the mode — which is the exact distinction AC-1029 draws. I recommended in the report that the uat cycle accept the declared skip rather than weaken the AC to fit an ungated harness. Report declares `needs_more_work: false`, `violations_remaining: 0`.
