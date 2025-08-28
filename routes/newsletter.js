import express from 'express';
import { subscribe, getAllSubscribers } from '../controllers/newsletter.js';
const router = express.Router();


router.post('/subscribe', subscribe);
router.get('/subscribers', getAllSubscribers);

export default router;