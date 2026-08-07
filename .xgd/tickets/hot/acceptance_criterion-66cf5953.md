---
uid: acceptance_criterion-66cf5953
id: AC-818
type: acceptance_criterion
title: Module-invariant elements and the names they would source are excluded from
  capture and pairing
created_by: xgd
created_at: '2026-08-06T01:46:18.506624+00:00'
updated_at: '2026-08-07T23:11:24.069647+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The capture skips the elements a behavior module declares **invariant** — those whose
presentation is fixed by an obligation rather than by taste (a honeypot that must stay
invisible, a programmatic label that must stay out of flow, a widget mount that must
sit where the widget expects it) — along with everything inside their subtrees.

They exist only on the reproduction side, so pairing against them slides the whole
control queue and every field mispairs against its neighbour, turning a page's entire
delta report unreadable. `values-diff` therefore never pairs against one, and they
raise no repro-only objects of their own.

The exclusion extends to the **accessible name** such an element would source: a
visually-hidden label must not re-describe a placeholder-labelled field as
label-labelled, or the module honouring its obligation manufactures a permanent
containment delta that no reproduction could ever close.

## Verification
Capture a reproduction of a form whose module emits a hidden label, a honeypot input
and a widget mount, all marked invariant. Assert none of them appears in the manifest;
assert every reference control pairs one-to-one with its counterpart with no offset;
assert no repro-only object comes from the invariant set; and assert a
placeholder-labelled field still reports its name as sourced from the placeholder
despite the hidden label above it.