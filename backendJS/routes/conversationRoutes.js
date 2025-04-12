// server/routes/conversationRoutes.js
import express from 'express';
import { quickTalkRAGController } from '../controllers/quickTalkRAGController.js';
import { conversationController } from '../controllers/conversationController.js';

export const conversationRoutes = express.Router();

// 1) QuickTalk原有接口 - /chat
conversationRoutes.get('/quicktalk', quickTalkRAGController.quickTalkChat);

// 2) 保存对话到向量库
conversationRoutes.post('/memory', conversationController.saveMessage);

// 3) (可选) 检索历史对话片段
conversationRoutes.get('/memory', conversationController.retrieveMessages);
