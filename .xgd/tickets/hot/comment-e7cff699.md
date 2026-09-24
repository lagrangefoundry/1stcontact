---
uid: comment-e7cff699
id: COMMENT-3744
type: comment
title: Comment on request REQ-316
created_by: xgd
created_at: '2026-09-24T22:56:16.785014+00:00'
updated_at: '2026-09-24T23:16:53.574780+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-a339a778
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3562235d-ae6b-425b-bf31-08dbeda07db6",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="097dbc80-f69e-4535-a7c4-eed9009a0de0-user" -->

<!-- xgd-chat role="user" ts="2026-09-24T22:55:29.279508+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="097dbc80-f69e-4535-a7c4-eed9009a0de0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-24T23:16:53.197748+00:00" -->
#### Claude
The ticket is thorough enough to implement without blocking questions. Let me start the free-coding protocol.

Now I understand the tree. Note the worktree itself has the exact skew the ticket describes — a live case. Let me write the check.

Now wire it into the CLI dispatch.

Now part 1: the exact pins, and the seed.ts header correction.

The operator's version bump is uncommitted in the main checkout. I'll carry it onto the branch with exact pins rather than carets.

Now the UATs.

Now run the suite.

Found a real bug: pnpm puts a package's dependencies as **siblings**, not under `<pkg>/node_modules`. Rewriting the walk.

The walk is correct now. Let me refine the report so declared bringers are distinguishable from transitive ones.

Now update the export list and the tests that assert on `instances`.

Now the real-CLI evidence — the skewed worktree should refuse a store-opening command.

Now typecheck and the adjacent regression scope.

The gate is correctly refusing, but the worktree's `node_modules` is a stale install. Let me repair the links so I can verify against a healthy tree.

Now merge back under the lock.

The xgd-working tree has the superseded uncommitted bump on the same files. Backing it up before the merge.

Now update the ticket body to record what landed, preserving the existing content.

Done — REQ-316 is at `free_coded`, commit `bc07664b9d`, version `0.2.349`, merged into `xgd-working` and the branch cleaned up.

## ⚠️ One thing you need to run

```
pnpm install
```

Pinning changes the lockfile's `specifier:` lines, so `node_modules` now lags the committed lockfile. That's REQ-44's `lockfile-drift` finding, and until an install runs, `1c capture` / `shot` / `diff` / `gate` / `aligned-crops` / `values-diff` / `adopt-gaps` refuse with exit 6. `req44-install-preflight`'s own health UAT is red for the same reason.

I also reverted your uncommitted 2026-09-24 bump in the working tree before merging — it's superseded by the commit (same versions, pinned instead of caret). Backup at `/tmp/xgd/req316-backup/superseded-bump.patch` if you want to check it.

## What landed

**Exact pins** in all four manifests *and* in the lockfile's specifiers. The manifest is what a human edits; the lockfile is what `--frozen-lockfile` enforces, so pinning only the manifest is a pin no install is ever asked to honour.

**`tools/generate/src/cli/workerd.ts`** — the third preflight, same shape as REQ-44's and REQ-144's: pure `checkWorkerd`, `assertOneWorkerd` throwing `ENVIRONMENT`/exit 6, injectable scan. It walks the resolution graph from every workspace importer (discovered from `pnpm-workspace.yaml`), so an orphaned `workerd@…` in `.pnpm` with no dependant is correctly not a finding.

Gated at dispatch, before the `switch`, on `builder` / `reset` / `fonts seed` / `fonts mirror` — `fonts` keyed with its subcommand so `fonts check` and `fonts doc` aren't blocked by a skew they can't cause.

**Three decisions I made:**
- The walk's unit is a `node_modules` directory, not a package directory. pnpm parks a dependency *beside* its dependant. My first version looked under `<pkg>/node_modules`, found nothing, and reported a clean tree — the worst way to be wrong, since silence *is* success here. Both layouts are walked now, each with a UAT.
- Zero copies is not a finding. That's an uninstalled tree and REQ-44 reports it better.
- Transitive bringers (`@cloudflare/unenv-preset`, wrangler's own bundled miniflare) are reported but annotated as undeclared, rather than filtered out — dropping them would hide that both generations are genuinely live.

**Evidence:** the free-REQ-316 worktree happened to carry the exact 2026-09-24 skew, so the refusal in the ticket body is real captured output, not a constructed example. `1c reset` and `1c fonts seed` exited 6 there; `1c fonts check` and `1c fonts doc` exited 0 in the same tree. I then repaired that worktree's install by hand and re-ran everything green: 16 REQ-316 UATs plus 12 adjacent suites, `tsc --noEmit` clean.

`fonts/seed.ts`'s header claim that declaring miniflare "only makes an existing fact importable" is corrected — it's true of the code and false of the resolution.

<!-- xgd-chat-end -->