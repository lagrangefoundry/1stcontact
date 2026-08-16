---
uid: acceptance_criterion-3f7e1894
id: AC-943
type: acceptance_criterion
title: A hue family becomes one entry plus a shade on each reference, based on the
  member that reaches the most others, with unreachable and mis-classifying fits refused
created_by: xgd
created_at: '2026-08-06T21:08:03.756062+00:00'
updated_at: '2026-08-16T22:25:15.961676+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-5e7eb0c5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The derived palette groups colours into roles rather than either listing them
all or merging them all, and it expresses a family as **one entry plus a shade on
each reference** — no entry carries named steps, and none is ever emitted:

- several colours of the same hue at different lightnesses become **one** entry,
  with every other member of the family carried as a shade on the references
  that used it;
- the entry's value is the family member that **reaches the most others** — the
  one whose shade axis reproduces the largest number of its siblings — and where
  several reach equally many, the most-used colour wins the tie. It is not
  simply the lightest member: a shade only removes chroma, so the pale end of a
  ramp reaches nothing and choosing it would shatter a genuine family into
  singletons;
- grouping proceeds in rounds: whatever a family's entry cannot reach is
  re-offered for grouping rather than dropped straight to a singleton, so a set
  of rejects that forms a family of its own is found instead of being filed as
  unrelated entries;
- a fit is accepted only if the colour it *paints* would still be classified into
  the same family as the colour it replaces; a fit that would move a colour
  across that boundary is refused, and the colour is treated as unreached;
- a strongly coloured value and a near-grey tinted with the same hue land in
  **different** entries — a brand colour and the neutrals that share its hue are
  two roles, not one ramp;
- a colour that groups with nothing keeps its **own** single-value entry rather
  than being forced into the nearest family;
- true greys, black and white group together as one neutral entry regardless of
  the hue arithmetic reports for them, including near-white and near-black
  values a few units off the extreme.

Derivation is deterministic: the same site yields the same palette, with the
same entry names and the same shade on every reference, on every run.

## Verification

Run the derivation over colour sets with known structure and assert which entry
each colour lands in and what shade its reference carries: a single-hue lightness
ramp resolves to one entry with a shade on each non-base reference and no step
anywhere in the output; a family whose most-reaching member is not its lightest
resolves with that member as the entry value; a colour whose best fit would paint
something the grouping would classify differently resolves to its own entry
rather than to a shade; a vivid colour and a low-intensity colour within a few
degrees of its hue resolve to two different entries; an isolated colour resolves
to its own entry with no shades; a set of near-white, white and near-black values
resolves to one shared neutral entry. Run the derivation twice on the same input
and assert identical palettes and identical references.
