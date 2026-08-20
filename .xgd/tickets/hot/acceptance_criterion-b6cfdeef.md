---
uid: acceptance_criterion-b6cfdeef
id: AC-1342
type: acceptance_criterion
title: No secret value is committed anywhere, and the documented push pipes the value
  and echoes only its name
created_by: xgd
created_at: '2026-08-20T05:31:50.918216+00:00'
updated_at: '2026-08-20T05:57:17.820130+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

No secret **value** appears anywhere the repository can leak one: not in the build, deploy or smoke
commands, not in the hook documentation, and not in any Worker's deployment configuration. None of
those files matches the shapes a real credential takes — a provider-prefixed API key, a private-key
block, or a credential-named assignment carrying a literal value.

The documented push mechanism is verifiable from the documentation itself: the value is **piped**
into the secret-setting command rather than passed as an argument (an argument is visible in the
process list and in shell history), written in a form that appends no trailing newline (which would
otherwise become part of the secret), and never echoed back — a hook reports the secret's *name*
and its destination, never its value, and the only listing the documentation offers is of names.

## Verification

Scan the three commands, both hook documents and every Worker's deployment configuration for the
credential shapes above and confirm none matches. Read the secret hook documentation and confirm it
describes the piped, newline-free push, that no form passing the value as an argument appears, and
that the worked example prints only the name and destination in both the rehearsal and the real
path.