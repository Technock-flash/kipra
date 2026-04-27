import { Request, Response, NextFunction } from 'express';
import { successResponse, errorResponse } from '@utils/response';
import { AppError } from '@middleware/errorHandler';
import { logLogin, logLogout } from '@middleware/auditLogger';
import * as authService from '@services/auth.service';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.registerUser(req.body);
    successResponse(res, user, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password, req.ip);

    if ('requiresTwoFactor' in result) {
      successResponse(res, result, 'Two-factor authentication required');
      return;
    }

    await logLogin(result.user.id, req.ip, req.headers['user-agent'], true);

    successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const verify2FA = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, token } = req.body;
    
    // Find user by email to get userId
    const user = await authService.verifyTwoFactor(req.body.userId || '', token);
    
    await logLogin(user.user.id, req.ip, req.headers['user-agent'], true);
    
    successResponse(res, user, 'Two-factor authentication successful');
  } catch (error) {
    next(error);
  }
};

export const setup2FA = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { enable } = req.body;
    const result = await authService.setupTwoFactor(req.user.id, enable);
    successResponse(res, result, '2FA setup initiated');
  } catch (error) {
    next(error);
  }
};

export const confirm2FA = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { token } = req.body;
    const result = await authService.confirmTwoFactorSetup(req.user.id, token);
    successResponse(res, result, '2FA enabled successfully');
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);
    successResponse(res, tokens, 'Token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.token) {
      throw new AppError('Authentication required', 401);
    }

    await authService.logoutUser(req.user.id, req.token);
    await logLogout(req.user.id, req.ip, req.headers['user-agent']);

    successResponse(res, null, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { password, twoFactorSecret, ...profile } = req.user;
    successResponse(res, profile, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword
    );
    successResponse(res, result, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

