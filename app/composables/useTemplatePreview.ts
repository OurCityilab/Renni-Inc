import {
  onMounted,
  onScopeDispose,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter
} from 'vue'

// Fetches a markdown template from its public URL so the deliverable detail
// page can render it inline. Kept narrow:
//   - client-only fetch (starts in onMounted; SSR-safe)
//   - rebinds when the URL source changes (route navigation)
//   - aborts the in-flight request on URL change / unmount
//   - returns the raw markdown text; rendering is up to the caller
//     (we deliberately avoid adding a markdown parser dependency in this
//     pass — a whitespace-pre-wrap block reads well enough for V1)
export function useTemplatePreview(
  urlSource: MaybeRefOrGetter<string | null | undefined>
) {
  const content = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let abort: AbortController | null = null
  // Monotonic request id. Every watch fire takes a fresh id; only the latest
  // request is allowed to mutate state. Guards against an older fetch's
  // finally block (or resolved body read) flipping loading/content/error
  // after a newer fetch has already taken over.
  let latestReqId = 0

  function cancel() {
    if (abort) {
      abort.abort()
      abort = null
    }
  }

  onMounted(() => {
    watch(
      () => toValue(urlSource),
      async (url) => {
        const reqId = ++latestReqId
        cancel()
        if (!url) {
          content.value = null
          error.value = null
          loading.value = false
          return
        }
        content.value = null
        error.value = null
        loading.value = true
        abort = new AbortController()
        try {
          const res = await fetch(url, { signal: abort.signal })
          if (reqId !== latestReqId) return
          if (!res.ok) {
            throw new Error(`Template responded ${res.status}`)
          }
          const text = await res.text()
          if (reqId !== latestReqId) return
          content.value = text
        } catch (e) {
          if (reqId !== latestReqId) return
          if (e instanceof Error && e.name === 'AbortError') return
          error.value = e instanceof Error ? e.message : String(e)
        } finally {
          // Only the latest request may clear the loading flag. An older
          // request completing after a newer one has started would otherwise
          // toggle loading off while the newer fetch is still in flight.
          if (reqId === latestReqId) loading.value = false
        }
      },
      { immediate: true }
    )
  })

  onScopeDispose(() => {
    // Invalidate any in-flight request so its post-abort code paths can't
    // write to state after the component's scope has been disposed.
    latestReqId++
    cancel()
  })
  return { content, loading, error }
}
