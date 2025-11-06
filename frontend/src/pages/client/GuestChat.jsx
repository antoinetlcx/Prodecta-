import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  Camera,
  AlertCircle,
  Sparkles,
  Languages,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { chatAPI, propertyAPI } from '@/services/api'

export default function GuestChat() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [showNamePrompt, setShowNamePrompt] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchProperty()
  }, [propertyId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchProperty = async () => {
    try {
      const response = await propertyAPI.getPublic(propertyId)
      setProperty(response.data.property)
    } catch (error) {
      toast.error('Logement non trouvé')
    }
  }

  const startConversation = async () => {
    if (!guestName.trim()) {
      toast.error('Veuillez entrer votre prénom')
      return
    }

    try {
      const response = await chatAPI.createConversation(propertyId, {
        guestName: guestName.trim(),
        language: 'fr',
      })
      setConversationId(response.data.conversation.id)
      setShowNamePrompt(false)

      // Message de bienvenue
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Bonjour ${guestName} ! 👋 Je suis Oulia, votre assistante pour "${property?.name}". Comment puis-je vous aider aujourd'hui ?`,
          createdAt: new Date(),
        },
      ])
    } catch (error) {
      toast.error('Erreur lors du démarrage de la conversation')
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !conversationId) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      const response = await chatAPI.sendMessage(conversationId, {
        content: inputMessage,
        contentType: 'text',
      })

      setMessages((prev) => [
        ...prev,
        {
          id: response.data.assistantMessage.id,
          role: 'assistant',
          content: response.data.assistantMessage.content,
          createdAt: new Date(response.data.assistantMessage.createdAt),
        },
      ])
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message')
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('La reconnaissance vocale n\'est pas supportée par votre navigateur')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = 'fr-FR'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
      toast.success('Parlez maintenant...')
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInputMessage(transcript)
      setIsListening(false)
    }

    recognition.onerror = (event) => {
      console.error('Erreur reconnaissance vocale:', event.error)
      toast.error('Erreur de reconnaissance vocale')
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const reportIssue = async () => {
    const description = prompt('Décrivez le problème rencontré :')
    if (!description) return

    try {
      await chatAPI.reportIssue(propertyId, {
        description,
        category: 'other',
      })
      toast.success('Problème signalé ! L\'hôte a été notifié.')
    } catch (error) {
      toast.error('Erreur lors du signalement')
    }
  }

  if (showNamePrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Sparkles className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h2 className="text-2xl font-bold mb-2">Bienvenue !</h2>
            <p className="text-gray-600">Je suis Oulia, votre assistante pour ce séjour</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Votre prénom</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Ex: Marie"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && startConversation()}
                autoFocus
              />
            </div>
            <Button onClick={startConversation} className="w-full py-3">
              Commencer la conversation
            </Button>
            <button
              onClick={() => navigate(`/guest/${propertyId}`)}
              className="w-full text-sm text-gray-600 hover:text-gray-900"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(`/guest/${propertyId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Retour</span>
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            <h1 className="font-bold text-lg">Oulia</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" title="Traduction">
              <Languages className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={reportIssue} title="Signaler un problème">
              <AlertCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="space-y-4">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-md">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input */}
      <footer className="bg-white/80 backdrop-blur-lg border-t border-gray-200 sticky bottom-0">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleVoiceInput}
              disabled={isListening}
              className={isListening ? 'bg-red-100' : ''}
            >
              {isListening ? (
                <MicOff className="w-5 h-5 text-red-600" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>
            <input
              type="text"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Posez votre question..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage} disabled={!inputMessage.trim() || loading} size="icon">
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Propulsé par Gemini AI • Oulia peut faire des erreurs
          </p>
        </div>
      </footer>
    </div>
  )
}

function Message({ message }) {
  const isAssistant = message.role === 'assistant'

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-6 py-3 shadow-md chat-message ${
          isAssistant
            ? 'bg-white/80 backdrop-blur-sm text-gray-900'
            : 'bg-emerald-600 text-white'
        }`}
      >
        {isAssistant && (
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-600">Oulia</span>
          </div>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}
