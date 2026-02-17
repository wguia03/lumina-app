import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { wsService } from '../services/wsService'
import { contentService } from '../services/contentService'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import './CollaborativeEditor.css'

function CollaborativeEditor() {
  const { noteId } = useParams()
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [activeUsers, setActiveUsers] = useState([])
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const quillRef = useRef(null)

  useEffect(() => {
    // Conectar WebSocket
    wsService.connect()

    // Cargar nota existente o crear nueva
    if (noteId && noteId !== 'new') {
      loadNote()
      wsService.joinDocument(noteId)
    }

    // Escuchar actualizaciones en tiempo real
    wsService.onDocumentUpdate(handleRemoteUpdate)
    wsService.onUserJoined(handleUserJoined)
    wsService.onUserLeft(handleUserLeft)

    return () => {
      if (noteId && noteId !== 'new') {
        wsService.leaveDocument(noteId)
      }
    }
  }, [noteId])

  const loadNote = async () => {
    try {
      const note = await contentService.getNoteById(noteId)
      setTitle(note.title)
      setContent(note.content)
    } catch (error) {
      toast.error('Error al cargar nota')
    }
  }

  const handleContentChange = (value) => {
    setContent(value)
    
    // Enviar actualización a otros usuarios en tiempo real
    if (noteId && noteId !== 'new') {
      wsService.sendDocumentUpdate(noteId, {
        content: value,
        userId: user.id
      })
    }
  }

  const handleRemoteUpdate = (data) => {
    // Solo actualizar si la actualización viene de otro usuario
    if (data.userId !== user.id) {
      setContent(data.content)
    }
  }

  const handleUserJoined = (userData) => {
    setActiveUsers(prev => [...prev, userData])
    toast.success(`${userData.name} se unió a la edición`)
  }

  const handleUserLeft = (userData) => {
    setActiveUsers(prev => prev.filter(u => u.id !== userData.id))
    toast(`${userData.name} dejó la edición`, { icon: '👋' })
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('El título es requerido')
      return
    }

    try {
      setSaving(true)
      const noteData = {
        title,
        content,
        courseId: new URLSearchParams(window.location.search).get('course')
      }

      if (noteId === 'new') {
        const newNote = await contentService.createNote(noteData)
        toast.success('Nota creada exitosamente')
        window.location.href = `/editor/${newNote.id}`
      } else {
        await contentService.updateNote(noteId, noteData)
        toast.success('Cambios guardados')
      }
    } catch (error) {
      toast.error('Error al guardar nota')
    } finally {
      setSaving(false)
    }
  }

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'code-block'],
      ['clean']
    ]
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <input
          type="text"
          className="editor-title-input"
          placeholder="Título del apunte..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="editor-actions">
          <div className="active-users">
            {activeUsers.map(u => (
              <div key={u.id} className="user-avatar" title={u.name}>
                {u.name.charAt(0)}
              </div>
            ))}
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={handleContentChange}
          modules={modules}
          placeholder="Comienza a escribir tus apuntes..."
        />
      </div>
    </div>
  )
}

export default CollaborativeEditor
