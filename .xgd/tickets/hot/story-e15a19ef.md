---
uid: story-e15a19ef
id: STORY-79
type: story
title: '1c CLI: flags parse correctly, propagate into sub-commands, and --json emits
  a clean scriptable document'
created_by: xgd
created_at: '2026-07-19T03:01:20.536179+00:00'
updated_at: '2026-08-20T04:13:38.841306+00:00'
completed_at: null
last_field_updated: body
status: updated
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-aa030c83
  story_kind: upgrade
  story_points: 2
  updated_by:
  - bundle-31e474b9
  - bundle-cceaba25
  - bundle-15c1f647
  uat_coverage: fail
---

## Story
**As a** user scripting the `1c` CLI, **I want** flags to be parsed correctly, to
propagate into the commands a sub-command drives, `--json` output to be a single
clean JSON document, every command to boot quietly, and a command that needs a
declared runtime dependency to refuse loudly on an installed tree that does not
match what is declared, **so that** I can invoke `1c` commands in any flag order,
trust that a store-selecting flag reaches the render/serve it triggers, pipe
machine-readable output straight into other tools without it breaking or being
buried in setup noise, and get a named remedy instead of a stack trace from deep
inside a browser launch.

## Description
Five CLI-correctness guarantees for the `1c` command line:

1. **Boolean flag parsing — for the flag set as a whole, not one flag.** A flag
   the CLI reads as a boolean toggle must parse as boolean: it takes no value and
   does not consume the token that follows it. The parser decides this ahead of
   the command switch, from a single registry of boolean flag names, so the
   guarantee holds for whichever verb was named rather than per command.

   The fault it closes is one signature repeated across the verb set. A boolean
   flag the registry does not know is parsed as value-taking, so it swallows the
   next non-`--` token; every one of these commands then takes its `<slug>` from
   the first positional, so the slug is gone and the command dies with
   `Missing required <slug>`. `values-diff --multi-viewport <slug>` is the
   originally-reported instance (REQ-58), and `values-diff --collapse <slug>`,
   `deploy --prune <slug>`, `render --edit <slug>`, `adopt-gaps --apply <slug>`
   and `colors --assign <slug>` are the same fault reached through a different
   verb.

   So the registry is asserted **entire** in evidence, not sampled — and the set
   it is asserted against is **derived from the CLI source** rather than restated
   as a literal. Every flag name the CLI reads in a boolean context must be
   registered, and each registered member is proved to preserve `<slug>` as a
   positional whether the flag precedes or follows it. Deriving the set is what
   makes the guarantee bite on the failure that actually occurs: a boolean flag
   added to a verb and never registered. A set pinned only to itself goes red
   when the registry is edited and stays green in exactly that case — which is
   how six flags drifted behind the CLI, and how `--assign` then survived a sweep
   that recognised only the `flags.x === true` read form. The derivation counts
   every truthiness form (`=== true`, a bare `if`, negation, `Boolean(...)`,
   short-circuit, ternary condition), so an unregistered boolean fails a test
   rather than a user's invocation — the same discipline guarantee 5 applies to
   its gated command set.

2. **`--json` output hygiene and a quiet bootstrap.** A `values-diff` command run
   with `--json` prints exactly one well-formed JSON document to stdout. The
   in-process Astro/Vite render emits diagnostics — dependency re-optimization
   notices and deprecation warnings — that previously landed on stdout and
   corrupted the JSON; those are routed to stderr for both human and JSON modes,
   so stdout carries only the command's own output. Stdout is restored after the
   command runs, including when the command's computation fails, so it is never
   left permanently diverted.

   The bootstrap's "Missing pages directory" warning is handled one level
   stronger: it is **not emitted at all**, on either stream, by any command —
   including the commands that never render (`help`, `list`, `repro`, `l1-gate`,
   `capture`, `values-diff`). Diverting it to stderr had only moved the noise;
   it is now suppressed where it originates, while genuine bootstrap errors
   still surface and a failed boot still exits non-zero. The stdout→stderr
   diversion of any remaining setup chatter stays in place as defence in depth.

3. **Store-selecting flags propagate into sub-commands.** A command that itself
   drives a render and a serve must forward the store-selection flags it received
   to those sub-commands. `aligned-crops --sandbox` renders and serves the
   sandbox reproduction (from the sandbox store) and emits its crop pairs from it,
   instead of silently rendering/serving from the `sites/` tree — which, for a
   sandbox reproduction, would diff an absent or stale site against the reference
   and produce no valid crops. The source selection (`draft`/`published`, default
   `draft`) and the working directory are forwarded alongside `--sandbox`; with no
   `--sandbox` flag the command falls through to the `sites/` tree.

4. **The render path is Astro-free unless a page needs Astro.** The Astro
   container is constructed only when the site actually has a page carrying
   behavior modules. A site whose pages are all L1 reproductions — and the empty
   starter — renders its expected HTML with no container constructed and no
   module hooks in the markup. A site with at least one behavior-module page
   creates the container on demand and renders identically to before: module
   markup, theme CSS, and client script all present.

5. **A gated command refuses before doing any work on a mismatched install.**
   Declaring a dependency does not materialize it: `package.json` plus
   `pnpm-lock.yaml` say what *should* be on disk, and only an install puts it
   there. A command that loads a declared runtime dependency therefore probes the
   installed tree first, and refuses rather than dying deep inside a browser
   launch with `Cannot find module 'playwright'`.

   Two independent checks run, and **both** are reported in one refusal rather
   than one at a time:

   - **resolution** — every package the command actually loads resolves from
     disk. This is the pruned-declared-package case directly.
   - **drift** — the committed `pnpm-lock.yaml` still matches the copy the
     package manager writes verbatim at install time. Byte-inequality is an
     exact statement that the tree was never installed at the committed
     lockfile — an oracle, not an mtime heuristic. A tree with no such copy at
     all has never been installed and counts as drift; a project with no
     committed lockfile is a different project shape and is not drift.

   Drift fails **on its own**, even while every dependency still happens to
   resolve, because that is precisely the state the next prune turns into the
   crash.

   Gating is per command, on exactly what that command loads: the
   browser-driving verbs (`capture`, `shot`, `values-diff`, `adopt-gaps`), the
   imaging verb (`crop`), and the verbs needing both (`diff`, `gate`,
   `aligned-crops`). The offline verbs — `render`, `serve`, `builder`, `repro`,
   `refold`, `l1-gate`, `responsive-diff` and the structured-edit commands — are
   never gated, so a verb is never blocked by a dependency it does not use.

   The refusal travels the CLI's existing failure contract (guarantee: REQ-11's
   structured failures): an `ENVIRONMENT` code with its own exit status,
   distinct from the internal-error status because neither the command nor its
   input was wrong; the standard `{"ok":false,"error":{code,message,hint}}`
   envelope under `--json`; a message naming which check failed and which
   packages; and a hint that is the literal install command to run.

In scope: argument-parsing correctness for the boolean flag set as a whole,
propagation of store-selecting flags into the render/serve a sub-command triggers,
stdout/stderr separation and bootstrap quiet for scriptable output, whether the
render path engages Astro at all, and the pre-command check that the installed
tree matches the declared dependencies. Out of scope: the content/shape of the
diff or crop artifacts themselves, and the *meaning* of any individual verb —
what a flag makes a command decide belongs to the capability owning that verb,
while the guarantee that the flag parses at all belongs here (see the capability's
CLI ownership rule); the L1 reproduction pipeline whose output the Astro-free
render path serves (covered by the L1 substrate, fold, and reproduction-gate
capabilities); and *performing* an install — the preflight reports and names the
remedy, it never runs it.

## Technical Context
- Guarantees 1–2 reconciled from bundle-ab9e0cb6 (REQ-58 pass-3), plan item 5,
  commits 4f681c73 (boolean flag) and a4323720 (--json stdout hygiene).
- Guarantee 1 is implemented once, as the `BOOLEAN_FLAGS` registry in
  `tools/generate/src/cli/args.ts`, consulted by `parseArgs` before the command
  switch. REQ-58 reported it through `--multi-viewport`, but the registry is the
  guarantee's whole surface: an unregistered name falls to the value-taking
  branch and eats the following token. Drift has been found twice — first six
  flags (`collapse`, `clusters`, `edit`, `dry-run`, `prune`, `apply`), then
  `--assign`, which `tools/generate/src/cli/index.ts` reads as a bare
  `if (flags.assign)` and which a `flags.x === true` sweep therefore missed while
  the set was believed complete. The story asserts the *discipline*, not a
  point-in-time count: evidence derives the boolean reads from the CLI source
  over every truthiness form and asserts that derived set equals the registry,
  with per-member coverage in both flag orders. Completeness is therefore a
  standing test result rather than a claim in this body.
- Guarantee 3 reconciled from bundle-31e474b9 (BUNDLE-7), plan item 9, commit
  09fa7cf5. `aligned-crops` previously rendered and served from `sites/` even
  under `--sandbox`; the store tree (`sandbox` + `cwd`) plus `source` is now
  forwarded to both the render and the serve it triggers, so a sandbox
  reproduction is rendered/served from `sandbox/` and the perceptual crops run
  on it. Verified: `1c aligned-crops joyfulculinary --sandbox` emits 7 crop pairs.
- Guarantee 2's bootstrap clause and guarantee 4 reconciled from
  bundle-cceaba25 (BUNDLE-8), plan item 4, commit 5dc46d0f (REQ-89).
  The warning originates in the launcher's Astro-backed Vite bootstrap, which
  scans the working root for a pages directory before any CLI code loads — so no
  amount of lazy importing inside the CLI could silence it. The log level passed
  to the Vite config gates Vite's logger, not Astro's; passing it as the inline
  *Astro* config gates the logger that actually emits the warning. That is why
  the earlier stdout→stderr diversion (guarantee 2) never removed it: the
  diversion was the right guard for the wrong emitter.
- REQ-89's originally-proposed fix — making the module registry lazy and
  `getModule` async — was investigated and deliberately **not** implemented: it
  does not silence the launcher-side warning and would churn the conformance and
  render suites for no acceptance benefit. The matrix documents the launcher
  logger + conditional container that shipped, not the abandoned proposal.
- Diagnostic handling now happens at three levels: render-time chatter during a
  command (routed to stderr), residual bootstrap chatter (diverted at setup),
  and the specific pages-directory warning (suppressed at its source).
- Guarantee 5 reconciled from bundle-15c1f647 (BUNDLE-16), plan item 6 (REQ-44).
  Triggered by an observed failure: a workflow commit added a dependency to the
  manifests, no install followed, a later prune removed `playwright` — a
  *declared* package — and `1c shot` / `1c diff` / `1c capture` all died with
  `Cannot find module 'playwright'`. A manual install fixed it and changed no
  tracked file, confirming the manifests were right all along and only the
  on-disk tree was stale.
- The check is placed at dispatch, ahead of the command switch, rather than
  inside each handler: the fault is about the workspace and not the verb, so one
  gate covers every present and future command through the per-command
  dependency map, and no half-done work (a render, a launched browser, a written
  file) can precede the refusal.
- Both checks are pure functions of a root directory and a resolver, so they are
  provable against synthetic trees without mutating a real install; one check
  against this repo's real tree with real resolution keeps the synthetic seams
  honest about being pointed at the right files.
- The gated set is pinned as a whole in evidence, so adding a browser-driving
  command without gating it is a visible regression rather than a silent
  reopening of the hole. Guarantees 1 and 5 now share that discipline: both are
  dispatch-level registries whose evidence is only meaningful asserted entire.
- **Deliberately out of this repo (intent split by REQ-44 itself).** The
  "re-install after a commit changes a dependency manifest" rule belongs to the
  workflow engine and is filed as REQ-745 (`lagrangefoundry/xgd`) with its
  plugin-contract half as REQ-22 (`lagrangefoundry/xgd-plugin-sdk`). The
  preflight here is defence in depth: it catches a stale tree whatever caused it
  — a workflow commit, a plain pull, an interrupted install.
- **Known blind spot, recorded by intent, not fixed here.** Worktree installs run
  with install scripts skipped, so a package directory can exist while its native
  binary or downloaded browser does not. The module still resolves, so the
  resolution check cannot see it; that decision is carried by REQ-22.
- Belongs to capability CAP-63 (`capability-aa030c83`, `1c_capture_diff_fidelity`),
  which owns CLI *mechanism* for the whole verb set. Related: the capture and
  diff verbs whose output this hygiene protects and which guarantee 5 gates, the
  aligned-crops perceptual pipeline whose store routing guarantee 3 protects, and
  the L1 substrate/fold/gate capabilities that produce the L1-only pages
  guarantee 4 lets render without Astro.

## Dependencies
None.

## Story Points
2