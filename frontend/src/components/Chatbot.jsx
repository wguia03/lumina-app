import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { chatbotService } from '../services/chatbotService'
import toast from 'react-hot-toast'
import './Chatbot.css'

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen && !conversationId) {
      initConversation()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initConversation = async () => {
    try {
      const conv = await chatbotService.createConversation()
      setConversationId(conv.id)
      setMessages([{
        role: 'assistant',
        content: '¡Hola! Soy tu asistente académico. Puedo ayudarte a resumir apuntes, responder preguntas sobre tus cursos y recomendarte recursos. ¿En qué puedo ayudarte?'
      }])
    } catch (error) {
      console.error('Error al iniciar conversación:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }])

    setLoading(true)

    try {
      const response = await chatbotService.sendMessage(userMessage, {
        conversationId
      })

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message
      }])
    } catch (error) {
      toast.error('Error al enviar mensaje')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, ocurrió un error. Por favor, intenta de nuevo.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <button 
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Chatea conmigo"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Asistente Académico</h3>
            <button 
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`message ${message.role}`}
              >
                <div className="message-content">
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu pregunta..."
              rows={1}
              disabled={loading}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="btn-send"
              title="Enviar mensaje"
            >
              <Send size={18} />
            </button>
          </div>

          <div className="chatbot-suggestions">
            <button 
              className="suggestion-btn"
              onClick={() => setInput('Resume mis últimos apuntes')}
            >
              📝 Resumir apuntes
            </button>
            <button 
              className="suggestion-btn"
              onClick={() => setInput('Recomiéndame recursos de estudio')}
            >
              📚 Recomendar recursos
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Chatbot
