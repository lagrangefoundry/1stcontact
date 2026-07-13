---
uid: capability-ad1670cb
id: CAP-62
type: capability
title: Styled-Text Block-Document Model & Notation
created_by: xgd
created_at: '2026-07-13T20:59:20.101822+00:00'
updated_at: '2026-07-13T20:59:20.101822+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: styled-text-block-document-notation
---

Capability: a block-document styled-text content model and its lossless authoring/serialization notation.

Text content is a block-document tree — a shared baseline style plus an ordered list of blocks (paragraph, heading, list, blockquote, code, table). The inline leaves of the tree are styled runs, each overriding only what differs from the block baseline (CSS-inheritance semantics). Authors express and interchange this document through a CommonMark-flavoured markup with a generic attribute-span notation whose keys are the styled-run field names, so anything the model can hold has a notation.

The defining contract is the round-trip invariant: parsing serialized markup reproduces the normalized document, and a normalized document round-trips exactly.

Scope: this capability is the pure model + notation unit. Rendering, schema wiring, capture projection, and diff pairing are separate capabilities/workstreams that consume this model.
