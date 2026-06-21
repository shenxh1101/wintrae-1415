import { Router, Request, Response } from 'express';
import { dataStore } from '../data/store';
import type { ApiResponse, Room, RoomStatus } from '../../shared/types';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const floor = req.query.floor ? Number(req.query.floor) : undefined;
  const status = (req.query.status as RoomStatus | 'all') || 'all';
  const rooms = dataStore.getRooms(floor, status);
  const response: ApiResponse<Room[]> = { success: true, data: rooms };
  res.json(response);
});

router.get('/:id', (req: Request, res: Response) => {
  const room = dataStore.getRoomById(req.params.id);
  if (!room) {
    return res.status(404).json({ success: false, message: '房间不存在' });
  }
  res.json({ success: true, data: room });
});

router.put('/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: '状态参数缺失' });
  }
  const room = dataStore.updateRoomStatus(req.params.id, status);
  if (!room) {
    return res.status(404).json({ success: false, message: '房间不存在' });
  }
  res.json({ success: true, data: room });
});

export default router;
