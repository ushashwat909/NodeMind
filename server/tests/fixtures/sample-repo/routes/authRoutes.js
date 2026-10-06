import { Router } from 'express';

const router = Router();

// Security flaw: login endpoint missing rate limiting
router.post('/login', async (req, res) => {
  res.json({ status: 'ok' });
});

export default router;
