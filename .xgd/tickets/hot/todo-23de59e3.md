---
uid: todo-23de59e3
id: TODO-9
type: todo
title: 'Plan panel: confirming facts without chat noise'
created_by: CHAT-58
created_at: '2026-10-02T17:48:19.762935+00:00'
updated_at: '2026-10-02T17:48:19.762935+00:00'
completed_at: null
last_field_updated: created_at
status: open
fields:
  kind: user_task
  priority: medium
  epic_parent: epic-95bc3b15
  auto_merge_back: true
---

Deferred from CHAT-58 and the "Next hypothesis" design doc §7.6 and §9.

Facts reach the site from several sources: typed answers, documents the client uploads (letterhead, brochure, price list), captured pages (Google Business, Yelp), and Alice's own placeholders. Documents go out of date, and extraction can be wrong. Wrong hours, prices or towns on a live site cost the client real business.

We need a way to confirm facts that doesn't fill the chat with "is this still right?" exchanges. The chat should stay high-information and low-noise. Likely direction: confirmation lives in the plan panel (each fact shown with its source and a confirm control), plus a final "please check every detail" pass before publish.

Come back to this once the core panel interaction has been tested.
