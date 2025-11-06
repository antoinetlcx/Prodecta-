import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft, QrCode, ExternalLink, Copy } from 'lucide-react'
import { Button } from '@/components/Button'
import { propertyAPI } from '@/services/api'

export default function AdminPropertyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProperty()
  }, [id])

  const fetchProperty = async () => {
    try {
      const response = await propertyAPI.getById(id)
      setProperty(response.data.property)
    } catch (error) {
      toast.error('Erreur lors du chargement du logement')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (property?.accessLink) {
      navigator.clipboard.writeText(property.accessLink)
      toast.success('Lien copié !')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Logement non trouvé</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour au dashboard
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
              <p className="text-gray-600">
                {property.address}, {property.city}, {property.country}
              </p>
              {property.description && (
                <p className="mt-4 text-gray-700">{property.description}</p>
              )}
            </div>

            {/* QR Code et Lien */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Accès Voyageur</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">QR Code</h3>
                  {property.qrCode ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <img
                        src={property.qrCode}
                        alt="QR Code"
                        className="w-full max-w-[300px] mx-auto"
                      />
                      <p className="text-sm text-gray-600 text-center mt-2">
                        Imprimez et placez ce QR code dans votre logement
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">QR code non généré</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Lien Direct</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 break-all mb-3">{property.accessLink}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={copyLink} className="flex-1">
                        <Copy className="w-4 h-4 mr-2" />
                        Copier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(property.accessLink, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ouvrir
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Base de connaissances */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Base de connaissances</h2>
              {property.knowledgeBase && property.knowledgeBase.length > 0 ? (
                <div className="space-y-3">
                  {property.knowledgeBase.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{item.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{item.content}</p>
                        </div>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Aucune donnée dans la base de connaissances
                </p>
              )}
              <Button variant="outline" className="w-full mt-4">
                Ajouter du contenu
              </Button>
            </div>

            {/* Services */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Services</h2>
              {property.services && property.services.length > 0 ? (
                <div className="space-y-3">
                  {property.services.map((service) => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        </div>
                        <span className="font-bold text-emerald-600">
                          {service.isPaid ? `${service.price}€` : 'Inclus'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucun service configuré</p>
              )}
              <Button variant="outline" className="w-full mt-4">
                Ajouter un service
              </Button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Statistiques</h2>
              <div className="space-y-4">
                <StatItem label="Conversations" value={property._count?.conversations || 0} />
                <StatItem label="Messages" value="--" />
                <StatItem label="Services" value={property._count?.services || 0} />
                <StatItem
                  label="Problèmes signalés"
                  value={property._count?.issues || 0}
                  alert={property._count?.issues > 0}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Actions</h2>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Modifier les infos
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Personnaliser l'IA
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Voir les conversations
                </Button>
                <Button variant="destructive" className="w-full justify-start mt-4">
                  Supprimer le logement
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatItem({ label, value, alert = false }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>
      <span className={`font-bold text-lg ${alert ? 'text-orange-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}
