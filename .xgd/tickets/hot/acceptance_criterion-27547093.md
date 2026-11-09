---
uid: acceptance_criterion-27547093
id: AC-2559
type: acceptance_criterion
title: A refused edit leaves the picture and stored recipe unchanged and shows the
  vocabulary's own reason; without a renderer the edit is stored and the modal says
  the picture is shown before the change
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:43:36.870117+00:00'
updated_at: '2026-11-09T18:43:36.870117+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

A commit the origin refuses leaves the picture as it was and says why. A deployment that cannot
render still keeps the edit, and says so:

- the edit route reads the recipe through the one editing vocabulary **before** it stores
  anything, so a caller that skipped the modal is held to the same terms: an operation outside the
  vocabulary, or a malformed one, is refused **409** with the vocabulary's own sentence. A recipe
  the picture cannot take as it currently stands (for example, a crop that would leave nothing)
  is checked against the picture's real dimensions and is also refused **409** in the
  vocabulary's own words. In each case the stored recipe is unchanged. A request with no uid, or
  whose recipe is not a list, is 400;
- in the modal, a refused commit is taken back out of the sitting's history — and only that step;
  everything done before it is untouched — the picture stays as it was, and the origin's sentence
  is shown under the picture. A refusal with no sentence is reported as *"That change could not
  be saved, so the picture is unchanged."*;
- where the deployment has no image renderer, the recipe is **stored anyway** and the answer
  marks it as not rendered; the modal then says *"Saved. You are looking at this picture before
  the change until it is published."* rather than refusing a change that was in fact recorded.

## Verification

Post a recipe containing an operation the vocabulary does not name and observe 409 with the
vocabulary's sentence and the stored recipe unchanged; post a crop that leaves nothing of the
picture and observe the same. In the modal, make one good change and then one the origin refuses,
and observe the refusal sentence shown, the picture unchanged, and Undo stepping back to the
state before the good change (not before the refused one). On a deployment without the renderer,
commit a turn and observe the recipe stored, the answer marked not rendered, and the
before-the-change sentence in the modal.
