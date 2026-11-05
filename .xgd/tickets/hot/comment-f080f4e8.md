---
uid: comment-f080f4e8
id: COMMENT-5606
type: comment
title: Comment on request REQ-447
created_by: xgd
created_at: '2026-10-24T20:14:03.857476+00:00'
updated_at: '2026-10-24T21:25:40.206041+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-6b5389b6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d9265922-cecf-447d-8f9f-fc8258ace2d3",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="2ed88d79-3d1a-4c5d-a011-5800b4af1dfe-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T20:12:37.609672+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2ed88d79-3d1a-4c5d-a011-5800b4af1dfe-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T20:19:04.118673+00:00" -->
#### Claude
Reading the L1 schema, renderer and DOC-67 to map the ticket onto the existing code before deciding on questions.

Still mapping the codebase (focal point storage, describe_page, renderer) — the ticket touches a lot of surfaces.

Reading the L1 node kinds (box/container, sizing, spacing) to settle the core design before writing anything.

Before writing code I need to settle a few shape decisions. I've read DOC-67, the L1 schema, the text-style/rhythm/palette passes and the renderer's entry points. Below are my proposed answers. Reply "go" to accept them all, or correct any one.

**How I plan to build it (no answer needed unless you disagree)**
- `site.design` resolves at the boundary, the same way `textStyles` and `palette` do today. A single `resolveL1Design` pass turns every named reference (`role`, `space`, `width`, `component`, `aspect`) and every default into the literal values a node could have carried itself. That keeps the renderer as the only emitter and leaves the analytic evaluator, the round-trip gate and values-diff unchanged. Off-system counting runs on the unresolved document.
- I'll reuse the image's existing `axes.objectPosition` as the focal point instead of adding a second field. `aspect` sets the box ratio and the focal point sets the pan.
- `sectionGap` and `blockGap` will be names in the space scale (`blockGap: "sm"`), and the `sectionGap > blockGap` check compares the px values at every width.

**Questions**

1. **Migration vs. defaults.** "Nothing renders differently" conflicts with "a top-level section takes `contentWidth` by default". Dina's sections are five different widths today, so no single `contentWidth` reproduces them. **Proposal:** the migration writes explicit values onto existing nodes wherever a default would change them. For example, a section with no width gets `width: "natural"`, a new enum value meaning "as it renders today". Those values are reported as off-system. New nodes get the defaults.

2. **Spacing on a box's children.** Today it's silently dropped, so honouring it will move existing pages that set it. **Proposal:** the migration removes the spacing values that were being dropped, so day one is still pixel-identical. From then on, box children are spaced like a stack.

3. **`theme` can't simply be deleted.** Legacy module pages (`modules[]`, e.g. callout and dials) still read `--space-*` and `--radius-*` from it. **Proposal:** `theme` becomes optional, and the CSS generator falls back to the defaults it already has. The migration drops `theme` only from sites with no legacy modules, and moves `theme.fonts` into the design's font list. `textStyles`, `textDefault` and `rhythm` are removed outright and replaced by `design.type` and `design.space.rhythmPx`.

4. **Ariel's and Dina's stored sites for the pixel-identity UAT.** They aren't in the repo, only in the local dev store. **Proposal:** I copy their current site JSON and assets into `tests/fixtures/req447-*` and run the before/after comparison against those copies.

5. **Size.** This will be a large commit set covering the schema, the resolver, the renderer (box spacing, aspect and focal point, BUG-259 inline drawings), `describe_page` off-system counts, `get_text_styles` → design, migration on load, and every fixture still carrying `textStyles`. That is about 18 points, as estimated. **Proposal:** one ticket on one branch, as filed, with no split.

<!-- xgd-turn id="2f8c63e9-1afc-4a78-bf9e-ae16d4e0d250-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T20:23:57.030627+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="2f8c63e9-1afc-4a78-bf9e-ae16d4e0d250-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T21:25:39.615103+00:00" -->
#### Claude
Worktree's ready; running the baseline for the L1, rhythm, text-style and security suites before changing anything.

Mapping the tool surface (text-style ops, `set_config` groups) that has to move to the design.

Design settled; now reading the renderer's box/container emission before writing the schema.

Starting the code: the `site.design` schema module in `packages/site-schema`.

Writing the design module now.

Node references are in the schema; now writing `design.ts` (schema, structural checks, resolver, off-system census).

Now updating `rhythm.ts`: explicit rhythm unit from the design, box children spaced like a stack, and `blockGap` as the block default under a design.

Schema, validator and resolver are in place; type-checking the site-schema package next.

Wiring the design into the L1 renderer: design variables on `:root`, `space`/`width`/`aspect`, box child spacing, and the new lead lengths.

Framework compiles. Folding the image defaults (aspect `cover` crop, imagery radius) into the resolver so slots and inlined drawings get them too.

Schema and renderer compile. Moving to `tools/generate`: typechecking to get the list of call sites to migrate.

Writing the migration module (`store/legacy-design.ts`): derives `site.design` from a stored site's `textStyles`, palette, rhythm and theme, and pins every page so nothing renders differently.

Wiring the migration and design resolution into `assembleSite`.

Replacing the text-style commands with design commands; first adapting the `1c type assign` retrofit to name roles.

Now rewriting the text-style section of `edit.ts` as design commands (`editDesignGet`, `editTypeAssign`) and moving the read path onto the migration.

CLI wiring next: `1c type` becomes `1c design get` / `1c type assign`.

Help text fix, then the toolbox (`get_design`, `describe_page` off-system counts).

Updating the analytic evaluator (`probes.ts`) so it computes the same leads, gaps and design widths as the renderer.

Code compiles across packages. Now the model-facing surface: replacing the text-style ops in `l1-surface.json` with `get_design`, and fixing descriptions that name removed fields.

Fixing the last stale comments, then the priming text that tells models to use the removed fields.

Code and surface edits done. Running the core L1/rhythm/type/security suites to see what broke.

Expected fallout: these UATs pin the retired `textStyles` behaviour. Working through them one at a time, starting with the token tests.

Theme CSS keeps the legacy `--font-family-heading` alias. Now updating the token-count expectations and the REQ-126 surface test.

REQ-350 D3 suite passes against the design. Next, the REQ-350 "type is set once" suite.

Rewriting the REQ-350 "type is set once" suite against design roles (assign → roles, one role edit moves every run, container inheritance, validation, use census).

REQ-350 suite green on roles. Now the REQ-420 rhythm failures.

Core suites green, but the browser tests are skipping: checking whether Chromium is available in this worktree.

Chromium runs with `CHROMIUM_LAUNCH_ARGS=--single-process`; all REQ-420 tests pass, browser ones included. Next: locating Ariel's and Dina's stored sites for the migration fixtures.

Exporting Ariel's and Dina's stored drafts from the local D1 into fixture form (pages assembled whole, assets replaced by same-size stand-ins).

Writing an export script (in `$TMPDIR`, not shipped) that assembles the pages, keeps referenced SVGs and records PNG dimensions.

Exports done. For the "before" side of the pixel comparison I need the pre-change code: setting up a detached copy of `xgd-working` in `$TMPDIR` that shares the installed dependencies.

Writing the PNG stand-in generator and laying the two sites out as committed fixtures (looks dropped, photos replaced by same-size solid images).

Fixtures are about 420KB in total. Now the shared layout-measurement helper, used both for the old-code baseline and in the UAT.

Now the old-code baseline run: a throwaway vitest config in `$TMPDIR/old` that aliases the workspace packages to the pre-change sources.

Still assembling the old-code tree for the baseline; adding the rest of `apps/`.

Reusing the existing `tests/support/chromium.ts` launcher instead of importing Playwright directly.

Every page measured the same count, so non-home pages aren't resolving. Checking where `renderSite` writes them.

Baseline recorded (~92KB). Restructuring fixtures as `<site>/draft/` plus `<site>/layout-before.json`.

Before the UAT: closing an injection gap I noticed. `design.fonts` (formerly `theme.fonts`) emits `family` and `src` raw into `@font-face`. Tightening the schema and the validator.

Writing the REQ-447 UAT file: schema refusals via the CLI; renderer, box spacing and focal crop in real Chromium; off-system via `describe_page`; migration pixel comparison; and injection.

All 8 REQ-447 UATs pass, browser ones included. Now the broad regression sweep.

45 failures in the non-UAT batch. Baselining the same files against the pre-change code in `$TMPDIR/old` to separate pre-existing failures from mine.

10 failures look new. Inspecting each.

Updating these tests to the new contract (theme optional, families from design roles, the narrowed write set) and exempting the root from the spacing rule.

The assistant-pane failures reproduce on the main checkout without my change, so they're pre-existing. Fixing the scaffold assertion.

Non-UAT batch is clean apart from pre-existing failures. Running UAT batch 2 (310 files).

Several failures appear in both runs, but the `$TMPDIR` copy may fail for environment reasons and hide real regressions. Checking the ones that touch my areas directly.

Several of these are real regressions that the `$TMPDIR` baseline masked. Investigating each, starting with BUG-219 (extra entries in the change record).

Only REQ-129 and REQ-130 are mine outright. BUG-48 fails on main too but names my new rule, so comparing its messages.

The KB harvester chokes on apostrophes in these rules' doc comments (the pre-existing `zoomGroupChromeAgrees` gap has the same cause). Rewording all five comments without apostrophes.

The harvester drops comments whose first sentence still contains a ticket ID or runs past 240 characters. Rewriting the five comments to fit.

Still fixing the KB-reference coverage test (BUG-48); one more structural rule has no provocation in its table.

The remaining BUG-48 failure is pre-existing: eight REQ-335 rules were never given provocations, and it fails on main too. Checking that my four new rules each produce their stated refusal.

All five rules refuse as stated. Next, REQ-129 (the page map now names fields) and REQ-130 (theme absent on new sites).

Checking the remaining batch-2 failures (builder UI) on the main checkout.

All pre-existing except the form-presentation font 503, which passes on main; checking whether that font file is simply absent from the worktree.

Load flake; passes alone. Running UAT batch 3.

Migrating the `req396-charlies` fixture to the design shape with the migration itself (the REQ-396 suites compare it to itself), and updating REQ-418, REQ-295 and the zoom message.

Only section width pins changed in the fixture. Now REQ-418, REQ-295 and the zoom message.

Node project is clean apart from pre-existing failures. Checking the workers project for files that touch the retired fields.

Consultant priming is 49 characters over its 100k cap (49 over after halving). Tightening my priming wording and the `get_design` summary.

Priming fits again. Re-running typechecks across packages and the suites touched by the surface/priming edits.

Full sweep done: every remaining failure is pre-existing. Before committing, re-reading my notes on the `free_coded` gate and version bump for this repo.

Planning the commits. Checking whether this repo's free-coded commits carry an attribution trailer.

The convention includes the trailer. Re-reading the ticket body before adding "What landed" (the operator may have edited it).

Ticket unchanged since I read it. Writing the full body: existing content kept, plus "What landed" and the UAT mapping.

Ticket body updated. Committing in coherent groups on the branch.

Five commits on the branch. Merging the latest `xgd-working` into the branch first, since other sessions have landed work.

Clean merge. The incoming REQ-450/451 code may use the retired fields, so re-checking types and greps.

Merged-in and key suites pass. Taking the merge lock and fast-forwarding `xgd-working`.

Fast-forwarded cleanly; nothing to rematerialize. Moving the ticket to `free_coded` and letting the gate do its own version bump.

Ticket is `free_coded` (version 0.2.622). Releasing the lock and cleaning up the branch.

Merged, recorded and cleaned up. Saving two non-obvious findings to memory.

REQ-447 is built, merged into `xgd-working` and parked at `free_coded` (version 0.2.622, 5 commits plus the auto bump, 18 points). The 8 new UATs pass, including the real-Chromium ones: Ariel's and Dina's stored sites render within 1px of a baseline I measured from the pre-change code.

**What a site now has**
- **`site.design`:** type roles, a space scale with an explicit rhythm unit, content and wide widths with a gutter, colour roles, components, image aspects, brand and fonts. All typed, and the validator refuses a type scale that doesn't rise, a section gap no larger than the block gap, a colour pair below 4.5:1, and an out-of-bounds content width.
- **Nodes name the design:** `role`, `space`, `width`, `component`, `aspect`, and `type.role` on containers. A name the design doesn't define is refused. With no per-node values, sections sit at the content width with the section gap between them, text takes `body`, and images take `inline` cropped around their focal point (`objectPosition`). Each default applies only when its token exists in the design.
- **Header and footer parts** are drawn from the same design.
- **No silent drops:** a box spaces its children by the space they declare, like a stack. Spacing the renderer would ignore is now refused.
- **Off-system values are counted, not refused:** `describe_page` reports them per section. `get_design` shows the design, what's wrong with it, how often each name is used, and each page's off-system count.
- **Migration on load:** pages are pinned with existing sizing values (no new enum), and the first write saves the migrated site whole.

**Where I chose differently from the ticket's wording**
- **Per-width lengths aren't literals.** Space steps, the content and wide widths, and the gutter are declared once on `:root` per width, and nodes read them through CSS variables, as the rhythm unit already does. Roles and components are still resolved at the boundary, and the renderer is still the only emitter.
- **The page map lists off-system values by address and kind only.** An existing UAT (REQ-129) forbids styling values in the map; `get_l1` on the address shows the value.
- **The four text-style write tools are gone.** The design is written through `set_config` under `design`; who may write it is left to REQ-448.
- **`1c type assign` now names roles.** It can only name `h1`–`h3` and `body`; other groups stay as typed-in values.
- **Security fix:** `design.fonts` (formerly `theme.fonts`) wrote the family name and source URL raw into `@font-face`. Both are now restricted, and the source must pass the image URL allowlist. No stored site used `theme.fonts`.

**Tests that changed**
- Existing UATs whose contract moved to the design were updated, not deleted: the REQ-350 and REQ-420 suites, the write-set and grant tests, theme CSS, the scaffold and table tests.
- The `req396-charlies` fixture was run through the migration itself; the only change is section width pins.
- The fixtures for Ariel's and Dina's sites are about 420KB in `tests/fixtures/req447-sites/`, with same-size stand-in photos.

**Still failing, all red on the main checkout without this change:** the `logDir`→`junctions` family, the builder pane and session UI suites, REQ-180, BUG-219, REQ-175, REQ-143, REQ-148, BUG-252, BUG-162, BUG-245, and one BUG-48 case. That BUG-48 case has eight REQ-335 rules with no test case that triggers them. I made my four new rules (and the previously hidden zoom-group rule) show up in the generated KB reference, but left those eight alone.

The ticket body's "What landed" section is current. Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->