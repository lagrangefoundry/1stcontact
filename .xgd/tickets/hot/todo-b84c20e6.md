---
uid: todo-b84c20e6
id: TODO-13
type: todo
title: 'Beta check: sign-in from a cold start'
created_by: xgd
created_at: '2026-10-30T00:46:50.746260+00:00'
updated_at: '2026-10-30T00:46:50.746260+00:00'
completed_at: null
last_field_updated: created_at
status: open
fields:
  kind: user_task
  priority: high
  auto_merge_back: true
---

Check 1 of the beta launch checks on [[GOAL-50]].

Use a brand-new email that has never touched 1c, ideally on a phone. Go invite email → magic link → terms → starter business → builder.

Check:
- the magic-link mail lands in the inbox, not spam (Gmail and Outlook if possible);
- a link opened on a different device from the one that asked for it;
- an expired or already-used link gives a clear message.

Done when one run passes. Tick the box on GOAL-50 with the date. Anything that fails becomes a ticket under the epic that owns that surface.