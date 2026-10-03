---
uid: comment-7b97c125
id: COMMENT-4830
type: comment
title: Comment on epic EPIC-23
created_by: xgd
created_at: '2026-10-03T17:57:02.385659+00:00'
updated_at: '2026-10-03T17:57:02.385659+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: epic-ee37a03f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "502dbcd7-2ce5-476a-9933-2f5aa4c989b5",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="85898c02-6d70-4335-9063-e23c3e43d528-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T17:54:47.287002+00:00" -->
#### You
This Epic is for two related features:
impersonation and delegate user access.

Impersonation is a super-user feature (basically me today). It will allow my user to "impersonate" any user on the platform so I see the platform as if I was them. We used to have this feature on Ning a social media site. Ideally this feature goes further than logging me in as the user - my super user status is retained, my access the to platform console is retained so I can easily switch back to me, or to anyone else.

The impersonation interface should be on the platform console page.

When impersonating it would be good if there was some visiual reminder (like a banner on every page) that I am in impersonation mode.

Multi-email is straightforward. It means that as an account owner I can add additional emails (and remove) which can be used to log in to the account. At least one validated (user has logged in from it at least once) email needs to be retained. This is configured in the profile portal

Delegate user means that as a business owner I can invite other people to manage the business. This would work from the contacts page. It is a special kind of invite. The invited user has to sign on to the platform (thereby creating and account). In V1 they get full access to the business. The only restriction is they do not have control of the delegation feature. In future versions delegate access may be controlled on a per tab basis. A delegate will see and can switch to the businesses they have delegated access to in the business selector along side any that they own.

<!-- xgd-chat-end -->