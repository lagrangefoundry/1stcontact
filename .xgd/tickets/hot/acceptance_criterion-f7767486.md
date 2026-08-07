---
uid: acceptance_criterion-f7767486
id: AC-1016
type: acceptance_criterion
title: The install refusal carries the ENVIRONMENT code, exit status 6, and the standard
  --json error envelope
created_by: xgd
created_at: '2026-08-07T03:13:19.905827+00:00'
updated_at: '2026-08-07T03:22:04.006953+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

A preflight refusal travels the CLI's existing structured-failure contract rather
than arriving as an unclassified crash, so a scripted or AI caller branches on
the outcome without parsing prose.

- The failure code is `ENVIRONMENT`, distinct from every input-shaped code
  (schema-invalid, not-found, referential-integrity, conflict) and from the
  internal-error code: neither the command nor its input was wrong, so the
  caller should re-install and retry rather than re-form the request.
- `ENVIRONMENT` maps to process exit status **6**, identical in human and
  `--json` mode.
- Under `--json` the failure is the standard envelope,
  `{"ok":false,"error":{code,message,hint}}`, carrying the same message and the
  same literal install command as the human rendering.

## Verification
Trigger the refusal on a gated command and assert the failure's code is
`ENVIRONMENT`, that this code maps to exit status 6, and that its machine-readable
envelope carries that code alongside the message and the install hint.