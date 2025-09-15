import { Router } from 'express';
const router = Router();
import { redirectToNaverLogin, naverCallback } from './naver.controller.js';

router.get('/login', redirectToNaverLogin);
router.get('/callback', naverCallback);

export default router;
