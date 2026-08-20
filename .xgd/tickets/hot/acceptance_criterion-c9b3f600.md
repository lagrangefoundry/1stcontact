---
uid: acceptance_criterion-c9b3f600
id: AC-687
type: acceptance_criterion
title: A rejected document returns the full list of per-field errors
created_by: xgd
created_at: '2026-07-22T19:32:29.199138+00:00'
updated_at: '2026-08-20T08:42:18.522476+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
When a document is rejected, validation does not throw or return a single opaque
failure: it returns a machine-readable result containing the full list of
violations, each identifying the offending location (a path into the document,
e.g. `/root/children/0/axes/fontSizePx`) and a human-readable message. Multiple
simultaneous violations are all reported, so a caller can correct the document
in one pass.

**The per-field error list is guaranteed for an authored document, not only for
one produced by the fold.** When the rejected document is a page inside a site
definition, every envelope violation is reported in that definition's own error
list with its path **anchored inside the page that carries it** — e.g.
`/pages/0/l1/root/children/2/axes/fontSizePx` — rather than as a detached
document-local path with no page context. So the caller written to consume these
messages (an author, or an AI self-correcting per DOC-8 §6) is pointed at the
offending node in the file it is editing, and a multi-page definition names which
page is at fault. **That page-prefixing behaviour is owned and pinned by
AC-849/AC-850** (the authoring-envelope criteria), which assert the
`/pages/N/l1/…` prefix, the multi-page case, and that the prefix holds for every
reported path; this criterion pins the shape of the error list itself, at the
document validator.

## Verification
Submit a document containing several distinct envelope violations at once and
observe the failure result carries a list with one path+message entry per
violation (not a single generic error), each path locating the field at fault.
Do **not** re-assert the `/pages/N/l1/…` prefixing here: AC-849/AC-850 own that
clause and drive it through `validateSite`, so repeating it would duplicate their
evidence rather than add any.
