---
uid: report-aed6a5eb
id: REPORT-11251
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T03:05:17.407226+00:00'
updated_at: '2026-11-08T03:05:17.407226+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-4164b433
  plan_item_index: '7'
---

Plan item 7 (BUG-64) is applied: I updated STORY-104 and AC-2094 and added one new criterion, AC-2368. No runtime code, UATs or other stories were touched.

I checked the code against BUG-64 and its chat comment before editing. The fix in `tools/generate/src/cli/ai/host-core.ts` (`storedTranscript`) now takes `live` straight from `manager.transcript()`. That matches the intent ticket, so there was no conflict between code and intent to flag.

- **STORY-104:** the "Rejoining a turn in progress" item now says a conversation counts as live only while one of its turns is open. A conversation whose turns have all closed, and an empty one, opens with Send showing instead of Stop, and a typed message is sent rather than queued.
  - **Technical Context:** two new notes. One records why the old check was true for every conversation with any history. The other records that a message queued during a turn is dropped, because the builder has no queue handler.
  - **Reconciliation Decisions:** a new entry dated 2026-11-07 for BUNDLE-39 item 7. It splits the change into a server half (AC-2094) and a pane half (AC-2368), as BUG-46 did. It notes that a real live turn still blocks the composer, which AC-2092 and AC-1063 already cover. It records the dropped-message behaviour as a note, not a criterion, because the intent doesn't ask for it to be pinned or fixed.
- **AC-2094 (retitled):** the server now reports a conversation as live only while a turn is open. Closed-turn and empty conversations are reported not live, with their history intact. Watched across one turn, a conversation must read not live, then live, then not live, so a fix that always answers true or always answers false fails. The three existing protections (no rejoin when not live, a failed rejoin leaves the pane usable, a transport without rejoin still mounts) are kept.
- **AC-2368 (new, active, under STORY-104):** a pane opened on a conversation with only closed turns shows an idle composer, and a typed message reaches the transport and gets a reply. A genuinely live turn still blocks the composer and queues what is typed.

My first attempt to retitle AC-2094 wrote the title into its fields by mistake. I set that field to null, but the key may still be there with a null value; it does no harm.

```
Upgrade mutations applied for plan item 7 of 7

Target Stories: STORY-104
Primary Story UID: story-7f437d57
Stories Modified: 1
ACs Modified: 1
ACs Added: 1
ACs Removed: 0

tickets_modified:
  stories:
    - "story-7f437d57"
  acceptance_criteria:
    modified: ["acceptance_criterion-38cac6f2"]
    added: ["acceptance_criterion-9e2805c3"]
    removed: []

Progress: 7 of 7 plan items complete
```