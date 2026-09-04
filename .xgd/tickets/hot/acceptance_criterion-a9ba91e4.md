---
uid: acceptance_criterion-a9ba91e4
id: AC-1534
type: acceptance_criterion
title: Above the budget with no way to describe territories, the build refuses by
  name and the previous landscape stands
created_by: xgd
created_at: '2026-09-04T03:36:50.611590+00:00'
updated_at: '2026-09-04T03:46:50.669314+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0fb17a68
  kind: behavior
  regression_only: false
---

## Criterion

When a client's corpus has grown past the budget and the host has no way to describe territories,
the landscape build refuses, and refuses informatively: the failure names the missing description
capability and says where a caller must supply it, and reports how large the corpus has grown and
what budget it passed.

The refusal leaves everything as it was. The previously published landscape for that client stands
unchanged, and where none had been published none is created — the corpus is never given a
mechanically generated stand-in that restates what is already rendered beside it, and a client's
existing landscape is never replaced by a worse one.

## Verification

With a corpus that exceeds the budget and no description capability supplied, request the landscape
and observe it fails with an error that names the missing capability, the corpus size and the
budget. Observe no landscape has been published for that client. Repeat with a landscape already
published and observe its content is unchanged after the refusal.