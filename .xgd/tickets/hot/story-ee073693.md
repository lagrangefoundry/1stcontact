---
uid: story-ee073693
id: STORY-113
type: story
title: 'Palette management: read the site''s colours with their usage counts, and
  change, add, remove or rename them under guards the store enforces'
created_by: xgd
created_at: '2026-08-20T01:19:10.715657+00:00'
updated_at: '2026-08-20T06:29:36.715645+00:00'
completed_at: null
last_field_updated: body
status: completed
fields:
  intent_uid: bundle-77b28def
  capability_uid: capability-a0bba4ec
  story_kind: feature
  story_points: 3
---

## Story

**As a** site operator (at the command line, in the builder, or through the site assistant),
**I want** to read my site's named colours with how much each one is used, and to change, add,
remove or rename them through one guarded surface,
**so that** a colour edit moves every use of that colour predictably, and no edit can leave the
site pointing at a colour that no longer exists.

## Description

The site's palette becomes an editable subject in its own right, with its own command group
(`1c palette get | set | add | rm | rename`), its own origin route beside it, and the same five
operations declared to the site assistant. Before this, a palette could only be written by
merging a settings object: a merge can change a colour and add one, but it cannot remove a key
or move one, and it has nothing to say about the references that removing and moving are
defined in terms of.

**The census is the load-bearing fact.** A read answers with every entry, its colour, and how
many places reference it across the site definition and every page, counting a reference at any
position in the entry's light↔dark family. "primary, used 45 times" is what makes an edit
predictable, and it is the sentence both the delete rule and the rename confirmation are stated
in. An unused entry is reported at zero rather than omitted, because zero is the delete rule's
entire subject. A site with no palette at all is a legitimate state and reads as an empty
palette, not as an error.

**Which edits are allowed is decided by which decisions have a computable answer.**

- *Change* an entry's colour: one write, and every use follows at every position in the family,
  because a position is generated from the entry rather than stored beside it. No page is
  touched.
- *Add* an entry: a kebab-case name and one opaque colour. Translucency and lighter/darker
  variants are properties of a *use*, not of an entry, so a colour carrying transparency is
  refused here.
- *Remove* an entry: allowed only when nothing references it. A referenced entry has no correct
  default for what each use becomes — repoint it, or inline the colour as a literal? — so the
  refusal names the count and there is no override. Every orphaned reference would be a
  validation failure rather than a fallback, so an override would be a one-keystroke route to an
  invalid site.
- *Rename* an entry: allowed even at hundreds of references, because rename is total and
  lossless — every use has exactly one correct new value and the system can compute it. The key
  and every reference move in one atomic write; a refusal leaves the draft byte-unchanged.
  Renaming onto an existing name would *merge* two colours, which is the same class of decision
  as deleting one in use, and is refused.

**The guards are the store's, not a control's.** Every refusal is enforced where the write
happens, against the definition as it currently stands — so a browser tab holding a count it
read five minutes ago, or an assistant working from a stale reading, cannot talk the store into
an orphaned reference. A disabled button in a client is an explanation of the rule; it is never
the rule.

**One surface, three callers.** The command line, the builder origin route and the assistant's
toolbox all reach the same write path, so the same edit cannot leave the store in different
states depending on who made it. The assistant's access is as much a narrowing as a widening:
it previously reached the palette blind, through a settings merge, with no way to ask what a
change would move and no way to remove or rename at all.

### In scope

- Reading the palette with per-entry usage counts, from the command line and from the origin.
- The four writes and their refusals, enforced server-side.
- The closed operation vocabulary on the origin route, and its refusal of an undeclared verb.
- Every write answering with the result of the operation and, where the caller is redrawing a
  view of the palette, the re-taken census.
- All five operations declared to the assistant, the read grantable separately from the writes.
- Free colour entry (choosing a colour by hex) living on this surface and nowhere else.

### Out of scope

- The browser popup that displays the palette, previews a family and resolves to a chosen
  reference — a separate story in this capability, which consumes this surface.
- Colour-valued fields on a segment, and the controls that write one; they choose *from* this
  palette and are owned by the copy-editing capabilities.
- Deriving a palette from a folded site's colour literals (`1c colors --assign`), which already
  exists and is not rebuilt here.
- The palette colour model itself — entry shape, reference shape, shade arithmetic, resolution
  and dangling-reference validation — owned by the framework substrate.

## Technical Context

- **One structural walk.** Counting references, resolving them and rewriting them for a rename
  are three questions about the same set of nodes. They are expressed on a single traversal, so
  the count a surface shows before a rename is by construction the set that rename rewrites,
  rather than two hand-kept traversals that happen to agree. The traversal is structural rather
  than a hand-listed tour of the colour axes, so an axis added later is counted without anyone
  remembering to add it.
- **Census scope.** The walk covers the site definition and every page — the same scope colour
  references are resolved at when a site is loaded. The palette object itself is excluded from
  the walk, so an entry can never be counted against itself.
- **No re-render on write.** Both draft-side render channels render at request time, so there is
  no build artifact for a palette write to keep in step; the next fetch of either channel serves
  the new colour. The original intent carried a re-render criterion (AC-12); it was withdrawn
  during implementation once the channels became request-time, and replaced by the client
  reloading its preview frame. Related capability: the builder workspace's render channels.
- **Divergence to note — the census on a write.** The intent states that *every* write answers
  with the operation's result **and the whole re-taken census**. As implemented, the origin route
  does exactly that (it merges the re-taken census into every write response); the command line
  and the assistant's write responses carry the operation's result and the affected entry's own
  count, but not the full census. The criteria below therefore assert the full-census answer at
  the origin, where it is observable, and assert the operation's own result at the other two
  callers. Flagged rather than absorbed: if the intent is read strictly, the command-line and
  assistant responses are the half that does not yet match it.
- **Divergence to note — what a refusal tells the assistant.** The guards are identical across
  the three callers and each caller is refused for the same reason at the same place, but the
  three do not learn the same *sentence*. The store's `CommandError` names the count (`'primary'
  is used 3 times and cannot be deleted.`) and the command line prints it verbatim. The assistant
  does not see it: rendering a refusal belongs to the toolbox, which renders from the per-code
  text carried in the surface declaration, so what reaches the model is the code (`CONFLICT`) and
  that code's declared sentence. The count is still reachable — `get_palette` reports it per entry
  and the removal operation's own declared description sends the model there — so the assistant
  can still talk a removal through, but from the read rather than from the refusal. Flagged
  rather than absorbed: read strictly, "the assistant meets the same refusal an operator meets"
  is true of the guard, the code and the unchanged draft, and not of the wording. Closing it
  would mean carrying the thrown error's own message through the toolbox's refusal renderer,
  which is upstream of this repository.
- **Divergence to note — renaming an entry to its own name.** The collision guard compares only
  against *other* entries, so renaming an entry to the name it already has is accepted and
  performs a write that changes nothing. The intent is silent on this case; it is recorded here
  rather than asserted either way.
- **Ordering.** The stored palette keeps the order an operator arranged it in, and a rename
  moves the key in place rather than deleting and re-appending it. The *listing* returned by a
  read is sorted by name, so "keeps its order" is a property of the stored definition and is
  observed there.
- **Relationship to the palette colour model.** This story depends on the model in which an
  entry is exactly one colour and a reference carries a continuous position within that colour's
  family (delivered by the framework substrate capability). That model is what makes changing an
  entry a single edit, and what makes a reference count against its entry regardless of the
  position it sits at.
- **The write path.** Reads and writes go through the one validated write path every other
  editing surface uses, which is what makes the guards uniform across callers and what lets the
  whole of a rename cross the storage boundary as a single transition.

## Dependencies

None. (Consumed by the builder palette popup story, and by the colour-valued segment fields in
the copy-editing capabilities.)

## Story Points

3
