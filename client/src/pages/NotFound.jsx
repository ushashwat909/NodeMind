import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="notfound-page">
      <span className="notfound-code">404</span>
      <p className="notfound-message">This page doesn't exist.</p>
      <Link to="/" className="notfound-link">Back to Home</Link>
    </div>
  )
}
