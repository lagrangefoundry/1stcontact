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
 * AND THE INVITE IS THE VERB THAT MOVES THE PIPELINE ([[REQ-186]], [[DOC-42]]
 * §9) — from Lead to **Invited**, and no further, and along that axis only. It
 * is one control for both levels: it writes into whichever business is open, so
 * from 1st Contact it makes Alice and from Alice's it makes Bob, which is why it
 * is a button on this uniform tab rather than a platform console. What it cannot
 * do is make a member. Only the person themselves does that, by accepting the
 * terms, and the tab reflects it with no operator action at all.
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
import {
  fetchPeople,
  fetchPerson,
  invitePerson,
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
function renderRow(person) {
  const row = el('div', 'builder-people__row')
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
  return row
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
  const {
    storage,
    transport = {
      list: fetchPeople,
      item: fetchPerson,
      saveRecord: savePersonRecord,
      grant: openGrant,
      revoke: revokeGrant,
      invite: invitePerson,
      fulfil: provisionBusinessFor,
    },
  } = options

  const element = el('div', 'builder-people')

  /** Everyone in this business. The filter narrows this; it never re-fetches. */
  let all = []
  let canFulfil = false
  let canInvite = false
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
   * The invite, beside the filter rather than inside a person's detail.
   *
   * IT MAKES A PERSON, so it cannot hang off one. The detail pane edits somebody
   * who already exists; this is the list's own action and it belongs where the
   * list's own controls are.
   *
   * SHOWN ON ONE CONDITION AND IT IS NOT "ADMIN" ([[DOC-42]] §7). `canInvite` is
   * *you own this business*, which is true of Alice on hers — so the same button
   * appears on the same tab at both levels, and what it makes is decided by which
   * business is open rather than by anything this file knows ([[DOC-42]] §3).
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
   * The dialog: an address, an optional name, and a sentence about the post.
   *
   * THE "NO MAIL IS SENT" LINE IS PART OF THE FEATURE, not decoration. There is
   * no sender in this system, so an operator who reads "Invite" and is told
   * nothing will assume a message went out and will not check. The invite is a
   * database transition; the person is admitted the next time they pass the front
   * door, and they have to be told that by somebody.
   *
   * MOUNTED INTO THE PANEL, which is inside the shell root — `modal.js`'s rule:
   * the `--shell-*` tokens and the app font are declared on `.shell`, and a
   * dialog appended beside it resolves neither.
   */
  function openInvite() {
    const modal = createModalShell({ host: element, title: 'Invite someone' })

    const title = el('h2', 'builder-modal__title', 'Invite someone')
    modal.panel.append(title)

    const emailField = document.createElement('input')
    emailField.type = 'email'
    emailField.className = 'builder-people__invite-email'
    emailField.placeholder = 'Email address'
    const nameField = document.createElement('input')
    nameField.type = 'text'
    nameField.className = 'builder-people__invite-name'
    nameField.placeholder = 'Name (optional)'
    modal.panel.append(emailField, nameField)

    const hint = el(
      'p',
      'builder-people__invite-hint',
      'No message is sent. They are marked as invited here, and become a member ' +
        'when they sign in and accept the terms.',
    )
    modal.panel.append(hint)

    // ONE PLACE FOR BOTH THE REFUSAL AND THE OUTCOME, so a failed invite cannot
    // close the dialog silently and leave the operator believing it worked.
    const said = el('p', 'builder-people__invite-said', '')
    said.hidden = true
    modal.panel.append(said)

    const send = modalButton('Invite', 'builder-modal__btn builder-modal__btn--primary', async () => {
      send.disabled = true
      try {
        const outcome = await transport.invite(emailField.value, nameField.value)
        await refresh()
        // A LEAD MOVED ALONG IS REPORTED AS SUCH ([[DOC-42]] §9). It is the same
        // contact moving along one axis, and telling the operator which of the
        // two branches ran is the only way that transition is visible anywhere.
        //
        // AND WHAT IT SAYS IS "INVITED", NOT "MEMBER" ([[REQ-188]]). The button
        // cannot make a member — only the person can, by signing up — so a
        // sentence claiming one would be the old two-state model surviving in the
        // one place the operator actually reads.
        said.textContent = outcome.created
          ? `${outcome.person.email} is invited.`
          : `${outcome.person.email} was already known here, and is now invited.`
        said.hidden = false
        emailField.value = ''
        nameField.value = ''
      } catch (err) {
        said.textContent = err instanceof Error ? err.message : String(err)
        said.hidden = false
      } finally {
        send.disabled = false
      }
    })
    modal.panel.append(
      modalFooter([send, modalButton('Close', 'builder-modal__btn', () => modal.close())]),
    )
    modal.mount()
    emailField.focus()
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
    const haystack = `${person.email} ${displayNameOf(person) ?? ''} ${(person.formerNames ?? []).join(' ')}`.toLowerCase()
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
     * and never a whole record. That is what lets it leave `display_name`
     * alone while the address changes, rather than writing back a stale copy
     * of every other value the pane happened to be holding.
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
    renderRow,
    mode: 'no-tab',
    openDetail,
    emptyDetail: EMPTY_DETAIL,
  })

  /** Re-read this business's people and redraw. */
  async function refresh() {
    const answer = await transport.list()
    all = Array.isArray(answer.people) ? answer.people : []
    canFulfil = answer.canFulfil === true
    canInvite = answer.canInvite === true
    // HIDDEN RATHER THAN NOT BUILT, because the list is re-read on every business
    // switch and a control that was never created for the first business would
    // have to be created for the second — two code paths for one button.
    invite.hidden = !canInvite
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
    invite.hidden = true
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
