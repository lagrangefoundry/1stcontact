---
uid: acceptance_criterion-08983d5d
id: AC-1634
type: acceptance_criterion
title: A reference document is written into the shipped corpus for every source, on
  every corpus export and every index build
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:35:14.973674+00:00'
updated_at: '2026-09-11T02:51:27.639206+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

Both the corpus export and the index build write the generated reference into the
shipped corpus directory: exactly one reference document per declared source —
the component catalogue, the layout schemas and their validation envelope, and
the declared control surface — landing beside the documents exported from tickets,
under reserved names that identify them as generated.

The set is complete or the build is not: all three are present after a run, and
the export's report names each generated document it wrote (named, not counted,
because a generated document has no ticket for an operator to go looking for).
Generation runs before the corpus is read, so the references are in the corpus
the export reports on and in the index and awareness map the build produces —
they are corpus members like any other, not a second retrieval path.

## Verification

Run the corpus export against a scratch corpus directory with a declared system
knowledge base, then list the directory: three reference documents are present,
one per source, and the command's report names all three. Run the index build
against the same directory and observe the references are included in the built
index rather than skipped. Removing any one source's reference from the expected
set fails the check — the assertion is over the whole set, because a reference
that silently stops being written leaves the assistant articulate about design
and unable to say what a component is.