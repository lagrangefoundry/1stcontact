---
uid: comment-0f3ed7d8
id: COMMENT-7868
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-05T21:14:52.684195+00:00'
updated_at: '2026-11-05T21:14:52.684195+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-58d00715
  kind: note
---

I wrote 9 UATs for story story-1500b111 in two new files, and all 9 pass. No runtime code and no existing test files were changed.

The plan's new criteria are AC-2324 to AC-2328, and AC-1715 was extended. The other 23 criteria on the story already had UATs from earlier reconciliations, so this run doesn't touch them.

- **AC-1715, feed half.** The existing AC-1715 test only covers the rows, and I couldn't modify it, so I added a second, separately named test. Through the header selector it checks that a business switch:
  - closes the previous business's feed before the new list is requested;
  - opens one feed under the new scope, from the cursor that read returned;
  - ignores late events from the old feed, even when the re-read fails.

  It also checks that destroying the Library closes its feed.
- **AC-2324.** An outside write enters at the head of the list, leaves it, or redraws one row in place. The selection, the collapsed rail and the detail's scroll survive, and the list is not re-read. A filtered-out material leaves the visible rows alone. A reset re-reads once and re-arms the feed. A second test uses the panel's own default transport with no `EventSource`: it still lists and redraws after its own description write.
- **AC-2325.** Covers the `{material, seq}` cursor and the `text/event-stream` content type. The first frame is `ready`, carrying the opening cursor, and every frame's `id:` is its seq. `Last-Event-ID` beats `?since`, a reconnect loses nothing, and with neither cursor the feed starts from the head. A non-integer cursor gets a 400. A second test checks the SSE comment heartbeat by faking only the interval clock, because the real interval is 20 seconds.
- **AC-2326.** This criterion is split across the two files because it needs both environments:
  - **Origin half:** an event's row is identical to the list's row. A D1 proxy shows no reads of the ticket rows while events are built, and it did record the change-log reads, so the zero is real. Kind, cause, the body-moved flag and the uid-only `exit` are also checked.
  - **Pane half:** a placement change redraws the row with no request. A body event triggers exactly one read for the open material, none for any other, and none while the description editor is open, which also keeps the typed text.
- **AC-2327.** A feed under one business receives nothing from a second business that creates, updates and archives material. Adding `business`, `tenant` or `tenant_id` to the query doesn't widen it, and a non-material ticket (a brief) is not delivered.
- **AC-2328.** The ticket component's four change-log statements appear verbatim in the baseline. The applied database's definitions match them, `ticket_change_floor` is keyed on `tenant_id` alone, and a feed on that database delivers a material write.

I couldn't run lint. ESLint isn't installed locally and the sandbox blocked fetching it from npm. `tsc --noEmit` reported no errors in either file.

The older `test_UAT_FC_REQ-201_*` files are still on disk. The downstream orphan check is responsible for renaming or deleting them.

```
UATs generated for story story-1500b111 (plan item 1 of 7)

Story: story-1500b111
Test file(s) created:
  - tests/reconciliation-library-live-feed.test.ts
  - tests/reconciliation-library-change-feed.workers.test.ts

Tests written: 9
Tests passed: 9
Tests failed: 0

test_files_created:
  - "tests/reconciliation-library-live-feed.test.ts"
  - "tests/reconciliation-library-change-feed.workers.test.ts"
```