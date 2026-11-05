---
uid: bug-04d1bc51
id: BUG-280
type: bug
title: 'First-draft test copy: REQ-455''s cut rewinds decisions but copies tasks as
  they are, so a later ''catering page paused'' task leaked in and reversed an agreed
  decision'
created_by: EPIC-19
created_at: '2026-10-25T18:31:12.193710+00:00'
updated_at: '2026-10-25T19:26:55.650330+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-4553b54e
  story_points: 2
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-0b4b7c6d
  commits:
  - working_sha: 3a3d3398e1fc60c40d3255b3161da4a16f65f641
    reconcile_sha: null
    main_sha: null
  - working_sha: 6ecdf2ca0d0fa7da2363201e5cce947df18b2a79
    reconcile_sha: null
    main_sha: null
  version: 0.2.637
---

## Symptom

First-Draft-Test Dina's Diner 2 was provisioned with REQ-455's cut: history up to
the source's first-draft hand-over (`first_draft_copy.cut.at`
2026-10-24T01:24:18). The plan's agreed decision was "Catering gets its own short
page (/catering) linked from the top menu" (task t1, quoting Dina: "Yeah its worth
a short page - its almost a different business").

No catering page was built. The consultant briefed "There is no other page yet. Do
NOT create a catering page or link to one", told Dina "The catering page is still on
hold, as you asked", and put catering in a short home-page section. That reversed
the recorded decision, which had explicitly rejected a catering section on the
home page.

## Cause

`rewindPlan` rewinds only `decisions` and the decision log to the cut. **Plan tasks
are copied as they are**, so tasks written after the cut crossed over:
- t4 (01:24:58);
- t5, "Building is blocked on our side this session";
- t6 (03:02:43), "Catering page paused until home is right", quoting the source's
  later Dina: "if wae can't do a catering page right now lets skip it".

The consultant read t6 through `read_plan` and obeyed it. Any plan field written
after the cut can leak the same way: tasks, asks, standing notes, board state,
promises, the critique record and similar.


## Fix

- **Everything the plan holds is rewound to the cut,** not only decisions:
  tasks, asks and their answers, promises, board and comps state, critique and
  stage settles. An item created after the cut is dropped. An item changed after
  the cut is restored to its state at the cut. (The standing note lives on the
  site chat and REQ-455 already cuts it.)
- **A field that can't be rewound exactly is dropped**, not copied. The copy
  reports what it dropped, in the provisioning result.

## What changed (as implemented)

- `first-draft-cut.ts`: `decisionsAt` is replaced by `planAt`. It reads the
  plan's whole after-image from the change log (`store.changes`) at the last
  version written before the cut. Every field comes back as that version
  recorded it. `rewindPlan` uses that snapshot as the plan's fields and returns
  `{ plan, dropped }`.
- **No version before the cut, log not pruned** (the plan was created after the
  cut): the plan at the cut is the seed plan.
- **Log pruned past the cut** (no readable version): REQ-455's decision fallback
  is kept: a decision settled after the cut goes back to its seed, and earlier
  ones stay. `kind`, `site_key` and `stages` stay too (the destination write
  re-settles stages). Every other field goes back to its seed value and is
  reported as dropped.
- **The report:** `dropped` is a list of strings. `key/id` means an item created
  after the cut (for example `tasks/t6` or `asks/q_late`). `key` means a field the
  plan did not hold at the cut, or could not rewind (for example `critique`). An
  item that was restored is not listed. The list goes in the `first_draft_copy`
  marker on the destination plan, and in every completed slice's response from
  `POST /api/admin/businesses/first-draft`, next to `cut`. It is omitted when
  empty.
- **Body:** the change log carries no bodies, so the plan body is handled as
  REQ-455 handled it: the decision log is cut to entries 1..K, and Brief/Notes
  text is copied as it is. Known limit: free text added to Brief/Notes after
  the cut is not rewound.

## Test plan

- `tests/test_UAT_FC_BUG-280_the_copy_rewinds_the_whole_plan.workers.test.ts`:
  - `..._the_copy_rewinds_the_whole_plan`: the source plan has task t1 (the
    catering page) and ask q_menu before the cut. After the cut, t1 is paused, a
    "catering page paused" task t6 and ask q_late are added, q_menu is answered
    and a critique falls due. The copy has t1 as it was at the cut and no t6.
    q_menu is open and unanswered, q_late is absent, and there is no critique.
    The result's `dropped` includes `tasks/t6`, `asks/q_late` and `critique`, not
    `tasks/t1`, and the marker holds the same list.
  - `..._a_pruned_change_log_drops_what_it_cannot_rewind`: same source with the
    change log pruned. Tasks, asks and critique are back at their seed and are
    reported as dropped.
- REQ-450 and REQ-455 UATs re-run and green. The REQ-450 copy fixture
  stamped `first_pass_at` at a fixed 2026-10-01 date, earlier than the plan
  write it sits in. That put the cut before every plan version, which this fix
  rightly treats as unrewindable. The stamp is now a real instant after the
  write, as the fixture's own comment intends.