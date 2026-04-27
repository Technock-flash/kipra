import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { validateBody } from '@middleware/validateRequest';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  changePasswordSchema,
  setupTwoFactorSchema,
  twoFactorSchema,
} from '@validators/auth.validator';
import * as authController from '@controllers/auth.controller';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/2fa/verify', validateBody(twoFactorSchema), authController.verify2FA);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refreshToken);

// Protected routes
router.use(authenticate);

router.get('/profile', authController.getProfile);
router.post('/logout', authController.logout);
router.post('/change-password', validateBody(changePasswordSchema), authController.changePassword);
router.post('/2fa/setup', validateBody(setupTwoFactorSchema), authController.setup2FA);
router.post('/2fa/confirm', authController.confirm2FA);

export default router;

