/**
 * The story board ([[REQ-408]]) — the preview pane's third mode, beside View and
 * Edit: the client's own words about their business, pinned as sticky notes,
 * grouped into themes, with a headline at the top.
 *
 * IT HOLDS NO STATE OF ITS OWN BEYOND WHAT IS ON SCREEN. It draws the board from
 * the plan panel's view (`/api/plan`) and writes back through `/api/plan/board`,
 * and every write answers the view as stored, which is what is drawn next. The
 * only local state is the client's hand: which headline option they are looking
 * at, whether the Choose… panel is open, which note they are typing in.
 *
 * ITS OWN FIXED STYLE, THE SAME FOR EVERY BUSINESS. The board is about messaging,
 * not styling, so it never takes the site's colours or fonts: it lives in the
 * builder's own document, never the preview frame, and its stylesheet names
 * literal values only. Every visual element tells the client something or makes
 * the board easier to read — the theme colour and the written theme name, the
 * emoji, the reaction badges, the pale 👎 and the lifted ❤️ — except the slight
 * tilt of each note, the one decorative touch, and one motion: a note fades in
 * when it is pinned (off under reduced motion, in the stylesheet).
 *
 * A REDRAW NEVER TAKES A FIELD FROM UNDER THE CLIENT: while they are typing in
 * the board, a new view waits until they leave the box.
 *
 * [[REQ-424]] — WHILE THE CONSULTANT HAS THE CLIENT REACTING TO NOTES, the board
 * says so: the focus banner at the top (the consultant's line, "4 of 8 notes
 * reacted to", Done), each note still waiting outlined with its reactions at full
 * strength, and the notes left for a later round tagged New.
 *
 * [[REQ-425]] — THE POSITIONING CARD sits above the headline: the consultant's
 * synthesis of the hearted notes, which the client confirms with a heart or by
 * putting a line in their own words. Each headline option says which line of the
 * card it comes from. While a task has them confirming the card or picking a
 * headline, that is what is outlined.
 */
import { boardAction } from './api.js'
import { createFocusBanner } from './focus-banner.js'
import {
  STORY_ADD_NOTE,
  STORY_BOARD_LABEL,
  STORY_CARD_EDIT,
  STORY_CARD_FALLBACK,
  STORY_CARD_HEART,
  STORY_CARD_LABEL,
  STORY_CARD_SECTIONS,
  STORY_CARD_YOURS,
  STORY_DELETE,
  STORY_EMPTY,
  STORY_FROM,
  STORY_HEADLINE_CHOOSE,
  STORY_HEADLINE_COUNT,
  STORY_HEADLINE_LABEL,
  STORY_HEADLINE_MY_PICK,
  STORY_HEADLINE_NEW,
  STORY_HEADLINE_PLACEHOLDER,
  STORY_HEADLINE_SOURCE,
  STORY_HEADLINE_USE,
  STORY_HEADLINE_WRITE_OWN,
  STORY_HEADLINE_YOURS,
  STORY_LATER,
  STORY_LATER_TITLE,
  STORY_NOTE_PLACEHOLDER,
  STORY_REACTIONS,
  STORY_SAVE_FAILED,
  STORY_YOUR_NOTE,
} from './config.js'

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const button = (className, text, label) => {
  const b = el('button', className, text)
  b.type = 'button'
  if (label) {
    b.title = label
    b.setAttribute('aria-label', label)
  }
  return b
}

/**
 * A note's tilt, in degrees: random-looking and the same on every draw, so a
 * note does not wobble each time the board redraws.
 */
export function tiltOf(id) {
  let h = 0
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) | 0
  return ((Math.abs(h) % 50) - 25) / 10
}

/** A typing box that saves when left (or on Enter) and cancels on Escape. */
function typingBox(className, value, placeholder, onSave) {
  const box = el('textarea', className)
  box.rows = 1
  box.value = value
  box.placeholder = placeholder
  let cancelled = false
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      box.blur()
    } else if (e.key === 'Escape') {
      cancelled = true
      box.blur()
    }
  })
  box.addEventListener('blur', () => {
    const text = box.value.trim()
    onSave(cancelled ? null : text)
    cancelled = false
  })
  return box
}

/**
 * @param {object} [options]
 * @param {{boardAction?: Function, focusAction?: Function}} [options.transport]
 * @param {(view: object) => void} [options.onView] a write answered the plan's view
 */
export function createStoryBoard(options = {}) {
  const transport = { boardAction, ...(options.transport ?? {}) }
  const onView = options.onView ?? null

  const element = el('section', 'story-board')
  element.setAttribute('aria-label', STORY_BOARD_LABEL)
  // [[REQ-424]] — the reaction task, when the consultant has started one.
  const focus = createFocusBanner({
    kind: 'story',
    site: () => site,
    transport,
    onView: (view) => {
      render(view)
      onView?.(view)
    },
  })
  /** [[REQ-424]] — the notes the task is waiting on, and those left for a later one. */
  let waiting = new Set()
  let later = new Set()
  const card = el('section', 'story-card')
  card.setAttribute('aria-label', STORY_CARD_LABEL)
  card.hidden = true
  const headline = el('div', 'story-headline')
  const error = el('p', 'story-board__error')
  error.hidden = true
  error.setAttribute('role', 'alert')
  const empty = el('p', 'story-board__empty', STORY_EMPTY)
  const themes = el('div', 'story-board__themes')
  element.append(focus.element, card, headline, error, empty, themes)

  let site = null
  let board = null
  /** A view that arrived while the client was typing, drawn when they stop. */
  let pending = null
  /** Which option of the offer the client is looking at; `null` is her pick. */
  let step = null
  /** The Choose… panel: `null` closed, or which list it shows. */
  let choosing = null
  /** The theme a note is being added to, and the note being reworded. */
  let adding = null
  let editing = null
  /** [[REQ-425]] — the card line being put in the client's words. */
  let cardEditing = null
  /** Every note drawn so far, so only a newly pinned one fades in. */
  let seen = null

  const typing = () => {
    const active = document.activeElement
    return Boolean(active && active.tagName === 'TEXTAREA' && element.contains(active))
  }

  element.addEventListener('focusout', () => {
    setTimeout(() => {
      if (pending && !typing()) {
        const view = pending
        pending = null
        draw(view)
      }
    }, 0)
  })

  async function act(action) {
    if (!site) return
    const asked = site
    try {
      const view = await transport.boardAction({ site: asked, ...action })
      if (asked !== site) return
      error.hidden = true
      render(view)
      onView?.(view)
    } catch (err) {
      error.textContent = STORY_SAVE_FAILED(err?.message ?? String(err))
      error.hidden = false
    }
  }

  /** [[REQ-425]] — the positioning card: three sections of lines, and the heart. */
  function drawCard(view) {
    const p = view.positioning
    card.replaceChildren()
    card.hidden = !p
    if (!p) return
    card.dataset.state = p.state
    card.classList.toggle('story-card--pending', waiting.has('positioning'))
    const head = el('div', 'story-card__head')
    head.append(el('span', 'story-card__label', STORY_CARD_LABEL))
    const heart = button('story-card__heart', STORY_CARD_HEART.emoji, STORY_CARD_HEART.label)
    heart.setAttribute('aria-pressed', String(p.heart))
    heart.addEventListener('click', () => void act({ action: 'heart_card' }))
    head.append(heart)
    card.append(head)
    if (p.state === 'fallback') card.append(el('p', 'story-card__fallback', STORY_CARD_FALLBACK))
    for (const kind of ['hearing', 'known_for', 'pick']) {
      const lines = p.lines.filter((l) => l.kind === kind)
      if (!lines.length) continue
      const section = el('div', `story-card__section story-card__section--${kind}`)
      section.append(el('h3', 'story-card__title', STORY_CARD_SECTIONS[kind]))
      const list = el('ul', 'story-card__lines')
      for (const line of lines) {
        const item = el('li', 'story-card__line')
        item.dataset.line = line.id
        if (line.customer) item.append(el('strong', 'story-card__customer', line.customer))
        if (cardEditing === line.id) {
          const box = typingBox('story-card__box', line.text, '', (text) => {
            cardEditing = null
            if (text && text !== line.text) void act({ action: 'edit_card', line: line.id, text })
            else if (board) draw(board)
          })
          item.append(box)
          queueMicrotask(() => box.focus())
        } else {
          const text = button('story-card__text', line.text, STORY_CARD_EDIT)
          text.addEventListener('click', () => {
            cardEditing = line.id
            if (board) draw(board)
          })
          item.append(text)
          if (line.edited) item.append(el('span', 'story-card__yours', STORY_CARD_YOURS))
        }
        list.append(item)
      }
      section.append(list)
      card.append(section)
    }
  }

  /** [[REQ-425]] — the card line an option comes from, as the client reads it. */
  const sourceOf = (id) => board?.positioning?.lines.find((l) => l.id === id)?.label ?? ''

  function drawHeadline(h) {
    headline.replaceChildren()
    headline.dataset.state = h.state
    headline.classList.toggle('story-headline--pending', waiting.has('headline'))
    const label = el('span', 'story-headline__label', STORY_HEADLINE_LABEL)
    const list = choosing === 'new' ? h.new_options : h.options
    const index = h.state === 'offered' ? Math.min(step ?? h.pick, h.options.length - 1) : 0
    const shown = h.state === 'chosen' ? h.text : h.state === 'offered' ? h.options[index] : ''
    const line = typingBox('story-headline__line', shown, STORY_HEADLINE_PLACEHOLDER, (text) => {
      // TYPING OVER AN OFFER IS A CHOICE; LEAVING IT AS IT WAS IS NOTHING.
      if (text && text !== shown) void act({ action: 'write', text })
    })
    line.setAttribute('aria-label', STORY_HEADLINE_LABEL)
    headline.append(label, line)
    if (h.state === 'chosen' && h.yours) headline.append(el('span', 'story-headline__yours', STORY_HEADLINE_YOURS))
    const strip = el('div', 'story-headline__strip')
    if (h.state === 'offered') {
      const prev = button('story-headline__step', '‹', 'Previous option')
      const next = button('story-headline__step', '›', 'Next option')
      prev.disabled = index === 0
      next.disabled = index === h.options.length - 1
      prev.addEventListener('click', () => {
        step = index - 1
        drawHeadline(h)
      })
      next.addEventListener('click', () => {
        step = index + 1
        drawHeadline(h)
      })
      const count = el('span', 'story-headline__count', STORY_HEADLINE_COUNT(index + 1, h.options.length))
      strip.append(prev, count, next)
      if (index === h.pick) strip.append(el('span', 'story-headline__pick', `· ${STORY_HEADLINE_MY_PICK}`))
      const from = sourceOf(h.sources?.[index])
      if (from) strip.append(el('span', 'story-headline__source', `· ${STORY_HEADLINE_SOURCE(from)}`))
      const choose = button('story-headline__choose', `· ${STORY_HEADLINE_CHOOSE}`)
      choose.setAttribute('aria-expanded', String(choosing === 'options'))
      choose.addEventListener('click', () => {
        choosing = choosing === 'options' ? null : 'options'
        drawHeadline(h)
      })
      strip.append(choose)
    } else if (h.state === 'chosen' && h.new_options.length) {
      // A NEW OFFER NEVER REPLACES A CHOICE: it waits here, opened only if wanted.
      const open = button('story-headline__new', STORY_HEADLINE_NEW(h.new_options.length))
      open.setAttribute('aria-expanded', String(choosing === 'new'))
      open.addEventListener('click', () => {
        choosing = choosing === 'new' ? null : 'new'
        drawHeadline(h)
      })
      strip.append(open)
    }
    if (strip.childElementCount) headline.append(strip)
    if (choosing && list && list.length) {
      const panel = el('ol', 'story-headline__choices')
      const sources = (choosing === 'new' ? h.new_sources : h.sources) ?? []
      for (const [i, option] of list.entries()) {
        const item = el('li', 'story-headline__choice')
        const use = button('story-headline__use', STORY_HEADLINE_USE)
        use.addEventListener('click', () => {
          choosing = null
          step = null
          void act({ action: 'choose', option })
        })
        const words = el('span', 'story-headline__option', option)
        const from = sourceOf(sources[i])
        if (from) words.append(el('small', 'story-headline__source', STORY_HEADLINE_SOURCE(from)))
        item.append(words, use)
        panel.append(item)
      }
      const own = el('li', 'story-headline__choice story-headline__choice--own')
      const write = button('story-headline__use', STORY_HEADLINE_WRITE_OWN)
      write.addEventListener('click', () => {
        choosing = null
        drawHeadline(h)
        const box = headline.querySelector('.story-headline__line')
        box.value = ''
        box.focus()
      })
      own.append(write)
      panel.append(own)
      headline.append(panel)
    }
  }

  function noteNode(note, colour) {
    const node = el('li', `story-note story-note--c${colour}`)
    node.dataset.note = note.id
    if (note.reaction) node.dataset.reaction = note.reaction
    node.style.setProperty('--tilt', `${tiltOf(note.id)}deg`)
    if (seen && !seen.has(note.id)) node.classList.add('story-note--new')
    if (waiting.has(note.id)) node.classList.add('story-note--pending')
    else if (later.has(note.id)) {
      node.classList.add('story-note--later')
      node.dataset.later = STORY_LATER
      node.title = STORY_LATER_TITLE
    }
    if (note.emoji) node.append(el('span', 'story-note__emoji', note.emoji))
    if (editing === note.id) {
      const box = typingBox('story-note__box', note.text, STORY_NOTE_PLACEHOLDER, (text) => {
        editing = null
        if (text && text !== note.text) void act({ action: 'edit', note: note.id, text })
        else if (board) draw(board)
      })
      node.append(box)
      queueMicrotask(() => box.focus())
    } else {
      const text = button('story-note__text', note.text)
      text.title = note.by === 'client' && !note.quote ? STORY_YOUR_NOTE : STORY_FROM(note.quote ?? note.text)
      text.addEventListener('click', () => {
        editing = note.id
        if (board) draw(board)
      })
      node.append(text)
    }
    const reactions = el('div', 'story-note__reactions')
    for (const r of STORY_REACTIONS) {
      const b = button(`story-note__react story-note__react--${r.id}`, r.emoji, r.label)
      b.setAttribute('aria-pressed', String(note.reaction === r.id))
      b.addEventListener('click', () => void act({ action: 'react', note: note.id, reaction: r.id }))
      reactions.append(b)
    }
    const del = button('story-note__react story-note__react--delete', STORY_DELETE.emoji, STORY_DELETE.label)
    del.addEventListener('click', () => void act({ action: 'delete', note: note.id }))
    reactions.append(del)
    node.append(reactions)
    return node
  }

  function draw(view) {
    board = view
    drawCard(view)
    drawHeadline(view.headline)
    const all = view.themes.flatMap((t) => t.notes)
    empty.hidden = all.length > 0
    themes.replaceChildren(
      ...view.themes.map((theme) => {
        const section = el('section', `story-theme story-theme--c${theme.colour}`)
        section.dataset.theme = theme.id
        // THE WRITTEN NAME MEANS COLOUR IS NEVER THE ONLY SIGNAL — and clicking it
        // adds a note, in the client's own words.
        const name = button('story-theme__name', theme.name, STORY_ADD_NOTE(theme.name))
        name.addEventListener('click', () => {
          adding = theme.id
          draw(view)
        })
        const notes = el('ul', 'story-theme__notes')
        notes.append(...theme.notes.map((n) => noteNode(n, theme.colour)))
        if (adding === theme.id) {
          const draft = el('li', `story-note story-note--c${theme.colour} story-note--draft`)
          const box = typingBox('story-note__box', '', STORY_NOTE_PLACEHOLDER, (text) => {
            adding = null
            if (text) void act({ action: 'add', theme: theme.id, text })
            else draw(view)
          })
          draft.append(box)
          notes.append(draft)
          queueMicrotask(() => box.focus())
        }
        section.append(name, notes)
        return section
      }),
    )
    seen = new Set(all.map((n) => n.id))
  }

  /** Draw a plan view's board — later, if the client is typing in the board. */
  function render(view) {
    const task = focus.render(view)
    waiting = new Set(task?.pending ?? [])
    later = new Set(view?.focus_later ?? [])
    const next = view?.board ?? {
      themes: [],
      headline: { state: 'empty', options: [], pick: 0, new_options: [], sources: [], new_sources: [] },
      positioning: null,
    }
    if (typing()) {
      pending = next
      return
    }
    draw(next)
    // ONLY A BOARD THAT WAS READ COUNTS AS SEEN: the blank drawn while a site
    // opens would otherwise make every note on it fade in as if just pinned.
    if (!view?.board) seen = null
  }

  render(null)

  return {
    element,
    render,
    /** Show a site's board: what was on screen for another site is forgotten. */
    setSite(next) {
      if (next === site) return
      site = next ?? null
      step = choosing = adding = editing = cardEditing = pending = seen = null
      render(null)
    },
    /** Put the board in the pane's host (a mount mode's `mount`). */
    mount(host) {
      host.append(element)
    },
  }
}
