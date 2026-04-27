import { Router } from 'express';
import { authenticate } from '@middleware/auth';
import { requirePermission } from '@middleware/rbac';
import { Permission } from '@utils/permissions';
import { validateBody, validateQuery } from '@middleware/validateRequest';
import { offeringSchema, titheSchema, pledgeSchema, pledgePaymentSchema, expenseSchema, financeQuerySchema } from '@validators/finance.validator';
import * as financeController from '@controllers/finance.controller';

const router = Router();

router.use(authenticate);

// Offerings
router.get('/offerings', validateQuery(financeQuerySchema), requirePermission(Permission.FINANCE_READ), financeController.getOfferings);
router.post('/offerings', validateBody(offeringSchema), requirePermission(Permission.FINANCE_CREATE), financeController.createOffering);
router.get('/offerings/:id', requirePermission(Permission.FINANCE_READ), financeController.getOfferingById);
router.put('/offerings/:id', validateBody(offeringSchema), requirePermission(Permission.FINANCE_UPDATE), financeController.updateOffering);
router.delete('/offerings/:id', requirePermission(Permission.FINANCE_DELETE), financeController.deleteOffering);
router.post('/offerings/:id/restore', requirePermission(Permission.FINANCE_RESTORE), financeController.restoreOffering);

// Tithes
router.get('/tithes', validateQuery(financeQuerySchema), requirePermission(Permission.FINANCE_READ), financeController.getTithes);
router.post('/tithes', validateBody(titheSchema), requirePermission(Permission.FINANCE_CREATE), financeController.createTithe);
router.get('/tithes/:id', requirePermission(Permission.FINANCE_READ), financeController.getTitheById);
router.put('/tithes/:id', validateBody(titheSchema), requirePermission(Permission.FINANCE_UPDATE), financeController.updateTithe);
router.delete('/tithes/:id', requirePermission(Permission.FINANCE_DELETE), financeController.deleteTithe);

// Pledges
router.get('/pledges', validateQuery(financeQuerySchema), requirePermission(Permission.FINANCE_READ), financeController.getPledges);
router.post('/pledges', validateBody(pledgeSchema), requirePermission(Permission.FINANCE_CREATE), financeController.createPledge);
router.get('/pledges/:id', requirePermission(Permission.FINANCE_READ), financeController.getPledgeById);
router.put('/pledges/:id', validateBody(pledgeSchema), requirePermission(Permission.FINANCE_UPDATE), financeController.updatePledge);
router.delete('/pledges/:id', requirePermission(Permission.FINANCE_DELETE), financeController.deletePledge);
router.post('/pledges/:id/payments', validateBody(pledgePaymentSchema), requirePermission(Permission.FINANCE_CREATE), financeController.addPledgePayment);

// Expenses
router.get('/expenses', validateQuery(financeQuerySchema), requirePermission(Permission.FINANCE_READ), financeController.getExpenses);
router.post('/expenses', validateBody(expenseSchema), requirePermission(Permission.FINANCE_CREATE), financeController.createExpense);
router.get('/expenses/:id', requirePermission(Permission.FINANCE_READ), financeController.getExpenseById);
router.put('/expenses/:id', validateBody(expenseSchema), requirePermission(Permission.FINANCE_UPDATE), financeController.updateExpense);
router.delete('/expenses/:id', requirePermission(Permission.FINANCE_DELETE), financeController.deleteExpense);

// Reports
router.get('/reports/summary', requirePermission(Permission.FINANCE_READ), financeController.getFinancialSummary);
router.get('/reports/trends', requirePermission(Permission.FINANCE_READ), financeController.getFinancialTrends);

export default router;

