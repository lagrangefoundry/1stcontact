---
uid: request-1edd4c29
id: REQ-341
type: request
title: The builder role's grant covers what briefs actually ask for
created_by: EPIC-20
created_at: '2026-09-27T22:31:22.341849+00:00'
updated_at: '2026-09-28T04:49:42.983611+00:00'
completed_at: null
last_field_updated: body
status: free_coding
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

2. **A worker may add, rename, set and remove a palette colour** — the authority the
   consultant holds as `ManagePalette`. The group is granted whole; a brief that names
   colours rather than hex needs the additions, and a brief that reshapes a palette
   needs the removals.

3. **A worker may write site configuration** — the authority the consultant holds as
   `WriteConfig`.

4. **Nothing else about the role changes.** A worker still cannot delegate: the
   delegation surface stays scoped to no roles for this role, so the one-level floor
   remains enforced in the grant rather than by a check — `report` stays the whole of
   that surface a worker ever has. And widening the role to cover *construction* grants
   nothing beyond it: **publishing** reaches the public internet and **registering an
   image or a font from a machine** (`ManageAssets`) reaches the operator's disk, and
   neither is granted here. The engagement's own surfaces — ledger, catalogue, corpus,
   session context — stay off the worker for the same reason they always were.

5. **The consultant's grant is untouched by this ticket.** For the duration of this
   change both roles can write, which is deliberate — see below. Concretely: the
   worker's tools remain a **subset** of the caller's, plus its own `report`.

6. **The worker's own role text stops naming site settings as out of reach.** Its "what
   you cannot do" section listed *changing settings* among the examples of work outside
   its tools. With `WriteConfig` granted that sentence tells the worker to refuse work
   it is now able to do, which is the same failure this ticket exists to remove, only
   sourced from the prose instead of from the grant. The examples become work the
   worker genuinely cannot reach: publishing the site, and handing a piece of the work
   on to someone else.

## Why this ships before the consultant's grant is narrowed

A grant gap only shows up cheaply while there is still a fallback. Widening the worker
first means a brief that asks for page or palette work is exercised against the wider
grant while the consultant can still perform the work itself if the worker is refused.
Narrowing first would make every grant gap a stuck engagement.

## Not in scope

Removing the consultant's write groups — that is DOC-60's gated final ticket. The prose
that tells the consultant to delegate this work is its own ticket.

## What landed

- `tools/generate/src/cli/ai/instances.json` — the `builder` entry's `l1.groups` gains
  `ManagePages`, `WriteConfig` and `ManagePalette`, and is now the same list as the
  consultant's. This one file is the whole of the authority change: the grant is read by
  `l1SurfaceSet`, narrowed to the surfaces the deployment composed, and turned into the
  worker's tool set by the framework's delegation surface, so no host code names a group.
- `tools/generate/src/cli/ai/roles.ts` — `BUILDER_ROLE`'s docblock argued the withheld
  groups at length. Rewritten to record what replaced that argument, and to state what
  the role still does not hold and why.
- `tools/generate/src/cli/ai/priming.json` — behaviour 6's prose change.

## Test plan

- `test_UAT_FC_REQ-341_a_brief_asking_for_a_page_a_palette_colour_or_a_setting_meets_a_tool`
  (`tests/test_UAT_FC_REQ-295_delegation.workers.test.ts`) — the end-to-end case, and the
  only place a group named in a document and a tool offered to a model can be seen not to
  have come apart. Drives the real `POST /api/ai/prompt` route inside workerd with the
  ticket's own brief, then reads the tools the delegated worker was actually offered:
  the four page tools, the four palette tools and `set_config` present; `Delegate`,
  `publish` and `add_asset` absent; `report` present; and every tool the worker holds
  also offered to the caller. It lives in the existing delegation suite because that
  harness is the real route, the real manager and the real surface out of the shared
  store, and a second copy of it would be a second answer to one question.
- `test_UAT_FC_REQ-341_a_worker_may_manage_pages_the_palette_and_the_sites_configuration`
  (`tests/test_UAT_FC_REQ-295_delegation_config.test.ts`) — the document-level case, which
  supersedes REQ-295's condition-5 assertion that the three groups are withheld. Pins the
  grant list, the two groups that stay out, and the consultant's grant being untouched.
- Regression scope: the delegation config and workers suites, the L1 surface / priming /
  role suites (REQ-126, REQ-174, REQ-239, REQ-175, REQ-129, REQ-130, REQ-157, REQ-216,
  REQ-218, palette management, assistant control surface, page composition) and the
  spend/budget suites that open workers (BUG-145, REQ-296, REQ-293, REQ-297).
