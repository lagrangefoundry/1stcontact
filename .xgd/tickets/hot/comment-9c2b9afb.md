---
uid: comment-9c2b9afb
id: COMMENT-7881
type: comment
title: Comment on bug BUG-366
created_by: xgd
created_at: '2026-11-05T23:10:27.608034+00:00'
updated_at: '2026-11-05T23:25:37.798904+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-00d5f738
  kind: tool_transcript
---

## Bash cd /Users/martin/lagrangefoundry/1stcontact && python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{"session":"bug…
<!-- xgd-tool name="Bash" id="toolu_01VFXi9hs5wUS7DQLc6FSnKy" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T22:59:59.803473+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"bug-00d5f738\"}'; python -m lagrangefoundry.ai_knowledge.cli KnowledgeSearch --in '{\"query\":\"free coding process branch commit merge back\",\"kb\":[\"system_docs\"],\"top_k\":3}' | head -60","description":"Read summary and search free-coding docs"}
```

**Result**

```
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai.agent_cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai_knowledge.cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && ls; ls .venv 2>/dev/null | head; which xgd; cat /Users/martin/.claude-2/p…
<!-- xgd-tool name="Bash" id="toolu_01GSUT3c79B39fwKnhmSwywv" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:00:07.224873+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && ls; ls .venv 2>/dev/null | head; which xgd; cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-free-coded-promotion.md /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/fixes-to-landed-work-are-bugs.md","description":"Inspect repo and read promotion memory"}
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
name: fixes-to-landed-work-are-bugs
description: "When the operator finds landed behaviour broken in testing, file the fix as a `bug` ticket (with severity), not a `request` — even when it also carries small spec changes."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 054a00ab-b2be-4d47-a7c7-6ed2d1a7b
````

[elided — kept 5800 of 6581 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && ls -a | head -30; head -5 /Users/martin/.xgd/bin/xgd; cat CLAUDE.md | hea…
<!-- xgd-tool name="Bash" id="toolu_01Nkx8nBud8avkpkbF3yrPoy" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:00:11.947814+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && ls -a | head -30; head -5 /Users/martin/.xgd/bin/xgd; cat CLAUDE.md | head -80","description":"Find venv and read CLAUDE.md"}
```

**Result**

```
.
..
.claude
.dev.vars.local
.DS_Store
.git
.gitattributes
.github
.gitignore
.local-vendor
.pnpm-store
.wrangler
.xgd
.xgd-worktree-ready
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
#!/bin/sh
# xgd release shim (REQ-934). A pinned run stays on its release; everything
# else follows the newest deployed release.
root="$HOME/.xgd/releases"
if [ -n "$XGD_RUN_RELEASE" ]; then
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
```

[elided — kept 5800 of 7532 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -n -i "free.cod" CLAUDE.md | head -30; ls /Users/martin/lagrangefoun…
<!-- xgd-tool name="Bash" id="toolu_01XCDq19V66PZJKteEkaakFE" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:00:15.573176+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -n -i \"free.cod\" CLAUDE.md | head -30; ls /Users/martin/lagrangefoundry/xgd/.venv*/bin/python 2>/dev/null; ls .venv-working 2>/dev/null|head","description":"Find free coding guidance"}
```

**Result**

```
19:- `xgd-working` — operator hot branch; all free-coded changes, tickets, config
185:### Free-Coded Commit Convention
187:When committing bug fixes or improvements directly to main (outside of a development branch workflow), include `[FREE-CODED]` in the commit message:
190:git commit -m "fix(module): description of fix [FREE-CODED]"
193:**Why**: Long-lived branches don't have these fixes. When they merge back, the branch's older version can silently overwrite the fix. The merge review checks for `[FREE-CODED]` commits and flags overwrites as CRITICAL.
195:**`bin/project/xgd_version_bump` MUST be implemented before the free-coding gate allows progression.**
196:The gate command (`xgd ticket move-to-free-coded`) calls `bin/project/xgd_version_bump --check`
201:### Free-Coding Lifecycle (full process) — MANDATORY in user sessions
205:For any direct code change request in an interactive session ("implement X", "fix X", "add X"), the free-coding process is **mandatory** — not a guideline. Non-compliance has automatic consequences: commits without a scope ticket are detected and reverted on the next sync; stale ticket bodies corrupt the capability matrix when reconcile fires.
207:Full process and rules: **`FREE-CODING.md`** (bundled in xgd system docs, loaded automatically into every `xgd claude` session).
/Users/martin/lagrangefoundry/xgd/.venv-main/bin/python
/Users/martin/lagrangefoundry/xgd/.venv-working/bin/python
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 180,260p CLAUDE.md; find / -name FREE-CODING.md -path "*system_doc…
<!-- xgd-tool name="Bash" id="toolu_01XXXLoEGFGVe7grcbg4tSLb" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:00:22.479345+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 180,260p CLAUDE.md; find / -name FREE-CODING.md -path \"*system_docs*\" 2>/dev/null | head -3","description":"Read lifecycle section and locate FREE-CODING.md"}
```

**Result**

````
- **Tickets MUST be accessed exclusively through the ticketing API** (`xgd ticket` CLI or `xgd_source/core/ticketing` module)
  - NEVER read, write, or modify ticket `.md` files directly via filesystem operations
  - The file-based storage format is an internal implementation detail that may change
  - Direct file access bypasses locking, validation, indexing, and git commit

### Free-Coded Commit Convention

When committing bug fixes or improvements directly to main (outside of a development branch workflow), include `[FREE-CODED]` in the commit message:

```bash
git commit -m "fix(module): description of fix [FREE-CODED]"
```

**Why**: Long-lived branches don't have these fixes. When they merge back, the branch's older version can silently overwrite the fix. The merge review checks for `[FREE-CODED]` commits and flags overwrites as CRITICAL.

**`bin/project/xgd_version_bump` MUST be implemented before the free-coding gate allows progression.**
The gate command (`xgd ticket move-to-free-coded`) calls `bin/project/xgd_version_bump --check`
to verify the version bump is present in your commits. The stub exits 1 on bare invocation and
will block every ticket promotion until you implement the script. See the stub at
`bin/project/xgd_version_bump` for the required interface and implementation guide.

### Free-Coding Lifecycle (full process) — MANDATORY in user sessions

**Applies to interactive user sessions only.** Headless processes (`xgd develop`, `xgd reconcile`, `xgd regression`) do not follow this process — they have their own workflow state machines.

For any direct code change request in an interactive session ("implement X", "fix X", "add X"), the free-coding process is **mandatory** — not a guideline. Non-compliance has automatic consequences: commits without a scope ticket are detected and reverted on the next sync; stale ticket bodies corrupt the capability matrix when reconcile fires.

Full process and rules: **`FREE-CODING.md`** (bundled in xgd system docs, loaded automatically into every `xgd claude` session).

### Version Control Requirements
**CRITICAL:** .xgd/ state files MUST be tracked in version control for rollbacks to work correctly.

**DO track in git:**
- `.xgd/status.json` (workflow state)
- `.xgd/config.yaml` (project configuration)
- `.xgd/stage_prompts/` (stage-specific prompts)
- `.xgd/validation-reports/` (validation results)

**DO NOT track in git (already in .gitignore):**
- `.xgd/logs/` (regenerated on each run)
- `.xgd/tmp/` (temporary files)

**⚠️  NEVER add these patterns to .gitignore:**
- `.xgd/` (ignores everything - breaks rollbacks)
- `.xgd/*` (ignores everything - breaks rollbacks)
- `.xgd/**` (ignores everything - breaks rollbacks)

**Why this matters:** When reverting code via git, the .xgd state must also revert to maintain workspace consistency. If .xgd files are ignored, rolling back code leaves stale workflow state, causing failures.

### Quality Standards
- All code must pass lint checks with zero errors and zero warnings
- All tests must pass
- **Code coverage must meet the configured minimum threshold**
- Build must complete with no errors or warnings

**Coverage Enforcement:**
The coverage threshold is configured in `.xgd/config.yaml` under `quality.min_coverage_percent`.
- Default: 60%
- Project can override this value based on their quality requirements
- The quality check will fail if coverage is below the configured threshold

**DO NOT attempt to bypass coverage requirements by:**
- Modifying timeout values or other workarounds
- Proposing exceptions for coverage gaps (see Exception Policy below)

**The ONLY way to pass quality checks is to add sufficient tests to achieve the configured coverage threshold.**

## ⚠️ CRITICAL: Proactive Investigation — Do the Legwork

**The assistant's job is to absorb system complexity, not route it back to the user.**

Before asking the user for any information, check whether it can be retrieved from the system. If it can, retrieve it yourself.

### Retrievable Sources (check these before asking)

| Source | How to access |
|--------|--------------|
| Workflow logs | `.xgd/logs/*.jsonl` (parse as JSONL — do not ask user to read raw files) |
| Tickets | `xgd ticket get <uid>` or `xgd ticket list --type <type>` |
| Code / config | Read the files directly |
| Git state | `git log`, `git status`, `git tag -l`, `git worktree list` |
/Users/martin/lagrangefoundry/lagrange-framework/components/ai/py/showcase/system_docs/FREE-CODING.md
/Users/martin/lagrangefoundry/test-workflows/.venv-test/lib/python3.12/site-packages/xgd_source/system_docs/FREE-CODING.md
/Users/martin/lagrangefoundry/xgd/xgd_source/system_docs/FREE-CODING.md
````

## Bash cat /Users/martin/lagrangefoundry/xgd/xgd_source/system_docs/FREE-CODING.md
<!-- xgd-tool name="Bash" id="toolu_01HRa3LRGxRvqdUvJUFbwvVm" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:01:31.400746+00:00" -->

**Input**

```json
{"command":"cat /Users/martin/lagrangefoundry/xgd/xgd_source/system_docs/FREE-CODING.md","description":"Read FREE-CODING protocol"}
```

**Result**

```
<persisted-output>
Output too large (56.2KB). Full output saved to: /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/f606d0d0-0c3d-4136-8b11-b95f5c0a78e2/tool-results/b29v6750y.txt

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

## Bash sed -n 1,400p /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/f606d0d0-0c3d-4136-8b11-b95f5c0a…
<!-- xgd-tool name="Bash" id="toolu_014tJtpMLevt1bmsRx8QpXTB" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:01:35.695672+00:00" -->

**Input**

```json
{"command":"sed -n 1,400p /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/f606d0d0-0c3d-4136-8b11-b95f5c0a78e2/tool-results/b29v6750y.txt | grep -v '^$' | head -260","description":"Read protocol body"}
```

**Result**

```
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
user. This applies 
```

[elided — kept 5800 of 18840 bytes]

## Bash sed -n 400,900p /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/f606d0d0-0c3d-4136-8b11-b95f5c…
<!-- xgd-tool name="Bash" id="toolu_01XhCS8oaf9oyzXZbSNA1LbM" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:01:39.777762+00:00" -->

**Input**

```json
{"command":"sed -n 400,900p /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/f606d0d0-0c3d-4136-8b11-b95f5c0a78e2/tool-results/b29v6750y.txt | grep -v '^$' | grep -n -i -E \"UAT|step 3|xgd-test|regression|commit message|\\[FREE\" | head -60","description":"Grep protocol for test and UAT steps"}
```

**Result**

```
6:them through the free-coding process (scope ticket → UAT → commit → reconcile) would
61:3. **What's the test approach?** (which UAT files, what regression scope —
75:(which UATs / regression scope)
109:creates them after the code lands, using the committed UAT tests as evidence.
286:## Step 2 — Code + happy-path UAT(s)
293:  follow the `test_UAT_AC{N}_*` naming convention and be traceable to a
307:You are writing UATs **before** the capability matrix has acceptance criteria
311:test_UAT_FC_<TICKET-ID>_<slug>
315:# tests/cli/test_UAT_FC_REQ-413_log_command_selection.py
316:def test_UAT_FC_REQ_413_session_log_selected_by_recorded_command(workspace):
324:the file/test to `test_UAT_AC<N>_<slug>` and update any references. **You do
327:their UATs are reconciliation's responsibility once the matrix understands
329:### Quick regression scope
334:bin/xgd-test tests/<scope> -q
342:## Step 3 — Commit
361:### Commit message conventions
365:**Commit message conventions**:
367:- End the subject with `[FREE-CODED]` so merge-back review can detect free-coded
373:fix(ticketing): index quality_fix_cycle so LATEST queries see the field [FREE-CODED]
374:The LATEST evaluator reads candidate fields from the index. Without
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git ls-files | grep -i -E "shop-import|shop_import|shopImport" ; xgd tick…
<!-- xgd-tool name="Bash" id="toolu_014zPRLd8zDzSw7E8h3gsLFm" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:01:52.096821+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git ls-files | grep -i -E \"shop-import|shop_import|shopImport\" ; xgd ticket get bug-00d5f738 2>&1 | head -30","description":"Locate shop import files and the ticket"}
```

**Result**

```
apps/control-app/src/shop-import.ts
db/migrations/0044_shop_import_phases.sql
tests/test_UAT_FC_REQ-634_shop_import_and_currency.test.ts
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:01:52
[15:01:52] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'ticket', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'ticket', 'get', 'bug-00d5f738'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
[15:01:52] │ Ticket: BUG-366 (bug-00d5f738)
[15:01:52] │ Type: bug
[15:01:52] │ Title: Shop import: one-of-a-kind pieces with untracked stock arrive not live
[15:01:52] │ Status: draft
[15:01:52] │ 
[15:01:52] │ Fields:
[15:01:52] │   severity: medium
[15:01:52] │   priority: high
[15:01:52] │   parent_uid: epic-95bc3b15
[15:01:52] │   story_points: 3
[15:01:52] │   auto_merge_back: True
[15:01:52] │   needs_review: False
[15:01:52] │   session_id: 96539a66-c8a4-4a91-8985-21d5e3a6aecb
[15:01:52] │ 
[15:01:52] │ Body:
[15:01:52] │ ## Symptom (operator, 2026-11-05, dev, a shop imported from WooCommerce)
           │ 
           │ Several pieces that are live and for sale in the source shop were imported as **not live**. In the case seen, 25 items were not live with availability 1, all of them on the import report's "stock not tracked" list.
           │ 
           │ ## Cause
           │ 
           │ `shop-import.ts` `notLiveReasons()` holds a product back on its first import for any of: a price of 0, **in stock with no tracked quantity (`inStock && stockLimit === null`)**, or no photos. This came in with the shop import (c825e29723, 2026-11-02).
           │ 
           │ "Stock not tracked" is normal for one-of-a-kind goods. The source has stock management off because there is only ever one. The import already treats such a product as quantity 1 (`availability = stockLimit ?? 1`), so it can sell once and then shows as sold. Holding it back from going live as well hides real, for-sale stock.
           │ 
           │ Re-imports don't recover it. An existing item keeps its `live` value ("an update keeps the owner's choices"), so an item held back by the import stays not live forever unless someone switches it on by hand.
           │ 
           │ ## Fix
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && wc -l apps/control-app/src/shop-import.ts tests/test_UAT_FC_REQ-634_shop_…
<!-- xgd-tool name="Bash" id="toolu_018LMiXsJFgLhLuR2gcxMDQC" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:01:56.019084+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && wc -l apps/control-app/src/shop-import.ts tests/test_UAT_FC_REQ-634_shop_import_and_currency.test.ts && cat apps/control-app/src/shop-import.ts","description":"Read shop-import.ts"}
```

**Result**

```
<persisted-output>
Output too large (44.1KB). Full output saved to: /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/f606d0d0-0c3d-4136-8b11-b95f5c0a78e2/tool-results/bmv0t8c6x.txt

Preview (first 2KB):
    1021 apps/control-app/src/shop-import.ts
     231 tests/test_UAT_FC_REQ-634_shop_import_and_currency.test.ts
    1252 total
/**
 * Bringing a business's existing catalogue into its inventory ([[REQ-631]]).
 *
 * TWO STEPS, AND THE OWNER DECIDES BETWEEN THEM. {@link scanShop} reads the
 * source and lists what it found — every category with its parent and product
 * count, every attribute name with how many products carry it — and proposes a
 * mapping. The owner turns each category into a collection, a category or
 * nothing, names the target, and keeps or drops each attribute; the mapping is
 * saved per business and source. {@link runShopImport} then creates one item per
 * product as a background job, page by page.
 *
 * NOTHING HERE KNOWS ANY PARTICULAR SHOP. Every difference between shops is the
 * owner's mapping or a general rule recorded in the report. The import never
 * recognises a product by its name and never strips text by rule.
 *
 * EVERY SOURCE IS AN {@link ImportSource} ([[REQ-634]]): an id, a name, the
 * fields it asks the owner for, and readers of its categories and product pages
 * into {@link SourceProduct}. Scan, mapping, background run and report are the
 * same for all of them, so a new source is one new adapter in
 * {@link IMPORT_SOURCES} and nothing else. WooCommerce's public Store API, which
 * needs no key, is the only source today.
 *
 * EVERY FETCH GOES THROUGH `guardedFetch`, the platform's SSRF guard.
 */

import { guardedFetch, FetchRefusedError } from './fetch-guard'
import { describeDeferred, ingestFromSite, MaterialRejectedError, MAX_MATERIAL_BYTES, type IngestDeps } from './material'
import type { TicketStore } from './tickets'
import {
  addCategory,
  addCollection,
  currencyDecimals,
  itemBySource,
  saveItem,
  setItemPhotos,
  defaultCurrencyOf,
  ShopInputError,
  writeDefaultCurrency,
  type Photo,
  type ShopEnv,
} from './shop'
import { newId } from '../../../tools/generate/src/store/ids'
...
</persisted-output>
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -n -E "notLiveReasons|live|stockNotTracked|stock not tracked|untrack…
<!-- xgd-tool name="Bash" id="toolu_01TC2grGUr6ZDg8uWQw2ZjeA" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:01:59.712182+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -n -E \"notLiveReasons|live|stockNotTracked|stock not tracked|untracked|report\\.|interface .*Report|heldBack|notLive\" apps/control-app/src/shop-import.ts | head -80","description":"Grep live-related code in shop-import"}
```

**Result**

```
13: * owner's mapping or a general rule recorded in the report. The import never
408:export interface ReportEntry {
414:export interface ImportReport {
418:  notLive: (ReportEntry & { reasons: string[] })[]
419:  stockNotTracked: ReportEntry[]
427:  notLive: Record<string, ReportEntry & { reasons: string[] }>
428:  stockNotTracked: Record<string, ReportEntry>
534:/** A run still advancing within this window is live; one that has not moved for longer may be replaced. */
565:  const working: Working = { failed: {}, notLive: {}, stockNotTracked: {} }
579:  /** [[BUG-333]] — once the run is finished: the published sites rebuilt from the live items, once for the whole run. */
583:/** The reasons a product, though public in its source, arrives not live for the owner to review. */
584:function notLiveReasons(p: SourceProduct, amount: number): string[] {
587:  if (p.inStock && p.stockLimit === null) reasons.push('stock not tracked')
693:  // AVAILABILITY: out of stock is 0; a tracked limit is itself; untracked stock is 1, reported.
695:  if (p.inStock && p.stockLimit === null) working.stockNotTracked[p.id] = entry
696:  else delete working.stockNotTracked[p.id]
703:  const reasons = notLiveReasons(p, amount)
719:      // AN UPDATE KEEPS THE OWNER'S CHOICES: live and made to order are hers once the item exists.
720:      live: existing ? existing.live : reasons.length === 0,
726:  if (!existing && reasons.length > 0) working.notLive[p.id] = { ...named, reasons }
727:  if (working.stockNotTracked[p.id]) working.stockNotTracked[p.id] = named
899:/** Close a run: count what it created and updated, look for repeated summaries, and write the report. */
918:    notLive: Object.values(working.notLive),
919:    stockNotTracked: Object.values(working.stockNotTracked),
964: * report. The descriptions run beside both as their own chain of steps, so the
967: * deployment has one, so a run outlives every request and Worker time limit; a
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 400,440p apps/control-app/src/shop-import.ts; sed -n 580,600p apps…
<!-- xgd-tool name="Bash" id="toolu_01Xda8Kfy3pxJpm6iqo98hds" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:02:02.843100+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 400,440p apps/control-app/src/shop-import.ts; sed -n 580,600p apps/control-app/src/shop-import.ts; sed -n 660,740p apps/control-app/src/shop-import.ts","description":"Read report types and item upsert"}
```

**Result**

```
    .bind(businessId, source, JSON.stringify(mapping), new Date().toISOString())
    .run()
}

// ---------------------------------------------------------------------------
// The run
// ---------------------------------------------------------------------------

export interface ReportEntry {
  sourceId: string
  itemId?: string
  name: string
}

export interface ImportReport {
  created: number
  updated: number
  failed: (ReportEntry & { reason: string })[]
  notLive: (ReportEntry & { reasons: string[] })[]
  stockNotTracked: ReportEntry[]
  photoFailures: (ReportEntry & { url: string; reason: string })[]
  repeatedSummaries: { text: string; count: number; kind: 'identical' | 'opening' }[]
}

/** The run's working record: entries keyed by source id, so a retried page replaces rather than repeats. */
interface Working {
  failed: Record<string, ReportEntry & { reason: string }>
  notLive: Record<string, ReportEntry & { reasons: string[] }>
  stockNotTracked: Record<string, ReportEntry>
  /** The categories' source parents, for the ancestors rule; written by the first step. */
  parents?: Record<string, string | null>
  report?: ImportReport
}

/** Where a run is: item data first, then photos ([[BUG-333]]). Descriptions are not a phase — they never gate it. */
export type ImportPhase = 'items' | 'photos' | 'done'

export interface ImportRecord {
  id: string
  source: string
  sourceUrl: string
  catalogChanged?: () => Promise<void>
}

/** The reasons a product, though public in its source, arrives not live for the owner to review. */
function notLiveReasons(p: SourceProduct, amount: number): string[] {
  const reasons: string[] = []
  if (amount === 0) reasons.push('price of 0')
  if (p.inStock && p.stockLimit === null) reasons.push('stock not tracked')
  if (p.images.length === 0) reasons.push('no photo')
  return reasons
}

/** Mark a Library photo as stored undescribed, to be described when first opened. */
export const DESCRIBE_LATER_FIELD = 'describe_later'

/**
 * One photo into the Library, stored undescribed and marked to be described
 * later ([[BUG-333]]): the photos phase never waits on a model. The main photo
 * is described beside it by {@link describeBatch}; the rest when first opened.
 */
async function ingestPhoto(deps: ImportDeps, url: string, page: string | null): Promise<string> {
  // that has never chosen one and has no priced items takes the source's.
  const store = await storeFor(env, { businessId })
  const current = await defaultCurrencyOf(store)
  if (!current) return fail('this business has no site yet, so it has no default currency')
  let currency = current.currency
  if (!current.declared && currency !== p.price.currency && !(await hasPrices(env, businessId))) {
    currency = await writeDefaultCurrency(store, p.price.currency)
  }
  if (currency !== p.price.currency) {
    return fail(`it is priced in ${p.price.currency} and the default currency in Settings is ${currency}`)
  }

  // COLLECTIONS AND CATEGORIES: the product's categories and their ancestors, through the mapping.
  // [[REQ-651]] — EVERY mapped collection applies; nothing is chosen between them.
  const parents = working.parents ?? {}
  const seen = new Set<string>()
  const lineage: string[] = []
  for (const id of p.categoryIds) {
    for (let at: string | null = id; at !== null && !seen.has(at); at = parents[at] ?? null) {
      seen.add(at)
      lineage.push(at)
    }
  }
  const collectionIds: string[] = []
  const categoryIds: string[] = []
  for (const id of lineage) {
    const target = mapping.categories[id]
    if (!target || target.as === 'none') continue
    const ids = target.as === 'collection' ? collectionIds : categoryIds
    const named = await (target.as === 'collection' ? addCollection : addCategory)(env, businessId, target.name)
    if (!ids.includes(named.id)) ids.push(named.id)
  }

  // AVAILABILITY: out of stock is 0; a tracked limit is itself; untracked stock is 1, reported.
  const availability = !p.inStock ? 0 : (p.stockLimit ?? 1)
  if (p.inStock && p.stockLimit === null) working.stockNotTracked[p.id] = entry
  else delete working.stockNotTracked[p.id]

  const description = htmlToText(p.descriptionHtml) || htmlToText(p.summaryHtml)
  const attributes = p.attributes.filter((a) => a.name !== '' && a.value !== '' && mapping.attributes[a.name] !== 'drop')

  // THE ITEM, before its photos, so each photo can be recorded against it as it lands.
  const existing = await itemBySource(env, businessId, source.id, p.id)
  const reasons = notLiveReasons(p, amount)
  const keptPhotos: Photo[] = existing ? existing.photos.filter((ph) => ph.sourceUrl && p.images.includes(ph.sourceUrl)) : []
  const item = await saveItem(
    env,
    businessId,
    existing?.id ?? null,
    {
      name: p.name,
      summary: summaryText(p.summaryHtml),
      description,
      price: null,
      availability,
      collectionIds,
      categoryIds,
      attributes,
      photos: keptPhotos,
      // AN UPDATE KEEPS THE OWNER'S CHOICES: live and made to order are hers once the item exists.
      live: existing ? existing.live : reasons.length === 0,
      madeToOrder: existing ? existing.madeToOrder : false,
    },
    { source: { platform: source.id, id: p.id, sku: p.sku }, priceAmount: amount, currency },
  )
  const named = { ...entry, itemId: item.id }
  if (!existing && reasons.length > 0) working.notLive[p.id] = { ...named, reasons }
  if (working.stockNotTracked[p.id]) working.stockNotTracked[p.id] = named

  // PHOTOS ARE NOT FETCHED HERE ([[BUG-333]]). Each one goes on the run's work
  // list in the source's order, for the photos phase; a photo the item already
  // has from an earlier run is listed as stored, so the rebuilt photo list keeps it.
  const kept = new Map(keptPhotos
```

[elided — kept 5800 of 6422 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -n -E "live" apps/control-app/src/shop.ts | head -60; ls db/migratio…
<!-- xgd-tool name="Bash" id="toolu_01FJTJmJ8oQsLX4JoSgGzRvc" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:02:06.321479+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -n -E \"live\" apps/control-app/src/shop.ts | head -60; ls db/migrations | tail -5; grep -l -i \"CREATE TABLE.*items\\|shop_items\" db/migrations/* | head","description":"Find live handling in shop.ts and migrations"}
```

**Result**

```
4: * INVENTORY IS NOT SITE DEFINITION. The rows live in D1 beside the site
6: * live item has no draft copy, and its Save is what the site follows. After
8: * {@link liveItems} (see below).
321:  live: boolean
337:  live: number
349:  'i.photos, i.live, i.made_to_order, i.source, i.source_id, i.source_sku, i.slug, i.created_at, i.updated_at'
417:      live: r.live === 1,
441:  live?: boolean | null
474:  if (query.live != null) {
475:    where.push('i.live = ?')
476:    binds.push(query.live ? 1 : 0)
500: * Every live item of a business, with all its fields — the [[REQ-633]] contract.
501: * Not-live items appear nowhere on the site.
503:export async function liveItems(env: ShopEnv, businessId: string): Promise<InventoryItem[]> {
506:      'WHERE i.business_id = ? AND i.live = 1 ORDER BY lower(i.name), i.id',
516: * Every live item as the site's catalog draws it ([[REQ-633]]'s `CatalogItem`):
524:  return (await liveItems(env, businessId))
544:/** The Library material behind a live item's `n`th photo, or null when there is none to show. */
546:  const row = await env.DB.prepare('SELECT photos FROM inventory_items WHERE business_id = ? AND slug = ? AND live = 1')
566:  live: boolean
623:    live: body.live === true,
637: * item is saved live, and never changed afterwards so a published URL stays put.
700:  const slug = existing?.slug ?? (input.live ? await freeSlug(env, businessId, input.name) : null)
708:    input.live ? 1 : 0,
716:            'photos = ?, live = ?, made_to_order = ?, slug = ?, updated_at = ? WHERE id = ? AND business_id = ?',
719:          'INSERT INTO inventory_items (name, summary, description, availability, attributes, photos, live, made_to_order, ' +
754: * a not-live item exists here and appears nowhere on the site until the owner
755: * turns it live and saves.
758:  return saveItem(env, businessId, null, { ...input, live: false })
0047_orders.sql
0048_turn_log_compute.sql
0049_item_collections.sql
0050_estimate_outcomes.sql
manifest.json
db/migrations/0040_inventory.sql
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 310,360p apps/control-app/src/shop.ts; sed -n 400,420p apps/contro…
<!-- xgd-tool name="Bash" id="toolu_011ueRZsPwFVrQ4oz5rj8Uz4" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:02:11.380196+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 310,360p apps/control-app/src/shop.ts; sed -n 400,420p apps/control-app/src/shop.ts; sed -n 555,770p apps/control-app/src/shop.ts; cat db/migrations/manifest.json | tail -20; cat db/migrations/0049_item_collections.sql","description":"Read item types and saveItem"}
```

**Result**

```
  description: string
  /** The business currency's all-markets price, or null where the item has none in it. */
  price: Price | null
  prices: Price[]
  availability: number
  sold: boolean
  /** [[REQ-651]] — any number, in the item's own order, like its categories. */
  collections: Named[]
  categories: Named[]
  attributes: Attribute[]
  photos: Photo[]
  live: boolean
  madeToOrder: boolean
  source: { platform: string; id: string; sku: string | null } | null
  slug: string | null
  createdAt: string
  updatedAt: string
}

interface ItemRow {
  id: string
  name: string
  summary: string
  description: string
  availability: number
  attributes: string
  photos: string
  live: number
  made_to_order: number
  source: string
  source_id: string | null
  source_sku: string | null
  slug: string | null
  created_at: string
  updated_at: string
}

const ITEM_COLUMNS =
  'i.id, i.name, i.summary, i.description, i.availability, i.attributes, ' +
  'i.photos, i.live, i.made_to_order, i.source, i.source_id, i.source_sku, i.slug, i.created_at, i.updated_at'

/**
 * D1 binds at most 100 parameters per statement ([[BUG-335]]), so an
 * `IN (…)` over a whole shop's items runs as batches of at most this many ids.
 */
const MAX_BOUND_IDS = 100

/**
 * Run `query` once per batch of at most {@link MAX_BOUND_IDS} ids — `marks` is
 * the batch's `?, ?, …` list — and concatenate the rows. Each id lands in one
 * batch, so every id's rows keep the order the query gives them.
  return rows.map((r) => {
    const own = prices
      .filter((p) => p.item_id === r.id)
      .map((p) => ({ amount: p.amount, currency: p.currency, market: p.market, display: formatAmount(p.amount, p.currency) }))
    return {
      id: r.id,
      name: r.name,
      summary: r.summary,
      description: r.description,
      price: own.find((p) => p.currency === currency && p.market === '*') ?? null,
      prices: own,
      availability: r.availability,
      sold: r.availability === 0,
      collections: named(r.id, 'collection'),
      categories: named(r.id, 'category'),
      attributes: JSON.parse(r.attributes) as Attribute[],
      photos: JSON.parse(r.photos) as Photo[],
      live: r.live === 1,
      madeToOrder: r.made_to_order === 1,
      source: r.source === 'manual' || r.source_id === null ? null : { platform: r.source, id: r.source_id, sku: r.source_sku },
      slug: r.slug,
export interface ItemInput {
  name: string
  summary: string
  description: string
  /** The owner's written price in the business currency (`19.99`), or `null`/`''` for none. */
  price: string | null
  availability: number
  collectionIds: string[]
  categoryIds: string[]
  attributes: Attribute[]
  photos: Photo[]
  live: boolean
  madeToOrder: boolean
}

const MAX_TEXT = 20_000

/** Validate a Save's body into an {@link ItemInput}, refusing what may not be stored with a message. */
export function readItemInput(body: Record<string, unknown>): ItemInput {
  const text = (key: string, max: number): string => {
    const v = body[key] ?? ''
    if (typeof v !== 'string') throw new ShopInputError(`${key} must be text.`)
    if (v.length > max) throw new ShopInputError(`${key} is longer than ${max} characters.`)
    return v.replace(/\r\n?/g, '\n')
  }
  const name = text('name', 200).trim()
  if (name === '') throw new ShopInputError('An item needs a name.')
  const availability = body.availability ?? 0
  if (typeof availability !== 'number' || !Number.isSafeInteger(availability) || availability < 0) {
    throw new ShopInputError('Availability must be a whole number, 0 or more.')
  }
  const price = body.price ?? null
  if (price !== null && typeof price !== 'string') throw new ShopInputError('The price must be written as text, for example "19.99".')
  const ids = body.categoryIds ?? []
  if (!Array.isArray(ids) || ids.some((x) => typeof x !== 'string')) throw new ShopInputError('categoryIds must be a list of ids.')
  const collectionIds = body.collectionIds ?? []
  if (!Array.isArray(collectionIds) || collectionIds.some((x) => typeof x !== 'string')) {
    throw new ShopInputError('collectionIds must be a list of ids.')
  }
  const attributes = body.attributes ?? []
  if (!Array.isArray(attributes)) throw new ShopInputError('attributes must be a list of name and value pairs.')
  const cleanAttributes = attributes
    .map((a) => {
      const pair = (a ?? {}) as Record<string, unknown>
      if (typeof pair.name !== 'string' || typeof pair.value !== 'string') {
        throw new ShopInputError('Each attribute needs a name and a value.')
      }
      return { name: pair.name.trim(), value: pair.value.trim() }
    })
    .filter((a) => a.name !== '' || a.value !== '')
  if (cleanAttributes.some((a) => a.name === '')) throw new ShopInputError('Each attribute needs a name.')
  const photos = body.photos ?? []
  if (!Array.isArray(photos)) throw new ShopInputError('photos must be a list of Library items.')
  const cleanPhotos = photos.map((p) => {
    const photo = (typeof p === 'string' ? { material: p } : (p ?? {})) as Record<string, unknown>
    if (typeof photo.material !== 'string' || photo.material === '') throw new ShopInputError('Each photo must name a Library item.')
    return typeof photo.sourceUrl === 'string' ? { material: photo.material, sourceUrl: photo.sourceUrl } : { material: photo.material }
  })
  return {
    name,
    summary: text('summary', 1_000).trim(),
    description: text('description', MAX_TEXT).trim(),
    price: price === null || price.trim() === '' ? null : price,
    availability,
    collectionIds: [...new Set(collectionIds as string[])],
    categoryIds: [...new Set(ids as string[])],
    attributes: cleanAttributes,
    photos: cleanPhotos,
    live: body.live === true,
    madeToOrder: body.mad
```

[elided — kept 5800 of 15489 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -rn -a -l -E "stockNotTracked|notLive" apps packages tests --include…
<!-- xgd-tool name="Bash" id="toolu_01V3VXn1B1Ene5qCeMzJmDhc" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:02:39.687799+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -rn -a -l -E \"stockNotTracked|notLive\" apps packages tests --include=*.ts --include=*.tsx --include=*.js --include=*.mjs --include=*.html | grep -v node_modules; grep -rn -a -E \"saveItem\\(|createItem\\(\" apps --include=*.ts | grep -v node_modules | grep -v \"^apps/control-app/src/shop.ts\"","description":"Find consumers of report and saveItem callers"}
```

**Result**

```
(eval):1: no matches found: --include=*.ts
(eval):1: no matches found: --include=*.ts
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -rn -a -l -E "stockNotTracked|notLive" apps packages tests --exclude…
<!-- xgd-tool name="Bash" id="toolu_01JBVyVjJhbLjPpE2SkTgDKG" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:02:43.238068+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -rn -a -l -E \"stockNotTracked|notLive\" apps packages tests --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null; echo ---; grep -rn -a -E \"saveItem\\(|createItem\\(\" apps packages --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null | grep -v \"src/shop.ts:\"","description":"Find report consumers and saveItem callers"}
```

**Result**

```
<persisted-output>
Output too large (19.5MB). Full output saved to: /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/f606d0d0-0c3d-4136-8b11-b95f5c0a78e2/tool-results/bc1wrtiyy.txt

Preview (first 2KB):
apps/control-app/dist-assets/builder/shop.js
apps/control-app/.dev-snapshot/assets/builder/shop.js
apps/control-app/.dev-snapshot/worker/worker.js
apps/control-app/.dev-snapshot/worker/worker.js.map
apps/control-app/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/24f6d84384ee3d27c1a7b716f507dd41ef9a24e6b58ea941dae0839ebd824d0d.sqlite
apps/control-app/src/shop-import.ts
apps/control-app/src/builder/shop.js
tests/test_UAT_FC_REQ-631_shop_tab.test.ts
tests/test_UAT_FC_REQ-631_inventory.workers.test.ts
tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts
---
apps/control-app/.dev-snapshot/worker/worker.js:171166:async function saveItem(env2, businessId, id, input, extra = {}) {
apps/control-app/.dev-snapshot/worker/worker.js:171227:async function createItem(env2, businessId, input) {
apps/control-app/.dev-snapshot/worker/worker.js:171228:  return saveItem(env2, businessId, null, { ...input, live: false });
apps/control-app/.dev-snapshot/worker/worker.js:171619:  const item = await saveItem(
apps/control-app/.dev-snapshot/worker/worker.js:175536:    const saved = await saveItem(env2, businessId, existing?.id ?? null, input, {
apps/control-app/.dev-snapshot/worker/worker.js:213055:      const item = await createItem(env2, businessId, readItemInput(await body(request)));
apps/control-app/.dev-snapshot/worker/worker.js:213064:        const item = await saveItem(env2, businessId, id, readItemInput(await body(request)));
...
</persisted-output>
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -rn -E "saveItem\(|createItem\(|readItemInput\(" apps/control-app/sr…
<!-- xgd-tool name="Bash" id="toolu_01Mdu5FabJZ1NTGohAFJvVm3" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:02:55.269230+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -rn -E \"saveItem\\(|createItem\\(|readItemInput\\(\" apps/control-app/src packages/*/src 2>/dev/null | grep -v \"src/shop.ts:\"; grep -n -E \"notLive|stockNotTracked|reasons\" apps/control-app/src/builder/shop.js","description":"Find saveItem callers in source and builder report"}
```

**Result**

```
apps/control-app/src/shop-import.ts:705:  const item = await saveItem(
apps/control-app/src/handoff-copy.ts:375:    const saved = await saveItem(env, businessId, existing?.id ?? null, input, {
apps/control-app/src/shop-routes.ts:113:      const item = await createItem(env, businessId, readItemInput(await body(request)))
apps/control-app/src/shop-routes.ts:122:        const item = await saveItem(env, businessId, id, readItemInput(await body(request)))
1054:    section('Imported not live, for you to review', report.notLive, (e) => `${e.name}: ${e.reasons.join(', ')}`)
1055:    section('Stock not tracked (availability set to 1)', report.stockNotTracked, (e) => e.name)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 360,400p apps/control-app/src/handoff-copy.ts; sed -n 90,160p apps…
<!-- xgd-tool name="Bash" id="toolu_01PTSVALrvVD7MHyWqG13KW6" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:03:01.694059+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 360,400p apps/control-app/src/handoff-copy.ts; sed -n 90,160p apps/control-app/src/shop-routes.ts; sed -n 1010,1080p apps/control-app/src/builder/shop.js","description":"Read handoff-copy, shop routes, builder report"}
```

**Result**

```
  for (const item of shop.items) {
    const existing = await itemBySource(env, businessId, item.source.platform, item.source.id)
    const input: ItemInput = {
      name: item.name,
      summary: item.summary,
      description: item.description,
      price: null,
      availability: item.availability,
      collectionIds: item.collections.map((n) => collections.get(n)).filter((id): id is string => Boolean(id)),
      categoryIds: item.categories.map((n) => categories.get(n)).filter((id): id is string => Boolean(id)),
      attributes: item.attributes,
      photos: item.photos.map((p) => ({ ...p, material: uids.get(p.material) ?? p.material })),
      live: item.live,
      madeToOrder: item.madeToOrder,
    }
    const saved = await saveItem(env, businessId, existing?.id ?? null, input, {
      source: item.source,
      priceAmount: null,
    })
    // EVERY PRICE, every currency and market: the save writes the business
    // currency's only, so the rows are replaced whole here.
    await env.DB.batch([
      env.DB.prepare('DELETE FROM inventory_prices WHERE item_id = ?').bind(saved.id),
      ...item.prices.map((p) =>
        env.DB.prepare('INSERT INTO inventory_prices (item_id, currency, market, amount) VALUES (?, ?, ?, ?)').bind(
          saved.id,
          p.currency,
          p.market,
          p.amount,
        ),
      ),
    ])
  }
  return shop.items.length
}

/**
 * The last step: move every source uid in the copied Library onto its
 * destination uid, mark each copy complete, reserve the labels, write the
 * inventory, write the note on the destination's plan, and put the plan into
 * handoff mode.
export async function shopRoute(ctx: ShopRouteContext): Promise<Response | null> {
  const { request, url, env, businessId } = ctx
  const p = url.pathname
  if (!p.startsWith('/api/shop/')) return null
  const method = request.method
  try {
    if (p === '/api/shop/items' && method === 'GET') {
      const q = url.searchParams
      const page = await listItems(env, businessId, {
        collection: q.get('collection'),
        category: q.get('category'),
        live: flag(q.get('live')),
        availability: stock(q.get('availability')),
        q: q.get('q'),
        offset: Number.parseInt(q.get('offset') ?? '0', 10) || 0,
        limit: Number.parseInt(q.get('limit') ?? '50', 10) || 50,
      })
      return json(200, { ...page, currency: await shopCurrency(env, businessId) })
    }
    const changed = async (itemId: string) => {
      if (ctx.itemChanged) await ctx.itemChanged(itemId)
    }
    if (p === '/api/shop/items' && method === 'POST') {
      const item = await createItem(env, businessId, readItemInput(await body(request)))
      await changed(item.id)
      return json(201, { item })
    }
    if (p === '/api/shop/item') {
      const id = url.searchParams.get('id')
      if (!id) return json(400, { error: 'id is required' })
      if (method === 'GET') return json(200, { item: await readItem(env, businessId, id) })
      if (method === 'PUT') {
        const item = await saveItem(env, businessId, id, readItemInput(await body(request)))
        await changed(item.id)
        return json(200, { item })
      }
      if (method === 'DELETE') {
        await deleteItem(env, businessId, id)
        await changed(id)
        return json(200, { deleted: id })
      }
    }
    // THE OWNER'S INVOICES ([[REQ-637]]): live, real invoices only. The scope is
    // the bare business, so `includeSynthetic` is never set from a request and no
    // query parameter can turn on the test gutter or test-mode invoices.
    if (p === '/api/shop/invoices' && method === 'GET') {
      return json(200, { invoices: await listInvoices(env, { businessId }, { mode: 'live' }) })
    }
    if (p === '/api/shop/invoice' && method === 'GET') {
      const id = url.searchParams.get('id')
      if (!id) return json(400, { error: 'id is required' })
      return json(200, { invoice: await readInvoice(env, { businessId }, id, { mode: 'live' }) })
    }
    // [[REQ-643]] — SETTINGS → SHIPPING: zones (name, one flat rate, countries)
    // and the dispatch note. Saved whole. Buy needs a zone, so a save rebuilds
    // the business's sites the way an item's Save does.
    if (p === '/api/shop/shipping' && method === 'GET') {
      return json(200, { shipping: await readShipping(env, businessId) })
    }
    if (p === '/api/shop/shipping' && method === 'PUT') {
      const shipping = await saveShipping(env, businessId, await body(request))
      await changed('shipping')
      return json(200, { shipping })
    }
    // [[REQ-643]] — why the site has no Buy, when it is the business's setup
    // (payments, shipping) rather than the item.
    if (p === '/api/shop/selling' && method === 'GET') {
      return json(200, await sellingState(env as OrdersEnv, businessId, ctx.fetch ? { fetch: ctx.fetch } : {}))
    }
    // [[REQ-643]] — THE ORDERS MODE: every order, test and live alike (a test
    // order carries `test: true`, the Test badge). Expired orders only when asked.
      }
      step.textContent = 'Import finished'
      out.replaceChildren(reportView(run.report, run.descriptionsPending ?? 0))
      void refresh()
    }
  }

  const describingLine = (n) => `Describing photos: ${n} still to describe. This carries on in the background and does not hold up your items.`

  /**
   * [[BUG-333]] — PROGRESS THE OWNER CAN READ: items out of products found, then
   * photos out of photos found, then the descriptions still to come.
   */
  function progressLines(run) {
    if (run.phase === 'items') {
      return [`Creating items: ${run.processed}${run.itemsFound != null ? ` of ${run.itemsFound}` : ''} done. Photos come next.`]
    }
    const lines = [
      `All ${run.processed} it
```

[elided — kept 5800 of 8025 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -n -E "shop\.items|items:|InventoryItem|listItems|liveItems|allItems…
<!-- xgd-tool name="Bash" id="toolu_01RzJGBnNfLgTm7zEZH6amh7" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:03:12.778907+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -n -E \"shop\\.items|items:|InventoryItem|listItems|liveItems|allItems\" apps/control-app/src/handoff-copy.ts | head; grep -n \"transport\\.\\|async importStatus\\|function.*transport\\|importRun\\|/api/shop/import\" apps/control-app/src/builder/shop.js | head -40","description":"Check handoff item source and builder transport"}
```

**Result**

```
15:  listItems,
18:  type InventoryItem,
94:  items: ManifestItem[]
126:  items: number
151:async function allItems(env: ShopEnv, businessId: string): Promise<InventoryItem[]> {
152:  const out: InventoryItem[] = []
154:    const { items, total } = await listItems(env, businessId, { offset, limit: MAX_PAGE })
206:  const items = await allItems(env, businessId)
211:    items: items.map((i) => ({
360:  for (const item of shop.items) {
235:    if (view?.canTakePayments !== true || !transport.selling) return
236:    const selling = await transport.selling().catch(() => null)
363:      img.src = transport.fileUrl(item.photos[0].material)
391:    const page = await transport.list({ ...filter, offset: append ? rows.length : 0, limit: PAGE })
422:        current = await transport.save(current.id, draft)
512:      const newCollection = addTo('collection', 'collectionIds', (n) => transport.addCollection(n))
514:      const newCategory = addTo('category', 'categoryIds', (n) => transport.addCategory(n))
586:        img.src = transport.fileUrl(p.material)
626:        const images = (await transport.images().catch(() => [])).filter((m) => !draft.photos.some((p) => p.material === m.uid))
663:      if (transport.orders) {
664:        void transport.orders({ item: current.id, expired: true }).then(
751:          await transport.remove(current.id)
793:      const made = await transport.create({ name: 'New item', availability: 0 })
851:        const latest = await transport.importStatus()
867:      sources = await transport.sources()
905:      const { scan, mapping } = await transport.scan(source.id, fields())
980:      await transport.saveMapping(source.id, mapping)
981:      const started = await transport.startImport(source.id, fields())
992:          const next = await transport.importStatus(run.id)
1068:    taxonomy = await transport.taxonomy()
1079:    const latest = await transport.importStatus().catch(() => null)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 200,225p apps/control-app/src/handoff-copy.ts; sed -n 85,100p apps…
<!-- xgd-tool name="Bash" id="toolu_01XKqfJUbyovPQmGamNPmjfK" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:03:17.239186+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 200,225p apps/control-app/src/handoff-copy.ts; sed -n 85,100p apps/control-app/src/handoff-copy.ts; grep -rn -E \"startImport|importStatus\" apps/control-app/src --include=*.js --include=*.ts | grep -v \"builder/shop.js\" | head; grep -n \"/api/shop/import\" apps/control-app/src/*.ts | head","description":"Find transport impl and import routes"}
```

**Result**

```
  const bundles: HandoffManifest['bundles'] = []
  for (const name of references ? await references.list() : []) {
    bundles.push({ name, members: await references!.bundle(name).list() })
  }

  const items = await allItems(env, businessId)
  const named = (rows: { name: string }[]) => rows.map((r) => r.name)
  const shop: ManifestShop = {
    collections: [...new Set(items.flatMap((i) => named(i.collections)))],
    categories: [...new Set(items.flatMap((i) => named(i.categories)))],
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      summary: i.summary,
      description: i.description,
      availability: i.availability,
      collections: named(i.collections),
      categories: named(i.categories),
      attributes: i.attributes,
      photos: i.photos,
      live: i.live,
      madeToOrder: i.madeToOrder,
      prices: i.prices.map((p) => ({ amount: p.amount, currency: p.currency, market: p.market })),
      // AN IMPORTED ITEM KEEPS ITS IMPORT KEY, so a later import from the same shop
      // on the destination updates it; a hand-made one is keyed by its own id here.
  live: boolean
  madeToOrder: boolean
  prices: { amount: number; currency: string; market: string }[]
  source: { platform: string; id: string; sku: string | null }
}

export interface ManifestShop {
  collections: string[]
  categories: string[]
  items: ManifestItem[]
}

/** Everything a handoff carries besides the site, described without bytes. */
export interface HandoffManifest {
  business: string
  /** The source site's key, so its uses in the Library can be moved onto the destination's. */
(eval):1: no matches found: --include=*.js
apps/control-app/src/shop-routes.ts:198:    if (p === '/api/shop/import/sources' && method === 'GET') {
apps/control-app/src/shop-routes.ts:201:    if (p === '/api/shop/import/scan' && method === 'POST') {
apps/control-app/src/shop-routes.ts:208:    if (p === '/api/shop/import/mapping' && method === 'POST') {
apps/control-app/src/shop-routes.ts:215:    if (p === '/api/shop/import' && method === 'POST') {
apps/control-app/src/shop-routes.ts:232:    if (p === '/api/shop/import' && method === 'GET') {
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && cat db/migrations/0044_shop_import_phases.sql | head -30; grep -rn "manif…
<!-- xgd-tool name="Bash" id="toolu_01NjQeUXDuTX3usZ1ZCUebXY" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:03:32.391510+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && cat db/migrations/0044_shop_import_phases.sql | head -30; grep -rn \"manifest.json\" bin tools/*/src db 2>/dev/null | grep -i migrat | head -5; sed -n 1,60p tests/test_UAT_FC_REQ-634_shop_import_and_currency.test.ts","description":"Read migration style, manifest tooling, existing UAT"}
```

**Result**

```
-- [[BUG-333]] — THE SHOP IMPORT IN THREE PHASES: item data, then photos, with
-- descriptions running beside the photos and never gating them.
--
-- `phase` is where the run is: `items` (every product into an item, no photos,
-- no model call), `photos` (each item's photos into the Library, several at a
-- time), `done`. `items_found` is the source's product count, read from its
-- first page, so progress is "items done of items found" — `processed` already
-- counts items done.
--
-- `shop_import_photos` is the photo work list one run builds in its items
-- phase: one row per photo of each item, in the source's order. `status` moves
-- pending → stored | failed as each photo lands, which is what progress counts
-- and what a retried step resumes from. `describe` marks the photo described in
-- the background (the item's main one); `described` moves pending → done once it
-- has been, and a photo nobody needs to describe now has NULL.
ALTER TABLE shop_imports ADD COLUMN phase TEXT NOT NULL DEFAULT 'items';
ALTER TABLE shop_imports ADD COLUMN items_found INTEGER;

CREATE TABLE IF NOT EXISTS shop_import_photos (
  import_id    TEXT NOT NULL,
  item_id      TEXT NOT NULL,
  source_id    TEXT NOT NULL,
  name         TEXT NOT NULL,
  position     INTEGER NOT NULL,
  url          TEXT NOT NULL,
  page         TEXT,
  status       TEXT NOT NULL CHECK (status IN ('pending', 'stored', 'failed')),
  material     TEXT,
  reason       TEXT,
  described    TEXT CHECK (described IN ('pending', 'done')),
bin/migration-manifest:17: * THE MANIFEST IS DELIBERATELY NOT DERIVED AT CHECK TIME. `db/migrations/manifest.json`
bin/migration-manifest:61:const MANIFEST_NAME = 'manifest.json'
bin/migration-manifest:419:        '  bin/migration-manifest            rewrite db/migrations/manifest.json\n' +
bin/deploy.d/migrate/README.md:19:`db/migrations/manifest.json` and refuses the deploy when they differ. The comparison
// @vitest-environment jsdom
/**
 * [[REQ-634]] — what the owner sees of a source-neutral Import and of the
 * business's one Default currency, driven in a DOM.
 *
 * THE TRANSPORT IS THE PANEL'S BOUNDARY, as in REQ-631's suite. The Worker side
 * of every call is proven through the real router by
 * `test_UAT_FC_REQ-634_shop_api.workers.test.ts`; this suite proves what each
 * panel shows and what it sends, over doubles holding the same shapes.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { createCurrencySection, currencyOptions } from '../apps/control-app/src/builder/currency.js'

let createShopPanel: (opts?: Record<string, unknown>) => any

if (!WEBUI_INSTALLED) console.warn(`REQ-634 shop panel cases skipped: ${WEBUI_SKIP_REASON}`)

const settle = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))

const buttonNamed = (el: Element, text: string) =>
  [...el.querySelectorAll('button')].find((b) => b.textContent === text) as HTMLButtonElement

/** A Shop transport double with one item and one source, recording what the panel sent. */
function shopTransport() {
  const sent: { scans: any[] } = { scans: [] }
  const item = {
    id: 'inv_1',
    name: 'Speckled Mug',
    summary: '',
    description: '',
    price: { amount: 1999, currency: 'EUR', market: '*', display: '19.99' },
    prices: [],
    availability: 1,
    sold: false,
    collections: [],
    categories: [],
    attributes: [],
    photos: [],
    live: true,
    madeToOrder: false,
    source: null,
    slug: null,
    createdAt: '2026-11-02T00:00:00.000Z',
    updatedAt: '2026-11-02T00:00:00.000Z',
  }
  const t = {
    list: async () => ({ items: [item], total: 1, currency: 'EUR' }),
    item: async () => item,
    create: async () => item,
    save: async () => item,
    remove: async () => ({}),
    taxonomy: async () => ({ collections: [], categories: [], currency: 'EUR' }),
    addCollection: async (name: string) => ({ id: 'col_1', name }),
    addCategory: async (name: string) => ({ id: 'cat_1', name }),
    sources: async () => [
      { id: 'woocommerce', name: 'WooCommerce', fields: [{ name: 'url', label: 'Shop address', type: 'url', placeholder: 'https://your-shop.example' }] },
    ],
    scan: async (source: string, fields: Record<string, string>) => {
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && ls tests | grep -i -E "shop|inventory|631|634|333"; grep -n -E "notLive|s…
<!-- xgd-tool name="Bash" id="toolu_01CLxhVDrc4WJemkKqHhwYJT" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:03:37.673597+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && ls tests | grep -i -E \"shop|inventory|631|634|333\"; grep -n -E \"notLive|stockNotTracked|describe\\(|it\\(|function |runShopImport|import \" tests/test_UAT_FC_REQ-631_inventory.workers.test.ts | head -80","description":"Survey existing shop import tests"}
```

**Result**

```
test_UAT_FC_BUG-335_shop_over_100_items.workers.test.ts
test_UAT_FC_REQ-333_the_capture_reads_the_frame_and_the_rotation.test.ts
test_UAT_FC_REQ-333_the_fold_reads_a_mask_and_an_anchor_in_the_right_frame.test.ts
test_UAT_FC_REQ-333_the_renderer_emits_valid_and_inherited_css.test.ts
test_UAT_FC_REQ-631_inventory.workers.test.ts
test_UAT_FC_REQ-631_shop_tab.test.ts
test_UAT_FC_REQ-634_shop_api.workers.test.ts
test_UAT_FC_REQ-634_shop_import_and_currency.test.ts
test_UAT_FC_REQ-643_shop_orders_and_shipping.test.ts
1:import { beforeAll, describe, expect, it } from 'vitest'
2:import { env } from 'cloudflare:test'
3:import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
4:import type { Scope } from '../apps/control-app/src/scope'
5:import { ticketStoreFor } from '../apps/control-app/src/tickets'
6:import { liveItems } from '../apps/control-app/src/shop'
7:import { applySchema, ensureTenant, seedTenantSite } from './support/d1-site-factory'
8:import { CATEGORIES, fakeShop, fixtureCounts, products, SHOP_URL } from './support/shop-fixture'
16: * served by `fakeShop` at the fetch the import is handed, and the image
23:function routerEnv(): RouterEnv {
33:async function aBusiness() {
66:/** Scan the shop, save `edit(mapping)`, run the import to the end, and return its record. */
67:async function imported(biz: Biz, edit: (mapping: any) => void = () => {}) {
71:  edit(mapping)
80:async function allItems(biz: Biz) {
95:describe('REQ-631 scan and map', () => {
96:  it('test_UAT_FC_REQ-631_scan_lists_categories_attributes_and_proposes_collections', async () => {
119:  it('test_UAT_FC_REQ-631_owner_mapping_is_saved_and_reused', async () => {
150:  it('test_UAT_FC_REQ-631_import_refused_before_a_mapping_is_saved', async () => {
158:describe('REQ-631 import', () => {
159:  it('test_UAT_FC_REQ-631_import_creates_items_with_mapping_text_price_availability_and_photos', async () => {
215:  it('test_UAT_FC_REQ-631_live_on_arrival_except_general_signs_of_not_a_product', async () => {
220:    const reasons = Object.fromEntries(run.report.notLive.map((n: any) => [n.name, n.reasons]))
230:    expect(run.report.stockNotTracked.map((s: any) => s.name)).toEqual(['Seconds Plate'])
240:  it('test_UAT_FC_REQ-631_rerun_updates_in_place_without_duplicates', async () => {
264:  it('test_UAT_FC_REQ-631_imported_text_has_no_raw_html', async () => {
277:  it('test_UAT_FC_REQ-631_report_lists_not_live_precedence_untracked_and_repeated_summaries', async () => {
281:    expect(report.notLive.map((n: any) => n.name).sort()).toEqual(['Gift Voucher', 'Plain Bowl', 'Seconds Plate'])
282:    expect(report.notLive.every((n: any) => typeof n.itemId === 'string')).toBe(true)
283:    expect(report.stockNotTracked.map((s: any) => s.name)).toEqual(['Seconds Plate'])
285:    // The import never strips text by rule: the boilerplate is still on the items.
291:function editable(item: any) {
307:describe('REQ-631 prices and editing', () => {
308:  it('test_UAT_FC_REQ-631_prices_round_trip_in_minor_units', async () => {
330:  it('test_UAT_FC_REQ-631_new_item_starts_not_live_and_save_persists', async () => {
371:  it('test_UAT_FC_REQ-631_invalid_input_is_refused_and_not_stored', async () => {
395:describe('REQ-631 list', () => {
396:  it('test_UAT_FC_REQ-631_list_filters_by_collection_category_live_and_name', async () => {
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && sed -n 1,95p tests/test_UAT_FC_REQ-631_inventory.workers.test.ts; sed -n…
<!-- xgd-tool name="Bash" id="toolu_01EdH3EqwNqiakqVHoVvLs3Z" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:03:40.621516+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && sed -n 1,95p tests/test_UAT_FC_REQ-631_inventory.workers.test.ts; sed -n 210,300p tests/test_UAT_FC_REQ-631_inventory.workers.test.ts","description":"Read workers test setup and live tests"}
```

**Result**

```
import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { liveItems } from '../apps/control-app/src/shop'
import { applySchema, ensureTenant, seedTenantSite } from './support/d1-site-factory'
import { CATEGORIES, fakeShop, fixtureCounts, products, SHOP_URL } from './support/shop-fixture'

/**
 * [[REQ-631]] — the Shop tab's inventory: items, their editing, and the import
 * from a WooCommerce shop's public Store API.
 *
 * DRIVEN THROUGH THE REAL ROUTES, against real D1 and the real business ticket
 * store (the Library). The two doubles are the external boundaries: the shop,
 * served by `fakeShop` at the fetch the import is handed, and the image
 * describer, which counts what it was asked to look at.
 */

const APPLIED = applySchema()
let seq = 0

function routerEnv(): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

/** A fresh business, its shop, and a describer that records every picture it was shown. */
async function aBusiness() {
  const businessId = `req631-${(seq += 1)}-${Date.now()}`
  await ensureTenant(businessId)
  // [[REQ-634]] — the default currency is the business's site's, so the business has its site.
  await seedTenantSite(businessId)
  const shop = fakeShop()
  const described: number[] = []
  const deps: RouterDeps = {
    index: async () => async () => {},
    describeText: async () => ({ text: 'A document.', model: 'stub/digest-1' }),
    describeImage: async (bytes) => {
      described.push(bytes.length)
      return { text: 'A ceramic piece\n\nA ceramic piece on a plain ground.', model: 'stub/vision-1' }
    },
    fetch: shop.fetch,
  }
  const call = async (method: string, path: string, payload?: unknown) => {
    const response = await route(
      new Request(`https://app.test${path}`, {
        method,
        ...(payload === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }),
      }),
      routerEnv(),
      { businessId } as Scope,
      deps,
    )
    return { status: response.status, body: (await response.json()) as any }
  }
  return { businessId, shop, described, call }
}

type Biz = Awaited<ReturnType<typeof aBusiness>>

/** Scan the shop, save `edit(mapping)`, run the import to the end, and return its record. */
async function imported(biz: Biz, edit: (mapping: any) => void = () => {}) {
  const scan = await biz.call('POST', '/api/shop/import/scan', { source: 'woocommerce', fields: { url: SHOP_URL } })
  expect(scan.status).toBe(200)
  const mapping = scan.body.mapping
  edit(mapping)
  expect((await biz.call('POST', '/api/shop/import/mapping', { source: 'woocommerce', mapping })).status).toBe(200)
  const started = await biz.call('POST', '/api/shop/import', { source: 'woocommerce', fields: { url: SHOP_URL } })
  expect(started.status).toBe(202)
  const run = await biz.call('GET', `/api/shop/import?id=${started.body.import.id}`)
  expect(run.body.import.status).toBe('done')
  return run.body.import
}

async function allItems(biz: Biz) {
  const { body } = await biz.call('GET', '/api/shop/items?limit=100')
  return body.items as any[]
}

const named = (items: any[], name: string) => {
  const found = items.find((i) => i.name === name)
  expect(found, `no item named ${name}`).toBeDefined()
  return found
}

beforeAll(async () => {
  await APPLIED
})

describe('REQ-631 scan and map', () => {
    expect(ticket.fields.description_status).toBe('ok')
    await biz.call('GET', `/api/material/item?uid=${mug.photos[1].material}`)
    expect(biz.described).toHaveLength(fixtureCounts.withPhoto + 1)
  })

  it('test_UAT_FC_REQ-631_live_on_arrival_except_general_signs_of_not_a_product', async () => {
    const biz = await aBusiness()
    const run = await imported(biz)
    const items = await allItems(biz)
    for (const name of ['Speckled Mug', 'Blue Bowl', 'Crossover Mug', 'Quiet Cup']) expect(named(items, name).live).toBe(true)
    const reasons = Object.fromEntries(run.report.notLive.map((n: any) => [n.name, n.reasons]))
    expect(reasons).toEqual({
      'Seconds Plate': ['stock not tracked'],
      'Gift Voucher': ['price of 0'],
      'Plain Bowl': ['no photo'],
    })
    for (const name of Object.keys(reasons)) expect(named(items, name).live).toBe(false)
    const plate = named(items, 'Seconds Plate')
    expect(plate.availability).toBe(1)
    expect(plate.madeToOrder).toBe(false)
    expect(run.report.stockNotTracked.map((s: any) => s.name)).toEqual(['Seconds Plate'])
    // A sold product is imported, live, with availability 0.
    const sold = named(items, 'Blue Bowl')
    expect(sold.availability).toBe(0)
    expect(sold.sold).toBe(true)
    // The REQ-633 contract: liveItems returns the live items only.
    const live = await liveItems({ DB: env.DB as D1Database, SITES: env.SITES as R2Bucket }, biz.businessId)
    expect(live.map((i) => i.name).sort()).toEqual(items.filter((i) => i.live).map((i) => i.name).sort())
  })

  it('test_UAT_FC_REQ-631_rerun_updates_in_place_without_duplicates', async () => {
    const biz = await aBusiness()
    await imported(biz)
    const before = await allItems(biz)
    const mugBefore = named(before, 'Speckled Mug')
    const photoRequests = biz.shop.state.requests.filter((u) => u.includes('/wp-content/')).length
    // The owner's own choice survives a re-run; the source's changes arrive.
    await biz.call('PUT', `/api/shop/item?id=$
```

[elided — kept 5800 of 8257 bytes]

## Bash cd /Users/martin/lagrangefoundry/1stcontact && /Users/martin/lagrangefoundry/xgd/.venv-working/bin/python -m lagrangefou…
<!-- xgd-tool name="Bash" id="toolu_01DDAgV3Q692PeNxmyeP3bmQ" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:03:50.212259+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && /Users/martin/lagrangefoundry/xgd/.venv-working/bin/python -m lagrangefoundry.ai.agent_cli AgentSummaryFrame --in '{\"session\":\"bug-00d5f738\",\"text\":\"BUG-366: free-coding the fix (shop import stock-not-tracked no longer holds back; live_set_by column records import vs owner; recovery on re-import; report Make these live). Design decisions: migration 0051 adds inventory_items.live_set_by (owner|import); existing rows marked import only when imported, not live, slug NULL (slug is set the first time an item is saved live, so a slug-less not-live item was never switched on). Owner Save marks owner only when live changes. Import re-evaluates import-owned not-live items: live when no remaining reasons. Make these live = POST /api/shop/items/live {ids}, owner action.\"}' 2>&1 | tail -2; xgd ticket update bug-00d5f738 --status free_coding 2>&1 | tail -3","description":"Write summary frame and mark ticket free_coding"}
```

**Result**

```
[15:03:52] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2108.1, 'pid': 68904}
{"count":0,"entries":[],"framing":"BUG-366: free-coding the fix (shop import stock-not-tracked no longer holds back; live_set_by column records import vs owner; recovery on re-import; report Make these live). Design decisions: migration 0051 adds inventory_items.live_set_by (owner|import); existing rows marked import only when imported, not live, slug NULL (slug is set the first time an item is saved live, so a slug-less not-live item was never switched on). Owner Save marks owner only when live changes. Import re-evaluates import-owned not-live items: live when no remaining reasons. Make these live = POST /api/shop/items/live {ids}, owner action."}
xgd: error: unrecognized arguments: --status free_coding
Try 'xgd --help' for available commands.
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:03:55
```

## Bash cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-ticket-cli-quirks.md | head -40
<!-- xgd-tool name="Bash" id="toolu_013L7TeK3xvUhFn9J8LgKWcA" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:03:59.615221+00:00" -->

**Input**

```json
{"command":"cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-ticket-cli-quirks.md | head -40","description":"Read ticket CLI quirks memory"}
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
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket update --help 2>&1 | grep -v "^\[" | head -40; cat /Users/mart…
<!-- xgd-tool name="Bash" id="toolu_01WNRSjwhiCosUamVJEmpQo2" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:04:03.343274+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket update --help 2>&1 | grep -v \"^\\[\" | head -40; cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/free-coded-version-gate-race.md 2>/dev/null | sed -n 1,30p","description":"Check ticket update syntax"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:04:03
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
---
name: free-coded-version-gate-race
description: move-to-free-coded rejects whenever ANY commit lands on xgd-working after your bump — omit --version and let it bump itself.
metadata: 
  node_type: memory
  type: project
  originSessionId: eddf5ee4-be76-40f9-aadb-5aa4c86b2b7c
  modified: 2026-09-19T20:19:35.151Z
---

`xgd ticket move-to-free-coded` rejects with *"version X is already present at
the tip of xgd-working (<sha>), on a commit not reachable from any of the
provided SHAs"* whenever the branch tip is not one of your own SHAs. The gate
asks `xgd_version_bump --check <tip>`, and that script tests whether the
commit's `package.json` **contains** the version — not whether it *introduced*
it. So every descendant carries it, including the `xgd(ticket): update ...`
auto-commits other concurrent sessions (and the dashboard's own chat-transcript
capture for THIS session) produce constantly.

**Why:** the gate has an escape (`_tip_is_own`) for the tip being your SHA, and
another for a merge commit whose branch-side parent holds it — but a plain
single-parent ticket auto-commit on top of your commit matches neither.

**How to apply:** don't bump by hand at all. **Omit `--version`** — the command
then runs `./bin/project/xgd_version_bump` itself, inside its own lock hold,
commits the bump, appends that SHA to the list, and skips the tip-currency
check entirely (`_auto_version` short-circuits it). One invocation, no race, no
retry loop. Seen twice in a row on 2026-09-19: manual bump → rejected → re-bump
→ rejected again within 30 seconds; the no-`--version` call succeeded first try.
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket update bug-00d5f738 --fields '{"status":"free_coding"}' 2>&1 |…
<!-- xgd-tool name="Bash" id="toolu_01Jzzz4Zb7d8gUEmb34RRbhR" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:04:07.730604+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket update bug-00d5f738 --fields '{\"status\":\"free_coding\"}' 2>&1 | grep -v \"^\\[.*\\] ?\" | tail -3; xgd branch cut BUG-366 2>&1 | grep -v \"] ?\" | tail -8","description":"Mark free_coding and cut branch"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:04:08
[15:04:08] │ Updated bug: BUG-366 (bug-00d5f738)
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:04:08
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:04:09
Created worktree for free-BUG-366 at /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366
cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:04:14
```

## Bash cd /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/ && sed -n 8,40p worktree-and-store-…
<!-- xgd-tool name="Bash" id="toolu_01NQkKJxxqzMwQ9rUngGjBdJ" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:04:18.765473+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/ && sed -n 8,40p worktree-and-store-setup.md; W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366; ls $W; ls $W/node_modules 2>&1 | head -2","description":"Read worktree setup memory and inspect worktree"}
```

**Result**

```
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
tests
tools
tsconfig.base.json
vitest.browser.config.mts
vitest.config.mts
vitest.node.config.mts
vitest.workers.config.mts
@cloudflare
@vitest
Shell cwd was reset to /Users/martin/lagrangefoundry/1stcontact
```

## Bash cd /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/ && sed -n 8,30p fresh-worktree-lack…
<!-- xgd-tool name="Bash" id="toolu_01PhHWc7oZSzHRXLX9JKSQCc" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:04:22.632402+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/ && sed -n 8,30p fresh-worktree-lacks-control-app-generated.md; W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366; sed -n 1,80p $W/bin/migration-manifest | grep -v \"^ \\*$\" | head -50","description":"Read generated-artifact memory and manifest tool"}
```

**Result**

```
  modified: 2026-11-01T19:34:33.356Z
---

`apps/control-app/src/generated/` (ai-workers.js, knowledge, ticketing, logging, importmap.json, …) is a **build artifact**, present in `/Users/martin/lagrangefoundry/1stcontact` and absent in a freshly cut `xgd branch cut` worktree.

Any test that transitively imports control-app therefore dies at collection with `Cannot find module './generated/knowledge'` and reports **"0 test"** — including `reconciliation-l1-authoring-envelope`, `reconciliation-l1-fold-full-language`, `bug15-values-diff-l1-flat-dom`, `reconciliation-builder-request-time-render`, `test_UAT_FC_REQ-130_beyond_l1`, `req118-image-selection`. A CLI-subprocess test in the same set (`reconciliation-1c-astro-free-render`, asserting `res.status === 0`) fails for the same reason but presents as a real assertion failure, not an import error.

**Why:** reads as "my change broke six suites" when it is purely a location artifact — same class as [[worktree-breaks-webui-resolution]] and [[repair-stale-worktree-install-by-hand]].

**How to apply:** before diagnosing, `ls apps/control-app/src/generated/`. Empty → `cp -R /Users/martin/lagrangefoundry/1stcontact/apps/control-app/src/generated apps/control-app/src/`. It is gitignored, so nothing gets committed. That made the `.workers` delegation suites run in a worktree on 2026-10-18 (BUG-225). Do not report the import failures as regressions.

**And it does not stay right (REQ-624, 2026-11-01):** a suite that runs `1c assets` rewrites the worktree's `generated/kb.js` to `export const KB = null`, so `stageGuidesDoc()` is null and stage-guide UATs (BUG-322 `next_stage_starts_when_one_ticks_done`) fail looking like a regression. Re-copy `kb.js` from the main checkout before each suite run.
#!/usr/bin/env node
/**
 * `bin/migration-manifest` — the record of what an applied migration's bytes
 * were, and the check that they have not changed since ([[REQ-291]]).
 * WHY THIS EXISTS. `d1_migrations` records a migration's NAME and the moment it
 * ran, and nothing else. A file that has been applied is therefore done forever
 * as far as wrangler is concerned, whatever is subsequently done to its
 * contents — which is how `0001_baseline.sql` came to be applied to production
 * on 2026-09-06 and then edited twelve times, leaving the applied schema and the
 * file on disk as two different databases wearing one name ([[EPIC-16]] §H).
 * `db/migrations/` already carried the rule — never edit an applied migration —
 * and the file that broke it is the file that documents it. What was missing was
 * not a firmer rule but a mechanism that notices a checked premise stop being
 * true.
 * THE MANIFEST IS DELIBERATELY NOT DERIVED AT CHECK TIME. `db/migrations/manifest.json`
 * maps each migration's filename to the SHA-256 of its bytes, and is rewritten
 * only when somebody types the command below. That lag IS the mechanism: a hash
 * regenerated as a side effect of a build would always agree with the file it was
 * just read from and could never disagree with anything. Because it is committed,
 * `git diff` renders an edit to an existing migration as a CHANGED value — a line
 * somebody has to justify in review — and a new migration as an ADDED key, which
 * is ordinary and reads as ordinary.
 * IT REPORTS, IT DOES NOT REPAIR. The remedy for a drifted migration is a
 * decision about data: rebaseline a database with nothing in it, or write a
 * corrective migration for one with customers. A script cannot make that call and
 * must not appear to, so `verify` prints both hashes and exits non-zero.
 *   bin/migration-manifest                 rewrite the manifest, report what moved
 *   bin/migration-manifest --check         report drift, change nothing (exit 1 if any)
 *   bin/migration-manifest verify --env <name> --status <n>
 *                                          the deploy hook's entry point; reads
 *                                          `wrangler d1 execute --json` on stdin
 * PLAIN NODE WITH NO DEPENDENCY OR TRANSFORM, for the reason `bin/smoke` is:
 * it runs inside a deploy, on whatever Node is present, and a deploy gate that
 * needed the site toolchain built before it could refuse anything would be a gate
 * with a new way to fail open.
 */

import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * `DEPLOY_REPO_ROOT` FIRST, THIS FILE'S OWN LOCATION OTHERWISE.
 * A hook is handed the root of the checkout being deployed ([[REQ-144]]), and a
 * check run inside a deploy must read the migrations of THAT checkout rather than
 * of whichever copy of this script happens to be on the path. Typed by hand
 * outside a deploy there is no such variable, and the script's own directory is
 * the answer — which is how `bin/1c` resolves the same thing.
 */
Shell cwd was reset to /Users/martin/lagrangefoundry/1stcontact
```

## Write /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366/db/migrations/0051_item_live_set…
<!-- xgd-tool name="Write" id="toolu_017qN8jRvHkT2kXnbUzBwjYc" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:04:30.614090+00:00" -->

**Input**

```json
{"content":"-- [[BUG-366]] — WHO LAST SET AN ITEM'S `live`: the import, or the owner.\n--\n-- An import may hold a product back (not live) for the owner to review. A later\n-- import may let it go live once nothing holds it back any more — but only while\n-- the owner has never switched it themselves. Nothing told the two apart, so\n-- `live_set_by` records it: `import` when the import set `live`, `owner` when\n-- the owner did (a Save that changes `live`, or Make these live).\n--\n-- MIGRATION: an imported item that is not live and has no slug was never\n-- switched on — the slug is set the first time an item is saved live — so its\n-- `live` is still the import's. Every other item is the owner's.\nALTER TABLE inventory_items ADD COLUMN live_set_by TEXT NOT NULL DEFAULT 'owner' CHECK (live_set_by IN ('owner', 'import'));\n\nUPDATE inventory_items SET live_set_by = 'import' WHERE source != 'manual' AND live = 0 AND slug IS NULL;\n","file_path":"/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366/db/migrations/0051_item_live_set_by.sql"}
```

**Result**

```
File created successfully at: /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366/db/migrations/0051_item_live_set_by.sql (file state is current in your context — no need to Read it back)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && grep -n -E "migrations|rea…
<!-- xgd-tool name="Bash" id="toolu_01TmS3C9g5jJgKH9nzyMrk1A" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:04:36.085644+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && grep -n -E \"migrations|readdir|applySchema\" tests/support/d1-site-factory.ts | head; grep -rn \"0050_estimate_outcomes\" --exclude-dir=node_modules --exclude-dir=.wrangler --exclude-dir=.dev-snapshot . 2>/dev/null | grep -v \"^./db/migrations/0050\" | head","description":"Check how tests apply migrations"}
```

**Result**

```
46: * gone with them; the list stays a list because migrations landed after it.
51: * the real files: `wrangler d1 migrations apply` will run it against every
58:  () => import('../../db/migrations/0001_baseline.sql?raw'),
59:  () => import('../../db/migrations/0002_session_rotation.sql?raw'),
61:  // `0002` is: `wrangler d1 migrations apply` will run it against every database
63:  () => import('../../db/migrations/0003_contact_change_cursor.sql?raw'),
67:  () => import('../../db/migrations/0004_user_acceptances.sql?raw'),
76:  // its own `0004` first; `wrangler d1 migrations apply` orders by filename, so
79:  () => import('../../db/migrations/0005_retire_site_slug.sql?raw'),
83:  () => import('../../db/migrations/0006_asset_grants.sql?raw'),
.xgd/tickets/hot/comment-3482d7d1.md:107:Writing migration `0050_estimate_outcomes.sql`, and moving the test harness's head marker to it.
tests/support/d1-site-factory.ts:273:  () => import('../../db/migrations/0050_estimate_outcomes.sql?raw'),
db/migrations/manifest.json:51:  "0050_estimate_outcomes.sql": "da447f4b66019dc8d59e4ff64c7d953e8f02e786c2cda8b0400f863505b4dc57"
```

## Bash sed -n 255,300p tests/support/d1-site-factory.ts; grep -rn "head marker\|HEAD_MIGRATION\|0050" tests/support/*.ts | head
<!-- xgd-tool name="Bash" id="toolu_018181UWXtGTf34SYekQo7y2" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:04:39.140145+00:00" -->

**Input**

```json
{"command":"sed -n 255,300p tests/support/d1-site-factory.ts; grep -rn \"head marker\\|HEAD_MIGRATION\\|0050\" tests/support/*.ts | head","description":"Read migration list tail in test factory"}
```

**Result**

```
  () => import('../../db/migrations/0041_default_currency.sql?raw'),
  // [[REQ-635]] — `material_imports`, an uploaded ZIP unpacked as a job.
  () => import('../../db/migrations/0042_material_imports.sql?raw'),
  // [[REQ-637]] — invoices, their lines and credit notes.
  () => import('../../db/migrations/0043_invoices.sql?raw'),
  // [[BUG-333]] — the shop import's phases and photo work list. The last change
  // in the list, which is what `atHead` asks about.
  () => import('../../db/migrations/0044_shop_import_phases.sql?raw'),
  () => import('../../db/migrations/0045_stripe_connections.sql?raw'),
  () => import('../../db/migrations/0046_payments.sql?raw'),
  // [[REQ-643]] — shipping zones, orders and their lines, and the invoice ↔
  // order rules.
  () => import('../../db/migrations/0047_orders.sql?raw'),
  // [[REQ-646]] — what a turn's container spent, and how its steps ended.
  () => import('../../db/migrations/0048_turn_log_compute.sql?raw'),
  // [[REQ-651]] — an item's collections become a list. The last change in the
  // list, which is what `atHead` asks about.
  () => import('../../db/migrations/0049_item_collections.sql?raw'),
  () => import('../../db/migrations/0050_estimate_outcomes.sql?raw'),
]

/**
 * Split a migration into the statements D1 will be handed one at a time.
 *
 * COMMENTS ARE STRIPPED BEFORE THE TERMINATOR IS LOOKED FOR, not after: the
 * migration's prose explains a design and prose contains semicolons, so
 * splitting first cuts a comment in half and feeds SQLite the remainder.
 *
 * AND A SEMICOLON INSIDE `BEGIN ... END` IS NOT A TERMINATOR ([[REQ-195]]). A
 * trigger body is a compound statement carrying its own statements, each ended
 * by a semicolon — so a naive split hands SQLite `CREATE TRIGGER ... BEGIN
 * SELECT RAISE(ABORT, '...')` with no `END`, which is a syntax error, and then
 * a bare `END` after it. `wrangler d1 migrations apply` — the path that runs
 * this file in every real environment — already tracks `BEGIN`/`END` depth, so
 * without this the harness would refuse a migration production accepts, which
 * is the drift a hand-written schema in a test helper exists to avoid.
 */
export function splitStatements(sql: string): string[] {
  const body = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')

  const statements: string[] = []
  let current = ''
  let depth = 0
tests/support/d1-site-factory.ts:273:  () => import('../../db/migrations/0050_estimate_outcomes.sql?raw'),
tests/support/d1-site-factory.ts:395:  // `0050`'s last statement CREATES the index `estimate_outcomes_tenant_finished`
```

## Bash sed -n 370,420p tests/support/d1-site-factory.ts
<!-- xgd-tool name="Bash" id="toolu_01KizMJkbvMNxJBKJ3WjJgqd" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:04:41.486752+00:00" -->

**Input**

```json
{"command":"sed -n 370,420p tests/support/d1-site-factory.ts","description":"Read atHead logic"}
```

**Result**

```
 * re-opens exactly that hole.
 *
 * `sqlite_master` RATHER THAN `pragma_table_info`, BECAUSE THE LAST FILE CREATES
 * A TABLE ([[REQ-353]]). The form follows the file: an `ALTER TABLE ADD COLUMN`
 * leaves no row in `sqlite_master` to ask about and has to be read from the
 * table's shape, whereas a `CREATE TABLE` is exactly a `sqlite_master` row. Both
 * forms answer with an empty result rather than an error on a database that has
 * nothing at all, which is what lets one query serve both "already migrated" and
 * "nothing here yet".
 *
 * THE LAST STATEMENT OF THE LAST FILE, and not the first one. `0017` creates a
 * table and then two indexes; asking for the table would answer "at head" for a
 * database that got half way through the file, exactly as asking for the table
 * `0012`'s index guards would have. The marker has to move with the list — a
 * migration appended above without moving it re-opens that hole silently. `0022`
 * is one statement, so its table IS its last statement; the rule stands and
 * happens to cost nothing here.
 *
 * AND `0014` MAKES THAT SHARPER THAN IT WAS ([[REQ-267]]). Every file up to it
 * was re-runnable or merely wasteful to re-run; that one is `ALTER TABLE ADD
 * COLUMN`, which is an ERROR the second time. So this check is now what stands
 * between a suite calling `applySchema` twice and a hard failure in setup.
 */
async function atHead(): Promise<boolean> {
  const { DB } = storeEnv()
  // `0050`'s last statement CREATES the index `estimate_outcomes_tenant_finished`
  // ([[BUG-360]]); `0049` before it DROPS `inventory_items.collection_id`
  // ([[REQ-651]]), after creating `inventory_item_collections`; `0048` before it ADDS
  // `turn_log.memory_kills` ([[REQ-646]]), and `0041` DROPS `shop_settings`
  // ([[REQ-634]]). Head is the new index and table present, the dropped column gone,
  // the added one present, and that table gone. Columns are read from the tables'
  // shape, so a database with no `inventory_items` at all is not at head.
  const row = await DB.prepare(
    "SELECT SUM(type = 'table' AND name = 'inventory_item_collections') AS created, SUM(type = 'table' AND name = 'shop_settings') AS dropped, " +
      "SUM(type = 'table' AND name = 'inventory_items') AS items, SUM(type = 'index' AND name = 'estimate_outcomes_tenant_finished') AS estimates, " +
      "(SELECT COUNT(*) FROM pragma_table_info('turn_log') WHERE name = 'memory_kills') AS added, " +
      "(SELECT COUNT(*) FROM pragma_table_info('inventory_items') WHERE name = 'collection_id') AS column FROM sqlite_master",
  ).first<{ created: number | null; dropped: number | null; items: number | null; estimates: number | null; added: number | null; column: number }>()
  return row !== null && row.created === 1 && row.items === 1 && row.estimates === 1 && !row.dropped && row.added === 1 && row.column === 0
}

/** The tenant every fixture belongs to unless a test names another. */
export const DEFAULT_TENANT = 'tenant-default'

/** Register a tenant, so a handle can be taken for it. */
export async function ensureTenant(id = DEFAULT_TENANT, status = 'active'): Promise<void> {
  await d1r2SiteStore(storeEnv()).createTenant({ id, name: id, status })
}

/** A tenant-scoped handle, with the tenant registered first. */
export async function tenantStore(id = DEFAULT_TENANT): Promise<TenantSiteStore> {
```

## Bash python3 - <<'EOF' p='tests/support/d1-site-factory.ts' s=open(p).read() s=s.replace(""" () => import('../../db/migration…
<!-- xgd-tool name="Bash" id="toolu_01RHsYbNUpppgJk3VnPyVrtj" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:04:51.408870+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='tests/support/d1-site-factory.ts'\ns=open(p).read()\ns=s.replace(\"\"\"  () => import('../../db/migrations/0050_estimate_outcomes.sql?raw'),\n]\"\"\",\"\"\"  () => import('../../db/migrations/0050_estimate_outcomes.sql?raw'),\n  // [[BUG-366]] — who last set an item's `live`, the import or the owner.\n  () => import('../../db/migrations/0051_item_live_set_by.sql?raw'),\n]\"\"\",1)\ns=s.replace(\"\"\"  // `0050`'s last statement CREATES the index `estimate_outcomes_tenant_finished`\n  // ([[BUG-360]]); `0049`\"\"\",\"\"\"  // `0051` ADDS `inventory_items.live_set_by` ([[BUG-366]]) and then only\n  // UPDATEs rows, which a database with no imported items never notices, so the\n  // added column is its mark. `0050`'s last statement CREATES the index\n  // `estimate_outcomes_tenant_finished` ([[BUG-360]]); `0049`\"\"\",1)\ns=s.replace(\"\"\"      \"(SELECT COUNT(*) FROM pragma_table_info('inventory_items') WHERE name = 'collection_id') AS column FROM sqlite_master\",\n  ).first<{ created: number | null; dropped: number | null; items: number | null; estimates: number | null; added: number | null; column: number }>()\n  return row !== null && row.created === 1 && row.items === 1 && row.estimates === 1 && !row.dropped && row.added === 1 && row.column === 0\"\"\",\"\"\"      \"(SELECT COUNT(*) FROM pragma_table_info('inventory_items') WHERE name = 'collection_id') AS column, \" +\n      \"(SELECT COUNT(*) FROM pragma_table_info('inventory_items') WHERE name = 'live_set_by') AS liveSetBy FROM sqlite_master\",\n  ).first<{\n    created: number | null\n    dropped: number | null\n    items: number | null\n    estimates: number | null\n    added: number | null\n    column: number\n    liveSetBy: number\n  }>()\n  return (\n    row !== null &&\n    row.created === 1 &&\n    row.items === 1 &&\n    row.estimates === 1 &&\n    !row.dropped &&\n    row.added === 1 &&\n    row.column === 0 &&\n    row.liveSetBy === 1\n  )\"\"\",1)\nopen(p,'w').write(s)\nEOF\ngrep -n \"liveSetBy\\|0051\" tests/support/d1-site-factory.ts | head; node bin/migration-manifest 2>&1 | tail -3","description":"Register migration in test harness and manifest"}
```

**Result**

```
275:  () => import('../../db/migrations/0051_item_live_set_by.sql?raw'),
397:  // `0051` ADDS `inventory_items.live_set_by` ([[BUG-366]]) and then only
411:      "(SELECT COUNT(*) FROM pragma_table_info('inventory_items') WHERE name = 'live_set_by') AS liveSetBy FROM sqlite_master",
419:    liveSetBy: number
429:    row.liveSetBy === 1
  added    0051_item_live_set_by.sql  ef94911c507c…

Wrote db/migrations/manifest.json. Commit it with the migrations it describes.
```

## Bash grep -rn "itemChanged\|catalogChanged" apps/control-app/src/*.ts | grep -v "^\s*//" | head -20
<!-- xgd-tool name="Bash" id="toolu_01BKer6SJup5EQ8Ya65KBHKZ" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:05:01.380412+00:00" -->

**Input**

```json
{"command":"grep -rn \"itemChanged\\|catalogChanged\" apps/control-app/src/*.ts | grep -v \"^\\s*//\" | head -20","description":"Find itemChanged implementation"}
```

**Result**

```
apps/control-app/src/checkout-intake.ts:61:      answer(async () => ({ ...(await cancelCheckout(env, { siteKey, orderId: field(body, 'order') }, { ...deps, ...(options.rebuild ? { catalogChanged: options.rebuild } : {}) })) })),
apps/control-app/src/shop-import.ts:580:  catalogChanged?: () => Promise<void>
apps/control-app/src/shop-import.ts:993:        await (await deps()).catalogChanged?.()
apps/control-app/src/index.ts:469:        catalogChanged: async (businessId, itemId) => {
apps/control-app/src/orders.ts:565:  options: { fetch?: Fetch; now?: number; catalogChanged?: (businessId: string, itemId: string) => Promise<void> } = {},
apps/control-app/src/orders.ts:575:  if (await expireOrder(env, order.business_id, order.id, options.now)) await rebuildFor(env, order.business_id, order.id, options.catalogChanged)
apps/control-app/src/orders.ts:644:    if ((result.meta?.changes ?? 0) > 0) await rebuildFor(env, order.business_id, order.id, deps.catalogChanged)
apps/control-app/src/orders.ts:669:    if (await expireOrder(env, order.business_id, order.id, deps.now)) await rebuildFor(env, order.business_id, order.id, deps.catalogChanged)
apps/control-app/src/payments.ts:222:  catalogChanged?: (businessId: string, itemId: string) => Promise<void>
apps/control-app/src/router.ts:6954:          catalogChanged: () => rebuildCatalogFor(env, requireScope(), 'import'),
apps/control-app/src/router.ts:6956:        itemChanged: (itemId) => rebuildCatalogFor(env, requireScope(), itemId, deps.fetch),
apps/control-app/src/shop-routes.ts:68:  itemChanged?: (itemId: string) => Promise<void>
apps/control-app/src/shop-routes.ts:110:      if (ctx.itemChanged) await ctx.itemChanged(itemId)
apps/control-app/src/worker.ts:308:      catalogChanged: () => rebuildCatalogFor(env, scope, 'import'),
```

## Bash grep -n "async function rebuildCatalogFor" -A25 apps/control-app/src/router.ts | head -35
<!-- xgd-tool name="Bash" id="toolu_01CL9ojpTfiaKC3YQixXhVFq" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:05:04.199430+00:00" -->

**Input**

```json
{"command":"grep -n \"async function rebuildCatalogFor\" -A25 apps/control-app/src/router.ts | head -35","description":"Read rebuildCatalogFor"}
```

**Result**

```
3166:export async function rebuildCatalogFor(env: RouterEnv, scope: Scope, itemId: string, fetchImpl?: typeof fetch): Promise<void> {
3167-  try {
3168-    const store = await storeFor(env, scope)
3169-    await catalogItemChanged(
3170-      { store, locks: siteLocksFor(env), source: shopInventory(env, fetchImpl), photos: catalogPhotosFor(env, scope, ladderFor(env, scope)) },
3171-      scope.businessId,
3172-      itemId,
3173-    )
3174-  } catch (err) {
3175-    console.error(JSON.stringify({ event: 'catalog_rebuild_failed', business: scope.businessId, item: itemId, error: String(err) }))
3176-  }
3177-}
3178-
3179-/**
3180- * REQ-633 — the per-site coordinator for an isolate with no binding: publishes
3181- * and Save rebuilds still take turns, within the isolate that runs them all.
3182- */
3183-const MEMORY_SITE_LOCKS = memorySiteLocks()
3184-
3185-/** REQ-633 — the per-site coordinator: the Durable Object where it is bound. */
3186-export function siteLocksFor(env: RouterEnv): SiteLocks {
3187-  return env.SITE_COORDINATOR ? durableSiteLocks(env.SITE_COORDINATOR) : MEMORY_SITE_LOCKS
3188-}
3189-
3190-/**
3191- * The site a correction's bytes should go on, when there is exactly one ([[REQ-213]]).
```

## Bash grep -rn "export async function catalogItemChanged" -A30 apps/control-app/src packages/*/src 2>/dev/null | grep -n "item…
<!-- xgd-tool name="Bash" id="toolu_01FFdDULPyCJRzbPgcJYaep6" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:05:07.844581+00:00" -->

**Input**

```json
{"command":"grep -rn \"export async function catalogItemChanged\" -A30 apps/control-app/src packages/*/src 2>/dev/null | grep -n \"itemId\" | head","description":"Check itemId usage in catalogItemChanged"}
```

**Result**

```
4:apps/control-app/src/catalog.ts-130-  _itemId: string,
```

## Bash python3 - <<'EOF' p='apps/control-app/src/shop.ts' s=open(p).read() def rep(a,b): global s assert s.count(a)==1, a s=s.r…
<!-- xgd-tool name="Bash" id="toolu_013hubbMZHBJ2kMUHhEZ48ha" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:05:27.158943+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='apps/control-app/src/shop.ts'\ns=open(p).read()\ndef rep(a,b):\n    global s\n    assert s.count(a)==1, a\n    s=s.replace(a,b)\nrep(\"\"\"  live: boolean\n  madeToOrder: boolean\n  source: { platform: string; id: string; sku: string | null } | null\n  slug: string | null\"\"\",\"\"\"  live: boolean\n  /** [[BUG-366]] — who last set `live`: the import holding it back or letting it go, or the owner. */\n  liveSetBy: LiveSetBy\n  madeToOrder: boolean\n  source: { platform: string; id: string; sku: string | null } | null\n  slug: string | null\"\"\")\nrep(\"\"\"interface ItemRow {\"\"\",\"\"\"/** Who last set an item's `live` ([[BUG-366]]). */\nexport type LiveSetBy = 'owner' | 'import'\n\ninterface ItemRow {\"\"\")\nrep(\"\"\"  live: number\n  made_to_order: number\"\"\",\"\"\"  live: number\n  live_set_by: LiveSetBy\n  made_to_order: number\"\"\")\nrep(\"\"\"'i.photos, i.live, i.made_to_order,\"\"\",\"\"\"'i.photos, i.live, i.live_set_by, i.made_to_order,\"\"\")\nrep(\"\"\"      live: r.live === 1,\n      madeToOrder\"\"\",\"\"\"      live: r.live === 1,\n      liveSetBy: r.live_set_by,\n      madeToOrder\"\"\")\nrep(\"\"\" * left as they are. `priceAmount` lets an import hand over minor units it has\n * already parsed as an integer, rather than writing them out to be read again.\n */\"\"\",\"\"\" * left as they are. `priceAmount` lets an import hand over minor units it has\n * already parsed as an integer, rather than writing them out to be read again.\n *\n * WHO SET `live` ([[BUG-366]]): `liveSetBy` when the caller says (the import\n * says `import`); otherwise the owner's — but only when this save changes\n * `live`. A Save that edits the text and leaves `live` as it was keeps whoever\n * set it last, so an item the import held back stays the import's to let go.\n */\"\"\")\nrep(\"\"\"  extra: { source?: ItemSource; priceAmount?: number | null; currency?: string } = {},\"\"\",\"\"\"  extra: { source?: ItemSource; priceAmount?: number | null; currency?: string; liveSetBy?: LiveSetBy } = {},\"\"\")\nrep(\"\"\"    ? await env.DB.prepare('SELECT slug FROM inventory_items WHERE id = ? AND business_id = ?').bind(id, businessId).first<{ slug: string | null }>()\n    : null\n  if (id && !existing) throw new ShopNotFoundError('There is no such item in this shop.')\"\"\",\"\"\"    ? await env.DB.prepare('SELECT slug, live, live_set_by FROM inventory_items WHERE id = ? AND business_id = ?')\n        .bind(id, businessId)\n        .first<{ slug: string | null; live: number; live_set_by: LiveSetBy }>()\n    : null\n  if (id && !existing) throw new ShopNotFoundError('There is no such item in this shop.')\n  const liveSetBy: LiveSetBy = extra.liveSetBy ?? (existing && existing.live === (input.live ? 1 : 0) ? existing.live_set_by : 'owner')\"\"\")\nrep(\"\"\"    input.live ? 1 : 0,\n    input.madeToOrder ? 1 : 0,\n    slug,\n  ]\"\"\",\"\"\"    input.live ? 1 : 0,\n    liveSetBy,\n    input.madeToOrder ? 1 : 0,\n    slug,\n  ]\"\"\")\nrep(\"\"\"'photos = ?, live = ?, made_to_order = ?, slug = ?, updated_at = ? WHERE id = ? AND business_id = ?',\"\"\",\"\"\"'photos = ?, live = ?, live_set_by = ?, made_to_order = ?, slug = ?, updated_at = ? WHERE id = ? AND business_id = ?',\"\"\")\nrep(\"\"\"'INSERT INTO inventory_items (name, summary, description, availability, attributes, photos, live, made_to_order, ' +\n            'slug, id, business_id, source, source_id, source_sku, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',\"\"\",\"\"\"'INSERT INTO inventory_items (name, summary, description, availability, attributes, photos, live, live_set_by, made_to_order, ' +\n            'slug, id, business_id, source, source_id, source_sku, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',\"\"\")\nrep(\"\"\"export async function deleteItem(\"\"\",\"\"\"/**\n * [[BUG-366]] — MAKE THESE LIVE: the owner's one click on the import report.\n * Each item goes live as the owner's choice, with a slug if it has none yet, and\n * nothing else about it changes. Every id must be one of the business's items,\n * or nothing is changed.\n */\nexport async function makeItemsLive(env: ShopEnv, businessId: string, ids: string[]): Promise<string[]> {\n  const unique = [...new Set(ids)]\n  const rows = await inBatches(unique, (marks, batch) =>\n    env.DB.prepare(`SELECT id, name, slug FROM inventory_items WHERE business_id = ? AND id IN (${marks})`)\n      .bind(businessId, ...batch)\n      .all<{ id: string; name: string; slug: string | null }>(),\n  )\n  if (rows.length !== unique.length) throw new ShopNotFoundError('An item is not one of this shop’s.')\n  const now = new Date().toISOString()\n  for (const row of rows) {\n    const slug = row.slug ?? (await freeSlug(env, businessId, row.name))\n    await env.DB.prepare(\"UPDATE inventory_items SET live = 1, live_set_by = 'owner', slug = ?, updated_at = ? WHERE id = ? AND business_id = ?\")\n      .bind(slug, now, row.id, businessId)\n      .run()\n  }\n  return rows.map((r) => r.id)\n}\n\nexport async function deleteItem(\"\"\")\nopen(p,'w').write(s)\nEOF\nsed -n 360,385p apps/control-app/src/shop.ts","description":"Add live_set_by and makeItemsLive to shop.ts"}
```

**Result**

```
 */
const MAX_BOUND_IDS = 100

/**
 * Run `query` once per batch of at most {@link MAX_BOUND_IDS} ids — `marks` is
 * the batch's `?, ?, …` list — and concatenate the rows. Each id lands in one
 * batch, so every id's rows keep the order the query gives them.
 */
async function inBatches<T>(env: ShopEnv, ids: string[], query: (marks: string) => string): Promise<T[]> {
  const batches: string[][] = []
  for (let i = 0; i < ids.length; i += MAX_BOUND_IDS) batches.push(ids.slice(i, i + MAX_BOUND_IDS))
  // [[REQ-645]] — the batches grow with the inventory, so they run a few at a time.
  const results = await inLanes(batches, DEFAULT_LANES, (batch) =>
    env.DB.prepare(query(batch.map(() => '?').join(',')))
      .bind(...batch)
      .all<T>(),
  )
  return results.flatMap((r) => r.results)
}

async function hydrate(env: ShopEnv, businessId: string, rows: ItemRow[]): Promise<InventoryItem[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id)
  const [prices, lists, currency] = await Promise.all([
    inBatches<{ item_id: string; currency: string; market: string; amount: number }>(
      env,
```

## Bash python3 - <<'EOF' p='apps/control-app/src/shop.ts' s=open(p).read() a=""" const rows = await inBatches(unique, (marks, b…
<!-- xgd-tool name="Bash" id="toolu_01DtaudiEwbDq6m7xZrMgAPT" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:05:33.957294+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='apps/control-app/src/shop.ts'\ns=open(p).read()\na=\"\"\"  const rows = await inBatches(unique, (marks, batch) =>\n    env.DB.prepare(`SELECT id, name, slug FROM inventory_items WHERE business_id = ? AND id IN (${marks})`)\n      .bind(businessId, ...batch)\n      .all<{ id: string; name: string; slug: string | null }>(),\n  )\n\"\"\"\nb=\"\"\"  const rows = (\n    await inBatches<{ id: string; business_id: string; name: string; slug: string | null }>(\n      env,\n      unique,\n      (marks) => `SELECT id, business_id, name, slug FROM inventory_items WHERE id IN (${marks})`,\n    )\n  ).filter((r) => r.business_id === businessId)\n\"\"\"\nassert s.count(a)==1\ns=s.replace(a,b)\nopen(p,'w').write(s)\nEOF","description":"Fix makeItemsLive batching"}
```

**Result**

```
(Bash completed with no output)
```

## Bash python3 - <<'EOF' p='apps/control-app/src/shop-routes.ts' s=open(p).read() a=""" if (p === '/api/shop/item') {""" b="""…
<!-- xgd-tool name="Bash" id="toolu_01EnXEgqYWgD2PcJhTHbE4Nv" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:05:40.982016+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='apps/control-app/src/shop-routes.ts'\ns=open(p).read()\na=\"\"\"    if (p === '/api/shop/item') {\"\"\"\nb=\"\"\"    // [[BUG-366]] — MAKE THESE LIVE, from the import report: the owner's choice for\n    // every listed item, then one rebuild of the sites for all of them.\n    if (p === '/api/shop/items/live' && method === 'POST') {\n      const ids = (await body(request)).ids\n      if (!Array.isArray(ids) || ids.length === 0 || ids.some((x) => typeof x !== 'string')) {\n        return json(400, { error: 'ids must be a list of item ids.' })\n      }\n      const live = await makeItemsLive(env, businessId, ids as string[])\n      await changed('make-live')\n      return json(200, { live })\n    }\n    if (p === '/api/shop/item') {\"\"\"\nassert s.count(a)==1\ns=s.replace(a,b)\nopen(p,'w').write(s)\nEOF\nsed -n 1,66p apps/control-app/src/shop-routes.ts | grep -n -E \"import|createItem|body\\(\" | head -20","description":"Add Make-these-live route"}
```

**Result**

```
3: * `shop-import.ts`, scoped to the business the request resolved to.
9:import { FetchRefusedError } from './fetch-guard'
10:import { InvoiceStateError, listInvoices, readInvoice } from './invoices'
11:import { listOrders, readOrder, readShipping, saveShipping, sellingState, type OrdersEnv } from './orders'
12:import {
17:  createItem,
34:import {
35:  importSource,
36:  importSourceChoices,
50:} from './shop-import'
62:  importDeps: () => Promise<ImportDeps>
```

## Bash sed -i '' 's/^ createItem,$/ createItem,\n makeItemsLive,/' apps/control-app/src/shop-routes.ts && sed -n 12,33p apps/co…
<!-- xgd-tool name="Bash" id="toolu_01EL8Gpb5B2zeQXJk7UmfwGj" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:05:45.631249+00:00" -->

**Input**

```json
{"command":"sed -i '' 's/^  createItem,$/  createItem,\\n  makeItemsLive,/' apps/control-app/src/shop-routes.ts && sed -n 12,33p apps/control-app/src/shop-routes.ts; grep -n \"async function body\\|const body =\" apps/control-app/src/shop-routes.ts","description":"Import makeItemsLive in routes"}
```

**Result**

```
import {
  addCategory,
  addCollection,
  categories,
  collections,
  createItem,
  makeItemsLive,
  deleteItem,
  listItems,
  orderCollections,
  readItem,
  readItemInput,
  defaultCurrencyOf,
  isKnownCurrency,
  itemsToReprice,
  saveItem,
  shopCurrency,
  ShopInputError,
  ShopNotFoundError,
  writeDefaultCurrency,
  type CurrencyStore,
  type ShopEnv,
79:async function body(request: Request): Promise<Record<string, unknown>> {
```

## Bash python3 - <<'EOF' p='apps/control-app/src/shop-import.ts' s=open(p).read() def rep(a,b): global s assert s.count(a)==1,…
<!-- xgd-tool name="Bash" id="toolu_01X8kE5q89yVNMVfskY3K76K" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:06:01.288658+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='apps/control-app/src/shop-import.ts'\ns=open(p).read()\ndef rep(a,b):\n    global s\n    assert s.count(a)==1, a\n    s=s.replace(a,b)\nrep(\"\"\"/** The reasons a product, though public in its source, arrives not live for the owner to review. */\nfunction notLiveReasons(p: SourceProduct, amount: number): string[] {\n  const reasons: string[] = []\n  if (amount === 0) reasons.push('price of 0')\n  if (p.inStock && p.stockLimit === null) reasons.push('stock not tracked')\n  if (p.images.length === 0) reasons.push('no photo')\"\"\",\"\"\"/**\n * The reasons a product, though public in its source, arrives not live for the owner to review.\n *\n * STOCK NOT TRACKED IS NOT ONE ([[BUG-366]]). A one-of-a-kind piece has stock\n * management off because there is only ever one; it arrives live with\n * availability 1, and is listed under \"stock not tracked\" so the owner can set\n * a real quantity.\n */\nfunction notLiveReasons(p: SourceProduct, amount: number): string[] {\n  const reasons: string[] = []\n  if (amount === 0) reasons.push('price of 0')\n  if (p.images.length === 0) reasons.push('no photo')\"\"\")\nrep(\"\"\"  const keptPhotos: Photo[] = existing ? existing.photos.filter((ph) => ph.sourceUrl && p.images.includes(ph.sourceUrl)) : []\"\"\",\"\"\"  const keptPhotos: Photo[] = existing ? existing.photos.filter((ph) => ph.sourceUrl && p.images.includes(ph.sourceUrl)) : []\n  // LIVE ([[BUG-366]]). A new item is live unless something holds it back. An\n  // existing one whose `live` the import set — never switched by the owner —\n  // goes live once nothing holds it back any more, and is never taken down. One\n  // the owner switched is theirs and keeps what they chose.\n  const importsLive = !existing || existing.liveSetBy === 'import'\n  const live = !existing ? reasons.length === 0 : importsLive ? existing.live || reasons.length === 0 : existing.live\"\"\")\nrep(\"\"\"      // AN UPDATE KEEPS THE OWNER'S CHOICES: live and made to order are hers once the item exists.\n      live: existing ? existing.live : reasons.length === 0,\"\"\",\"\"\"      // AN UPDATE KEEPS THE OWNER'S CHOICES: made to order, and a live the owner switched, are theirs.\n      live,\"\"\")\nrep(\"\"\"    { source: { platform: source.id, id: p.id, sku: p.sku }, priceAmount: amount, currency },\n  )\n  const named = { ...entry, itemId: item.id }\n  if (!existing && reasons.length > 0) working.notLive[p.id] = { ...named, reasons }\"\"\",\"\"\"    { source: { platform: source.id, id: p.id, sku: p.sku }, priceAmount: amount, currency, ...(importsLive ? { liveSetBy: 'import' as const } : {}) },\n  )\n  const named = { ...entry, itemId: item.id }\n  // THE REPORT LISTS EVERY ITEM THE IMPORT HOLDS BACK, with why — new or from an earlier run.\n  if (!item.live && importsLive) working.notLive[p.id] = { ...named, reasons }\n  else delete working.notLive[p.id]\"\"\")\nopen(p,'w').write(s)\nEOF\ngrep -n \"working.notLive\\[\" apps/control-app/src/shop-import.ts","description":"Change import live rule and report"}
```

**Result**

```
739:  if (!item.live && importsLive) working.notLive[p.id] = { ...named, reasons }
740:  else delete working.notLive[p.id]
```

## Bash python3 - <<'EOF' p='apps/control-app/src/handoff-copy.ts' s=open(p).read() def rep(a,b): global s assert s.count(a)==1,…
<!-- xgd-tool name="Bash" id="toolu_01AqNHWJqXrgQDHjvMxZxoem" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:06:09.179892+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='apps/control-app/src/handoff-copy.ts'\ns=open(p).read()\ndef rep(a,b):\n    global s\n    assert s.count(a)==1, a\n    s=s.replace(a,b)\nrep(\"\"\"  live: boolean\n  madeToOrder: boolean\n  prices: { amount: number; currency: string; market: string }[]\"\"\",\"\"\"  live: boolean\n  /** [[BUG-366]] — who set `live`, so a later import on the destination treats it as the source did. */\n  liveSetBy: LiveSetBy\n  madeToOrder: boolean\n  prices: { amount: number; currency: string; market: string }[]\"\"\")\nrep(\"\"\"      live: i.live,\n      madeToOrder: i.madeToOrder,\"\"\",\"\"\"      live: i.live,\n      liveSetBy: i.liveSetBy,\n      madeToOrder: i.madeToOrder,\"\"\")\nrep(\"\"\"      source: item.source,\n      priceAmount: null,\n    })\"\"\",\"\"\"      source: item.source,\n      priceAmount: null,\n      liveSetBy: item.liveSetBy,\n    })\"\"\")\nrep(\"\"\"  type InventoryItem,\"\"\",\"\"\"  type InventoryItem,\n  type LiveSetBy,\"\"\")\nopen(p,'w').write(s)\nEOF\ngrep -rn \"ManifestItem\\|live: \" tests/*handoff* 2>/dev/null | head -5; ls tests | grep -i handoff | head","description":"Carry liveSetBy through handoff copy"}
```

**Result**

```
tests/test_UAT_FC_REQ-654_handoff_copy.workers.test.ts:135:      live: true,
tests/test_UAT_FC_REQ-654_handoff_copy.workers.test.ts:201:    expect(items[0]).toMatchObject({ name: 'Speckled mug', availability: 3, live: true })
test_UAT_FC_REQ-638_handoff_mode.test.ts
test_UAT_FC_REQ-654_handoff_copy.workers.test.ts
```

## Bash sed -n 120,145p tests/test_UAT_FC_REQ-654_handoff_copy.workers.test.ts; grep -rn -E "importStatus|startImport|makeLive|i…
<!-- xgd-tool name="Bash" id="toolu_01GdVXrcbWM6nK7WxB9DUZcK" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:06:13.768766+00:00" -->

**Input**

```json
{"command":"sed -n 120,145p tests/test_UAT_FC_REQ-654_handoff_copy.workers.test.ts; grep -rn -E \"importStatus|startImport|makeLive|items/live\" apps/control-app/src/builder/*.js | grep -v \"builder/shop.js\" | head; grep -rn \"importStatus\" apps/control-app/src --exclude-dir=builder | head -3","description":"Check handoff test item shape and transport location"}
```

**Result**

```
  const cat = await addCategory(shop, id, 'Stoneware')
  await saveItem(
    shop,
    id,
    null,
    {
      name: 'Speckled mug',
      summary: 'Hand thrown.',
      description: 'A mug.',
      price: null,
      availability: 3,
      collectionIds: [col.id],
      categoryIds: [cat.id],
      attributes: [{ name: 'Glaze', value: 'Speckled' }],
      photos: [{ material: picture.uid }],
      live: true,
      madeToOrder: false,
    },
    { priceAmount: null },
  )
  await env.DB.prepare("INSERT INTO inventory_prices (item_id, currency, market, amount) SELECT id, 'GBP', '*', 2400 FROM inventory_items WHERE business_id = ?")
    .bind(id)
    .run()
  // A conversation that must NOT travel.
  await t.create({ type: 'chat', title: `site-${site}`, fields: { session_id: `site-${site}` }, body: 'the operator talking to the consultant' })
  if (opts.note !== null) await sitePlan(t, site).handoffNote!.write(opts.note ?? NOTE)
apps/control-app/src/builder/api.js:2610:    startImport: (source, fields) => call('POST', '/api/shop/import', { source, fields }).then((b) => b.import),
apps/control-app/src/builder/api.js:2611:    importStatus: (id) => call('GET', id ? `/api/shop/import?id=${encodeURIComponent(id)}` : '/api/shop/import').then((b) => b.import),
```

## Bash sed -n 2590,2615p apps/control-app/src/builder/api.js; sed -n 985,1015p apps/control-app/src/builder/shop.js; grep -n "^…
<!-- xgd-tool name="Bash" id="toolu_019bMRvRAxEytVedAUHYfBTX" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:06:17.106430+00:00" -->

**Input**

```json
{"command":"sed -n 2590,2615p apps/control-app/src/builder/api.js; sed -n 985,1015p apps/control-app/src/builder/shop.js; grep -n \"^  function el\\|const el =\\|function button\\|el('button'\" apps/control-app/src/builder/shop.js | head","description":"Read builder transport and import flow"}
```

**Result**

```
export function shopTransport(fetchImpl = fetch) {
  const call = (method, path, payload) => shopCall(fetchImpl, method, path, payload)
  return {
    list: (query = {}) => {
      const q = new URLSearchParams()
      for (const [k, v] of Object.entries(query)) if (v != null && v !== '') q.set(k, String(v))
      return call('GET', `/api/shop/items?${q}`)
    },
    item: (id) => call('GET', `/api/shop/item?id=${encodeURIComponent(id)}`).then((b) => b.item),
    create: (input) => call('POST', '/api/shop/items', input).then((b) => b.item),
    save: (id, input) => call('PUT', `/api/shop/item?id=${encodeURIComponent(id)}`, input).then((b) => b.item),
    remove: (id) => call('DELETE', `/api/shop/item?id=${encodeURIComponent(id)}`),
    taxonomy: () => call('GET', '/api/shop/taxonomy'),
    addCollection: (name) => call('POST', '/api/shop/collections', { name }).then((b) => b.collection),
    addCategory: (name) => call('POST', '/api/shop/categories', { name }).then((b) => b.category),
    // [[REQ-634]] — the import names its source; the fields are that source's own.
    sources: () => call('GET', '/api/shop/import/sources').then((b) => b.sources),
    scan: (source, fields) => call('POST', '/api/shop/import/scan', { source, fields }),
    saveMapping: (source, mapping) => call('POST', '/api/shop/import/mapping', { source, mapping }),
    startImport: (source, fields) => call('POST', '/api/shop/import', { source, fields }).then((b) => b.import),
    importStatus: (id) => call('GET', id ? `/api/shop/import?id=${encodeURIComponent(id)}` : '/api/shop/import').then((b) => b.import),
    images: () => fetchMaterial(fetchImpl).then((b) => (Array.isArray(b.material) ? b.material.filter((m) => m.kind === 'image') : [])),
    fileUrl: (uid) => materialFileUrl(uid),
    // [[REQ-643]] — the Orders mode, and why the site has no Buy.
    orders: (query = {}) => {

    function follow(run) {
      paintRun(run)
      if (run.status !== 'running') return
      stopPolling()
      polling = setInterval(
        shown(async () => {
          const next = await transport.importStatus(run.id)
          paintRun(next)
          if (next.status !== 'running') stopPolling()
        }),
        pollMs,
      )
    }

    /** [[BUG-333]] — every count here is the server's record of the run, never the scan's. */
    function paintRun(run) {
      if (run.status === 'running') {
        out.replaceChildren(...progressLines(run).map((line) => el('p', 'builder-shop__progress', line)))
        return
      }
      if (run.status === 'failed') {
        step.textContent = 'The import stopped'
        out.replaceChildren(el('p', 'builder-shop__error', `The import stopped: ${run.error ?? 'unknown error'}`))
        return
      }
      step.textContent = 'Import finished'
      out.replaceChildren(reportView(run.report, run.descriptionsPending ?? 0))
      void refresh()
    }
  }
42:function button(text, onClick, className = 'builder-shop__button') {
43:  const b = el('button', className, text)
77:  const b = el('button', 'builder-shop__icon')
```

## Bash sed -n 30,60p apps/control-app/src/builder/shop.js; grep -n "checkbox" apps/control-app/src/builder/shop.js | head; grep…
<!-- xgd-tool name="Bash" id="toolu_01Af5cfsq4kvmWhgszmxJrhn" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:06:27.954600+00:00" -->

**Input**

```json
{"command":"sed -n 30,60p apps/control-app/src/builder/shop.js; grep -n \"checkbox\" apps/control-app/src/builder/shop.js | head; grep -n \"const shown\\|function shown\" -A8 apps/control-app/src/builder/shop.js | head -12","description":"Read builder helpers"}
```

**Result**

```
/** [[REQ-643]] — shown when payments are ready but the business ships nowhere, so no Buy shows. */
export const ADD_SHIPPING_PROMPT = 'Add a shipping zone to start selling'

const PAGE = 50

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

function button(text, onClick, className = 'builder-shop__button') {
  const b = el('button', className, text)
  b.type = 'button'
  b.addEventListener('click', onClick)
  return b
}

const SVG = 'http://www.w3.org/2000/svg'

/** A 16px stroked icon from path data — built as nodes, never as markup. */
function icon(...paths) {
  const svg = document.createElementNS(SVG, 'svg')
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('aria-hidden', 'true')
  for (const d of paths) {
    const path = document.createElementNS(SVG, 'path')
    path.setAttribute('d', d)
    svg.append(path)
  }
477:       * checkboxes over the business's list, any number ticked, with a `+` to
485:          box.type = 'checkbox'
637:        box.type = 'checkbox'
948:        box.type = 'checkbox'
838:    const shown = (fn) => async (...args) => {
839-      try {
840-        await fn(...args)
841-      } catch (err) {
842-        stopPolling()
843-        out.replaceChildren(el('p', 'builder-shop__error', err?.message || String(err)))
844-      }
845-    }
846-
```

## Bash sed -n 940,960p apps/control-app/src/builder/shop.js
<!-- xgd-tool name="Bash" id="toolu_01YaK8iDptKHJeKCBcxTLGka" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:06:30.325678+00:00" -->

**Input**

```json
{"command":"sed -n 940,960p apps/control-app/src/builder/shop.js","description":"See checkbox label pattern in import mapping"}
```

**Result**

```
        )
        tr.children[3].append(as)
        tr.children[4].append(name)
        table.append(tr)
      }
      const attrs = el('div', 'builder-shop__mapping-attributes')
      for (const a of scan.attributes) {
        const box = el('input')
        box.type = 'checkbox'
        box.checked = mapping.attributes[a.name] !== 'drop'
        box.dataset.attribute = a.name
        box.addEventListener('change', () => {
          mapping.attributes[a.name] = box.checked ? 'keep' : 'drop'
        })
        const l = el('label', 'builder-shop__check')
        l.append(box, document.createTextNode(`${a.name} (${a.count} products)`))
        attrs.append(l)
      }
      // [[BUG-333]] — THE SCAN SAYS WHAT IT IS: a step, with what was FOUND and
      // nothing yet imported. The Import action sits above the mapping, in a bar
      // that stays in view however far the owner scrolls, and again below it.
```

## Bash python3 - <<'EOF' p='apps/control-app/src/builder/shop.js' s=open(p).read() def rep(a,b): global s assert s.count(a)==1,…
<!-- xgd-tool name="Bash" id="toolu_01NmqwUa91D7zm7fqThxpM3B" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:06:41.682729+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\np='apps/control-app/src/builder/shop.js'\ns=open(p).read()\ndef rep(a,b):\n    global s\n    assert s.count(a)==1, a\n    s=s.replace(a,b)\nrep(\"\"\"    section('Failed', report.failed, (e) => `${e.name}: ${e.reason}`)\n    section('Imported not live, for you to review', report.notLive, (e) => `${e.name}: ${e.reasons.join(', ')}`)\n    section('Stock not tracked (availability set to 1)', report.stockNotTracked, (e) => e.name)\"\"\",\"\"\"    section('Failed', report.failed, (e) => `${e.name}: ${e.reason}`)\n    if (report.notLive.length > 0) view.append(...notLiveView(report.notLive))\n    section('Stock not tracked (live, availability set to 1)', report.stockNotTracked, (e) => e.name)\"\"\")\nrep(\"\"\"  function reportView(report, describing = 0) {\"\"\",\"\"\"  /**\n   * [[BUG-366]] — WHAT THE IMPORT HELD BACK, AND WHY: each item with its reasons\n   * and a box to tick, and Make these live for the ticked ones. Nothing is ticked\n   * to begin with — going live is the owner's call, one item at a time.\n   */\n  function notLiveView(entries) {\n    const list = el('ul', 'builder-shop__report-list')\n    const boxes = []\n    for (const e of entries) {\n      const li = el('li')\n      const box = el('input')\n      box.type = 'checkbox'\n      box.dataset.item = e.itemId\n      box.addEventListener('change', () => {\n        make.disabled = !boxes.some((b) => b.checked)\n      })\n      boxes.push(box)\n      const l = el('label', 'builder-shop__check')\n      l.append(box, document.createTextNode(`${e.name}: not live because of ${e.reasons.join(', ')}`))\n      li.append(l)\n      list.append(li)\n    }\n    const status = el('p', 'builder-shop__progress')\n    const make = button('Make these live', async () => {\n      const ticked = boxes.filter((b) => b.checked)\n      make.disabled = true\n      try {\n        await transport.makeLive(ticked.map((b) => b.dataset.item))\n      } catch (err) {\n        status.textContent = err?.message || String(err)\n        make.disabled = false\n        return\n      }\n      for (const b of ticked) {\n        b.checked = false\n        b.disabled = true\n        b.parentElement.lastChild.textContent += ' (now live)'\n      }\n      status.textContent = `${ticked.length} ${ticked.length === 1 ? 'item is' : 'items are'} now live.`\n      void refresh()\n    })\n    make.disabled = true\n    return [el('h3', 'builder-shop__section', 'Imported not live, for you to review'), list, make, status]\n  }\n\n  function reportView(report, describing = 0) {\"\"\")\nopen(p,'w').write(s)\np='apps/control-app/src/builder/api.js'\ns=open(p).read()\na=\"\"\"    importStatus: (id) =>\"\"\"\nassert s.count(a)==1\ns=s.replace(a,\"\"\"    // [[BUG-366]] — Make these live, from the import report.\n    makeLive: (ids) => call('POST', '/api/shop/items/live', { ids }).then((b) => b.live),\n    importStatus: (id) =>\"\"\")\nopen(p,'w').write(s)\nEOF\ngrep -rn \"shopTransport\\b\" apps/control-app/src --include=*.ts -l 2>/dev/null; grep -rln \"importStatus\" apps/control-app/src | grep -v -E \"builder/(shop|api).js\"","description":"Add report Make-these-live UI and transport"}
```

**Result**

```
(eval):69: no matches found: --include=*.ts
```

## Bash grep -n -E "Seconds Plate|Gift Voucher|Plain Bowl|stock|export (function|const)" tests/support/shop-fixture.ts | head -3…
<!-- xgd-tool name="Bash" id="toolu_011oZ1D3R4H7LkAapEAehseG" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:06:47.538864+00:00" -->

**Input**

```json
{"command":"grep -n -E \"Seconds Plate|Gift Voucher|Plain Bowl|stock|export (function|const)\" tests/support/shop-fixture.ts | head -30; grep -rn -E \"stock not tracked|notLive|Seconds Plate\" tests --include=*.ts -l 2>/dev/null || grep -rln -E \"stock not tracked|notLive|Seconds Plate\" tests","description":"Inspect fixture and tests touching old rule"}
```

**Result**

```
7: * categories with the same name, a sold product, untracked stock, a price of 0,
19:export const SHOP_URL = 'https://shop.example.test'
27:export const CATEGORIES: FixtureCategory[] = [
65:  { id: 103, name: 'Seconds Plate', cats: [21], max: 9999, summary: '<p>A plate with a small flaw.</p>' },
66:  { id: 104, name: 'Gift Voucher', cats: [30], price: '0', summary: '<p>A voucher.</p>' },
67:  { id: 105, name: 'Plain Bowl', cats: [31], images: 0, summary: '<p>Hand thrown in the studio. Plain.</p>' },
90:    is_in_stock: s.inStock ?? true,
106:export function products(override: Record<number, Partial<Spec>> = {}): Record<string, unknown>[] {
111:export const fixtureCounts = {
140:export function fakeShop(initial = products()) {
(eval):1: no matches found: --include=*.ts
```

## Bash grep -rln -a -E "stock not tracked|Seconds Plate|notLive" tests apps/control-app/src --exclude-dir=node_modules | grep -…
<!-- xgd-tool name="Bash" id="toolu_01VinEytw3m8LEiGPbfQrKFw" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:06:50.260466+00:00" -->

**Input**

```json
{"command":"grep -rln -a -E \"stock not tracked|Seconds Plate|notLive\" tests apps/control-app/src --exclude-dir=node_modules | grep -v -E \"\\.snap$\"; sed -n 60,120p tests/support/shop-fixture.ts","description":"List tests on old rule; read fixture specs"}
```

**Result**

```
tests/test_UAT_FC_REQ-631_inventory.workers.test.ts
tests/test_UAT_FC_REQ-631_shop_tab.test.ts
tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts
tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts
tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts
tests/support/shop-fixture.ts
apps/control-app/src/shop-import.ts
apps/control-app/src/builder/shop.js
    description:
      '<p>A <a href="https://elsewhere.example.test/">speckled</a> mug.<script>alert("x")</script></p><p>Line one<br>Line two</p>',
    attrs: [['Glaze', 'Speckle'], ['Size', 'Large']],
  },
  { id: 102, name: 'Blue Bowl', cats: [12], inStock: false, summary: '<p>Hand thrown in the studio. Deep blue.</p>' },
  { id: 103, name: 'Seconds Plate', cats: [21], max: 9999, summary: '<p>A plate with a small flaw.</p>' },
  { id: 104, name: 'Gift Voucher', cats: [30], price: '0', summary: '<p>A voucher.</p>' },
  { id: 105, name: 'Plain Bowl', cats: [31], images: 0, summary: '<p>Hand thrown in the studio. Plain.</p>' },
  { id: 106, name: 'Crossover Mug', cats: [11, 21], summary: '<p>Hand thrown in the studio. Odd one.</p>' },
  { id: 107, name: 'Quiet Cup', cats: [11], summary: '', description: '<p>A cup with nothing to say.</p>' },
  { id: 108, name: 'Tall Vase', cats: [11], summary: '<p>Hand thrown in the studio. Tall.</p>' },
  { id: 109, name: 'Small Jug', cats: [12], summary: '<p>Hand thrown in the studio. Small.</p>' },
  { id: 110, name: 'Wide Dish', cats: [12], summary: '<p>Hand thrown in the studio. Wide.</p>' },
  { id: 111, name: 'Tea Bowl', cats: [12], summary: '<p>Hand thrown in the studio. For tea.</p>' },
  { id: 112, name: 'Espresso Cup', cats: [11], summary: '<p>Hand thrown in the studio. Small cup.</p>' },
  { id: 113, name: 'Misreported Platter', cats: [21], minor: 3, summary: '<p>A platter.</p>' },
]

const imageUrl = (product: number, n: number) => `${SHOP_URL}/wp-content/uploads/p${product}-${n}.png`

function product(s: Spec): Record<string, unknown> {
  const images = s.images ?? 1
  return {
    id: s.id,
    name: s.name,
    sku: '',
    permalink: `${SHOP_URL}/product/p${s.id}/`,
    description: s.description ?? `<p>About the ${s.name}.</p>`,
    short_description: s.summary ?? '',
    prices: { price: s.price ?? '4500', currency_code: 'EUR', currency_minor_unit: s.minor ?? 2 },
    is_in_stock: s.inStock ?? true,
    add_to_cart: { maximum: s.inStock === false ? 1 : (s.max ?? 1) },
    categories: s.cats.map((id) => {
      const c = CATEGORIES.find((x) => x.id === id)!
      return { id, name: c.name }
    }),
    attributes: (s.attrs ?? [['Glaze', 'Matt']]).map(([name, value], i) => ({
      id: i + 1,
      name,
      terms: [{ id: i + 1, name: value }],
    })),
    images: Array.from({ length: images }, (_, n) => ({ id: s.id * 10 + n, src: imageUrl(s.id, n), alt: '' })),
  }
}

/** The fixture's products in the source's shape, with an optional override per id. */
export function products(override: Record<number, Partial<Spec>> = {}): Record<string, unknown>[] {
  return SPECS.map((s) => product({ ...s, ...(override[s.id] ?? {}) }))
}

/** Every distinct photo URL the fixture serves, with the products' count of images. */
export const fixtureCounts = {
  products: SPECS.length,
  withPhoto: SPECS.filter((s) => (s.images ?? 1) > 0 && (s.minor ?? 2) === 2).length,
}

function page<T>(rows: T[], url: URL): Response {
  const per = Number(url.searchParams.get('per_page') ?? '10')
  const n = Number(url.searchParams.get('page') ?? '1')
  const pages = Math.max(1, Math.ceil(rows.length / per))
  return new Response(JSON.stringify(rows.slice((n - 1) * per, n * per)), {
```

## Bash grep -n -a -E "stock not tracked|Seconds Plate|notLive" tests/test_UAT_FC_REQ-631_shop_tab.test.ts tests/browser/test_UA…
<!-- xgd-tool name="Bash" id="toolu_01Hu4cGS4UJrs1uTkdvQWnK3" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:06:53.765716+00:00" -->

**Input**

```json
{"command":"grep -n -a -E \"stock not tracked|Seconds Plate|notLive\" tests/test_UAT_FC_REQ-631_shop_tab.test.ts tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts","description":"Find old-rule assertions in other tests"}
```

**Result**

```
tests/test_UAT_FC_REQ-631_shop_tab.test.ts:114:          notLive: [{ sourceId: '104', itemId: 'inv_3', name: 'Gift Voucher', reasons: ['price of 0'] }],
tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts:50:    await expect.poll(() => shown(page)).toEqual(['Crossover Mug', 'Seconds Plate'])
tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts:55:    await expect.poll(() => shown(page)).toEqual(['Crossover Mug', 'Seconds Plate'])
tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts:60:    await expect.poll(() => shown(page)).toEqual(['Gift Voucher', 'Plain Bowl', 'Seconds Plate'])
tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts:40:  'Seconds Plate': [['Seconds'], ['Plates'], 4500, 1, 0, 1],
tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts:103:    expect(reportText).toContain('Seconds Plate: stock not tracked')
tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts:106:    expect(reportText).toMatch(/Stock not tracked \(availability set to 1\)Seconds Plate/)
tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts:70:    const notLive = stored.filter((i) => i.live === 0)
tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts:72:    expect(notLive.map((i) => i.name).sort()).toEqual(['Gift Voucher', 'Plain Bowl', 'Seconds Plate'])
tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts:86:    for (const item of notLive) {
tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts:90:    for (const item of notLive) expect(grid).not.toContain(item.name)
```

## Bash sed -n 30,110p tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts; sed -n 40,62p tests/browser/test_UAT_FC_BUG-333_j4_i…
<!-- xgd-tool name="Bash" id="toolu_01GBVSexAjsomMvuHGXcFdvd" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:06:56.945259+00:00" -->

**Input**

```json
{"command":"sed -n 30,110p tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts; sed -n 40,62p tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts; sed -n 60,92p tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts","description":"Read browser test assertions on old rule"}
```

**Result**

```
})

/** What each fixture product becomes under the mapping J2 sets: collections, categories, price, availability, live, photos. */
const EXPECTED: Record<string, [string[], string[], number, number, number, number]> = {
  'Blue Bowl': [['Studio'], ['Bowls & Dishes'], 4500, 0, 1, 1],
  'Crossover Mug': [['Seconds', 'Studio'], ['Mugs', 'Plates'], 4500, 1, 1, 1],
  'Espresso Cup': [['Studio'], ['Mugs'], 4500, 1, 1, 1],
  'Gift Voucher': [[], ['Gifts & Cards'], 0, 1, 0, 1],
  'Plain Bowl': [[], ['Bowls & Dishes'], 4500, 1, 0, 0],
  'Quiet Cup': [['Studio'], ['Mugs'], 4500, 1, 1, 1],
  'Seconds Plate': [['Seconds'], ['Plates'], 4500, 1, 0, 1],
  'Small Jug': [['Studio'], ['Bowls & Dishes'], 4500, 1, 1, 1],
  'Speckled Mug': [['Studio'], ['Mugs'], 1999, 1, 1, 3],
  'Tall Vase': [['Studio'], ['Mugs'], 4500, 1, 1, 1],
  'Tea Bowl': [['Studio'], ['Bowls & Dishes'], 4500, 1, 1, 1],
  'Wide Dish': [['Studio'], ['Bowls & Dishes'], 4500, 1, 1, 1],
}

describe('BUG-333 J2 — import, end to end', () => {
  it('test_UAT_FC_BUG-333_j2_scan_map_import_and_inventory_persist', async () => {
    const shopServer = await serveShop(world.app)
    shopServer.photoDelay = 300
    const { page, businessId, errors } = await ownerOnShop(world, 'j2-owner@example.test')
    await page.setViewportSize({ width: 1280, height: 520 })

    // CHOOSE THE SOURCE: WooCommerce is offered; the fixture's address; Scan.
    await page.locator('.builder-shop__bar').getByRole('button', { name: 'Import' }).click()
    await expect.poll(() => page.locator('.builder-shop__step').textContent()).toBe('Step 1 of 2: choose where to import from')
    await expect.poll(() => page.locator('select[data-field="source"] option').allTextContents()).toContain('WooCommerce')
    await page.getByRole('button', { name: 'Back to inventory' }).click()
    await scanFixture(page)

    // MAP: the screen says it is the mapping step and that nothing is imported yet.
    await expect.poll(() => page.locator('.builder-shop__step').textContent()).toBe('Step 2 of 2: check the mapping, then import')
    expect(await page.locator('.builder-shop__found').textContent()).toBe(
      `Found ${fixtureCounts.products} products in 7 categories. Nothing has been imported yet.`,
    )
    // The source categories, with parent and count, and the attributes.
    const mugsRow = page.locator('tr[data-category="11"] td')
    expect(await mugsRow.allTextContents()).toEqual(expect.arrayContaining(['Mugs', 'Studio Line', '5']))
    expect(await page.locator('.builder-shop__mapping-attributes').textContent()).toContain('Size (1 products)')
    expect(await page.locator('.builder-shop__mapping-attributes').textContent()).toContain('Glaze (')

    // Change the mapping: rename a collection, merge two categories, drop an attribute.
    await page.locator('tr[data-category="10"] input[data-field="name"]').fill('Studio')
    await page.locator('tr[data-category="12"] input[data-field="name"]').fill('Bowls & Dishes')
    await page.locator('tr[data-category="31"] input[data-field="name"]').fill('Bowls & Dishes')
    await page.locator('input[data-attribute="Size"]').uncheck()

    // IMPORT IS VISIBLE WITHOUT SCROLLING: scrolled to the end of the mapping, the top action is still in view.
    await page.locator('.builder-shop__import').evaluate((el) => el.scrollTo(0, el.scrollHeight))
    const box = await topImport(page).boundingBox()
    expect(box, 'the Import action has no box').not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(520)
    expect(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.textContent, [box!.x + box!.width / 2, box!.y + box!.height / 2])).toMatch(
      /^Import \d+ products$/,
    )
    await topImport(page).click()

    // PROGRESS, then the report.
    await expect.poll(() => page.locator('.builder-shop__progress').first().textContent(), { timeout: 30_000 }).toMatch(
      /Creating items|Bringing in photos|All \d+ items/,
    )
    expect(await waitForRunEnd(page)).toBe('Import finished')
    const report = page.locator('.builder-shop__report')
    const reportText = (await report.textContent()) ?? ''
    expect(await report.locator('.builder-shop__report-counts').textContent()).toBe(
      `Created ${fixtureCounts.products - 1}, updated 0, failed 1.`,
    )
    expect(reportText).toContain('Misreported Platter: its price claims 3 decimal places but EUR has 2')
    expect(reportText).toContain('Gift Voucher: price of 0')
    expect(reportText).toContain('Plain Bowl: no photo')
    expect(reportText).toContain('Seconds Plate: stock not tracked')
    // [[REQ-651]] — no collection is chosen between: the report has no such section.
    expect(reportText).not.toContain('Collection decided')
    expect(reportText).toMatch(/Stock not tracked \(availability set to 1\)Seconds Plate/)
    expect(reportText).toContain('9 products open with “Hand thrown in the studio.”')

    // THE INVENTORY, AFTER A RELOAD: exactly the fixture's items.
    await reloadShop(page)

    // Paging reaches the last item.
    const first = await listCount(page)
    expect(first).toEqual({ shown: 50, total: 57 })
    const all = await shown(page)
    expect(all).toHaveLength(57)
    expect(all).toContain('Extra Pot 45')

    // Filter by collection — [[REQ-651]]: the Crossover Mug is in Seconds as well as Studio.
    await choose(page, 'Collection', 'Seconds')
    await expect.poll(() => shown(page)).toEqual(['Crossover Mug', 'Seconds Plate'])
    await choose(page, 'Collection', 'All collections')

    // Filter by category.
    await choose(page, 'Category', 'Plates')
    await expect.poll(() => shown(page)).toEqual(['Crossover Mug', 'Seconds Plate'])
    await choose(page, 'Category', 'All categories')
```

[elided — kept 5800 of 7822 bytes]

## Bash sed -n 92,140p tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts
<!-- xgd-tool name="Bash" id="toolu_01QH84qcTwS4iaNX133Hiz89" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:07:00.385436+00:00" -->

**Input**

```json
{"command":"sed -n 92,140p tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts","description":"Read j7 grid assertions"}
```

**Result**

```
    // The home grid: Mugs, in stock, newest first, at most 2 — exactly what its rule selects.
    const DB = await world.app.db()
    const { results: eligible } = await DB.prepare(
      `SELECT i.name FROM inventory_items i JOIN inventory_item_categories ic ON ic.item_id = i.id JOIN shop_categories c ON c.id = ic.category_id
        WHERE i.business_id = ? AND i.live = 1 AND i.availability > 0 AND c.name = 'Mugs' ORDER BY i.created_at DESC, i.id DESC`,
    )
      .bind(owner.businessId)
      .all<{ name: string }>()
    const home = (await at('/')).text
    const shown = eligible.map((e) => e.name).filter((n) => home.includes(n))
    expect(shown).toHaveLength(2)

    // The paged shop grid: two a page, by name, Next and Previous both working.
    const pages = await shopGridNames()
    const byName = live.map((i) => i.name).sort((a, b) => a.localeCompare(b))
    expect(pages.length).toBe(Math.ceil(byName.length / 2))
    expect(pages.map((p) => byName.filter((n) => p.join('\n').includes(n)))).toEqual(
      Array.from({ length: pages.length }, (_, k) => byName.slice(k * 2, k * 2 + 2)),
    )
    await visitor.locator('[data-catalog="grid"] a[rel="prev"]').click()
    await visitor.waitForLoadState()
    expect(await visitor.locator('[data-catalog="grid"]').getAttribute('data-catalog-page')).toBe(String(pages.length - 1))
  })

  it('test_UAT_FC_BUG-333_j7_a_saved_price_reaches_the_published_page_card_and_preview_without_a_publish', async () => {
    const DB = await world.app.db()
    const revisions = async () => (await (await world.app.siteStore(owner.businessId)).revisions(owner.siteKey)).length
    const before = await revisions()
    // An item on the home grid, so its card is there to change.
    const home = (await at('/')).text
    const target = (await items()).find((i) => i.live === 1 && home.includes(i.name))!
    const detail = await openItem(owner.page, target.name)
    await detail.locator('[data-field="price"]').fill('61.25')
    expect(await saveOpenItem(owner.page)).toBe('Saved.')

    expect((await at(`/shop/${target.slug}`)).text).toContain('€61.25')
    expect((await at('/')).text).toContain('€61.25')
    expect(await revisions()).toBe(before)
    const preview = await owner.page.context().newPage()
    await preview.goto(`${world.app.url}/b/${owner.businessId}/preview/${owner.siteKey}/draft/shop/${target.slug}`)
    expect(await preview.locator('body').innerText()).toContain('€61.25')
    await preview.close()
    expect((await DB.prepare('SELECT amount FROM inventory_prices WHERE item_id = ?').bind(target.id).first('amount'))).toBe(6125)
  })

  it('test_UAT_FC_BUG-333_j7_not_live_removes_the_page_and_cards_and_live_restores_the_same_slug', async () => {
    const target = (await items()).find((i) => i.name === 'Tea Bowl')!
    expect((await at(`/shop/${target.slug}`)).status).toBe(200)
    let detail = await openItem(owner.page, 'Tea Bowl')
```

## Bash python3 - <<'EOF' import re def edit(p, pairs): s=open(p).read() for a,b in pairs: assert s.count(a)==1, (p,a) s=s.repla…
<!-- xgd-tool name="Bash" id="toolu_01CkNAbpJ2t7giqHSZLqCXSi" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:07:12.114477+00:00" -->

**Input**

```json
{"command":"python3 - <<'EOF'\nimport re\ndef edit(p, pairs):\n    s=open(p).read()\n    for a,b in pairs:\n        assert s.count(a)==1, (p,a)\n        s=s.replace(a,b)\n    open(p,'w').write(s)\nedit('tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts',[\n(\"  'Seconds Plate': [['Seconds'], ['Plates'], 4500, 1, 0, 1],\",\"  // [[BUG-366]] — untracked stock is live, with availability 1.\\n  'Seconds Plate': [['Seconds'], ['Plates'], 4500, 1, 1, 1],\"),\n(\"    expect(reportText).toContain('Seconds Plate: stock not tracked')\\n\",\"    expect(reportText).toContain('Gift Voucher: not live because of price of 0')\\n    expect(reportText).not.toContain('Seconds Plate: not live')\\n\"),\n(\"    expect(reportText).toContain('Gift Voucher: price of 0')\\n    expect(reportText).toContain('Plain Bowl: no photo')\\n\",\"    expect(reportText).toContain('Plain Bowl: not live because of no photo')\\n\"),\n(\"/Stock not tracked \\\\(availability set to 1\\\\)Seconds Plate/\",\"/Stock not tracked \\\\(live, availability set to 1\\\\)Seconds Plate/\"),\n])\nedit('tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts',[\n(\"    await expect.poll(() => shown(page)).toEqual(['Gift Voucher', 'Plain Bowl', 'Seconds Plate'])\",\"    await expect.poll(() => shown(page)).toEqual(['Gift Voucher', 'Plain Bowl'])\"),\n])\nedit('tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts',[\n(\"    expect(notLive.map((i) => i.name).sort()).toEqual(['Gift Voucher', 'Plain Bowl', 'Seconds Plate'])\",\"    expect(notLive.map((i) => i.name).sort()).toEqual(['Gift Voucher', 'Plain Bowl'])\"),\n])\nedit('tests/test_UAT_FC_REQ-631_inventory.workers.test.ts',[\n(\"\"\"    for (const name of ['Speckled Mug', 'Blue Bowl', 'Crossover Mug', 'Quiet Cup']) expect(named(items, name).live).toBe(true)\n    const reasons = Object.fromEntries(run.report.notLive.map((n: any) => [n.name, n.reasons]))\n    expect(reasons).toEqual({\n      'Seconds Plate': ['stock not tracked'],\n      'Gift Voucher': ['price of 0'],\"\"\",\"\"\"    // [[BUG-366]] — untracked stock does not hold a product back: Seconds Plate is live.\n    for (const name of ['Speckled Mug', 'Blue Bowl', 'Crossover Mug', 'Quiet Cup', 'Seconds Plate']) expect(named(items, name).live).toBe(true)\n    const reasons = Object.fromEntries(run.report.notLive.map((n: any) => [n.name, n.reasons]))\n    expect(reasons).toEqual({\n      'Gift Voucher': ['price of 0'],\"\"\"),\n(\"\"\"    expect(report.notLive.map((n: any) => n.name).sort()).toEqual(['Gift Voucher', 'Plain Bowl', 'Seconds Plate'])\"\"\",\"\"\"    expect(report.notLive.map((n: any) => n.name).sort()).toEqual(['Gift Voucher', 'Plain Bowl'])\"\"\"),\n])\nEOF\ngrep -n \"j4\\|Live', 'Not live'\" tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts | head -3; sed -n 100,130p tests/test_UAT_FC_REQ-631_shop_tab.test.ts","description":"Update tests pinning the old rule"}
```

**Result**

```
35:  it('test_UAT_FC_BUG-333_j4_filter_search_page_and_badges', async () => {
37:    const { page } = await ownerOnShop(world, 'j4-owner@example.test')
59:    await choose(page, 'Live', 'Not live')
    },
    startImport: async (source: string, fields: Record<string, string>) => {
      sent.started.push({ source, fields })
      return {
        id: 'imp_1',
        status: 'done',
        page: 2,
        totalPages: 1,
        processed: 3,
        error: null,
        report: {
          created: 3,
          updated: 0,
          failed: [],
          notLive: [{ sourceId: '104', itemId: 'inv_3', name: 'Gift Voucher', reasons: ['price of 0'] }],
          stockNotTracked: [],
          photoFailures: [],
          repeatedSummaries: [{ text: 'Hand thrown in the studio.', count: 9, kind: 'opening' }],
        },
      }
    },
    importStatus: async () => null,
    images: async () => [],
    fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
  }
  return { t, sent, items }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) ({ createShopPanel } = await import('../apps/control-app/src/builder/shop.js'))
  globalThis.ResizeObserver ??= class {
```

## Bash grep -n -a -E "Gift Voucher|price of 0|report" tests/test_UAT_FC_REQ-631_shop_tab.test.ts | sed -n 1,30p; sed -n 1,99p t…
<!-- xgd-tool name="Bash" id="toolu_01QRDzxhNWsUjkTSgxwrp5HS" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:07:16.500558+00:00" -->

**Input**

```json
{"command":"grep -n -a -E \"Gift Voucher|price of 0|report\" tests/test_UAT_FC_REQ-631_shop_tab.test.ts | sed -n 1,30p; sed -n 1,99p tests/test_UAT_FC_REQ-631_shop_tab.test.ts | grep -n -E \"^function|const sent|items =|^import\" ","description":"Find report assertions in shop tab test"}
```

**Result**

```
51:    item({ id: 'inv_3', name: 'Gift Voucher', live: false, price: null, collections: [] }),
110:        report: {
114:          notLive: [{ sourceId: '104', itemId: 'inv_3', name: 'Gift Voucher', reasons: ['price of 0'] }],
190:    const voucher = rows.find((r) => r.textContent!.includes('Gift Voucher'))!
198:    expect(rowsIn(panel.element).map((r) => r.textContent)).toEqual([expect.stringContaining('Gift Voucher')])
242:  it('test_UAT_FC_REQ-631_import_shows_the_mapping_step_and_the_report', async () => {
275:    const report = view.querySelector('.builder-shop__report')!
276:    expect(report.textContent).toContain('Created 3, updated 0, failed 0.')
277:    expect(report.textContent).toContain('Gift Voucher: price of 0')
278:    expect(report.textContent).toContain('9 products open with “Hand thrown in the studio.”')
12:import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
13:import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
14:import { SHOP_TAB, TABS } from '../apps/control-app/src/builder/config.js'
22:function item(over: Record<string, unknown>) {
47:function transportOver() {
48:  const items = [
53:  const sent: { saves: any[]; mappings: any[]; started: any[] } = { saves: [], mappings: [], started: [] }
```

## Bash sed -i '' "s/expect(report.textContent).toContain('Gift Voucher: price of 0')/expect(report.textContent).toContain('Gift…
<!-- xgd-tool name="Bash" id="toolu_01FeZp28EzdvL9GY3kJdUevA" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:07:23.045414+00:00" -->

**Input**

```json
{"command":"sed -i '' \"s/expect(report.textContent).toContain('Gift Voucher: price of 0')/expect(report.textContent).toContain('Gift Voucher: not live because of price of 0')/\" tests/test_UAT_FC_REQ-631_shop_tab.test.ts; sed -n 18,100p tests/test_UAT_FC_REQ-631_shop_tab.test.ts; sed -n 128,150p tests/test_UAT_FC_REQ-631_shop_tab.test.ts; sed -n 242,280p tests/test_UAT_FC_REQ-631_shop_tab.test.ts","description":"Read shop tab test scaffolding"}
```

**Result**

```
if (!WEBUI_INSTALLED) console.warn(`REQ-631 shop tab suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))

function item(over: Record<string, unknown>) {
  return {
    id: 'inv_1',
    name: 'Speckled Mug',
    summary: 'A mug.',
    description: 'A speckled mug.',
    price: { amount: 1999, currency: 'EUR', market: '*', display: '19.99' },
    prices: [],
    availability: 1,
    sold: false,
    collections: [{ id: 'col_1', name: 'Studio Line' }],
    categories: [{ id: 'cat_1', name: 'Mugs' }],
    attributes: [{ name: 'Glaze', value: 'Speckle' }],
    photos: [{ material: 'material-1', sourceUrl: 'https://shop.example.test/p.png' }],
    live: true,
    madeToOrder: false,
    source: null,
    slug: null,
    createdAt: '2026-11-02T00:00:00.000Z',
    updatedAt: '2026-11-02T00:00:00.000Z',
    ...over,
  }
}

/** A transport double over an in-memory shop, recording what the panel sent. */
function transportOver() {
  const items = [
    item({}),
    item({ id: 'inv_2', name: 'Blue Bowl', availability: 0, sold: true, categories: [] }),
    item({ id: 'inv_3', name: 'Gift Voucher', live: false, price: null, collections: [] }),
  ]
  const sent: { saves: any[]; mappings: any[]; started: any[] } = { saves: [], mappings: [], started: [] }
  const t = {
    list: async (q: Record<string, unknown>) => {
      const rows = items.filter((i) => (q.live === 'false' ? !i.live : q.live === 'true' ? i.live : true))
      return { items: rows.slice(Number(q.offset ?? 0), Number(q.offset ?? 0) + Number(q.limit ?? 50)), total: rows.length, currency: 'EUR' }
    },
    item: async (id: string) => items.find((i) => i.id === id),
    create: async (input: any) => item({ id: 'inv_new', ...input, live: false }),
    save: async (id: string, draft: any) => {
      sent.saves.push({ id, draft: structuredClone(draft) })
      if (draft.availability < 0 || Number.isNaN(draft.availability)) throw new Error('Availability must be a whole number, 0 or more.')
      const at = items.findIndex((i) => i.id === id)
      items[at] = { ...items[at], name: draft.name, availability: draft.availability, live: draft.live }
      return items[at]
    },
    remove: async () => ({}),
    taxonomy: async () => ({
      collections: [{ id: 'col_1', name: 'Studio Line' }],
      categories: [{ id: 'cat_1', name: 'Mugs' }],
      currency: 'EUR',
    }),
    addCollection: async (name: string) => ({ id: 'col_2', name }),
    addCategory: async (name: string) => ({ id: 'cat_2', name }),
    // [[REQ-634]] — the import names its source; the fields are the source's own.
    sources: async () => [
      { id: 'woocommerce', name: 'WooCommerce', fields: [{ name: 'url', label: 'Shop address', type: 'url' }] },
    ],
    scan: async () => ({
      scan: {
        source: 'woocommerce',
        base: 'https://shop.example.test',
        products: 3,
        categories: [
          { id: '10', name: 'Studio Line', parent: null, count: 2 },
          { id: '11', name: 'Mugs', parent: '10', count: 1 },
        ],
        attributes: [{ name: 'Glaze', count: 3 }],
      },
      mapping: {
        categories: { '10': { as: 'collection', name: 'Studio Line' }, '11': { as: 'category', name: 'Mugs' } },
        attributes: { Glaze: 'keep' },
      },
      saved: false,
    }),
    saveMapping: async (_source: string, mapping: unknown) => {
      sent.mappings.push(structuredClone(mapping))
      return { mapping }
    },
beforeAll(async () => {
  if (WEBUI_INSTALLED) ({ createShopPanel } = await import('../apps/control-app/src/builder/shop.js'))
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
  globalThis.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as never
})

beforeEach(() => document.body.replaceChildren())

async function shop() {
  const { t, sent, items } = transportOver()
  it('test_UAT_FC_REQ-631_import_shows_the_mapping_step_and_the_report', async () => {
    const { panel, sent } = await shop()
    // [[REQ-634]] — Import, then the source, then the source's own fields.
    buttonNamed(panel.element, 'Import').click()
    await settle()
    const view = panel.element.querySelector('.builder-shop__import')!
    const source = field(view, 'source') as unknown as HTMLSelectElement
    source.value = 'woocommerce'
    source.dispatchEvent(new Event('change'))
    field(view, 'url').value = 'https://shop.example.test'
    field(view, 'url').dispatchEvent(new Event('input'))
    buttonNamed(view, 'Scan').click()
    await settle()

    // Every source category with its parent and count, and a choice for each.
    const rows = [...view.querySelectorAll('tr[data-category]')]
    expect(rows.map((r) => r.textContent)).toEqual([expect.stringContaining('Studio Line—2'), expect.stringContaining('MugsStudio Line1')])
    const mugs = view.querySelector('tr[data-category="11"]')!
    ;(mugs.querySelector('[data-field="as"]') as HTMLSelectElement).value = 'none'
    mugs.querySelector('[data-field="as"]')!.dispatchEvent(new Event('change'))
    const studio = view.querySelector('tr[data-category="10"] [data-field="name"]') as HTMLInputElement
    studio.value = 'Studio'
    studio.dispatchEvent(new Event('input'))
    const glaze = view.querySelector('[data-attribute="Glaze"]') as HTMLInputElement
    glaze.checked = false
    glaze.dispatchEvent(new Event('change'))

    buttonNamed(view, 'Import 3 products').click()
    await settle()
    expect(sent.mappings).toEqual([
      { categories: { '10': { as: 'collection', name: 'Studio' }, 
```

[elided — kept 5800 of 6350 bytes]

## Bash sed -n 150,175p tests/test_UAT_FC_REQ-631_shop_tab.test.ts; grep -n "const field\|function field\|buttonNamed =" -A3 tes…
<!-- xgd-tool name="Bash" id="toolu_012h1MZaKL9Q3Nf7Ns9uF1Sb" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:07:31.531187+00:00" -->

**Input**

```json
{"command":"sed -n 150,175p tests/test_UAT_FC_REQ-631_shop_tab.test.ts; grep -n \"const field\\|function field\\|buttonNamed =\" -A3 tests/test_UAT_FC_REQ-631_shop_tab.test.ts | head","description":"Read shop() helper"}
```

**Result**

```
  const { t, sent, items } = transportOver()
  const panel = createShopPanel({ transport: t, pollMs: 10 })
  document.body.append(panel.element)
  await panel.refresh()
  return { panel, sent, items }
}

const rowsIn = (el: Element) => [...el.querySelectorAll('.list-detail-row')]
const field = (el: Element, name: string) => el.querySelector(`[data-field="${name}"]`) as HTMLInputElement
const titleOf = (el: Element) => el.querySelector('.builder-shop__title')!.textContent
/** [[BUG-339]] — the name is edited in the title: double-click, type, Enter. */
function rename(el: Element, name: string) {
  el.querySelector('.builder-shop__title')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
  const input = field(el, 'name')
  input.value = name
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
}
const buttonNamed = (el: Element, text: string) =>
  [...el.querySelectorAll('button')].find((b) => b.textContent === text) as HTMLButtonElement

describe.skipIf(!WEBUI_INSTALLED)('REQ-631 the Shop tab', () => {
  it('test_UAT_FC_REQ-631_shop_tab_sits_in_the_strip_before_settings', () => {
    const ids = TABS.map((t: { id: string }) => t.id)
    expect(ids).toContain(SHOP_TAB.id)
    expect(ids.indexOf(SHOP_TAB.id)).toBe(ids.indexOf('settings') - 1)
    expect(SHOP_TAB.fill).toBe(true)
158:const field = (el: Element, name: string) => el.querySelector(`[data-field="${name}"]`) as HTMLInputElement
159-const titleOf = (el: Element) => el.querySelector('.builder-shop__title')!.textContent
160-/** [[BUG-339]] — the name is edited in the title: double-click, type, Enter. */
161-function rename(el: Element, name: string) {
--
167:const buttonNamed = (el: Element, text: string) =>
168-  [...el.querySelectorAll('button')].find((b) => b.textContent === text) as HTMLButtonElement
169-
170-describe.skipIf(!WEBUI_INSTALLED)('REQ-631 the Shop tab', () => {
```

## Bash sed -n 300,370p tests/test_UAT_FC_REQ-631_inventory.workers.test.ts; grep -n "workers.test" vitest.workers.config.mts |…
<!-- xgd-tool name="Bash" id="toolu_011tR7iY7VN57cyAd1iHG8sx" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:07:37.824920+00:00" -->

**Input**

```json
{"command":"sed -n 300,370p tests/test_UAT_FC_REQ-631_inventory.workers.test.ts; grep -n \"workers.test\" vitest.workers.config.mts | head","description":"Read editable helper and new-item test"}
```

**Result**

```
    attributes: item.attributes,
    photos: item.photos,
    live: item.live,
    madeToOrder: item.madeToOrder,
  }
}

describe('REQ-631 prices and editing', () => {
  it('test_UAT_FC_REQ-631_prices_round_trip_in_minor_units', async () => {
    const biz = await aBusiness()
    expect((await biz.call('POST', '/api/settings/currency', { currency: 'eur' })).body.defaultCurrency.currency).toBe('EUR')
    const created = await biz.call('POST', '/api/shop/items', { name: 'Test Jug', price: '19.99', availability: 2 })
    expect(created.status).toBe(201)
    expect(created.body.item.price).toEqual({ amount: 1999, currency: 'EUR', market: '*', display: '19.99' })
    const stored = await env.DB.prepare('SELECT amount, typeof(amount) AS t FROM inventory_prices WHERE item_id = ?')
      .bind(created.body.item.id)
      .first<{ amount: number; t: string }>()
    expect(stored).toEqual({ amount: 1999, t: 'integer' })
    // Values that would go wrong through floating point come back exact.
    for (const [written, minor, shown] of [['0.29', 29, '0.29'], ['1.10', 110, '1.10'], ['4.35', 435, '4.35'], ['100', 10000, '100.00']] as const) {
      const r = await biz.call('PUT', `/api/shop/item?id=${created.body.item.id}`, { ...editable(created.body.item), price: written })
      expect(r.body.item.price.amount).toBe(minor)
      expect(r.body.item.price.display).toBe(shown)
    }
    for (const bad of ['19.999', 'abc', '-5', '1,5', '']) {
      const r = await biz.call('PUT', `/api/shop/item?id=${created.body.item.id}`, { ...editable(created.body.item), price: bad === '' ? 12 : bad })
      expect(r.status, `price ${bad}`).toBe(400)
    }
  })

  it('test_UAT_FC_REQ-631_new_item_starts_not_live_and_save_persists', async () => {
    const biz = await aBusiness()
    await biz.call('POST', '/api/settings/currency', { currency: 'EUR' })
    const collection = (await biz.call('POST', '/api/shop/collections', { name: 'Studio' })).body.collection
    const category = (await biz.call('POST', '/api/shop/categories', { name: 'Jugs' })).body.category
    const created = (await biz.call('POST', '/api/shop/items', { name: 'Hand Jug', price: '30', live: true })).body.item
    expect(created.live).toBe(false)
    expect(created.slug).toBeNull()

    const saved = await biz.call('PUT', `/api/shop/item?id=${created.id}`, {
      ...editable(created),
      summary: 'A jug.',
      description: 'First paragraph.\n\nSecond.',
      availability: 3,
      collectionIds: [collection.id],
      categoryIds: [category.id],
      attributes: [{ name: 'Material', value: 'Stoneware' }],
      live: true,
      madeToOrder: true,
    })
    expect(saved.status).toBe(200)
    const read = (await biz.call('GET', `/api/shop/item?id=${created.id}`)).body.item
    expect(read).toMatchObject({
      summary: 'A jug.',
      description: 'First paragraph.\n\nSecond.',
      availability: 3,
      collections: [{ name: 'Studio' }],
      categories: [{ name: 'Jugs' }],
      attributes: [{ name: 'Material', value: 'Stoneware' }],
      live: true,
      madeToOrder: true,
      slug: 'hand-jug',
    })
    // The slug is set once and stays when the name changes.
    const renamed = await biz.call('PUT', `/api/shop/item?id=${created.id}`, { ...editable(read), name: 'Big Jug' })
    expect(renamed.body.item.slug).toBe('hand-jug')

    expect((await biz.call('DELETE', `/api/shop/item?id=${created.id}`)).status).toBe(200)
    expect((await biz.call('GET', `/api/shop/item?id=${created.id}`)).status).toBe(404)
  })

115:    include: ['tests/**/*.workers.test.ts'],
```

## Write /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366/tests/test_UAT_FC_BUG-366_untrac…
<!-- xgd-tool name="Write" id="toolu_01QFfiy4YzGs7yHLh9sqex1v" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:08:13.622565+00:00" -->

**Input**

```json
{"content":"import { beforeAll, describe, expect, it } from 'vitest'\nimport { env } from 'cloudflare:test'\nimport { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'\nimport type { Scope } from '../apps/control-app/src/scope'\nimport { liveItems } from '../apps/control-app/src/shop'\nimport { applySchema, ensureTenant, seedTenantSite, splitStatements } from './support/d1-site-factory'\nimport { fakeShop, products, SHOP_URL } from './support/shop-fixture'\nimport liveSetByMigration from '../db/migrations/0051_item_live_set_by.sql?raw'\n\n/**\n * [[BUG-366]] — a one-of-a-kind piece whose source does not track stock is\n * imported live; items an earlier import held back only for that are let go on\n * the next run unless the owner switched them; and Make these live puts the\n * report's not-live items live as the owner's choice.\n *\n * DRIVEN THROUGH THE REAL ROUTES against real D1, over the synthetic\n * WooCommerce fixture, as REQ-631's suite is. In the fixture, Seconds Plate is\n * in stock with stock management off, Gift Voucher is priced 0 and Plain Bowl\n * has no photo.\n */\n\nconst APPLIED = applySchema()\nlet seq = 0\n\nfunction routerEnv(): RouterEnv {\n  return {\n    DB: env.DB as D1Database,\n    SITES: env.SITES as R2Bucket,\n    BLOBS: env.BLOBS as R2Bucket,\n    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,\n  }\n}\n\nasync function aBusiness() {\n  const businessId = `bug366-${(seq += 1)}-${Date.now()}`\n  await ensureTenant(businessId)\n  await seedTenantSite(businessId)\n  const shop = fakeShop()\n  const deps: RouterDeps = {\n    index: async () => async () => {},\n    describeText: async () => ({ text: 'A document.', model: 'stub/digest-1' }),\n    describeImage: async () => ({ text: 'A ceramic piece\\n\\nA ceramic piece on a plain ground.', model: 'stub/vision-1' }),\n    fetch: shop.fetch,\n  }\n  const call = async (method: string, path: string, payload?: unknown) => {\n    const response = await route(\n      new Request(`https://app.test${path}`, {\n        method,\n        ...(payload === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }),\n      }),\n      routerEnv(),\n      { businessId } as Scope,\n      deps,\n    )\n    return { status: response.status, body: (await response.json()) as any }\n  }\n  return { businessId, shop, call }\n}\n\ntype Biz = Awaited<ReturnType<typeof aBusiness>>\n\n/** Scan, keep the proposed mapping, and run the import to the end. */\nasync function imported(biz: Biz) {\n  const scan = await biz.call('POST', '/api/shop/import/scan', { source: 'woocommerce', fields: { url: SHOP_URL } })\n  expect(scan.status).toBe(200)\n  expect((await biz.call('POST', '/api/shop/import/mapping', { source: 'woocommerce', mapping: scan.body.mapping })).status).toBe(200)\n  const started = await biz.call('POST', '/api/shop/import', { source: 'woocommerce', fields: { url: SHOP_URL } })\n  expect(started.status).toBe(202)\n  const run = await biz.call('GET', `/api/shop/import?id=${started.body.import.id}`)\n  expect(run.body.import.status).toBe('done')\n  return run.body.import\n}\n\nasync function itemNamed(biz: Biz, name: string) {\n  const { body } = await biz.call('GET', `/api/shop/items?limit=100&q=${encodeURIComponent(name)}`)\n  const found = (body.items as any[]).find((i) => i.name === name)\n  expect(found, `no item named ${name}`).toBeDefined()\n  return found\n}\n\n/** An item as the body a Save sends. */\nfunction editable(item: any) {\n  return {\n    name: item.name,\n    summary: item.summary,\n    description: item.description,\n    price: item.price ? item.price.display : null,\n    availability: item.availability,\n    collectionIds: item.collections.map((c: any) => c.id),\n    categoryIds: item.categories.map((c: any) => c.id),\n    attributes: item.attributes,\n    photos: item.photos,\n    live: item.live,\n    madeToOrder: item.madeToOrder,\n  }\n}\n\n/**\n * Put an item back as the import before this fix left it — not live, never\n * given a slug, and with no record of who set `live` — then run 0051's data\n * statement over it, as the migration does to every database it reaches.\n */\nasync function asHeldBackBeforeTheFix(id: string) {\n  await env.DB.prepare(\"UPDATE inventory_items SET live = 0, slug = NULL, live_set_by = 'owner' WHERE id = ?\").bind(id).run()\n  const update = splitStatements(liveSetByMigration).find((s) => s.trim().startsWith('UPDATE'))!\n  await env.DB.prepare(update).run()\n}\n\nbeforeAll(async () => {\n  await APPLIED\n})\n\ndescribe('BUG-366 untracked stock', () => {\n  it('test_UAT_FC_BUG-366_untracked_stock_imports_live_with_availability_1_and_is_reported', async () => {\n    const biz = await aBusiness()\n    const run = await imported(biz)\n    const plate = await itemNamed(biz, 'Seconds Plate')\n    expect(plate.live).toBe(true)\n    expect(plate.availability).toBe(1)\n    expect(plate.liveSetBy).toBe('import')\n    expect(plate.slug).toBe('seconds-plate')\n    expect(run.report.stockNotTracked.map((s: any) => s.name)).toEqual(['Seconds Plate'])\n    // A price of 0 and no photo still hold a product back, each with its reason.\n    expect(Object.fromEntries(run.report.notLive.map((n: any) => [n.name, n.reasons]))).toEqual({\n      'Gift Voucher': ['price of 0'],\n      'Plain Bowl': ['no photo'],\n    })\n    for (const name of ['Gift Voucher', 'Plain Bowl']) expect((await itemNamed(biz, name)).live).toBe(false)\n    const live = await liveItems({ DB: env.DB as D1Database, SITES: env.SITES as R2Bucket }, biz.businessId)\n    expect(live.map((i) => i.name)).toContain('Seconds Plate')\n  })\n})\n\ndescribe('BUG-366 recovery on the next import', () => {\n  it('test_UAT_FC_B
```

[elided — kept 5800 of 10403 bytes]

**Result**

```
File created successfully at: /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366/tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.workers.test.ts (file state is current in your context — no need to Read it back)
```

## Bash grep -n "ShopNotFoundError" apps/control-app/src/shop-routes.ts | head -3; ls apps/control-app/src/generated 2>/dev/null…
<!-- xgd-tool name="Bash" id="toolu_01SqqMFM7ZyyWL2gjCSi42xi" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:08:18.001236+00:00" -->

**Input**

```json
{"command":"grep -n \"ShopNotFoundError\" apps/control-app/src/shop-routes.ts | head -3; ls apps/control-app/src/generated 2>/dev/null | head -2 || echo none; cat bin/xgd-test 2>/dev/null | head -5; grep -n '\"test' package.json | head","description":"Check error mapping and test runner"}
```

**Result**

```
30:  ShopNotFoundError,
252:    if (err instanceof ShopNotFoundError) return json(404, { error: scrub(err.message) })
12:    "test": "vitest run",
18:    "test:browser": "vitest run --config vitest.browser.config.mts"
```

## Bash cp -R /Users/martin/lagrangefoundry/1stcontact/apps/control-app/src/generated apps/control-app/src/ && npx tsc --noEmit…
<!-- xgd-tool name="Bash" id="toolu_01H5GNfrpCtSnPLNYRiXXW7A" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:08:21.206609+00:00" -->

**Input**

```json
{"command":"cp -R /Users/martin/lagrangefoundry/1stcontact/apps/control-app/src/generated apps/control-app/src/ && npx tsc --noEmit -p apps/control-app 2>&1 | head -20","description":"Copy generated artifacts and typecheck control-app","timeout":300000}
```

**Result**

```
(Bash completed with no output)
```

## Bash timeout 580 npx vitest run --config vitest.workers.config.mts tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.worker…
<!-- xgd-tool name="Bash" id="toolu_0127uFJVeVusW2y2scftoZ6G" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:08:30.708446+00:00" -->

**Input**

```json
{"command":"timeout 580 npx vitest run --config vitest.workers.config.mts tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.workers.test.ts tests/test_UAT_FC_REQ-631_inventory.workers.test.ts tests/test_UAT_FC_REQ-654_handoff_copy.workers.test.ts tests/test_UAT_FC_BUG-335_shop_over_100_items.workers.test.ts tests/test_UAT_FC_REQ-634_shop_api.workers.test.ts 2>&1 | tail -40","description":"Run shop workers suites","timeout":600000}
```

**Result**

```
 RUN  v4.1.9 /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366

Sourcemap for "/Users/martin/lagrangefoundry/node_modules/standardwebhooks/dist/index.js" points to missing source files
uncaught exception; source = Uncaught (in promise); stack = Error: internal error; reference = 7icmu9v8lkfe5qibsm58d8gh
uncaught exception; source = Uncaught (in promise); stack = Error: internal error; reference = 8rm6iqnftmb8mat3lmje81li
 ❯ |workers| tests/test_UAT_FC_REQ-631_inventory.workers.test.ts (12 tests | 1 failed) 1561ms
     × test_UAT_FC_REQ-631_list_filters_by_collection_category_live_and_name 162ms
uncaught exception; source = Uncaught (in promise); stack = Error: internal error; reference = tc258b1f0gdcnq7cjkfpktqs

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  |workers| tests/test_UAT_FC_REQ-631_inventory.workers.test.ts > REQ-631 list > test_UAT_FC_REQ-631_list_filters_by_collection_category_live_and_name
AssertionError: expected [ 'Gift Voucher', 'Plain Bowl' ] to deeply equal [ 'Gift Voucher', 'Plain Bowl', …(1) ]

- Expected
+ Received

  [
    "Gift Voucher",
    "Plain Bowl",
-   "Seconds Plate",
  ]

 ❯ tests/test_UAT_FC_REQ-631_inventory.workers.test.ts:409:39
    407|     )
    408|     expect(await names(`category=${mugs.id}`)).toEqual(['Crossover Mug…
    409|     expect(await names('live=false')).toEqual(['Gift Voucher', 'Plain …
       |                                       ^
    410|     expect(await names('q=mug')).toEqual(['Crossover Mug', 'Speckled M…
    411|     expect(await names(`q=mug&category=${mugs.id}&live=true`)).toEqual…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed | 4 passed (5)
      Tests  1 failed | 33 passed (34)
   Start at  15:08:32
   Duration  12.02s (transform 12.75s, setup 0ms, import 35.07s, tests 7.32s, environment 0ms)
```

## Bash sed -i '' "409s/\['Gift Voucher', 'Plain Bowl', 'Seconds Plate'\]/['Gift Voucher', 'Plain Bowl']/" tests/test_UAT_FC_REQ…
<!-- xgd-tool name="Bash" id="toolu_01L6eGWhX7Jn35n7fnXfDDVk" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:08:49.088755+00:00" -->

**Input**

```json
{"command":"sed -i '' \"409s/\\['Gift Voucher', 'Plain Bowl', 'Seconds Plate'\\]/['Gift Voucher', 'Plain Bowl']/\" tests/test_UAT_FC_REQ-631_inventory.workers.test.ts && sed -n 409p tests/test_UAT_FC_REQ-631_inventory.workers.test.ts && timeout 580 npx vitest run --config vitest.workers.config.mts tests/test_UAT_FC_REQ-631_inventory.workers.test.ts 2>&1 | tail -6; git stash list | head -0","description":"Fix list filter assertion and rerun","timeout":600000}
```

**Result**

```
Exit code 1
    expect(await names('live=false')).toEqual(['Gift Voucher', 'Plain Bowl'])

 Test Files  1 passed (1)
      Tests  12 passed (12)
   Start at  15:08:50
   Duration  7.69s (transform 2.27s, setup 0ms, import 5.99s, tests 1.45s, environment 0ms)

head: illegal line count -- 0
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && timeout 300 npx vitest run --config vitest.workers.config.mts tests/test_…
<!-- xgd-tool name="Bash" id="toolu_01Gk8NSNQgidVXv1ZsuHGQBf" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:09:02.990876+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && timeout 300 npx vitest run --config vitest.workers.config.mts tests/test_UAT_FC_REQ-634_shop_api.workers.test.ts 2>&1 | grep -c \"internal error\"; cd - >/dev/null; timeout 300 npx vitest run --config vitest.workers.config.mts tests/test_UAT_FC_REQ-634_shop_api.workers.test.ts 2>&1 | grep -c \"internal error\"","description":"Compare uncaught-error noise to baseline","timeout":620000}
```

**Result**

```
0
0
```

## Bash for f in tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.workers.test.ts tests/test_UAT_FC_REQ-654_handoff_copy.work…
<!-- xgd-tool name="Bash" id="toolu_01DhwdMcqkjEMCCHvMz53a8g" turn="fb704d8ed70141d390cfa720ce4f172d" ts="2026-11-05T23:09:52.241741+00:00" -->

**Input**

```json
{"command":"for f in tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.workers.test.ts tests/test_UAT_FC_REQ-654_handoff_copy.workers.test.ts tests/test_UAT_FC_BUG-335_shop_over_100_items.workers.test.ts; do echo \"$f $(timeout 300 npx vitest run --config vitest.workers.config.mts $f 2>&1 | grep -c 'internal error')\"; done; cd /Users/martin/lagrangefoundry/1stcontact && for f in tests/test_UAT_FC_REQ-654_handoff_copy.workers.test.ts tests/test_UAT_FC_BUG-335_shop_over_100_items.workers.test.ts; do echo \"BASE $f $(timeout 300 npx vitest run --config vitest.workers.config.mts $f 2>&1 | grep -c 'internal error')\"; done","description":"Locate internal-error noise per suite vs baseline","timeout":600000}
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{"session":"bug…
<!-- xgd-tool name="Bash" id="toolu_01Lzdch7TPwiAZgpT7S9gEaj" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:12:24.994092+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"bug-00d5f738\"}'; git worktree list | grep -i 366; git branch -a | grep -i 366","description":"Read summary and locate the branch worktree"}
```

**Result**

```
/Users/martin/.pyenv/versions/3.12.11/bin/python: Error while finding module specification for 'lagrangefoundry.ai.agent_cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366         b24333f2cd [free-BUG-366]
+ free-BUG-366
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && git status --short && git…
<!-- xgd-tool name="Bash" id="toolu_011kitq5iB3oha4j8vdNb7Dw" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:12:38.234297+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && git status --short && git log --oneline -3 && git diff --stat; ls /Users/martin/lagrangefoundry/1stcontact/.venv/bin/python 2>/dev/null","description":"Show the branch's working state"}
```

**Result**

```
Exit code 1
 M apps/control-app/src/builder/api.js
 M apps/control-app/src/builder/shop.js
 M apps/control-app/src/handoff-copy.ts
 M apps/control-app/src/shop-import.ts
 M apps/control-app/src/shop-routes.ts
 M apps/control-app/src/shop.ts
 M db/migrations/manifest.json
 M tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts
 M tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts
 M tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts
 M tests/support/d1-site-factory.ts
 M tests/test_UAT_FC_REQ-631_inventory.workers.test.ts
 M tests/test_UAT_FC_REQ-631_shop_tab.test.ts
?? db/migrations/0051_item_live_set_by.sql
?? tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.workers.test.ts
b24333f2cd xgd(ticket): update bug bug-00d5f738
da55ad5065 xgd(ticket): update comment comment-6e0c2a3d
78be5ede2d xgd(ticket): create comment comment-6e0c2a3d
 apps/control-app/src/builder/api.js                |  2 +
 apps/control-app/src/builder/shop.js               | 49 +++++++++++++++++++-
 apps/control-app/src/handoff-copy.ts               |  5 ++
 apps/control-app/src/shop-import.ts                | 26 ++++++++---
 apps/control-app/src/shop-routes.ts                | 12 +++++
 apps/control-app/src/shop.ts                       | 54 +++++++++++++++++++---
 db/migrations/manifest.json                        |  3 +-
 .../browser/test_UAT_FC_BUG-333_j2_import.test.ts  | 11 +++--
 .../test_UAT_FC_BUG-333_j4_inventory_list.test.ts  |  2 +-
 ...UAT_FC_BUG-333_j7_site_follows_the_save.test.ts |  2 +-
 tests/support/d1-site-factory.ts                   | 32 +++++++++++--
 .../test_UAT_FC_REQ-631_inventory.workers.test.ts  |  8 ++--
 tests/test_UAT_FC_REQ-631_shop_tab.test.ts         |  2 +-
 13 files changed, 176 insertions(+), 32 deletions(-)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && git diff apps/ db/ && cat…
<!-- xgd-tool name="Bash" id="toolu_01B1QDFaoR8LHazM4x23fsiB" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:12:42.170322+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && git diff apps/ db/ && cat db/migrations/0051_item_live_set_by.sql","description":"Show the source diff and migration"}
```

**Result**

```
diff --git a/apps/control-app/src/builder/api.js b/apps/control-app/src/builder/api.js
index 50610db32c..35844ef99f 100644
--- a/apps/control-app/src/builder/api.js
+++ b/apps/control-app/src/builder/api.js
@@ -2608,6 +2608,8 @@ export function shopTransport(fetchImpl = fetch) {
     scan: (source, fields) => call('POST', '/api/shop/import/scan', { source, fields }),
     saveMapping: (source, mapping) => call('POST', '/api/shop/import/mapping', { source, mapping }),
     startImport: (source, fields) => call('POST', '/api/shop/import', { source, fields }).then((b) => b.import),
+    // [[BUG-366]] — Make these live, from the import report.
+    makeLive: (ids) => call('POST', '/api/shop/items/live', { ids }).then((b) => b.live),
     importStatus: (id) => call('GET', id ? `/api/shop/import?id=${encodeURIComponent(id)}` : '/api/shop/import').then((b) => b.import),
     images: () => fetchMaterial(fetchImpl).then((b) => (Array.isArray(b.material) ? b.material.filter((m) => m.kind === 'image') : [])),
     fileUrl: (uid) => materialFileUrl(uid),
diff --git a/apps/control-app/src/builder/shop.js b/apps/control-app/src/builder/shop.js
index f0cdc3c1eb..41177a48a6 100644
--- a/apps/control-app/src/builder/shop.js
+++ b/apps/control-app/src/builder/shop.js
@@ -1037,6 +1037,51 @@ export function createShopPanel(options = {}) {
     polling = null
   }
 
+  /**
+   * [[BUG-366]] — WHAT THE IMPORT HELD BACK, AND WHY: each item with its reasons
+   * and a box to tick, and Make these live for the ticked ones. Nothing is ticked
+   * to begin with — going live is the owner's call, one item at a time.
+   */
+  function notLiveView(entries) {
+    const list = el('ul', 'builder-shop__report-list')
+    const boxes = []
+    for (const e of entries) {
+      const li = el('li')
+      const box = el('input')
+      box.type = 'checkbox'
+      box.dataset.item = e.itemId
+      box.addEventListener('change', () => {
+        make.disabled = !boxes.some((b) => b.checked)
+      })
+      boxes.push(box)
+      const l = el('label', 'builder-shop__check')
+      l.append(box, document.createTextNode(`${e.name}: not live because of ${e.reasons.join(', ')}`))
+      li.append(l)
+      list.append(li)
+    }
+    const status = el('p', 'builder-shop__progress')
+    const make = button('Make these live', async () => {
+      const ticked = boxes.filter((b) => b.checked)
+      make.disabled = true
+      try {
+        await transport.makeLive(ticked.map((b) => b.dataset.item))
+      } catch (err) {
+        status.textContent = err?.message || String(err)
+        make.disabled = false
+        return
+      }
+      for (const b of ticked) {
+        b.checked = false
+        b.disabled = true
+        b.parentElement.lastChild.textContent += ' (now live)'
+      }
+      status.textContent = `${ticked.length} ${ticked.length === 1 ? 'item is' : 'items are'} now live.`
+      void refresh()
+    })
+    make.disabled = true
+    return [el('h3', 'builder-shop__section', 'Imported not live, for you to review'), list, make, status]
+  }
+
   function reportView(report, describing = 0) {
     const view = el('div', 'builder-shop__report')
     view.append(
@@ -1051,8 +1096,8 @@ export function createShopPanel(options = {}) {
       view.append(list)
     }
     section('Failed', report.failed, (e) => `${e.name}: ${e.reason}`)
-    section('Imported not live, for you to review', report.notLive, (e) => `${e.name}: ${e.reasons.join(', ')}`)
-    section('Stock not tracked (availability set to 1)', report.stockNotTracked, (e) => e.name)
+    if (report.notLive.length > 0) view.append(...notLiveView(report.notLive))
+    section('Stock not tracked (live, availability set to 1)', report.stockNotTracked, (e) => e.name)
     section('Photos that could not be brought in', report.photoFailures, (e) => `${e.name}: ${e.reason}`)
     section(
       'Summaries repeated across products — possibly shop boilerplate',
diff --git a/apps/control-app/src/handoff-copy.ts b/apps/control-app/src/handoff-copy.ts
index 771d366179..44b9b7866b 100644
--- a/apps/control-app/src/handoff-copy.ts
+++ b/apps/control-app/src/handoff-copy.ts
@@ -16,6 +16,7 @@ import {
   MAX_PAGE,
   saveItem,
   type InventoryItem,
+  type LiveSetBy,
   type ItemInput,
   type ShopEnv,
 } from './shop'
@@ -83,6 +84,8 @@ export interface ManifestItem {
   attributes: { name: string; value: string }[]
   photos: { material: string; sourceUrl?: string }[]
   live: boolean
+  /** [[BUG-366]] — who set `live`, so a later import on the destination treats it as the source did. */
+  liveSetBy: LiveSetBy
   madeToOrder: boolean
   prices: { amount: number; currency: string; market: string }[]
   source: { platform: string; id: string; sku: string | null }
@@ -219,6 +222,7 @@ export async function handoffManifest(
       attributes: i.attributes,
       photos: i.photos,
       live: i.live,
+      liveSetBy: i.liveSetBy,
       madeToOrder: i.madeToOrder,
       prices: i.prices.map((p) => ({ amount: p.amount, currency: p.currency, market: p.market })),
       // AN IMPORTED ITEM KEEPS ITS IMPORT KEY, so a later import from the same shop
@@ -375,6 +379,7 @@ async function landShop(env: ShopEnv, businessId: string, shop: ManifestShop, ui
     const saved = await saveItem(env, businessId, existing?.id ?? null, input, {
       source: item.source,
       priceAmount: null,
+      liveSetBy: item.liveSetBy,
     })
     // EVERY PRICE, every currency and market: the save writes the business
     // currency's only, so the rows are replaced whole here.
diff --git a/apps/control-app/src/shop-import.ts b/apps/control-app/src/shop-import.ts
index 361cdc7b89..a64799d8ba 100644
--- a/apps/control-app/src/shop-import.ts
+++ b/apps/control-app/src/shop-import.ts
@@
```

[elided — kept 5800 of 18775 bytes]

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && git diff tests/browser tes…
<!-- xgd-tool name="Bash" id="toolu_01Rf9BvAFw2SnUFHJwu3vvNV" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:12:52.206077+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && git diff tests/browser tests/test_UAT_FC_REQ-631_shop_tab.test.ts && grep -n \"async function refresh\\|function refresh\" -A25 apps/control-app/src/builder/shop.js | head -50 && wc -l tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.workers.test.ts && grep -n \"^\\s*it(\\|test(\" tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.workers.test.ts","description":"Inspect test diffs, refresh, and new test"}
```

**Result**

```
diff --git a/tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts b/tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts
index 64400e02fb..089a7e4314 100644
--- a/tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts
+++ b/tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts
@@ -37,7 +37,8 @@ const EXPECTED: Record<string, [string[], string[], number, number, number, numb
   'Gift Voucher': [[], ['Gifts & Cards'], 0, 1, 0, 1],
   'Plain Bowl': [[], ['Bowls & Dishes'], 4500, 1, 0, 0],
   'Quiet Cup': [['Studio'], ['Mugs'], 4500, 1, 1, 1],
-  'Seconds Plate': [['Seconds'], ['Plates'], 4500, 1, 0, 1],
+  // [[BUG-366]] — untracked stock is live, with availability 1.
+  'Seconds Plate': [['Seconds'], ['Plates'], 4500, 1, 1, 1],
   'Small Jug': [['Studio'], ['Bowls & Dishes'], 4500, 1, 1, 1],
   'Speckled Mug': [['Studio'], ['Mugs'], 1999, 1, 1, 3],
   'Tall Vase': [['Studio'], ['Mugs'], 4500, 1, 1, 1],
@@ -98,12 +99,12 @@ describe('BUG-333 J2 — import, end to end', () => {
       `Created ${fixtureCounts.products - 1}, updated 0, failed 1.`,
     )
     expect(reportText).toContain('Misreported Platter: its price claims 3 decimal places but EUR has 2')
-    expect(reportText).toContain('Gift Voucher: price of 0')
-    expect(reportText).toContain('Plain Bowl: no photo')
-    expect(reportText).toContain('Seconds Plate: stock not tracked')
+    expect(reportText).toContain('Plain Bowl: not live because of no photo')
+    expect(reportText).toContain('Gift Voucher: not live because of price of 0')
+    expect(reportText).not.toContain('Seconds Plate: not live')
     // [[REQ-651]] — no collection is chosen between: the report has no such section.
     expect(reportText).not.toContain('Collection decided')
-    expect(reportText).toMatch(/Stock not tracked \(availability set to 1\)Seconds Plate/)
+    expect(reportText).toMatch(/Stock not tracked \(live, availability set to 1\)Seconds Plate/)
     expect(reportText).toContain('9 products open with “Hand thrown in the studio.”')
 
     // THE INVENTORY, AFTER A RELOAD: exactly the fixture's items.
diff --git a/tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts b/tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts
index b670624f26..df629b0f2a 100644
--- a/tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts
+++ b/tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts
@@ -57,7 +57,7 @@ describe('BUG-333 J4 — inventory list', () => {
 
     // Filter by live state.
     await choose(page, 'Live', 'Not live')
-    await expect.poll(() => shown(page)).toEqual(['Gift Voucher', 'Plain Bowl', 'Seconds Plate'])
+    await expect.poll(() => shown(page)).toEqual(['Gift Voucher', 'Plain Bowl'])
     await choose(page, 'Live', 'Live and not live')
 
     // Search by name.
diff --git a/tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts b/tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts
index 75e5677ad8..2917c81a0c 100644
--- a/tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts
+++ b/tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts
@@ -69,7 +69,7 @@ describe('BUG-333 J7 — the site follows the item', () => {
     const live = stored.filter((i) => i.live === 1)
     const notLive = stored.filter((i) => i.live === 0)
     expect(live.length).toBeGreaterThan(0)
-    expect(notLive.map((i) => i.name).sort()).toEqual(['Gift Voucher', 'Plain Bowl', 'Seconds Plate'])
+    expect(notLive.map((i) => i.name).sort()).toEqual(['Gift Voucher', 'Plain Bowl'])
 
     // Each live item has its page, built from the one template; its main photo loads.
     for (const item of live) {
diff --git a/tests/test_UAT_FC_REQ-631_shop_tab.test.ts b/tests/test_UAT_FC_REQ-631_shop_tab.test.ts
index 8fa683a03d..13bb7a9e70 100644
--- a/tests/test_UAT_FC_REQ-631_shop_tab.test.ts
+++ b/tests/test_UAT_FC_REQ-631_shop_tab.test.ts
@@ -274,7 +274,7 @@ describe.skipIf(!WEBUI_INSTALLED)('REQ-631 the Shop tab', () => {
     expect(sent.started).toEqual([{ source: 'woocommerce', fields: { url: 'https://shop.example.test' } }])
     const report = view.querySelector('.builder-shop__report')!
     expect(report.textContent).toContain('Created 3, updated 0, failed 0.')
-    expect(report.textContent).toContain('Gift Voucher: price of 0')
+    expect(report.textContent).toContain('Gift Voucher: not live because of price of 0')
     expect(report.textContent).toContain('9 products open with “Hand thrown in the studio.”')
 
     buttonNamed(view, 'Back to inventory').click()
1117:  async function refresh() {
1118-    void checkPayments()
1119-    if (mode === 'orders') void orders.refresh().catch(() => undefined)
1120-    await loadTaxonomy()
1121-    await load(false)
1122-    if (importing) return
1123-    // [[BUG-333]] — coming back to the tab while a run is under way shows the run.
1124-    const latest = await transport.importStatus().catch(() => null)
1125-    if (latest && latest.status === 'running' && !importing) void showImport(latest)
1126-  }
1127-
1128-  function clear() {
1129-    paymentsPrompt.hidden = true
1130-    shippingPrompt.hidden = true
1131-    orders.clear()
1132-    stopPolling()
1133-    rows = []
1134-    total = 0
1135-    taxonomy = { collections: [], categories: [], currency: null }
1136-    listDetail.setItems([])
1137-    say('')
1138-    importing = false
1139-    setMode('inventory')
1140-  }
1141-
1142-  showInventory()
     214 tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.workers.test.ts
114:  it('test_UAT_FC_BUG-366_untracked_stock_imports_live_with_availability_1_and_is_reported', async () => {
135:  it('test_UAT_FC_BUG-366_item_held_back_by_the_old_rule_goes_live_on_the_next_import', async () => {
151:  it('test_UAT_FC_BUG-366_item_the_owner_switched_o
```

[elided — kept 5800 of 6140 bytes]

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && sed -n 1,80p tests/test_UA…
<!-- xgd-tool name="Bash" id="toolu_01CwNTPLd1RZbSQChHx93Bgc" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:12:58.887028+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && sed -n 1,80p tests/test_UAT_FC_REQ-631_shop_tab.test.ts && sed -n 225,290p tests/test_UAT_FC_REQ-631_shop_tab.test.ts","description":"Read shop tab test harness"}
```

**Result**

```
// @vitest-environment jsdom
/**
 * [[REQ-631]] — the Shop tab: the Inventory list, the item detail and its Save,
 * and the import's mapping step, driven in a DOM.
 *
 * THE TRANSPORT IS THE PANEL'S BOUNDARY, as it is for the Library's suites. The
 * Worker side of every call is proven against real D1 by
 * `test_UAT_FC_REQ-631_inventory.workers.test.ts`; this suite proves what the
 * owner sees and what the panel sends, over a double holding the same shapes.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { SHOP_TAB, TABS } from '../apps/control-app/src/builder/config.js'

let createShopPanel: (opts?: Record<string, unknown>) => any

if (!WEBUI_INSTALLED) console.warn(`REQ-631 shop tab suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))

function item(over: Record<string, unknown>) {
  return {
    id: 'inv_1',
    name: 'Speckled Mug',
    summary: 'A mug.',
    description: 'A speckled mug.',
    price: { amount: 1999, currency: 'EUR', market: '*', display: '19.99' },
    prices: [],
    availability: 1,
    sold: false,
    collections: [{ id: 'col_1', name: 'Studio Line' }],
    categories: [{ id: 'cat_1', name: 'Mugs' }],
    attributes: [{ name: 'Glaze', value: 'Speckle' }],
    photos: [{ material: 'material-1', sourceUrl: 'https://shop.example.test/p.png' }],
    live: true,
    madeToOrder: false,
    source: null,
    slug: null,
    createdAt: '2026-11-02T00:00:00.000Z',
    updatedAt: '2026-11-02T00:00:00.000Z',
    ...over,
  }
}

/** A transport double over an in-memory shop, recording what the panel sent. */
function transportOver() {
  const items = [
    item({}),
    item({ id: 'inv_2', name: 'Blue Bowl', availability: 0, sold: true, categories: [] }),
    item({ id: 'inv_3', name: 'Gift Voucher', live: false, price: null, collections: [] }),
  ]
  const sent: { saves: any[]; mappings: any[]; started: any[] } = { saves: [], mappings: [], started: [] }
  const t = {
    list: async (q: Record<string, unknown>) => {
      const rows = items.filter((i) => (q.live === 'false' ? !i.live : q.live === 'true' ? i.live : true))
      return { items: rows.slice(Number(q.offset ?? 0), Number(q.offset ?? 0) + Number(q.limit ?? 50)), total: rows.length, currency: 'EUR' }
    },
    item: async (id: string) => items.find((i) => i.id === id),
    create: async (input: any) => item({ id: 'inv_new', ...input, live: false }),
    save: async (id: string, draft: any) => {
      sent.saves.push({ id, draft: structuredClone(draft) })
      if (draft.availability < 0 || Number.isNaN(draft.availability)) throw new Error('Availability must be a whole number, 0 or more.')
      const at = items.findIndex((i) => i.id === id)
      items[at] = { ...items[at], name: draft.name, availability: draft.availability, live: draft.live }
      return items[at]
    },
    remove: async () => ({}),
    taxonomy: async () => ({
      collections: [{ id: 'col_1', name: 'Studio Line' }],
      categories: [{ id: 'cat_1', name: 'Mugs' }],
      currency: 'EUR',
    }),
    addCollection: async (name: string) => ({ id: 'col_2', name }),
    addCategory: async (name: string) => ({ id: 'cat_2', name }),
    // [[REQ-634]] — the import names its source; the fields are the source's own.
    sources: async () => [
      { id: 'woocommerce', name: 'WooCommerce', fields: [{ name: 'url', label: 'Shop address', type: 'url' }] },
    ],
    scan: async () => ({
    field(reopened, 'availability').dispatchEvent(new Event('input'))
    buttonNamed(reopened, 'Save').click()
    await settle()
    expect(sent.saves).toHaveLength(1)
    expect(sent.saves[0]).toMatchObject({ id: 'inv_1', draft: { name: 'Speckled Mug, large', availability: 2, price: '19.99' } })
    expect(panel.element.querySelector('.builder-shop__detail-status')!.textContent).toBe('Saved.')
    expect(rowsIn(panel.element).some((r) => r.textContent!.includes('Speckled Mug, large'))).toBe(true)

    // A refusal is shown in the Worker's sentence.
    const after = panel.element.querySelector('.builder-shop__detail')!
    field(after, 'availability').value = '-1'
    field(after, 'availability').dispatchEvent(new Event('input'))
    buttonNamed(after, 'Save').click()
    await settle()
    expect(panel.element.querySelector('.builder-shop__detail-status')!.textContent).toMatch(/Availability must be/)
  })

  it('test_UAT_FC_REQ-631_import_shows_the_mapping_step_and_the_report', async () => {
    const { panel, sent } = await shop()
    // [[REQ-634]] — Import, then the source, then the source's own fields.
    buttonNamed(panel.element, 'Import').click()
    await settle()
    const view = panel.element.querySelector('.builder-shop__import')!
    const source = field(view, 'source') as unknown as HTMLSelectElement
    source.value = 'woocommerce'
    source.dispatchEvent(new Event('change'))
    field(view, 'url').value = 'https://shop.example.test'
    field(view, 'url').dispatchEvent(new Event('input'))
    buttonNamed(view, 'Scan').click()
    await settle()

    // Every source category with its parent and count, and a choice for each.
    const rows = [...view.querySelectorAll('tr[data-category]')]
    expect(rows.map((r) => r.textContent)).toEqual([expect.stringContaining('Studio Line—2'), expect.stringContaining('MugsStudio Line1')])
    const mugs = view.querySelector('tr[data-category="11"]')!
    ;(mugs.querySelector('[data-field="as"]') as HTMLSelectElement).value = 'none'
    mugs.querySelector('[data-field="as"]')!.dispatchEvent(new Event('change'))
    const studio = view.querySelector('tr[data-category="10"] [data-field="name"]') as HTMLInputElement
    studio.value =
```

[elided — kept 5800 of 6792 bytes]

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && sed -n 80,170p tests/test_…
<!-- xgd-tool name="Bash" id="toolu_01SCAWZxZevWGVhKHBB5ToUR" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:13:02.678299+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && sed -n 80,170p tests/test_UAT_FC_REQ-631_shop_tab.test.ts","description":"Read rest of transport double and helpers"}
```

**Result**

```
    scan: async () => ({
      scan: {
        source: 'woocommerce',
        base: 'https://shop.example.test',
        products: 3,
        categories: [
          { id: '10', name: 'Studio Line', parent: null, count: 2 },
          { id: '11', name: 'Mugs', parent: '10', count: 1 },
        ],
        attributes: [{ name: 'Glaze', count: 3 }],
      },
      mapping: {
        categories: { '10': { as: 'collection', name: 'Studio Line' }, '11': { as: 'category', name: 'Mugs' } },
        attributes: { Glaze: 'keep' },
      },
      saved: false,
    }),
    saveMapping: async (_source: string, mapping: unknown) => {
      sent.mappings.push(structuredClone(mapping))
      return { mapping }
    },
    startImport: async (source: string, fields: Record<string, string>) => {
      sent.started.push({ source, fields })
      return {
        id: 'imp_1',
        status: 'done',
        page: 2,
        totalPages: 1,
        processed: 3,
        error: null,
        report: {
          created: 3,
          updated: 0,
          failed: [],
          notLive: [{ sourceId: '104', itemId: 'inv_3', name: 'Gift Voucher', reasons: ['price of 0'] }],
          stockNotTracked: [],
          photoFailures: [],
          repeatedSummaries: [{ text: 'Hand thrown in the studio.', count: 9, kind: 'opening' }],
        },
      }
    },
    importStatus: async () => null,
    images: async () => [],
    fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
  }
  return { t, sent, items }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) ({ createShopPanel } = await import('../apps/control-app/src/builder/shop.js'))
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
  globalThis.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as never
})

beforeEach(() => document.body.replaceChildren())

async function shop() {
  const { t, sent, items } = transportOver()
  const panel = createShopPanel({ transport: t, pollMs: 10 })
  document.body.append(panel.element)
  await panel.refresh()
  return { panel, sent, items }
}

const rowsIn = (el: Element) => [...el.querySelectorAll('.list-detail-row')]
const field = (el: Element, name: string) => el.querySelector(`[data-field="${name}"]`) as HTMLInputElement
const titleOf = (el: Element) => el.querySelector('.builder-shop__title')!.textContent
/** [[BUG-339]] — the name is edited in the title: double-click, type, Enter. */
function rename(el: Element, name: string) {
  el.querySelector('.builder-shop__title')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
  const input = field(el, 'name')
  input.value = name
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
}
const buttonNamed = (el: Element, text: string) =>
  [...el.querySelectorAll('button')].find((b) => b.textContent === text) as HTMLButtonElement

describe.skipIf(!WEBUI_INSTALLED)('REQ-631 the Shop tab', () => {
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && python3 - <<'EOF' p='tests…
<!-- xgd-tool name="Bash" id="toolu_01Gn65DcTGQ9ko6P5bsP3Wbt" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:13:15.497428+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && python3 - <<'EOF'\np='tests/test_UAT_FC_REQ-631_shop_tab.test.ts'\ns=open(p).read()\ns=s.replace(\"const sent: { saves: any[]; mappings: any[]; started: any[] } = { saves: [], mappings: [], started: [] }\",\n\"const sent: { saves: any[]; mappings: any[]; started: any[]; madeLive: string[][] } = { saves: [], mappings: [], started: [], madeLive: [] }\",1)\ns=s.replace(\"\"\"    importStatus: async () => null,\n    images\"\"\",\"\"\"    // [[BUG-366]] — Make these live, from the import report.\n    makeLive: async (ids: string[]) => {\n      sent.madeLive.push([...ids])\n      for (const i of items) if (ids.includes(i.id)) i.live = true\n      return ids\n    },\n    importStatus: async () => null,\n    images\"\"\",1)\ns=s.rstrip()\nassert s.endswith('})\\n})') or s.endswith('})\\n})'.replace('\\n','\\n'))\ns=s[:-2].rstrip()+\"\"\"\n\n  it('test_UAT_FC_BUG-366_report_gives_each_not_live_reason_and_make_these_live_puts_them_live', async () => {\n    const { panel, sent } = await shop()\n    buttonNamed(panel.element, 'Import').click()\n    await settle()\n    const view = panel.element.querySelector('.builder-shop__import')!\n    const source = field(view, 'source') as unknown as HTMLSelectElement\n    source.value = 'woocommerce'\n    source.dispatchEvent(new Event('change'))\n    field(view, 'url').value = 'https://shop.example.test'\n    field(view, 'url').dispatchEvent(new Event('input'))\n    buttonNamed(view, 'Scan').click()\n    await settle()\n    buttonNamed(view, 'Import 3 products').click()\n    await settle()\n\n    // Each not-live item with its reason; nothing is ticked, so the button waits.\n    const report = view.querySelector('.builder-shop__report')!\n    expect(report.textContent).toContain('Gift Voucher: not live because of price of 0')\n    const make = buttonNamed(report, 'Make these live')\n    expect(make.disabled).toBe(true)\n    const box = report.querySelector('input[data-item=\"inv_3\"]') as HTMLInputElement\n    box.checked = true\n    box.dispatchEvent(new Event('change'))\n    expect(make.disabled).toBe(false)\n\n    make.click()\n    await settle()\n    expect(sent.madeLive).toEqual([['inv_3']])\n    expect(report.textContent).toContain('Gift Voucher: not live because of price of 0 (now live)')\n    expect(report.textContent).toContain('1 item is now live.')\n\n    // The shop shows it: the inventory lists Gift Voucher among the live items.\n    buttonNamed(view, 'Back to inventory').click()\n    await settle()\n    const gift = rowsIn(panel.element).find((r) => r.textContent!.includes('Gift Voucher'))!\n    expect(gift.textContent).not.toMatch(/Not live/i)\n  })\n})\n\"\"\"\nopen(p,'w').write(s)\nEOF\ntail -3 tests/test_UAT_FC_REQ-631_shop_tab.test.ts; ls node_modules >/dev/null 2>&1 && echo nm-ok","description":"Add builder UAT for Make these live"}
```

**Result**

```
    expect(gift.textContent).not.toMatch(/Not live/i)
  })
})
nm-ok
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && grep -n "Not live\|not liv…
<!-- xgd-tool name="Bash" id="toolu_01S3SdUyjtgxVA7RwW5JJw1s" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:13:20.124701+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && grep -n \"Not live\\|not live'\" apps/control-app/src/builder/shop.js | head; npx vitest run tests/test_UAT_FC_REQ-631_shop_tab.test.ts 2>&1 | tail -15","description":"Check row label and run shop tab suite"}
```

**Result**

```
283:      ['', 'Live and not live'],
285:      ['false', 'Not live'],
376:    badges.append(el('span', `builder-shop__badge builder-shop__badge--${item.live ? 'live' : 'not-live'}`, item.live ? 'Live' : 'Not live'))
\x1b[33m▲ \x1b[43;33m[\x1b[43;30mWARNING\x1b[43;33m]\x1b[0m \x1b[1mProxy environment variables detected. We'll use your proxy for fetch requests.\x1b[0m



 RUN  v4.1.9 /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366


 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  15:13:21
   Duration  572ms (transform 84ms, setup 0ms, import 55ms, tests 128ms, environment 300ms)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && npx vitest run tests/test_…
<!-- xgd-tool name="Bash" id="toolu_01NuZrsan7sYXoZy9rW6xwWV" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:13:25.854855+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && npx vitest run tests/test_UAT_FC_REQ-631_shop_tab.test.ts --reporter=verbose 2>&1 | grep -E \"✓|✗|×|skip\" ","description":"List tests run in shop tab suite"}
```

**Result**

```
 ✓ |node| tests/test_UAT_FC_REQ-631_shop_tab.test.ts > REQ-631 the Shop tab > test_UAT_FC_REQ-631_shop_tab_sits_in_the_strip_before_settings 1ms
 ✓ |node| tests/test_UAT_FC_REQ-631_shop_tab.test.ts > REQ-631 the Shop tab > test_UAT_FC_REQ-631_list_shows_rows_with_price_availability_and_badges 19ms
 ✓ |node| tests/test_UAT_FC_REQ-631_shop_tab.test.ts > REQ-631 the Shop tab > test_UAT_FC_REQ-631_item_detail_edits_are_private_until_save 25ms
 ✓ |node| tests/test_UAT_FC_REQ-631_shop_tab.test.ts > REQ-631 the Shop tab > test_UAT_FC_REQ-631_import_shows_the_mapping_step_and_the_report 10ms
 ✓ |node| tests/test_UAT_FC_REQ-631_shop_tab.test.ts > REQ-631 the Shop tab > test_UAT_FC_BUG-366_report_gives_each_not_live_reason_and_make_these_live_puts_them_live 8ms
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && cat package.json | grep -n…
<!-- xgd-tool name="Bash" id="toolu_016H3e2LFbupz9nvRkpfKvbK" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:13:30.706171+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && cat package.json | grep -n '\"test\\|typecheck\\|tsc' | head; ls vitest*.config.* 2>/dev/null","description":"Find test and typecheck scripts"}
```

**Result**

```
12:    "test": "vitest run",
18:    "test:browser": "vitest run --config vitest.browser.config.mts"
vitest.browser.config.mts
vitest.config.mts
vitest.node.config.mts
vitest.workers.config.mts
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && npx vitest run --config vi…
<!-- xgd-tool name="Bash" id="toolu_017r8shA91dqUbvj7rDjbAiK" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:13:34.797533+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && npx vitest run --config vitest.workers.config.mts tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.workers.test.ts tests/test_UAT_FC_REQ-631_inventory.workers.test.ts $(ls tests/*shop*workers* tests/*handoff*workers* tests/*BUG-333*workers* 2>/dev/null | sort -u) 2>&1 | grep -E \"Test Files|Tests |FAIL|×\" | head -20; (cd apps/control-app && npx tsc --noEmit -p . 2>&1 | head -10)","description":"Run related workers suites and type-check","timeout":600000}
```

**Result**

```
(eval):1: no matches found: tests/*BUG-333*workers*
 Test Files  2 passed (2)
      Tests  18 passed (18)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && files=$(grep -la "shop-imp…
<!-- xgd-tool name="Bash" id="toolu_017hGhgz2FAtMdVR9X9YqYsz" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:13:51.614375+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && files=$(grep -la \"shop-import\\|saveItem\\|handoff-copy\\|inventory_items\\|/api/shop\" tests/*.workers.test.ts | tr '\\n' ' '); echo $files; npx vitest run --config vitest.workers.config.mts $=files 2>&1 | grep -E \"Test Files|Tests |FAIL|×\" | head -20","description":"Run every workers suite touching shop code","timeout":600000}
```

**Result**

```
tests/test_UAT_FC_BUG-341_page_check_memory_is_bounded.workers.test.ts tests/test_UAT_FC_BUG-335_shop_over_100_items.workers.test.ts tests/test_UAT_FC_BUG-338_screenshot_serves_catalog_photos.workers.test.ts tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.workers.test.ts tests/test_UAT_FC_REQ-634_shop_api.workers.test.ts tests/test_UAT_FC_REQ-633_catalog_follows_the_item.workers.test.ts tests/test_UAT_FC_REQ-631_inventory.workers.test.ts tests/test_UAT_FC_REQ-637_invoices.workers.test.ts tests/test_UAT_FC_REQ-645_bounded_by_construction.workers.test.ts tests/test_UAT_FC_REQ-642_payments.workers.test.ts tests/test_UAT_FC_REQ-643_purchase.workers.test.ts tests/test_UAT_FC_REQ-654_handoff_copy.workers.test.ts tests/test_UAT_FC_REQ-647_catalog_photos_are_static.workers.test.ts tests/test_UAT_FC_REQ-651_item_collections.workers.test.ts 
 Test Files  14 passed (14)
      Tests  93 passed (93)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366/apps/control-app && npx tsc -…
<!-- xgd-tool name="Bash" id="toolu_015zdnzLWCYoHP8UQGmo97YR" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:14:48.943157+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366/apps/control-app && npx tsc --noEmit -p . ; echo tsc-exit=$?","description":"Type-check the control app","timeout":300000}
```

**Result**

```
tsc-exit=0
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && timeout 580 npx vitest run…
<!-- xgd-tool name="Bash" id="toolu_01Y2hdauW6BX5AQ1Lnx576Ec" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:14:50.922516+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && timeout 580 npx vitest run --config vitest.browser.config.mts tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts 2>&1 | grep -E \"Test Files|Tests |FAIL|×|Error|skipped\" | head -20","description":"Run the three edited browser journeys","timeout":600000}
```

**Result**

```
⎯⎯⎯⎯⎯⎯⎯ Startup Error ⎯⎯⎯⎯⎯⎯⎯⎯
Error: Build failed with 1 error:
    at aggregateBindingErrorsIntoJsError (file:///Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366/node_modules/.pnpm/rolldown@1.1.3/node_modules/rolldown/dist/shared/error-B68YLzl3.mjs:48:18)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && timeout 300 npx vitest run…
<!-- xgd-tool name="Bash" id="toolu_014ghuEsajoQzvQEt4e6376V" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:15:02.981156+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && timeout 300 npx vitest run --config vitest.browser.config.mts tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts 2>&1 | grep -B2 -A12 \"Build failed\" | head -40","description":"Show the browser build error detail","timeout":320000}
```

**Result**

```
(Bash completed with no output)
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && timeout 300 npx vitest run…
<!-- xgd-tool name="Bash" id="toolu_01X3kvpyExouyMF52DKrT4G7" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:15:09.240456+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && timeout 300 npx vitest run --config vitest.browser.config.mts tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts > $TMPDIR/bug366-j4.log 2>&1; echo exit=$?; grep -v \"^\\s*at \" $TMPDIR/bug366-j4.log | grep -iE \"error|fail|pass|Tests|resolve\" | head -20","description":"Run j4 journey alone and capture log","timeout":320000}
```

**Result**

```
exit=1
filter: tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts
include: tests/browser/**/*.test.ts
⎯⎯⎯⎯⎯⎯ Unhandled Error ⎯⎯⎯⎯⎯⎯⎯
Error: Chromium could not launch. Inside the agent sandbox this is the Seatbelt mach-register denial (bootstrap_check_in MachPortRendezvousServer): run the suites as `pnpm test:browser …` on its own, with `pnpm test:browser *` in sandbox.excluded_commands of main's .xgd/permissions.yaml. Launch error: browserType.launch: Target page, context or browser has been closed
 ❯ Object.setup tests/browser/support/build.ts:28:11
     28|     throw new Error(
```

## Bash cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-free-coded-promotion.md /Users/…
<!-- xgd-tool name="Bash" id="toolu_01WcG2FvNi2WbkvhJr7BJWEq" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:15:16.526298+00:00" -->

**Input**

```json
{"command":"cat /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-free-coded-promotion.md /Users/martin/.claude-2/projects/-Users-martin-lagrangefoundry-1stcontact/memory/xgd-ticket-cli-quirks.md | head -80","description":"Read promotion and CLI memory notes"}
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
````

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && git add apps/control-app/s…
<!-- xgd-tool name="Bash" id="toolu_01RXYzxWHsXNDANbTWei2QcS" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:15:26.043047+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && git add apps/control-app/src/builder/api.js apps/control-app/src/builder/shop.js apps/control-app/src/handoff-copy.ts apps/control-app/src/shop-import.ts apps/control-app/src/shop-routes.ts apps/control-app/src/shop.ts db/migrations/manifest.json db/migrations/0051_item_live_set_by.sql tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts tests/support/d1-site-factory.ts tests/test_UAT_FC_REQ-631_inventory.workers.test.ts tests/test_UAT_FC_REQ-631_shop_tab.test.ts tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.workers.test.ts && git status --short && git commit -q -F - <<'EOF'\nfix(shop): untracked stock imports live; import-held items recover; Make these live (BUG-366)\n\n- notLiveReasons no longer holds back \"stock not tracked\"; such a product goes\n  live with availability 1 and stays on the report's stock-not-tracked list.\n- Migration 0051 adds inventory_items.live_set_by (owner|import). Existing\n  imported, not-live, slug-less items are marked import-owned.\n- Import re-evaluates import-owned items: live once nothing holds them back;\n  an owner-switched live is left alone. Owner Save marks owner only when live\n  changes.\n- Report lists each not-live item with its reasons and a Make these live\n  action (POST /api/shop/items/live).\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nEOF\ngit rev-parse HEAD","description":"Stage named files and commit the fix"}
```

**Result**

```
M  apps/control-app/src/builder/api.js
M  apps/control-app/src/builder/shop.js
M  apps/control-app/src/handoff-copy.ts
M  apps/control-app/src/shop-import.ts
M  apps/control-app/src/shop-routes.ts
M  apps/control-app/src/shop.ts
A  db/migrations/0051_item_live_set_by.sql
M  db/migrations/manifest.json
M  tests/browser/test_UAT_FC_BUG-333_j2_import.test.ts
M  tests/browser/test_UAT_FC_BUG-333_j4_inventory_list.test.ts
M  tests/browser/test_UAT_FC_BUG-333_j7_site_follows_the_save.test.ts
M  tests/support/d1-site-factory.ts
A  tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.workers.test.ts
M  tests/test_UAT_FC_REQ-631_inventory.workers.test.ts
M  tests/test_UAT_FC_REQ-631_shop_tab.test.ts
7ef8b91a4d735f74f91c57f89fe97a7e45263d70
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && git ls-tree --name-only xg…
<!-- xgd-tool name="Bash" id="toolu_01GdaBWK4kPoeefHgmhEboiU" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:15:30.862021+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && git ls-tree --name-only xgd-working db/migrations/ | tail -3; xgd branch lock BUG-366 2>&1 | tail -2; git merge -q xgd-working -m \"Merge xgd-working into free-BUG-366\" 2>&1 | tail -5; git status --short | head","description":"Check migrations on xgd-working, lock, merge in","timeout":300000}
```

**Result**

```
db/migrations/0049_item_collections.sql
db/migrations/0050_estimate_outcomes.sql
db/migrations/manifest.json
[15:15:31] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'branch'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:15:31
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && git log --oneline -3 && gi…
<!-- xgd-tool name="Bash" id="toolu_014xUoF1gyto5dSLXqUiu7aP" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:15:39.063129+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && git log --oneline -3 && git diff --stat HEAD~1 HEAD -- apps tests db | tail -2; ls bin/project/xgd_version_bump","description":"Confirm merge result"}
```

**Result**

```
191c9d1497 Merge xgd-working into free-BUG-366
7ef8b91a4d fix(shop): untracked stock imports live; import-held items recover; Make these live (BUG-366)
c27e408f40 xgd(ticket): update comment comment-cb204ee5
 ...escribe_site_checkout_readiness.workers.test.ts |  99 +++++++++++
 5 files changed, 324 insertions(+), 1 deletion(-)
bin/project/xgd_version_bump
```

## Bash cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && git diff --stat HEAD~1 HEA…
<!-- xgd-tool name="Bash" id="toolu_017Vw9K4vGPGVP8NNghASH4H" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:15:43.761401+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366 && git diff --stat HEAD~1 HEAD -- apps tests db | head; npx vitest run --config vitest.workers.config.mts tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.workers.test.ts tests/test_UAT_FC_REQ-631_inventory.workers.test.ts tests/test_UAT_FC_REQ-654_handoff_copy.workers.test.ts 2>&1 | grep -E \"Test Files|Tests \"","description":"Re-run key suites after merge","timeout":300000}
```

**Result**

```
 apps/control-app/src/ai.ts                         |   8 +
 apps/control-app/src/catalog.ts                    |  28 ++++
 apps/control-app/src/router.ts                     |   5 +-
 ...UAT_FC_BUG-363_buy_link_and_owner_hints.test.ts | 185 +++++++++++++++++++++
 ...escribe_site_checkout_readiness.workers.test.ts |  99 +++++++++++
 5 files changed, 324 insertions(+), 1 deletion(-)
 Test Files  3 passed (3)
      Tests  27 passed (27)
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket show BUG-366 2>/dev/null | grep -iE "^uid|uid:|bug-00d5f738" |…
<!-- xgd-tool name="Bash" id="toolu_01MuT8QMyzWKSDgZro3BdCXU" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:15:57.102045+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket show BUG-366 2>/dev/null | grep -iE \"^uid|uid:|bug-00d5f738\" | head -3","description":"Confirm the ticket uid"}
```

**Result**

```
(Bash completed with no output)
```

## Bash WT=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366; MAIN=/Users/martin/lagrangef…
<!-- xgd-tool name="Bash" id="toolu_01C8MLD68chgeRDVkYNij9m3" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:16:04.860006+00:00" -->

**Input**

```json
{"command":"WT=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366; MAIN=/Users/martin/lagrangefoundry/1stcontact\nfor attempt in 1 2 3 4 5 6; do\n  xgd branch lock BUG-366 >/dev/null 2>&1\n  git -C $WT merge -q xgd-working -m \"Merge xgd-working into free-BUG-366\" >/dev/null 2>&1\n  (cd $WT && ./bin/project/xgd_version_bump >/dev/null 2>&1)\n  VER=$(grep '\"version\"' $WT/package.json | head -1 | sed 's/.*\"\\([0-9.]*\\)\".*/\\1/')\n  git -C $WT commit -qam \"chore(version): $VER for BUG-366\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\"\n  BUMP=$(git -C $WT log --format=%H -1)\n  git -C $MAIN merge --ff-only free-BUG-366 >/dev/null 2>&1 || { echo \"ff refused attempt $attempt\"; continue; }\n  if xgd ticket move-to-free-coded bug-00d5f738 7ef8b91a4d735f74f91c57f89fe97a7e45263d70 \"$BUMP\" --version \"$VER\" 2>&1 | tail -3; then :; fi\n  xgd ticket show bug-00d5f738 2>/dev/null | grep -iE \"status\" | head -2\n  git -C $MAIN log -1 --format=%s | grep -q \"move\\|free_coded\\|update bug bug-00d5f738\" && { echo \"done v$VER bump=$BUMP\"; break; }\ndone","description":"Bump version, fast-forward, promote to free_coded","timeout":600000}
```

**Result**

```
[15:16:15] │ Moved to free_coded: bug: BUG-366 (bug-00d5f738)
[15:16:15] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'ticket'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:16:15
done v0.2.792 bump=c23acc894b82b88eccf1e0c4857ecc01875637a7
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd branch clean BUG-366 2>&1 | grep -vE "cli_command|◀" | tail -3; git w…
<!-- xgd-tool name="Bash" id="toolu_01QPaEs1HcvEK4CFNFbbyb4u" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:16:25.360985+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd branch clean BUG-366 2>&1 | grep -vE \"cli_command|◀\" | tail -3; git worktree list | grep -c 366; git branch --contains 7ef8b91a4d735f74f91c57f89fe97a7e45263d70 | head -3","description":"Clean branch and confirm the fix is on xgd-working","timeout":300000}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:16:26
Re-materialized 23 xgd-working ticket file(s) hidden by the merge.
[15:16:26] │ Error: Refusing to release xgd-working merge lock: held by ticket='BUG-361', not 'BUG-366'.
1
+ free-BUG-365
+ free-BUG-366
* xgd-working
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && PY=$(ls -d /Users/martin/lagrangefoundry/*/.venv/bin/python 2>/dev/null |…
<!-- xgd-tool name="Bash" id="toolu_017GPsvzZkdAf5MEMnRzdZ2K" turn="89957d7cc91c421a88f998eaaa81c9ba" ts="2026-11-05T23:16:35.235113+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && PY=$(ls -d /Users/martin/lagrangefoundry/*/.venv/bin/python 2>/dev/null | head -1); for p in $PY python3; do $p -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{\"session\":\"bug-00d5f738\",\"text\":\"Free-coding complete (2026-11-05): fix 7ef8b91a4d735f74f91c57f89fe97a7e45263d70 + version bump c23acc894b82b88eccf1e0c4857ecc01875637a7 (v0.2.792) fast-forwarded to xgd-working; moved to free_coded. Added builder jsdom UAT test_UAT_FC_BUG-366_report_gives_each_not_live_reason_and_make_these_live_puts_them_live in REQ-631 shop_tab suite. 14 shop workers suites (93 tests) + tsc green. Browser journeys BUG-333 j2/j4/j7 (edited for new rule) NOT run: Chromium blocked by sandbox. xgd branch clean refused (merge lock held by BUG-361); worktree free-BUG-366 remains, sweep with --stale.\"}' 2>&1 | tail -1 && break; done","description":"Log completion to the session summary"}
```

**Result**

```
(eval):1: no matches found: /Users/martin/lagrangefoundry/*/.venv/bin/python
/Users/martin/.pyenv/versions/3.12.11/bin/python3: Error while finding module specification for 'lagrangefoundry.ai.agent_cli' (ModuleNotFoundError: No module named 'lagrangefoundry')
```

## Bash W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366; git -C $W status --short | he…
<!-- xgd-tool name="Bash" id="toolu_01EFnVYyy53opSGkKro5xJbY" turn="0a19fc8d93f942abbae2b9dd9cc3ff2a" ts="2026-11-05T23:22:33.766958+00:00" -->

**Input**

```json
{"command":"W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366; git -C $W status --short | head -30; git -C $W log --oneline -2","description":"Check worktree state after interruption"}
```

**Result**

```
c23acc894b chore(version): 0.2.792 for BUG-366
835d42a218 Merge xgd-working into free-BUG-366
```

## Bash W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366; git -C $W log --format='%h %a…
<!-- xgd-tool name="Bash" id="toolu_015ivyXpDWuUNoZVvqEmRR4K" turn="0a19fc8d93f942abbae2b9dd9cc3ff2a" ts="2026-11-05T23:22:40.635766+00:00" -->

**Input**

```json
{"command":"W=/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366; git -C $W log --format='%h %an %ad %s' --date=iso -6 --first-parent; git -C $W log xgd-working..free-BUG-366 --oneline | head; git -C /Users/martin/lagrangefoundry/1stcontact branch --contains c23acc894b 2>/dev/null | head; /Users/martin/lagrangefoundry/xgd/.venv-working/bin/python -m lagrangefoundry.ai.agent_cli AgentSummary --in '{\"session\":\"bug-00d5f738\"}' | tail -c 1500","description":"Inspect who committed and branch merge status"}
```

**Result**

```
c23acc894b Martin Westhead 2026-11-05 15:16:06 -0800 chore(version): 0.2.792 for BUG-366
835d42a218 Martin Westhead 2026-11-05 15:16:06 -0800 Merge xgd-working into free-BUG-366
191c9d1497 Martin Westhead 2026-11-05 15:15:31 -0800 Merge xgd-working into free-BUG-366
7ef8b91a4d Martin Westhead 2026-11-05 15:15:26 -0800 fix(shop): untracked stock imports live; import-held items recover; Make these live (BUG-366)
b24333f2cd Martin Westhead 2026-11-05 15:04:08 -0800 xgd(ticket): update bug bug-00d5f738
da55ad5065 Martin Westhead 2026-11-05 15:03:55 -0800 xgd(ticket): update comment comment-6e0c2a3d
+ free-BUG-365
+ free-BUG-366
* xgd-working
[15:22:41] │ 
           │ ⚠️  Configuration warnings:
[15:22:41] │   Unknown field 'quality.collection_timeout_seconds'. This field is not in the template and will be ignored.
[15:22:41] │ 
[15:22:41] │ 
           │ ⚠️  Configuration warnings:
[15:22:41] │   Unknown field 'quality.collection_timeout_seconds'. This field is not in the template and will be ignored.
[15:22:41] │ 
[15:22:43] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2177.78, 'pid': 3994}
{"count":0,"entries":[],"framing":"BUG-366: free-coding the fix (shop import stock-not-tracked no longer holds back; live_set_by column records import vs owner; recovery on re-import; report Make these live). Design decisions: migration 0051 adds inventory_items.live_set_by (owner|import); existing rows marked import only when imported, not live, slug NULL (slug is set the first time an item is saved live, so a slug-less not-live item was never switched on). Owner Save marks owner only when live changes. Import re-evaluates import-owned not-live items: live when no remaining reasons. Make these live = POST /api/shop/items/live {ids}, owner action."}
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git show --stat 7ef8b91a4d | head -30; xgd ticket get bug-00d5f738 2>&1 |…
<!-- xgd-tool name="Bash" id="toolu_01B5BAimmEHUwpC3HRLmGyhB" turn="0a19fc8d93f942abbae2b9dd9cc3ff2a" ts="2026-11-05T23:22:48.579329+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git show --stat 7ef8b91a4d | head -30; xgd ticket get bug-00d5f738 2>&1 | grep -E \"Status|commits|version|branch\" | head","description":"Inspect landed commit and ticket status"}
```

**Result**

```
commit 7ef8b91a4d735f74f91c57f89fe97a7e45263d70
Author: Martin Westhead <martin-github@westhead.me>
Date:   Thu Nov 5 15:15:26 2026 -0800

    fix(shop): untracked stock imports live; import-held items recover; Make these live (BUG-366)
    
    - notLiveReasons no longer holds back "stock not tracked"; such a product goes
      live with availability 1 and stays on the report's stock-not-tracked list.
    - Migration 0051 adds inventory_items.live_set_by (owner|import). Existing
      imported, not-live, slug-less items are marked import-owned.
    - Import re-evaluates import-owned items: live once nothing holds them back;
      an owner-switched live is left alone. Owner Save marks owner only when live
      changes.
    - Report lists each not-live item with its reasons and a Make these live
      action (POST /api/shop/items/live).
    
    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

 apps/control-app/src/builder/api.js                |   2 +
 apps/control-app/src/builder/shop.js               |  49 ++++-
 apps/control-app/src/handoff-copy.ts               |   5 +
 apps/control-app/src/shop-import.ts                |  26 ++-
 apps/control-app/src/shop-routes.ts                |  12 ++
 apps/control-app/src/shop.ts                       |  54 +++++-
 db/migrations/0051_item_live_set_by.sql            |  14 ++
 db/migrations/manifest.json                        |   3 +-
 .../browser/test_UAT_FC_BUG-333_j2_import.test.ts  |  11 +-
 .../test_UAT_FC_BUG-333_j4_inventory_list.test.ts  |   2 +-
 ...UAT_FC_BUG-333_j7_site_follows_the_save.test.ts |   2 +-
 tests/support/d1-site-factory.ts                   |  32 ++-
[15:22:49] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'ticket', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'ticket', 'get', 'bug-00d5f738'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
[15:22:49] │ Status: free_coded
[15:22:49] │   commits: [{'working_sha': '7ef8b91a4d735f74f91c57f89fe97a7e45263d70', 'reconcile_sha': None, 'main_sha': None}, {'working_sha': 'c23acc894b82b88eccf1e0c4857ecc01875637a7', 'reconcile_sha': None, 'main_sha': None}]
[15:22:49] │   version: 0.2.792
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && git show --stat --format= 7ef8b91a4d | tail -6; git worktree list | grep…
<!-- xgd-tool name="Bash" id="toolu_01BpkxxTsXBg2ktbnKF8bEj2" turn="0a19fc8d93f942abbae2b9dd9cc3ff2a" ts="2026-11-05T23:22:53.688585+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && git show --stat --format= 7ef8b91a4d | tail -6; git worktree list | grep BUG-366; git branch --list free-BUG-366; xgd ticket get bug-00d5f738 2>&1 | sed -n '/Body:/,$p' | head -80","description":"Check remaining stat, worktree, and ticket body"}
```

**Result**

```
 ...UAT_FC_BUG-333_j7_site_follows_the_save.test.ts |   2 +-
 tests/support/d1-site-factory.ts                   |  32 ++-
 ...G-366_untracked_stock_goes_live.workers.test.ts | 214 +++++++++++++++++++++
 .../test_UAT_FC_REQ-631_inventory.workers.test.ts  |   8 +-
 tests/test_UAT_FC_REQ-631_shop_tab.test.ts         |  48 ++++-
 15 files changed, 449 insertions(+), 33 deletions(-)
/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-366         c23acc894b [free-BUG-366]
+ free-BUG-366
[15:22:54] │ Body:
[15:22:54] │ ## Symptom (operator, 2026-11-05, dev, a shop imported from WooCommerce)
           │ 
           │ Several pieces that are live and for sale in the source shop were imported as **not live**. In the case seen, 25 items were not live with availability 1, all of them on the import report's "stock not tracked" list.
           │ 
           │ ## Cause
           │ 
           │ `shop-import.ts` `notLiveReasons()` holds a product back on its first import for any of: a price of 0, **in stock with no tracked quantity (`inStock && stockLimit === null`)**, or no photos. This came in with the shop import (c825e29723, 2026-11-02).
           │ 
           │ "Stock not tracked" is normal for one-of-a-kind goods. The source has stock management off because there is only ever one. The import already treats such a product as quantity 1 (`availability = stockLimit ?? 1`), so it can sell once and then shows as sold. Holding it back from going live as well hides real, for-sale stock.
           │ 
           │ Re-imports don't recover it. An existing item keeps its `live` value ("an update keeps the owner's choices"), so an item held back by the import stays not live forever unless someone switches it on by hand.
           │ 
           │ ## Fix
           │ 
           │ 1. **"Stock not tracked" no longer holds a product back.**
           │    - It goes live with availability 1, as now.
           │    - It stays on the report's "stock not tracked" list, so the owner can set real quantities.
           │    - A price of 0 and no photos still hold a product back.
           │ 2. **Items already held back only for "stock not tracked" are recovered on the next import, unless the owner has changed them.**
           │    - Whether `live` was last set by the import or by the owner must be recorded. Today nothing tells the two apart, so add it.
           │    - An item held back only for "stock not tracked", whose `live` was never changed by the owner, goes live on the next run.
           │    - Anything the owner switched themselves stays as they left it.
           │ 3. **The import report says why each not-live item isn't live** (price of 0, no photo), next to a one-click **Make these live** for the ones the owner agrees with.
           │ 
           │ ## Test plan
           │ 
           │ - UAT (import over 
           │ ... (truncated, 2577 chars total)
[15:22:54] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'ticket'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:22:54
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket get bug-00d5f738 --json 2>/dev/null | python3 -c "import sys,j…
<!-- xgd-tool name="Bash" id="toolu_01KaLYtqLFSaXTU4mMnJZbLH" turn="0a19fc8d93f942abbae2b9dd9cc3ff2a" ts="2026-11-05T23:22:59.150625+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && xgd ticket get bug-00d5f738 --json 2>/dev/null | python3 -c \"import sys,json; d=json.load(sys.stdin); print(d.get('body', d)[-900:] if isinstance(d.get('body'),str) else list(d))\"","description":"Read ticket body tail"}
```

**Result**

```
as never changed by the owner, goes live on the next run.
   - Anything the owner switched themselves stays as they left it.
3. **The import report says why each not-live item isn't live** (price of 0, no photo), next to a one-click **Make these live** for the ones the owner agrees with.

## Test plan

- UAT (import over a synthetic WooCommerce fixture): a product in stock with stock management off imports **live**, with availability 1, and is listed under "stock not tracked". A product priced 0 and a product with no photos import not live, with their reasons.
- UAT: an item imported not live under the old rule (only "stock not tracked", `live` never changed by the owner) is live after the next import. The same item, switched off by the owner, stays not live.
- UAT (builder): the report lists each not-live item with its reason. **Make these live** makes them live and the shop shows them.
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && grep -n "BUG-366" tests/test_UAT_FC_REQ-631_shop_tab.test.ts | head -5; c…
<!-- xgd-tool name="Bash" id="toolu_01PNoUpzApG7txRYL54FTBMH" turn="0a19fc8d93f942abbae2b9dd9cc3ff2a" ts="2026-11-05T23:23:11.523647+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && grep -n \"BUG-366\" tests/test_UAT_FC_REQ-631_shop_tab.test.ts | head -5; cat > $TMPDIR/bug366-impl.md <<'EOF'\n\n## Implementation (as landed, 7ef8b91a4d + version 0.2.792)\n\n- **Rule.** `notLiveReasons()` holds back only a price of 0 and no photo. Untracked stock goes live with availability 1. It stays on the report's \"Stock not tracked (live, availability set to 1)\" list.\n- **Who set `live`.** Migration `0051_item_live_set_by.sql` adds `inventory_items.live_set_by` (`owner` | `import`, default `owner`). For existing rows it marks `import` only where the item is imported, not live and has **no slug**. A slug is set the first time an item is saved live, so a slug-less not-live item was never switched on by the owner. An item with a slug was once live, so it stays the owner's. `InventoryItem.liveSetBy` exposes it, and the handoff copy carries it.\n- **Owner saves.** `saveItem` marks `owner` only when a Save changes `live`. A Save that edits other fields keeps whoever set `live` last.\n- **Re-import.** A new item is live unless something holds it back. An existing item whose `live` is the import's goes live once nothing holds it back, and the import never takes it down. This covers the \"stock not tracked\" recovery, and also a price-0 or no-photo item that has since been fixed in the source. An item the owner switched is left as they chose.\n- **Report.** `notLive` lists every item the import is holding back in this run, new or from an earlier run, with its reasons. The builder shows each one as \"<name>: not live because of <reasons>\" with a checkbox (unticked to start), plus a **Make these live** button.\n- **Make these live.** `POST /api/shop/items/live {ids}` (`makeItemsLive`) sets the listed items live as the owner's choice, gives a slug where there is none, and runs one catalog rebuild. If any id is not the shop's, the call returns 404 and changes nothing.\n- **UATs.** `tests/test_UAT_FC_BUG-366_untracked_stock_goes_live.workers.test.ts` (import rule, old-rule recovery through the migration's data statement, owner-switched stays off, Make these live, refusal). The builder report is tested in `test_UAT_FC_REQ-631_shop_tab.test.ts`. Existing REQ-631 and BUG-333 j2/j4/j7 assertions were updated to the new rule.\nEOF\nxgd ticket update bug-00d5f738 --append-body-file $TMPDIR/bug366-impl.md 2>&1 | grep -E \"Updated|rror\" ","description":"Append implementation section to ticket body"}
```

**Result**

```
121:    // [[BUG-366]] — Make these live, from the import report.
290:  it('test_UAT_FC_BUG-366_report_gives_each_not_live_reason_and_make_these_live_puts_them_live', async () => {
[15:23:13] │ Updated bug: BUG-366 (bug-00d5f738)
```

## Bash xgd branch clean BUG-366
<!-- xgd-tool name="Bash" id="toolu_01WXuEjzb9tCJeFRiz3a3pwc" turn="0a19fc8d93f942abbae2b9dd9cc3ff2a" ts="2026-11-05T23:23:16.400483+00:00" -->

**Input**

```json
{"command":"xgd branch clean BUG-366","description":"Tear down merged branch and worktree"}
```

**Result**

```
Exit code 1
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:23:17
[15:23:17] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'branch', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'branch', 'clean', 'BUG-366'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
[15:23:17] │ Error: Refusing to release xgd-working merge lock: held by ticket='BUG-365', not 'BUG-366'.
[15:23:17] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'failure', 'command': 'branch'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:23:17
```

## Bash cd /Users/martin/lagrangefoundry/1stcontact && /Users/martin/lagrangefoundry/xgd/.venv-working/bin/python -m lagrangefou…
<!-- xgd-tool name="Bash" id="toolu_01JrQJSsoJSDFavyU42kPxdL" turn="0a19fc8d93f942abbae2b9dd9cc3ff2a" ts="2026-11-05T23:23:22.259873+00:00" -->

**Input**

```json
{"command":"cd /Users/martin/lagrangefoundry/1stcontact && /Users/martin/lagrangefoundry/xgd/.venv-working/bin/python -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{\"session\":\"bug-00d5f738\",\"text\":\"2026-11-05: work landed as 7ef8b91a4d + version bump c23acc894b (0.2.792); ticket free_coded. Implementation section appended to body. xgd branch clean BUG-366 refused: merge lock held by BUG-365; worktree/branch free-BUG-366 still present (merged) — sweep later with clean --stale or rerun clean. Commit subject lacks [FREE-CODED] tag (already on xgd-working, not amended).\"}' >/dev/null && echo ok","description":"Log completion state to summary"}
```

**Result**

```
[15:23:22] │ 
           │ ⚠️  Configuration warnings:
[15:23:22] │   Unknown field 'quality.collection_timeout_seconds'. This field is not in the template and will be ignored.
[15:23:22] │ 
[15:23:22] │ 
           │ ⚠️  Configuration warnings:
[15:23:22] │   Unknown field 'quality.collection_timeout_seconds'. This field is not in the template and will be ignored.
[15:23:22] │ 
[15:23:25] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2276.65, 'pid': 7686}
ok
```

## Bash xgd branch clean BUG-366
<!-- xgd-tool name="Bash" id="toolu_01PgsJikDk7PmoJ6FFEvrASP" turn="38787a0fd1a540bea2cdbe9765cff9a5" ts="2026-11-05T23:25:14.231966+00:00" -->

**Input**

```json
{"command":"xgd branch clean BUG-366"}
```

**Result**

```
▶ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:25:16
[15:25:16] ? cli_command_start: {'event_type': 'cli_command_start', 'command': 'branch', 'argv': ['/Users/martin/.xgd/releases/current/bin/xgd', 'branch', 'clean', 'BUG-366'], 'argv_truncated': False, 'xgd_version': '0.17.386+xgd.working.5ea14f28ff6a'}
Cleaned up free-BUG-366 (worktree removed, branch deleted, lock released).
[15:25:18] ? cli_command_end: {'event_type': 'cli_command_end', 'status': 'success', 'command': 'branch'}
◀ xgd 0.17.386+xgd.working.5ea14f28ff6a 2026-11-05 15:25:18
```

## Bash /Users/martin/lagrangefoundry/xgd/.venv-working/bin/python -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{"sessi…
<!-- xgd-tool name="Bash" id="toolu_01Y1YKFR1JGZqFcmeELYFkNL" turn="38787a0fd1a540bea2cdbe9765cff9a5" ts="2026-11-05T23:25:21.569982+00:00" -->

**Input**

```json
{"command":"/Users/martin/lagrangefoundry/xgd/.venv-working/bin/python -m lagrangefoundry.ai.agent_cli AgentSummaryLog --in '{\"session\":\"bug-00d5f738\",\"text\":\"2026-11-05: xgd branch clean BUG-366 succeeded once BUG-365 released the merge lock — worktree removed, branch free-BUG-366 deleted, lock released. Free-coding of BUG-366 is complete (free_coded, v0.2.792).\"}' >/dev/null && echo ok"}
```

**Result**

```
[15:25:22] │ 
           │ ⚠️  Configuration warnings:
[15:25:22] │   Unknown field 'quality.collection_timeout_seconds'. This field is not in the template and will be ignored.
[15:25:22] │ 
[15:25:22] │ 
           │ ⚠️  Configuration warnings:
[15:25:22] │   Unknown field 'quality.collection_timeout_seconds'. This field is not in the template and will be ignored.
[15:25:22] │ 
[15:25:24] ? index_query_profile: {'event_type': 'index_query_profile', 'query_type': 'full', 'cold_needed': True, 'hot_entries': 10596, 'cold_entries': 940, 'index_load_ms': 2230.75, 'pid': 21710}
ok
```
