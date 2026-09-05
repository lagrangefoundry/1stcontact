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
 * FOUR RELATIONS, AND THE FIRST OF THEM HAS THREE STATES ([[DOC-42]] §4,
 * [[REQ-188]]). The distinction an earlier draft of the model got wrong, and the
 * reason this file names them out loud:
 *
 * - **contact** — known here, never invited, MAY become a member. `invitedAt` null.
 * - **invited** — asked, and has not come. `invitedAt` set, `termsAcceptedAt` null.
 * - **member** — signed up, and may log in. `termsAcceptedAt` set. The control
 *   over the login itself is `status`, which `admit` refuses on.
 * - **operator** — may RUN a business. `memberships`, and usually a DIFFERENT
 *   business: viewed from 1st Contact, Alice's row shows Alice's Plumbing here.
 * - **entitled** — granted access to a thing. Per grant, and each names its
 *   business.
 *
 * BEING IN THE LIST IS NOT THE MEMBER RELATION — being signed up is. There is
 * still no membership toggle beside a row, because `memberships` answers a
 * different question: withdrawing one takes away the right to run a business and
 * deliberately leaves that person's own Portal reachable.
 *
 * AND THE INVITE IS THE VERB THAT MOVES A ROW ACROSS ([[REQ-186]], [[DOC-42]]
 * §9) — from Contact to **Invited**, and no further. It is one control for both
 * levels: it writes into whichever business is open, so from 1st Contact it makes
 * Alice and from Alice's it makes Bob, which is why it is a button on this
 * uniform tab rather than a platform console. What it cannot do is finish the
 * journey. Only the person themselves does that, by accepting the terms, and the
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
import { PERSON_STATES, stateOf } from './people-state.js'
import {
  fetchPeople,
  fetchPerson,
  invitePerson,
  openGrant,
  provisionBusinessFor,
  revokeGrant,
  savePersonStatus,
} from './api.js'

/**
 * The record, read-only except for the one field that decides a login.
 *
 * `status` IS THE ONLY EDITABLE ONE, and it is editable because it is the login
 * control ([[DOC-42]] §5) rather than because it is convenient. Everything else
 * here is a fact the system recorded — when they arrived, when they last signed
 * in, when they accepted the terms — and a surface that let an operator retype
 * those would be inviting them to falsify the record.
 */
const RECORD_FIELDS = [
  { name: 'email', label: 'Email' },
  { name: 'displayName', label: 'Name' },
  { name: 'state', label: 'State' },
  { name: 'status', label: 'May sign in', editable: true },
  { name: 'invitedAt', label: 'Invited' },
  { name: 'firstSeenAt', label: 'First seen' },
  { name: 'lastSeenAt', label: 'Last seen' },
  { name: 'termsAcceptedAt', label: 'Terms accepted' },
  { name: 'createdAt', label: 'Created' },
]

const EMPTY_DETAIL = 'Select a person.'

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

/**
 * The three states, defined once in `people-state.js` and re-exported here.
 *
 * RE-EXPORTED RATHER THAN REDEFINED. The rule is a model fact ([[DOC-42]] §4)
 * and is asserted on both sides of the seam — the label this panel draws, and the
 * `users` row a workers test reads back — so it may have exactly one definition.
 */
export { stateOf }

/**
 * What the name column says for somebody who has none yet ([[REQ-189]]).
 *
 * IT IS A SENTENCE AND NOT A DASH, because today it is what EVERY row says:
 * nothing in this system can set `display_name` yet ([[REQ-183]] §5), so a
 * blank or a glyph would read as a column that is broken rather than as a fact
 * about the person. The wording says which of the two it is. Exported so the
 * evidence asserts the string rather than restating it.
 */
export const NO_NAME_YET = 'No name yet'

/**
 * The list row: the name, the address, and the state they are in.
 *
 * THE NAME AND THE ADDRESS ARE TWO CELLS, not one with a fallback ([[REQ-189]]).
 * The row used to print `displayName || email`, which meant a person WITH a name
 * lost their address off the list — and, because nothing sets names yet, meant
 * the list read as addresses only and its name column was invisible.
 *
 * THE STATE IS DRAWN BY WHATEVER {@link stateOf} RETURNS and this row branches
 * on none of them — nor does any rule styling it. [[REQ-188]] has already turned
 * two states into three; a pill styled per label, or a row that special-cased
 * one, is what would have had to be found and edited that day.
 */
function renderRow(person) {
  const row = el('div', 'builder-people__row')
  const name = el('span', 'builder-people__who', person.displayName || NO_NAME_YET)
  if (!person.displayName) name.classList.add('builder-people__noname')
  row.append(name)
  row.append(el('span', 'builder-people__email', person.email))
  row.append(el('span', 'builder-people__state', stateOf(person)))
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
      saveStatus: savePersonStatus,
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
  const filter = { text: '', state: '' }

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
   * Contacts, invitees and members in one list, with a facet rather than tabs.
   *
   * SEPARATE LISTS ARE THE THING RULED OUT ([[DOC-42]] §9), not separate views.
   * They are one population in three states and the invite moves a row across, so
   * a facet keeps the person who is both from appearing twice or disagreeing with
   * themselves.
   *
   * AND THE MIDDLE STATE IS THE ONE WORTH FILTERING TO ([[REQ-188]]). Two states
   * collapsed the funnel; three show it, and "who did I ask who never came" is
   * the question an operator can actually act on.
   */
  const states = document.createElement('select')
  states.className = 'builder-people__states'
  const everyone = document.createElement('option')
  everyone.value = ''
  everyone.textContent = 'Everyone'
  states.append(everyone)
  // BUILT FROM `PERSON_STATES`, so a state added to the model appears here
  // without this file being edited — and, more to the point, so a state can never
  // be shown by a row and be unreachable by the filter.
  for (const value of PERSON_STATES) {
    const option = document.createElement('option')
    option.value = value
    option.textContent = value
    states.append(option)
  }
  states.addEventListener('change', () => {
    filter.state = states.value
    apply()
  })
  controls.append(states)

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

    const send = modalButton('Invite', 'builder-modal__button', async () => {
      send.disabled = true
      try {
        const outcome = await transport.invite(emailField.value, nameField.value)
        await refresh()
        // A CONTACT PROMOTED IS REPORTED AS SUCH ([[DOC-42]] §9). It is the same
        // row moving between states, and telling the operator which of the two
        // branches ran is the only way that transition is visible anywhere.
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
      modalFooter([send, modalButton('Close', 'builder-modal__button', () => modal.close())]),
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
    nameField.value = subject.displayName ?? ''
    modal.panel.append(nameField)

    const said = el('p', 'builder-people__fulfil-said', '')
    said.hidden = true
    modal.panel.append(said)

    const make = modalButton('Provision', 'builder-modal__button', async () => {
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
      modalFooter([make, modalButton('Close', 'builder-modal__button', () => modal.close())]),
    )
    modal.mount()
    nameField.focus()
    return modal
  }

  function matches(person) {
    if (filter.state && stateOf(person) !== filter.state) return false
    if (!filter.text) return true
    const haystack = `${person.email} ${person.displayName ?? ''}`.toLowerCase()
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

    mountFields(section(view, 'Who they are'), {
      schema: RECORD_FIELDS,
      values: { ...detail.person, state: stateOf(detail.person) },
      editable: true,
      onSave: async (values) => {
        await transport.saveStatus(detail.person.id, values.status)
        await refresh()
      },
    })

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
    listTitle: 'People',
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
    stateOf,
  }
}
