/**
 * The Debug pane — the AI network this business runs on ([[REQ-353]], [[EPIC-22]]).
 *
 * IT IS THE FRAME THE REST OF THE EPIC HANGS OFF, and it holds exactly one
 * working control today: whether this business's consultant delegates
 * construction to a cheaper worker, and — since [[REQ-357]] — the group-chat
 * switch beside it, with each agent's own session below it while that is on.
 * Before the room existed the group-chat switch was not rendered, on this
 * repository's own doctrine rather than for tidiness —
 * `delegation.json` says *off means never composed, not composed-and-refusing*,
 * `development.ts` composes no surface where there is no address, and the console
 * is unrendered when unentitled. A switch with nothing behind it is
 * present-and-refusing, which all three of those reject. The section is written
 * as a list so the second entry is an append rather than a rewrite, exactly as
 * the Settings pane was written for [[REQ-238]]'s hostname.
 *
 * IT SHOWS WHAT IS ACTUALLY IN FORCE, NEVER A DEFAULT IT DID NOT READ. The
 * origin answers three values — what the next session will compose, what this
 * business has stored, and what the deployment carries — and the sentence under
 * the switch says which of the last two the first one came from. A control drawn
 * from a guess would be inviting the operator to "change" something already set
 * the way they want it.
 *
 * IT SAYS WHEN THE CHANGE LANDS, IN WORDS. A manager holds its backend for its
 * whole life, so a flip reaches the business's next session and no turn in
 * flight. That is the semantics rather than a limitation to hide, and leaving the
 * operator to infer it is how somebody comes to conclude the switch does nothing.
 *
 * ONE CONTROL AND NOT A THREE-STATE ONE. `delegation.json` carries `enabled` and
 * `primary_writes`, and [[EPIC-22]] settled that only the first is per business:
 * *on* means whatever this deployment means by on, and `enabled: true` with the
 * consultant keeping its own hands is [[REQ-343]]'s deploy-time rollback lever
 * rather than a state anybody configures per business.
 *
 * `mountFields` AND NOT A HAND-ROLLED CHECKBOX, for the reason the Settings
 * pane's name field uses it: the component already owns the read cell, the
 * control, the commit and — the part that matters here — the ROLLBACK when the
 * origin refuses. A switch that moved and stayed moved after a 400 would be the
 * pane disagreeing with the database about a value the operator is about to act
 * on.
 */

import { mountFields } from '@lagrangefoundry/webui-fields'
import {
  fetchDelegation,
  fetchGroupChat,
  fetchPrivateSessions,
  saveDelegation,
  saveGroupChat,
} from './api.js'

/**
 * The pane's heading.
 *
 * IT IS NOT THE TAB'S LABEL, and that is [[REQ-115]]'s rule rather than a style
 * choice: a label string may appear as a literal in exactly one place, which is
 * `config.js`. It is also better prose — the strip already says *Debug*, and a
 * pane that repeats its own tab's name has spent its heading saying nothing.
 * What this says instead is what the pane is about.
 */
export const DEBUG_TITLE = 'This business’s AI network'

/** The one section today, and the shape the group-chat switch is added to. */
export const NETWORK_SECTION_TITLE = 'Network configuration'

/**
 * The switch.
 *
 * THE LABEL IS ABOUT THE WORK AND NOT ABOUT THE CONFIGURATION KEY. `enabled` is
 * what the document calls it and means nothing on screen; what an operator is
 * deciding is whether construction is handed to a cheaper session.
 */
export const DELEGATE_FIELD = Object.freeze({
  name: 'delegateToolCalls',
  label: 'Delegate construction to a worker',
  type: 'boolean',
})

/** What the switch means, said once, above the sentence about where it came from. */
export const DELEGATE_HINT =
  'With this on, the consultant briefs a cheaper worker session to build and ' +
  'reports back on what it did. With it off the consultant builds the site ' +
  'itself and has never heard of delegation — no worker, no Delegate tool, and ' +
  'the prompt it had before delegation existed.'

/** When it lands — stated, never left to be inferred. See the module header. */
export const DELEGATE_TIMING =
  'Takes effect on this business’s next conversation. A conversation already ' +
  'open keeps the arrangement it was built with.'

/**
 * Where the value in force came from — this business, or the deployment.
 *
 * THE SENTENCE NAMES THE SOURCE AND NOT JUST THE VALUE, which is the whole of
 * *"never a control rendered from a default it did not read"*: `off` inherited
 * from a deployment that does not delegate and `off` chosen for this business are
 * the same switch position and two different facts, and only one of them is
 * somebody's decision.
 *
 * AND WHERE IT IS THIS BUSINESS'S OWN, THE DEPLOYMENT'S IS STILL STATED, because
 * the question that follows an override is always *what would it be if I took
 * this back*.
 */
export function delegationSource(view) {
  if (!view) return ''
  const inForce = view.delegateToolCalls ? 'on' : 'off'
  const inherited = view.deployment ? 'on' : 'off'
  if (view.stored === null || view.stored === undefined) {
    return `Inherited from this deployment: ${inForce}.`
  }
  return `Set for this business: ${inForce}. This deployment’s own setting is ${inherited}.`
}

/** Said while the first read is in flight, so the pane is never blank-and-silent. */
/**
 * The group-chat switch ([[REQ-357]]) — the second entry the section was written
 * as a list for. Whether this business's builder conversation is a room shared by
 * the client, the consultant and the assistant.
 */
export const GROUP_CHAT_FIELD = Object.freeze({
  name: 'groupChat',
  label: 'Group chat',
  type: 'boolean',
})

export const GROUP_CHAT_HINT =
  'With this on, the builder conversation is a room: the client, the consultant ' +
  'and the assistant all post in it, each labelled. The consultant’s own ' +
  'conversation carries on unchanged as its private session, shown below. With it ' +
  'off the builder is exactly as it was, back in that conversation.'

export const GROUP_CHAT_TIMING = 'Takes effect the next time the builder conversation is opened.'

/** The heading over each agent's own session ([[REQ-357]]; EPIC-22 §2). */
export const PRIVATE_SECTION_TITLE = 'Each agent’s own session'

export const PRIVATE_HINT =
  'What each agent said to itself while deciding what to post. The room shows ' +
  'only what they posted.'

export const PRIVATE_NO_SITE = 'Open a site to see its agents’ sessions.'

export const PRIVATE_UNREADABLE = 'Could not read the agents’ sessions for this site.'

export const DEBUG_LOADING = 'Reading this business’s network configuration…'

/** Said when a read fails — a request the operator DID make, so it is reported. */
export const DEBUG_UNREADABLE =
  'Could not read this business’s network configuration. The switch is hidden ' +
  'rather than guessed at.'

/** Before a business is in scope, which is an account with nothing it may open. */
export const DEBUG_NO_BUSINESS = 'No business is open, so there is nothing here to configure.'

/**
 * Mount the pane.
 *
 * @param {object} [options]
 * @param {{load?: Function, save?: Function}} [options.transport]
 *   injected by tests; each defaults to the origin call.
 */
function paragraph(text) {
  const p = document.createElement('p')
  p.className = 'builder-debug__empty'
  p.textContent = text
  return p
}

/** One agent's session, read-only: whose, then each turn in and out ([[REQ-357]]). */
function memberSession(member) {
  const block = document.createElement('details')
  block.className = 'builder-debug__member'
  block.open = true
  const summary = document.createElement('summary')
  summary.textContent = `${member.name} (${member.role})`
  block.append(summary)
  if (member.turns.length === 0) block.append(paragraph('Nothing yet.'))
  for (const turn of member.turns) {
    const line = document.createElement('div')
    line.className = `builder-debug__turn builder-debug__turn--${turn.role}`
    const who = document.createElement('strong')
    who.textContent = turn.role === 'user' ? 'In: ' : 'Out: '
    const text = document.createElement('span')
    text.textContent = turn.markdown
    line.append(who, text)
    block.append(line)
  }
  return block
}

export function createDebugPanel(options = {}) {
  const { transport = null, onGroupChatChanged = () => {} } = options
  const load = transport?.load ?? fetchDelegation
  const save = transport?.save ?? saveDelegation
  const loadGroup = transport?.loadGroupChat ?? fetchGroupChat
  const saveGroup = transport?.saveGroupChat ?? saveGroupChat
  const loadPrivate = transport?.loadPrivate ?? fetchPrivateSessions

  const element = document.createElement('div')
  element.className = 'builder-debug'

  const heading = document.createElement('h2')
  heading.className = 'builder-debug__title'
  heading.textContent = DEBUG_TITLE
  element.append(heading)

  const section = document.createElement('section')
  section.className = 'builder-debug__section'
  const subtitle = document.createElement('h3')
  subtitle.className = 'builder-debug__subtitle'
  subtitle.textContent = NETWORK_SECTION_TITLE
  const fieldHost = document.createElement('div')
  const hint = document.createElement('p')
  hint.className = 'builder-debug__hint'
  hint.textContent = DELEGATE_HINT
  const source = document.createElement('p')
  source.className = 'builder-debug__source'
  // `status` AND NOT `alert`: where a value came from is information the
  // operator asked for by opening the tab, not a warning about anything.
  source.setAttribute('role', 'status')
  const timing = document.createElement('p')
  timing.className = 'builder-debug__hint'
  timing.textContent = DELEGATE_TIMING
  section.append(subtitle, fieldHost, hint, source, timing)

  // THE SECOND SWITCH ([[REQ-357]]), drawn only once its own read has answered:
  // a control drawn from a value it did not read is what this pane refuses.
  const groupHost = document.createElement('div')
  const groupHint = document.createElement('p')
  groupHint.className = 'builder-debug__hint'
  groupHint.textContent = GROUP_CHAT_HINT
  const groupTiming = document.createElement('p')
  groupTiming.className = 'builder-debug__hint'
  groupTiming.textContent = GROUP_CHAT_TIMING
  const groupBlock = document.createElement('div')
  groupBlock.className = 'builder-debug__group'
  groupBlock.append(groupHost, groupHint, groupTiming)

  // EACH AGENT'S OWN SESSION, while group chat is on and a site is open.
  const privateSection = document.createElement('section')
  privateSection.className = 'builder-debug__section builder-debug__private'
  const privateTitle = document.createElement('h3')
  privateTitle.className = 'builder-debug__subtitle'
  privateTitle.textContent = PRIVATE_SECTION_TITLE
  const privateHint = document.createElement('p')
  privateHint.className = 'builder-debug__hint'
  privateHint.textContent = PRIVATE_HINT
  const privateBody = document.createElement('div')
  privateSection.append(privateTitle, privateHint, privateBody)

  const notice = document.createElement('p')
  notice.className = 'builder-debug__empty'

  let fields = null
  let groupFields = null
  let businessId = null
  let site = null
  let view = null
  let groupView = null
  /**
   * WHOSE ANSWER IS STILL WANTED. The read is a round trip and the operator may
   * switch business while it is in flight; without this the previous business's
   * answer arrives last and draws its switch under this one's heading — the
   * crossing [[REQ-181]] refuses for the Library, on a control that writes.
   */
  let generation = 0

  function showNotice(text) {
    section.remove()
    notice.textContent = text
    element.append(notice)
  }

  /** Draw the switch from an answer, replacing whatever was there. */
  function draw(answer) {
    view = answer
    notice.remove()
    element.append(section)
    source.textContent = delegationSource(answer)
    fields?.destroy()
    fields = mountFields(fieldHost, {
      schema: [DELEGATE_FIELD],
      values: { [DELEGATE_FIELD.name]: answer.delegateToolCalls === true },
      layout: 'stacked',
      editable: [DELEGATE_FIELD.name],
      // `auto`, FOR THE REASON THE SETTINGS NAME FIELD GIVES: one control and no
      // other decision beside it, so a Save button would be a second click to
      // confirm the first — and `auto` reverts the control itself when the origin
      // refuses, which a hand-rolled Save would have to reimplement.
      commit: 'auto',
      onCommit: async (changes) => {
        const next = changes[DELEGATE_FIELD.name] === true
        // THE ORIGIN'S ANSWER IS WHAT THE PANE THEN SAYS, not the value that was
        // sent. The route answers the same three values the read does, so the
        // sentence under the switch is re-derived from what the database now
        // holds rather than from what this pane asked for.
        const answered = await save(next)
        view = answered
        source.textContent = delegationSource(answered)
      },
    })
  }

  /**
   * Show a business, or nothing.
   *
   * A REMOUNT AND NOT A `setValues`, for the reason the Settings pane remounts:
   * this is a DIFFERENT business's configuration rather than the same one
   * redrawn, and a control still holding the previous business's value — over a
   * heading naming this one — is the worst version of that crossing, because the
   * next thing the operator does is click it.
   */
  /** Draw the group-chat switch from the answer read ([[REQ-357]]). */
  function drawGroup(answer) {
    groupView = answer
    groupFields?.destroy()
    section.append(groupBlock)
    groupFields = mountFields(groupHost, {
      schema: [GROUP_CHAT_FIELD],
      values: { [GROUP_CHAT_FIELD.name]: answer.groupChat === true },
      layout: 'stacked',
      editable: [GROUP_CHAT_FIELD.name],
      commit: 'auto',
      onCommit: async (changes) => {
        groupView = await saveGroup(changes[GROUP_CHAT_FIELD.name] === true)
        void drawPrivate()
        onGroupChatChanged(groupView)
      },
    })
    void drawPrivate()
  }

  /** Each agent's own session, for the site in scope ([[REQ-357]]). */
  async function drawPrivate() {
    const mine = generation
    if (groupView?.groupChat !== true) {
      privateSection.remove()
      return
    }
    element.append(privateSection)
    if (!site) {
      privateBody.replaceChildren(paragraph(PRIVATE_NO_SITE))
      return
    }
    let answer
    try {
      answer = await loadPrivate(site)
    } catch {
      answer = undefined
    }
    if (mine !== generation) return
    if (!answer) {
      privateBody.replaceChildren(paragraph(PRIVATE_UNREADABLE))
      return
    }
    privateBody.replaceChildren(...answer.members.map(memberSession))
  }

  function setBusiness(next) {
    businessId = next ?? null
    fields?.destroy()
    fields = null
    groupFields?.destroy()
    groupFields = null
    groupBlock.remove()
    privateSection.remove()
    view = null
    groupView = null
    source.textContent = ''
    const mine = ++generation
    if (!businessId) {
      showNotice(DEBUG_NO_BUSINESS)
      return
    }
    // CLEARED BEFORE THE READ, NOT AFTER IT, and the read is allowed to fail.
    // Leaving the previous business's switch on screen under this one's heading
    // is the one outcome a failure here may not produce.
    showNotice(DEBUG_LOADING)
    const delegation = load()
      .then((answer) => {
        if (mine !== generation) return
        draw(answer)
      })
      .catch(() => {
        if (mine !== generation) return
        // REPORTED AND NOT SILENT, unlike the Settings pane's background reads:
        // this is the only thing on the tab, and a tab that drew nothing and
        // said nothing would read as a tab that is not finished.
        showNotice(DEBUG_UNREADABLE)
      })
    // THE GROUP-CHAT SWITCH ([[REQ-357]]), after the delegation read and only
    // where that drew a section to sit in. A read that fails draws no switch:
    // the tab still answers the question it already answered.
    const group = delegation
      .then(() => (mine === generation && view !== null ? loadGroup() : null))
      .then((answer) => {
        if (answer && mine === generation && view !== null) drawGroup(answer)
      })
      .catch(() => {})
    return Promise.all([delegation, group]).then(() => {})
  }

  /** Which site's agents the private-session view reads ([[REQ-357]]). */
  function setSite(next) {
    site = next ?? null
    return drawPrivate()
  }

  return {
    element,
    setBusiness,
    /** What the pane believes is in force — for the host and for a suite. */
    getView: () => view,
    /** The group-chat switch's answer ([[REQ-357]]). */
    getGroupView: () => groupView,
    setSite,
    /** Which business it is drawing — for the host and for a suite. */
    getBusiness: () => businessId,
    /** Read again and follow the answer — the same path `setBusiness` takes. */
    reload: () => setBusiness(businessId),
    clear: () => setBusiness(null),
    destroy() {
      fields?.destroy()
      fields = null
      groupFields?.destroy()
      groupFields = null
      element.remove()
    },
  }
}
