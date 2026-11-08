---
uid: todo-a9767ab0
id: TODO-23
type: todo
title: 'Legal documents: features still to ticket (owner version history, document
  audiences, text notices, lawyer review)'
created_by: xgd
created_at: '2026-11-08T18:01:40.703939+00:00'
updated_at: '2026-11-08T18:01:40.703939+00:00'
completed_at: null
last_field_updated: created_at
status: open
fields:
  kind: reminder
  priority: medium
  epic_uid: epic-e3db69b8
  auto_merge_back: true
---

Reminder from EPIC-29 (operator, 2026-11-08: "create a todo ticket for the missing features to remind me to circle back on these"). The design for each is in [[DOC-121]] (Legal documents: design). None of these is ticketed yet.

1. **Version history for owners** (DOC-121 §8): a read-only history for every document in Paperwork → Legal, showing each published version, its date, whether it is in force, how many accepted it, and its text. Restoring an old version publishes a copy of it as the newest version.
2. **Choosing who a custom document applies to** (DOC-121 §7, "later"), for example only beta participants. [[REQ-669]] builds custom documents for everyone who signs in.
3. **Text-message notices** of significant privacy changes, for contacts with only a phone number, once text messages exist (DOC-121 §5).
4. **Lawyer review** of the standard library and DOC-121's rules before paid launch, including:
   - the 14-day owner notice;
   - renewal notices under US auto-renewal law and the UK DMCC Act;
   - online cancellation for California;
   - keeping an email address in retained payment records.

When you pick one up, ask EPIC-29's session to file it, and it will update DOC-121.
