import { Router } from 'express';
import loginController from '../controllers/auth/login.controller';
import authMiddleware from '../middlewares/auth.middleware';
import logoutController from '../controllers/auth/logout.controller';

const router: Router = Router();

router.post('/login', loginController);
router.post('/logout', authMiddleware, logoutController);

export default router;