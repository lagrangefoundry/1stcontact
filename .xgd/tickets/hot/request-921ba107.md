---
uid: request-921ba107
id: REQ-242
type: request
title: A capture form sets acceptances
created_by: EPIC-10
created_at: '2026-09-13T22:01:59.672692+00:00'
updated_at: '2026-09-13T22:01:59.672692+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  depends_on:
  - request-a4186018
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
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
