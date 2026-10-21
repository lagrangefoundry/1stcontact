/**
 * [[BUG-248]] — watching the builder preview refresh itself.
 *
 * A refresh no longer reloads the frame on screen: it points a frame BEHIND it
 * at the page, and swaps that frame in once it has loaded. jsdom loads nothing,
 * so a suite sees the ask — a frame other than the shown one pointed at a URL —
 * and plays the arrival itself, with the window the newer page would have.
 *
 * Start watching AFTER the shown page has arrived: its `load` points the idle
 * channel's frame at its page once (`prime`), and that is not a refresh.
 */
export interface RefreshWatch {
  /** Every frame the panel pointed somewhere other than the shown frame, in order. */
  readonly asked: ReadonlyArray<{ frame: HTMLIFrameElement; url: string }>
  /** The newest refresh has loaded: give its frame `win` and say so with `load`. */
  arrive(win?: object): HTMLIFrameElement
  restore(): void
}

export function watchRefreshes(panel: { readonly frame: HTMLIFrameElement | null }): RefreshWatch {
  const asked: Array<{ frame: HTMLIFrameElement; url: string }> = []
  const real = HTMLIFrameElement.prototype.setAttribute
  HTMLIFrameElement.prototype.setAttribute = function (this: HTMLIFrameElement, name: string, value: string) {
    if (name === 'src' && this !== panel.frame) asked.push({ frame: this, url: String(value) })
    return real.call(this, name, value)
  }
  return {
    asked,
    arrive(win) {
      const last = asked[asked.length - 1]
      if (!last) throw new Error('no refresh was asked for')
      if (win) Object.defineProperty(last.frame, 'contentWindow', { configurable: true, value: win })
      last.frame.dispatchEvent(new Event('load'))
      return last.frame
    },
    restore() {
      HTMLIFrameElement.prototype.setAttribute = real
    },
  }
}

/**
 * A stand-in for a preview page's window: where it is, how far down, and the
 * change count it was rendered at — the `draft-at` metric on its navigation
 * entry, exactly where a browser puts the response's `Server-Timing`.
 */
export function previewWindow(opts: { path?: string; at?: number | null; scrollY?: number } = {}) {
  const win = {
    location: {
      href: `http://builder.test${opts.path ?? '/preview/alpha/draft/'}`,
      pathname: opts.path ?? '/preview/alpha/draft/',
      reload: () => {
        throw new Error('a refresh must not reload the page on screen')
      },
    },
    scrollX: 0,
    scrollY: opts.scrollY ?? 0,
    scrolledTo: [] as Array<{ left: number; top: number }>,
    scrollTo(to: { left: number; top: number }) {
      win.scrolledTo.push({ left: to.left, top: to.top })
      win.scrollY = to.top
    },
    performance: {
      getEntriesByType: (type: string) =>
        type !== 'navigation' || opts.at == null
          ? []
          : [{ serverTiming: [{ name: 'draft-at', description: String(opts.at), duration: 0 }] }],
    },
  }
  return win
}
