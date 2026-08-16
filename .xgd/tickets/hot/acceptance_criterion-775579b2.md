---
uid: acceptance_criterion-775579b2
id: AC-1099
type: acceptance_criterion
title: A component is added to a page with its configuration alone and arrives rendering,
  laid out from that configuration or from a presentation the caller supplies
created_by: xgd
created_at: '2026-08-10T09:34:09.207732+00:00'
updated_at: '2026-08-16T01:03:03.283565+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion
Adding a component to a page requires a name of the caller's choosing, the kind, the mount seam, and its configuration — not necessarily its presentation. Where the kind carries a default look, that look is produced from the instance's own configuration, so a form declared with a given set of fields arrives with a control per field. Supplying a presentation is optional rather than forbidden: a presentation the caller supplies — one element subtree per seam — is what the instance mounts instead, checked against the kind's contract like any other and reaching the rendered page, and it is the route by which a kind carrying no default look is instantiated at all. Either way the result is ordinary page content: it can be read and replaced through the element-tree write path like anything else, and it appears in the rendered page as a working component. A kind that carries no default look and is added without a presentation is refused with a validation error naming the seams it needs.

## Verification
Add a contact-form component to a page supplying only configuration, then render the site: the rendered document contains a form posting to the configured endpoint with a control for each configured field. Read the component's subtree through the element-tree read operation and confirm it is ordinary page content. Then add a carousel — a kind the catalog reports as carrying no default presentation — supplying its configuration together with an explicit presentation of one subtree per slide: the call is accepted, the stored instance's seams hold the supplied subtrees rather than anything derived, and the slide's content is in the rendered document. Separately, attempt to add that same kind with no presentation: the call fails with a validation error listing the required seams.
