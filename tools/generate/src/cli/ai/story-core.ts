/**
 * [[REQ-408]] — the story board: the client's own words about their business,
 * pinned as sticky notes, grouped into themes, with a headline at the top.
 *
 * WHY IT EXISTS. A site is made distinctive by the business's story, not by its
 * formatting, and the story is hard to get out of a client talking to an AI. A
 * marketing consultant works this stage at a whiteboard with Post-its; the board
 * does that, and because every note is the client's own words, nothing on it can
 * be invented. It is background for the copy and never changes the site itself.
 *
 * IT LIVES IN THE PLAN (`fields.board`), beside the asks and the comps, so it
 * outlives every conversation and reads the same on every path. This file owns
 * its shape, its rules, the client's half (reactions, notes, the headline) and
 * the consultant's operations; `plan-core.ts` checks it with every other part of
 * the plan and binds the operations to the plan surface. Self-contained — it
 * imports nothing from the plan — so the two files never import each other.
 *
 * TWO OWNERS, as an ask has. The consultant pins and words notes; a note the
 * client wrote, edited, or reacted to with 👍 or ❤️ is theirs, and the consultant
 * never rewords or removes it ({@link clientOwns}). The headline is offered by
 * the consultant and chosen — or written — by the client; a new offer never
 * replaces a choice.
 */
import { ledgerError } from './ledger-core'
import planSeed from './plan-seed.json'

/** The code a write that breaks a board rule is refused under (the plan's own). */
const INVALID = 'PLAN_INVALID'
const refuse = (code: string, message: string): Error => ledgerError(code, message)

/** Who wrote a note. */
export const NOTE_AUTHORS = ['consultant', 'client'] as const
/**
 * The client's four reactions. One per note, exclusive; 🗑 is not a reaction
 * but a delete, so it is not here.
 */
export const REACTIONS = ['heart', 'up', 'down'] as const
export type Reaction = (typeof REACTIONS)[number]
/** How each reaction reads, to the consultant and on the board. */
export const REACTION_EMOJI: Record<Reaction, string> = { heart: '❤️', up: '👍', down: '👎' }

/**
 * The number of themes, and the reason for it: each theme has its own colour
 * from a fixed, muted palette of this many, so a seventh would share one.
 */
export const MAX_THEMES = 6
/** The longest a note may be: a saying, not a paragraph. */
export const MAX_NOTE_CHARS = 200
/** The longest a theme name may be. */
export const MAX_THEME_CHARS = 40
/** The longest a headline may be: one line a stranger reads. */
export const MAX_HEADLINE_CHARS = 140
/** [[REQ-425]] — how many lines the card's "what I'm hearing" and "why they pick you" hold. */
export const MIN_HEARING = 2
export const MAX_HEARING = 3
export const MAX_PICKS = 3
/** The longest a kind of customer may be named on the card. */
export const MAX_CUSTOMER_CHARS = 60
/** [[REQ-425]] — the fallback card's line, when the consultant gives none of its own. */
export const FALLBACK_KNOWN_FOR = 'The most trustworthy choice, and the easiest to get hold of'
/** How many headline options one offer holds. */
export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 3

/**
 * [[REQ-416]] — the parts a small business's story usually has, from the plan
 * seed. A note may name the one it belongs to; an area with no live note is a
 * question not yet asked.
 */
export interface StoryArea {
  id: string
  label: string
}
export const STORY_AREAS: readonly StoryArea[] = planSeed.story_areas
const AREA_IDS: readonly string[] = STORY_AREAS.map((a) => a.id)

export interface StoryTheme {
  id: string
  name: string
  /** Index into the board's fixed palette, 0 … {@link MAX_THEMES} − 1. */
  colour: number
}

/** The client's last action on a note — what the next turn's notice reports. */
export type NoteAction = 'add' | 'edit' | 'react' | 'unreact' | 'delete'

export interface StoryNote {
  id: string
  text: string
  /** One emoji saying what the note is about; the consultant chooses it. */
  emoji?: string
  theme: string
  /** [[REQ-416]] — which of {@link STORY_AREAS} the note belongs to, when it fits one. */
  area?: string
  /** The sentence the note was taken from, shown on hover. */
  quote?: string
  by: string
  /** The client changed the wording of a note the consultant pinned. */
  edited?: boolean
  reaction?: Reaction
  /** 🗑 — kept, off the board, so it is reported and not pinned again. */
  deleted?: boolean
  pinned_at: string
  /** When the client last acted on it, and what they did. */
  client_at?: string
  client_did?: NoteAction
}

export interface StoryHeadline {
  /** The chosen line, once there is one. */
  text?: string
  /** [[REQ-425]] — the card line the chosen option came from; absent for the client's own line. */
  source?: string
  /** The client typed it: their words, which the consultant never overwrites. */
  yours?: boolean
  /** The offer still being decided — empty once a line is chosen. */
  options?: string[]
  /** Which option the consultant recommends. */
  pick?: number
  /** [[REQ-425]] — the positioning card line each option comes from, beside `options`. */
  sources?: string[]
  /** Options offered after a choice, opened only if the client wants. */
  new_options?: string[]
  /** [[REQ-425]] — the card line each new option comes from, beside `new_options`. */
  new_sources?: string[]
  /** Offered and not chosen: never offered again. */
  passed?: string[]
  offered_at?: string
  client_at?: string
  client_did?: 'choose' | 'write'
}

/**
 * [[REQ-425]] — what a line of the positioning card says: what the consultant is
 * hearing (two or three themes), what the business is known for, and why each kind
 * of customer picks it, through what that customer is deciding on.
 */
export const CARD_LINE_KINDS = ['hearing', 'known_for', 'pick'] as const
export type CardLineKind = (typeof CARD_LINE_KINDS)[number]

export interface CardLine {
  /** `h1`…`h3`, `known`, `p1`…`p3`: what a headline option names as its source. */
  id: string
  kind: CardLineKind
  /** A `pick` line's kind of customer. */
  customer?: string
  text: string
  /** The client reworded this line: their words now. */
  edited?: boolean
}

/**
 * [[REQ-425]] — the positioning card: the synthesis between the client's notes and
 * the headline. The consultant writes it from the notes the client hearted; the
 * client confirms it by hearting or editing it, and once they have it is theirs.
 * The headline options are written from its lines. `fallback` is the honest card
 * for a business with nothing distinctive to say yet: be the most trustworthy and
 * the easiest to contact.
 */
export interface PositioningCard {
  lines: CardLine[]
  /** The hearted notes it was written from; empty for the fallback. */
  from: string[]
  fallback?: boolean
  heart?: boolean
  /** The client edited a line. */
  edited?: boolean
  written_at: string
  client_at?: string
  client_did?: 'heart' | 'unheart' | 'edit'
  /** The line the client last edited. */
  client_line?: string
}

export interface StoryBoard {
  themes: StoryTheme[]
  notes: StoryNote[]
  headline: StoryHeadline
  /** [[REQ-425]] — absent until the consultant writes one. */
  positioning?: PositioningCard
}

/** What a plan holds the board in. */
export interface HasBoard {
  board?: StoryBoard
}

/** A new, empty board. */
export const emptyBoard = (): StoryBoard => ({ themes: [], notes: [], headline: {} })

/** The plan's board, or an empty one. Never stored by reading. */
export const boardOf = (fields: HasBoard): StoryBoard => fields.board ?? emptyBoard()

const filled = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''
const str = (v: unknown): string | undefined => (filled(v) ? v.trim() : undefined)
/** Two lines are the same offer whatever their case and spacing. */
const same = (a: string, b: string): boolean => a.trim().toLowerCase().replace(/\s+/g, ' ') === b.trim().toLowerCase().replace(/\s+/g, ' ')

/** Whether a string is exactly one emoji. */
export function isOneEmoji(value: unknown): boolean {
  if (!filled(value)) return false
  const s = value.trim()
  const graphemes = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)]
  return graphemes.length === 1 && /\p{Extended_Pictographic}/u.test(s)
}

/**
 * Whether a note is the client's: they wrote it, edited it, or said 👍 or ❤️ to
 * it. The consultant never rewords or removes such a note.
 */
export const clientOwns = (n: StoryNote): boolean =>
  n.by === 'client' || n.edited === true || n.reaction === 'heart' || n.reaction === 'up'

/** The notes on the board: everything not deleted. */
export const liveNotes = (board: StoryBoard): StoryNote[] => board.notes.filter((n) => !n.deleted)

/** [[REQ-425]] — where the positioning card stands. */
export type PositioningState = 'none' | 'written' | 'confirmed' | 'fallback'
export const positioningState = (board: StoryBoard): PositioningState => {
  const card = board.positioning
  if (!card) return 'none'
  if (card.fallback) return 'fallback'
  return card.heart === true || card.edited === true ? 'confirmed' : 'written'
}

/** [[REQ-425]] — how a card line reads where it is named as a source. */
export function cardLineLabel(line: CardLine): string {
  if (line.kind === 'known_for') return 'what you’re known for'
  if (line.kind === 'pick') return `why ${line.customer ?? 'your customers'} pick you`
  return 'what I’m hearing'
}

/** Where the headline stands. */
export type HeadlineState = 'empty' | 'offered' | 'chosen'
export const headlineState = (h: StoryHeadline): HeadlineState =>
  filled(h.text) ? 'chosen' : (h.options ?? []).length > 0 ? 'offered' : 'empty'

/**
 * The board's rules, checked with the rest of the plan on every write.
 *
 * Closed vocabularies; each theme named once, coloured once and at most
 * {@link MAX_THEMES} of them; every note on a theme the board holds, one emoji
 * where it has one, and the original sentence on every note the consultant
 * pinned — the sentence is what keeps a note the client's words.
 */
export function checkBoard(board: StoryBoard | undefined, bad: (message: string) => never): void {
  if (board === undefined) return
  if (!Array.isArray(board.themes) || !Array.isArray(board.notes) || typeof board.headline !== 'object' || board.headline === null) {
    bad('the story board needs themes, notes and a headline')
  }
  if (board.themes.length > MAX_THEMES) bad(`the story board holds at most ${MAX_THEMES} themes`)
  const themeIds = new Set<string>()
  const names = new Set<string>()
  const colours = new Set<number>()
  for (const t of board.themes) {
    if (!filled(t.id)) bad('a theme has no id')
    if (themeIds.has(t.id)) bad(`two themes are called ${t.id}`)
    themeIds.add(t.id)
    if (!filled(t.name) || t.name.length > MAX_THEME_CHARS) bad(`theme ${t.id} needs a name of at most ${MAX_THEME_CHARS} characters`)
    const key = t.name.trim().toLowerCase()
    if (names.has(key)) bad(`two themes are named ${JSON.stringify(t.name)}`)
    names.add(key)
    if (!Number.isInteger(t.colour) || t.colour < 0 || t.colour >= MAX_THEMES) bad(`theme ${t.id} has no colour of the board's`)
    if (colours.has(t.colour)) bad(`theme ${t.id} shares a colour`)
    colours.add(t.colour)
  }
  const noteIds = new Set<string>()
  for (const n of board.notes) {
    if (!filled(n.id)) bad('a note has no id')
    if (noteIds.has(n.id)) bad(`two notes are called ${n.id}`)
    noteIds.add(n.id)
    if (!filled(n.text) || n.text.length > MAX_NOTE_CHARS) bad(`note ${n.id} needs text of at most ${MAX_NOTE_CHARS} characters`)
    if (!themeIds.has(n.theme)) bad(`note ${n.id} is on theme ${JSON.stringify(n.theme)}, which the board does not hold`)
    if (!(NOTE_AUTHORS as readonly string[]).includes(n.by)) bad(`note ${n.id} has unknown author ${JSON.stringify(n.by)}`)
    if (n.by === 'consultant' && !filled(n.quote)) bad(`note ${n.id} is pinned without the sentence it came from`)
    if (n.emoji !== undefined && !isOneEmoji(n.emoji)) bad(`note ${n.id} has ${JSON.stringify(n.emoji)} as its emoji; it takes exactly one`)
    if (n.area !== undefined && !AREA_IDS.includes(n.area)) bad(`note ${n.id} is in story area ${JSON.stringify(n.area)}; the areas are ${AREA_IDS.join(', ')}`)
    if (n.reaction !== undefined && !(REACTIONS as readonly string[]).includes(n.reaction)) {
      bad(`note ${n.id} has unknown reaction ${JSON.stringify(n.reaction)}`)
    }
  }
  const h = board.headline
  if (h.text !== undefined && (!filled(h.text) || h.text.length > MAX_HEADLINE_CHARS)) bad(`the headline is at most ${MAX_HEADLINE_CHARS} characters`)
  for (const [what, list] of [['options', h.options], ['new options', h.new_options], ['passed options', h.passed]] as const) {
    if (list !== undefined && !(Array.isArray(list) && list.every(filled))) bad(`the headline's ${what} are lines of text`)
  }
  if ((h.options ?? []).length > 0 && filled(h.text)) bad('a chosen headline has no offer still open; a new offer is new_options')
  if (h.pick !== undefined && !(Number.isInteger(h.pick) && h.pick >= 0 && h.pick < (h.options ?? []).length)) {
    bad('the recommended headline is not one of the options')
  }
  checkPositioning(board.positioning, bad)
  // [[REQ-425]] — EVERY OPTION NAMES ITS CARD LINE, one for one.
  const lineIds = new Set((board.positioning?.lines ?? []).map((l) => l.id))
  for (const [list, sources] of [[h.options, h.sources], [h.new_options, h.new_sources]] as const) {
    if (sources === undefined) continue
    if (!Array.isArray(sources) || sources.length !== (list ?? []).length) bad("each headline option names the card line it comes from")
    if (!sources.every((id) => lineIds.has(id))) bad('a headline option names a line the positioning card does not have')
  }
}

/** [[REQ-425]] — the positioning card's rules. */
function checkPositioning(card: PositioningCard | undefined, bad: (message: string) => never): void {
  if (card === undefined) return
  if (!Array.isArray(card.lines) || !Array.isArray(card.from)) bad('the positioning card needs its lines and the notes it is written from')
  if (!filled(card.written_at)) bad('the positioning card needs when it was written')
  const ids = new Set<string>()
  for (const l of card.lines) {
    if (!filled(l.id) || ids.has(l.id)) bad('every line of the positioning card has its own id')
    ids.add(l.id)
    if (!(CARD_LINE_KINDS as readonly string[]).includes(l.kind)) bad(`the positioning card has a line of unknown kind ${JSON.stringify(l.kind)}`)
    if (!filled(l.text) || l.text.length > MAX_NOTE_CHARS) bad(`each line of the positioning card is at most ${MAX_NOTE_CHARS} characters`)
    if (l.kind === 'pick' && (!filled(l.customer) || l.customer.length > MAX_CUSTOMER_CHARS)) bad('a "why they pick you" line names its kind of customer')
  }
  const count = (k: CardLineKind): number => card.lines.filter((l) => l.kind === k).length
  if (count('known_for') !== 1) bad('the positioning card says once what the business is known for')
  if (!card.fallback) {
    if (count('hearing') < MIN_HEARING || count('hearing') > MAX_HEARING) bad(`the positioning card hears ${MIN_HEARING} or ${MAX_HEARING} themes`)
    if (count('pick') < 1 || count('pick') > MAX_PICKS) bad(`the positioning card gives 1 to ${MAX_PICKS} kinds of customer a reason to pick the business`)
    if (card.from.length === 0) bad('the positioning card is written from notes the client hearted')
  }
}

/** The next free id with a prefix: `n1`, `n2`, … */
function nextId(prefix: string, taken: string[]): string {
  let n = taken.length + 1
  while (taken.includes(`${prefix}${n}`)) n += 1
  return `${prefix}${n}`
}

function noteIn(board: StoryBoard, id: string): StoryNote {
  const found = board.notes.find((n) => n.id === id && !n.deleted)
  if (!found) throw refuse('UNKNOWN_NOTE', `the story board has no note ${JSON.stringify(id)}`)
  return found
}

/** A theme by id or by name (any case), or `undefined`. */
const themeNamed = (board: StoryBoard, ref: string): StoryTheme | undefined =>
  board.themes.find((t) => t.id === ref) ?? board.themes.find((t) => t.name.trim().toLowerCase() === ref.trim().toLowerCase())

function themeIn(board: StoryBoard, ref: string): StoryTheme {
  const found = themeNamed(board, ref)
  if (!found) throw refuse('UNKNOWN_THEME', `the story board has no theme ${JSON.stringify(ref)}`)
  return found
}

/** A new theme with the first free colour, or a refusal when the palette is used up. */
function addTheme(board: StoryBoard, name: string): StoryTheme {
  if (board.themes.length >= MAX_THEMES) {
    throw refuse(INVALID, `the story board holds at most ${MAX_THEMES} themes; put this under one of ${board.themes.map((t) => JSON.stringify(t.name)).join(', ')}, or rename one`)
  }
  const used = new Set(board.themes.map((t) => t.colour))
  let colour = 0
  while (used.has(colour)) colour += 1
  const theme = { id: nextId('th', board.themes.map((t) => t.id)), name: name.trim(), colour }
  board.themes.push(theme)
  return theme
}

/** The plan's board for writing: the stored one, or a new one put in place. */
const boardFor = (fields: HasBoard): StoryBoard => (fields.board = fields.board ?? emptyBoard())

/** What the client may do on the board, from the Story pane. */
export const BOARD_ACTIONS = ['react', 'delete', 'add', 'edit', 'choose', 'write', 'heart_card', 'edit_card'] as const

/**
 * The client acting on the board ([[REQ-408]]): a reaction, a delete, a note
 * added or edited, a headline chosen or written.
 *
 * THE CLIENT'S HALF OF THE OWNERSHIP RULE, and the only path that writes
 * `by: client`, `edited` or a reaction. Every action stamps `client_at` and what
 * was done, which is what the consultant's next turn is told.
 *
 * Pure: it changes a copy of `fields` (the caller's) and checks nothing itself —
 * the plan's write runs every rule on the result.
 */
export function boardClientAction(fields: HasBoard, input: Record<string, unknown>, at: string): void {
  const board = boardFor(fields)
  const action = String(input.action ?? '')
  const text = str(input.text)
  if (action === 'react') {
    const n = noteIn(board, String(input.note ?? ''))
    const reaction = input.reaction === null || input.reaction === undefined || input.reaction === '' ? undefined : String(input.reaction)
    if (reaction !== undefined && !(REACTIONS as readonly string[]).includes(reaction)) {
      throw refuse(INVALID, `a reaction is one of ${REACTIONS.join(', ')}`)
    }
    // ONE AT A TIME, AND THE SAME ONE AGAIN CLEARS IT.
    if (reaction === undefined || n.reaction === reaction) {
      delete n.reaction
      n.client_did = 'unreact'
    } else {
      n.reaction = reaction as Reaction
      n.client_did = 'react'
    }
    n.client_at = at
  } else if (action === 'delete') {
    const n = noteIn(board, String(input.note ?? ''))
    n.deleted = true
    n.client_did = 'delete'
    n.client_at = at
  } else if (action === 'add') {
    const theme = themeIn(board, String(input.theme ?? ''))
    if (!text) throw refuse(INVALID, 'a note needs some words')
    board.notes.push({
      id: nextId('n', board.notes.map((n) => n.id)),
      text,
      theme: theme.id,
      by: 'client',
      pinned_at: at,
      client_at: at,
      client_did: 'add',
    })
  } else if (action === 'edit') {
    const n = noteIn(board, String(input.note ?? ''))
    if (!text) throw refuse(INVALID, 'a note needs some words; delete it to take it off the board')
    if (text === n.text) return
    n.text = text
    if (n.by !== 'client') n.edited = true
    // A NOTE THE CLIENT ADDED AND THEN EDITED IS STILL ONE THEY ADDED, as far as
    // a consultant who has not heard of it yet is concerned.
    if (n.client_did !== 'add') n.client_did = 'edit'
    n.client_at = at
  } else if (action === 'choose') {
    const h = board.headline
    const option = str(input.option)
    const offered = [...(h.options ?? []), ...(h.new_options ?? [])]
    if (!option || !offered.includes(option)) throw refuse(INVALID, 'that is not one of the headlines on offer')
    settleHeadline(h, option, false, at, 'choose')
  } else if (action === 'write') {
    if (!text) throw refuse(INVALID, 'a headline needs some words')
    // TYPING OVER AN OFFER IS A CHOICE: their line becomes the headline and the
    // options are dismissed.
    settleHeadline(board.headline, text, true, at, 'write')
  } else if (action === 'heart_card' || action === 'edit_card') {
    // [[REQ-425]] — THE CLIENT CONFIRMS THE CARD by hearting it or putting it in
    // their own words; the heart toggles, as a note's does.
    const card = board.positioning
    if (!card) throw refuse('NO_POSITIONING', 'there is no positioning card on the board yet')
    if (action === 'heart_card') {
      card.heart = card.heart !== true
      card.client_did = card.heart ? 'heart' : 'unheart'
    } else {
      const line = card.lines.find((l) => l.id === String(input.line ?? ''))
      if (!line) throw refuse(INVALID, `the positioning card has no line ${JSON.stringify(input.line ?? '')}`)
      if (!text) throw refuse(INVALID, 'a line of the card needs some words')
      if (text === line.text) return
      line.text = text
      line.edited = true
      card.edited = true
      card.client_did = 'edit'
      card.client_line = line.id
    }
    card.client_at = at
  } else {
    throw refuse(INVALID, `unknown action ${JSON.stringify(action)}`)
  }
}

/** The headline settled on `text`; everything on offer and not taken is passed. */
function settleHeadline(h: StoryHeadline, text: string, yours: boolean, at: string, did: 'choose' | 'write'): void {
  const passed = [...(h.passed ?? []), ...(h.options ?? []), ...(h.new_options ?? [])].filter((o) => !same(o, text))
  // [[REQ-425]] — a chosen option keeps the card line it came from.
  const offered = [...(h.options ?? []), ...(h.new_options ?? [])]
  const sources = [...(h.sources ?? []), ...(h.new_sources ?? [])]
  const source = yours ? undefined : sources[offered.findIndex((o) => o === text)]
  if (source) h.source = source
  else delete h.source
  h.text = text
  h.yours = yours
  h.passed = passed.filter((o, i) => passed.findIndex((x) => same(x, o)) === i)
  delete h.options
  delete h.pick
  delete h.sources
  delete h.new_options
  delete h.new_sources
  h.client_at = at
  h.client_did = did
}

type Params = Record<string, unknown>
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Pin the client's sayings as notes ([[REQ-408]]): the consultant's `pin_notes`,
 * as an edit of the fields in hand. Mutates `fields`; answers what was pinned.
 */
export function pinNotes(fields: HasBoard, p: Params, at: string): Record<string, unknown> {
  const board = boardFor(fields)
  const notes = Array.isArray(p.notes) ? (p.notes as Params[]) : []
  if (notes.length === 0) throw refuse(INVALID, 'give at least one note to pin')
  const pinned: StoryNote[] = []
  for (const n of notes) {
    const text = str(n?.text)
    const quote = str(n?.quote)
    const themeRef = str(n?.theme)
    if (!text) throw refuse(INVALID, 'a note needs its text')
    if (!quote) throw refuse(INVALID, `"${text}" needs the sentence the client said it in, as quote`)
    if (!isOneEmoji(n?.emoji)) throw refuse(INVALID, `"${text}" needs exactly one emoji saying what it is about`)
    if (!themeRef) throw refuse(INVALID, `"${text}" needs a theme`)
    const area = str(n?.area)
    if (area !== undefined && !AREA_IDS.includes(area)) {
      throw refuse(INVALID, `"${text}" names story area ${JSON.stringify(area)}; the areas are ${AREA_IDS.join(', ')}`)
    }
    // A THEME NAMED AND NOT YET ON THE BOARD IS STARTED BY PINNING TO IT.
    const theme = themeNamed(board, themeRef) ?? addTheme(board, themeRef)
    const note: StoryNote = {
      id: nextId('n', board.notes.map((x) => x.id)),
      text,
      emoji: String(n.emoji).trim(),
      theme: theme.id,
      quote,
      ...(area ? { area } : {}),
      by: 'consultant',
      pinned_at: at,
    }
    board.notes.push(note)
    pinned.push(note)
  }
  return { notes: pinned.map((n) => ({ id: n.id, text: n.text, theme: themeIn(board, n.theme).name })) }
}

/**
 * Offer headlines ([[REQ-408]]): the consultant's `offer_headlines`, as an edit of
 * the fields in hand. Mutates `fields`; answers the headline.
 */
export function offerHeadlines(fields: HasBoard, p: Params, at: string): Record<string, unknown> {
  const board = boardFor(fields)
  const h = board.headline
  const options = (Array.isArray(p.options) ? p.options : []).map((o) => String(o).trim()).filter(Boolean)
  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    throw refuse(INVALID, `offer ${MIN_OPTIONS} or ${MAX_OPTIONS} headlines`)
  }
  const long = options.find((o) => o.length > MAX_HEADLINE_CHARS)
  if (long) throw refuse(INVALID, `"${long.slice(0, 40)}…" is longer than one line (${MAX_HEADLINE_CHARS} characters)`)
  // [[REQ-425]] — WRITTEN FROM THE POSITIONING CARD, NEVER FROM NOTHING: each
  // option names the line of the card it comes from.
  const card = board.positioning
  if (!card) throw refuse('NO_POSITIONING', 'write the positioning card first (write_positioning); headlines are written from its lines')
  const sources = (Array.isArray(p.sources) ? p.sources : []).map((x) => String(x).trim())
  const ids = card.lines.map((l) => l.id)
  if (sources.length !== options.length || !sources.every((id) => ids.includes(id))) {
    throw refuse(INVALID, `give sources: for each option, the id of the card line it comes from (${ids.join(', ')})`)
  }
  // OFFERED-NOT-CHOSEN IS NEVER OFFERED AGAIN.
  const again = options.find((o) => (h.passed ?? []).some((x) => same(x, o)) || (filled(h.text) && same(h.text, o)))
  if (again) throw refuse(INVALID, `"${again}" was offered before; offer something new`)
  const pick = typeof p.pick === 'number' ? p.pick : Number(p.pick ?? 0)
  if (!Number.isInteger(pick) || pick < 0 || pick >= options.length) throw refuse(INVALID, 'pick is the index of your recommended option')
  // A NEW OFFER NEVER REPLACES A CHOICE: after one, it waits as new options.
  if (filled(h.text)) {
    const order = [pick, ...options.map((_, i) => i).filter((i) => i !== pick)]
    h.new_options = order.map((i) => options[i])
    h.new_sources = order.map((i) => sources[i])
  } else {
    h.passed = [...(h.passed ?? []), ...(h.options ?? [])]
    h.options = options
    h.sources = sources
    h.pick = pick
  }
  h.offered_at = at
  return { headline: h }
}

/**
 * [[REQ-425]] — write the positioning card: the consultant's `write_positioning`,
 * as an edit of the fields in hand. Mutates `fields`; answers the card.
 *
 * WRITTEN FROM HEARTED NOTES, like the headline was before it, and replaced
 * whole while it is still the consultant's. Once the client has hearted or edited
 * it, it is theirs: a change is suggested in the conversation. `fallback` writes
 * the honest card instead — nothing distinctive yet, so be the most trustworthy
 * and the easiest to contact — which needs no hearts.
 */
export function writePositioning(fields: HasBoard, p: Params, at: string): PositioningCard {
  const board = boardFor(fields)
  const old = board.positioning
  if (old && !old.fallback && (old.heart || old.edited)) {
    throw refuse('CLIENTS_WORDS', `the client has ${old.edited ? 'put the positioning card in their own words' : 'hearted the positioning card'}; it is theirs now, so suggest a change in the conversation instead`)
  }
  const lines: CardLine[] = []
  const fallback = p.fallback === true
  const hearing = (Array.isArray(p.hearing) ? p.hearing : []).map((x) => String(x).trim()).filter(Boolean)
  const known = str(p.known_for) ?? (fallback ? FALLBACK_KNOWN_FOR : undefined)
  const picks = Array.isArray(p.picks) ? (p.picks as Params[]) : []
  const from = (Array.isArray(p.from) ? p.from : []).map(String)
  if (!fallback) {
    if (hearing.length < MIN_HEARING || hearing.length > MAX_HEARING) {
      throw refuse(INVALID, `give hearing: the ${MIN_HEARING} or ${MAX_HEARING} themes you are hearing, one short line each`)
    }
    if (!known) throw refuse(INVALID, 'give known_for: one line on what the business is known for')
    if (picks.length < 1 || picks.length > MAX_PICKS) {
      throw refuse(INVALID, `give picks: for 1 to ${MAX_PICKS} kinds of customer, why they pick the business, through what they are deciding on`)
    }
    if (from.length === 0) throw refuse(INVALID, 'name the hearted notes the card is written from, in from')
    for (const id of from) {
      if (noteIn(board, id).reaction !== 'heart') throw refuse(INVALID, `note ${id} has no heart; the card is written from the notes the client hearted`)
    }
  }
  hearing.forEach((text, i) => lines.push({ id: `h${i + 1}`, kind: 'hearing', text }))
  lines.push({ id: 'known', kind: 'known_for', text: known! })
  picks.forEach((pk, i) => {
    const customer = str(pk?.customer)
    const why = str(pk?.why)
    if (!customer || !why) throw refuse(INVALID, 'each of picks is {"customer": ..., "why": ...}')
    lines.push({ id: `p${i + 1}`, kind: 'pick', customer, text: why })
  })
  const card: PositioningCard = { lines, from: fallback ? [] : from, ...(fallback ? { fallback: true } : {}), written_at: at }
  board.positioning = card
  return card
}

/**
 * The consultant's board operations ([[REQ-408]]), bound by the plan surface to
 * its own checked, compare-and-set `change`.
 */
export function boardOperations(
  change: (edit: (fields: HasBoard) => Record<string, unknown>) => Promise<Record<string, unknown>>,
  now: () => string,
): Record<string, (p: Params) => Promise<Untyped>> {
  return {
    pin_notes: (p) => change((fields) => pinNotes(fields, p, now())),
    reword_note: (p) =>
      change((fields) => {
        const board = boardFor(fields)
        const n = noteIn(board, String(p.note ?? ''))
        const text = str(p.text)
        if (text !== undefined && text !== n.text) {
          // THE CLIENT'S WORDING STANDS. Suggest a change in the conversation instead.
          if (clientOwns(n)) {
            throw refuse('CLIENTS_WORDS', `note ${n.id} is the client's wording${n.reaction ? ` (they gave it ${REACTION_EMOJI[n.reaction]})` : ''}; suggest a change in the conversation instead`)
          }
          n.text = text
          // A REWORDED 👎 IS A FRESH OFFER: the old reaction was to the old words.
          if (n.reaction === 'down') delete n.reaction
        }
        if (p.emoji !== undefined) {
          if (!isOneEmoji(p.emoji)) throw refuse(INVALID, 'a note takes exactly one emoji')
          n.emoji = String(p.emoji).trim()
        }
        return { note: n }
      }),
    move_note: (p) =>
      change((fields) => {
        const board = boardFor(fields)
        const n = noteIn(board, String(p.note ?? ''))
        const ref = str(p.theme)
        if (!ref) throw refuse(INVALID, 'name the theme to move the note to')
        n.theme = (themeNamed(board, ref) ?? addTheme(board, ref)).id
        return { note: n }
      }),
    remove_note: (p) =>
      change((fields) => {
        const board = boardFor(fields)
        const n = noteIn(board, String(p.note ?? ''))
        if (clientOwns(n)) throw refuse('CLIENTS_WORDS', `note ${n.id} is the client's; only they take it off the board`)
        board.notes = board.notes.filter((x) => x.id !== n.id)
        return { removed: n.id }
      }),
    set_theme: (p) =>
      change((fields) => {
        const board = boardFor(fields)
        const name = str(p.name)
        if (!name) throw refuse(INVALID, 'a theme needs a name')
        const ref = str(p.theme)
        if (ref) {
          const t = themeIn(board, ref)
          t.name = name
          return { theme: t }
        }
        return { theme: themeNamed(board, name) ?? addTheme(board, name) }
      }),
    offer_headlines: (p) => change((fields) => offerHeadlines(fields, p, now())),
  }
}

/**
 * The board as the Story pane draws it: themes with their colours, each with its
 * live notes, and the headline as it stands.
 */
export interface BoardView {
  themes: (StoryTheme & { notes: Omit<StoryNote, 'deleted' | 'client_at' | 'client_did' | 'pinned_at'>[] })[]
  headline: {
    state: HeadlineState
    text?: string
    yours?: boolean
    options: string[]
    pick: number
    new_options: string[]
    /** [[REQ-425]] — the card line each option, and each new option, comes from (`''` for none). */
    sources: string[]
    new_sources: string[]
    /** The card line the chosen headline came from. */
    source?: string
  }
  /** [[REQ-425]] — the positioning card, or `null` before one is written. */
  positioning: {
    state: PositioningState
    heart: boolean
    lines: (CardLine & { label: string })[]
  } | null
}

export function boardView(fields: HasBoard): BoardView {
  const board = boardOf(fields)
  const live = liveNotes(board)
  const h = board.headline
  return {
    themes: board.themes.map((t) => ({
      ...t,
      notes: live
        .filter((n) => n.theme === t.id)
        .map(({ deleted: _d, client_at: _c, client_did: _w, pinned_at: _p, ...shown }) => shown),
    })),
    headline: {
      state: headlineState(h),
      ...(filled(h.text) ? { text: h.text, yours: h.yours === true } : {}),
      options: h.options ?? [],
      pick: h.pick ?? 0,
      new_options: h.new_options ?? [],
      sources: (h.options ?? []).map((_, i) => h.sources?.[i] ?? ''),
      new_sources: (h.new_options ?? []).map((_, i) => h.new_sources?.[i] ?? ''),
      ...(h.source ? { source: h.source } : {}),
    },
    positioning: board.positioning
      ? {
          state: positioningState(board),
          heart: board.positioning.heart === true,
          lines: board.positioning.lines.map((l) => ({ ...l, label: cardLineLabel(l) })),
        }
      : null,
  }
}

/** One thing the client did on the board after a cursor. */
export interface BoardChange {
  at: string
  line: string
}

const quoted = (text: string, max = 60): string => JSON.stringify(text.length <= max ? text : `${text.slice(0, max - 1)}…`)

/**
 * What the client did on the board after `since`, oldest first ([[REQ-408]]).
 *
 * READ OFF THE CLIENT'S OWN STAMPS (`client_at`), so nothing the consultant did
 * is reported back to her. Several actions on one note since her last turn are
 * reported as where it now stands.
 */
export function boardChangesSince(fields: HasBoard, since: string): BoardChange[] {
  const board = boardOf(fields)
  const themeName = (id: string): string => board.themes.find((t) => t.id === id)?.name ?? id
  const out: BoardChange[] = []
  for (const n of board.notes) {
    if (!filled(n.client_at) || n.client_at <= since) continue
    const what = `${n.id} ${quoted(n.text)}`
    const line =
      n.client_did === 'delete'
        ? `deleted ${what}`
        : n.client_did === 'add'
          ? `added ${what} under ${themeName(n.theme)}${n.reaction ? ` and gave it ${REACTION_EMOJI[n.reaction]}` : ''}`
          : n.client_did === 'edit'
            ? `reworded ${n.id} to ${quoted(n.text)}${n.reaction ? ` and gave it ${REACTION_EMOJI[n.reaction]}` : ''}`
            : n.client_did === 'unreact'
              ? `took back their reaction to ${what}`
              : `gave ${what} ${REACTION_EMOJI[n.reaction as Reaction] ?? n.reaction}`
    out.push({ at: n.client_at, line })
  }
  // [[REQ-425]] — the positioning card, as it now stands.
  const card = board.positioning
  if (card && filled(card.client_at) && card.client_at > since) {
    const line = card.lines.find((l) => l.id === card.client_line)
    out.push({
      at: card.client_at,
      line:
        card.client_did === 'heart'
          ? 'hearted the positioning card'
          : card.client_did === 'unheart'
            ? 'took back their heart on the positioning card'
            : `reworded the positioning card's ${line ? `${line.id} (${cardLineLabel(line)}) line to ${quoted(line.text)}` : 'lines'}`,
    })
  }
  const h = board.headline
  if (filled(h.client_at) && h.client_at > since && filled(h.text)) {
    out.push({
      at: h.client_at,
      line: h.client_did === 'write' ? `wrote their own headline ${quoted(h.text, 140)}` : `chose the headline ${quoted(h.text, 140)}`,
    })
  }
  return out.sort((x, y) => x.at.localeCompare(y.at))
}

/** The bound on the board notice: it rides a turn, like the plan-answers line. */
export const BOARD_NOTICE_BUDGET_CHARS = 700

/**
 * The notice line, or `null` when the client did nothing on the board. The count
 * is exact; the entries are what get cut, as in the plan-answers line.
 */
export function boardChangesLine(changes: BoardChange[], budget = BOARD_NOTICE_BUDGET_CHARS): string | null {
  if (changes.length === 0) return null
  const head = `Your client worked on the story board since your last turn (${changes.length} change${changes.length === 1 ? '' : 's'}): `
  const room = budget - head.length - 1
  const shown: string[] = []
  let used = 0
  for (const c of changes) {
    if (used + c.line.length + 2 > room - 40 && shown.length > 0) break
    shown.push(c.line)
    used += c.line.length + 2
  }
  const rest = changes.length - shown.length
  const tail = rest > 0 ? ` — and ${rest} more (read_plan for them)` : ''
  const thumbsDown = changes.some((c) => c.line.startsWith('gave') && c.line.endsWith('👎'))
  return `${head}${shown.join('; ')}${tail}.${thumbsDown ? ' Ask about each 👎, or offer a better wording.' : ''}`
}

/**
 * Where "Getting to know you" stands against the board's finish line: every
 * theme has a reaction, a note has a heart, and the headline is chosen — or was
 * offered once and passed over. Answers what is still missing; empty when met.
 */
export function boardFinishGaps(fields: HasBoard): string[] {
  const board = boardOf(fields)
  const live = liveNotes(board)
  const card = positioningState(board)
  if (live.length === 0 && card !== 'fallback') return ['nothing is pinned yet']
  const gaps: string[] = []
  const quiet = board.themes.filter((t) => live.some((n) => n.theme === t.id) && !live.some((n) => n.theme === t.id && n.reaction))
  if (quiet.length) gaps.push(`no reaction yet on ${quiet.map((t) => t.name).join(', ')}`)
  // [[REQ-425]] — THE STAGE ENDS ON A CONFIRMED POSITIONING CARD, or on the honest
  // fallback recorded as a decision — which is written from no hearts.
  if (card !== 'fallback' && !live.some((n) => n.reaction === 'heart')) gaps.push('no note has a heart')
  if (card === 'none') gaps.push('no positioning card')
  else if (card === 'written') gaps.push('the positioning card is not confirmed (the client hearts or edits it)')
  const h = board.headline
  if (headlineState(h) === 'empty' && (h.passed ?? []).length === 0) gaps.push('no headline offered')
  return gaps
}

/**
 * [[REQ-416]] — the story areas the board holds no live note for, in the seed's
 * order: what the talker asks about next while a build runs.
 */
export function missingStoryAreas(fields: HasBoard): StoryArea[] {
  const covered = new Set(liveNotes(boardOf(fields)).map((n) => n.area).filter(Boolean))
  return STORY_AREAS.filter((a) => !covered.has(a.id))
}

/** The board as one line of the per-turn plan entry. */
export function boardReminderLine(fields: HasBoard): string {
  const board = boardOf(fields)
  const live = liveNotes(board)
  if (live.length === 0 && !board.positioning) {
    return 'Story board: empty. Pin the client\'s own sayings with pin_notes as they talk, and tell them in one line.'
  }
  const count = (r: Reaction): number => live.filter((n) => n.reaction === r).length
  const h = board.headline
  const headline =
    headlineState(h) === 'chosen'
      ? `headline chosen${h.yours ? ' (their words)' : ''}: ${quoted(h.text!, 100)}`
      : headlineState(h) === 'offered'
        ? `headline offered (${(h.options ?? []).length} options), not yet chosen`
        : (h.passed ?? []).length
          ? 'headline offered once and passed over'
          : 'no headline yet'
  const gaps = boardFinishGaps(fields)
  const card = { none: 'no positioning card', written: 'positioning card written, not confirmed', confirmed: 'positioning card confirmed', fallback: 'positioning fallback recorded' }[positioningState(board)]
  return (
    `Story board: ${live.length} notes in ${board.themes.length} themes (${board.themes.map((t) => t.name).join(', ')}); ` +
    `❤️ ${count('heart')}, 👍 ${count('up')}, 👎 ${count('down')}; ${card}; ${headline}.` +
    (gaps.length ? ` For "Getting to know you" to finish: ${gaps.join('; ')}.` : '')
  )
}
