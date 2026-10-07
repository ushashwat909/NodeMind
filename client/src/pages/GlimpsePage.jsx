import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GlimpseExperience from '../components/glimpse/GlimpseExperience'

export default function GlimpsePage() {
  const navigate = useNavigate()

  useEffect(() => {
    const originalTitle = document.title
    document.title = 'NodeMind // GLIMPSE — Interactive Architecture Experience'
    return () => {
      document.title = originalTitle
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#05070c' }}>
      <GlimpseExperience
        isOpen={true}
        onClose={() => {
          navigate('/')
        }}
      />
    </div>
  )
}
