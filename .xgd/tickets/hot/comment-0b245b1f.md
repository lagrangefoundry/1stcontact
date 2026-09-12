---
uid: comment-0b245b1f
id: COMMENT-2880
type: comment
title: Comment on epic EPIC-4
created_by: xgd
created_at: '2026-09-12T22:26:31.983715+00:00'
updated_at: '2026-09-12T22:26:31.983715+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: epic-0728e1c5
  kind: chat_transcript
---

<!-- xgd-turn id="45c83588-f284-46bb-a6a6-5d63b39da78e-user" -->

<!-- xgd-chat role="user" ts="2026-09-12T22:26:22.571079+00:00" -->
#### You
Settings should be the rightmost tab. It will be a collection of areas starting with names - site, business, 1stc subdomain and then DNS settings. The former are relatively simple database strings - the latter are complex DNS settings

It needs to be a 2 panel page, the settings will be on the left, and on the right will be a chat window with a dedicated settings role

As we build out the settings we need to build out an API to allow them to change, making appropriate checks, propagating effects and so on. This API must be exposed to the settings chat role.

We need to create documentation so the settings chat understands all the settings, when they are right and wrong and how to apply them. Our user base is low-tech and so this AI agent will help them make changes.

Lets discuss the concept and then I would like you to create REQs for the initial scope which is

1. Settings tab - with settings pane and chat pane - initially just names that can be configured business, site and 1stc.site subdomain name
2. API - to change the names exposed to the AI with documentation

<!-- xgd-chat-end -->