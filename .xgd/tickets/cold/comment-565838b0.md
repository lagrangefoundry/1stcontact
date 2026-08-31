---
uid: comment-565838b0
id: COMMENT-600
type: comment
title: Comment on request REQ-115
created_by: xgd
created_at: '2026-07-31T23:04:34.731384+00:00'
updated_at: '2026-07-31T23:04:34.731384+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-a6740b4a
  kind: note
---

## Investigation — Deliverable 0 is blocked upstream, and the serving mechanism needs a different shape

### Finding 1 (blocking): the components we need are not on any pushed ref of `xgd-framework`

Both routes the ticket offers assume the `webui-*` packages are reachable from a
clean clone. They are not.

`github.com/gendevlabs/xgd-framework` — every pushed ref (`main`, and all 30+
`reconcile-*` / `resync-*` / `regression-*` branches) carries exactly three
components:

```
components/webui/chat
components/webui/markdown
components/webui/shell
```

`split`, `fields`, `scroll`, `list-detail` exist **only** on the operator's local
`xgd-working`, which is 1313 commits ahead of `origin/main` and unpushed.

Consequences:

- **Git submodule** — pinnable only to a commit that lacks `webui-split`. The split
  pane (scope bullet 2, AC 4, AC 5) cannot be built. A submodule was added,
  verified against the remote, and removed again; nothing is committed.
- **Publish as versioned packages** — needs publishing stood up upstream *and* the
  packages on `main` first. Same gap, one step further away.
- **Copying** — rejected by AC 1.

`webui-shell` alone is available, so the shell/tab/storage-seam half of the ticket
is buildable today; the split is not.

**Unblock**: reconcile / push `xgd-framework`'s `xgd-working` so the components
reach a pushed ref. Then the submodule pin is a one-line change and the rest of
the ticket proceeds unchanged. The consumption route itself (submodule now,
published packages later) is unaffected by this — it is purely a question of what
the submodule can point at.

### Finding 2 (not blocking, but it settles the serving design): the Worker cannot serve the builder's static bytes

Measured, not assumed — three spikes against this repo's own test harness:

| Mechanism | Result |
|---|---|
| baseline `unstable_dev`, no bindings | passes, 6.9s |
| `[assets]` binding (Workers Static Assets) | `unstable_dev` never becomes ready — 3 x 60s timeouts |
| `rules = [{ type = "Text", ... }]` over browser `.js`/`.css` | `unstable_dev` never becomes ready — same hang |

`unstable_dev` is what `tests/control-app.test.ts` uses, so either mechanism costs
us the ability to test control-app at all.

Compounding it: a Worker has no filesystem, so `storage/dist/.../draft/` (the
already-rendered draft View mode must show), the `storage/sites/` listing behind
the site selector, and `publish` (which writes a revision) are all **Node-side
operations**. They cannot run in the Worker under any binding.

**Proposed shape** (for confirmation when the blocker clears): a Node dev origin —
a `1c` command over the existing `startServe` / `distDir` / `cmdPublish` — serves
`/api/sites`, `/api/publish`, `/preview/<slug>/<channel>/*`, `/webui/*` and the
chrome; the `control-app` Worker is the single same-origin front the browser
visits and proxies those prefixes. The builder's source still lives in
`apps/control-app/`, so the shell mounts in control-app (AC 2). This is precisely
the "T1 static serving" that DOC-28 section 12 T5 replaces with request-time
renders inside control-app — T5 deletes the proxy.

Also noted: serving the builder at `/` supersedes the `Hello from
app.1stcontact.io` placeholder, so `test_UAT_FC_REQ-1_control_app_returns_placeholder`
is rewritten rather than kept alongside.

No code committed. Nothing else in the ticket is affected.
