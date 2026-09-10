---
uid: acceptance_criterion-c9b3f600
id: AC-687
type: acceptance_criterion
title: A rejected document returns the full list of per-field errors
created_by: xgd
created_at: '2026-07-22T19:32:29.199138+00:00'
updated_at: '2026-09-10T12:38:35.238885+00:00'
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
page is at fault. **That page-prefixing behaviour is stated here as context and
is owned and proven by AC-849 and AC-850**, which assert `/pages/0/l1/…` and the
multi-page `/pages/1/l1/…` case against a real site definition; this criterion's
own evidence is the document-local error list.

## Verification
Submit a document containing several distinct envelope violations at once and
observe the failure result carries a list with one path+message entry per
violation (not a single generic error), each path locating the field at fault.
The page-prefixed repeat is **not** part of this criterion's verification: AC-849
and AC-850 submit the equivalent as a page inside a multi-page site definition
and observe every reported path prefixed into that page's L1 body, so restating
that arm here would duplicate their evidence rather than add any.
