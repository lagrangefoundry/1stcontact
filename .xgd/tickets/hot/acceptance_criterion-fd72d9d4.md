---
uid: acceptance_criterion-fd72d9d4
id: AC-737
type: acceptance_criterion
title: Gate report carries fold residuals as a channel distinct from probe residuals
  and unmatched entries
created_by: xgd
created_at: '2026-07-29T04:20:20.495518+00:00'
updated_at: '2026-08-03T03:07:36.712317+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
---

## Criterion
The combined gate's report carries the fold's residuals — the captured elements the
folder cannot yet express as an L1 leaf — as a **channel of their own**, separate from
the sample-fidelity probe's residuals and its unmatched entries.

- Running the gate on a capture bundle returns the three probe reports, the promoted
  regions, **and** a distinct fold-residual list; a folder-power gap appears in that
  list and never as a fidelity residual or an unmatched entry.
- Each fold residual identifies what could not be expressed and why (its kind, the
  reason, and the captured axes that were carried), so it is actionable as a framework
  gap rather than an anonymous count.
- The gate's human-readable output reports the fold-residual count on its own line,
  labelled as folder-power gaps and itemised, alongside — not merged into — the
  per-probe residual and unmatched counts.
- Fold residuals do not by themselves fail the gate: the verdict remains the conjunction
  of the three probes, so a reproduction can pass while still reporting known
  folder-power gaps.

**The channel reports the gap, not the seam.** An element the fold *can* express is not
a folder-power gap, even where what it emits is a behaviour seam rather than a leaf. A
captured form control that carries geometry is expressed: the fold pins a `slot` node at
its captured rect for a behavior module to mount into, and that control contributes no
fold residual. Only a control with no box at any sampled width — the fold has no rect to
pin a slot at, so there is nothing to mount the behaviour into — is a `field` residual.
Reporting the mountable control here would launder an expressed seam into the gap
channel and overstate the folder's shortfall, which is the opposite of what a channel
that exists to be fed back as framework work is for.

## Verification
Run the gate against a retained capture bundle containing elements the fold cannot yet
express (text-free media with no geometry, a form control with no geometry to pin a slot
at, and a geometry-less run) and assert the returned report exposes a non-empty
fold-residual list whose entries each carry a kind and a reason, while those same
elements produce no fidelity residuals and no unmatched entries. Assert the human-readable
output states the fold-residual count separately from the sample-fidelity residual and
unmatched counts and itemises the residuals. Assert a gate whose three probes all pass
still reports its fold residuals and still passes.

Assert the gap/seam discrimination on that same bundle: give the page a second form
control that *does* carry a box at every sampled width, and assert exactly one `field`
residual is reported — the geometry-less one, its reason naming the missing geometry —
so the mountable control is absent from the channel rather than counted alongside it.
