import { expenseQuerySchema, expenseSchema } from '@expense-tracker/shared';
import { ExpenseModel } from '../models/Expense';
import { AppError } from '../utils/appError';
export const listExpenses = async (userId, query) => {
    const parsed = expenseQuerySchema.parse(query);
    const page = parsed.page ?? 1;
    const limit = parsed.limit ?? 20;
    const filters = {
        user: userId,
        deletedAt: null,
    };
    if (parsed.category)
        filters.category = parsed.category;
    if (parsed.minAmount || parsed.maxAmount) {
        filters.amount = {
            ...(parsed.minAmount !== undefined ? { $gte: parsed.minAmount } : {}),
            ...(parsed.maxAmount !== undefined ? { $lte: parsed.maxAmount } : {}),
        };
    }
    if (parsed.startDate || parsed.endDate) {
        filters.date = {
            ...(parsed.startDate ? { $gte: parsed.startDate } : {}),
            ...(parsed.endDate ? { $lte: parsed.endDate } : {}),
        };
    }
    const [items, total] = await Promise.all([
        ExpenseModel.find(filters)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        ExpenseModel.countDocuments(filters),
    ]);
    return { items, total, page, limit };
};
export const createExpense = async (userId, payload) => {
    const parsed = expenseSchema.parse(payload);
    const expense = new ExpenseModel({
        ...parsed,
        user: userId,
    });
    expense.$locals.userId = userId;
    await expense.save();
    return expense;
};
export const updateExpense = async (expenseId, userId, payload) => {
    const parsed = expenseSchema.partial().parse(payload);
    const expense = await ExpenseModel.findOneAndUpdate({ _id: expenseId, user: userId, deletedAt: null }, { $set: parsed }, {
        new: true,
        runValidators: true,
        context: 'query',
        _auditUserId: userId,
    });
    if (!expense)
        throw new AppError('Expense not found', 404);
    return expense;
};
export const softDeleteExpense = async (expenseId, userId) => {
    const expense = await ExpenseModel.findOneAndUpdate({ _id: expenseId, user: userId, deletedAt: null }, { $set: { deletedAt: new Date() } }, {
        new: true,
        context: 'query',
        _auditUserId: userId,
    });
    if (!expense)
        throw new AppError('Expense not found', 404);
    return expense;
};
