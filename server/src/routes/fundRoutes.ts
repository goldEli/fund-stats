import { Router, type Express } from 'express';
import * as fundController from '../controllers/fundController.js';

const router: ReturnType<typeof Router> = Router();

router.get('/funds', fundController.getAllFunds);
router.get('/funds/sync-progress', fundController.getSyncProgress);
router.get('/funds/:code', fundController.getFundByCode);
router.post('/funds', fundController.addFund);
router.put('/funds/:code', fundController.updateFund);
router.delete('/funds/:code', fundController.deleteFund);

router.post('/funds/sync/:code', fundController.syncFund);
router.post('/funds/sync-all', fundController.syncAllFunds);

router.get('/stats/ranking', fundController.getRanking);
router.get('/stats/type-distribution', fundController.getTypeDistribution);

export default router;
