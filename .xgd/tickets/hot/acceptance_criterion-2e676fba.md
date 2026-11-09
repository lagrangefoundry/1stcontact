---
uid: acceptance_criterion-2e676fba
id: AC-2536
type: acceptance_criterion
title: A HEIC that cannot be converted (no converter, too large for it, or conversion
  failed) is refused with a distinct sentence each, and nothing is created
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T17:46:02.715998+00:00'
updated_at: '2026-11-09T17:46:02.715998+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

A HEIF photograph that cannot be converted is refused before anything is created. There are
three refusals, and each says something different because each is a different fact.

- **The deployment cannot convert** (no image converter is configured). The upload is refused
  with a sentence that names HEIC as the iPhone's default format, says this deployment has no
  converter configured to read it, and gives the remedy: on the phone, *Settings → Camera →
  Formats → Most Compatible*. The file is not stored as HEIC instead.
- **The file is too large for the converter.** A HEIF file above the converter's 20 MiB input
  ceiling is refused for being too large, in the same size wording as the material ceiling, and
  the conversion is not attempted. That ceiling is below the 25 MiB material ceiling, so a HEIF
  file between the two is refused here with its size as the reason, not as an unreadable file.
- **The conversion failed** on these bytes. The upload is refused with a sentence that names HEIC,
  says it could not be converted into a picture we can show and that the file may be damaged, and
  gives the same remedy. The converter's own technical detail is not shown to the client.

In all three cases no material is created, no bytes are written to the material store, and
nothing is announced to the index. The refusals name the format and the remedy, not the file,
because the surfaces that show them already name the file. As with every refusal in this
pipeline, a record can never point at bytes that are not there.

## Verification

Through the upload route with HEIF bytes, run three cases: no converter configured; HEIF bytes
over 20 MiB and under 25 MiB with a converter that records its calls; a converter that throws.
For each, assert the route answers with a refusal, the refusal's sentence is the one that case
calls for (and differs from the other two), no material is listed afterwards, and the material
store holds no new bytes. In the oversize case, assert the converter was never called. In the
throwing case, assert the converter's error text does not appear in the client-facing sentence.
