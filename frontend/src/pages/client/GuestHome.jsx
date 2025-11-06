import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { MessageSquare, MapPin, Sparkles } from 'lucide-react'
import { Button } from '@/components/Button'
import { propertyAPI } from '@/services/api'

export default function GuestHome() {
  const { propertyId } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProperty()
  }, [propertyId])

  const fetchProperty = async () => {
    try {
      const response = await propertyAPI.getPublic(propertyId)
      setProperty(response.data.property)
    } catch (error) {
      toast.error('Logement non trouvé')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <p className="text-gray-600">Chargement...</p>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Logement non trouvé</h1>
          <p className="text-gray-600">Vérifiez le lien ou le QR code</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header avec animation */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900">Oulia</h1>
          </div>
          <p className="text-gray-600">Votre assistant intelligent pour ce séjour</p>
        </div>

        {/* Card du logement */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{property.name}</h2>
          <div className="flex items-center gap-2 text-gray-600 mb-6">
            <MapPin className="w-5 h-5" />
            <span>
              {property.address}, {property.city}, {property.country}
            </span>
          </div>

          {property.description && (
            <p className="text-gray-700 mb-6 leading-relaxed">{property.description}</p>
          )}

          {/* Bouton principal : Parler à Oulia */}
          <Button
            size="lg"
            className="w-full text-lg py-6 gradient-bg hover:opacity-90 transition-opacity"
            onClick={() => navigate(`/guest/${propertyId}/chat`)}
          >
            <MessageSquare className="w-6 h-6 mr-3" />
            Discuter avec Oulia
          </Button>

          <p className="text-sm text-gray-500 text-center mt-4">
            Posez toutes vos questions sur le logement, les équipements ou la région
          </p>
        </div>

        {/* Infos rapides */}
        <div className="grid md:grid-cols-3 gap-4">
          <QuickInfoCard
            icon="🗣️"
            title="Multilingue"
            description="Je parle toutes les langues"
          />
          <QuickInfoCard
            icon="📸"
            title="Vision IA"
            description="Montrez-moi une photo si besoin"
          />
          <QuickInfoCard
            icon="⚡"
            title="Disponible 24/7"
            description="Toujours là pour vous aider"
          />
        </div>
      </div>
    </div>
  )
}

function QuickInfoCard({ icon, title, description }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
