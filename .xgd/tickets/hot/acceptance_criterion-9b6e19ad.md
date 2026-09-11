---
uid: acceptance_criterion-9b6e19ad
id: AC-1709
type: acceptance_criterion
title: A file handed over for a selected site is in that site's asset library when
  the hand-over returns, as a copy on the public side, under the name reported back
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:02:45.507740+00:00'
updated_at: '2026-09-11T05:02:45.507740+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-aacb7060
  kind: behavior
  regression_only: false
---

## Criterion

When a client hands the platform a file stating it is for their site, and a site of theirs is
selected, that file is in that site's asset library by the time the hand-over returns, and the
hand-over reports the name the asset landed under.

The asset is a **copy on the public side**: reading the site's asset by the reported name
returns bytes identical to the file the client handed over, and the client's own material
record and its private bytes still exist and are unchanged afterwards. Nothing about the asset
depends on reaching the private material store to resolve.

## Verification

Hand a file to the platform's material entry point, stating it is for the site and naming a
site that exists. Observe that:

- the response carries the material's identifier and the name of the site asset it produced;
- asking that site for its assets lists the reported name;
- reading that asset back yields byte-identical content to what was handed over;
- the material itself is still listed as the client's material, with its rights record intact.
