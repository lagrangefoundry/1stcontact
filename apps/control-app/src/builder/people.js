/**
 * The User tab — the people of the business that is open ([[REQ-170]], [[DOC-42]]).
 *
 * THE SAME TAB FOR EVERY BUSINESS, and that is the whole point of it. Open the
 * 1st Contact business and the rows are our customers; open a customer's and they
 * are that customer's customers. Nothing here branches on which business it is,
 * and nothing here may learn: the list comes from `/api/people`, which is scoped
 * by the selected business, so a people list that behaved differently for the
 * platform would have to be written deliberately. [[DOC-40]] §2.1 rule 1.
 *
 * EVERY ROW IS A CONTACT, AND THE COLUMNS BESIDE IT ARE TWO SEPARATE AXES
 * ([[DOC-44]] §2, §3, [[REQ-188]]). This is the distinction two drafts of the
 * model got wrong in two different ways, and the reason this file names it out
 * loud:
 *
 * - **contact** — the row itself. Not a state, not a stage: the population this
 *   tab lists, whatever else is true of anybody in it.
 * - **access** — *Member* when `termsAcceptedAt` is set, meaning they signed up
 *   and may log in. The control over the login ITSELF is `status`, which `admit`
 *   refuses on, and which is a third thing again.
 * - **pipeline** — *Lead* → *Invited* → …, read from the stored `pipelineStage`.
 *   Where the relationship stands, which does not answer and is not answered by
 *   whether they can sign in.
 * - **operator** — may RUN a business. `memberships`, and usually a DIFFERENT
 *   business: viewed from 1st Contact, Alice's row shows Alice's Plumbing here.
 * - **entitled** — granted access to a thing. Per grant, and each names its
 *   business.
 *
 * TWO COLUMNS AND TWO FACETS, NOT ONE OF EACH. The earlier fix put three values
 * on one line and could not draw a member who was never invited, nor a lead who
 * is neither — both of which exist ([[DOC-44]] §3). Two axes drawn separately is
 * not a richer presentation of the same fact; it is the only presentation that
 * can show the fact at all.
 *
 * BEING IN THE LIST IS NOT THE MEMBER RELATION — being signed up is. There is
 * still no membership toggle beside a row, because `memberships` answers a
 * different question: withdrawing one takes away the right to run a business and
 * deliberately leaves that person's own Portal reachable.
 *
 * TWO CONTROLS, BECAUSE THERE ARE TWO ACTS ([[REQ-199]]). `+` ADDS a contact and
 * does nothing else — the new row is a **Lead**, no mail is sent — and that is
 * the more basic of the two, because most contacts are never invited at all. The
 * tab could not do it until [[REQ-199]]: inviting was insert-or-update and was
 * therefore the only way to create anybody, so recording a person necessarily
 * also asked them to sign up.
 *
 * AND THE INVITE IS THE VERB THAT MOVES THE PIPELINE ([[REQ-186]], [[REQ-199]],
 * [[DOC-42]] §9) — from Lead to **Invited**, and no further, and along that axis
 * only. It acts on the CHECKED SET rather than on an address typed into a form,
 * and it now really sends mail: one message per contact, each with exactly one
 * recipient, to that contact's primary address. It is one control for both
 * levels: it writes into whichever business is open, so from 1st Contact it
 * moves Alice and from Alice's it moves Bob, which is why it is a button on this
 * uniform tab rather than a platform console. What it cannot do is make a
 * member. Only the person themselves does that, by accepting the terms, and the
 * tab reflects it with no operator action at all.
 *
 * STANDARD `webui/split` + `webui/list-detail`, CONFIGURED RATHER THAN REBUILT,
 * exactly as the Library uses them. What is written here is the three functions
 * the component asks for: how a row looks, what a detail contains, and what the
 * filter means.
 */

import { mountFields } from '@lagrangefoundry/webui-fields'
import { mountListDetail } from '@lagrangefoundry/webui-list-detail'
import { createModalShell, modalButton, modalFooter } from './modal.js'
import { EMAIL_SHAPE_ERROR, isEmailShape } from './email-shape.js'
import {
  CHANGED,
  displayNameOf,
  formerlyLabel,
  greetingOf,
  NAME_PARTS,
  NO_NAME_YET,
} from './people-name.js'
import {
  ACCESS_STATES,
  PIPELINE_STAGES,
  accessLabel,
  accessOf,
  isMember,
  stageLabel,
  stageOf,
} from './people-axes.js'
import { eventLabel } from './contact-events.js'
import {
  addContact,
  fetchInviteDraft,
  fetchPeople,
  fetchPerson,
  fetchPersonMessages,
  invitePeople,
  openGrant,
  provisionBusinessFor,
  revokeGrant,
  savePersonRecord,
} from './api.js'

/**
 * The record: two fields the operator owns, and seven the system does
 * ([[BUG-54]]).
 *
 * WHO THEY ARE IS EDITABLE; WHAT HAPPENED TO THEM IS NOT. The address and the
 * name are the operator's own answer to a question only they can answer — a
 * typo in an invited address, a person who has since said what to call them —
 * and there is nowhere else in the product to correct either. Everything else
 * here is something the system OBSERVED: when it asked, when they first came
 * through the door, when they last did, when they accepted the terms, when the
 * row was written. A box inviting an operator to retype one of those is a box
 * inviting them to falsify the record, and the record is what [[DOC-42]] §4's
 * three states are derived from.
 *
 * `locked` AND NOT A NARROWER `editable` LIST AT THE MOUNT. The two are not the
 * same claim. `editable` is the viewer's override — this surface, today, does
 * not offer these — and `locked` is the schema's hard ceiling, which no viewer
 * override can lift (webui-fields §9). These fields are the second: not a
 * permission this panel happens to withhold, but a property of the fields
 * themselves, which a second viewer of the same schema inherits without having
 * to remember to.
 *
 * AND THE PREVIOUS SPELLING OF THIS DID NOTHING. `{ editable: true }` on a
 * descriptor was written to mean "only this one", but the descriptor axis is
 * `locked`/`defaultEditable` — `editable` is read only off the mount options,
 * where this panel was already passing a blanket `true`. So every field was
 * editable and the line that looked like it was restricting them was inert.
 *
 * `access` IS DERIVED AND HAS NO COLUMN. {@link accessOf} reads
 * `termsAcceptedAt`; there is nothing behind it to write, so it is locked for a
 * reason stronger than policy.
 *
 * `stage` DOES HAVE A COLUMN AND IS STILL LOCKED, which is the one entry here
 * that is a policy rather than a physical fact. It is written by the invite,
 * because moving somebody along the pipeline is an ACT and this pane corrects
 * who somebody is ([[DOC-44]] §4). When a third stage exists there will be a
 * control that moves it, and it will be a button with a meaning rather than a
 * text box on a record.
 *
 * `status` IS LOCKED HERE AND STILL LIVE ON THE SERVER. It is the login control
 * ([[DOC-42]] §5) and `/api/people/status` still answers, but this tab no
 * longer offers it — so today nothing in the UI suspends a sign-in.
 */
const RECORD_FIELDS = [
  {
    name: 'email',
    label: 'Email',
    // `required` IS WHAT REFUSES AN EMPTY BOX. Validation is skipped for an
    // empty value unless the field is required, so without this, clearing the
    // address would pass the shape check by never reaching it.
    required: true,
    validate: (value) => (isEmailShape(value) ? null : EMAIL_SHAPE_ERROR),
  },
  // THE TWO AXES, ADJACENT AND SEPARATE ([[DOC-44]] §3). Beside them `invitedAt`
  // says WHEN we asked and `termsAcceptedAt` says when they came — the acts the
  // two axes are the current answer to, which is why all four are worth a row.
  { name: 'stage', label: 'Pipeline', locked: true },
  { name: 'access', label: 'Access', locked: true },
  { name: 'status', label: 'May sign in', locked: true },
  { name: 'invitedAt', label: 'Invited at', locked: true },
  { name: 'firstSeenAt', label: 'First seen', locked: true },
  { name: 'lastSeenAt', label: 'Last seen', locked: true },
  { name: 'termsAcceptedAt', label: 'Terms accepted', locked: true },
  { name: 'createdAt', label: 'Created', locked: true },
]

/**
 * Their name — its own section, and every box optional but the first
 * ([[REQ-193]]).
 *
 * A SECTION AND NOT SEVEN MORE ROWS UNDER "WHO THEY ARE". The address, the two
 * axes and the stamps are facts the SYSTEM observed; the name is the one thing
 * on this pane the operator authors, and they will be back in it — correcting a
 * spelling, adding the Dr, writing down that Robert is Bob. Mixed into the
 * observations it is seven editable boxes hidden among eight locked ones.
 *
 * BUILT FROM `NAME_PARTS`, so a part added to the model appears here without
 * this file being edited — the rule the pipeline facet already follows, and the
 * reason the name-change dialog below can be the same list a second time without
 * being a second copy.
 *
 * `greeting` AND `formerly` ARE DERIVED AND LOCKED, and they are here rather
 * than nowhere because both are otherwise invisible. The greeting is the
 * highest-frequency read in the whole record and an operator filling in
 * `knownAs` has no other way to see what it did; `formerly` is what the search
 * below will match on, and a row found by a name that is nowhere on the screen
 * is a search result that looks like a bug.
 */
const NAME_FIELDS = [
  ...NAME_PARTS.map((part) => ({ name: part.name, label: part.label })),
  { name: 'greeting', label: 'Greeting', locked: true },
  { name: 'formerly', label: 'Formerly', locked: true },
]

const EMPTY_DETAIL = 'Select a person.'

/**
 * The blank pane's copy, and the ELEMENT it has to be wrapped in ([[BUG-70]]).
 *
 * `emptyDetail` is documented `HTMLElement` and is handed straight to
 * `replaceChildren`, so a bare string arrives as a bare TEXT NODE: unboxed,
 * therefore unstyled, and displacing the component's own `.list-detail-empty`
 * fallback on the way in. `emptyPane()` is called per mount rather than held as
 * a module constant because a node can only be in one document at a time.
 */
const emptyPane = () => el('p', 'builder-empty', EMPTY_DETAIL)

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

/**
 * One facet over one axis.
 *
 * A FUNCTION BECAUSE THERE ARE TWO OF THEM AND THERE WILL BE MORE ([[DOC-44]]
 * §3 names a third axis, *customer*, and §7 records that it has nothing to read
 * until there is a payments table). Written out twice, the second copy is where
 * the "any" option quietly acquires a different value from the first and the
 * clear-the-filter path stops working on one of them.
 *
 * THE EMPTY VALUE IS "no opinion", never a value of the axis. It is what an
 * unfiltered list means and it is why {@link matches} tests the filter before it
 * compares.
 */
function facetSelect(axis, anyLabel, values, labelOf, onChange) {
  const select = document.createElement('select')
  // ONE CLASS FOR BOTH, AND THE AXIS IN A DATA ATTRIBUTE. They are the same
  // control twice over, so they take the same rule; what differs is which
  // question the select asks, and that is data about the element rather than a
  // second appearance for the sheet to describe. A class per axis would be a
  // class per axis with no rule behind it, which is the shape [[BUG-53]]'s sweep
  // exists to catch.
  select.className = 'builder-people__facet'
  select.dataset.axis = axis
  const any = document.createElement('option')
  any.value = ''
  any.textContent = anyLabel
  select.append(any)
  for (const value of values) {
    const option = document.createElement('option')
    option.value = value
    option.textContent = labelOf(value)
    select.append(option)
  }
  select.addEventListener('change', () => onChange(select.value))
  return select
}

/**
 * The two axes as the record pane shows them: labels, not stored values.
 *
 * DERIVED AT THE POINT OF DISPLAY and never merged into the person the panel is
 * holding, so `detail.person.pipelineStage` stays the value the server sent. A
 * pane that overwrote it with `'Lead'` would send that word back the next time
 * anything posted the record.
 */
function axisValues(person) {
  return { stage: stageLabel(stageOf(person)), access: accessLabel(accessOf(person)) }
}

/**
 * The name pane's values: the seven parts, flattened, plus the two derived rows.
 *
 * FLATTENED BECAUSE THE FIELDS ARE FLAT AND THE MODEL IS NOT. A name is a record
 * on the server ([[REQ-193]]) and the widget commits one named field at a time,
 * so this is the one place the two shapes meet — and it is the same flattening
 * the transport posts back, which is why the route can gather the parts again
 * without the client ever knowing a name is a row.
 *
 * A PERSON WITH NO NAME GETS EMPTY BOXES, not absent ones. Every part is
 * optional and the pane is where one gets written for the first time, so there
 * is nothing to hide.
 */
function nameValues(person) {
  const values = {}
  for (const part of NAME_PARTS) values[part.name] = person.name?.[part.name] ?? ''
  const greeting = greetingOf(person)
  values.greeting = greeting ? `Hi ${greeting},` : NO_NAME_YET
  values.formerly = formerlyLabel(person.formerNames) ?? ''
  return values
}

/**
 * The two axes, defined once in `people-axes.js` and re-exported here.
 *
 * RE-EXPORTED RATHER THAN REDEFINED. The rules are model facts ([[DOC-44]] §3)
 * and are asserted on both sides of the seam — the labels this panel draws, and
 * the `users` row a workers test reads back — so each may have exactly one
 * definition.
 */
export { accessOf, stageOf }

/**
 * What the name column says for somebody who has none yet ([[REQ-189]]).
 *
 * IT IS A SENTENCE AND NOT A DASH, because a blank or a glyph reads as a column
 * that is broken rather than as a fact about the person, and the wording says
 * which of the two it is. It also covers the row whose name has been REDACTED
 * ([[REQ-193]], [[DOC-37]]): erasure clears the text and keeps the row, and what
 * is left has to read as "no name" rather than as a rendering fault.
 *
 * DEFINED IN `people-name.js` AND RE-EXPORTED HERE, the same way the two axes
 * are: the resolver that decides an empty displayed name means "none" and the
 * string that says so belong together, and the evidence asserts the string
 * rather than restating it.
 */
export { NO_NAME_YET }

/**
 * The list row: the name, the address, where they stand, and whether they are in.
 *
 * THE NAME AND THE ADDRESS ARE TWO CELLS, not one with a fallback ([[REQ-189]]).
 * The row used to print `displayName || email`, which meant a person WITH a name
 * lost their address off the list — and, because nothing sets names yet, meant
 * the list read as addresses only and its name column was invisible.
 *
 * THE STAGE IS DRAWN BY WHATEVER {@link stageLabel} RETURNS and this row branches
 * on none of them — nor does any rule styling it. The set of stages grows
 * ([[DOC-44]] §4, §7); a pill styled per label, or a row that special-cased one,
 * is what would have had to be found and edited the day it did.
 *
 * ACCESS IS A BADGE AND NOT A CELL, because it is a different KIND of fact from
 * the stage rather than a second value of the same kind. Drawn only when they
 * are in, on the idiom the suspended pill below already uses: what an operator
 * scans this list for is who signed up, and a column reading "Not a member"
 * against most rows would spend the eye's attention on the ordinary case.
 */
function renderRow(person, bounced = new Set(), selection = null) {
  const row = el('div', 'builder-people__row')
  // THE CHECKBOX IS PART OF THE ROW AND NOT A COLUMN BESIDE IT ([[REQ-199]]).
  // `list-detail` renders one content cell per row, so the tick has to live
  // inside it — and it stops its own clicks, because ticking somebody is not
  // selecting them: an operator checks five rows while reading a sixth, and a
  // tick that also moved the detail pane would make that impossible.
  if (selection) {
    const box = document.createElement('input')
    box.type = 'checkbox'
    box.className = 'builder-people__check'
    box.checked = selection.has(person.id)
    // AN ACCESSIBLE NAME, because a bare checkbox in a list of them is announced
    // as "checkbox" and nothing else. The person is who it is about.
    box.setAttribute('aria-label', `Select ${displayNameOf(person) || person.email || person.id}`)
    box.addEventListener('click', (ev) => ev.stopPropagation())
    box.addEventListener('change', () => selection.toggle(person.id, box.checked))
    row.append(box)
  }
  const shown = displayNameOf(person)
  const name = el('span', 'builder-people__who', shown || NO_NAME_YET)
  if (!shown) name.classList.add('builder-people__noname')
  row.append(name)
  // WHY THIS ROW MATCHED, WHEN IT MATCHED ON A NAME THAT IS NO LONGER THE NAME
  // ([[REQ-193]]). Searching *Sarah Jones* returns the row that now says *Sarah
  // Patel*, and without this the operator is looking at a result they cannot
  // account for. Only names the server marked `changed` ever arrive here.
  const formerly = formerlyLabel(person.formerNames)
  if (formerly) row.append(el('span', 'builder-people__formerly', formerly))
  row.append(el('span', 'builder-people__email', person.email))
  row.append(el('span', 'builder-people__stage', stageLabel(stageOf(person))))
  if (isMember(person)) {
    // THE CLASS NAMES THE AXIS AND NOT THE VALUE. `builder-people__member` would
    // be a hook a stylesheet could branch on, which is the rule [[REQ-189]] holds
    // this tab to: the decision about WHICH value gets a badge is made here, in
    // one line, and the sheet only ever describes a badge.
    row.append(el('span', 'builder-people__access', accessLabel(accessOf(person))))
  }
  if (person.status !== 'active') {
    // THE ACCENT IS SPENT ON THE EXCEPTION. Nearly every row is `active`, so a
    // pill saying so would fire everywhere and mean nothing; what an operator
    // needs to see at a glance is the person who can no longer sign in.
    row.append(el('span', 'builder-people__suspended', person.status))
  }
  if (bounced.has(person.id)) {
    // A BAD ADDRESS IS VISIBLE FROM THE LIST ([[REQ-198]], [[REQ-199]]). It is
    // the most valuable signal a beta produces and it is worth nothing if it
    // takes a click to find — so it is a pill on the row, on the same idiom the
    // suspended one uses, and for the same reason: it fires on the exception.
    row.append(el('span', 'builder-people__bounced', 'bounced'))
  }
  return row
}

/**
 * When something happened, said shortly.
 *
 * TRIMMED FROM THE ISO STRING RATHER THAN FORMATTED. A locale-formatted date is
 * a second reading of a value the record pane already shows verbatim, and the
 * two would disagree about the timezone the moment anybody looked. This is the
 * same string with the seconds and the `Z` dropped, which is what a list needs.
 */
export function shortWhen(iso) {
  if (typeof iso !== 'string' || iso.length < 16) return iso ?? ''
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`
}

/**
 * One message, as the detail pane lists it ([[REQ-198]]).
 *
 * THE STATUS IS AN ATTRIBUTE AND NOT A CLASS PER VALUE, the idiom the facets
 * above already use: one rule describes a status pill, and the sheet says which
 * of the five deserves an accent. A class per value would be five hooks for a
 * decision that belongs in one place.
 *
 * A FAILURE PRINTS ITS REASON. "Failed" alone tells an operator nothing about
 * whether pressing Invite again will help; "domain not verified" and "mailbox
 * full" call for opposite actions, and the reason is on the record precisely so
 * it can be read here.
 */
function messageLine(message) {
  const line = el('li', 'builder-people__message')
  line.append(el('span', 'builder-people__msgsubject', message.subject || '(no subject)'))
  line.append(el('span', 'builder-people__msgwhen', shortWhen(message.queuedAt)))
  const status = el('span', 'builder-people__msgstatus', message.status)
  status.dataset.status = message.status
  line.append(status)
  if (message.failure) {
    line.append(el('span', 'builder-people__msgfailure', message.failure))
  }
  return line
}

/**
 * What one invite did, said in one sentence ([[REQ-199]]).
 *
 * EVERY SELECTED CONTACT GETS A LINE, including the ones that worked. A report
 * that listed only the failures would leave "nine sent" to be inferred from an
 * absence, and the operator's actual question after pressing Send is *did it go
 * to everybody I ticked* — which is answered by counting lines, not by trusting
 * that nothing was omitted.
 *
 * A REFUSAL NAMES THE PERSON AND THE REASON. "One contact could not be sent to"
 * against a list of ten cannot be acted on; the whole value of refusing rather
 * than guessing an address is that the operator is told which row to go and fix.
 *
 * PURE AND EXPORTED, because this is the claim the ticket makes about what the
 * operator is shown, and it is provable without a DOM.
 */
export function describeOutcome(result) {
  const who = result?.who || result?.contactId || 'someone'
  if (result?.status === 'refused') {
    return { status: 'refused', text: `${who}: not sent — ${result.reason ?? 'refused'}` }
  }
  if (result?.status === 'failed') {
    return { status: 'failed', text: `${who}: failed — ${result.reason ?? 'the provider refused it'}` }
  }
  return { status: 'sent', text: `${who}: sent to ${result?.to ?? ''}`.trim() }
}

/** The report, one line per selected contact, in the order they were sent. */
function outcomeLines(results) {
  return results.map((result) => {
    const said = describeOutcome(result)
    const line = el('p', 'builder-people__outcome', said.text)
    // THE STATUS IS AN ATTRIBUTE AND NOT A CLASS PER VALUE, the idiom the
    // message list and the facets already use: one rule describes an outcome
    // line, and the sheet says which of the three deserves an accent.
    line.dataset.status = said.status
    return line
  })
}

/**
 * The two relations, joined on the key they share ([[REQ-189]], [[DOC-42]] §4).
 *
 * ONE ROW PER BUSINESS, AND THE MISMATCHES ARE THE POINT. Operator and entitled
 * are different relations, but since [[REQ-184]] an entitlement's OBJECT is a
 * business and a membership is on a business — so they share a key, and the
 * shape that tells the truth is one row per business carrying both sets of
 * facts. Presented as two tables, the reader has to do this join in their head
 * and the two states worth seeing are exactly the ones that vanish: a business
 * operated with no live grant is the lapsed customer, and a grant against a
 * business somebody does not operate is a support arrangement or a mistake.
 * Joined, each is an empty cell on a row that is otherwise filled in — which is
 * [[REQ-178]]'s argument for keeping a lapsed business visible in the switcher
 * rather than dropping it, applied one surface along.
 *
 * OPERATED BUSINESSES KEEP THEIR ORDER AND GRANT-ONLY ONES FOLLOW. The origin
 * already orders memberships by when they were granted, and a grant with no
 * membership is the exception — so it sorts to the end rather than interleaving
 * into an order the operator learned to read.
 *
 * PURE, and exported for that reason: this is the claim the ticket makes, and it
 * is provable without a DOM.
 *
 * @param {Array<{businessId: string, name?: string|null}>} operates
 * @param {Array<{businessId: string, businessName?: string|null}>} grants
 */
export function joinBusinesses(operates = [], grants = []) {
  const rows = []
  const byId = new Map()
  const bucket = (businessId, name) => {
    let row = byId.get(businessId)
    if (!row) {
      row = { businessId, name: name ?? null, membership: null, grants: [] }
      byId.set(businessId, row)
      rows.push(row)
    } else if (row.name == null && name != null) {
      row.name = name
    }
    return row
  }
  for (const business of operates) bucket(business.businessId, business.name).membership = business
  for (const grant of grants) bucket(grant.businessId, grant.businessName).grants.push(grant)
  return rows
}

/**
 * A stamp, as this pane prints every stamp ([[REQ-195]]).
 *
 * THE STORED VALUE, TRIMMED — never `toLocaleString`. The record fields above
 * print `invitedAt`, `firstSeenAt` and the rest exactly as the server sent them,
 * so a history in the reader's own timezone beside a record in UTC would put two
 * different clocks in one pane and invite an operator to compare them. Seconds
 * and the `T` go because nobody reads either; the day and the minute stay.
 *
 * A VALUE IT CANNOT PARSE COMES BACK WHOLE rather than blank. This is a log, and
 * a row whose time renders as nothing is indistinguishable from a row that
 * failed to load.
 */
export function formatWhen(iso) {
  const value = String(iso ?? '')
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
    ? `${value.slice(0, 10)} ${value.slice(11, 16)}`
    : value
}

/**
 * One line of history: what happened, when, and — only when they differ — when
 * we learned of it ([[REQ-195]]).
 *
 * THE SECOND STAMP IS SHOWN ONLY WHEN IT IS NEWS. `occurredAt` and `recordedAt`
 * are the same value for everything this system does itself, so printing both
 * every time would put a redundant clause on every row and train the eye to skip
 * the region where the one interesting case — an imported signup that happened
 * in March, a bounce we heard about a day late — actually appears.
 *
 * PURE AND EXPORTED, because that difference is the claim and it is provable
 * without a DOM.
 */
export function describeEvent(event) {
  const when = formatWhen(event?.occurredAt)
  const learned = formatWhen(event?.recordedAt)
  return { label: eventLabel(event?.kind), when, learned: learned === when ? null : learned }
}

/**
 * The columns, declared once so the headings and the cells cannot drift apart.
 *
 * FIVE AND NOT SIX: withdrawing a grant is an action ON that grant's status, so
 * the control sits in the status cell rather than buying a sixth column that
 * could only ever carry a blank heading.
 */
const BUSINESS_COLUMNS = ['Business', 'Role', 'Plan', 'Access', 'Status']

/** How long a grant runs, said the way an operator asks it. */
function windowOf(grant) {
  return grant.endsAt ? `until ${grant.endsAt}` : 'open-ended'
}

function cell(row, tag, className, text) {
  const node = el(tag, className, text)
  row.append(node)
  return node
}

/** A cell whose emptiness is the fact — said in words, never left blank. */
function absence(row, text, span) {
  const node = cell(row, 'td', 'builder-people__none', text)
  if (span) node.colSpan = span
  return node
}

/**
 * The joined table ([[REQ-189]]).
 *
 * A REAL `<table>`, because it is one: five headed columns of like values, and a
 * grid of `<div>`s would be the same picture with none of the row/column
 * relationships a screen reader reads out. The business and role cells `rowSpan`
 * across a business's grants, so two grants on one business read as two grants
 * on ONE business rather than as two businesses that happen to share a name.
 *
 * EVERY EMPTY CELL SAYS WHY IT IS EMPTY. A truly blank cell is indistinguishable
 * from a value that failed to load, and these two blanks are the states the
 * table exists to show — so "not an operator" and "no grant" are written out.
 */
function businessTable(rows, onRevoke) {
  const table = el('table', 'builder-people__table')
  const head = el('thead')
  const headings = el('tr')
  for (const label of BUSINESS_COLUMNS) cell(headings, 'th', 'builder-people__col', label)
  head.append(headings)
  table.append(head)

  const body = el('tbody')
  for (const business of rows) {
    // At least one line per business: a business with no grant is a row, not an
    // omission — it is the lapsed customer, which is the whole point.
    const lines = business.grants.length > 0 ? business.grants : [null]
    lines.forEach((grant, index) => {
      const line = el('tr', 'builder-people__businessrow')
      if (index === 0) {
        const name = cell(
          line,
          'td',
          'builder-people__name',
          // The id when the name is unknown — a dangling grant still has to say
          // WHICH business, and the id is the only handle left.
          business.name || business.businessId,
        )
        const role = business.membership
          ? cell(line, 'td', 'builder-people__role', business.membership.role)
          : absence(line, 'Not an operator')
        if (business.membership?.revokedAt) {
          role.append(el('span', 'builder-people__revoked', 'withdrawn'))
        }
        name.rowSpan = lines.length
        role.rowSpan = lines.length
      }
      if (!grant) {
        absence(line, 'No grant', 3)
      } else {
        cell(line, 'td', 'builder-people__plan', grant.plan)
        cell(line, 'td', 'builder-people__window', windowOf(grant))
        const status = cell(line, 'td', 'builder-people__grantstatus', grant.status)
        if (grant.status !== 'revoked') {
          const withdraw = el('button', 'builder-people__revokegrant', 'Withdraw')
          withdraw.type = 'button'
          withdraw.addEventListener('click', () => void onRevoke(grant.id))
          status.append(withdraw)
        }
      }
      body.append(line)
    })
  }
  table.append(body)
  return table
}

export function createPeoplePanel(options = {}) {
  /**
   * The transport, MERGED OVER THE DEFAULTS rather than replaced by them.
   *
   * A host — or a suite — that supplies some of these must still get the rest,
   * because the alternative is that adding a call here silently breaks every
   * caller that wrote its object before the call existed. It breaks in the worst
   * way, too: the panel renders, the new section reports that it could not read
   * anything, and nothing says the object was simply short a key.
   */
  const { storage } = options
  const transport = {
    list: fetchPeople,
    item: fetchPerson,
    messages: fetchPersonMessages,
    saveRecord: savePersonRecord,
    grant: openGrant,
    revoke: revokeGrant,
    add: addContact,
    inviteDraft: fetchInviteDraft,
    invite: invitePeople,
    fulfil: provisionBusinessFor,
    ...(options.transport ?? {}),
  }

  const element = el('div', 'builder-people')

  /** Everyone in this business. The filter narrows this; it never re-fetches. */
  let all = []
  let canFulfil = false
  let canInvite = false
  /**
   * The contacts holding a bounced message, as `/api/people` reported them.
   *
   * A SET BESIDE THE ROWS RATHER THAN A FIELD ON THEM. The rows are the identity
   * schema's shape and this is a fact from the ticket store; merging it in would
   * put a field on `person` that is sometimes there, and every other reader of a
   * person would inherit the ambiguity.
   */
  let bounced = new Set()
  /**
   * The checked rows ([[REQ-199]]).
   *
   * IDS AND NOT ROWS, so it survives every redraw the list makes. `setItems`
   * rebuilds every row on a filter change and on a refresh, and a selection held
   * as element references would be emptied by both — silently, which is the
   * worst possible way for a multi-select to fail: the operator ticks five
   * people, types in the search box, and sends to whoever is left.
   *
   * PRUNED AGAINST THE LIST ON EVERY REFRESH, and deliberately NOT against the
   * filter. Filtering hides rows and does not unselect them — an operator who
   * narrows to *Leads*, ticks four, then clears the filter still means those
   * four — but a person who has left the business entirely is an id that can no
   * longer be sent to, and keeping it would put a refusal in every later send.
   */
  const selected = new Set()
  const filter = { text: '', stage: '', access: '' }

  const controls = el('div', 'builder-people__filter')
  const search = document.createElement('input')
  search.type = 'search'
  search.className = 'builder-people__search'
  search.placeholder = 'Search people'
  search.addEventListener('input', () => {
    filter.text = search.value.trim().toLowerCase()
    apply()
  })
  controls.append(search)

  /**
   * One list, faceted twice — never tabs, and never one facet over both axes.
   *
   * SEPARATE LISTS ARE THE THING RULED OUT ([[DOC-42]] §9), not separate views.
   * Contacts are one population and the invite moves a row along an axis, so a
   * facet keeps the person who is several things at once from appearing twice or
   * disagreeing with themselves.
   *
   * TWO SELECTS BECAUSE THERE ARE TWO QUESTIONS ([[DOC-44]] §3). Merged into one
   * list of options they would read as alternatives, and the two most useful
   * queries an operator has would both become unaskable: *who did I ask who never
   * came* is Invited AND not a member, and *who signed up that I never asked* is
   * a member AND still a lead. Independent facets ask them by construction; a
   * single facet cannot express either.
   *
   * BUILT FROM THE DECLARED VALUES, so a stage added to the model appears here
   * without this file being edited — and, more to the point, so a value can never
   * be shown by a row and be unreachable by the filter.
   */
  controls.append(
    facetSelect('pipeline', 'Any stage', PIPELINE_STAGES, stageLabel, (value) => {
      filter.stage = value
      apply()
    }),
  )
  controls.append(
    facetSelect('access', 'Anyone', ACCESS_STATES, accessLabel, (value) => {
      filter.access = value
      apply()
    }),
  )

  /**
   * ADD, beside the filter — the fundamental act ([[REQ-199]]).
   *
   * A `+` AND NOT A WORD, because it sits in a row of filter chrome and its
   * meaning is the one every list in every product gives it. Its accessible name
   * is the sentence the glyph is short for; a control announced as "plus" is a
   * control a screen reader user has to guess at.
   *
   * IT MAKES A PERSON, so it cannot hang off one. The detail pane edits somebody
   * who already exists; this is the list's own action and it belongs where the
   * list's own controls are — the same argument the invite makes below.
   *
   * SHOWN ON THE SAME CONDITION AS THE INVITE, `canInvite` — *you own this
   * business* ([[DOC-42]] §7), which is true of Alice on hers. Not rendering it
   * is not the gate: `/api/people/add` asks the same question again for itself.
   */
  const add = el('button', 'builder-people__add', '+')
  add.type = 'button'
  add.hidden = true
  add.title = 'Add a contact'
  add.setAttribute('aria-label', 'Add a contact')
  add.addEventListener('click', () => openAdd())
  controls.append(add)

  /**
   * The invite, beside the filter rather than inside a person's detail.
   *
   * IT ACTS ON THE CHECKED SET ([[REQ-199]]). It used to open a form that took
   * an address, which made inviting the only way to create a contact; now adding
   * is its own control and this one asks people who are already here.
   *
   * DISABLED WITH NOTHING CHECKED, AND NOT ABSENT. A control that vanishes
   * teaches nothing — an operator who has never used the tab has no way to
   * discover that ticking rows is what makes inviting possible. Disabled, the
   * button is visible, its tooltip says what it needs, and the relationship
   * between the two is learnable by looking.
   *
   * SHOWN ON ONE CONDITION AND IT IS NOT "ADMIN" ([[DOC-42]] §7). `canInvite` is
   * *you own this business*, which is true of Alice on hers — so the same button
   * appears on the same tab at both levels, and who it reaches is decided by
   * which business is open rather than by anything this file knows ([[DOC-42]]
   * §3).
   *
   * NOT RENDERING IT IS NOT THE GATE, the same as the fulfilment control below:
   * `/api/people/invite` asks the same question again for itself, because a
   * control merely absent from a page is not refused to anyone who can type a URL.
   */
  const invite = el('button', 'builder-people__invite', 'Invite')
  invite.type = 'button'
  invite.hidden = true
  invite.addEventListener('click', () => openInvite())
  controls.append(invite)

  /**
   * The selection's one write path, so the button and the boxes cannot disagree.
   *
   * EVERY TICK GOES THROUGH HERE and every path that changes the set ends in
   * {@link syncInvite}. Written as two lines at each of four call sites, the
   * fifth call site is where somebody forgets the second one and the Invite
   * button stays disabled over a full selection.
   */
  const selection = {
    has: (id) => selected.has(id),
    toggle(id, on) {
      if (on) selected.add(id)
      else selected.delete(id)
      syncInvite()
    },
  }

  /** What the Invite button says and whether it may be pressed. */
  function syncInvite() {
    const n = selected.size
    invite.disabled = n === 0
    invite.textContent = n === 0 ? 'Invite' : `Invite ${n}`
    invite.title =
      n === 0 ? 'Tick one or more contacts to invite them.' : `Invite ${n} selected contact${n === 1 ? '' : 's'}.`
  }

  /**
   * ADD: an address, an optional name, and nothing else happens ([[REQ-199]]).
   *
   * THE SENTENCE IS PART OF THE FEATURE. "Add" is a word an operator will read
   * as "add and tell them", because that is what every invite-shaped control
   * they have ever used did — and the whole point of this control is that it
   * does not. Saying so is cheaper than the support conversation, and far
   * cheaper than the one where they assumed mail went out and it did not.
   *
   * IT STAYS OPEN AFTER A SUCCESSFUL ADD, boxes cleared and focus back in the
   * address. Adding contacts is something an operator does several of in a row,
   * and a dialog that closed on each one would make the second one four clicks
   * away from the first.
   *
   * MOUNTED INTO THE PANEL, which is inside the shell root — `modal.js`'s rule:
   * the `--shell-*` tokens and the app font are declared on `.shell`, and a
   * dialog appended beside it resolves neither.
   */
  function openAdd() {
    const modal = createModalShell({ host: element, title: 'Add a contact' })
    modal.panel.append(el('h2', 'builder-modal__title', 'Add a contact'))

    const emailField = document.createElement('input')
    emailField.type = 'email'
    emailField.className = 'builder-people__add-email'
    emailField.placeholder = 'Email address'
    const nameField = document.createElement('input')
    nameField.type = 'text'
    nameField.className = 'builder-people__add-name'
    nameField.placeholder = 'Name (optional)'
    modal.panel.append(emailField, nameField)

    modal.panel.append(
      el(
        'p',
        'builder-people__add-hint',
        'Nothing is sent. They are recorded as a lead — tick them in the list and ' +
          'press Invite when you want to ask them in.',
      ),
    )

    // ONE PLACE FOR BOTH THE REFUSAL AND THE OUTCOME, so a failed add cannot
    // close the dialog silently and leave the operator believing it worked.
    const said = el('p', 'builder-people__add-said', '')
    said.hidden = true
    modal.panel.append(said)

    const make = modalButton('Add', 'builder-modal__btn builder-modal__btn--primary', async () => {
      make.disabled = true
      try {
        const outcome = await transport.add(emailField.value, nameField.value)
        await refresh()
        // AN ADDRESS ALREADY HERE IS REPORTED AS SUCH rather than as a success.
        // Adding somebody twice is an operator arriving at a person who is
        // already here, and silence would let them believe they had made a
        // second record of a customer they have one of.
        said.textContent = outcome.created
          ? `${outcome.person.email} is added as a lead.`
          : `${outcome.person.email} was already a contact here — nothing changed.`
        said.hidden = false
        emailField.value = ''
        nameField.value = ''
        emailField.focus()
      } catch (err) {
        said.textContent = err instanceof Error ? err.message : String(err)
        said.hidden = false
      } finally {
        make.disabled = false
      }
    })
    modal.panel.append(
      modalFooter([make, modalButton('Close', 'builder-modal__btn', () => modal.close())]),
    )
    modal.mount()
    emailField.focus()
    return modal
  }

  /**
   * THE INVITE MODAL: what is about to be sent, and to whom ([[REQ-199]]).
   *
   * IT IS A MESSAGE AND IT LOOKS LIKE ONE — From, Subject, To-List, Body, in the
   * order a person composing mail reads them. The operator is about to write to
   * strangers on behalf of their business, and a dialog that hid the words behind
   * "Send invite?" would be asking them to trust copy they have never seen.
   *
   * `From` IS DISPLAY ONLY. An arbitrary sender address fails DKIM and lands the
   * message in spam, so offering the field would offer a way to break delivery
   * silently. It is shown because *who will this appear to be from* is a fair
   * question; showing it and refusing to take an edit are different things, and
   * only the second is a restriction.
   *
   * `To-List:` AND NOT `To:`, WITH A HOVER THAT EXPLAINS WHY. These go out as N
   * separate messages, one per recipient. The reason is not technical: contacts
   * must not be given each other's email addresses, and a single message with
   * several recipients would disclose the whole list to every one of them. The
   * label is unusual on purpose and the tooltip is what makes it legible rather
   * than a typo.
   *
   * SUBJECT AND BODY ARE PREFILLED FROM THE `invite` TEMPLATE AND EDITABLE FOR
   * THIS SEND ([[REQ-197]]). Nothing here writes back to the template: editing
   * one is a different act with a different surface, and a modal that quietly
   * rewrote it would let a one-off change to one invite alter what every later
   * invite says.
   *
   * THE DRAFT IS FETCHED WHEN THE DIALOG OPENS, not held from the last one. The
   * copy lives in this business's ticket store and changes without a deploy, so
   * a cached draft is stale in the one direction nobody notices — the modal still
   * looks filled in.
   */
  function openInvite() {
    const chosen = all.filter((person) => selected.has(person.id))
    const modal = createModalShell({ host: element, title: 'Invite' })
    modal.panel.append(el('h2', 'builder-modal__title', 'Invite'))

    const form = el('div', 'builder-people__compose')
    modal.panel.append(form)

    /** One labelled row of the composer, so the four cannot drift apart. */
    const field = (label, control, hint) => {
      const row = el('div', 'builder-people__field')
      const name = el('label', 'builder-people__label', label)
      if (hint) {
        // THE HOVER IS ON THE LABEL, which is the thing that looks like a typo.
        // `title` rather than a paragraph, because the explanation is for the one
        // reader who stops to ask; printed in full it would be four lines of
        // policy above the words the operator actually came to read.
        name.title = hint
        name.classList.add('builder-people__label--explained')
      }
      row.append(name, control)
      form.append(row)
      return row
    }

    const fromField = el('p', 'builder-people__from', '…')
    field('From:', fromField)

    const subjectField = document.createElement('input')
    subjectField.type = 'text'
    subjectField.className = 'builder-people__subject'
    field('Subject:', subjectField)

    /**
     * The recipients, one per line, read-only.
     *
     * THE ADDRESSES ARE THE PRIMARY ONES AS THE LIST HAS THEM, and a contact
     * with none is shown as such rather than omitted. A selection of five that
     * lists four addresses is a dialog inviting the operator to miscount; the
     * server refuses that contact by name and the others still send, and this is
     * where they find out which one before they press anything.
     */
    const toField = document.createElement('textarea')
    toField.className = 'builder-people__tolist'
    toField.readOnly = true
    toField.rows = Math.min(6, Math.max(2, chosen.length))
    toField.value = chosen
      .map((person) => person.email || `${displayNameOf(person) || person.id} — no address`)
      .join('\n')
    field(
      'To-List:',
      toField,
      'Each contact gets their own message. They are never put on one email ' +
        'together, so nobody is shown anybody else’s address.',
    )

    const bodyField = document.createElement('textarea')
    bodyField.className = 'builder-people__body'
    bodyField.rows = 12
    field('Body:', bodyField)

    const said = el('div', 'builder-people__invite-said', '')
    said.hidden = true
    modal.panel.append(said)

    const sendButton = modalButton(
      `Send ${chosen.length}`,
      'builder-modal__btn builder-modal__btn--primary',
      async () => {
        sendButton.disabled = true
        said.replaceChildren()
        said.hidden = true
        try {
          const answer = await transport.invite(
            chosen.map((person) => person.id),
            subjectField.value,
            bodyField.value,
          )
          await refresh()
          said.replaceChildren(...outcomeLines(answer.results ?? []))
          said.hidden = false
          // THE SELECTION IS CLEARED ONLY ONCE SOMETHING WAS SENT, and the
          // dialog stays open on top of the report. An operator who has just
          // mailed nine people and refused one needs to read which one; closing
          // over the answer is how that gets missed.
          selected.clear()
          syncInvite()
        } catch (err) {
          said.replaceChildren(
            el('p', 'builder-people__outcome', err instanceof Error ? err.message : String(err)),
          )
          said.hidden = false
        } finally {
          sendButton.disabled = false
        }
      },
    )
    sendButton.disabled = true
    modal.panel.append(
      modalFooter([sendButton, modalButton('Close', 'builder-modal__btn', () => modal.close())]),
    )
    modal.mount()

    // THE COPY ARRIVES AFTER THE DIALOG IS ON SCREEN, and Send is disabled until
    // it does. Awaiting the read before mounting would leave the operator
    // looking at nothing after a click; sending before it lands would send an
    // empty body.
    void (async () => {
      try {
        const draft = await transport.inviteDraft()
        fromField.textContent = draft.from ?? ''
        subjectField.value = draft.subject ?? ''
        bodyField.value = draft.body ?? ''
        sendButton.disabled = false
        subjectField.focus()
      } catch (err) {
        said.replaceChildren(
          el(
            'p',
            'builder-people__outcome',
            `The invite copy could not be read: ${err instanceof Error ? err.message : String(err)}`,
          ),
        )
        said.hidden = false
      }
    })()
    return modal
  }

  /**
   * Provisioning a business, from the person it will belong to ([[REQ-180]] D2).
   *
   * OPENED FROM A PERSON RATHER THAN FROM NOWHERE, because the route takes an
   * account email and that is the one thing the detail pane already knows — a
   * dialog asking the operator to retype an address they are looking at is a
   * dialog inviting a typo into a `tenants` row.
   *
   * IT IS THE SECOND HALF OF THE PAIR ([[REQ-186]]). Invite alone makes a member
   * of this business — a level-2 customer with a portal. Invite and then this
   * makes a level-1 customer, who also gets the app. Two controls because they
   * are two acts with two gates, and the composition is what [[DOC-42]] §1
   * describes.
   */
  function openFulfil(subject, view) {
    const modal = createModalShell({ host: element, title: 'Provision a business' })
    modal.panel.append(el('h2', 'builder-modal__title', 'Provision a business'))
    modal.panel.append(
      el(
        'p',
        'builder-people__fulfil-who',
        `A new business for ${subject.email}, with a starter site and a live plan.`,
      ),
    )

    const nameField = document.createElement('input')
    nameField.type = 'text'
    nameField.className = 'builder-people__fulfil-name'
    nameField.placeholder = 'Business name'
    nameField.value = displayNameOf(subject) ?? ''
    modal.panel.append(nameField)

    const said = el('p', 'builder-people__fulfil-said', '')
    said.hidden = true
    modal.panel.append(said)

    const make = modalButton('Provision', 'builder-modal__btn builder-modal__btn--primary', async () => {
      make.disabled = true
      try {
        const made = await transport.fulfil(subject.email, nameField.value)
        said.textContent = `${made.name} is provisioned.`
        said.hidden = false
        // REOPENED RATHER THAN LEFT AS IT WAS: the pane behind this dialog now
        // says something untrue — it lists the businesses this person runs, and
        // one of them has just appeared.
        await reopen(subject.id, view)
      } catch (err) {
        said.textContent = err instanceof Error ? err.message : String(err)
        said.hidden = false
      } finally {
        make.disabled = false
      }
    })
    modal.panel.append(
      modalFooter([make, modalButton('Close', 'builder-modal__btn', () => modal.close())]),
    )
    modal.mount()
    nameField.focus()
    return modal
  }

  /**
   * A real name change, recorded as one ([[REQ-193]]).
   *
   * A DIALOG AND NOT A CHECKBOX BESIDE THE BOXES, because it is a different act
   * rather than a different setting on the same one. The record pane corrects a
   * value that was always wrong; this says the value was right and the person is
   * now called something else — and the old name survives it, searchable, shown
   * as *formerly*. A toggle would leave the two one mis-click apart, and the
   * mis-click that matters surfaces a name somebody deliberately left behind.
   *
   * IT COMMITS ALL SEVEN PARTS AT ONCE, which the record pane deliberately never
   * does. A name change is one transition and the supersession records it once;
   * seven field-at-a-time commits would write seven rows into the history for a
   * single event, and the timeline is the thing this table exists to keep.
   *
   * PREFILLED FROM THE CURRENT NAME, because most of a name survives a marriage.
   * The operator edits the parts that moved.
   *
   * BUILT FROM `NAME_PARTS`, the same list the pane above uses — so this cannot
   * be the surface that forgets a part.
   */
  function openRename(subject, view) {
    const modal = createModalShell({ host: element, title: 'Record a name change' })
    modal.panel.append(el('h2', 'builder-modal__title', 'Record a name change'))
    modal.panel.append(
      el(
        'p',
        'builder-people__rename-hint',
        'Use this when they are genuinely called something else now — not to fix a ' +
          'spelling. The name they had stays on their record, is found by search, ' +
          'and shows as “formerly”.',
      ),
    )

    const boxes = new Map()
    for (const part of NAME_PARTS) {
      const label = el('label', 'builder-people__rename-field')
      label.append(el('span', 'builder-people__rename-label', part.label))
      const box = document.createElement('input')
      box.type = 'text'
      box.className = 'builder-people__rename-box'
      box.name = part.name
      box.value = subject.name?.[part.name] ?? ''
      label.append(box)
      boxes.set(part.name, box)
      modal.panel.append(label)
    }

    const said = el('p', 'builder-people__rename-said', '')
    said.hidden = true
    modal.panel.append(said)

    const save = modalButton(
      'Record it',
      'builder-modal__btn builder-modal__btn--primary',
      async () => {
        save.disabled = true
        try {
          const patch = { nameReason: CHANGED }
          for (const [name, box] of boxes) patch[name] = box.value
          await transport.saveRecord(subject.id, patch)
          await refresh()
          // REOPENED, because the pane behind this dialog now says something
          // untrue in two places at once: the name, and the *formerly* line that
          // has just acquired an entry.
          await reopen(subject.id, view)
          modal.close()
        } catch (err) {
          said.textContent = err instanceof Error ? err.message : String(err)
          said.hidden = false
          save.disabled = false
        }
      },
    )
    modal.panel.append(
      modalFooter([save, modalButton('Close', 'builder-modal__btn', () => modal.close())]),
    )
    modal.mount()
    boxes.get(NAME_PARTS[0].name)?.focus()
    return modal
  }

  function matches(person) {
    // AND, NOT OR. The two axes are independent, so narrowing on both is the
    // conjunction — which is what makes "invited and never came" reachable.
    if (filter.stage && stageOf(person) !== filter.stage) return false
    if (filter.access && accessOf(person) !== filter.access) return false
    if (!filter.text) return true
    // FORMER NAMES ARE SEARCHED AND CORRECTIONS ARE NOT ([[REQ-193]]). *Sarah
    // Jones; oh, she is Sarah Patel now* is the search an operator actually
    // runs, and history is a table rather than an audit log precisely so it can
    // be answered. The filtering of WHICH former names travel is the server's:
    // a `corrected` typo never reaches this array, so this cannot match one.
    const haystack = [
      person.email ?? '',
      displayNameOf(person) ?? '',
      ...(person.formerNames ?? []),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(filter.text)
  }

  function apply() {
    listDetail.setItems(all.filter(matches))
  }

  /** One section per relation, so the three cannot read as one blended thing. */
  function section(view, title) {
    view.append(el('h3', 'builder-people__heading', title))
    const body = el('div', 'builder-people__section')
    view.append(body)
    return body
  }

  /**
   * The detail pane, BUILT SYNCHRONOUSLY AND FILLED ASYNCHRONOUSLY.
   *
   * `list-detail` calls `openDetail(item, tab)` and reads `descriptor.element`
   * from what comes back — the second argument is the TAB CONTROLLER, not a view
   * to append into, and this function must return an element NOW. An earlier
   * draft treated the controller as the view and was `async`, so the component
   * read `.element` off a Promise, mounted its empty placeholder, and the append
   * threw into an unhandled rejection: the pane was blank for every person and
   * nothing on screen said why. Recorded because the shape is easy to write again
   * — the mistake produces no error the operator can see.
   */
  function openDetail(person) {
    const view = el('div', 'builder-people__detail')
    void fill(person, view)
    return { element: view }
  }

  async function fill(person, view) {
    const detail = await transport.item(person.id)

    /**
     * `onCommit` AND NOT `onSave` ([[BUG-54]]). The component's commit hook is
     * `onCommit`; `onSave` was a key nothing read, so every confirmed edit was
     * applied to the widget's own copy of the values and went no further. It
     * failed silently by construction — the rollback path runs when the commit
     * callback REJECTS, and a callback that is never called never rejects.
     *
     * ONE FIELD PER CALL, which is the `auto` commit mode: the changes object
     * carries the single field just confirmed, so the route is handed a patch
     * and never a whole record. That is what lets it leave the name alone while
     * the address changes, rather than writing back a stale copy of every other
     * value the pane happened to be holding — and, since a name is a row that is
     * SUPERSEDED rather than updated ([[REQ-193]]), what stops an address
     * correction from writing a name transition that never happened.
     *
     * A REJECTION IS THE ERROR REPORT. The widget rolls the cell back to the
     * last-known-good value and prints the message inline, so a refusal the
     * server made — an address another person already holds — lands beside the
     * box it is about rather than in a console.
     */
    const record = mountFields(section(view, 'Who they are'), {
      schema: RECORD_FIELDS,
      values: { ...detail.person, ...axisValues(detail.person) },
      editable: true,
      onCommit: async (changes) => {
        const saved = await transport.saveRecord(detail.person.id, changes)
        // THE SAVED ROW IS PUT BACK, because the server normalises: an address
        // typed `Sarah@…` is stored `sarah@…`, and the widget's optimistic copy
        // still holds what was TYPED. Left alone the pane would show an address
        // that is not the one in the row — and would disagree with the list the
        // refresh below redraws from the same server.
        Object.assign(detail.person, saved)
        record.setValues({ ...detail.person, ...axisValues(detail.person) })
        name.setValues(nameValues(detail.person))
        await refresh()
      },
    })

    /**
     * THE OTHER ADDRESSES, READ-ONLY ([[REQ-191]]).
     *
     * SHOWN ONLY WHEN THERE ARE SOME. A person holds as many addresses as they
     * have; the row above and the `Email` field both show the PRIMARY one, so a
     * section that appeared for everybody would say "and no others" to the whole
     * list and mean nothing. It appears exactly when there is something the pane
     * would otherwise be hiding — which is the case that lets an operator invite
     * the same human twice.
     *
     * READ-ONLY BECAUSE NOTHING ADDS ONE YET. Which surface adds an address and
     * re-primaries it is [[REQ-189]]'s territory or later; editing the `Email`
     * field rewrites the primary row and leaves these alone. A control that
     * appeared to offer more than that would be the shape that reads as
     * supported and is not.
     */
    const others = (detail.emails ?? []).filter((entry) => !entry.isPrimary)
    if (others.length > 0) {
      const addresses = section(view, 'Other addresses')
      const list = el('ul', 'builder-people__addresses')
      for (const entry of others) {
        list.append(el('li', 'builder-people__address', entry.email))
      }
      addresses.append(list)
    }

    /**
     * Their name — the operator's own surface, and the one they curate on
     * ([[REQ-193]]).
     *
     * ITS OWN SECTION, BESIDE THE ADDRESSES AND NOT AMONG THEM. Both are
     * multi-valued and neither is multi-valued along the same axis: a person
     * holds several addresses AT ONCE, and several names OVER TIME. So the
     * addresses list what else is true now and this shows the one that is
     * current — with what used to be true on the `Formerly` row.
     *
     * EDITING HERE IS A CORRECTION, and that is why it is the plain path. The
     * common case by far is a typo, an autocorrect, a spelling somebody finally
     * got right — and a correction must not become a searchable, displayable
     * former name. So this posts no reason at all and the server defaults it to
     * `corrected`: the common case and the safe case are the same case, and the
     * operator has to do nothing to get it.
     *
     * A REAL NAME CHANGE IS THE BUTTON BELOW, which is the deliberate act. Two
     * surfaces because they are two facts, not two spellings of one — and the
     * asymmetry is on purpose: getting this wrong in the safe direction leaves a
     * stale typo out of a search, and getting it wrong the other way surfaces a
     * deadname.
     */
    const nameSection = section(view, 'Their name')
    const name = mountFields(nameSection, {
      schema: NAME_FIELDS,
      values: nameValues(detail.person),
      editable: true,
      onCommit: async (changes) => {
        const saved = await transport.saveRecord(detail.person.id, changes)
        Object.assign(detail.person, saved)
        name.setValues(nameValues(detail.person))
        await refresh()
      },
    })
    const renamed = el('button', 'builder-people__rename', 'Record a name change')
    renamed.type = 'button'
    renamed.addEventListener('click', () => openRename(detail.person, view))
    nameSection.append(renamed)

    /**
     * WHAT WE HAVE SAID TO THEM, AND WHETHER IT ARRIVED ([[REQ-198]]).
     *
     * MOST RECENT FIRST, because the question an operator opens this pane with
     * is *did the thing I just did work*, and the answer to that is at the top.
     *
     * FETCHED AFTER THE RECORD IS ALREADY DRAWN. It is a second store — the
     * tenant's tickets rather than the identity schema — so awaiting it before
     * the record above would leave the whole pane blank on the slower of the
     * two reads. The section appears when its answer does.
     *
     * A FAILED READ SAYS SO IN THE SECTION. An empty list and a list that could
     * not be read look identical, and only one of them means "we have never
     * written to this person" — which is exactly the conclusion an operator
     * would draw and act on.
     */
    const messages = section(view, 'Messages')
    try {
      const answer = await transport.messages(detail.person.id)
      const sent = Array.isArray(answer.messages) ? answer.messages : []
      if (sent.length === 0) {
        messages.append(el('p', 'builder-people__msgempty', 'Nothing has been sent to them yet.'))
      } else {
        const list = el('ul', 'builder-people__messages')
        for (const message of sent) list.append(messageLine(message))
        messages.append(list)
      }
    } catch (err) {
      messages.append(
        el(
          'p',
          // ITS OWN CLASS AND NOT `__empty`. The two sections' empty states are
          // different facts — "they run nothing" is about the person, "nothing
          // has been sent" is about us — and a shared hook would let a reader
          // (or a selector) treat one as the other.
          'builder-people__msgempty',
          `Their messages could not be read: ${err instanceof Error ? err.message : String(err)}`,
        ),
      )
    }

    /**
     * WHAT THEY RUN AND WHAT THEY HOLD, IN ONE TABLE ([[REQ-189]]).
     *
     * THE ONLY PLACE A SECOND BUSINESS IS VISIBLE AT ALL. Viewed from 1st
     * Contact, this is where Alice's Plumbing appears against Alice's row; it is
     * membership metadata, a name and a grant, never the contents of that
     * business.
     *
     * GRANTS ARE STILL A LIST AND NEVER A SINGLE CURRENT VALUE ([[DOC-40]] §5).
     * An account accumulates them and effective access is the best active grant
     * covering now, so a business holding two gets two rows under one business
     * cell rather than one row that picks a winner. The join changed which axis
     * they are grouped on; it did not collapse them.
     *
     * COLUMN HEADINGS, because neither of the two tables this replaces had any
     * and the reader was inferring what each value meant from its shape.
     */
    const businesses = section(view, 'Businesses')
    const joined = joinBusinesses(detail.operates, detail.grants)
    if (joined.length === 0) {
      businesses.append(
        el('p', 'builder-people__empty', 'None — they run no business, and hold no grant.'),
      )
    } else {
      businesses.append(
        businessTable(joined, async (grantId) => {
          await transport.revoke(grantId)
          await reopen(detail.person.id, view)
        }),
      )
    }

    /**
     * WHAT HAS HAPPENED TO THEM ([[REQ-195]]).
     *
     * ONE SEQUENCE, NEWEST FIRST, AND NOT ONE LIST PER KIND. A message we sent,
     * a bounce that came back, a reply, the invite, the day they signed up — a
     * reader asking "what is going on with this person" wants them interleaved,
     * and two lists side by side make them do that join by eye and get it wrong
     * on the one occasion it matters.
     *
     * IT RENDERS A KIND IT HAS NEVER SEEN. The set grows ([[DOC-44]] §4) and
     * `eventLabel` falls back to the dotted string itself, so a capability that
     * starts recording something new appears here without this file being
     * edited — and nothing in this section branches on a kind, which is what
     * would otherwise have to be found and extended the day it did.
     *
     * THE SECTION IS DRAWN EVEN WHEN IT IS EMPTY, unlike `Other addresses`
     * above. An empty address list means "there is nothing more to say"; an
     * empty history means "we have no record of this person", which is a fact
     * about them worth stating — and it is what every contact created before
     * this table existed truthfully shows.
     *
     * `Origin` IS THE EARLIEST EVENT AND COMES FROM THE SERVER'S OWN QUERY,
     * never from the end of this list. The list is capped; provenance taken off
     * its tail would be quietly wrong for exactly the contacts with the longest
     * histories.
     *
     * LAST OF THE READ-ONLY SECTIONS, under the businesses. Everything above is
     * the current answer — who they are, where they can be reached, what they
     * run and hold — and this is how it came to be that answer. A log read
     * before the state it explains is a log read without the thing it is about.
     */
    const history = section(view, 'History')
    if (detail.provenance) {
      const origin = describeEvent(detail.provenance)
      history.append(
        el('p', 'builder-people__origin', `Origin: ${origin.label}, ${origin.when}`),
      )
    }
    const events = Array.isArray(detail.events) ? detail.events : []
    if (events.length === 0) {
      history.append(el('p', 'builder-people__empty', 'Nothing recorded yet.'))
    } else {
      // AN `<ol>`, because the order is the meaning. A history in an unordered
      // list is a history a stylesheet is free to reflow.
      const lines = el('ol', 'builder-people__events')
      for (const event of events) {
        const said = describeEvent(event)
        const line = el('li', 'builder-people__event')
        line.append(el('span', 'builder-people__eventkind', said.label))
        line.append(el('span', 'builder-people__eventwhen', said.when))
        if (said.learned) {
          line.append(el('span', 'builder-people__eventlearned', `recorded ${said.learned}`))
        }
        lines.append(line)
      }
      history.append(lines)
    }

    /**
     * The product-fulfilment control, shown on two conditions and neither is
     * "admin" ([[DOC-42]] §7).
     *
     * REACHABLE SINCE [[REQ-186]]. It was written by [[REQ-170]] behind an
     * `onFulfil` callback that nothing ever passed, so it could not render — the
     * route existed, the flag was reported, and the button was dead code. It is
     * wired here rather than left as a hook because an unwired hook is the shape
     * that reads as "supported" and is not, and because the ticket that adds the
     * invite is the ticket whose story is the two composing.
     *
     * NOT RENDERING IT IS NOT THE GATE. `/api/admin/businesses` asks the same
     * question again for itself, because a control that is merely absent from a
     * page is not refused to anyone who can type a URL.
     */
    if (canFulfil) {
      const fulfil = section(view, 'Add a business')
      const button = el('button', 'builder-people__fulfil', 'Provision a business')
      button.addEventListener('click', () => openFulfil(detail.person, view))
      fulfil.append(button)
    }
  }

  /** Redraw one person's pane in place — a withdrawn grant changes what it says. */
  async function reopen(personId, view) {
    view.replaceChildren()
    await fill({ id: personId }, view)
  }

  const listDetail = mountListDetail(element, {
    id: 'people',
    ...(storage ? { storage } : {}),
    items: [],
    getKey: (person) => person.id,
    listTitle: 'Contacts',
    listControls: controls,
    // WRAPPED so the row can see the bounce set and the selection without either
    // becoming a field on the person — the component calls this per row and
    // holds nothing else.
    renderRow: (person) => renderRow(person, bounced, selection),
    mode: 'no-tab',
    openDetail,
    emptyDetail: emptyPane(),
  })

  /** Re-read this business's people and redraw. */
  async function refresh() {
    const answer = await transport.list()
    all = Array.isArray(answer.people) ? answer.people : []
    canFulfil = answer.canFulfil === true
    canInvite = answer.canInvite === true
    bounced = new Set(Array.isArray(answer.bounced) ? answer.bounced : [])
    // A TICK ON SOMEBODY WHO IS NO LONGER IN THE LIST IS DROPPED ([[REQ-199]]).
    // Kept, it would be an id nothing can send to and a refusal in every later
    // send — and it would make the button's count disagree with the number of
    // boxes the operator can see ticked.
    const present = new Set(all.map((person) => person.id))
    for (const id of [...selected]) if (!present.has(id)) selected.delete(id)
    // HIDDEN RATHER THAN NOT BUILT, because the list is re-read on every business
    // switch and a control that was never created for the first business would
    // have to be created for the second — two code paths for one button.
    invite.hidden = !canInvite
    add.hidden = !canInvite
    syncInvite()
    apply()
    return all
  }

  /**
   * Drop everything, for a business switch.
   *
   * A DIFFERENT LIST RATHER THAN THE SAME LIST REDRAWN — the same reason the
   * Library clears: these are other people entirely, and re-filtering would leave
   * one business's rows on screen while another's load.
   */
  function clear() {
    all = []
    canFulfil = false
    canInvite = false
    bounced = new Set()
    // THE SELECTION GOES WITH THE LIST. These are other people entirely, and a
    // tick surviving a business switch is a checked id in a business that has no
    // such row — which the invite would then refuse, naming a person the
    // operator is not even looking at.
    selected.clear()
    invite.hidden = true
    add.hidden = true
    syncInvite()
    listDetail.setItems([])
  }

  return {
    element,
    /** The component itself, so a host — or a suite — can select a row by key. */
    listDetail,
    refresh,
    clear,
    /** Both axes, as this panel derives them — one definition, not a copy. */
    stageOf,
    accessOf,
  }
}
