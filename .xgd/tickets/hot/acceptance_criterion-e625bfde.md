---
uid: acceptance_criterion-e625bfde
id: AC-2019
type: acceptance_criterion
title: Every Library row opens with exactly one labelled type icon — distinct for
  document, image and font, one fallback for every other kind — and no row carries
  a kind pill
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-26T01:39:00.190886+00:00'
updated_at: '2026-10-26T02:01:00.554017+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

Every Library row opens with exactly one type icon, and the icon — not a pill — is where the row
says what kind of file the material is.

Specifically, over a list holding material of every kind the filing vocabulary declares
(`document`, `image`, `font`, `capture`) plus a kind the Library has never heard of:

- Each row's first element is a type icon, and each row carries exactly one, which is never
  empty.
- Rows of kind `document`, `image` and `font` each carry an icon distinct from the other two.
- Rows of kind `capture`, and of any kind not named above, carry one shared fallback icon,
  distinct from the three named ones — no row renders iconless.
- The icon is announced to assistive technology as an image labelled with the material's kind,
  so a screen reader still hears the type the row no longer prints in words. A row with no
  recorded kind is announced as a file.
- No row carries a kind pill. The role pill and the "On this site" placement badge remain where
  they apply (STORY-143/AC-2018 govern when the placement badge shows).
- The kind is still offered as a filter and still shown in the selected material's detail
  record; only the row's kind pill is replaced.

## Verification

Mount the Library over a fixture holding one material of each declared kind and one of an
unknown kind; for each row assert exactly one non-empty icon leads it, that the three named
kinds' icons are pairwise distinct, that capture and the unknown kind share the fallback, that
each icon is exposed as an image labelled with its kind, and that no row contains a kind pill
while role and placement pills still render where applicable.