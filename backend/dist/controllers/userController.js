import { asyncHandler } from '../middleware/asyncHandler';
import { listUsers, updateUserRole, updateUserStatus } from '../services/userService';
import { AppError } from '../utils/appError';
const parseRole = (value) => {
    if (value === 'admin' || value === 'staff')
        return value;
    return undefined;
};
const parseStatus = (value) => {
    if (value === 'active' || value === 'inactive')
        return value;
    return undefined;
};
const getParam = (value) => Array.isArray(value) ? value[0] : (value ?? '');
export const listUsersHandler = asyncHandler(async (req, res) => {
    if (!req.user?.companyId)
        throw new AppError('Unauthorized', 401);
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 25);
    const data = await listUsers({
        companyId: req.user.companyId,
        page,
        limit,
        role: parseRole(req.query.role),
        status: parseStatus(req.query.status),
        q: typeof req.query.q === 'string' ? req.query.q : undefined,
    });
    res.json({ success: true, data });
});
export const updateUserRoleHandler = asyncHandler(async (req, res) => {
    const role = parseRole(req.body?.role);
    if (!role)
        throw new AppError('Invalid role', 400);
    if (!req.user?.userId || !req.user.companyId)
        throw new AppError('Unauthorized', 401);
    const data = await updateUserRole({
        currentUserId: req.user.userId,
        currentCompanyId: req.user.companyId,
        userId: getParam(req.params.id),
        role,
    });
    res.json({ success: true, data });
});
export const updateUserStatusHandler = asyncHandler(async (req, res) => {
    const isActive = req.body?.isActive;
    if (typeof isActive !== 'boolean')
        throw new AppError('isActive must be a boolean', 400);
    if (!req.user?.userId || !req.user.companyId)
        throw new AppError('Unauthorized', 401);
    const data = await updateUserStatus({
        currentUserId: req.user.userId,
        currentCompanyId: req.user.companyId,
        userId: getParam(req.params.id),
        isActive,
    });
    res.json({ success: true, data });
});
