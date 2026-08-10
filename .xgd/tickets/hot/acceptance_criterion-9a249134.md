---
uid: acceptance_criterion-9a249134
id: AC-1086
type: acceptance_criterion
title: Writing back an element exactly as it was read is accepted and leaves the page
  unchanged
created_by: xgd
created_at: '2026-08-10T09:19:53.615748+00:00'
updated_at: '2026-08-10T09:19:53.615748+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

An element read at one address and sent straight back to that same address is **accepted**
— it reports a successful change naming the address — and the page is afterwards
equivalent to what it was before: the round trip loses nothing and alters nothing.

This is what makes the read and the replace a usable pair: what comes out is exactly what
may go back in.

## Verification

Read a non-trivial element (children, typed appearance properties, a value reference) and
immediately write it back unmodified. Assert the reply reports acceptance, not a refusal —
a refused write also leaves the page unchanged, so unchanged-ness alone is not evidence.
Then compare the whole page definition before and after as a structure (not as raw bytes,
since a reply may be serialised in a different key order).
