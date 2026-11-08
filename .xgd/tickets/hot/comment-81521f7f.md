---
uid: comment-81521f7f
id: COMMENT-7886
type: comment
title: Comment on bug BUG-365
created_by: xgd
created_at: '2026-11-05T23:23:54.169317+00:00'
updated_at: '2026-11-05T23:28:16.667756+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-313c192b
  kind: tool_transcript
---

## Bash cd /Users/martin/lagrangefoundry/1stcontact; python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{"session":"bug-3…
<!-- xgd-tool name="Bash" id="toolu_012AyPxvw3tN7c4jjvFnWMoL" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:14:09.891354+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"bug-313c192b\"}'; python -m lagrangefoundry.ai_knowledge.cli KnowledgeSearch --in '{\"query\":\"free coding process protocol steps\",\"top_k\":3}' | head -60","description":"Read summary and search free coding protocol"}
```

**Result**

```
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai.agent_cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai_knowledge.cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; ls; ls .venv 2>/dev/null | head; which xgd; cat CLAUDE.md 2>/dev/null | hea…
<!-- xgd-tool name="Bash" id="toolu_01D9A6ZYaurLDLHZYCEcnSkp" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:14:18.094836+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; ls; ls .venv 2>/dev/null | head; which xgd; cat CLAUDE.md 2>/dev/null | head -80","description":"Inspect repo and find python env"}
```

**Result**

```
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
/Users/martin/.xgd/bin/xgd
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
- **leaf control** (`<input>`, `<textarea>`, a button's face) → **L1 wraps the module**, via a `contr
```

[elided — kept 5800 of 7340 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact; head -1 /Users/martin/.xgd/bin/xgd; ls /Users/martin/lagrangefoundry/xgd; c…
<!-- xgd-tool name="Bash" id="toolu_01UvkYgFA5LDUi8boVcGdb9V" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:14:23.089362+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; head -1 /Users/martin/.xgd/bin/xgd; ls /Users/martin/lagrangefoundry/xgd; cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-free-coded-promotion.md ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/fixes-to-landed-work-are-bugs.md","description":"Find xgd python and read memories"}
```

**Result**

````
#!/bin/sh
=3.0
1
bin
build
CLAUDE.md
coverage.json
dist
dist-install
docs
fix_imports.py
fix_remaining.py
fix_transform.py
fix_transform2.py
install
lagrangefoundry
lib
mypy.ini
pyproject.toml
README.md
RED_PHASE_SUMMARY.md
repo
shared.txt
tests
workflows.txt
xgd
xgd_dashboard
xgd_quality_instrument
xgd_source
xgd.egg-info
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
name: fixes-to-landed-work-are-bugs
description: "When the operator finds landed behaviour broken in testing, file the fix as a `bug` ticket (with severity), not a `request` — even when it also carries small spec changes."
metadata:
  node_type: memory
  type: feedback
  originSessionI
````

[elided — kept 5800 of 6617 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact; ls -a | grep venv; cat /Users/martin/.xgd/bin/xgd | head -20; ls /Users/mar…
<!-- xgd-tool name="Bash" id="toolu_015kGaW2K2ikru36dviknW6R" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:14:30.136726+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; ls -a | grep venv; cat /Users/martin/.xgd/bin/xgd | head -20; ls /Users/martin/lagrangefoundry/xgd/xgd_source/system_docs/","description":"Locate xgd venv and system docs"}
```

**Result**

```
#!/bin/sh
# xgd release shim (REQ-934). A pinned run stays on its release; everything
# else follows the newest deployed release.
root="$HOME/.xgd/releases"
if [ -n "$XGD_RUN_RELEASE" ]; then
  case "$XGD_RUN_RELEASE" in
    dev:*)
      if [ -x "$XGD_RUN_PYTHON" ]; then exec "$XGD_RUN_PYTHON" -m xgd_source "$@"; fi
      echo "xgd: pinned interpreter $XGD_RUN_PYTHON is missing" >&2
      exit 3
      ;;
  esac
  target="$root/$XGD_RUN_RELEASE/bin/xgd"
  if [ ! -x "$target" ]; then
    echo "xgd: pinned release $XGD_RUN_RELEASE is missing ($target)" >&2
    exit 3
  fi
else
  target="$root/current/bin/xgd"
fi
__init__.py
__pycache__
awareness.md
BROWSER-TESTING.md
CODING-STANDARDS.md
FRAGILE-INTENT-LIFECYCLE.md
FREE-CODING.md
index
MODE-RULES.md
OVERRIDE-AUDIT.md
PHILOSOPHY.md
STORY-TYPE-CLASSIFICATION.md
STORY-TYPES.md
TASK-TEMPLATE.md
TDD-PROCESS.md
TEST-STRATEGY.md
```

## Bash cat /Users/martin/lagrangefoundry/xgd/xgd_source/system_docs/FREE-CODING.md; ls ~/.xgd/releases/current/bin/
<!-- xgd-tool name="Bash" id="toolu_017zHW3siKLmYYHuuPtBdKoJ" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:14:33.756677+00:00" -->

**Input**

```json
{"command":"cat /Users/martin/lagrangefoundry/xgd/xgd_source/system_docs/FREE-CODING.md; ls ~/.xgd/releases/current/bin/","description":"Read free coding doc"}
```

**Result**

```
<persisted-output>
Output too large (56.6KB). Full output saved to: /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/a549ecd3-4255-4d82-ab6d-f61d2a62cca3/tool-results/b70uwfjx8.txt

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

## Bash sed -n 1,400p /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/a549ecd3-4255-4d82-ab6d-f61d2a62…
<!-- xgd-tool name="Bash" id="toolu_01HLDSwEEn8MeyhPz2ECfG83" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:14:38.272360+00:00" -->

**Input**

```json
{"command":"sed -n 1,400p /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/a549ecd3-4255-4d82-ab6d-f61d2a62cca3/tool-results/b70uwfjx8.txt | grep -n -i -E \"^#|status|xgd ticket|branch cut|UAT\" | head -100","description":"Skim free coding doc headings and commands"}
```

**Result**

```
1:# Free Coding — process for Claude
9:## Quick reference
11:"Free coding" = (1) scope ticket first with behavior description, (2) set `status=free_coding` to mark the start of work, (3) `xgd branch cut <TICKET-ID>` (default — skip only if confident this is a quick fix-and-commit) then code + UAT tests named `test_UAT_FC_<TICKET-ID>_*` on that branch, (4) commit with `[FREE-CODED]`, (5) `xgd branch lock` → manual `git merge` into xgd-working (conflict resolution happens here, before the ticket is marked done), (6) set `status=free_coded` + `fields.commits=[sha]` — the gate command checks each SHA is already an ancestor of xgd-working and refuses to proceed otherwise (BUG-1032), so `free_coded` mechanically means "landed, ready to reconcile whenever" and never requires a branch-status check, (7) keep ticket body current, (8) `xgd branch clean` to release the lock and tear down the now-merged branch/worktree. Missing any step → no matrix coverage → test_fix eliminates the code as drift.
15:## ⚠️ MANDATORY PROCESS — Applies to interactive user sessions only
21:### Which status transitions Claude owns — and which the operator owns
23:**Claude may set these statuses autonomously, as part of the free-coding process:**
25:| Status | When |
31:**All other status transitions are operator decisions. Claude must never set them.**
33:`ready_*` statuses are dispatcher triggers — setting one immediately queues an
36:| Status | What the dispatcher launches |
45:### Consequences of non-compliance
59:## ⚠️ CRITICAL: NEVER set a free-coded ticket to `ready_to_implement`
62:polls every ~30 seconds and the moment it sees a ticket at this status it
67:**Allowed statuses for a free-coded ticket**: `draft` (always create here),
80:## ⚠️ CRITICAL: Before handing back to the user, the ticket must reflect the current implementation
100:## ⚠️ CRITICAL: Use one ticket per intent — do not proliferate tickets
126:## What is "free coding"?
136:runs and updates stories / ACs / UATs to match what the code now does.
142:   ├─ mark ticket: status=free_coding        ←  start of work
144:   ├─ commit, mark ticket: status=free_coded, fields.commits=[…]
145:   ├─ promote: status=ready_to_reconcile     ←  operator decision
147:   └─ merge-back reconcile branch            ←  status=free_and_reconciled
150:The dispatcher's reconcile trigger is `status=ready_to_reconcile AND
159:## Workspace: branch-per-ticket, merged back into xgd-working
217:branch (`xgd branch cut <TICKET-ID>`) instead of continuing to hold the
236:       xgd branch cut <TICKET-ID>
269:       xgd ticket-store rematerialize \
290:       xgd ticket move-to-free-coded <TICKET-ID> <sha...> --version X.Y.Z
378:**Ticket writes** (`xgd ticket create/update/comment`) work from wherever you
390:### Changes that do NOT require the free-coding process
393:UAT, or reconciliation — they sit **outside the capability matrix** by design:
395:- **Ticket changes** — any operation via `xgd ticket create/update/comment`.
```

## Bash sed -n 159,400p /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/a549ecd3-4255-4d82-ab6d-f61d2a…
<!-- xgd-tool name="Bash" id="toolu_014LnNYE9M7VC3ZG2WGevyDE" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:14:43.106718+00:00" -->

**Input**

```json
{"command":"sed -n 159,400p /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/a549ecd3-4255-4d82-ab6d-f61d2a62cca3/tool-results/b70uwfjx8.txt","description":"Read workspace section of free coding doc"}
```

**Result**

```
## Workspace: branch-per-ticket, merged back into xgd-working

The primary checkout of this repo is the branch `xgd-working`. This is where all
operator (and Claude) code changes ultimately live until they are reconciled to
`main` — but code is no longer *written* directly there. Running many
free-coding sessions at once on a single shared `xgd-working` checkout caused
constant contention (concurrent commits, dirty-tree races, ticket-store
conflicts). Instead, each free-coding session works in its own disposable
branch + worktree cut from `xgd-working`, and merges back by hand at the end
(REQ-749).

**Default: cut a branch.** The risk this exists to avoid is *dwell time* on
`xgd-working`, not diff size — a one-line concurrent edit collides just as
easily as a twelve-file one, and small collisions are cheap to resolve.
What actually causes damage is a session that holds `xgd-working` for an
extended, overlapping window (multi-file work, iterative back-and-forth
with the operator, bulk/systematic changes across many files or tickets).

**Skip the branch only when confident this is a quick fix-and-commit** — a
single-spot fix you're confident will be scoped, coded, and committed
within a single conversational turn, no back-and-forth expected. This
isn't just a style preference: the session lock itself is only valid for
one turn (see below), so an unbranched session that spans more than one
turn is, by construction, holding a lock that has already gone stale. If
you're not sure, cut the branch; it's cheap. If a session that started as
"quick" turns out to balloon mid-flight (the fix grows, the user asks for
more, it's taking a while), **stop and cut the branch before continuing**
rather than letting uncommitted work keep growing directly on
`xgd-working`.

**Skipping the branch is never "no lock" — take the session lock instead
(REQ-765).** The checkout you're editing when unbranched *is* the
`xgd-working` worktree — a second unbranched session (or resync) touching
it at the same moment doesn't just risk a version clash, it can `git add
-A` another session's in-flight uncommitted edits into your commit. Before
the first edit, acquire the lock, passing `$PPID` explicitly:

    xgd branch session start <TICKET-ID> $PPID

**Always pass `$PPID` explicitly — never rely on the command's default
(BUG-1024).** In an agent harness, every tool call runs as its own
short-lived subprocess; there is no single process held open across the
whole session. The command's default PID capture is read from *inside*
the `xgd` process itself, which resolves to the invoking shell for that
one call — a process that has already exited by the time the next tool
call runs. A lock anchored to that PID looks abandoned within moments,
and a second concurrent session silently reclaims it. `$PPID`, expanded
by your own shell before `xgd` ever runs, is the one process that's
genuinely stable across tool calls *within a single turn*: the top-level
harness process backing that turn. (A human operator running this from a
persistent terminal shell doesn't need to do this — their shell already
is that stable process. This only matters for agent-harness invocation.)

**The session lock is valid for one turn only.** It's anchored to the
issuing turn's own process, which exits the moment the turn ends — a lock
held across a turn boundary is stale by construction, not merely by
policy. If the fix isn't done by the end of the turn — it's grown, the
user asked for more, it's taking longer than expected — stop and cut a
branch (`xgd branch cut <TICKET-ID>`) instead of continuing to hold the
session lock into a new turn. Never plan for the unbranched fast path to
span more than one turn.

At hand-back, after your final commit and `move-to-free-coded` call —
still within the same turn:

    xgd branch session end <TICKET-ID>

If `session start` refuses (another live session or an in-progress
`xgd branch lock` merge holds it), do not work around it by editing
anyway — wait, or cut a branch instead (branch worktrees are unaffected by
this lock).

**The lifecycle:**

1. **Cut the branch** — as the first action of Step 2, before writing any
   code:

       xgd branch cut <TICKET-ID>

   Provisions `free-<TICKET-ID>` (branch + worktree off `xgd-working`, in the
   standard worktree location) and prints its path. Switch into it (`cd` only;
   tests run through `bin/xgd-test`, which uses the shared dependencies-only dev
   environment created by `bin/xgd-dev-env`, so the Step 3 commands below work
   from any worktree):

       source bin/xgdcd free-<TICKET-ID>

   Step 2's code and Step 3's commits land in this worktree, not on
   `xgd-working`.

2. **Code, test, commit** — Steps 2 and 3 below, unchanged, except every
   commit lands on `free-<TICKET-ID>` instead of directly on `xgd-working`.

3. **Lock, merge by hand** — once you're ready to hand back to the operator,
   merge *before* marking the ticket `free_coded` (BUG-1032; this used to be
   the other way around, which let a ticket read `free_coded` while its
   commits were still sitting on the unmerged branch — see below):

       xgd branch lock <TICKET-ID>

   Acquires the shared merge lock (also respected by dispatcher resync's own
   publish step, so the two can never race) and reports the path of the
   worktree currently checked out on `xgd-working`. Merge by hand from there,
   with sparse-checkout disabled **for this one command**:

       git -C <xgd-working-worktree-path> -c core.sparseCheckout=false merge free-<TICKET-ID>

   Then run the overlay check, which keeps the tickets the merge touched only
   where the xgd-working copy is newer than main's:

       xgd ticket-store rematerialize \
         --repo <xgd-working-worktree-path> --enforce -
```

[elided — kept 5800 of 13549 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact; git show --stat 3fea82eeee | head -40; xgd ticket show BUG-365 2>&1 | head…
<!-- xgd-tool name="Bash" id="toolu_01V9pzo2wxwb5i7ZDkMX6PoP" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:14:47.384691+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; git show --stat 3fea82eeee | head -40; xgd ticket show BUG-365 2>&1 | head -20","description":"Show BUG-355 commit and ticket"}
```

**Result**

```
commit 3fea82eeee2520ac5c8026e87c3eb9ef3fcf8f7e
Author: Martin Westhead <martin-github@westhead.me>
Date:   Thu Nov 5 12:14:47 2026 -0800

    fix(l1,layout): overlay over a clip, a band's stated columns, layer edges [FREE-CODED]
    
    BUG-355. A cards section's band drew the composition's 2-3 columns whatever
    its group stated, and validation (which reads the composed page) never saw
    the builder's columns: a band group that states `columns`, or a track that
    is a grid at some width, now keeps them. An overlay section whose picture is
    a clip left its text below it: the clip and the scrim are now laid under the
    text as layers filling the section (new pin `fill`), so the scrim's edges are
    the clip's at every width. The layout check no longer calls a button drawn
    over a picture an overlap, and reports a layer over a picture whose edges
    nearly meet the picture's (`layer_edges`). The builder is told never to copy
    a hero per width.
    
    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

 packages/framework/src/l1/render.ts                |  35 ++-
 packages/site-schema/src/l1/design.ts              |  74 +++--
 packages/site-schema/src/l1/schema.ts              |  17 +-
 ...BUG-355_overlay_clip_and_stated_columns.test.ts | 308 +++++++++++++++++++++
 tools/generate/src/cli/ai/layout-check.json        |  15 +
 tools/generate/src/cli/ai/layout-check.ts          |  71 ++++-
 tools/generate/src/cli/ai/priming.json             |  16 ++
 tools/generate/src/cli/eval-builder.ts             |   1 +
 8 files changed, 511 insertions(+), 26 deletions(-)
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:14:47
usage: xgd ticket [-h]
                  {create,get,update,archive,unarchive,bundle,unbundle,list,schema,children,backlinks,reports,comments,add-comment,append,recover,rebuild-index,audit,development,query,action,history,diff,search,move-to-free-coded}
                  ...
xgd ticket: error: argument ticket_command: invalid choice: 'show' (choose from create, get, update, archive, unarchive, bundle, unbundle, list, schema, children, backlinks, reports, comments, add-comment, append, recover, rebuild-index, audit, development, query, action, history, diff, search, move-to-free-coded)
Try 'xgd ticket --help' for available commands.
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:14:47
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; git show 3fea82eeee -- packages/framework/src/l1/render.ts packages/site-sc…
<!-- xgd-tool name="Bash" id="toolu_01Vgaq4DcZUpqZX2gp46NJLd" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:14:51.903855+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; git show 3fea82eeee -- packages/framework/src/l1/render.ts packages/site-schema/src/l1/design.ts packages/site-schema/src/l1/schema.ts","description":"Show BUG-355 render and design diffs"}
```

**Result**

```
commit 3fea82eeee2520ac5c8026e87c3eb9ef3fcf8f7e
Author: Martin Westhead <martin-github@westhead.me>
Date:   Thu Nov 5 12:14:47 2026 -0800

    fix(l1,layout): overlay over a clip, a band's stated columns, layer edges [FREE-CODED]
    
    BUG-355. A cards section's band drew the composition's 2-3 columns whatever
    its group stated, and validation (which reads the composed page) never saw
    the builder's columns: a band group that states `columns`, or a track that
    is a grid at some width, now keeps them. An overlay section whose picture is
    a clip left its text below it: the clip and the scrim are now laid under the
    text as layers filling the section (new pin `fill`), so the scrim's edges are
    the clip's at every width. The layout check no longer calls a button drawn
    over a picture an overlap, and reports a layer over a picture whose edges
    nearly meet the picture's (`layer_edges`). The builder is told never to copy
    a hero per width.
    
    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

diff --git a/packages/framework/src/l1/render.ts b/packages/framework/src/l1/render.ts
index 47396fd642..a5609a499b 100644
--- a/packages/framework/src/l1/render.ts
+++ b/packages/framework/src/l1/render.ts
@@ -6637,9 +6637,38 @@ function emitNode(
   // wins over the `position: relative` every flowing kind gives itself and over
   // any rhythm margin. The corner is re-checked against the closed set.
   if (node.pin && (L1_PIN_CORNERS as readonly string[]).includes(node.pin.corner)) {
-    const inset = node.pin.inset ? spaceLength(node.pin.inset, state) : `${L1_PIN_DEFAULT_INSET_PX}px`
-    const [v, h] = node.pin.corner.split('-')
-    base.push('position: absolute', `${v}: ${inset}`, `${h}: ${inset}`, 'margin: 0', 'z-index: 1')
+    if (node.pin.corner === 'fill') {
+      // [[BUG-355]] — the whole box, behind the box's other children: below
+      // everything in flow (a bare run included, which a positioned layer at
+      // `auto` would cover) and above the box's own paint, because the box
+      // isolates itself (below). Two filled layers keep document order: a scrim
+      // after a clip paints over it. Width and height are stated rather than
+      // left to `inset`, because a replaced element (a clip, a picture) keeps
+      // its own size under `left`/`right` alone.
+      const inset = node.pin.inset ? spaceLength(node.pin.inset, state) : '0px'
+      base.push(
+        'position: absolute',
+        `top: ${inset}`,
+        `left: ${inset}`,
+        `width: calc(100% - 2 * ${inset})`,
+        `height: calc(100% - 2 * ${inset})`,
+        'max-width: none',
+        'margin: 0',
+        'z-index: -1',
+      )
+    } else {
+      const inset = node.pin.inset ? spaceLength(node.pin.inset, state) : `${L1_PIN_DEFAULT_INSET_PX}px`
+      const [v, h] = node.pin.corner.split('-')
+      base.push('position: absolute', `${v}: ${inset}`, `${h}: ${inset}`, 'margin: 0', 'z-index: 1')
+    }
+  }
+
+  // [[BUG-355]] — the box a filled layer covers: its positioning box, and its
+  // own stacking context, so the layer's `z-index: -1` stays above this box's
+  // paint instead of falling behind the page.
+  if ((node as { children?: readonly L1Node[] }).children?.some((c) => c.pin?.corner === 'fill')) {
+    if (!base.some((d) => d.startsWith('position:'))) base.push('position: relative')
+    base.push('isolation: isolate')
   }
 
   // [[REQ-650]] — the share of its parent grid's columns this node takes. Re-checked
diff --git a/packages/site-schema/src/l1/design.ts b/packages/site-schema/src/l1/design.ts
index fe3984c4ab..8461f41d27 100644
--- a/packages/site-schema/src/l1/design.ts
+++ b/packages/site-schema/src/l1/design.ts
@@ -790,14 +790,19 @@ function setRuns(v: Json[], key: string, value: unknown): Json[] {
  *    picture covering its column and the text centred down its own. `flip` puts
  *    the picture second, so consecutive splits alternate sides.
  *  - `overlay` — the picture behind the text, under {@link L1_OVERLAY_SCRIM}, the
- *    text in white, padded by the space scale.
+ *    text in white, padded by the space scale. [[BUG-355]] A clip is a picture
+ *    too: it and the scrim are laid under the text as layers filling the
+ *    section, so the text is over the clip at every width.
  *  - `statement` — every child centred at the text measure, its text centred.
  *  - `cards` — the leading runs (a heading, an intro) above a grid of the rest:
  *    stacked below {@link L1_CARDS_FROM_PX}, then two or three columns. A single
  *    group holding the items is the grid's own. [[BUG-293]] Only cards go in the
  *    grid: a group holding the heading after the leading runs is the intro, the
  *    trailing buttons and links are the section's action below the grid, and
- *    what is left must be groups.
+ *    what is left must be groups. [[BUG-355]] A group holding the items that
+ *    states its own columns (`columns`, or a `responsiveLayout` track that is a
+ *    grid at some width) keeps them: the builder chose them, and the
+ *    composition's two or three are only the default.
  *  - `full` — the picture across the section, the rest centred under it at the
  *    text measure.
  * A section with no picture where its composition needs one, or too few items to
@@ -830,7 +835,7 @@ function composeSection(section: Json, composition: L1Composition, design: L1Des
       )
     }
     case 'overlay': {
-      const img = picture && findImage(picture)
+      const img = picture && findPicture(picture)
       if (!img || typeof img.src !== 'string' || rest.length === 0) return section
       const y = stepLength(design, '2xl') ?? stepLength(design, 'xl') ?? 64
       const x = design.layout?.gutter ?? 24
@@ -840,13 +845,25 @@
```

[elided — kept 5800 of 14682 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact; f=$(git show --name-only --format= 3fea82eeee | grep test.ts); echo $f; sed…
<!-- xgd-tool name="Bash" id="toolu_012fCUM6Tkend2acs3WUKm48" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:15:10.723153+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; f=$(git show --name-only --format= 3fea82eeee | grep test.ts); echo $f; sed -n 1,140p \"$f\"","description":"Read BUG-355 test file"}
```

**Result**

```
tests/test_UAT_FC_BUG-355_overlay_clip_and_stated_columns.test.ts
/**
 * [[BUG-355]] — a builder revision pass on a home page that nothing could fix:
 *
 * - a `cards` section's band drew three columns after three builder rounds each
 *   set two (and one column for the five steps): the composition replaced the
 *   columns the band's group stated, and validation, which reads the composed
 *   page, never saw them;
 * - a hero composed `overlay` whose picture was a clip left its text below the
 *   clip, so the builder pinned a copy of the text over a copy of the clip per
 *   width, its shaded panel 8px off the clip's edges, and the layout check then
 *   called the button over the clip's poster an overlap.
 *
 * Pages are L1 documents rendered by the real renderer and laid out by a real
 * Chromium; the layout check runs over them served by HTTP, the path the host
 * runs after a build.
 */
import http from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { validateL1, type L1Design, type L1Document, type L1Node } from '../packages/site-schema/src/index'
import { renderL1Page } from '../packages/framework/src/index'
import { createPlaywrightDriver, engineAvailable } from '../tools/generate/src'
import { checkLayoutAt, type LayoutFinding } from '../tools/generate/src/cli/ai/layout-check'
import { launchAnyChromium, loadChromium } from './support/chromium'

const browserOk = await engineAvailable('chromium')
const chromium = await loadChromium()

const closers: (() => Promise<void>)[] = []
afterEach(async () => {
  while (closers.length) await closers.pop()!()
})

const DESIGN = {
  space: { scale: { xs: 8, md: 16, lg: 24, xl: 48, '2xl': 64 }, blockGap: 'md' },
  layout: { compositions: ['overlay', 'cards'], contentWidth: 1160, gutter: 24 },
} as L1Design

const POSTER =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">' +
  '<rect width="1600" height="900" fill="#8aa37b"/><rect y="450" width="1600" height="450" fill="#3f5a32"/></svg>'

const text = (t: string, extra: Partial<L1Node> = {}): L1Node =>
  ({ kind: 'text', text: t, axes: { color: '#111827', fontFamily: 'Arial', fontSizePx: 18 }, ...extra }) as L1Node

const clip = (extra: Record<string, unknown> = {}): L1Node =>
  ({
    kind: 'video',
    id: 'hero-clip',
    src: '/assets/clip.webm',
    // An intro handing over to a loop, as the hero's was: a clip that keeps
    // moving, so it is drawn as its poster picture until it can play.
    loopSrc: '/assets/loop.webm',
    poster: '/assets/poster.svg',
    alt: 'Hands holding a salad bowl',
    playback: 'once',
    ...extra,
  }) as L1Node

const BODY: L1Node = {
  kind: 'container',
  id: 'after',
  layout: 'stack',
  padding: { topPx: 40, bottomPx: 40, leftPx: 40, rightPx: 40 },
  children: [text('Fresh meals, cooked in your kitchen every week.')],
} as L1Node

function page(sections: L1Node[], widths = [375, 768, 1280]): L1Document {
  return { widths, background: '#ffffff', root: { kind: 'container', layout: 'stack', gapPx: 0, children: sections } } as L1Document
}

function html(doc: L1Document): string {
  const result = validateL1(doc, { design: DESIGN })
  expect(result.ok, JSON.stringify(result)).toBe(true)
  return renderL1Page(doc, 'home', {}, { design: DESIGN })
}

/** Lay `markup` out at `width` in a fresh Chromium (one context per browser in the sandbox's degraded mode). */
async function laidOut<T, A = undefined>(markup: string, width: number, measure: (arg: A) => T, arg?: A): Promise<T> {
  const browser = await launchAnyChromium(chromium!)
  if (!browser) throw new Error('no Chromium could start')
  try {
    const tab = await browser.newPage({ viewport: { width, height: 900 } })
    await tab.setContent(markup)
    return (await tab.evaluate(measure as (arg: unknown) => T, arg)) as T
  } finally {
    await browser.close()
  }
}

async function serve(markup: string): Promise<string> {
  const assets: Record<string, { type: string; body: string }> = { '/assets/poster.svg': { type: 'image/svg+xml', body: POSTER } }
  const server = http.createServer((req, res) => {
    const asset = assets[req.url ?? '']
    if (asset) {
      res.writeHead(200, { 'content-type': asset.type })
      res.end(asset.body)
      return
    }
    if (req.url !== '/') {
      res.writeHead(404)
      res.end()
      return
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(markup)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
  closers.push(() => new Promise<void>((resolve) => server.close(() => resolve())))
  const addr = server.address()
  return `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}/`
}

async function check(doc: L1Document, sections: string[]): Promise<LayoutFinding[]> {
  return checkLayoutAt(await serve(html(doc)), 'home', createPlaywrightDriver, sections)
}

const of = (found: LayoutFinding[], kind: string) => found.filter((f) => f.kind === kind)

const card = (section: string, n: number): L1Node =>
  ({ kind: 'box', id: `${section}-card-${n}`, padding: { topPx: 16, bottomPx: 16, leftPx: 16, rightPx: 16 }, children: [text(`Service ${n}`)] }) as L1Node

/** A `cards` section whose band is one group holding the cards, the group's own layout given. */
const cards = (id: string, count: number, band: Record<string, unknown>): L1Node =>
  ({
    kind: 'container',
    id,
    layout: 'stack',
    composition: 'cards',
    children: [
      text('What we offer', { heading: { level: 2 } } as Partial<L1Node>),
      { kind: 'container', id: `${id}-band`, ...band, children: Array.from({ length: count }, (_, i) => card(id, i + 1)) },
    ],
  }) as L1Node

const BUTTON = text('Start the questionnaire', {
  id: 'hero-start',
  link:
```

[elided — kept 5800 of 5998 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact; sed -n 140,308p tests/test_UAT_FC_BUG-355_overlay_clip_and_stated_columns.t…
<!-- xgd-tool name="Bash" id="toolu_018Aao2cDpjui1rh3ubfCmgJ" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:15:14.347878+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; sed -n 140,308p tests/test_UAT_FC_BUG-355_overlay_clip_and_stated_columns.test.ts","description":"Read rest of BUG-355 test"}
```

**Result**

```
} as Partial<L1Node>)

/** The overlay hero, built once: one clip, one text group. */
const HERO: L1Node = {
  kind: 'container',
  id: 'hero',
  layout: 'stack',
  width: 'bleed',
  composition: 'overlay',
  children: [
    clip(),
    {
      kind: 'container',
      id: 'hero-copy',
      layout: 'stack',
      gapPx: 16,
      children: [
        text('Plant-forward meals, made at home', { id: 'hero-title', heading: { level: 1 } } as Partial<L1Node>),
        text('A personal chef for busy families.'),
        BUTTON,
      ],
    } as L1Node,
  ],
} as L1Node

describe.skipIf(!browserOk || !chromium)('BUG-355 — the columns a band states, and an overlay over a clip', () => {
  it('test_UAT_FC_BUG_355_cards_band_draws_the_columns_its_group_states', async () => {
    const doc = page([
      cards('offerings', 3, {
        layout: 'grid',
        columns: 2,
        responsiveLayout: { keyframes: [{ at: 375, value: 'stack' }, { at: 768, value: 'grid', columns: 2 }] },
      }),
      cards('steps', 5, { layout: 'grid', columns: 1 }),
      BODY,
    ])
    const markup = html(doc)
    const columns = (band: string) =>
      new Set(Array.from(document.getElementById(band)!.children).map((c) => Math.round(c.getBoundingClientRect().left))).size
    for (const width of [768, 1280]) {
      expect(await laidOut(markup, width, columns, 'offerings-band'), `offerings at ${width}`).toBe(2)
      expect(await laidOut(markup, width, columns, 'steps-band'), `steps at ${width}`).toBe(1)
    }
    expect(await laidOut(markup, 375, columns, 'offerings-band'), 'offerings on a phone').toBe(1)
  }, 120_000)

  it('test_UAT_FC_BUG_355_a_bands_stated_columns_are_validated', () => {
    // The builder's round-two write: two columns, and a track whose only keyframe says one.
    const doc = page([
      cards('offerings', 3, { layout: 'grid', columns: 2, responsiveLayout: { keyframes: [{ at: 375, value: 'grid', columns: 1 }] } }),
      BODY,
    ])
    const result = validateL1(doc, { design: DESIGN })
    expect(result.ok).toBe(false)
    expect(JSON.stringify(result)).toContain('`columns` must agree with the widest grid keyframe')
  })

  it('test_UAT_FC_BUG_355_overlay_hero_lays_its_text_over_the_clip_at_every_width', async () => {
    const markup = html(page([HERO, BODY]))
    for (const width of [375, 768, 1280]) {
      const seen = await laidOut(markup, width, () => {
        const box = (el: Element) => {
          const r = el.getBoundingClientRect()
          return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
        }
        const hero = document.getElementById('hero')!
        const videos = hero.querySelectorAll('video')
        const clipBox = document.getElementById('hero-clip')!
        const title = document.getElementById('hero-title')!
        const t = box(title)
        const top = document.elementFromPoint((t.left + t.right) / 2, (t.top + t.bottom) / 2)
        // The scrim: the painted layer laid over the clip.
        const scrim = Array.from(hero.children).find((c) => c !== clipBox && /gradient/.test(getComputedStyle(c).backgroundImage))
        return {
          videos: videos.length,
          shown: getComputedStyle(clipBox).display !== 'none',
          hero: box(hero),
          clip: box(clipBox),
          title: t,
          titleOnTop: !!top && title.contains(top),
          scrim: scrim ? box(scrim) : null,
        }
      })
      expect(seen.videos, `one clip at ${width}`).toBe(1)
      expect(seen.shown, `clip shown at ${width}`).toBe(true)
      // The clip is the hero's picture, edge to edge.
      for (const side of ['left', 'top', 'right', 'bottom'] as const) {
        expect(Math.abs(seen.clip[side] - seen.hero[side]), `clip ${side} at ${width}`).toBeLessThanOrEqual(1)
      }
      // The title is over the clip, and drawn on top of it.
      expect(seen.title.top, `title inside the clip at ${width}`).toBeGreaterThanOrEqual(seen.clip.top)
      expect(seen.title.bottom, `title inside the clip at ${width}`).toBeLessThanOrEqual(seen.clip.bottom)
      expect(seen.titleOnTop, `title drawn on top at ${width}`).toBe(true)
      // The scrim's edges are the clip's.
      expect(seen.scrim, `a scrim at ${width}`).not.toBeNull()
      for (const side of ['left', 'top', 'right', 'bottom'] as const) {
        expect(Math.abs(seen.scrim![side] - seen.clip[side]), `scrim ${side} at ${width}`).toBeLessThanOrEqual(1)
      }
    }
  }, 120_000)

  it('test_UAT_FC_BUG_355_the_overlay_hero_is_not_reported_as_an_overlap', async () => {
    const found = await check(page([HERO, BODY]), ['hero', 'after'])
    expect(of(found, 'overlap'), JSON.stringify(found)).toEqual([])
    expect(of(found, 'layer_edges'), JSON.stringify(found)).toEqual([])
    // The builder's shape: a button pinned over a clip in the flow, drawn on its poster.
    const pinned = page([
      {
        kind: 'container',
        id: 'hero',
        layout: 'stack',
        children: [
          clip({ sizing: { width: { mode: 'fluid' }, height: { mode: 'fixed', px: 420 } } }),
          { kind: 'container', id: 'hero-actions', layout: 'stack', pin: { corner: 'bottom-left', inset: 'lg' }, children: [BUTTON] },
        ],
      } as L1Node,
      BODY,
    ])
    const over = of(await check(pinned, ['hero', 'after']), 'overlap')
    expect(over, JSON.stringify(over)).toEqual([])
  }, 120_000)

  /** A section holding a clip and a shaded layer over it, with the text the layer is for. */
  const layered = (layer: Record<string, unknown>, clipExtra: Record<string, unknown> = {}, section: Record<string, unknown> = {}): L1Node =>
    ({
      kind: 'container',
      id: 'hero',
      layout: 'stack',
      ...section,
      children: [
        clip(clipExtra),
        { kind: 'box', id: 'hero-panel
```

[elided — kept 5800 of 7679 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact; grep -n -i "minHeight\|min-height" packages/site-schema/src/l1/schema.ts |…
<!-- xgd-tool name="Bash" id="toolu_01E5Kvqq6y4H5i6pbBPmNFnk" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:15:19.057436+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; grep -n -i \"minHeight\\|min-height\" packages/site-schema/src/l1/schema.ts | head -20; grep -n \"geometry\" packages/framework/src/l1/render.ts | head -30","description":"Check minHeight and geometry support"}
```

**Result**

```
995: * geometry the keyframe track owns. Under `prefers-reduced-motion: reduce` the
1079://      node's own authored opacity/geometry resume. A reveal therefore never
1535: * {@link geometryRules} — so the pin overrides the `position: relative` an
1870://      geometry. Change the grid's spacing and the accent follows, because it is
2052: * frame before the first jitter — is exactly the resting geometry.
2131:    // BUG-13's geometry, restated verbatim, so the teal strokes land on the brown
2318: * wiring, the behavioural `data-*` hooks); L1 owns the class, geometry and every
2468:  if (!node.sizing?.width && node.width === undefined && !node.geometry) out.push('width: fit-content', 'max-width: 100%')
2469:  if (!parent || node.geometry || node.sizing?.height) return out
2486:  if (node.sizing?.width || node.width !== undefined || node.geometry) return null
2756: * THE PRECEDENCE MIRRORS `geometryRules` and is not a preference: a column
2766:  geometry: L1Geometry | undefined,
2777:    fillsWidth(geometry, sizing) ||
2778:    (!geometry && (sizing?.width?.mode === 'fluid' || (framed && sizing?.width === undefined)))
2792:  const anchoredWidth = col ? geometry?.anchor?.width : undefined
2808:  // BUG-173 — a fluid fill owns the axis over the keyframes, as in `geometryRules`.
2809:  if (fillsWidth(geometry, sizing)) {
2814:  const frames = geometry?.keyframes
2823:      const seg = geometry?.segments?.[i] ?? 'interpolate'
2828:    // where `geometryRules` holds that keyframe's width statically.
3092: * keyed to the geometry keyframes, because that is the choice L1 can make from
3107: * BUG-173 — whether a geometry-placed node's width is a fluid FILL that owns the
3111: * and beyond them. A node with no geometry has no keyframe widths to suppress,
3114:function fillsWidth(geometry: L1Geometry | undefined, sizing: L1AxisSizing | undefined): boolean {
3115:  return geometry !== undefined && sizing?.width?.mode === 'fluid'
3129: * THE PRECEDENCE IS `geometryRules`'s and is not a preference: a column anchor
3134:  geometry: L1Geometry | undefined,
3139:  const anchoredWidth = column ? geometry?.anchor?.width : undefined
3144:  if (fillsWidth(geometry, sizing)) {
3149:  const frames = geometry?.keyframes
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; grep -n "l1AxisSizingSchema\|l1SizeAxisSchema\|mode: z" packages/site-schem…
<!-- xgd-tool name="Bash" id="toolu_01CYjuyH7uzfBwBSS1CYoYX4" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:15:23.181002+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; grep -n \"l1AxisSizingSchema\\|l1SizeAxisSchema\\|mode: z\" packages/site-schema/src/l1/schema.ts | head -20; grep -n \"function geometryRules\" -A40 packages/framework/src/l1/render.ts | grep -n \"position\" | head","description":"Inspect sizing schema and geometry positioning"}
```

**Result**

```
351:    mode: z.enum(['fixed', 'fluid', 'hug']),
358:export const l1AxisSizingSchema = z
2330:  sizing: l1AxisSizingSchema.optional(),
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; sed -n 330,380p packages/site-schema/src/l1/schema.ts; grep -n "position: a…
<!-- xgd-tool name="Bash" id="toolu_019QutFKHGnYLjGX14VU8uFJ" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:15:26.733263+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; sed -n 330,380p packages/site-schema/src/l1/schema.ts; grep -n \"position: absolute\" packages/framework/src/l1/render.ts | head","description":"Read sizing schema and absolute positioning sites"}
```

**Result**

```
 * Per-axis sizing intent: a fixed px, fluid (fill), or hug (fit-content).
 *
 * BUG-133 — **`fluid` means fill, and what "fill" compiles to depends on which
 * axis the PARENT made this one.** A width fills the same way everywhere: a
 * block's containing width is definite, so it is a percentage of it. A height
 * does not, because a flex row's height is indefinite until its own content has
 * been laid out:
 *
 * - under a `row` or a `grid`, height is the parent's cross/block axis, and a
 *   fluid height stretches the node to the row's (or track's) resolved height —
 *   which is what makes an `image` fill the depth of the column beside it, with
 *   `axes.objectFit` governing the crop;
 * - under a `stack`, height is the parent's main axis, and a fluid height is a
 *   share of a parent that declares one.
 *
 * Stated here because it is not inferable from the field: an author reading
 * `{ mode: "fluid" }` alone cannot tell which of the two they wrote, and the
 * renderer settles it without asking.
 */
export const l1SizingSchema = z
  .object({
    mode: z.enum(['fixed', 'fluid', 'hug']),
    px: finite.nonnegative().optional(),
    minPx: finite.nonnegative().optional(),
    maxPx: finite.nonnegative().optional(),
  })
  .strict()

export const l1AxisSizingSchema = z
  .object({
    width: l1SizingSchema.optional(),
    height: l1SizingSchema.optional(),
  })
  .strict()

/** [[REQ-648]] — the most lines `maxLines` may keep. */
export const L1_MAX_TEXT_LINES = 10
/** [[REQ-648]] — the most columns a grid may have at any width. */
export const L1_MAX_GRID_COLUMNS = 12

/** A container's flow mode: stacked (column), row, or grid. */
export const l1LayoutModeSchema = z.enum(['stack', 'row', 'grid'])

/**
 * REQ-420 — how a container spaces its children.
 *
 * - `rhythm` — each neighbour pair is separated by the larger of the first one's
 *   `spaceBelow` and the second one's `spaceAbove`, in the site's rhythm units,
 *   so a heading sits close to the text it introduces and well clear of what
 *   came before. A heading is kept with what follows it: the two are one unit
 *   when a row wraps or a layout restacks. For stacks of text.
1297:      'position: absolute',
2096:    'position: absolute',
2645: * browser DROPS: the run keeps `position: absolute` with no width, shrinks to fit,
3654:  const staticDecls: string[] = ['position: absolute']
4236:      'position: absolute',
6318:            decls: ['position: absolute', 'top: 0', 'left: 0', 'width: 100%', 'height: 100%', 'margin: 0', 'display: block', ...fit],
6696:        'position: absolute',
6708:      base.push('position: absolute', `${v}: ${inset}`, `${h}: ${inset}`, 'margin: 0', 'z-index: 1')
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; grep -n "^function composeSection" packages/site-schema/src/l1/design.ts; s…
<!-- xgd-tool name="Bash" id="toolu_014senTEanUNkRF8sMsKZKdt" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:15:35.574547+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; grep -n \"^function composeSection\" packages/site-schema/src/l1/design.ts; sed -n 805,880p packages/site-schema/src/l1/design.ts; grep -n \"minPx\" packages/framework/src/l1/render.ts | head","description":"Read composeSection head and minPx rendering"}
```

**Result**

```
811:function composeSection(section: Json, composition: L1Composition, design: L1Design, flip: boolean): Json {
961:function composeSections(sections: Json[], design: L1Design): Json[] {
 *    composition's two or three are only the default.
 *  - `full` — the picture across the section, the rest centred under it at the
 *    text measure.
 * A section with no picture where its composition needs one, or too few items to
 * be a band of cards, is left as built.
 */
function composeSection(section: Json, composition: L1Composition, design: L1Design, flip: boolean): Json {
  const kids = (section.children as Json[] | undefined) ?? []
  const at = kids.findIndex(onlyPicture)
  const picture = kids[at]
  const rest = kids.filter((_, i) => i !== at)
  const gap = compositionGap(design)
  // The text as one column: a lone group is its own column; anything else is
  // wrapped in one with no id, so it can never take a name the builder used.
  const column = (children: Json[], extra: Json = {}): Json =>
    children.length === 1 && isGroup(children[0]) ? { ...children[0], ...extra } : { kind: 'container', layout: 'stack', ...extra, children }
  switch (composition) {
    case 'split': {
      if (!picture || rest.length === 0) return section
      const parts = [picture, column(rest, { distribution: 'center' })]
      return reframed(
        section,
        {
          layout: 'grid',
          columns: 2,
          responsiveLayout: { keyframes: [{ at: 0, value: 'stack' }, { at: L1_SPLIT_FROM_PX, value: 'grid' }] },
          align: 'stretch',
          ...gap,
        },
        flip ? parts.reverse() : parts,
      )
    }
    case 'overlay': {
      const img = picture && findPicture(picture)
      if (!img || typeof img.src !== 'string' || rest.length === 0) return section
      const y = stepLength(design, '2xl') ?? stepLength(design, 'xl') ?? 64
      const x = design.layout?.gutter ?? 24
      const padding: Json = {}
      const tracks: Json = {}
      for (const [side, len] of [['topPx', y], ['bottomPx', y], ['leftPx', x], ['rightPx', x]] as const) {
        padding[side] = typeof len === 'number' ? len : len.keyframes[len.keyframes.length - 1].value
        if (typeof len !== 'number') tracks[side] = len
      }
      const responsivePadding = Object.keys(tracks).length ? { responsivePadding: tracks } : {}
      const text = setRuns(rest, 'color', OVERLAY_INK)
      if (img.kind === 'video') {
        // [[BUG-355]] A clip cannot be a background picture, so it is laid under
        // the text as a layer filling the section, and the scrim as a second
        // layer filling it over the clip: both take the section's box, so the
        // scrim's edges are the clip's at every width, and the text sits on
        // both at phone, tablet and desktop alike. The clip keeps its sources,
        // fit and focal point; how big it is, is the section's.
        const { sizing: _s, aspect: _a, geometry: _g, visibility: _v, pin: _p, span: _sp, width: _w, ...clip } = img
        const fit = isRecord(clip.axes) ? clip.axes : {}
        const layers: Json[] = [
          { ...clip, pin: { corner: 'fill' }, axes: { objectFit: 'cover', ...fit } },
          { kind: 'box', pin: { corner: 'fill' }, axes: { overlay: { ...L1_OVERLAY_SCRIM } } },
        ]
        return { ...reframed(section, { layout: 'stack', ...gap }, [...layers, ...text]), padding, ...responsivePadding }
      }
      const axes = { ...(isRecord(section.axes) ? section.axes : {}), backgroundImageUrl: img.src, overlay: { ...L1_OVERLAY_SCRIM } }
      return { ...reframed(section, { layout: 'stack', ...gap }, text), axes, padding, ...responsivePadding }
    }
    case 'statement':
      return reframed(
        section,
        { layout: 'stack', align: 'center', ...gap },
        setRuns(kids, 'textAlign', 'center').map((n) => (isGroup(n) && n.width === undefined ? { ...n, width: 'text' } : n)),
      )
    case 'cards': {
      // [[BUG-293]] The intro: the leading runs, and a group holding the heading
      // after them. The action: the trailing buttons and links, below the grid.
      let lead = kids.findIndex((n) => n.kind !== 'text')
      if (lead < 0) lead = kids.length
      else if (isGroup(kids[lead]) && holdsHeading(kids[lead])) lead++
      let end = kids.length
2548:  if (s.minPx !== undefined) out.push(`min-${axis}: ${s.minPx}px`)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; sed -n 3625,3665p packages/framework/src/l1/render.ts; sed -n 2535,2555p pa…
<!-- xgd-tool name="Bash" id="toolu_01VFknWJUezp6dPDC6VHZEyg" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:15:44.337194+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; sed -n 3625,3665p packages/framework/src/l1/render.ts; sed -n 2535,2555p packages/framework/src/l1/render.ts; grep -n \"aspect\" packages/site-schema/src/l1/schema.ts | head -8","description":"Inspect geometry rules, minPx emission, aspect"}
```

**Result**

```
        ...leftDecls(a.at, 'margin-left', lerpCalc(a.x, a.at, b.x, b.at), lerpCalc(a.width, a.at, b.width, b.at)),
        `margin-top: ${lerpCalc(a.y, a.at, b.y, b.at)}`,
        ...(fluidWidth ? [] : widthDecls(a.at, lerpCalc(a.width, a.at, b.width, b.at))),
      ]
      if (a.height !== undefined && b.height !== undefined) {
        const atH =
          a.atHeight !== undefined && b.atHeight !== undefined
            ? lerpCalc(a.atHeight, a.at, b.atHeight, b.at)
            : undefined
        const base = lerpCalc(a.height, a.at, b.height, b.at)
        const hF = hFat(a)
        d.push(
          `height: ${
            hF === 0 || atH === undefined
              ? base
              : `calc(${base} + ${hF === 1 ? `(100vh - ${atH})` : `${num(hF)} * (100vh - ${atH})`})`
          }`,
        )
      }
      rules.push({ media: `(min-width: ${a.at}px)`, selector, decls: d })
    }
    rules.push({
      media: `(min-width: ${frames[frames.length - 1].at}px)`,
      selector,
      decls: flowDecls(frames[frames.length - 1]),
    })
    return rules
  }

  const staticDecls: string[] = ['position: absolute']
  if (anchor) staticDecls.push(...anchorDecls(anchor, column!, anchorWidthProp))
  if (anchor?.x?.pxTrack) rules.push(...anchorTrackRules(selector, 'left', anchor.x, column!))
  if (anchor?.width?.pxTrack) {
    rules.push(...anchorTrackRules(selector, anchorWidthProp, anchor.width, column!))
  }

  // Base: the smallest-width keyframe held statically (covers below-ladder widths).
  rules.push({ selector, decls: [...staticDecls, ...decls(frames[0])] })
  if (frames.length === 1) return rules

  for (let i = 0; i < frames.length - 1; i++) {
}

function sizingCss(
  axis: 'width' | 'height',
  s: L1Sizing | undefined,
  /** BUG-133 — for `height` only: the fluid spelling this parent calls for. */
  fluidOverride?: string[],
): string[] {
  if (!s) return []
  const out: string[] = []
  if (s.mode === 'fixed' && s.px !== undefined) out.push(`${axis}: ${s.px}px`)
  else if (s.mode === 'fluid') out.push(...(fluidOverride ?? [`${axis}: 100%`]))
  else if (s.mode === 'hug') out.push(`${axis}: fit-content`)
  if (s.minPx !== undefined) out.push(`min-${axis}: ${s.minPx}px`)
  if (s.maxPx !== undefined) out.push(`max-${axis}: ${s.maxPx}px`)
  return out
}

function axisSizingCss(sizing: L1AxisSizing | undefined, parent?: ParentFlow): string[] {
  if (!sizing) return []
  // BUG-133 — a width is the same everywhere: a block's containing width is
2858:     * The box should carry the frames' own aspect ratio. Nothing here can read the
2869:     * [[REQ-447]] — the design's named aspect ratio this picture is framed at
2872:     * aspect, the picture takes `inline`.
2874:    aspect: l1AspectNameSchema.optional(),
2878:     * cropped. It shows at its own shape, whatever the design's aspects say: no
2879:     * aspect is applied to it, and a `cover` or `none` fit is drawn as `contain`.
2880:     * An `aspect` typed on it anyway is off the design. A photo can be cropped
2925: * share their framing (the same `axes`, the same `aspect`) and nothing else: a
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; grep -n "^function geometryRules" packages/framework/src/l1/render.ts; awk…
<!-- xgd-tool name="Bash" id="toolu_01BkK4dP9eh7FFNRe87spVrs" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:15:49.779041+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; grep -n \"^function geometryRules\" packages/framework/src/l1/render.ts; awk 'NR>=3540 && NR<=3600' packages/framework/src/l1/render.ts | grep -n -i \"flow\\|column\\|return\" | head -20","description":"Locate geometry flow branch"}
```

**Result**

```
3456:function geometryRules(
11:   * by half the overflow: an icon glyph 50px wide in a 40px centred box painted
26:    if (!pivots) return [`${prop}: ${x}`]
27:    if (!relaxed(atPx)) return [`${prop}: ${x}`, 'translate: none']
29:    return [`${prop}: calc(${x} + ${offset})`, `translate: ${pivot === 1 ? '-100%' : '-50%'} 0`]
41:    return d
52:   * REQ-278 — the in-flow placement frame.
54:   * Same four numbers, same ladder, same interpolation — read against the flow
57:   * the node in flow while still making it the containing block for any absolute
61:   * not declare: a node in flow takes its vertical extent from its content, and
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; sed -n 3456,3480p packages/framework/src/l1/render.ts; sed -n 3588,3610p pa…
<!-- xgd-tool name="Bash" id="toolu_01BmRBs8G9CQLvkZowDAQYvL" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:15:53.964340+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; sed -n 3456,3480p packages/framework/src/l1/render.ts; sed -n 3588,3610p packages/framework/src/l1/render.ts","description":"Read geometryRules signature and flow branch"}
```

**Result**

```
function geometryRules(
  selector: string,
  geo: L1Geometry,
  column?: L1Column,
  nowrapFromPx?: number,
  /**
   * BUG-173 — the node's `sizing.width` is a fluid fill ({@link fillsWidth}), so
   * the width axis belongs to it and the keyframe widths are suppressed, exactly
   * as a column-anchored width suppresses them. Without this the fill would be
   * overridden at every breakpoint by a literal, and the final one held above
   * the widest rung is precisely the frozen band this exists to remove.
   */
  fluidWidth = false,
  /**
   * REQ-372 — the run's `textAlign`. A relaxed run (below) grows past its captured
   * width; this decides which captured edge — or the centre — stays put while it does.
   */
  textAlign?: string,
): Rule[] {
  const frames = geo.keyframes
  const rules: Rule[] = []
  // REQ-88 — suppression is PER AXIS: a node may take its left edge from the
  // column while its width stays keyframed (see `l1ColumnAnchorSchema`).
  const anchor = column ? geo.anchor : undefined
  const anchoredX = Boolean(anchor?.x)
  const anchorWidthProp: 'width' | 'min-width' = relaxed(frames[0].at) ? 'min-width' : 'width'

  /**
   * REQ-278 — the in-flow placement frame.
   *
   * Same four numbers, same ladder, same interpolation — read against the flow
   * cursor instead of the positioned ancestor. `left`/`top` become
   * `margin-left`/`margin-top`, and `position` becomes `relative`, which keeps
   * the node in flow while still making it the containing block for any absolute
   * descendant (a backing surface recovery deliberately left pinned).
   *
   * `top` is not emitted at all, and neither is a keyframe height the node does
   * not declare: a node in flow takes its vertical extent from its content, and
   * that is the whole reason to put it there. A keyframe that DOES carry a height
   * (an image, a leaf box) still gets it — that height is the node's own extent,
   * not its position.
   */
  if (geo.place === 'flow') {
    const flowDecls = (kf: L1Geometry['keyframes'][number]): string[] => {
      const d: string[] = [...leftDecls(kf.at, 'margin-left', `${kf.x}px`, `${kf.width}px`), `margin-top: ${kf.y}px`]
      if (!fluidWidth) d.push(...widthDecls(kf.at, `${kf.width}px`))
      if (kf.height !== undefined) {
        const h = kf.atHeight
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket get BUG-365 2>&1 | head -30
<!-- xgd-tool name="Bash" id="toolu_01TrFGWZE23HER4guA61eVN8" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:15:59.796889+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket get BUG-365 2>&1 | head -30","description":"Get BUG-365 ticket"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:16:00
[15:16:00] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'ticket', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'ticket', 'get', 'BUG-365'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
[15:16:00] │ Ticket: BUG-365 (bug-313c192b)
[15:16:00] │ Type: bug
[15:16:00] │ Title: Overlay hero with a clip: halved in height and darker since BUG-355's fill layers
[15:16:00] │ Status: draft
[15:16:00] │ 
[15:16:00] │ Fields:
[15:16:00] │   severity: high
[15:16:00] │   priority: high
[15:16:00] │   parent_uid: epic-95bc3b15
[15:16:00] │   story_points: 3
[15:16:00] │   auto_merge_back: True
[15:16:00] │   needs_review: False
[15:16:00] │   session_id: fd62e4b4-735f-46d8-9a01-aa02e88d0308
[15:16:00] │   chat_comment: comment-bd9950c6
[15:16:00] │ 
[15:16:00] │ Body:
[15:16:00] │ ## Symptom (operator, 2026-11-05, dev, a shop site)
           │ 
           │ The home page's hero video is suddenly **about half its height and much darker**. Nobody edited the page: the site's change log has no edit to `home` since 15:50 UTC that morning. The change came from code.
           │ 
           │ ## Likely cause: BUG-355's overlay-over-a-clip change (3fea82eeee)
           │ 
           │ BUG-355 changed how an `overlay` section whose picture is a clip is drawn. The clip and its scrim are now **layers filling the section** (new pin `fill`: absolutely placed, `width`/`height: 100%`, `z-index: -1`, with the section isolated), under the text.
           │ 
           │ This hero is shaped like that, but differently from the case BUG-355 fixed:
           │ - section `hero`: `composition: overlay`, `width: bleed`;
           │ - child 0: a `video` with **a stated height of 720px** (`sizing.height: fixed 720`), `objectFit: cover`;
           │ - child 1: the text group, **itself placed `absolute`** (`geometry` keyframes, with its own top-to-transparent gradient), plus a kicker, a display title and a button.
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket update BUG-365 --status free_coding 2>&1 | tail -3; xgd branch c…
<!-- xgd-tool name="Bash" id="toolu_01RrSGjKNyoyxotJXioiKfwN" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:16:06.329013+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket update BUG-365 --status free_coding 2>&1 | tail -3; xgd branch cut BUG-365 2>&1 | tail -5","description":"Set free_coding and cut branch"}
```

**Result**

```
xgd: error: unrecognized arguments: --status free_coding
Try 'xgd --help' for available commands.
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:16:07
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:16:07
[15:16:07] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'branch', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'branch', 'cut', 'BUG-365'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
[15:16:08] │ Error: Ticket 'BUG-365' not found
[15:16:08] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'failure', 'command': 'branch'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:16:08
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xg…
<!-- xgd-tool name="Bash" id="toolu_01Fv5HxkHXAT9y8DrnWuddRf" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:16:16.079828+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-ticket-cli-quirks.md | head -60; xgd ticket update --help 2>&1 | grep -v \"^\\[\" | head -30","description":"Read CLI quirks memory and update help"}
```

**Result**

```
---
name: xgd-ticket-cli-quirks
description: "Hub of xgd ticket/report/branch CLI behaviours that surprise: stores, flags, bodies, the free_coded gate."
metadata:
  node_type: memory
  type: reference
  originSessionId: cbdeb153-884f-4f2d-86ad-5f9023f6778e
  modified: 2026-10-25T18:11:18.467Z
---

xgd ticket CLI quirks. Each entry is its own memory:

- [[xgd-body-frozen-past-ready-to-reconcile]] — Body frozen past ready_to_reconcile: update/append refuse silently.
- [[xgd-cross-repo-tickets]] — XGD cross-repo tickets: `cd` doesn't switch stores; set `XGD_PROJECT_ROOT`.
- [[xgd-append-list-stringifies-json]] — xgd --append-list stringifies JSON: a structured commits entry lands as a string.
- [[xgd-ticket-json-shape]] — XGD ticket JSON shape: `--json` lists under `items`.
- [[never-edit-ticket-files-directly]] — Never edit ticket files directly: rewrites carry stale frontmatter back.
- [[xgd-bulk-read-ticket-fields]] — Bulk-read ticket fields: `list --view --flags frontmatter,fields`.
- [[ticket-bodies-readable-on-disk]] — Ticket bodies readable on disk: `.xgd/tickets/hot/<uid>.md`.
- [[xgd-body-file-path-from-worktree]] — --body-file path from a worktree: relative paths resolve against the main root.
- [[version-claimed-by-another-ticket]] — Version claimed by another ticket: the gate refuses a duplicate version.
- [[free-coded-version-gate-race]] — free_coded version gate race: omit `--version`; the gate bumps itself (worked first try again on 2026-10-21, REQ-424).
- [[xgd-create-succeeds-silently]] — xgd create succeeds silently: a blind retry files a duplicate.
- [[xgd-report-create-subject-kind-flags]] — report create --subject/--kind are flags: not inside `--fields`.
- [[xgd-report-create-skips-commit-during-cherry-pick]] — report create skips commit mid-cherry-pick: won't perturb CHERRY_PICK_HEAD.
- [[xgd-append-body-takes-a-string]] — append-body takes a string: `--append-body --body-file -` appends nothing; `--append-body -` appends a literal "-".
- [[branch-lock-prints-missing-rematerialize-path]] — Branch lock rematerialize path is missing: use `xgd ticket-store rematerialize`.
- [[xgd-doc-kind-required]] — doc create needs doc_kind: closed enum; research docs go in `architecture`, not project_context/system_kb.
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:16:17
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
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket update bug-313c192b --fields '{"status":"free_coding"}' 2>&1 | g…
<!-- xgd-tool name="Bash" id="toolu_011scHtwfpYJdNZZkAaw6f4L" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:16:20.811317+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket update bug-313c192b --fields '{\"status\":\"free_coding\"}' 2>&1 | grep -i -E \"error|status|updated\" | head; xgd branch cut bug-313c192b 2>&1 | grep -v cli_command | tail -6","description":"Set free_coding and cut branch by uid"}
```

**Result**

```
[15:16:21] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'ticket', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'ticket', 'update', 'bug-313c192b', '--fields', '{"status":"free_coding"}'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
[15:16:22] │ Updated bug: BUG-365 (bug-313c192b)
[15:16:22] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'ticket'}
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:16:22
Created worktree for free-BUG-365 at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365
cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:16:27
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; ls node_modules 2>/dev/null…
<!-- xgd-tool name="Bash" id="toolu_01KYHGrvaFEDbx9eKsRYHuEw" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:16:32.525600+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; ls node_modules 2>/dev/null | head -2; cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/worktree-and-store-setup.md | sed -n 1,40p","description":"Check worktree deps and setup memory"}
```

**Result**

```
@cloudflare
@vitest
---
name: worktree-and-store-setup
description: "Hub for making a fresh xgd worktree runnable: generated artifacts, the shared @lagrangefoundry store, installs and baselines."
metadata:
  node_type: memory
  type: reference
  originSessionId: cbdeb153-884f-4f2d-86ad-5f9023f6778e
  modified: 2026-10-21T22:36:24.899Z
---

Worktree and shared-store setup. Each entry is its own memory:

- [[pnpm-install-blocked-by-idea-dir]] — pnpm install blocked by .idea dir: sandbox denies `.idea`; iconv-lite ships one.
- [[worktree-breaks-webui-resolution]] — Worktree breaks webui resolution: builder/webui 404s and workerd import death are location artifacts.
- [[shared-node-modules-outside-sandbox]] — Shared node_modules outside sandbox: `bin/install` can't write the shared store.
- [[pnpm-store-closure-from-main-checkout]] — pnpm store closure from main checkout: a missing declared package needs no network.
- [[unpinned-shared-store-drifts]] — Unpinned shared store drifts: `@lagrangefoundry/*` isn't in the lockfile.
- [[reference-bundles-are-gitignored]] — Reference bundles are gitignored: real-bundle UATs skip in every worktree.
- [[shadow-shared-store-to-verify-upstream]] — Shadow the shared store: stage into 1stcontact/node_modules, then delete.
- [[repair-stale-worktree-install-by-hand]] — Repair a stale worktree install by hand: worktree sits at the branch's lockfile.
- [[baseline-real-bundle-tests-in-place]] — Baseline real-bundle tests in place: revert your files in the main checkout instead.
- [[fresh-worktree-lacks-control-app-generated]] — Fresh worktree lacks control-app generated: "0 test" is a missing artifact.
- [[patch-swap-baseline-needs-exclude]] — Patch-swap baseline needs --exclude: git apply is atomic; module-assets/tests hunks make it silently refuse.
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; cat ~/.claude-2/projects/-Us…
<!-- xgd-tool name="Bash" id="toolu_01FyWFiYPvh9heFCwbc3NvsF" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:16:36.253661+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; cat ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/full-suite-in-foreground-batches.md | sed -n 5,30p; ls bin | head -30","description":"Check how tests are run"}
```

**Result**

```
  node_type: memory
  type: feedback
  originSessionId: 0f7c12fe-1658-4e26-9b23-c89f4f986527
  modified: 2026-11-05T03:56:02.125Z
---

`nohup sh -c 'vitest run …' & disown` exits 1 immediately with an empty log (and `nice(5) failed`). The whole node project doesn't fit one 600s foreground call either.

**Why:** REQ-383 (2026-10-04) — the detached run produced nothing. Three foreground batches did: the non-`test_UAT` files, then `test_UAT*` split at 310 files. Each ran in under 590s.

**How to apply:** `timeout 590 node_modules/.bin/vitest run --project node --reporter=json --outputFile=$TMPDIR/x.json <files>`, then `jq` the failed names. Check each failure against base by running the same files in the main checkout. Port (EADDRINUSE 8790) and load flakes pass when rerun alone.

**2026-11-05 (REQ-638): the suite has grown.** Node UATs now need chunks of about 55 files, and the workers project four chunks of about 103. `test_UAT_FC_REQ-646_agent_compute_in_containers` hangs in the sandbox (on the base too), so leave it out of a chunk or it eats the whole timeout. Guard every baseline run with `[ -s list ] &&`: an empty `$(cat list)` runs the WHOLE suite. For a clean baseline, use a detached worktree at the base commit, set up exactly like the branch's (same node_modules links), not the main checkout. Related: [[dont-ask-blocks-loops-and-test-runners]], [[vitest-long-filter-finds-nothing]], [[zsh-unquoted-file-list-matches-nothing]].
1c
access-sim
access-token
build
copy-from-cloud
copy-repro-to-dev
copy-site
copy-to-cloud
deploy
deploy.d
dev
kb-release
migration-manifest
platform-route
project
repro-console
repro-rail
seed
smoke
verify_req100_reveal.mjs
verify_req108_pointer.mjs
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; grep -n "gradient" packages/…
<!-- xgd-tool name="Bash" id="toolu_01A57QomzoqoqoYTTNUMmwza" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:16:42.063115+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; grep -n \"gradient\" packages/site-schema/src/l1/schema.ts | head -12; grep -n \"L1_OVERLAY_SCRIM =\" -A5 packages/site-schema/src/l1/*.ts; grep -n \"l1GeometrySchema = \" -A30 packages/site-schema/src/l1/schema.ts | head -50","description":"Find gradient axis, scrim and geometry schema"}
```

**Result**

```
463:// Each captured pixel-mover that is not a plain scalar (gradient, shadow, border,
468:/** A gradient colour stop — a hex colour at an optional 0..100% offset. */
477: * REQ-103 — where a radial gradient's centre sits. A closed set of the nine box
493:/** REQ-103 — how far a radial gradient's final stop reaches (CSS `<extent-keyword>`). */
502: * A linear gradient — typed structured form (mirrors the capture `TextGradient`).
504: * Used for text-fill gradients and surface/panel gradients alike.
507: * so linear is what a gradient is when it does not say otherwise. That is not a
509: * every folded gradient would have to restate is noise on the overwhelmingly
521: * REQ-103 — a radial gradient: the soft glow behind a headline, which is the most
523: * at all while L1's only gradient was linear.
527: * into a gradient that means nothing — a radial with an angle is rejected by the
539:/** A gradient fill — linear (the default) or radial (REQ-103). */
packages/site-schema/src/l1/design.ts:751:export const L1_OVERLAY_SCRIM = { color: '#000000', opacity: 0.55 } as const
packages/site-schema/src/l1/design.ts-752-const OVERLAY_INK = '#ffffff'
packages/site-schema/src/l1/design.ts-753-
packages/site-schema/src/l1/design.ts-754-/** The gap a composition spaces its parts by: the grid's gap, else the block gap. */
packages/site-schema/src/l1/design.ts-755-function compositionGap(design: L1Design): Json {
packages/site-schema/src/l1/design.ts-756-  const step = design.layout?.grid?.gap ?? design.space?.blockGap
308:export const l1GeometrySchema = z
309-  .object({
310-    keyframes: z.array(l1KeyframeSchema).min(1),
311-    segments: z.array(l1SegmentSchema).optional(),
312-    /**
313-     * REQ-278 — the frame the keyframes are measured against. Absent means
314-     * `absolute`, so every document folded before this axis existed is unchanged.
315-     */
316-    place: l1PlacementSchema.optional(),
317-    /**
318-     * REQ-88 — when present (and the document declares a `column`), `x` and
319-     * `width` come from the column function rather than the keyframe track. `y`
320-     * always stays keyframed: vertical position is the cumulative integral of
321-     * everything above it and has no closed form.
322-     */
323-    anchor: l1ColumnAnchorSchema.optional(),
324-  })
325-  .strict()
326-
327-// ── Structure primitives (capture leaves empty; the AI recovers) ──────────────
328-
329-/**
330- * Per-axis sizing intent: a fixed px, fluid (fill), or hug (fit-content).
331- *
332- * BUG-133 — **`fluid` means fill, and what "fill" compiles to depends on which
333- * axis the PARENT made this one.** A width fills the same way everywhere: a
334- * block's containing width is definite, so it is a percentage of it. A height
335- * does not, because a flex row's height is indefinite until its own content has
336- * been laid out:
337- *
338- * - under a `row` or a `grid`, height is the parent's cross/block axis, and a
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; sed -n 280,307p packages/sit…
<!-- xgd-tool name="Bash" id="toolu_011ZvH4DaYWjyvkDgRJfrR2x" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:16:46.093755+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; sed -n 280,307p packages/site-schema/src/l1/schema.ts; sed -n 500,545p packages/site-schema/src/l1/schema.ts; grep -n \"surfaceGradient\\|backgroundGradient\" packages/site-schema/src/l1/schema.ts | head -5","description":"Read keyframe and gradient schemas"}
```

**Result**

```
 * ancestor, `width`/`height` its extent. This is the transcription face: it
 * reproduces a capture exactly and is fragile by construction, because a run
 * that wraps one line more than the capture did lands on its neighbour.
 *
 * `flow` keeps the node IN its parent's flow and reads the same four numbers as
 * **leading offsets from the flow cursor** — `x`/`y` are `margin-left`/
 * `margin-top`, `width` is still the node's width, and `height` is emitted only
 * where the keyframe carries one (a leaf image or box); a node whose height is
 * its content's takes it from the content, which is the entire point. The CSS
 * distinction is exactly the one the two names carry: `left`/`top` place a box
 * that has left the flow, margins place one that has not.
 *
 * Both modes reproduce the capture at the sampled widths — a leading offset
 * measured from the previous sibling's captured bottom puts the node exactly
 * where it was captured. They differ in what happens when the content is NOT the
 * captured content: an `absolute` sibling stays put and is overrun, a `flow`
 * sibling is pushed down. So `flow` is what {@link module:probes.promoteToFlow}
 * writes when it recovers a colliding region, and it is what lets that recovery
 * keep the horizontal geometry — the width and the position within the row —
 * that made the region a grid rather than a pile of full-bleed stacked rows.
 */
export const l1PlacementSchema = z.enum(['absolute', 'flow'])

/**
 * A geometry track: keyframes sorted ascending by `at`, plus an optional
 * per-segment interpolation flag (length `keyframes.length - 1`). Absent segment
 * flags default to `interpolate` for every segment.
 */

/**
 * A linear gradient — typed structured form (mirrors the capture `TextGradient`).
 * `angleDeg` is a CSS angle (0 = to-top, 90 = to-right); absent → default `180deg`.
 * Used for text-fill gradients and surface/panel gradients alike.
 *
 * REQ-103 — `kind` is optional here and required on {@link l1RadialGradientSchema},
 * so linear is what a gradient is when it does not say otherwise. That is not a
 * compatibility shim: linear is the shape a capture folds to, and a discriminator
 * every folded gradient would have to restate is noise on the overwhelmingly
 * common case.
 */
export const l1LinearGradientSchema = z
  .object({
    kind: z.literal('linear').optional(),
    angleDeg: finite.optional(),
    stops: z.array(l1GradientStopSchema).min(2),
  })
  .strict()

/**
 * REQ-103 — a radial gradient: the soft glow behind a headline, which is the most
 * common single device in dark-theme marketing design and had no representation
 * at all while L1's only gradient was linear.
 *
 * The axes a radial has and a linear does not (`origin`, `extent`) live only on
 * this branch, and `angleDeg` lives only on the other, so the two cannot be mixed
 * into a gradient that means nothing — a radial with an angle is rejected by the
 * schema rather than silently ignored by the renderer.
 */
export const l1RadialGradientSchema = z
  .object({
    kind: z.literal('radial'),
    origin: l1GradientOriginSchema.optional(),
    extent: l1GradientExtentSchema.optional(),
    stops: z.array(l1GradientStopSchema).min(2),
  })
  .strict()

/** A gradient fill — linear (the default) or radial (REQ-103). */
export const l1GradientSchema = z.union([l1LinearGradientSchema, l1RadialGradientSchema])

/** A drop shadow — structured (offset / blur / spread / colour / inset), never raw CSS. */
export const l1ShadowSchema = z
  .object({
    offsetXPx: finite,
998:  surfaceGradient: l1GradientSchema.optional(),
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; sed -n 465,476p packages/sit…
<!-- xgd-tool name="Bash" id="toolu_01Jf6Haee23K1uiJZU8Ljuhh" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:16:50.567253+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; sed -n 465,476p packages/site-schema/src/l1/schema.ts; grep -n \"l1KeyframeSchema = \" -A14 packages/site-schema/src/l1/schema.ts","description":"Read gradient stop and keyframe schemas"}
```

**Result**

```
// string. The renderer re-derives the CSS from these numeric/enum/hex fields, so
// no instance value ever becomes raw CSS.

/** A gradient colour stop — a hex colour at an optional 0..100% offset. */
export const l1GradientStopSchema = z
  .object({
    color: l1Color,
    position: finite.min(0).max(100).optional(),
  })
  .strict()

/**
177:export const l1KeyframeSchema = z
178-  .object({
179-    at: finite.nonnegative(),
180-    x: finite,
181-    y: finite,
182-    width: finite.nonnegative(),
183-    height: finite.nonnegative().optional(),
184-    /**
185-     * REQ-88 — the viewport HEIGHT this keyframe was captured at. Inert on its
186-     * own; it is the origin {@link l1ViewportResponseSchema} measures from, so a
187-     * height-responsive node still evaluates to exactly its captured geometry at
188-     * the size the capture used. Absent on documents folded before height probing.
189-     */
190-    atHeight: finite.positive().optional(),
191-    /** REQ-88 / REQ-351 — how `y` / `height` track the viewport height AT THIS WIDTH. */
```

## Write /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/test_UAT_FC_BUG-365_overla…
<!-- xgd-tool name="Write" id="toolu_01JNttFYrZ19Mn2RMBANsGH4" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:17:20.631999+00:00" -->

**Input**

```json
{"content":"/**\n * [[BUG-365]] — a shop's home-page hero, composed `overlay`, whose picture is a\n * clip with a stated height (720px, `objectFit: cover`) and whose text group is\n * itself placed absolutely over it (geometry keyframes, its own top-to-clear\n * gradient), went to about half its height and much darker with no edit to the\n * page: BUG-355 turned every overlay clip into a layer filling the section, so\n * the clip stopped giving the section its height, the section shrank to what was\n * left in flow (nothing, the text being placed too), and a scrim the hero never\n * had was laid over it.\n *\n * - A hero whose text is already placed over its clip was not broken, and is left\n *   as built: it renders exactly as it did before BUG-355.\n * - A hero whose text is in flow (BUG-355's case) still gets its text over the\n *   clip, and the section keeps the height its clip states as a minimum.\n *\n * Pages are L1 documents rendered by the real renderer and laid out by a real\n * Chromium.\n */\nimport { describe, expect, it } from 'vitest'\nimport { composeL1Page, validateL1, type L1Design, type L1Document, type L1Node } from '../packages/site-schema/src/index'\nimport { renderL1Page } from '../packages/framework/src/index'\nimport { engineAvailable } from '../tools/generate/src'\nimport { launchAnyChromium, loadChromium } from './support/chromium'\n\nconst browserOk = await engineAvailable('chromium')\nconst chromium = await loadChromium()\n\nconst DESIGN = {\n  space: { scale: { xs: 8, md: 16, lg: 24, xl: 48, '2xl': 64 }, blockGap: 'md' },\n  layout: { compositions: ['overlay'], contentWidth: 1160, gutter: 24 },\n} as L1Design\n\nconst WIDTHS = [375, 768, 1280]\n\nconst run = (t: string, extra: Record<string, unknown> = {}): L1Node =>\n  ({ kind: 'text', text: t, axes: { color: '#ffffff', fontFamily: 'Arial', fontSizePx: 18 }, ...extra }) as L1Node\n\nconst clip = (extra: Record<string, unknown> = {}): L1Node =>\n  ({\n    kind: 'video',\n    id: 'hero-clip',\n    src: '/assets/clip.webm',\n    poster: '/assets/poster.svg',\n    alt: 'Fresh bread on a counter',\n    playback: 'loop',\n    sizing: { width: { mode: 'fluid' }, height: { mode: 'fixed', px: 720 } },\n    axes: { objectFit: 'cover' },\n    ...extra,\n  }) as L1Node\n\n/** The shop's hero: a 720px clip, and a text group placed over it with its own gradient. */\nconst PLACED_HERO: L1Node = {\n  kind: 'container',\n  id: 'hero',\n  layout: 'stack',\n  width: 'bleed',\n  composition: 'overlay',\n  children: [\n    clip(),\n    {\n      kind: 'container',\n      id: 'hero-copy',\n      layout: 'stack',\n      gapPx: 16,\n      padding: { topPx: 32, bottomPx: 32, leftPx: 24, rightPx: 24 },\n      geometry: { keyframes: WIDTHS.map((at) => ({ at, x: 0, y: 0, width: at, height: 360 })) },\n      axes: { surfaceGradient: { angleDeg: 180, stops: [{ color: '#00000080', position: 0 }, { color: '#00000000', position: 100 }] } },\n      children: [\n        run('New this week', { id: 'hero-kicker' }),\n        run('Bread, baked at dawn', { id: 'hero-title', role: 'display' }),\n        run('Shop the bakery', {\n          id: 'hero-shop',\n          link: { href: '/shop' },\n          padding: { topPx: 12, bottomPx: 12, leftPx: 24, rightPx: 24 },\n          axes: { color: '#111827', fontFamily: 'Arial', fontSizePx: 18, surfaceFill: '#f2b630' },\n        }),\n      ],\n    },\n  ],\n} as L1Node\n\n/** BUG-355's hero: the same clip, its text in flow after it. */\nconst FLOWING_HERO: L1Node = {\n  kind: 'container',\n  id: 'hero',\n  layout: 'stack',\n  width: 'bleed',\n  composition: 'overlay',\n  children: [\n    clip(),\n    {\n      kind: 'container',\n      id: 'hero-copy',\n      layout: 'stack',\n      gapPx: 16,\n      children: [run('Bread, baked at dawn', { id: 'hero-title', heading: { level: 1 } }), run('Every loaf, every morning.')],\n    },\n  ],\n} as L1Node\n\nconst AFTER: L1Node = {\n  kind: 'container',\n  id: 'after',\n  layout: 'stack',\n  padding: { topPx: 40, bottomPx: 40, leftPx: 40, rightPx: 40 },\n  children: [{ kind: 'text', text: 'Open every day from seven.', axes: { color: '#111827', fontFamily: 'Arial', fontSizePx: 18 } }],\n} as L1Node\n\nconst page = (hero: L1Node): L1Document =>\n  ({ widths: WIDTHS, background: '#ffffff', root: { kind: 'container', layout: 'stack', gapPx: 0, children: [hero, AFTER] } }) as L1Document\n\nfunction html(doc: L1Document): string {\n  const result = validateL1(doc, { design: DESIGN })\n  expect(result.ok, JSON.stringify(result)).toBe(true)\n  return renderL1Page(doc, 'home', {}, { design: DESIGN })\n}\n\nasync function laidOut<T>(markup: string, width: number, measure: () => T): Promise<T> {\n  const browser = await launchAnyChromium(chromium!)\n  if (!browser) throw new Error('no Chromium could start')\n  try {\n    const tab = await browser.newPage({ viewport: { width, height: 900 } })\n    await tab.setContent(markup)\n    return (await tab.evaluate(measure)) as T\n  } finally {\n    await browser.close()\n  }\n}\n\nfunction measure() {\n  const box = (id: string) => {\n    const r = document.getElementById(id)!.getBoundingClientRect()\n    return { top: r.top, bottom: r.bottom, height: r.height }\n  }\n  const hero = document.getElementById('hero')!\n  const title = document.getElementById('hero-title')!.getBoundingClientRect()\n  const top = document.elementFromPoint((title.left + title.right) / 2, (title.top + title.bottom) / 2)\n  // Any layer laid over the hero that paints a shade: a scrim.\n  const scrims = Array.from(hero.querySelectorAll('*')).filter((el) => {\n    const s = getComputedStyle(el)\n    return el.id !== 'hero-copy' && (/gradient/.test(s.backgroundImage) || s.backgroundColor === 'rgba(0, 0, 0, 0.55)')\n  })\n  return {\n    hero: box('hero'),\n    cli
```

[elided — kept 5800 of 8707 bytes]

**Result**

```
File created successfully at: /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts (file state is current in your context — no need to Read it back)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; grep -n "export function com…
<!-- xgd-tool name="Bash" id="toolu_01M81B4xz9mUJWMPFWmjH8We" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:17:25.816803+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; grep -n \"export function composeL1Page\\|export.*compose\" packages/site-schema/src/l1/design.ts packages/site-schema/src/index.ts | head; grep -n \"surfaceGradient\" packages/site-schema/src/l1/schema.ts | head -3","description":"Find exported compose function"}
```

**Result**

```
998:  surfaceGradient: l1GradientSchema.optional(),
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; sed -n 955,1000p packages/si…
<!-- xgd-tool name="Bash" id="toolu_01HCdggdsrCRqgC6uzhcHoYA" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:17:29.347048+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; sed -n 955,1000p packages/site-schema/src/l1/design.ts; grep -n \"composeSections\\|composePage\\|^export function\" packages/site-schema/src/l1/design.ts | head -30","description":"Find where compositions are applied"}
```

**Result**

```
  if (!isRecord(node)) return undefined
  if (node.kind === 'image' || node.kind === 'video') return node
  return findPicture(node.children)
}

/** [[REQ-463]] — a page's top-level sections, each laid out by the composition it names, consecutive splits alternating sides. */
function composeSections(sections: Json[], design: L1Design): Json[] {
  const listed = design.layout?.compositions ?? []
  let run = 0
  return sections.map((section) => {
    const name = section.composition as L1Composition | undefined
    if (!isGroup(section) || name === undefined || !listed.includes(name) || section.geometry !== undefined) {
      run = 0
      return section
    }
    const flip = name === 'split' && run % 2 === 1
    run = name === 'split' ? run + 1 : 0
    return composeSection(section, name, design, flip)
  })
}

/** Text a reader reads in lines: a run with no role, or a body, lead or quote one. */
const RUNNING_ROLES: ReadonlySet<unknown> = new Set([undefined, 'body', 'lead', 'quote'])

/**
 * [[REQ-463]] — RUNNING TEXT SETS AT THE TEXT MEASURE BY DEFAULT: on a page, a run
 * that reads in lines ({@link RUNNING_ROLES}), is no component, link or heading,
 * and sizes or places itself in no other way, takes `width: "text"` when the
 * design states `layout.textWidth`.
 */
function applyTextMeasure(input: unknown, design: L1Design, place: L1DesignPlace): unknown {
  if (design.layout?.textWidth === undefined || place.part) return input
  const running = (n: Json): boolean =>
    n.kind === 'text' &&
    RUNNING_ROLES.has(n.role) &&
    n.component === undefined &&
    n.link === undefined &&
    n.action === undefined &&
    n.heading === undefined &&
    n.width === undefined &&
    n.geometry === undefined &&
    n.frames === undefined &&
    !(isRecord(n.sizing) && n.sizing.width !== undefined)
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk)
    if (!isRecord(v)) return v
65:export function l1LengthAt(length: L1DesignLength, width: number): number {
70:export function l1ScalarAt(track: L1ScalarTrack, width: number): number {
314:export function l1ContrastRatio(a: string, b: string): number {
327:export function l1DesignIssues(design: L1Design, palette?: L1Palette): L1DesignIssue[] {
529:export function l1HalfColumnPx(design: L1Design, width: number): number | undefined {
540:export function l1HeadingMaxPx(design: L1Design, role: L1TypeRole, width: number): number | undefined {
560:export function l1DesignMissing(design: L1Design | undefined): L1DesignIssue[] {
652:export function l1DanglingDesignRefs(input: unknown, design: L1Design | undefined, base = ''): L1DesignDangling[] {
726:    const composed = sections && !place.part ? composeSections(sections, design) : sections
961:function composeSections(sections: Json[], design: L1Design): Json[] {
1025:export function l1LogoPath(input: unknown, base = ''): string | null {
1348:export function l1PaintsABox(node: { axes?: unknown }): boolean {
1406:export function resolveL1Design<T>(input: T, design: L1Design | undefined, place: L1DesignPlace = {}): T {
1452:export function l1PageOffSystemCount(page: { l1?: unknown; modules?: unknown; kind?: unknown }, design: L1Design | undefined): number {
1457:export function l1PlaceOf(page: { kind?: unknown } | undefined): L1DesignPlace {
1483:export function l1OffSystemValues(input: unknown, design: L1Design | undefined, base = '', place: L1DesignPlace = {}): L1OffSystemValue[] {
1555:export function l1OnSystemValues(input: unknown, base = ''): L1OnSystemValue[] {
1595:export function l1DesignVariables(design: L1Design | undefined): L1DesignVariable[] {
1614:export function l1SpacePx(design: L1Design | undefined, step: L1SpaceStep, width: number): number {
1632:export function l1DesignAspect(design: L1Design | undefined, aspect: L1AspectName): { w: number; h: number } | undefined {
1637:export function l1AspectRatio(design: L1Design | undefined, aspect: L1AspectName): number | undefined {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; python3 - <<'EOF' p='tests/t…
<!-- xgd-tool name="Bash" id="toolu_01E9Mi9Bz1Mc3gLJBZqr6QRe" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:17:38.857076+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; python3 - <<'EOF'\np='tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts'\ns=open(p).read()\nold=s[s.index(\"  it('test_UAT_FC_BUG_365_a_hero_whose_text_is_placed\"):s.index(\"  it.skipIf(!browserOk || !chromium)(\\n    'test_UAT_FC_BUG_365_a_720px\")]\nnew='''  it('test_UAT_FC_BUG_365_a_hero_whose_text_is_placed_over_its_clip_is_left_as_built', () => {\n    // Composed `overlay`, it renders exactly as the same hero composed by nothing.\n    const { composition: _c, ...asBuilt } = PLACED_HERO as unknown as Record<string, unknown>\n    expect(html(page(PLACED_HERO))).toBe(html(page(asBuilt as unknown as L1Node)))\n  })\n\n'''\ns=s.replace(old,new).replace(\"import { composeL1Page, validateL1,\",\"import { validateL1,\")\nopen(p,'w').write(s)\nEOF\ntimeout 400 node_modules/.bin/vitest run --project node tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts 2>&1 | grep -v \"^ *at \" | tail -40","description":"Rewrite first test and run RED"}
```

**Result**

```
\x1b[33m▲ \x1b[43;33m[\x1b[43;30mWARNING\x1b[43;33m]\x1b[0m \x1b[1mProxy environment variables detected. We'll use your proxy for fetch requests.\x1b[0m



 RUN  v4.1.9 /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365

 ❯ |node| tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  |node| tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts [ tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts ]
Error: Cannot find module './generated/ticketing' imported from /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/apps/control-app/src/material.ts
 ❯ apps/control-app/src/material.ts:42:1
     40|  */
     41|
     42| import { MAX_BLOB_BYTES } from './generated/ticketing'
       | ^
     43| import {
     44|   assetHandle,
 ❯ apps/control-app/src/capture-material.ts:43:1

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  no tests
   Start at  15:17:42
   Duration  1.79s (transform 1.25s, setup 0ms, import 0ms, tests 0ms, environment 0ms)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; M=/Users/martin/lagrangefoun…
<!-- xgd-tool name="Bash" id="toolu_01TN1ufKU8Sv2nXo8G1fDDSH" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:17:49.649195+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; M=/Users/martin/lagrangefoundry/1stcontact; for d in $(cd $M && find apps packages tools -type d -name generated -not -path \"*/node_modules/*\"); do [ -d \"$d\" ] && [ \"$(ls -A $d 2>/dev/null)\" ] || { mkdir -p \"$d\"; cp -R \"$M/$d/.\" \"$d/\"; echo copied $d; }; done; git status --short | head","description":"Copy generated dirs from main checkout"}
```

**Result**

```
copied apps/control-app/src/generated
?? tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; timeout 400 node_modules/.bi…
<!-- xgd-tool name="Bash" id="toolu_01SH3es6wP8iXfn5LmQhdWJB" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:17:53.782538+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; timeout 400 node_modules/.bin/vitest run --project node tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts 2>&1 | grep -E \"✓|×|FAIL|AssertionError|Expected|Received|hero height|Tests \" | head -30","description":"Run RED test"}
```

**Result**

```
     × test_UAT_FC_BUG_365_a_hero_whose_text_is_placed_over_its_clip_is_left_as_built 16ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  |node| tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts > BUG-365 — an overlay hero over a clip keeps its height and its shade > test_UAT_FC_BUG_365_a_hero_whose_text_is_placed_over_its_clip_is_left_as_built
AssertionError: {"ok":false,"errors":[{"path":"/root/children/0/children/1/children/1/role","message":"a design reference must name something the design of the site defines: the type role 'display' is not in the site's design"}]}: expected false to be true // Object.is equality
- Expected
+ Received
      Tests  1 failed | 2 skipped (3)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; sed -i '' "s/{ id: 'hero-tit…
<!-- xgd-tool name="Bash" id="toolu_01M3fbF7zygUAqHQmYsEBkAB" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:18:04.240599+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; sed -i '' \"s/{ id: 'hero-title', role: 'display' }/{ id: 'hero-title', heading: { level: 1 } }/\" tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts; grep -l \"chromium\\|playwright\" ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/*.md | head; timeout 400 node_modules/.bin/vitest run --project node tests/test_UAT_FC_BUG-355_overlay_clip_and_stated_columns.test.ts 2>&1 | grep -E \"✓|×|↓|Tests \" | head","description":"Fix role, check chromium availability via BUG-355 test"}
```

**Result**

```
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/1c-not-on-path-use-node-bin.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/a-200-font-can-still-be-refused.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/chromium-blocked-by-mach-bootstrap.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/chromium-cannot-launch-in-sandbox.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/layout-fixture-needs-two-sections.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/MEMORY.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/npx-finds-python-playwright.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/offline-l1-probe-harness.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/old-code-baseline-in-tmpdir.md
/Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/real-http-server-for-chromium-tests.md
      Tests  6 skipped (6)
[This command modified 1 file you've previously read: tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts. Call Read before editing.]
```

## Bash sed -n 5,40p ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/chromium-cannot-launch-in-sandbox.md;…
<!-- xgd-tool name="Bash" id="toolu_013EjLU5QopGevWiKzJZbKDz" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:18:14.095741+00:00" -->

**Input**

```json
{"command":"sed -n 5,40p ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/chromium-cannot-launch-in-sandbox.md; sed -n 5,30p ~/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/chromium-blocked-by-mach-bootstrap.md","description":"Read chromium sandbox memories"}
```

**Result**

```
  node_type: memory
  type: reference
  originSessionId: c4822f19-7247-422a-aad5-e2d3b002a761
  modified: 2026-11-03T01:26:10.355Z
---

Inside the agent's Bash sandbox, Playwright's `chrome-headless-shell` dies at launch with `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer…: Permission denied (1100)`, which surfaces as `browserType.launch: Target page, context or browser has been closed`. The layout checker, the screenshot helpers and the builder's camera all fail silently or as caught errors.

**The exact cause (re-probed 2026-11-02):** `bootstrap_check_in` is a Seatbelt **mach-register** (publishing a Mach service), not a mach-lookup. The interactive role's `mach_lookup: 'on'` (permissions.yaml, BUG-1202 → `allowMachLookup: ["*"]`) does NOT cover it, and the probe still fails with it on. The full fix is to run browser tests outside the sandbox through a narrow `sandbox.excluded_commands` entry in main's `.xgd/permissions.yaml` (operator-owned, self-protected). `--single-process` is only the degraded workaround.

**Why:** found in REQ-452 (2026-10-24) when `1c eval-builder run`'s layout check returned `{}`, which read as "zero findings".

**But `launchAnyChromium` from `tests/support/chromium.ts` does start** (its degraded single-process fallback), so REQ-447-style rendered checks run in the sandbox. To run a `checkLayoutAt` check here, hand it a driver factory built on `launchAnyChromium` (`navigate`/`query`/`close`) in a throwaway test file (REQ-456, 2026-10-24).

**Simpler, and covers the `engineAvailable('chromium')`-gated suites too (which otherwise skip silently):** `export CHROMIUM_LAUNCH_ARGS=--single-process` before `vitest run`. `browserLaunchOptions` reads it, so `engineAvailable` and `createPlaywrightDriver` both launch. Used for BUG-281 (2026-10-25) across all 22 gated layout suites. Several of those (REQ-415, REQ-418, BUG-237, BUG-276) were already red on clean working from `edge_distance`, so baseline before blaming a diff.

**External sites still fail:** with `--single-process`, `1c capture page <live url>` launches but navigation gets `net::ERR_ACCESS_DENIED`, because Chromium bypasses the sandbox's HTTP proxy. Live-site captures go to the operator (2026-10-25, DOC-69).

**One context per browser in the degraded mode.** A `--single-process` browser from `launchAnyChromium` dies (SIGTRAP, "Target page, context or browser has been closed") on the SECOND `newContext()`/`newPage()` once the first context has closed. Probe once at collection, then launch a fresh browser per test and close the browser rather than the context (BUG-299, 2026-10-26).

**WebKit doesn't run here at all.** 1st Contact's Playwright 1.61 wants `webkit-2311`, which isn't installed. The xgd venv's Python Playwright 1.62 driver (`xgd/.venv-working/lib/python3.12/site-packages/playwright/driver/package`, requirable from Node) matches the installed `webkit-2336` and launches, but `newPage()` always fails with "Target page, context or browser has been closed" and logs nothing. Safari-only bugs go to the operator (BUG-321, 2026-10-31). For a caret check in Chromium, compare `el.screenshot({caret:'initial'})` against `{caret:'hide'}`. A collapsed Range before a `<br>` has no client rects, so measuring the Range reads 0 whether or not a caret is drawn.

**How to apply:** don't treat an empty layout or picture result from a sandboxed run as evidence. Hand browser-path verification to the operator, and make code report "not looked" (null plus a note) rather than an empty count. Related: [[slow-tools-not-enabled-without-browser]].
  node_type: memory
  type: project
  originSessionId: afda79a1-9917-40b9-bcef-5ad1a74069c3
  modified: 2026-10-23T23:11:15.882Z
---

`chromiumAvailable()` (`tools/generate/src/cli/capture/playwright-driver.ts:281`)
returns false under this session's sandbox, and every `it.runIf(browserOk)` leg
skips. Two independent causes, neither of them "no browser installed":

1. **The seatbelt profile denies Chromium's Mach bootstrap.** The binary launches
   and dies at once:
   `FATAL:base/apple/mach_port_rendezvous_mac.cc:159] Check failed: kr == KERN_SUCCESS.`
   `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer.<pid>: Permission denied (1100)`
   → `<process did exit: exitCode=null, signal=SIGTRAP>`. No flag, build or
   `PLAYWRIGHT_BROWSERS_PATH` shim gets past it.
2. **A build-number pin.** `~/Library/Caches/ms-playwright/` holds
   `chromium-1234` / `chromium_headless_shell-1234`; the repo's `playwright@1.61.1`
   wants **1228**, so the default resolve fails first with "Executable doesn't
   exist … chromium_headless_shell-1228". `npx playwright install` would fix the
   pin but `npx` is denied ([[dont-ask-blocks-loops-and-test-runners]]) and the
   network allowlist is empty.

**Why:** it looks like a provisioning gap, so the reflex is to install a browser or
symlink the cache. Both fail — symlinking into `~/Library/Caches` is denied, and a
`PLAYWRIGHT_BROWSERS_PATH` dir of symlinks only gets you as far as cause 1.
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; export CHROMIUM_LAUNCH_ARGS=…
<!-- xgd-tool name="Bash" id="toolu_01JgJDMmFyJg2yna9uxKoAx3" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:18:18.371244+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; export CHROMIUM_LAUNCH_ARGS=--single-process; timeout 500 node_modules/.bin/vitest run --project node tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts 2>&1 | grep -E \"✓|×|↓|AssertionError|Tests \" | head -20","description":"Run RED test with single-process chromium","timeout":520000}
```

**Result**

```
     × test_UAT_FC_BUG_365_a_hero_whose_text_is_placed_over_its_clip_is_left_as_built 25ms
     × test_UAT_FC_BUG_365_a_720px_clip_hero_with_placed_text_renders_720px_tall_without_a_scrim 1492ms
     × test_UAT_FC_BUG_365_a_flowing_text_hero_lays_its_text_over_the_clip_at_the_clips_height 757ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected '<!doctype html>\n<html lang="en" dir=…' to be '<!doctype html>\n<html lang="en" dir=…' // Object.is equality
AssertionError: hero height at 375: expected 128 to be 720 // Object.is equality
AssertionError: hero height at 375: expected 186 to be 720 // Object.is equality
      Tests  3 failed (3)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; sed -n 2850,2880p packages/s…
<!-- xgd-tool name="Bash" id="toolu_01REgvFFsE4c6Vbcfs33JPcM" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:18:35.747574+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; sed -n 2850,2880p packages/site-schema/src/l1/schema.ts; grep -n \"aspect\" packages/framework/src/l1/render.ts | head -15","description":"Inspect aspect for video/images"}
```

**Result**

```
     * still see ONE frame rather than the whole strip squashed into the box. So the
     * windowing is static and unconditional, and the animation is the only part
     * behind the reduced-motion gate.
     *
     * THE RESTING FRAME IS FRAME 0. A track that plays `2..5` still settles to 0
     * when it is not running and under reduced motion, so a strip's first frame is
     * its poster and should be the one the illustration is designed to sit at.
     *
     * The box should carry the frames' own aspect ratio. Nothing here can read the
     * file to check that, so it is the author's to get right — but the failure is
     * gentle: a mismatched box stretches every frame equally rather than showing
     * parts of two.
     *
     * Exclusive with `parts` ({@link L1_STRUCTURAL_RULES.partsAndFramesExclusive}):
     * a strip is stepped, a drawing is placed in the page, and a node is one or the
     * other.
     */
    frames: z.number().int().min(2).optional(),
    /**
     * [[REQ-447]] — the design's named aspect ratio this picture is framed at
     * (`hero`, `inline`, `portrait`, …). The crop follows the picture's focal
     * point, `axes.objectPosition`. Absent under a design with an `inline`
     * aspect, the picture takes `inline`.
     */
    aspect: l1AspectNameSchema.optional(),
    /**
     * [[BUG-282]] — this picture is a GRAPHIC: a map, a menu, a flyer, a diagram,
     * a sign, anything whose text or edges carry its meaning. It is never
     * cropped. It shows at its own shape, whatever the design's aspects say: no
     * aspect is applied to it, and a `cover` or `none` fit is drawn as `contain`.
     * An `aspect` typed on it anyway is off the design. A photo can be cropped
1680: * whatever the frames' aspect ratio turns out to be. That is why the window is
1682: * construction has to assume the box and the frame share an aspect ratio, and
2938: * `aspect-ratio` on the span stands in for the intrinsic ratio the `<img>` had:
2991:    wrapper: ['overflow: hidden', 'container-type: size', `aspect-ratio: ${num(w)} / ${num(h)}`],
4126: * aspect ratio, with no axis for a document to get wrong. `object-fit: contain`
6116:      // [[REQ-447]] — the design's named aspect: the box takes the ratio, filling
6119:      const ratio = node.kind === 'image' && node.aspect && !graphic ? l1DesignAspect(state.design, node.aspect) : undefined
6120:      if (ratio && l1AspectRatio(state.design, node.aspect!) !== undefined) {
6121:        base.push(`aspect-ratio: ${num(ratio.w)} / ${num(ratio.h)}`)
6161:      // give the browser the aspect ratio before a single byte of the image has
6288:      // point, surface, sizing and named aspect.
6303:      const ratio = node.aspect ? l1DesignAspect(state.design, node.aspect) : undefined
6304:      if (ratio && l1AspectRatio(state.design, node.aspect!) !== undefined) {
6305:        base.push(`aspect-ratio: ${num(ratio.w)} / ${num(ratio.h)}`)
6903:   * steps, measures, aspects) are declared on `:root` for the nodes that name them.
```

## Read /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/packages/site-schema/src/l1/desi…
<!-- xgd-tool name="Read" id="toolu_015beVe9dDgvhEUCNEprXkKm" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:18:54.162364+00:00" -->

**Input**

```json
{"file_path":"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/packages/site-schema/src/l1/design.ts","limit":12,"offset":786}
```

**Result**

```
786	 * order; the composition decides where it stands. The picture is the section's
787	 * first child that holds only a picture; the rest is its text.
788	 *  - `split` — picture and text side by side in two equal columns from
789	 *    {@link L1_SPLIT_FROM_PX}, stacked below; each stretches to the row, the
790	 *    picture covering its column and the text centred down its own. `flip` puts
791	 *    the picture second, so consecutive splits alternate sides.
792	 *  - `overlay` — the picture behind the text, under {@link L1_OVERLAY_SCRIM}, the
793	 *    text in white, padded by the space scale. [[BUG-355]] A clip is a picture
794	 *    too: it and the scrim are laid under the text as layers filling the
795	 *    section, so the text is over the clip at every width.
796	 *  - `statement` — every child centred at the text measure, its text centred.
797	 *  - `cards` — the leading runs (a heading, an intro) above a grid of the rest:
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; python3 - <<'EOF' p='package…
<!-- xgd-tool name="Bash" id="toolu_013o4FkD9oLzbj2cfgsmUSXA" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:19:08.637779+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; python3 - <<'EOF'\np='packages/site-schema/src/l1/design.ts'\ns=open(p).read()\nold_doc=\"\"\" *    section, so the text is over the clip at every width.\n\"\"\"\nnew_doc=\"\"\" *    section, so the text is over the clip at every width. [[BUG-365]] The\n *    section keeps the height the clip states, as its minimum; and a section whose\n *    text is already placed over the clip (pinned, or by absolute geometry) is\n *    left as built, its height and its shade the builder's.\n\"\"\"\nassert old_doc in s; s=s.replace(old_doc,new_doc,1)\nold=\"\"\"      if (img.kind === 'video') {\n\"\"\"\nnew=\"\"\"      if (img.kind === 'video') {\n        // [[BUG-365]] Text already placed over the clip is not the text below\n        // it that BUG-355 fixed: the builder drew this hero, the clip gives it\n        // its height, and composing it would shrink it to its padding and lay a\n        // scrim the hero never had over it.\n        if (rest.every(placedOutOfFlow)) return section\n\"\"\"\nassert old in s; s=s.replace(old,new,1)\nold=\"\"\"        return { ...reframed(section, { layout: 'stack', ...gap }, [...layers, ...text]), padding, ...responsivePadding }\n\"\"\"\nnew=\"\"\"        // [[BUG-365]] A filled layer takes no space, so the height the clip\n        // stated becomes the section's minimum: its text can still grow it.\n        const minPx = statedHeightPx(img)\n        const sizing = minPx === undefined ? {} : { sizing: { ...(isRecord(section.sizing) ? section.sizing : {}), height: { mode: 'hug', minPx } } }\n        return { ...reframed(section, { layout: 'stack', ...gap }, [...layers, ...text]), padding, ...responsivePadding, ...sizing }\n\"\"\"\nassert old in s; s=s.replace(old,new,1)\nold=\"\"\"/**\n * [[BUG-355]] — the layout a group states for its items\"\"\"\nnew=\"\"\"/** [[BUG-365]] — a node placed out of its parent's flow: pinned, or by absolute geometry. */\nconst placedOutOfFlow = (n: Json): boolean =>\n  n.pin !== undefined || (isRecord(n.geometry) && (n.geometry as Json).place !== 'flow')\n\n/** [[BUG-365]] — the height a picture states in px — fixed, or its minimum — else undefined. */\nfunction statedHeightPx(picture: Json): number | undefined {\n  const h = isRecord(picture.sizing) && isRecord(picture.sizing.height) ? picture.sizing.height : undefined\n  if (!h) return undefined\n  if (h.mode === 'fixed' && typeof h.px === 'number') return h.px\n  return typeof h.minPx === 'number' ? h.minPx : undefined\n}\n\n/**\n * [[BUG-355]] — the layout a group states for its items\"\"\"\nassert old in s; s=s.replace(old,new,1)\nopen(p,'w').write(s)\nEOF\nexport CHROMIUM_LAUNCH_ARGS=--single-process; timeout 500 node_modules/.bin/vitest run --project node tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts tests/test_UAT_FC_BUG-355_overlay_clip_and_stated_columns.test.ts 2>&1 | grep -E \"✓|×|↓|AssertionError|Tests \" | head -20","description":"Implement fix and run both suites","timeout":520000}
```

**Result**

```
     × test_UAT_FC_BUG_365_a_720px_clip_hero_with_placed_text_renders_720px_tall_without_a_scrim 865ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: no scrim laid over the hero at 375: expected 1 to be +0 // Object.is equality
      Tests  1 failed | 8 passed (9)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; f=tests/test_UAT_FC_BUG-365_…
<!-- xgd-tool name="Bash" id="toolu_01SdPnsCbMUwhAdxxXa4Sg92" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:19:38.312916+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; f=tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts; sed -i '' 's/    scrims: scrims.length,/    scrims: scrims.length, scrimWho: scrims.map((e) => e.tagName + \"#\" + e.id + \".\" + e.className + \" \" + getComputedStyle(e).backgroundImage.slice(0, 80)),/' $f; sed -i '' 's/expect(seen.scrims, `no scrim laid over the hero at ${width}`)/expect(seen.scrims, `no scrim laid over the hero at ${width}: ${JSON.stringify(seen.scrimWho)}`)/' $f; export CHROMIUM_LAUNCH_ARGS=--single-process; timeout 300 node_modules/.bin/vitest run --project node $f -t 720px 2>&1 | grep -E \"AssertionError\" | head -3","description":"Identify matched scrim element","timeout":320000}
```

**Result**

```
AssertionError: no scrim laid over the hero at 375: ["BUTTON#.l1-video-pause none"]: expected 1 to be +0 // Object.is equality
[This command modified 1 file you've previously read: tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts. Call Read before editing.]
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; f=tests/test_UAT_FC_BUG-365_…
<!-- xgd-tool name="Bash" id="toolu_013hfGL3RaAVWAt16Uryudbb" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:19:53.193073+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; f=tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts; python3 - \"$f\" <<'EOF'\nimport sys\np=sys.argv[1]; s=open(p).read()\ns=s.replace(\"\"\" scrimWho: scrims.map((e) => e.tagName + \"#\" + e.id + \".\" + e.className + \" \" + getComputedStyle(e).backgroundImage.slice(0, 80)),\"\"\",\"\")\ns=s.replace(\"\"\": ${JSON.stringify(seen.scrimWho)}`)\"\"\",\"\"\"`)\"\"\")\ns=s.replace(\"\"\"  // Any layer laid over the hero that paints a shade: a scrim.\n  const scrims = Array.from(hero.querySelectorAll('*')).filter((el) => {\"\"\",\"\"\"  // A layer of the hero's own, other than its text, that paints a shade: a scrim.\n  const scrims = Array.from(hero.children).filter((el) => {\"\"\")\nopen(p,'w').write(s)\nEOF\ngrep -n \"scrim\" $f | head; export CHROMIUM_LAUNCH_ARGS=--single-process; timeout 500 node_modules/.bin/vitest run --project node $f tests/test_UAT_FC_BUG-355_overlay_clip_and_stated_columns.test.ts 2>&1 | grep -E \"×|AssertionError|Tests \" | head","description":"Narrow scrim detector and rerun","timeout":520000}
```

**Result**

```
8: * left in flow (nothing, the text being placed too), and a scrim the hero never
138:  // A layer of the hero's own, other than its text, that paints a shade: a scrim.
139:  const scrims = Array.from(hero.children).filter((el) => {
149:    scrims: scrims.length,
161:    'test_UAT_FC_BUG_365_a_720px_clip_hero_with_placed_text_renders_720px_tall_without_a_scrim',
170:        expect(seen.scrims, `no scrim laid over the hero at ${width}`).toBe(0)
      Tests  9 passed (9)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; grep -l -a -E "composition|o…
<!-- xgd-tool name="Bash" id="toolu_01BZPAe37pdWRWrD5PVtic7r" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:20:25.618969+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; grep -l -a -E \"composition|overlay\" tests/*.test.ts | grep -v BUG-365 > $TMPDIR/bug365-list; wc -l < $TMPDIR/bug365-list; export CHROMIUM_LAUNCH_ARGS=--single-process; [ -s $TMPDIR/bug365-list ] && timeout 590 node_modules/.bin/vitest run --project node --reporter=json --outputFile=$TMPDIR/bug365.json $(cat $TMPDIR/bug365-list) >/dev/null 2>&1; jq -r '.numPassedTests, .numFailedTests, (.testResults[] | select(.status==\"failed\") | .name)' $TMPDIR/bug365.json","description":"Run composition/overlay-related tests","timeout":600000}
```

**Result**

```
     187
1443
56
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/capture.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/reconciliation-1c-builder-env-layering.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/reconciliation-assistant-looking-surface.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/reconciliation-builder-no-key-banner.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/reconciliation-colour-palette-overlay.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/reconciliation-copy-edit-form-presentation.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/reconciliation-l1-fold.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/reconciliation-page-composition-document.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/reconciliation-published-site-serving.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/reconciliation-upload-overlay.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/reconciliation-workspace-transport.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/req105-node-axis-groups.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/req115-builder-shell.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/test_UAT_FC_BUG-124_filing_is_a_setting.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/test_UAT_FC_BUG-50_builder_env_files.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/test_UAT_FC_REQ-122_chat_host.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/test_UAT_FC_REQ-269_capture_and_fold_residuals.test.ts
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365/tests/test_reconciliation_fidelity_compare_and_judge.test.ts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; jq -r '.testResults[] | sele…
<!-- xgd-tool name="Bash" id="toolu_015chCv7hogVU7H1kHKTHMhF" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:22:01.622408+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; jq -r '.testResults[] | select(.status==\"failed\") | .assertionResults[] | select(.status==\"failed\") | .fullName' $TMPDIR/bug365.json | sort > $TMPDIR/bug365-fail-after; jq -r '.testResults[] | select(.status==\"failed\") | .name' $TMPDIR/bug365.json > $TMPDIR/bug365-flist; cp packages/site-schema/src/l1/design.ts $TMPDIR/bug365-design.ts; git checkout packages/site-schema/src/l1/design.ts; export CHROMIUM_LAUNCH_ARGS=--single-process; [ -s $TMPDIR/bug365-flist ] && timeout 560 node_modules/.bin/vitest run --project node --reporter=json --outputFile=$TMPDIR/bug365-base.json $(cat $TMPDIR/bug365-flist) >/dev/null 2>&1; cp $TMPDIR/bug365-design.ts packages/site-schema/src/l1/design.ts; jq -r '.testResults[] | .assertionResults[] | select(.status==\"failed\") | .fullName' $TMPDIR/bug365-base.json | sort > $TMPDIR/bug365-fail-base; wc -l $TMPDIR/bug365-fail-after $TMPDIR/bug365-fail-base; comm -23 $TMPDIR/bug365-fail-after $TMPDIR/bug365-fail-base; git diff --stat","description":"Baseline failing tests without the fix","timeout":600000}
```

**Result**

```
Updated 1 path from the index
      56 /tmp/claude-501/bug365-fail-after
      56 /tmp/claude-501/bug365-fail-base
     112 total
 packages/site-schema/src/l1/design.ts | 28 ++++++++++++++++++++++++++--
 1 file changed, 26 insertions(+), 2 deletions(-)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; git add packages/site-schema…
<!-- xgd-tool name="Bash" id="toolu_0145scTsYofDsXwJduVsHNn6" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:22:58.041848+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; git add packages/site-schema/src/l1/design.ts tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts; git status --short; git commit -q -F - <<'EOF'\nfix(l1): an overlay hero over a clip keeps its height and its shade [FREE-CODED]\n\nBUG-365. Since BUG-355 every overlay clip became a layer filling the section,\nso a hero whose clip stated 720px and whose text was already placed over it\nshrank to its padding (128px) and gained a scrim it never had. A hero whose\ntext is pinned or placed by absolute geometry is now left as built, rendering\nexactly as before BUG-355. A hero whose text is in flow (BUG-355's case) still\ngets its text over the clip, and the section keeps the clip's stated height\n(fixed or minimum px) as its minimum height.\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nEOF\ngit log --format=%H -1","description":"Commit fix and test"}
```

**Result**

```
M  packages/site-schema/src/l1/design.ts
A  tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts
60fe3c4b5d517a74a88e1f2144b0b7fa3afa61b5
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; cat > $TMPDIR/bug365-append.md <<'EOF' ## Implementation (free-coded, 2026-…
<!-- xgd-tool name="Bash" id="toolu_019qia1GK4Kc6orMH4p9MmMF" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:23:10.099977+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; cat > $TMPDIR/bug365-append.md <<'EOF'\n\n## Implementation (free-coded, 2026-11-05)\n\n**Confirmed by rendering** the ticket's shape (720px clip, text group placed by absolute geometry with its own gradient): on the code as it stood the hero rendered **128px tall** at 375 — just the overlay composition's padding — with a full-section 0.55 scrim added and the text recoloured white. Before BUG-355 an overlay section whose picture was a clip was not composed at all (the old picture finder only saw stills), so it rendered as built.\n\n**What changed** (`composeSection`, `overlay` case, `packages/site-schema/src/l1/design.ts`):\n- **Text already placed over the clip → the section is left as built.** If every non-picture child is out of flow (has a `pin`, or `geometry` that isn't `place: flow`), the text is already over the clip. That isn't the BUG-355 case, so the composition doesn't touch the section. It renders byte-identical to the same section with no composition: same height, no scrim, the text group's gradient its own size, its text colours unchanged.\n- **Text in flow (BUG-355's case) → layers as before, plus a minimum height.** The clip and scrim are still fill layers under the text. The section now gets `sizing.height: { mode: hug, minPx }` from the clip's stated height (fixed `px`, else `minPx`), so it can't shrink below the clip, and text taller than the clip can still grow it.\n\n**Not covered:**\n- **A clip that states only a design `aspect`** gives the section no minimum. Containers have no aspect axis in L1, and adding one was out of scope here. Such a hero with in-flow text is sized by its text plus padding, as in BUG-355.\n- **No layout-check rule** for \"hero height changed >25% with no edit\" was added. That needs a before/after baseline the host doesn't keep. The regression test pins this shape, as the ticket allows at minimum.\n\n**Tests:** `tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts`: the placed-text hero renders the same as built; it renders 720px at 375/768/1280 with the text over the clip, no scrim, and its gradient group at its own 360px; a flowing-text hero renders 720px with the text over the clip. BUG-355's suite still passes (6/6). Of 187 composition/overlay-related test files, the 56 failing tests fail identically with and without the change (pre-existing).\nEOF\nxgd ticket update bug-313c192b --append-body \"$(cat $TMPDIR/bug365-append.md)\" 2>&1 | grep -E \"Updated|rror\"","description":"Append implementation notes to ticket"}
```

**Result**

```
[15:23:11] │ Updated bug: BUG-365 (bug-313c192b)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; xgd branch lock BUG-365 2>&1 | grep -v cli_command | tail -4
<!-- xgd-tool name="Bash" id="toolu_01EpzfTmwyFp6Fm938kLV4nW" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:23:14.357985+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; xgd branch lock BUG-365 2>&1 | grep -v cli_command | tail -4","description":"Acquire merge lock","timeout":300000}
```

**Result**

```
Merge from: git -C /Users/martin/lagrangefoundry/1stcontact -c core.sparseCheckout=false merge free-BUG-365
then: /Users/martin/.xgd/releases/0.17.386+xgd.working.5ea14f28ff6a/lib/python3.12/site-packages/bin/xgd-rematerialize-tickets --repo /Users/martin/lagrangefoundry/1stcontact --enforce --changed ORIG_HEAD..HEAD --apply
(or run /Users/martin/.xgd/releases/0.17.386+xgd.working.5ea14f28ff6a/lib/python3.12/site-packages/bin/xgd-merge free-BUG-365 from the xgd-working worktree)
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:23:15
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.gi…
<!-- xgd-tool name="Bash" id="toolu_01MkKJV31s54GQaFrQpvi7fc" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:23:20.285946+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; git -C $W merge -q xgd-working -m \"Merge xgd-working into free-BUG-365\" 2>&1 | tail -3; (cd $W && ./bin/project/xgd_version_bump 2>&1 | tail -2); grep '\"version\"' $W/package.json","description":"Merge working into branch and bump version"}
```

**Result**

```
0.2.793 -> 0.2.794  (patch)
  "version": "0.2.794",
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.gi…
<!-- xgd-tool name="Bash" id="toolu_01HAwBxWeBRA9S1iFeL4UZBh" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:23:26.024758+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365; git -C $W commit -qam \"chore(version): 0.2.794 for BUG-365\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\"; git -C $W log --format=%H -1; ls /Users/martin/.xgd/releases/0.17.386+xgd.working.5ea14f28ff6a/lib/python3.12/site-packages/bin/xgd-merge /Users/martin/lagrangefoundry/xgd/bin/xgd-merge 2>&1","description":"Commit version bump and locate xgd-merge"}
```

**Result**

```
Exit code 1
3d9cc7746f7e0cb11b9d90d5400768defb29b4fb
ls: /Users/martin/.xgd/releases/0.17.386+xgd.working.5ea14f28ff6a/lib/python3.12/site-packages/bin/xgd-merge: No such file or directory
/Users/martin/lagrangefoundry/xgd/bin/xgd-merge
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; /Users/martin/lagrangefoundry/xgd/bin/xgd-merge free-BUG-365 2>&1 | tail -5…
<!-- xgd-tool name="Bash" id="toolu_012yL4pcEGRqLPANeh36VLTA" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:23:30.504432+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; /Users/martin/lagrangefoundry/xgd/bin/xgd-merge free-BUG-365 2>&1 | tail -5; git merge-base --is-ancestor 60fe3c4b5d517a74a88e1f2144b0b7fa3afa61b5 xgd-working && git merge-base --is-ancestor 3d9cc7746f7e0cb11b9d90d5400768defb29b4fb xgd-working && echo both-landed; git log --oneline -3","description":"Merge branch back into xgd-working"}
```

**Result**

```
[15:23:32] │ dry run: nothing changed (use --apply)
[15:23:32] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'ticket-store'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:23:32

✓ Verified: free-BUG-365 (3d9cc7746f7e0cb11b9d90d5400768defb29b4fb) is in HEAD
both-landed
12487de86b Merge branch 'free-BUG-365' into xgd-working
3d9cc7746f chore(version): 0.2.794 for BUG-365
c890bb2118 xgd(ticket): update comment comment-6e0c2a3d
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket move-to-free-coded bug-313c192b 60fe3c4b5d517a74a88e1f2144b0b7fa…
<!-- xgd-tool name="Bash" id="toolu_01Mjq37fxUvLLMWz8RyWbn6e" turn="7ca8535388444710bcfe27037cae8c93" ts="2026-11-05T23:23:40.035318+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; xgd ticket move-to-free-coded bug-313c192b 60fe3c4b5d517a74a88e1f2144b0b7fa3afa61b5 3d9cc7746f7e0cb11b9d90d5400768defb29b4fb --version 0.2.794 2>&1 | grep -v cli_command | tail -5","description":"Move ticket to free_coded"}
```

**Result**

```
[15:23:47] │ for this work? Any commits that have not been added will not be correctly reconciled
[15:23:47] │ and may be reverted. Have you run the version increment script?
[15:23:47] │ 
[15:23:47] │ Moved to free_coded: bug: BUG-365 (bug-313c192b)
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:23:47
```

## Bash cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-free-coded-promotion.md; cd /Us…
<!-- xgd-tool name="Bash" id="toolu_01CPY6ihc7Mcva2CDvyp7PXX" turn="463b01a386bb41a18c1426a74cc4c072" ts="2026-11-05T23:25:51.351592+00:00" -->

**Input**

```json
{"command":"cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-free-coded-promotion.md; cd /Users/martin/lagrangefoundry/1stcontact && git log --oneline -3 xgd-working; git log --oneline xgd-working..free-BUG-365; git -C /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365 status --short | head","description":"Read promotion memory and branch state"}
```

**Result**

````
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
8cad9cef08 xgd(ticket): update comment comment-9c2b9afb
4cf934bb3d xgd(ticket): update comment comment-daccb9d9
8670f476fc xgd(ticket): update comment comment-6e0c2a3d
````

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git merge-base --is-ancestor 3d9cc7746f7e0cb11b9d90d5400768defb29b4fb xgd…
<!-- xgd-tool name="Bash" id="toolu_01DzetYF4vwYjDh34hAphBa2" turn="463b01a386bb41a18c1426a74cc4c072" ts="2026-11-05T23:25:57.585625+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git merge-base --is-ancestor 3d9cc7746f7e0cb11b9d90d5400768defb29b4fb xgd-working && echo MERGED; git log --oneline -8 free-BUG-365; git log --oneline --all --grep=BUG-365 | head; xgd ticket show BUG-365 2>&1 | head -30","description":"Check whether branch is merged and ticket state"}
```

**Result**

```
MERGED
3d9cc7746f chore(version): 0.2.794 for BUG-365
73fffa6059 Merge xgd-working into free-BUG-365
b400910341 xgd(ticket): update bug bug-00d5f738
90282a246f xgd(ticket): update bug bug-313c192b
60fe3c4b5d fix(l1): an overlay hero over a clip keeps its height and its shade [FREE-CODED]
c8d89f3d55 xgd(ticket): update bug bug-b3995ecd
c32eae14c2 xgd(ticket): update comment comment-61c0cc9e
f0bfbfa379 xgd(ticket): create comment comment-fb57a5d8
12487de86b Merge branch 'free-BUG-365' into xgd-working
3d9cc7746f chore(version): 0.2.794 for BUG-365
73fffa6059 Merge xgd-working into free-BUG-365
60fe3c4b5d fix(l1): an overlay hero over a clip keeps its height and its shade [FREE-CODED]
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:25:58
usage: xgd ticket [-h]
                  {create,get,update,archive,unarchive,bundle,unbundle,list,schema,children,backlinks,reports,comments,add-comment,append,recover,rebuild-index,audit,development,query,action,history,diff,search,move-to-free-coded}
                  ...
xgd ticket: error: argument ticket_command: invalid choice: 'show' (choose from create, get, update, archive, unarchive, bundle, unbundle, list, schema, children, backlinks, reports, comments, add-comment, append, recover, rebuild-index, audit, development, query, action, history, diff, search, move-to-free-coded)
Try 'xgd ticket --help' for available commands.
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:25:58
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket get bug-313c192b --json 2>/dev/null | python3 -c "import json,…
<!-- xgd-tool name="Bash" id="toolu_01XvUWYKT5xDbt3rpvvb2UPM" turn="463b01a386bb41a18c1426a74cc4c072" ts="2026-11-05T23:26:03.432995+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket get bug-313c192b --json 2>/dev/null | python3 -c \"import json,sys;d=json.load(sys.stdin);d=d.get('ticket',d);f=d.get('fields',d);print({k:f.get(k) for k in ('status','version','commits','commit_shas','free_coded_commits')})\"","description":"Read ticket status and version fields"}
```

**Result**

```
{'status': None, 'version': '0.2.794', 'commits': [{'working_sha': '60fe3c4b5d517a74a88e1f2144b0b7fa3afa61b5', 'reconcile_sha': None, 'main_sha': None}, {'working_sha': '3d9cc7746f7e0cb11b9d90d5400768defb29b4fb', 'reconcile_sha': None, 'main_sha': None}], 'commit_shas': None, 'free_coded_commits': None}
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd branch clean BUG-365 2>&1 | tail -15
<!-- xgd-tool name="Bash" id="toolu_012tUejrXHVfHJeT3hywiaTy" turn="463b01a386bb41a18c1426a74cc4c072" ts="2026-11-05T23:26:07.483429+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd branch clean BUG-365 2>&1 | tail -15","description":"Remove the BUG-365 worktree and branch"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:26:08
[15:26:08] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'branch', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'branch', 'clean', 'BUG-365'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
[15:26:10] │ Error removing worktree: error: failed to delete '.git/worktrees/free-BUG-365': Operation not permitted
           │ 
[15:26:10] │ This command is still running inside the OS sandbox. Re-run it as exactly `xgd branch clean <TICKET-ID> [--force]` — no `cd`, pipe, `;`/`&&` chain or redirect around it, and `xgd` invoked by bare name — so the `xgd branch clean *` sandbox exclusion applies.
[15:26:10] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'failure', 'command': 'branch'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:26:10
```

## Bash xgd branch clean BUG-365
<!-- xgd-tool name="Bash" id="toolu_015HD5AhZYUw3S8MG13yppUr" turn="463b01a386bb41a18c1426a74cc4c072" ts="2026-11-05T23:26:12.720354+00:00" -->

**Input**

```json
{"command":"xgd branch clean BUG-365","description":"Remove the BUG-365 worktree and branch"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:26:13
[15:26:13] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'branch', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'branch', 'clean', 'BUG-365'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
Cleaned up free-BUG-365 (worktree removed, branch deleted, lock released).
[15:26:13] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'branch'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:26:13
```

## Bash python -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{"session":"bug-313c192b","text":"BUG-365 free-coding compl…
<!-- xgd-tool name="Bash" id="toolu_01PCn8GeurAUZSWedir37SuQ" turn="463b01a386bb41a18c1426a74cc4c072" ts="2026-11-05T23:26:17.526213+00:00" -->

**Input**

```json
{"command":"python -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{\"session\":\"bug-313c192b\",\"text\":\"BUG-365 free-coding complete: fix 60fe3c4b5d + version bump 3d9cc7746f (0.2.794) merged into xgd-working (12487de86b), ticket free_coded with both SHAs; branch free-BUG-365 cleaned 2026-11-05. Note: xgd branch clean must run as a bare command (no cd/pipe) to get its sandbox exclusion.\"}' >/dev/null && echo ok","description":"Log completion in session summary"}
```

**Result**

```
Exit code 1
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai.agent_cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
```

## Bash xgd branch clean BUG-365
<!-- xgd-tool name="Bash" id="toolu_015wRLuuE1n2uKpuKMULnH8i" turn="c55e8c83c9534fa69ab472da19027304" ts="2026-11-05T23:27:45.455874+00:00" -->

**Input**

```json
{"command":"xgd branch clean BUG-365","description":"Tear down merged branch and release lock"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:27:47
[15:27:47] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'branch', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'branch', 'clean', 'BUG-365'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
Branch 'free-BUG-365' does not exist — nothing to clean.
[15:27:47] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'branch'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:27:47
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; git worktree list | grep -i 365; git branch --list '*365*'; ls -d /Users/ma…
<!-- xgd-tool name="Bash" id="toolu_01B3gVHW5zTutrF2mKMKNb3c" turn="c55e8c83c9534fa69ab472da19027304" ts="2026-11-05T23:27:58.514354+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; git worktree list | grep -i 365; git branch --list '*365*'; ls -d /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365 2>&1; ls .xgd/_locks 2>/dev/null; xgd ticket get bug-313c192b 2>&1 | grep -E \"Status|commits|version\"","description":"Check whether branch, worktree and lock remain"}
```

**Result**

```
ls: /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365: No such file or directory
__cold_index__.21.e5cb79ad1ec19cc4.1.rebuild.flock
__cold_index__.flock
__cold_index__.rebuild.flock
__format__
__hot_index__.21.e5cb79ad1ec19cc4.1.rebuild.flock
__hot_index__.flock
__hot_index__.rebuild.flock
__maintainer__.21.e5cb79ad1ec19cc4.1.flock
__maintainer__.21.e5cb79ad1ec19cc4.1.log
__maintainer__.21.e5cb79ad1ec19cc4.1.progress.json
__maintainer__.21.e5cb79ad1ec19cc4.1.state.json
__maintainer__.flock
__maintainer__.log
__maintainer__.state.json
__use__.21.e5cb79ad1ec19cc4.1
report-50cfaf96.lock
[15:27:59] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'ticket', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'ticket', 'get', 'bug-313c192b'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
[15:27:59] │ Status: free_coded
[15:27:59] │   commits: [{'working_sha': '60fe3c4b5d517a74a88e1f2144b0b7fa3afa61b5', 'reconcile_sha': None, 'main_sha': None}, {'working_sha': '3d9cc7746f7e0cb11b9d90d5400768defb29b4fb', 'reconcile_sha': None, 'main_sha': None}]
[15:27:59] │   version: 0.2.794
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact; git merge-base --is-ancestor 3d9cc7746f7e0cb11b9d90d5400768defb29b4fb xgd-w…
<!-- xgd-tool name="Bash" id="toolu_017QuK6VDqVHsTgE9PCKkrc2" turn="c55e8c83c9534fa69ab472da19027304" ts="2026-11-05T23:28:03.353146+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact; git merge-base --is-ancestor 3d9cc7746f7e0cb11b9d90d5400768defb29b4fb xgd-working && echo landed; git worktree list | grep -c prunable; xgd branch status 2>&1 | grep -i -E \"365|lock\" | head","description":"Confirm landed and no lock held"}
```

**Result**

```
landed
0
usage: xgd branch [-h] {cut,lock,clean,session} ...
xgd branch: error: argument branch_command: invalid choice: 'status' (choose from cut, lock, clean, session)
```
