import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

/**
 * Inscription d'un nouvel hôte
 */
export async function register(req, res) {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingHost = await prisma.host.findUnique({ where: { email } });
    if (existingHost) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'hôte
    const host = await prisma.host.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
      },
    });

    // Générer le token
    const token = generateToken(host.id, host.email);

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      host: {
        id: host.id,
        email: host.email,
        firstName: host.firstName,
        lastName: host.lastName,
      },
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
}

/**
 * Connexion d'un hôte
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Trouver l'hôte
    const host = await prisma.host.findUnique({ where: { email } });
    if (!host) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, host.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token
    const token = generateToken(host.id, host.email);

    res.json({
      message: 'Connexion réussie',
      token,
      host: {
        id: host.id,
        email: host.email,
        firstName: host.firstName,
        lastName: host.lastName,
      },
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
}

/**
 * Obtenir le profil de l'hôte connecté
 */
export async function getProfile(req, res) {
  try {
    const host = await prisma.host.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!host) {
      return res.status(404).json({ error: 'Hôte non trouvé' });
    }

    res.json({ host });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
}
