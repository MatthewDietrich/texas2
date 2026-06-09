import { useState } from 'react'
import { Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'

const CITIES = [
  { rank: 1,  name: 'Houston',       count: 4821 },
  { rank: 2,  name: 'Austin',        count: 4203 },
  { rank: 3,  name: 'Dallas',        count: 3987 },
  { rank: 4,  name: 'San Antonio',   count: 3654 },
  { rank: 5,  name: 'Fort Worth',    count: 2991 },
  { rank: 6,  name: 'El Paso',       count: 2104 },
  { rank: 7,  name: 'Arlington',     count: 1876 },
  { rank: 8,  name: 'Corpus Christi',count: 1543 },
  { rank: 9,  name: 'Plano',         count: 1402 },
  { rank: 10, name: 'Lubbock',       count: 1287 },
]

type SortKey = 'rank' | 'name' | 'count'
type SortDir = 'asc' | 'desc'

export default function MostSearched() {
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...CITIES].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  function indicator(key: SortKey) {
    return sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
  }

  return (
    <div className="container-fluid d-flex flex-column">
      <NavBar />

      <main className="p-4">
        <h1 className="mb-4">Top 100 Most Searched Cities</h1>

        <div id="dt-search"></div>

        <table className="table table-bordered" id="most-searched">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('rank')}>
                Rank{indicator('rank')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                City{indicator('name')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('count')}>
                Times Searched{indicator('count')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((city) => (
              <tr key={city.name}>
                <td>{city.rank}</td>
                <td><Link to={`/city/${city.name}`}>{city.name}</Link></td>
                <td>{city.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      <Footer />
    </div>
  )
}
