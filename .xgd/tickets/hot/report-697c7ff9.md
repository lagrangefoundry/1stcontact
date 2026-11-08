---
uid: report-697c7ff9
id: REPORT-11265
type: report
title: Claude reconciliation_story_generation report
created_by: xgd
created_at: '2026-11-08T04:12:35.052866+00:00'
updated_at: '2026-11-08T04:12:35.052866+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_story_generation
  subject_uid: bundle-c0301347
  plan_item_index: '1'
---

Upgrade mutations applied for plan item 1 of 6 (Outgoing Mail, CAP-116). This was a reconciliation upgrade, so only the story and its ACs changed. No runtime code or UATs were touched and no new story was created.

The code matches REQ-205's intent, so there are no code-issues for `fix_uat_coverage`. One prior decision is reversed: REQ-197's "HTML, one part" ruling, and the earlier override that removed the `text` field, are explicitly superseded by REQ-205. AC-2281 now asserts two parts: the authored HTML and a text part derived from it. The story's Reconciliation Decisions record that, plus three new decisions dated 2026-11-07:
- A blank template `from` falls back to `MAIL_FROM`.
- An unknown named HTML entity is left as written.
- The seeded invite's `1st Contact` sender does not break the rule that seed copy names no business.

When I created the three new ACs, the sandbox blocked an outbound connection to `github.com:22`, which looks like an automatic sync to GitHub. The tickets were created and are linked to the story (it now has 15 children), but that sync did not happen in this session.

```
Upgrade mutations applied for plan item 1 of 6

Target Stories: story-7d255580
Primary Story UID: story-7d255580
Stories Modified: 1
ACs Modified: 4
ACs Added: 3
ACs Removed: 0

tickets_modified:
  stories:
    - "story-7d255580"
  acceptance_criteria:
    modified: ["acceptance_criterion-9fb5f244", "acceptance_criterion-a9a7dbf2", "acceptance_criterion-5440127a", "acceptance_criterion-e73c9a31"]
    added: ["acceptance_criterion-6130ba2a", "acceptance_criterion-5020e47b", "acceptance_criterion-f5c9d0d8"]
    removed: []

Progress: 1 of 6 plan items complete
```

- **STORY-168:** `story_kind` set to `upgrade`. The body now covers the derived text part and its refusal, the per-template sending address with `MAIL_FROM` as fallback, and the named sender. Scope, the list of test suites and the Reconciliation Decisions are updated.
- **Modified ACs:**
  - **AC-2279:** `MAIL_FROM` is now the fallback, `1st Contact <no-reply@1stcontact.io>`, and reaches the provider unchanged.
  - **AC-2281:** HTML plus a derived text part, with only one body authored.
  - **AC-2282:** the template type gains an optional `from` field.
  - **AC-2286:** the invite seed names `1st Contact <invite@1stcontact.io>`; signin and lapsed fall back.
- **New ACs:**
  - **AC-2369:** the derivation rules, including that every link address in the HTML appears unchanged in the text.
  - **AC-2370:** a body that yields no text is refused by both adapters, before any network call or recording.
  - **AC-2371:** the address is resolved once per send, so the message and the record agree. The invite form shows it read-only, and the route ignores a `from` in the POST.