import { getChatModel, getVisionModel } from '../config/gemini.js';
import prisma from '../config/database.js';

/**
 * Construire le prompt système pour Oulia basé sur le logement
 */
async function buildSystemPrompt(property) {
  const knowledgeItems = await prisma.knowledgeItem.findMany({
    where: { propertyId: property.id },
  });

  const services = await prisma.service.findMany({
    where: { propertyId: property.id, isAvailable: true },
  });

  const checkInGuides = await prisma.checkInGuide.findMany({
    where: { propertyId: property.id },
    orderBy: { step: 'asc' },
  });

  let systemPrompt = `Tu es Oulia, l'assistante virtuelle personnalisée de "${property.name}".

🎯 Ta mission est d'aider les voyageurs à profiter pleinement de leur séjour : expliquer le fonctionnement du logement, répondre à toutes leurs questions, et faciliter leurs besoins (check-in, confort, réservations, dépannage).

📍 INFORMATIONS SUR LE LOGEMENT :
- Nom : ${property.name}
- Adresse : ${property.address}, ${property.city}, ${property.country}
- Description : ${property.description || 'Non fournie'}
- Équipements : ${property.equipments ? JSON.parse(property.equipments).join(', ') : 'Non spécifié'}

`;

  // Ajouter la base de connaissances
  if (knowledgeItems.length > 0) {
    systemPrompt += `\n📚 BASE DE CONNAISSANCES :\n`;
    knowledgeItems.forEach(item => {
      systemPrompt += `\n[${item.category || 'Général'}] ${item.title}:\n${item.content}\n`;
    });
  }

  // Ajouter les services disponibles
  if (services.length > 0) {
    systemPrompt += `\n🛎️ SERVICES DISPONIBLES :\n`;
    services.forEach(service => {
      const priceInfo = service.isPaid ? `${service.price}€` : 'Inclus';
      systemPrompt += `- ${service.name} (${priceInfo}): ${service.description || ''}\n`;
    });
  }

  // Ajouter le guide de check-in
  if (checkInGuides.length > 0) {
    systemPrompt += `\n🔑 GUIDE DE CHECK-IN :\n`;
    checkInGuides.forEach(guide => {
      systemPrompt += `${guide.step}. ${guide.title}: ${guide.description}\n`;
    });
  }

  // Ajouter les instructions personnalisées
  if (property.aiPrompt) {
    systemPrompt += `\n💡 INSTRUCTIONS SPÉCIFIQUES DE L'HÔTE :\n${property.aiPrompt}\n`;
  }

  // Ajouter le ton et la personnalité
  systemPrompt += `\n🗣️ TON ET STYLE :
- Ton : ${property.aiTone}
- Personnalité : ${property.aiPersonality || 'Professionnel et bienveillant'}

🧠 RÈGLES IMPORTANTES :
1. Tu comprends et réponds naturellement à la voix, au texte et aux photos.
2. Tu t'appuies EXCLUSIVEMENT sur les données ci-dessus pour répondre.
3. Si le voyageur pose une question → réponds avec clarté, précision et bienveillance.
4. Si le voyageur rencontre un problème → identifie la cause et propose de créer un signalement pour l'hôte.
5. Si le voyageur souhaite réserver un service → présente-lui les options et propose de faire la réservation.
6. Si le voyageur demande conseil → propose des recommandations locales pertinentes.
7. Tu ne parles JAMAIS d'autres logements, ni de sujets personnels non liés au séjour.
8. Si tu n'as pas l'information, indique calmement comment contacter l'hôte.

Tu es comme un concierge d'hôtel intelligent : accueillant, utile, fluide et professionnel.`;

  return systemPrompt;
}

/**
 * Générer une réponse de chatbot
 */
export async function generateChatResponse(propertyId, messages, userMessage) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error('Logement non trouvé');
    }

    const systemPrompt = await buildSystemPrompt(property);
    const model = getChatModel();

    // Construire l'historique de conversation
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'Voici ton rôle et tes instructions :' }],
        },
        {
          role: 'model',
          parts: [{ text: systemPrompt }],
        },
        ...messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;

    return {
      success: true,
      message: response.text(),
    };
  } catch (error) {
    console.error('Erreur Gemini:', error);
    return {
      success: false,
      message: 'Désolé, je rencontre un problème technique. Pouvez-vous réessayer ?',
      error: error.message,
    };
  }
}

/**
 * Analyser une image (pour identifier des objets, problèmes, etc.)
 */
export async function analyzeImage(imageData, prompt = "Décris ce que tu vois dans cette image.") {
  try {
    const model = getVisionModel();

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType: 'image/jpeg',
        },
      },
    ]);

    return {
      success: true,
      analysis: result.response.text(),
    };
  } catch (error) {
    console.error('Erreur analyse image:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Traduire un texte
 */
export async function translateText(text, targetLanguage) {
  try {
    const model = getChatModel();
    const prompt = `Traduis le texte suivant en ${targetLanguage}. Réponds UNIQUEMENT avec la traduction, sans explications :\n\n${text}`;

    const result = await model.generateContent(prompt);

    return {
      success: true,
      translation: result.response.text(),
    };
  } catch (error) {
    console.error('Erreur traduction:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
