---
uid: acceptance_criterion-dc286c89
id: AC-1235
type: acceptance_criterion
title: A rename onto an existing name or a malformed name is refused where the write
  happens and leaves the draft byte-unchanged — no partially-renamed state is reachable
created_by: xgd
created_at: '2026-08-20T01:20:21.857266+00:00'
updated_at: '2026-08-20T01:50:35.583410+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ee073693
  kind: behavior
  regression_only: false
---

## Criterion

A rename onto a name the palette already declares, or onto a name that is not kebab-case, is
refused — reported as a conflict and as a schema refusal respectively, each naming what was
wrong (a collision names the entry it would have merged with and says that merging two colours
is a deliberate decision).

Both refusals are enforced where the write happens, so a request arriving directly at the origin
with no client-side check is refused identically. **No partially-renamed state is reachable**:
after a refusal the site definition and every page are byte-unchanged.

## Verification

Capture the site definition and every page byte-for-byte. Post a rename onto an existing entry
name directly to the origin route and assert a client-error status with a conflict code; post a
rename onto a name with spaces and capitals and assert a client-error status with a schema code.
After both, re-read the definition and every page and assert they are byte-identical to the
captured copies — the palette key did not move and no reference was rewritten.