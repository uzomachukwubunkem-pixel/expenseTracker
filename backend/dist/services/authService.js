import { loginSchema, registerSchema, requestPasswordResetSchema, resetPasswordSchema, sendVerificationCodeSchema, verifyEmailCodeSchema, } from '../utils/validator-schema';
import crypto from 'node:crypto';
import { env } from '../config/env';
import { RefreshTokenModel } from '../models/RefreshToken';
import { UserModel } from '../models/User';
import { AppError } from '../utils/appError';
import { compareTokenHash, hashToken, randomId, signAccessToken, signRefreshToken, verifyRefreshToken, } from '../utils/tokens';
import { sendPasswordResetEmail, sendVerificationCodeEmail } from './emailService';
const hashVerificationCode = (code) => crypto.createHash('sha256').update(code).digest('hex');
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const normalizeCompanyId = (value) => value.trim().toLowerCase();
const normalizeEmail = (value) => value.trim().toLowerCase();
const generateCompanyId = () => `cmp-${randomId()}`;
const generatePendingCompanyId = () => `pending-${randomId()}`;
const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const issueEmailVerificationCode = async (user) => {
    const code = generateVerificationCode();
    const codeHash = hashVerificationCode(code);
    await UserModel.findByIdAndUpdate(user._id, {
        emailVerificationCodeHash: codeHash,
        emailVerificationCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    return sendVerificationCodeEmail(user.email, user.name, code);
};
const issuePasswordResetToken = async (user) => {
    const token = randomId();
    const tokenHash = hashResetToken(token);
    await UserModel.findByIdAndUpdate(user._id, {
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    const resetUrl = `${env.frontendUrl}/reset-password?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token)}`;
    return sendPasswordResetEmail(user.email, user.name, resetUrl);
};
export const register = async (payload) => {
    const parsed = registerSchema.parse(payload);
    const email = normalizeEmail(parsed.email);
    const resolvedRole = parsed.role ?? 'staff';
    const requestedCompanyId = parsed.companyId?.trim()
        ? normalizeCompanyId(parsed.companyId)
        : undefined;
    const exists = await UserModel.findOne({ email }).lean();
    if (exists)
        throw new AppError('Email already in use', 409);
    let companyId;
    if (resolvedRole === 'staff') {
        if (!requestedCompanyId) {
            throw new AppError('Company ID is required for staff accounts. Ask your admin for the company ID.', 400);
        }
        const companyExists = await UserModel.exists({ companyId: requestedCompanyId });
        if (!companyExists) {
            throw new AppError('Company not found. Ask your admin for the correct company ID.', 404);
        }
        companyId = requestedCompanyId;
    }
    else {
        if (requestedCompanyId) {
            throw new AppError('Admin accounts receive a company ID after company setup. Leave company ID blank during account registration.', 400);
        }
        let pendingCompanyId = generatePendingCompanyId();
        while (await UserModel.exists({ companyId: pendingCompanyId })) {
            pendingCompanyId = generatePendingCompanyId();
        }
        companyId = pendingCompanyId;
    }
    const user = await UserModel.create({
        name: parsed.name,
        email,
        password: parsed.password,
        role: resolvedRole,
        companyId,
    });
    await issueEmailVerificationCode({ _id: user._id, name: user.name, email: user.email });
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        isEmailVerified: user.isEmailVerified,
    };
};
export const sendVerificationCode = async (payload) => {
    const parsed = sendVerificationCodeSchema.parse(payload);
    const email = normalizeEmail(parsed.email);
    const user = await UserModel.findOne({ email });
    if (!user)
        throw new AppError('User not found', 404);
    const delivered = await issueEmailVerificationCode({ _id: user._id, name: user.name, email: user.email });
    if (!delivered) {
        throw new AppError('Verification email could not be delivered. Check mail configuration and network access.', 502);
    }
};
export const verifyEmailCode = async (payload) => {
    const parsed = verifyEmailCodeSchema.parse(payload);
    const email = normalizeEmail(parsed.email);
    const user = await UserModel.findOne({ email }).select('+emailVerificationCodeHash +emailVerificationCodeExpiresAt');
    if (!user)
        throw new AppError('User not found', 404);
    if (user.isEmailVerified)
        return;
    const now = new Date();
    if (!user.emailVerificationCodeHash || !user.emailVerificationCodeExpiresAt) {
        throw new AppError('Verification code not requested', 400);
    }
    if (user.emailVerificationCodeExpiresAt < now) {
        throw new AppError('Verification code expired', 400);
    }
    const incomingHash = hashVerificationCode(parsed.code);
    if (incomingHash !== user.emailVerificationCodeHash) {
        throw new AppError('Invalid verification code', 400);
    }
    user.isEmailVerified = true;
    user.emailVerificationCodeHash = undefined;
    user.emailVerificationCodeExpiresAt = undefined;
    await user.save();
};
export const requestPasswordReset = async (payload) => {
    const parsed = requestPasswordResetSchema.parse(payload);
    const email = normalizeEmail(parsed.email);
    const user = await UserModel.findOne({ email });
    if (!user)
        return;
    await issuePasswordResetToken({ _id: user._id, name: user.name, email: user.email });
};
export const resetPassword = async (payload) => {
    const parsed = resetPasswordSchema.parse(payload);
    const email = normalizeEmail(parsed.email);
    const user = await UserModel.findOne({ email }).select('+passwordResetTokenHash +passwordResetTokenExpiresAt');
    if (!user)
        throw new AppError('Password reset request not found', 404);
    if (!user.passwordResetTokenHash || !user.passwordResetTokenExpiresAt) {
        throw new AppError('Password reset request not found', 404);
    }
    if (user.passwordResetTokenExpiresAt < new Date()) {
        throw new AppError('Password reset token expired', 400);
    }
    if (hashResetToken(parsed.token) !== user.passwordResetTokenHash) {
        throw new AppError('Invalid password reset token', 400);
    }
    user.password = parsed.password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpiresAt = undefined;
    await user.save();
    await RefreshTokenModel.updateMany({ user: user._id }, { revoked: true });
};
export const login = async (payload) => {
    const parsed = loginSchema.parse(payload);
    const email = normalizeEmail(parsed.email);
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user)
        throw new AppError('Invalid credentials', 401);
    if (!user.isActive) {
        throw new AppError('Account is inactive. Contact your administrator.', 403);
    }
    if (!user.isEmailVerified) {
        throw new AppError('Email not verified. Please verify your email code first.', 403);
    }
    const isValid = await user.comparePassword(parsed.password);
    if (!isValid)
        throw new AppError('Invalid credentials', 401);
    const tokenPayload = {
        userId: String(user._id),
        email: user.email,
        role: user.role,
        companyId: user.companyId,
    };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);
    const tokenHash = await hashToken(refreshToken);
    await RefreshTokenModel.create({
        user: user._id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return {
        accessToken,
        refreshToken,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
        },
    };
};
export const logout = async (refreshToken) => {
    const payload = verifyRefreshToken(refreshToken);
    const user = await UserModel.findById(payload.userId);
    if (!user)
        return;
    const tokens = await RefreshTokenModel.find({ user: user._id, revoked: false });
    for (const tokenDoc of tokens) {
        const matches = await compareTokenHash(refreshToken, tokenDoc.tokenHash);
        if (matches) {
            tokenDoc.revoked = true;
            await tokenDoc.save();
            break;
        }
    }
};
export const rotateRefreshToken = async (refreshToken) => {
    const payload = verifyRefreshToken(refreshToken);
    const user = await UserModel.findById(payload.userId);
    if (!user)
        throw new AppError('User not found', 404);
    const tokenDocs = await RefreshTokenModel.find({ user: user._id, revoked: false });
    let activeToken = null;
    for (const doc of tokenDocs) {
        if (await compareTokenHash(refreshToken, doc.tokenHash)) {
            activeToken = doc;
            break;
        }
    }
    if (!activeToken)
        throw new AppError('Invalid refresh token', 401);
    activeToken.revoked = true;
    await activeToken.save();
    const tokenPayload = {
        userId: String(user._id),
        email: user.email,
        role: user.role,
        companyId: user.companyId,
    };
    const accessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);
    await RefreshTokenModel.create({
        user: user._id,
        tokenHash: await hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return { accessToken, refreshToken: newRefreshToken };
};
