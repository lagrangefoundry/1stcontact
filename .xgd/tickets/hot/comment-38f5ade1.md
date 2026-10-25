---
uid: comment-38f5ade1
id: COMMENT-2275
type: comment
title: Comment on chat CHAT-37
created_by: xgd
created_at: '2026-09-05T02:17:21.033960+00:00'
updated_at: '2026-09-05T02:21:31.962565+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-9e748368
  kind: chat_transcript
---

<!-- xgd-turn id="97713a10-a673-4737-bf04-e51478c63d44-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T02:17:01.364047+00:00" -->
#### You
```
((.venv-working) ) martin@nyx 1stcontact % cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/main

((.venv-working) ) martin@nyx main % git status
On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
    modified:   .xgd/config.yaml

((.venv-working) ) martin@nyx main % git diff .xgd/config.yaml
((.venv-working) ) martin@nyx main %

```

What is going on with config.yaml?

<!-- xgd-turn id="97713a10-a673-4737-bf04-e51478c63d44-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T02:21:31.840279+00:00" -->
#### Claude
## What `git status` is telling you

`git diff` showed nothing because the change is **staged**. `git diff` compares worktree↔index; you needed `git diff --cached`:

```
     free_code_extra: 'Please make sure you have clarity on the user interaction
-    model and the core design. That you understand the API contracts, what you should
-    be built from scratch and when code must be reused. We try to minimise external 
+      model and the core design. That you understand the API contracts, what you should
+      be built from scratch and when code must be reused. We try to minimise external 
```

7 lines changed, all of them the continuation lines of `dashboard.prompts.free_code_extra`, re-indented from 4 spaces to 6.

## It is a semantic no-op

In a multi-line single-quoted YAML scalar, continuation-line indentation is stripped and lines are folded. I parsed both blobs and compared:

```
parsed equal: True
```

The config the system loads is byte-identical either way. Nothing behavioural changed.

## Where it came from

It's a PyYAML `safe_load` → `dump(sort_keys=False)` round-trip — that's what normalises a folded scalar's continuation indent to the parent + 2. The file's key order confirms the file is machine-dumped in general (`matrix_refactor` sitting after `workflow` at root, `headless_permission_mode` after `timeout`, `complete_extra` after `investigate_extra` — appended keys that a `sort_keys=False` dump preserves in load order).

The write happened at **2026-09-03 13:13:45**, about a minute after your two hand-made commits `90b996a52` ("Guidance on free coding questions") and `a7832f14c` ("Caveat on background processes") — the ones that introduced that prompt text. The index records that same mtime, so the staged blob is exactly what was written then and nothing has touched it since.

What I could rule out:

- **Not the dashboard config editor** (`/api/config/update`) — zero calls to it in `dashboard.jsonl`, and it commits with `[dashboard-edit]`, of which there are none for `config.yaml`. It also dumps with `sort_keys` defaulting to `True`, which would have alphabetised the whole file into a several-hundred-line diff.
- **Not the validator's auto-fix** (`validator.py:237`) as things stand — I ran `validate_config_file(auto_fix=True)` against a copy of the HEAD blob: `auto_populated: []`, file not rewritten.
- **No XGD process was running** in that window — dispatcher last logged 10:27, regression 10:32.

So the residual explanation is that the session or tool that helped you land those two prompt edits round-tripped the file through PyYAML and `git add`-ed it, and the commit never happened. I can't prove which from what's on disk.

## What I'd do about it

It's a formatting-only change to a config file, so no ticket is required either way. Two clean options:

- `git commit -m "chore(config): normalise free_code_extra scalar indentation"` — keeps the file matching what the dumper produces, so the next round-trip is silent.
- `git checkout -- .xgd/config.yaml && git reset` — discards it; harmless, but the next tool that dumps the config will re-introduce it.

Worth clearing one way or the other rather than leaving it: a staged-but-uncommitted change sitting on the main worktree is exactly the sort of thing a workflow's `git add -A` sweeps into an unrelated commit, and a dirty main worktree can block `sync_main` / merge-back steps.

Say which and I'll run it.

<!-- xgd-chat-end -->