---
uid: comment-d9b9fc8d
id: COMMENT-3029
type: comment
title: Comment on epic EPIC-16
created_by: xgd
created_at: '2026-09-17T03:34:34.354350+00:00'
updated_at: '2026-09-17T03:34:34.354350+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: epic-96d8aca6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e1cc512e-d1e5-4d2c-b490-2e7757b65916",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="cb28a7d9-40f7-4c4f-9bd6-3d5deca0b47e-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T03:34:28.479712+00:00" -->
#### You
This I think is probably getting a little too far over our skis for where we are right now, but I wanted to capture it while it was in my head because I can't see how we could manage without it in a real production environment. The idea here is that we would have a staging environment with some test sites set up with good rich test data and every deploy would go through the staging environment first and run our smoke tests and BFM tests and obviously any deployment migrations just like production. This ticket is to create that staging environment and an automated flow so that once the deployment is triggered it will go through automatically test and assuming all is good go straight to production. And then run another round of tests in production. The automation is critical here because there is literally one operator me. So everything has to run itself. I don't think I want to spend too much time on this epic right now. I think the requirements are relatively straightforward the tests are being handled by other epics so your job is really the deployment pipeline automation and the appropriate creation of test data. There are also some questions about whether we could keep such an environment from being public, and to an extent maybe whether we care? It is desirable that the automation run primarily in the cloud once it has been triggered. I don't want my laptop to be responsible for deployment

<!-- xgd-chat-end -->