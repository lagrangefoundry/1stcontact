---
uid: acceptance_criterion-d259764b
id: AC-741
type: acceptance_criterion
title: A run records its full font-family stack, while face-file joins and the load
  check use the leading family name
created_by: xgd
created_at: '2026-08-03T00:24:37.947053+00:00'
updated_at: '2026-08-03T00:53:41.285476+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-244827df
  kind: behavior
  regression_only: false
---

## Criterion
Each captured text run records the complete declared font-family stack as
authored (for example `Cinzel, serif`), not only its leading token, so a
reproduction that replays the value has the same fallbacks the reference had.

Wherever a single family NAME is required rather than a stack — joining a family
to its mirrored face files, and checking whether the intended face resolved —
the leading name of the stack is used, so both sides of that join meet on the
same normalised name and a family with a stack still resolves its files.

## Verification
Capture a page whose body text declares a multi-name stack: the recorded run
carries every name in the stack, in order. On the same capture, the recorded
theme entry for a family whose face mirrored carries a non-empty file list —
demonstrating the stack-to-name join holds — and the run is not reported as
having fallen back to a substitute face.