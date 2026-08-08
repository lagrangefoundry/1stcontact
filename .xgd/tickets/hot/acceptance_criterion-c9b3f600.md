---
uid: acceptance_criterion-c9b3f600
id: AC-687
type: acceptance_criterion
title: A rejected document returns the full list of per-field errors
created_by: xgd
created_at: '2026-07-22T19:32:29.199138+00:00'
updated_at: '2026-08-08T00:42:01.171045+00:00'
completed_at: null
last_field_updated: uat_coverage
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
page is at fault.

## Verification
Submit a document containing several distinct envelope violations at once and
observe the failure result carries a list with one path+message entry per
violation (not a single generic error), each path locating the field at fault.
Submit the equivalent as a page inside a multi-page site definition and observe
every reported path is prefixed into that page's L1 body and names the offending
node.