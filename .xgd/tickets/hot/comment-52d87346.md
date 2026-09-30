---
uid: comment-52d87346
id: COMMENT-4505
type: comment
title: Comment on request REQ-353
created_by: xgd
created_at: '2026-09-30T00:56:00.727735+00:00'
updated_at: '2026-09-30T02:36:38.979936+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-585f7950
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "771912ea-c337-41d2-884e-ecee3ee8ba22",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f9114867-57c4-4892-bba6-5e0ad80cee1d-user" -->

<!-- xgd-chat role="user" ts="2026-09-30T00:54:59.148148+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4151be1d-9f72-461e-87a8-9690de39f103-user" -->

<!-- xgd-chat role="user" ts="2026-09-30T01:58:31.459038+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="4151be1d-9f72-461e-87a8-9690de39f103-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-30T02:36:37.957181+00:00" -->
#### Claude
Free-coding of REQ-353 is complete and landed on `xgd-working`.

## What shipped

A fifth builder tab (**Debug**, rightmost, business-scoped) carrying one working control — whether that business's consultant delegates construction to a cheaper worker.

- `db/migrations/0022_business_network_settings.sql` — one row per business, `delegate_tool_calls` nullable so **NULL means inherit** (untouched businesses behave exactly as before).
- `apps/control-app/src/network-settings.ts` — the row half: read/upsert, and a `DelegationResolver` bound to one business at construction.
- `tools/generate/src/cli/ai/delegation.ts` — `delegationForScope` + `delegationFor(known, document)`: a stored value becomes a delegation document and earns every named refusal the bundled one earns. A read that throws is a refusal, never a silent inherit.
- `host-core.ts` asks the resolver on the path that **composes a manager** — so a flip lands on the business's next session, and the value travels on `deps`, never through the module-global `configureDelegation`.
- `router.ts` — `/api/network/delegation`, GET (in force / stored / deployment) and POST (boolean or 400 naming the key).
- `builder/config.js` (`DEBUG_TAB`, `SETTINGS_TAB`'s rightmost claim amended rather than contradicted), `builder/debug.js`, `api.js`, `app.js`, `builder.css`.
- 23 UATs across three files (`debug_tab`, `the_resolver_seam`, `per_business_delegation.workers`).

## Verification (all foreground)

- **Workers suite, whole:** 170 files / 1398 tests — all pass.
- **Node suite, whole:** 25 failures. I ran the same 15 files on `xgd-working` as a baseline: 13 files fail identically there (`PLATFORM_ADMINS` locally filled in, font/kb/filing-service/port suites). The two extras were environmental to the worktree — one 120 s timeout under whole-suite load, one missing `.xgd/tmp` directory. Nothing REQ-353-adjacent fails.
- **Typecheck:** `pnpm -r build` clean in the branch worktree; in the main checkout pnpm's dep-status check aborts with `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` (pre-existing, unrelated), so I ran `tsc --noEmit` directly for both apps — clean.
- Targeted re-run of all four REQ-353 suites plus the REQ-239/295/343/179/340 and migration-guard suites after the merge — green.

## Ticket

`status=free_coded`, `version: 0.2.418`, `story_points: 8`, 4 commits recorded. Branch merged with `git merge`, worktree torn down, lock released.

Two notes worth flagging:

1. I **appended** three sections to the ticket body (existing content untouched) covering behaviour the UATs assert that the original body left implicit: the `/api/network/delegation` surface and its 400, the pane's read-failure / write-rollback / business-switch-discard behaviour, and the "a read that throws is a refusal" rule. Without that language reconciliation would have had to discover those ACs itself.
2. The version claim took three attempts: `0.2.416` was already claimed by BUG-161, then the explicit-`--version` gate rejected `0.2.417` because ticket auto-commits had advanced `xgd-working`'s tip past my bump commit — the tip was a descendant rather than the merge commit itself, which BUG-1119's fix doesn't recognise. I used the auto-version path (omit `--version`), which allocates under the gate's own lock; it settled on `0.2.418`. That gate shape looks like a real gap in the branch-per-ticket flow, but it's an xgd-tool issue, not this project's, so I didn't file anything.

<!-- xgd-chat-end -->