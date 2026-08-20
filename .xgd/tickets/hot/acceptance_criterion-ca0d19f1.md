---
uid: acceptance_criterion-ca0d19f1
id: AC-1348
type: acceptance_criterion
title: A seam's behavioural config is derived from the capture alone; an honest default
  records a derivation gap
created_by: xgd
created_at: '2026-08-20T12:47:57.523733+00:00'
updated_at: '2026-08-20T14:39:18.520163+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The fold derives each recovered behaviour seam's **behavioural config from the capture
alone**, and the enumeration is complete — nothing else about a seam is derived:

1. the **field list** — one field per captured control in the cluster, with a submission
   key slugified from its label and made unique within the form;
2. each field's **label**, from the a11y tree's accessible name (whatever named the
   control: a `<label>`, `aria-label`, or the placeholder);
3. each field's **label placement**, read from the a11y tree's **name source** — a name
   sourced from the placeholder folds to placeholder labelling, anything else to a visible
   label above the box;
4. each field's **type**, from the captured input type where the bundle recorded one,
   falling back to the control's **height** where it did not — a control materially taller
   than the form's shortest being a multi-line box;
5. the submission **endpoint**, from the captured form action;
6. where a claimed submit button was lifted into the seam, that **button's own words** as
   the form's submit copy.

Label placement has to be derived rather than styled because the a11y tree is its only
witness — a label above the box and the same words inside it are both just text near a box,
so no painted axis can hold the difference — and getting it wrong costs geometry, not
polish: a label row the reference never had pushes every field below it down, so the whole
form drifts progressively further off with each field. The captured submit wording is
behavioural copy in the same sense: it names the action, while the button's *look* is
already owned by its `control` leaf.

**The derivation invents nothing.** Where the capture carries no such fact — or carries an
endpoint that is not a safe URL — the fold takes an honest default and records a
**derivation gap** naming what was missing, so a default is never mistaken for a captured
fact:

- an unnamed control still becomes a field under a positional label, with a gap;
- a control with no recorded input type is typed from height, with a gap;
- a form with no captured action posts to its own URL, with a gap; an action that is not
  a safe URL is **dropped** (never carried), with a gap. A fabricated endpoint is the one
  derivation that would silently send real leads somewhere, so it is refused outright.

That channel is deliberately **distinct from the typed element residual**: the form *was*
mounted, so a missing endpoint names a gap in what the capture saw, not a gap in L1's
expressive power. Conflating the two would make a successfully mounted form read as an
un-foldable field.

## Verification
Fold a capture of a form whose controls carry accessible names, recorded input types, a
form action and a claimed submit button, and assert the derived config carries exactly the
six enumerated facts: one field per control with unique slugified keys, each field's label
and type, the endpoint, and the submit wording — and assert its derivation-gap list is
empty.

Label placement: assert a control whose accessible name is sourced from its placeholder
folds to placeholder labelling and one named by a `<label>` folds to a visible label.

Fallbacks, each with its gap: strip the recorded input type from a control materially
taller than the form's shortest and assert it types as a multi-line box **and** records a
derivation gap naming the missing type; strip a control's accessible name and assert it is
still a field under a positional label with a gap; remove the form action and assert the
config carries no endpoint, the form posting to its own URL, with a gap; set the action to
an unsafe URL and assert it is dropped rather than carried, with a gap naming it.

Channel separation: assert every gap above is reported on the seam's own derivation-gap
list and that the fold's typed element-residual list is unchanged by them — a mounted form
with a missing endpoint contributes no element residual.