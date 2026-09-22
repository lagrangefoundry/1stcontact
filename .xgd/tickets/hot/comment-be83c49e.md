---
uid: comment-be83c49e
id: COMMENT-3657
type: comment
title: Comment on request REQ-298
created_by: xgd
created_at: '2026-09-22T20:01:55.947228+00:00'
updated_at: '2026-09-22T20:12:45.878713+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-294aa45b
  kind: chat_transcript
---

<!-- xgd-cli-session ts="2026-09-22T20:01:52Z" model="claude-opus-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-09-22T20:01:52Z" -->
#### You
I asked for a special tab and got overruled. The overlay is insufficient for this — it will be a complex interface that needs to operate as a tab. I could spend time arguing the advantages and disadvantages of a special UI tab that cuts across businesses, but actually I just want you to do it.

Secondly the interface that I need in the TAB is a two panel interface with a list of all the sites on the left and a detail page on the right which shows the account, a link to any published site and cost details for that business. This is a change, I did not make this clear, this overrules and replaces what was built.

The TAB can be opened by a button on the right as you have it but it needs to behave like a tab not drop in an overlay.

<!-- xgd-chat role="assistant" ts="2026-09-22T20:01:52Z" -->
#### Claude
Clear, and filed as REQ-298 rather than as an amendment, because it supersedes rather than refines.

The tab: `webui-shell` fixes its tab list at mount and has no `addTab`, so the console tab is a conditional entry in the array the app builds, present only for a session owning the platform business. The header action beside the account avatar stays exactly where it is and changes only what it does — `setActiveTab` instead of opening a dialog. The dialog chrome is deleted rather than kept beside it.

The one consequence I answered rather than left open: the business switcher is prepended into the shell bar and applies to every tab, and on the console tab it applies to nothing. REQ-179's objection — a control that is present and silently ignored reads as a bug — does not stop being true because the decision went the other way. So the switcher is disabled while the console tab is active and restored on leaving it, through the shell's own `onTabChange` seam. Related: no activity surface is posted for the console tab, because `/api/activity/surface` is business-scoped and recording `console` against whichever business happened to be open would be a meaningless row.

The interface uses `@lagrangefoundry/webui-list-detail` in `no-tab` mode — the component the Library and People tabs already use, so divider, collapse and split persistence are not reimplemented.

One thing the instruction did not specify: the list's order. I decided cost descending, dearest business first, sites of one business adjacent, businesses with no measured spend last, ordered by name — because *which tenant is costing us money* is the question the console was built for, and alphabetical would answer nothing and need a sort control on day one. Say if you want it the other way.

The list needs a route that does not exist: `GET /api/admin/sites`, one row per site across every business, same gate and same 404. Deliberately not merged into `/api/admin/spend/businesses` — a site with no spend must still appear, and adding non-meter rows to a meter route gives one route two answers.

What REQ-297 keeps: the `ownsPlatformBusiness` gate at both layers, both spend routes, the shared period parser, and the principal/delegated split. This is a change of surface, not of meter. REQ-297's body now carries a note naming exactly which of its statements are withdrawn, so a reconcile of both cannot pin 'the console is not a tab' into the matrix.

<!-- xgd-chat role="user" ts="2026-09-22T20:12:43Z" -->
#### You
OK so the structural argument against a tab I understand and I am OK with a button being the entry point, but I am not OK with this being an overlay — it has to take over the full screen like a tab.

<!-- xgd-chat role="assistant" ts="2026-09-22T20:12:43Z" -->
#### Claude
Revised. REQ-298 is now a full-surface view rather than a tab, and REQ-297's condition 9 is restored — the console is not a tab and the strip stays uniformly business-scoped. Only the container and the content are superseded.

What 'full screen like a tab' is specified as, in behaviour rather than style, so it is testable: it is not layered over anything (no scrim, no z-index above the builder — the content region shows the console INSTEAD of the tab panels); it fills the region a tab's panel would have had, so the split divider is worth dragging; and Escape does NOT close it, because that is the reflex a transient overlay owes its reader and this is a surface somebody works in for twenty minutes with divider and scroll state to lose.

Getting out: the tab strip stays live and clicking any tab dismisses the console and goes there — that is where 'behaves like a tab' is actually testable. While the console is up no tab reads as selected, because the shell has no concept of 'none' active and leaving the old tab highlighted while its panel is off screen would be the surface lying about what you are looking at. The console's own Close returns to the tab that was active. Two exits, not redundant: one is navigation, one is dismissal.

One honest cost I named rather than hid: this is the SECOND place the app touches shell-internal markup — the first is the business switcher prepended into `.shell-bar`, which `app.js` documents as the one such place. There is no declared slot for a view that replaces the panels either, so they become a list of exactly two, each with a comment naming the upstream gap it stands in.

Everything else is unchanged: the sites list ordered by cost descending, the three detail sections, `GET /api/admin/sites`, and all of REQ-297's routes, gate and arithmetic reused.

<!-- xgd-chat-end -->