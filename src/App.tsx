import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Home from './pages/Home'
import City from './pages/City'
import Camera from './pages/Camera'
import MostSearched from './pages/MostSearched'
import About from './pages/About'
import NotFound from './pages/NotFound'
import './App.css'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/city/:cityName" element={<City />} />
          <Route path="/camera/:cameraId" element={<Camera />} />
          <Route path="/mostsearched" element={<MostSearched />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
