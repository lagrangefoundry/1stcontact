---
uid: comment-e2f4d75b
id: COMMENT-3025
type: comment
title: Comment on epic EPIC-14
created_by: xgd
created_at: '2026-09-17T00:34:57.069190+00:00'
updated_at: '2026-09-17T00:34:57.069190+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: epic-2d9e2d56
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1c7551b1-8534-47b3-b8e3-851b5b02d102",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="fa23d02d-aa31-40f4-b59f-256ea741d632-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T00:34:27.717078+00:00" -->
#### You
We need a platform capability to notify users of things. Notification will be primarily email but we will add push (when we do the app) and maybe SMS so the delivery must be separated from the notification control.

As with all our features there are three levels 0 -me and my team, 1 - 1c customers, 2 - their customers.

All levels will have coarse grained controls in their User portal, basically and opt-in/out to notifications - at this point I am not sure what notifications will be for level 2 lets assume that we will have them and work through the details later. There are probably two levels of notification: informational ("a new user just requested the whitepapers") and transactional ("your payment failed"). I don't think we offer an opt-out for the second.

Notifications would have finer grained controls on the Settings tab. As we add platform notifications capabilities we will add the controls and configure them to be informational or transactional.

This epic then is for the framework that supports notifications and their controls

<!-- xgd-chat-end -->