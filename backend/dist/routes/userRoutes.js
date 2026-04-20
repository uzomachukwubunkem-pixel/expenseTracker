import { Router } from 'express';
import { listUsersHandler, updateUserRoleHandler, updateUserStatusHandler, } from '../controllers/userController';
import { requireRole, verifyJWT } from '../middleware/auth';
export const userRouter = Router();
userRouter.use(verifyJWT);
userRouter.use(requireRole(['admin']));
userRouter.get('/', listUsersHandler);
userRouter.patch('/:id/role', updateUserRoleHandler);
userRouter.patch('/:id/status', updateUserStatusHandler);
