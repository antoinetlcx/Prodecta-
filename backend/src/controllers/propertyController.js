import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.js';
import { generatePropertyQRCode, generateAccessLink } from '../utils/qrcode.js';

/**
 * Créer un nouveau logement
 */
export async function createProperty(req, res) {
  try {
    const { name, description, address, city, country, equipments, aiPrompt, aiTone, aiPersonality } = req.body;
    const hostId = req.user.userId;

    // Générer un lien d'accès unique
    const propertyId = uuidv4();
    const accessLink = generateAccessLink(propertyId);

    // Générer le QR code
    const qrCode = await generatePropertyQRCode(accessLink);

    const property = await prisma.property.create({
      data: {
        id: propertyId,
        name,
        description: description || null,
        address,
        city,
        country,
        equipments: equipments ? JSON.stringify(equipments) : null,
        aiPrompt: aiPrompt || null,
        aiTone: aiTone || 'accueillant',
        aiPersonality: aiPersonality || null,
        accessLink,
        qrCode,
        hostId,
      },
    });

    res.status(201).json({
      message: 'Logement créé avec succès',
      property,
    });
  } catch (error) {
    console.error('Erreur création logement:', error);
    res.status(500).json({ error: 'Erreur lors de la création du logement' });
  }
}

/**
 * Obtenir tous les logements d'un hôte
 */
export async function getProperties(req, res) {
  try {
    const hostId = req.user.userId;

    const properties = await prisma.property.findMany({
      where: { hostId },
      include: {
        _count: {
          select: {
            conversations: true,
            issues: true,
            services: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ properties });
  } catch (error) {
    console.error('Erreur récupération logements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des logements' });
  }
}

/**
 * Obtenir un logement par ID
 */
export async function getPropertyById(req, res) {
  try {
    const { id } = req.params;
    const hostId = req.user.userId;

    const property = await prisma.property.findFirst({
      where: { id, hostId },
      include: {
        knowledgeBase: true,
        services: true,
        checkInGuides: { orderBy: { step: 'asc' } },
        _count: {
          select: {
            conversations: true,
            issues: true,
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Logement non trouvé' });
    }

    res.json({ property });
  } catch (error) {
    console.error('Erreur récupération logement:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du logement' });
  }
}

/**
 * Mettre à jour un logement
 */
export async function updateProperty(req, res) {
  try {
    const { id } = req.params;
    const hostId = req.user.userId;
    const updates = req.body;

    // Vérifier que le logement appartient à l'hôte
    const existingProperty = await prisma.property.findFirst({
      where: { id, hostId },
    });

    if (!existingProperty) {
      return res.status(404).json({ error: 'Logement non trouvé' });
    }

    // Mettre à jour
    const property = await prisma.property.update({
      where: { id },
      data: {
        ...updates,
        equipments: updates.equipments ? JSON.stringify(updates.equipments) : undefined,
      },
    });

    res.json({
      message: 'Logement mis à jour avec succès',
      property,
    });
  } catch (error) {
    console.error('Erreur mise à jour logement:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du logement' });
  }
}

/**
 * Supprimer un logement
 */
export async function deleteProperty(req, res) {
  try {
    const { id } = req.params;
    const hostId = req.user.userId;

    const property = await prisma.property.findFirst({
      where: { id, hostId },
    });

    if (!property) {
      return res.status(404).json({ error: 'Logement non trouvé' });
    }

    await prisma.property.delete({ where: { id } });

    res.json({ message: 'Logement supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression logement:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du logement' });
  }
}

/**
 * Obtenir un logement par accessLink (pour les voyageurs)
 */
export async function getPropertyByAccessLink(req, res) {
  try {
    const { propertyId } = req.params;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        city: true,
        country: true,
        photos: true,
        equipments: true,
        accessLink: true,
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Logement non trouvé' });
    }

    res.json({ property });
  } catch (error) {
    console.error('Erreur récupération logement public:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du logement' });
  }
}
