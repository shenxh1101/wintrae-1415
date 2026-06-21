import { Router, Request, Response } from 'express';
import { dataStore } from '../data/store';
import type { MaintenanceOrder, MaintenanceStatus, MaintenanceActionType } from '../../shared/types';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const status = (req.query.status as MaintenanceStatus | 'all') || 'all';
  const orders = dataStore.getMaintenanceOrders(status);
  res.json({ success: true, data: orders });
});

router.post('/', (req: Request, res: Response) => {
  const { roomId, roomNumber, location, description, priority, reporterName } = req.body;
  if (!roomId || !roomNumber || !location || !description || !priority || !reporterName) {
    return res.status(400).json({ success: false, message: '参数缺失' });
  }
  const order = dataStore.createMaintenanceOrder({
    roomId, roomNumber, location, description, priority, reporterName, status: 'pending',
  });
  res.json({ success: true, data: order });
});

router.put('/:id', (req: Request, res: Response) => {
  const updates: Partial<MaintenanceOrder> = req.body;
  const order = dataStore.updateMaintenanceOrder(req.params.id, updates);
  if (!order) {
    return res.status(404).json({ success: false, message: '工单不存在' });
  }
  res.json({ success: true, data: order });
});

router.post('/:id/timeline', (req: Request, res: Response) => {
  const { action, operatorName, operatorId, note } = req.body;
  if (!action || !operatorName) {
    return res.status(400).json({ success: false, message: '参数缺失' });
  }
  const timeline = dataStore.addMaintenanceTimeline(
    req.params.id,
    action as MaintenanceActionType,
    operatorName,
    operatorId,
    note
  );
  if (!timeline) {
    return res.status(404).json({ success: false, message: '工单不存在' });
  }
  res.json({ success: true, data: timeline });
});

router.put('/:id/complete', (req: Request, res: Response) => {
  const { result, repairDurationMinutes, operatorName, operatorId } = req.body;
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const order = dataStore.updateMaintenanceOrder(req.params.id, {
    status: 'completed',
    result,
    repairDurationMinutes,
    completedAt: now,
  });
  if (!order) {
    return res.status(404).json({ success: false, message: '工单不存在' });
  }
  if (operatorName) {
    dataStore.addMaintenanceTimeline(
      req.params.id,
      'completed',
      operatorName,
      operatorId,
      result
    );
  }
  res.json({ success: true, data: order });
});

export default router;
