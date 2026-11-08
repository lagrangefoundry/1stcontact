---
uid: comment-8506411e
id: COMMENT-8014
type: comment
title: Comment on request REQ-668
created_by: EPIC-23
created_at: '2026-11-08T17:05:12.758826+00:00'
updated_at: '2026-11-08T17:05:12.758826+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-cc75a2f2
  kind: note
---

Decision 2 is overruled by the operator (2026-11-08). Sign-ins to unrelated businesses must be completely independent: one browser can be signed in to 1st Contact and to a client business at the same time. This ticket's code keeps one session per browser, so signing in to one business replaces the other's session. That is a known defect, fixed by BUG-382 (bug-40fd134b). Reconcile must not pin replace-on-sign-in as an acceptance criterion.