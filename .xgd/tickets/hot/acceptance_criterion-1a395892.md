---
uid: acceptance_criterion-1a395892
id: AC-1779
type: acceptance_criterion
title: An image the toolchain cannot read is refused by name, with unsupported, malformed
  and not-an-image kept distinct
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:05:20.689064+00:00'
updated_at: '2026-09-14T05:16:33.383608+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-046cfc56
  kind: behavior
  regression_only: false
---

## Criterion
A file the toolchain cannot decode produces a refusal that says which of three
distinguishable things went wrong, never a guess:

- **An understood but unsupported feature** — 16-bit samples, or an interlaced
  image — is refused with the feature named and the remedy stated (re-save at 8
  bits, re-save without interlacing). Neither is reachable from anything this
  pipeline produces, so guessing at them would be worse than saying so.
- **A malformed image** — truncated, ending before a chunk it declares, missing
  its end marker, missing its image data, declaring a zero dimension, or carrying
  a row filter or colour type that does not exist — is refused as malformed, which
  is a different class from unsupported.
- **Bytes that are not a PNG at all** are refused with the format read from the
  file's own leading bytes — not from its extension, which is exactly what is
  wrong in the case worth catching — together with a suggestion to convert. The
  named vocabulary covers the photographic, animated, container and vector formats
  an operator can plausibly arrive with, including the one an iPhone produces, and
  bytes matching nothing are refused as unrecognised rather than as a corrupt PNG.

The encode side refuses in the same spirit: a raster whose channel count no image
can hold, or whose buffer is shorter than its declared dimensions require, is
refused by name rather than written out as a file that fails later in someone
else's verb.

## Verification
Take a known-good image and mutate its header to declare interlacing, then 16-bit
samples; assert each refusal names its feature and is of the unsupported class.
Truncate the same file and assert a malformed-class refusal. Hand the decoder
fabricated leading bytes for each named format and assert the refusal is of the
not-an-image class and contains that format's name; hand it bytes matching nothing
and assert the unrecognised wording. Ask the encoder for a raster with an
impossible channel count and for one with a short buffer, and assert each is
refused. Assert all three classes are distinguishable by a caller, not only by
their message text.