export type RoomStatus = 'available' | 'pending' | 'checkout' | 'cleaning' | 'outOfService';

export interface Room {
  id: string;
  number: string;
  floor: number;
  type: string;
  status: RoomStatus;
  guestName?: string;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

export type CleaningStatus = 'pending' | 'inProgress' | 'completed' | 'rework';

export interface LostItem {
  id: string;
  name: string;
  description: string;
  photo?: string;
  foundAt: string;
}

export interface CleaningTask {
  id: string;
  roomId: string;
  roomNumber: string;
  floor: number;
  assigneeId: string;
  assigneeName: string;
  status: CleaningStatus;
  startTime?: string;
  endTime?: string;
  photos: string[];
  anomalies: string[];
  lostItems: LostItem[];
  createdAt: string;
  completedAt?: string;
  reworkCount: number;
}

export type MaintenanceStatus = 'pending' | 'inProgress' | 'completed' | 'cancelled';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceActionType = 'created' | 'assigned' | 'started' | 'note' | 'completed' | 'cancelled';

export interface MaintenanceTimeline {
  id: string;
  orderId: string;
  action: MaintenanceActionType;
  operatorName: string;
  operatorId?: string;
  note?: string;
  createdAt: string;
}

export interface MaintenanceOrder {
  id: string;
  roomId: string;
  roomNumber: string;
  location: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reporterName: string;
  assigneeId?: string;
  assigneeName?: string;
  photos: string[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: string;
  repairDurationMinutes?: number;
  timeline: MaintenanceTimeline[];
}

export type InventoryCategory = 'toiletries' | 'footwear' | 'tissue' | 'water';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  totalQuantity: number;
  warningThreshold: number;
  lastRestockedAt?: string;
}

export interface InventoryLog {
  id: string;
  itemId: string;
  itemName: string;
  type: 'in' | 'out';
  quantity: number;
  roomNumber?: string;
  operatorName: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryCombo {
  id: string;
  name: string;
  description: string;
  items: { itemId: string; itemName: string; quantity: number }[];
}

export interface Staff {
  id: string;
  name: string;
  role: 'reception' | 'cleaner' | 'repair' | 'admin';
  avatar?: string;
  floor?: number;
}

export type DateRangeType = 'today' | 'week' | 'month' | 'all';

export interface Statistics {
  avgCleaningTurnaroundMinutes: number;
  totalReworkCount: number;
  avgRepairDurationMinutes: number;
  consumptionPerRoom: {
    itemName: string;
    avgQuantity: number;
  }[];
  cleaningByPerson: { name: string; count: number; avgMinutes: number }[];
  repairsByType: { type: string; count: number }[];
  monthlyTrend: { month: string; cleaningCount: number; repairCount: number }[];
  dateRange?: DateRangeType;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
