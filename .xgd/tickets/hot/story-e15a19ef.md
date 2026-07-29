---
uid: story-e15a19ef
id: STORY-79
type: story
title: '1c CLI: flags parse correctly, propagate into sub-commands, and --json emits
  a clean scriptable document'
created_by: xgd
created_at: '2026-07-19T03:01:20.536179+00:00'
updated_at: '2026-07-29T04:33:45.715801+00:00'
completed_at: null
last_field_updated: story_kind
status: updated
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-ac7ca849
  story_kind: upgrade
  story_points: 1
  updated_by: bundle-31e474b9
  uat_coverage: pass
---

## Story
**As a** user scripting the `1c` CLI, **I want** flags to be parsed correctly, to
propagate into the commands a sub-command drives, `--json` output to be a single
clean JSON document, and every command to boot quietly, **so that** I can invoke
`1c` commands in any flag order, trust that a store-selecting flag reaches the
render/serve it triggers, and pipe machine-readable output straight into other
tools without it breaking or being buried in setup noise.

## Description
Four CLI-correctness guarantees for the `1c` command line:

1. **Boolean flag parsing.** The `--multi-viewport` flag is a boolean toggle, not
   a value-taking option. Invoking `values-diff --multi-viewport <slug>` (or
   `values-diff <slug> --multi-viewport`) preserves `<slug>` as a positional in
   either order, instead of the flag consuming `<slug>` as its value and failing
   with a missing-slug error.

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

In scope: argument-parsing correctness for boolean flags, propagation of
store-selecting flags into the render/serve a sub-command triggers, stdout/stderr
separation and bootstrap quiet for scriptable output, and whether the render path
engages Astro at all. Out of scope: the content/shape of the diff or crop
artifacts themselves (covered by the values-diff, size-aware diff, and
aligned-crops capabilities), and the L1 reproduction pipeline whose output the
Astro-free render path serves (covered by the L1 substrate, fold, and
reproduction-gate capabilities).

## Technical Context
- Guarantees 1–2 reconciled from bundle-ab9e0cb6 (REQ-58 pass-3), plan item 5,
  commits 4f681c73 (boolean flag) and a4323720 (--json stdout hygiene).
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
- Related capabilities: CAP-63 (1c Values-Diff Fidelity), CAP-65 (1c
  Size-Aware Diffing) — the commands whose output this hygiene protects; the
  aligned-crops perceptual pipeline whose store routing guarantee 3 protects;
  the L1 substrate/fold/gate capabilities that produce the L1-only pages
  guarantee 4 lets render without Astro.

## Dependencies
None.

## Story Points
1
