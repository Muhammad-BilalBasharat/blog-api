import express from 'express';
import { subscribe, getAllSubscribers, deleteSubscriber } from '../controllers/newsletter.js';
const router = express.Router();


router.post('/subscribe', subscribe);
router.get('/subscribers', getAllSubscribers);
router.delete('/delete-subscriber/:id', deleteSubscriber);

export default router;