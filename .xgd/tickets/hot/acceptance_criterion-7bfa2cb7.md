---
uid: acceptance_criterion-7bfa2cb7
id: AC-2105
type: acceptance_criterion
title: The limits section states every structural (non-numeric) refusal the validator
  makes, beside the numeric bounds, in the validator's own words
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T09:19:08.119499+00:00'
updated_at: '2026-11-01T09:24:18.346398+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

The section of the layout reference stating the limits every page is held to
lists, beside the numeric bounds and under the same "refused whole" promise,
every structural rule the validator enforces that is not a number: viewport
widths strictly ascending; keyframes strictly ascending by width; a keyframe
width being one of the document's widths; a palette reference naming a declared
palette entry; a column anchor requiring the document to declare a column; node
ids unique across the page; every URL being http/https or site-relative; a
painted font family resolving to a served face or naming a generic; and an asset
reference naming an asset the site holds.

Each rule is stated as the sentence the validator itself carries for that rule —
nothing in the reference is authored separately — and every rule stated is one
the validator actually applies: provoking it produces a refusal (or, for the
font-family and asset rules, a reported finding) whose message contains that
rule's own statement. Adding or removing a rule in the validator adds or removes
it from the reference on regeneration.

Rewording the validator's messages to lead with the rule's statement keeps the
phrases existing readers already match on — `duplicate node id '<id>'`,
`not an allowed URL`, `not one of the document widths`.

## Verification

Read the limits section of the generated reference: every numeric bound is
named, and every structural rule's statement (derived from the validator's rule
table at check time) appears in it. For each rule, submit a page that breaks
it and confirm a refusal or finding message carries that rule's statement;
confirm the duplicate-id, unsafe-URL and undeclared-keyframe-width refusals
still contain their legacy phrases.