import { Router, Request, Response } from 'express';
import { dataStore } from '../data/store';
import type { CleaningStatus, CleaningTask, LostItem } from '../../shared/types';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const status = (req.query.status as CleaningStatus | 'all') || 'all';
  const floor = req.query.floor ? Number(req.query.floor) : undefined;
  const tasks = dataStore.getCleaningTasks(status, floor);
  res.json({ success: true, data: tasks });
});

router.get('/checkout-rooms', (_req: Request, res: Response) => {
  const rooms = dataStore.getCheckoutRooms();
  res.json({ success: true, data: rooms });
});

router.post('/', (req: Request, res: Response) => {
  const { roomId, roomNumber, floor, assigneeId, assigneeName } = req.body;
  if (!roomId || !roomNumber || !floor || !assigneeId || !assigneeName) {
    return res.status(400).json({ success: false, message: '参数缺失' });
  }
  const task = dataStore.createCleaningTask({
    roomId, roomNumber, floor, assigneeId, assigneeName, status: 'pending',
  });
  res.json({ success: true, data: task });
});

router.post('/batch-assign', (req: Request, res: Response) => {
  const { roomIds, assigneeId, assigneeName } = req.body;
  if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0 || !assigneeId || !assigneeName) {
    return res.status(400).json({ success: false, message: '参数缺失' });
  }
  const tasks = dataStore.batchAssignCleaningTasks(roomIds, assigneeId, assigneeName);
  res.json({ success: true, data: tasks });
});

router.put('/:id', (req: Request, res: Response) => {
  const updates: Partial<CleaningTask> = req.body;
  const task = dataStore.updateCleaningTask(req.params.id, updates);
  if (!task) {
    return res.status(404).json({ success: false, message: '任务不存在' });
  }
  res.json({ success: true, data: task });
});

router.post('/:id/lost-items', (req: Request, res: Response) => {
  const { name, description, foundAt } = req.body;
  if (!name || !foundAt) {
    return res.status(400).json({ success: false, message: '参数缺失' });
  }
  const lostItem: Omit<LostItem, 'id'> = { name, description: description || '', foundAt };
  const task = dataStore.addLostItem(req.params.id, lostItem);
  if (!task) {
    return res.status(404).json({ success: false, message: '任务不存在' });
  }
  res.json({ success: true, data: task });
});

export default router;
