import { useState } from 'react'
import { Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import { useFetch } from '../hooks/useFetch'
import { getTopSearched } from '../api/cities'

type SortKey = 'rank' | 'name' | 'count'
type SortDir = 'asc' | 'desc'

export default function MostSearched() {
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const { data: cities, loading, error } = useFetch(() => getTopSearched(100))

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function indicator(key: SortKey) {
    return sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
  }

  // API returns sorted by searchCount desc — derive rank from that original order
  const ranked = cities?.map((c, i) => ({ rank: i + 1, name: c.name, count: c.timesSearched })) ?? []

  const sorted = [...ranked].sort((a, b) => {
    const av = a[sortKey === 'count' ? 'count' : sortKey]
    const bv = b[sortKey === 'count' ? 'count' : sortKey]
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="container-fluid d-flex flex-column">
      <NavBar />

      <main className="p-4">
        <h1 className="mb-4">Top 100 Most Searched Cities</h1>

        {loading && <p>Loading…</p>}
        {error   && <p className="text-danger">{error}</p>}

        {!loading && !error && (
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
              {sorted.map(city => (
                <tr key={city.name}>
                  <td>{city.rank}</td>
                  <td><Link to={`/city/${encodeURIComponent(city.name)}`}>{city.name}</Link></td>
                  <td>{city.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      <Footer />
    </div>
  )
}
