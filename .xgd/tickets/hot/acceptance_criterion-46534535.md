---
uid: acceptance_criterion-46534535
id: AC-1032
type: acceptance_criterion
title: One render backs both the artifact written to disk and the bytes the origin
  serves — same file set, same bytes, both channels
created_by: xgd
created_at: '2026-08-10T07:29:07.725899+00:00'
updated_at: '2026-08-10T07:39:49.771743+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

For each draft-side channel, the set of text artifacts the platform's render
command writes to disk and the set the origin will serve are the *same set*, and
each artifact is byte-for-byte the same text. This holds for the ordinary
rendering and for the editable one, and for every artifact a channel contains —
not only its pages, but the per-site stylesheet, where a new typed axis or a
changed token actually lands and where a second implementation would be most
likely to be approximately right rather than identical.

The claim is equality, deliberately. Two implementations that agree today are
what this criterion exists to rule out: they diverge at the next axis, and the
divergence appears as "the page looks different in the builder than when it is
published", which is unattributable after the fact.

## Verification

For each draft-side channel: render the site to disk with the platform's own
render command, then request every artifact it wrote from the origin under that
channel and assert each response body equals the file's bytes exactly. Assert the
artifact set is more than the pages alone and includes the stylesheet. Assert the
channel root — a directory address, which is what the display panel actually
loads — returns the home page's bytes. Do this against a site carrying real
content: at least two pages, a behaviour module, and an asset, so the comparison
covers the module render path and asset serving rather than an empty starter.