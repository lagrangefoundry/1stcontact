---
uid: acceptance_criterion-55c7fb2d
id: AC-1008
type: acceptance_criterion
title: The stamp vocabulary is one published contract, so the render that writes it
  and the client that reads it cannot drift
created_by: xgd
created_at: '2026-08-07T02:42:57.244108+00:00'
updated_at: '2026-08-07T18:00:58.718435+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Everything a client needs in order to read a stamped render is published as a
single contract by the site definition schema: the edit-mode marker, the page
stamp, a region's kind and its address, the names identifying a behavior instance
and the seam within it, the dotted form an address is written in, and the class
that marks the segment under the pointer.

The render writes its stamps and its stylesheet selectors using exactly those
published values, and any consumer that reads a stamped render obtains the same
values from the same contract — where the renderer's own surface still offers
them, it re-exports the contract rather than declaring its own, so the two are
the same values and not merely equal-looking ones. A rename therefore reaches
both sides at once, and markup that a reader can no longer parse is not a state
the writer and the reader can reach independently.

The hot-segment class belongs to that vocabulary for the same reason the
attribute names do: the render says what a hot segment looks like and a client
says which segment is hot, so both need the name and neither owns it.

## Verification

Assert the site definition schema publishes each stamp name, the hot-segment
class, and the dotted address form's reading and writing; assert the renderer's
published surface exposes the same names with values identical to the schema's
rather than independently declared ones. Render the edit channel and assert every
stamp emitted on the output is named by those published values, that the hot
treatment's selector is composed from the published region-stamp name together
with the published hot class, and that an address read off the output through the
published form addresses the node it was derived from.