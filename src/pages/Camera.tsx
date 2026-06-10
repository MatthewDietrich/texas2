import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import { useFetch } from '../hooks/useFetch'
import { getCamera, recordView } from '../api/cameras'

const DIRECTION_LABEL: Record<string, string> = {
  NB: 'Northbound',
  SB: 'Southbound',
  EB: 'Eastbound',
  WB: 'Westbound',
}

export default function Camera() {
  const { cameraId } = useParams<{ cameraId: string }>()

  const { data: camera, loading, error } = useFetch(() => getCamera(cameraId!), [cameraId])

  useEffect(() => {
    if (cameraId) recordView(cameraId).catch(() => {})
  }, [cameraId])

  const [lon, lat] = camera?.location.coordinates ?? [0, 0]

  return (
    <div className="container-fluid d-flex flex-column">
      <NavBar />

      <main className="p-4">
        <header className="text-center mb-4">
          <h1>{cameraId}</h1>
          {loading && <p>Loading…</p>}
          {error   && <p className="text-danger">{error}</p>}
          {camera  && (
            <>
              <p>{DIRECTION_LABEL[camera.direction] ?? camera.direction} — District {camera.districtAbbreviation}</p>
              <p>{lat.toFixed(4)}° N, {Math.abs(lon).toFixed(4)}° W</p>
            </>
          )}
        </header>

        <div className="d-flex flex-column align-items-center py-4">
          <div className="img-container-lg">
            {camera?.snapshot ? (
              <img
                src={`data:image/jpeg;base64,${camera.snapshot}`}
                alt={`Traffic camera ${cameraId}`}
                style={{ width: '100%', borderRadius: 'var(--border-radius)' }}
              />
            ) : (
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
                  {loading ? 'Loading…' : 'No snapshot available'}
                </span>
              </div>
            )}
          </div>
          {camera?.lastViewed && (
            <p className="mt-2">
              <small>Last viewed {new Date(camera.lastViewed).toLocaleString()}</small>
            </p>
          )}
        </div>
      </main>

      <Footer>
        {camera && <p className="mb-2">Viewed {camera.timesViewed.toLocaleString()} times</p>}
      </Footer>
    </div>
  )
}
