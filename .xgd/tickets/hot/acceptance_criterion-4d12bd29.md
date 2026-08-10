---
uid: acceptance_criterion-4d12bd29
id: AC-860
type: acceptance_criterion
title: Font bytes present in the project that no record accounts for fail the check
  even when nothing references them, and derived or vendored trees are not scanned
  so a finding is never doubled
created_by: xgd
created_at: '2026-08-06T03:30:00.500483+00:00'
updated_at: '2026-08-10T08:15:54.328959+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8685be2d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Provenance is demanded of the file, not of the reference to it. A font file
present anywhere in the project's source trees that no record accounts for fails
the check — including a file that no page references at all, which is the class a
capture bundle produces. The violation is of the unprovenanced-file kind and names
the file together with the location holding it, and offers the remediation of
recording it against its owning family or deleting it.

Two trees are excluded from this scan and their contents raise nothing: derived
render output (a byte-for-byte copy of a site's draft) and vendored dependencies.
So one file present in both a draft and its rendered copy raises exactly one
finding, and the result of the check does not depend on when the project was last
rendered.

## Verification
Build a project whose record and site agree, drop a recorded font file on disk,
and assert the check passes. Add an unrecorded font file in a location no site
references and assert: failure overall, a violation of kind unprovenanced-file
whose named file and location are the ones just added. Then place a copy of that
same file under the derived render tree and assert the count of unprovenanced-file
violations is still exactly one.