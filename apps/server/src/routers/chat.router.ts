import { Router } from 'express';
import authMiddleware from '../middlewares/auth.middleware';
import sendMessageController from '../controllers/chat/sendMessage.controller';
import editMessageController from '../controllers/chat/editMessage.controller';
import getMessageController from '../controllers/chat/getMessage.controller';
import deleteMessageController from '../controllers/chat/deleteMessage.controller';

const router: Router = Router();

router.post('/send-message', authMiddleware, sendMessageController);
router.get('/get-message/:roomId', authMiddleware, getMessageController);
router.put('/edit-message', authMiddleware, editMessageController);
router.delete('/delete-message', authMiddleware, deleteMessageController);

export default router;