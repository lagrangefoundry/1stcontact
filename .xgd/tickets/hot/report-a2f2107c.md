---
uid: report-a2f2107c
id: REPORT-5557
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T14:38:37.722879+00:00'
updated_at: '2026-09-29T14:38:37.722879+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

Incoming commit: `77d6b6b1dd` — *feat(contacts): add a Lead, invite a selection,
report each send [FREE-CODED]*. Two files, three hunks, first attempt
(`prior_stage_failure` empty, retry count 1).

- **apps/control-app/src/people.ts** — UU, code file (2c: incoming
  authoritative). Two hunks, both inside the function incoming renames from
  `invitePerson` to `addContact`. INCOMING WINS on both, because the two sides
  are mutually exclusive semantics rather than disjoint edits: HEAD's hunks are
  the pre-[[REQ-199]] shape in which one function both created a contact and
  invited them, and incoming's whole commit is the split of that act in two
  (`addContact` leaves the pipeline at Lead; `markInvited` further down the same
  file, plus the new `invites.ts`, own the invite and the mail).
  - Hunk 1 (`if (existing)` branch): HEAD wrote a batch —
    `invited_at = COALESCE(...)`, `pipeline_stage = PIPELINE_INVITED`, and a
    `CONTACT_INVITED` event. Incoming writes nothing at all for a person already
    here, keeping only the courtesy-name exception below it. Taking HEAD here
    would have contradicted the surrounding non-conflicting context that the
    merge had already accepted from incoming — the docstring 20 lines up
    ("adding a contact cannot email them"; "ONE EVENT, AND IT IS THE PROVENANCE
    ROW … the old two-events-in-one-batch shape was the invite doing both acts
    at once") and the `CONTACT_CREATED` / `via: 'add'` event in the insert batch.
  - Hunk 2 (the `INSERT INTO users`): HEAD bound `invited_at` and
    `PIPELINE_INVITED`; incoming drops the column and binds `PIPELINE_LEAD`.
    Incoming's, per the same split — the new row is a Lead and nobody has been
    asked anything.
  - HEAD's own base-relative contribution to these two regions was a comment
    rewording and a `.bind(...)` reflow onto one line; no HEAD *behaviour* is
    lost, and the invite behaviour HEAD's hunks described still exists in the
    tree, in `markInvited`.

- **tests/test_UAT_FC_REQ-186_invite.workers.test.ts** — UU, UAT test file
  (2f + 2c). One hunk, on the first two lines of the `seedLead` fixture.
  INTEGRATED, keeping both sides, because the two edits are disjoint in intent
  and only textually adjacent:
  - Incoming's change to this function is a RENAME (`addContact` → `seedLead`).
    It is not cosmetic and had to be kept: incoming also adds
    `import { addContact, markInvited, peopleOf } from '.../people'` at line 16,
    so the old fixture name now collides with the real imported function.
  - HEAD's change to this function is a BODY change ([[REQ-193]]): stop passing
    `displayName` through to `seedContact`, which writes the legacy
    `users.display_name` column, and write the name through `writeName` instead
    — the one module that writes names.
  - Resolution: incoming's signature line with HEAD's body. Both survive; the
    result also keeps HEAD's `writeName` import in use, which incoming's version
    alone would have left unreferenced.
  - No test function was deleted. The only symbol that changed is the fixture
    helper, and it changed name only, by incoming's own hand; all five
    `seedLead(...)` call sites in the merged file are incoming's.

## Incoming changes preserved

Verified by comparing the index to `CHERRY_PICK_HEAD` restricted to the two
conflicting paths:

    git diff --cached 77d6b6b1dda7742c12ae29d7a797bfae9b220cb8 \
      -- apps/control-app/src/people.ts \
         tests/test_UAT_FC_REQ-186_invite.workers.test.ts

Every hunk that comes back is a HEAD-side change to a region the incoming commit
never touched, which is exactly what should remain:

- `people.ts` — the `Person` interface field reordering (`accountId` moved below
  `formerNames`), the `USER_COLUMNS` docstring rewording, the matching key order
  in `toPerson`, and the `setPersonRecord` "touch `updated_at` when only the name
  moves" block. None of these are in `77d6b6b1dd`'s diff of this file.
- the test file — the `seedLead` body described above, deliberately kept.

Nothing from the incoming side is missing from either file, so the BUG-1301
precedence exception was not needed and no incoming hunk was dropped under it.
Both `PIPELINE_LEAD` and `PIPELINE_INVITED`, and both `CONTACT_CREATED` and
`CONTACT_INVITED`, remain imported and used in the resolved `people.ts`
(`PIPELINE_INVITED` / `CONTACT_INVITED` by `markInvited`), so the resolution
leaves no unreferenced import.

`git status --porcelain` shows no conflict class (UU/AA/DU/UD) on any path; both
files are staged as `M`. The cherry-pick sequencer state is untouched — no
`--continue`, `--skip`, `--quit`, `--abort`, `reset` or `checkout <branch>` was
run.

Not verified by execution: the workers suites (`*.workers.test.ts`, this file
among them) cannot run in the `stage_resolver` role — workerd/miniflare fail with
`listen EPERM` under the sandbox. The verification above is the index-vs-incoming
comparison, not a test run.
