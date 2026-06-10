import { useState, useEffect, useRef } from 'react'

export interface FetchState<T> {
  data:    T | null
  loading: boolean
  error:   string | null
}

export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: true, error: null })

  // Keep a ref so the effect always calls the latest fetcher without re-subscribing on every render
  const savedFetcher = useRef(fetcher)
  savedFetcher.current = fetcher

  useEffect(() => {
    let active = true
    setState(prev => ({ ...prev, loading: true, error: null }))
    savedFetcher.current()
      .then(data => { if (active) setState({ data, loading: false, error: null }) })
      .catch(err  => {
        if (active) setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Request failed',
        }))
      })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
