---
uid: story-e15a19ef
id: STORY-79
type: story
title: '1c CLI: flags parse correctly, propagate into sub-commands, and --json emits
  a clean scriptable document'
created_by: xgd
created_at: '2026-07-19T03:01:20.536179+00:00'
updated_at: '2026-08-31T11:17:25.192176+00:00'
completed_at: null
last_field_updated: story_kind
status: updated
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-aa030c83
  story_kind: upgrade
  story_points: 2
  updated_by: bundle-15c1f647
  uat_coverage: fail
---

## Story
**As a** user scripting the `1c` CLI, **I want** flags to be parsed correctly, to
propagate into the commands a sub-command drives, `--json` output to be a single
clean JSON document, every command to boot quietly on a server the launcher
configures itself, the render path to reach no build transform at all, and a
command that needs a declared runtime dependency to refuse loudly on an installed
tree that does not match what is declared, **so that** I can invoke `1c` commands
in any flag order, trust that a store-selecting flag reaches the render/serve it
triggers, pipe machine-readable output straight into other tools without it
breaking or being buried in setup noise, run the same render in a runtime that
has no build transform, and get a named remedy instead of a stack trace from deep
inside a browser launch.

## Description
Six CLI-correctness guarantees for the `1c` command line:

1. **Boolean flag parsing.** The `--multi-viewport` flag is a boolean toggle, not
   a value-taking option. Invoking `values-diff --multi-viewport <slug>` (or
   `values-diff <slug> --multi-viewport`) preserves `<slug>` as a positional in
   either order, instead of the flag consuming `<slug>` as its value and failing
   with a missing-slug error.

2. **`--json` output hygiene and a quiet bootstrap.** A `values-diff` command run
   with `--json` prints exactly one well-formed JSON document to stdout. Render
   diagnostics emitted while a command runs — dependency re-optimization notices
   and deprecation warnings — are routed to stderr in both human and JSON modes,
   so stdout carries only the command's own output. Stdout is restored after the
   command runs, including when the command's computation fails, so it is never
   left permanently diverted.

   The bootstrap is quiet about **any** chatter, not one framework's. A
   non-rendering command exits 0 with its own output on stdout and **nothing at
   all** on stderr: no server notices, no `[WARN]` line, no "Missing pages
   directory". That warning is gone at its source — the plugin that scanned the
   working root for a pages directory left the repository with guarantee 4 — and
   the stdout→stderr diversion across the whole of the server's startup is kept as
   defence in depth against whatever a future server or plugin decides to say
   while booting. It is a claim about the observable streams, not about the
   absence of the guard, so the guard stays and its justification is no longer
   tied to one emitter. Genuine bootstrap errors still surface and a failed boot
   still exits non-zero.

3. **Store-selecting flags propagate into sub-commands.** A command that itself
   drives a render and a serve must forward the store-selection flags it received
   to those sub-commands. `aligned-crops --sandbox` renders and serves the
   sandbox reproduction (from the sandbox store) and emits its crop pairs from it,
   instead of silently rendering/serving from the `sites/` tree — which, for a
   sandbox reproduction, would diff an absent or stale site against the reference
   and produce no valid crops. The source selection (`draft`/`published`, default
   `draft`) and the working directory are forwarded alongside `--sandbox`; with no
   `--sandbox` flag the command falls through to the `sites/` tree.

4. **The launcher boots a plain bundler SSR server, and the build framework has
   left the repository.** `1c` is TypeScript, so every command boots through a
   Vite SSR server before any CLI code loads. That server is now configured by the
   launcher and by nothing else:

   - The config is taken from the launcher alone — the root is never searched for
     a `vite.config.*` — so the launcher's behaviour cannot depend on a config
     file that exists for some other purpose entirely.
   - The bundler is a declared runtime dependency of the package whose `bin` the
     launcher is, and is imported by name. It used to arrive transitively and had
     to be located by walking into another package's module graph; that hop is
     gone with the package it walked into.
   - Astro is absent from every `package.json` in the workspace, from the
     lockfile's importers, and from every source file — and genuinely off disk,
     not merely undeclared: `astro/container` does not resolve. The two
     dependencies that must survive the removal do: `@astrojs/markdown-remark`, a
     separately published markdown processor the framework renders callouts with
     and not the framework itself, and the bundler now named directly.
   - `1c assets` — the one command whose output everything else imports — still
     bootstraps on a fresh checkout by loading only the module it needs, never the
     CLI barrel. The barrel reaches the builder transport, which reaches the
     Worker's router and its chrome document, which imports the very import map
     `assets` generates; that map is not committed, so on a fresh tree the barrel
     cannot load at all and `assets` could never run to fix it.

   Everything the old bootstrap carried because of the framework goes with it: the
   inline framework config that existed solely to gate that framework's logger, and
   the "Missing pages directory" warning it existed to suppress.

5. **The render path names no build-transform specifier at all.** This used to be
   conditional — the container was constructed only when a page carried behavior
   modules — and was measured by observing one render. Both halves changed. No
   page needs the transform any more, because a behavior module is a plain typed
   function of its props; and the dependency is gone, so there is no container
   factory left to observe. The guarantee is therefore stated and measured
   unconditionally: no source file reachable from any render names a
   build-transform specifier, statically or dynamically, and no such module
   resolves from disk.

   This is **strictly stronger** than the observation it replaces — that proved
   "no container for *this* render", this proves "no container is reachable from
   *any* render" — so the guarantee survives the rewrite rather than being
   weakened by it. The render outputs are unchanged: a site whose pages are all L1
   reproductions, and the empty starter, render their expected HTML with no module
   hooks in the markup; a site with at least one behavior-module page renders its
   module markup, its folded theme CSS and its client script exactly as before.

6. **A gated command refuses before doing any work on a mismatched install.**
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

In scope: argument-parsing correctness for boolean flags, propagation of
store-selecting flags into the render/serve a sub-command triggers, stdout/stderr
separation and bootstrap quiet for scriptable output, how the launcher configures
the server every command boots through and which build-transform dependency the
repository carries, whether any render can reach a build transform at all, and the
pre-command check that the installed tree matches the declared dependencies. Out
of scope: the content/shape of the diff or crop artifacts themselves (covered by
the values-diff, size-aware diff, and aligned-crops capabilities), the behavior
module contract and the conversion of the modules themselves into plain functions
(covered by the behavior-module capability), the L1 reproduction pipeline whose
output the transform-free render path serves (covered by the L1 substrate, fold,
and reproduction-gate capabilities), and *performing* an install — the preflight
reports and names the remedy, it never runs it.

## Technical Context
- Guarantees 1–2 reconciled from bundle-ab9e0cb6 (REQ-58 pass-3), plan item 5,
  commits 4f681c73 (boolean flag) and a4323720 (--json stdout hygiene).
- Guarantee 3 reconciled from bundle-31e474b9 (BUNDLE-7), plan item 9, commit
  09fa7cf5. `aligned-crops` previously rendered and served from `sites/` even
  under `--sandbox`; the store tree (`sandbox` + `cwd`) plus `source` is now
  forwarded to both the render and the serve it triggers, so a sandbox
  reproduction is rendered/served from `sandbox/` and the perceptual crops run
  on it. Verified: `1c aligned-crops joyfulculinary --sandbox` emits 7 crop pairs.
- Guarantee 2's bootstrap clause and guarantee 5 were first reconciled from
  bundle-cceaba25 (BUNDLE-8), plan item 4, commit 5dc46d0f (REQ-89): the launcher
  gated Astro's logger with an inline Astro config, and the render path built the
  container only for module-carrying pages. Both were superseded by bundle-b3b7c399
  (BUNDLE-20) and are recorded below in their current form.
- REQ-89's originally-proposed fix — making the module registry lazy and
  `getModule` async — was investigated and deliberately **not** implemented: it
  does not silence the launcher-side warning and would churn the conformance and
  render suites for no acceptance benefit.
- Guarantees 4 and 5 reconciled from bundle-b3b7c399 (BUNDLE-20), plan item 6
  (REQ-150), commits `258381e2d` (the launcher and the dependency removal) and
  `aa64b3e15` (the last Astro site). The launcher takes `createServer` from `vite`
  directly with `configFile: false`; `vite` moves from a transitive arrival
  through `astro` to a declared `dependencies` entry of `tools/generate`, whose
  `bin` the launcher is and which imports it at run time. No root `vite` entry was
  needed: both Vitest configs take `defineConfig` from `vitest/config` and Vitest
  carries its own.
- The uninstall was not confined to the bootstrap. Four other sites resolved
  `astro` after the launcher rewrite and were converted with it: the node Vitest
  project config (was `getViteConfig`, now a plain `defineConfig`), the two
  container-spy suites, the project-routing UAT that asserted the config *named*
  `astro/config`, the `astro/client` ambient type entries in two tsconfigs, and
  the `@astrojs/compiler-*` build-approval entries in the workspace file. The
  operator chose the full-removal reading and authorised the reconciliation-UAT
  rewrite it required.
- **Why the container spies were replaced rather than deleted.** The container
  factory cannot be spied on once the package is uninstalled, so guarantee 5's
  measurement had to change form: a static "no `astro` specifier on the render
  graph" scan plus a `require.resolve('astro/container')` absence check. The spy
  proved no container for the observed render; the scan and the resolution check
  prove no container is reachable from any render. The render-output assertions
  (module markup, folded theme CSS, `capabilities.js`) are kept exactly as they
  were.
- **The stdout→stderr diversion is kept and re-justified.** Guarantee 2 is a claim
  about the observable streams, not about the absence of the guard. The diversion
  is cheap defence in depth against *any* boot chatter — Vite's own
  dependency-optimisation notices, a future plugin's — and removing it would trade
  a real protection for a cosmetic one. Its source comment no longer describes
  itself as a workaround for one framework.
- Guarantee 6 reconciled from bundle-15c1f647 (BUNDLE-16), plan item 6 (REQ-44).
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
  reopening of the hole.
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
- **Operator step after the uninstall.** A checkout whose `node_modules` predates
  the manifest change still carries `astro`, so the absence assertions only hold
  once the tree matches the lockfile. CI is unaffected: it installs
  `--frozen-lockfile` from scratch.
- Related capabilities: CAP-63 (1c Values-Diff Fidelity), CAP-65 (1c
  Size-Aware Diffing) — the commands whose output this hygiene protects, and the
  same commands guarantee 6 gates; the aligned-crops perceptual pipeline whose
  store routing guarantee 3 protects; the behavior-module capability that made
  the modules plain functions, which is what lets guarantee 5 be unconditional;
  the L1 substrate/fold/gate capabilities that produce the L1-only pages
  guarantee 5's render assertions exercise.

## Reconciliation Decisions
- **2026-08-31 — the quiet-boot criterion is sharpened to an empty stderr.**
  Intent (REQ-150, provisional AC-2) says "Boot emits nothing on stdout or stderr
  for a quiet command", and the shipped evidence asserts exactly that for `help`,
  `list` and `assets --json`. The pre-existing criterion said only that one named
  warning appeared on neither stream, which was written when that warning was the
  only known emitter. Since the launcher diverts stdout to stderr for the whole of
  the server's startup, an empty stderr is the strongest observable form of the
  guarantee — anything the bootstrap emitted, from any source and on either
  stream, would arrive there. Recorded as the criterion now.
- **2026-08-31 — the dependency-absence criterion is stated over every workspace
  manifest, not the three importers the implementation record names.** The record
  enumerates where `astro` *was*; the criterion has to keep holding for a manifest
  added later, and the shipped evidence enumerates the root plus every `apps/`,
  `packages/` and `tools/` member rather than a fixed list. Intent is silent on
  the scope of the scan; this is reconciliation's decision, made now, on the
  grounds that a re-entry through a newly added manifest is exactly the failure
  the uninstall is meant to prevent.

## Dependencies
Depends on the behavior-module capability's conversion of behavior modules into
plain typed functions — until no page needs the build transform, the transform
cannot leave the repository and guarantee 5 cannot be stated unconditionally.

## Story Points
2
