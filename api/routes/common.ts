import { Router, Request, Response } from 'express';
import { dataStore } from '../data/store';

const router = Router();

router.get('/statistics', (_req: Request, res: Response) => {
  const stats = dataStore.getStatistics();
  res.json({ success: true, data: stats });
});

router.get('/staff', (_req: Request, res: Response) => {
  const staff = dataStore.getStaff();
  res.json({ success: true, data: staff });
});

router.get('/staff/cleaners', (_req: Request, res: Response) => {
  const cleaners = dataStore.getCleaners();
  res.json({ success: true, data: cleaners });
});

router.get('/staff/repair', (_req: Request, res: Response) => {
  const repair = dataStore.getRepairStaff();
  res.json({ success: true, data: repair });
});

export default router;
