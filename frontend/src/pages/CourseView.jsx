import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { contentService } from '../services/contentService'
import toast from 'react-hot-toast'
import NoteCard from '../components/NoteCard'
import './CourseView.css'

function CourseView() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCourseData()
  }, [courseId])

  const loadCourseData = async () => {
    try {
      setLoading(true)
      // Cargar información del curso y apuntes
      const notesData = await contentService.getNotes(courseId)
      setNotes(notesData)
      
      // Aquí podrías cargar información adicional del curso
      setCourse({
        id: courseId,
        name: 'Nombre del Curso',
        description: 'Descripción del curso'
      })
    } catch (error) {
      toast.error('Error al cargar curso')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNote = () => {
    // Navegar al editor colaborativo para crear nueva nota
    window.location.href = `/editor/new?course=${courseId}`
  }

  if (loading) {
    return <div className="loading-spinner">Cargando curso...</div>
  }

  return (
    <div className="course-view-container">
      <div className="course-header">
        <div className="course-info">
          <h1>{course?.name}</h1>
          <p>{course?.description}</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateNote}>
          Crear Nuevo Apunte
        </button>
      </div>

      <div className="course-tabs">
        <button className="tab-btn active">Apuntes Colaborativos</button>
        <button className="tab-btn">Publicaciones</button>
        <button className="tab-btn">Recursos</button>
      </div>

      <div className="notes-grid">
        {notes.length === 0 ? (
          <div className="empty-state">
            <p>No hay apuntes aún. ¡Crea el primero!</p>
          </div>
        ) : (
          notes.map(note => (
            <NoteCard key={note.id} note={note} />
          ))
        )}
      </div>
    </div>
  )
}

export default CourseView
