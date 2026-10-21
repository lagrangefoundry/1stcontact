/**
 * The composer's attachments ([[REQ-414]]).
 *
 * WHAT IT REPLACED. A file dropped on the conversation used to be uploaded and
 * then announced by a line painted into the transcript AS THE CLIENT'S OWN
 * MESSAGE — which nothing ever sent. The consultant learnt of the file only from
 * the client's next words, so it looked as though it had ignored the photograph,
 * and the transcript showed a "message" the model never received.
 *
 * NOW THE FILE WAITS IN THE COMPOSER, as a chip beside the text box, and goes
 * with the next message. It is uploaded the moment it is added, so it is in the
 * Library at once; what the chip holds back is the ANNOUNCEMENT, which travels in
 * the message the client sends — one line per file, naming its label, what it is
 * for and its filename. That line is what the consultant reads and what the
 * transcript records, so the two cannot disagree: {@link decorate} draws it back
 * as a chip inside the client's bubble, live and after a reload alike.
 *
 * WHAT IT IS FOR IS CHOSEN ON THE CHIP, and the choice stays open until sending.
 * That is why every file is uploaded as `reference` and only widened to `site`
 * when the message goes: widening is always allowed, but the origin refuses to
 * narrow a file whose bytes already reached the site (`AlreadyOnSiteError`), so a
 * picture placed on upload could never be changed back to "For reference" from
 * the chip. Widening through `setRole` is the Library's own role-change path,
 * which places the picture exactly as an upload would have.
 *
 * NOT IN THE FRAMEWORK'S COMPOSER. `webui-chat` has no attachments, so this sits
 * above its input bar and takes over ▶ and Enter only while a chip is waiting —
 * with none, the composer is untouched.
 *
 * [[BUG-244]] — PICKED WITH A "+" INSIDE THE TEXT BOX, mirroring ▶: the panel's
 * own leading action (lagrange-framework REQ-214 `composerAction`), handed
 * {@link action} by the chat pane. There is no separate "Attach files" row.
 */

import { enterIntent } from '@lagrangefoundry/webui-chat'
import {
  ATTACH_BUTTON,
  ATTACH_REMOVE,
  ATTACH_ROLE_WORDS,
  ATTACH_STATUS,
  CHAT_MAX_SUBMISSION_CHARS,
  UPLOAD_ACCEPT,
} from './config.js'

/** How an attachment line starts — in the message, and so in the transcript. */
const PREFIX = '📎 Attached: '

/** The role words, lower-cased, as they appear inside an attachment line. */
const ROLE_IN_LINE = Object.fromEntries(
  Object.entries(ATTACH_ROLE_WORDS).map(([role, words]) => [role, words.toLowerCase()]),
)

/** What follows the filename when a picture could not be placed ([[BUG-181]]). */
const NOT_READY = " — It's in your Library, but isn't ready to use on the site yet: "

const LINE = new RegExp(
  `^${PREFIX}(.+?) \\((${Object.values(ROLE_IN_LINE).join('|')})\\), (.+?)(?:${NOT_READY}(.+))?$`,
)

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|svg|heic|heif)$/i
/** Pictures and fonts are for the site by default; anything else is to read. */
const SITE_EXT = /\.(jpe?g|png|gif|webp|avif|svg|heic|heif|woff2?|ttf|otf)$/i

/**
 * What a file is for until the client says otherwise — the overlay's own
 * division: photos, logos and fonts are things visitors see; the rest is reading.
 */
export function defaultRole(file) {
  const type = String(file?.type ?? '')
  return type.startsWith('image/') || type.startsWith('font/') || SITE_EXT.test(file?.name ?? '')
    ? 'site'
    : 'reference'
}

/**
 * The line a message carries for one attachment, e.g.
 * `📎 Attached: IMAGE-12 (for the site), \`shopfront.jpg\``.
 *
 * THE LABEL IS THE NAME, because it is the one the client and the consultant
 * share ([[REQ-287]]); the filename follows in backticks, which is what it is — a
 * name the bytes arrived with, not one anybody is asked to say back.
 */
export function attachmentLine({ label, filename, role, notReady = '' }) {
  const file = String(filename ?? '').replace(/`/g, '')
  const line = `${PREFIX}${label || file} (${ROLE_IN_LINE[role] ?? ROLE_IN_LINE.reference}), \`${file}\``
  return notReady ? `${line}${NOT_READY}${notReady}` : line
}

/** The parts of an attachment line, from its rendered text; null for any other. */
export function parseAttachmentLine(text) {
  const m = LINE.exec(String(text ?? '').trim())
  if (!m) return null
  const role = Object.keys(ROLE_IN_LINE).find((r) => ROLE_IN_LINE[r] === m[2])
  return { label: m[1], role, filename: m[3], notReady: m[4] ?? '' }
}

function refusalReason(err) {
  return err?.message ?? 'the upload failed'
}

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

/**
 * Build the tray.
 *
 * @param {object} spec
 * @param {(file: File, role: string) => Promise<object>} spec.upload
 *   one file to the material route; answers its envelope (uid, label, kind, role).
 * @param {(uid: string, role: string) => Promise<object>} spec.setRole
 *   the Library's role change — the widening to `site` at send time.
 * @param {(uid: string) => string} spec.fileUrl  where a material's bytes load from.
 * @param {(label: string) => Promise<{uid: string, kind?: string}|null>} [spec.findMaterial]
 *   a label the tray did not upload itself (a reloaded transcript), resolved
 *   for its thumbnail. Absent, such a chip is drawn with an icon.
 * @param {() => boolean} [spec.isBlocked] the builder is inert ([[REQ-173]]).
 * @param {() => void} [spec.onUploaded] an upload settled, either way.
 */
export function createAttachmentTray({
  upload,
  setRole,
  fileUrl,
  findMaterial = async () => null,
  isBlocked = () => false,
  onUploaded = () => {},
}) {
  const element = el('div', 'builder-attach')
  const list = el('div', 'builder-attach__chips')
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = UPLOAD_ACCEPT
  input.className = 'builder-attach__input'
  input.tabIndex = -1
  input.setAttribute('aria-hidden', 'true')
  input.addEventListener('change', () => {
    const files = Array.from(input.files ?? [])
    input.value = ''
    add(files)
  })
  element.append(list, input)

  /** @type {Array<object>} the chips, in the order they were added */
  let chips = []
  let seq = 0
  /** label → {uid, kind}, for what this page uploaded — so a sent bubble has thumbnails at once. */
  const known = new Map()
  /** Called when the set of chips changes, so ▶ can follow ({@link bind}). */
  let changed = () => {}

  const sendable = () => chips.some((c) => c.state !== 'refused')

  function add(files) {
    if (isBlocked()) return
    for (const file of files) {
      const chip = { id: `attach-${++seq}`, file, role: defaultRole(file), state: 'uploading' }
      chip.el = el('div', 'builder-attach__chip')
      chip.done = Promise.resolve()
        .then(() => upload(file, 'reference'))
        .then(
          (result) => {
            chip.result = result
            chip.state = 'ready'
            if (result?.label) known.set(result.label, { uid: result.uid, kind: result.kind })
          },
          (err) => {
            chip.state = 'refused'
            chip.error = refusalReason(err)
          },
        )
        .then(() => {
          draw(chip)
          changed()
          onUploaded()
        })
      chips.push(chip)
      list.append(chip.el)
      draw(chip)
    }
    changed()
  }

  function draw(chip) {
    const node = chip.el
    node.replaceChildren()
    node.dataset.state = chip.state
    node.title = chip.file.name
    node.append(thumb(chip))
    const text = el('span', 'builder-attach__text')
    text.append(el('span', 'builder-attach__name', chip.result?.label || chip.file.name))
    text.append(el('span', 'builder-attach__status', status(chip)))
    node.append(text)
    if (chip.state !== 'refused') {
      const select = document.createElement('select')
      select.className = 'builder-attach__role'
      select.setAttribute('aria-label', 'What it is for')
      for (const [role, words] of Object.entries(ATTACH_ROLE_WORDS)) {
        const option = el('option', '', words)
        option.value = role
        select.append(option)
      }
      select.value = chip.role
      select.addEventListener('change', () => {
        chip.role = select.value
        draw(chip)
      })
      node.append(select)
    }
    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'builder-attach__remove'
    remove.textContent = '×'
    remove.setAttribute('aria-label', `${ATTACH_REMOVE} ${chip.file.name}`)
    remove.addEventListener('click', () => drop(chip))
    node.append(remove)
  }

  function status(chip) {
    if (chip.state === 'uploading') return ATTACH_STATUS.uploading
    if (chip.state === 'refused') return chip.error
    if (chip.result?.indexed === false) return ATTACH_STATUS.unsearchable
    return chip.role === 'site' ? ATTACH_STATUS.site : ATTACH_STATUS.reference
  }

  function thumb(chip) {
    if (chip.file.type?.startsWith('image/') && typeof URL.createObjectURL === 'function') {
      chip.preview ??= URL.createObjectURL(chip.file)
      const img = el('img', 'builder-attach__thumb')
      img.src = chip.preview
      img.alt = ''
      // HEIC and its like do not draw in most browsers — the icon instead.
      img.addEventListener('error', () => img.replaceWith(icon(chip.file.type)))
      return img
    }
    return icon(chip.file.type)
  }

  function icon(type) {
    const span = el('span', 'builder-attach__icon', String(type ?? '').startsWith('image/') ? '🖼' : '📄')
    span.setAttribute('aria-hidden', 'true')
    return span
  }

  /** Take a chip out of the message. Its Library item stays: it is already uploaded. */
  function drop(chip) {
    chips = chips.filter((c) => c !== chip)
    chip.el.remove()
    if (chip.preview) URL.revokeObjectURL?.(chip.preview)
    changed()
  }

  /**
   * Hand over every chip that can go, and the lines that announce them.
   *
   * The chips leave the tray at once; a refused one stays, still saying why, until
   * the client removes it. A chip still uploading is waited for. A `site` chip is
   * widened here, which is what places it — and if the origin refuses, the line
   * says what the file actually is rather than what was asked for. A placement
   * that failed softly is said in the line too, so neither the consultant nor the
   * client reads a picture as usable that is not ([[BUG-181]]).
   */
  async function take() {
    const going = chips.filter((c) => c.state !== 'refused')
    for (const chip of going) drop(chip)
    await Promise.all(going.map((c) => c.done))
    const lines = []
    for (const chip of going) {
      if (chip.state !== 'ready') continue
      let role = chip.role
      let notReady = ''
      if (role === 'site') {
        try {
          notReady = (await setRole(chip.result.uid, 'site'))?.site_asset_error ?? ''
        } catch {
          role = 'reference'
        }
      }
      lines.push(attachmentLine({ label: chip.result.label, filename: chip.file.name, role, notReady }))
    }
    return lines
  }

  function clear() {
    for (const chip of [...chips]) drop(chip)
  }

  /**
   * Accept files dropped anywhere on `target` (the conversation).
   *
   * CAPTURED, so the composer's editor — which is inside the target and would
   * otherwise take a dropped file as content — never sees it.
   */
  function watch(target) {
    const carries = (ev) => Array.from(ev.dataTransfer?.types ?? []).includes('Files')
    const over = (ev) => {
      if (!carries(ev)) return
      ev.preventDefault()
      target.classList.add('is-dropping')
    }
    const leave = (ev) => {
      if (ev.target === target) target.classList.remove('is-dropping')
    }
    const onDrop = (ev) => {
      target.classList.remove('is-dropping')
      if (!carries(ev)) return
      ev.preventDefault()
      ev.stopPropagation()
      add(Array.from(ev.dataTransfer?.files ?? []))
    }
    target.addEventListener('dragover', over)
    target.addEventListener('dragleave', leave)
    target.addEventListener('drop', onDrop, true)
    return () => {
      target.removeEventListener('dragover', over)
      target.removeEventListener('dragleave', leave)
      target.removeEventListener('drop', onDrop, true)
    }
  }

  /**
   * Sit above a mounted chat's composer and send the chips with its next message.
   *
   * WHILE A CHIP IS WAITING, ▶ AND ENTER ARE OURS. The text is taken from the box
   * exactly as the composer would take it, the attachment lines are added below
   * it, and the whole goes through the chat's own `send` — or, while a turn runs,
   * its `interpose` (or `queue`), so [[BUG-224]]'s handling applies to it as to
   * any message — or, where the consultant has a talker, its `talk` ([[REQ-416]]). A box with nothing in it is enough: attachments alone are a
   * message. With no chip waiting nothing here acts, and the composer is its own.
   *
   * A TEXT OVER THE BOUND IS LEFT TO THE COMPOSER, which refuses it in its own
   * words ([[REQ-309]]) and keeps it in the box; the chips stay for the retry.
   *
   * @param {object} chat  the `mountChat` controller
   * @param {{interposes?: boolean, talks?: boolean}} [opts]
   * @returns {() => void} unbind
   */
  function bind(chat, { interposes = false, talks = false } = {}) {
    const bar = chat.element.querySelector('.chat-widget-input-bar')
    if (!bar) return () => {}
    bar.before(element)
    const sendBtn = bar.querySelector('.chat-widget-send-btn')

    function submit() {
      const text = chat.getInputMarkdown()
      if (text.length > CHAT_MAX_SUBMISSION_CHARS) return false
      chat.clearInput()
      void take().then((lines) => {
        const message = [text.trim(), ...lines].filter(Boolean).join('\n\n')
        if (!message) return
        if (!chat.isBusy()) return chat.send(message)
        if (talks) return chat.talk(message)
        return interposes ? chat.interpose(message) : chat.queue(message)
      })
      return true
    }

    const ours = () => sendable() && !chat.isTurnMenuOpen()
    const onKey = (ev) => {
      if (ev.isComposing || enterIntent(ev) !== 'send' || !ours()) return
      if (!submit()) return
      ev.preventDefault()
      ev.stopPropagation()
    }
    const onClick = (ev) => {
      if (!sendBtn?.contains(ev.target) || !ours()) return
      if (!submit()) return
      ev.preventDefault()
      ev.stopPropagation()
    }
    bar.addEventListener('keydown', onKey, true)
    bar.addEventListener('click', onClick, true)

    // ▶ IS ENABLED BY A CHIP, as by text. The composer disables it whenever its
    // box is empty and re-decides on every keystroke and every busy change, so
    // its decision is watched and overruled — only while a chip is waiting.
    const follow = () => {
      if (!sendBtn) return
      // Only on a real change: re-setting an attribute is itself a mutation, and
      // this runs on every mutation of it.
      const disabled = sendBtn.hasAttribute('disabled')
      if (disabled && sendable() && !chat.isBusy()) sendBtn.removeAttribute('disabled')
      else if (!disabled && !sendable() && chat.getInputMarkdown().trim() === '') sendBtn.setAttribute('disabled', '')
    }
    const watcher = new MutationObserver(follow)
    if (sendBtn) watcher.observe(sendBtn, { attributes: true, attributeFilter: ['disabled'] })
    changed = follow
    follow()

    return () => {
      bar.removeEventListener('keydown', onKey, true)
      bar.removeEventListener('click', onClick, true)
      watcher.disconnect()
      changed = () => {}
      element.remove()
    }
  }

  /**
   * Draw attachment lines inside the client's own bubbles as chips, under `root`.
   *
   * WATCHED RATHER THAN CALLED, because `mountChat` writes each message's markdown
   * itself and publishes no per-message hook — and the same lines arrive live, from
   * a queue, and from a replayed transcript. Only user bubbles are looked at, and
   * only the ones a mutation touched.
   *
   * @returns {() => void} stop watching
   */
  function decorate(root) {
    const observer = new MutationObserver((mutations) => {
      const bubbles = new Set()
      for (const m of mutations) {
        const own = m.target.closest?.('.chat-message.user')
        if (own) bubbles.add(own)
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue
          if (node.matches('.chat-message.user')) bubbles.add(node)
          for (const inner of node.querySelectorAll('.chat-message.user')) bubbles.add(inner)
        }
      }
      for (const bubble of bubbles) chipsIn(bubble)
    })
    observer.observe(root, { childList: true, subtree: true })
    for (const bubble of root.querySelectorAll('.chat-message.user')) chipsIn(bubble)
    return () => observer.disconnect()
  }

  function chipsIn(bubble) {
    for (const p of bubble.querySelectorAll('p')) {
      const parsed = parseAttachmentLine(p.textContent)
      if (parsed) p.replaceWith(attached(parsed))
    }
  }

  /** One attachment, as drawn in the transcript. */
  function attached({ label, role, filename, notReady }) {
    const chip = el('span', 'builder-attached')
    chip.dataset.label = label
    chip.dataset.role = role
    const mark = icon(IMAGE_EXT.test(filename) ? 'image/' : '')
    chip.append(mark)
    chip.append(el('span', 'builder-attached__label', label))
    chip.append(el('span', 'builder-attached__meta', `${ATTACH_ROLE_WORDS[role]} · ${filename}`))
    if (notReady) chip.append(el('span', 'builder-attached__meta', `${NOT_READY.slice(3)}${notReady}`))
    const show = (found) => {
      if (found?.kind !== 'image' || !found.uid) return
      const img = el('img', 'builder-attached__thumb')
      img.src = fileUrl(found.uid)
      img.alt = label
      mark.replaceWith(img)
    }
    if (known.has(label)) show(known.get(label))
    else Promise.resolve(findMaterial(label)).then(show, () => {})
    return chip
  }

  return {
    element,
    /**
     * [[BUG-244]] — the composer's "+", as `mountChat`'s `composerAction`: it
     * opens the file picker, and what is picked becomes chips like a drop.
     */
    action: { label: ATTACH_BUTTON, onClick: () => input.click() },
    add,
    take,
    clear,
    watch,
    bind,
    decorate,
    /** The chips waiting, for a host or a suite that wants to look. */
    items: () => chips.map((c) => ({ name: c.file.name, role: c.role, state: c.state, label: c.result?.label ?? null })),
  }
}
