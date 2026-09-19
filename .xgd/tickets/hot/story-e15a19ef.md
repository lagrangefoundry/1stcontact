---
uid: story-e15a19ef
id: STORY-79
type: story
title: '1c CLI: flags parse correctly, propagate into sub-commands, and --json emits
  a clean scriptable document'
created_by: xgd
created_at: '2026-07-19T03:01:20.536179+00:00'
updated_at: '2026-09-19T13:57:18.052078+00:00'
completed_at: null
last_field_updated: body
status: updated
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-aa030c83
  story_kind: upgrade
  story_points: 2
  updated_by: bundle-8e1807f6
  uat_coverage: pass
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

   Gating is per command, on exactly what that command loads. The gated set is
   seven verbs — `capture`, `shot`, `values-diff`, `adopt-gaps`, `diff`, `gate`
   and `aligned-crops` — and all seven are gated for one reason: each drives a
   browser, so each is gated on the browser automation dependency and on nothing
   else. That is now the whole of the tool's gated dependency surface. The native
   imaging package the pixel-comparing verbs once loaded beside it is no longer a
   declared dependency of the tool at all, because the PNG codec is ordinary
   source in this repository — so no `1c` verb can fail for want of an imaging
   package, and no refusal can name one.

   `crop` left the gated set with it. It decodes an image and never opens a
   browser, so the imaging package was its only entry; with the codec in-repo it
   loads nothing that can be absent, and its requirement would be the empty set.
   The entry was **removed rather than emptied**, because a gate on an empty
   requirement can only produce a refusal the operator has no remedy for. `crop`
   therefore joins the offline verbs — `render`, `serve`, `builder`, `repro`,
   `refold`, `l1-gate`, `responsive-diff` and the structured-edit commands —
   which are never gated, so a verb is never blocked by a dependency it does not
   use, and `1c crop` completes on a tree that was never installed at all.

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
pre-command check that the installed tree matches the declared dependencies —
including which verbs that check ranges over and which dependencies it names. Out
of scope: the content/shape of the diff or crop artifacts themselves (covered by
the values-diff, size-aware diff, and aligned-crops capabilities), the PNG codec
that replaced the imaging dependency and the fidelity arithmetic it feeds (covered
by the codec story in this same capability — this story owns only the
*install-gating consequence* of that removal), the behavior module contract and
the conversion of the modules themselves into plain functions (covered by the
behavior-module capability), the L1 reproduction pipeline whose output the
transform-free render path serves (covered by the L1 substrate, fold, and
reproduction-gate capabilities), and *performing* an install — the preflight
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
- **Guarantee 6's membership re-pinned from bundle-8e1807f6 (BUNDLE-27), plan
  item 3 (REQ-156), commit `f5807330`.** `sharp` is gone from
  `tools/generate/package.json` and from every `import` under
  `tools/generate/src`; the per-command dependency map is now seven verbs all
  naming `playwright` alone, and `crop` carries no entry at all. `1c preflight`'s
  declared list is derived from that same map — the flattened set of its values —
  so it no longer names an imaging package either. The gating *rule* did not
  change — only the set it ranges over.
  Evidence re-pinned in the same commit:
  `tests/req44-install-preflight.test.ts` and
  `tests/reconciliation-1c-install-preflight.test.ts`, both of which now assert
  the seven-verb set as a whole, that `crop` is refused on no tree, and that a
  pixel-comparing verb's refusal names `playwright` and not `sharp`.
- **One honest caveat carried forward from REQ-156.** `sharp` still appears in
  `pnpm-lock.yaml` as a *transitive* dependency of `miniflare`, which the workerd
  test pool pulls in, so a developer's install still builds a native module — for
  the test harness, not for the tool. The claim this story makes is the narrower
  and accurate one: nothing the tool declares or loads names it, and no `1c` verb
  can fail because it is absent.
- **A grep for the name is not the check.** `sharp` is still written in
  `tools/generate/src` — in the comments that explain its own removal
  (`png.ts`, `perceptual.ts`, `perceptual-core.ts`, `aligned-crops.ts`; `gate.ts`
  uses the ordinary English word) and as a deliberately asserted-absent string in
  both preflight suites. The falsifiable form of the guarantee is the one the
  criteria state: the tool's declared runtime dependency set is the browser
  automation package alone, and no refusal can name an imaging package. Anyone
  re-verifying this should read the manifest and the dependency map, not the
  prose.
- **Code issue for `fix_uat_coverage` — do NOT encode this as an AC.** The CLI's
  own `USAGE` text still lists `crop` among the commands that "check the installed
  tree before doing any work" (`tools/generate/src/cli/index.ts`, the *Install
  preflight (REQ-44)* paragraph). REQ-156 states plainly that "`crop` leaves the
  preflight map … so the entry goes rather than emptying", and the shipped map
  agrees — so the help text contradicts both the intent and the behaviour, telling
  an operator that a verb is gated when it is not. No test pins that string today.
  Per the chain of authority the criteria above record the intent; the help text
  is the thing that needs correcting.
- **Deliberately out of this repo (intent split by REQ-44 itself).** The
  "re-install after a commit changes a dependency manifest" rule belongs to the
  workflow engine and is filed as REQ-745 (`lagrangefoundry/xgd`) with its
  plugin-contract half as REQ-22 (`lagrangefoundry/xgd-plugin-sdk`). The
  preflight here is defence in depth: it catches a stale tree whatever caused it
  — a workflow commit, a plain pull, an interrupted install.
- **Known blind spot, recorded by intent, not fixed here.** Worktree installs run
  with install scripts skipped, so a package directory can exist while its native
  binary or downloaded browser does not. The module still resolves, so the
  resolution check cannot see it; that decision is carried by REQ-22. The blind
  spot narrows with `sharp`'s removal: `playwright`'s downloaded browser is the
  only instance of it left anywhere on the gated path.
- **Operator step after the uninstall.** A checkout whose `node_modules` predates
  the manifest change still carries `astro`, so the absence assertions only hold
  once the tree matches the lockfile. CI is unaffected: it installs
  `--frozen-lockfile` from scratch.
- Related stories and capabilities: the sibling stories in this same capability,
  CAP-63 (1c Capture & Diff Fidelity) — STORY-75 (the intrinsic value axes) and
  STORY-77/STORY-78 (size-aware and cross-size diffing) — the commands whose
  output this hygiene protects, and the
  same commands guarantee 6 gates; the PNG-codec story in this same capability,
  which owns the in-repo codec that replaced the imaging dependency and whose
  landing is what moved guarantee 6's membership; the aligned-crops perceptual
  pipeline whose store routing guarantee 3 protects; the behavior-module
  capability that made the modules plain functions, which is what lets guarantee 5
  be unconditional; the L1 substrate/fold/gate capabilities that produce the
  L1-only pages guarantee 5's render assertions exercise.

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
- **2026-09-13 — `crop` gets a criterion of its own rather than only a clause in
  the gated-set criterion.** REQ-156 states the rule ("`crop` leaves the preflight
  map … a gate on an empty requirement can only produce false refusals") but is
  silent on what an operator should be able to *observe* from it. The gated-set
  criterion can only say that `crop` is absent from a set; what actually matters
  to a caller is that `1c crop` runs to completion on a tree where nothing is
  installed. Recorded now as a separate criterion stating that outcome, on the
  grounds that "absent from the set" is a structural fact while "crops with
  nothing installed" is the behaviour the removal exists to deliver. The two do
  not duplicate: the gated-set criterion pins membership as a whole and would
  still hold if `crop`'s entry had merely been emptied rather than removed.
- **2026-09-13 — the declared-dependency criterion states the gated surface is
  one package, not merely that `sharp` is gone.** REQ-156 AC1 says only that "`1c
  preflight` no longer declares it". Stating the positive form — that the browser
  automation package is the whole of what the gated verbs range over, and that no
  verb can fail for want of an imaging package — is what makes the criterion
  falsifiable against a future re-entry through some *other* imaging package,
  which a bare absence claim about one named package would not catch. Intent is
  silent on the positive form; this is reconciliation's decision, made now.

## Dependencies
Depends on the behavior-module capability's conversion of behavior modules into
plain typed functions — until no page needs the build transform, the transform
cannot leave the repository and guarantee 5 cannot be stated unconditionally.

Guarantee 6's current membership depends on the in-repo PNG codec (plan item 2 of
bundle-8e1807f6, REQ-156): until the image layer stops being a declared package,
`crop` cannot leave the gated set and the gated dependency surface cannot narrow
to the browser automation package alone.

## Story Points
2