import express from 'express';
import {
  getOrCreateConversation,
  sendMessage,
  getConversationHistory,
  translate,
  reportIssue,
} from '../controllers/chatController.js';

const router = express.Router();

// Routes de chat (publiques pour les voyageurs)
router.post('/conversations/:propertyId', getOrCreateConversation);
router.post('/conversations/:conversationId/messages', sendMessage);
router.get('/conversations/:conversationId', getConversationHistory);
router.post('/translate', translate);
router.post('/issues/:propertyId', reportIssue);

export default router;
