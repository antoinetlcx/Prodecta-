import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Home, Plus, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/Button'
import { propertyAPI } from '@/services/api'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      const response = await propertyAPI.getAll()
      setProperties(response.data.properties)
    } catch (error) {
      toast.error('Erreur lors du chargement des logements')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('oulia_token')
    toast.success('Déconnexion réussie')
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Home className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-bold">Oulia Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Mes Logements</h2>
            <p className="text-gray-600 mt-1">Gérez vos propriétés et assistants IA</p>
          </div>
          <Link to="/admin/properties">
            <Button size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Nouveau logement
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Chargement...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun logement</h3>
            <p className="text-gray-600 mb-6">Créez votre premier logement pour commencer</p>
            <Link to="/admin/properties">
              <Button>
                <Plus className="w-5 h-5 mr-2" />
                Créer un logement
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function PropertyCard({ property }) {
  return (
    <Link to={`/admin/properties/${property.id}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow p-6 cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{property.name}</h3>
            <p className="text-sm text-gray-600">
              {property.city}, {property.country}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Conversations</span>
            <span className="font-semibold">{property._count?.conversations || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Services</span>
            <span className="font-semibold">{property._count?.services || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Problèmes signalés</span>
            <span className="font-semibold text-orange-600">{property._count?.issues || 0}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full">
            Gérer le logement
          </Button>
        </div>
      </div>
    </Link>
  )
}
