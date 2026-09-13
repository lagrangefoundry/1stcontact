---
uid: request-921ba107
id: REQ-242
type: request
title: A capture form sets acceptances
created_by: EPIC-10
created_at: '2026-09-13T22:01:59.672692+00:00'
updated_at: '2026-09-13T23:06:40.203304+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  depends_on:
  - request-a4186018
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-3db86587
  commits:
  - working_sha: 250e1fefec1fea0925ba6ae8ccd48921158bb375
    reconcile_sha: null
    main_sha: null
  version: 0.2.187
  story_points: 5
---

# A capture form sets acceptances

Pressing the button, and ticking the boxes beside it, record real acceptances against the
contact — as state a business can query, not as a blob inside one event's detail.

## 1. What is true today

`provenanceOfSubmission` (`apps/control-app/src/lead.ts`) builds
`consent: [{field, wording, answer}]` from every declared checkbox — ticked or not, which
is right, because *"a consent record built only from what arrived would be silent exactly
where 'they were asked and said no' is the fact worth having"* — and writes it into the
`form.submitted` event's `detail`.

That is good evidence and no state. Nothing reads it back. A checkbox is linked to nothing
but its own label, so there is no way to say that *this* box is the newsletter, and no way
to ask who is on it.

## 2. Two ways a form sets an acceptance

**Explicit — a checkbox.** The field gains a mapping to an acceptance key. The box's label
remains the wording, and remains what reaches the record as evidence.

**Implied — pressing the button.** A form declares acceptances that submitting it asserts.

**An implied acceptance carries its own wording, and that is not optional.** "Pressing the
button means you accepted the terms" is only true if the page said so beside the button.
So the config is not a list of keys; it is a list of `{key, wording}`, and the wording
reaches the event exactly as a checkbox's label does. An implied acceptance with no
wording is evidence-free, and is refused at validation rather than recorded as though it
meant something.

## 3. What a capture form structurally cannot do

**It cannot set a type 1 acceptance, and cannot make a member.**

This is a property of the module rather than a flag defaulted off, on [[BUG-86]]'s
reasoning: removing the ability to misconfigure beats documenting the correct setting.
A capture form takes an unknown address and produces a contact at `pipeline_stage = 'lead'`.
Becoming a member is `tos_accepted_at`, it is the sign-up flow's business, and sign-up is a
distinct flow with its own route and its own refusals — exactly as sign-in already is
(`account-chrome` + `sign-in.ts`), and for the same reason.

A config field that could grant membership from a public form is not written, so no
deployment can be one edit away from it.

## 4. What replaces the blob

The submission writes acceptance state and acceptance events through the service
([[REQ-240]]), and the `consent[]` array in `form.submitted`'s detail goes away.

**Replaced, not kept alongside.** Two records of one fact are two answers free to drift,
and CLAUDE.md forbids the legacy path. `form.submitted` keeps everything else it carries —
site, page, instance, submit label, the other answers — because that provenance is not
duplicated anywhere.

**Existing blobs are read, not migrated.** The volume is a beta's worth and the events are
immutable by trigger, so rewriting history is both impossible and unnecessary; what is
written from this ticket forward is state, and what was written before remains readable
where it is. A UAT pins that the old shape still renders on a timeline.

## 5. Acceptance criteria

1. A ticked box mapped to `newsletter` produces newsletter state the business can query,
   and a `contact_events` row carrying the box's label as the wording.
2. An unticked box mapped to an acceptance records that they were asked and said no, and
   leaves no acceptance granted.
3. A form declaring an implied acceptance records it on submit, with the wording from the
   config, and with no checkbox involved.
4. An implied acceptance declared without wording is refused at validation; the form does
   not publish and the failure names the key.
5. A second submission by the same address does not double-record an acceptance it already
   holds, and does record a new one it does not.
6. No configuration of a capture form can set a type 1 acceptance or produce a member.
   Asserted by attempting it.
7. `form.submitted` no longer carries `consent[]`, and still carries site, page, instance,
   submit label and the other submitted answers.
8. An event written before this ticket, carrying the old `consent[]` shape, still renders
   on a contact's timeline.
## 6. How it was built, and what each decision commits us to

Written during implementation. Nothing here changes §1–§5; it records the shape the
acceptance criteria above were satisfied in, and the behaviour that came along as a
technical consequence of them.

### 6.1 Two config settings, both closed over the same key set

`fields[].acceptance` is the explicit half and `accepts: [{key, wording}]` the implied
one. Both are `enum`s over one list — `newsletter`, `beta_requested`, `whitepapers` — so
**§3's refusal is the contract's and not a runtime check**: a document key is not a value
either setting will take, which is why AC6 is asserted by an attempt that fails rather
than by reading a flag.

That list is stated by the module (`contact-form/fields.ts`) rather than imported from
the registry, because the registry lives in `control-app` — it has to be readable from a
browser panel — and `packages/framework` is upstream of every app. The two are **different
facts**, not two copies of one: the registry answers *what keys exist and how each
behaves*, and the module answers *which of them a page anybody can post to may assert*.
What keeps the three spellings honest is a UAT at the seam plus the receiver's own guard —
`lead.ts` asks the registry whether a key it read out of a stored config is declared and
settable before recording anything under it, so drift is refused at the write.

### 6.2 The refusal names the key, which needed one framework addition

AC4 asks for a failure that names the key. The declarative validator reported
`config.accepts[1].wording`, which names a position an author does not think in. So
`BehaviorConfigSpec` gains **`itemKey`** — opt-in, per list — naming which item field
identifies an item in the paths its violations are reported under. `accepts` declares
`itemKey: 'key'` and the refusal reads `config.accepts[newsletter].wording`. Lists that do
not declare one are unchanged.

A second, smaller framework change came out of the same AC: **a string of nothing but
whitespace now counts as absent**, where before only `''` did. A required wording, label or
URL whose whole content is spaces supplies nothing, and `'   '` passing a contract every
consumer then has to trim and skip is the silent-acceptance shape this ticket is about. It
applies to every module's config, deliberately.

### 6.3 Where the wording lives, and where it is shown

An implied acceptance's wording is stored as the **evidence record** and is not itself the
rendered sentence — the same seam a field's `label` already sits on, where
`labelMode: 'visible'` leaves the words to be authored as an L1 text run. To keep §2's
claim true rather than merely recorded, **the vetted default presentation
(`l2/contact-form.ts`) emits a text run per declared acceptance above the submit control**,
so a form instantiated from configuration alone says on the page what it records. It is
ordinary L1: an author who replaces that subtree owns keeping the two in step, exactly as
they already do for every visible label.

### 6.4 An acceptance mapping is read only on a checkbox

`fields[].acceptance` is honoured on a `checkbox` and on nothing else. A mapping on a text
field would be this module inventing what typing something into a box consents to, so
there is no reading of one; the contract cannot express "only on this type", so the rule is
stated beside the declaration and in the receiver.

### 6.5 What happens to an unnamed checkbox

§4 deletes `consent[]`, which carried **every declared checkbox, ticked or not**. A box
mapped to an acceptance is better served by state — its no is `granted = false` — but a box
nobody mapped would have lost its answer entirely, so:

- a **named** box leaves the provenance bag altogether (two records of one fact are two
  answers free to drift);
- an **unnamed** box stays in `fields` as an ordinary answer, and is recorded for every
  declared box whether or not anything arrived for it — `'yes'` or `''`.

So the insight the blob was built on survives intact, and nothing is lost by its deletion.
This is what AC7's *"the other submitted answers"* is read to include.

### 6.6 What is recorded, and what is not

- An **unticked box on a key there is nothing to take back** records nothing. A request
  they did not make did not happen, and a document acceptance is not the contact's to
  revoke, so there is no "no" to store. Only a revocable key — a preference — carries one.
- A **request has no state, so it is recorded on every submission.** "They asked for the
  papers" is a thing that happened and asking twice is two facts; the at-most-once rule
  that stops them being *sent* twice is the message ledger's and stays there. AC5's
  no-double-record is therefore about the keys that hold state.
- The submission reads what the contact already holds **once**, and writes only what
  changes — which is why AC5 has two halves in one case: a rule reading the contact rather
  than the key satisfies either half alone.
- Acceptances are recorded **after `form.submitted` and before any delivery**. The press is
  what asserts them; a download is a consequence of the press.
- Nothing on this path can lose a lead: every intent is filtered into a shape the
  acceptance service accepts before it is called, and a key that cannot be set is reported
  to the log (`lead_acceptance_not_recorded`) rather than thrown.

### 6.7 AC4's reach, stated honestly

"The form does not publish" holds because **the config cannot be written**: the refusal is
in `validateBehaviorInstance`, which `1c module add` and `1c module set` both run, and a
config that cannot be written cannot be published. It is *not* enforced at the publish gate
itself — `validateSite` does not validate module config for any module today, and widening
it is a cross-cutting change that could refuse sites that currently publish. That is a
pre-existing gap this ticket does not close and does not widen. Defence in depth covers the
one case it leaves: a malformed `accepts` entry already frozen into a revision is skipped
at read (`acceptsIn`) rather than recorded as though it meant something, because an
acceptance nobody can be shown to have given is worse than none.