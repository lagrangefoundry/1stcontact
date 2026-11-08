---
uid: acceptance_criterion-fa0cc2fe
id: AC-2359
type: acceptance_criterion
title: An unmapped service token is refused as an identity with no email; a human's
  own email is never redirected by the mapping
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T01:41:17.281848+00:00'
updated_at: '2026-11-08T01:41:17.281848+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

The service-token mapping can only ever turn a token that would otherwise be
refused into a named person; it can never widen who gets in, and it can never
change who a signed-in human is.

- **Unmapped means refused, as before.** A service token whose machine name is
  not in the mapping is refused exactly as an identity with no email address is
  — the same refusal and the same reason every service token received before the
  mapping existed.
- **Empty means nobody.** While the mapping is empty or not declared, every
  service token is refused that way. Removing or losing the mapping opens
  nothing.
- **A human's own email always wins.** An identity that carries its own email
  address is admitted, or refused, as that address whatever the mapping says —
  including when the mapping lists that identity's machine name, or lists a
  different person. The mapping is consulted only when the identity carries no
  email, so no configuration of it can redirect somebody who signed in.

## Verification

Through the application's own request handling with a gate that verifies real
signed tokens: present a service token whose name is absent from a non-empty
mapping, and one while the mapping is empty, and observe both are refused with
the no-address reason. Present a human identity carrying its own email while
the mapping names a different person for that identity's machine name, and
observe admission is decided for the human's own address and not the mapped
one.
