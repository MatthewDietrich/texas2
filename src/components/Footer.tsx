import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface FooterProps {
  children?: ReactNode
}

export default function Footer({ children }: FooterProps) {
  return (
    <footer className="p-4 text-center">
      {children}
      <p><Link to="/">Back to search</Link></p>
      <small>&copy; Texas City Snapshot</small>
    </footer>
  )
}
