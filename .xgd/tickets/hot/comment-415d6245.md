---
uid: comment-415d6245
id: COMMENT-2274
type: comment
title: Comment on request REQ-183
created_by: xgd
created_at: '2026-09-05T01:57:18.337161+00:00'
updated_at: '2026-09-05T17:10:28.575270+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-86e78464
  kind: chat_transcript
---

<!-- xgd-turn id="4e8c94e2-2ec7-426e-9c03-3cf1b51eba8c-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T01:56:36.040466+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4e8c94e2-2ec7-426e-9c03-3cf1b51eba8c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T02:28:10.472105+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

Now I have a clear picture. Let me record the decisions on the ticket first — §3's origin decision is an explicit acceptance criterion that must land *before* the surface.

Decisions recorded and the ticket is at `free_coding`. Now cutting the branch.

Now let me write the behaviour module.

Now the client behaviour and the invariant stylesheet.

Now the route. Let me wire `/account` into the router.

Now the router wiring.

Now regenerate the module assets and wire the avatar link.

Now the avatar link out.

Now let me write the node-side UATs.

<!-- xgd-turn id="5cce38d0-b7e0-4e6e-ae06-bb1e713375b3-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T16:57:21.940615+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="5cce38d0-b7e0-4e6e-ae06-bb1e713375b3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T17:10:28.295603+00:00" -->
#### Claude
I'll pick up where the prior session left off. Let me check the current state.

The ticket body is fully populated with decisions. The branch has uncommitted work. Let me review what's there.

Implementation looks complete. Now let me run the tests in the foreground.

Now let me run the new UATs.

Both UAT files pass. Now the regression scope — the modified existing tests plus adjacent areas.

Pre-existing on `xgd-working`, unrelated to this ticket — and it's the only error, so my changes typecheck clean. Now the full suite.

36 failures. I need a baseline to know which are mine. Let me capture the failing file list, then compare against `xgd-working`.

Identical failing set on both — all 16 are pre-existing environment failures (missing KB indexes / unbuilt assets), unrelated to this ticket.

The count delta is run-to-run collection flakiness (the earlier branch run showed 15 failed files / 36 tests vs 16 / 37 now, on identical code). Both new files pass standalone. Let me verify every UAT is motivated by ticket language before committing.

All 23 UATs map to ticket language. Let me verify the two consequences I'm less sure have coverage.

The scaffolder-derivation consequence is named in the ticket as UAT-pinned but has no UAT. Let me add it.

Now let me add the missing UAT for the scaffolder-derivation consequence.

24 UATs, all passing. Now the version bump and commit.

Clean scope — no stray files. Committing.

Now the merge back — lock, merge by hand, then mark `free_coded`.

REQ-170 claimed 0.2.71. Let me check which versions are taken before re-bumping.

0.2.72 is free. Bumping in the worktree and committing.

Now the story points and the branch teardown.

Free-coding complete. REQ-183 is at `free_coded`.

## What landed

**`account-portal`** — a vetted behaviour module in the framework catalog. It paints nothing: presentation is L1 in its `body`/`erasure` slots, the account line and holdings list are invariant elements its client fills from the endpoint, and the delete affordance is an L1 `control` node. Same contract as `contact-form`.

**The shipped default portal site** (`apps/control-app/src/portal.ts`) carrying the DOC-37 §6.1 erasure explanation. Its `site.json` is derived from the scaffolder's rather than written out, so it can't drift from what every new site starts with.

**`GET /account`** on the control-app, served through `PreviewRenderer` — the same renderer `/preview/…` uses — against the business the caller is an account *of*, never `TENANT_ID` and never the business they're operating. Falls back to the shipped default via an in-memory `SiteStore` when none is authored. GET/HEAD only (405 otherwise), 404 when there's neither an admission nor a scope.

**The avatar dialog** gains a link out and nothing else.

No deletion is built, and a UAT asserts the account still exists after the portal has been used — so the button can't be read as evidence the machinery is there.

## Verification

- **24 UATs** across `test_UAT_FC_REQ-183_portal_pages.test.ts` (16, node) and `test_UAT_FC_REQ-183_portal.workers.test.ts` (8, workerd) — all pass, before and after merge.
- **Full suite**: 16 failing files on the branch, **identical set** to the `xgd-working` baseline — all pre-existing KB-index/asset-build environment failures (`reconciliation-system-knowledge-base`, `test_UAT_FC_REQ-158/159/160/161/163`, `bug32-webui-scope-rebrand`, etc.). Nothing new broke.
- **Typecheck**: one error, `session-knowledge.ts(16,3)` — reproduced on `xgd-working` unchanged, so pre-existing and unrelated. It was the only error, so the new code typechecks clean.

## One thing I added this session

The ticket's consequences section claims each is "pinned by a UAT", but the scaffolder-derivation consequence had none. I added `test_UAT_FC_REQ-183_the_portals_site_json_is_the_scaffolders`, which asserts every key of `starterSiteJson(PORTAL_SLUG)` matches except the two the portal deliberately overrides (`id`, `config`), and that the key sets are identical so the derivation can't silently widen.

## Commits

- `03f961b34c` — the portal (feat)
- `569f5b9553` — version bump to 0.2.72

The second commit exists because the gate rejected 0.2.71 — REQ-170 had already claimed it. The portal work is unchanged; the bump just carries the version the ticket records.

Branch merged into `xgd-working`, lock released, worktree and branch torn down. The ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->