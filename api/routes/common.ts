import { Router, Request, Response } from 'express';
import { dataStore } from '../data/store';
import type { DateRangeType } from '../../shared/types';

const router = Router();

router.get('/statistics', (req: Request, res: Response) => {
  const dateRange = (req.query.dateRange as DateRangeType) || 'all';
  const stats = dataStore.getStatistics(dateRange);
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
