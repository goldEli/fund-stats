import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import fundRoutes from './routes/fundRoutes.js';
import * as fundService from './services/fundService.js';
import * as fundApiService from './services/fundApiService.js';
import * as statsService from './services/statsService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', fundRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Starting scheduled fund sync...');
  try {
    const funds = fundService.getAllFunds();
    for (const fund of funds) {
      try {
        const updatedFund = await fundApiService.fetchFundWithRetry(fund.code);
        fundService.addFund(updatedFund);
      } catch (error) {
        console.error(`[Cron] Failed to sync fund ${fund.code}:`, error);
      }
    }
    statsService.saveRankingsToFunds();
    console.log('[Cron] Scheduled sync completed');
  } catch (error) {
    console.error('[Cron] Scheduled sync failed:', error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
