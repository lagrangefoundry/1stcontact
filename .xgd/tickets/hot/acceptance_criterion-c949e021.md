---
uid: acceptance_criterion-c949e021
id: AC-2410
type: acceptance_criterion
title: 'measure_drawing uses the same browser as the fidelity surface: usable when
  the host supplies fidelity deps, refusing when it does not'
created_by: workflow:fix_reconciliation_review/builder
created_at: '2026-11-08T10:06:54.723147+00:00'
updated_at: '2026-11-08T10:06:54.723147+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
The host asks for the browser once per session build: the measurer behind `measure_drawing`, `relate`, `solve` and `write_image`'s `assert` is built from the same fidelity deps (`deps.fidelity(slug)`) that the fidelity surface is built from. Where the host supplies fidelity deps, the consultant is offered `screenshot` and the measuring operations, and `measure_drawing` renders through those deps' browser driver against the site's `/preview/<slug>/draft/` page. Where the host supplies none, `screenshot` is not offered, the measuring operations are still offered, and `measure_drawing` refuses with the no-browser reason. A session never gets a picture without measurement, or measurement without a picture.

## Verification
Through the real host (`openSession` / `streamPrompt`) with a scripted model client, run one turn that writes a drawing and calls `measure_drawing`, twice. First with `deps.fidelity` returning deps whose `driverFactory` is a scripted driver: assert the tools handed to the model include `screenshot` and `measure_drawing`, the measurement returned to the model came from that driver, the driver opened `<origin>/preview/<slug>/draft/`, and every driver it made was closed. Then with `deps.fidelity` null: assert `screenshot` is absent, `measure_drawing` is offered, and its result names the missing browser.
