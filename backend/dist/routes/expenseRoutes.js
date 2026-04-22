import { Router } from 'express';
import { createExpenseHandler, deleteExpenseHandler, listExpensesHandler, updateExpenseHandler, } from '../controllers/expenseController';
import { verifyJWT } from '../middleware/auth';
export const expenseRouter = Router();
expenseRouter.use(verifyJWT);
expenseRouter.get('/', listExpensesHandler);
expenseRouter.post('/', createExpenseHandler);
expenseRouter.put('/:id', updateExpenseHandler);
expenseRouter.delete('/:id', deleteExpenseHandler);
