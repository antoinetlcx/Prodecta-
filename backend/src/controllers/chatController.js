import prisma from '../config/database.js';
import { generateChatResponse, analyzeImage, translateText } from '../services/geminiService.js';

/**
 * Créer ou récupérer une conversation
 */
export async function getOrCreateConversation(req, res) {
  try {
    const { propertyId } = req.params;
    const { guestName, language } = req.body;

    // Vérifier que le logement existe
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return res.status(404).json({ error: 'Logement non trouvé' });
    }

    // Créer une nouvelle conversation
    const conversation = await prisma.conversation.create({
      data: {
        propertyId,
        guestName: guestName || 'Invité',
        language: language || 'fr',
      },
    });

    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Erreur création conversation:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la conversation' });
  }
}

/**
 * Envoyer un message dans le chat
 */
export async function sendMessage(req, res) {
  try {
    const { conversationId } = req.params;
    const { content, contentType, mediaUrl } = req.body;

    // Récupérer la conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20, // Limiter l'historique
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    // Enregistrer le message de l'utilisateur
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content,
        contentType: contentType || 'text',
        mediaUrl: mediaUrl || null,
      },
    });

    // Si c'est une image, analyser d'abord
    let messageToSend = content;
    if (contentType === 'image' && mediaUrl) {
      const imageAnalysis = await analyzeImage(mediaUrl, "Décris ce que tu vois et aide l'utilisateur avec sa question.");
      if (imageAnalysis.success) {
        messageToSend = `[Image analysée] ${imageAnalysis.analysis}\n\nQuestion de l'utilisateur: ${content}`;
      }
    }

    // Générer la réponse de l'assistant
    const aiResponse = await generateChatResponse(
      conversation.propertyId,
      conversation.messages,
      messageToSend
    );

    if (!aiResponse.success) {
      return res.status(500).json({ error: 'Erreur lors de la génération de la réponse' });
    }

    // Enregistrer la réponse de l'assistant
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: aiResponse.message,
        contentType: 'text',
      },
    });

    res.json({
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
}

/**
 * Obtenir l'historique d'une conversation
 */
export async function getConversationHistory(req, res) {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation non trouvée' });
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
}

/**
 * Traduire un message
 */
export async function translate(req, res) {
  try {
    const { text, targetLanguage } = req.body;

    const result = await translateText(text, targetLanguage);

    if (!result.success) {
      return res.status(500).json({ error: 'Erreur lors de la traduction' });
    }

    res.json({ translation: result.translation });
  } catch (error) {
    console.error('Erreur traduction:', error);
    res.status(500).json({ error: 'Erreur lors de la traduction' });
  }
}

/**
 * Signaler un problème
 */
export async function reportIssue(req, res) {
  try {
    const { propertyId } = req.params;
    const { description, category, imageUrl, conversationId } = req.body;

    const issue = await prisma.issue.create({
      data: {
        propertyId,
        description,
        category: category || 'other',
        imageUrl: imageUrl || null,
        status: 'open',
        priority: 'medium',
      },
    });

    // Créer une notification pour l'hôte
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { hostId: true, name: true },
    });

    if (property) {
      await prisma.notification.create({
        data: {
          hostId: property.hostId,
          title: '🚨 Nouveau problème signalé',
          message: `Un problème a été signalé dans "${property.name}": ${description}`,
          type: 'issue',
          link: `/properties/${propertyId}/issues/${issue.id}`,
        },
      });
    }

    res.status(201).json({
      message: 'Problème signalé avec succès',
      issue,
    });
  } catch (error) {
    console.error('Erreur signalement problème:', error);
    res.status(500).json({ error: 'Erreur lors du signalement du problème' });
  }
}
