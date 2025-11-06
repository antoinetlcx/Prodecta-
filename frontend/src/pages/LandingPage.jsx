import { Link } from 'react-router-dom'
import { Home, MessageSquare, Sparkles, QrCode, Globe, Bell } from 'lucide-react'
import { Button } from '@/components/Button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900">Oulia</h1>
        </div>
        <Link to="/admin/login">
          <Button variant="outline">Connexion Hôte</Button>
        </Link>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            L'assistant IA qui révolutionne
            <span className="text-emerald-600"> l'accueil touristique</span>
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Remplacez votre livret d'accueil traditionnel par un assistant intelligent, multimodal et accessible via QR code.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/admin/login">
              <Button size="lg" className="text-lg px-8">
                Essayer gratuitement
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Voir la démo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Fonctionnalités</h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<MessageSquare className="w-12 h-12 text-emerald-600" />}
            title="Chatbot Multimodal"
            description="Comprend le texte, la voix et les images pour une assistance complète 24/7"
          />
          <FeatureCard
            icon={<QrCode className="w-12 h-12 text-emerald-600" />}
            title="Accès Instantané"
            description="Simple QR code à scanner pour accéder à tout le guide du logement"
          />
          <FeatureCard
            icon={<Globe className="w-12 h-12 text-emerald-600" />}
            title="Multilingue"
            description="Traduction automatique en temps réel pour tous vos voyageurs"
          />
          <FeatureCard
            icon={<Home className="w-12 h-12 text-emerald-600" />}
            title="Check-in Guidé"
            description="Guide vos invités pas à pas depuis leur arrivée jusqu'à l'entrée"
          />
          <FeatureCard
            icon={<Sparkles className="w-12 h-12 text-emerald-600" />}
            title="Conciergerie IA"
            description="Réservation de services, recommandations locales, FAQ automatique"
          />
          <FeatureCard
            icon={<Bell className="w-12 h-12 text-emerald-600" />}
            title="Alertes Intelligentes"
            description="Notifications en temps réel des problèmes signalés par vos invités"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-12">
          <h3 className="text-4xl font-bold mb-4">Prêt à moderniser votre accueil ?</h3>
          <p className="text-xl text-gray-600 mb-8">
            Rejoignez des centaines d'hôtes qui ont déjà adopté Oulia
          </p>
          <Link to="/admin/login">
            <Button size="lg" className="text-lg px-12">
              Commencer maintenant
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2025 Oulia. Propulsé par Gemini AI.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="mb-4">{icon}</div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
