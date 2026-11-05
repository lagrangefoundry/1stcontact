---
uid: todo-33d6bcc8
id: TODO-17
type: todo
title: 'Legal documents: review REQ-488 end to end'
created_by: xgd
created_at: '2026-10-30T17:56:23.037467+00:00'
updated_at: '2026-10-30T18:13:30.247351+00:00'
completed_at: null
last_field_updated: body
status: open
fields:
  kind: review
  priority: high
  auto_merge_back: true
---

Review the outcome of [[REQ-488]] (legal documents, part of [[EPIC-29]]) once it has landed. This is part of the beta launch checks on [[GOAL-50]].

1. **Presentation.** `/terms`, `/privacy` and `/beta-terms` render correctly: headings, lists (including nested), tables and links. Each page states its version. Past versions open at `/<doc>/<YYYY-MM-DD>`.
2. **Read them.** Read the content itself, not just the rendering.
3. **Accept them.** As a person with outstanding documents, go through the acceptance page. Check: one link and one checkbox per document; the viewer's checkbox and the list's checkbox stay in step; Continue stays disabled until every box is ticked; Terms and Beta Terms say "I agree to" and the Privacy Notice says "I have read".
4. **See the record.** In Contacts, open that person. The **Agreements** section should show each accepted document with its **version and date**.

**Version in Contacts (2026-10-30).** The Agreements section (`builder/people.js`, `describeAcceptance`) used to show only the document name, Agreed or Withdrawn, and the date. REQ-488 now also requires each row to show the version date, linked to that version's page (UAT 6a). If step 4 shows no version, REQ-488 missed it.
