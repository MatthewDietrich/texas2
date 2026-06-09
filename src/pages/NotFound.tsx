import { useParams } from 'react-router-dom'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'

export default function NotFound() {
  const params = useParams()
  const subject = params.cityName ?? params.cameraId ?? null

  return (
    <div className="container-fluid d-flex flex-column">
      <NavBar />

      <main className="p-4">
        <h1>Not Found</h1>
        <p>
          {subject
            ? `"${subject}" could not be found.`
            : 'The page you requested could not be found.'}
        </p>
      </main>

      <Footer />
    </div>
  )
}
