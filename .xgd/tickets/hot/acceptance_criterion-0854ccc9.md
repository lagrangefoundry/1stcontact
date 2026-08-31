---
uid: acceptance_criterion-0854ccc9
id: AC-892
type: acceptance_criterion
title: 'A published revision stores both halves of the artifact: the rendered output
  and the frozen definition it was rendered from'
created_by: xgd
created_at: '2026-08-06T18:39:17.424059+00:00'
updated_at: '2026-08-31T11:33:12.857855+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Publishing stores, under the revision's own location, both halves of the
artifact: the rendered output (at minimum the entry page document and its
stylesheet) and the frozen definition it was rendered from (at minimum the site
record and each page record). The stored bytes are the real rendered bytes, not
placeholders, and the asset bytes are present in both halves, so a published page
does not decay when the draft's assets are later replaced.

The frozen definition is what makes the artifact complete, and it is load-bearing
for a different reason than it once was: the mutable draft lives in the store, so
this is the only copy of what the site looked like at that revision — which is
what makes a checkout of it possible at all. Reading a revision back yields the
definition it froze; a revision the record does not vouch for reads as absent
rather than as whatever bytes happen to be lying under its location.

Publishing against the operator's own filesystem store additionally refreshes the
local published output directory that the local serve, screenshot and fidelity
loops read, and the publish command's report names that location.

## Verification

Publish a freshly imported site. Assert that both halves are present under the
revision's location — the entry page carrying real rendered markup that
references its stylesheet, and the frozen site record and page records — and that
reading the revision back through the store yields the same definition the draft
held. Assert an asset the draft holds is readable under both halves. Assert that
a revision id the record does not carry reads back as absent. Run the publish
command against a filesystem-backed site and assert its report names the
refreshed published output directory.
