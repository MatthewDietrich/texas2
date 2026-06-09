import { useParams, Link } from 'react-router-dom'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'

export default function Camera() {
  const { cameraId } = useParams<{ cameraId: string }>()

  return (
    <div className="container-fluid d-flex flex-column">
      <NavBar />

      <main className="p-4">
        <header className="text-center mb-4">
          <h1>{cameraId}</h1>
          <p>30.2672° N, 97.7431° W</p>
          <p>
            <Link to="/city/Austin">Austin</Link>, Travis County
          </p>
        </header>

        <div className="d-flex flex-column align-items-center py-4">
          <div className="img-container-lg">
            <div
              style={{
                width: '100%',
                paddingBottom: '56.25%',
                background: 'var(--secondary-bg)',
                position: 'relative',
                borderRadius: 'var(--border-radius)',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Camera snapshot placeholder
              </span>
            </div>
          </div>
          <p className="mt-2">
            <small>Snapshot taken at —</small>
          </p>
        </div>
      </main>

      <Footer>
        <p className="mb-2">Viewed — times</p>
      </Footer>
    </div>
  )
}
