import { verifyAccessToken } from '../utils/tokens';
export const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        req.user = verifyAccessToken(token);
        next();
    }
    catch {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
export const requireRole = (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
    }
    next();
};
