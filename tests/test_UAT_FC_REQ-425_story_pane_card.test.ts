// @vitest-environment jsdom
/**
 * [[REQ-425]] — **the positioning card on the Story pane**: drawn above the
 * headline slot, hearted or edited by the client, each headline option saying
 * which line of the card it comes from, and outlined while a focus task has the
 * client confirming it.
 *
 * THE REAL COMPONENT (`createStoryBoard`), with only its origin replaced at the
 * transport it already takes; the board actions it sends are recorded. The core
 * suite proves what the plan does with them.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { createStoryBoard } from '../apps/control-app/src/builder/story-board.js'
import { FOCUS_PROGRESS, STORY_CARD_SECTIONS, STORY_HEADLINE_SOURCE } from '../apps/control-app/src/builder/config.js'

const settle = async (n = 8) => {
  for (let i = 0; i < n; i += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  document.body.replaceChildren()
})

const LINES = [
  { id: 'h1', kind: 'hearing', text: 'Craft you can see', label: 'what I’m hearing' },
  { id: 'h2', kind: 'hearing', text: 'Work that holds', label: 'what I’m hearing' },
  { id: 'known', kind: 'known_for', text: 'Quality custom metalwork', label: 'what you’re known for' },
  { id: 'p1', kind: 'pick', customer: 'Contractors', text: 'certified, on time, takes the hard job', label: 'why Contractors pick you' },
]

const boardView = (headline: Record<string, unknown>, positioning: Record<string, unknown> | null) => ({
  themes: [{ id: 'th1', name: 'The work', colour: 0, notes: [{ id: 'n1', text: 'Beauty and strength', emoji: '🔥', theme: 'th1', quote: 'Beauty and strength.', by: 'consultant', reaction: 'heart' }] }],
  headline: { state: 'empty', options: [], pick: 0, new_options: [], sources: [], new_sources: [], ...headline },
  positioning,
})

function mount(view: Record<string, unknown>) {
  const sent: Record<string, unknown>[] = []
  const story = createStoryBoard({
    transport: {
      boardAction: async (action: Record<string, unknown>) => (sent.push(action), view),
      focusAction: async () => view,
    },
  })
  document.body.append(story.element)
  story.setSite('alpha')
  story.render(view)
  return { story, sent, el: story.element as HTMLElement }
}

describe('REQ-425 — the positioning card on the story board', () => {
  it('test_UAT_FC_REQ-425_the_card_sits_above_the_headline_in_its_three_parts_and_the_client_hearts_it', async () => {
    const { el, sent } = mount({ board: boardView({}, { state: 'written', heart: false, lines: LINES }) })
    const card = el.querySelector('.story-card') as HTMLElement
    expect(card.hidden).toBe(false)
    // ABOVE THE HEADLINE SLOT.
    const order = [...el.children]
    expect(order.indexOf(card)).toBeLessThan(order.indexOf(el.querySelector('.story-headline')!))
    expect([...card.querySelectorAll('.story-card__title')].map((t) => t.textContent)).toEqual([
      STORY_CARD_SECTIONS.hearing,
      STORY_CARD_SECTIONS.known_for,
      STORY_CARD_SECTIONS.pick,
    ])
    expect(card.querySelector('[data-line="p1"]')!.textContent).toContain('Contractors')
    expect(card.querySelector('[data-line="p1"]')!.textContent).toContain('certified, on time, takes the hard job')

    const heart = card.querySelector('.story-card__heart') as HTMLButtonElement
    expect(heart.getAttribute('aria-pressed')).toBe('false')
    heart.click()
    await settle()
    expect(sent).toEqual([{ site: 'alpha', action: 'heart_card' }])
  })

  it('test_UAT_FC_REQ-425_the_client_puts_a_line_of_the_card_in_their_own_words', async () => {
    const { el, sent } = mount({ board: boardView({}, { state: 'written', heart: false, lines: LINES }) })
    ;(el.querySelector('[data-line="known"] .story-card__text') as HTMLButtonElement).click()
    await settle()
    const box = el.querySelector('[data-line="known"] textarea') as HTMLTextAreaElement
    expect(box.value).toBe('Quality custom metalwork')
    box.value = 'Beauty and Strength — quality custom metalwork'
    box.dispatchEvent(new Event('blur'))
    await settle()
    expect(sent).toEqual([{ site: 'alpha', action: 'edit_card', line: 'known', text: 'Beauty and Strength — quality custom metalwork' }])
  })

  it('test_UAT_FC_REQ-425_each_headline_option_says_which_line_of_the_card_it_comes_from', async () => {
    const options = ['Beauty and Strength in Steel', 'Built to pass, built to last']
    const { el } = mount({
      board: boardView({ state: 'offered', options, pick: 0, sources: ['known', 'p1'] }, { state: 'confirmed', heart: true, lines: LINES }),
    })
    const strip = el.querySelector('.story-headline__strip') as HTMLElement
    expect(strip.textContent).toContain(STORY_HEADLINE_SOURCE('what you’re known for'))
    ;(el.querySelector('.story-headline__choose') as HTMLButtonElement).click()
    const choices = [...el.querySelectorAll('.story-headline__choice .story-headline__option')].map((o) => o.textContent)
    expect(choices).toEqual([
      `${options[0]}${STORY_HEADLINE_SOURCE('what you’re known for')}`,
      `${options[1]}${STORY_HEADLINE_SOURCE('why Contractors pick you')}`,
    ])
  })

  it('test_UAT_FC_REQ-425_a_focus_task_on_the_card_outlines_it_and_says_what_to_do', () => {
    const { el } = mount({
      board: boardView({}, { state: 'written', heart: false, lines: LINES }),
      focus: { kind: 'story', step: 'positioning', intro: 'Here is what I am hearing.', started_at: '2026-10-21T00:00:00.000Z', total: 1, closed: 0, pending: ['positioning'] },
      focus_later: [],
    })
    expect(el.querySelector('.story-card')!.classList.contains('story-card--pending')).toBe(true)
    expect(el.querySelector('.focus-banner')!.textContent).toContain(FOCUS_PROGRESS.story(0, 1, 'positioning'))
    expect(FOCUS_PROGRESS.story(0, 1, 'positioning')).toBe('Heart the card, or edit it')
    expect(FOCUS_PROGRESS.story(0, 1, 'headline')).toBe('Pick a headline')
  })

  it('test_UAT_FC_REQ-425_no_card_is_drawn_before_one_is_written', () => {
    const { el } = mount({ board: boardView({}, null) })
    expect((el.querySelector('.story-card') as HTMLElement).hidden).toBe(true)
  })
})
