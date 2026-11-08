---
uid: acceptance_criterion-b6cfdeef
id: AC-1342
type: acceptance_criterion
title: No secret value is committed anywhere, and the documented push pipes the value
  and echoes only its name
created_by: xgd
created_at: '2026-08-20T05:31:50.918216+00:00'
updated_at: '2026-11-08T02:24:17.021405+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

No secret **value** appears anywhere the repository can leak one: not in the build, deploy or smoke
commands, not in the hook documentation, and not in any Worker's deployment configuration. None of
those files matches the shapes a real credential takes: a provider-prefixed API key, a private-key
block, or a credential-named assignment (a name containing SECRET, TOKEN, API_KEY or PASSWORD)
carrying a literal value.

**One exemption, to the name-matched shape only.** The service-token identity mapping
(`SERVICE_TOKEN_IDENTITIES`) names who a credential belongs to, never what it is, so it is exempt from
the credential-named-assignment shape. The exemption is a named list, not every variable ending in
`_IDENTITIES`: an unlisted `*_IDENTITIES` variable holding a credential-named literal is still
reported. The exemption is held to its own grammar. Every comma-separated entry the exempted
variable carries must be a `name=address` pair (a name of letters, digits, dots, underscores or
hyphens, then `=`, then an address with one `@` and a dotted domain). Any other entry fails the
same scan run, and the failure names the file and the offending entry. An empty value has no
entries and passes. The value-matched shapes are **not** exempted: a provider-prefixed key or a
private-key block is reported under any name, the exempted name included.

The documented push mechanism is verifiable from the documentation itself. The value is **piped**
into the secret-setting command rather than passed as an argument (an argument is visible in the
process list and in shell history). It is written in a form that appends no trailing newline (which
would otherwise become part of the secret), and it is never echoed back. A hook reports the
secret's *name* and its destination, never its value, and the only listing the documentation
offers is of names.

## Verification

Scan the three commands, both hook documents and every Worker's deployment configuration for the
credential shapes above and confirm none matches, with the committed production identity mapping
(`1stcontact-publish=<address>`) passing as an exempted `name=address` entry. Confirm the exemption's
edges:
- An exempted entry that is not a `name=address` pair fails.
- A provider-prefixed key assigned to the exempted name is still reported.
- An unlisted `*_IDENTITIES` variable with a credential-named literal is still reported.

Read the secret hook documentation and confirm it describes the piped, newline-free push, that no
form passing the value as an argument appears, and that the worked example prints only the name and
destination in both the rehearsal and the real path.
