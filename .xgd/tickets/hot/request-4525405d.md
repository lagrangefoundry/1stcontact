---
uid: request-4525405d
id: REQ-444
type: request
title: 'First draft: the preview switches to View when it lands, however the client
  got to Input, and ''Your first draft is ready'' stays in How you can help until
  they look'
created_by: EPIC-19
created_at: '2026-10-24T01:28:20.855754+00:00'
updated_at: '2026-10-24T16:17:15.286654+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 3
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-1d3da8c9
  commits:
  - working_sha: 7eb0cba5948730922d7a68d58e820ed2c5309af3
    reconcile_sha: null
    main_sha: null
  - working_sha: 834f8a39318a3086b7d96de17c561e64bfd2aeff
    reconcile_sha: null
    main_sha: null
  version: 0.2.614
---

## Symptom

Dina's Diner, 2026-10-24: the first draft was built and the plan moved on to
**Refining**, but the client was still on **Input** and never saw the site. The
operator: "there is a draft of the site created but I haven't been given a link
to open the View mode. If I don't know to do that I wouldn't see the site."

The consultant did write links ("[See the first draft](#show=draft&page=home)" at
01:24, and "You can still [look over the first draft]…"), but they were buried at
the end of long replies about other things, and the preview did not move.

## Cause

`storyFirst()` (`apps/control-app/src/builder/app.js`, REQ-408) switches to View
when the draft lands **only if the host itself had put the preview on Input**
(`storyByHost`). This client had gone to Input by following the consultant's own
links (`#show=story`, `#show=ask`, `#show=comps`), so `storyByHost` was false and
nothing switched. Nothing else puts "your first draft is ready" anywhere the
client is sure to see it.

## Fix

**The first draft is a moment the client must not miss.**

1. **When the first draft lands, the preview switches to View**, however the
   client came to be on Input (host or link). One exception: if the client is
   typing in Input at that moment, the switch waits until they leave the text box
   (REQ-431 section 11's focus rule), so nothing is yanked away mid-sentence. It
   happens once per site, when `drafted` first becomes true.
2. **"How you can help" (REQ-431 section 8c) carries a line, "Your first draft is
   ready: have a look"**, linking to View, until the client has opened View after
   the draft (BUG-246's `opened-views` already knows this). It is from the same
   list as the other lines.
3. **The consultant leads with it.** The reply that announces the first draft puts
   the link in its first line ("Your first draft is ready: [have a look]"), not at
   the end after other topics. The `show_client` / first-pass steering and
   priming say so, within the priming budget.

## Test plan

`tests/test_UAT_FC_REQ-444_first_draft_is_seen.*`, using jsdom on the builder:

- The client is on Input by a `#show=story` link and the plan view turns
  `drafted: true`: the mode becomes View.
- The same while a text box in Input has focus: no switch until focus leaves,
  then View.
- Before View is opened after the draft, "How you can help" shows the first-draft
  line linking to View. After View is opened, it is gone.
- The switch happens once: switching back to Input afterwards is not overridden on
  the next plan refresh.
- The consultant is told: after the first pass is built, the agenda lines carry
  `FIRST_DRAFT_LEAD` (the first line of the reply is "Your first draft is ready:
  [have a look](#show=draft)"); before it, they do not. Both priming variants'
  `showing` section say never to bury the first draft. (Replaces the planned
  scripted-host check, which would only have asserted the script's own text.)
- Re-run the REQ-408 opening UATs and REQ-442's opening-mode UATs.


## What landed

- **Builder (`apps/control-app/src/builder/app.js`).** `storyByHost` is gone.
  `storyFirst()` remembers the last `drafted` it saw for the current site; a
  `false → true` transition calls `draftLanded()`, which moves the pane to View
  if it is on Input, whoever put it there. If a text box inside the Input board
  has focus, it waits on `focusout` (re-checking after the tick, so moving
  between Input's own boxes keeps waiting) and is dropped if the client moves
  the pane, or the site changes, first. A site opened already drafted is still
  REQ-442's opening rule; a site this page first reads as drafted never
  "lands", so the switch happens once per site.
- **How you can help (`help.js`, `config.js`).** A new first entry in
  `HELP_KINDS`, `draft`, counts `view.draft_unseen`; its line reads "Your first
  draft is ready: have a look" and opens View. The plan does not know what is on
  screen, so the builder marks the view (`drawOwed()`): `draft_unseen` is
  `drafted && !seenDraft(site)`. It is drawn into both How you can help and
  Input's "Your input" summary (one list), and redrawn on every mode change, so
  the line goes the moment View opens.
- **Seen draft (`opened-views.js`).** BUG-246's per-business record gains
  `sawDraft(site)` / `seenDraft(site)`, kept beside the pane list in the same
  storage: View open while the plan says `drafted`. Persisted, so it does not
  return after a reload.
- **Consultant.** `agendaLines()` (`plan-core.ts`) adds `FIRST_DRAFT_LEAD`
  while any check due on `first_pass_complete` is outstanding — the turn after
  the first pass — telling it to open the announcing reply with the link
  (`showHref('draft')`). The `showing` priming section folds in "Never bury the
  first draft: the reply announcing it opens with it, link and all", in a
  tightened paragraph that is net-shorter than before (BUG-129's priming
  ceiling was already 34 chars over on clean xgd-working; it now passes).