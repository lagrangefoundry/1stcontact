---
uid: comment-4a999b4a
id: COMMENT-3013
type: comment
title: Comment on request REQ-253
created_by: xgd
created_at: '2026-09-16T01:02:24.446957+00:00'
updated_at: '2026-09-16T01:24:45.399004+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-aea13ae3
  kind: chat_transcript
---

<!-- xgd-turn id="7e7d641e-38b2-48a2-9146-1dd39b38e29b-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T01:01:51.377263+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="7e7d641e-38b2-48a2-9146-1dd39b38e29b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T01:24:44.964079+00:00" -->
#### Claude
Now I have the full picture. Let me set up the ticket and branch.

Now let me write the check module.

Now the UATs.

Done. REQ-253 is `free_coded` at `0.2.212`.

## What landed

**`tools/generate/src/cli/d1-migrations.ts`** (new) — reads `d1_migrations` out of the SQLite file miniflare persists and compares it to `db/migrations/`.

**`tools/generate/src/cli/index.ts`** — `1c builder` runs the check before the banner and refuses if the database is behind. Since `pnpm dev` and `pnpm dev:control` both reach `wrangler dev` through this command, one gate covers every way a dev server starts.

The real refusal, as it prints:

```
The local database is behind this checkout — 2 migrations have not been applied:

  0008_site_domains.sql
  0009_asset_grant_form_handle.sql

Apply the migrations, then start again:

  (cd apps/control-app && npx wrangler d1 migrations apply 1stcontact --local)

Nothing was started. …

If a dev server is already running, RESTART it after applying: it holds its own
view of the schema and will keep serving the old one, which is how the same
error comes back an hour after it was fixed.
```

## Decisions I made

- **Read the file, not wrangler.** `node:sqlite` from the runtime the repo already requires — no new dependency, single-digit milliseconds. `wrangler d1 migrations list` costs seconds and a `Miniflare` spawns workerd, either of which would have made AC8 unaffordable. Finding the file means copying miniflare's four-line name derivation, which is pinned by a UAT against this repo's actual file name.
- **`--remote` is not gated** — that is `bin/deploy`'s database, and the local file says nothing about it.
- **The top-level `[[d1_databases]]` block only.** The file declares D1 twice; `wrangler dev` reads the top one. The fixture gives the two blocks different ids so a scraper taking the first match anywhere fails.
- **A check that can't run warns and starts.** A broken gate must not be the thing that stops you working.
- **No database at all is refused too**, with its own message — starting would serve a Worker with no tables. Its first paragraph differs; the command and the restart note are the same.

## Tests

11 new UATs in `tests/test_UAT_FC_REQ-253_*`, driving `run(['builder'])` against fixture checkouts holding real SQLite databases at the real derived path. Only `spawn` and `repoRoot` are stood aside.

I also added a `vi.mock` of the new module to `test_UAT_FC_BUG-50_builder_env_files` — it drives the same entry point and reads the developer's own untracked `.wrangler/state`, so without it those assertions would depend on whether you'd applied your migrations that morning. Noted in the ticket body.

## Verification — one caveat

Targeted scope passes: REQ-253 (11), BUG-50 (6), plus `naming`, BUG-51 reset, REQ-143 store bindings, REQ-145 build artifacts. I also ran `./bin/1c builder` for real — refusal with clean output and no wrangler spawned, and a current database starting silently.

The full node project finished **5 failed / 3333 passed**. Two (`BUG-67 backend settings`, `bug32-webui-scope-rebrand`) fail identically on unmodified `xgd-working`. The other three (`AC946` twice, `AC1293`) are contention: I accidentally had three full suites running at once, and `reconciliation-colour-census-and-retrofit` passes 9/9 in isolation.

**Those stray vitest processes (pids 52517, 54015, 56135) are wedged and the sandbox won't let me signal them** — worth killing by hand before you run anything heavy.

<!-- xgd-chat-end -->