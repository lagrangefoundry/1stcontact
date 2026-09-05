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
 * STANDARD `webui/split` + `webui/list-detail`, CONFIGURED RATHER THAN REBUILT,
 * exactly as the Library uses them. What is written here is the three functions
 * the component asks for: how a row looks, what a detail contains, and what the
 * filter means.
 */

import { mountFields } from '@lagrangefoundry/webui-fields'
import { mountListDetail } from '@lagrangefoundry/webui-list-detail'
import {
  fetchPeople,
  fetchPerson,
  openGrant,
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
 * `invitedAt` is what `provisionInvite` sets, so it is what distinguishes the two
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
    },
    onFulfil = null,
  } = options

  const element = el('div', 'builder-people')

  /** Everyone in this business. The filter narrows this; it never re-fetches. */
  let all = []
  let canFulfil = false
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

  async function openDetail(person, view) {
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
     * NOT RENDERING IT IS NOT THE GATE. `/api/admin/businesses` asks the same
     * question again for itself, because a control that is merely absent from a
     * page is not refused to anyone who can type a URL.
     */
    if (canFulfil && onFulfil) {
      const fulfil = section(view, 'Add a business')
      const button = el('button', 'builder-people__fulfil', 'Provision a business')
      button.addEventListener('click', () => onFulfil(detail.person))
      fulfil.append(button)
    }
  }

  async function reopen(personId, view) {
    view.replaceChildren()
    await openDetail({ id: personId }, view)
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
    listDetail.setItems([])
  }

  return { element, refresh, clear, stateOf }
}
