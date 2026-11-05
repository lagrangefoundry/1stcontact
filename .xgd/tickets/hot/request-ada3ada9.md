---
uid: request-ada3ada9
id: REQ-480
type: request
title: 'Contacts: per-tester session timeline on the contact page'
created_by: EPIC-28
created_at: '2026-10-28T00:09:04.194218+00:00'
updated_at: '2026-10-28T00:49:16.898777+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  epic_parent: epic-7c85d456
  story_points: 5
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-674b367d
  commits:
  - working_sha: b4262a464dd149c4e693ea0659ab9c303c705d15
    reconcile_sha: null
    main_sha: null
  - working_sha: 7246b766c1165a1ca071acb0a6883525109d3a18
    reconcile_sha: null
    main_sha: null
  version: 0.2.688
---

Part of [[EPIC-28]] (beta test experience). Everyone signed in is a beta tester for now.

## What the operator sees

On each tester's **contact page** in the 1st Contact business's **Contacts**, a timeline of their
time with the builder, for each of their sites, shown alongside their feedback entries:

- **Sessions.** A session is a run of tester activity ended by an idle gap of 30 minutes with no
  message from the tester (the same rule the Feedback ticket uses for "minutes into the current
  session"). For each session: start, end and length, so the operator can tell whether a tester
  had just sat down or had been working for hours when something happened.
- **Time in each stage** of the site plan ([[DOC-71]] stage names), from plan stage changes.
- **Reply time** for each tester message: the time from the tester's message until the first
  visible reply text in that same panel. Shown per message, with the slow ones easy to spot.
- **Idle gaps** within the site's history and the **abandon point**: where the tester's last
  session ended, with the stage and the last messages at that moment.
- **How often** they used each surface / assistant panel.

## What is deliberately not here

- **No cost.** Spend stays with EPIC-20's metering and is never part of this timeline.
- **No "waiting vs active".** With a talker, a worker and its delegates running concurrently,
  waiting on the system isn't a state the tester is in. Reply time is the only wait measured.
- **No browser activity signals** (tab visibility, focus, typing). Everything comes from records
  that already exist: the turn ledger (`turn_log`), the junction's turn and progress records,
  surface-shown activity events, and plan stage changes. If something needed is not recorded
  server-side, record it server-side.
- Session export / review with Claude is out of scope for now.

## Constraints

- Works in production (`app.1stcontact.io`).
- Operator-facing only: the tester never sees their timeline.

## Test plan

UATs named `test_UAT_FC_<this ticket>_*`, driving a tester's site through recorded turns:
- two bursts of tester messages separated by more than 30 minutes show as two sessions with the
  right start, end and length;
- stage durations match the plan's stage changes;
- reply time for a message equals the gap to the first visible reply in that panel, independent
  of other panels or builders running meanwhile;
- the abandon point is the end of the last session, with its stage;
- surface usage counts match the panels used;
- the timeline holds no cost figures.

Also covered, as consequences of the above:
- the builder's own start cue (a host cue sent as a user turn) is not a tester message;
- a session still running (last message less than 30 minutes ago) has no abandon point;
- only the platform operator can read a timeline (anyone else gets 404, as on the console's
  routes), and an id that isn't a contact of 1st Contact has none;
- the contact page shows the section to the platform operator only, and reads it when they
  press **Show the timeline**, not on opening the contact.

## As built

**Where it shows.** A **Time with the builder** section on the contact page, just above
**History** (where REQ-479's feedback entries land). It appears only for the platform operator
(the same `canFulfil` flag that gates "Provision a business"). Pressing **Show the timeline**
fetches `GET /api/admin/tester-timeline?id=<contact>`. That route sits behind the console's
`ownsPlatformBusiness` gate and, in production, under the existing `/api/admin/*` Access rule.
For each site: sessions with the time away between them, time in each stage, where they
stopped with the last four turns, message counts per panel, and a collapsible list of every
message's reply time. Replies taking 1 minute or more are marked **Slow reply**. Under the
sites, the tabs used across all sessions.

**Where each figure comes from.** It is computed on read from permanent records and stored
nowhere (`apps/control-app/src/tester-timeline.ts`):
- *Messages and replies:* the archived chat transcripts (the `chat_transcript` comment on each
  conversation's `chat` ticket, in the tester's business store). A tester message is a user
  turn that isn't a host cue (`isHostCue`, BUG-285). Its reply is the first assistant turn
  after it in the same conversation; that turn's stamp is when its first text arrived.
- *Panels:* the conversation's session id: `site-<site>` is the Site consultant, `room-<site>`
  the group chat, `business-<business>` the Settings assistant.
- *Whose:* the conversations of every business the contact is a member of (the platform
  business itself excluded). The chat records don't say who typed a turn. In the beta each
  tester has their own business, so this is exact. In a business two people share, both would
  see the same messages.
- *Sessions:* the tester's messages on the site's panels plus their business's Settings
  assistant, so one sitting that moves between them is one session. They are cut with the same
  30-minute rule as the activity log's `session.recorded` summaries. That rule is now one
  exported function, `splitAtIdle` in `activity.ts`, which `inferSessions` uses too and
  REQ-479 can use for "minutes into the current session". A session starts at its first
  message and ends at the later of its last message and the reply to it. Total time on the
  site is the sum of its sessions.
- *Stages:* the plan's change log (`type=plan` after-images). The in-progress stage
  (`currentStage`) is tracked from each change, with repeats collapsed. Each stage shows its
  wall-clock time (to now for the current one) and how much of that was inside sessions.
- *Tabs:* the stretches in the contact's existing `session.recorded` rows (REQ-235): visits and
  time per tab.

**Known limits.**
- A message typed while a turn is already running is queued. The archive stamps it when its
  own turn starts, not when it was typed, so its reply time is measured from that later
  moment. The typed time exists only in the live junction (`enqueue`). Fixing it would mean
  carrying it onto `turn_start` in the framework.
- Stage history before the change log's retention floor isn't shown.

## Test plan (as built)

- `tests/test_UAT_FC_REQ-480_tester_timeline.workers.test.ts`: the route, through the
  router, as the platform operator. The tester is invited the real way. Their conversations
  are written as the archive holds them, and their stage changes are real plan writes. Covers
  sessions, gaps and total; stage spans; per-panel reply time; the abandon point and the live
  case; panel and tab counts; no cost keys; operator-only and 404.
- `tests/test_UAT_FC_REQ-480_contact_page_timeline.test.ts`: the shipped Contacts panel
  (jsdom). The section shows only for the operator, sits just above History, loads on request,
  and renders sessions, gaps, stages, the stop point, panels, slow replies and tabs.