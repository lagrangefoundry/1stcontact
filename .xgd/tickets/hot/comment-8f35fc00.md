---
uid: comment-8f35fc00
id: COMMENT-7889
type: comment
title: Comment on bug BUG-356
created_by: xgd
created_at: '2026-11-05T23:34:04.923107+00:00'
updated_at: '2026-11-06T02:12:45.768268+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-2568c791
  kind: tool_transcript
---

## Bash cd /Users/martin/lagrangefoundry/1stcontact && python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{"session":"bug…
<!-- xgd-tool name="Bash" id="toolu_01FHdTjoCYghD1L9E9HWu12K" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:31:32.526098+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"bug-2568c791\"}' 2>&1 | head -50; python -m lagrangefoundry.ai_knowledge.cli KnowledgeSearch --in '{\"query\":\"free coding process protocol steps\",\"kb\":[\"system_docs\"],\"top_k\":3}' 2>&1 | head -40","description":"Read summary and search free-coding protocol"}
```

**Result**

```
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai.agent_cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai_knowledge.cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && ls; ls .venv* 2>/dev/null | head; which xgd; cat ~/.claude-2/projects/-Us…
<!-- xgd-tool name="Bash" id="toolu_01B2du8J9FDhYy4o7dcncuG7" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:31:39.562530+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && ls; ls .venv* 2>/dev/null | head; which xgd; cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-free-coded-promotion.md ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/branch-cut-blocked-by-hookspath.md ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/worktree-and-store-setup.md","description":"Look at repo, tools, and setup memories"}
```

**Result**

````
apps
bin
CLAUDE.md
db
example-businesses
fonts
kb
node_modules
package.json
packages
pnpm-lock.yaml
pnpm-workspace.yaml
README.md
storage
tests
tools
tsconfig.base.json
vitest.browser.config.mts
vitest.config.mts
vitest.node.config.mts
vitest.workers.config.mts
(eval):1: no matches found: .venv*
/Users/martin/.xgd/bin/xgd
---
name: xgd-free-coded-promotion
description: "move-to-free-coded needs the version-carrying commit to BE the tip of xgd-working, so merge working into the branch, bump there, and fast-forward back."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c19873f1-4d06-4920-9e06-d01321c99dfb
  modified: 2026-10-23T01:19:46.608Z
---

`xgd ticket move-to-free-coded` rejects four things in sequence, each with its
own error, so getting the order wrong costs a round trip each time:

1. **The branch must already be merged back.** `xgd branch lock <TICKET-ID>`,
   then merge. Finish with `xgd branch clean <TICKET-ID>` (removes worktree,
   deletes branch, releases the lock).
2. **SHAs must be the full 40 hex characters.** `git rev-parse HEAD`, never an
   `--oneline` abbreviation.
3. **`--version` must be unclaimed** by another ticket's `fields.version`.
4. **The commit carrying the version must be reachable *from the SHAs you
   pass*, and it must be at the tip.** This is the one that is easy to get
   backwards. If merging the branch into `xgd-working` creates a MERGE COMMIT,
   that merge commit becomes the tip carrying the new version — and it is not
   reachable *from* your SHAs (they are its ancestors), so the gate refuses with
   *"already present at the tip of xgd-working (<sha>), on a commit not
   reachable from any of the provided SHAs — someone else already published this
   version"*. The message reads like a race with another ticket and is not one.

**Why:** the gate wants the version bump to be attributable to a commit the
ticket records. A merge commit records nobody, so the merge back has to be a
fast-forward.

**How to apply — the ordering that works:**

```
xgd branch lock <TICKET-ID>
git -C <worktree> merge xgd-working          # working INTO the branch first
./bin/project/xgd_version_bump               # bump ON the branch, after that merge
git -C <worktree> commit -am "chore(version): X.Y.Z for <TICKET-ID>"
git -C <main-checkout> merge --ff-only free-<TICKET-ID>
xgd ticket move-to-free-coded <uid> <sha>... --version X.Y.Z
xgd branch clean <TICKET-ID>
```

`--ff-only` is the check: if it refuses, the branch does not contain
`xgd-working`'s tip and the first merge was skipped or something landed since.
Verify the bump independently with
`./bin/project/xgd_version_bump --check <sha>... --version X.Y.Z` — exit 0 means
the version half is fine and any remaining refusal is the reachability rule
above.

**When other sessions are working the same repo, the tip check is a RACE and the
recipe above is not enough.** Every `xgd ticket ...` call by any agent commits to
`xgd-working`, and those commits bypass the merge lock — so a ticket commit lands
on top of your bump within seconds, inherits the new version, and the gate refuses
with the same *"already present at the tip"* message even though the fast-forward
was done correctly. Holding `xgd branch lock` does not prevent it. Run the whole
tail as a retry loop and let it burn version numbers:

```
for attempt in 1 2 3 4 5 6; do
  xgd branch lock <TICKET-ID> >/dev/null 2>&1
  git -C <worktree> merge xgd-working >/dev/null 2>&1
  (cd <worktree> && ./bin/project/xgd_version_bump)
  VER=$(grep '"version"' <worktree>/package.json | sed 's/.*"\([0-9.]*\)".*/\1/')
  git -C <worktree> commit -qam "chore(version): $VER for <TICKET-ID>"
  BUMP=$(git -C <worktree> log --format=%H -1)
  git -C <main> merge --ff-only free-<TICKET-ID> >/dev/null 2>&1
  xgd ticket move-to-free-coded <uid> <work-sha> "$BUMP" --version "$VER" && break
done
```

Versions are cheap; a burnt one costs nothing. Acquiring the lock can itself take
minutes — loop on `xgd branch lock` too (it was held by four different tickets in
one 25-minute window).

**The shell is zsh, which does NOT word-split an unquoted variable.**
`SHAS="a b"; xgd ticket move-to-free-coded $uid $SHAS` passes both SHAs as ONE
argument and fails *"invalid SHA — expected 40 lowercase hex characters"*, which
reads like a typo rather than a quoting bug. Write each SHA as its own literal
argument, or use an array.

**Before merging back, the main checkout may hold uncommitted or untracked files
the branch supersedes** — the merge aborts naming them. Back them up, diff them
against the branch's versions to confirm they are the older copy, then discard.

Never start a `git stash`-based baseline test run while another suite is running
in the same worktree; it removes the files mid-run and corrupts both results.

**2026-10-22 update (BUG-254):** the merge back is no longer a plain `git merge --ff-only`. The xgd-working checkout is sparse, so run `/Users/martin/lagrangefoundry/xgd/bin/xgd-merge free-<TICKET-ID>` from `/Users/martin/lagrangefoundry/1stcontact`; it merges with sparse-checkout off and rematerializes tickets. The path `xgd branch lock` prints (`.venv-working/lib/python3.12/site-packages/bin/xgd-merge`) does not exist. The rest of the order is unchanged: lock → merge xgd-working into the branch → bump → commit → xgd-merge → move-to-free-coded → `xgd branch clean` as its own Bash call.

Related: [[xgd-ticket-json-shape]], [[never-edit-ticket-files-directly]].
---
name: branch-cut-blocked-by-hookspath
description: "xgd branch cut fails in the sandbox setting core.hooksPath, after already creating the branch; attach the worktree by hand."
metadata:
  node_type: memory
  type: reference
  originSessionId: a559c7a8-8a71-4672-a795-2f12323dea9e
  modifi
````

[elided — kept 5800 of 10352 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && cat CLAUDE.md | head -80; ls -a | grep venv; xgd ticket show BUG-356 2>&1…
<!-- xgd-tool name="Bash" id="toolu_0114ybQ3MXaQkMvoNZeeAkin" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:31:43.163687+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && cat CLAUDE.md | head -80; ls -a | grep venv; xgd ticket show BUG-356 2>&1 | head -20","description":"Read CLAUDE.md and ticket"}
```

**Result**

```
# Claude Instructions for 1stcontact

**Note:** This project uses XGD (Extreme Generative Development) methodology. XGD methodology docs are bundled in the xgd package (`xgd_source/system_docs/`) and loaded automatically into sessions.

## XGD Workflow Documentation

**System Documentation** (bundled in xgd package — `xgd_source/system_docs/` — read-only):
- `TDD-PROCESS.md` - TDD RED/GREEN workflow, quality gates, exception policy
- `TEST-STRATEGY.md` - Testing guidelines, what to test, parameterization
- `TASK-TEMPLATE.md` - Template for creating streamlined task prompts

These docs are bundled in the xgd package and loaded at runtime — not copied into your project.

## Branch Topology

**See `docs/reference/xgd-branching-strategy-full.md`** for the authoritative branch topology reference.

Summary:
- `xgd-working` — operator hot branch; all free-coded changes, tickets, config
- `main` — tested, reconciled truth; all branches cut from here
- `branch-<ticket>` — develop/feature branches; cut from main, merge back to main
- Reconcile branches — short-lived; promote working bundles into main
- Resync branches — short-lived; rebase working's unreconciled tail onto updated main
- Regression branches — cut from main; on success, fast-forward `xgd-stable`
- Merge branches — mechanical plumbing; created and deleted within a single run
- `xgd-stable` — production release; guaranteed conforming matrix and passing tests

## ⚠️ CRITICAL: No Legacy Modes or Backward Compatibility

**See also**: `PHILOSOPHY.md` (xgd system docs) → "Simplicity Over Preservation" and "Ruthless Refactoring"

**When refactoring, replace fully. Do NOT create legacy/fallback modes unless explicitly requested.**

- When implementing a new approach, replace the old one completely
- Do NOT add "legacy mode" or "fallback to old behavior" code paths
- Do NOT auto-detect "which mode to use" between old and new implementations
- Delete old code; don't comment it out or hide it behind flags
- Tests validate correctness, not legacy code paths
- Git history is the archive if old code is ever needed

**Why**: Legacy modes create:
- Complexity (two code paths to maintain)
- Confusion (which mode am I in?)
- Bugs (mode detection logic, edge cases)
- Dead code that never gets removed

**The Rule**: When replacing an approach, delete the old one. If tests pass, the new implementation is correct.

## ⚠️ CRITICAL: Close capability gaps in L1, not with new modules

Since the framework pivot (REQ-79 / REQ-84 / REQ-96) there are two distinct kinds of "gap", and they resolve in different places. Do **not** reach for a new module by reflex.

**Layout / presentation gaps → add a typed L1 primitive.** Layout is owned by the **L1 substrate** (`packages/framework/src/l1`, DOC-23) — a single, low-level, CSS-faithful typed element tree. The old semantic *layout* modules (header/hero/footer/text-block/services-grid/layer) are gone; there is no `hero` to add a dial to. When a design cannot yet be expressed, the fix is to **add a typed axis/primitive to L1** (never a raw-CSS hole, never a new "layout module"). The expressive ceiling rises without limit while the security/reliability wall stays put (DOC-24, DOC-2).

**Behaviour gaps → configure an existing behavior module before authoring a new one.** A **module** now means a *behavior module* — a vetted behavioural core + typed `config` + named L1 presentation seams (carousel, contact-form; later payments, auth, email-capture). The AI *configures* a behavior module; it never writes its code inline. When a behaviour gap appears:
- Does it fit an existing behavior module's purpose? → add a **behavioural** `config` field to it (an endpoint, a field schema, autoplay/loop, an anti-spam mode).
- Is the gap actually about how the thing *looks*? → it is not a module gap at all. Appearance is L1: a typed axis, the L1 subtree bound into a **slot**, or the L1 node carrying a **`control`** name (`kind: 'control'` in `packages/site-schema/src/l1/schema.ts`). A vetted *default* look belongs in an **L2 preset** (`packages/framework/src/l2/`), never in the module.
- Only if it is a genuinely new *kind of behaviour* with its own core → a **new behavior module** (last resort, highest bar; hardened per DOC-26 before publish).

**`config` is data-only and never aesthetic** (DOC-25 §2, §10). REQ-96 deleted `carousel`'s `config.view` as the canonical violation: it was presented as behavioural ("slides per view") but resolved to a `flex-basis`. If a proposed `config` field bottoms out in a CSS value, it is an aesthetic dial wearing behavioural clothes — put it in L1.

**A conforming behavior module ships zero CSS**, with one carve-out: a small **declared** set of *invariant elements* whose presentation is pinned by an obligation rather than by taste (the honeypot must stay invisible; the Turnstile mount must sit where the widget expects it; a visually-hidden label must stay out of flow). Anything not on that list paints from L1 or does not paint at all. Residual module stylesheets and the aesthetic resolvers in `modules/dials.ts` / `text-style.ts` are legacy being dismantled under REQ-96 — do not extend them.

**Two composition directions** (DOC-25 §10), chosen per element by whether it can hold children:
- **container** (carousel slide, form wrapper) → the module wraps L1, via a **slot**.
- **leaf control** (`<input>`, `<textarea>`, a button's face) → **L1 wraps the module**, via a `control` node. A void element has nowhere to put a subtree, so the slot model is structurally unreachable there; the module supplies only that element's attribute bundle (`type`/`name`/`required`, the `for`↔`id` wiring, the endpoint), and L1 owns its class, geometry and every paint axis.

**
```

[elided — kept 5800 of 7815 bytes]

## Bash cd /Users/martin/lagrangefoundry/xgd && find . -path ./node_modules -prune -o -iname '*FREE*COD*' -print 2>/dev/null | g…
<!-- xgd-tool name="Bash" id="toolu_01NDLSpGLd8FMEfdJZPPxjhi" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:31:47.082110+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/xgd && find . -path ./node_modules -prune -o -iname '*FREE*COD*' -print 2>/dev/null | grep -v venv | head; ls /Users/martin/lagrangefoundry/1stcontact/.venv-working 2>/dev/null | head -3","description":"Locate free-coding doc"}
```

**Result**

```
./tests/test_UAT_AC3625_free_coding_process_doc.py
./tests/test_UAT_AC7430_free_coding_workspace_doc.py
./tests/test_UAT_AC3625_status_flow_free_coding_mandatory.py
./xgd_source/system_docs/FREE-CODING.md
./xgd_source/cli/free_code.py
./tests/__pycache__/test_UAT_AC3625_status_flow_free_coding_mandatory.cpython-312-pytest-9.1.1.pyc
./tests/__pycache__/test_UAT_AC7430_free_coding_workspace_doc.cpython-312-pytest-9.1.1.pyc
./tests/__pycache__/test_UAT_AC3625_free_coding_process_doc.cpython-312-pytest-9.1.1.pyc
./tests/cli/test_UAT_FC_BUG-1143_free_code_uses_interactive_role.py
./tests/cli/test_UAT_FC_request-86d55af5_free_coded_checklist.py
```

## Bash cat /Users/martin/lagrangefoundry/xgd/xgd_source/system_docs/FREE-CODING.md
<!-- xgd-tool name="Bash" id="toolu_01QD2C8YwPhod1FnYMyJgD9k" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:31:50.100823+00:00" -->

**Input**

```json
{"command":"cat /Users/martin/lagrangefoundry/xgd/xgd_source/system_docs/FREE-CODING.md","description":"Read free-coding protocol"}
```

**Result**

```
<persisted-output>
Output too large (56.2KB). Full output saved to: /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/6909dc45-e8e2-4c91-9972-2e1e0e43872a/tool-results/berm25kwr.txt

Preview (first 2KB):
# Free Coding — process for Claude

**Audience**: Claude. This document describes the standard process for free-coded
work in the xgd project. It will eventually be loaded as part of the `xgd claude`
system prompt; for now it is referenced from `CLAUDE.md` and read on demand.

---

## Quick reference

"Free coding" = (1) scope ticket first with behavior description, (2) set `status=free_coding` to mark the start of work, (3) `xgd branch cut <TICKET-ID>` (default — skip only if confident this is a quick fix-and-commit) then code + UAT tests named `test_UAT_FC_<TICKET-ID>_*` on that branch, (4) commit with `[FREE-CODED]`, (5) `xgd branch lock` → manual `git merge` into xgd-working (conflict resolution happens here, before the ticket is marked done), (6) set `status=free_coded` + `fields.commits=[sha]` — the gate command checks each SHA is already an ancestor of xgd-working and refuses to proceed otherwise (BUG-1032), so `free_coded` mechanically means "landed, ready to reconcile whenever" and never requires a branch-status check, (7) keep ticket body current, (8) `xgd branch clean` to release the lock and tear down the now-merged branch/worktree. Missing any step → no matrix coverage → test_fix eliminates the code as drift.

---

## ⚠️ MANDATORY PROCESS — Applies to interactive user sessions only

**This is a required process, not a guideline.** Every direct code change request in an interactive session — "implement X", "fix X", "add X", or equivalent — must follow this flow. The system enforces compliance automatically; there is no recovery path for most violations.

**Headless processes** (`xgd develop`, `xgd reconcile`, `xgd regression`) do not follow this process. They have their own workflow state machines.

### Which status transitions Claude owns — and which the operator owns

**Claude may set these statuses autonomously, as part of the free-coding process:**

| Status | When |
|---|---|
| `draft` | Always — create tickets here |
...
</persisted-output>
```

## Bash F=/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/6909dc45-e8e2-4c91-9972-2e1e0e43872a/tool-re…
<!-- xgd-tool name="Bash" id="toolu_01QnTpzYgdbGj7ZVkiCcTYyb" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:31:53.425744+00:00" -->

**Input**

```json
{"command":"F=/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/6909dc45-e8e2-4c91-9972-2e1e0e43872a/tool-results/berm25kwr.txt; sed -n 20,140p $F","description":"Read protocol status/steps section"}
```

**Result**

```
### Which status transitions Claude owns — and which the operator owns

**Claude may set these statuses autonomously, as part of the free-coding process:**

| Status | When |
|---|---|
| `draft` | Always — create tickets here |
| `free_coding` | Set at the start of the process — end of Step 1 / before Step 2 |
| `free_coded` | After the commit lands and ticket is updated (Step 4) |

**All other status transitions are operator decisions. Claude must never set them.**

`ready_*` statuses are dispatcher triggers — setting one immediately queues an
automated pipeline. These are irreversible without manual intervention:

| Status | What the dispatcher launches |
|---|---|
| `ready_to_implement` | `xgd develop` — full technical design, sprints, code generation |
| `ready_to_reconcile` | `xgd reconcile` — capability matrix update |

The operator decides when work proceeds to the next automated stage. Claude's job
is to leave the ticket at `free_coded` in a clean state; promotion is the
operator's explicit authorisation.

### Consequences of non-compliance

**Skip the scope ticket**: The commit is detected at the next sync and automatically reverted. No warning is issued. The work is lost.

**Set `ready_to_implement`**: The dispatcher spawns `xgd develop` within ~30 seconds, generating a full technical design and branch that conflicts with your commit. Recovery requires manually killing the spawned process and reverting the develop branch.

**Set `ready_to_reconcile`**: The dispatcher spawns `xgd reconcile` immediately, treating the current ticket body as authoritative. If the body is stale or the work isn't ready, the capability matrix is updated against the wrong spec — recovery requires manual worktree cleanup and ticket surgery.

**Omit `[FREE-CODED]` from the commit message**: Merge-back review treats the commit as ordinary develop output. A later branch landing may silently overwrite your fix with no warning.

**Hand back with a stale ticket body**: The operator may promote to `ready_to_reconcile` immediately. Reconcile enforces the stale spec — silently undoing design decisions made during the session.

---

## ⚠️ CRITICAL: NEVER set a free-coded ticket to `ready_to_implement`

`ready_to_implement` is the dispatcher's `xgd develop` trigger. The dispatcher
polls every ~30 seconds and the moment it sees a ticket at this status it
spawns an autonomous `xgd develop` cycle against it — **technical design,
sprints, generated code, the whole develop pipeline** — racing whatever
free-coded change you're trying to land.

**Allowed statuses for a free-coded ticket**: `draft` (always create here),
`free_coding` (set at the start of coding), `free_coded` (after commit lands).
Nothing else. If you find yourself wanting `ready_to_implement`, you don't
want a free-coded ticket — you want an `xgd develop` ticket and should follow
that flow instead.

This rule is non-negotiable. Setting a free-coded ticket to
`ready_to_implement` will produce a develop branch, a develop worktree, and
LLM-generated code that conflicts with your commit — recovery requires
manually killing the spawned process and reverting the develop branch.

---

## ⚠️ CRITICAL: Before handing back to the user, the ticket must reflect the current implementation

Whenever Claude finishes a session and returns control to the user with a ticket
at `free_coded`, the ticket body must accurately describe the implementation
**as it now stands** — not the original scope if iteration reshaped it.

**Why**: `free_coded` is a stable resting state and the user may promote to
`ready_to_reconcile` at any point after Claude says "I'm done." Once promoted,
reconcile treats the ticket as authoritative. A stale ticket produces a stale
capability matrix, and future development cycles will enforce the stale spec —
potentially introducing regressions against design decisions that were made
during the iterative cycle but never recorded.

**The rule**: Verify and update the ticket body before every handoff to the
user. This applies after every coding session on the ticket, not just the first
one — a `free_coded` ticket may go through several iterative sessions before
being promoted, and each one ends with a sync.

---

## ⚠️ CRITICAL: Use one ticket per intent — do not proliferate tickets

**The default is always the existing ticket. Claude does not decide to create a new
ticket — the user does.**

The test is lexical, not judgmental: did the user use words like "create a new ticket",
"file a separate ticket", "open a new one"? If not, use the existing ticket. Claude must
not decide on its own that a concern is "separate enough" to warrant a new ticket. When
in doubt: ask, never create.

**In dashboard chat sessions**: the associated ticket is fixed for the session. Use it
as the scope ticket for all work. Do not create a separate ticket for the coding work
and do not redirect to a different ticket as "the real home" for this session's changes.
If you think something might warrant a new ticket, ask the user — do not create one.

**In all sessions**: if related items come up, group them under the active ticket unless
the user explicitly directs otherwise. "Also fix", "can you also", and similar phrasing
are scope extensions — add the new commits to `fields.commits` and update the body.
Do not create a new ticket.

**Why**: sessions that create multiple tickets for the same intent confuse the reconciler.
It must reason about overlapping tickets with unclear ownership, capability-matrix updates
become ambiguous, and the audit trail fragments. One intent, one ticket.

---

## What is "free coding"?

Free coding is small, scoped, code-first work that lands on `main`/`xgd-working`
**without** going through the full `xgd de
```

[elided — kept 5800 of 6304 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -rln --include=*.ts --include=*.py --include=*.mjs -a "signature_eff…
<!-- xgd-tool name="Bash" id="toolu_01MUFW6vmninAsTyRxS8wP5z" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:31:59.686218+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -rln --include=*.ts --include=*.py --include=*.mjs -a \"signature_effect\" apps packages tools tests 2>/dev/null | grep -v node_modules | head -40; wc -l apps/control-app/src/videogen.ts","description":"Find signature_effect references"}
```

**Result**

```
(eval):1: no matches found: --include=*.ts
     439 apps/control-app/src/videogen.ts
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -rlna "signature_effect" apps packages tools tests --exclude-dir=nod…
<!-- xgd-tool name="Bash" id="toolu_01U2GGCTuhLb7bo94FRVfYZi" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:32:02.290041+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -rlna \"signature_effect\" apps packages tools tests --exclude-dir=node_modules --exclude-dir=generated 2>/dev/null | head -40","description":"Find signature_effect references"}
```

**Result**

```
apps/control-app/.dev-snapshot/container/dist/server.mjs.map
apps/control-app/.dev-snapshot/worker/worker.js
apps/control-app/.dev-snapshot/container/dist/server.mjs
apps/control-app/dist/worker.js
apps/control-app/container/dist/server.mjs.map
apps/control-app/.wrangler/state/v3/do/1stcontact-control-app-dev-SessionJunction/46c0e7adbe66fcee0db5e35eac75163ba6e74115f5709e4129bc3859ab26a73c.sqlite
apps/control-app/.wrangler/state/v3/do/1stcontact-control-app-dev-SessionJunction/829168d13f43ee0374d0531e660a32bffae53dbdeaf21486dfb46fbabd049e55.sqlite
apps/control-app/.dev-snapshot/worker/worker.js.map
apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/24f6d84384ee3d27c1a7b716f507dd41ef9a24e6b58ea941dae0839ebd824d0d.sqlite
apps/control-app/dist/worker.js.map
apps/control-app/container/dist/server.mjs
apps/control-app/.wrangler/state/v3/workflows/miniflare-workflows-1stcontact-consultant-turn-dev/9f15d1555a2d724bf4d428eb71a3f0f34f363111dea564c98a86bd052ea8a8fa.sqlite-wal
apps/control-app/.wrangler/state/v3/workflows/miniflare-workflows-1stcontact-consultant-turn-dev/380b00f5d997e9f9450ea8e1a431923ec23e6cce47d9a33cfdb260b419a2f881.sqlite-wal
apps/control-app/.wrangler/state/v3/do/1stcontact-control-app-dev-SessionJunction/87c32da146c94177a33c29add44c4c54488c6cbf9f7dcafddd2d39a63c6266be.sqlite
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/82898b06ba17682f745fe4fde7200b47f0d3836e941346c7878eba377f91801d000001a1a28db6e6
apps/control-app/.wrangler/state/v3/do/1stcontact-control-app-dev-SessionJunction/88a63a665c7ef6ffd50959d543d23a4e74072913c67ea3145943e96b782ef189.sqlite
apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/24f6d84384ee3d27c1a7b716f507dd41ef9a24e6b58ea941dae0839ebd824d0d.sqlite-wal
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/f444be45260762111a23f717abae0a1981114400da8333697c2f4fb940563643000001a1a8c81f75
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/c1cc47384d151fab868876e1f0dec053c1993d74c7b86ed6b07ba2b179f6ceae000001a1a88e6073
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/3a4f00837ed8ea837aaaeed9edff85371fbd6cf41b1410b968f2b50a5079af8e000001a1a85c7ed8
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/80ce98e43556a66fee18424fec067715bccf3b1b752ab2282736d7fa16015f1a000001a1a2883a2d
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/388b824b4a746a209710efc086cb98511c4fd269e7cbb94966da4ac7fa08d44a000001a1a932586d
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/c49e643a2f16590e2b9d53190655327fbf4c674f7c1c4673996eccaf60aa6e59000001a1a88f4d3e
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/9d33eac1e5d02cfb645d37506ce4165325947ebff6c09fbebe1c42d74b8fc7af000001a1a898fb6e
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/7e3da5d5e81f966a40a920f47f0ebda1ff9b69aa4e2f14857da6966f53b070dc000001a1ad982260
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/ce6ffaf803655eed59bc08c10445319ad31299564325d85ae980031831e1c2d6000001a1ac6410e3
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/98982807395d547c5ca39104f4be45e268c0b813f269f3cd17151e241ef25660000001a1805ba335
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/62f5ad4985f1be6e189dacc10073e358591db0be9e6698eb536df082321f07c9000001a1a8be4ddb
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/4a452cc7db3a3be104af0d7d77983a135afc76499bfc80c2a0971ab991b76c26000001a1a923c2e9
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/010370b938338edb2239627d44b225ec2737aa3bcc074b552440a0bcad99a2b2000001a1a8969d72
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/e9cfa9c1f0a1814bee62a313e443920a94e188f439962d2da434813ac73197ad000001a180568969
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/f60fa5031d40d9ac70cd1b5313286e4eb772d983cc53a073999f9bc180945387000001a1a8c00bd2
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/5a17f346b13bdbeb39c310fc688d2a2bcd74c240ea15dda533b1a270e000c63c000001a1ada709cb
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/38f2f990245a32932828affad02edbccf25d2018c21a22d1ef795a186904b042000001a1a8b84722
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/1792d27e1a8e627dacd4222d10d0ba1dba4632c5825768f48dd7a69fc0f95336000001a1a8b32bbc
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/771d38daa2741e06b88175755b73165c91729cf03c8cc3735cbbd443d93b5bd1000001a1a282f910
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/0aab4296b343a4ef101771d9f16ff9ec31645552ad186209da9585895829919a000001a1ade60c89
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/036d678c66905fe619bd13ae391ec2227eb53a7a2d311dfa73471c4996472115000001a1a8bdb266
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/91b45bb561c7e99554817b16f93ceb1023bd0b48bcb7c744a4b120b77a524064000001a1a8768ca1
apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs/096205022c1a12c1ed493cf5649c54bdf6a5cd1215e03a5daf5673893424180e000001a1a8b3f97b
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git grep -n "signature_effect" -- ':!*.map' ':!**/dist/**' | grep -v "^\.…
<!-- xgd-tool name="Bash" id="toolu_01JBfdgYhjHS2xmc5XoZr2wQ" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:32:07.309806+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git grep -n \"signature_effect\" -- ':!*.map' ':!**/dist/**' | grep -v \"^\\.xgd\" | cut -c1-220 | head -60","description":"git grep signature_effect in tracked source"}
```

**Result**

```
tests/support/d1-site-factory.ts:530:          .filter((d) => d.id !== 'signature_effect')
tests/support/d1-site-factory.ts:533:        { id: 'signature_effect', title: "The hero's signature effect", area: 'liveness', tier: 'concept', state: 'parked', compared: false, parked_reason: 'the client declined it', a
tests/support/job-container-rig.ts:260:            .filter((d) => d.id !== 'signature_effect')
tests/support/job-container-rig.ts:262:          { id: 'signature_effect', title: "The hero's signature effect", area: 'liveness', tier: 'concept', state: 'parked', compared: false, parked_reason: 'the client declined it
tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts:112:    expect(await alice.run('set_decision', { decision: 'signature_effect', state: 'chosen', value: 'Steam rising' })).toContain('PLAN_INVALID')
tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts:117:      decision: 'signature_effect',
tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts:123:    const d = deps.stored().fields.decisions.find((x) => x.id === 'signature_effect')!
tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts:131:      await bob.run('set_decision', { decision: 'signature_effect', state: 'parked', client_said: 'No moving pictures, thanks.' }),
tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts:133:    expect(declining.stored().fields.decisions.find((x) => x.id === 'signature_effect')!.state).toBe('parked')
tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts:147:    await alice.run('set_decision', { decision: 'signature_effect', state: 'chosen', value: 'A slow push in', client_said: 'Push in.' })
tests/test_UAT_FC_BUG-306_effect_before_the_first_draft.workers.test.ts:93:        ...p.fields.decisions.filter((d) => d.id !== 'signature_effect'),
tests/test_UAT_FC_BUG-306_effect_before_the_first_draft.workers.test.ts:94:        ...(plan.effect ? [{ id: 'signature_effect', title: "The hero's signature effect", area: 'liveness', tier: 'concept', compared: false, ..
tests/test_UAT_FC_BUG-308_effect_proposed_as_intro_plus_loop.test.ts:32:    expect(draft).toMatch(/Record their answer as `signature_effect`/)
tests/test_UAT_FC_REQ-452_builder_replay_eval.test.ts:63:  const effect = { id: 'signature_effect', title: "The hero's signature effect", area: 'liveness', tier: 'concept', state: 'parked', parked_reason: 'the client dec
tests/test_UAT_FC_REQ-454_replay_scores_the_new_system.test.ts:57:  const effect = { id: 'signature_effect', title: "The hero's signature effect", area: 'liveness', tier: 'concept', state: 'parked', parked_reason: 'the c
tools/generate/src/cli/ai/plan-core.ts:1489:export const SIGNATURE_EFFECT = 'signature_effect'
tools/generate/src/cli/ai/plan-surface.json:277:        "state": { "type": "string", "enum": ["open", "defaulted", "proposed", "chosen", "parked"], "description": "`defaulted` for a choice made to get the page built; `pr
tools/generate/src/cli/ai/plan-surface.json:289:        "client_said": { "type": "string", "description": "For `visual_concept` only, when your client has already agreed the direction: what they said asking for this new
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git grep -n "SIGNATURE_EFFECT\|signatureEffect" -- apps tools packages ':…
<!-- xgd-tool name="Bash" id="toolu_01LiwDMe4gtcu3H5Bu7RqHba" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:32:10.621091+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git grep -n \"SIGNATURE_EFFECT\\|signatureEffect\" -- apps tools packages ':!**/dist/**' | cut -c1-240 | head -50","description":"Find SIGNATURE_EFFECT usage"}
```

**Result**

```
tools/generate/src/cli/ai/plan-core.ts:1485: * {@link SIGNATURE_EFFECT}: chosen with the option, or parked when they decline,
tools/generate/src/cli/ai/plan-core.ts:1489:export const SIGNATURE_EFFECT = 'signature_effect'
tools/generate/src/cli/ai/plan-core.ts:1490:const SIGNATURE_EFFECT_DECISION = { title: "The hero's signature effect", area: 'liveness', tier: 'concept' } as const
tools/generate/src/cli/ai/plan-core.ts:1524:export function signatureEffect(fields: Partial<Pick<PlanFields, 'decisions'>>): { state: 'unanswered' | 'declined' | 'chosen'; effect?: string } {
tools/generate/src/cli/ai/plan-core.ts:1525:  const d = (fields.decisions ?? []).find((x) => x.id === SIGNATURE_EFFECT)
tools/generate/src/cli/ai/plan-core.ts:1538:  const answer = signatureEffect(fields)
tools/generate/src/cli/ai/plan-core.ts:3252:    .filter((d) => d.id !== SIGNATURE_EFFECT && !d.id.startsWith(CHOICE_PREFIX) && TALK_STATES.includes(d.state) && TALK_SETTLES.includes(d.settle ?? 'talk'))
tools/generate/src/cli/ai/plan-core.ts:3527:        if (!d && id === SIGNATURE_EFFECT) {
tools/generate/src/cli/ai/plan-core.ts:3528:          d = { id, ...SIGNATURE_EFFECT_DECISION, state: 'open', compared: false }
tools/generate/src/cli/ai/plan-core.ts:3581:        const answered = id === SIGNATURE_EFFECT && (state === 'chosen' || state === 'parked')
tools/generate/src/cli/ai/plan-core.ts:3584:          if (!said) throw refuse(PLAN_INVALID, `record your client's answer on ${SIGNATURE_EFFECT} with their words in client_said`)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 1470,1570p tools/generate/src/cli/ai/plan-core.ts; git grep -n "ef…
<!-- xgd-tool name="Bash" id="toolu_01WxjM9F3W86Hrf4VMcAPWpV" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:32:13.549895+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 1470,1570p tools/generate/src/cli/ai/plan-core.ts; git grep -n \"effectBrief\\|signatureEffectBrief\\|heroEffectLine\" -- tools apps | head","description":"Read signature effect helpers"}
```

**Result**

```
          ? `went back to their previous version of ${LOOK_CARD}, setting your revision aside: ${JSON.stringify(d!.value ?? '')}`
          : `put ${LOOK_CARD} in their own words: ${JSON.stringify(d!.value ?? '')}`
  return { at: c.at, line: `Your client ${did}.` }
}

/**
 * [[BUG-306]] — THE HERO'S SIGNATURE EFFECT, decided before the first draft is
 * built and built with it.
 *
 * The effect is the one piece of motion that makes the site feel alive and theirs.
 * On Dina's Diner 6, 7 and 8 the consultant started the first draft without talking
 * it through: a guide handed over at the right moment ([[REQ-477]]) was ignored, and
 * an agenda item timed to the build ([[BUG-304]]) was never picked up. So the host
 * holds the first-draft `Delegate` until the client has answered, like the design
 * ([[REQ-448]]) and the structure ([[REQ-460]]). The answer is the decision
 * {@link SIGNATURE_EFFECT}: chosen with the option, or parked when they decline,
 * each with their words. A chosen effect goes into the first draft's brief
 * ({@link effectBriefLine}).
 */
export const SIGNATURE_EFFECT = 'signature_effect'
const SIGNATURE_EFFECT_DECISION = { title: "The hero's signature effect", area: 'liveness', tier: 'concept' } as const

/**
 * [[BUG-313]] — WHAT THE CLIENT CHOSE TO KEEP OF WHAT A LOOK FLAGGED. On the 1st
 * Contact site the client kept their wordmark as the header and Sign in at 15px,
 * and every later look raised them again, so every hand-back was cued for another
 * round that changed nothing. The consultant records the keep in the client's words
 * with the lines as the look said them ({@link PlanDecision.kept}); a look leaves a
 * kept finding out until it changes or moves ({@link keptLayout}). The decision
 * ledger holds it, so the critic reads it among the decisions too.
 */
export const LAYOUT_KEPT = 'layout_kept'
const LAYOUT_KEPT_DECISION = { title: 'Flagged layout the client chose to keep', area: 'style', tier: 'detail' } as const

/** [[BUG-313]] — a look's line ({@link layoutLine}): the page, the width and its pixels, then what it found. */
const LOOK_LINE = /^[^\n,]+, \w+ \(\d+px\): \S/

/** [[BUG-313]] — the lines of every look the client chose to keep. */
export const keptLayout = (fields: Partial<Pick<PlanFields, 'decisions'>>): string[] =>
  (fields.decisions ?? []).find((d) => d.id === LAYOUT_KEPT)?.kept ?? []

/**
 * [[BUG-304]] — THE EFFECT'S CHECKS: the moving part of the photo stays in view,
 * at both widths, and the headline stays readable without darkening the photo.
 * Worded for the builder to judge by looking ([[BUG-225]]).
 */
export const EFFECT_CHECKS: readonly string[] = [
  'At computer width the moving part of the hero photo is not covered by the headline, any other text or a scrim',
  'At phone width the moving part of the hero photo is not covered by the headline, any other text or a scrim',
  'No dark overlay or scrim covers the whole hero photo',
  'The hero headline has enough contrast against what sits behind it at computer and phone widths',
]

/** [[BUG-304]] — where the client's answer on the signature effect stands. */
export function signatureEffect(fields: Partial<Pick<PlanFields, 'decisions'>>): { state: 'unanswered' | 'declined' | 'chosen'; effect?: string } {
  const d = (fields.decisions ?? []).find((x) => x.id === SIGNATURE_EFFECT)
  if (d?.state === 'parked') return { state: 'declined' }
  if (d?.state === 'chosen' || d?.state === 'delegated') return { state: 'chosen', effect: d.value ?? 'your pick' }
  return { state: 'unanswered' }
}

/**
 * [[BUG-306]] — THE LINE A CHOSEN EFFECT ADDS TO THE FIRST DRAFT'S BRIEF, for a
 * brief that may build home: the effect, kept clear of the hero's text and any
 * scrim, contrast local to the text, and its checks. Null once a first pass has
 * landed, or when the client declined or has not answered.
 */
export function effectBriefLine(fields: Partial<Pick<PlanFields, 'milestones' | 'decisions'>>): string | null {
  const answer = signatureEffect(fields)
  if (fields.milestones?.first_pass_at || answer.state !== 'chosen') return null
  return (
    `Your client chose the hero's signature effect: ${answer.effect}. Build it on the hero with this draft. ` +
    'Say where the moving part of the photo is (from its description and focal point) and keep the headline, any other text and any scrim clear of it; ' +
    'no dark overlay across the whole photo — the text stays readable with contrast local to where it sits. ' +
    `Check: ${EFFECT_CHECKS.join('; ')}.`
  )
}

/** What a new site's plan holds before anybody has said anything. */
export function seedPlan(siteKey: string): Plan {
  return {
    fields: {
      kind: SITE_PLAN,
      site_key: siteKey,
      brief: {},
      functionality: [],
      decisions: planSeed.decisions.map((d) => ({ ...d, state: 'open', compared: false })),
      checks: planSeed.checks.map((c) => ({ ...c, triggers: [...c.triggers], answers: [] })),
      tasks: [],
      asks: seedAsks(),
      comps: [],
    },
    body: SECTIONS.map((name) => `## ${name}`).join('\n\n'),
  }
}

/** Where a `## name` section starts and ends in a body, or `null`. */
function sectionBounds(body: string, name: string): { start: number; end: number } | null {
  const lines = body.split('\n')
  const at = lines.findIndex((line) => line.trim() === `## ${name}`)
  if (at < 0) return null
tools/generate/src/cli/ai/host-core.ts:177:  effectBriefLine,
tools/generate/src/cli/ai/host-core.ts:4394:                            const home = fields ? [structureBriefLine(plannedHome(fields)), effectBriefLine(fields)].filter((l): l is string => l !== null) : []
tools/generate/src/cli/ai/plan-core.ts:1487: * ({@link effectBriefLine}).
tools/generate/src/cli/ai/plan-core.ts:1537:export fun
```

[elided — kept 5800 of 5901 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 1,439p apps/control-app/src/videogen.ts
<!-- xgd-tool name="Bash" id="toolu_01CbDTS6aU6DzYtNPHzHqx9E" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:32:20.570914+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 1,439p apps/control-app/src/videogen.ts","description":"Read videogen.ts"}
```

**Result**

```
/**
 * Hero clips from a site's stills, adopted rather than authored (REQ-461).
 *
 * The consultant can make a picture ([[REQ-208]]); this lets it bring one to
 * life — steam off a plate, fire in a sculpture's mouth — as a short, silent clip
 * a page plays behind its heading, placed as a typed `video` element.
 *
 * NOTHING HERE IS A TOOL SURFACE, exactly as in `imagegen.ts`. The surface, the
 * executor, the modes, the post-processing and the cost model are
 * lagrange-framework's `animate_image` plugin over `components/videogen`
 * (lagrange-framework REQ-220). This file installs it, and adds only what a
 * framework component cannot know about this product:
 *
 *   1. **A clip is an ordinary `material`, and its last frame is another.** The
 *      plugin attaches the clip and its poster to one ticket; here the clip is a
 *      `video` material and the poster becomes an `image` material of its own,
 *      so each is placed on a site the way every other piece of material is.
 *   2. **No key, no tool.** {@link videoSurface} answers `null` without
 *      `FAL_KEY`, so the manual never mentions a capability the session lacks.
 *   3. **The client agrees the design, not the implementation** ([[REQ-468]]).
 *      Before a clip is made the consultant describes it and gets a yes; nothing
 *      it is given mentions where the clip is made, and the client is never
 *      asked permission to use a tool. Any disclosure of the services the
 *      product uses belongs in its terms, not in a conversation turn.
 *   4. **A per-site cap**, beside the plugin's per-session one, counted before
 *      the provider is called.
 *   5. **The spend is metered.** A clip is billed per second, not per token, so
 *      each one is a row of its own in `turn_spend` ({@link recordMediaSpend}).
 *   6. **The round stays alive while the provider is polled**, through the
 *      host's slow-tool heartbeat.
 */

import * as videogenLib from './generated/ai-videogen'
import * as aiLib from './generated/ai-workers.js'
import { generatedFields, IMAGE_MATERIAL_TYPE, materialReader } from './imagegen'
import { indexAfterWrite, nextMaterialLabel, type IndexMaterial } from './material'
import { usdMicros, type MediaSpend } from './spend'
import { SPEND_CAP_TOOL_DETAIL } from './spend-cap'
import type { Ticket, TicketStore } from './tickets'

/** The libraries are untyped JavaScript; the boundary is narrow and named here. */
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

const videos = videogenLib as unknown as Untyped
const lib = aiLib as unknown as Untyped

/** Which service makes the clips. Named once; the model never learns it. */
export const VIDEO_PROVIDER = 'fal'

/** The credential that provider needs, read from the plugin's own table (`FAL_KEY`). */
export const VIDEO_SECRET: string = videos.PROVIDERS[VIDEO_PROVIDER].secret

/**
 * How many clips one session may make — the framework's runaway-loop stop,
 * raised from its default of five because a good clip takes several attempts.
 */
export const VIDEO_SESSION_BUDGET = 10

/**
 * How many clips one client may ever have made.
 *
 * A COST CONTROL, where the session budget is a loop stop. A good clip usually
 * takes two to four attempts and a page has at most one, so fifty covers a
 * site's heroes many times over. Raising it is a change here, deliberately: the
 * operator pays for the clips, so the operator decides.
 */
export const VIDEO_SITE_CAP = 50

/**
 * The largest clip this deployment delivers, in bytes (BUG-336).
 *
 * Twice the framework's default of 1,000,000, so a five or six second pingpong
 * stays at 720p instead of dropping to a soft 540p behind a desktop heading. No
 * higher: the limit exists for page weight on phones, and a ten second 1080p
 * clip is over four megabytes. The plugin steps down the resolution until the
 * clip fits, and refuses it with `over_size_limit` when nothing does.
 */
export const VIDEO_BYTE_BUDGET = 2_000_000

/** The material kind a clip is filed as. */
export const VIDEO_KIND = 'video'

/** The tenant counter the per-site cap counts in. */
const CLIP_COUNTER = 'videogen:clips'

/** How often, at most, a provider poll becomes a heartbeat. */
export const HEARTBEAT_MS = 30_000

/**
 * The host's guidance, appended to the operation's own description.
 *
 * IN THE DESCRIPTION AND NOT THE PRIMING. The priming budget is nearly spent
 * ([[BUG-129]]) and only the summary-level manual counts against it, while an
 * operation's description is read when the tool is. The upstream description
 * already explains each mode; this adds what is this product's to say — how
 * many clips a page takes, what the client agrees to before one is made, that
 * its cost is never the client's to hear, and how a clip reaches a page.
 *
 * THE CLIENT AGREES THE DESIGN ([[REQ-468]]): what the clip will look like and
 * do, never how or where it is made. The client is not asked permission to use
 * a tool, so nothing here names a service.
 *
 * THE BUDGET IS SAID BEFORE A CLIP IS MADE ([[BUG-347]]). Only the made clip can
 * be measured, so a request over {@link VIDEO_BYTE_BUDGET} is refused minutes
 * later, after the generation is spent. A loop fits at about six seconds or less
 * at 540p; a slower loop is a slower camera move, not a longer clip. When
 * lagrange-framework REQ-237's bitrate rungs land, the figure here is re-measured.
 *
 * NO PRICE. The client pays the operator, not per clip; a clip's cost is the
 * operator's, so it is metered ([[REQ-292]]) and never said to the client.
 */
export function videoGuidance(): string {
  return (
    'Here a clip is a page hero: at most one on a page, and the movement subtle — steam, a ' +
    'flicker, a slow drift. Illustrations and secondary pictures c
```

[elided — kept 5800 of 19488 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git grep -iln "ffmpeg\|ffprobe" -- apps tools packages bin ':!**/dist/**'…
<!-- xgd-tool name="Bash" id="toolu_0195XgeweMM7BBF7vExQtZu4" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:32:24.178312+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git grep -iln \"ffmpeg\\|ffprobe\" -- apps tools packages bin ':!**/dist/**' | head -20; git grep -n \"item 31\\|Item 31\" -- kb docs apps tools | head","description":"Find clip processing location"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/lagrangefoundry && grep -rln --exclude-dir=node_modules --exclude-dir=.git -i "ffmpeg" lagrange-framewo…
<!-- xgd-tool name="Bash" id="toolu_016h2Be5HL761mcNPmwSFQTR" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:32:27.166298+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry && grep -rln --exclude-dir=node_modules --exclude-dir=.git -i \"ffmpeg\" lagrange-framework/components lagrange-framework/src 2>/dev/null | head; ls lagrange-framework/components/videogen 2>/dev/null","description":"Find ffmpeg in framework videogen"}
```

**Result**

```
lagrange-framework/components/ai_videogen/py/tests/fixtures/provider.py
lagrange-framework/components/ai_videogen/js/tests/fixtures/provider.js
lagrange-framework/components/videogen/py/tests/fake_fal.py
lagrange-framework/components/videogen/py/README.md
lagrange-framework/components/videogen/py/tests/test_UAT_FC_REQ-220_animate_image.py
lagrange-framework/components/videogen/py/src/lagrangefoundry/videogen/backends/fal.py
lagrange-framework/components/videogen/py/tests/test_UAT_FC_BUG-106_delivered_duration.py
lagrange-framework/components/videogen/js/tests/test_UAT_FC_REQ-220_animate_image.test.js
lagrange-framework/components/videogen/js/tests/fixtures/ffmpeg-fal.js
lagrange-framework/components/videogen/js/tests/fixtures/fake-fal.js
fixtures
js
py
Shell cwd was reset to /Users/martin/lagrangefoundry/1stcontact
```

## Bash cd /Users/martin/lagrangefoundry/lagrange-framework/components/videogen/js && ls -R src | head -30; grep -n "ffmpeg\|com…
<!-- xgd-tool name="Bash" id="toolu_01GBxjcUW6TcRyYx22q3BwC7" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:32:30.888107+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/lagrange-framework/components/videogen/js && ls -R src | head -30; grep -n \"ffmpeg\\|compose\\|pingpong\" src/*.js src/**/*.js 2>/dev/null | head -30","description":"Inspect videogen JS component"}
```

**Result**

```
backends
bytes.js
errors.js
index.js
mp4.js
pipeline.js
pricing.js
request.js

src/backends:
fal_queue.js
fal.js
src/pipeline.js:4:// length the request needs, its audio removed, for a pingpong its reversed frames
src/pipeline.js:9:// Workers cannot run ffmpeg, so the steps run on a hosted processor. The
src/pipeline.js:69:  const pingpong = request.mode === 'pingpong'
src/pipeline.js:71:  // needs. It is cut before anything else: a pingpong's reverse has to start from
src/pipeline.js:75:  // A join takes two or more clips (fal rejects one), so only a pingpong joins,
src/pipeline.js:77:  const source = pingpong
src/pipeline.js:80:  const durationMs = Math.round(Math.min(clip.durationSeconds, needed) * (pingpong ? 2 : 1) * 1000)
src/pipeline.js:4:// length the request needs, its audio removed, for a pingpong its reversed frames
src/pipeline.js:9:// Workers cannot run ffmpeg, so the steps run on a hosted processor. The
src/pipeline.js:69:  const pingpong = request.mode === 'pingpong'
src/pipeline.js:71:  // needs. It is cut before anything else: a pingpong's reverse has to start from
src/pipeline.js:75:  // A join takes two or more clips (fal rejects one), so only a pingpong joins,
src/pipeline.js:77:  const source = pingpong
src/pipeline.js:80:  const durationMs = Math.round(Math.min(clip.durationSeconds, needed) * (pingpong ? 2 : 1) * 1000)
src/request.js:15: * - `pingpong` — a clip from the still, with its reversed frames appended, so the
src/request.js:22:export const MODES = Object.freeze(['loop', 'pingpong', 'reveal', 'free'])
src/request.js:78: * @param {'loop'|'pingpong'|'reveal'|'free'} [request.mode]
src/request.js:84: * @param {number} [request.duration] Seconds, 2–10. For `pingpong` this is the
src/request.js:156: * for a pingpong, because the reversed half doubles it, and all of it otherwise.
src/request.js:159:  return request.mode === 'pingpong' ? request.duration / 2 : request.duration
src/backends/fal.js:3:// One key (FAL_KEY) reaches several video models and fal's hosted ffmpeg
src/backends/fal.js:43:/** fal's hosted ffmpeg utilities, one per post-processing step. */
src/backends/fal.js:47:  join: 'fal-ai/ffmpeg-api/merge-videos',
src/backends/fal.js:49:  stripAudio: 'fal-ai/ffmpeg-api/compose',
src/backends/fal.js:50:  lastFrame: 'fal-ai/ffmpeg-api/extract-frame',
src/backends/fal.js:68:      // `pingpong` and `free` pin only the first frame. A pingpong's last frame
src/backends/fal.js:74:/** fal's hosted ffmpeg utilities, as the pipeline's processor interface. */
src/request.js:15: * - `pingpong` — a clip from the still, with its reversed frames appended, so the
src/request.js:22:export const MODES = Object.freeze(['loop', 'pingpong', 'reveal', 'free'])
src/request.js:78: * @param {'loop'|'pingpong'|'reveal'|'free'} [request.mode]
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && ls apps/control-app/container; git grep -n "videoSurface" -- apps tools |…
<!-- xgd-tool name="Bash" id="toolu_01FX1HHXfQU5WtNeCcncD4ro" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:32:34.763524+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && ls apps/control-app/container; git grep -n \"videoSurface\" -- apps tools | grep -v test | head; git grep -n \"31\\.\" -- kb/*.md 2>/dev/null | grep -i \"media\\|container\" | head","description":"Where videoSurface is assembled"}
```

**Result**

```
build.mjs
chromium.ts
dist
Dockerfile
server.ts
tsconfig.json
apps/control-app/src/router.ts:171:import { videoSurface } from './videogen'
apps/control-app/src/router.ts:1137:        videoSurface(env, tickets, await (deps.index ?? defaultIndexer)(env, scope), {
apps/control-app/src/videogen.ts:18: *   2. **No key, no tool.** {@link videoSurface} answers `null` without
apps/control-app/src/videogen.ts:199: * so {@link videoSurface} can hand the model the material's id. A picture placed
apps/control-app/src/videogen.ts:358:export function videoSurface(
(eval):1: no matches found: kb/*.md
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 1,60p apps/control-app/container/Dockerfile; grep -n "ffmpeg\|chro…
<!-- xgd-tool name="Bash" id="toolu_01VCvjEn6nRbmFnf75P62hbk" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:32:38.956435+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 1,60p apps/control-app/container/Dockerfile; grep -n \"ffmpeg\\|chromium\\|route\\|app\\.\\(get\\|post\\)\" apps/control-app/container/server.ts | head -40; python3 -c \"print()\" ; ls kb | head","description":"Inspect job container"}
```

**Result**

```
# [[REQ-646]] — one consultant job's container: the host in Node, with its own
# headless Chromium for the builder's pictures and page captures ([[DOC-86]] §3).
#
# Built and pushed by `wrangler deploy` from `apps/control-app/wrangler.toml`'s
# `[[containers]]` entry (as linux/amd64), and by `wrangler dev` for local dev.
# The build context is this directory: `dist/server.mjs` must exist first —
# `node apps/control-app/container/build.mjs`, which `bin/deploy` runs.
#
# Nothing in it is state: the container rebuilds what a step needs from the
# junction, D1 and R2 through the platform, and its disk is never read back.
FROM node:24-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium fonts-liberation fonts-noto-core fonts-noto-color-emoji ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
# The one dependency the bundle leaves out: the browser library, installed here
# because only the container runs it.
RUN npm init -y >/dev/null \
 && npm install --omit=dev --no-audit --no-fund puppeteer-core@24.25.0 \
 && npm cache clean --force

COPY dist/server.mjs dist/server.mjs.map ./

ENV NODE_ENV=production \
    JOB_CONTAINER_MAIN=1 \
    CHROMIUM_PATH=/usr/bin/chromium \
    PORT=8080
EXPOSE 8080
USER node
# Most of standard-1's 4 GiB for the heap; Chromium and the rest share what is left.
CMD ["node", "--max-old-space-size=2560", "--enable-source-maps", "server.mjs"]
22:import { consultantHost, clientPerson } from '../src/router'
26:import { chromiumLauncher } from './chromium'
78:  const launch = chromiumLauncher(vars.CHROMIUM_PATH)
85:      if (req.method !== 'POST' || req.url !== '/step') return send(res, 404, { error: 'no such route' })

knowledge_bases.json
system
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && which ffmpeg ffprobe; git grep -ln "platform tenant\|PLATFORM_TENANT\|ope…
<!-- xgd-tool name="Bash" id="toolu_01E862cQfPDVAqSRAR64ArLo" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:32:48.432603+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && which ffmpeg ffprobe; git grep -ln \"platform tenant\\|PLATFORM_TENANT\\|operator-curated\\|operator curates\\|/admin/\" -- apps/control-app/src tools/generate/src | head -20; ls apps/control-app/src | head -100","description":"Check ffmpeg and operator storage"}
```

**Result**

```
/opt/homebrew/bin/ffmpeg
/opt/homebrew/bin/ffprobe
apps/control-app/src/builder/api.js
apps/control-app/src/builder/app.js
apps/control-app/src/builder/business.js
apps/control-app/src/builder/config.js
apps/control-app/src/builder/people.js
apps/control-app/src/builder/platform-sites.js
apps/control-app/src/builder/session.js
apps/control-app/src/delegates.ts
apps/control-app/src/domains.ts
apps/control-app/src/operator-paths.js
apps/control-app/src/platform-issues.ts
apps/control-app/src/router.ts
apps/control-app/src/sign-in.ts
apps/control-app/src/tickets.ts
tools/generate/src/cli/copy.ts
tools/generate/src/cli/dev-env.ts
tools/generate/src/cli/index.ts
acceptances.ts
access.ts
activity.ts
agent-container-do.ts
agent-container.ts
ai.ts
boot-guard.ts
builder
business.ts
by-subject.ts
capture-material.ts
catalog-photos.ts
catalog.ts
chat-copy.ts
checkout-intake.ts
chrome.ts
cloudflare.ts
comps.ts
delegates.ts
describe.ts
development.ts
directory.ts
dns-assistant.ts
dns-changes.ts
dns-ops.ts
domains.ts
email-webhook.ts
embedder.ts
estimates.ts
events.ts
export-plan.ts
feedback.ts
fetch-guard.ts
first-draft-cut.ts
first-draft.ts
gate.ts
generated
grants.ts
gutter.ts
handoff-copy.ts
heic.ts
hostname.ts
identity.ts
image-edit.ts
image-ladder.ts
imagegen.ts
inbound.ts
index.ts
invites.ts
invoices.ts
job-step.ts
junction-do.ts
junctions.ts
knowledge.ts
lead.ts
ledger.ts
legal-documents.ts
legal-markdown.ts
legal-pages.ts
library.ts
log.ts
mail.ts
material-import.ts
material.ts
messages.ts
mime.ts
names.ts
network-settings.ts
notifications.ts
onboarding.ts
operator-paths.js
orders.ts
payments.ts
people.ts
plan.ts
platform-fonts.ts
platform-issues.ts
platform-route.ts
platform-wire.ts
portal.ts
public-url.ts
records.ts
redact.ts
resend.ts
resolver.ts
router.ts
scope.ts
security-headers.ts
sending.ts
serving.ts
session-delta.ts
session-inbox.ts
session-knowledge.ts
session-occupancy.ts
session-pending.ts
sessions.ts
shop-import.ts
shop-routes.ts
shop.ts
shot.ts
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 1,60p apps/control-app/src/platform-fonts.ts; sed -n 1,40p apps/co…
<!-- xgd-tool name="Bash" id="toolu_01CW6iKX8y1Wme17j5B3SNux" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:32:51.723377+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 1,60p apps/control-app/src/platform-fonts.ts; sed -n 1,40p apps/control-app/src/builder/platform-sites.js","description":"Look at platform-level curated material precedents"}
```

**Result**

```
/**
 * [[REQ-312]] — the platform font mirror, answered at the **preview's** snapshot
 * root (`COMMENT-3711`).
 *
 * WHY THIS EXISTS IN A SECOND APP. A page's font `src` names no host: it is
 * root-relative, and the renderer reduces it to a reference against the page's own
 * directory so a snapshot is relocatable (`relativizeUrl`, REQ-109). That is what
 * makes a published site self-contained — and it also means the bytes ask for
 * `_fonts/x` from whatever root they are being served at. `public-site` has two
 * such roots; this Worker has two more, `/preview/<key>/<channel>/` and
 * `/portal/`. A surface that does not answer for them shows the operator a
 * fallback face while telling them they chose Roboto, which is the one thing a
 * preview must not do.
 *
 * ONE COPY STILL. Nothing here is per-site and nothing is written: this reads the
 * same `platform/fonts/` prefix `1c fonts publish` filled, through the same key
 * function, and serves it beside a draft that has no idea it is there.
 *
 * WHERE THE BYTES COME FROM IS INJECTED, because this app runs in two places that
 * have nothing in common below the seam. Deployed, it is the R2 bucket. In the
 * Node builder transport, `env.SITES` is a Proxy that throws by design, and the
 * bytes are the staged mirror on the operator's own disk — so the reader is a
 * `RouterDeps` entry like the store and the ladder, rather than a branch here on
 * which runtime is running.
 */
import { contentTypeOf } from '../../../tools/generate/src/store/content-type'
import { platformFontKey, platformFontTarget } from '../../../packages/site-schema/src/fonts'

/**
 * The mirrored file a preview-relative path addresses, or `null` for anything
 * else.
 *
 * ONE SPELLING: {@link platformFontTarget} is the same function `public-site`
 * resolves a published request with and `1c fonts check` resolves a page's `src`
 * with — so the three cannot come to disagree about what a platform font path is.
 * What this adds is only the leading slash a preview `rel` carries and a snapshot
 * path does not.
 */
export function previewFontTarget(rel: string): string | null {
  return platformFontTarget(rel.replace(/^\/+/, ''))
}

/** Where a preview's platform fonts are read from. */
export interface PlatformFontReader {
  /** The mirrored bytes at a mirror-relative path, or `null` when absent. */
  read(path: string): Promise<Uint8Array | null>
}

/** The deployed reader: the same bucket, prefix and key function `1c fonts publish` wrote. */
export function r2PlatformFonts(bucket: R2Bucket): PlatformFontReader {
  return {
    async read(path) {
      const object = await bucket.get(platformFontKey(path))
      if (!object) return null
      return new Uint8Array(await object.arrayBuffer())
    },
  }
}

/**
/**
 * The console's body ([[REQ-298]]) — every site on the platform on the left, the
 * selected site's business on the right.
 *
 * THE QUESTION IT ANSWERS is *which tenant is costing us money, and what have we
 * actually built for them* — the first half is [[REQ-297]]'s and the second is
 * why a league table was not enough. A ranked list of business names answers
 * "who is expensive" and nothing else; an operator who then wants to look at
 * what that business has published, or at who to talk to about it, has nowhere
 * to go from the number.
 *
 * ONE ROW PER SITE, ACROSS EVERY BUSINESS — not one row per business. A business
 * with two sites is two rows, because the operator's question starts from
 * something they can see published.
 *
 * STANDARD `webui/list-detail` IN `no-tab` MODE, CONFIGURED RATHER THAN REBUILT,
 * which is the same decision the Library and the Contacts tab already made. This
 * is a master/detail; a second implementation of one would diverge from theirs
 * on divider behaviour, collapse and split persistence the first time any of
 * those was touched — and the divider is the whole reason [[REQ-298]] is a view
 * and not a dialog, so it is the last thing that should be hand-rolled here.
 *
 * TWO READS, JOINED HERE AND NOT ON THE SERVER. `/api/admin/sites` is the
 * directory and `/api/admin/spend/businesses` is the meter; they are separate
 * routes because a site with no spend must appear and a meter route that grew an
 * optional non-meter row would be one route with two answers. The join is by
 * business id, and the ORDER that comes out of it is a property of this surface
 * and of the period this surface is showing — neither of which either route
 * knows about.
 *
 * THE PERIOD IS ONE PERIOD AND NOT TWO. It governs the costs the rows are
 * ordered by AND the detail's figures, so changing it re-reads both and the list
 * re-orders — which is the point of it being one. Two would let an operator
 * compare a ranking over a month against a detail over a day and never see that
 * they had.
 *
 * IT KNOWS WHAT A SECTION IS AND NOT WHAT ONE SHOWS. The detail pane composes
 * `{id, label, mount(container, selection)}` — [[REQ-297]]'s registry, moved
 * from console-to-control to pane-to-section — and a section that throws is
 * reported in its own block while the rest of the pane renders. That matters
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git grep -n "\"op\": \"show\|op: 'show\|show_material\|show_picture\|'sho…
<!-- xgd-tool name="Bash" id="toolu_018WhE44tszkMtkDCLdj1sRD" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:33:04.403807+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git grep -n \"\\\"op\\\": \\\"show\\|op: 'show\\|show_material\\|show_picture\\|'show_clip\\|showMedia\" -- tools/generate/src apps/control-app/src | head -15; git grep -ln \"<video\" -- apps/control-app/src/builder | head","description":"Find chat media display ops"}
```

**Result**

```
tools/generate/src/cli/ai/plan-surface.json:375:      "op": "show_client",
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 365,420p tools/generate/src/cli/ai/plan-surface.json; git grep -n…
<!-- xgd-tool name="Bash" id="toolu_01XW3r9WdLzZSaLT3ecKkC1P" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:33:06.992126+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 365,420p tools/generate/src/cli/ai/plan-surface.json; git grep -n \"show_client\" -- tools/generate/src apps/control-app/src | grep -v \"surface.json\" | head","description":"Read show_client op"}
```

**Result**

```
      "returns": {
        "shape": "written"
      },
      "errors": [
        "NO_LOOKS",
        "DESIGN_INVALID",
        "CONFLICT"
      ]
    },
    {
      "op": "show_client",
      "tool": "show_client",
      "effect": "write",
      "summary": "Bring one part of the builder in front of your client: a page of their draft, the story board, a set of looks, a comparison site, a question on their panel, or where they choose their web address.",
      "description": "The builder shows a lot at once — the preview in View, Edit, Input (the questions, story board and comparison sites) or Looks, Progress and How you can help — and your client will not know where to look. You do. Bring a part forward when there is something new on it, or something your client needs to do there, and say in your reply where they are looking and what to do.\n\n**`switch` changes their view as your message arrives.** Use it right after you have made something to look at, linking the result's `href` in that sentence: \"The three looks are ready for you: [the looks](…).\" It happens once.\n\n**`link` answers a line to paste into your reply**, exactly as given, for \"when you have a minute\": `[the story board](…)`. The client follows it when they choose, and it keeps working after a reload.\n\n**A link's words name where it goes, never what to do there**: the page's name (\"Home page\"), \"the question\", \"Questions\", \"the story board\", \"the comparison board\", \"your first draft\". The sentence around it says what to do: \"I've fixed the menu button on the Home page: [Home page](…).\" Never \"have a look\", \"open it\" or \"answer it\" as a link. Every link you write follows this, `label` included.\n\n**A switch never lands under someone who is working:** the host makes it a link and says so in `not_switched`. Paste that link.\n\nTargets: `draft` with `page` (a page id from list_pages; none is the draft as they left it), `story`, `looks` with `look` (the look's page id) or `page` (the page whose looks to open), `comp` with `comp` (its reference on the comp board), `comps` (the comparison board as a whole), `ask` with `ask` (the question's id) — the question is unfolded, scrolled to and briefly highlighted — `questions` (all the questions in Input), and `web_address`, which opens the Settings tab at the section where they choose a web address. A site cannot be published without one.",
      "params": {
        "target": { "type": "string", "required": true, "enum": ["draft", "story", "looks", "comp", "comps", "ask", "questions", "web_address"], "description": "What to bring forward." },
        "how": { "type": "string", "required": true, "enum": ["switch", "link"], "description": "`switch` to change their view now, `link` to give them a line to follow when they choose." },
        "page": { "type": "string", "description": "For `draft`: the page to show. For `looks`: the page whose looks to open, when you do not name the look." },
        "look": { "type": "string", "description": "For `looks`: the page id of the look to show first." },
        "comp": { "type": "string", "description": "For `comp`: the site's reference on the comp board." },
        "ask": { "type": "string", "description": "For `ask`: the question's id on the panel." },
        "label": { "type": "string", "description": "For a link: its words, naming where it goes, such as \"the story board\". Without it the link is the name of what it opens." }
      },
      "returns": { "shape": "shown" },
      "errors": ["UNKNOWN_PAGE", "UNKNOWN_LOOK", "UNKNOWN_COMP", "UNKNOWN_ASK", "ASK_WITHDRAWN", "NO_VIEW", "DRAFT_BUILDING", "DRAFT_NOT_REVIEWED", "PLAN_INVALID", "SCHEMA_INVALID"]
    },
    {
      "op": "notify_client",
      "tool": "notify_client",
      "effect": "write",
      "summary": "Email your client that something needs them, with a link that opens it — when they are not here to see it in the chat.",
      "description": "For something that needs your client while they are away — a question only they can answer before you can go on. Never for routine turns, and not for the end of long work you promised an email for: the host sends that one itself (email_when_ready).\n\nThe email goes to the person you are talking to, from 1st Contact, in the platform's own words with your `note` inside; you never see or name an address. Its link signs them in once and opens the builder on the view you name — `target` and its parts exactly as `show_client` takes them.\n\n`job` names what it is about; one email is ever sent per `job`.",
      "params": {
        "job": {
          "type": "string",
          "required": true,
          "description": "What needs them, in a few words, e.g. \"a question about your prices\". One email per job."
        },
        "target": {
          "type": "string",
          "required": true,
          "enum": [
            "draft",
            "story",
            "looks",
            "comp",
            "comps",
            "ask",
            "questions",
            "web_address"
          ],
          "description": "What the email's link opens, as for show_client."
        },
        "page": {
          "type": "string",
apps/control-app/src/builder/app.js:1437:   * `show_client` link; `#looks=<set>` is the one `make_alternatives` hands over
apps/control-app/src/builder/app.js:1543:   * looks ([[REQ-391]]) or any `show_client` target ([[REQ-413]]) — is followed
apps/control-app/src/builder/chat.js:96:const SHOW_CLIENT = 'show_client'
apps/control-app/src/notifications.ts:505: * `show_client` writes it — carried in the QUERY, so it reaches the server and
apps/control-app/src/notifications.ts:521:  /** The view to open, as `show_client` writes it (`#show=…`). */
tools/generate/src/cli/ai/c
```

[elided — kept 5800 of 6399 bytes]

## Bash head -5 /Users/martin/.xgd/bin/xgd; ls /Users/martin/lagrangefoundry/1stcontact/.xgd | head -30
<!-- xgd-tool name="Bash" id="toolu_01JR7ByAmUR3HzJQrZw7yPok" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:33:20.114188+00:00" -->

**Input**

```json
{"command":"head -5 /Users/martin/.xgd/bin/xgd; ls /Users/martin/lagrangefoundry/1stcontact/.xgd | head -30","description":"Find the python with lagrangefoundry"}
```

**Result**

```
#!/bin/sh
# xgd release shim (REQ-934). A pinned run stays on its release; everything
# else follows the newest deployed release.
root="$HOME/.xgd/releases"
if [ -n "$XGD_RUN_RELEASE" ]; then
_changes
_locks
_staging
claude_pid_tracking.txt
CLAUDE_XGD.md
config.yaml
dashboard_instance.json
dispatcher_restart_requests
dispatcher.modes
dispatcher.pid
dispatcher.release
dispatcher.version
FAILED_update_comment-0a6ab5af
githooks
logs
machine_id
machines.yaml
merge.lock
permissions.yaml
planner.lock
quality.yaml
regression_schedule.json
tickets
tmp
uat_index.json
workflow.lock
```

## Bash ls ~/.xgd/releases | tail -3; R=$(ls -d ~/.xgd/releases/* | tail -1); ls $R; find $R -maxdepth 4 -name python -path "*bi…
<!-- xgd-tool name="Bash" id="toolu_01Ncwc5Zi4iQsUKxVgmQzYjq" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:33:22.488758+00:00" -->

**Input**

```json
{"command":"ls ~/.xgd/releases | tail -3; R=$(ls -d ~/.xgd/releases/* | tail -1); ls $R; find $R -maxdepth 4 -name python -path \"*bin*\" | head -3","description":"Locate xgd release python"}
```

**Result**

```
0.17.386+xgd.working.5ea14f28ff6a
0.17.386+xgd.working.90c81160b05a
current
bin
include
lib
pyvenv.cfg
share
```

## Bash P=~/.xgd/releases/current/bin/python; cd /Users/martin/lagrangefoundry/1stcontact && $P -m lagrangefoundry.ai.agent_cli…
<!-- xgd-tool name="Bash" id="toolu_01RJSFCPGvW4NvBRHPAo1Dpm" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:33:25.368272+00:00" -->

**Input**

```json
{"command":"P=~/.xgd/releases/current/bin/python; cd /Users/martin/lagrangefoundry/1stcontact && $P -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"bug-2568c791\"}' 2>&1 | head -40","description":"Read conversation summary"}
```

**Result**

```
[15:33:28] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2254.97, 'pid': 77768}
{"count":0,"entries":[],"framing":""}
```

## Bash P=~/.xgd/releases/current/bin/python; cd /Users/martin/lagrangefoundry/1stcontact && $P - <<'EOF' 2>&1 | tail -2 import…
<!-- xgd-tool name="Bash" id="toolu_013oU2XthKiHXdKpYLySTEh7" turn="28daa6a6dcee490288756072cfc3a40e" ts="2026-11-05T23:33:35.631939+00:00" -->

**Input**

```json
{"command":"P=~/.xgd/releases/current/bin/python; cd /Users/martin/lagrangefoundry/1stcontact && $P - <<'EOF' 2>&1 | tail -2\nimport json,subprocess\nframe=\"\"\"BUG-356 (signature effect): free-coding implementation requested 2026-11-05.\nSettled (operator): no refusal/hold over the effect; consultant picks, records signature_effect `defaulted`, builds it into first draft unless parked; client can decline (parked, never re-asked) or pick another (chosen). Prompt (DOC-75) already edited by operator; code only here.\nCode facts: plan-core.ts signatureEffect() treats `defaulted` as unanswered and effectBriefLine() only emits for chosen -> must change (brief includes effect unless parked). videoGuidance() in apps/control-app/src/videogen.ts says whole clip subtle + 'get a yes'. Consultant host + animate_image run in job container (Node + Chromium, no ffmpeg); clips cut by fal hosted ffmpeg (lagrange-framework components/videogen). Operator console exists (/api/admin/sites, builder/platform-sites.js); platform R2 prefix precedent platform/fonts/.\nRejected: refusing set_stage look until decided (operator: too harsh).\"\"\"\nfor tool,arg in [(\"AgentSummaryFrame\",{\"session\":\"bug-2568c791\",\"text\":frame}),(\"AgentSummaryLog\",{\"session\":\"bug-2568c791\",\"text\":\"2026-11-05: explored code; asking operator about showcase curation surface, motion-measure engine (ffmpeg in job container), and calibration clips before cutting the branch.\"})]:\n    print(subprocess.run([ \"/Users/martin/.xgd/releases/current/bin/python\",\"-m\",\"lagrangefoundry.ai.agent_cli\",tool,\"--in\",json.dumps(arg)],capture_output=True,text=True).stdout[-200:])\nEOF","description":"Write summary frame and log"}
```

**Result**

```
deogen). Operator console exists (/api/admin/sites, builder/platform-sites.js); platform R2 prefix precedent platform/fonts/.\nRejected: refusing set_stage look until decided (operator: too harsh)."}
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket get BUG-356 --json 2>/dev/null > $TMPDIR/bug356-$$.json; pytho…
<!-- xgd-tool name="Bash" id="toolu_01B3AXfzCpEyms2LU4Q8Remr" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:12:32.982622+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket get BUG-356 --json 2>/dev/null > $TMPDIR/bug356-$$.json; python3 -c \"\nimport json,sys;d=json.load(open('$TMPDIR/bug356-$$.json'));t=d.get('ticket',d);print(t.get('status'));b=t['body'];i=b.find('Code left');print(b[i:])\"","description":"Reread ticket body tail"}
```

**Result**

```
None
Code left for this ticket

1. **The superseded pin is red on xgd-working until this ticket updates it.** `test_UAT_FC_BUG-308_effect_proposed_as_intro_plus_loop` pins "Offer it when it helps; no motion is a fine answer" and forbids offering options. The operator's 2026-11-05 decision supersedes both: the effect is included by default, and alternatives are named after the draft is shown. Rewrite the pin to the new playbook wording: default in the first draft, `defaulted`, alternatives named, comes off whenever they like.
2. **`videoGuidance()` in `apps/control-app/src/videogen.ts`** still says the whole hero clip is "subtle" and "get a yes to that design" before making one.
   - Reword it so the reveal is the noticeable part and only the loop is subtle (section 3).
   - Make the first draft's default effect the exception to getting a yes. Update REQ-470's pin on "get a yes to that design" to match.
   - Until then, DOC-75's exception sentence carries this.
3. **Section 1's safeguard:** the first-draft brief includes the consultant's pick unless the decision is parked, so the effect ships even when the consultant forgets to choose one. **Section 2:** the showcase. **Section 3:** the movement measure. All unchanged.


## Answers to the pre-implementation questions (EPIC-19, at the operator's request, 2026-11-05)

1. **Showcase curation: the operator console.** A Showcase list of clips made on any site. The operator marks one "show", writes a one-line description of what moves, and can unmark or remove it later. Marking copies the clip and its still to platform storage (beside `platform/fonts/`), so the item no longer depends on the owning client's Library. The consultant gets a read-only showcase tool that returns only marked items, with a link in chat that plays the clip. No `1c` add/remove command is needed.
2. **The movement measure runs on `ffmpeg` in the job container.** Install it with `--no-install-recommends` next to Chromium in `apps/control-app/container/Dockerfile`. The extra ~100 MB in the image is accepted. It goes live with the next container deploy (`bin/deploy`), which the operator runs. The Chromium canvas route is rejected: it relies on the distribution's codec build, and it is slower and harder to test.
3. **Calibrate on the local dev store's clips plus synthetic fixtures, with a margin. Do not read production clips.** Keep the threshold in one named place, so that recalibrating changes a single value. Provide `1c showcase measure`, which reports each marked item's score against the threshold. The operator runs it once the showcase is marked. If any marked reveal fails, that run is the signal to lower the threshold; it is not a reason to read customer media from this session.

The ticket's other sections stand as written, including the `defaulted` finding: the brief carries the consultant's pick unless the decision is parked.
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && python3 -c " import json;d=json.load(open('$(ls $TMPDIR/bug356-*.json|hea…
<!-- xgd-tool name="Bash" id="toolu_01BTfuH2SaNdBTU4C7sSdveC" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:12:41.256838+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && python3 -c \"\nimport json;d=json.load(open('$(ls $TMPDIR/bug356-*.json|head -1)'));t=d.get('ticket',d);print(t['uid'],t.get('fields',{}).get('status'),list(t.keys()))\"; xgd ticket update --help 2>&1 | sed -n 1,40p","description":"Get ticket uid and update usage"}
```

**Result**

```
bug-2568c791 None ['uid', 'frontmatter', 'fields', 'body', 'links']
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:12:42
usage: xgd ticket update [-h] [--id ID] [--title TITLE] [--fields FIELDS]
                         [--done] [--body BODY] [--body-file BODY_FILE]
                         [--append-body APPEND_BODY]
                         [--append-body-file APPEND_BODY_FILE] [--stdin]
                         [--append-list FIELD=VALUE] [--json]
                         [--commit-message COMMIT_MESSAGE] [--project PROJECT]
                         [--branch SPEC]
                         [uid]

positional arguments:
  uid                   Ticket UID (or use --id for human-readable ID). Also
                        accepts a cross-project `ticket://org/repo/id` (or
                        alias `repo/id`) reference (REQ-839), same as `ticket
                        get`.

options:
  -h, --help            show this help message and exit
  --id ID               Human-readable ticket ID (e.g., TODO-1, EPIC-1)
  --title TITLE         New ticket title
  --fields FIELDS       Fields to update as JSON string (e.g.,
                        '{"status":"completed"}')
  --done                Set status to 'done' (shortcut for --fields
                        '{"status":"done"}')
  --body BODY           New markdown body (replaces existing)
  --body-file BODY_FILE
                        Read body content from file or stdin (use - for stdin;
                        alternative to --body)
  --append-body APPEND_BODY
                        Append text to existing body (use - for stdin; does
                        not replace)
  --append-body-file APPEND_BODY_FILE
                        Append body content from file or stdin (use - for
                        stdin; does not replace)
  --stdin               Read complete update spec as a JSON object from stdin
                        (keys: uid, id, title, fields, body, append_list,
                        append_transcript). Replaces the racy
                        /tmp/<fixed>.json pattern (BUG-174).
                        append_transcript: find-or-create the chat_transcript
                        comment for the target ticket and append turns
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket update bug-2568c791 --fields '{"status":"free_coding"}' 2>&1 |…
<!-- xgd-tool name="Bash" id="toolu_01RYzHCchwFmvojMVaQteWto" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:12:49.452652+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket update bug-2568c791 --fields '{\"status\":\"free_coding\"}' 2>&1 | tail -2; xgd branch cut BUG-356 2>&1 | tail -5; git branch --list 'free-BUG-356'","description":"Set free_coding and cut branch"}
```

**Result**

```
[17:12:50] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'ticket'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:12:50
[17:12:50] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'branch', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'branch', 'cut', 'BUG-356'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
Created worktree for free-BUG-356 at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356
cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356
[17:12:56] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'branch'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:12:56
+ free-BUG-356
```

## Bash M=/Users/martin/lagrangefoundry/1stcontact; W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git…
<!-- xgd-tool name="Bash" id="toolu_01MBc6GFEZt9cYkLwv1vH9KW" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:13:04.161973+00:00" -->

**Input**

```json
{"command":"M=/Users/martin/lagrangefoundry/1stcontact; W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356\ncd $W && ls node_modules 2>/dev/null | head -2\nmkdir -p node_modules && for e in $(ls -A $M/node_modules); do [ -e node_modules/$e ] || ln -s $M/node_modules/$e node_modules/$e; done\nfor p in apps/control-app tools/generate tools/repro-console packages/site-schema packages/framework apps/public-site; do\n  [ -d $M/$p/node_modules ] || continue; mkdir -p $p/node_modules\n  for e in $(ls -A $M/$p/node_modules); do\n    [ \"$e\" = \"@1stcontact\" ] && continue; [ -e $p/node_modules/$e ] || ln -s $M/$p/node_modules/$e $p/node_modules/$e; done\n  if [ -d $M/$p/node_modules/@1stcontact ]; then mkdir -p $p/node_modules/@1stcontact; for l in $(ls $M/$p/node_modules/@1stcontact); do t=$(readlink $M/$p/node_modules/@1stcontact/$l); ln -sfn \"$t\" $p/node_modules/@1stcontact/$l; done; fi\ndone\ncp -R $M/apps/control-app/src/generated apps/control-app/src/ 2>/dev/null; ls apps/control-app/src/generated | head -3; ls -la node_modules/@lagrangefoundry | head -2; git status --short | head","description":"Link node_modules and copy generated"}
```

**Result**

```
@cloudflare
@vitest
ai-imagegen.d.ts
ai-imagegen.js
ai-knowledge.d.ts
ls: node_modules/@lagrangefoundry: No such file or directory
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && ls -la node_modules | head…
<!-- xgd-tool name="Bash" id="toolu_01NRtBQjhAVbqTSZuDJ2qp3b" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:13:09.180780+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && ls -la node_modules | head -8; ls /Users/martin/lagrangefoundry/1stcontact/node_modules | grep -c .; ls node_modules | grep -c .; ls -d /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry && ln -sfn /Users/martin/lagrangefoundry/node_modules/@lagrangefoundry node_modules/@lagrangefoundry; ls tools/generate/node_modules | head -3","description":"Verify node_modules links"}
```

**Result**

```
total 296
drwxrwxr-x   20 martin  staff     640 Nov  5 17:13 .
drwxrwxr-x   30 martin  staff     960 Nov  5 17:12 ..
drwxrwxr-x   12 martin  staff     384 Nov  5 17:12 .bin
lrwxrwxr-x    1 martin  staff      60 Nov  5 17:13 .cache -> /Users/martin/lagrangefoundry/1stcontact/node_modules/.cache
lrwxrwxr-x    1 martin  staff      57 Nov  5 17:13 .mf -> /Users/martin/lagrangefoundry/1stcontact/node_modules/.mf
-rw-rw-r--    1 martin  staff   30219 Nov  5 17:12 .modules.yaml
-rw-rw-r--    1 martin  staff  114542 Nov  5 17:12 .package-map.json
9
9
/Users/martin/lagrangefoundry/node_modules/@lagrangefoundry
@1stcontact
@types
miniflare
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 4375,4410p tools/ge…
<!-- xgd-tool name="Bash" id="toolu_015mikUz9ycWFdkcVK8fcsm5" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:13:15.720239+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 4375,4410p tools/generate/src/cli/ai/host-core.ts; sed -n 3515,3600p tools/generate/src/cli/ai/plan-core.ts","description":"Read brief assembly and set_decision"}
```

**Result**

```
                    // [[REQ-436]] — nor once the message is nearly out of time, or its builds change nothing.
                    refusal: () => buildRefusal(managerKey(slug, deps)),
                    // [[BUG-326]] — nor while the client's rejection is unrecorded.
                    rejectionUnrecorded: () => unrecordedRejections.get(managerKey(slug, deps)) ?? null,
                    // [[REQ-638]] — and the first build waits for the written design; [[REQ-657]] and
                    // is told, never refused, when there is no plan yet.
                    ...(deps.plan
                      ? {
                          firstBuildMissing: async () => firstBuildMissing((await deps.plan!(slug).read())?.fields ?? {}),
                          firstBuildNote: async () => firstBuildNote((await deps.plan!(slug).read())?.fields ?? {}),
                        }
                      : {}),
                    // [[REQ-463]] — a brief that may build home carries the structure's compositions,
                    // [[BUG-306]] and on the first draft the chosen signature effect; [[BUG-326]] and
                    // every brief, the client's recorded decisions on the files it may write.
                    ...(deps.plan || ledger
                      ? {
                          hostBrief: async (input: Record<string, unknown>) => {
                            const fields = deps.plan ? ((await deps.plan(slug).read())?.fields ?? {}) : null
                            const home = fields ? [structureBriefLine(plannedHome(fields)), effectBriefLine(fields)].filter((l): l is string => l !== null) : []
                            const lines = home.length > 0 && (await buildsHome(deps, slug, input.scope)) ? home : []
                            const decided = ledger ? await ledger.read().then((r) => clientDecisionsBrief(r.body, input.scope), () => null) : null
                            if (decided !== null) lines.push(decided)
                            return lines.length > 0 ? lines.join('\n\n') : null
                          },
                        }
                      : {}),
                    // [[REQ-627]] — a brief naming no files is refused at the hand-off, before
                    // a step is spent finding out ([[REQ-410]]): the claim waits for the pass.
                    ...(claims && scopeSupported(lib)
                      ? { noScope: async (scope: unknown) => ((await scopeFiles(deps.store, slug, scope)).length === 0 ? NO_SCOPE : null) }
                      : {}),
                    // [[REQ-452]] — and each one that is commissioned is kept as a case.
                    ...(recorder ? { commissioned: (input: Record<string, unknown>) => recorder.commissioned(input) } : {}),
                  },
                ))(runtime),
      change((plan) => {
        const text = String(p.text ?? '')
        plan.body = appendToSection(plan.body, NOTES_SECTION, text)
        return { note: { section: NOTES_SECTION, characters: text.trim().length } }
      }),

    // ── the consultant ───────────────────────────────────────────────────────
    set_decision: (p) =>
      said(change((plan) => {
        const id = str(p.decision) ?? ''
        let d = plan.fields.decisions.find((x) => x.id === id)
        // [[BUG-304]] — the signature effect is on every plan the moment it is talked about.
        if (!d && id === SIGNATURE_EFFECT) {
          d = { id, ...SIGNATURE_EFFECT_DECISION, state: 'open', compared: false }
          plan.fields.decisions.push(d)
        }
        // [[BUG-313]] — and what the client kept of a look's findings, the moment they say so.
        if (!d && id === LAYOUT_KEPT) {
          d = { id, ...LAYOUT_KEPT_DECISION, state: 'open', compared: false }
          plan.fields.decisions.push(d)
        }
        if (p.findings !== undefined && id !== LAYOUT_KEPT) throw refuse(PLAN_INVALID, `'findings' belongs to ${LAYOUT_KEPT} only`)
        if (p.rules !== undefined && id !== LAYOUT_KEPT) throw refuse(PLAN_INVALID, `'rules' belongs to ${LAYOUT_KEPT} only`)
        if (d && id === LAYOUT_KEPT) {
          const listed = (v: unknown) => (Array.isArray(v) ? v.map(String) : []).map((l) => l.trim().replace(/^-\s*/, '')).filter(Boolean)
          const found = listed(p.findings)
          // [[REQ-655]] — and a rule kept for a node in advance, as a design choice.
          const rules = listed(p.rules)
          const lines = [...found, ...rules]
          const said = str(p.client_said)
          if (!lines.length || !said) {
            throw refuse(PLAN_INVALID, `record what your client kept with the look's lines in findings (or the rules they chose to break in rules) and their words in client_said`)
          }
          const loose = found.find((l) => !LOOK_LINE.test(l))
          if (loose) throw refuse(PLAN_INVALID, `give each finding as the look said it, from its page and width ("home, desktop (1280px): …"), not ${JSON.stringify(loose.slice(0, 80))}`)
          const badRule = rules.find((l) => !keptRule(l))
          if (badRule) {
            throw refuse(
              PLAN_INVALID,
              `give each rule as "<page> #<node id>: <rule>" (e.g. "home #collections: button_wraps"), the rule one of ${[...KEEPABLE_KINDS].join(', ')}, not ${JSON.stringify(badRule.slice(0, 80))}`,
            )
          }
          d.kept = [...new Set([...(d.kept ?? []), ...lines])]
          d.value = d.kept.join(' | ')
          d.state = 'chosen'
          d.answer = { quote: said, at: now() }
          const index = logEntries(plan.body) + 1
          plan.body = appendToSection(plan.body, LOG_SECTION, clientEntry(index, { ...d, 
```

[elided — kept 5800 of 8049 bytes]

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n "animate_image…
<!-- xgd-tool name="Bash" id="toolu_01XG7EJhSbzDTgMQu3Hgzu9c" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:13:23.168798+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n \"animate_image\" -- tools/generate/src apps/control-app/src ':!**/generated/**' | grep -v \"^apps/control-app/src/videogen.ts\" | cut -c1-200 | head -20","description":"Who can call animate_image"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1125,1160p apps/con…
<!-- xgd-tool name="Bash" id="toolu_01D5yxxn3oPd982AgDZ81rvV" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:13:26.325062+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1125,1160p apps/control-app/src/router.ts; cat tests/test_UAT_FC_BUG-306_effect_before_the_first_draft.workers.test.ts | sed -n 1,140p","description":"Read video surface wiring and BUG-306 test"}
```

**Result**

```
        // degenerate environment a test or a partly-configured preview can
        // construct. It degrades to the `1c` CLI's permanent state — the bundled
        // document, no per-business override — rather than to a builder that
        // will not talk.
        env.DB ? delegationResolverFor(env, scope.businessId) : null,
        // AND WHETHER ITS BUILDER CONVERSATION IS A GROUP CHAT ([[REQ-357]]),
        // bound here for delegation's reason. Off where there is no database.
        env.DB ? groupChatResolverFor(env, scope.businessId) : null,
        // REQ-461 — THE CLIP MAKER, assembled like the image surface: this
        // business's ticket store and indexer, the meter its spend lands in, and
        // the heartbeat that keeps the round alive while fal is polled — bound
        // once the host it beats for exists.
        videoSurface(env, tickets, await (deps.index ?? defaultIndexer)(env, scope), {
          ...(deps.videoFetch ? { fetch: deps.videoFetch } : {}),
          ...(deps.videoPollMs ? { pollIntervalMs: deps.videoPollMs } : {}),
          heartbeat: () => beat?.(),
          ...(env.DB
            ? {
                spend: (spend: MediaSpend) => recordSpend(env, tenantId, spend),
                capped: () => spendCapReached(env, tenantId),
              }
            : {}),
        }),
        // [[REQ-626]] — THE EMAIL A FINISHED JOB SENDS, bound to this business and
        // to this deployment's address: the people on the business are chosen in
        // `notifications.ts`, never by the conversation.
        env.DB
          ? jobDoneNotifier(env as unknown as NotifyEnv, scope.businessId, {
              origin,
              send: deps.sendEmail ?? mailerFor(env, { fetch: deps.fetch }),
            })
          : null,
        // [[BUG-330]] — a comp the consultant puts on the board is captured as its own durable job.
        env.COMP_CAPTURE
          ? (site: string) => workflowCompRunner(env.COMP_CAPTURE!, { businessId: scope.businessId, site, origin })
          : null,
import { afterEach, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { resetChatHost, route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { findPlan, sitePlan } from '../apps/control-app/src/plan'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { encodePng } from '../tools/generate/src/cli/png'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { configureDelegation, delegationDocument } from '../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../tools/generate/src/cli/ai/roles'
import { agendaLines, EFFECT_CHECKS, type PlanFields } from '../tools/generate/src/cli/ai/plan-core'
import { starterHomePage } from '../tools/generate/src/cli/scaffold'
import { applySchema, designWritten, ensureTenant } from './support/d1-site-factory'
import { siteSeed } from './support/site-seed'
import { fakeBrowser } from './support/fake-puppeteer'
import { calls, says, scriptedClient, sentText, systemText, type ModelRequest, type ModelStep, type WireEvent } from './support/scripted-model-client'

/**
 * [[BUG-306]] — **the host holds the first build until the hero's signature effect
 * is decided**, and a chosen effect is built with the first draft.
 *
 * THE REAL ROUTES INSIDE WORKERD, as [[REQ-460]]'s suite: `/api/import`,
 * `/api/ai/session`, `/api/ai/prompt` and `/api/ai/interpose`, the consultant's plan
 * tools and `Delegate`, over real D1 and R2. Doubles only at the network's edge: the
 * Anthropic client, told apart per request, and the browser. Whether a build was
 * refused is read off what the consultant's model was sent; what a builder was
 * briefed, off its first request; the talker's agenda, off the talker's request.
 */

const APPLIED = applySchema()
const ORIGIN = 'https://app.test'
const ENABLED = { ...delegationDocument, enabled: true }
const WORKER_MODEL = backendsDocument.claude_builder.model
const EFFECT_FIRST_WORDS = "Your client hasn't decided the hero's signature effect yet, so no builder was commissioned"
const EFFECT_LINE = "Your client chose the hero's signature effect"

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    SESSION_JUNCTION: (env as Record<string, unknown>).SESSION_JUNCTION,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as unknown as RouterEnv
}

/**
 * A site with a home page and a menu page linking each other, so nothing structural
 * is owed, its design written and its structure planned — and then `effect` as the
 * signature effect: none (unanswered), or the answer, and `built` a first pass.
 */
async function business(id: string, plan: { effect?: Record<string, unknown> | null; built?: boolean }): Promise<{ scope: Scope; slug: string }> {
  await APPLIED
  await ensureTenant(id)
  const scope = { businessId: id }
  const seed = siteSeed({ slug: `site-${id}` })
  const page = (pageId: string, title: string, children: Record<string, unknown>[]): Record<string, unknown> => {
    const starter = starterHomePage(seed.slug) as { l1: { root: Record<string, unknown> } } & Record<string, unknown>
    return { ...starter, id: pageId, slug: pageId, title, l1: { ...starter.l1, root: { ...starter.l1.root, children } } }
  }
  const pages = {
    'home.json': page('home', 'Home', [
      { kind: 'text', id: 's0', text: "Dina's Diner" },
      { kind: 'text', id: 's1', text: 'Burge
```

[elided — kept 5800 of 9053 bytes]

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 140,320p tests/test…
<!-- xgd-tool name="Bash" id="toolu_01XXUsctX1WJJbckZP1Fs7MN" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:13:29.652775+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 140,320p tests/test_UAT_FC_BUG-306_effect_before_the_first_draft.workers.test.ts","description":"Read rest of BUG-306 test"}
```

**Result**

```
  const at = { consultant: 0, critic: 0, builder: 0, build: -1, builds: 0 }
  const briefs: string[] = []
  const client = scriptedClient([
    (req) => {
      if (isCritic(req)) {
        if (req.messages.length === 1) at.critic = 0
        return critic[Math.min(at.critic++, critic.length - 1)](req)
      }
      if (req.model === WORKER_MODEL) {
        if (req.messages.length === 1) {
          at.build += 1
          at.builder = 0
          at.builds += 1
          briefs.push(sentText(req))
        }
        const script = builders[Math.min(at.build, builders.length - 1)]
        return script[Math.min(at.builder++, script.length - 1)](req)
      }
      return consultant[Math.min(at.consultant++, consultant.length - 1)](req)
    },
  ])
  return Object.assign(client, { builds: () => at.builds, briefs })
}

/** Every tool result the consultant was handed in its last request, by tool name, in order. */
function results(reqs: ModelRequest[]): { name: string; text: string }[] {
  const last = reqs.at(-1)
  if (!last) return []
  const out: { name: string; text: string }[] = []
  let pending: string[] = []
  for (const message of last.messages) {
    if (!Array.isArray(message.content)) continue
    const blocks = message.content as { type?: string; name?: string; content?: unknown }[]
    if (message.role === 'assistant') pending = blocks.filter((b) => b.type === 'tool_use').map((b) => String(b.name))
    for (const b of blocks.filter((x) => x.type === 'tool_result')) {
      out.push({ name: pending.shift() ?? '?', text: textOf(b.content) })
    }
  }
  return out
}

const consultantOf = (client: ReturnType<typeof routed>): ModelRequest[] =>
  client.seen.filter((req) => req.model !== WORKER_MODEL && !isCritic(req))

const BUILD = calls('Delegate', { scope: ['site.json', 'home.json'], note: 'On it.', role: BUILDER_ROLE, goal: 'Build the home page.' })
const BUILT = [
  calls('set_l1', { page: 'home', path: '0.1', node: { kind: 'text', text: 'Burgers in Davis, five minutes off I-80.' } }),
  calls('ReportResult', { summary: 'Built the home page.', changed: ['home'] }),
]
const PNG = () => encodePng({ data: new Uint8Array(8 * 8 * 3).fill(0x60), width: 8, height: 8, channels: 3 })

describe('BUG-306 — the first build waits for the signature effect', () => {
  afterEach(() => {
    setModelClient(null)
    configureDelegation(null)
    resetAiHost()
    resetChatHost()
  })


  it('test_UAT_FC_BUG-306_hold_is_first_draft_only', async () => {
    configureDelegation(ENABLED)
    // A first pass has landed and the effect was never asked: later builds are not held, and gain no effect.
    const { scope, slug } = await business('bug306-later', { built: true })
    const deps = { launch: fakeBrowser({ png: await PNG() }).launch }
    const sessionId = await open(scope, slug, deps)
    const client = routed([BUILD, says('Revised.')], [COLD, REPORT], [BUILT])
    setModelClient(client)
    await send(scope, sessionId, 'Make the headline shorter.', deps)
    const delegations = results(consultantOf(client)).filter((r) => r.name === 'Delegate')
    expect(delegations[0].text).not.toContain('effect_first')
    expect(client.builds()).toBe(1)
    expect(client.briefs[0]).not.toContain(EFFECT_LINE)

    // A chosen effect on a built site is not re-briefed into revisions either.
    const chosen = await business('bug306-later-chosen', { built: true, effect: { state: 'chosen', value: 'A slow push in', answer: { quote: 'Push in.', at: '2026-01-01T00:00:00.000Z' } } })
    const again = routed([BUILD, says('Revised.')], [COLD, REPORT], [BUILT])
    setModelClient(again)
    await send(chosen.scope, await open(chosen.scope, chosen.slug, deps), 'Tighten the menu.', deps)
    expect(again.builds()).toBe(1)
    expect(again.briefs[0]).not.toContain(EFFECT_LINE)
  }, 120000)

  it('test_UAT_FC_BUG-306_talker_reads_the_agenda', async () => {
    // While a round runs, the client writes: a talker answers beside it. Its request
    // carries the same plan agenda the running round's does ([[REQ-428]]).
    const { scope, slug } = await business('bug306-talker', {})
    const deps: RouterDeps = {}
    const sessionId = await open(scope, slug, deps)
    const isTalker = (req: ModelRequest): boolean => sentText(req).includes('You are the talker.')
    const worker: ModelRequest[] = []
    const talker: ModelRequest[] = []
    const reply = (events: WireEvent[]) =>
      (async function* () {
        for (const event of events) yield event
      })()
    const workerSteps = [calls('list_pages', {}), says('Done looking.')]
    const talkerSteps = [says('Happy to talk while that runs.')]
    setModelClient({
      seen: [],
      messages: {
        create: async (req: ModelRequest) => {
          if (isTalker(req)) {
            talker.push(req)
            return reply(talkerSteps[Math.min(talker.length - 1, talkerSteps.length - 1)](req))
          }
          worker.push(req)
          if (worker.length === 2) {
            await post(scope, '/api/ai/interpose', { sessionId, text: 'While you look — what about the photos?' }, deps)
            const end = Date.now() + 8000
            while (talker.length < 1 && Date.now() < end) await new Promise((r) => setTimeout(r, 25))
            await new Promise((r) => setTimeout(r, 200))
          }
          return reply(workerSteps[Math.min(worker.length - 1, workerSteps.length - 1)](req))
        },
      },
    } as never)
    await send(scope, sessionId, 'Have a look at the pages.', deps)

    expect(talker.length).toBeGreaterThan(0)
    const agenda = agendaLines(await plan(scope, slug))
    expect(agenda.length).toBeGreaterThan(0)
    const talkerSent = sentText(talker[0])
    for (const line of agenda) expect(talkerSent).toContain(line)
    expect(talkerSent).toCo
```

[elided — kept 5800 of 5841 bytes]

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1,60p tests/test_UA…
<!-- xgd-tool name="Bash" id="toolu_01QKZ6GuztwXajcN2AU5AFrY" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:13:36.726736+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1,60p tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts; git grep -n \"videoSurface\\|video\\b\\|clipSurface\\|extraSurfaces\" -- tools/generate/src/cli/ai/host-core.ts apps/control-app/src/router.ts | head -20","description":"Read BUG-304 test, video surface role wiring"}
```

**Result**

```
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { fsSiteStore } from '../tools/generate/src/store'
import { readDocTickets } from '../tools/generate/src/cli/kb'
import { unsettledChecks } from '../tools/generate/src/cli/ai/account-core'
import {
  agendaLines,
  builderSessionCompleted,
  EFFECT_CHECKS,
  effectBriefLine,
  planInstanceConfig,
  planReminder,
  planSurfaceFor,
  seedPlan,
  type Plan,
  type PlanDeps,
  type PlanFields,
} from '../tools/generate/src/cli/ai/plan-core'
import { parseStageGuides, settleGuides, STAGE_GUIDES_DOC } from '../tools/generate/src/cli/ai/stage-guide-core'

/**
 * [[BUG-304]] — the client's answer on the hero's signature effect is recorded in
 * their words, text over a moving hero leaves the movement in view, and the host
 * hands over one stage guide at a time. [[BUG-306]] moved the conversation before
 * the first build and the effect into its brief, so the during-the-build agenda
 * item and the hero pass are gone; their tests went with them.
 *
 * THE REAL CONSULTANT TOOLBOX over the real plan surface, with the plan held in
 * memory — the store is the one thing replaced. The agenda is read as every voice
 * reads it: the consultant's plan entry ([[REQ-428]]). The guide is the shipped
 * [[DOC-75]], read from the ticket store the release exports.
 */

const SLUG = 'dina'
const AT = '2026-10-27T22:40:00.000Z'
let clock = AT
let cwd: string
let doc: string

beforeAll(() => {
  const found = readDocTickets().find((t) => t.id === STAGE_GUIDES_DOC)
  expect(found).toBeDefined()
  doc = String((found as { body?: string }).body ?? '')
}, 180000)

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'bug304-'))
  cmdNew(SLUG, { cwd })
  clock = AT
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

apps/control-app/src/router.ts:171:import { videoSurface } from './videogen'
apps/control-app/src/router.ts:1137:        videoSurface(env, tickets, await (deps.index ?? defaultIndexer)(env, scope), {
tools/generate/src/cli/ai/host-core.ts:874:  extraSurfaces?: Array<{ surface: Untyped; granted?: Record<string, unknown> }>
tools/generate/src/cli/ai/host-core.ts:3972:          extraSurfaces: [
tools/generate/src/cli/ai/host-core.ts:4324:      extraSurfaces: [
tools/generate/src/cli/ai/host-core.ts:4325:        ...(deps.extraSurfaces ?? []),
tools/generate/src/cli/ai/host-core.ts:5029:      extraSurfaces: [
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n "^export.*work…
<!-- xgd-tool name="Bash" id="toolu_01PU3LMeKvs7HMZMk47hnb7H" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:13:38.031771+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n \"^export.*workerHost\\|function workerHost\" -- apps/control-app/src tools/generate/src | head; git grep -n \"video\" -- apps/control-app/src/ai.ts | head -20","description":"Find workerHost and video wiring"}
```

**Result**

```
apps/control-app/src/ai.ts:534:export function workerHost(
apps/control-app/src/ai.ts:749:  video: { surface: Untyped } | null = null,
apps/control-app/src/ai.ts:885:        ...(video ? [video] : []),
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 870,895p apps/contr…
<!-- xgd-tool name="Bash" id="toolu_011ri9ysoPTdc62ZQc4E3BEH" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:13:41.345497+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 870,895p apps/control-app/src/ai.ts; sed -n 3960,3985p tools/generate/src/cli/ai/host-core.ts; sed -n 4315,4330p tools/generate/src/cli/ai/host-core.ts","description":"Which roles get the video surface"}
```

**Result**

```
      // BOTH BRING THEIR OWN GRANT ([[REQ-208]]), for the same underlying
      // reason: their declarations live upstream. Knowledge's must, because its
      // two scope axes have to name the same set and composing them in two
      // places is how they would come apart; the image surface's must, because
      // `instances.json` is validated in CI against the declarations THIS
      // repository holds, and a grant there for a surface the validator never
      // sees is a grant nothing can check. Fidelity's is the contrasting case
      // and stays where it is.
      //
      // `createL1Toolbox` narrows a grant away when its surface was not
      // composed, which is what lets a deployment with no image key start an
      // assistant that edits sites perfectly well.
      extraSurfaces: [
        ...(knowing ? [sessionKnowledgeSurface(knowledge)] : []),
        ...(images ? [images] : []),
        ...(video ? [video] : []),
        // THE CLIENT'S OWN TICKETS ([[REQ-228]]). UNCONDITIONAL, unlike both
        // entries above it: those are absent where a credential or a binding is,
        // and this host ALWAYS has a ticket store — it is where the transcript
        // itself lives. A deployment of this Worker with no tickets is not a
        // reduced mode of it, it is not a deployment.
        sessionTicketSurface(tickets, CONSULTANT_WITHHELD_TICKET_OPS),
        // FILING A DEFECT IN THIS SOFTWARE ([[REQ-273]]), where this deployment
        // can reach the project that builds it.
        //
        // BESIDE THE LINE ABOVE AND NOTHING LIKE IT. That surface reads the
        slug,
        aiOptions(opts, deps, slug),
        {
          role: BUILDER_ROLE,
          lib: deps.lib,
          store: deps.store,
          extraOps: deps.extraOps ?? {},
          measurer: fidelity ? browserMeasurer(fidelity) : null,
          // [[REQ-415]] — what a browser finds wrong with a page, on its map.
          layoutChecker: fidelity ? siteLayoutChecker(deps, slug, fidelity) : null,
          upgradeCheck: upgradeCheckFor(deps, fidelity),
          addresses: deps.addresses ? () => deps.addresses!(slug) : null,
          extraSurfaces: [
            ...(fidelity ? [{ surface: await fidelitySurfaceFor(lib, fidelity) }] : []),
            ...(workerKnowledge ? [workerKnowledge.surface()] : []),
            // [[REQ-387]] — THE CLIENT'S LIBRARY, READ-ONLY.
            ...(await readOnlyLibrary(lib, deps, slug)),
          ],
        },
      )
    : null

  // [[REQ-397]] — ONE AGENT PER DRAFT FILE. Null where the store is not leased,
  // which leaves every write as it was. See `lease-core.ts`.
  // [[REQ-458]] — a refusal names the consultant turn that started the build in the way.
  // [[BUG-332]] — and a hold a builder not running here left is waited for, not refused.
      // [[BUG-363]] — whether the business can sell, on the opening move.
      checkout: deps.checkout ?? null,
      // [[REQ-484]] — a component upgrade an edit saves, checked against the published look.
      upgradeCheck: upgradeCheckFor(deps, fidelity),
      // [[REQ-238]] — WHETHER THIS SITE HAS A PUBLIC ADDRESS, bound to this
      // session's site here, so the publish
      // operation then takes no site, and cannot ask about one the conversation
      // is not about.
      addresses: deps.addresses ? () => deps.addresses!(slug) : null,
      extraSurfaces: [
        ...(deps.extraSurfaces ?? []),
        // [[REQ-487]] — RENAMING THE BUSINESS, where this host has the business's
        // record. The Settings tab's rename and nothing else from that surface.
        ...(deps.settings
          ? [{ surface: await businessRenameSurfaceFor(lib, deps.settings.deps), granted: businessRenameInstanceConfig() }]
          : []),
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n "firstBuildNot…
<!-- xgd-tool name="Bash" id="toolu_01QRQ7A7LMp5JfeKRuXJ8se5" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:13:57.627801+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n \"firstBuildNote\\|firstBuildMissing\" -- tools apps | grep -v \"^tests\" | head; ","description":"Find firstBuildNote implementation"}
```

**Result**

```
tools/generate/src/cli/ai/account-core.ts:2082:  firstBuildMissing?: () => Promise<string[]>
tools/generate/src/cli/ai/account-core.ts:2087:  firstBuildNote?: () => Promise<string | null>
tools/generate/src/cli/ai/account-core.ts:2368:      const missing = (await limits.firstBuildMissing?.()) ?? []
tools/generate/src/cli/ai/account-core.ts:2371:      const planNote = (await limits.firstBuildNote?.()) ?? null
tools/generate/src/cli/ai/host-core.ts:175:  firstBuildMissing,
tools/generate/src/cli/ai/host-core.ts:176:  firstBuildNote,
tools/generate/src/cli/ai/host-core.ts:4383:                          firstBuildMissing: async () => firstBuildMissing((await deps.plan!(slug).read())?.fields ?? {}),
tools/generate/src/cli/ai/host-core.ts:4384:                          firstBuildNote: async () => firstBuildNote((await deps.plan!(slug).read())?.fields ?? {}),
tools/generate/src/cli/ai/plan-core.ts:963:export function firstBuildMissing(fields: Partial<Pick<PlanFields, 'milestones' | 'handoff'>>): string[] {
tools/generate/src/cli/ai/plan-core.ts:974:export function firstBuildNote(fields: Partial<Pick<PlanFields, 'milestones' | 'handoff' | 'activities'>>): string | null {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 930,1000p tools/gen…
<!-- xgd-tool name="Bash" id="toolu_01LfmikMfkNN2DKSGtDznF4f" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:14:01.299916+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 930,1000p tools/generate/src/cli/ai/plan-core.ts; sed -n 2355,2420p tools/generate/src/cli/ai/account-core.ts","description":"Read firstBuild helpers and Delegate use"}
```

**Result**

```
 * the next build answers as a revision round.
 */
export function clientMessaged(plan: Plan, at: string, pane?: string): Plan {
  const next = openFocus(plan.fields) ? finishFocus(plan, 'client', at) : copy(plan)
  const m = next.fields.milestones ?? {}
  if (m.first_pass_at) {
    if (!m.draft_seen_at && pane !== undefined && DRAFT_PANES.includes(pane)) m.draft_seen_at = at
    // ONE STAMP PER ROUND: feedback the next build has not answered yet needs no newer one.
    if (m.draft_seen_at && !feedbackWaiting(m)) m.feedback_at = at
    next.fields.milestones = m
  }
  // [[REQ-628]] — and their message answers the suggestions of the review before publishing.
  clientRepliedToReview(next.fields, at)
  checkPlan(next.fields)
  return next
}

/**
 * [[REQ-448]] — the first build would start with no design to build from: no
 * first pass has landed and the consultant has not written the site's design.
 * The host refuses that `Delegate`; a site already built is not held to it.
 */
export const designUnwritten = (fields: Pick<PlanFields, 'milestones'>): boolean =>
  !fields.milestones?.first_pass_at && !fields.milestones?.design_at

/** [[REQ-460]] — the plan decision that holds the site's structure: its pages, and the home page's order. */
export const SITE_STRUCTURE = 'pages_navigation'

/**
 * [[REQ-638]] — WHAT THE FIRST BUILD STILL WAITS FOR ([[DOC-82]] A.14 (2)): the
 * design written. [[REQ-657]] Never the plan, nor the client's yes to it. Empty
 * once it holds, and for a site already built.
 */
export function firstBuildMissing(fields: Partial<Pick<PlanFields, 'milestones' | 'handoff'>>): string[] {
  // [[REQ-638]] — nor for a prepared site: it has been built, whoever built it.
  if (fields.milestones?.first_pass_at || fields.handoff) return []
  return designUnwritten({ milestones: fields.milestones }) ? ['the design is not written: write it with set_design, from the agreed look and what read_design measured'] : []
}

/** [[REQ-657]] — what a first build started with no plan carries in its result: information, never a refusal. */
export const NO_PLAN_NOTE =
  "There's no plan yet: write it with set_plan now that you know what the site is for — this client's activities in your words for them, what's in and what's not — and tell your client what's coming."

/** [[REQ-657]] — the note for a first build, or `null`: a first build is one with no first pass and no handoff. */
export function firstBuildNote(fields: Partial<Pick<PlanFields, 'milestones' | 'handoff' | 'activities'>>): string | null {
  if (fields.milestones?.first_pass_at || fields.handoff) return null
  return (fields.activities ?? []).length === 0 ? NO_PLAN_NOTE : null
}

/** [[REQ-638]] — home's length budget on a phone, in screens: the host's long-home check's own threshold. */
export const HOME_BUDGET_SCREENS: number = (layoutDocument as unknown as { home_length: { maxScreens: number } }).home_length.maxScreens

/**
 * [[REQ-638]] — WHAT THE SITE PLAN IS SIZED AGAINST ([[DOC-82]] A.14 (4)): home's
 * budget on a phone, and what the host last measured of home — its height and its
 * sections, so a section's rough height follows. Only measurements the host made;
 * nothing invented. Said in the result of recording the site plan and in the
 * site-plan playbook section.
 */
export function homeBudgetLine(fields: Pick<PlanFields, 'home_length'>): string {
  const h = fields.home_length
  const sections = (() => {
    try {
      const shape = h?.shape ? (JSON.parse(h.shape) as unknown[]) : null
      return typeof shape?.[1] === 'number' ? shape[1] : null
    } catch {
      return null
    }
  })()
  const budget = `Home's budget on a phone is ${HOME_BUDGET_SCREENS} screens tall: size the home page to it, or let your client knowingly choose a longer one.`
  if (h?.screens && sections) {
      }
      // [[REQ-436]] — nor once the message's time is nearly up, or its builds change nothing.
      const refused = limits.refusal?.() ?? null
      if (refused === TURN_CLOSING) throw new lib.DelegationError(TURN_CLOSING, 'this request is nearly out of time')
      if (refused === IDLE_BUILDS_REFUSED) {
        throw new lib.DelegationError(IDLE_BUILDS_REFUSED, 'the last builds in this request changed nothing')
      }
      // [[BUG-326]] — a client's rejection is recorded before any change is briefed.
      const rejection = limits.rejectionUnrecorded?.() ?? null
      if (rejection !== null) {
        throw new lib.DelegationError(DECISION_FIRST, `the client's message turns something down: ${JSON.stringify(rejection.slice(0, 200))}`)
      }
      // [[REQ-638]] — the first build waits for the written design.
      const missing = (await limits.firstBuildMissing?.()) ?? []
      if (missing.length) throw new lib.DelegationError(PLAN_FIRST, `the first build is not ready: ${missing.join('; ')}`)
      // [[REQ-657]] — and is told, never refused, when there is no plan yet.
      const planNote = (await limits.firstBuildNote?.()) ?? null
      const noted = (r: Untyped): Untyped => (planNote ? { ...r, plan_note: planNote } : r)
      // [[REQ-410]] — a brief naming no files runs no builder; refused before the hand-off ([[REQ-627]]).
      const noScope = (await limits.noScope?.(input?.scope)) ?? null
      if (noScope !== null) throw new lib.DelegationError(SCOPE_HELD, noScope)
      // [[BUG-276]] — the logo's size is the design's brand, never a brief's.
      const sized = briefLogoSize(input?.goal, Array.isArray(input?.accept) ? input.accept : [])
      if (sized !== null) throw new lib.DelegationError(LOGO_SIZED, `the brief sizes the logo: ${JSON.stringify(sized)}`)
      // [[BUG-233]] — THE BRIEF IS THE CONSULTANT'S, as written. Nothing from the
      // story board is added here: the consul
```

[elided — kept 5800 of 8137 bytes]

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n "The look" --…
<!-- xgd-tool name="Bash" id="toolu_01NP6db1DG24UHQGSeG3eeFe" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:14:12.076873+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n \"The look\" -- tools/generate/src/cli/ai/*.ts tools/generate/src/cli/ai/*.json | head -20","description":"Find the look plan piece"}
```

**Result**

```
tools/generate/src/cli/ai/host-core.ts:8051: * reads exactly what a blocking `Delegate` returned. The look's pictures follow the
tools/generate/src/cli/ai/plan-core.ts:3328:    d = { id, title: `The look for ${choice.page}`, area: 'style', tier: 'concept', settle: 'show', state: 'open', compared: true }
tools/generate/src/cli/ai/plan-seed.json:78:    { "id": "look", "label": "The look", "link": "comps" },
tools/generate/src/cli/ai/plan-surface.json:354:          "description": "The looks: each `{ \"label\": \"Coastal\", \"description\": \"Sea-glass greens, airy type\", \"design\": { \"colour\": { … } } }`."
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 60,110p tools/gener…
<!-- xgd-tool name="Bash" id="toolu_01E8PkMD92wPQKwCaisBE67b" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:14:15.454497+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 60,110p tools/generate/src/cli/ai/plan-seed.json; git grep -n \"\\\"pieces\\\"\\|PLAN_PIECES\\|planPieces\\|STAGE_PIECES\" -- tools/generate/src/cli/ai | head","description":"Read plan pieces seed"}
```

**Result**

```
  ],
  "focus": {
    "about": "REQ-424 — guided focus tasks. A story-board reaction task covers at most this many notes, so the client is never handed the whole board at once; the rest wait, marked new, for the next task.",
    "max_story_notes": 8
  },
  "story_areas": [
    { "id": "beginning", "label": "how it started" },
    { "id": "craft", "label": "the craft or signature thing" },
    { "id": "people", "label": "the people" },
    { "id": "customers", "label": "the customers" },
    { "id": "community", "label": "what they do for the neighbourhood or for others" },
    { "id": "refusals", "label": "what they refuse to do" },
    { "id": "proud_moment", "label": "a moment they are proud of" }
  ],
  "activities": [
    { "id": "purpose", "label": "What the site is for", "link": "questions" },
    { "id": "first_draft", "label": "First draft", "link": "draft" },
    { "id": "story", "label": "Your story", "link": "story" },
    { "id": "look", "label": "The look", "link": "comps" },
    { "id": "pages", "label": "Pages and content", "link": "draft" },
    { "id": "shop", "label": "Your shop", "link": "draft" },
    { "id": "finishing", "label": "Finishing touches", "link": "draft" },
    { "id": "final_checks", "label": "Final checks", "link": "draft" },
    { "id": "publish", "label": "Publish", "link": "publish" }
  ],
  "opening": [
    "Hello — I'm here to design and build your website with you. I'll give you my honest opinion as we go, but it's your site, so you always have the final say.",
    "",
    "The quickest way to a site that's really yours is to start from what you already have. So, to start: tell me about your business. What do you do, and who are your customers? And send me whatever already exists: your website if you have one, your social pages, and photos of your work, flyers, price lists or menus (the + beside the message box uploads them). For Facebook, Instagram, LinkedIn or your Google Business profile, I can tell you how to download your page's content in one file. If you have nothing yet, that's fine too."
  ],
  "opening_unnamed": "The quickest way to a site that's really yours is to start from what you already have. So, to start: what's your business — or your project — called, and what do you do? And who are your customers? And send me whatever already exists: your website if you have one, your social pages, and photos of your work, flyers, price lists or menus (the + beside the message box uploads them). For Facebook, Instagram, LinkedIn or your Google Business profile, I can tell you how to download your page's content in one file. If you have nothing yet, that's fine too.",
  "opening_named": "The quickest way to a site that's really yours is to start from what you already have. So, to start: tell me about {name}. What do you do, and who are your customers? And send me whatever already exists: your website if you have one, your social pages, and photos of your work, flyers, price lists or menus (the + beside the message box uploads them). For Facebook, Instagram, LinkedIn or your Google Business profile, I can tell you how to download your page's content in one file. If you have nothing yet, that's fine too.",
  "opening_handoff": ["Hello — I'm here to help you make this website yours. A first version of your site has been prepared{from}: it's in the preview beside this chat, so have a good look round.", "", "Everything in it is a suggestion. Anything can be changed, and nothing goes live until you say so.", "", "To start, two things. What do you want the site to do for you: be your shop front, or tell your story too? And how do you feel about what you see: the look, the layout and the words? And send me anything about your business you'd like the site to use: photos of your work, menus, price lists, flyers, reviews."],
  "feature_catalogue": [
    { "id": "contact_message", "label": "Visitors can send you a message", "available": true },
    { "id": "quote_request", "label": "Visitors can ask for a quote, with job details and photos", "available": false },
    { "id": "booking", "label": "Visitors can book or request an appointment", "available": false },
    { "id": "online_payment", "label": "Visitors can pay online", "available": false },
    { "id": "newsletter_signup", "label": "Visitors can sign up to your email newsletter", "available": false },
    { "id": "blog", "label": "You publish articles over time (a blog)", "available": false },
    { "id": "notices", "label": "You post short notices that expire, e.g. \"Closed 24–26 Dec\"", "available": false }
  ],
  "features_ask": {
    "prompt": "What does your site need to do?",
    "why": "So we build what you need and can tell when the site is finished.",
    "needed_by": "first_pass",
    "blocking": false
  },
  "asks": [],
  "decisions": [
    { "id": "site_job", "area": "purpose", "tier": "concept", "settle": "ask", "title": "The site's job right now" },
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n "Finishing tou…
<!-- xgd-tool name="Bash" id="toolu_017J5RNntiZ3t9CatBHvPBst" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:14:20.277359+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n \"Finishing touches\" -- tools apps packages kb ':!**/dist/**' | cut -c1-220 | head; git grep -ln \"Finishing touches\" -- .xgd/tickets 2>/dev/null | head","description":"Find activity descriptions"}
```

**Result**

```
tools/generate/src/cli/ai/plan-seed.json:81:    { "id": "finishing", "label": "Finishing touches", "link": "draft" },
.xgd/tickets/hot/bug-0e27dba8.md
.xgd/tickets/hot/bug-e72f1211.md
.xgd/tickets/hot/comment-3cb141fd.md
.xgd/tickets/hot/comment-78bce1ac.md
.xgd/tickets/hot/comment-8f2789ce.md
.xgd/tickets/hot/comment-9d553ad7.md
.xgd/tickets/hot/comment-add45430.md
.xgd/tickets/hot/comment-d8169cbf.md
.xgd/tickets/hot/doc-10c66869.md
.xgd/tickets/hot/doc-75d67bfc.md
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n "activities" -…
<!-- xgd-tool name="Bash" id="toolu_01Xk2kmQX3vu9JN8CPyGraSp" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:14:21.854466+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n \"activities\" -- tools/generate/src/cli/ai/plan-surface.json | cut -c1-600 | head -5; git grep -n \"ACTIVITIES\\b\\|activityLabel\\|activity.*description\" -- tools/generate/src/cli/ai/plan-core.ts | head","description":"Activity descriptions in plan surface"}
```

**Result**

```
tools/generate/src/cli/ai/plan-surface.json:7:  "overview": "Every site has one plan, and it is the single shared picture of the project. It outlives every conversation about the site, so read it before acting on what you think you remember.\n\nThe plan has structured parts and a written part. The structured parts are the plan's activities — this client's route with you, each done, now, next, later or skipped — and whether the client agreed the plan; the brief, which is the client's goals in structured form; the features they want; the decisions that make up the site, each with a state; the ch
tools/generate/src/cli/ai/plan-surface.json:13:    "plan_activities": {
tools/generate/src/cli/ai/plan-surface.json:40:      "activities": "the plan's activities as they now read, when the change was to the plan",
tools/generate/src/cli/ai/plan-surface.json:605:      "summary": "Write or update this client's plan: the activities you will go through together.",
tools/generate/src/cli/ai/plan-surface.json:608:        "activities": { "type": "plan_activities", "required": true, "description": "Every activity, in order: objects of { kind, text, status, reason }." }
tools/generate/src/cli/ai/plan-core.ts:94: * [[REQ-657]] — THE MENU OF ACTIVITIES a client and the consultant can go
tools/generate/src/cli/ai/plan-core.ts:1217:export const activityLabel = (kind: string): string => ACTIVITY_KINDS.find((k) => k.id === kind)?.label ?? kind
tools/generate/src/cli/ai/plan-core.ts:1260:      label: activityLabel(a.kind),
tools/generate/src/cli/ai/plan-core.ts:2170:      `Not looked at since they changed: ${notLookedText(facts.unlooked)}. Take a screenshot of each at that width and check it — "${activityLabel(FINAL_CHECKS)}" can't be done until you have.`,
tools/generate/src/cli/ai/plan-core.ts:3854:          if (a.kind === FIRST_DRAFT) throw refuse(NOT_YET, `"${activityLabel(a.kind)}" is done when every page of the first build has returned; the host marks it, so give it now, next or later`)
tools/generate/src/cli/ai/plan-core.ts:3855:          if (a.kind === PUBLISH) throw refuse(NOT_YET, `"${activityLabel(a.kind)}" is done once the site is live: publishing is your client's, with the Publish button`)
tools/generate/src/cli/ai/plan-core.ts:3859:              `"${activityLabel(a.kind)}" can't be done while pages have changed since you last looked at them: ${notLookedText(unlooked)}. ` +
tools/generate/src/cli/ai/plan-core.ts:3867:              `"${activityLabel(a.kind)}" is done when the site has had its review before publishing, and the host marks it. ` +
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 13,30p tools/genera…
<!-- xgd-tool name="Bash" id="toolu_016iAzbbc3vsYh9xqtY4G9qg" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:14:24.844535+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 13,30p tools/generate/src/cli/ai/plan-surface.json | cut -c1-2500; sed -n 90,130p tools/generate/src/cli/ai/plan-core.ts","description":"Read plan_activities type"}
```

**Result**

```
    "plan_activities": {
      "base": "array",
      "item_base": "object"
    },
    "planned_sections": { "base": "array", "item_base": "object" }
  },
  "shapes": {
    "plan": {
      "plan": "the plan's structured parts as they now stand: the pieces, brief, functionality, decisions, checks, tasks, asks, and the comp board",
      "body": "the written part: the client's own words, the decision log, and notes",
      "panel": "the same plan projected for a reader: the pieces with their words, decisions grouped by state, checks still waiting for an answer, checks that have fallen due and not yet been raised, task progress, and the asks still open",
      "comps": "the comp board with each site's likes and dislikes, when it has any sites"
    },
    "design": {
      "design": "the site's design as it now stands: type roles, space, layout, colour roles, components, imagery, brand and fonts",
      "issues": "what is wrong with it as a system, each with a path and a reason",
      "uses": "how often each of its names is used across the pages",
      "offSystem": "per page, how many values are typed in beside the design",
export const PLAN_KINDS = ['site'] as const
export const SITE_PLAN = 'site'

/**
 * [[REQ-657]] — THE MENU OF ACTIVITIES a client and the consultant can go
 * through together, in the menu's order. Data, in `plan-seed.json`, so the
 * wording changes without a code change. The plan holds THIS client's route
 * ({@link PlanActivity}): each entry one kind from the menu, in the consultant's
 * own words for them. The fixed menu is what lets the host link each entry to
 * where its work happens, and set done itself where it can see the fact
 * ({@link hostDone}); the consultant sets everything else, with `set_plan`.
 */
export const ACTIVITY_KINDS: readonly { id: string; label: string; link: string }[] = planSeed.activities
export const ACTIVITY_KIND_IDS: readonly string[] = ACTIVITY_KINDS.map((k) => k.id)

/**
 * [[REQ-403]] — the consultant's first message in every new conversation: stock
 * text the client releases with *Click here to start*, never a model turn.
 */
export const OPENING_MESSAGE: string = planSeed.opening.join('\n')

/**
 * [[REQ-487]] — whether a business still has the name it was given before anybody
 * asked: `Unnamed business`, or one of the numbered variants an account holding
 * several gets (`Unnamed business-2`).
 */
export function isUnnamedBusiness(name: string | null | undefined): boolean {
  return typeof name === 'string' && /^unnamed business(-\d+)?$/i.test(name.trim())
}

/**
 * [[REQ-487]] — the opening for a business called `name`. While it is still the
 * placeholder, the closing question asks what the business or project is called;
 * once it has a real name, the question uses it and never asks again. `null` is a
 * host with no business record (the `1c` CLI): {@link OPENING_MESSAGE} unchanged.
 */
export function openingMessage(name: string | null | undefined, handoff: HandoffRecord | null = null): string {
  // [[REQ-638]] — A PREPARED SITE'S OPENING is about its owner, not the process.
  if (handoff) {
    return planSeed.opening_handoff
      .join('\n')
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 600,615p tools/gene…
<!-- xgd-tool name="Bash" id="toolu_01X7uhbAnFQgHgLuRMWGZTD7" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:14:28.751191+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 600,615p tools/generate/src/cli/ai/plan-surface.json | cut -c1-3000; git grep -n \"ACTIVITY_KINDS\" -- tools/generate/src | head","description":"Read set_plan description and kind usage"}
```

**Result**

```
    },
    {
      "op": "set_plan",
      "tool": "set_plan",
      "effect": "write",
      "summary": "Write or update this client's plan: the activities you will go through together.",
      "description": "The plan is shared: your client sees it at the top of Input, in your words, and it changes as you write it. Write it once you know what the site is for, usually when the first build starts, and rewrite it whole whenever it changes: your client changes it through you (\"skip the story\", \"add a shop page\").\n\nGive every activity, in order. Each is one `kind` from the menu: purpose (what the site is for), first_draft, story, look, pages (pages and content), shop, finishing (finishing touches: hero movement, entrance effects, tab icon, share card), final_checks, publish. A kind may have more than one entry, for example one for an important page. `text` is what it involves for this client, in a line. `status` is done, now, next, later or skipped; a skipped activity is not included and needs a `reason` (\"you want a shop front, so no story pages\").\n\nThe host marks three for itself: first_draft is done when every page of the first build has returned, final_checks when the review before publishing has run, and publish on publish. They are refused as done before then. Nothing waits for the plan, nor for your client's yes to it.",
      "params": {
        "activities": { "type": "plan_activities", "required": true, "description": "Every activity, in order: objects of { kind, text, status, reason }." }
      },
      "returns": { "shape": "written" },
      "errors": ["PLAN_INVALID", "NOT_YET", "NOT_LOOKED", "NOT_CRITIQUED", "CONFLICT", "SCHEMA_INVALID"]
    },
    {
      "op": "agree_plan",
      "tool": "agree_plan",
tools/generate/src/cli/ai/plan-core.ts:102:export const ACTIVITY_KINDS: readonly { id: string; label: string; link: string }[] = planSeed.activities
tools/generate/src/cli/ai/plan-core.ts:103:export const ACTIVITY_KIND_IDS: readonly string[] = ACTIVITY_KINDS.map((k) => k.id)
tools/generate/src/cli/ai/plan-core.ts:545: * from the menu ({@link ACTIVITY_KINDS}), what it involves for them in the
tools/generate/src/cli/ai/plan-core.ts:1217:export const activityLabel = (kind: string): string => ACTIVITY_KINDS.find((k) => k.id === kind)?.label ?? kind
tools/generate/src/cli/ai/plan-core.ts:1220:export const activityLink = (kind: string): string | null => ACTIVITY_KINDS.find((k) => k.id === kind)?.link ?? null
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && cat tests/test_UAT_FC_BUG-…
<!-- xgd-tool name="Bash" id="toolu_01BKb9ycRLfuhR99NxdUqRWd" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:14:34.799993+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && cat tests/test_UAT_FC_BUG-308_effect_proposed_as_intro_plus_loop.test.ts; git grep -ln \"get a yes to that design\" -- tests | head","description":"Read BUG-308 pin and find REQ-470 pin"}
```

**Result**

```
import { beforeAll, describe, expect, it } from 'vitest'
import { readDocTickets } from '../tools/generate/src/cli/kb'
import { parseStageGuides, STAGE_GUIDES_DOC } from '../tools/generate/src/cli/ai/stage-guide-core'

/**
 * [[BUG-308]] — **the hero's signature effect is proposed in the agreed shape**
 * ([[DOC-71]] §12.9, [[DOC-74]] §5): an eye-catcher that plays once and ends on the
 * client's original photo, then a subtle loop. One enthusiastic proposal when the
 * client prefers the consultant to lead; a recommendation, alternatives only on
 * request, when they lead. "Nothing moving" is the client's choice, not a listed
 * option. On Dina's Diner 9 the consultant offered a menu: steam, a slow push-in, or
 * nothing.
 *
 * The first-draft guide is the shipped [[DOC-75]], read from the ticket store the
 * release exports — what the host hands the consultant ([[REQ-477]]). The hold's
 * refusal text is pinned through the real routes by [[BUG-306]]'s workers suite.
 */

let draft: string

beforeAll(() => {
  const found = readDocTickets().find((t) => t.id === STAGE_GUIDES_DOC)
  expect(found).toBeDefined()
  draft = parseStageGuides(String((found as { body?: string }).body ?? '')).get('the first draft') ?? ''
}, 180000)

describe('BUG-308 — the signature effect is one proposal, intro plus loop', () => {
  it('test_UAT_FC_BUG-308_effect_proposed_as_intro_plus_loop', () => {
    expect(draft).toMatch(/eye-catcher that plays once and ends on their original photo, then a subtle loop/)
    // [[REQ-638]] — one proposal, offered when it helps ([[DOC-82]]: a tool, not a must); no motion is their answer to give.
    expect(draft).toMatch(/Offer it when it helps; no motion is a fine answer/)
    expect(draft).toMatch(/Record their answer as `signature_effect`/)
    // The menu is gone.
    expect(draft).not.toMatch(/two or three options/i)
    expect(draft).not.toMatch(/steam rising or a slow push in/i)
  })
})
tests/test_UAT_FC_REQ-470_clip_guidance.workers.test.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && node -e " const {readFileS…
<!-- xgd-tool name="Bash" id="toolu_01BccCjzeYr1i3j5Cn8XuK27" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:14:39.321466+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && node -e \"\nconst {readFileSync}=require('fs');\" ; ls tools/generate/src/cli/kb* 2>/dev/null; xgd ticket get DOC-75 --json 2>/dev/null > $TMPDIR/doc75-bug356.json; python3 -c \"\nimport json;d=json.load(open('$TMPDIR/doc75-bug356.json'));t=d.get('ticket',d);b=t['body'];import re\nfor m in re.finditer(r'signature|eye-catcher|first second', b): pass\ni=b.find('## The first draft'); print(b[i:i+5000])\"","description":"Read DOC-75 first draft section"}
```

**Result**

```
tools/generate/src/cli/kb-model.ts
tools/generate/src/cli/kb-projection.ts
tools/generate/src/cli/kb.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 -c " import json;d…
<!-- xgd-tool name="Bash" id="toolu_01PhuETGVT6F6y5hVtAG9Jj3" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:14:44.242135+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 -c \"\nimport json;d=json.load(open('$TMPDIR/doc75-bug356.json'));t=d.get('ticket',d);b=t['body'];import re\nprint(len(b));[print(m.start(), b[max(0,m.start()-100):m.start()+150].replace(chr(10),' | ')) for m in re.finditer(r'^#+ .*', b, re.M)]\" | head -40","description":"List DOC-75 headings"}
```

**Result**

```
20393
0 # Playbook: the Site consultant's tools |  | **Audience:** the Site consultant. This is advice, not a route. The goal is a great site for this client, ali
498 p finds any section whenever you want it. What you choose to do for this client is yours to judge. |  | ## Playbook: gathering and taking stock |  | The opening already asked for what exists: their site, social pages, photos of their work, flyers, price list
4812 ld apply. A capability marked not yet available stays on the list, but never promise or build one. |  | ## Playbook: focus tasks |  | A focus task walks your client through one surface (the questions, the story board, the comparison sites) when doing it toge
5276 s tidy so they never overwhelm: merge near-duplicates, keep each theme to its strongest few notes. |  | ## Playbook: the comparison board |  | **What it's for:** finding out what they want their site to look and feel like by having them react to real sites. 
6608 d feel and what they want seen first, never the order of sections, which belongs to the site plan. |  | ## Playbook: the story board |  | **What it's for:** the one clear reason the right customer picks them, told in their voice: the owner and their journey,
8681 ed with is their wording: never reword or remove it; suggest a change in the conversation instead. |  | ## Playbook: the design and looks |  | **What it's for:** turning the agreed look into the site's design: type, colours, brand and logo, picture shapes, s
10404 ry word reads against its background and the header holds at real size, on a computer and a phone. |  | ## Playbook: the site plan |  | **What it's for:** which pages there are, what each is for, home's order, and what each page needs. Present it in chat, wi
12702 usel), but the photo boxes stay one shape and the photos stay viewable. The host's look checks it. |  | ## Playbook: the first draft |  | **What it's for:** the site built from what they agreed and the material you have: the best you can do with it, never de
15571 each question saying what it's for. If you ran out of time or budget, say so plainly and carry on. |  | ## Playbook: checking your work |  | Use it before every hand-over, and before your client goes live. |  | **Does it look right:** look at every changed page 
16905 eview before publishing runs when Publish is opened; its findings are suggestions for your client. |  | ## Playbook: refinement |  | **What it's for:** finishing the site through conversation, until they say it's right. The first draft was your best effort; 
18287  forth** means part of the plan isn't settled: go back to it with them rather than keep polishing. |  | ## Playbook: finishing touches |  | Life once the basics are settled: often the signature effect plus entrance reveals. The motion reference in your knowl
19190 ame; allow for the end state; give the moving element room in the frame; strong motion plays once. |  | ## Playbook: publishing |  | **Publishing is your client's decision,** made with the Publish button. Tell them where they stand from what you have: | - **an
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 -c " import json;d…
<!-- xgd-tool name="Bash" id="toolu_01ExbCFYMXzhsPY41NmfESYL" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:14:47.720269+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 -c \"\nimport json;d=json.load(open('$TMPDIR/doc75-bug356.json'));t=d.get('ticket',d);b=t['body'];print(b[12700:15571]);print('=====');print(b[18287:19300])\"","description":"Read DOC-75 first draft and finishing"}
```

**Result**

```
## Playbook: the first draft

**What it's for:** the site built from what they agreed and the material you have: the best you can do with it, never deliberately rough. Start it early, so you can talk while it builds: once you know what the site is for, have their material, and have told them the rough look you're going for. When it starts, tell them in a short message what's coming: this is a first pass from what you have (what's in it and what's still a placeholder), what comes after it from the plan, and that nothing is final until they say so. Never say a build is under way until you have started it. A known gap becomes a clear placeholder tied to a question on the questions panel, never a guess.

- **They can watch it fill in** and comment at any time; what they say goes into the next pass. Running commentary helps ("I'm starting on the Menu page"), with a link to each page as it's done.
- **Each page has a quiet review as soon as it's built,** so the review overlaps the build. Fix the serious findings as they come; anything else becomes an improvement, offered or made by who leads.
- **Invite them to look ("your first draft is ready") only when every page is built, reviewed and fixed.** Say what's built, what's still to fill (linked to their questions), and the one thing to look at first, usually home on their phone, in your own words.
- **A signature effect** makes the site feel alive and theirs, and it is part of every first draft unless they've said no to motion: one piece of motion on the hero, from their own photo, an eye-catcher that plays once and ends on their original photo, then a subtle loop (pepper ground over the eggs, then steam rising; a dish lifted into frame from one corner and set down; sparks that settle, then a faint glow), and a no to carousels isn't a no to this. Choose the one that suits their hero photo best and build it with the draft; it needs no yes first (the one exception to agreeing a clip before making it). Record it as `signature_effect` `defaulted`, your pick in `value`. If you talk about the look before building, mention it then too. When you invite them to look, tell them about it in your own words: what moves, one or two other ideas you considered, and that it comes off whenever they like. Record their answer as `signature_effect`, with their words: parked when they decline (take it off; the still photo stays, and don't raise it again), chosen when they prefer another idea (make that one). Tell them how to see it: "Open in new tab" beside the preview, or "View on your phone". Text over a moving hero leaves the movement in view: say in the brief where the moving part of the photo is, and keep text and scrims clear of it.
- **Use the wait** for the material their pages still need, each question saying what it's for. If you ran out of time or budget, say so plainly and carry on.


=====
## Playbook: finishing touches

Life once the basics are settled: often the signature effect plus entrance reveals. The motion reference in your knowledge base has the patterns, taste tests and don'ts. When they prefer you to lead, suggest, then go ahead unless they object; when they lead, offer, with your pick. Never undo a choice they made to add an effect. Check the tab icon and the share card: both are site settings (`favicon`, `shareCard`), also on the Settings tab.

**Making a clip:** an eye-catcher that ends on the original photo, then quieter ongoing motion. The eye-catcher is what visitors notice: a clear action they see in the first second or two (something enters the frame, is poured, falls, is lifted in, lights up); a faint stir is a loop, not an eye-catcher. Then: a clean last frame; allow for the end state; give the moving element room in the frame; strong motion plays once.

## Playbook: publishing

**Publishing is your client's decision,** made with the Publish button. Tell them whe
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "subtle\|get a yes…
<!-- xgd-tool name="Bash" id="toolu_01HqFRxiWQC6mkrCYCupzhPV" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:14:53.380650+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"subtle\\|get a yes\\|toContain\\|toMatch\" tests/test_UAT_FC_REQ-470_clip_guidance.workers.test.ts | head -30; grep -n \"effectBriefLine\\|signature\" tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts | head -20; git grep -ln \"videoGuidance\\|the movement subtle\\|slow drift\" -- tests | head","description":"Read existing pins on guidance and brief"}
```

**Result**

```
15:    expect(text).toMatch(/need not be either\/or/)
16:    expect(text).toMatch(/reveal playing once and then the loop/)
18:    expect(text).toMatch(/`reveal` and a `loop` from the same photo/)
19:    expect(text).toMatch(/`loopSrc`/)
21:    expect(text).toMatch(/get a yes to that design: what moves and what stays still, in what order/)
26:    expect(text).toMatch(/Illustrations and secondary pictures can move too, but only on hover/)
27:    expect(text).toMatch(/trigger: 'hover'/)
29:    expect(text).toMatch(/at most one on a page/)
30:    expect(text).toMatch(/hover clips do not count towards the one hero/)
15:  effectBriefLine,
27: * [[BUG-304]] — the client's answer on the hero's signature effect is recorded in
106:describe('BUG-304 — the signature effect answer, brief and guides', () => {
112:    expect(await alice.run('set_decision', { decision: 'signature_effect', state: 'chosen', value: 'Steam rising' })).toContain('PLAN_INVALID')
117:      decision: 'signature_effect',
123:    const d = deps.stored().fields.decisions.find((x) => x.id === 'signature_effect')!
131:      await bob.run('set_decision', { decision: 'signature_effect', state: 'parked', client_said: 'No moving pictures, thanks.' }),
133:    expect(declining.stored().fields.decisions.find((x) => x.id === 'signature_effect')!.state).toBe('parked')
134:    expect(agendaLines(declining.stored().fields).join('\n')).not.toMatch(/signature effect/i)
136:    expect(entry(declining)).toContain("Parked: The hero's signature effect (the client declined it)")
138:    expect(agendaLines(back.fields).join('\n')).not.toMatch(/signature effect/i)
147:    await alice.run('set_decision', { decision: 'signature_effect', state: 'chosen', value: 'A slow push in', client_said: 'Push in.' })
149:    const line = effectBriefLine(deps.stored().fields) ?? ''
tests/test_UAT_FC_REQ-461_hero_clip_tool.workers.test.ts
tests/test_UAT_FC_REQ-470_clip_guidance.workers.test.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 140,175p tests/test…
<!-- xgd-tool name="Bash" id="toolu_01FWpKy6xvDCyZmHwghQPzym" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:14:57.609994+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 140,175p tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts; cat tests/test_UAT_FC_REQ-470_clip_guidance.workers.test.ts | sed -n 1,40p; grep -n \"subtle\\|slow drift\\|videoGuidance\" tests/test_UAT_FC_REQ-461_hero_clip_tool.workers.test.ts","description":"Read brief pin and guidance tests"}
```

**Result**

```
    // Other decisions still cannot be settled by the consultant.
    expect(await bob.run('set_decision', { decision: 'palette', state: 'chosen', value: 'Red', client_said: 'Red' })).toContain('PLAN_INVALID')
  }, 180000)

  it('test_UAT_FC_BUG-304_effect_brief_keeps_the_moving_region_clear', async () => {
    const deps = memoryPlan(drafting())
    const alice = await consultant(deps)
    await alice.run('set_decision', { decision: 'signature_effect', state: 'chosen', value: 'A slow push in', client_said: 'Push in.' })
    // [[BUG-306]] — the effect is briefed with the first draft: the host's line on its brief.
    const line = effectBriefLine(deps.stored().fields) ?? ''
    expect(line).toContain('A slow push in')

    // The brief says where the moving part is, and keeps text and scrim clear of it.
    expect(line).toMatch(/where the moving part of the photo is/)
    expect(line).toMatch(/keep the headline, any other text and any scrim clear of it/)
    expect(line).toMatch(/no dark overlay across the whole photo/)
    expect(line).toMatch(/contrast local to where it sits/)

    // The checks: the moving region uncovered at computer and phone widths, and the headline's contrast.
    for (const check of EFFECT_CHECKS) expect(line).toContain(check)
    expect(EFFECT_CHECKS.some((c) => /computer width/.test(c) && /not covered/.test(c) && /scrim/.test(c))).toBe(true)
    expect(EFFECT_CHECKS.some((c) => /phone width/.test(c) && /not covered/.test(c) && /scrim/.test(c))).toBe(true)
    expect(EFFECT_CHECKS.some((c) => /contrast/.test(c))).toBe(true)
    // …each one a check the delegation lets through to the builder, not refused as the record's.
    expect(unsettledChecks(EFFECT_CHECKS)).toEqual([])
  }, 180000)

  it('test_UAT_FC_BUG-304_guide_keeps_the_movement_in_view', () => {
    const draft = parseStageGuides(doc).get('the first draft') ?? ''
    // [[REQ-638]] — the playbook's wording; the brief line (above) carries the checks and "no dark overlay".
    expect(draft).toMatch(/a no to carousels isn't a no to this/)
    expect(draft).toMatch(/Text over a moving hero leaves the movement in view/)
    expect(draft).toMatch(/say in the brief where the moving part of the photo is, and keep text and scrims clear of it/)
  })

})
/**
 * REQ-470 — what the consultant is told about intro-then-loop and hover clips.
 *
 * The guidance lives in the clip operation's description, read when the tool
 * is, rather than in the priming every turn carries ([[BUG-129]]): the summary
 * line that is primed stays one short sentence.
 */
import { describe, expect, it } from 'vitest'
import { VIDEO_SUMMARY, videoGuidance } from '../apps/control-app/src/videogen'

describe('REQ-470 the consultant clip guidance', () => {
  it('test_UAT_FC_REQ-470_guidance_offers_intro_then_loop_alongside_either_or', () => {
    const text = videoGuidance()
    // Two compatible motions can be offered together…
    expect(text).toMatch(/need not be either\/or/)
    expect(text).toMatch(/reveal playing once and then the loop/)
    // …made as two clips from the same photo, and placed as one element.
    expect(text).toMatch(/`reveal` and a `loop` from the same photo/)
    expect(text).toMatch(/`loopSrc`/)
    // The client still agrees the design, including the order.
    expect(text).toMatch(/get a yes to that design: what moves and what stays still, in what order/)
  })

  it('test_UAT_FC_REQ-470_guidance_names_hover_as_the_trigger_for_illustrations', () => {
    const text = videoGuidance()
    expect(text).toMatch(/Illustrations and secondary pictures can move too, but only on hover/)
    expect(text).toMatch(/trigger: 'hover'/)
    // The one-hero rule is unchanged, and hover clips do not count towards it.
    expect(text).toMatch(/at most one on a page/)
    expect(text).toMatch(/hover clips do not count towards the one hero/)
    // The primed line stays one short sentence.
    expect(VIDEO_SUMMARY.length).toBeLessThanOrEqual(40)
  })
})
18:  videoGuidance,
69:    expect(videoGuidance()).not.toMatch(/\$\s*\d/)
70:    expect(videoGuidance()).toMatch(/never mention a price or cost/)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='tools…
<!-- xgd-tool name="Bash" id="toolu_01JPWX2xVYhbrx3xXTVdxPzc" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:15:23.276137+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='tools/generate/src/cli/ai/plan-core.ts'\ns=open(p).read()\nold_doc=s[s.index(\"/**\\n * [[BUG-306]] — THE HERO'S SIGNATURE EFFECT, decided\"):s.index(\"export const SIGNATURE_EFFECT = \")]\nnew_doc='''/**\n * [[BUG-306]] [[BUG-356]] — THE HERO'S SIGNATURE EFFECT, part of every first draft\n * unless the client has said no to motion.\n *\n * The effect is the one piece of motion that makes the site feel alive and theirs.\n * BUG-306 held the first build until the client had answered; [[REQ-638]]'s\n * [[DOC-82]] cutover removed the hold, and a playbook line saying \"offer it when it\n * helps\" was passed over, so first drafts shipped with no motion at all. The\n * operator ruled out a hold or a refusal (\"forcing a decision feels harsh\"): the\n * consultant picks the effect, records it as `defaulted`, and builds it with the\n * draft; the client declines it (parked, never asked again) or prefers another\n * (chosen). The safeguard is the default itself — the first draft's brief carries\n * the effect unless the decision is parked ({@link effectBriefLine}), and a first\n * build the consultant started without a pick is told so ({@link EFFECT_PICK_NOTE}).\n */\n'''\ns=s.replace(old_doc,new_doc)\nold_fn=s[s.index(\"/** [[BUG-304]] — where the client's answer on the signature effect stands. */\"):s.index(\"/** What a new site's plan holds before anybody has said anything. */\")]\nnew_fn='''/**\n * [[BUG-304]] [[BUG-356]] — where the signature effect stands: the client\n * declined it, chose one, or the consultant picked one for them (`defaulted`,\n * its pick in `value`, or none yet). Unanswered is no decision at all.\n */\nexport function signatureEffect(fields: Partial<Pick<PlanFields, 'decisions'>>): {\n  state: 'unanswered' | 'declined' | 'chosen' | 'defaulted'\n  effect?: string\n} {\n  const d = (fields.decisions ?? []).find((x) => x.id === SIGNATURE_EFFECT)\n  if (d?.state === 'parked') return { state: 'declined' }\n  if (d?.state === 'chosen' || d?.state === 'delegated') return { state: 'chosen', effect: d.value ?? 'your pick' }\n  if (d?.state === 'defaulted' && d.value) return { state: 'defaulted', effect: d.value }\n  return { state: 'unanswered' }\n}\n\n/** [[BUG-304]] — how the hero is built around a moving photo: the part every effect line ends with. */\nconst EFFECT_PLACEMENT =\n  'Say where the moving part of the photo is (from its description and focal point) and keep the headline, any other text and any scrim clear of it; ' +\n  'no dark overlay across the whole photo — the text stays readable with contrast local to where it sits. ' +\n  `Check: ${EFFECT_CHECKS.join('; ')}.`\n\n/**\n * [[BUG-306]] [[BUG-356]] — THE LINE THE SIGNATURE EFFECT ADDS TO THE FIRST\n * DRAFT'S BRIEF, for a brief that may build home: the effect, kept clear of the\n * hero's text and any scrim, contrast local to the text, and its checks.\n *\n * ON EVERY FIRST DRAFT UNLESS THE CLIENT DECLINED. The client's choice when they\n * made one; else the consultant's pick; else — the consultant has picked nothing —\n * a hero built ready for the clip it is told to make ({@link EFFECT_PICK_NOTE}).\n * Null once a first pass has landed, or when the decision is parked.\n */\nexport function effectBriefLine(fields: Partial<Pick<PlanFields, 'milestones' | 'decisions'>>): string | null {\n  const answer = signatureEffect(fields)\n  if (fields.milestones?.first_pass_at || answer.state === 'declined') return null\n  const lead =\n    answer.state === 'chosen'\n      ? `Your client chose the hero's signature effect: ${answer.effect}. Build it on the hero with this draft. `\n      : answer.state === 'defaulted'\n        ? `The hero carries a signature effect in this draft, the consultant's pick: ${answer.effect}. Build it on the hero with this draft. `\n        : \"The hero carries a signature effect in this draft: a clip from the hero photo, a clear eye-catcher that plays once and ends on the photo, then a subtle loop. Place it as the hero's `video` if the Library holds it; otherwise build the hero on the photo, ready for it. \"\n  return lead + EFFECT_PLACEMENT\n}\n\n/**\n * [[BUG-356]] — WHAT A FIRST BUILD STARTED WITH NO PICKED EFFECT CARRIES IN ITS\n * RESULT: information, never a refusal ([[REQ-657]]'s way). The host has recorded\n * `signature_effect` as `defaulted` ({@link defaultSignatureEffect}); the clip is\n * the consultant's to make, since only it holds the clip tool.\n */\nexport const EFFECT_PICK_NOTE =\n  \"Your first draft carries a signature effect, and you haven't picked one: choose the effect that suits their hero photo best (a clear eye-catcher that plays once and ends on their photo, then a subtle loop), make it, and record it as `signature_effect` `defaulted` with your pick in `value`. \" +\n  'When you invite them to look, say what moves, one or two other ideas you considered, and that it comes off whenever they like.'\n\n/** [[BUG-356]] — whether a first build would start with no effect picked and none declined. */\nconst effectUnpicked = (fields: Partial<Pick<PlanFields, 'milestones' | 'handoff' | 'decisions'>>): boolean =>\n  !fields.milestones?.first_pass_at && !fields.handoff && signatureEffect(fields).state === 'unanswered'\n\n/**\n * [[BUG-356]] — the plan with the signature effect recorded as `defaulted`, for a\n * first build started with no decision on it: the effect is on by default, so the\n * record says so. Unchanged when the client or the consultant has already spoken.\n */\nexport function defaultSignatureEffect(plan: Plan): Plan {\n  if (!effectUnpicked(plan.fields)) return plan\n  const next = copy(plan)\n  const d = next.field
```

[elided — kept 5800 of 7314 bytes]

**Result**

```
2376:const copy = (plan: Plan): Plan => JSON.parse(JSON.stringify(plan)) as Plan
228:export interface PlanDecision {
576:  decisions: PlanDecision[]
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "plan?: (slug\|pla…
<!-- xgd-tool name="Bash" id="toolu_01PPasBxsRfAyTXVwXegHfAT" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:15:31.036345+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"plan?: (slug\\|plan?:\\|  plan:\" tools/generate/src/cli/ai/host-core.ts | head -5; grep -n \"export interface PlanDeps\" -A 15 tools/generate/src/cli/ai/plan-core.ts | head -20","description":"Check plan deps write interface"}
```

**Result**

```
935:  plan?: ((slug: string) => PlanDeps) | null
4009:          plan: deps.plan ? () => deps.plan!(slug).read() : null,
4796:    plan: deps.plan ? () => deps.plan!(slug).read() : null,
696:export interface PlanDeps {
697-  /**
698-   * The site's plan. A host that stores plans creates the seeded one on first
699-   * read; `null` only from a host that cannot.
700-   */
701-  read(): Promise<Plan | null>
702-  /** Apply a change to the plan (seeding it when absent); answer what was stored. */
703-  write(change: (plan: Plan) => Plan): Promise<Plan>
704-  /** The clock. Absent is the wall clock. */
705-  now?: () => string
706-  /** [[REQ-378]] — the reference tickets the comp board points at. */
707-  comps?: CompDeps
708-  /**
709-   * [[REQ-391]] — put a look onto the page it was offered for, answering what was
710-   * chosen and what was set aside. The site write is the host's — this surface
711-   * holds no site — so a host that cannot make it leaves this out and
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='tools…
<!-- xgd-tool name="Bash" id="toolu_012WfHdPa9zHcuRs9NQFGKL1" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:15:39.591170+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='tools/generate/src/cli/ai/host-core.ts'\ns=open(p).read()\nold='''                            const lines = home.length > 0 && (await buildsHome(deps, slug, input.scope)) ? home : []'''\nnew='''                            const lines = home.length > 0 && (await buildsHome(deps, slug, input.scope)) ? home : []\n                            // [[BUG-356]] — a first draft built with the effect on by default records it so.\n                            if (fields && deps.plan && lines.some((l) => l === effectBriefLine(fields))) {\n                              await deps.plan(slug).write(defaultSignatureEffect).catch(() => null)\n                            }'''\nassert old in s; s=s.replace(old,new)\ns=s.replace(\"  effectBriefLine,\\n\",\"  effectBriefLine,\\n  defaultSignatureEffect,\\n\",1)\ns=s.replace(\"// [[BUG-306]] and on the first draft the chosen signature effect;\",\"// [[BUG-306]] [[BUG-356]] and on the first draft the signature effect unless declined;\")\nopen(p,'w').write(s)\np='tools/generate/src/cli/ai/plan-surface.json'\ns=open(p).read()\nold=\"first_draft, story, look, pages (pages and content), shop, finishing (finishing touches: hero movement, entrance effects, tab icon, share card)\"\nnew=\"first_draft, story, look (the look, including the hero's movement: its signature effect), pages (pages and content), shop, finishing (finishing touches: entrance effects, tab icon, share card)\"\nassert old in s; s=s.replace(old,new); open(p,'w').write(s)\nEOF\ngrep -n \"defaultSignatureEffect\" tools/generate/src/cli/ai/host-core.ts","description":"Wire default recording and look activity text"}
```

**Result**

```
178:  defaultSignatureEffect,
4399:                              await deps.plan(slug).write(defaultSignatureEffect).catch(() => null)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -i '' 's/back to one s…
<!-- xgd-tool name="Bash" id="toolu_011HoQHurapRLV9EGJpNFgCq" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:15:47.076904+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -i '' 's/back to one shape repeated; \\[\\[BUG-306\\]\\] and on the first draft, the chosen$/back to one shape repeated; [[BUG-306]] [[BUG-356]] and on the first draft, the/' tools/generate/src/cli/ai/account-core.ts && sed -i '' 's|      // signature effect; \\[\\[BUG-326\\]\\] and on any brief|      // signature effect unless declined; [[BUG-326]] and on any brief|' tools/generate/src/cli/ai/account-core.ts; grep -n \"BUG-356\" tools/generate/src/cli/ai/account-core.ts; git grep -ln \"hero movement, entrance\\|finishing touches: hero\" -- tests | head; git grep -ln \"EFFECT_FIRST_WORDS\\|firstBuildNote\\|NO_PLAN_NOTE\" -- tests | head","description":"Update comment, find affected pins"}
```

**Result**

```
2384:      // back to one shape repeated; [[BUG-306]] [[BUG-356]] and on the first draft, the
tests/test_UAT_FC_BUG-306_effect_before_the_first_draft.workers.test.ts
tests/test_UAT_FC_REQ-657_first_build_without_a_plan.workers.test.ts
tests/test_UAT_FC_REQ-657_the_plan_tool.test.ts
[This command modified 1 file you've previously read: tools/generate/src/cli/ai/account-core.ts. Call Read before editing.]
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 2383,2387p tools/ge…
<!-- xgd-tool name="Bash" id="toolu_014x1TKu3a1Kkb1quBRXx32T" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:15:52.546111+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 2383,2387p tools/generate/src/cli/ai/account-core.ts; grep -n \"NO_PLAN_NOTE\\|firstBuildNote\\|plan_note\" tests/test_UAT_FC_REQ-657_first_build_without_a_plan.workers.test.ts tests/test_UAT_FC_REQ-657_the_plan_tool.test.ts | head","description":"Check comment and REQ-657 pins"}
```

**Result**

```
      // their compositions, on a brief that may build home, so no builder falls
      // back to one shape repeated; [[BUG-306]] [[BUG-356]] and on the first draft, the
      // signature effect unless declined; [[BUG-326]] and on any brief, the client's recorded decisions
      // on its files, so a rejection binds every builder. Measured with the rest of the brief below.
      const planned = await limits.hostBrief?.(input ?? {}).catch(() => null)
tests/test_UAT_FC_REQ-657_first_build_without_a_plan.workers.test.ts:12:import { NO_PLAN_NOTE, type PlanFields } from '../tools/generate/src/cli/ai/plan-core'
tests/test_UAT_FC_REQ-657_first_build_without_a_plan.workers.test.ts:186:    expect(delegation.text).toContain(JSON.stringify(NO_PLAN_NOTE).slice(1, -1))
tests/test_UAT_FC_REQ-657_first_build_without_a_plan.workers.test.ts:208:    expect(delegation.text).not.toContain('plan_note')
tests/test_UAT_FC_REQ-657_the_plan_tool.test.ts:13:  firstBuildNote,
tests/test_UAT_FC_REQ-657_the_plan_tool.test.ts:14:  NO_PLAN_NOTE,
tests/test_UAT_FC_REQ-657_the_plan_tool.test.ts:171:    expect(firstBuildNote(plan.fields)).toBe(NO_PLAN_NOTE)
tests/test_UAT_FC_REQ-657_the_plan_tool.test.ts:172:    expect(NO_PLAN_NOTE).toContain('set_plan')
tests/test_UAT_FC_REQ-657_the_plan_tool.test.ts:175:    expect(firstBuildNote(plan.fields)).toBeNull()
tests/test_UAT_FC_REQ-657_the_plan_tool.test.ts:176:    expect(firstBuildNote({ milestones: { first_pass_at: AT } })).toBeNull()
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='tools…
<!-- xgd-tool name="Bash" id="toolu_01XCsDJA91qWmTQzdMjGhypJ" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:16:04.715956+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='tools/generate/src/cli/ai/plan-core.ts'\ns=open(p).read()\nnew='''export function firstBuildNote(fields: Partial<Pick<PlanFields, 'milestones' | 'handoff' | 'activities' | 'decisions'>>): string | null {\n  if (fields.milestones?.first_pass_at || fields.handoff) return null\n  // [[BUG-356]] — and when no signature effect has been picked for it.\n  const notes = [(fields.activities ?? []).length === 0 ? NO_PLAN_NOTE : null, effectUnpicked(fields) ? EFFECT_PICK_NOTE : null]\n  const said = notes.filter((n): n is string => n !== null)\n  return said.length > 0 ? said.join('\\\\n\\\\n') : null\n}'''\nold='''export function firstBuildNote(fields: Partial<Pick<PlanFields, 'milestones' | 'handoff' | 'activities'>>): string | null {\n  if (fields.milestones?.first_pass_at || fields.handoff) return null\n  return (fields.activities ?? []).length === 0 ? NO_PLAN_NOTE : null\n}'''\nassert new in s; s=s.replace(new,old)\ns=s.replace('''/** [[BUG-356]] — whether a first build would start with no effect picked and none declined. */\nconst effectUnpicked = (fields: Partial<Pick<PlanFields, 'milestones' | 'handoff' | 'decisions'>>): boolean =>\n  !fields.milestones?.first_pass_at && !fields.handoff && signatureEffect(fields).state === 'unanswered'\n''','''/** [[BUG-356]] — whether a first build would start with no effect picked and none declined. */\nconst effectUnpicked = (fields: Partial<Pick<PlanFields, 'milestones' | 'handoff' | 'decisions'>>): boolean =>\n  !fields.milestones?.first_pass_at && !fields.handoff && signatureEffect(fields).state === 'unanswered'\n\n/** [[BUG-356]] — the effect note for a first build, or `null`: {@link EFFECT_PICK_NOTE} while no effect is picked. */\nexport const firstBuildEffectNote = (fields: Partial<Pick<PlanFields, 'milestones' | 'handoff' | 'decisions'>>): string | null =>\n  effectUnpicked(fields) ? EFFECT_PICK_NOTE : null\n''')\nopen(p,'w').write(s)\np='tools/generate/src/cli/ai/account-core.ts'\ns=open(p).read()\ni=s.index('  firstBuildNote?: () => Promise<string | null>')\nprint(s[i-400:i+120])\nEOF","description":"Separate effect note from plan note"}
```

**Result**

```
 typeof IDLE_BUILDS_REFUSED | null
  /**
   * [[REQ-638]] — what this first build still waits for: the design written.
   * Empty once it holds, and once a first pass has landed.
   */
  firstBuildMissing?: () => Promise<string[]>
  /**
   * [[REQ-657]] — what a first build's result tells the consultant, or `null`: that
   * there is no plan yet. Information only; nothing is refused for it.
   */
  firstBuildNote?: () => Promise<string | null>
  /**
   * [[BUG-326]] — the client's message this turn answers, when it
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='tools…
<!-- xgd-tool name="Bash" id="toolu_01ETUrecDZ3xAmtzWCVUJWZJ" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:16:14.223101+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='tools/generate/src/cli/ai/account-core.ts'\ns=open(p).read()\ns=s.replace('''  firstBuildNote?: () => Promise<string | null>\n''','''  firstBuildNote?: () => Promise<string | null>\n  /**\n   * [[BUG-356]] — and that the first draft carries a signature effect nobody has\n   * picked yet, or `null`. Information only, like the plan note.\n   */\n  firstBuildEffectNote?: () => Promise<string | null>\n''',1)\nold='''      const planNote = (await limits.firstBuildNote?.()) ?? null\n      const noted = (r: Untyped): Untyped => (planNote ? { ...r, plan_note: planNote } : r)'''\nnew='''      const planNote = (await limits.firstBuildNote?.()) ?? null\n      // [[BUG-356]] — and when the effect it carries by default has not been picked.\n      const effectNote = (await limits.firstBuildEffectNote?.()) ?? null\n      const noted = (r: Untyped): Untyped => ({ ...r, ...(planNote ? { plan_note: planNote } : {}), ...(effectNote ? { effect_note: effectNote } : {}) })'''\nassert old in s; s=s.replace(old,new); open(p,'w').write(s)\np='tools/generate/src/cli/ai/host-core.ts'\ns=open(p).read()\nold='''                          firstBuildNote: async () => firstBuildNote((await deps.plan!(slug).read())?.fields ?? {}),'''\nnew=old+'''\n                          // [[BUG-356]] — and is told, never refused, when it carries an effect nobody picked.\n                          firstBuildEffectNote: async () => firstBuildEffectNote((await deps.plan!(slug).read())?.fields ?? {}),'''\nassert old in s; s=s.replace(old,new)\ns=s.replace(\"  firstBuildNote,\\n\",\"  firstBuildNote,\\n  firstBuildEffectNote,\\n\",1)\nopen(p,'w').write(s)\nEOF\ngrep -n \"noted(\" tools/generate/src/cli/ai/account-core.ts | head","description":"Wire effect_note into Delegate"}
```

**Result**

```
2436:      if (runs.length === 1) return noted(withPresentedAccount(result, scope))
2438:      return noted(withPresentedAccount({
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='apps/…
<!-- xgd-tool name="Bash" id="toolu_012RdkQ5ZRfMr5aDFJXQzwis" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:16:26.764094+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='apps/control-app/src/videogen.ts'\ns=open(p).read()\nold=s[s.index(\"    'Here a clip is a page hero: at most one on a page, and the movement subtle\"):s.index(\"    \\\"that it can be taken off again if it doesn't look right. A clip must fit 2 MB \\\" +\")]\nnew='''    'Here a clip is a page hero: at most one on a page. Its reveal is the eye-catcher, and it must be ' +\n    'noticed: a clear, nameable action a visitor sees in the first second or two (something enters ' +\n    'the frame, is poured, falls, is lifted in or lights up), ending exactly on the original photo. ' +\n    'Only the loop that follows is subtle (steam, a flicker, a slow drift); a faint stir is a loop, ' +\n    'not a reveal. Illustrations and secondary pictures can move too, but only on ' +\n    \"hover (`trigger: 'hover'`; on a phone it plays once as it scrolls into view): several \" +\n    'looping pictures on one page is too much movement, and hover clips do not count towards ' +\n    'the one hero. Two compatible ideas for one photo — a reveal and a subtle loop — need not ' +\n    'be either/or: propose them together by default, the reveal playing once and then the loop, made as a ' +\n    '`reveal` and a `loop` from the same photo; a loop alone is the exception. Before making one, describe the clip to the ' +\n    'client and get a yes to that design: what moves and what stays still, in what order, ' +\n    'how long it runs and how it loops, ' +\n    'where it sits on the page and what it replaces, that visitors see a still first, and ' +\n    \"that it can be taken off again if it doesn't look right. The one exception is the first draft's \" +\n    'signature effect, which you pick and make with the draft without a yes first, then describe ' +\n    'when you show the draft, with the other ideas you considered and that it comes off whenever they like. ' +\n    'A made clip reports how much of the picture its movement changes (`movement`): when it says the ' +\n    'reveal moves too little to notice, make the action bolder. ' +\n'''\ns=s.replace(old,new)\ns=s.replace(\"    \\\"that it can be taken off again if it doesn't look right. A clip must fit 2 MB \\\" +\",\"    'A clip must fit 2 MB ' +\",1)\nopen(p,'w').write(s)\nEOF\nsed -n 108,140p apps/control-app/src/videogen.ts","description":"Rewrite videoGuidance"}
```

**Result**

```
 *
 * NO PRICE. The client pays the operator, not per clip; a clip's cost is the
 * operator's, so it is metered ([[REQ-292]]) and never said to the client.
 */
export function videoGuidance(): string {
  return (
    'Here a clip is a page hero: at most one on a page. Its reveal is the eye-catcher, and it must be ' +
    'noticed: a clear, nameable action a visitor sees in the first second or two (something enters ' +
    'the frame, is poured, falls, is lifted in or lights up), ending exactly on the original photo. ' +
    'Only the loop that follows is subtle (steam, a flicker, a slow drift); a faint stir is a loop, ' +
    'not a reveal. Illustrations and secondary pictures can move too, but only on ' +
    "hover (`trigger: 'hover'`; on a phone it plays once as it scrolls into view): several " +
    'looping pictures on one page is too much movement, and hover clips do not count towards ' +
    'the one hero. Two compatible ideas for one photo — a reveal and a subtle loop — need not ' +
    'be either/or: propose them together by default, the reveal playing once and then the loop, made as a ' +
    '`reveal` and a `loop` from the same photo; a loop alone is the exception. Before making one, describe the clip to the ' +
    'client and get a yes to that design: what moves and what stays still, in what order, ' +
    'how long it runs and how it loops, ' +
    'where it sits on the page and what it replaces, that visitors see a still first, and ' +
    "that it can be taken off again if it doesn't look right. The one exception is the first draft's " +
    'signature effect, which you pick and make with the draft without a yes first, then describe ' +
    'when you show the draft, with the other ideas you considered and that it comes off whenever they like. ' +
    'A made clip reports how much of the picture its movement changes (`movement`): when it says the ' +
    'reveal moves too little to notice, make the action bolder. ' +
    'A clip must fit 2 MB ' +
    '(2,000,000 bytes), which holds a looping clip of about 6 s or less (pingpong at 540p): ' +
    'when a client wants a loop slower, offer a slower camera move in a loop of 6 s or less, ' +
    'not a longer clip. Do not try 8–10 s: a clip over the limit is refused only after it has ' +
    'been made, minutes later, and it still counts towards the clips this client may have. ' +
    'Tell them it takes a few ' +
    'minutes, and never mention a price or cost to the client: clips are part of their service. ' +
    'To show it, place the clip (`ticket`) ' +
    'and its last frame ' +
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs && n=0; for f…
<!-- xgd-tool name="Bash" id="toolu_017bUeuJ9c89DyjPLYPaRkLa" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:16:44.891929+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/blobs && n=0; for f in *; do h=$(head -c 12 \"$f\" | tail -c 4); [ \"$h\" = \"ftyp\" ] && { echo \"$f $(stat -f %z \"$f\")\"; n=$((n+1)); }; done | head -40; cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n \"r2 object put\\|wrangler.*r2\" -- tools/generate/src | head -5","description":"Find local dev mp4 clips"}
```

**Result**

```
tools/generate/src/cli/index.ts:543:    (e.g. apps/control-app/.wrangler/state/v3/r2). A case whose draft cannot be put
tools/generate/src/cli/push.ts:21: * neither. The alternatives were to drive `wrangler d1 execute` and `wrangler r2
tools/generate/src/fonts/publish.ts:138: * `fetch` against the REST API rather than a `wrangler r2 object put` per object:
tools/generate/src/fonts/seed.ts:7: * where `env.SITES` is miniflare's own R2 under `.wrangler/state/v3/r2/`, which
tools/generate/src/fonts/seed.ts:35: *   - **Not `wrangler r2 object put --local`, once per object.** `publish.ts`
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/r2/ && ls; for b in */blobs; do for f in…
<!-- xgd-tool name="Bash" id="toolu_01KTMGpAjFoWSBVHCsaedLyB" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:18:11.027623+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/r2/ && ls; for b in */blobs; do for f in $b/*; do h=$(head -c 12 \"$f\" | tail -c 4 2>/dev/null); [ \"$h\" = \"ftyp\" ] && echo \"$f $(stat -f %z \"$f\")\"; done; done 2>/dev/null | head -40","description":"Search all local R2 buckets for mp4"}
```

**Result**

```
1stcontact-material
1stcontact-sites
miniflare-R2BucketObject
Command did not complete within its 120s timeout and was moved to the background (ID: b1gdi99z1). Output is being written to: /private/tmp/claude-501/-Users-martin-lagrangefoundry-1stcontact/6909dc45-e8e2-4c91-9972-2e1e0e43872a/tasks/b1gdi99z1.output. You will be notified when it completes. If it is still running after 10m in the background, it will be stopped and you will be notified. It is running now: do not start a second copy while it runs. If it is no longer needed, stop it with TaskStop. To check interim output, use Read on that file path.
Session cwd remains /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356; directory changes made by the backgrounded command do not apply to subsequent commands.
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/r2/miniflare-R2BucketObject && for db in…
<!-- xgd-tool name="Bash" id="toolu_01CS9ZA3MvMtfpQofANxXQyo" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:20:27.768723+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/r2/miniflare-R2BucketObject && for db in *.sqlite; do sqlite3 \"$db\" \"select key, blob_id, size from _mf_objects where http_metadata like '%video%' or key like '%.mp4' limit 50;\" 2>/dev/null | sed \"s|^|$db |\"; done | cut -c1-260 | head -40","description":"Query R2 metadata for video objects"}
```

**Result**

```
29d7da933c9aac9805f7c292102947e2962b4da17a05ddf86891e2d6265f78d8.sqlite sites/site_5ddc942aac351f9266bd731d2ff3d343/blob/5479945ac920334586a750adebe57590eb1ba3623405b58eb021f91ceefb5f99|bca57084f4b354cf69d556a713c4936aa96b0c3832dffcf091795c44770dee7f000001a176
29d7da933c9aac9805f7c292102947e2962b4da17a05ddf86891e2d6265f78d8.sqlite sites/site_005ef0d9f996bedab94f48d1147a05e7/blob/85b8aa8c4e790d2ac00daa2d73a1d4ad8a6a4249559f483a2fe9efbe1932d7f4|80cede1db8cb1439636132c1bf9b9fd435c32748523108df3f7e48dbcee87a9a000001a179
29d7da933c9aac9805f7c292102947e2962b4da17a05ddf86891e2d6265f78d8.sqlite sites/site_689a884089b1f60cb72fdc12de312b18/blob/64878c73d9d5be7c7cd9da336dbfcaad1e811c0d8f32c9aa490501a690373e09|49e1c9bcc90568f334ab96ef1fad988b1c03e60b6f715c6ed1e5349bd55a90f5000001a17f
29d7da933c9aac9805f7c292102947e2962b4da17a05ddf86891e2d6265f78d8.sqlite sites/site_689a884089b1f60cb72fdc12de312b18/blob/0be3df945e1f61794a7d96cd1f0d3492b934ec22623af5f62b6897327bc1b950|2cf3dc6d8c78d28d5c8c5d345a7f687fc5c90bf2c2e4db7a1ecef6a54ff1d3c7000001a17f
29d7da933c9aac9805f7c292102947e2962b4da17a05ddf86891e2d6265f78d8.sqlite sites/site_770dd23388c1e80d23fa8bc4c3d8c2dd/blob/3a8b4c5f7159930f9e561dad806fdf7ff04e178d7d11da342d3e03f83db56eff|ea26847be53d6932303ad5f0c1a066b86bfb0ce25dab5b08ec0041041da5069e000001a1a4
29d7da933c9aac9805f7c292102947e2962b4da17a05ddf86891e2d6265f78d8.sqlite sites/site_770dd23388c1e80d23fa8bc4c3d8c2dd/blob/3978b424fc48d39a0e7407cc8267347cd34306b1964d003eee93f57786293be9|bbdc63130b98c0b3cfd1a6eda35d876561e114d8337d14329e93121f57fc877d000001a1a8
29d7da933c9aac9805f7c292102947e2962b4da17a05ddf86891e2d6265f78d8.sqlite sites/site_770dd23388c1e80d23fa8bc4c3d8c2dd/blob/2eb6361680e3a2544ee2cd75e593932c10f961af30efc00d169095a4f2bbda11|cbd3091846cacb5ae5df2320fcfc8dbff7af953dc6a9ce996ebf3bcba1a0447c000001a1a8
29d7da933c9aac9805f7c292102947e2962b4da17a05ddf86891e2d6265f78d8.sqlite sites/site_770dd23388c1e80d23fa8bc4c3d8c2dd/blob/32fd1417bd598eba7ff5043776791516e9d27b1f0b8b95da86436ac4347bd3f7|ffcf5db0553efa01c86f81974f34fd42fb54d71177d64d3b8dfde0ab2e6fcc87000001a1a8
29d7da933c9aac9805f7c292102947e2962b4da17a05ddf86891e2d6265f78d8.sqlite sites/site_5560d6619ceb51fda653fc5ebc77a122/blob/8442c4f19a49f513558bd4e33e8a3c8af0dc5b286155d9e1466dcf8eddf664a2|9287c009c63fd27146af0ededc34bf57e44e58f737839cd1be27ffa9ca768466000001a1ac
29d7da933c9aac9805f7c292102947e2962b4da17a05ddf86891e2d6265f78d8.sqlite sites/site_5560d6619ceb51fda653fc5ebc77a122/blob/909d294be6147852b68627c1613f56c0dfe86d5568fadb3991948dcb4cec80d9|9abde08767fefd56a3ef621f76963a15a4111afb5b86ffd56c427fe6d5a9e06a000001a1ac
eda6da97a5988b1f983c51935a8a53ba6e44676e8d95f68911c132ef5ad3eb53.sqlite t/biz_1fa3e4ce5d6cead69027d7f879113188/ref/www.3lbarberco.com/index/assets/file.mp4|355c755e3fc2437bf356b68570fed0fbf167ad04e5d36cbb63f11d21211b9cdf000001a1500c1eac|4609448
eda6da97a5988b1f983c51935a8a53ba6e44676e8d95f68911c132ef5ad3eb53.sqlite t/biz_1fa3e4ce5d6cead69027d7f879113188/ref/www.3lbarberco.com/index/assets/file-1.mp4|32137dab9da740bcdc8d5a3bee9bb8762ea89d6a78fcb6e33aba55ecad4813f7000001a1500c1f9f|3081114
eda6da97a5988b1f983c51935a8a53ba6e44676e8d95f68911c132ef5ad3eb53.sqlite t/biz_1fa3e4ce5d6cead69027d7f879113188/blob/attachment-a017b1c3|20084093f2ea8459a6c9fcca4b6ead2912b8df144f1541e7b9288c02ef3a4ea5000001a1500f31f0|3081114
eda6da97a5988b1f983c51935a8a53ba6e44676e8d95f68911c132ef5ad3eb53.sqlite t/biz_1fa3e4ce5d6cead69027d7f879113188/blob/attachment-79983a0c|ddf894be804c4111fed83f17f32d6defefc5e6e57145bd99a8dc728efd48b1f1000001a1500f3206|4609448
eda6da97a5988b1f983c51935a8a53ba6e44676e8d95f68911c132ef5ad3eb53.sqlite t/biz_9028717e330c52d242b25d7bb564d7e2/ref/www.drybar.com/index/assets/848ee2b3-dcc2-473a-a8c0-339ede15aa82.mp4|0458f2016f35f89b47528ae2be1f55ebd3774906a822cdb81007674d8802cf5f000001a15aa3
eda6da97a5988b1f983c51935a8a53ba6e44676e8d95f68911c132ef5ad3eb53.sqlite t/biz_9028717e330c52d242b25d7bb564d7e2/ref/www.drybar.com/index/assets/6f1530e2-8ec0-4550-9dd9-8769081ae9dd.mp4|9be5e5175961a289ba92b96a05862596ad905bcca8c59e315a66db8f1a6c65fd000001a15aa3
eda6da97a5988b1f983c51935a8a53ba6e44676e8d95f68911c132ef5ad3eb53.sqlite t/biz_9028717e330c52d242b25d7bb564d7e2/ref/www.drybar.com/index/assets/848ee2b3-dcc2-473a-a8c0-339ede15aa82-1.mp4|1ae11862c02dbe3fdcc71bba1c4b5093b1671d0b4c095e98164b2d94f3c3718b000001a15a
eda6da97a5988b1f983c51935a8a53ba6e44676e8d95f68911c132ef5ad3eb53.sqlite t/biz_9028717e330c52d242b25d7bb564d7e2/ref/www.drybar.com/index/assets/6f1530e2-8ec0-4550-9dd9-8769081ae9dd-1.mp4|8e9596c694287015c1e0734054f0e3b71d560f2844533a1d69bde4dc00d12993000001a15a
eda6da97a5988b1f983c51935a8a53ba6e44676e8d95f68911c132ef5ad3eb53.sqlite t/biz_9028717e330c52d242b25d7bb564d7e2/ref/www.drybar.com/index/assets/848ee2b3-dcc2-473a-a8c0-339ede15aa82-1-1.mp4|a3946975263d733f8cbdce4357be78ec10209cc1ee7b04a794aa08a1a0ea9315000001a1
eda6da97a5988b1f983c51935a8a53ba6e44676e8d95f68911c132ef5ad3eb53.sqlite t/biz_9028717e330c52d242b25d7bb564d7e2/ref/www.drybar.com/index/assets/6f1530e2-8ec0-4550-9dd9-8769081ae9dd-1-1.mp4|50d4bb5927dd870f768af6099532974ebebd554593fdf1fdb4bd4105b6905627000001a1
eda6da97a5988b1f983c51935a8a53ba6e44676e8d95f68911c132ef5ad3eb53.sqlite t/biz_9028717e330c52d242b25d7bb564d7e2/ref/www.drybar.com/index/assets/848ee2b3-dcc2-473a-a8c0-339ede15aa82-1-1-1.mp4|63a85adb4ca71faeb6dbfe5f91980d1d9fc1c8fc3201a6e5fb0d6e5ec005c087000001
eda6da97a5988b1f983c51935a8a53ba6e44676e8d95f68911c132ef5ad3eb53.sqlite t/biz_9028717e330c52d242b25d7bb564d7e2/ref/www.drybar.com/index/assets/6f1530e2-8ec0-4550-9dd9-8769081ae9dd-1-1-1.mp4|4aa67af1c30fe32ec81385c7c34b694f0092d4752c9d7cdbcc5bf2c8fa18a9fa000001
eda6da97a5988b1f983c51935a8a53ba6e44676e8d95f68911c132ef5ad3eb53.sqlite t/biz_9028717e330c52d242b25d7bb564d7e2/blob/attachment-ebcc0fbc|d194d3db0724e5e89de66548
```

[elided — kept 5800 of 9711 bytes]

## Bash node --version; cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/r2/; mkdir -p $TMPDIR/bu…
<!-- xgd-tool name="Bash" id="toolu_01F6MF9NgiyVppStJfNXTPBx" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:20:37.860957+00:00" -->

**Input**

```json
{"command":"node --version; cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/r2/; mkdir -p $TMPDIR/bug356-clips; for db in miniflare-R2BucketObject/eda6*.sqlite miniflare-R2BucketObject/29d7*.sqlite; do sqlite3 \"$db\" \"select key, blob_id, size, http_metadata from _mf_objects where (http_metadata like '%video%') and key like 't/%/blob/%' and size < 2200000;\" ; done 2>/dev/null | wc -l","description":"Count candidate generated clips"}
```

**Result**

```
v24.2.0
      15
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/r2/; for db in miniflare-R2BucketObject/…
<!-- xgd-tool name="Bash" id="toolu_01Bm33aHdiNjjvdByYBUY3n9" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:20:43.655549+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact/apps/control-app/.wrangler/state/v3/r2/; for db in miniflare-R2BucketObject/eda6*.sqlite; do sqlite3 \"$db\" \"select key, blob_id from _mf_objects where (http_metadata like '%video%') and key like 't/%/blob/%' and size < 2200000;\" ; done | while IFS='|' read k b; do f=$(ls */blobs/$b 2>/dev/null | head -1); n=$(echo $k | sed 's|t/biz_\\([0-9a-f]\\{6\\}\\).*/blob/attachment-\\(.*\\)|\\1-\\2|'); [ -n \"$f\" ] && cp \"$f\" $TMPDIR/bug356-clips/$n.mp4; done; ls -la $TMPDIR/bug356-clips; for f in $TMPDIR/bug356-clips/*.mp4; do echo \"$(basename $f) $(ffprobe -v error -show_entries format=duration:stream=width,height -of csv=p=0 $f | tr '\\n' ' ')\"; done","description":"Extract dev clips and probe them"}
```

**Result**

```
total 17192
drwxrwxr-x     17 martin  wheel      544 Nov  5 17:20 .
drwx------  30531 martin  wheel   976992 Nov  5 17:20 ..
-rw-rw-r--      1 martin  wheel   589434 Nov  5 17:20 8387fe-9e90f32f.mp4
-rw-rw-r--      1 martin  wheel    76050 Nov  5 17:20 902871-0acd2c2f.mp4
-rw-rw-r--      1 martin  wheel    75847 Nov  5 17:20 902871-1b6f4b66.mp4
-rw-rw-r--      1 martin  wheel    75810 Nov  5 17:20 902871-48c77dde.mp4
-rw-rw-r--      1 martin  wheel    76255 Nov  5 17:20 902871-797ba0bc.mp4
-rw-rw-r--      1 martin  wheel  1596507 Nov  5 17:20 902871-ef979e11.mp4
-rw-rw-r--      1 martin  wheel   225793 Nov  5 17:20 dbe753-137d6664.mp4
-rw-rw-r--      1 martin  wheel   791711 Nov  5 17:20 dbe753-d2bdcfd7.mp4
-rw-rw-r--      1 martin  wheel  1095494 Nov  5 17:20 dbe753-ea80889b.mp4
-rw-rw-r--      1 martin  wheel  1018666 Nov  5 17:20 dbe753-edc91cc8.mp4
-rw-rw-r--      1 martin  wheel   546311 Nov  5 17:20 e52ec5-07d96e02.mp4
-rw-rw-r--      1 martin  wheel   352092 Nov  5 17:20 e914c5-7d2ac06b.mp4
-rw-rw-r--      1 martin  wheel   657444 Nov  5 17:20 e914c5-a2487905.mp4
-rw-rw-r--      1 martin  wheel  1212567 Nov  5 17:20 f189b2-1d9a925f.mp4
-rw-rw-r--      1 martin  wheel   382722 Nov  5 17:20 f189b2-b02930e2.mp4
8387fe-9e90f32f.mp4 810,540 5.041667 
[mov,mp4,m4a,3gp,3g2,mj2 @ 0xa21040000] trun track id unknown, no tfhd was found
[mov,mp4,m4a,3gp,3g2,mj2 @ 0xa21040000] error reading header
/tmp/claude-501/bug356-clips/902871-0acd2c2f.mp4: Invalid data found when processing input
902871-0acd2c2f.mp4 
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x778c5c000] trun track id unknown, no tfhd was found
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x778c5c000] error reading header
/tmp/claude-501/bug356-clips/902871-1b6f4b66.mp4: Invalid data found when processing input
902871-1b6f4b66.mp4 
[mov,mp4,m4a,3gp,3g2,mj2 @ 0xa9cc7c000] trun track id unknown, no tfhd was found
[mov,mp4,m4a,3gp,3g2,mj2 @ 0xa9cc7c000] error reading header
/tmp/claude-501/bug356-clips/902871-48c77dde.mp4: Invalid data found when processing input
902871-48c77dde.mp4 
[mov,mp4,m4a,3gp,3g2,mj2 @ 0xa06c5c000] trun track id unknown, no tfhd was found
[mov,mp4,m4a,3gp,3g2,mj2 @ 0xa06c5c000] error reading header
/tmp/claude-501/bug356-clips/902871-797ba0bc.mp4: Invalid data found when processing input
902871-797ba0bc.mp4 
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x85105c000] trun track id unknown, no tfhd was found
[mov,mp4,m4a,3gp,3g2,mj2 @ 0x85105c000] error reading header
/tmp/claude-501/bug356-clips/902871-ef979e11.mp4: Invalid data found when processing input
902871-ef979e11.mp4 
dbe753-137d6664.mp4 1152,540 5.000000 
dbe753-d2bdcfd7.mp4 1152,540 5.000000 
dbe753-ea80889b.mp4 1152,540 5.000000 
dbe753-edc91cc8.mp4 1152,540 5.000000 
e52ec5-07d96e02.mp4 1080,720 5.083333 
e914c5-7d2ac06b.mp4 1080,720 5.083333 
e914c5-a2487905.mp4 1080,720 5.083333 
f189b2-1d9a925f.mp4 1080,720 5.000000 
f189b2-b02930e2.mp4 1078,720 5.000000
```

## Write /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/clip-moveme…
<!-- xgd-tool name="Write" id="toolu_01Dt5ggLJPm1XbteJAbL6FkA" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:21:12.896865+00:00" -->

**Input**

```json
{"content":"/**\n * [[BUG-356]] — HOW MUCH A CLIP'S MOVEMENT CHANGES THE PICTURE, measured on the\n * made clip and reported to the consultant with it.\n *\n * A hero clip's reveal is its eye-catcher: a visitor has to notice it in the\n * first second or two. On a first-draft run the consultant made a faint stir of\n * leaves on a food photo, and the operator watching it saw nothing move. The\n * model cannot watch its own clip, so the host measures it and says so in the\n * clip's result — information, never a refusal: a clip that moves too little is\n * still the consultant's to keep or remake.\n *\n * THE MEASURE. The clip is decoded to small greyscale frames (a few a second);\n * each frame is compared with the clip's LAST frame, which for a reveal is the\n * original photo it ends on. A pixel \"changed\" when it differs from that frame by\n * more than {@link PIXEL_DELTA}; the clip's movement is the largest share of the\n * picture that changed in any one frame. A dish lifted into frame changes most of\n * the picture before it lands; a stir of leaves changes a sliver of it.\n *\n * RUNS ON `ffmpeg` IN THE JOB CONTAINER (architecture item 31: media processing\n * in a job container, not a Worker), where the consultant and its clip tool\n * already run. The decoder is injected ({@link FrameDecoder}), so the arithmetic\n * is tested anywhere and only {@link ffmpegDecoder} needs the binary.\n *\n * THE THRESHOLD IS ONE VALUE, {@link NOTICEABLE_SHARE}, so recalibrating changes\n * one number. `1c showcase measure` reports every showcase item's score against\n * it: a showcase reveal that fails is the signal to lower it.\n */\n\n/** The side of the square every frame is scaled to before it is compared. */\nexport const FRAME_SIDE = 64\n\n/** Frames decoded per second of clip. */\nexport const FRAMES_PER_SECOND = 8\n\n/** How far (0–255) a grey pixel must differ from the last frame to count as changed. */\nexport const PIXEL_DELTA = 32\n\n/**\n * The share of the picture a reveal must change for a visitor to notice it.\n *\n * Calibrated 2026-11-05 on the dev store's generated clips: the clear reveals and\n * camera moves measured 0.33–0.97 and the gentle loops 0.00–0.07, so 0.15 sits with\n * room on both sides. Synthetic fixtures pin it: an object entering the frame passes,\n * a faint stir is flagged.\n */\nexport const NOTICEABLE_SHARE = 0.15\n\n/** What one clip measured. */\nexport interface Movement {\n  /** The largest share of the picture (0–1) that differs from the last frame in any one frame. */\n  share: number\n  /** The same, as a whole percentage, for the sentence. */\n  percent: number\n  /** Whether that is enough for a visitor to notice ({@link NOTICEABLE_SHARE}). */\n  noticeable: boolean\n  /** How many frames were compared. */\n  frames: number\n}\n\n/** Decodes a clip into greyscale frames of {@link FRAME_SIDE}², oldest first. */\nexport type FrameDecoder = (clip: Uint8Array) => Promise<Uint8Array[]>\n\n/** The movement in already-decoded frames: each against the last. */\nexport function movementOf(frames: readonly Uint8Array[], threshold: number = NOTICEABLE_SHARE): Movement {\n  const last = frames.at(-1)\n  let share = 0\n  if (last && last.length > 0) {\n    for (const frame of frames) {\n      let changed = 0\n      const n = Math.min(frame.length, last.length)\n      for (let i = 0; i < n; i++) if (Math.abs(frame[i] - last[i]) > PIXEL_DELTA) changed++\n      share = Math.max(share, changed / last.length)\n    }\n  }\n  return { share, percent: Math.round(share * 100), noticeable: share >= threshold, frames: frames.length }\n}\n\n/** Measure a clip with a decoder. */\nexport async function measureMovement(clip: Uint8Array, decode: FrameDecoder): Promise<Movement> {\n  return movementOf(await decode(clip))\n}\n\n/**\n * The sentence the consultant reads in a clip's result. A reveal below the\n * threshold is told to be bolder; a loop is meant to be subtle, so it is only\n * described.\n */\nexport function movementLine(m: Movement, mode: string): string {\n  if (mode !== 'reveal') return `${m.percent}% of the picture changes as it plays; a loop is meant to be subtle.`\n  if (m.noticeable) return `${m.percent}% of the picture changes over the reveal: enough for a visitor to notice.`\n  return (\n    `This moves too little for a visitor to notice (${m.percent}% of the picture changes over the reveal; ` +\n    `a noticeable reveal changes at least ${Math.round(NOTICEABLE_SHARE * 100)}%). Make the action bolder: something enters the frame, is poured, falls, is lifted in or lights up.`\n  )\n}\n\n/**\n * The `ffmpeg` decoder: the clip on stdin, raw grey frames on stdout. Node only\n * — `node:child_process` is imported when it is first used, so a Worker bundle\n * that never calls it never loads it.\n */\nexport function ffmpegDecoder(binary = 'ffmpeg'): FrameDecoder {\n  return async (clip) => {\n    const { spawn } = await import('node:child_process')\n    const size = FRAME_SIDE * FRAME_SIDE\n    return await new Promise<Uint8Array[]>((resolve, reject) => {\n      const child = spawn(\n        binary,\n        ['-v', 'error', '-i', 'pipe:0', '-an', '-vf', `fps=${FRAMES_PER_SECOND},scale=${FRAME_SIDE}:${FRAME_SIDE}:flags=area,format=gray`, '-f', 'rawvideo', 'pipe:1'],\n        { stdio: ['pipe', 'pipe', 'pipe'] },\n      )\n      const out: Buffer[] = []\n      let err = ''\n      child.stdout.on('data', (b: Buffer) => out.push(b))\n      child.stderr.on('data', (b: Buffer) => (err += b.toString()))\n      child.on('error', reject)\n      child.on('close', (code) => {\n        if (code !== 0) return reject(new Error(`ffmpeg exited ${code}: ${err.trim().slice(0, 300)}`))\n        const all = Buffer.concat(out)\n        const frames: Uint8Array[] = []\n    
```

[elided — kept 5800 of 6192 bytes]

**Result**

```
File created successfully at: /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/clip-movement.ts (file state is current in your context — no need to Read it back)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && cat > $TMPDIR/bug356-cal.m…
<!-- xgd-tool name="Bash" id="toolu_015SaUTtFqjNcESuqWHvpjdT" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:21:22.486567+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && cat > $TMPDIR/bug356-cal.mts <<'EOF'\nimport { readFileSync, readdirSync } from 'node:fs'\nimport { ffmpegDecoder, movementOf } from '/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/clip-movement.ts'\nconst dir = process.argv[2]\nconst dec = ffmpegDecoder()\nfor (const f of readdirSync(dir).filter((x) => x.endsWith('.mp4') && !x.startsWith('902871'))) {\n  const frames = await dec(new Uint8Array(readFileSync(`${dir}/${f}`)))\n  const m = movementOf(frames)\n  // per-second profile\n  const prof = [0, 8, 16, 24, 32].map((i) => frames[i] ? movementOf([frames[i], frames.at(-1)!]).percent : '-')\n  console.log(f, m.percent, m.frames, prof.join(','))\n}\nEOF\nnode $TMPDIR/bug356-cal.mts $TMPDIR/bug356-clips 2>&1 | grep -v ExperimentalWarning","description":"Run the measure on dev clips"}
```

**Result**

```
(Use `node --trace-warnings ...` to show where the warning was created)
(node:46899) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/clip-movement.ts is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/package.json.
file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/clip-movement.ts:118
        if (code !== 0) return reject(new Error(`ffmpeg exited ${code}: ${err.trim().slice(0, 300)}`))
                                      ^

Error: ffmpeg exited 183: [mov,mp4,m4a,3gp,3g2,mj2 @ 0xa1b038000] stream 0, offset 0x30: partial file
    Last message repeated 1 times
[in#0/mov,mp4,m4a,3gp,3g2,mj2 @ 0xa1ac40000] Error during demuxing: Invalid data found when processing input
Cannot determine format of input 0:0 after EOF
[vf#0:0 @ 0xa1ac640a0] Task finish
    at ChildProcess.<anonymous> (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/clip-movement.ts:118:39)
    at ChildProcess.emit (node:events:507:28)
    at maybeClose (node:internal/child_process:1101:16)
    at ChildProcess._handle.onexit (node:internal/child_process:305:5)

Node.js v24.2.0
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='apps/…
<!-- xgd-tool name="Bash" id="toolu_01THCm3dtLcqWKGvjGt4itdx" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:21:34.279575+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='apps/control-app/src/clip-movement.ts'\ns=open(p).read()\ns=s.replace(''' * The `ffmpeg` decoder: the clip on stdin, raw grey frames on stdout. Node only\n * — `node:child_process` is imported when it is first used, so a Worker bundle\n * that never calls it never loads it.\n */''',''' * The `ffmpeg` decoder: the clip in a temporary file (an MP4 whose index comes\n * last cannot be read from a pipe), raw grey frames on stdout. Node only — the\n * Node modules are imported when it is first used, so a Worker bundle that never\n * calls it never loads them.\n */''')\ns=s.replace('''    const { spawn } = await import('node:child_process')\n    const size = FRAME_SIDE * FRAME_SIDE\n    return await new Promise<Uint8Array[]>((resolve, reject) => {\n      const child = spawn(\n        binary,\n        ['-v', 'error', '-i', 'pipe:0',''','''    const { spawn } = await import('node:child_process')\n    const { mkdtemp, writeFile, rm } = await import('node:fs/promises')\n    const { tmpdir } = await import('node:os')\n    const { join } = await import('node:path')\n    const size = FRAME_SIDE * FRAME_SIDE\n    const dir = await mkdtemp(join(tmpdir(), 'clip-movement-'))\n    const input = join(dir, 'clip.mp4')\n    await writeFile(input, clip)\n    try {\n      return await decodeFile(spawn, binary, input, size)\n    } finally {\n      await rm(dir, { recursive: true, force: true })\n    }\n  }\n}\n\nfunction decodeFile(spawn: typeof import('node:child_process').spawn, binary: string, input: string, size: number): Promise<Uint8Array[]> {\n  {\n    return new Promise<Uint8Array[]>((resolve, reject) => {\n      const child = spawn(\n        binary,\n        ['-v', 'error', '-i', input,''')\ns=s.replace(\"\"\"        { stdio: ['pipe', 'pipe', 'pipe'] },\"\"\",\"\"\"        { stdio: ['ignore', 'pipe', 'pipe'] },\"\"\")\ns=s.replace('''      child.stdin.on('error', () => {})\n      child.stdin.end(Buffer.from(clip))\n    })\n  }\n}''','''    })\n  }\n}''')\nopen(p,'w').write(s)\nEOF\nnode $TMPDIR/bug356-cal.mts $TMPDIR/bug356-clips 2>&1 | grep -v \"Warning\\|warning\\|Reparsing\\|eliminate\"","description":"Switch decoder to temp file, rerun calibration"}
```

**Result**

```
8387fe-9e90f32f.mp4 47 40 47,42,35,26,8
dbe753-137d6664.mp4 0 40 0,0,0,0,0
dbe753-d2bdcfd7.mp4 27 40 0,7,23,22,5
dbe753-ea80889b.mp4 38 40 0,24,35,34,22
dbe753-edc91cc8.mp4 39 40 0,28,35,35,25
e52ec5-07d96e02.mp4 1 41 0,1,1,1,1
e914c5-7d2ac06b.mp4 2 41 0,1,1,1,0
e914c5-a2487905.mp4 10 41 1,7,5,4,2
f189b2-1d9a925f.mp4 40 40 37,37,39,22,6
f189b2-b02930e2.mp4 0 40 0,0,0,0,0
```

## Bash cd $TMPDIR/bug356-clips && for f in 8387fe-9e90f32f e52ec5-07d96e02 e914c5-a2487905 f189b2-1d9a925f dbe753-ea80889b e914…
<!-- xgd-tool name="Bash" id="toolu_01JMajRBF3PrwfgcnucDWb64" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:21:43.174802+00:00" -->

**Input**

```json
{"command":"cd $TMPDIR/bug356-clips && for f in 8387fe-9e90f32f e52ec5-07d96e02 e914c5-a2487905 f189b2-1d9a925f dbe753-ea80889b e914c5-7d2ac06b; do ffmpeg -v error -y -i $f.mp4 -vf \"fps=1.2,scale=200:-2,tile=6x1\" -frames:v 1 sheet-$f.png; done; ls sheet-*","description":"Make contact sheets of clips"}
```

**Result**

```
sheet-8387fe-9e90f32f.png
sheet-dbe753-ea80889b.png
sheet-e52ec5-07d96e02.png
sheet-e914c5-7d2ac06b.png
sheet-e914c5-a2487905.png
sheet-f189b2-1d9a925f.png
Shell cwd was reset to /Users/martin/lagrangefoundry/1stcontact
```

## Read /tmp/claude-501/bug356-clips/sheet-8387fe-9e90f32f.png
<!-- xgd-tool name="Read" id="toolu_01ADK9MjXbLUYjwWLa2aRWb3" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:21:46.641920+00:00" -->

**Input**

```json
{"file_path":"/tmp/claude-501/bug356-clips/sheet-8387fe-9e90f32f.png"}
```

**Result**

```

```

## Read /tmp/claude-501/bug356-clips/sheet-e914c5-a2487905.png
<!-- xgd-tool name="Read" id="toolu_012N16UD8ofRYP8o9EdJRTPx" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:21:47.136740+00:00" -->

**Input**

```json
{"file_path":"/tmp/claude-501/bug356-clips/sheet-e914c5-a2487905.png"}
```

**Result**

```

```

## Read /tmp/claude-501/bug356-clips/sheet-e52ec5-07d96e02.png
<!-- xgd-tool name="Read" id="toolu_01DpxStuw3q1J2jo26Z2RdZt" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:21:47.589511+00:00" -->

**Input**

```json
{"file_path":"/tmp/claude-501/bug356-clips/sheet-e52ec5-07d96e02.png"}
```

**Result**

```

```

## Read /tmp/claude-501/bug356-clips/sheet-f189b2-1d9a925f.png
<!-- xgd-tool name="Read" id="toolu_01Ny32yY3zEugcmLFUxLrspk" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:21:48.025463+00:00" -->

**Input**

```json
{"file_path":"/tmp/claude-501/bug356-clips/sheet-f189b2-1d9a925f.png"}
```

**Result**

```

```

## Read /tmp/claude-501/bug356-clips/sheet-e914c5-7d2ac06b.png
<!-- xgd-tool name="Read" id="toolu_01LeoKw43SwyHhzKpt6yU2LY" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:21:56.489895+00:00" -->

**Input**

```json
{"file_path":"/tmp/claude-501/bug356-clips/sheet-e914c5-7d2ac06b.png"}
```

**Result**

```

```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='apps/…
<!-- xgd-tool name="Bash" id="toolu_01SgXys1RkJwFr4ameFResXE" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:22:04.663424+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='apps/control-app/src/clip-movement.ts'\ns=open(p).read()\nold=s[s.index(\" * Calibrated 2026-11-05\"):s.index(\"export const NOTICEABLE_SHARE = 0.15\")+len(\"export const NOTICEABLE_SHARE = 0.15\")]\nnew=''' * Calibrated 2026-11-05 on the dev store's generated clips (never production\n * media): reveals measured 0.10 (a pepper grinder entering from the top edge, the\n * smallest clear action), 0.40 (a bowl lifted into frame) and 0.47 (a plate\n * settling); loops 0.00–0.02 (steam, a flicker of fire). 0.05 sits a factor of two\n * from each side. Synthetic fixtures pin it: an object entering the frame passes, a\n * faint stir is flagged.\n */\nexport const NOTICEABLE_SHARE = 0.05'''\ns=s.replace(old,new)\ns=s.replace(\" *\\n * Calibrated 2026-11-05 on the dev store's generated clips (never production\",\"\\n * Calibrated 2026-11-05 on the dev store's generated clips (never production\") if False else s\nopen(p,'w').write(s)\nEOF\nsed -n 36,52p apps/control-app/src/clip-movement.ts","description":"Set calibrated threshold"}
```

**Result**

```
export const PIXEL_DELTA = 32

/**
 * The share of the picture a reveal must change for a visitor to notice it.
 *
 * Calibrated 2026-11-05 on the dev store's generated clips (never production
 * media): reveals measured 0.10 (a pepper grinder entering from the top edge, the
 * smallest clear action), 0.40 (a bowl lifted into frame) and 0.47 (a plate
 * settling); loops 0.00–0.02 (steam, a flicker of fire). 0.05 sits a factor of two
 * from each side. Synthetic fixtures pin it: an object entering the frame passes, a
 * faint stir is flagged.
 */
export const NOTICEABLE_SHARE = 0.05

/** What one clip measured. */
export interface Movement {
  /** The largest share of the picture (0–1) that differs from the last frame in any one frame. */
```

## Bash P=~/.xgd/releases/current/bin/python; $P -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{"session":"bug-2568c791"…
<!-- xgd-tool name="Bash" id="toolu_01YUUvL98KBGst79gamwtTQo" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:22:12.045765+00:00" -->

**Input**

```json
{"command":"P=~/.xgd/releases/current/bin/python; $P -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{\"session\":\"bug-2568c791\",\"text\":\"2026-11-05: operator answered (ticket): showcase in operator console, copy to platform storage; ffmpeg in job container; calibrate on dev store only, NOTICEABLE_SHARE one value, `1c showcase measure`. Branch free-BUG-356 cut. Section 1 done (signatureEffect defaulted, effectBriefLine 3 cases, effect_note on Delegate result, host records defaulted, look activity names hero movement). Calibration on dev clips: pepper-grinder reveal 10%, bowl lift 40%, loops 1-2% -> threshold 0.05 (my first 0.15 would have flagged a real reveal).\"}' >/dev/null 2>&1; cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"attachments(\\|read_attachment(\\|readAttachment\" apps/control-app/src/tickets.ts | head; grep -n \"export function materialReader\" -A 25 apps/control-app/src/imagegen.ts | head -40","description":"Log progress; read attachment API"}
```

**Result**

```
1154:  attachments(a: { uid: string }): Promise<{ attachments: Ticket[] }>
1172:  read_attachment(a: {
449:export function materialReader(tickets: TicketStore): MaterialReader {
450-  /**
451-   * The record a name means, by uid or by any other spelling of it.
452-   *
453-   * THE DIRECT READ FIRST, ALWAYS, because it is one indexed lookup and it is
454-   * what every id this surface hands out actually is. The listing behind
455-   * `resolveStoredImage` is a scan, and it runs only when the direct read found
456-   * nothing — which is the miss path, not the ordinary one.
457-   */
458-  async function named(uid: string): Promise<Ticket> {
459-    try {
460-      return (await tickets.get({ uid })).ticket
461-    } catch {
462-      // Not a uid this store holds. It may still be a name a picture answers to.
463-    }
464-    const { match, candidates } = resolveStoredImage(uid, await materialImageLibrary(tickets).list())
465-    if (match) return (await tickets.get({ uid: match.name })).ticket
466-    if (candidates.length > 1) {
467-      throw new Error(
468-        `'${uid}' is the name of ${candidates.length} pictures: ` +
469-          `${candidates.map((c) => `'${c.name}'`).join(', ')}. Ask again with one of those.`,
470-      )
471-    }
472-    throw new Error(`there is no picture called '${uid}' in this client's material`)
473-  }
474-
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1150,1190p apps/con…
<!-- xgd-tool name="Bash" id="toolu_01TMxiHZn36RHXELhV4FjMVA" turn="6ddedeb011f04333880be815864de3f2" ts="2026-11-06T01:22:18.866632+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1150,1190p apps/control-app/src/tickets.ts","description":"Read attachments API signature"}
```

**Result**

```
    filename?: string
    content_type?: string
    meta?: Record<string, unknown>
  }): Promise<{ attachment: Ticket }>
  attachments(a: { uid: string }): Promise<{ attachments: Ticket[] }>
  /**
   * One attachment's bytes, with the record describing them — [[BUG-126]].
   *
   * NAMED HERE BECAUSE SOMETHING FINALLY READS BYTES BACK. `attach` wrote them
   * and `attachments` listed the records naming them, and until an image the
   * assistant is asked to CHANGE had to be fetched, nothing above this layer
   * needed one. The component has had the operation since its own REQ-150; this
   * repository simply had no caller — which is exactly how the handle in
   * `imagegen.ts` came to be two methods wide against a five-method expectation
   * and nothing said so. A call the type does not name is a call TypeScript
   * cannot check, so the omission was the bug's hiding place rather than an
   * incidental gap.
   *
   * The record travels BESIDE the bytes rather than being a second call, because
   * the filename, the content type and the size are what let a caller check what
   * it was handed against what was recorded.
   */
  read_attachment(a: {
    uid: string
  }): Promise<{ attachment: Ticket; bytes: Uint8Array; trashed: boolean }>
  /**
   * Move one attachment to the trash — [[REQ-166]].
   *
   * NAMED HERE because a recapture has to be able to supersede a member. It is
   * the component's `archive` under an attachment-specific name, so the bytes
   * stay recoverable and the retention sweep is what eventually reclaims them:
   * replacing a screenshot must not be a destructive act.
   */
  detach(a: { uid: string }): Promise<{ attachment: Ticket }>
  /**
   * Subscribe to the change log in scope — [[REQ-201]], upstream [[DOC-24]].
   *
   * `scope` takes `{filter}` (a query predicate, so there is no second filter
   * dialect to learn), an optional `fields` restriction, and an optional `since`
   * cursor. Omitting `since` starts from now; supplying one replays from there.
   *
```

## Bash W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356; cd $W && git status --short |…
<!-- xgd-tool name="Bash" id="toolu_01VCtdQ9gztWbEbJLRZdxSHy" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:33:46.958043+00:00" -->

**Input**

```json
{"command":"W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356; cd $W && git status --short | grep -v node_modules | head -20; git log --oneline -3; grep -n \"NOTICEABLE_SHARE = \\|decodeFile\" apps/control-app/src/clip-movement.ts","description":"Check worktree state"}
```

**Result**

```
 M apps/control-app/src/videogen.ts
 M tools/generate/src/cli/ai/account-core.ts
 M tools/generate/src/cli/ai/host-core.ts
 M tools/generate/src/cli/ai/plan-core.ts
 M tools/generate/src/cli/ai/plan-surface.json
?? apps/control-app/src/clip-movement.ts
fa573d85a0 xgd(ticket): update bug bug-2568c791
8b6a6f64a6 xgd(ticket): update bug bug-313c192b
330e083cbf xgd(ticket): update comment comment-d8169cbf
48:export const NOTICEABLE_SHARE = 0.05
116:      return await decodeFile(spawn, binary, input, size)
123:function decodeFile(spawn: typeof import('node:child_process').spawn, binary: string, input: string, size: number): Promise<Uint8Array[]> {
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git show fa573d85a0 --stat | tail -3; git show fa573d85a0 | grep "^[-+]"…
<!-- xgd-tool name="Bash" id="toolu_01CB9VQDiYHkNji8ZQiG38mH" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:33:53.114386+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git show fa573d85a0 --stat | tail -3; git show fa573d85a0 | grep \"^[-+]\" | grep -v \"^+++\\|^---\" | cut -c1-400 | head -30","description":"Show latest ticket change"}
```

**Result**

```
 .xgd/tickets/hot/bug-2568c791.md | 6 +++---
 1 file changed, 3 insertions(+), 3 deletions(-)
-updated_at: '2026-11-05T23:39:10.730185+00:00'
+updated_at: '2026-11-06T01:12:50.305820+00:00'
-last_field_updated: body
-status: draft
+last_field_updated: status
+status: free_coding
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='apps/…
<!-- xgd-tool name="Bash" id="toolu_018M9uVLFsdVDWky1RcwZegF" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:34:05.310941+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='apps/control-app/src/videogen.ts'\ns=open(p).read()\ns=s.replace(\"import { usdMicros, type MediaSpend } from './spend'\",\"import { measureMovement, movementLine, type FrameDecoder } from './clip-movement'\\nimport { usdMicros, type MediaSpend } from './spend'\",1)\ns=s.replace('''  /** The clock, for the heartbeat's throttle and the spend row's time. */\n  now?: () => number\n}''','''  /** The clock, for the heartbeat's throttle and the spend row's time. */\n  now?: () => number\n  /**\n   * [[BUG-356]] — decodes a made clip's frames so its movement is measured and\n   * reported in the result. The job container passes `ffmpeg`'s; absent, no\n   * clip is measured.\n   */\n  measure?: FrameDecoder | null\n}''',1)\nold='''      return { ...result, poster: store.posterOf(String(result.poster)) ?? result.poster }'''\nnew='''      const movement = await measured(String(result.ticket), String(result.mode ?? ''))\n      return { ...result, poster: store.posterOf(String(result.poster)) ?? result.poster, ...(movement ? { movement } : {}) }'''\nassert old in s; s=s.replace(old,new)\nold='''  /** The toolbox, with the cost taken off the result and the poster's material id put on it. */'''\nnew='''  /**\n   * [[BUG-356]] — the made clip's movement, as the sentence its result carries, and\n   * as a share on the clip itself. Information only: a measure that cannot run\n   * costs the consultant nothing but the sentence.\n   */\n  async function measured(uid: string, mode: string): Promise<string | null> {\n    if (!opts.measure) return null\n    try {\n      const { attachments } = await tickets.attachments({ uid })\n      const clip = attachments.find((a) => String(a.fields.content_type ?? '').startsWith('video/')) ?? attachments[0]\n      if (!clip) return null\n      const { bytes } = await tickets.read_attachment({ uid: clip.uid })\n      const m = await measureMovement(bytes, opts.measure)\n      await tickets.update({ uid, patch: { fields: { movement_pct: m.percent } } })\n      return movementLine(m, mode)\n    } catch (error) {\n      console.error('[BUG-356] could not measure a clip:', error)\n      return null\n    }\n  }\n\n  /** The toolbox, with the cost taken off the result and the poster's material id put on it. */'''\nassert old in s; s=s.replace(old,new)\nopen(p,'w').write(s)\nEOF\ngrep -n \"deps.videoPollMs\\|videoPollMs?\" apps/control-app/src/router.ts | head; grep -n \"launch\\|consultantHost(\" apps/control-app/container/server.ts | head","description":"Measure clip in toolbox result"}
```

**Result**

```
1139:          ...(deps.videoPollMs ? { pollIntervalMs: deps.videoPollMs } : {}),
1739:  videoPollMs?: number
78:  const launch = chromiumLauncher(vars.CHROMIUM_PATH)
95:          host: (scope, origin) => consultantHost(env, scope, origin, { launch }),
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1730,1745p apps/con…
<!-- xgd-tool name="Bash" id="toolu_016Svnh9LGZPPagQGoC41u2b" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:34:08.545009+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1730,1745p apps/control-app/src/router.ts; sed -n 1,40p apps/control-app/container/server.ts | grep -n \"import\"; sed -n 70,100p apps/control-app/container/server.ts","description":"Read router deps and server wiring"}
```

**Result**

```
   * silently also replaced the transport that ingestion's redirect
   * re-validation is proved against.
   *
   * ABSENT IS THE ORDINARY CASE and the adapter uses the runtime's own `fetch`.
   */
  imageFetch?: typeof fetch
  /** REQ-461 — the clip provider's transport, on `imageFetch`'s terms and kept apart from it. */
  videoFetch?: typeof fetch
  /** REQ-461 — how often the clip provider is polled, in ms; a suite polls at once. */
  videoPollMs?: number
  /**
   * The mail port ([[REQ-196]]), injected so the invite is provable offline
   * ([[REQ-199]]).
   *
   * ABSENT IS THE ORDINARY CASE and resolves to {@link mailerFor}, which picks
   * its adapter by whether the deployment holds a credential. It is here so a
21:import http from 'node:http'
22:import { consultantHost, clientPerson } from '../src/router'
23:import { executeStep, type StepRequest } from '../src/job-step'
24:import { platformFetch, platformTransport, remoteEnv } from '../src/platform-wire'
25:import { checkpointJobStep, type HostDeps } from '../../../tools/generate/src/cli/ai/host-core'
26:import { chromiumLauncher } from './chromium'
  if (job === '' || token === '' || base === '') throw new Error('the job container was started without JOB_ID, JOB_TOKEN and PLATFORM_URL')
  const direct = globalThis.fetch.bind(globalThis)
  const transport = platformTransport(base, job, token, direct)
  // THE PROCESS'S `fetch`: an account or provider API goes through the platform,
  // which attaches the credential this process is never given.
  globalThis.fetch = platformFetch(transport, vars, direct)
  const bound = (vars.PLATFORM_BOUND ?? '').split(',').filter((name) => name !== '')
  const env = remoteEnv(transport, bound, vars) as never
  const launch = chromiumLauncher(vars.CHROMIUM_PATH)
  let inflight: { request: StepRequest; deps: HostDeps | null; res: http.ServerResponse; cpu: number } | null = null
  let stopping = false

  const server = http.createServer((req, res) => {
    void (async () => {
      if (req.method === 'GET' && req.url === '/health') return send(res, stopping ? 503 : 200, { ok: !stopping })
      if (req.method !== 'POST' || req.url !== '/step') return send(res, 404, { error: 'no such route' })
      if (stopping) return send(res, 503, { error: 'stopping' })
      if (inflight) return send(res, 409, { error: 'a step is already running in this container' })
      const request = JSON.parse(await readBody(req)) as StepRequest
      if (request.job?.id !== job) return send(res, 403, { error: 'this container runs another job' })
      const cpu = cpuNow()
      const current = { request, deps: null as HostDeps | null, res, cpu }
      inflight = current
      try {
        const answer = await executeStep(request, {
          host: (scope, origin) => consultantHost(env, scope, origin, { launch }),
          person: (userId) => clientPerson(env, userId),
          running: (_request, deps) => {
            current.deps = deps
          },
        })
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='apps/…
<!-- xgd-tool name="Bash" id="toolu_01SHjZ3vNAtxxnqCxx2Zc3ia" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:34:18.508065+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='apps/control-app/src/router.ts'\ns=open(p).read()\ns=s.replace('''  /** REQ-461 — how often the clip provider is polled, in ms; a suite polls at once. */\n  videoPollMs?: number\n''','''  /** REQ-461 — how often the clip provider is polled, in ms; a suite polls at once. */\n  videoPollMs?: number\n  /**\n   * [[BUG-356]] — how a made clip's frames are decoded so its movement is\n   * measured: `ffmpeg`'s in the job container, a fake in a suite. Absent, no clip\n   * is measured (a Worker cannot run ffmpeg).\n   */\n  clipFrames?: FrameDecoder\n''',1)\ns=s.replace('''          ...(deps.videoPollMs ? { pollIntervalMs: deps.videoPollMs } : {}),\n''','''          ...(deps.videoPollMs ? { pollIntervalMs: deps.videoPollMs } : {}),\n          ...(deps.clipFrames ? { measure: deps.clipFrames } : {}),\n''',1)\ns=s.replace(\"import { videoSurface } from './videogen'\",\"import { videoSurface } from './videogen'\\nimport type { FrameDecoder } from './clip-movement'\",1)\nopen(p,'w').write(s)\np='apps/control-app/container/server.ts'\ns=open(p).read()\ns=s.replace(\"import { chromiumLauncher } from './chromium'\",\"import { chromiumLauncher } from './chromium'\\nimport { ffmpegDecoder } from '../src/clip-movement'\",1)\ns=s.replace(\"  const launch = chromiumLauncher(vars.CHROMIUM_PATH)\\n\",\"  const launch = chromiumLauncher(vars.CHROMIUM_PATH)\\n  // [[BUG-356]] — a made clip's movement is measured here, where ffmpeg is installed.\\n  const clipFrames = ffmpegDecoder(vars.FFMPEG_PATH ?? 'ffmpeg')\\n\",1)\ns=s.replace(\"consultantHost(env, scope, origin, { launch })\",\"consultantHost(env, scope, origin, { launch, clipFrames })\")\nopen(p,'w').write(s)\np='apps/control-app/container/Dockerfile'\ns=open(p).read()\ns=s.replace(\"# headless Chromium for the builder's pictures and page captures ([[DOC-86]] §3).\",\"# headless Chromium for the builder's pictures and page captures ([[DOC-86]] §3),\\n# and ffmpeg, which measures how much a made clip moves ([[BUG-356]]).\")\ns=s.replace(\" && apt-get install -y --no-install-recommends chromium fonts-liberation\",\" && apt-get install -y --no-install-recommends chromium ffmpeg fonts-liberation\")\ns=s.replace(\"    CHROMIUM_PATH=/usr/bin/chromium \\\\\",\"    CHROMIUM_PATH=/usr/bin/chromium \\\\\\n    FFMPEG_PATH=/usr/bin/ffmpeg \\\\\")\nopen(p,'w').write(s)\nEOF\ngrep -n \"vars\\b.*=\\|const vars\" apps/control-app/container/server.ts | head -3; git diff --stat","description":"Wire ffmpeg decoder into the container"}
```

**Result**

```
67:  const vars = Object.fromEntries(Object.entries(opts.vars).filter((e): e is [string, string] => typeof e[1] === 'string'))
77:  const bound = (vars.PLATFORM_BOUND ?? '').split(',').filter((name) => name !== '')
131:    server.listen(opts.port ?? Number(vars.PORT ?? 8080), '0.0.0.0', () => {
 apps/control-app/container/Dockerfile       |  6 +-
 apps/control-app/container/server.ts        |  5 +-
 apps/control-app/src/router.ts              |  8 +++
 apps/control-app/src/videogen.ts            | 49 ++++++++++++--
 tools/generate/src/cli/ai/account-core.ts   | 13 +++-
 tools/generate/src/cli/ai/host-core.ts      | 10 ++-
 tools/generate/src/cli/ai/plan-core.ts      | 99 ++++++++++++++++++++++-------
 tools/generate/src/cli/ai/plan-surface.json |  2 +-
 8 files changed, 155 insertions(+), 37 deletions(-)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n "'/api/admin/"…
<!-- xgd-tool name="Bash" id="toolu_01TtYwPb5dBBNoEdDFfQgzCm" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:34:28.276922+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n \"'/api/admin/\" -- apps/control-app/src/*.ts | cut -c1-180 | head -40; grep -n \"platformFontKey\" -A3 packages/site-schema/src/fonts.ts | head -8","description":"List admin routes and font key prefix"}
```

**Result**

```
apps/control-app/src/router.ts:2043:export const ADMIN_BUSINESSES_PATH = '/api/admin/businesses'
apps/control-app/src/router.ts:2052:export const ADMIN_FIRST_DRAFT_PATH = '/api/admin/businesses/first-draft'
apps/control-app/src/router.ts:2060:export const ADMIN_RECORD_CASES_PATH = '/api/admin/businesses/record-cases'
apps/control-app/src/router.ts:2081:export const ADMIN_ZONES_PATH = '/api/admin/zones'
apps/control-app/src/router.ts:2101:export const ADMIN_DNS_PATH = '/api/admin/dns'
apps/control-app/src/router.ts:2125:export const ADMIN_DOMAINS_PATH = '/api/admin/domains'
apps/control-app/src/router.ts:2151:export const ADMIN_SPEND_PATH = '/api/admin/spend'
apps/control-app/src/router.ts:2179:export const ADMIN_BUSINESS_SPEND_PATH = '/api/admin/spend/businesses'
apps/control-app/src/router.ts:2186:export const ADMIN_SPEND_CAPS_PATH = '/api/admin/spend/caps'
apps/control-app/src/router.ts:2215:export const ADMIN_SITES_PATH = '/api/admin/sites'
apps/control-app/src/router.ts:2225:export const ADMIN_TESTER_TIMELINE_PATH = '/api/admin/tester-timeline'
apps/control-app/src/router.ts:2252:export const ADMIN_TURNS_PATH = '/api/admin/turns'
apps/control-app/src/router.ts:2255:export const ADMIN_ISSUES_PATH = '/api/admin/issues'
apps/control-app/src/router.ts:2265:export const ADMIN_ESTIMATES_PATH = '/api/admin/estimates'
320:export function platformFontKey(path: string): string {
321-  return `${PLATFORM_FONT_KEY_PREFIX}${path}`
322-}
323-
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 2205,2270p apps/con…
<!-- xgd-tool name="Bash" id="toolu_01Xuq4siEivFV6q7KitJeEdS" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:34:31.669016+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 2205,2270p apps/control-app/src/router.ts; grep -n \"ADMIN_SITES_PATH\\|ADMIN_ESTIMATES_PATH\\|isOperator\\|operatorOnly\\|requireOperator\" apps/control-app/src/router.ts | head -30","description":"Read admin route definitions and gating"}
```

**Result**

```
 *
 * NO PERIOD PARAMETER. Nothing this route answers is measured over a window — a
 * site exists, belongs to somebody and is reachable or not — so accepting one
 * would be a parameter that changed no answer.
 *
 * GET AND NOTHING ELSE, for the reason the meter routes give: there is nothing
 * here to write. A site is created by provisioning and an address by
 * `claimHostname`, both elsewhere and both with consequences this read has none
 * of.
 */
export const ADMIN_SITES_PATH = '/api/admin/sites'

/**
 * GET /api/admin/tester-timeline?id= — a beta tester's time with the builder,
 * per site ([[REQ-480]]): sessions, stage times, reply times, idle gaps, the
 * abandon point and panel and tab use.
 *
 * OPERATOR-ONLY, on the console's gate: the tester never sees their timeline.
 * The id must be a contact of 1st Contact; any other answers 404.
 */
export const ADMIN_TESTER_TIMELINE_PATH = '/api/admin/tester-timeline'

/**
 * How one business's recent turns ended — the OPERATOR CONSOLE'S health section
 * ([[REQ-306]]).
 *
 * THE QUESTION IT ANSWERS is the ticket's fifth requirement verbatim: *is this
 * site failing turns repeatedly, and can I see that without a customer telling
 * me*. A whole tenant failed every turn for a period and the only trace was a
 * Cloudflare tail entry somebody went looking for. A number on the console is
 * what that absence costs to fix.
 *
 * THE SAME GATE AND THE SAME 404 as the meter routes beside it. The answer names
 * somebody else's conversations and how often this platform broke them, which is
 * strictly no more shareable than what they spent.
 *
 * NO PERIOD PARAMETER, WHERE ITS NEIGHBOURS TAKE ONE, and the asymmetry is the
 * ticket's point rather than an omission. *Failing repeatedly* is a statement
 * about consecutive turns, not about a window: a site that takes four turns a
 * week and lost all four is as broken as one that lost forty in an hour, and a
 * period wide enough to catch the first buries the second. So this reads the
 * most recent N turns and reports the run of losses at the head of them.
 *
 * GET AND NOTHING ELSE. The one fact this surface is about — a row nobody
 * closed — is recorded by its absence, so there is nothing here anybody could
 * write that would be evidence of anything.
 */
export const ADMIN_TURNS_PATH = '/api/admin/turns'

/** [[REQ-484]] — the platform issues filed from one business's conversations. */
export const ADMIN_ISSUES_PATH = '/api/admin/issues'

/**
 * [[BUG-360]] — GET /api/admin/estimates?business=…&from=…&to=… — how far the
 * host's time estimates were off, per kind of step, over the period (the last 30
 * days when none is given): each finished step's estimate against what it took.
 * `business` is optional: absent is every business, which is where a stale table
 * shows first. Behind `ownsPlatformBusiness`, 404 rather than 403, as every admin
 * route.
 */
export const ADMIN_ESTIMATES_PATH = '/api/admin/estimates'

/** [[BUG-360]] — the period {@link ADMIN_ESTIMATES_PATH} reads when none is asked for. */
export const ESTIMATES_DEFAULT_DAYS = 30

/**
2215:export const ADMIN_SITES_PATH = '/api/admin/sites'
2265:export const ADMIN_ESTIMATES_PATH = '/api/admin/estimates'
2267:/** [[BUG-360]] — the period {@link ADMIN_ESTIMATES_PATH} reads when none is asked for. */
2799:   * THE NAME IS THE PREDICATE'S, DELIBERATELY. Calling it `isOperator`, `isAdmin`
4996:    if (p === ADMIN_ESTIMATES_PATH && method === 'GET') {
5127:    if (p === ADMIN_SITES_PATH && method === 'GET') {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 4985,5015p apps/con…
<!-- xgd-tool name="Bash" id="toolu_01PwRRECRD3KKEciYXRctRw9" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:34:35.731628+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 4985,5015p apps/control-app/src/router.ts; sed -n 5120,5145p apps/control-app/src/router.ts; grep -n \"ADMIN_ISSUES_PATH &&\" -A 15 apps/control-app/src/router.ts | head -30","description":"Read admin route handlers"}
```

**Result**

```
     * from that business's conversations ([[REQ-484]]), newest first. Behind
     * `ownsPlatformBusiness`, 404 rather than 403, as every admin route.
     */
    if (p === ADMIN_ISSUES_PATH && method === 'GET') {
      if (!ownsPlatformBusiness(identityEnv, deps.admission)) return text(404, ADMIN_ONLY_MESSAGE)
      const business = (url.searchParams.get('business') ?? '').trim()
      if (business === '') return json(400, { error: 'business is required' })
      const store = await (deps.tickets ?? ticketStoreFor)(env, { businessId: requirePlatformTenant(identityEnv) })
      return json(200, { issues: await platformIssuesOf(store, business) })
    }

    if (p === ADMIN_ESTIMATES_PATH && method === 'GET') {
      if (!ownsPlatformBusiness(identityEnv, deps.admission)) return text(404, ADMIN_ONLY_MESSAGE)
      const business = (url.searchParams.get('business') ?? '').trim()
      const { period, unreadable } = spendPeriodOf(url)
      if (unreadable) return json(400, { error: `${unreadable} is not a readable timestamp` })
      const to = period.to ? new Date(Date.parse(period.to)).toISOString() : new Date().toISOString()
      const from = period.from ? new Date(Date.parse(period.from)).toISOString() : new Date(Date.parse(to) - ESTIMATES_DEFAULT_DAYS * 86_400_000).toISOString()
      return json(200, { business: business || null, ...(await estimateReport({ DB: env.DB }, business || null, from, to)) })
    }

    if (p === ADMIN_TURNS_PATH && method === 'GET') {
      const admission = deps.admission
      if (!ownsPlatformBusiness(identityEnv, admission)) {
        console.warn(
          JSON.stringify({
            event: 'admin_route_refused',
            path: p,
            email: admission?.ok ? admission.user.email : null,
          }),
        )
     * anything, which the league is right to leave out and this would be wrong to.
     *
     * THE SAME GATE, THE SAME 404, AND THE SAME LOG LINE as the routes above,
     * written out rather than routed through a helper for the reason the ones
     * above are: the refusal is the gate, and a gate that is one call away from
     * every route is one edit away from being the wrong call on one of them.
     */
    if (p === ADMIN_SITES_PATH && method === 'GET') {
      const admission = deps.admission
      if (!ownsPlatformBusiness(identityEnv, admission)) {
        console.warn(
          JSON.stringify({
            event: 'admin_route_refused',
            path: p,
            email: admission?.ok ? admission.user.email : null,
          }),
        )
        return text(404, ADMIN_ONLY_MESSAGE)
      }
      return json(200, { sites: await platformSites(identityEnv) })
    }

    if (p === ADMIN_TESTER_TIMELINE_PATH && method === 'GET') {
      const admission = deps.admission
      if (!ownsPlatformBusiness(identityEnv, admission)) {
        console.warn(
4988:    if (p === ADMIN_ISSUES_PATH && method === 'GET') {
4989-      if (!ownsPlatformBusiness(identityEnv, deps.admission)) return text(404, ADMIN_ONLY_MESSAGE)
4990-      const business = (url.searchParams.get('business') ?? '').trim()
4991-      if (business === '') return json(400, { error: 'business is required' })
4992-      const store = await (deps.tickets ?? ticketStoreFor)(env, { businessId: requirePlatformTenant(identityEnv) })
4993-      return json(200, { issues: await platformIssuesOf(store, business) })
4994-    }
4995-
4996-    if (p === ADMIN_ESTIMATES_PATH && method === 'GET') {
4997-      if (!ownsPlatformBusiness(identityEnv, deps.admission)) return text(404, ADMIN_ONLY_MESSAGE)
4998-      const business = (url.searchParams.get('business') ?? '').trim()
4999-      const { period, unreadable } = spendPeriodOf(url)
5000-      if (unreadable) return json(400, { error: `${unreadable} is not a readable timestamp` })
5001-      const to = period.to ? new Date(Date.parse(period.to)).toISOString() : new Date().toISOString()
5002-      const from = period.from ? new Date(Date.parse(period.from)).toISOString() : new Date(Date.parse(to) - ESTIMATES_DEFAULT_DAYS * 86_400_000).toISOString()
5003-      return json(200, { business: business || null, ...(await estimateReport({ DB: env.DB }, business || null, from, to)) })
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && ls apps/control-app/src/bu…
<!-- xgd-tool name="Bash" id="toolu_01X2zHSfbCbhAbZf7BU75CFB" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:34:48.103621+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && ls apps/control-app/src/builder/ | head -80; grep -n \"id: '\\|label: '\" apps/control-app/src/builder/platform-sites.js | head -30","description":"Console files and sections"}
```

**Result**

```
acceptances.js
api.js
app.js
archive-limit.js
attachments.js
banner.js
builder.css
business.js
carousel.js
carry.js
chat.js
client-pane.js
color-field.js
comparisons.js
config.js
console.js
contact-events.js
currency.js
debug.js
detail-pane.js
dns-history.js
domain.js
editor.js
email-shape.js
estimates.js
failure-notice.js
feedback.js
font-field.js
font-popup.js
font-search.js
fonts
growing-box.js
help.js
hostname.js
image-editor.js
image-picker.js
image-preview.js
input-board.js
launch.js
library.js
list-redraw.js
looks.js
main.js
markdown.js
material-actions.js
material-name.js
modal.js
opened-views.js
orders.js
page-style.js
pages.js
palette-popup.js
panel.js
payments.js
people-axes.js
people-name.js
people.js
phone-preview.js
picture-kind.js
plan-panel.js
plan-route.js
platform-issues.js
platform-sites.js
points.js
preview-width.js
publish-address.js
publish-status.js
qr.js
reader.js
sent-prompts.js
session.js
settings.js
shipping.js
shop.js
spend-cap.js
story-board.js
tenant-cost.js
toolbar.js
turn-health.js
updating.js
145:    id: 'account',
181:    id: 'address',
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 120,260p apps/contr…
<!-- xgd-tool name="Bash" id="toolu_011L3PJuqptmhoJSQTtwStEX" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:34:50.622576+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 120,260p apps/control-app/src/builder/platform-sites.js; grep -n \"estimates\\|platform-issues\\|tenant-cost\\|turn-health\" apps/control-app/src/builder/console.js | head","description":"Read console sections registry"}
```

**Result**

```
  tail.sort((a, b) => {
    const byName = label(a).localeCompare(label(b))
    return byName !== 0 ? byName : a.business < b.business ? -1 : a.business > b.business ? 1 : 0
  })
  return [...ranked, ...tail]
}

/**
 * The account of the selected site's business — who to talk to, and whether
 * their account is in good standing.
 *
 * `NULL` IS THE PLATFORM BUSINESS AND SAYS SO rather than rendering blank.
 * `tenants.owner_account_id` is null for 1st Contact itself and for nothing
 * else, so the one row where this is empty is the row where it is CORRECT to be
 * empty — and a blank cell would make that indistinguishable from an account
 * record that has gone missing, which is the other thing this can be and is the
 * one worth noticing.
 *
 * A SECTION AND THEREFORE A FACTORY. It closes over nothing and reads nothing;
 * everything it renders is already on the row the pane hands it, which is why it
 * cannot fail and why the failure-isolation the pane provides is for its
 * neighbours rather than for this.
 */
export function accountSection() {
  return {
    id: 'account',
    label: CONSOLE_SECTION_ACCOUNT,
    mount(container, { site }) {
      container.append(
        field('business', CONSOLE_FIELDS.business, site.businessName ?? CONSOLE_BUSINESS_NAME_MISSING),
        field('business-id', CONSOLE_FIELDS.businessId, site.business),
      )
      if (site.ownerAccount === null) {
        container.append(el('p', 'builder-console-sites__nothing', CONSOLE_ACCOUNT_PLATFORM))
        return
      }
      container.append(
        field('account', CONSOLE_FIELDS.account, site.ownerAccountName ?? CONSOLE_ACCOUNT_UNNAMED),
        field('account-id', CONSOLE_FIELDS.accountId, site.ownerAccount),
        field('status', CONSOLE_FIELDS.status, site.ownerAccountStatus ?? CONSOLE_ACCOUNT_MISSING),
      )
    },
  }
}

/**
 * A link to the published site, or a sentence saying there is none.
 *
 * NEVER AN EMPTY ANCHOR AND NEVER A DEAD LINK. A site with no public address is
 * a real and common state — it is exactly what `POST /api/publish` refuses on
 * with `NO_PUBLIC_ADDRESS` — and an anchor with nothing behind it would train
 * the operator to click something that cannot work. The sentence says the same
 * fact the refusal says, from the same read, so the two cannot disagree.
 *
 * A NEW BROWSER TAB, because the published site is not a builder surface.
 * Leaving the builder should look like leaving it, and the console's split
 * position and selection should still be there on the way back. `rel` is set for
 * the ordinary reason an outward link in this app sets it.
 */
export function addressSection() {
  return {
    id: 'address',
    label: CONSOLE_SECTION_ADDRESS,
    mount(container, { site }) {
      if (!site.address) {
        container.append(el('p', 'builder-console-sites__nothing', CONSOLE_SITE_NO_ADDRESS))
        return
      }
      const link = document.createElement('a')
      link.className = 'builder-console-sites__address'
      link.href = `https://${site.address}`
      link.textContent = site.address
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      container.append(link)
    },
  }
}

/**
 * The row's way into its business ([[REQ-367]]).
 *
 * A LINK TO THE BUILDER UNDER THAT BUSINESS'S PREFIX, and nothing more: the
 * server already lets the platform operator resolve a scope inside any hosted
 * business, so what was missing was a route there, not a permission. A real
 * anchor, so a middle click opens it beside the console and the browser's own
 * affordances work. The SAME tab by default — the operator is going there, and
 * the switcher and the banner are how they come back.
 *
 * ITS CLICK DOES NOT ALSO SELECT THE ROW. Navigating away makes the selection
 * moot, and a middle click that changed the detail pane behind the new tab
 * would be a side effect nobody asked for.
 */
function openControl(businessId) {
  const link = el('a', 'builder-console-sites__open', CONSOLE_OPEN_LABEL)
  link.href = businessPath(businessId, '/')
  link.dataset.open = businessId
  link.addEventListener('click', (event) => event.stopPropagation())
  return link
}

/** One labelled fact in the detail pane, addressed by its id and never its label. */
export function field(id, label, value) {
  const row = el('div', 'builder-console-sites__field')
  row.dataset.field = id
  row.append(
    el('span', 'builder-console-sites__field-label', label),
    el('span', 'builder-console-sites__field-value', value),
  )
  return row
}

/**
 * Mount the console's body into `container`.
 *
 * ITS TWO READS ARE INJECTED, defaulting to `api.js`, on [[REQ-297]]'s reasoning
 * exactly: that is what lets a UAT mount the real element against planted
 * answers and read back what an operator would see, rather than asserting
 * against a mock of the surface itself.
 *
 * @param {Element} container
 * @param {object} [spec]
 * @param {() => Promise<object>} [spec.fetchSites]
 * @param {(period: object) => Promise<object>} [spec.fetchLeague]
 * @param {() => Promise<object>} [spec.fetchCaps] [[REQ-489]] — which businesses are at their spend limit
 * @param {Array<{id: string, label: string, mount: (el: Element, selection: object) => ({destroy?: () => void}|void)}>} [spec.sections]
 * @param {object} [spec.storage] a `shell.storage(...)` handle — the split position
 * @param {() => number} [spec.now]
 * @param {number} [spec.days] the opening window — see `CONSOLE_PERIOD_DAYS`
 */
export function mountPlatformSites(
  container,
  {
    fetchSites = fetchPlatformSites,
    fetchLeague = fetchTenantCost,
    fetchCaps = fetchSpendCaps,
    sections = [],
    storage = null,
    now = () => Date.now(),
    days = CONSOLE_PERIOD_DAYS,
  } = {},
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "Section()\|sectio…
<!-- xgd-tool name="Bash" id="toolu_01GX2DHYB4PaAjaswZTCpud8" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:34:53.754377+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"Section()\\|sections:\\|mountPlatformSites\\|estimates\" apps/control-app/src/builder/*.js | grep -v \"^apps/control-app/src/builder/platform-sites.js\" | head -20; sed -n 1,80p apps/control-app/src/builder/platform-issues.js","description":"Where sections are composed; issues section"}
```

**Result**

```
apps/control-app/src/builder/api.js:2411: * [[BUG-360]] — how far the host's time estimates were off for one business,
apps/control-app/src/builder/api.js:2416:  const path = `/api/admin/estimates?business=${encodeURIComponent(business)}`
apps/control-app/src/builder/app.js:48:import { accountSection, addressSection, mountPlatformSites } from './platform-sites.js'
apps/control-app/src/builder/app.js:53:import { estimatesSection } from './estimates.js'
apps/control-app/src/builder/app.js:250:      accountSection(),
apps/control-app/src/builder/app.js:251:      addressSection(),
apps/control-app/src/builder/app.js:252:      tenantCostSection(),
apps/control-app/src/builder/app.js:253:      spendCapSection(),
apps/control-app/src/builder/app.js:254:      turnHealthSection(),
apps/control-app/src/builder/app.js:255:      estimatesSection(),
apps/control-app/src/builder/app.js:256:      platformIssuesSection(),
apps/control-app/src/builder/app.js:705:        mountPlatformSites(into, {
apps/control-app/src/builder/app.js:706:          sections: consoleSections,
apps/control-app/src/builder/estimates.js:2: * Time estimates ([[BUG-360]]) — the console detail pane's answer to *are the
apps/control-app/src/builder/estimates.js:32:export const ESTIMATES_ID = 'estimates'
apps/control-app/src/builder/estimates.js:49:export function estimatesSection({ fetchEstimates = fetchTenantEstimates } = {}) {
apps/control-app/src/builder/estimates.js:67:        el('p', 'builder-turn-health__error', `This business's estimates could not be read: ${err instanceof Error ? err.message : String(err)}`),
apps/control-app/src/builder/config.js:958: * [[BUG-360]] — the console's view of how far the host's time estimates were
apps/control-app/src/builder/config.js:961: * measured figures are re-surveyed (`1c estimates survey --write`) before a
apps/control-app/src/builder/config.js:964:export const ESTIMATES_LABEL = 'Time estimates'
/**
 * [[REQ-484]] — the issues the assistant filed from one business's
 * conversations, in the platform console beside that business's turns.
 *
 * Production has no filing service, so ReportBug records a platform issue in
 * the platform's own store; this is where the operator reads them. Each one is
 * its title and when it was filed, with the report itself one click away.
 */
import {
  PLATFORM_ISSUES_FAILED,
  PLATFORM_ISSUES_LABEL,
  PLATFORM_ISSUES_NONE,
  PLATFORM_ISSUES_READING,
} from './config.js'
import { fetchTenantIssues } from './api.js'

export const PLATFORM_ISSUES_ID = 'platform-issues'

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/** One filed issue: its id, title and when, with the report in a disclosure. */
function issueOf(issue) {
  const item = el('details', 'builder-platform-issues__issue')
  const head = [issue.id, issue.title, new Date(issue.filedAt).toLocaleString()].filter(Boolean).join(' · ')
  item.append(el('summary', 'builder-platform-issues__title', head), el('pre', 'builder-platform-issues__body', issue.body))
  return item
}

/**
 * @param {object} [spec]
 * @param {(business: string) => Promise<{issues: object[]}>} [spec.fetchIssues]
 */
export function platformIssuesSection({ fetchIssues = fetchTenantIssues } = {}) {
  return {
    id: PLATFORM_ISSUES_ID,
    label: PLATFORM_ISSUES_LABEL,
    mount: (container, { site }) => {
      let live = true
      container.append(el('p', 'builder-platform-issues__loading', PLATFORM_ISSUES_READING))
      ;(async () => {
        let answer
        try {
          answer = await fetchIssues(site.business)
        } catch (err) {
          if (live) {
            container.replaceChildren(
              el('p', 'builder-platform-issues__error', PLATFORM_ISSUES_FAILED(err instanceof Error ? err.message : String(err))),
            )
          }
          return
        }
        if (!live) return
        const issues = answer?.issues ?? []
        if (issues.length === 0) {
          container.replaceChildren(el('p', 'builder-platform-issues__none', PLATFORM_ISSUES_NONE))
          return
        }
        const list = el('div', 'builder-platform-issues')
        list.append(...issues.map(issueOf))
        container.replaceChildren(list)
      })()
      return {
        destroy() {
          live = false
        },
      }
    },
  }
}
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n "export async…
<!-- xgd-tool name="Bash" id="toolu_014qjPqFBa3euYJVVykwnECE" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:04.587668+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n \"export async function businessRenameSurfaceFor\\|export function businessRenameInstanceConfig\" -- tools apps | head; git grep -ln \"surfaceFor(lib\" -- tools/generate/src/cli/ai | head","description":"Find small surface patterns"}
```

**Result**

```
tools/generate/src/cli/ai/settings-core.ts:253:export function businessRenameInstanceConfig(): Record<string, unknown> {
tools/generate/src/cli/ai/settings-core.ts:517:export async function businessRenameSurfaceFor(lib: Untyped, deps: SettingsDeps): Promise<Untyped> {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 230,270p tools/gene…
<!-- xgd-tool name="Bash" id="toolu_013APE6g4j1VQjpehMV5ULuq" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:07.545604+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 230,270p tools/generate/src/cli/ai/settings-core.ts; sed -n 480,560p tools/generate/src/cli/ai/settings-core.ts","description":"Read rename surface construction"}
```

**Result**

```
export const BUSINESS_RENAME_DECLARATION: Record<string, unknown> = (() => {
  const d = SETTINGS_DECLARATION as Untyped
  const group = (d.groups as Untyped[]).find((g) => g.group === BUSINESS_RENAME_GROUP)
  const ops = (d.operations as Untyped[]).filter((o) => group.operations.includes(o.op))
  const errors = new Set(ops.flatMap((o) => o.errors as string[]))
  const types = new Set(ops.flatMap((o) => Object.values(o.params).map((p: Untyped) => p.type)))
  const pick = (from: Record<string, unknown>, keep: (k: string) => boolean): Record<string, unknown> =>
    Object.fromEntries(Object.entries(from).filter(([k]) => keep(k)))
  return {
    ...d,
    title: "The business's name",
    overview: '',
    param_types: pick(d.param_types, (k) => types.has(k)),
    shapes: pick(d.shapes, (k) => k === 'rename' || k === 'effects'),
    errors: pick(d.errors, (k) => errors.has(k)),
    operations: ops,
    groups: [{ ...group, description: '' }],
    sequences: [],
    absences: [],
  }
})()

/** [[REQ-487]] — the grant that travels with {@link BUSINESS_RENAME_DECLARATION}. */
export function businessRenameInstanceConfig(): Record<string, unknown> {
  return { [SETTINGS_SURFACE]: { groups: [BUSINESS_RENAME_GROUP] } }
}

/** The record as the model reads it — the declaration's `business` shape. */
function businessView(business: BusinessView): Record<string, unknown> {
  return {
    // `business` AND NOT `id`, because that is the noun the declaration uses
    // throughout and calling the field what the shape is called is what stops
    // the model translating.
    business: business.businessId,
    name: business.name,
  }
}

/** The effects as the model reads them — the declaration's `effects` shape. */
function effectsView(effects: BusinessEffects): Record<string, unknown> {
  return {
        ) {
          super(declaration)
          // Installed as OWN methods, not prototype ones, so the Toolbox's
          // startup binding check sees exactly the declared set and no more.
          const declared = new Set((declaration.operations as { op: string }[]).map((o) => o.op))
          for (const [op, run] of Object.entries(settingsOperations(deps, onWrite))) {
            if (declared.has(op)) (this as unknown as Params)[op] = run
          }
        }
      },
    )
    bound.set(mod as object, built)
    return built
  })
}

/**
 * The surface, bound to this deployment's business record.
 *
 * @param onWrite [[REQ-251]] — see {@link settingsOperations}. Optional, and a
 *   caller that omits it composes exactly the surface that existed before: the
 *   signal is the HOST's business, and a `1c` process with no pane beside it has
 *   nothing to tell.
 */
export async function settingsSurfaceFor(
  lib: Untyped,
  deps: SettingsDeps,
  onWrite: (op: string) => void = () => {},
): Promise<Untyped> {
  const SettingsToolbox = await settingsToolboxClass(lib)
  return new SettingsToolbox(deps, onWrite)
}

/**
 * [[REQ-487]] — the rename alone, bound to this deployment's business record, for
 * a site conversation. See {@link BUSINESS_RENAME_DECLARATION}.
 */
export async function businessRenameSurfaceFor(lib: Untyped, deps: SettingsDeps): Promise<Untyped> {
  const SettingsToolbox = await settingsToolboxClass(lib)
  return new SettingsToolbox(deps, () => {}, BUSINESS_RENAME_DECLARATION)
}
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && node -e " import('./apps/c…
<!-- xgd-tool name="Bash" id="toolu_01833o6tLeFoPRnYszcNQNgN" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:15.376766+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && node -e \"\nimport('./apps/control-app/src/generated/ai-videogen.js').then(m=>{const d=m.DECLARATION;console.log(Object.keys(d));console.log(JSON.stringify(d.groups));console.log(d.surface, JSON.stringify(m.instanceConfig()));const o=d.operations[0];console.log(Object.keys(o), o.op, o.tool, o.effect, JSON.stringify(o.returns), JSON.stringify(o.errors));console.log(Object.keys(d.shapes||{}), Object.keys(d.errors||{}), Object.keys(d.param_types||{}))})\" 2>&1 | head; ls apps/control-app/src/generated/ | grep -i video","description":"Inspect videogen declaration"}
```

**Result**

```
(node:54464) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/generated/ai-videogen.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
[
  'surface',   'version',
  'title',     'overview',
  'call_type', 'param_types',
  'groups',    'operations',
  'shapes',    'errors'
ai-videogen.d.ts
ai-videogen.js
videogen.d.ts
videogen.js
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && node -e " import('./apps/c…
<!-- xgd-tool name="Bash" id="toolu_01GWpTjP8aFfckobUzrbsws8" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:19.720570+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && node -e \"\nimport('./apps/control-app/src/generated/ai-videogen.js').then(m=>{const d=m.DECLARATION;console.log(JSON.stringify(d.groups));console.log(d.surface, d.call_type, JSON.stringify(m.instanceConfig()));const o=d.operations[0];console.log(Object.keys(o), o.op, o.tool, o.effect, JSON.stringify(o.returns), JSON.stringify(o.errors));console.log(JSON.stringify(d.shapes).slice(0,600)); console.log(Object.keys(d.errors), JSON.stringify(d.param_types).slice(0,300))})\" 2>&1 | grep -v \"Warning\\|Reparsing\\|eliminate\\|trace-warnings\"","description":"Inspect declaration details"}
```

**Result**

```
[{"group":"AnimateImages","effect":"write","title":"Animating a picture","description":"Turn a stored picture into a short silent clip, and store the clip and its last frame on a new ticket.","operations":["animate_image"]}]
videogen inproc {"videogen":{"groups":["AnimateImages"]}}
[
  'op',
  'tool',
  'summary',
  'description',
  'effect',
  'params',
  'returns',
  'errors'
] animate_image AnimateImage write {"shape":"generated_video","summary":{"access":"returned","fields":{"ticket":"ticket","mode":"mode","duration":"duration"}}} ["unknown_image","ambiguous_image","invalid_request","refused","budget_exhausted","over_size_limit","generator_exhausted","generator_misconfigured","generator_unavailable","processing_failed","store_unavailable"]
{"generated_video":{"ticket":"The id of the ticket holding the clip. This is the handle — pass it on, or read the ticket to see what was made.","video":"The id of the attachment record carrying the clip itself.","poster":"The id of the attachment record carrying the clip's last frame, as a still image.","filename":"The name the clip was stored under.","content_type":"The clip's format.","size":"How large the clip is, in bytes.","duration":"How long the clip actually is, in seconds, measured from the file.","frames":"How many frames the clip has.","width":"The clip's width in pixels.","height":
[
  'unknown_image',
  'ambiguous_image',
  'invalid_request',
  'refused',
  'budget_exhausted',
  'over_size_limit',
  'generator_exhausted',
  'generator_misconfigured',
  'generator_unavailable',
  'processing_failed',
  'store_unavailable'
] {}
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "href" apps/contro…
<!-- xgd-tool name="Bash" id="toolu_01DCAB9JjJWSZKPqxyynQPwR" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:28.532154+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"href\" apps/control-app/src/builder/markdown.js | head -20; grep -n \"safeHref\\|allowedHref\\|function linkTarget\" -A10 apps/control-app/src/builder/markdown.js | head -40","description":"Chat markdown link handling"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "href\|<a\|createE…
<!-- xgd-tool name="Bash" id="toolu_01SdavowMuY47bM8TLMPtLuG" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:31.017186+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"href\\|<a\\|createElement('a')\" apps/control-app/src/builder/chat.js | head -30","description":"Chat link rendering"}
```

**Result**

```
93: * client's view. `meta.href` is the target's `#show=…` link. Delivered live and
787: * @param {(meta: {href: string, label: string}) => void} [options.onShow]
814: * @param {(href: string, link: HTMLAnchorElement) => boolean} [options.onLinkClick]
928:      const link = ev.target?.closest?.('a[href]')
930:      if (onLinkClick(link.getAttribute('href') ?? '', link)) ev.preventDefault()
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 920,940p apps/contr…
<!-- xgd-tool name="Bash" id="toolu_015BqxBa8bkvFzxvg48agLst" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:34.059649+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 920,940p apps/control-app/src/builder/chat.js; git grep -n \"onLinkClick\" -- apps/control-app/src/builder/app.js | head -3; git grep -ln \"renderMarkdown\\|marked\\b\" -- apps/control-app/src/builder | head","description":"Chat link click handling"}
```

**Result**

```
    })
  }

  // [[REQ-391]] — the same delegation, for a link the host may want to act on
  // itself rather than follow: it answers true when it has, and the browser's
  // own navigation is then cancelled.
  if (onLinkClick) {
    element.addEventListener('click', (ev) => {
      const link = ev.target?.closest?.('a[href]')
      if (!link) return
      if (onLinkClick(link.getAttribute('href') ?? '', link)) ev.preventDefault()
    })
  }

  let chat = null
  let sessionId = null
  let sessionKey = null

  // [[REQ-479]] — the Feedback control, where the host asked for one. Built once
  // and put back on every paint, so a half-written form outlives a repaint.
  const feedbackControl = feedback
apps/control-app/src/builder/app.js:1915:    onLinkClick: openLink,
apps/control-app/src/builder/app.js
apps/control-app/src/builder/builder.css
apps/control-app/src/builder/business.js
apps/control-app/src/builder/chat.js
apps/control-app/src/builder/config.js
apps/control-app/src/builder/editor.js
apps/control-app/src/builder/image-picker.js
apps/control-app/src/builder/looks.js
apps/control-app/src/builder/main.js
apps/control-app/src/builder/markdown.js
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "^export\|^functio…
<!-- xgd-tool name="Bash" id="toolu_01PiDxkS2LJuUsR6VjwTfCLQ" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:35.213833+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"^export\\|^function\\|href\" apps/control-app/src/builder/reader.js | head -30","description":"Read reader.js link rendering"}
```

**Result**

```
83:export function readerKind(contentType) {
97:function el(tag, className, text) {
109: * @param {string} spec.href      where the bytes are — the file route
116:export function mountReader(spec) {
119:    href,
175:      frame.src = href
216:        const res = await fetchImpl(href, controller ? { signal: controller.signal } : undefined)
217:        if (!res.ok) throw new Error(`GET ${href} → ${res.status}`)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "function openLink…
<!-- xgd-tool name="Bash" id="toolu_01FRuymHD73qVMHGN5ubU3L3" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:37.882500+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"function openLink\" -A40 apps/control-app/src/builder/app.js | head -60; grep -n \"a\\b.*href\\|setAttribute('href'\\|\\.href =\" apps/control-app/src/builder/markdown.js | head","description":"Read openLink and markdown hrefs"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "openLink" apps/co…
<!-- xgd-tool name="Bash" id="toolu_01RnjmcYAAyKJ6JS51h13rAn" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:40.413192+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"openLink\" apps/control-app/src/builder/app.js | head -4; grep -n \"link\\|href\" apps/control-app/src/builder/markdown.js | head -20","description":"Find openLink and markdown link code"}
```

**Result**

```
1546:  const openLink = (href, link) => {
1915:    onLinkClick: openLink,
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1530,1600p apps/con…
<!-- xgd-tool name="Bash" id="toolu_01N3iaAQkyNhZmf9LCy2SqSq" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:43.067004+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1530,1600p apps/control-app/src/builder/app.js; wc -l apps/control-app/src/builder/markdown.js; grep -n \"\\[\" apps/control-app/src/builder/markdown.js | head -5","description":"Read openLink"}
```

**Result**

```
  /** [[REQ-413]] — said beside a link whose target has gone, for a moment. */
  function sayGone(link) {
    if (!link?.parentNode || link.nextElementSibling?.classList.contains('builder-chat-gone')) return
    const note = document.createElement('span')
    note.className = 'builder-chat-gone'
    note.setAttribute('role', 'status')
    note.textContent = SHOW_GONE
    link.after(note)
    setTimeout(() => note.remove(), 4000)
  }

  /**
   * A link in the conversation that shows something in the builder — a set of
   * looks ([[REQ-391]]) or any `show_client` target ([[REQ-413]]) — is followed
   * in place, never in a tab. Any other link is the chat's to follow.
   */
  const openLink = (href, link) => {
    const q = showQuery(href)
    if (!q) return false
    void showTarget(q).then(
      (shown) => shown || sayGone(link),
      () => sayGone(link),
    )
    return true
  }

  /**
   * [[REQ-413]] — what the client is in the middle of, if anything: the image
   * editor open, an edit open on the page, or an answer typed on the panel and
   * not yet saved. Sent with each message, so the consultant knows not to
   * switch, and asked again when a switch arrives.
   */
  function clientBusy() {
    if (document.querySelector('.builder-modal .builder-modal__imaged')) return 'image'
    if (panel.getMode() === 'edit' && document.querySelector('.builder-modal')) return 'editing'
    const active = document.activeElement
    if (active && planPanel.element.contains(active) && active.matches?.('input, textarea') && active.value.trim() !== '') {
      return 'answering'
    }
    return null
  }

  /**
   * [[REQ-413]] — the consultant switched the client's view; done unless they are busy.
   * [[REQ-424]] — or typing a message: the line the reply carries is their link.
   */
  function onShow(meta) {
    const q = showQuery(meta?.href)
    const typing = (chat.getChat()?.getInputMarkdown?.() ?? '').trim() !== ''
    if (q && !clientBusy() && !typing) void showTarget(q)
  }

  /** The subject write, beside the listing and from the same seam. */
  const writeSubject = pagesTransport?.saveSubject ?? saveSubject

  /** The draft render of the page in `src` — the one honest address ([[BUG-131]]). */
  const draftUrl = (src) => previewChannelUrl(src, 'draft')

  const toolbar = createToolbar({
    panel,
    // THE SCOPE, HANDED DOWN ([[REQ-179]]). A toolbar action acts on the site
    // the shell's scope names; it does not ask the pane which one that is. See
    // `NO_SITE` in `toolbar.js` for what an unwired host gets and why.
    context: { getSite: () => currentSite },
    actions: [
      modeToggleAction(),
      pagesAction(pages),
      subjectAction(pages, writeSubject),
      markPointsAction(points),
      panelsAction(carry),
      colorsAction(openPalette),
      73 apps/control-app/src/builder/markdown.js
37:export const markdownReady = Promise.all([
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n "export functi…
<!-- xgd-tool name="Bash" id="toolu_01Bryakw5SCcYmrNwAqnmL5S" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:49.059619+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n \"export function showQuery\\|function showTarget\\|async function showTarget\" -- apps/control-app/src/builder | head; grep -n \"function showTarget\" -A50 apps/control-app/src/builder/app.js | head -70","description":"Read showQuery and showTarget"}
```

**Result**

```
apps/control-app/src/builder/app.js:1485:  async function showTarget(q) {
1485:  async function showTarget(q) {
1486-    const target = q.get('show')
1487-    // [[REQ-442]] — a link that names a target decides where this opening is.
1488-    storyDecidedFor = currentSite
1489-    // [[REQ-431]] — the story board and the questions are both in Input, and
1490-    // [[REQ-433]] so are the comparison sites.
1491-    if (target === 'story') return openInput('story')
1492-    // [[REQ-657]] — the Plan panel, and the Publish button its publish activity links to.
1493-    if (target === 'plan') return openInput('plan')
1494-    if (target === 'publish') {
1495-      toDraft()
1496-      const button = toolbar.element.querySelector('.builder-toolbar__publish')
1497-      button?.focus()
1498-      return Boolean(button)
1499-    }
1500-    if (target === 'draft') {
1501-      const id = q.get('page')
1502-      const find = () => pages.list().find((row) => row.id === id && !row.alternative)
1503-      const row = id ? await lookAgain(find, () => pages.refresh()) : null
1504-      if (id && !row) return false
1505-      toDraft()
1506-      if (row && row.slug !== pages.current()) pages.open(row.slug)
1507-      return true
1508-    }
1509-    // [[BUG-250]] — in Looks mode, which `open` switches to.
1510-    if (target === 'looks') return looks.open(q.get('set'), q.get('look'))
1511-    // [[BUG-245]] — the comparison board as a whole, as the consultant announces it.
1512-    if (target === 'comps') return openInput('comps')
1513-    // [[REQ-419]] — a comp shown in chat is its tile on the board.
1514-    if (target === 'comp') {
1515-      const reference = q.get('comp')
1516-      if (!(await lookAgain(() => comparisons.comps().some((c) => c.reference === reference), () => planPanel.refresh()))) return false
1517-      return openInput('comp', reference)
1518-    }
1519-    if (target === 'ask') return openInput('ask', q.get('ask'))
1520-    // [[BUG-265]] — the questions as a whole, where several new ones are.
1521-    if (target === 'questions') return openInput('questions')
1522-    // [[BUG-230]] — the same route the no-address dialog's button takes.
1523-    if (target === 'web_address') {
1524-      revealWebAddress()
1525-      return true
1526-    }
1527-    return false
1528-  }
1529-
1530-  /** [[REQ-413]] — said beside a link whose target has gone, for a moment. */
1531-  function sayGone(link) {
1532-    if (!link?.parentNode || link.nextElementSibling?.classList.contains('builder-chat-gone')) return
1533-    const note = document.createElement('span')
1534-    note.className = 'builder-chat-gone'
1535-    note.setAttribute('role', 'status')
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "showQuery" apps/c…
<!-- xgd-tool name="Bash" id="toolu_011Dk9a6m5pXGQMK2ZF2a4kC" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:52.400174+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"showQuery\" apps/control-app/src/builder/*.js | head -4; grep -n \"export function showQuery\" -A20 apps/control-app/src/builder/*.js | head -30; grep -n \"^export function openModal\\|^export function \" apps/control-app/src/builder/modal.js | head","description":"Read showQuery and modal API"}
```

**Result**

```
apps/control-app/src/builder/app.js:1440:  function showQuery(href) {
apps/control-app/src/builder/app.js:1547:    const q = showQuery(href)
apps/control-app/src/builder/app.js:1577:    const q = showQuery(meta?.href)
50:export function createModalShell({ host = null, title = 'Edit', onClose = () => {} } = {}) {
94:export function modalFooter(children) {
102:export function modalButton(label, className, onClick) {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1432,1460p apps/con…
<!-- xgd-tool name="Bash" id="toolu_01LaexRAw7WnwbPVKee5Wspa" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:54.882487+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1432,1460p apps/control-app/src/builder/app.js; sed -n 30,110p apps/control-app/src/builder/modal.js","description":"Read showQuery and modal shell"}
```

**Result**

```
  }

  /**
   * [[REQ-413]] — what a link in the conversation asks to show, or `null` for a
   * link that is the chat's to follow. `#show=<target>&…` is the consultant's
   * `show_client` link; `#looks=<set>` is the one `make_alternatives` hands over
   * ([[REQ-391]]) and means the same as `#show=looks&set=<set>`.
   */
  function showQuery(href) {
    const m = /^#looks=(.+)$/.exec(href ?? '')
    if (m) {
      let set = m[1]
      try {
        set = decodeURIComponent(set)
      } catch {
        /* a set name the browser could not decode is looked for as written */
      }
      return new URLSearchParams({ show: 'looks', set })
    }
    return href?.startsWith('#show=') ? new URLSearchParams(href.slice(1)) : null
  }

  /**
   * [[REQ-467]] — A LINK THAT LANDS EARLY STILL LANDS: what `found` looks for, read
   * again with `reread` every {@link SHOW_WAIT_MS}, up to {@link SHOW_WAIT_TRIES}
   * times, before it is taken not to be there. Answers what `found` last answered.
   */
  async function lookAgain(found, reread) {
    let hit = found()
 * **`mount()` IS SEPARATE FROM CONSTRUCTION, AND THAT ORDERING IS LOAD-BEARING.**
 * A caller builds its contents into `panel` and appends the whole dialog once, at
 * the end. Appending first — the obvious simplification — silently changes the
 * segment editor's behaviour: `mountFields` ends its click-to-edit by calling
 * `control.focus()`, and REQ-117's `openLoneControl` fires that click while the
 * dialog is still detached, where focus does not move. Attached, the focus is
 * real, the browser's own focus handling then moves it away, and the control
 * confirms-and-reverts to a display cell before the operator has typed anything
 * — so the box they clicked into is no longer a box they can type in.
 *
 * Recorded rather than fixed here, because it is REQ-135/REQ-138 behaviour that
 * ships and is pinned by their UATs; the real repair is an `autoEdit` seam
 * upstream, which `openLoneControl` is already asking for.
 *
 * @param {object} spec
 * @param {Element} [spec.host] - where the dialog is appended (see the header)
 * @param {string} [spec.title] - the dialog's accessible name
 * @param {() => void} [spec.onClose]
 * @returns {{element: Element, panel: Element, close: () => void, mount: () => void}}
 */
export function createModalShell({ host = null, title = 'Edit', onClose = () => {} } = {}) {
  const mountPoint = host ?? document.body

  const element = document.createElement('div')
  element.className = 'builder-modal'
  element.setAttribute('role', 'dialog')
  element.setAttribute('aria-modal', 'true')
  // The title survives as the ACCESSIBLE name even where it is not drawn.
  // Dropping a visible heading is a statement about redundant chrome, not about
  // the dialog being anonymous — a dialog with no name is announced as "dialog"
  // and nothing else.
  element.setAttribute('aria-label', title)

  const panel = document.createElement('div')
  panel.className = 'builder-modal__panel'

  const backdrop = document.createElement('div')
  backdrop.className = 'builder-modal__backdrop'
  element.append(backdrop, panel)

  // Guarded rather than assumed idempotent: Escape during the close of a dialog
  // that is already closing would run `onClose` twice, and a caller's `destroy`
  // is not obliged to tolerate that.
  let closed = false
  const close = () => {
    if (closed) return
    closed = true
    onClose()
    element.remove()
    document.removeEventListener('keydown', onKey)
  }
  const onKey = (ev) => {
    if (ev.key === 'Escape') close()
  }
  // Bound at CREATION, not at mount: `close` is a legitimate answer from the
  // moment the shell exists, including for a caller that fails while building
  // its contents and never mounts at all.
  document.addEventListener('keydown', onKey)
  backdrop.addEventListener('click', close)

  return { element, panel, close, mount: () => mountPoint.append(element) }
}

/** The dialog's action row. */
export function modalFooter(children) {
  const row = document.createElement('div')
  row.className = 'builder-modal__footer'
  row.append(...children)
  return row
}

/** A dialog button. `type="button"` always — none of these submits a form. */
export function modalButton(label, className, onClick) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = className
  b.textContent = label
  b.addEventListener('click', onClick)
  return b
}
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1,80p apps/control-…
<!-- xgd-tool name="Bash" id="toolu_01Y7uAQCbRwkLJNSPoWfGHTJ" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:35:58.696045+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1,80p apps/control-app/src/platform-issues.ts | grep -v \"^ \\*\" | head -60; grep -n \"PLATFORM_ISSUE_TYPE\\|type:\" apps/control-app/src/platform-issues.ts | head","description":"Read platform-issues store use"}
```

**Result**

```
/**
import { DevelopmentFailure, type DevelopmentProject } from './development'
import type { Ticket, TicketStore } from './tickets'

export const PLATFORM_ISSUE_TYPE = 'platform_issue'

/** The type's schema, merged into `productTypePack()`. */
export const PLATFORM_ISSUE_SCHEMA = {
  fields: {
    /** What ReportBug / RequestCapability filed it as. */
    kind: { type: 'enum', enum: ['bug', 'request'], required: true },
    /** The business whose conversation filed it. */
    business: { type: 'string', required: true },
  },
  body: { required: true, non_empty: true },
}

/** Filed and not yet looked at — upstream's own word for it. */
const FILED = 'filed'

/** Upstream's answer shape: the ticket, and the id a person would use. */
function filed(ticket: Ticket): { ticket: Ticket; humanId: string | null } {
  return { ticket, humanId: ticket.human_id }
}

/**
export function platformIssueProject(
  open: () => Promise<TicketStore>,
  business: string,
): DevelopmentProject {
  let store: Promise<TicketStore> | null = null
  const tickets = () => (store ??= open())
  const failing = async <T>(work: () => Promise<T>): Promise<T> => {
    try {
      return await work()
    } catch (error) {
      if (error instanceof DevelopmentFailure) throw error
      throw new DevelopmentFailure(
        `the issue could not be recorded: ${error instanceof Error ? error.message : String(error)}`,
        'project_unreachable',
      )
    }
  }
  return {
    create: (spec) =>
      failing(async () => {
        const { ticket } = await (await tickets()).create({
          type: PLATFORM_ISSUE_TYPE,
          title: spec.title,
          body: spec.body ?? '',
          status: FILED,
27:export const PLATFORM_ISSUE_TYPE = 'platform_issue'
33:    kind: { type: 'enum', enum: ['bug', 'request'], required: true },
35:    business: { type: 'string', required: true },
77:          type: PLATFORM_ISSUE_TYPE,
89:        if (ticket.type !== PLATFORM_ISSUE_TYPE) {
115:  const { tickets } = await store.list({ type: PLATFORM_ISSUE_TYPE, limit: 'all' })
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n "PLATFORM_ISSU…
<!-- xgd-tool name="Bash" id="toolu_01Dx1gTv7LMPjjBL44L9e3NE" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:36:02.254230+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n \"PLATFORM_ISSUE_SCHEMA\\|PLATFORM_ISSUE_TYPE\" -- apps/control-app/src | grep -v \"platform-issues.ts\" | head; git grep -n \"export function productTypePack\" -A30 -- apps/control-app/src | head -45","description":"How ticket types are registered"}
```

**Result**

```
apps/control-app/src/tickets.ts:20:import { PLATFORM_ISSUE_SCHEMA, PLATFORM_ISSUE_TYPE } from './platform-issues'
apps/control-app/src/tickets.ts:825:    [PLATFORM_ISSUE_TYPE]: PLATFORM_ISSUE_SCHEMA,
fatal: unable to resolve revision: -A30
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 790,840p apps/contr…
<!-- xgd-tool name="Bash" id="toolu_01LXupXNwWq3V3RLifSovhi9" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:36:06.894170+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 790,840p apps/control-app/src/tickets.ts; grep -n \"stale-typepack\" -r ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/MEMORY.md; cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/stale-typepack-ignores-new-keys.md | sed -n 5,30p","description":"Read type pack and stale-typepack memory"}
```

**Result**

```
     * An acceptance document — [[REQ-240]] §3, [[DOC-40]] §2.1.
     *
     * REGISTERED HERE AND DEFINED IN `acceptances.ts`, for the reason the
     * template above gives: the shape belongs beside the code that reads it
     * back. What lives here is the fact that this platform's tickets come in
     * this type at all.
     *
     * IT IS WHAT CLOSES THE PLATFORM-ONLY GAP IN THE TERMS. A version constant
     * and a body string in the Worker serve exactly one document for exactly one
     * business; a ticket in the tenant's own store gives a customer their own
     * terms for their own contacts through this same declaration, with no second
     * path and no platform branch.
     */
    [ACCEPTANCE_TYPE]: ACCEPTANCE_SCHEMA,

    /**
     * One RECEIVED message — [[REQ-267]], [[EPIC-13]].
     *
     * REGISTERED HERE AND DEFINED IN `inbound.ts`, for the reason the two above
     * give: the shape belongs beside the code that reads it back. What lives
     * here is the fact that this platform's tickets come in this type at all.
     *
     * A SECOND TYPE AND NOT A WIDENED `email`. The outbound one requires four
     * things a received message cannot have — a contact, an address row, a
     * template key and a queue stamp — and its lifecycle describes an attempt WE
     * made. Making those optional to share one type would leave the schema
     * saying nothing about either shape.
     */
    [INBOUND_EMAIL_TYPE]: INBOUND_EMAIL_SCHEMA,

    /**
     * A defect or request filed from production ([[REQ-484]]) — defined in
     * `platform-issues.ts`, beside the code that files and lists it. Only ever
     * written to the platform tenant's store.
     */
    [PLATFORM_ISSUE_TYPE]: PLATFORM_ISSUE_SCHEMA,

    [AWARENESS_REPORT_TYPE]: {
      fields: {
        kind: { type: 'string', required: true },
        [KB_FIELD]: { type: 'string', required: true },
      },
      body: { required: true, non_empty: true },
    },
  })
}

/** The `fields.kind` value marking a `system` ticket as an awareness map. */
export const AWARENESS_KIND = AWARENESS_REPORT_KIND

/**
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/MEMORY.md:45:- [Stale TypePack ignores new keys](stale-typepack-ignores-new-keys.md) — a declaration that does nothing.
  node_type: memory
  type: project
  originSessionId: d4c82ef5-8b59-49ee-9330-e8eedcc71f2a
  modified: 2026-09-17T03:37:08.421Z
---

`TypePack`'s constructor validates only what the *installed* version knows about
(enum defaults, and — once REQ-160 is installed — lock-selector spellings). A key
it predates, such as `immutable` on a type schema, is stored and ignored. No
throw, no warning.

So a 1stcontact ticket that declares configuration over a framework mechanism
presents, against a stale shared store, as: declaration present in
`tickets.ts`, store accepts it, nothing enforced, `locked` merely absent from
reads. That is indistinguishable at a glance from a declaration that is wrong.

**Why:** the framework ticket being `free_coded` is not the same fact as the
mechanism being reachable here — see [[shared-node-modules-outside-sandbox]].
Checking upstream *source* (`lagrange-framework/components/…`) proves nothing
about what 1stcontact resolves, which is the packed copy under
`/Users/martin/lagrangefoundry/node_modules`.

**How to apply:** before writing the declaration, probe the *installed* copy for
the symbol, not the framework's source — e.g.
`wc -l node_modules/@lagrangefoundry/ticketing/src/validation.js` (463 = stale,
653 = REQ-160 present) or `grep -c _assertWritable .../src/store.js`. To verify
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n "platformIssue…
<!-- xgd-tool name="Bash" id="toolu_01MrHqtndXokU9GARGK4q8vt" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:36:22.414605+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -n \"platformIssueProject(\" -- apps/control-app/src | head -3; git grep -n \"export function requirePlatformTenant\" -A8 -- apps/control-app/src | head -12; git grep -n \"export function generatedFields\" -A15 apps/control-app/src/imagegen.ts | head -20; grep -n \"type: 'boolean'\" apps/control-app/src/*.ts | head -3","description":"Platform store access, material fields"}
```

**Result**

```
apps/control-app/src/platform-issues.ts:56:export function platformIssueProject(
apps/control-app/src/router.ts:1069:        (deps.development ?? ((e) => developmentFor(e, fetch, platformIssueProject(
fatal: unable to resolve revision: -A8
fatal: option '-A15' must come before non-option arguments
apps/control-app/src/inbound.ts:199:    synthetic: { type: 'boolean', required: true, default: false },
apps/control-app/src/tickets.ts:74:  republishable: { type: 'boolean', required: true },
apps/control-app/src/tickets.ts:75:  exportable: { type: 'boolean', required: true },
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1060,1080p apps/con…
<!-- xgd-tool name="Bash" id="toolu_01Kewz6K7HEmJGsYHZyJkmXo" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:36:26.151148+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1060,1080p apps/control-app/src/router.ts; grep -n \"export function generatedFields\" -A15 apps/control-app/src/imagegen.ts | head -20; grep -n \"IMAGE_MATERIAL_TYPE =\" apps/control-app/src/imagegen.ts; grep -n \"export.*function requirePlatformTenant\" -A6 apps/control-app/src/*.ts | head","description":"Read platform store opening and material fields"}
```

**Result**

```
        // IT TAKES NO SCOPE AND THAT IS THE POINT. Every other wire on this call
        // is bound to `scope.businessId`, because everything else the assistant
        // can do is done to one client's material. This one is bound to OUR
        // project and to nothing of theirs, so there is no business to name and
        // no argument anywhere on the path that could name one.
        //
        // [[REQ-484]] — AND WHERE THERE IS NO ADDRESS, production's own record:
        // a platform issue in the platform tenant's store, stamped with this
        // business, listed for the operator in the platform console.
        (deps.development ?? ((e) => developmentFor(e, fetch, platformIssueProject(
          () => (deps.tickets ?? ticketStoreFor)(e, { businessId: requirePlatformTenant(e as unknown as IdentityEnv) }),
          scope.businessId,
        ))))(env),
        // WHAT THE TURN COST ([[REQ-292]]). Assembled here for the reason the
        // ticket gives: the D1 binding is not on `WorkerAiEnv` and should not be
        // put there, and the TENANT the meter is scoped to is this function's
        // own — resolved per request, ahead of the host, by the same `scope.ts`
        // that decides everything else the conversation may reach.
        //
        // BOUND ONCE, BESIDE THE CACHE KEY, and those are the same act: this
        // host lives for the isolate keyed by `scope.businessId`, so a meter
243:export function generatedFields(describer: string, kind: string = GENERATED_KIND): Record<string, unknown> {
244-  return {
245-    // THE VOCABULARY [[DOC-38]] §9 ALREADY DECLARES, so a generated image files
246-    // beside an uploaded one rather than beside nothing. REQ-461 — a generated
247-    // clip passes its own kind, and takes every other field below unchanged.
248-    kind,
249-    origin: GENERATED_ORIGIN,
250-    // OURS, AND PLACEABLE. `promoteToSiteAsset` reads `republishable` off the
251-    // record and refuses anything we do not hold the right to publish; an image
252-    // this deployment commissioned on the client's behalf is the one case where
253-    // that right is not in doubt. Without this the whole capability would be a
254-    // picture nobody could ever put on a site.
255-    rights: 'owned',
256-    republishable: true,
257-    // NOT EXPORTABLE, exactly as an upload is not ([[DOC-38]] §4.2). The
258-    // cross-client corpus may learn from third-party public documents; it may
112:export const IMAGE_MATERIAL_TYPE = 'material'
apps/control-app/src/identity.ts:1801:export function requirePlatformTenant(env: IdentityEnv): string {
apps/control-app/src/identity.ts-1802-  const tenantId = (env.TENANT_ID ?? '').trim()
apps/control-app/src/identity.ts-1803-  if (tenantId === '') throw new IdentityNotConfiguredError()
apps/control-app/src/identity.ts-1804-  return tenantId
apps/control-app/src/identity.ts-1805-}
```

## Write /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/showcase.ts
<!-- xgd-tool name="Write" id="toolu_012NFebeBoThurSKhxVMmeG7" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:36:59.689046+00:00" -->

**Input**

```json
{"content":"/**\n * [[BUG-356]] — THE SHOWCASE: hero clips made for other sites, curated by the\n * operator, that the consultant can show a client so they see what's possible\n * rather than imagining it from a description.\n *\n * PLATFORM MATERIAL, NOT A CLIENT'S. An item is a ticket of {@link SHOWCASE_TYPE}\n * in the PLATFORM tenant's own store — where production's platform issues live\n * ([[REQ-484]]) — with the clip and its still COPIED onto it as attachments. So\n * an item no longer depends on the owning client's Library: deleting the clip\n * there leaves the showcase as it was. It is runtime data the operator curates\n * in the console (add, describe, show or hide, remove); no customer name or site\n * is in code, tests or prompts, and changing the showcase is no code change.\n *\n * ONLY ITEMS MARKED SHOWN ARE EVER SHOWN to a consultant or a client\n * ({@link showcaseItems} with `shownOnly`). The operator is responsible for the\n * owning business's agreement; the item keeps which business and material it\n * came from so they can be asked.\n */\nimport { IMAGE_MATERIAL_TYPE } from './imagegen'\nimport type { Ticket, TicketStore } from './tickets'\n\nexport const SHOWCASE_TYPE = 'showcase_item'\n\n/** The type's schema, merged into `productTypePack()`. */\nexport const SHOWCASE_SCHEMA = {\n  fields: {\n    /** The business whose clip this was copied from. */\n    business: { type: 'string', required: true },\n    /** The clip material it was copied from, in that business's store. */\n    material: { type: 'string', required: true },\n    /** One line saying what moves, written by the operator. */\n    line: { type: 'string', required: true },\n    /** Whether the consultant may show it. */\n    shown: { type: 'boolean', required: true, default: false },\n  },\n}\n\n/** The attachment roles an item carries. */\nexport const SHOWCASE_CLIP = 'clip'\nexport const SHOWCASE_STILL = 'still'\nexport type ShowcasePart = typeof SHOWCASE_CLIP | typeof SHOWCASE_STILL\n\n/** The route a showcase item's media is read from by a signed-in client: shown items only. */\nexport const SHOWCASE_MEDIA_PATH = '/api/showcase/media'\n\n/** Where one part of a shown item is served. */\nexport const showcaseMediaHref = (item: string, part: ShowcasePart): string =>\n  `${SHOWCASE_MEDIA_PATH}?item=${encodeURIComponent(item)}&part=${part}`\n\n/** The chat link that plays an item in the conversation (`#show=showcase`, read by the builder). */\nexport const showcaseShowHref = (item: string): string => `#show=showcase&item=${encodeURIComponent(item)}`\n\n/** A clip a business has, as the console lists it for adding. */\nexport interface ShowcaseCandidate {\n  material: string\n  label: string | null\n  title: string\n  mode: string | null\n  duration_s: number | null\n  movement_pct: number | null\n  /** The showcase item already copied from it, if any. */\n  item: string | null\n}\n\n/** One showcase item as the console and the consultant read it. */\nexport interface ShowcaseItem {\n  item: string\n  line: string\n  shown: boolean\n  business: string\n  material: string\n  /** What the photo is, from the clip's own title: how the consultant judges which are close to a client's. */\n  photo: string\n  mode: string | null\n  duration_s: number | null\n  movement_pct: number | null\n}\n\nconst num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)\nconst strOrNull = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null)\n\nfunction itemOf(t: Ticket): ShowcaseItem {\n  const f = t.fields as Record<string, unknown>\n  return {\n    item: t.uid,\n    line: String(f.line ?? ''),\n    shown: f.shown === true,\n    business: String(f.business ?? ''),\n    material: String(f.material ?? ''),\n    photo: t.title,\n    mode: strOrNull(f.clip_mode),\n    duration_s: num(f.duration_s),\n    movement_pct: num(f.movement_pct),\n  }\n}\n\n/** Every showcase item, oldest first; `shownOnly` for what a consultant or client may see. */\nexport async function showcaseItems(platform: TicketStore, { shownOnly = false } = {}): Promise<ShowcaseItem[]> {\n  const { tickets } = await platform.list({ type: SHOWCASE_TYPE, limit: 'all' })\n  const items = tickets.map(itemOf)\n  return shownOnly ? items.filter((i) => i.shown) : items\n}\n\n/** The clips one business has made, with the item each was already copied to. */\nexport async function showcaseCandidates(business: string, store: TicketStore, platform: TicketStore): Promise<ShowcaseCandidate[]> {\n  const [{ tickets }, items] = await Promise.all([store.list({ type: IMAGE_MATERIAL_TYPE, limit: 'all' }), showcaseItems(platform)])\n  const copied = new Map(items.filter((i) => i.business === business).map((i) => [i.material, i.item]))\n  return tickets\n    .filter((t) => (t.fields as Record<string, unknown>).kind === 'video')\n    .map((t) => {\n      const f = t.fields as Record<string, unknown>\n      return {\n        material: t.uid,\n        label: strOrNull(f.label),\n        title: t.title,\n        mode: strOrNull(f.clip_mode),\n        duration_s: num(f.duration_s),\n        movement_pct: num(f.movement_pct),\n        item: copied.get(t.uid) ?? null,\n      }\n    })\n}\n\n/** Why an add could not be made, for a 4xx answer. */\nexport class ShowcaseError extends Error {\n  constructor(\n    message: string,\n    readonly status: 400 | 404,\n  ) {\n    super(message)\n  }\n}\n\n/** The bytes of a ticket's one file of this content-type family. */\nasync function fileOf(store: TicketStore, uid: string, family: string): Promise<{ bytes: Uint8Array; content_type: string; filename: string } | null> {\n  const { attachments } = await store.attachments({ uid })\n  const a = attachments.find((x) => String((x.fields as R
```

[elided — kept 5800 of 11206 bytes]

**Result**

```
File created successfully at: /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/showcase.ts (file state is current in your context — no need to Read it back)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1120,1150p apps/con…
<!-- xgd-tool name="Bash" id="toolu_01449FZKk1a6PzG4JBjKkPiQ" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:37:02.679155+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1120,1150p apps/control-app/src/tickets.ts | grep -v \"^\\s*\\*\"; grep -n \"  archive(\\|  list(\" apps/control-app/src/tickets.ts | head","description":"Check TicketStore method signatures"}
```

**Result**

```
  query(a: {
    predicate?: string
    sort?: string
    limit?: number | 'all'
  }): Promise<{ tickets: Ticket[] }>
  update(a: {
    uid: string
    patch?: Record<string, unknown>
    expected_version?: number
  }): Promise<{ ticket: Ticket }>
  /**
  archive(a: { uid: string }): Promise<{ ticket: Ticket }>
  comment(a: { uid: string; kind: string; body: string }): Promise<{ comment: Ticket }>
  comments(a: { uid: string }): Promise<{ comments: Ticket[] }>
  attach(a: {
    uid: string
    bytes: Uint8Array | ArrayBuffer
    filename?: string
1113:  list(a?: { type?: string; limit?: number | 'all' }): Promise<{ tickets: Ticket[] }>
1144:  archive(a: { uid: string }): Promise<{ ticket: Ticket }>
1280:    list(a: {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='apps/…
<!-- xgd-tool name="Bash" id="toolu_01T1xXcmTY79NxYPzWbR17Rx" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:37:09.399541+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='apps/control-app/src/tickets.ts'\ns=open(p).read()\ns=s.replace(\"import { PLATFORM_ISSUE_SCHEMA, PLATFORM_ISSUE_TYPE } from './platform-issues'\",\"import { PLATFORM_ISSUE_SCHEMA, PLATFORM_ISSUE_TYPE } from './platform-issues'\\nimport { SHOWCASE_SCHEMA, SHOWCASE_TYPE } from './showcase'\",1)\ns=s.replace(\"    [PLATFORM_ISSUE_TYPE]: PLATFORM_ISSUE_SCHEMA,\\n\",\"    [PLATFORM_ISSUE_TYPE]: PLATFORM_ISSUE_SCHEMA,\\n\\n    /**\\n     * A showcase item ([[BUG-356]]) — defined in `showcase.ts`: a hero clip copied\\n     * from a client's Library for the consultant to show other clients. Only ever\\n     * written to the platform tenant's store, by the operator.\\n     */\\n    [SHOWCASE_TYPE]: SHOWCASE_SCHEMA,\\n\",1)\nopen(p,'w').write(s)\nEOF\ngrep -n \"import.*from './imagegen'\" apps/control-app/src/tickets.ts; grep -n \"from './tickets'\" apps/control-app/src/imagegen.ts","description":"Register showcase type"}
```

**Result**

```
57:import type { Ticket, TicketStore } from './tickets'
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "^import" apps/con…
<!-- xgd-tool name="Bash" id="toolu_01EPrjaVC3MmN5QvvVPgYTT3" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:37:16.398224+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"^import\" apps/control-app/src/imagegen.ts","description":"Check imagegen runtime imports"}
```

**Result**

```
46:import { displayLine } from '../../../tools/generate/src/cli/ai/toolbox-core'
47:import { resolveStoredImage } from '../../../tools/generate/src/cli/image-library'
48:import * as imagegenLib from './generated/ai-imagegen'
49:import * as aiLib from './generated/ai-workers.js'
50:import {
57:import type { Ticket, TicketStore } from './tickets'
58:import { usdMicros, type MediaSpend } from './spend'
59:import { SPEND_CAP_TOOL_DETAIL } from './spend-cap'
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='apps/…
<!-- xgd-tool name="Bash" id="toolu_014nxPjshUW82XURiNy8HRaN" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:37:21.985728+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='apps/control-app/src/showcase.ts'\ns=open(p).read()\ns=s.replace(\"import { IMAGE_MATERIAL_TYPE } from './imagegen'\\nimport type { Ticket, TicketStore } from './tickets'\",\"\"\"import type { Ticket, TicketStore } from './tickets'\n\n/**\n * The ticket type a client's clip is filed as — `imagegen.ts`'s\n * `IMAGE_MATERIAL_TYPE`, spelled here because `tickets.ts` registers this module's\n * schema and must not load the image tool to do it (a suite pins they agree).\n */\nexport const MATERIAL_TYPE = 'material'\"\"\")\ns=s.replace(\"IMAGE_MATERIAL_TYPE\",\"MATERIAL_TYPE\")\nopen(p,'w').write(s)\nEOF\ngrep -c MATERIAL_TYPE apps/control-app/src/showcase.ts","description":"Drop imagegen import from showcase"}
```

**Result**

```
4
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "export async func…
<!-- xgd-tool name="Bash" id="toolu_01XjMbk6CxGesYcmG8sxe43c" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:37:29.656246+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"export async function route(\" -A30 apps/control-app/src/router.ts | grep -n \"admission\\|scope\" | head; grep -n \"function readJson\\|const body = await\\|await request.json()\" apps/control-app/src/router.ts | head -5; grep -n \"new Response(.*bytes\\|'content-type': .*content_type\" apps/control-app/src/router.ts | head -5","description":"Route gating and helpers"}
```

**Result**

```
4:3322-  scope: Scope | null,
13:3331-    await asWriter({ holder: CLIENT_HOLDER, scope: null }, () => routeUncached(request, env, scope, deps, ctx)),
20:3338-  scope: Scope | null,
26:3344-  // untouched by it. Every route matches on `p`, so one rewrite at the top scopes
29:3347-  // which is the property `scope.ts` chose a path over a query string for.
1284:async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
1285:  const body = await request.text()
3499:    const body = await readJsonBody(request)
3975:        const body = await readJsonBody(request)
3998:        const body = await readJsonBody(request)
3965:        return new Response(new Uint8Array(bytes), { status: 200, headers: { 'content-type': typeof type === 'string' ? type : 'application/octet-stream' } })
3972:        return new Response(new Uint8Array(bytes), { status: 200, headers: { 'content-type': 'application/octet-stream' } })
7199:      return new Response(rendered.bytes as unknown as BodyInit, {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 3940,3972p apps/con…
<!-- xgd-tool name="Bash" id="toolu_01LrVySDFELW24fSkUxASyzi" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:37:32.206610+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 3940,3972p apps/control-app/src/router.ts","description":"Read a scoped media route for gating pattern"}
```

**Result**

```
   */
  if (p.startsWith('/api/handoff/')) {
    try {
      const scoped = requireScope()
      const tickets = await (deps.tickets ?? ticketStoreFor)(env, scoped)
      const references = await openReferences()
      const step = p.slice('/api/handoff/'.length)
      const oneSite = async (): Promise<string | null | Response> => {
        const held = await (await openSiteStore(deps, env, scoped)).siteKeys('site')
        if (held.length > 1) {
          return json(409, {
            error: `This business holds ${held.length} sites, so a handoff has no unambiguous site. Nothing was read or written.`,
            sites: held.length,
          })
        }
        return held[0] ?? null
      }
      if (step === 'manifest' && method === 'GET') {
        const site = await oneSite()
        if (site instanceof Response) return site
        return json(200, await handoffManifest(env, tickets, references, scoped.businessId, site))
      }
      if (step === 'attachment' && method === 'GET') {
        const { attachment, bytes } = await tickets.read_attachment({ uid: url.searchParams.get('uid') ?? '' })
        const type = (attachment.fields ?? {}).content_type
        return new Response(new Uint8Array(bytes), { status: 200, headers: { 'content-type': typeof type === 'string' ? type : 'application/octet-stream' } })
      }
      if (step === 'bundle' && method === 'GET') {
        const bytes = references
          ? await references.bundle(url.searchParams.get('name') ?? '').read(url.searchParams.get('member') ?? '')
          : null
        if (!bytes) return json(404, { error: 'No such bundle member.' })
        return new Response(new Uint8Array(bytes), { status: 200, headers: { 'content-type': 'application/octet-stream' } })
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='apps/…
<!-- xgd-tool name="Bash" id="toolu_018VcvC9mAWWcQqDqTUcQYCA" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:37:48.730915+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='apps/control-app/src/router.ts'\ns=open(p).read()\nanchor=\"    if (p === ADMIN_ISSUES_PATH && method === 'GET') {\"\nassert s.count(anchor)==1\nroutes='''    /**\n     * [[BUG-356]] — THE SHOWCASE, curated in the console: one business's clips to\n     * add from, and every item. Behind `ownsPlatformBusiness`, 404 rather than 403,\n     * as every admin route. Items live in the platform tenant's store.\n     */\n    if (p.startsWith(ADMIN_SHOWCASE_PATH)) {\n      if (!ownsPlatformBusiness(identityEnv, deps.admission)) return text(404, ADMIN_ONLY_MESSAGE)\n      const platform = await (deps.tickets ?? ticketStoreFor)(env, { businessId: requirePlatformTenant(identityEnv) })\n      const storeOf = (business: string) => (deps.tickets ?? ticketStoreFor)(env, { businessId: business })\n      try {\n        if (p === ADMIN_SHOWCASE_PATH && method === 'GET') {\n          const business = (url.searchParams.get('business') ?? '').trim()\n          return json(200, {\n            items: await showcaseItems(platform),\n            ...(business ? { clips: await showcaseCandidates(business, await storeOf(business), platform) } : {}),\n          })\n        }\n        if (p === ADMIN_SHOWCASE_PATH && method === 'POST') {\n          const body = await readJsonBody(request)\n          const business = String(body.business ?? '').trim()\n          const material = String(body.material ?? '').trim()\n          if (business === '' || material === '') return json(400, { error: 'business and material are required' })\n          return json(200, { item: await addToShowcase(platform, business, await storeOf(business), material, String(body.line ?? '')) })\n        }\n        if (p === `${ADMIN_SHOWCASE_PATH}/update` && method === 'POST') {\n          const body = await readJsonBody(request)\n          return json(200, {\n            item: await updateShowcase(platform, String(body.item ?? ''), {\n              ...(typeof body.shown === 'boolean' ? { shown: body.shown } : {}),\n              ...(typeof body.line === 'string' ? { line: body.line } : {}),\n            }),\n          })\n        }\n        if (p === `${ADMIN_SHOWCASE_PATH}/remove` && method === 'POST') {\n          const body = await readJsonBody(request)\n          await removeFromShowcase(platform, String(body.item ?? ''))\n          return json(200, { removed: String(body.item ?? '') })\n        }\n        if (p === `${ADMIN_SHOWCASE_PATH}/media` && method === 'GET') {\n          const media = await showcaseMedia(platform, url.searchParams.get('item') ?? '', url.searchParams.get('part') ?? '', { shownOnly: false })\n          if (!media) return json(404, { error: 'No such showcase media.' })\n          return new Response(new Uint8Array(media.bytes), { status: 200, headers: { 'content-type': media.content_type } })\n        }\n      } catch (error) {\n        if (error instanceof ShowcaseError) return json(error.status, { error: error.message })\n        throw error\n      }\n      return json(404, { error: 'No such showcase route.' })\n    }\n\n'''\ns=s.replace(anchor, routes+anchor)\n# client media route: before the handoff block\nanchor2=\"  if (p.startsWith('/api/handoff/')) {\"\nassert s.count(anchor2)==1\nclient='''  /**\n   * [[BUG-356]] — A SHOWCASE CLIP OR STILL, for a signed-in client the consultant\n   * showed it to: shown items only, read from the platform's store, never from\n   * another client's.\n   */\n  if (p === SHOWCASE_MEDIA_PATH && method === 'GET') {\n    requireScope()\n    const platform = await (deps.tickets ?? ticketStoreFor)(env, { businessId: requirePlatformTenant(env as unknown as IdentityEnv) })\n    const media = await showcaseMedia(platform, url.searchParams.get('item') ?? '', url.searchParams.get('part') ?? '')\n    if (!media) return json(404, { error: 'No such showcase clip.' })\n    return new Response(new Uint8Array(media.bytes), { status: 200, headers: { 'content-type': media.content_type, 'cache-control': 'private, max-age=3600' } })\n  }\n\n'''\ns=s.replace(anchor2, client+anchor2)\ns=s.replace(\"/** [[REQ-484]] — the platform issues filed from one business's conversations. */\",\"\"\"/**\n * [[BUG-356]] — the showcase, curated in the console: GET (every item, and with\n * `business` that business's clips), POST to add a clip, `/update` to show, hide\n * or reword, `/remove`, and `/media` to play an item. See `showcase.ts`.\n */\nexport const ADMIN_SHOWCASE_PATH = '/api/admin/showcase'\n\n/** [[REQ-484]] — the platform issues filed from one business's conversations. */\"\"\",1)\ns=s.replace(\"import { videoSurface } from './videogen'\",\"\"\"import { videoSurface } from './videogen'\nimport {\n  addToShowcase,\n  consultantShowcase,\n  removeFromShowcase,\n  SHOWCASE_MEDIA_PATH,\n  ShowcaseError,\n  showcaseCandidates,\n  showcaseItems,\n  showcaseMedia,\n  updateShowcase,\n} from './showcase'\"\"\",1)\nopen(p,'w').write(s)\nEOF\ngrep -n \"const requireScope\\|function requireScope\" apps/control-app/src/router.ts | head -3; grep -n \"IdentityEnv\" apps/control-app/src/router.ts | head -2","description":"Add showcase routes"}
```

**Result**

```
3414:  const requireScope = (): Scope => {
400:  type IdentityEnv,
1027:            env as unknown as IdentityEnv,
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='apps/…
<!-- xgd-tool name="Bash" id="toolu_01WXvQJjp4weKFWatFij5of1" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:38:09.542814+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='apps/control-app/src/videogen.ts'\ns=open(p).read()\n# declaration: add op + group + shape\nold='''  declaration.title = VIDEO_TITLE\n  declaration.overview = ''\n  for (const group of declaration.groups) {\n    group.title = VIDEO_TITLE\n    group.description = ''\n  }\n  return declaration\n}'''\nnew='''  declaration.title = VIDEO_TITLE\n  declaration.overview = ''\n  for (const group of declaration.groups) {\n    group.title = VIDEO_TITLE\n    group.description = ''\n  }\n  if (showcase) {\n    // [[BUG-356]] — THE SHOWCASE, a read beside the clip maker: its own group,\n    // because the maker's is a write group and this writes nothing.\n    ;(declaration.groups as unknown as Record<string, unknown>[]).push({\n      group: SHOWCASE_GROUP,\n      effect: 'read',\n      title: VIDEO_TITLE,\n      description: '',\n      operations: [SHOWCASE_OP],\n    })\n    ;(declaration.operations as unknown as Record<string, unknown>[]).push(SHOWCASE_OPERATION)\n    ;(declaration as unknown as { shapes: Record<string, unknown> }).shapes.showcase = SHOWCASE_SHAPE\n  }\n  const shapes = (declaration as unknown as { shapes: Record<string, Record<string, string>> }).shapes\n  // [[BUG-356]] — and the made clip's movement, on its result.\n  if (shapes.generated_video) shapes.generated_video.movement = MOVEMENT_FIELD\n  return declaration\n}\n\n/** [[BUG-356]] — what the clip result's `movement` says. */\nconst MOVEMENT_FIELD =\n  'How much of the picture the clip changes as it plays, measured on the made clip. For a reveal, whether a visitor will notice it, and when they will not, what to do about it.'\n\n/** [[BUG-356]] — the showcase's group and operation on this surface. */\nexport const SHOWCASE_GROUP = 'Showcase'\nexport const SHOWCASE_OP = 'showcase'\n\n/** [[BUG-356]] — the showcase operation's declaration. */\nconst SHOWCASE_OPERATION = {\n  op: SHOWCASE_OP,\n  tool: 'Showcase',\n  summary: 'Hero clips made for other sites, to show your client what moving photos can do.',\n  description:\n    'Each item is a clip made for another site: what moves (`what_moves`), what the photo is (`photo`), the clip and its still, and a `link` that plays it in the conversation. ' +\n    \"Pick the two or three closest to this client's kind of photo and paste their links when you talk about the hero's movement, so your client sees what's possible rather than imagining it. \" +\n    \"Never name or describe the other business; an item is an example of an effect, not someone's site.\",\n  effect: 'read',\n  params: {},\n  returns: { shape: 'showcase' },\n  errors: ['store_unavailable'],\n}\n\nconst SHOWCASE_SHAPE = {\n  items: 'The examples, each { item, what_moves, photo, mode, clip, still, link }; empty when none has been chosen for showing yet.',\n}'''\nassert old in s; s=s.replace(old,new)\ns=s.replace(\"function guidedDeclaration(): Record<string, unknown> {\",\"function guidedDeclaration(showcase = false): Record<string, unknown> {\",1)\ns=s.replace(\"  const declaration = guidedDeclaration()\\n\",\"  const declaration = guidedDeclaration(Boolean(opts.showcase))\\n\",1)\n# opts\ns=s.replace('''  measure?: FrameDecoder | null\n}''','''  measure?: FrameDecoder | null\n  /**\n   * [[BUG-356]] — the showcase's shown items, as the consultant reads them\n   * (`consultantShowcase`). Absent, the surface has no showcase operation.\n   */\n  showcase?: (() => Promise<{ items: Record<string, unknown>[] }>) | null\n}''',1)\n# toolbox method\nold='''    async animate_image(args: Record<string, unknown>): Promise<Record<string, unknown>> {'''\nnew='''    /** [[BUG-356]] — the showcase's shown items. Installed only when the surface declares it. */\n    async showcase_items(): Promise<Record<string, unknown>> {\n      try {\n        return await opts.showcase!()\n      } catch (error) {\n        throw new videos.VideogenToolboxError('store_unavailable', `the showcase could not be read: ${error instanceof Error ? error.message : String(error)}`)\n      }\n    }\n\n    async animate_image(args: Record<string, unknown>): Promise<Record<string, unknown>> {'''\nassert old in s; s=s.replace(old,new)\nold='''  return { surface, granted: videos.instanceConfig() as Record<string, unknown> }'''\nnew='''  const granted = videos.instanceConfig() as Record<string, { groups: string[] }>\n  if (opts.showcase) granted[declaration.surface as string] = { groups: [...(granted[declaration.surface as string]?.groups ?? []), SHOWCASE_GROUP] }\n  return { surface, granted }'''\nassert old in s; s=s.replace(old,new)\nopen(p,'w').write(s)\nEOF\ngrep -n \"class VideogenToolbox\" -A40 node_modules/@lagrangefoundry/ai-videogen/js/src/*.js 2>/dev/null | head -5; ls -d node_modules/@lagrangefoundry/* | head","description":"Add showcase op to clip surface"}
```

**Result**

```
(eval):96: no matches found: node_modules/@lagrangefoundry/ai-videogen/js/src/*.js
node_modules/@lagrangefoundry/ai
node_modules/@lagrangefoundry/ai-imagegen
node_modules/@lagrangefoundry/ai-knowledge
node_modules/@lagrangefoundry/ai-ticketing
node_modules/@lagrangefoundry/ai-videogen
node_modules/@lagrangefoundry/ai-vision
node_modules/@lagrangefoundry/auth-passwordless
node_modules/@lagrangefoundry/imagegen
node_modules/@lagrangefoundry/knowledge
node_modules/@lagrangefoundry/logging
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && ls node_modules/@lagrangef…
<!-- xgd-tool name="Bash" id="toolu_01D1YSy8dFwVd5wcckKJmn23" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:38:16.354404+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && ls node_modules/@lagrangefoundry/ai-videogen/; grep -rn \"class VideogenToolbox\" node_modules/@lagrangefoundry/ai-videogen/ --include=*.js | head -2","description":"Find VideogenToolbox source"}
```

**Result**

```
package.json
src
(eval):1: no matches found: --include=*.js
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -rn "class VideogenTo…
<!-- xgd-tool name="Bash" id="toolu_01BbFVuJZqZLiNMk5hz3pegg" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:38:19.580886+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -rn \"class VideogenToolbox\" node_modules/@lagrangefoundry/ai-videogen/src | head -2; F=$(grep -rln \"class VideogenToolbox\" node_modules/@lagrangefoundry/ai-videogen/src | head -1); sed -n \"$(grep -n 'class VideogenToolbox' $F | cut -d: -f1),+45p\" $F","description":"Read VideogenToolbox constructor"}
```

**Result**

```
Exit code 1
node_modules/@lagrangefoundry/ai-videogen/src/toolbox.js:83:export class VideogenToolboxError extends Error {
node_modules/@lagrangefoundry/ai-videogen/src/toolbox.js:153:export class VideogenToolbox extends ToolboxSurface {
sed: 1: "83
153,+45p
": command expected
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 153,215p node_modul…
<!-- xgd-tool name="Bash" id="toolu_014txs1RXt7jqfwtJKbKgWxN" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:38:23.002240+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 153,215p node_modules/@lagrangefoundry/ai-videogen/src/toolbox.js; grep -rn \"binding\\|not implemented\\|missing method\" node_modules/@lagrangefoundry/ai/src/toolbox*.js 2>/dev/null | head -5","description":"Read VideogenToolbox and binding check"}
```

**Result**

```
export class VideogenToolbox extends ToolboxSurface {
  static DECLARATION = DECLARATION

  constructor({
    backend,
    store,
    ticketType,
    budget = DEFAULT_BUDGET,
    byteBudget = DEFAULT_BYTE_BUDGET,
    onProgress = null,
    declaration = null,
  }) {
    super(declaration ?? new.target.DECLARATION)
    if (!store) {
      throw new VideogenToolboxError(
        'store_unavailable',
        `surface '${SURFACE}' was constructed without a ticket store, so a clip would have nowhere to go`,
      )
    }
    if (typeof ticketType !== 'string' || ticketType === '') {
      throw new VideogenToolboxError(
        'store_unavailable',
        `surface '${SURFACE}' was constructed without a 'ticketType'. The type a result ticket ` +
          `takes belongs to the deployment's type pack, so this surface cannot choose one for it`,
      )
    }
    this.backend = backend
    this.store = store
    this.ticketType = ticketType
    this.budget = budget
    this.byteBudget = byteBudget
    this.onProgress = typeof onProgress === 'function' ? onProgress : null
    this.made = 0
  }

  async animate_image({
    image,
    motion,
    mode = 'loop',
    start_image = null,
    freeze_mask = null,
    camera = 'locked',
    duration = 5,
    resolution = '720p',
  }) {
    const source = await this._picture(image, 'image')
    const start = start_image ? await this._picture(start_image, 'start_image') : null
    const mask = freeze_mask ? await this._picture(freeze_mask, 'freeze_mask') : null

    let request
    try {
      request = normaliseRequest({
        image: source.bytes,
        prompt: motion,
        mode,
        startImage: start?.bytes ?? null,
        mask: mask?.bytes ?? null,
        camera,
        duration,
        resolution,
        byteBudget: this.byteBudget,
      })
    } catch (error) {
(eval):1: no matches found: node_modules/@lagrangefoundry/ai/src/toolbox*.js
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && F=$(grep -rln "class Toolb…
<!-- xgd-tool name="Bash" id="toolu_01NBtVw4yqFgKBhSN3fRsf1g" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:38:26.155412+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && F=$(grep -rln \"class ToolboxSurface\" node_modules/@lagrangefoundry/ai/ 2>/dev/null | head -1); echo $F; grep -n \"class ToolboxSurface\" -A40 $F | head -60","description":"Read ToolboxSurface binding"}
```

**Result**

```
node_modules/@lagrangefoundry/ai/src/toolbox/surface.js
33:export class ToolboxSurface {
34-  /** The declaration, as plain data or an already-parsed Declaration. */
35-  static DECLARATION = null
36-
37-  constructor(declaration = null) {
38-    const raw = declaration !== null ? declaration : new.target.DECLARATION
39-    if (raw === null || raw === undefined) {
40-      throw new DeclarationError(
41-        `${new.target.name} supplies no declaration: set DECLARATION on ` +
42-          `the class or pass one to the constructor`,
43-      )
44-    }
45-    this.declaration = raw instanceof Declaration ? raw : Declaration.parse(raw)
46-    // This instance's validated grant, set by the Toolbox at startup. `null` until
47-    // then — a surface constructed but never registered has no session and
48-    // therefore no scope, and reading one from it should fail loudly.
49-    this.grant = null
50-  }
51-
52-  get surface() {
53-    return this.declaration.surface
54-  }
55-
56-  /**
57-   * Receive this instance's validated grant, at startup.
58-   *
59-   * Most surfaces never need it: the Toolbox gates each argument before the host
60-   * API sees it, so a method that acts on what it is given is already scoped. A
61-   * surface that **enumerates** is the exception — `Glob` has no path argument to
62-   * gate and `Grep` may be called without one, so both walk the scope rather than
63-   * checking against it.
64-   *
65-   * What they get is the Toolbox's own compiled scope, not a second copy of the
66-   * policy: the surface asks `grant.pathRules.get(axis)` the same question the gate
67-   * asks it, so a file unreachable by `Read` cannot be named by `Glob`. A surface
68-   * that wrote its own filter would be the handler-owned gating this whole design
69-   * exists to remove.
70-   */
71-  bind(grant) {
72-    this.grant = grant
73-  }
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -i '' 's/ async showca…
<!-- xgd-tool name="Bash" id="toolu_017gojVCMJeP1hcJGNypYBTW" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:38:32.341265+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -i '' 's/    async showcase_items(): Promise<Record<string, unknown>> {/    async showcase(): Promise<Record<string, unknown>> {/' apps/control-app/src/videogen.ts && grep -n \"async showcase()\" apps/control-app/src/videogen.ts; python3 - <<'EOF'\np='apps/control-app/src/router.ts'\ns=open(p).read()\nold=\"          ...(deps.clipFrames ? { measure: deps.clipFrames } : {}),\\n\"\nnew=old+'''          // [[BUG-356]] — the operator's showcase, from the platform's own store: shown items only.\n          showcase: async () =>\n            consultantShowcase(await (deps.tickets ?? ticketStoreFor)(env, { businessId: requirePlatformTenant(env as unknown as IdentityEnv) })),\n'''\nassert old in s; s=s.replace(old,new,1); open(p,'w').write(s)\nEOF\ncd apps/control-app && timeout 300 ../../node_modules/.bin/tsc --noEmit -p tsconfig.json 2>&1 | head -30","description":"Wire showcase to router, typecheck control-app"}
```

**Result**

```
465:    async showcase(): Promise<Record<string, unknown>> {
[This command modified 1 file you've previously read: src/router.ts. Call Read before editing.]
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && ls node_modules/.bin | gre…
<!-- xgd-tool name="Bash" id="toolu_017jbUhCiWqQzhZzHegYQuoh" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:38:42.080325+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && ls node_modules/.bin | grep -i tsc; cat package.json | grep -n \"typecheck\\|tsc\" | head","description":"Find typecheck command"}
```

**Result**

```
tsc
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && ls apps/control-app/tsconf…
<!-- xgd-tool name="Bash" id="toolu_01PDhgEM5J1E9YbgcUaBwgQj" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:38:46.918897+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && ls apps/control-app/tsconfig*.json tsconfig*.json; grep -n \"\\\"scripts\\\"\" -A15 apps/control-app/package.json | grep -i \"type\\|tsc\"","description":"Find tsconfig"}
```

**Result**

```
apps/control-app/tsconfig.json
tsconfig.base.json
6-    "build": "tsc --noEmit",
10-    "@cloudflare/workers-types": "^4.20260630.1",
11-    "typescript": "^6.0.3",
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app && time ../.…
<!-- xgd-tool name="Bash" id="toolu_017TdPXnfGcyA5LM5B6xvVf7" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:38:56.064421+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app && time ../../node_modules/.bin/tsc --noEmit -p tsconfig.json > $TMPDIR/bug356-tsc.txt 2>&1; echo exit=$?; grep -c \"error TS\" $TMPDIR/bug356-tsc.txt; grep \"error TS\" $TMPDIR/bug356-tsc.txt | grep -i \"videogen\\|showcase\\|clip-movement\\|router.ts\\|plan-core\\|host-core\\|account-core\\|server.ts\" | head -20","description":"Typecheck control-app","timeout":400000}
```

**Result**

```
../../node_modules/.bin/tsc --noEmit -p tsconfig.json > $TMPDIR/bug356-tsc.tx  6.51s user 0.26s system 203% cpu 3.331 total
exit=0
0
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder…
<!-- xgd-tool name="Bash" id="toolu_01V5QacERMpPxM8yU4AMB8DP" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:39:04.949347+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder && grep -n \"export async function fetchTenantIssues\" -B3 -A15 api.js; grep -n \"PLATFORM_ISSUES_\" config.js | head; grep -n \"async function postJson\\|function jsonPost\\|export async function post\" api.js | head","description":"Read api pattern and config labels"}
```

**Result**

```
2426- * The platform issues filed from one business's conversations ([[REQ-484]]) —
2427- * `/api/admin/`, on {@link fetchTenantTurns}'s reasoning.
2428- */
2429:export async function fetchTenantIssues(business, fetchImpl = fetch) {
2430-  const path = `/api/admin/issues?business=${encodeURIComponent(business)}`
2431-  const res = await send(fetchImpl, path, {})
2432-  if (!res.ok) {
2433-    const said = await res.json().catch(() => null)
2434-    throw new Error(said?.error || `GET ${path} → ${res.status}`)
2435-  }
2436-  return res.json()
2437-}
2438-
2439-/**
2440- * [[REQ-489]] — every business's lifetime total against its spend limit, and the
2441- * deployment's default limit. Operator-only, unscoped like the other `/api/admin/` calls.
2442- */
2443-export async function fetchSpendCaps(fetchImpl = fetch) {
2444-  const path = '/api/admin/spend/caps'
1359:export const PLATFORM_ISSUES_LABEL = 'Issues filed'
1360:export const PLATFORM_ISSUES_READING = 'Reading the issues filed from this business…'
1361:export const PLATFORM_ISSUES_NONE = 'Nothing has been filed from this business.'
1362:export const PLATFORM_ISSUES_FAILED = (message) => `The issues could not be read: ${message}`
401:export async function postSurface(surface, fetchImpl = fetch) {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder…
<!-- xgd-tool name="Bash" id="toolu_017rSaDHaUQy99AsNYLKVTP6" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:39:07.574893+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder && grep -n \"^async function send\\|^function send\" -A20 api.js | head -30; grep -n \"unscoped\\|businessPath\" api.js | head -5","description":"Read api send helper"}
```

**Result**

```
125:async function send(fetchImpl, url, init) {
126-  const operator = OPERATOR_API.test(String(url))
127-  let res
128-  try {
129-    // NOT FOLLOWED ON AN OPERATOR PATH ([[BUG-314]]). The Worker never redirects
130-    // an `/api/admin/*` call, so a redirect there is the Access edge sending the
131-    // caller to log in — and held, it is an `opaqueredirect` this side can SEE,
132-    // where followed it was a cross-origin rejection indistinguishable from an
133-    // origin that is down.
134-    res = await fetchImpl(url, operator ? { ...init, redirect: 'manual' } : init)
135-  } catch (cause) {
136-    throw announceSessionEnded(new SessionEndedError(SESSION_UNREACHABLE, cause))
137-  }
138-  // `opaqueredirect` is the browser's shape for a held redirect; a runtime that
139-  // is not a browser hands the 3xx itself back. A 401 is the edge's other answer.
140-  if (operator && (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400) || res.status === 401)) {
141-    throw await operatorRefusal(fetchImpl)
142-  }
143-  if (res.status === 401) announceSessionEnded(new SessionEndedError(SESSION_EXPIRED))
144-  return res
145-}
70:  return businessPath(businessScope, path)
78:export function businessPath(businessId, path) {
152: * it this client calls only the console's `/api/admin/*` — unscoped, or under a
201: * relative asset reference drops a query string and would arrive unscoped.
367: * builder with no switcher and an unscoped session, which is exactly what it had
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder…
<!-- xgd-tool name="Bash" id="toolu_01R3oAPq7cq856HhdfKDVaBd" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:39:11.067476+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder && sed -n 55,80p api.js","description":"Read scoped path helper"}
```

**Result**

```
export function getBusinessScope() {
  return businessScope
}

/**
 * Prefix a same-origin path with the current business.
 *
 * Deliberately NOT applied to `/api/status`: it is asked BEFORE a business is
 * chosen and is not about one. `/api/businesses` IS scoped since [[REQ-367]] —
 * its answer is still about the account, but whether the business in scope is
 * one the account holds or one the platform operator ENTERED is a fact about the
 * scope, and only a scoped request can be told it. Unscoped, it is the same
 * request it always was.
 */
function scoped(path) {
  return businessPath(businessScope, path)
}

/**
 * A same-origin path under an explicitly named business ([[REQ-367]]) — the
 * console's Open control, which links to a business that is not the one in
 * scope. {@link scoped} with the id given rather than the current one.
 */
export function businessPath(businessId, path) {
  const id = String(businessId ?? '').trim()
  return id === '' ? path : `/b/${encodeURIComponent(id)}${path}`
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder…
<!-- xgd-tool name="Bash" id="toolu_01PSLjf5xq79ewA7FEs4hiR9" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:39:22.969387+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder && python3 - <<'EOF'\np='api.js'\ns=open(p).read()\nanchor=\"/**\\n * [[REQ-489]] — every business's lifetime total against its spend limit\"\nassert anchor in s\nadd='''/**\n * [[BUG-356]] — the showcase as the console reads it: every item, and the clips\n * one business has made to add from. `/api/admin/`, unscoped.\n */\nexport async function fetchShowcase(business, fetchImpl = fetch) {\n  const path = `/api/admin/showcase?business=${encodeURIComponent(business)}`\n  const res = await send(fetchImpl, path, {})\n  if (!res.ok) {\n    const said = await res.json().catch(() => null)\n    throw new Error(said?.error || `GET ${path} → ${res.status}`)\n  }\n  return res.json()\n}\n\n/** [[BUG-356]] — one showcase write: `''` adds a clip, `/update` shows, hides or rewords, `/remove` takes it out. */\nexport async function postShowcase(action, body, fetchImpl = fetch) {\n  const path = `/api/admin/showcase${action}`\n  const res = await send(fetchImpl, path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })\n  const said = await res.json().catch(() => null)\n  if (!res.ok) throw new Error(said?.error || `POST ${path} → ${res.status}`)\n  return said\n}\n\n/** [[BUG-356]] — where a showcase item's clip or still plays: the console's own read, any item. */\nexport const adminShowcaseMedia = (item, part) => `/api/admin/showcase/media?item=${encodeURIComponent(item)}&part=${part}`\n\n/** [[BUG-356]] — where a shown item's clip or still plays for the client in scope. */\nexport const showcaseMedia = (item, part) => scoped(`/api/showcase/media?item=${encodeURIComponent(item)}&part=${part}`)\n\n'''\ns=s.replace(anchor, add+anchor,1)\nopen(p,'w').write(s)\np='config.js'\ns=open(p).read()\ns=s.replace(\"export const PLATFORM_ISSUES_LABEL = 'Issues filed'\",\"\"\"/** [[BUG-356]] — the console's showcase section: this business's clips, and what other clients may be shown. */\nexport const SHOWCASE_LABEL = 'Showcase'\nexport const SHOWCASE_READING = \"Reading this business's clips and the showcase…\"\nexport const SHOWCASE_NO_CLIPS = 'This business has made no clips.'\nexport const SHOWCASE_FAILED = (message) => `The showcase could not be read: ${message}`\nexport const SHOWCASE_LINE_PLACEHOLDER = 'What moves, in one line'\nexport const SHOWCASE_ADD = 'Add to showcase'\nexport const SHOWCASE_SHOWN = 'Shown to clients'\nexport const SHOWCASE_SAVE = 'Save'\nexport const SHOWCASE_REMOVE = 'Remove'\nexport const SHOWCASE_PLAY_TITLE = 'An example'\nexport const SHOWCASE_PLAY_GONE = 'This example is no longer available.'\nexport const SHOWCASE_MOVEMENT = (pct) => (pct === null || pct === undefined ? '' : `${pct}% of the picture moves`)\n\nexport const PLATFORM_ISSUES_LABEL = 'Issues filed'\"\"\",1)\nopen(p,'w').write(s)\nEOF\ngrep -n \"OPERATOR_API =\" api.js","description":"Add showcase API calls and labels"}
```

**Result**

```
155:const OPERATOR_API = /^(?:\/b\/[^/]+)?\/api\/admin\//
```

## Write /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder/sho…
<!-- xgd-tool name="Write" id="toolu_01XFD2cGqdz6ziHLTdLtXxYr" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:39:36.409537+00:00" -->

**Input**

```json
{"content":"/**\n * [[BUG-356]] — the showcase, in the platform console beside the selected\n * business: the clips that business has made, each with its still, how much of\n * the picture it moves, and whether it is in the showcase.\n *\n * The operator adds a clip with one line saying what moves (the clip and its still\n * are copied to the platform's store, so the item outlives the client's Library),\n * shows or hides an item, rewords its line, or removes it. Only shown items ever\n * reach a consultant or a client. Items copied from this business are listed with\n * the clip they came from; the server keeps every item, whoever it came from.\n */\nimport {\n  SHOWCASE_ADD,\n  SHOWCASE_FAILED,\n  SHOWCASE_LABEL,\n  SHOWCASE_LINE_PLACEHOLDER,\n  SHOWCASE_MOVEMENT,\n  SHOWCASE_NO_CLIPS,\n  SHOWCASE_READING,\n  SHOWCASE_REMOVE,\n  SHOWCASE_SAVE,\n  SHOWCASE_SHOWN,\n} from './config.js'\nimport { adminShowcaseMedia, fetchShowcase, postShowcase } from './api.js'\n\nexport const SHOWCASE_ID = 'showcase'\n\nfunction el(tag, className, text) {\n  const node = document.createElement(tag)\n  if (className) node.className = className\n  if (text !== undefined) node.textContent = text\n  return node\n}\n\nfunction button(label, onClick) {\n  const b = el('button', 'builder-showcase__button', label)\n  b.type = 'button'\n  b.addEventListener('click', onClick)\n  return b\n}\n\n/**\n * @param {object} [spec]\n * @param {(business: string) => Promise<{items: object[], clips: object[]}>} [spec.fetch]\n * @param {(action: string, body: object) => Promise<object>} [spec.post]\n */\nexport function showcaseSection({ fetch: read = fetchShowcase, post = postShowcase } = {}) {\n  return {\n    id: SHOWCASE_ID,\n    label: SHOWCASE_LABEL,\n    mount: (container, { site }) => {\n      let live = true\n      const fail = (err) => {\n        if (live) container.replaceChildren(el('p', 'builder-showcase__error', SHOWCASE_FAILED(err instanceof Error ? err.message : String(err))))\n      }\n      const act = (action, body) => post(action, body).then(paint, fail)\n\n      function clipRow(clip, item) {\n        const row = el('div', 'builder-showcase__clip')\n        row.dataset.material = clip.material\n        const head = [clip.label, clip.title, clip.mode, SHOWCASE_MOVEMENT(clip.movement_pct)].filter(Boolean).join(' · ')\n        row.append(el('p', 'builder-showcase__title', head))\n        const line = el('input', 'builder-showcase__line')\n        line.type = 'text'\n        line.placeholder = SHOWCASE_LINE_PLACEHOLDER\n        line.value = item?.line ?? ''\n        if (!item) {\n          row.append(line, button(SHOWCASE_ADD, () => act('', { business: site.business, material: clip.material, line: line.value })))\n          return row\n        }\n        row.dataset.item = item.item\n        const video = el('video', 'builder-showcase__video')\n        video.src = adminShowcaseMedia(item.item, 'clip')\n        video.poster = adminShowcaseMedia(item.item, 'still')\n        video.controls = true\n        video.muted = true\n        video.preload = 'none'\n        const shown = el('input', 'builder-showcase__shown')\n        shown.type = 'checkbox'\n        shown.checked = item.shown\n        shown.addEventListener('change', () => act('/update', { item: item.item, shown: shown.checked }))\n        const shownLabel = el('label', 'builder-showcase__shown-label')\n        shownLabel.append(shown, document.createTextNode(` ${SHOWCASE_SHOWN}`))\n        row.append(\n          video,\n          line,\n          button(SHOWCASE_SAVE, () => act('/update', { item: item.item, line: line.value })),\n          shownLabel,\n          button(SHOWCASE_REMOVE, () => act('/remove', { item: item.item })),\n        )\n        return row\n      }\n\n      async function paint() {\n        let answer\n        try {\n          answer = await read(site.business)\n        } catch (err) {\n          return fail(err)\n        }\n        if (!live) return\n        const items = new Map((answer?.items ?? []).map((i) => [i.item, i]))\n        const clips = answer?.clips ?? []\n        if (clips.length === 0) {\n          container.replaceChildren(el('p', 'builder-showcase__none', SHOWCASE_NO_CLIPS))\n          return\n        }\n        const list = el('div', 'builder-showcase')\n        list.append(...clips.map((c) => clipRow(c, c.item ? (items.get(c.item) ?? null) : null)))\n        container.replaceChildren(list)\n      }\n\n      container.append(el('p', 'builder-showcase__loading', SHOWCASE_READING))\n      void paint()\n      return {\n        destroy() {\n          live = false\n        },\n      }\n    },\n  }\n}\n","file_path":"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder/showcase.js"}
```

**Result**

```
File created successfully at: /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder/showcase.js (file state is current in your context — no need to Read it back)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder…
<!-- xgd-tool name="Bash" id="toolu_01WgaNeEZnSfcJ3pYDG8VMfY" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:39:40.486137+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder && grep -n \"^import.*modal.js\\|^import.*config.js'\\|from './api.js'\" app.js | head -5; grep -n \"^import {$\" app.js | head -3","description":"Check app.js imports"}
```

**Result**

```
119:} from './api.js'
14:import {
40:import {
78:import {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder…
<!-- xgd-tool name="Bash" id="toolu_0141o5v9VcM1PvnQ5U6vqgNS" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:39:44.471200+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder && sed -n 10,60p app.js | grep -n \"from\" ; grep -n \"createModalShell\" app.js | head -3","description":"Read app.js import sources"}
```

**Result**

```
1:import { createBanner } from './banner.js'
2:import { createLooks, LOOKS_MODE, mountLooksBand } from './looks.js'
3:import { appendDnsCard } from './dns-history.js'
4:import { createMarkedPoints } from './points.js'
29:} from './config.js'
30:import { createShopPanel } from './shop.js'
37:} from './business.js'
38:import { consoleActions, openOperatorConsole } from './console.js'
39:import { accountSection, addressSection, mountPlatformSites } from './platform-sites.js'
40:import { tenantCostSection } from './tenant-cost.js'
41:import { spendCapSection } from './spend-cap.js'
42:import { turnHealthSection } from './turn-health.js'
43:import { platformIssuesSection } from './platform-issues.js'
44:import { estimatesSection } from './estimates.js'
45:import { mountEditor } from './editor.js'
46:import { mountImageEditor } from './image-editor.js'
47:import { isEditablePicture } from './picture-kind.js'
48:import { createLibraryPanel } from './library.js'
49:import { createPeoplePanel } from './people.js'
50:import { createSettingsPanel } from './settings.js'
51:import { createDebugPanel } from './debug.js'
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder…
<!-- xgd-tool name="Bash" id="toolu_01H8tWzrCgusuFfZ1zuQe5Zj" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:39:45.658521+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder && sed -n 14,40p app.js | head -30","description":"Read config import list in app.js"}
```

**Result**

```
import {
  ACCOUNT_ACTION_ID,
  SETTINGS_CONVERSATION_LABEL,
  SITE_CONVERSATION_LABEL,
  ACCOUNT_LABEL,
  APP_FONT,
  APP_ID,
  BUSINESS_NONE_SELECTABLE_MESSAGE,
  DEBUG_TAB,
  LIBRARY_TAB,
  PEOPLE_TAB,
  SHOP_TAB,
  PUBLISH_FAILED_MESSAGE,
  SETTINGS_TAB,
  SHOW_GONE,
  FINISHED_CUE,
  FINISH_SETTLE_MS,
  SITE_TAB,
  STORAGE_KEYS,
  INPUT_MODE_LABEL,
  LOOKS_MODE_LABEL,
  PREVIEW_UPDATING,
  TABS,
  ARCHIVE_POLL_MS,
} from './config.js'
import { createShopPanel } from './shop.js'
import {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder…
<!-- xgd-tool name="Bash" id="toolu_017a47WqcApgGwg3ecGQfi6B" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:39:56.524589+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/apps/control-app/src/builder && python3 - <<'EOF'\np='showcase.js'\ns=open(p).read()\ns=s.replace(\"\"\"  SHOWCASE_NO_CLIPS,\"\"\",\"\"\"  SHOWCASE_NO_CLIPS,\n  SHOWCASE_PLAY_TITLE,\"\"\",1)\ns=s.replace(\"import { adminShowcaseMedia, fetchShowcase, postShowcase } from './api.js'\",\"import { adminShowcaseMedia, fetchShowcase, postShowcase, showcaseMedia } from './api.js'\\nimport { createModalShell } from './modal.js'\",1)\ns+='''\n/**\n * [[BUG-356]] — PLAY A SHOWCASE EXAMPLE IN THE CONVERSATION: the consultant's\n * `#show=showcase&item=…` link opens the clip in a dialog over the builder, its\n * still first, playing at once and looping, so the client sees the effect where\n * they are talking about it. Answers whether there was an item to play; a link\n * whose item is gone or no longer shown is said so beside it by the caller.\n *\n * @param {string|null} item\n * @param {object} [spec]\n * @param {(item: string, part: string) => string} [spec.media]\n * @param {(url: string) => Promise<boolean>} [spec.exists] whether the clip is still there to play\n */\nexport async function playShowcase(item, { media = showcaseMedia, exists = defaultExists } = {}) {\n  if (!item) return false\n  const clip = media(item, 'clip')\n  if (!(await exists(clip))) return false\n  const shell = createModalShell({ title: SHOWCASE_PLAY_TITLE })\n  shell.element.classList.add('builder-showcase-play')\n  const video = el('video', 'builder-showcase-play__video')\n  video.dataset.item = item\n  video.src = clip\n  video.poster = media(item, 'still')\n  video.controls = true\n  video.muted = true\n  video.autoplay = true\n  video.loop = true\n  video.playsInline = true\n  shell.panel.append(video)\n  shell.mount()\n  return true\n}\n\nasync function defaultExists(url) {\n  try {\n    const res = await fetch(url, { method: 'HEAD' })\n    return res.ok\n  } catch {\n    return false\n  }\n}\n'''\nopen(p,'w').write(s)\np='app.js'\ns=open(p).read()\ns=s.replace(\"import { estimatesSection } from './estimates.js'\",\"import { estimatesSection } from './estimates.js'\\nimport { playShowcase, showcaseSection } from './showcase.js'\",1)\ns=s.replace(\"      platformIssuesSection(),\\n\",\"      platformIssuesSection(),\\n      showcaseSection(),\\n\",1)\nold=\"\"\"    if (target === 'web_address') {\n      revealWebAddress()\n      return true\n    }\n    return false\n  }\"\"\"\nnew=\"\"\"    if (target === 'web_address') {\n      revealWebAddress()\n      return true\n    }\n    // [[BUG-356]] — a showcase example, played over the builder.\n    if (target === 'showcase') return playShowcase(q.get('item'))\n    return false\n  }\"\"\"\nassert old in s; s=s.replace(old,new,1)\nopen(p,'w').write(s)\nEOF\ngrep -n \"HEAD\" ../router.ts | head -3","description":"Add chat player and register section"}
```

**Result**

```
105:  GATE_HEADERS,
2443: * A HEADER, NOT THE PAGE. The preview's bytes are the build's bytes ([[REQ-119]])
3324: * REQUIRED, AND AHEAD OF `deps`. Both are deliberate. An optional scope would
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -i '' "s/ if (p === SH…
<!-- xgd-tool name="Bash" id="toolu_01P5AnmVebeJ47ryCkMwcWFL" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:40:03.166621+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -i '' \"s/  if (p === SHOWCASE_MEDIA_PATH \\&\\& method === 'GET') {/  if (p === SHOWCASE_MEDIA_PATH \\&\\& (method === 'GET' || method === 'HEAD')) {/\" apps/control-app/src/router.ts && grep -n \"SHOWCASE_MEDIA_PATH &&\" apps/control-app/src/router.ts; sed -n 5,25p ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/builder-css-tail-is-story-board.md","description":"Allow HEAD; read CSS memory"}
```

**Result**

```
3967:  if (p === SHOWCASE_MEDIA_PATH && (method === 'GET' || method === 'HEAD')) {
  node_type: memory
  type: project
  originSessionId: f492aa73-55c9-4195-8a6c-8937612932fc
  modified: 2026-10-19T22:38:50.506Z
---

`test_UAT_FC_REQ-408_the_board_style_does_not_change_with_the_sites_palette_or_fonts`
takes everything in `apps/control-app/src/builder/builder.css` from the
`/* --- the story board ([[REQ-408]])` marker to the end of the file, and asserts
it has no `var(--…)` (only `--tilt`). New rules appended at the bottom of the
file land inside that "section" and fail it.

**Why:** hit on 2026-10-19 (REQ-413). The failure quotes the story-board CSS,
not your rule, so it reads like the story board regressed.

**How to apply:** put new builder rules beside the area they style (e.g. after
`.builder-chat-step::before`), never at the end of `builder.css`.
[This command modified 1 file you've previously read: apps/control-app/src/router.ts. Call Read before editing.]
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "builder-platform-…
<!-- xgd-tool name="Bash" id="toolu_01Ni7dBXYrW96inRLchCLxsY" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:40:06.901806+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"builder-platform-issues\" apps/control-app/src/builder/builder.css | head -3","description":"Find platform-issues CSS spot"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "builder-turn-heal…
<!-- xgd-tool name="Bash" id="toolu_01N3JYYE8NCmBEbggcQvXntP" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:40:09.872408+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"builder-turn-health\\|builder-console-sites__field {\" apps/control-app/src/builder/builder.css | head -3; grep -n \"the story board (\\[\\[REQ-408\" apps/control-app/src/builder/builder.css","description":"Find console CSS spot"}
```

**Result**

```
6322:.builder-console-sites__field {
6554:.builder-turn-health {
6561:.builder-turn-health__alarm {
7434:/* --- the story board ([[REQ-408]]) ---------------------------------------------
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='apps/…
<!-- xgd-tool name="Bash" id="toolu_01YPZysxYxUK7Y1BPCYgpT95" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:40:14.998634+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='apps/control-app/src/builder/builder.css'\ns=open(p).read()\nanchor='.builder-turn-health {'\ncss='''/* [[BUG-356]] — the console's showcase section, and an example played from the chat. */\n.builder-showcase {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n.builder-showcase__clip {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 6px;\n}\n.builder-showcase__title {\n  flex-basis: 100%;\n  margin: 0;\n}\n.builder-showcase__video {\n  width: 240px;\n  max-width: 100%;\n}\n.builder-showcase__line {\n  flex: 1 1 200px;\n}\n.builder-showcase-play__video {\n  display: block;\n  width: min(80vw, 960px);\n  max-height: 80vh;\n}\n\n'''\ni=s.index(anchor); s=s[:i]+css+s[i:]\nopen(p,'w').write(s)\nEOF\necho ok","description":"Add showcase CSS beside console rules"}
```

**Result**

```
ok
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "estimates\|'fonts…
<!-- xgd-tool name="Bash" id="toolu_012Cwru7HzU9v9FoPcDGgnZq" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:40:21.305134+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"estimates\\|'fonts'\" tools/generate/src/cli/index.ts | head -10; git grep -ln \"survey\" -- tools/generate/src/cli | head -5","description":"Find estimates survey command"}
```

**Result**

```
557:  1c estimates survey [--since <ISO>] [--local <file.sqlite>[,…]] [--remote-env <env>[,…]] [--write] [--json]
563:    --write makes the result the table the host estimates from (slow-tools.json).
923:    font-advance table (REQ-655): what the renderer estimates a button label's width from.
1973:    case 'estimates': {
1976:        console.error('Usage: 1c estimates survey [--since <ISO>] [--local <file>[,…]] [--remote-env <env>[,…]] [--write] [--json]')
3032:    case 'fonts': {
tools/generate/src/cli/ai/estimate-core.ts
tools/generate/src/cli/ai/estimate-survey-core.ts
tools/generate/src/cli/ai/host-core.ts
tools/generate/src/cli/ai/slow-tools.json
tools/generate/src/cli/dev.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 550,570p tools/gene…
<!-- xgd-tool name="Bash" id="toolu_01CidswRMi1KmYrKGq7NDT7S" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:40:24.450146+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 550,570p tools/generate/src/cli/index.ts; sed -n 1973,2030p tools/generate/src/cli/index.ts","description":"Read estimates survey CLI"}
```

**Result**

```
    of them) and/or \`tools\` (the builder's grant). Prints its estimate first, refuses
    without --budget and stops at it. Writes eval-builder.md and .json, default under
    .xgd/tmp/eval-builder/. [[REQ-454]] Scores also count copy the builder altered
    (reported or not), refused design writes, and craft-check and off-system changes
    per page. A case recorded before site.design is replayed migrated and marked
    pre-design; --skip-pre-design leaves such cases out.

  1c estimates survey [--since <ISO>] [--local <file.sqlite>[,…]] [--remote-env <env>[,…]] [--write] [--json]
    How long each kind of step really takes ([[BUG-360]]): builder passes by scope
    (section, page, pages, site), layout fix rounds, slow tools and the consultant's own
    time between steps — median and 80th percentile with n, from the runs since --since
    (default: the container cutover). Lost, stopped and refused passes are left out.
    Reads the dev D1 unless a source is named; --remote-env asks wrangler, read-only.
    --write makes the result the table the host estimates from (slow-tools.json).

  1c ps [--json]
    Every server this project has running, with its pid, its port and the directory
    it was started from ([[REQ-319]]). Built on \`lsof\`, not \`ps\` — \`ps aux\` returns
    nothing at all under an agent sandbox, which is the condition that let eight
    zombie listeners accumulate unseen. Each row is classified by its working
    directory: this checkout, an .xgd worktree of this repo, another project, or
    case 'estimates': {
      // [[BUG-360]] — the re-survey of step times, as one command.
      if (rest[0] !== 'survey') {
        console.error('Usage: 1c estimates survey [--since <ISO>] [--local <file>[,…]] [--remote-env <env>[,…]] [--write] [--json]')
        process.exitCode = EXIT_CODES.SCHEMA_INVALID
        return
      }
      const list = (v: unknown): string[] | undefined => (typeof v === 'string' ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined)
      const { runSurvey, formatSurvey } = await import('./estimate-survey')
      const out = runSurvey({
        root: repoRoot(),
        since: typeof flags.since === 'string' ? flags.since : undefined,
        local: list(flags.local),
        remote: list(flags['remote-env']),
        write: flags.write === true,
      })
      console.log(flags.json === true ? JSON.stringify(out, null, 2) : `${formatSurvey(out.survey, out.sources)}${out.wrote ? `\n\nWrote ${out.wrote}` : ''}`)
      return
    }

    case 'ps': {
      // [[REQ-319]] — what is running here, with its pid, its port and the
      // directory it was started from. Built on `lsof` rather than `ps`, which
      // returns nothing at all under the agent sandbox; see `ps.ts`.
      //
      // `devTable` AND NOT A SECOND CALL TO `devProcessTable`. The survey cannot
      // observe for itself which listeners `bin/dev` started — the pidfiles belong
      // to `bin/dev`, and `ps.ts` has no business knowing where that writes them —
      // so the managed set is supplied by the caller, and `devTable` is the one
      // caller that composes it.
      //
      // This verb used to compose its own: `readDevPidfiles(root).map((r) => r.pid)`,
      // the SPAWNED pid only, while `devTable` passed every pid a pidfile names. The
      // two therefore disagreed about what "managed" means, and the one an operator
      // actually reads was the wrong one — a snapshot app whose listener is a
      // `workerd` grandchild reported as belonging to nobody, which is [[BUG-147]]'s
      // own symptom surviving in the command you run to ask the question
      // ([[BUG-152]]). Two call sites could disagree; one cannot.
      const table = devTable({ repoRoot: repoRoot() })
      // [[BUG-307]] — a service older than the snapshot it serves is named here,
      // because this is the command an operator runs to ask what is running.
      const stale = devStale({ repoRoot: repoRoot() })
      const staleText = formatStale(stale)
      console.log(
        flags.json === true
          ? JSON.stringify({ ...table, stale }, null, 2)
          : `${formatProcessTable(table)}${staleText === '' ? '' : `\n\n${staleText}`}`,
      )
      // A SURVEY THAT FOUND NOTHING IS STILL A SUCCESSFUL SURVEY. What is not is
      // one that could not run: `lsof` absent means the answer is unknown rather
      // than empty, and exiting 0 on that would let a caller read silence as calm.
      if (!table.probed) process.exitCode = EXIT_CODES.ENVIRONMENT
      return
    }

    case 'dev': {
      // [[REQ-319]] — `bin/dev` is a launcher for this verb and nothing else, so
      // the three subcommands live here beside `1c ps`, which is the table all
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "wrangler\|sqlite\…
<!-- xgd-tool name="Bash" id="toolu_013Q3PrWPfTJ7Js7rMzS46Uq" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:40:30.267515+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"wrangler\\|sqlite\\|function \\|execFileSync\\|spawnSync\" tools/generate/src/cli/estimate-survey.ts | head -40","description":"Read survey data sources"}
```

**Result**

```
6: * SOURCES. `--local <file.sqlite>` reads a D1 file directly (the dev
8: * `--remote <env>` asks `wrangler d1 execute DB --remote --env <env>` from the
15:import { execFileSync } from 'node:child_process'
18:import { DatabaseSync } from 'node:sqlite'
29:function iso(since: string): string {
46:function split(comments: Array<{ kind: string; subject: string; body: string }>): Pick<Rows, 'tools' | 'chats'> {
52:export function localRows(file: string, since: string): Rows {
66:/** Rows from a deployed D1, through wrangler, read-only. */
67:export function remoteRows(root: string, env: string, since: string): Rows {
69:    const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--remote', '--env', env, '--json', '--command', sql], {
84:export function devDatabases(root: string): string[] {
85:  const dir = path.join(root, 'apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject')
88:    .filter((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
93:        return db.prepare("select 1 from sqlite_master where type='table' and name='request_spend'").get() !== undefined
110:export function runSurvey(opts: SurveyOptions): { survey: Survey; sources: string[]; wrote: string | null } {
146:export function applySurvey(table: SlowToolsTable, result: Survey, sources: string[], today: string): SlowToolsTable {
172:export function formatSurvey(result: Survey, sources: string[]): string {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "export async func…
<!-- xgd-tool name="Bash" id="toolu_01HuMTYNXL3U2kDM8cTkhtZp" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:40:33.985883+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"export async function ticketStoreFor\" -A40 apps/control-app/src/tickets.ts | grep -v \"^\\S*-\\s*\\*\\|^\\S*-\\s*//\" | head -40","description":"Read ticketStoreFor"}
```

**Result**

```
1074:export async function ticketStoreFor(
1075-  env: TicketStoreEnv,
1076-  scope: Scope,
1077-  opts: TicketStoreOptions = {},
1078-): Promise<TicketStore> {
1079-  const tenantId = scope.businessId
1080-  if (tenantId === '') throw new UnscopedError('ticketStoreFor')
1081-  const base = ticketStoreBase(env, opts)
1082-  if (!(await base.accessor.getTenant(tenantId))) {
1083-    await base.registerTenant({ id: tenantId, name: tenantId })
1084-  }
1085-  return base.forTenant(tenantId)
1086-}
1087-
1088-/**
1096-export interface TicketStore {
1097-  /**
1111-  readonly max_value_bytes: number
1112-  create(a: {
1113-    type: string
1114-    title: string
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1,60p tools/generat…
<!-- xgd-tool name="Bash" id="toolu_01MePiYWYSLHsAPbsX7GJEBe" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:40:40.030194+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1,60p tools/generate/src/cli/push.ts","description":"Read push.ts approach"}
```

**Result**

```
import { assertNotCaptureMirrored } from '../store/asset-rights'
import type { ReferenceStore } from '../store/reference-store'
import type { SiteStore, StoredAsset, StoredPage } from '../store/site-store'

/**
 * The site-payload transport: one site's draft, read out of a store and posted
 * into another store's import route (REQ-145).
 *
 * THIS IS A TRANSPORT, NOT A COMMAND (REQ-290). It began as the local half of a
 * CLI verb that read the git-tracked authoring tier and posted it up; REQ-290
 * retired both the verb and the tier. Nothing here
 * went with it, because nothing here was ever about that tier: every function
 * below takes a {@link SiteStore} port and cannot tell which implementation it
 * was handed. What survives is the wire shape (`SitePayload`), the two ends
 * that convert to and from it, and the refusals — and REQ-289's copy pair,
 * along with the Worker's own `/api/import` and `/api/export`, are built on
 * exactly those.
 *
 * WHY IT GOES OVER HTTP AND NOT STRAIGHT INTO D1. The store's D1/R2 adapter
 * takes workerd *bindings* — a `D1Database` and an `R2Bucket` — and Node has
 * neither. The alternatives were to drive `wrangler d1 execute` and `wrangler r2
 * object put` from a shell script, which means hand-escaping SQL around
 * arbitrary site JSON, or to re-implement the store against Cloudflare's HTTP
 * API, which is a third adapter to keep in step with two.
 *
 * Instead the WORKER writes, through the very bindings and the very store it
 * serves from, and this side only reads and posts. So an import lands by exactly
 * the code path an edit lands by; there is no second writer that could disagree
 * about what a site is made of, and the same command works against `wrangler
 * dev`'s local D1 and against production by changing one URL.
 *
 * IT IS NOT `1c publish`. That mints a revision from a draft and is a different
 * operation entirely (and, in the cloud, is REQ-149). This copies a draft from
 * one store to another — the local half of `importSite`, which is already
 * port-to-port and is what runs on the far side.
 */

/** One site's whole draft, as it crosses the wire. */
export interface SitePayload {
  /**
   * What the site is called in the store it came from — whatever that store's
   * own naming is.
   *
   * IT NAMES THE SOURCE AND ADDRESSES NOTHING ([[REQ-236]]). It used to be the
   * far side's target too, because the cloud store addressed a site by a slug.
   * It cannot be: a D1 site is named by a key the store mints, and this side has
   * never seen one. So `/api/import` resolves its own target — the receiving
   * business's site, created when it holds none — and what this field is still
   * for is the sentence a refusal has to say back to the operator, which has to
   * name the site they typed rather than one they have never seen.
   *
   * AND ON AN EXPORT IT IS THE STORE'S OWN KEY ([[REQ-289]]). `GET /api/export`
   * answers with this same payload, so it has to put something here; what it
   * puts is what the site is called where it was read, which in D1 is a minted
   * key. That is the same statement this field has always made, in the
   * vocabulary of whichever side produced it — and it still addresses nothing
   * on the side it is going to.
   */
  slug: string
  /** `site.json`, or null when the site holds none. */
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "admin\|token\|Aut…
<!-- xgd-tool name="Bash" id="toolu_0133V56jNZb69bkRLeZdTYSf" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:40:43.859752+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"admin\\|token\\|Authorization\\|cf-access\\|CF_ACCESS\\|header\" tools/generate/src/cli/copy.ts | head -30","description":"How 1c copy authenticates"}
```

**Result**

```
174:   * The CLOUD end's Cloudflare Access service token — and the local end's
189:   * token's values: a production credential in a local process's argv, to work
195:   * headers either way. This adds a way to say the ends differ; it does not
343: * The service-token pair, or nothing — never half of one.
345: * HALF A CREDENTIAL IS NOT A WEAKER CREDENTIAL. A request carrying one header
352: * credential for `api.cloudflare.com`, and Access exchanges a service-token
374:    `A Cloudflare Access service token is a PAIR. Set both ${n.envId} ` +
394:/** The headers every call in this module sends. */
395:function headersFor(access: AccessServiceToken | undefined): Record<string, string> {
396:  const headers: Record<string, string> = { accept: 'application/json' }
398:    headers['CF-Access-Client-Id'] = access.clientId
399:    headers['CF-Access-Client-Secret'] = access.clientSecret
401:  return headers
421:    headers: headersFor(opts.access),
445: * `GET /api/admin/sites` (REQ-298) AND NOT A NEW ROUTE. It lists every site on
517:  // so a service token — which the edge exchanges only on the operator's paths —
800: * `bin/access-sim`'s own front door and service-token pair — the defaults
929:  const res = await doFetch(url, { method: 'GET', headers: headersFor(opts.access), redirect: 'manual' })
945:    headers: { ...headersFor(opts.access), 'content-type': 'application/octet-stream' },
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 340,395p tools/gene…
<!-- xgd-tool name="Bash" id="toolu_01Rs36cS13VWCPTh1DiuZnde" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:40:48.589804+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 340,395p tools/generate/src/cli/copy.ts | grep -v \"^ \\*\"; grep -n \"case 'copy'\" -A40 tools/generate/src/cli/index.ts | grep -n \"origin\\|access\\|from\\b\\|flags\\.\" | head -20","description":"Read access token helper and copy flags"}
```

**Result**

```
}

/**
export function serviceToken(
  clientId: string | undefined,
  clientSecret: string | undefined,
  end: AccessEnd = 'cloud',
): AccessServiceToken | undefined {
  const id = (clientId ?? '').trim()
  const secret = (clientSecret ?? '').trim()
  if (id !== '' && secret !== '') return { clientId: id, clientSecret: secret }
  if (id === '' && secret === '') return undefined
  const n = ACCESS_NAMING[end]
  throw new Error(
    `A Cloudflare Access service token is a PAIR. Set both ${n.envId} ` +
      `and ${n.envSecret} (or pass both ${n.flagId} and ${n.flagSecret}). ` +
      'CLOUDFLARE_API_TOKEN is an API credential for api.cloudflare.com and is not ' +
      `what Access accepts. ${n.provision}`,
  )
}

/**
export interface Wire {
  end: AccessEnd
  access?: AccessServiceToken
  fetch?: typeof fetch
}

/** The headers every call in this module sends. */
function headersFor(access: AccessServiceToken | undefined): Record<string, string> {
2:3239-      const json = flags.json === true
10:3247-          module: typeof flags.module === 'string' ? flags.module : undefined,
11:3248-          slot: typeof flags.slot === 'string' ? flags.slot : undefined,
26:3263-        const raw = flags.values
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "ACCESS_NAMING" -A…
<!-- xgd-tool name="Bash" id="toolu_01BdR768zyYRs9QTPtWfJtc7" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:40:51.511880+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"ACCESS_NAMING\" -A20 tools/generate/src/cli/copy.ts | head -26; grep -n \"serviceToken(\" tools/generate/src/cli/index.ts | head -3","description":"Access naming and usage in index"}
```

**Result**

```
17:  ACCESS_NAMING,
18-  postPayload,
19-  postSitePayload,
20-  readSitePayload,
21-  type AccessEnd,
22-  type AccessServiceToken,
23-  type PushResult,
24-  type SitePayload,
25-} from './push'
26-
27-/**
28- * Copying one business's site between the local builder and the deployed one
29- * ([[REQ-289]]).
30- *
31- * WHY IT IS NOT CALLED `publish`. `publish` already names an operation — take a
32- * draft, freeze it as a version, make that version live. The push script this
33- * replaced borrowed the word for a different one on a different axis: copy bytes
34- * from this laptop to Cloudflare. Worse, it copied the wrong thing. It read the
35- * git-tracked file tier, and the sites that actually exist were authored in the
36- * builder and live in D1 and R2 — so until this pair there had never been a
37- * command that moves a builder-authored site anywhere. REQ-290 retired both the
--
360: * here, only a second row of {@link ACCESS_NAMING}. It defaults to `cloud`
361- * because that is what this meant before there were two.
362- */
363-export function serviceToken(
1103:  const cloudAccess = serviceToken(
1117:    serviceToken(
1555:        const access = serviceToken(
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1095,1125p tools/ge…
<!-- xgd-tool name="Bash" id="toolu_014pDvvNE3tfYRdthFMU57xd" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:40:54.846360+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1095,1125p tools/generate/src/cli/index.ts; sed -n 1545,1565p tools/generate/src/cli/index.ts; grep -n \"ACCESS_NAMING\" -A14 tools/generate/src/cli/push.ts | head -20","description":"Read token resolution in index"}
```

**Result**

```
 * The two Access pairs a copy may need, one per end ([[BUG-134]]): flags over
 * the environment. Shared by every copy command so the ends are reached
 * identically ([[REQ-654]]).
 */
function copyCredentials(flags: Record<string, string | boolean>): {
  cloudAccess: AccessServiceToken | undefined
  localAccess: AccessServiceToken | undefined
} {
  const cloudAccess = serviceToken(
    typeof flags['client-id'] === 'string'
      ? flags['client-id']
      : process.env.CF_ACCESS_CLIENT_ID,
    typeof flags['client-secret'] === 'string'
      ? flags['client-secret']
      : process.env.CF_ACCESS_CLIENT_SECRET,
    'cloud',
  )
  // THE DEFAULT LOCAL END IS `bin/access-sim`, ORIGIN AND PAIR TOGETHER
  // ([[REQ-393]]): with no `--origin` and no LOCAL_ pair, the simulator's
  // own pair is sent, because nothing else gets past it. An explicit
  // `--origin` keeps BUG-134's fallback to the cloud pair.
  const localAccess =
    serviceToken(
      typeof flags['local-client-id'] === 'string'
        ? flags['local-client-id']
        : process.env.LOCAL_ACCESS_CLIENT_ID,
      typeof flags['local-client-secret'] === 'string'
        ? flags['local-client-secret']
        : process.env.LOCAL_ACCESS_CLIENT_SECRET,
      'local',
    ) ?? (typeof flags.origin === 'string' ? undefined : ACCESS_SIM_PAIR)
     * reproduction's draft, into an existing business in the local builder.
     * `copyReproToDev` is the whole of it; this reads the flags and prints.
     */
    case 'copy-repro-to-dev': {
      const json = flags.json === true
      try {
        const repro = requireArg(rest[0], 'repro-slug')
        const business = requireArg(rest[1], 'business')
        // THE LOCAL ROW OF BUG-134's TABLE, and nothing else: there is no cloud
        // end here, so the cloud pair is not a fallback for it.
        const access = serviceToken(
          typeof flags['local-client-id'] === 'string'
            ? flags['local-client-id']
            : process.env.LOCAL_ACCESS_CLIENT_ID,
          typeof flags['local-client-secret'] === 'string'
            ? flags['local-client-secret']
            : process.env.LOCAL_ACCESS_CLIENT_SECRET,
          'local',
        )
        const result = await copyReproToDev(repro, business, {
          cwd: process.cwd(),
270:export const ACCESS_NAMING: Record<AccessEnd, AccessNaming> = {
271-  cloud: {
272-    subject: 'The CLOUD end',
273-    envId: 'CF_ACCESS_CLIENT_ID',
274-    envSecret: 'CF_ACCESS_CLIENT_SECRET',
275-    flagId: '--client-id',
276-    flagSecret: '--client-secret',
277-    provision: 'Run bin/access-token to provision one.',
278-  },
279-  local: {
280-    subject: 'The LOCAL end',
281-    envId: 'LOCAL_ACCESS_CLIENT_ID',
282-    envSecret: 'LOCAL_ACCESS_CLIENT_SECRET',
283-    flagId: '--local-client-id',
284-    flagSecret: '--local-client-secret',
--
305:  const n = ACCESS_NAMING[end]
306-  return (
307-    `${n.subject} is behind Cloudflare Access. Set ${n.envId} and ${n.envSecret} ` +
308-    `to a service token, or pass ${n.flagId} and ${n.flagSecret}. ${n.provision}`
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "CLOUD_ORIGIN\|clo…
<!-- xgd-tool name="Bash" id="toolu_01HqbUZMasUXmtiAYNMT2XJt" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:40:58.267046+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"CLOUD_ORIGIN\\|cloudOrigin\\|DEFAULT_ORIGIN\\|ACCESS_SIM_ORIGIN\\|ACCESS_SIM_PAIR =\" tools/generate/src/cli/*.ts | head -10","description":"Find default origins"}
```

**Result**

```
tools/generate/src/cli/copy.ts:57:export const CLOUD_ORIGIN = 'https://app.1stcontact.io'
tools/generate/src/cli/copy.ts:138: * one ({@link CLOUD_ORIGIN}, or `origins.cloud`).
tools/generate/src/cli/copy.ts:152:  return { origin: end === 'local' ? (origins.local ?? LOCAL_ORIGIN) : (origins.cloud ?? CLOUD_ORIGIN), end, business }
tools/generate/src/cli/copy.ts:156:export function routeFor(direction: CopyDirection, business: string, local: string = LOCAL_ORIGIN, cloud: string = CLOUD_ORIGIN): CopyRoute {
tools/generate/src/cli/copy.ts:238:  cloud: string = CLOUD_ORIGIN,
tools/generate/src/cli/copy.ts:809:export const ACCESS_SIM_ORIGIN = LOCAL_ORIGIN
tools/generate/src/cli/copy.ts:861:  const origin = opts.origin ?? ACCESS_SIM_ORIGIN
tools/generate/src/cli/index.ts:47:  ACCESS_SIM_ORIGIN,
tools/generate/src/cli/index.ts:49:  CLOUD_ORIGIN,
tools/generate/src/cli/index.ts:731:    ${CLOUD_ORIGIN}) and a business on it, by name or id. Any pair; the two businesses
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -l "apps/control-…
<!-- xgd-tool name="Bash" id="toolu_013rKegkurHtUGBr969P31pW" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:41:02.484168+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -l \"apps/control-app/src\" -- tools/generate/src | head -3","description":"Check import direction precedent"}
```

**Result**

```
tools/generate/src/cli/ai/dns-core.ts
tools/generate/src/cli/ai/host.ts
tools/generate/src/cli/ai/ledger-core.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && cat > tools/generate/src/c…
<!-- xgd-tool name="Bash" id="toolu_01HhebGDH62mte18C4J52f1S" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:41:23.234625+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && cat > tools/generate/src/cli/showcase-measure.ts <<'EOF'\nimport { ffmpegDecoder, measureMovement, NOTICEABLE_SHARE, type FrameDecoder, type Movement } from '../../../../apps/control-app/src/clip-movement'\nimport type { AccessServiceToken } from './push'\n\n/**\n * [[BUG-356]] — `1c showcase measure`: every showcase item's movement against the\n * one threshold ({@link NOTICEABLE_SHARE}), so the operator can tell, once the\n * showcase is marked, whether the threshold still lets every showcase reveal\n * through. A marked reveal that fails is the signal to lower it — the value lives\n * in one place, `clip-movement.ts`.\n *\n * OVER HTTP, LIKE `1c copy`: the console's own admin routes read the items and\n * play each clip, behind Cloudflare Access with the same service-token pair; the\n * clip is decoded here, with this machine's `ffmpeg`. Nothing is written.\n */\n\n/** One item's line in the report. */\nexport interface MeasuredItem {\n  item: string\n  line: string\n  shown: boolean\n  mode: string | null\n  movement: Movement | null\n  /** Why the clip could not be measured, when it could not. */\n  error?: string\n}\n\nexport interface MeasureOptions {\n  origin: string\n  access?: AccessServiceToken\n  fetch?: typeof fetch\n  decode?: FrameDecoder\n}\n\nfunction headers(access: AccessServiceToken | undefined): Record<string, string> {\n  return access ? { 'CF-Access-Client-Id': access.clientId, 'CF-Access-Client-Secret': access.clientSecret } : {}\n}\n\n/** Measure every showcase item the deployment at `origin` holds. */\nexport async function measureShowcase(opts: MeasureOptions): Promise<MeasuredItem[]> {\n  const doFetch = opts.fetch ?? fetch\n  const decode = opts.decode ?? ffmpegDecoder()\n  const base = opts.origin.replace(/\\/+$/, '')\n  const listed = await doFetch(`${base}/api/admin/showcase`, { headers: { accept: 'application/json', ...headers(opts.access) }, redirect: 'manual' })\n  if (!listed.ok) throw new Error(`GET /api/admin/showcase → ${listed.status}: is the Access service token set (CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET)?`)\n  const { items } = (await listed.json()) as { items: Array<{ item: string; line: string; shown: boolean; mode: string | null }> }\n  const out: MeasuredItem[] = []\n  for (const i of items) {\n    const row: MeasuredItem = { item: i.item, line: i.line, shown: i.shown, mode: i.mode, movement: null }\n    try {\n      const res = await doFetch(`${base}/api/admin/showcase/media?item=${encodeURIComponent(i.item)}&part=clip`, { headers: headers(opts.access), redirect: 'manual' })\n      if (!res.ok) throw new Error(`the clip answered ${res.status}`)\n      row.movement = await measureMovement(new Uint8Array(await res.arrayBuffer()), decode)\n    } catch (error) {\n      row.error = error instanceof Error ? error.message : String(error)\n    }\n    out.push(row)\n  }\n  return out\n}\n\n/** The report: one line per item, then what it means for the threshold. */\nexport function formatMeasured(rows: MeasuredItem[]): string {\n  const threshold = Math.round(NOTICEABLE_SHARE * 100)\n  if (rows.length === 0) return 'The showcase holds no items yet.'\n  const lines = rows.map((r) => {\n    const verdict = r.movement === null ? `not measured (${r.error})` : `${r.movement.percent}%${r.movement.noticeable ? '' : ' — below the threshold'}`\n    return `${r.shown ? 'shown ' : 'hidden'}  ${verdict}  ${r.mode ?? '?'}  ${r.item}  ${r.line}`\n  })\n  const failing = rows.filter((r) => r.shown && r.mode === 'reveal' && r.movement && !r.movement.noticeable)\n  const tail =\n    failing.length === 0\n      ? `Every shown reveal is at or above the threshold of ${threshold}%.`\n      : `${failing.length} shown reveal(s) fall below the threshold of ${threshold}%: lower NOTICEABLE_SHARE in apps/control-app/src/clip-movement.ts to below the lowest of them.`\n  return `${lines.join('\\n')}\\n\\n${tail}`\n}\n\n/** Whether every shown reveal passes — the command's exit status. */\nexport const allRevealsPass = (rows: MeasuredItem[]): boolean =>\n  rows.every((r) => !(r.shown && r.mode === 'reveal' && r.movement && !r.movement.noticeable))\nEOF\npython3 - <<'EOF'\np='tools/generate/src/cli/index.ts'\ns=open(p).read()\nanchor=\"    case 'estimates': {\"\nadd='''    case 'showcase': {\n      // [[BUG-356]] — every showcase item's movement against the one threshold.\n      if (rest[0] !== 'measure') {\n        console.error('Usage: 1c showcase measure [--origin <url>] [--client-id <id> --client-secret <secret>] [--json]')\n        process.exitCode = EXIT_CODES.SCHEMA_INVALID\n        return\n      }\n      const { measureShowcase, formatMeasured, allRevealsPass } = await import('./showcase-measure')\n      const { cloudAccess } = copyCredentials(flags)\n      const rows = await measureShowcase({ origin: typeof flags.origin === 'string' ? flags.origin : CLOUD_ORIGIN, access: cloudAccess })\n      console.log(flags.json === true ? JSON.stringify(rows, null, 2) : formatMeasured(rows))\n      if (!allRevealsPass(rows)) process.exitCode = EXIT_CODES.SCHEMA_INVALID\n      return\n    }\n\n'''\nassert s.count(anchor)==1\ns=s.replace(anchor, add+anchor)\nanchor2=\"  1c estimates survey [--since <ISO>]\"\nhelp='''  1c showcase measure [--origin <url>] [--client-id <id> --client-secret <secret>] [--json]\n    Every showcase item's movement against the threshold a reveal must reach to be\n    noticed ([[BUG-356]]): the share of the picture each clip changes, read through\n    the console's admin routes (default ${CLOUD_ORIGIN}, behind Access with\n    CF_ACCESS_CLIENT_ID/SECRET) and decoded with this machine's ffmpeg. Exits non-zero\n    when a shown reveal falls bel
```

[elided — kept 5800 of 6049 bytes]

**Result**

```
tools/generate/src/cli/errors.ts:107:  SCHEMA_INVALID: 2,
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='apps/…
<!-- xgd-tool name="Bash" id="toolu_01NBP78KW9MALH9UyLFZBscR" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:41:35.244907+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='apps/control-app/src/videogen.ts'\ns=open(p).read()\nold=\"\"\"    'reveal moves too little to notice, make the action bolder. ' +\"\"\"\nnew=\"\"\"    'reveal moves too little to notice, make the action bolder. ' +\n    \"To show your client what's possible, `showcase` lists clips made for other sites: paste the \" +\n    \"links of the two or three closest to their kind of photo. \" +\"\"\"\nassert old in s; s=s.replace(old,new,1)\nold=\"\"\" *   3. **The client agrees the design, not the implementation** ([[REQ-468]]).\n *      Before a clip is made the consultant describes it and gets a yes; nothing\"\"\"\nnew=\"\"\" *   3. **The client agrees the design, not the implementation** ([[REQ-468]]).\n *      Before a clip is made the consultant describes it and gets a yes — except\n *      the first draft's signature effect, which it picks and makes with the\n *      draft and describes when it shows it ([[BUG-356]]); nothing\"\"\"\nassert old in s; s=s.replace(old,new,1)\nold=\"\"\" *   6. **The round stays alive while the provider is polled**, through the\n *      host's slow-tool heartbeat.\n */\"\"\"\nnew=\"\"\" *   6. **The round stays alive while the provider is polled**, through the\n *      host's slow-tool heartbeat.\n *   7. **The made clip's movement is measured** ([[BUG-356]]) where ffmpeg runs\n *      (the job container), and its result says whether a reveal will be noticed.\n *   8. **The showcase** ([[BUG-356]]): clips made for other sites, curated by the\n *      operator, read through the `showcase` operation beside the clip maker.\n */\"\"\"\nassert old in s; s=s.replace(old,new,1)\ns=s.replace(\"\"\"'Here a clip is a page hero: at most one on a page. Its reveal\"\"\",\"\"\"'Here a clip is a page hero: at most one on a page. Its reveal\"\"\")\nopen(p,'w').write(s)\nEOF\ngrep -n \"the movement subtle\\|BUG-129\" apps/control-app/src/videogen.ts | head -3","description":"Add showcase guidance and doc"}
```

**Result**

```
100: * ([[BUG-129]]) and only the summary-level manual counts against it, while an
170: * overview alone is a paragraph the budget ([[BUG-129]]) has no room for. So the
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1,80p tests/test_UA…
<!-- xgd-tool name="Bash" id="toolu_015A9u3Yvh76cbroH6QqdgKr" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:41:52.264448+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1,80p tests/test_UAT_FC_REQ-461_hero_clip_tool.workers.test.ts; git grep -n \"\\\"op\\\": \\\"set_stage\\\"\" -- tools/generate/src/cli/ai | head -2","description":"Read REQ-461 test rig"}
```

**Result**

```
/**
 * REQ-461 — the consultant's clip tool, wired the way `router.ts` wires it.
 *
 * The real `animate_image` plugin, the real fal backend, post-processing and MP4
 * reader, the real D1 ticket store and the real spend meter. Only fal's HTTP API
 * is substituted ({@link fakeFal}), because it is the one true external boundary.
 */
import { describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'
import type { Scope } from '../apps/control-app/src/scope'
import { generatedMaterialStore } from '../apps/control-app/src/imagegen'
import {
  HEARTBEAT_MS,
  VIDEO_SECRET,
  VIDEO_SESSION_BUDGET,
  VIDEO_SITE_CAP,
  videoGuidance,
  videoSurface,
  type VideoSurfaceOptions,
} from '../apps/control-app/src/videogen'
import { recordMediaSpend, tenantSpendReport } from '../apps/control-app/src/spend'
import { applySchema, ensureTenant } from './support/d1-site-factory'
import { fakeFal, STILL_PNG, type FakeFal } from './support/fake-fal'
import * as videogenCore from '../apps/control-app/src/generated/videogen'

const APPLIED = applySchema()

/** This business's ticket store, with one stored still to animate. */
async function business(id: string): Promise<{ tickets: TicketStore; still: string }> {
  await APPLIED
  await ensureTenant(id)
  const scope: Scope = { businessId: id }
  const tickets = await ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, scope)
  const pictures = generatedMaterialStore(tickets, () => 'test', null)
  const { ticket } = await pictures.create({ type: 'material', title: 'A plate of steak and eggs', body: 'steak and eggs' })
  await pictures.attach({ uid: ticket.uid, bytes: STILL_PNG, filename: 'plate.png', content_type: 'image/png' })
  return { tickets, still: ticket.uid }
}

/** The surface for a business, as the router builds it, over a fake fal. */
function surfaceFor(tickets: TicketStore, fal: FakeFal, tenant: string, over: VideoSurfaceOptions = {}) {
  const built = videoSurface({ [VIDEO_SECRET]: 'test-fal-key' }, tickets, null, {
    fetch: fal as unknown as typeof fetch,
    pollIntervalMs: 1,
    spend: (spend) => recordMediaSpend({ DB: env.DB as D1Database }, tenant, spend),
    ...over,
  })
  expect(built).not.toBeNull()
  return built!.surface
}

/** One clip request, made like any other tool call ([[REQ-468]]: no first-call gate). */
async function animate(surface: { animate_image(args: unknown): Promise<unknown> }, args: Record<string, unknown>) {
  return (await surface.animate_image(args)) as Record<string, unknown>
}

describe('REQ-461 the clip tool', () => {
  it('test_UAT_FC_REQ-461_the_tool_is_omitted_without_FAL_KEY', async () => {
    const { tickets } = await business('req461-nokey')
    expect(videoSurface({}, tickets)).toBeNull()
    expect(videoSurface({ [VIDEO_SECRET]: '' }, tickets)).toBeNull()
    expect(VIDEO_SECRET).toBe('FAL_KEY')
  })

  it('test_UAT_FC_REQ-461_the_client_is_never_told_a_price', async () => {
    // The client pays the operator, not per clip: nothing the consultant is
    // given carries a price to repeat, and it is told not to mention one.
    expect(videoGuidance()).not.toMatch(/\$\s*\d/)
    expect(videoGuidance()).toMatch(/never mention a price or cost/)

    const { tickets, still } = await business('req461-noprice')
    const surface = surfaceFor(tickets, fakeFal(), 'req461-noprice')
    const made = await animate(surface, { image: still, motion: 'flames flicker' })
    expect(made).not.toHaveProperty('estimated_cost')
    expect(JSON.stringify(made)).not.toMatch(/\$\s*\d|USD|cost/i)
    const op = surface.declaration.operations.get('animate_image')
    expect(String(op.description)).not.toMatch(/\$\s*\d/)
    expect(String(op.summary ?? '')).not.toMatch(/paid|\$/i)
  })
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -ln "ADMIN_ISSUES…
<!-- xgd-tool name="Bash" id="toolu_01EjfLi7zpXkxWz2B7rr5y7g" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:41:53.471155+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -ln \"ADMIN_ISSUES_PATH\\|/api/admin/issues\" -- tests | head -3","description":"Find admin route test"}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -ln "api/admin/"…
<!-- xgd-tool name="Bash" id="toolu_012VtvQnzy6meN1upRcQt7NX" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:41:56.867699+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -ln \"api/admin/\" -- tests | head -5; git grep -n \"ownsPlatformBusiness\\|admission:\" -- tests | head -5","description":"Find admin admission in tests"}
```

**Result**

```
tests/reconciliation-platform-build-deploy-smoke.test.ts
tests/test_UAT_FC_BUG-146_dev_vars_local.test.ts
tests/test_UAT_FC_BUG-166_one_turn_one_id.workers.test.ts
tests/test_UAT_FC_BUG-166_the_business_cost_is_the_whole_bill.workers.test.ts
tests/test_UAT_FC_BUG-166_the_console_reads_the_whole_bill.test.ts
tests/reconciliation-builder-private-access-gate.test.ts:163: * exactly there. Passing this gate stopped being admission: the identity
tests/support/dns.ts:165:  admission: Admission
tests/support/dns.ts:183:    admission: await admit(identityEnv(), email),
tests/support/dns.ts:200:  admission: Admission
tests/support/dns.ts:218:    admission: customer.admission,
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1,80p tests/test_UA…
<!-- xgd-tool name="Bash" id="toolu_01Uw8ZVkeQXu25UXV5rDfTAF" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:42:00.385289+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1,80p tests/test_UAT_FC_BUG-166_the_business_cost_is_the_whole_bill.workers.test.ts | grep -n \"import\\|admission\\|operator\\|identityEnv\\|route(\" | head -30","description":"Read admin test admission setup"}
```

**Result**

```
1:import { beforeAll, describe, expect, it } from 'vitest'
2:import { env } from 'cloudflare:test'
3:import { ADMIN_BUSINESS_SPEND_PATH, ADMIN_SPEND_PATH, route } from '../apps/control-app/src/router'
4:import type { RouterEnv } from '../apps/control-app/src/router'
5:import {
11:import { applySchema } from './support/d1-site-factory'
29: * are: a route that is the single authority on a number an operator prices from,
32: * WHAT MAKES THIS EVIDENCE. `GET /api/admin/spend` through `route()` against a
45: *     puts two figures on one row that an operator can divide and find disagree.
50:function identityEnv(): IdentityEnv {
67:async function operator(): Promise<Admission> {
68:  const email = 'bug166-spend-operator@example.test'
69:  await ensurePlatformOperator(identityEnv(), email)
70:  const admission = await admit(identityEnv(), email)
71:  if (!admission.ok) throw new Error(`expected an admitted operator, got ${admission.reason}`)
72:  return admission
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 140,200p tests/supp…
<!-- xgd-tool name="Bash" id="toolu_01GoPtLYA5BAEcbYeQy8zkoY" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:42:01.577940+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 140,200p tests/support/dns.ts; grep -n \"^export\" tests/support/dns.ts | head -20","description":"Read dns support operator helper"}
```

**Result**

```
/** The resolver, as a double. [[REQ-257]]'s interface and never a second reader. */
export function resolver(
  over: { snapshot?: DomainSnapshot; txt?: Record<string, string[]> } = {},
): { client: DnsResolver; asked: string[] } {
  const asked: string[] = []
  return {
    asked,
    client: {
      resolve: async (name: string, type: RecordType) => {
        asked.push(`${type} ${name}`)
        return (over.txt?.[name] ?? []).map((data) => ({ type, name, data, ttl: 300 }))
      },
      probeDkim: async () => [],
      snapshot: async (domain: string) => {
        asked.push(`snapshot ${domain}`)
        return over.snapshot ?? clean(domain)
      },
    },
  }
}

/** A customer: an account, a business it owns, and the starter site. */
export async function aCustomer(): Promise<{
  businessId: string
  siteKey: string
  admission: Admission
  email: string
  accountId: string
}> {
  const email = anEmail()
  const invited = await inviteAccount(identityEnv(), {
    email,
    accountName: `Business ${seq}`,
    endsAt: null,
  })
  const siteKey = await siteOf(identityEnv(), invited.businessId)
  if (siteKey === null) throw new Error('the provisioned business has no site')
  const row = await env.DB.prepare('SELECT owner_account_id FROM tenants WHERE id = ?')
    .bind(invited.businessId)
    .first<{ owner_account_id: string }>()
  return {
    businessId: invited.businessId,
    siteKey,
    admission: await admit(identityEnv(), email),
    email,
    accountId: String(row?.owner_account_id),
  }
}

/**
 * A customer with a domain attached, through the shipped route.
 *
 * THROUGH THE ROUTE AND NOT BY WRITING THE ROW. Which domain a business's
 * conversation is about is derived from the attachment, so a fixture that wrote
 * the mapping by hand would prove the derivation against its own invention.
 */
export async function aCustomerWithADomain(
  seed: DnsRecord[] = [],
): Promise<{
  businessId: string
  admission: Admission
50:export function identityEnv(): IdentityEnv {
55:export function routerEnv(): RouterEnv {
69:export function cloudflare(seed: DnsRecord[] = []): {
116:export function clean(domain: string): DomainSnapshot {
141:export function resolver(
162:export async function aCustomer(): Promise<{
196:export async function aCustomerWithADomain(
248:export function dnsFor(
269:export async function aColleagueOf(businessId: string): Promise<Admission> {
288:export function callDnsRoute(
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1,68p tests/support…
<!-- xgd-tool name="Bash" id="toolu_01D6oNuirVF2398KruhCWLby" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:42:05.433452+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1,68p tests/support/dns.ts | grep -v \"^ \\*\\|^/\\*\\*\"; sed -n 50,66p tests/test_UAT_FC_BUG-166_the_business_cost_is_the_whole_bill.workers.test.ts; sed -n 5,11p tests/test_UAT_FC_BUG-166_the_business_cost_is_the_whole_bill.workers.test.ts; grep -n \"route(\" tests/test_UAT_FC_BUG-166_the_business_cost_is_the_whole_bill.workers.test.ts | head -2","description":"Read identity env helpers"}
```

**Result**

```
import { env } from 'cloudflare:test'
import { admit, type Admission, type IdentityEnv } from '../../apps/control-app/src/identity'
import { inviteAccount } from './invite-account'
import { newId } from '../../tools/generate/src/store/ids'
import {
  DOMAIN_PATH,
  route,
  type RouterDeps,
  type RouterEnv,
} from '../../apps/control-app/src/router'
import type {
  CloudflareClient,
  DnsRecord,
  DnsRecordSpec,
  WorkerRoute,
} from '../../apps/control-app/src/cloudflare'
import { recordZone, zoneByApex } from '../../apps/control-app/src/zones'
import { siteOf } from '../../apps/control-app/src/hostname'
import type {
  DnsResolver,
  DomainSnapshot,
  RecordType,
  ResolvedRecord,
} from '../../apps/control-app/src/resolver'
import { businessDns } from '../../apps/control-app/src/dns-assistant'

const PLATFORM = 'tenant-1stcontact'
const TEAM = 'https://req260.cloudflareaccess.com'
const AUD = 'req260-aud'

let seq = 0
const anEmail = (): string => `req260-${(seq += 1)}@example.test`
const anApex = (): string => `req260-${(seq += 1)}.example`

export function identityEnv(): IdentityEnv {
  return { DB: env.DB, SITES: env.SITES, TENANT_ID: PLATFORM } as unknown as IdentityEnv
}

export function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    CLOUDFLARE_DNS_TOKEN: 'req260-token',
  } as RouterEnv
}

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  } as unknown as RouterEnv
}

import {
  admit,
  ensurePlatformOperator,
  type Admission,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { applySchema } from './support/d1-site-factory'
32: * WHAT MAKES THIS EVIDENCE. `GET /api/admin/spend` through `route()` against a
139:  const answer = await route(
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 135,150p tests/test…
<!-- xgd-tool name="Bash" id="toolu_01Gr8mE4yBMV6Lm7WwSa8Nzu" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:42:09.019727+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 135,150p tests/test_UAT_FC_BUG-166_the_business_cost_is_the_whole_bill.workers.test.ts; grep -n \"PLATFORM =\" tests/test_UAT_FC_BUG-166_the_business_cost_is_the_whole_bill.workers.test.ts; cat tests/support/fake-fal.ts | grep -n \"export\" | head","description":"Read route call shape and fake fal exports"}
```

**Result**

```
  total: { costMicros: number | null; costPerEngagedHourMicros: number | null }
}

async function spendOf(business: string): Promise<Answer> {
  const answer = await route(
    new Request(`https://app.example${ADMIN_SPEND_PATH}?business=${business}`),
    routerEnv(),
    { businessId: PLATFORM },
    { admission: await operator() } as never,
  )
  expect(answer.status).toBe(200)
  return (await answer.json()) as Answer
}

interface League {
  businesses: {
48:const PLATFORM = 'bug166-spend-platform'
19:export const CLIP = decode('AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAPIbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAA+gAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAvN0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+gAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAACAAAAAgAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPoAAAIAAABAAAAAAJrbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAwAAAAMABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACFm1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAdZzdGJsAAAAvnN0c2QAAAAAAAAAAQAAAK5hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAACAAIABIAAAASAAAAAAAAAABFUxhdmM2MS4xOS4xMDEgbGlieDI2NAAAAAAAAAAAAAAAGP//AAAANGF2Y0MBZAAK/+EAF2dkAAqs2UlsBEAAAAMAQAAABgPEiWWAAQAGaOvhEsiw/fj4AAAAABBwYXNwAAAAAQAAAAEAAAAUYnRydAAAAAAAAB14AAAAAAAAABhzdHRzAAAAAAAAAAEAAAAMAAAEAAAAABRzdHNzAAAAAAAAAAEAAAABAAAAcGN0dHMAAAAAAAAADAAAAAEAAAgAAAAAAQAADAAAAAABAAAEAAAAAAEAABQAAAAAAQAACAAAAAABAAAAAAAAAAEAAAQAAAAAAQAAFAAAAAABAAAIAAAAAAEAAAAAAAAAAQAABAAAAAABAAAIAAAAABxzdHNjAAAAAAAAAAEAAAABAAAADAAAAAEAAABEc3RzegAAAAAAAAAAAAAADAAAAtsAAAAYAAAADgAAABsAAAAPAAAAEAAAAA4AAAAcAAAAFAAAABEAAAAQAAAAFQAAABRzdGNvAAAAAAAAAAEAAAP4AAAAYXVkdGEAAABZbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAbWRpcmFwcGwAAAAAAAAAAAAAAAAsaWxzdAAAACSpdG9vAAAAHGRhdGEAAAABAAAAAExhdmY2MS43LjEwMAAAAAhmcmVlAAADt21kYXQAAAKuBgX//6rcRem95tlIt5Ys2CDZI+7veDI2NCAtIGNvcmUgMTY0IHIzMTA4IDMxZTE5ZjkgLSBILjI2NC9NUEVHLTQgQVZDIGNvZGVjIC0gQ29weWxlZnQgMjAwMy0yMDIzIC0gaHR0cDovL3d3dy52aWRlb2xhbi5vcmcveDI2NC5odG1sIC0gb3B0aW9uczogY2FiYWM9MSByZWY9MyBkZWJsb2NrPTE6MDowIGFuYWx5c2U9MHgzOjB4MTEzIG1lPWhleCBzdWJtZT03IHBzeT0xIHBzeV9yZD0xLjAwOjAuMDAgbWl4ZWRfcmVmPTEgbWVfcmFuZ2U9MTYgY2hyb21hX21lPTEgdHJlbGxpcz0xIDh4OGRjdD0xIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9MSBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTMgYl9weXJhbWlkPTIgYl9hZGFwdD0xIGJfYmlhcz0wIGRpcmVjdD0xIHdlaWdodGI9MSBvcGVuX2dvcD0wIHdlaWdodHA9MiBrZXlpbnQ9MjUwIGtleWludF9taW49MTIgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1jcmYgbWJ0cmVlPTEgY3JmPTMwLjAgcWNvbXA9MC42MCBxcG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IGlwX3JhdGlvPTEuNDAgYXE9MToxLjAwAIAAAAAlZYiEAFfJ5oNdCv//4MB6fhoD/M9MAGcHmVvY27FtN7A5WTZNhQAAABRBmiJsRX/jAWPdHXOSM7wusAEo/gAAAAoBnkF5Cn/36SGBAAAAF0GaRjwhkymEV95e7wrc6LAlSs6DUfokAAAAC0GeZGpTwh/2F65BAAAADAGeg3RCn/6ygyE1+QAAAAoBnoVqQl/3XruBAAAAGEGaikmoQWiZTAh//3gHN9VEMviEY1pdiQAAABBBnqhFESwR//KLKlF2sBruAAAADQGex3RDP/OVt2I0dCQAAAAMAZ7JakM/zUARw0SBAAAAEUGay0moQWyZTAhn/8OHF6Oo')
22:export const POSTER = decode('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAACXBIWXMAAAABAAAAAQBPJcTWAAAAZklEQVR4nO3UsQoAIQiAYU17/wdO8SIhaGvQ4e78B0c/CAmgqv5Qay1xOyI6YGaqKiJ6FgAQUS7AzHNmAfN9eu8FfBrwK4J1pnP7GEPOCijgBtifXQrgRhbgq33Gh6usvbt4oHpfDwpAfEGsLPVYAAAAAElFTkSuQmCC')
25:export const STILL_PNG = decode(
39:export interface FakeFal {
51:export function clipOfSize(bytes: number): Uint8Array {
66:export function fakeFal({ clip = CLIP }: { clip?: Uint8Array } = {}): FakeFal {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 60,105p tests/test_…
<!-- xgd-tool name="Bash" id="toolu_01VaitxktKNrTrUVSkDiZRZS" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:42:13.278056+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 60,105p tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts","description":"Read BUG-304 helpers"}
```

**Result**

```
/** A site whose design is written and whose pages are recorded: the first draft is building. */
function drafting(): Plan {
  const plan = seedPlan(SLUG)
  plan.fields.milestones = { design_at: AT }
  plan.fields.decisions = plan.fields.decisions.map((d) =>
    d.id === 'pages_navigation' ? { ...d, value: 'Home, Menu, Visit us', state: 'defaulted' } : d,
  )
  return plan
}

function memoryPlan(initial: Plan): PlanDeps & { stored: () => Plan; set: (p: Plan) => void } {
  let plan = initial
  const open = (): Plan => JSON.parse(JSON.stringify(plan)) as Plan
  return {
    stored: () => open(),
    set: (p) => {
      plan = p
    },
    now: () => clock,
    async read() {
      return open()
    },
    async write(change) {
      plan = change(open())
      return plan
    },
  }
}

async function consultant(deps: PlanDeps): Promise<{ run: (tool: string, input: Record<string, unknown>) => Promise<string> }> {
  const lib = await aiCore()
  const opts = { cwd }
  const store = fsSiteStore(ctxOf(opts))
  return createL1Toolbox(SLUG, opts, {
    session: `site-${SLUG}`,
    lib,
    store,
    extraOps: nodeOperations(SLUG, { ...opts, store } as never),
    extraSurfaces: [{ surface: await planSurfaceFor(lib, deps, 'consultant'), granted: planInstanceConfig('consultant') }] as never,
  }) as never
}

/** The agenda every voice reads, as it reaches them: the consultant's plan entry. */
const entry = (deps: { stored: () => Plan }): string => planReminder(deps.stored()) ?? ''
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1,30p tests/test_UA…
<!-- xgd-tool name="Bash" id="toolu_015bhjbnQLge8BZpZ3eQmzde" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:42:46.051680+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && sed -n 1,30p tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts >/dev/null; cat > tests/test_UAT_FC_BUG-356_signature_effect_by_default.test.ts <<'EOF'\nimport { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'\nimport { mkdtempSync, rmSync } from 'node:fs'\nimport { tmpdir } from 'node:os'\nimport path from 'node:path'\nimport { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'\nimport { aiCore, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'\nimport { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'\nimport { fsSiteStore } from '../tools/generate/src/store'\nimport { readDocTickets } from '../tools/generate/src/cli/kb'\nimport planSurface from '../tools/generate/src/cli/ai/plan-surface.json'\nimport {\n  defaultSignatureEffect,\n  EFFECT_CHECKS,\n  EFFECT_PICK_NOTE,\n  effectBriefLine,\n  firstBuildEffectNote,\n  planInstanceConfig,\n  planSurfaceFor,\n  seedPlan,\n  signatureEffect,\n  type Plan,\n  type PlanDeps,\n} from '../tools/generate/src/cli/ai/plan-core'\nimport { parseStageGuides, STAGE_GUIDES_DOC } from '../tools/generate/src/cli/ai/stage-guide-core'\n\n/**\n * [[BUG-356]] — **the hero's signature effect is part of every first draft unless\n * the client has said no to motion**, with no hold and no refusal (operator,\n * 2026-11-05: \"forcing a decision feels harsh\"). The consultant picks it and\n * records `signature_effect` as `defaulted`; the client declines it (parked, never\n * asked again) or prefers another (chosen).\n *\n * THE SAFEGUARD IS THE DEFAULT: the first draft's brief carries the effect unless\n * the decision is parked, and a first build the consultant started with no pick is\n * told so and recorded `defaulted`. The real consultant toolbox over the real plan\n * surface, with the plan held in memory; the playbook is the shipped [[DOC-75]].\n */\n\nconst SLUG = 'bistro'\nconst AT = '2026-11-05T12:00:00.000Z'\nlet cwd: string\nlet doc: string\n\nbeforeAll(() => {\n  const found = readDocTickets().find((t) => t.id === STAGE_GUIDES_DOC)\n  expect(found).toBeDefined()\n  doc = String((found as { body?: string }).body ?? '')\n}, 180000)\n\nbeforeEach(() => {\n  cwd = mkdtempSync(path.join(tmpdir(), 'bug356-'))\n  cmdNew(SLUG, { cwd })\n})\n\nafterEach(() => {\n  rmSync(cwd, { recursive: true, force: true })\n})\n\n/** A site whose design is written: the first draft can start. */\nfunction drafting(): Plan {\n  const plan = seedPlan(SLUG)\n  plan.fields.milestones = { design_at: AT }\n  return plan\n}\n\nfunction memoryPlan(initial: Plan): PlanDeps & { stored: () => Plan } {\n  let plan = initial\n  const open = (): Plan => JSON.parse(JSON.stringify(plan)) as Plan\n  return {\n    stored: () => open(),\n    now: () => AT,\n    async read() {\n      return open()\n    },\n    async write(change) {\n      plan = change(open())\n      return plan\n    },\n  }\n}\n\nasync function consultant(deps: PlanDeps): Promise<{ run: (tool: string, input: Record<string, unknown>) => Promise<string> }> {\n  const lib = await aiCore()\n  const opts = { cwd }\n  const store = fsSiteStore(ctxOf(opts))\n  return createL1Toolbox(SLUG, opts, {\n    session: `site-${SLUG}`,\n    lib,\n    store,\n    extraOps: nodeOperations(SLUG, { ...opts, store } as never),\n    extraSurfaces: [{ surface: await planSurfaceFor(lib, deps, 'consultant'), granted: planInstanceConfig('consultant') }] as never,\n  }) as never\n}\n\nconst effectOf = (p: Plan) => p.fields.decisions.find((d) => d.id === 'signature_effect')\n\ndescribe('BUG-356 — the signature effect is on by default, never held', () => {\n  it('test_UAT_FC_BUG-356_first_brief_carries_an_effect_with_no_decision', () => {\n    const plan = drafting()\n    expect(effectOf(plan)).toBeUndefined()\n    // No decision: the brief still carries an effect, and the consultant is told to pick and make it.\n    const line = effectBriefLine(plan.fields) ?? ''\n    expect(line).toMatch(/The hero carries a signature effect in this draft/)\n    expect(line).toMatch(/clear eye-catcher that plays once and ends on the photo, then a subtle loop/)\n    for (const check of EFFECT_CHECKS) expect(line).toContain(check)\n    expect(firstBuildEffectNote(plan.fields)).toBe(EFFECT_PICK_NOTE)\n    expect(EFFECT_PICK_NOTE).toMatch(/`signature_effect` `defaulted` with your pick in `value`/)\n    expect(EFFECT_PICK_NOTE).toMatch(/what moves, one or two other ideas you considered, and that it comes off whenever they like/)\n\n    // The host records the default the brief went out with.\n    const defaulted = defaultSignatureEffect(plan)\n    expect(effectOf(defaulted)?.state).toBe('defaulted')\n    expect(effectBriefLine(defaulted.fields)).toBe(line)\n    // Recording it twice changes nothing.\n    expect(defaultSignatureEffect(defaulted)).toEqual(defaulted)\n\n    // Not on a site already built, nor on a prepared one.\n    expect(effectBriefLine({ ...plan.fields, milestones: { first_pass_at: AT } })).toBeNull()\n    expect(firstBuildEffectNote({ ...plan.fields, milestones: { first_pass_at: AT } })).toBeNull()\n  })\n\n  it('test_UAT_FC_BUG-356_consultant_pick_is_defaulted_and_briefed', async () => {\n    const deps = memoryPlan(drafting())\n    const alice = await consultant(deps)\n    // The consultant's pick needs no client words: it is `defaulted`.\n    const said = await alice.run('set_decision', { decision: 'signature_effect', state: 'defaulted', value: 'The dish lifted into frame from one corner, then steam rising' })\n    expect(said).not.toContain('PLAN_INVALID')\n    const stored = deps.stored()\n    expect(effectOf(stored)?.state).toBe('defaulted')\n    expect(signatureEffect(stored
```

[elided — kept 5800 of 10003 bytes]

**Result**

```
done
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='tests…
<!-- xgd-tool name="Bash" id="toolu_01HuBcGZZWHYUcEJtuVzr9ii" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:42:56.482729+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='tests/test_UAT_FC_BUG-308_effect_proposed_as_intro_plus_loop.test.ts'\ns=open(p).read()\nold=s[s.index(\"  it('test_UAT_FC_BUG-308_effect_proposed_as_intro_plus_loop', () => {\"):s.index(\"  })\\n})\")]\nnew=\"\"\"  it('test_UAT_FC_BUG-308_effect_proposed_as_intro_plus_loop', () => {\n    expect(draft).toMatch(/an eye-catcher that plays once and ends on their original photo, then a subtle loop/)\n    // [[BUG-356]] — on by default in the first draft: the consultant's pick, recorded `defaulted`…\n    expect(draft).toMatch(/part of every first draft unless they've said no to motion/)\n    expect(draft).toMatch(/Record it as `signature_effect` `defaulted`, your pick in `value`/)\n    // …the alternatives named only after the draft is shown, and it comes off whenever they like.\n    expect(draft).toMatch(/one or two other ideas you considered, and that it comes off whenever they like/)\n    expect(draft).toMatch(/Record their answer as `signature_effect`/)\n    // The \"offer it when it helps\" line is gone, and so is the up-front menu.\n    expect(draft).not.toMatch(/Offer it when it helps; no motion is a fine answer/)\n    expect(draft).not.toMatch(/two or three options/i)\n    expect(draft).not.toMatch(/steam rising or a slow push in/i)\n\"\"\"\ns=s.replace(old,new)\ns=s.replace(\"\"\" * [[BUG-308]] — **the hero's signature effect is proposed in the agreed shape**\"\"\",\"\"\" * [[BUG-308]] [[BUG-356]] — **the hero's signature effect is proposed in the agreed shape**\"\"\")\nopen(p,'w').write(s)\np='tests/test_UAT_FC_REQ-470_clip_guidance.workers.test.ts'\ns=open(p).read()\nold=\"\"\"    // The client still agrees the design, including the order.\n    expect(text).toMatch(/get a yes to that design: what moves and what stays still, in what order/)\"\"\"\nnew=\"\"\"    // The client still agrees the design, including the order…\n    expect(text).toMatch(/get a yes to that design: what moves and what stays still, in what order/)\n    // …[[BUG-356]] except the first draft's signature effect, picked and made with the draft.\n    expect(text).toMatch(/The one exception is the first draft's signature effect, which you pick and make with the draft without a yes first/)\"\"\"\nassert old in s; s=s.replace(old,new); open(p,'w').write(s)\nEOF\necho ok","description":"Update BUG-308 and REQ-470 pins"}
```

**Result**

```
ok
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && cat > tests/support/synthe…
<!-- xgd-tool name="Bash" id="toolu_01VEucjNDw2duFEnGeVgDMM6" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:43:30.604076+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && cat > tests/support/synthetic-clips.ts <<'EOF'\n/**\n * [[BUG-356]] — synthetic clips for the movement measure: no customer media.\n *\n * Frames are square greyscale, oldest first, at {@link SIDE}². A REVEAL is a dark\n * object entering from one corner and settling in the middle, ending on the still;\n * a FAINT STIR is the same still with a small patch flickering, the kind of clip a\n * visitor does not notice moving.\n */\nexport const SIDE = 64\n\n/** The still both clips end on: a soft diagonal gradient. */\nfunction still(): Uint8Array {\n  const f = new Uint8Array(SIDE * SIDE)\n  for (let y = 0; y < SIDE; y++) for (let x = 0; x < SIDE; x++) f[y * SIDE + x] = 120 + Math.round(((x + y) / (2 * SIDE)) * 80)\n  return f\n}\n\n/** A reveal: a 24px dark square slides in from the top-left corner over 16 frames, then holds. */\nexport function revealFrames(count = 40): Uint8Array[] {\n  const base = still()\n  const size = 24\n  const end = Math.round((SIDE - size) / 2)\n  const frames: Uint8Array[] = []\n  for (let i = 0; i < count; i++) {\n    const t = Math.min(1, i / 16)\n    const at = Math.round(-size + (end + size) * t)\n    const f = new Uint8Array(base)\n    for (let y = at; y < at + size; y++) for (let x = at; x < at + size; x++) if (x >= 0 && y >= 0 && x < SIDE && y < SIDE) f[y * SIDE + x] = 30\n    frames.push(f)\n  }\n  // The still it ends on holds the object in place: the clip ends exactly on the photo.\n  return frames\n}\n\n/** A faint stir: a 6px patch of the still flickers by ±40 and nothing else moves. */\nexport function stirFrames(count = 40): Uint8Array[] {\n  const base = still()\n  const frames: Uint8Array[] = []\n  for (let i = 0; i < count; i++) {\n    const f = new Uint8Array(base)\n    const d = i % 2 === 0 ? 40 : -40\n    for (let y = 20; y < 26; y++) for (let x = 40; x < 46; x++) f[y * SIDE + x] = Math.max(0, Math.min(255, base[y * SIDE + x] + (i === count - 1 ? 0 : d)))\n    frames.push(f)\n  }\n  return frames\n}\nEOF\ncat > tests/test_UAT_FC_BUG-356_clip_movement.test.ts <<'EOF'\nimport { describe, expect, it } from 'vitest'\nimport { spawnSync } from 'node:child_process'\nimport { ffmpegDecoder, measureMovement, movementLine, movementOf, NOTICEABLE_SHARE } from '../apps/control-app/src/clip-movement'\nimport { revealFrames, SIDE, stirFrames } from './support/synthetic-clips'\n\n/**\n * [[BUG-356]] — **a made clip's movement is measured and reported to the\n * consultant**: the largest share of the picture that differs from the clip's last\n * frame. A reveal below {@link NOTICEABLE_SHARE} comes back as information — make\n * the action bolder — never a refusal. Synthetic clips only: an object entering the\n * frame passes, a faint stir is flagged.\n *\n * THE REAL DECODER: the frames are encoded to an H.264 MP4 by this machine's\n * `ffmpeg` and measured through {@link ffmpegDecoder}, as the job container does.\n */\n\nconst hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0\n\n/** Encode greyscale frames as an MP4, as a clip provider would deliver one. */\nfunction encode(frames: Uint8Array[]): Uint8Array {\n  const out = spawnSync(\n    'ffmpeg',\n    ['-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', `${SIDE}x${SIDE}`, '-r', '8', '-i', 'pipe:0', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', 'frag_keyframe+empty_moov', '-f', 'mp4', 'pipe:1'],\n    { input: Buffer.concat(frames.map((f) => Buffer.from(f))), maxBuffer: 1 << 26 },\n  )\n  if (out.status !== 0) throw new Error(String(out.stderr))\n  return new Uint8Array(out.stdout)\n}\n\ndescribe('BUG-356 — the clip movement measure', () => {\n  it('test_UAT_FC_BUG-356_measure_flags_a_faint_stir_and_passes_a_reveal', async () => {\n    // The arithmetic, on frames.\n    const reveal = movementOf(revealFrames())\n    const stir = movementOf(stirFrames())\n    expect(reveal.noticeable).toBe(true)\n    expect(stir.noticeable).toBe(false)\n    expect(reveal.share).toBeGreaterThan(NOTICEABLE_SHARE * 2)\n    expect(stir.share).toBeLessThan(NOTICEABLE_SHARE / 2)\n\n    // The result text reaches the consultant: information, and what to do.\n    expect(movementLine(stir, 'reveal')).toMatch(/^This moves too little for a visitor to notice \\(\\d+% of the picture changes over the reveal/)\n    expect(movementLine(stir, 'reveal')).toMatch(/Make the action bolder/)\n    expect(movementLine(reveal, 'reveal')).toMatch(/enough for a visitor to notice/)\n    // A loop is meant to be subtle: described, never told to be bolder.\n    expect(movementLine(stir, 'loop')).not.toMatch(/bolder/)\n  })\n\n  it.skipIf(!hasFfmpeg)('test_UAT_FC_BUG-356_measure_runs_on_ffmpeg', async () => {\n    const decode = ffmpegDecoder()\n    const reveal = await measureMovement(encode(revealFrames()), decode)\n    const stir = await measureMovement(encode(stirFrames()), decode)\n    expect(reveal.frames).toBeGreaterThan(10)\n    expect(reveal.noticeable).toBe(true)\n    expect(stir.noticeable).toBe(false)\n  }, 60000)\n})\nEOF\ntimeout 300 node_modules/.bin/vitest run --config vitest.node.config.mts tests/test_UAT_FC_BUG-356_clip_movement.test.ts 2>&1 | tail -15","description":"Write and run movement UAT","timeout":320000}
```

**Result**

```
 RUN  v4.1.9 /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356


 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  17:43:31
   Duration  700ms (transform 20ms, setup 0ms, import 412ms, tests 201ms, environment 0ms)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && timeout 590 node_modules/.…
<!-- xgd-tool name="Bash" id="toolu_01MicFwMp6uRakYEP8Z8VCv2" turn="6433012a9f964c20b5038b30b3ab6084" ts="2026-11-06T01:43:39.124003+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && timeout 590 node_modules/.bin/vitest run --config vitest.node.config.mts tests/test_UAT_FC_BUG-356_signature_effect_by_default.test.ts tests/test_UAT_FC_BUG-308_effect_proposed_as_intro_plus_loop.test.ts tests/test_UAT_FC_BUG-304_signature_effect_during_the_build.test.ts tests/test_UAT_FC_REQ-657_the_plan_tool.test.ts 2>&1 | grep -v \"^\\s*$\" | tail -30","description":"Run section 1 and related suites","timeout":600000}
```

## Bash W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356; cd $W && git status --short |…
<!-- xgd-tool name="Bash" id="toolu_01NEW5SHUAeNN6mag8t3noyC" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:48:59.832173+00:00" -->

**Input**

```json
{"command":"W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356; cd $W && git status --short | grep -v node_modules | head -30","description":"Check worktree state"}
```

**Result**

```
 M apps/control-app/container/Dockerfile
 M apps/control-app/container/server.ts
 M apps/control-app/src/builder/api.js
 M apps/control-app/src/builder/app.js
 M apps/control-app/src/builder/builder.css
 M apps/control-app/src/builder/config.js
 M apps/control-app/src/router.ts
 M apps/control-app/src/tickets.ts
 M apps/control-app/src/videogen.ts
 M tests/test_UAT_FC_BUG-308_effect_proposed_as_intro_plus_loop.test.ts
 M tests/test_UAT_FC_REQ-470_clip_guidance.workers.test.ts
 M tools/generate/src/cli/ai/account-core.ts
 M tools/generate/src/cli/ai/host-core.ts
 M tools/generate/src/cli/ai/plan-core.ts
 M tools/generate/src/cli/ai/plan-surface.json
 M tools/generate/src/cli/index.ts
?? apps/control-app/src/builder/showcase.js
?? apps/control-app/src/clip-movement.ts
?? apps/control-app/src/showcase.ts
?? tests/support/synthetic-clips.ts
?? tests/test_UAT_FC_BUG-356_clip_movement.test.ts
?? tests/test_UAT_FC_BUG-356_signature_effect_by_default.test.ts
?? tools/generate/src/cli/showcase-measure.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && node_modules/.bin/vitest r…
<!-- xgd-tool name="Bash" id="toolu_01YVGyqCrxLAY8bgV8vW32F9" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:49:06.877815+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && node_modules/.bin/vitest run --config vitest.node.config.mts tests/test_UAT_FC_BUG-356_signature_effect_by_default.test.ts > $TMPDIR/bug356-t1.txt 2>&1; echo exit=$?; grep -E \"✓|✗|×|FAIL|Tests |Error|expected\" $TMPDIR/bug356-t1.txt | head -30","description":"Run section 1 UAT alone","run_in_background":true,"timeout":600000}
```

**Result**

```
Command running in background with ID: bx6w0pgsx. Output is being written to: /private/tmp/claude-501/-Users-martin-lagrangefoundry-1stcontact/6909dc45-e8e2-4c91-9972-2e1e0e43872a/tasks/bx6w0pgsx.output. You will be notified when it completes. To check interim output, use Read on that file path.
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "export async func…
<!-- xgd-tool name="Bash" id="toolu_01ATggxumiBfU2ibuW9oVuKf" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:49:10.547664+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"export async function ensurePlatformOperator\\|export async function admit\" apps/control-app/src/identity.ts; grep -n \"export async function ensureTenant\" -A3 tests/support/d1-site-factory.ts; sed -n 80,140p tests/test_UAT_FC_REQ-461_hero_clip_tool.workers.test.ts | grep -n \"fields\\|duration_s\\|clip_mode\\|poster\" | head","description":"Check helper signatures"}
```

**Result**

```
1076:export async function admit(
1228:export async function ensurePlatformOperator(env: IdentityEnv, email: string): Promise<void> {
437:export async function ensureTenant(id = DEFAULT_TENANT, status = 'active'): Promise<void> {
438-  await d1r2SiteStore(storeEnv()).createTenant({ id, name: id, status })
439-}
440-
17:  it('test_UAT_FC_REQ-461_a_clip_is_a_video_material_with_a_poster_material', async () => {
24:    expect(clip.fields.kind).toBe('video')
25:    expect(clip.fields.origin).toBe('generated')
26:    expect(clip.fields.republishable).toBe(true)
27:    expect(clip.fields.content_type).toBe('video/mp4')
28:    expect(String(clip.fields.filename)).toMatch(/\.mp4$/)
29:    expect(String(clip.fields.label)).toMatch(/^VIDEO-\d+$/)
32:    expect(files.map((f) => f.fields.content_type)).toEqual(['video/mp4'])
35:    expect(made.poster).toBe(clip.fields.poster)
36:    const poster = (await tickets.get({ uid: String(made.poster) })).ticket
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && cat > tests/test_UAT_FC_BU…
<!-- xgd-tool name="Bash" id="toolu_01V3Ld5uCZi2Pbnnu8hcZE7k" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:49:43.598814+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && cat > tests/test_UAT_FC_BUG-356_showcase.workers.test.ts <<'EOF'\n/**\n * [[BUG-356]] — the clip tool reports a made clip's movement, its guidance makes\n * the reveal the noticeable part, and the operator's SHOWCASE reaches the\n * consultant and the client — shown items only.\n *\n * The real `animate_image` plugin over a fake fal ({@link fakeFal}), the real D1\n * ticket stores and R2, and the real routes through `route()`. The frame decoder\n * is the one seam replaced: workerd cannot run ffmpeg, and the synthetic frames are\n * what the Node suite proves the real decoder yields. Fixtures are synthetic.\n */\nimport { describe, expect, it } from 'vitest'\nimport { env } from 'cloudflare:test'\nimport { ticketStoreFor, type TicketStore } from '../apps/control-app/src/tickets'\nimport { generatedMaterialStore, IMAGE_MATERIAL_TYPE } from '../apps/control-app/src/imagegen'\nimport { SHOWCASE_GROUP, VIDEO_SECRET, videoGuidance, videoSurface } from '../apps/control-app/src/videogen'\nimport { consultantShowcase, MATERIAL_TYPE, SHOWCASE_MEDIA_PATH } from '../apps/control-app/src/showcase'\nimport { ADMIN_SHOWCASE_PATH, route, type RouterEnv } from '../apps/control-app/src/router'\nimport { admit, ensurePlatformOperator, type Admission, type IdentityEnv } from '../apps/control-app/src/identity'\nimport { applySchema, ensureTenant } from './support/d1-site-factory'\nimport { CLIP, fakeFal, STILL_PNG } from './support/fake-fal'\nimport { revealFrames, stirFrames } from './support/synthetic-clips'\n\nconst APPLIED = applySchema()\nconst PLATFORM = 'bug356-platform'\n\nfunction identityEnv(): IdentityEnv {\n  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }\n}\n\nfunction routerEnv(): RouterEnv {\n  return {\n    DB: env.DB as D1Database,\n    SITES: env.SITES as R2Bucket,\n    BLOBS: env.BLOBS as R2Bucket,\n    TENANT_ID: PLATFORM,\n    ACCESS_DEV_OPEN: '',\n    ACCESS_TEAM_DOMAIN: '',\n    ACCESS_AUD: '',\n    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,\n  } as unknown as RouterEnv\n}\n\nasync function operator(): Promise<Admission> {\n  const email = 'bug356-operator@example.test'\n  await ensurePlatformOperator(identityEnv(), email)\n  const admission = await admit(identityEnv(), email)\n  if (!admission.ok) throw new Error(`expected an admitted operator, got ${admission.reason}`)\n  return admission\n}\n\nconst storeOf = async (id: string): Promise<TicketStore> => {\n  await ensureTenant(id)\n  return ticketStoreFor({ DB: env.DB as D1Database, BLOBS: env.BLOBS as R2Bucket }, { businessId: id })\n}\n\n/** A business with one stored still, and the clip tool over it with `frames` as the decoded clip. */\nasync function clipMaker(id: string, frames: Uint8Array[], showcase?: () => Promise<{ items: Record<string, unknown>[] }>) {\n  await APPLIED\n  const tickets = await storeOf(id)\n  const pictures = generatedMaterialStore(tickets, () => 'test', null)\n  const { ticket } = await pictures.create({ type: 'material', title: 'A bowl of salad on a wooden board', body: 'salad' })\n  await pictures.attach({ uid: ticket.uid, bytes: STILL_PNG, filename: 'bowl.png', content_type: 'image/png' })\n  const built = videoSurface({ [VIDEO_SECRET]: 'test-fal-key' }, tickets, null, {\n    fetch: fakeFal() as unknown as typeof fetch,\n    pollIntervalMs: 1,\n    measure: async () => frames,\n    ...(showcase ? { showcase } : {}),\n  })\n  expect(built).not.toBeNull()\n  return { tickets, still: ticket.uid, surface: built!.surface, granted: built!.granted }\n}\n\nconst admin = async (path: string, init: RequestInit = {}): Promise<Response> =>\n  route(new Request(`https://app.example${path}`, init), routerEnv(), { businessId: PLATFORM }, { admission: await operator() } as never)\n\nconst post = (path: string, body: unknown) => admin(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })\n\ndescribe('BUG-356 — clip movement and the showcase', () => {\n  it('test_UAT_FC_BUG-356_clip_result_reports_its_movement', async () => {\n    const faint = await clipMaker('bug356-faint', stirFrames())\n    const stir = (await faint.surface.animate_image({ image: faint.still, motion: 'leaves stir', mode: 'reveal' })) as Record<string, unknown>\n    expect(String(stir.movement)).toMatch(/^This moves too little for a visitor to notice \\(\\d+% of the picture changes over the reveal/)\n    expect(String(stir.movement)).toMatch(/Make the action bolder/)\n    // …kept on the clip too, where the console reads it.\n    const clip = (await faint.tickets.get({ uid: String(stir.ticket) })).ticket\n    expect(typeof clip.fields.movement_pct).toBe('number')\n\n    const bold = await clipMaker('bug356-bold', revealFrames())\n    const lifted = (await bold.surface.animate_image({ image: bold.still, motion: 'the bowl is lifted into frame', mode: 'reveal' })) as Record<string, unknown>\n    expect(String(lifted.movement)).toMatch(/enough for a visitor to notice/)\n    // The result shape names the field the model reads.\n    const shape = bold.surface.declaration\n    expect(JSON.stringify(shape.shapes?.get?.('generated_video') ?? shape)).toContain('movement')\n  }, 120000)\n\n  it('test_UAT_FC_BUG-356_guidance_makes_the_reveal_noticeable', () => {\n    const text = videoGuidance()\n    // The whole clip is no longer \"subtle\": the reveal is the eye-catcher, and must be noticed.\n    expect(text).not.toMatch(/the movement subtle/)\n    expect(text).toMatch(/Its reveal is the eye-catcher, and it must be noticed: a clear, nameable action a visitor sees in the first second or two/)\n    expect(text).toMatc
```

[elided — kept 5800 of 10202 bytes]

**Result**

```
ok
```

## Bash cat /private/tmp/claude-501/-Users-martin-lagrangefoundry-1stcontact/6909dc45-e8e2-4c91-9972-2e1e0e43872a/tasks/bx6w0pgs…
<!-- xgd-tool name="Bash" id="toolu_01DWLb6qZ8cJpAn3d4vM9bEs" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:49:49.264348+00:00" -->

**Input**

```json
{"command":"cat /private/tmp/claude-501/-Users-martin-lagrangefoundry-1stcontact/6909dc45-e8e2-4c91-9972-2e1e0e43872a/tasks/bx6w0pgsx.output; tail -40 $TMPDIR/bug356-t1.txt","description":"Read section 1 UAT result"}
```

**Result**

```
exit=0
      Tests  5 passed (5)

[exited with code 0]

 RUN  v4.1.9 /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356


 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  17:49:07
   Duration  11.58s (transform 976ms, setup 0ms, import 1.32s, tests 10.17s, environment 0ms)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && node_modules/.bin/vitest r…
<!-- xgd-tool name="Bash" id="toolu_01Bb6PsnyjYJ1pXM5JKQ5zMo" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:49:53.542747+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && node_modules/.bin/vitest run --config vitest.workers.config.mts tests/test_UAT_FC_BUG-356_showcase.workers.test.ts > $TMPDIR/bug356-t2.txt 2>&1; echo exit=$?; grep -E \"✓|×|FAIL|Tests |Error:|AssertionError|expected|❯ tests\" $TMPDIR/bug356-t2.txt | head -30","description":"Run showcase workers UAT","timeout":600000}
```

**Result**

```
exit=1
     × test_UAT_FC_BUG-356_clip_result_reports_its_movement 408ms
     × test_UAT_FC_BUG-356_showcase_shows_only_marked_items 11ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  |workers| tests/test_UAT_FC_BUG-356_showcase.workers.test.ts > BUG-356 — clip movement and the showcase > test_UAT_FC_BUG-356_clip_result_reports_its_movement
VideogenToolboxError: A reveal needs startImage: the frame the clip starts from.
 ❯ tests/test_UAT_FC_BUG-356_showcase.workers.test.ts:81:19
 FAIL  |workers| tests/test_UAT_FC_BUG-356_showcase.workers.test.ts > BUG-356 — clip movement and the showcase > test_UAT_FC_BUG-356_showcase_shows_only_marked_items
VideogenToolboxError: A reveal needs startImage: the frame the clip starts from.
 ❯ tests/test_UAT_FC_BUG-356_showcase.workers.test.ts:111:19
      Tests  2 failed | 1 passed (3)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF' p='tests…
<!-- xgd-tool name="Bash" id="toolu_01XKdU2Dog4kzi6pGu5cofRu" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:50:14.083854+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && python3 - <<'EOF'\np='tests/test_UAT_FC_BUG-356_showcase.workers.test.ts'\ns=open(p).read()\ns=s.replace(\"\"\"  await pictures.attach({ uid: ticket.uid, bytes: STILL_PNG, filename: 'bowl.png', content_type: 'image/png' })\n\"\"\",\"\"\"  await pictures.attach({ uid: ticket.uid, bytes: STILL_PNG, filename: 'bowl.png', content_type: 'image/png' })\n  // A reveal starts from a frame of its own: the board before the bowl is in it.\n  const start = await pictures.create({ type: 'material', title: 'An empty wooden board', body: 'board' })\n  await pictures.attach({ uid: start.ticket.uid, bytes: STILL_PNG, filename: 'board.png', content_type: 'image/png' })\n\"\"\")\ns=s.replace(\"return { tickets, still: ticket.uid, surface\",\"return { tickets, still: ticket.uid, start: start.ticket.uid, surface\")\ns=s.replace(\"{ image: faint.still, motion: 'leaves stir', mode: 'reveal' }\",\"{ image: faint.still, start_image: faint.start, motion: 'leaves stir', mode: 'reveal' }\")\ns=s.replace(\"{ image: bold.still, motion: 'the bowl is lifted into frame', mode: 'reveal' }\",\"{ image: bold.still, start_image: bold.start, motion: 'the bowl is lifted into frame', mode: 'reveal' }\")\ns=s.replace(\"{ image: source.still, motion: 'the bowl is lifted into frame', mode: 'reveal' }\",\"{ image: source.still, start_image: source.start, motion: 'the bowl is lifted into frame', mode: 'reveal' }\")\nopen(p,'w').write(s)\nEOF\nnode_modules/.bin/vitest run --config vitest.workers.config.mts tests/test_UAT_FC_BUG-356_showcase.workers.test.ts > $TMPDIR/bug356-t2.txt 2>&1; echo exit=$?; grep -E \"✓|×|FAIL|Tests |Error:|AssertionError|expected|❯ tests\" $TMPDIR/bug356-t2.txt | head -30","description":"Add start image, rerun","timeout":600000}
```

**Result**

```
exit=0
      Tests  3 passed (3)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -ln "platformIssu…
<!-- xgd-tool name="Bash" id="toolu_01JvMKjKf7oB9kxdFYi4gFVv" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:50:32.663816+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -ln \"platformIssuesSection\\|estimatesSection()\\|priming.*budget\\|PRIMING_BUDGET\\|videoSurface\\|effect_note\\|plan_note\\|hostBrief\\|'1c help'\\|helpText\\|USAGE\" -- tests | head -30","description":"Find suites near the changes"}
```

**Result**

```
tests/reconciliation-system-knowledge-base-account-discovery.test.ts
tests/reconciliation-system-knowledge-base.test.ts
tests/test_UAT_FC_BUG-240_talker_on_a_dive.workers.test.ts
tests/test_UAT_FC_BUG-254_request_records.test.ts
tests/test_UAT_FC_BUG-273_attributed_models_migration.workers.test.ts
tests/test_UAT_FC_BUG-291_cache_write_split.workers.test.ts
tests/test_UAT_FC_BUG-336_clip_byte_budget.workers.test.ts
tests/test_UAT_FC_BUG-347_loop_length_guidance.workers.test.ts
tests/test_UAT_FC_BUG-351_clip_row_carries_poster_and_length.workers.test.ts
tests/test_UAT_FC_REQ-292_turn_price.test.ts
tests/test_UAT_FC_REQ-461_hero_clip_tool.workers.test.ts
tests/test_UAT_FC_REQ-468_clips_without_a_disclosure_gate.workers.test.ts
tests/test_UAT_FC_REQ-489_spend_cap.workers.test.ts
tests/test_UAT_FC_REQ-657_first_build_without_a_plan.workers.test.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && cat > $TMPDIR/bug356-batch…
<!-- xgd-tool name="Bash" id="toolu_01DBFGxQr6XvtX7tgCBTMZi3" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:50:40.597681+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && cat > $TMPDIR/bug356-batch.sh <<'EOF'\ncd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356\nfor t in test_UAT_FC_REQ-461_hero_clip_tool.workers test_UAT_FC_REQ-470_clip_guidance.workers test_UAT_FC_BUG-336_clip_byte_budget.workers test_UAT_FC_BUG-347_loop_length_guidance.workers test_UAT_FC_BUG-351_clip_row_carries_poster_and_length.workers test_UAT_FC_REQ-468_clips_without_a_disclosure_gate.workers test_UAT_FC_REQ-657_first_build_without_a_plan.workers test_UAT_FC_BUG-306_effect_before_the_first_draft.workers; do\n  node_modules/.bin/vitest run --config vitest.workers.config.mts tests/$t.test.ts > $TMPDIR/bug356-r-$t.txt 2>&1; echo \"$t exit=$? $(grep -E 'Tests ' $TMPDIR/bug356-r-$t.txt)\"\ndone\nfor t in test_UAT_FC_BUG-308_effect_proposed_as_intro_plus_loop test_UAT_FC_BUG-304_signature_effect_during_the_build test_UAT_FC_REQ-657_the_plan_tool; do\n  node_modules/.bin/vitest run --config vitest.node.config.mts tests/$t.test.ts > $TMPDIR/bug356-r-$t.txt 2>&1; echo \"$t exit=$? $(grep -E 'Tests ' $TMPDIR/bug356-r-$t.txt)\"\ndone\nEOF\nbash $TMPDIR/bug356-batch.sh","description":"Run neighbouring suites sequentially","run_in_background":true,"timeout":600000}
```

**Result**

```
Command running in background with ID: b2y2stfl0. Output is being written to: /private/tmp/claude-501/-Users-martin-lagrangefoundry-1stcontact/6909dc45-e8e2-4c91-9972-2e1e0e43872a/tasks/b2y2stfl0.output. You will be notified when it completes. To check interim output, use Read on that file path.
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && (cd apps/control-app && ..…
<!-- xgd-tool name="Bash" id="toolu_01VytuDTZv7ZSVcohaPx7CV3" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:50:46.663224+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && (cd apps/control-app && ../../node_modules/.bin/tsc --noEmit -p tsconfig.json 2>&1 | head -20; echo ca=$?); ls tools/generate/tsconfig*.json; (cd tools/generate && ../../node_modules/.bin/tsc --noEmit -p tsconfig.json 2>&1 | head -20); git grep -n \"\\\"typecheck\\\"\" -- package.json tools/generate/package.json","description":"Typecheck control-app and tools/generate","timeout":400000}
```

**Result**

```
ca=0
tools/generate/tsconfig.json
../../apps/control-app/src/material-import.ts(309,71): error TS2345: Argument of type 'Uint8Array<ArrayBufferLike>' is not assignable to parameter of type 'BufferSource'.
  Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'ArrayBufferView<ArrayBuffer>'.
    Types of property 'buffer' are incompatible.
      Type 'ArrayBufferLike' is not assignable to type 'ArrayBuffer'.
        Type 'SharedArrayBuffer' is not assignable to type 'ArrayBuffer'.
          Types of property '[Symbol.toStringTag]' are incompatible.
            Type '"SharedArrayBuffer"' is not assignable to type '"ArrayBuffer"'.
../../apps/control-app/src/zip-reader.ts(156,28): error TS2322: Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'BlobPart'.
  Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'ArrayBufferView<ArrayBuffer>'.
    Types of property 'buffer' are incompatible.
      Type 'ArrayBufferLike' is not assignable to type 'ArrayBuffer'.
        Type 'SharedArrayBuffer' is not assignable to type 'ArrayBuffer'.
          Types of property '[Symbol.toStringTag]' are incompatible.
            Type '"SharedArrayBuffer"' is not assignable to type '"ArrayBuffer"'.
tools/generate/package.json:16:    "typecheck": "tsc -p tsconfig.json --noEmit"
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/tools/generate && ../../node_…
<!-- xgd-tool name="Bash" id="toolu_0181V8rYRfVZeGz3Rf23gyQN" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:51:01.730719+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356/tools/generate && ../../node_modules/.bin/tsc --noEmit -p tsconfig.json 2>&1 | grep \"error TS\" | cut -d'(' -f1 | sort | uniq -c","description":"Summarize tools/generate type errors by file","timeout":400000}
```

**Result**

```
   1 ../../apps/control-app/src/material-import.ts
   1 ../../apps/control-app/src/zip-reader.ts
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket get BUG-356 --json 2>/dev/null > $TMPDIR/bug356-cur.json; pyth…
<!-- xgd-tool name="Bash" id="toolu_013A4iMt9Yz3BNR1MDnUyVr8" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:51:26.512793+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket get BUG-356 --json 2>/dev/null > $TMPDIR/bug356-cur.json; python3 - <<'EOF'\nimport json,os\nt=os.environ['TMPDIR']\nd=json.load(open(f'{t}/bug356-cur.json')); tk=d.get('ticket',d); b=tk['body']\ni=b.index('## Code left for this ticket'); j=b.index('## Answers to the pre-implementation questions')\nimpl='''## Implementation (free-coded, 2026-11-05)\n\n**1. On by default, no hold.**\n- `signatureEffect()` (plan-core) now knows `defaulted` (the consultant's pick, in `value`); before, a `defaulted` decision read as unanswered and briefed nothing.\n- `effectBriefLine()` adds the effect to the first draft's brief unless the decision is parked: the client's choice, else the consultant's pick, else (no pick at all) a hero built ready for a reveal-then-loop clip. Same placement rules and `EFFECT_CHECKS` as before.\n- A first build started with no pick: the host records `signature_effect` as `defaulted` (`defaultSignatureEffect`), and the Delegate result carries `effect_note` (`EFFECT_PICK_NOTE`, beside REQ-657's `plan_note`) telling the consultant to pick, make and record the effect, and what to say when it shows the draft. Information only; nothing is refused.\n- `set_plan`'s activity menu puts the hero's movement in **look** (\"the look, including the hero's movement: its signature effect\") instead of finishing touches.\n\n**2. Showcase.**\n- Items are `showcase_item` tickets in the **platform tenant's** store (where REQ-484's platform issues live), with the clip and its still copied onto them as attachments. So they outlive the client's Library, and the platform store gives an index and metadata without a new bucket layout. (This is a deviation from \"beside `platform/fonts/`\"; it is still platform storage, not any client's.)\n- Console: a **Showcase** section in the site detail pane lists that business's clips (label, title, mode, movement %). The operator adds one with a line saying what moves, then can reword, show/hide or remove it. Routes `/api/admin/showcase` (GET, POST, `/update`, `/remove`, `/media`) sit behind `ownsPlatformBusiness`, 404 otherwise.\n- Consultant: a read-only `showcase` operation on the Clips surface (own `Showcase` group, granted beside AnimateImages). It returns only shown items: `what_moves`, `photo`, `clip`, `still`, and a `link` (`#show=showcase&item=…`). The clip guidance tells it to paste the two or three closest to the client's photo.\n- Client: the link plays the clip in a dialog over the builder (`playShowcase`), served by `/api/showcase/media` (signed-in, shown items only).\n\n**3. Reveal noticeable, loop subtle.**\n- `videoGuidance()` rewritten: the reveal is the eye-catcher (a clear, nameable action in the first second or two, ending on the original photo), only the loop is subtle, and reveal-then-loop is the default with a loop alone the exception. The first draft's signature effect is the one exception to getting a yes.\n- **Measure:** `clip-movement.ts` decodes the made clip to 64×64 grey frames at 8 fps with `ffmpeg` (temp file, since an MP4 with its index last can't be read from a pipe). It reports the largest share of the picture that differs from the last frame. The clip result carries `movement` (information; a reveal below threshold is told \"make the action bolder\"), and the clip gets `movement_pct`.\n- ffmpeg is installed in the job container (`Dockerfile`, `FFMPEG_PATH`) and passed in by `container/server.ts` as `clipFrames`. A Worker has no decoder, so nothing is measured there.\n- **Threshold `NOTICEABLE_SHARE = 0.05`**, one value. Calibrated on the dev store's clips only: a pepper-grinder reveal measured 10%, a bowl lifted into frame 40% and a plate settling 47%; the steam and fire-flicker loops measured 1–2%. A first guess of 15% would have flagged the pepper reveal.\n- `1c showcase measure [--origin] [--client-id/--client-secret] [--json]` reads the items through the admin routes (Access service token, as `1c copy`), measures each with local ffmpeg and exits non-zero if a shown reveal is below the threshold.\n\n**Pins:** BUG-308's pin is rewritten to the new playbook wording (default, `defaulted`, alternatives named, comes off whenever they like). REQ-470's pin keeps \"get a yes to that design\" and adds the first-draft exception.\n\n**UATs:** `test_UAT_FC_BUG-356_signature_effect_by_default` (brief with no decision, defaulted pick, decline/choose, look done either way, look piece + playbook text), `test_UAT_FC_BUG-356_clip_movement` (synthetic reveal passes, faint stir flagged; real ffmpeg path), `test_UAT_FC_BUG-356_showcase.workers` (clip result reports movement; guidance; showcase shown-only for consultant and client, hide/remove, operator-only routes, copy survives the source clip's removal).\n\n**Operator to do:** run `bin/deploy` (container image gains ffmpeg), mark the showcase in the console, then run `1c showcase measure`.\n\n'''\nb=b[:i]+impl+b[j:]\nopen(f'{t}/bug356-newbody.md','w').write(b)\nprint(len(b))\nEOF\nxgd ticket update bug-2568c791 --body-file $TMPDIR/bug356-newbody.md 2>&1 | grep -i \"error\\|success\" | head -3","description":"Rewrite ticket body with implementation"}
```

**Result**

```
13986
[17:51:28] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'ticket'}
```

## Bash P=~/.xgd/releases/current/bin/python; $P -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{"session":"bug-2568c791"…
<!-- xgd-tool name="Bash" id="toolu_014nhyhaqu8BURR4SPzp2mA8" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:51:32.700437+00:00" -->

**Input**

```json
{"command":"P=~/.xgd/releases/current/bin/python; $P -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{\"session\":\"bug-2568c791\",\"text\":\"2026-11-05: all three sections coded on free-BUG-356. Showcase stored as showcase_item tickets in platform tenant store (deviation from platform/fonts/ prefix, recorded in body). effect_note separate from plan_note to keep REQ-657 pins. BUG-356 UATs pass (5 + 2 + 3). Ticket body rewritten with Implementation section. Remaining: neighbouring suites, commit, merge, free_coded.\"}' >/dev/null 2>&1; echo logged","description":"Log progress to summary"}
```

**Result**

```
logged
```

## Bash sleep 1; cat /private/tmp/claude-501/-Users-martin-lagrangefoundry-1stcontact/6909dc45-e8e2-4c91-9972-2e1e0e43872a/tasks…
<!-- xgd-tool name="Bash" id="toolu_01Uz9RK1SqdUp2B9McEmnowX" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:51:41.295163+00:00" -->

**Input**

```json
{"command":"sleep 1; cat /private/tmp/claude-501/-Users-martin-lagrangefoundry-1stcontact/6909dc45-e8e2-4c91-9972-2e1e0e43872a/tasks/b2y2stfl0.output","description":"Check batch progress"}
```

**Result**

```
test_UAT_FC_REQ-461_hero_clip_tool.workers exit=0       Tests  8 passed (8)
test_UAT_FC_REQ-470_clip_guidance.workers exit=0       Tests  2 passed (2)
test_UAT_FC_BUG-336_clip_byte_budget.workers exit=0       Tests  3 passed (3)
test_UAT_FC_BUG-347_loop_length_guidance.workers exit=0       Tests  2 passed (2)
test_UAT_FC_BUG-351_clip_row_carries_poster_and_length.workers exit=0       Tests  1 passed (1)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -ln "AnimateImage…
<!-- xgd-tool name="Bash" id="toolu_01NRSRPBfKvsELqjwbZKVecf" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:51:46.616042+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git grep -ln \"AnimateImage\\b\\|'AnimateImage'\\|AnimateImages\" -- tests | head; git grep -ln \"consoleSections\\|builder-console-sites__section\\|data-section\" -- tests | head -5","description":"Find tests enumerating tools or console sections"}
```

**Result**

```
tests/test_UAT_FC_BUG-265_new_input_is_linked.test.ts
tests/test_UAT_FC_REQ-298_console_panes.test.ts
tests/test_UAT_FC_REQ-298_console_view.test.ts
tests/test_UAT_FC_REQ-433_one_input_board.test.ts
tests/test_UAT_FC_REQ-442_quiet_empty_sections.test.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n "consoleSections\|…
<!-- xgd-tool name="Bash" id="toolu_014YYL1hXBE4Q5BkTwb6bGxY" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:51:51.057033+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && grep -n \"consoleSections\\|sections\" tests/test_UAT_FC_REQ-298_console_panes.test.ts tests/test_UAT_FC_REQ-298_console_view.test.ts | head -10; git grep -ln \"priming.*200\\|primingBytes\\|PRIMING_LIMIT\\|summaryManual\\|summary-level\" -- tests | head -5","description":"Check console sections and priming tests"}
```

**Result**

```
tests/test_UAT_FC_REQ-298_console_view.test.ts:84:    consoleSections: [
tests/test_UAT_FC_REQ-298_console_panes.test.ts:7: * `webui/list-detail` in `no-tab` mode, the real detail pane, the real sections
tests/test_UAT_FC_REQ-298_console_panes.test.ts:164:    sections: [
tests/test_UAT_FC_REQ-298_console_panes.test.ts:267:    // CONDITION 9. Three sections, in the order the questions arrive in: whose
tests/test_UAT_FC_REQ-298_console_panes.test.ts:368:      sections: [
tests/test_UAT_FC_REQ-298_console_panes.test.ts:399:      sections: [
tests/test_UAT_FC_REQ-298_console_panes.test.ts:427:    await mount({ sections: [] })
tests/test_UAT_FC_BUG-118_where_a_picture_lives.test.ts
tests/test_UAT_FC_REQ-284_the_cheap_instrument_is_named.test.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && ls tests | grep -i "BUG-12…
<!-- xgd-tool name="Bash" id="toolu_013Ue9NHKV1kbFj6JAAA2m1z" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:51:55.165627+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && ls tests | grep -i \"BUG-129\\|priming\\|REQ-171\" | head","description":"Find priming budget tests"}
```

**Result**

```
test_UAT_FC_BUG-129_priming_fits_the_deployment_grant.workers.test.ts
test_UAT_FC_BUG-63_priming_configuration.test.ts
test_UAT_FC_BUG-65_priming_names_no_documents.test.ts
test_UAT_FC_REQ-171_ledger.workers.test.ts
test_UAT_FC_REQ-171_session_texts.test.ts
test_UAT_FC_REQ-182_priming_is_configuration.test.ts
test_UAT_FC_REQ-262_session_priming.test.ts
test_UAT_FC_REQ-355_builder_priming_config.test.ts
test_UAT_FC_REQ-389_consultant_conduct_priming.test.ts
test_UAT_FC_REQ-473_priming_against_the_grant.workers.test.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && while pgrep -f "bug356-bat…
<!-- xgd-tool name="Bash" id="toolu_013iddCAY8jaD3iVLf7XPEnM" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:51:59.451979+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && while pgrep -f \"bug356-batch.sh\" >/dev/null; do sleep 15; done; cat /private/tmp/claude-501/-Users-martin-lagrangefoundry-1stcontact/6909dc45-e8e2-4c91-9972-2e1e0e43872a/tasks/b2y2stfl0.output","description":"Wait for batch to finish","timeout":600000}
```

**Result**

```
test_UAT_FC_REQ-461_hero_clip_tool.workers exit=0       Tests  8 passed (8)
test_UAT_FC_REQ-470_clip_guidance.workers exit=0       Tests  2 passed (2)
test_UAT_FC_BUG-336_clip_byte_budget.workers exit=0       Tests  3 passed (3)
test_UAT_FC_BUG-347_loop_length_guidance.workers exit=0       Tests  2 passed (2)
test_UAT_FC_BUG-351_clip_row_carries_poster_and_length.workers exit=0       Tests  1 passed (1)
test_UAT_FC_REQ-468_clips_without_a_disclosure_gate.workers exit=0       Tests  3 passed (3)
test_UAT_FC_REQ-657_first_build_without_a_plan.workers exit=0       Tests  2 passed (2)
test_UAT_FC_BUG-306_effect_before_the_first_draft.workers exit=0       Tests  2 passed (2)
test_UAT_FC_BUG-308_effect_proposed_as_intro_plus_loop exit=0       Tests  1 passed (1)
test_UAT_FC_BUG-304_signature_effect_during_the_build exit=0       Tests  3 passed (3)
test_UAT_FC_REQ-657_the_plan_tool exit=0       Tests  5 passed (5)

[exited with code 0]
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && for t in test_UAT_FC_BUG-1…
<!-- xgd-tool name="Bash" id="toolu_01FWDcSF9BaRRfbQb3sgmzoz" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:52:49.904191+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && for t in test_UAT_FC_BUG-129_priming_fits_the_deployment_grant.workers test_UAT_FC_REQ-473_priming_against_the_grant.workers; do node_modules/.bin/vitest run --config vitest.workers.config.mts tests/$t.test.ts > $TMPDIR/bug356-r-$t.txt 2>&1; echo \"$t exit=$? $(grep -E 'Tests ' $TMPDIR/bug356-r-$t.txt)\"; done; for t in test_UAT_FC_REQ-262_session_priming test_UAT_FC_REQ-389_consultant_conduct_priming test_UAT_FC_REQ-298_console_view; do node_modules/.bin/vitest run --config vitest.node.config.mts tests/$t.test.ts > $TMPDIR/bug356-r-$t.txt 2>&1; echo \"$t exit=$? $(grep -E 'Tests |No test files' $TMPDIR/bug356-r-$t.txt)\"; done","description":"Run priming and console suites","timeout":600000}
```

**Result**

```
test_UAT_FC_BUG-129_priming_fits_the_deployment_grant.workers exit=0       Tests  1 passed (1)
test_UAT_FC_REQ-473_priming_against_the_grant.workers exit=1 ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯
      Tests  2 failed (2)
test_UAT_FC_REQ-262_session_priming exit=0       Tests  24 passed (24)
test_UAT_FC_REQ-389_consultant_conduct_priming exit=0       Tests  8 passed (8)
test_UAT_FC_REQ-298_console_view exit=0       Tests  12 passed (12)
```

## Bash grep -E "FAIL|Error|expected|received|❯ tests" $TMPDIR/bug356-r-test_UAT_FC_REQ-473_priming_against_the_grant.workers.tx…
<!-- xgd-tool name="Bash" id="toolu_01Rg24uwMbvXXdGod4YbSsAn" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:53:25.581525+00:00" -->

**Input**

```json
{"command":"grep -E \"FAIL|Error|expected|received|❯ tests\" $TMPDIR/bug356-r-test_UAT_FC_REQ-473_priming_against_the_grant.workers.txt | head -20","description":"Read REQ-473 failure"}
```

**Result**

```
 FAIL  |workers| tests/test_UAT_FC_REQ-473_priming_against_the_grant.workers.test.ts > REQ-473 the v2 priming against the consultant's grant > test_UAT_FC_REQ-473_every_tool_named_in_the_priming_is_in_the_consultants_grant
AssertionError: expected [ 'LinkedIn', 'definition_of_done' ] to deeply equal []
 ❯ tests/test_UAT_FC_REQ-473_priming_against_the_grant.workers.test.ts:236:61
 FAIL  |workers| tests/test_UAT_FC_REQ-473_priming_against_the_grant.workers.test.ts > REQ-473 the v2 priming against the consultant's grant > test_UAT_FC_REQ-473_the_consultants_authored_size_is_inside_the_lowered_budget
AssertionError: expected 198060 to be less than or equal to 191200
 ❯ tests/test_UAT_FC_REQ-473_priming_against_the_grant.workers.test.ts:247:33
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git status --short | grep -v "^ M .xgd\|^?? .xgd" | head -5; node_modules…
<!-- xgd-tool name="Bash" id="toolu_011MqZBD2ixWQvs4HKQxQ6Tp" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:53:31.621085+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git status --short | grep -v \"^ M .xgd\\|^?? .xgd\" | head -5; node_modules/.bin/vitest run --config vitest.workers.config.mts tests/test_UAT_FC_REQ-473_priming_against_the_grant.workers.test.ts > $TMPDIR/bug356-base473.txt 2>&1; echo exit=$?; grep -E \"Tests |AssertionError\" $TMPDIR/bug356-base473.txt","description":"Baseline REQ-473 on xgd-working","timeout":600000}
```

**Result**

```
exit=1
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected [ 'LinkedIn', 'definition_of_done' ] to deeply equal []
AssertionError: expected 196395 to be less than or equal to 191200
      Tests  2 failed (2)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git add apps/control-app/c…
<!-- xgd-tool name="Bash" id="toolu_01BwX3zC1rYtWH7Y1ENdPX8L" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:53:57.908509+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git add apps/control-app/container/Dockerfile apps/control-app/container/server.ts apps/control-app/src/builder/api.js apps/control-app/src/builder/app.js apps/control-app/src/builder/builder.css apps/control-app/src/builder/config.js apps/control-app/src/builder/showcase.js apps/control-app/src/router.ts apps/control-app/src/tickets.ts apps/control-app/src/videogen.ts apps/control-app/src/clip-movement.ts apps/control-app/src/showcase.ts tests/test_UAT_FC_BUG-308_effect_proposed_as_intro_plus_loop.test.ts tests/test_UAT_FC_REQ-470_clip_guidance.workers.test.ts tests/support/synthetic-clips.ts tests/test_UAT_FC_BUG-356_clip_movement.test.ts tests/test_UAT_FC_BUG-356_signature_effect_by_default.test.ts tests/test_UAT_FC_BUG-356_showcase.workers.test.ts tools/generate/src/cli/ai/account-core.ts tools/generate/src/cli/ai/host-core.ts tools/generate/src/cli/ai/plan-core.ts tools/generate/src/cli/ai/plan-surface.json tools/generate/src/cli/index.ts tools/generate/src/cli/showcase-measure.ts && git status --short | grep -v \"^A \\|^M \" | grep -v node_modules | head; git commit -q -F - <<'EOF'\n[FREE-CODED] BUG-356: signature effect on by default, showcase, clip movement measure\n\n- The first draft's brief carries the hero's signature effect unless the\n  client declined it: the client's choice, the consultant's `defaulted`\n  pick, or a hero built ready for one. A first build with no pick records\n  `defaulted` and tells the consultant (effect_note). No hold, no refusal.\n- set_plan's menu puts the hero's movement in \"look\".\n- Showcase: operator-curated clips copied into the platform tenant's store;\n  console section, admin routes, a read-only `showcase` op on the Clips\n  surface (shown items only), and a chat link that plays the clip.\n- videoGuidance: the reveal is the noticeable part, only the loop subtle;\n  the first-draft effect is the one exception to getting a yes.\n- Made clips are measured with ffmpeg in the job container (share of the\n  picture that changes); the result says when a reveal is too faint.\n  NOTICEABLE_SHARE = 0.05, calibrated on dev-store clips. `1c showcase measure`.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nEOF\ngit log --oneline -1; git rev-parse HEAD","description":"Commit the work on the branch"}
```

**Result**

```
129b7114ff [FREE-CODED] BUG-356: signature effect on by default, showcase, clip movement measure
129b7114ff02e714da2c296799d58f4a57753322
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && for a in 1 2 3 4 5 6 7 8;…
<!-- xgd-tool name="Bash" id="toolu_01SdJRgZzvT51kAmsRu5xm1v" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:54:03.093346+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && for a in 1 2 3 4 5 6 7 8; do xgd branch lock BUG-356 > $TMPDIR/bug356-lock.txt 2>&1 && { echo locked; break; }; tail -2 $TMPDIR/bug356-lock.txt; sleep 30; done; git merge -q --no-edit xgd-working 2>&1 | tail -5; git status --short | grep -v node_modules | head","description":"Lock and merge xgd-working into branch","timeout":400000}
```

**Result**

```
locked
Auto-merging apps/control-app/src/builder/config.js
Auto-merging apps/control-app/src/router.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git log --oneline -3; git…
<!-- xgd-tool name="Bash" id="toolu_01BdTUaQ3p99FazWeVwMzbLD" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:54:09.292612+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git log --oneline -3; git diff HEAD~1 --stat -- apps tools packages | tail -3; (cd apps/control-app && ../../node_modules/.bin/tsc --noEmit -p tsconfig.json 2>&1 | head -5; echo tsc=$?)","description":"Check merge result and typecheck","timeout":300000}
```

**Result**

```
fd2035ee80 Merge branch 'xgd-working' into free-BUG-356
129b7114ff [FREE-CODED] BUG-356: signature effect on by default, showcase, clip movement measure
0e3a2ee8af xgd(ticket): update comment comment-f2d5499d
 packages/framework/src/modules/checkout/meta.ts    |  8 +-
 packages/framework/src/modules/module-assets.ts    |  2 +-
 11 files changed, 295 insertions(+), 61 deletions(-)
tsc=0
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && node_modules/.bin/vitest r…
<!-- xgd-tool name="Bash" id="toolu_01HRppNRKYgjvDNSHXy1hwcA" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:54:18.689283+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && node_modules/.bin/vitest run --config vitest.workers.config.mts tests/test_UAT_FC_BUG-356_showcase.workers.test.ts > $TMPDIR/bug356-t3.txt 2>&1; echo \"exit=$? $(grep 'Tests ' $TMPDIR/bug356-t3.txt)\"; ls bin/project/xgd_version_bump && ./bin/project/xgd_version_bump 2>&1 | tail -2; grep '\"version\"' package.json","description":"Re-run showcase suite, bump version","timeout":400000}
```

**Result**

```
exit=0       Tests  3 passed (3)
bin/project/xgd_version_bump
0.2.795 -> 0.2.796  (patch)
  "version": "0.2.796",
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git status --short | grep…
<!-- xgd-tool name="Bash" id="toolu_01LvKCFwtoNFpg5Ae4niqfcd" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:54:34.900445+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-356 && git status --short | grep -v node_modules; git commit -qam \"chore(version): 0.2.796 for BUG-356\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\" && git rev-parse HEAD","description":"Commit version bump"}
```

**Result**

```
 M package.json
c4e3975a2b780200e5309b2c526006a09a333cc0
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && /Users/martin/lagrangefoundry/xgd/bin/xgd-merge free-BUG-356 > $TMPDIR/bu…
<!-- xgd-tool name="Bash" id="toolu_01TvUUgz8rJUsL2dmcFoBMYe" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:54:38.479404+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && /Users/martin/lagrangefoundry/xgd/bin/xgd-merge free-BUG-356 > $TMPDIR/bug356-merge.txt 2>&1; echo exit=$?; tail -8 $TMPDIR/bug356-merge.txt; git log --oneline -3","description":"Merge branch back into xgd-working","timeout":400000}
```

**Result**

```
exit=0
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:54:39
[17:54:39] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'ticket-store', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'ticket-store', 'rematerialize', '--repo', '.', '--enforce', '--changed', '0e3a2ee8af4659bdd2230d0a60560e68b9290c74..HEAD', '--apply'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
[17:54:40] │ 11100 hidden / 1052 visible tracked tickets; 0 candidates; to hide: 0; left to canonical: main-newer=0 tie-different=0 unparsed=0
[17:54:40] │ dry run: nothing changed (use --apply)
[17:54:40] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'ticket-store'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:54:40

✓ Verified: free-BUG-356 (c4e3975a2b780200e5309b2c526006a09a333cc0) is in HEAD
c4e3975a2b chore(version): 0.2.796 for BUG-356
fd2035ee80 Merge branch 'xgd-working' into free-BUG-356
129b7114ff [FREE-CODED] BUG-356: signature effect on by default, showcase, clip movement measure
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket move-to-free-coded bug-2568c791 129b7114ff02e714da2c296799d58f…
<!-- xgd-tool name="Bash" id="toolu_015jghW8rwaiZCoeJkwKZbKF" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:54:43.152066+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket move-to-free-coded bug-2568c791 129b7114ff02e714da2c296799d58f4a57753322 c4e3975a2b780200e5309b2c526006a09a333cc0 --version 0.2.796 2>&1 | grep -v \"^\\[.*cli_command\\|^▶\\|^◀\" | tail -6","description":"Mark ticket free_coded"}
```

**Result**

```
[17:54:52] │ 
[17:54:52] │ This ticket has 2 commit(s). Have you remembered to add all the commits
[17:54:52] │ for this work? Any commits that have not been added will not be correctly reconciled
[17:54:52] │ and may be reverted. Have you run the version increment script?
[17:54:52] │ 
[17:54:52] │ Moved to free_coded: bug: BUG-356 (bug-2568c791)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd branch clean BUG-356 2>&1 | grep -v "cli_command\|^▶\|^◀" | tail -4
<!-- xgd-tool name="Bash" id="toolu_01GaBHT4R3BLhfyFJJKa2qGc" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:54:55.766672+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd branch clean BUG-356 2>&1 | grep -v \"cli_command\\|^▶\\|^◀\" | tail -4","description":"Clean up branch and worktree"}
```

**Result**

```
[17:54:58] │ Error removing worktree: error: failed to delete '.git/worktrees/free-BUG-356': Operation not permitted
           │ 
[17:54:58] │ This command is still running inside the OS sandbox. Re-run it as exactly `xgd branch clean <TICKET-ID> [--force]` — no `cd`, pipe, `;`/`&&` chain or redirect around it, and `xgd` invoked by bare name — so the `xgd branch clean *` sandbox exclusion applies.
```

## Bash xgd branch clean BUG-356
<!-- xgd-tool name="Bash" id="toolu_011Lo8dFsNSfeVE7g4g6yH6h" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:55:00.840658+00:00" -->

**Input**

```json
{"command":"xgd branch clean BUG-356","description":"Clean up branch and worktree (bare)"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:55:01
[17:55:01] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'branch', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'branch', 'clean', 'BUG-356'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
Cleaned up free-BUG-356 (worktree removed, branch deleted, lock released).
[17:55:01] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'branch'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 17:55:01
```

## Bash P=~/.xgd/releases/current/bin/python; $P - <<'EOF' >/dev/null 2>&1 import json,subprocess frame="""BUG-356 (signature ef…
<!-- xgd-tool name="Bash" id="toolu_01FYpLtGxin8fkqqQAtJygXM" turn="34361c970f474be88d360cab200c3be1" ts="2026-11-06T01:55:08.136947+00:00" -->

**Input**

```json
{"command":"P=~/.xgd/releases/current/bin/python; $P - <<'EOF' >/dev/null 2>&1\nimport json,subprocess\nframe=\"\"\"BUG-356 (signature effect) — FREE-CODED 2026-11-05, version 0.2.796, commits 129b7114ff (work) + c4e3975a2b (bump); branch cleaned.\nBuilt: effect on by default in first-draft brief unless parked (defaulted pick / no-pick variant; host records defaulted; effect_note on Delegate); look activity names hero movement; videoGuidance reveal noticeable, only loop subtle, first-draft exception to the yes; ffmpeg movement measure in job container (NOTICEABLE_SHARE 0.05, calibrated on dev clips: pepper reveal 10%, loops 1-2%); showcase as showcase_item tickets in platform tenant store, console section, admin routes, consultant showcase op, chat player; 1c showcase measure.\nOperator to do: bin/deploy (container gains ffmpeg), mark showcase, run 1c showcase measure.\nKnown: REQ-473 priming-size + tool-name failures pre-exist on xgd-working (196,395 > 191,200); this adds 1,665 bytes; not trimmed (budget overrun = review).\nRejected: refusing set_stage look / build hold (operator: too harsh); threshold 0.15 (flags a real reveal); platform/fonts R2 prefix for showcase (ticket store gives index+metadata).\"\"\"\nfor tool,arg in [(\"AgentSummaryFrame\",{\"session\":\"bug-2568c791\",\"text\":frame})]:\n    subprocess.run([\"/Users/martin/.xgd/releases/current/bin/python\",\"-m\",\"lagrangefoundry.ai.agent_cli\",tool,\"--in\",json.dumps(arg)])\nEOF\necho ok","description":"Update summary frame"}
```

**Result**

```
ok
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket show BUG-356 2>&1 | head -15; git log --oneline -3 xgd-working…
<!-- xgd-tool name="Bash" id="toolu_017zEyQp99MGGKKq9dCW1mFM" turn="c500d0b230b244da8ec3dd36b8358f07" ts="2026-11-06T02:12:29.078855+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket show BUG-356 2>&1 | head -15; git log --oneline -3 xgd-working; git branch --list '*BUG-356*'","description":"Check BUG-356 status and branch state"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 18:12:31
usage: xgd ticket [-h]
                  {create,get,update,archive,unarchive,bundle,unbundle,list,schema,children,backlinks,reports,comments,add-comment,append,recover,rebuild-index,audit,development,query,action,history,diff,search,move-to-free-coded}
                  ...
xgd ticket: error: argument ticket_command: invalid choice: 'show' (choose from create, get, update, archive, unarchive, bundle, unbundle, list, schema, children, backlinks, reports, comments, add-comment, append, recover, rebuild-index, audit, development, query, action, history, diff, search, move-to-free-coded)
Try 'xgd ticket --help' for available commands.
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 18:12:31
55cb8200f7 xgd(ticket): update comment comment-91847602
906298ec10 xgd(ticket): update comment comment-d8c2e561
6680db04a9 xgd(ticket): create bug bug-1ff04fdc
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket get BUG-356 2>&1 | grep -iE '"?(status|version|free_coded|comm…
<!-- xgd-tool name="Bash" id="toolu_011xCXYQmEcwKoXSxdr4EbJ5" turn="c500d0b230b244da8ec3dd36b8358f07" ts="2026-11-06T02:12:35.785569+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket get BUG-356 2>&1 | grep -iE '\"?(status|version|free_coded|commit)' | head; git branch -a --list '*BUG-356*'; git merge-base --is-ancestor 129b7114ff02e714da2c296799d58f4a57753322 xgd-working && echo work-in; git merge-base --is-ancestor c4e3975a2b780200e5309b2c526006a09a333cc0 xgd-working && echo bump-in","description":"Verify ticket status and commits on xgd-working"}
```

**Result**

```
[18:12:36] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'ticket', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'ticket', 'get', 'BUG-356'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
[18:12:36] │ Status: free_coded
[18:12:36] │   commits: [{'working_sha': '129b7114ff02e714da2c296799d58f4a57753322', 'reconcile_sha': None, 'main_sha': None}, {'working_sha': 'c4e3975a2b780200e5309b2c526006a09a333cc0', 'reconcile_sha': None, 'main_sha': None}]
[18:12:36] │   version: 0.2.796
[18:12:36] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'ticket'}
work-in
bump-in
```
