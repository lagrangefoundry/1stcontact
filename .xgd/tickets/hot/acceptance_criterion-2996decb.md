---
uid: acceptance_criterion-2996decb
id: AC-2331
type: acceptance_criterion
title: account-chrome is catalogued beside contact-form with an L2 slot preset, and
  meets the module contract and conformance obligations
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-05T21:26:15.927741+00:00'
updated_at: '2026-11-09T22:51:58.652100+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
`account-chrome` is a behavior module in the catalog **beside `contact-form`**,
on the same contract and with no machinery of its own:

- It is catalogued as `account-chrome@2` with `kind: 'behavior'` and resolves
  through the same catalog lookup as every other module, in both hosts.
- Its config is behavioural only: three **required** URLs (the sign-in endpoint,
  the portal, the builder), optional wording for each control and for the
  field's label, and `labelMode`. There is **no sent-message wording in config**:
  the confirmation and the failure are authored slots, not strings. There is no
  default builder URL, because a default would have to name the platform's own
  builder. Each URL passes the module's URL safety check, and an unsafe scheme
  is refused, not rendered.
- It declares six **required** slots (`signedOut`, `signedIn`, `businesses`,
  `dialog`, `sent`, `error`) and the controls placed in them. The dialog's
  programmatic label is a declared **invariant** `label` element, never bindable
  by L1, and marked as module chrome in the DOM.
- **It ships an L2 slot preset asked for by behavior id.** Asking the preset
  library for `account-chrome` returns one valid L1 subtree for each of the six
  slots (including a default sent card and a default error card), so a site can
  mount it without authoring any L1. Asking for an unknown behavior id still
  returns nothing.
- **L1 decides where it goes and what it looks like.** Two sites can bind it to
  different slots, with different paint, and both render. Two instances on one
  page (for example header and footer) use separate class namespaces and both
  follow the page's current state.
- It declares the full five-dimension conformance set (safety, security,
  x-browser, responsive, isolation). It ships **no paint**: its stylesheet holds
  only the wrapper zeroing, the state-visibility rules, the invariant label, and
  the modal geometry that applies only after script has taken over. There is no
  module-painted message element. Every colour, type, spacing and arrangement
  belongs to the slots' L1.
- An isolation case: a malformed (repeated) binding on one of its single slots
  costs that slot only. The rest of the page still renders.

## Observable at
The published behavior catalog and preset library, the published page and its
stylesheet, and the conformance harness's result for the module.
