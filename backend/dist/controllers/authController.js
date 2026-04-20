import { env } from '../config/env';
import { asyncHandler } from '../middleware/asyncHandler';
import { login, logout, register, requestPasswordReset, rotateRefreshToken, resetPassword, sendVerificationCode, verifyEmailCode, } from '../services/authService';
const refreshCookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
export const registerHandler = asyncHandler(async (req, res) => {
    const user = await register(req.body);
    res.status(201).json({ success: true, data: user });
});
export const sendVerificationCodeHandler = asyncHandler(async (req, res) => {
    await sendVerificationCode(req.body);
    res.json({ success: true, message: 'Verification code sent' });
});
export const verifyEmailCodeHandler = asyncHandler(async (req, res) => {
    await verifyEmailCode(req.body);
    res.json({ success: true, message: 'Email verified successfully' });
});
export const requestPasswordResetHandler = asyncHandler(async (req, res) => {
    await requestPasswordReset(req.body);
    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
});
export const resetPasswordHandler = asyncHandler(async (req, res) => {
    await resetPassword(req.body);
    res.json({ success: true, message: 'Password reset successfully' });
});
export const loginHandler = asyncHandler(async (req, res) => {
    const result = await login(req.body);
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);
    res.json({ success: true, data: { accessToken: result.accessToken, user: result.user } });
});
export const refreshTokenHandler = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    const result = await rotateRefreshToken(refreshToken);
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions);
    res.json({ success: true, data: { accessToken: result.accessToken } });
});
export const logoutHandler = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        await logout(refreshToken);
    }
    res.clearCookie('refreshToken', {
        httpOnly: true,
        sameSite: refreshCookieOptions.sameSite,
        secure: refreshCookieOptions.secure,
        path: refreshCookieOptions.path,
    });
    res.json({ success: true, message: 'Logged out' });
});
export const meHandler = asyncHandler(async (req, res) => {
    res.json({ success: true, data: req.user });
});
