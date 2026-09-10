---
uid: acceptance_criterion-66f57a24
id: AC-1122
type: acceptance_criterion
title: A parameter edit writes into the parameters the region already carries and
  disturbs no other, an undeclared default is removed rather than written in, no empty
  container is left behind, and a change map that changes nothing produces no diff
created_by: xgd
created_at: '2026-08-12T18:08:28.462612+00:00'
updated_at: '2026-09-10T17:33:36.877996+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Changing a parameter of a region — how a run is set, or how a picture is framed,
shaped and colour-adjusted — lands **in the parameters the region already
carries**, rather than over them. The parameter named is the only one that moves;
every other parameter the region holds — a run's family, letter spacing and
colour, a picture's fill, opacity and edge treatment, and anything else the page
was captured with — survives byte-identical. That is what makes "restyling
something disturbs nothing else" true of the whole region rather than merely of
the setting that was named.

**Absent is the default**, for every parameter that *has* a value at which it
says nothing. Setting such a field back to that value *removes* the parameter
from the region rather than writing the default into it. Writing it in would grow
the page's definition on every save and turn an edit that changed nothing into a
diff.

Not every parameter has one. A size, a weight and a colour have no setting that
means "nothing declared" — every value they can hold is a value they assert — so
those controls change a parameter and never clear one, and clearing them is the
AI's business rather than this surface's.

**And no empty container is left behind.** Where removing a parameter empties the
group it lived in, the group is removed with it, and a region that carried no
parameters at all before an identity edit carries none after it. An empty group
renders as nothing while reading as something, and it would be a diff on every
save.

**A change map that changes nothing is reported as changing nothing.** A save
carrying only values the region already holds succeeds, reports an empty list of
changed fields, and leaves the stored draft byte-for-byte unchanged — so the
modal cannot put a history in the draft that nobody asked for.

## Verification

Seed a run carrying several parameters beside the ones this surface exposes.
Change one setting and assert the stored run carries the new value alongside
every one of its other parameters unchanged. Set a setting that *has* an
undeclared default — italic, or capitalisation — back to that value and assert
the parameter is absent from the stored run rather than present holding the
default. Change that run's size and its weight and assert each writes its new
value and clears nothing, no value of either being treated as an instruction to
remove the parameter. Re-save the whole form with every value exactly as the
region reported it, and assert the save succeeds, reports nothing changed, and
leaves the stored draft byte-identical. Repeat on an image carrying several
parameters this surface does not expose: change its turn and assert every other
parameter, including its edge treatment, is untouched; return the turn to its
identity and assert the group holding it is gone rather than left empty; and
re-save a picture that declares no parameters at all with every control at its
identity, asserting nothing is reported as changed, the picture still declares
none, and the stored draft is byte-identical.
