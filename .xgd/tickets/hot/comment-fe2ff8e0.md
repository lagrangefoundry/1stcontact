---
uid: comment-fe2ff8e0
id: COMMENT-598
type: comment
title: Comment on request REQ-115
created_by: xgd
created_at: '2026-07-31T22:44:01.633854+00:00'
updated_at: '2026-08-02T23:46:01.350162+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-a6740b4a
  kind: chat_transcript
---

<!-- xgd-turn id="ededa29c-f4aa-453e-9b04-916104210271-user" -->

<!-- xgd-chat role="user" ts="2026-07-31T22:43:59.297497+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="ededa29c-f4aa-453e-9b04-916104210271-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-31T23:05:09.205748+00:00" -->
#### Claude
I'll start by getting the current ticket state and understanding the codebase.

Let me spike the two risky bits (wrangler assets binding under `unstable_dev`, and symlink resolution) before committing to an architecture.

`unstable_dev` hangs with an `[assets]` binding — that rules it out. Let me spike the alternative (wrangler `Text` module rules) before settling the design.

Both wrangler bundler routes hang `unstable_dev`. Settling on a design with no unverifiable wrangler features. Cleaning up the spike and checking submodule cost:

Cleaned up. I hit a hard blocker on Deliverable 0 that changes the picture, so let me record the findings on the ticket before reporting.

I stopped before writing code — Deliverable 0 turns out to be blocked by something the ticket didn't anticipate. **No code was committed; the ticket stays at `draft`.** Findings are recorded as COMMENT-600 on REQ-115.

## The blocker

Both consumption routes assume the `webui-*` packages are reachable from a clean clone. They aren't. Every pushed ref of `github.com/gendevlabs/xgd-framework` — `main` plus all 30+ `reconcile-*` / `resync-*` / `regression-*` branches — carries exactly three components:

```
components/webui/chat   components/webui/markdown   components/webui/shell
```

`split`, `fields`, `scroll`, `list-detail` exist **only** on your local `xgd-framework` `xgd-working`, which is 1313 commits ahead of `origin/main` and unpushed.

So: a submodule can only be pinned to a commit that lacks `webui-split` (killing scope bullet 2, AC 4, AC 5); publishing needs the packages on `main` first, so it's the same gap one step further away; copying is rejected by AC 1. `webui-shell` alone is available, so the shell/tab/storage-seam half is buildable today and the split is not.

I added a submodule, verified it against the remote, and removed it again — the tree is clean apart from the pre-existing REQ-114/REQ-116 changes that were already there.

**What unblocks it:** get `xgd-framework`'s `xgd-working` onto a pushed ref (reconcile it, or push the branch). After that the submodule pin is a one-line change and the rest of the ticket proceeds unchanged. I didn't push anything in your other repo — that's your call.

## Second finding (not blocking, but it settles the serving design)

I spiked the serving mechanism against this repo's own harness rather than assuming:

| Mechanism | Result |
|---|---|
| baseline `unstable_dev`, no bindings | passes, 6.9s |
| `[assets]` binding (Workers Static Assets) | never becomes ready — 3 × 60s timeouts |
| `rules = [{ type = "Text", … }]` over browser `.js`/`.css` | never becomes ready — same hang |

`tests/control-app.test.ts` uses `unstable_dev`, so either mechanism costs us the ability to test control-app at all. On top of that, a Worker has no filesystem — the rendered draft in `storage/dist/…`, the `storage/sites/` listing behind the site selector, and `publish` are all Node-side and can't move into the Worker under any binding.

So the shape I'd propose (for your confirmation once the blocker clears): a Node dev origin over the existing `startServe` / `distDir` / `cmdPublish` serving `/api/*`, `/preview/*`, `/webui/*` and the chrome, with the `control-app` Worker as the single same-origin front that proxies those prefixes. Builder source still lives in `apps/control-app/`, so the shell mounts in control-app. That's precisely the "T1 static serving" DOC-28 §12 T5 replaces with request-time renders — T5 deletes the proxy.

One knock-on worth flagging: serving the builder at `/` supersedes the `Hello from app.1stcontact.io` placeholder, so `test_UAT_FC_REQ-1_control_app_returns_placeholder` gets rewritten rather than kept alongside.

**Question for you:** push/reconcile `xgd-framework`'s working branch so I can pin a submodule to a ref that has `webui-split` — or would you rather I build the shell-only slice now (tab, storage seam, display panel, mode contract, toolbar, serving) and add the split in a follow-up session?

<!-- xgd-turn id="cc6be7e2-4487-491e-9856-f1be0a5c5e8d-user" -->

<!-- xgd-chat role="user" ts="2026-08-02T23:46:01.221165+00:00" -->
#### You
xgd-framework is now lagrange-framework, I have installed it into the venv, is that what you need?

<!-- xgd-chat-end -->