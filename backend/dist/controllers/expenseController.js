import { asyncHandler } from '../middleware/asyncHandler';
import { createExpense, listExpenses, softDeleteExpense, updateExpense, } from '../services/expenseService';
export const listExpensesHandler = asyncHandler(async (req, res) => {
    const data = await listExpenses(req.user.userId, req.query);
    res.json({ success: true, data });
});
export const createExpenseHandler = asyncHandler(async (req, res) => {
    const expense = await createExpense(req.user.userId, req.body);
    res.status(201).json({ success: true, data: expense });
});
export const updateExpenseHandler = asyncHandler(async (req, res) => {
    const expense = await updateExpense(String(req.params.id), req.user.userId, req.body);
    res.json({ success: true, data: expense });
});
export const deleteExpenseHandler = asyncHandler(async (req, res) => {
    const expense = await softDeleteExpense(String(req.params.id), req.user.userId);
    res.json({ success: true, data: expense, message: 'Expense soft-deleted' });
});
