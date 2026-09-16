---
uid: doc-bdbc46b0
id: DOC-53
type: doc
title: The reproduction engine and the loop-1 session — the diagnosing session's knowledge
  base
created_by: REQ-261
created_at: '2026-09-16T20:55:42.661492+00:00'
updated_at: '2026-09-16T20:55:42.661492+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  doc_kind: architecture
---

**Audience: the loop-1 diagnosing session, not the builder AI.** This document
carries `doc_kind: architecture`, so `exportCorpus` excludes it from the
production system KB — `inSystemKb()` admits only `doc_kind: system_kb`
(`tools/generate/src/cli/kb.ts:256`). Nothing here reaches a client-facing
conversation. It is the session's knowledge base and only the session's.

Its three jobs:

1. **Explain the pipeline** — what the reproduction engine is made of, what each
   part owns, and which part is responsible for which kind of residual.
2. **Explain the session's role** — what a loop-1 round is for, what it may and
   may not do, and what a good round produces.
3. **Accumulate learnings** — how to find and fix issues well with the tools a
   round actually has. This section grows. It is the reason this is a living
   document rather than a one-off write-up.

Written against [[REQ-261]]. Sections marked **TO BE WRITTEN** are that
ticket's work; the rest is what the first live round established and is true
today.

---

## 1. The pipeline

**TO BE WRITTEN ([[REQ-261]]).** A map of `tools/generate/src/` — what each
module owns and where the boundaries fall. It must at minimum answer, without
the reader having to grep:

- **Capture** — what a reference bundle contains (`capture.json`, `raw.html`,
  `multistate.json`, `screenshot.full.png`), what each file is authoritative
  for, and what the capture deliberately does not record.
- **Fold** — how a capture becomes an L1 document, and which decisions are the
  fold's rather than the capture's.
- **L1 substrate** — the typed element tree. Cross-reference [[DOC-23]],
  [[DOC-27]] and [[DOC-30]] rather than restating them, but say which axes
  exist and which residuals are "L1 has no axis for this".
- **Probes** — what they measure and what they cannot see.
- **Gate** — `gate-core.ts`, the three gates, `reconcileGates`, and the verdict
  ladder. **The gate is the instrument, not the engine.** A defect in the gate
  is a defect in the thing that judges the reproduction, and it can be wrong
  independently of whether the reproduction is.

The field-level distinctions that cost a round tool calls to rediscover belong
here explicitly. The first one, from the first round:

> Section and band background imagery is carried as `backgroundImageUrl`, never
> as `src`. `src` is for replaced content in flow. A background image paints a
> SURFACE behind content, so it never reaches the element manifest as `src` —
> `values-diff.ts:246-250`, `extract.ts:1336-1340`, `types.ts:443-446`.

## 2. The session's role

A **loop-1 round** ([[EPIC-12]] §7.1) reads the evidence one reproduction left
on disk and describes what the ENGINE cannot yet do. It improves the engine by
diagnosing it. It writes no code.

**It has three tools: `Read`, `Glob`, `Grep`.** Everything that can write a
file, run a command, reach the network or spawn an agent is denied by name
([[REQ-256]] behaviour 3). This is a property of the process, not a rule the
round is asked to keep. Consequences a round should plan around:

- There is no `jq` and no `node`. A 4,000-line `multistate.json` is read and
  grepped, so grep first and read the region you need.
- There is no `xgd`. The round never files anything itself; it hands the
  console content and the console files it.

**What a round produces.**

- **One gap ticket against the reproduction engine.** Detailed, and with no
  bound on its size or on the scope of work it asks for. A round that finds
  five related residuals writes one ticket describing five, not one ticket
  describing the most provable one. Deferring findings to "a later round"
  discards them — the later round starts from zero and will not know they were
  seen.
- **Bugs, separately, for anything else it trips over** — in L1, in this
  document or the standing brief, or anywhere in the broader `1c`
  implementation. These are not folded into the gap ticket. They are their own
  tickets, filed by the console, at `status: draft`.

**What a round must never do.** Diagnose the site rather than the engine. A
residual is a serializer bug, a missing L1 axis, a missing capture hint, or a
region that needs promoting to flow. It is never "the hero on this site should
move down 20px". The site config is disposable; the durable output is the
framework growth the residual forces.

**The one rule**, from [[DOC-19]] and restated in the standing brief because it
is the most-violated one: *transcribe from the captured DOM, do not reconstruct
from memory and a screenshot.* It binds a diagnosis exactly as hard as it would
bind a fix. If a claim cannot be stated as a value read out of a file, it is
not made.

## 3. Learnings — how to find issues well

This section accumulates. Each entry names what was found, how, and what made
it findable, so the next round can reuse the method rather than the conclusion.

### 3.1 Check the instrument against the evidence, not only the evidence against itself

*From the first live round, `gigabytealchemy.ai`, 2026-09-16.*

`gate.json` reported one coverage finding: the mirrored hero image was
referenced by no element, so "the capture kept the bytes but never attributed
them to the page."

The round did not take that at face value. It opened the files the finding was
derived from and found the attribution present in all three of them —
`capture.json` carried the section background, `multistate.json` carried the
matching `backgroundImageUrl`, and the reproduction's own L1 carried it too.
The finding was false, and the cause was one line in `referenceCoverage()`
building its referenced set from `manifest.elements[].src` alone.

It then traced the consequence rather than stopping at the wrong line:
`reconcileGates` tests coverage BEFORE value deltas, so on any perceptually
breached run that false finding overrides `reproduction-wrong` and returns
`capture-incomplete` — which the brief tells a round means *stop, file
nothing*. A cosmetic-looking false positive silently disables loop 1 on any
site whose imagery is painted as a background.

**The method, generalised.** A gate finding is a claim the engine makes about
itself. Verify it against the captured files before diagnosing from it. When a
finding turns out to be false, do not stop at the false finding — follow it
into the verdict ladder and ask what it causes, because a wrong instrument is
worth more than a wrong pixel.

### 3.2 Grep for the field, not for the symptom

The round established that `"src"` occurs **zero** times in the entire
`multistate.json` for that page. That single grep converted "the coverage check
looks wrong" into "the coverage check reads a field this manifest structurally
cannot contain" — a claim an implementer can act on without re-deriving it.

Counting occurrences of a field name across the manifest is cheap and often
decides between "the value is wrong" and "the code is reading the wrong place".

### 3.3 Search the ticket store before filing

The same false positive had been observed once before and recorded in prose
inside a completed ticket, where it shipped without a code change. The round
found it with a grep of the ticket store and said so in the ticket, which is
the difference between "here is a defect" and "here is a defect we have now
seen twice and never fixed."

Ticket bodies are plain markdown on disk under `.xgd/tickets/hot/`. They are
greppable with the tools a round has.

## 4. Related

[[REQ-261]] (the work this document is part of) · [[REQ-256]] (the round) ·
[[REQ-254]] (the console) · [[REQ-255]] (the rail) · [[EPIC-12]] §7.1, §8 ·
[[DOC-19]] (the reproduction runbook) · [[DOC-21]] (the growth loop) ·
[[DOC-23]] (L1 substrate) · [[DOC-27]] (L1 reproduction vocabulary) ·
[[DOC-30]] (L1 control surface) · [[DOC-39]] (the knowledge management system,
and why this document is not in the production KB)
