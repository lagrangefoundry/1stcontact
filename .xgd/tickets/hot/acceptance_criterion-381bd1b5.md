---
uid: acceptance_criterion-381bd1b5
id: AC-1558
type: acceptance_criterion
title: A Library surface sits beside the site surface in the workspace, listing the
  account's material with a detail area beside it
created_by: xgd
created_at: '2026-09-04T04:26:22.029572+00:00'
updated_at: '2026-09-04T04:45:39.258254+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f775289b
  kind: behavior
  regression_only: false
---

## Criterion

The builder workspace offers a second content surface, reachable without leaving the workspace and
without losing the site surface. Selecting it presents the account's material as a list of
selectable rows on one side and a detail area on the other; before anything is selected the detail
area carries a plain-language invitation to pick something rather than being blank.

Each row identifies its material by name and states what kind of thing it is.

## Verification

Mount the workspace and switch to the Library surface. Assert that a distinct panel appears, that
the site surface still exists and is unchanged, that the panel presents both a list region and a
detail region, and that the detail region's initial content is the empty-state prompt rather than
empty. Assert each rendered row carries the material's name and its kind.