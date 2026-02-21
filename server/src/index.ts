import express from 'express';
import cors from 'cors';
import fundRoutes from './routes/fundRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', fundRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
