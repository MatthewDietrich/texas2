import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import texasMap from '../assets/texas.png'
import { useFetch } from '../hooks/useFetch'
import { getCityNames, getTopSearched } from '../api/cities'

export default function Home() {
  const navigate = useNavigate()
  const inputRef  = useRef<HTMLInputElement>(null)

  const { data: cityNames }   = useFetch(getCityNames)
  const { data: topSearched } = useFetch(() => getTopSearched(5))

  const [recentSearches, setRecentSearches] = useState<string[]>([])
  useEffect(() => {
    setRecentSearches(JSON.parse(localStorage.getItem('recentSearches') ?? '[]') as string[])
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const name = inputRef.current?.value.trim()
    if (name) navigate(`/city/${encodeURIComponent(name)}`)
  }

  function handleRandom() {
    if (cityNames && cityNames.length > 0) {
      const pick = cityNames[Math.floor(Math.random() * cityNames.length)]
      navigate(`/city/${encodeURIComponent(pick)}`)
    }
  }

  return (
    <div className="container-fluid d-flex flex-column" style={{ minHeight: '100vh' }}>
      <NavBar variant="home" />

      <main className="d-flex flex-row flex-grow-1 p-2">
        {/* Left: search + lists */}
        <div className="d-flex flex-column p-4" style={{ maxWidth: '420px' }}>
          <h1 className="visually-hidden">Texas City Snapshot</h1>

          <form className="d-flex gap-2 mb-4" onSubmit={handleSearch}>
            <input
              ref={inputRef}
              type="text"
              id="city-name"
              list="city-names"
              className="form-control"
              placeholder="City name…"
              autoComplete="off"
            />
            <datalist id="city-names">
              {cityNames?.map(name => <option key={name} value={name} />)}
            </datalist>
            <button type="submit" className="btn" aria-label="Search">
              <span className="material-symbols-outlined">search</span>
            </button>
            <button type="button" className="btn" aria-label="Random city" onClick={handleRandom}>
              <span className="material-symbols-outlined">casino</span>
            </button>
          </form>

          <div className="d-flex flex-row gap-4">
            <div>
              <h2 className="h5">Most Searched</h2>
              <ol>
                {topSearched
                  ? topSearched.map(c => (
                      <li key={c.name}>
                        <Link to={`/city/${encodeURIComponent(c.name)}`}>{c.name}</Link>
                      </li>
                    ))
                  : <li><em>Loading…</em></li>
                }
              </ol>
            </div>
            <div>
              <h2 className="h5">Recently Searched</h2>
              <ol>
                {recentSearches.length > 0
                  ? recentSearches.map(name => (
                      <li key={name}>
                        <Link to={`/city/${encodeURIComponent(name)}`}>{name}</Link>
                      </li>
                    ))
                  : <li><em>No recent searches</em></li>
                }
              </ol>
            </div>
          </div>
        </div>

        {/* Right: map */}
        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
          <img
            id="texas-map"
            src={texasMap}
            alt="Map of Texas"
            style={{ cursor: 'crosshair' }}
          />
        </div>
      </main>

      <footer className="p-2 text-center">
        <Link to="/about">About this app</Link>
      </footer>
    </div>
  )
}
