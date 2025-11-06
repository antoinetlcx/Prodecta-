import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY non défini. Le chatbot ne fonctionnera pas.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Obtenir le modèle Gemini pour le chat
 */
export function getChatModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });
}

/**
 * Obtenir le modèle Gemini pour la vision (analyse d'images)
 */
export function getVisionModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
  });
}

export default genAI;
