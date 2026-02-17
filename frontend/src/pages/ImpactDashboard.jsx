import { useState, useEffect } from 'react'
import { userService } from '../services/userService'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import './ImpactDashboard.css'

function ImpactDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [reputation, activity] = await Promise.all([
        userService.getReputation(user.id),
        userService.getActivityFeed(user.id)
      ])
      setStats({ reputation, activity })
    } catch (error) {
      toast.error('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading-spinner">Cargando dashboard...</div>
  }

  const { reputation, activity } = stats

  return (
    <div className="impact-dashboard">
      <h1>Panel de Impacto</h1>
      <p className="dashboard-subtitle">Visualiza tu contribución a la comunidad</p>

      <div className="impact-overview">
        <div className="impact-card primary">
          <h2>{reputation?.points || 0}</h2>
          <p>Puntos Totales</p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(reputation?.points % 100)}%` }}
            />
          </div>
          <small>{100 - (reputation?.points % 100)} puntos para siguiente nivel</small>
        </div>

        <div className="impact-card">
          <h2>Nivel {reputation?.level || 1}</h2>
          <p>Rango Actual</p>
          <span className="badge">{reputation?.badge || 'Principiante'}</span>
        </div>

        <div className="impact-card">
          <h2>#{reputation?.rank || 'N/A'}</h2>
          <p>Posición Global</p>
        </div>
      </div>

      <div className="impact-sections">
        <div className="section">
          <h2>Contribuciones</h2>
          <div className="contribution-stats">
            <div className="contrib-item">
              <span className="contrib-label">Publicaciones</span>
              <span className="contrib-value">{activity?.publicationsCount || 0}</span>
            </div>
            <div className="contrib-item">
              <span className="contrib-label">Comentarios</span>
              <span className="contrib-value">{activity?.commentsCount || 0}</span>
            </div>
            <div className="contrib-item">
              <span className="contrib-label">Apuntes Creados</span>
              <span className="contrib-value">{activity?.notesCount || 0}</span>
            </div>
            <div className="contrib-item">
              <span className="contrib-label">Ediciones Colaborativas</span>
              <span className="contrib-value">{activity?.editsCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Reconocimiento</h2>
          <div className="recognition-stats">
            <div className="recog-item">
              <span className="recog-label">👍 Votos Positivos Recibidos</span>
              <span className="recog-value">{activity?.upvotesReceived || 0}</span>
            </div>
            <div className="recog-item">
              <span className="recog-label">⭐ Contenidos Destacados</span>
              <span className="recog-value">{activity?.featuredContent || 0}</span>
            </div>
            <div className="recog-item">
              <span className="recog-label">🏆 Logros Desbloqueados</span>
              <span className="recog-value">{activity?.achievements || 0}</span>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Impacto en la Comunidad</h2>
          <div className="community-impact">
            <div className="impact-metric">
              <h3>{activity?.helpedStudents || 0}</h3>
              <p>Estudiantes Ayudados</p>
            </div>
            <div className="impact-metric">
              <h3>{activity?.viewsCount || 0}</h3>
              <p>Visualizaciones Totales</p>
            </div>
            <div className="impact-metric">
              <h3>{activity?.sharesCount || 0}</h3>
              <p>Veces Compartido</p>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>Logros Recientes</h2>
          <div className="achievements-list">
            {activity?.recentAchievements?.length > 0 ? (
              activity.recentAchievements.map((achievement, index) => (
                <div key={index} className="achievement-item">
                  <span className="achievement-icon">{achievement.icon}</span>
                  <div>
                    <h4>{achievement.title}</h4>
                    <p>{achievement.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>Sigue contribuyendo para desbloquear logros</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImpactDashboard
