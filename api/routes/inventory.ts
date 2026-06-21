import { Router, Request, Response } from 'express';
import { dataStore } from '../data/store';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const items = dataStore.getInventory();
  res.json({ success: true, data: items });
});

router.get('/logs', (_req: Request, res: Response) => {
  const logs = dataStore.getInventoryLogs();
  res.json({ success: true, data: logs });
});

router.post('/:id/restock', (req: Request, res: Response) => {
  const { quantity, operatorName, notes } = req.body;
  if (!quantity || !operatorName) {
    return res.status(400).json({ success: false, message: '参数缺失' });
  }
  const item = dataStore.restockInventory(req.params.id, Number(quantity), operatorName, notes);
  if (!item) {
    return res.status(404).json({ success: false, message: '物资不存在' });
  }
  res.json({ success: true, data: item });
});

router.post('/:id/consume', (req: Request, res: Response) => {
  const { quantity, roomNumber, operatorName } = req.body;
  if (!quantity || !roomNumber || !operatorName) {
    return res.status(400).json({ success: false, message: '参数缺失' });
  }
  const item = dataStore.consumeInventory(req.params.id, Number(quantity), roomNumber, operatorName);
  if (!item) {
    return res.status(404).json({ success: false, message: '物资不存在或库存不足' });
  }
  res.json({ success: true, data: item });
});

export default router;
