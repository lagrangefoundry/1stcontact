---
uid: acceptance_criterion-a465080d
id: AC-1017
type: acceptance_criterion
title: Each command is gated on exactly what it loads; the offline verbs are never
  gated
created_by: xgd
created_at: '2026-08-07T03:13:38.664103+00:00'
updated_at: '2026-08-07T23:11:14.493732+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

The preflight gates a command on the dependencies that command actually loads, so
a verb is never blocked by a package it does not use.

- The browser-driving verbs — `capture`, `shot`, `values-diff`, `adopt-gaps` —
  are gated on the browser automation dependency only.
- The imaging verb `crop` decodes an image and never opens a browser: it is gated
  on the image dependency only.
- The verbs that need both eyes — `diff`, `gate`, `aligned-crops` — are gated on
  both, and refuse when either is unresolvable.
- The offline verbs read and write files only and are **never** gated: `render`,
  `serve`, `builder`, `repro`, `refold`, `l1-gate`, `responsive-diff`, and the
  structured-edit commands. They run on a tree with neither dependency present
  and no install at all.

The gated set is pinned as a whole, so adding a command that launches a browser
without gating it is a visible failure rather than a silent reopening of the gap.

## Verification
Against a tree with only one of the two dependencies resolvable, confirm the
single-dependency verbs matching it pass, the verbs needing the other refuse
naming that one, and the both-eyes verbs refuse naming whichever is absent. On a
tree with nothing installed, confirm every offline verb still runs. Assert the
gated set equals exactly the browser and imaging verbs listed above.