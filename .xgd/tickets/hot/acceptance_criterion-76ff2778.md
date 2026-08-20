---
uid: acceptance_criterion-76ff2778
id: AC-1333
type: acceptance_criterion
title: Executable hooks run in sorted order before the upload with the deploy context
  in their environment; non-executable files are ignored
created_by: xgd
created_at: '2026-08-20T05:31:07.446032+00:00'
updated_at: '2026-08-20T05:31:07.446032+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

Migration hooks and secret hooks are discovered by **executability**, not by name or by a list. For
each app, every executable file in the migration hook directory and then every executable file in
the secret hook directory runs in sorted order **before** that app is uploaded, and each is named
as it runs. A non-executable file in either directory is ignored entirely, so each directory's
documentation can sit beside its hooks. A hook directory containing no executable file is reported
as having none, rather than passing silently.

Each hook receives, in its environment: the app being deployed, that app's directory, the target
environment, the deployed Worker's name as declared for that environment (which may differ from
the app's directory name), whether this run is a rehearsal, and the repository root.

## Verification

Place an executable hook in the migration directory that prints the context it was given, and
deploy one app: it runs before the upload and reports the app, the environment, the Worker's name
and the rehearsal flag with the expected values. Confirm the documentation file already sitting in
each hook directory is non-executable and is never run. Deploy with both hook directories holding
only documentation and confirm each is reported as having no hooks.
