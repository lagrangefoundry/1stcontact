---
uid: acceptance_criterion-2b109b66
id: AC-869
type: acceptance_criterion
title: A newly created site's page carries a complete layout document — width ladder,
  document background and a root subtree with one visible run — and the whole definition
  validates unedited
created_by: xgd
created_at: '2026-08-06T03:42:27.901626+00:00'
updated_at: '2026-08-10T08:16:17.095494+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-86c7c21b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Creating a site writes a home page that carries a layout document, and that
document is complete enough to describe a page on its own: a non-empty list of
viewport widths, a document background colour, and a root container holding at
least one text run whose content is the site's slug.

The document validates against the layout-document contract on its own, and the
site definition assembled from the created site's metadata plus that page
validates as a whole — including the envelope checks (numeric bounds, URL
allowlist, node cap, unique node ids) and the page-level rules binding a page's
layout document to any behavior module it mounts. No editing step occurs between
creation and validation.

## Verification
Create a site into an empty workspace, read the home page artifact back off disk,
and assert: the layout document is present; validating it alone succeeds;
validating the assembled site definition succeeds with no errors. Assert the root
is a container and that a text run within it carries the slug.