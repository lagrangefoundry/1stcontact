---
uid: comment-ef79939e
id: COMMENT-707
type: comment
title: Comment on request REQ-44
created_by: xgd
created_at: '2026-08-06T18:59:56.858068+00:00'
updated_at: '2026-08-06T19:00:24.755045+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3b78151f
  kind: chat_transcript
---

<!-- xgd-turn id="52e01d65-dc21-4cb1-b115-dea1ff57409c-user" -->

<!-- xgd-chat role="user" ts="2026-08-06T18:59:53.353550+00:00" -->
#### You
Is this a 1st contact requirement or a xgd requirement?

<!-- xgd-turn id="52e01d65-dc21-4cb1-b115-dea1ff57409c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-06T19:00:24.611361+00:00" -->
#### Claude
It's both — the ticket as written bundles two asks that live in different repos:

**1stcontact (this repo) — the fail-loud preflight.** Bullets 2 and 3 are about the `1c` CLI (`tools/generate/bin/1c.mjs`). Verifying that `playwright`/`sharp` actually resolve before launching Vite/Playwright, and erroring with "run `pnpm install`" instead of crashing mid-render, is 1stcontact tooling code. That belongs here, in REQ-44.

**XGD — the install-after-manifest-change rule.** Bullet 1 ("any XGD step / reconcile that edits `package.json` or `pnpm-lock.yaml` should run `pnpm install`") is a workflow-engine concern. The reconcile that pruned `playwright` was XGD machinery operating on a worktree; nothing in this repo can make XGD re-install. And it generalizes — any XGD project with a package manager has the same drift hazard, so the fix is in the workflow engine's post-commit/worktree-setup path, not here.

The root cause you diagnosed is the XGD half; the 1stcontact half is defence-in-depth that catches the drift regardless of what caused it. Worth keeping both — the preflight is useful even if XGD never installs anything, because a stale tree can also come from a plain `git pull`.

Suggested split: narrow REQ-44 to the `1c` preflight, and file the install-after-manifest-change ask as an XGD ticket. Want me to rewrite the body to that scope? I won't create the XGD-side ticket unless you ask.

<!-- xgd-chat-end -->