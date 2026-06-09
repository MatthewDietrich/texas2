import { Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import texasMap from '../assets/texas.png'

const MOST_SEARCHED = ['Houston', 'Austin', 'Dallas', 'San Antonio', 'Fort Worth']

export default function Home() {
  return (
    <div className="container-fluid d-flex flex-column" style={{ minHeight: '100vh' }}>
      <NavBar variant="home" />

      <main className="d-flex flex-row flex-grow-1 p-2">
        {/* Left: search + lists */}
        <div className="d-flex flex-column p-4" style={{ maxWidth: '420px' }}>
          <h1 className="visually-hidden">Texas City Snapshot</h1>

          <form className="d-flex gap-2 mb-4" action="/city" method="get">
            <input
              type="text"
              id="city-name"
              name="name"
              list="city-names"
              className="form-control"
              placeholder="City name…"
              autoComplete="off"
            />
            <datalist id="city-names" />
            <button type="submit" className="btn" aria-label="Search">
              <span className="material-symbols-outlined">search</span>
            </button>
            <button type="button" className="btn" aria-label="Random city">
              <span className="material-symbols-outlined">casino</span>
            </button>
          </form>

          <div className="d-flex flex-row gap-4">
            <div>
              <h2 className="h5">Most Searched</h2>
              <ol>
                {MOST_SEARCHED.map((city) => (
                  <li key={city}>
                    <Link to={`/city/${city}`}>{city}</Link>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h2 className="h5">Recently Searched</h2>
              <ol>
                <li><em>No recent searches</em></li>
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
