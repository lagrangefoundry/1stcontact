---
uid: acceptance_criterion-2f55349d
id: AC-2236
type: acceptance_criterion
title: The shared-store preflight checks that the installed knowledge component is
  compatible with the index seam, not only present, and reports it on its own line
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-02T04:11:39.238489+00:00'
updated_at: '2026-11-04T21:11:12.896973+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The build preflight asks two separate questions of the shared component store, in this order:

1. **Present** — every shared component resolves (unchanged behaviour).
2. **Compatible** — the installed knowledge component resolves a knowledge base through **its own** index-selection function against a map keyed by that knowledge base's source name, and returns exactly the index under that key.

The compatibility probe is a single pure call: **no network, no embedder, no filesystem artefact**. It runs only after presence passes, so a missing component is reported as missing rather than as incompatible.

- **Compatible:** after the presence summary line (which counts components and packages), the preflight prints a **separate** line stating that the installed knowledge component takes the source-keyed index seam. The count line never claims the seam, and the seam line claims only that one seam — it does not imply the store and the repository agree about anything else.
- **Incompatible** (the component exports no such function, or refuses or mis-resolves the map): the preflight is refused with the environment exit code (6), a message carrying the component's own failure text and naming the expected shape (one index per source: an index map keyed by source name rather than a single source), and a hint naming the shared-store install command and, if the store is already current, the call sites that need changing.

## Verification

Build the real probe (`knowledgeSeamProbe`) around component doubles that substitute only the loaded knowledge module, and assert it is not ok in each case, carrying the component's own text where it has one: a component with no `indexFor`, an `indexFor` that ignores the map (singular signature), one that returns the wrong index, and one that throws on the map. Assert the asserting form throws an `ENVIRONMENT` error (exit 6) naming the source-keyed shape, the install command and the call sites. Run the real probe against the installed store with the embedder seam pointing at a non-existent model and `fetch` refusing, and assert it reports compatible and nothing was fetched. Run `1c preflight` and assert the seam result is printed on a line separate from the component/package counts. Run `1c preflight` again with the knowledge component made unresolvable through the presence check's resolver seam, and assert: exit 6, the presence refusal naming the missing component and the install command, no `Index seam:` line, no success summary, and the seam check never invoked.
