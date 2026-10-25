---
uid: comment-5c5852f7
id: COMMENT-2280
type: comment
title: Comment on request REQ-188
created_by: xgd
created_at: '2026-09-05T20:20:02.227587+00:00'
updated_at: '2026-09-05T23:35:00.545141+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b0abafbf
  kind: chat_transcript
---

<!-- xgd-turn id="e2a22217-b53e-4175-acf7-f62cbb4f5982-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T20:19:15.692496+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e2a22217-b53e-4175-acf7-f62cbb4f5982-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T20:30:45.493492+00:00" -->
#### Claude
Now update the panel to use it.

Now the origin-side design record in `people.ts`.

Now update the REQ-186 UI assertion that pinned the old label, and write the REQ-188 UATs.

Now the regression scope around identity/people/terms.

Implemented and landed. REQ-188 is at `free_coded`, commit `59b983957f` merged into `xgd-working`.

**What changed**

- **New `apps/control-app/src/builder/people-state.js`** — the single definition of the three states (`Contact` / `Invited` / `Member`), derived from `invitedAt` and `termsAcceptedAt`. Its own dependency-free module so the same function is reachable from the browser panel *and* from a workers test running against real rows; `builder/people.js` re-exports it rather than keeping a copy. `termsAcceptedAt` is tested first, so someone who signed up without ever having been invited by this business still reads as a member.
- **The tab** — rows carry one of three labels; the facet is built from `PERSON_STATES` so a state a row can display can never be one the filter cannot select.
- **The invite dialog** — reports *"… is invited"* / *"… was already known here, and is now invited"*, and the hint now says they become a member when they sign in and accept the terms. Leaving that sentence saying "member" would have kept the old model alive in the one place an operator reads.
- **Design record rewritten** in `people.ts` and `builder/people.js`; **DOC-42 §4, §4.1 and §9 amended** (three states in the relations table, the two markers and the two parties that write them, the `tos_accepted_at`-not-`first_seen_at` reasoning, and a strengthened §9 falsifier).
- **Two REQ-186 UATs adjusted** where they pinned the old label — one asserted `['Member','Member']` after an invite and now asserts `['Invited','Invited']`; two names that said "as a member" no longer do.

**Evidence** — 10 new UATs. The workers suite drives *both* transitions through real routes inside workerd against real D1: `POST /api/people/invite` with an owner's Access token, and `POST /api/terms/accept` with the person's own; nothing stamps `tos_accepted_at` by hand on the path under test. It also pins why the marker is that column and not `first_seen_at`, by driving a request the terms gate refuses and observing `first_seen_at` set, acceptance null, state still `Invited`. The jsdom suite mounts the real webui components and proves the labels, the facet, the invite ceiling and the no-operator-action transition.

Two pre-existing failures on `xgd-working`, unrelated to this diff and left alone: `bug32-webui-scope-rebrand` (two files restating the scope) and a `tsc` error in `session-knowledge.ts` re-exporting `SHIPPED_SOURCE`. Both reproduce identically without my changes.

One judgement call worth flagging: an invited-but-unentitled person still cannot reach `/api/terms/accept` at all, so at level 2 nobody can currently cross Invited → Member. That is DOC-42 §10.1's admitted-but-unentitled gap, which your ticket explicitly scoped out — the tests work around it by giving the accepting person an entitlement.

<!-- xgd-turn id="ed859fad-2240-4668-bf85-a223d2be18fa-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T23:16:43.084583+00:00" -->
#### You
There was an adjustment to naming noted in the ticket - can you make the adjustment as part of this ticket please?

<!-- xgd-turn id="ed859fad-2240-4668-bf85-a223d2be18fa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T23:35:00.507012+00:00" -->
#### Claude
Now the migration.

Now `ensurePlatformOperator` in identity.ts.

Now the facets and the filter.

Now the invite dialog wording and REQ-186's assertions.

Now rewrite the workers UAT.

Now the jsdom UAT.

Now the regression scope: identity, people, terms, invite, BUG-53.

Done. The ticket's naming adjustment was the two-axis correction, and it's landed on `xgd-working` as `50e94547`, recorded against REQ-188 alongside the earlier commit.

**What changed**

The earlier fix put Contact / Invited / Member on one line. Per [[DOC-44]] §3 that's two faults: *Contact* is the entity's name, not a value, and membership (access) is independent of invited (pipeline). So:

- **`db/migrations/0009_pipeline_stage.sql`** — `users.pipeline_stage TEXT NOT NULL DEFAULT 'lead'`, no CHECK (the set grows), plus a one-time backfill to `invited` for rows already carrying `invited_at`. The stage is **stored**, not inferred from stamps — `invited_at` now records *when*, the column records *whether*.
- **`builder/people-axes.js`** replaces `people-state.js`: one definition of `stageOf`/`accessOf`, imported by the panel, by `people.ts` and by `identity.ts` (so the string `'invited'` has exactly one spelling), and by both UAT suites.
- **The invite** assigns the stage and `COALESCE`s the stamp — the asymmetry is deliberate — and touches `tos_accepted_at` not at all. Inviting an existing member is now an ordinary no-op on the other axis rather than a state that can't be spelled.
- **The tab** draws a stage on every row and a member badge on those who signed up, and offers **two facets**. That's the load-bearing UI decision: *who did I ask who never came* and *who signed up that I never asked* are each conjunctions across both axes, and no single merged facet can express either.
- **Classes name the axis, never the value** (`__stage`, `__access`, `__facet`). REQ-189's "no rule branches on what a state is called" guard caught my first attempt (`builder-people__member`), which is the guard working.
- **DOC-42 §4, §4.1 and §9** re-amended to the axes, with the intermediate three-state draft recorded as the thing being corrected.

**Evidence** — 11 UATs across the two REQ-188 files. The workers suite drives both transitions through real routes in workerd against real D1, and adds the two combinations the one-line model couldn't hold: a member this business never invited (still a Lead), and rows whose stamp and stage deliberately disagree in both directions, which is the only test a timestamp-inferring reader would fail. The jsdom suite proves the separate columns, each facet across every value, and the conjunction queries.

**Knock-ons** — REQ-186 (×2), BUG-53, BUG-54 and REQ-189 UATs adjusted where they pinned the old label, the old facet class, or the `state` field. All pass.

**Pre-existing failures, untouched by this diff**: 11 files fail on `xgd-working` — `bug32-webui-scope-rebrand` and ten knowledge-base suites (`KnowledgeConfigError: no index for source 'project'`). They fail identically in isolation; the checkout needs `1c kb build`. Nothing in this change touches knowledge or webui scope.

<!-- xgd-chat-end -->