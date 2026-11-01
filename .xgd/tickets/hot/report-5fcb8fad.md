---
uid: report-5fcb8fad
id: REPORT-7220
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-01T02:38:30.356091+00:00'
updated_at: '2026-11-01T02:38:30.356091+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-fd009b93
  plan_item_index: '5'
---

Upgrade mutations applied for plan item 5 of 7

Target Stories: STORY-103
Primary Story UID: story-a58a0974
Stories Modified: 1
ACs Modified: 1
ACs Added: 4
ACs Removed: 0

tickets_modified:
  stories:
    - "story-a58a0974"
  acceptance_criteria:
    modified: ["acceptance_criterion-15d1c12f"]
    added: ["acceptance_criterion-2cc17228", "acceptance_criterion-88e1a60a", "acceptance_criterion-8e948fc7", "acceptance_criterion-c68052eb"]
    removed: []

Progress: 5 of 7 plan items complete

**What changed:**
- **STORY-103 (story):**
  - The "Opening a conversation" bullet now says the open returns any turn still in progress, the cursor it read up to, and a `live` flag. It also says the open needs no model key, and that only "no conversation yet" comes back empty.
  - A new "Rejoining a turn in progress" bullet covers reattach: it needs a cursor, it only reads, and it repeats and skips nothing.
  - The Continuity bullet now says a turn keeps running after its client disconnects.
  - Technical Context gains three notes:
    - The open reads the live record of the turn, not the archive, which trails it by one turn on purpose.
    - In the Worker, the prompt route uses `waitUntil` so the request stays alive until the turn is archived.
    - Residual risk: if the Worker is evicted mid-turn, that turn is still lost.
  - A new 2026-10-31 BUNDLE-34 section under Reconciliation Decisions records these changes.
- **AC-1052 (changed):** the open's answer is now identifier, turns including any partial turn, cursor, `live`, and whether a turn can run. It also covers the keyless case.
- **AC-2088:** opening mid-turn returns the partial turn with `live: true`. A host that has never served the conversation fills it from the archive.
- **AC-2089:** after a disconnect, the turn still finishes and is archived as `aborted`. The check must confirm the host asked the Worker to wait, not just that the transcript ended up archived, because that alone also passed against the unfixed code.
- **AC-2090:** reattach uses the same frame format and returns the rest of the reply exactly once. The final `done` frame says how the turn ended. A missing or negative cursor gets a 400.
- **AC-2091:** any read failure other than "no conversation yet" is reported as a failure, not shown as an empty conversation.

**Flagged in the story, not written into any AC:** in the Worker, opening a conversation with no model key returns `ready: true`. BUG-46 expects `ready: false`; the Node host does return it. BUG-46 says this was already the case before its fix and needs its own ticket. I've flagged it as a code issue against AC-1060's Worker evidence.

**Left out on purpose:** what the browser pane does on reload (seeding the half-written reply, the non-blocking rejoin) belongs to the pane story.

**Environment:** the sandbox blocked an outbound SSH connection to `github.com:22` while each AC was being created. All four ACs exist locally and are linked to STORY-103, but if xgd was trying to sync with the remote, that sync didn't happen.
