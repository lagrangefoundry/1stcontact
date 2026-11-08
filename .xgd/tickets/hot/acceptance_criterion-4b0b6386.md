---
uid: acceptance_criterion-4b0b6386
id: AC-2487
type: acceptance_criterion
title: 'original: true is labelled as originally stored; the CLI host answers only
  for site assets and says it holds no Library; no image store refuses with ENVIRONMENT'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:03:36.822354+00:00'
updated_at: '2026-11-08T23:45:24.832455+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
`original: true` on an `image` picture is accepted, and the returned label then ends "as originally stored"; until an edit recipe exists (REQ-219) it is the same picture as without it. Which stored pictures answer depends on the host:
- the builder Worker answers for the site's assets and the business's Library;
- the local `1c` host answers for the site's own assets only. A name matching no site asset there is refused saying this host holds no Library pictures, only the site's own assets (it does not point the model at the Library);
- a deployment wired with no image store at all refuses every `image` picture as `ENVIRONMENT`, saying there is no image store to show pictures from and to carry on with what it can do.

## Verification
Screenshot a stored picture with and without `original: true` and assert the same picture bytes, with "as originally stored" in the label only for the former. Through the `1c` host, screenshot a site asset by filename and assert it resolves; ask for a Library record id and assert the refusal says the host holds no Library. With a picture deps that has no image store, assert `screenshot` of `image` is refused with the `ENVIRONMENT` code and the no-image-store sentence.

> Code issue (BUNDLE-42 reconciliation, 2026-11-08): the CLI's not-found refusal does not yet say it holds no Library — see STORY-157 "Code issue flagged — the CLI host does not say it holds no Library". This AC states the REQ-218 intent.