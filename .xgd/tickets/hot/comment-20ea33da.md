---
uid: comment-20ea33da
id: COMMENT-4027
type: comment
title: The dev-open warning states the opposite of what happened
created_by: EPIC-16
created_at: '2026-09-27T00:17:08.890344+00:00'
updated_at: '2026-09-27T00:17:08.890344+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-164c2464
  kind: note
---


## 3. The `.dev.vars.local is EMPTY` warning states the opposite of what happened

Found while diagnosing (2). `bin/dev up` prints:

    .dev.vars.local at …/apps/control-app/.dev.vars.local is EMPTY — access-sim
    cannot sign anyone in; the Worker is in dev-open mode

and the Worker is not in dev-open mode. It is fully gated, and access-sim signs
people in perfectly well.

`devEnvLayering` composes three files, later wins: `.dev.vars` (whose whole job is
to BLANK both Access vars), the operator's own secrets file, then
`.dev.vars.local`. The consequence string attached to each file is written as
though that file were the only source of its keys. Here the middle file —
`~/Documents/secrets/1c.dev.env` — carries `ACCESS_TEAM_DOMAIN`,
`ACCESS_AUD` and `SERVICE_TOKEN_IDENTITIES` pointing at the simulator, so
`isUnconfiguredLocalDev` is false and the gate is on. The third file being empty
costs nothing, because the second file already did its job.

[[BUG-146]] established that this exact question must be asked **of the composed
result and not of any one file** — *"no single file is wrong in that state, the
overlay is"* — and then asked only the half that catches a HALF-configured pair.
A pair fully configured from an earlier layer is the other half of the same
question, and it produces a warning that is not merely noisy but false: an
operator who believes the builder is open reads the subsequent 401 as a defect.

Expected: the per-file consequence is stated only when the composed result
actually has that consequence. An absent or empty `.dev.vars.local` whose keys are
already supplied by an earlier layer is worth at most a line naming where they
came from, and is not a warning at all.
