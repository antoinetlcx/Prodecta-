import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/Button'
import { propertyAPI } from '@/services/api'

export default function AdminProperties() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    equipments: [],
    aiPrompt: '',
    aiTone: 'accueillant',
    aiPersonality: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await propertyAPI.create(formData)
      toast.success('Logement créé avec succès !')
      navigate(`/admin/properties/${response.data.property.id}`)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour au dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-6">Créer un nouveau logement</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Informations de base</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom du logement *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Appartement Montmartre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez votre logement..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Adresse *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ville *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Pays *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration de l'IA */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Configuration de l'assistant IA</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Instructions pour Oulia</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    value={formData.aiPrompt}
                    onChange={(e) => setFormData({ ...formData, aiPrompt: e.target.value })}
                    placeholder="Ex: Sois particulièrement attentif aux questions sur le chauffage..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Ton de voix</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    value={formData.aiTone}
                    onChange={(e) => setFormData({ ...formData, aiTone: e.target.value })}
                  >
                    <option value="accueillant">Accueillant</option>
                    <option value="professionnel">Professionnel</option>
                    <option value="décontracté">Décontracté</option>
                    <option value="chaleureux">Chaleureux</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Personnalité</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    value={formData.aiPersonality}
                    onChange={(e) => setFormData({ ...formData, aiPersonality: e.target.value })}
                    placeholder="Ex: Bienveillant et serviable"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Création...' : 'Créer le logement'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/dashboard')}
              >
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
