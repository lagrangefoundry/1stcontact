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
 * FOUR RELATIONS, THREE COLUMNS ([[DOC-42]] §4). The distinction an earlier draft
 * of the model got wrong, and the reason this file names them out loud:
 *
 * - **contact** — known here, never invited, MAY become a member. `invitedAt` null.
 * - **member** — may log in. The control is `status`, which `admit` refuses on.
 * - **operator** — may RUN a business. `memberships`, and usually a DIFFERENT
 *   business: viewed from 1st Contact, Alice's row shows Alice's Plumbing here.
 * - **entitled** — granted access to a thing. Per grant, and each names its
 *   business.
 *
 * BEING IN THE LIST IS THE MEMBER RELATION. There is no membership toggle beside
 * it, because `memberships` answers a different question — withdrawing one takes
 * away the right to run a business and deliberately leaves that person's own
 * Portal reachable.
 *
 * AND THE INVITE IS THE VERB THAT MOVES A ROW ACROSS ([[REQ-186]], [[DOC-42]]
 * §9). It is one control for both levels — it writes into whichever business is
 * open, so from 1st Contact it makes Alice and from Alice's it makes Bob — which
 * is why it is a button on this uniform tab rather than a platform console.
 *
 * STANDARD `webui/split` + `webui/list-detail`, CONFIGURED RATHER THAN REBUILT,
 * exactly as the Library uses them. What is written here is the three functions
 * the component asks for: how a row looks, what a detail contains, and what the
 * filter means.
 */

import { mountFields } from '@lagrangefoundry/webui-fields'
import { mountListDetail } from '@lagrangefoundry/webui-list-detail'
import { createModalShell, modalButton, modalFooter } from './modal.js'
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
 * Contact or member, from the one marker the schema has ([[DOC-42]] §4.1).
 *
 * `invitedAt` is what the invite sets, so it is what distinguishes the two
 * states. It is REPORTED rather than enforced: nothing in the code stops a
 * never-invited row from signing in today, and this label must not imply it does.
 */
export function stateOf(person) {
  return person && person.invitedAt ? 'Member' : 'Contact'
}

/** The list row: who they are, and which of the two states they are in. */
function renderRow(person) {
  const row = el('div', 'builder-people__row')
  row.append(el('span', 'builder-people__who', person.displayName || person.email))
  row.append(el('span', 'builder-people__state', stateOf(person)))
  if (person.status !== 'active') {
    // THE ACCENT IS SPENT ON THE EXCEPTION. Nearly every row is `active`, so a
    // pill saying so would fire everywhere and mean nothing; what an operator
    // needs to see at a glance is the person who can no longer sign in.
    row.append(el('span', 'builder-people__suspended', person.status))
  }
  return row
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
   * Contacts and members in one list, with a facet rather than two tabs.
   *
   * TWO LISTS IS THE THING RULED OUT ([[DOC-42]] §9), not two views. They are one
   * population in two states and the invite moves a row across, so a facet keeps
   * the person who is both from appearing twice or disagreeing with themselves.
   */
  const states = document.createElement('select')
  states.className = 'builder-people__states'
  for (const [value, label] of [['', 'Everyone'], ['Member', 'Members'], ['Contact', 'Contacts']]) {
    const option = document.createElement('option')
    option.value = value
    option.textContent = label
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
      'No message is sent. They become a member here, and are admitted the next ' +
        'time they sign in.',
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
        // row moving between two states, and telling the operator which of the
        // two branches ran is the only way that transition is visible anywhere.
        said.textContent = outcome.created
          ? `${outcome.person.email} is now a member.`
          : `${outcome.person.email} was already known here, and is now a member.`
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
     * What they may RUN — and it is usually not this business.
     *
     * THE ONLY PLACE A SECOND BUSINESS IS VISIBLE AT ALL. Viewed from 1st
     * Contact, this is where Alice's Plumbing appears against Alice's row; it is
     * membership metadata and a name, never the contents of that business.
     */
    const operates = section(view, 'Businesses they run')
    if (detail.operates.length === 0) {
      operates.append(el('p', 'builder-people__empty', 'None — they run no business.'))
    }
    for (const business of detail.operates) {
      const line = el('div', 'builder-people__business')
      line.append(el('span', 'builder-people__name', business.name))
      line.append(el('span', 'builder-people__role', business.role))
      if (business.revokedAt) line.append(el('span', 'builder-people__revoked', 'withdrawn'))
      operates.append(line)
    }

    /**
     * Their grants, as a LIST and never as a single current value.
     *
     * An account accumulates them ([[DOC-40]] §5) and effective access is the
     * best active grant covering now — so a UI showing one would misrepresent an
     * account holding two the moment billing lands. Each row names the business
     * it is for, because "this user's plan" is unrepresentable.
     */
    const grants = section(view, 'Grants')
    if (detail.grants.length === 0) {
      grants.append(el('p', 'builder-people__empty', 'No grants.'))
    }
    for (const grant of detail.grants) {
      const line = el('div', 'builder-people__grant')
      line.append(el('span', 'builder-people__plan', grant.plan))
      line.append(el('span', 'builder-people__for', grant.businessId))
      line.append(
        el('span', 'builder-people__window', grant.endsAt ? `until ${grant.endsAt}` : 'open-ended'),
      )
      line.append(el('span', 'builder-people__grantstatus', grant.status))
      if (grant.status !== 'revoked') {
        const withdraw = el('button', 'builder-people__revokegrant', 'Withdraw')
        withdraw.addEventListener('click', async () => {
          await transport.revoke(grant.id)
          await reopen(detail.person.id, view)
        })
        line.append(withdraw)
      }
      grants.append(line)
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
