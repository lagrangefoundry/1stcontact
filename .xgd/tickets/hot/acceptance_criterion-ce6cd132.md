---
uid: acceptance_criterion-ce6cd132
id: AC-1436
type: acceptance_criterion
title: A page slug that is exactly a locale segment is refused at the authoring surface,
  with the reason and two alternatives
created_by: xgd
created_at: '2026-08-31T12:28:44.987294+00:00'
updated_at: '2026-08-31T12:33:34.491946+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-17ba490e
  kind: behavior
  regression_only: false
---

## Criterion

A page whose slug is exactly a locale segment is refused, wherever the page is
being authored from.

The refusal carries a machine-readable path naming the offending page's slug
(`/pages/<index>/slug`) and a message that names the slug, states that it is
reserved because it has the shape of a locale path segment, and offers two
concrete working alternatives (`<slug>-services` and `about-<slug>`).

Reserved forms include the bare language (`de`, `fr`, `en`, `ga`), the
language-with-region form (`pt-BR`), the numeric region form (`es-419`), and the
same forms in any case (`pt-br`, `DE`) — a capitalised segment collides with a
language prefix exactly as a lower-case one does.

Attempting to add such a page through the authoring surface fails with an error
identifying the schema violation and its path, and leaves no half-written page
behind; the same page is then created successfully under a qualified slug.

## Verification

Validate a site definition whose page carries each reserved slug in turn, and
observe the failure, its path, and a message containing the slug, the locale
reason and both suggested alternatives.

Then, through the page-creation authoring command, attempt to add a page at a
reserved slug: observe the refusal with its schema-violation code and slug path,
re-read the site and observe no page was added, and then add the same page at a
qualified slug and observe it is created.