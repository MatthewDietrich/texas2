import NavBar from '../components/NavBar'
import Footer from '../components/Footer'

export default function About() {
  return (
    <div className="container-fluid d-flex flex-column">
      <NavBar />

      <main className="p-4">
        <h1 className="mb-3">About</h1>
        <p className="mb-4">
          Texas City Snapshot aggregates publicly available weather, traffic camera,
          water reservoir, and transportation data for cities and towns across Texas.
        </p>

        <section className="mb-4">
          <h2 className="h4">Weather</h2>
          <ul>
            <li>
              Forecasts and historical data provided by{' '}
              <a href="https://open-meteo.com" target="_blank" rel="noreferrer">Open-Meteo</a>.
            </li>
            <li>
              Alerts provided by the{' '}
              <a href="https://weather.gov" target="_blank" rel="noreferrer">National Weather Service</a>.
            </li>
            <li>Updated every 5 minutes.</li>
          </ul>
        </section>

        <section className="mb-4">
          <h2 className="h4">Road Camera Snapshots</h2>
          <ul>
            <li>
              Snapshots provided by{' '}
              <a href="https://txdot.gov" target="_blank" rel="noreferrer">Texas DOT</a>.
            </li>
            <li>Updated every 5 minutes.</li>
          </ul>
        </section>

        <section className="mb-4">
          <h2 className="h4">Population</h2>
          <ul>
            <li>Population figures sourced from the 2020 US Census.</li>
          </ul>
        </section>

        <section className="mb-4">
          <h2 className="h4">Water Reservoirs</h2>
          <ul>
            <li>
              Reservoir levels provided by{' '}
              <a href="https://waterdatafortexas.org" target="_blank" rel="noreferrer">
                Water Data for Texas
              </a>.
            </li>
            <li>Updated every 24 hours.</li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  )
}
