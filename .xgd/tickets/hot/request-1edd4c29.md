---
uid: request-1edd4c29
id: REQ-341
type: request
title: The builder role's grant covers what briefs actually ask for
created_by: EPIC-20
created_at: '2026-09-27T22:31:22.341849+00:00'
updated_at: '2026-09-27T22:33:36.187684+00:00'
completed_at: null
last_field_updated: epic_children
status: draft
fields:
  epic_parent: epic-0923bb64
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-e06115e7
---

## Why

**DOC-60** §"F4" and §"4. The primary stops writing L1".

The `builder` role holds `ReadSite, AuthorPages, ManageComponents, MeasureDrawings,
DrawImages`. The consultant additionally holds **`ManagePages`, `WriteConfig`,
`ManagePalette`**. Briefs already ask for authority the builder does not have: one brief
instructed a worker to *"add four palette colours and use the named colours everywhere,
never raw hex"*, to a role that cannot create a palette colour. REQ-300 blocked that run
before the grant could, so there is no observed refusal on record — but the brief was
already outside the grant, and the delegation surface is explicit that this yields *"a
worker that is refused, not a worker that obeys"*.

DOC-60 chooses to widen the builder rather than keep a residue of structural writes on
the consultant, because *read-only primary* is a line that can be held and explained
while *read-only except pages, palette and config* is not.

## Behaviour

1. **A worker may create, update, copy and remove a page** — the authority the
   consultant holds as `ManagePages`.

2. **A worker may add, rename and set a palette colour** — the authority the consultant
   holds as `ManagePalette`.

3. **A worker may write site configuration** — the authority the consultant holds as
   `WriteConfig`.

4. **Nothing else about the role changes.** A worker still cannot delegate: the
   delegation surface stays scoped to no roles for this role, so the one-level floor
   remains enforced in the grant rather than by a check.

5. **The consultant's grant is untouched by this ticket.** For the duration of this
   change both roles can write, which is deliberate — see below.

## Why this ships before the consultant's grant is narrowed

A grant gap only shows up cheaply while there is still a fallback. Widening the worker
first means a brief that asks for page or palette work is exercised against the wider
grant while the consultant can still perform the work itself if the worker is refused.
Narrowing first would make every grant gap a stuck engagement.

## Not in scope

Removing the consultant's write groups — that is DOC-60's gated final ticket. The prose
that tells the consultant to delegate this work is its own ticket.