---
uid: acceptance_criterion-66e919f9
id: AC-945
type: acceptance_criterion
title: 'A retrofit that cannot be proved lossless writes nothing: the command fails
  with a diagnostic and every file is left untouched'
created_by: xgd
created_at: '2026-08-06T21:08:29.338855+00:00'
updated_at: '2026-08-16T22:57:10.219076+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-5e7eb0c5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The retrofit writes only after it has proved the conversion is safe. When it
cannot — because the named site has no stored draft definition to convert,
because a derived reference would not reproduce the literal it replaces within
the stated bound (byte-exactly, where the reference carries no shade, and
byte-exactly for opacity in every case), or because the converted definition
would not satisfy the site-definition contract — the command:

- terminates with a non-zero exit status;
- reports on standard error a diagnostic that identifies which of those causes
  applies, naming the colours that failed to reproduce or the validation
  problems found;
- leaves every file under the site byte-identical to before the command ran,
  including the site definition and every page.

Partial writes do not occur: no page is rewritten while another is not, and a
palette is never written beside pages that still carry literals.

## Verification

Invoke the retrofit against a slug with no stored draft definition and assert a
non-zero exit, a diagnostic naming the missing site on standard error, and no
filesystem change. Exercise the reproduction and contract-validation failure
paths by driving the conversion with input whose references cannot land within
the bound or that produces an invalid definition, and assert in each case the
non-zero exit, the corresponding diagnostic, and that hashes of all the site's
files are unchanged.
