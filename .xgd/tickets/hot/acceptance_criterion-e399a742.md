---
uid: acceptance_criterion-e399a742
id: AC-2109
type: acceptance_criterion
title: The per-turn reminder is assembled from configured entries, each dropped when
  its per-turn signal is absent
created_by: xgd
created_at: '2026-11-01T09:27:31.027536+00:00'
updated_at: '2026-11-08T05:10:29.957636+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

The per-turn reminder is an ordered list of six configured entries. Each one carries something that decays over a long conversation:

1. **site**: which site the session is on, and that every tool acts on that site and no other;
2. **no framework vocabulary**: describe changes in the client's words rather than in framework concepts;
3. **act rather than narrate**: prefer making the change over describing it;
4. **method**: the habit of the consultation method that decays most (at a real decision, offer options that differ in kind rather than refining one), plus a **pointer** saying the rest of the method is in the knowledge base. It points without restating the method and without naming a document (see the no-document-id criterion);
5. **change signal**: the client changed the site since the last turn, with how many changes and the cursor to read them from;
6. **corpus delta**: what entered the client's knowledge base since the session was last told.

The entries reach the model in that order, separated by a blank line, each as its own paragraph. The site line comes first. The corpus delta comes last.

The two **per-turn signals** (5 and 6) are the stated exception to "a handful of lines". Each is **absent** on a turn with nothing to report: the entry and its separator are both dropped, leaving no empty clause, no placeholder residue and no stray separator. With neither signal present the reminder is under 600 characters.

## Verification

Render the reminder for a site with no changes and no corpus delta. It names the site and points to the knowledge base for the method. It matches no `DOC-<n>` id and no playbook stage reference. It is under 600 characters, has no change or delta line, has no unfilled `{placeholder}`, and does not end with a separator. Render it with changes since the last turn: a paragraph appears reporting the number of changes and the cursor to read them from. Render it with a corpus delta: the delta text appears as the last paragraph. Render it with both: both appear, with the delta last.
