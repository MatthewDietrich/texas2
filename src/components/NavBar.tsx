import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import type { Theme } from '../context/ThemeContext'

const THEMES: { value: Theme; label: string }[] = [
  { value: 'default', label: 'Default Green' },
  { value: 'burntorange', label: 'Burnt Orange' },
  { value: 'maroon', label: 'Maroon' },
  { value: 'purple', label: 'Purple' },
]

interface NavBarProps {
  variant?: 'home' | 'page'
}

export default function NavBar({ variant = 'page' }: NavBarProps) {
  const navigate = useNavigate()
  const { setTheme } = useTheme()

  const themeSelector = (
    <details>
      <summary>
        <span className="material-symbols-outlined">palette</span>
      </summary>
      <ul>
        {THEMES.map((t) => (
          <li key={t.value}>
            <button onClick={() => setTheme(t.value)}>{t.label}</button>
          </li>
        ))}
      </ul>
    </details>
  )

  if (variant === 'home') {
    return (
      <header>
        <nav className="d-flex align-items-center p-2">
          <span className="fw-bold">Texas City Snapshot</span>
          <div className="ms-auto d-flex align-items-center gap-3">
            <Link to="/mostsearched" aria-label="Leaderboard">
              <span className="material-symbols-outlined">leaderboard</span>
            </Link>
            {themeSelector}
          </div>
        </nav>
      </header>
    )
  }

  return (
    <header>
      <nav className="d-flex align-items-center p-2">
        <button className="btn p-0" onClick={() => navigate(-1)} aria-label="Go back">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <Link to="/" className="ms-2" aria-label="Home">
          <span className="material-symbols-outlined">home</span>
        </Link>
        <div className="ms-auto">
          {themeSelector}
        </div>
      </nav>
    </header>
  )
}
