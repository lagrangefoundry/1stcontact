---
uid: acceptance_criterion-3f7e1894
id: AC-943
type: acceptance_criterion
title: A lightness ramp of one hue becomes one entry with steps, a vivid colour and
  a near-neutral sharing its hue stay separate, and an unclustered colour keeps its
  own entry
created_by: xgd
created_at: '2026-08-06T21:08:03.756062+00:00'
updated_at: '2026-08-10T08:16:04.543588+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-5e7eb0c5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The derived palette groups colours into roles rather than either listing them
all or merging them all:

- several colours of the same hue at different lightnesses become **one** entry
  carrying the rest as named steps;
- a strongly coloured value and a near-grey tinted with the same hue land in
  **different** entries — a brand colour and the neutrals that share its hue are
  two roles, not one ramp;
- a colour that groups with nothing keeps its **own** single-value entry rather
  than being forced into the nearest family;
- true greys, black and white group together as one neutral entry regardless of
  the hue arithmetic reports for them, including near-white and near-black
  values a few units off the extreme.

Derivation is deterministic: the same site yields the same palette, with the
same entry names and the same step assignments, on every run.

## Verification

Run the retrofit over colour sets with known structure and assert which entry
each colour lands in: a five-step single-hue ramp resolves to one entry with
four steps; a vivid colour and a low-intensity colour within a few degrees of
its hue resolve to two different entries; an isolated colour resolves to its
own entry with no steps; a set of near-white, white and near-black values
resolves to one shared neutral entry. Run the derivation twice on the same
input and assert identical palettes.