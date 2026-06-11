import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import { useFetch } from '../hooks/useFetch'
import { getCity, recordSearch } from '../api/cities'
import { getCamerasForCity } from '../api/cameras'

const HOURLY = Array.from({ length: 12 }, (_, i) => ({
  hour: `${(8 + i) % 24}:00`,
  temp: `${70 + i}°`,
  precip: `${5 * i}%`,
}))

const FORECAST = [
  { day: 'Mon', condition: 'Sunny',         high: 85, low: 68, precip: '5%' },
  { day: 'Tue', condition: 'Partly Cloudy', high: 80, low: 65, precip: '20%' },
  { day: 'Wed', condition: 'Rainy',         high: 74, low: 60, precip: '80%' },
  { day: 'Thu', condition: 'Cloudy',        high: 76, low: 62, precip: '40%' },
  { day: 'Fri', condition: 'Sunny',         high: 82, low: 66, precip: '5%' },
  { day: 'Sat', condition: 'Sunny',         high: 87, low: 70, precip: '5%' },
  { day: 'Sun', condition: 'Partly Cloudy', high: 84, low: 67, precip: '15%' },
]

const ALMANAC_ROWS = [
  'Condition', 'High', 'Low', 'Total Precip.', 'Avg. Humidity',
  'Avg. Cloud Cover', 'Avg. Wind', 'Pressure', 'Sunrise', 'Sunset',
]

const COORDINATE_PRECISION = 7

export default function City() {
  const { cityName } = useParams<{ cityName: string }>()

  const { data: city,    loading: cityLoading,    error: cityError    } = useFetch(() => getCity(cityName!),            [cityName])
  const { data: cameras, loading: camsLoading,    error: camsError    } = useFetch(() => getCamerasForCity(cityName!),  [cityName])

  // Record search — Lambda stamps lastSearched which drives the recent searches list
  useEffect(() => {
    if (cityName) recordSearch(cityName).catch(() => {})
  }, [cityName])

  return (
    <div className="container-fluid d-flex flex-column">
      <NavBar />

      <main className="p-4">
        <header className="text-center mb-4">
          <h1 className="display-1">{cityName}</h1>
          {cityLoading && <p>Loading…</p>}
          {cityError   && <p className="text-danger">{cityError}</p>}
          {city && (
            <>
              <p>{city.county}, {city.state}</p>
              <p>{parseFloat(city.properties.intptlat).toFixed(COORDINATE_PRECISION)}° N, {Math.abs(parseFloat(city.properties.intptlon)).toFixed(COORDINATE_PRECISION)}° W</p>
              <p>Population: {city.population.toLocaleString()}</p>
            </>
          )}
        </header>

        <div className="tab-container">
          <input type="radio" id="tab1" name="city-tabs" defaultChecked />
          <input type="radio" id="tab2" name="city-tabs" />
          <input type="radio" id="tab3" name="city-tabs" />
          <input type="radio" id="tab4" name="city-tabs" />

          <div className="tab-header">
            <label htmlFor="tab1">
              <span className="material-symbols-outlined">photo_camera</span>{' '}Snapshots
            </label>
            <label htmlFor="tab2">
              <span className="material-symbols-outlined">cloud</span>{' '}Weather
            </label>
            <label htmlFor="tab3">
              <span className="material-symbols-outlined">water_drop</span>{' '}Water
            </label>
            <label htmlFor="tab4">
              <span className="material-symbols-outlined">directions_car</span>{' '}Transportation
            </label>
          </div>

          {/* Tab 1: Snapshots */}
          <div className="tab-content content1" id="snapshots-container">
            {camsLoading && <p>Loading cameras…</p>}
            {camsError   && <p className="text-danger">{camsError}</p>}
            {!camsLoading && !camsError && cameras?.length === 0 && (
              <p>No cameras found near this city.</p>
            )}
            <div className="row" id="snapshots">
              {cameras?.map((cam, i) => (
                <div key={cam.icdId} className="col-sm-6 mb-3">
                  <div className="img-container">
                    <div
                      style={{
                        width: '100%',
                        height: '150px',
                        background: 'var(--secondary-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span>Camera {i + 1}</span>
                    </div>
                    <div className="img-caption">
                      <Link to={`/camera/${encodeURIComponent(cam.icdId)}`} className="icdId">
                        {cam.icdId}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <small>
              <a href="https://txdot.gov" target="_blank" rel="noreferrer">
                Texas DOT live traffic cameras
              </a>
            </small>
          </div>

          {/* Tab 2: Weather (placeholder — requires external API integration) */}
          <div className="tab-content content2" id="weather-container">
            <p className="text-center mb-3"><em>No active weather alerts</em></p>
            <div className="row">
              <div className="col-12 mb-4" id="weather">
                <h2 className="h4">Current Conditions</h2>
                <div className="d-flex align-items-start gap-4 pt-2">
                  <div className="text-center">
                    <span style={{ fontSize: '3rem' }}>☀️</span>
                    <p>Sunny</p>
                  </div>
                  <table className="table table-bordered">
                    <tbody>
                      <tr><th>Temperature</th><td>—</td></tr>
                      <tr><th>Feels Like</th><td>—</td></tr>
                      <tr><th>Humidity</th><td>—</td></tr>
                      <tr><th>Precipitation Chance</th><td>—</td></tr>
                      <tr><th>Cloud Cover</th><td>—</td></tr>
                      <tr><th>Wind</th><td>—</td></tr>
                      <tr><th>Pressure</th><td>—</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="col-12 mb-4" id="forecast">
                <h2 className="h4">Next 12 Hours</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table table-bordered text-center">
                    <thead><tr>{HOURLY.map(h => <th key={h.hour}>{h.hour}</th>)}</tr></thead>
                    <tbody>
                      <tr>{HOURLY.map(h => <td key={h.hour}>—</td>)}</tr>
                      <tr>{HOURLY.map(h => <td key={h.hour}>—</td>)}</tr>
                      <tr>{HOURLY.map(h => <td key={h.hour}>—</td>)}</tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="col-12 col-lg-6 mb-4">
                <h2 className="h4">7-Day Forecast</h2>
                <table className="table table-bordered">
                  <thead><tr><th>Day</th><th>Condition</th><th>High</th><th>Low</th><th>Precip.</th></tr></thead>
                  <tbody>
                    {FORECAST.map(f => (
                      <tr key={f.day}>
                        <td>{f.day}</td><td>—</td><td>—</td><td>—</td><td>—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="col-12 col-lg-6 mb-4">
                <h2 className="h4">Historical Comparison</h2>
                <table className="table table-bordered">
                  <thead><tr><th></th><th>1 Year Ago</th><th>5 Years Ago</th><th>10 Years Ago</th></tr></thead>
                  <tbody>
                    {ALMANAC_ROWS.map(row => (
                      <tr key={row}><th>{row}</th><td>—</td><td>—</td><td>—</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <small>
              Forecasts by{' '}
              <a href="https://open-meteo.com" target="_blank" rel="noreferrer">Open-Meteo</a>.
              {' '}Alerts by{' '}
              <a href="https://weather.gov" target="_blank" rel="noreferrer">NWS</a>.
            </small>
          </div>

          {/* Tab 3: Water (placeholder) */}
          <div className="tab-content content3" id="water-container">
            <h2 className="h4 mb-3">Reservoirs near {cityName}</h2>
            <p><em>Water data coming soon.</em></p>
            <small className="d-block mt-3">
              Source:{' '}
              <a href="https://waterdatafortexas.org" target="_blank" rel="noreferrer">
                Water Data for Texas
              </a>
            </small>
          </div>

          {/* Tab 4: Transportation (placeholder) */}
          <div className="tab-content content4" id="transportation-container">
            <p><em>Transportation data coming soon.</em></p>
          </div>
        </div>
      </main>

      <Footer>
        {city && (
          <>
            <p className="mb-2">
              Nearby:{' '}
              {(city.nearby ?? []).map((name, i) => (
                <span key={name}>
                  {i > 0 && ', '}
                  <Link to={`/city/${encodeURIComponent(name)}`}>{name}</Link>
                </span>
              ))}
            </p>
            <p className="mb-2">Searched {city.timesSearched.toLocaleString()} times</p>
          </>
        )}
      </Footer>
    </div>
  )
}
