---
uid: acceptance_criterion-4bd36a69
id: AC-1090
type: acceptance_criterion
title: A refused change — including a dangling-reference refusal — tells the caller
  nothing was written, which field or reference was wrong, and what to do instead
created_by: xgd
created_at: '2026-08-10T09:20:12.311805+00:00'
updated_at: '2026-11-01T01:10:11.785873+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A refusal is correctable within the same exchange. It carries three things together:

- the **failure code**;
- a **recovery strategy** — that nothing was written, that the same call must not be sent
  again unchanged, and what to do instead (read the element back and send a corrected
  replacement; for a broken reference, reference something the site holds or add it to
  the site first);
- the **offending field or reference**, named as a pointer into what was sent — and, for a
  broken reference, the referenced value itself together with what the site does hold
  (the faces the page serves, or the assets the site has) — so the caller does not have
  to guess which part of what it sent was refused.

The strategy and the field are complementary, not alternatives: the declared meaning of the
code carries the strategy, and the write path's own account of the failure is appended to
it. A caller that receives both corrects in one step; one that receives either alone does
not. This holds for every refusal on the page-changing operations, including a
dangling-reference refusal from either the element or the page-style write.

## Verification

Send a replacement with a wrongly-typed value for a typed appearance property. Assert the
reply carries the schema-invalid code, states all three of: nothing was written, do not
resend unchanged, read the element back — **and** names the offending property (the
pointer into the element reaches the caller, e.g. the refusal for a bad `fontSizePx`
names `fontSizePx`). Then send a write that introduces a font family no face serves, and
one that references an asset the site does not hold: assert each is refused with the
schema-invalid code, names the offending family or asset reference, lists what the
site does hold, and leaves the draft unchanged.
