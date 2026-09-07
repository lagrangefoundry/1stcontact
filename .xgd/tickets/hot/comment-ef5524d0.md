---
uid: comment-ef5524d0
id: COMMENT-2307
type: comment
title: Comment on bug BUG-63
created_by: xgd
created_at: '2026-09-07T20:20:47.537352+00:00'
updated_at: '2026-09-07T21:35:39.738469+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d672f592
  kind: chat_transcript
---

<!-- xgd-turn id="1504ce6c-5fba-4bb2-94f2-589b4120e91a-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T20:18:57.328269+00:00" -->
#### You
```
((.venv-working) ) martin@nyx control-app % cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app
npx wrangler dev --port 8788 \
  --env-file .dev.vars \
  --env-file ../../.dev.vars.local \
  --env-file "$HOME/Documents/secrets/1c.dev.env"

 ⛅️ wrangler 4.106.0
────────────────────
Using secrets defined in .dev.vars
Using secrets defined in ../../.dev.vars.local
Using secrets defined in ../../../../Documents/secrets/1c.dev.env
Your Worker has access to the following bindings:
Binding                                                                 Resource                  Mode
env.DB (1stcontact)                                                     D1 Database               local
env.SITES (1stcontact-sites)                                            R2 Bucket                 local
env.BLOBS (1stcontact-material)                                         R2 Bucket                 local
env.BROWSER                                                             Browser Run               local
env.AI                                                                  AI                        remote
env.ASSETS                                                              Assets                    local
env.TENANT_ID ("biz_51a6746495c8057e886ff98d4208e6b9")                  Environment Variable      local
env.PLATFORM_ADMINS ("(hidden)")                                        Environment Variable      local
env.ACCESS_DEV_OPEN ("1")                                               Environment Variable      local
env.ACCESS_TEAM_DOMAIN ("(hidden)")                                     Environment Variable      local
env.ACCESS_AUD ("(hidden)")                                             Environment Variable      local
env.MAIL_FROM ("no-reply@1stcontact.io")                                Environment Variable      local
env.SESSION_COOKIE_NAME ("session")                                     Environment Variable      local
env.SESSION_COOKIE_DOMAIN ("")                                          Environment Variable      local
env.ANTHROPIC_API_KEY ("(hidden)")                                      Environment Variable      local
env.RESEND_API_KEY ("(hidden)")                                         Environment Variable      local

╭───────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│  [b] open a browser [d] open devtools [e] open local explorer [t] start tunnel [c] clear console [x] to exit  │
╰───────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
✘ [ERROR] Build failed with 2 errors:

  ✘ [ERROR] No matching export in
  "src/generated/ai-knowledge.js" for import "KnowledgeDocs"
  
      src/session-knowledge.ts:2:2:
        2 │   KnowledgeDocs,
          ╵   ~~~~~~~~~~~~~
  
  
  ✘ [ERROR] No matching export in
  "src/generated/ai-knowledge.js" for import "KnowledgeDocs"
  
      src/system-knowledge.ts:3:2:
        3 │   KnowledgeDocs,
          ╵   ~~~~~~~~~~~~~

```

I see two errors on server start

<!-- xgd-turn id="1504ce6c-5fba-4bb2-94f2-589b4120e91a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-07T20:25:47.857260+00:00" -->
#### Claude
Diagnosed. This is bigger than the two import errors suggest — let me lay it out.

Ticket BUG-63 written up. The short version:

**The two errors are the small half of the problem.**

`bin/install --component all` (store mtime today 11:20) pulled the framework's head. Nothing in this repo pins a framework version — every `@lagrangefoundry/*` package reports `"version": "0.0.0"` and no manifest records the commit. Meanwhile the framework landed its **DOC-22 three-tier priming architecture** between 09-03 and 09-06, and our AI host was last touched 09-02.

`KnowledgeDocs` was deliberately deleted (framework `c77717d61f`, "KM priming providers replace KnowledgeDocs"). That's the visible break.

**The invisible break is worse.** `Role`'s constructor in the installed `@lagrangefoundry/ai` is now:

```js
constructor({ name, priming = [], reminders = [], tools, permissions,
              sandbox, cacheBoundary } = {}) { …; Object.freeze(this) }
```

`system`, `source` and `reminder` are gone. Both our `Role` constructions still pass them — `host-core.ts:591` and `ai.ts:161` — and because the object is frozen over a fixed key set, they're silently dropped. So the obvious two-line fix (delete the `KnowledgeDocs` import) gives you a Worker that **builds, boots, and serves an assistant with no system prompt, no role purpose, no KM landscape and no reminder.** Strictly worse than the current failure, which at least stops.

We've migrated none of it — zero hits for `PrimingProviders`, `productFromMapping`, `registerDefaults`, `registerKmProviders`, `cacheBoundary` outside `node_modules`. Nine files touch the retired API (listed in the ticket), including three test files.

**Two routes, and I'd like your call before coding:**

- **A — migrate.** Adopt DOC-22 here: a `PrimingProviders` registry per host, `CONSULTANT_SYSTEM` / reminder / KM landscape expressed as product- and role-tier priming entries, `registerKmProviders` where `KnowledgeDocs.open` was, plus `assets.ts`'s export allow-list and the tests. Correct, and the only route that leaves the assistant actually primed. Non-trivial — it touches both the Node CLI host and the Worker.
- **B — pin and defer.** Reinstall the store from the last framework commit before `28367ac5aa` to unblock you now, and record the pin. Migrate on your own schedule.

The pin is worth doing either way: an unpinned out-of-band store is exactly what let a framework release break this repo with no diff in it.

One thing I'd add to whichever route you pick — the regression that matters isn't "the Worker builds", it's that a constructed session's assembled priming actually *contains* the system prompt and the landscape. Nothing asserts that today, which is why the `Role` key drop would have shipped silently.

<!-- xgd-turn id="155651b0-cd97-41b6-8016-5794319ab673-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T20:27:35.649694+00:00" -->
#### You
ok lets me clear - we are in dev mode, there is no production data. 

If we have broken data in there - lets clear it out.

There is only one thing I care about - the draft xgd site. Everything else is toast

<!-- xgd-turn id="155651b0-cd97-41b6-8016-5794319ab673-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-07T20:44:36.614653+00:00" -->
#### Claude
Clear. Route A — migrate, and local dev state is expendable except the draft xgd site. Let me find what I'm protecting before I touch anything.

Draft site backed up (two copies). Now the migration — reading the new API in full.

Full picture in hand. Let me scope the ticket, then cut the branch.

Now implementing. Starting with the Node host core:

Now the per-turn reminder path in `streamPrompt`:

Now the Worker side — `system-knowledge.ts` and `session-knowledge.ts`:

Now the generated shim's export list:

Worker bundle builds. Now the tests — first the three files naming the removed class:

One definition site for the KM priming shape, so both hosts and the UAT assert the same code:

Now routing all three hosts through it:

Now the UATs:

All 7 pass. Now the pre-existing suites that named the deleted class:

Now the change-journal suite and the workers-test comment:

While the suite runs — the ticket needs the consequences I found while implementing:

Important finding before I clear anything — let me check what's actually stale:

Still running. Let me summarise where things stand while it finishes.

**Done so far:**

**The migration (route A).** Priming is now DOC-22 configuration in both hosts:

- `host-core.ts` builds a `PrimingProviders` registry per manager and constructs `Role` with `priming` / `reminders` entries. The four entries — `consultant-system`, `km-landscape`, `purpose`, `km-mechanism` — go in **one tier** deliberately: tiers concatenate product-then-role, and the order this host needs interleaves them.
- The `role.reminder = …` mutation is gone. A frozen `Role` would have thrown on it every turn. The per-turn signal is a registered reminder provider reading host state, which is what DOC-22 says to do.
- `kmPrimingEntries` in `roles.ts` is the single definition site for the landscape → purpose → mechanism order, used by the Node host, both Worker paths, and the tests.
- `assets.ts` shim lists updated; `1c assets` regenerated.

`wrangler deploy --dry-run` builds clean — your original failure is resolved.

**Three things the upgrade brought that I found by implementing, all caught by pins doing their job:**

1. `ReadKnowledge` grew `KnowledgeOutline` and `KnowledgeChanges`. Both declared `read`, so I widened the pins rather than narrowing the grant. One pin asserted effects as a three-element array of `"read"` — that's now a universal, since an additive change can't violate the claim it makes.
2. Provenance moved from per-operation to per-corpus. Default is still `untrusted`, so our design documents still reach the model wrapped — nothing had to be weakened.
3. The system prompt now arrives as *either* a string or `text` blocks split at the cache boundary. Three suites read it as a string; they go through one `systemText` helper on the shared model double now.

**Tests.** 7 new `test_UAT_FC_BUG-63_*` UATs pass. They assert on **what the model was sent**, never on the host having constructed something — a test that inspected the `Role` would have passed on the broken shape too. Repaired suites all green: REQ-123 (6), REQ-122 (8), the knowledge reconciliation (4), the change journal (16).

**Local state.** I looked before deleting, and the picture isn't what either of us assumed:

- **The xgd site is in the Worker's local D1**, not just on disk — `slug: xgd`, two pages (`home.json`, `whitepapers.json`), imported 2026-09-06. So I did **not** wipe D1 or R2.
- That D1 contains **zero chat tickets** — only `template` and `email` rows. There was no broken session data there to clear.
- The only genuinely stale AI state was `storage/chat/` (the Node CLI's two transcripts). Their headers carry `x_threshold`, `y_carry` and `segments` — all retired by the upstream recycle-and-carry removal. Cleared.

Backed up before touching anything: `storage/sites/xgd` (two copies, one in `$TMPDIR`, one in `.xgd/tmp/bug63-backup/`) plus `storage/chat`.

Still outstanding: the full node suite result, then the workers project, then the commit and `status=free_coded`. I'll report the suite numbers — including anything that was already failing before this change — rather than just saying it's green.

<!-- xgd-turn id="c07c447d-0d00-4c54-8aaa-53c64143f908-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T20:53:26.794955+00:00" -->
#### You
Please proceed

<!-- xgd-turn id="c07c447d-0d00-4c54-8aaa-53c64143f908-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-07T20:54:53.695948+00:00" -->
#### Claude
The background suite was orphaned when the process exited. Re-running it, writing incrementally this time:

Waiting on the suite. In the meantime, let me confirm the ticket body carries language for every UAT I wrote:

All ten claims trace to ticket language (that one "MISS" was my grep hitting a line break — the sentence is there).

I'll wait for that to land rather than poll. Current state:

**Suite in flight** — two failures visible so far:
- `test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable` (HTTP cache headers — nothing to do with priming; likely pre-existing)
- `test_UAT_AC1058_only_granted_site_operations_are_offered…` (a granted-tools equality pin — plausibly the same widened knowledge grant, but I'll confirm rather than assume)

Once it finishes I'll triage each failure as caused-by-this-change or pre-existing, and settle the pre-existing ones by stashing and re-running those files at the branch point — not by asserting it.

**Ticket** verified: all ten behaviour claims my UATs rest on have matching body language, including the two upstream consequences (widened `ReadKnowledge`, per-corpus provenance) and the two-shape system prompt.

Still to do after the suite: the workers vitest project, then commit with `[FREE-CODED]` and set `status=free_coded` with the sha.

<!-- xgd-turn id="1b3ffff4-e827-49dd-8db8-f793999f4b57-user" -->

<!-- xgd-chat role="user" ts="2026-09-07T21:05:59.465211+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="1b3ffff4-e827-49dd-8db8-f793999f4b57-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-07T21:35:39.403740+00:00" -->
#### Claude
I'll pick up where the suite left off. Let me check current state first.

Triaging. Let me look at the actual assertions for the ones I suspect are pre-existing vs. caused.

Pre-existing/flaky confirmed (AC960, AC977 fail without my change; AC845 and REQ-115 pass in isolation — known dist-assets ordering artifacts). The remaining 14 are mine. Let me look at the shape.

Four distinct causes. Let me fix them.

Now the fixes. First, the stale-word offender in my own test — replace the literal restatement with the property that actually matters:

REQ-174 already covers the legacy reopen end-to-end (and passes under my change), so my test was a genuine duplicate. Removing it rather than restating it:

Now the `.system` shape across the six suites, and the widened knowledge grant pin:

Now the widened knowledge grant pin — this is the ticket's documented upstream consequence:

That last assertion is weaker than it looks. Tightening it to say the actual thing:

Now the full suite, foreground:

Down from 17. Verifying the remaining six against the branch point:

All six fail identically without my change — every remaining failure is pre-existing. Now build and typecheck:

Six UATs. Now let me read the current ticket body in full before updating it:

Now version bump and commit:

Generated, untracked — correct. Committing:

Now lock, merge back to `xgd-working`, then mark `free_coded`:

Version collision — BUG-59 claimed 0.2.126. Re-bumping on the branch and fast-forwarding back:

Finally, confirming the merged tree on `xgd-working` still builds and the migrated suites pass there:

Done. BUG-63 is at `free_coded`.

## What landed

**The migration (route A).** Priming is now DOC-22 configuration in both hosts — a `PrimingProviders` registry per manager, the four entries (`consultant-system`, `km-landscape`, `purpose`, `km-mechanism`) in the one order that matters, and the per-turn reminder as a registered provider instead of a mutation of a now-frozen `Role`. `kmPrimingEntries` in `roles.ts` is the single definition site for that order, used by the Node host, both Worker paths and the tests.

`wrangler deploy --dry-run` builds clean and `pnpm -r build` typechecks — your original failure is resolved.

**Test triage, which is where this session's work went.** The first full foreground run showed 17 failures. Stashing the change and re-running proved which were mine:

- **6 pre-existing** — `AC960`, `AC977`, and the four system-KB corpus-export suites. They fail identically without my change.
- **2 load-order flakes** — `AC845`, `REQ-115`. Pass in isolation both with and without the change.
- **14 caused by the change**, now all closed.

Four distinct causes behind those 14, not one:

1. The system prompt arrives as a string *or* cache-split text blocks. Seven suites read it as a string; all now go through one `systemText` helper on the shared model double.
2. The `ReadKnowledge` grant grew `KnowledgeOutline` and `KnowledgeChanges`. I widened the pin rather than narrowing the grant — both declare `read`, so the read-only claim is intact, and narrowing would have taken capability away from the assistant to avoid editing a test.
3. `KnowledgeDocs` printed `# Your purpose` and closed with `Prime yourself now`; both went with the class. Those assertions are re-anchored on content — the purpose by its own text, "mechanism last" as *no section begins after it*.
4. My own test file spelled the legacy role name, which made it a straggler of the rename REQ-174 scans for.

**One test deleted rather than fixed.** My legacy-alias UAT was a genuine duplicate — REQ-174 already rewrites a stored transcript header and reopens through the real host, which is stronger evidence, and it passes. Removed, with the reason recorded in both the file and the ticket.

**Commits** `53ede2641f` (migration) and `3c7cb93c17` (version bump). The first bump collided with BUG-59's claim on 0.2.126, so the branch was resynced and re-bumped to 0.2.127; both SHAs are on `xgd-working` and recorded on the ticket. Branch merged and cleaned.

**One thing to be aware of:** `test_UAT_FC_BUG-63_the_generated_bridge_shim_names_the_km_providers_and_not_the_deleted_class` reads `src/generated/ai-knowledge.d.ts`, which is gitignored. It failed on the merged tree until I ran `./bin/1c assets` — so a fresh checkout needs that before the suite is green. That's the same precondition the builder-origin suites already have, not new, but it is a real dependency on a build artifact and worth knowing.

The ticket body carries language for all six remaining UAT claims plus the three upstream consequences and the pre-existing failure list, so reconciliation has the *why* for each.

<!-- xgd-chat-end -->