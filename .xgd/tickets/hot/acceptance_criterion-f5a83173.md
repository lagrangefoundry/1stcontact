---
uid: acceptance_criterion-f5a83173
id: AC-1516
type: acceptance_criterion
title: One declaration of the knowledge base's name, source and corpus type is read
  by the half that builds it and the half that searches it
created_by: xgd
created_at: '2026-09-04T02:46:27.403376+00:00'
updated_at: '2026-09-04T02:46:27.403376+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The knowledge base's **name**, the **source** its corpus resolves against, and the **document type** its corpus selects are declared **once**, and the half that builds the corpus and the half that searches it read the same declaration. There is no second copy of any of the three.

This is stated as a criterion because of how the failure looks when it happens: a corpus indexed under one document type and searched under another does not error. It returns nothing, and nothing is exactly what a knowledge base with an empty corpus returns — so a drift between two literals is indistinguishable from having built no corpus at all, from either side, at any point in the pipeline.

The two halves cannot resolve the values by sharing the machinery that builds a corpus: building one is a release-time job on a machine with a filesystem, and the searching half runs where there is none and is held to that by the assertion over its import graph. So the shared thing is the declaration itself, and it carries nothing else.

## Verification

Assert that the name, source and corpus type the build indexes under are the *same* values the searching half queries under — read from one declaration, with no second literal for any of the three anywhere on either path. Then prove it end to end where it matters: build a fixture corpus through the release path, open it through the importable artefact, and assert a search scoped to that knowledge base returns a planted document rather than nothing. Assert the searching half's import graph still reaches no filesystem module.
