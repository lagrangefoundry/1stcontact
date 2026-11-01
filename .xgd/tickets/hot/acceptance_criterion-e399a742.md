---
uid: acceptance_criterion-e399a742
id: AC-2109
type: acceptance_criterion
title: The per-turn reminder is a handful of lines that points to the rules of interaction
  rather than restating them, with its per-turn signals as the marked exception
created_by: xgd
created_at: '2026-11-01T09:27:31.027536+00:00'
updated_at: '2026-11-01T09:51:03.897617+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion

The per-turn reminder carries only what decays over a long conversation:

- which site the session is on, and that every tool acts on that site and no other;
- the habits that drift first — describe changes in the client's words rather than framework concepts; prefer making the change over describing it;
- the one habit of the consultation method that most decays — at a real decision, offer options that differ in kind rather than refining one — together with a **pointer** to where the rest of the method lives (DOC-33), not a restatement of it.

It is a handful of lines: with no per-turn signal present it is under 600 characters.

The two **per-turn signals** ride it as the stated exception, because a per-turn channel is the only place a per-turn signal can go: that the client changed the site since the last turn (with how many changes and where to read them), and what entered the client's knowledge base since the session was last told. Each is **absent** on a turn when there is nothing to report, and the knowledge-base delta comes last.

## Verification

Render the reminder for a site with no changes and no corpus delta: it names the site, contains "DOC-33", contains no playbook stage reference, and is under 600 characters, with no change or delta line. Render it with changes since the last turn: a line reporting the number of changes appears. Render it with a corpus delta: the delta text appears, after every other line.