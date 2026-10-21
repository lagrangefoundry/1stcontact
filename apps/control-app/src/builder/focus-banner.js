/**
 * [[REQ-424]] — the focus task, on its surface: the strip at the top of the
 * questions panel, the story board or the comparison board while the consultant
 * has the client working through it.
 *
 * ONE LINE OF WHAT TO DO, THE PROGRESS, AND DONE. The line is the consultant's
 * own (`intro`); the progress is counted by the host ("4 of 8 notes reacted to");
 * Done ends the task for the whole surface, whatever is left — skipping one item
 * stays on the item. The surface highlights the items still waiting itself.
 *
 * IT HOLDS NO STATE: it draws the plan view's `focus` when that task is for its
 * surface, and is hidden otherwise. Done answers the view as stored, which the
 * surface draws next — and the builder, seeing the task finished, starts the
 * consultant's resuming turn.
 */
import { focusAction } from './api.js'
import { FOCUS_DONE, FOCUS_DONE_TITLE, FOCUS_FAILED, FOCUS_LABEL, FOCUS_PROGRESS } from './config.js'

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/**
 * @param {object} options
 * @param {'questions' | 'story' | 'comps'} options.kind which surface this is
 * @param {() => string | null} options.site the site on screen
 * @param {(view: object) => void} options.onView Done answered the plan's view
 * @param {{focusAction?: Function}} [options.transport]
 */
export function createFocusBanner({ kind, site, onView, transport = {} }) {
  const act = transport.focusAction ?? focusAction
  const element = el('div', 'focus-banner')
  element.setAttribute('role', 'region')
  element.setAttribute('aria-label', FOCUS_LABEL)
  element.dataset.kind = kind
  element.hidden = true
  const label = el('span', 'focus-banner__label', FOCUS_LABEL)
  const intro = el('span', 'focus-banner__intro')
  const progress = el('span', 'focus-banner__progress')
  progress.setAttribute('role', 'status')
  const done = el('button', 'focus-banner__done', FOCUS_DONE)
  done.type = 'button'
  done.title = FOCUS_DONE_TITLE
  const error = el('span', 'focus-banner__error')
  error.setAttribute('role', 'alert')
  error.hidden = true
  element.append(label, intro, progress, done, error)

  done.addEventListener('click', async () => {
    const asked = site()
    if (!asked) return
    done.disabled = true
    try {
      const view = await act({ site: asked, action: 'done' })
      error.hidden = true
      if (asked === site()) onView(view)
    } catch (err) {
      error.textContent = FOCUS_FAILED(err?.message ?? String(err))
      error.hidden = false
    } finally {
      done.disabled = false
    }
  })

  return {
    element,
    /** Draw a plan view's focus task — shown only when it is this surface's. Answers the task, or `null`. */
    render(view) {
      const focus = view?.focus?.kind === kind ? view.focus : null
      element.hidden = !focus
      if (focus) {
        intro.textContent = focus.intro
        progress.textContent = FOCUS_PROGRESS[kind](focus.closed, focus.total, focus.step)
      }
      return focus
    },
  }
}
