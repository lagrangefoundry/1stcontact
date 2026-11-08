---
uid: acceptance_criterion-19a996bc
id: AC-2026
type: acceptance_criterion
title: Every picture is named with one declared shape (six kinds, incl. REQ-218's
  stored image) whose schema the model is shown
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:05.175968+00:00'
updated_at: '2026-11-08T23:02:39.993991+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
Every looking operation that takes a picture takes it in one shape: `kind` (required, one of `reference`, `draft`, `edit`, `revision`, `url`, `image`), plus `bundle`, `page`, `revision` (integer), `url`, `image` (a stored picture's name — REQ-218), `original` (boolean, `image` only — REQ-218), `viewport` (one of `mobile`, `tablet`, `desktop`) and `after` (an array of phrases; only a `draft` picture may carry it — see the REQ-216 ACs). The tool schema offered to the model for each such parameter lists exactly these keys with those enums, describes `after` as draft-only, describes `image` and `original` as for `image` only, and describes `viewport` as not applying to an `image` (a stored picture is already the size it is). It disallows additional properties. No operation carries its own reference/actual/source/size-style parameter. A picture with an unknown key or an out-of-enum `kind`/`viewport` is refused before the operation runs.

## Verification
Inspect the offered tool schemas for `screenshot`, `compare` (`a`, `b`) and `check_fidelity` (`actual`) and assert the picture parameter's properties are exactly `after`, `bundle`, `image`, `kind`, `original`, `page`, `revision`, `url`, `viewport`; that `kind`'s enum is the six kinds and `viewport`'s the three widths; that `after` is typed as an array whose description says only a `draft` picture can be driven; that `original` is boolean; that the `viewport` description says it does not apply to an `image`; that `required` is `['kind']` and additionalProperties is false; and that no operation declares ref/actual/source/size parameters. Call `screenshot` with an extra key and with `kind: 'page'` and assert each is refused as invalid parameters.

> Erratum (fix_plan iteration 6, story-58b2cec4): widened from five kinds to six and from seven keys to nine, following REQ-218 (in scope in BUNDLE-42, later than REQ-157), which adds the `image` kind with its `image` and `original` keys. The reference state `reconcile-src-BUNDLE-42:tools/generate/src/cli/ai/fidelity-surface.json` lines 9-64 declare exactly this shape.
> Reconciliation (BUNDLE-42 plan item 4, 2026-11-08): sharpened to state that the schema tells the model `viewport` does not apply to `image` and that `image`/`original` are `image`-only.
