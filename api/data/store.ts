import type {
  Room,
  CleaningTask,
  MaintenanceOrder,
  MaintenanceTimeline,
  MaintenanceActionType,
  InventoryItem,
  InventoryLog,
  InventoryCombo,
  Staff,
  Statistics,
  RoomStatus,
  CleaningStatus,
  MaintenanceStatus,
  DateRangeType,
} from '../../shared/types';
import {
  roomsSeed,
  cleaningTasksSeed,
  maintenanceOrdersSeed,
  inventorySeed,
  inventoryCombosSeed,
  inventoryLogsSeed,
  staffSeed,
} from './seed';

function getDateRangeStart(range: DateRangeType): string | null {
  const now = new Date();
  if (range === 'all') return null;
  if (range === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return start.toISOString().slice(0, 10);
  }
  if (range === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.getFullYear(), now.getMonth(), diff);
    return start.toISOString().slice(0, 10);
  }
  if (range === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return start.toISOString().slice(0, 10);
  }
  return null;
}

function isInRange(dateStr: string, startDate: string | null): boolean {
  if (!startDate) return true;
  return dateStr.slice(0, 10) >= startDate;
}

class DataStore {
  private rooms: Room[] = [...roomsSeed];
  private cleaningTasks: CleaningTask[] = [...cleaningTasksSeed];
  private maintenanceOrders: MaintenanceOrder[] = [...maintenanceOrdersSeed];
  private inventory: InventoryItem[] = [...inventorySeed];
  private inventoryCombos: InventoryCombo[] = [...inventoryCombosSeed];
  private inventoryLogs: InventoryLog[] = [...inventoryLogsSeed];
  private staff: Staff[] = [...staffSeed];

  getRooms(floor?: number, status?: RoomStatus | 'all'): Room[] {
    return this.rooms.filter((r) => {
      if (floor !== undefined && floor !== null && String(floor) !== 'all' && r.floor !== floor) return false;
      if (status && status !== 'all' && r.status !== status) return false;
      return true;
    });
  }

  getRoomById(id: string): Room | undefined {
    return this.rooms.find((r) => r.id === id);
  }

  updateRoomStatus(id: string, status: RoomStatus): Room | undefined {
    const room = this.rooms.find((r) => r.id === id);
    if (room) {
      room.status = status;
    }
    return room;
  }

  getCheckoutRooms(): Room[] {
    return this.rooms.filter((r) => r.status === 'checkout');
  }

  getCleaningTasks(status?: CleaningStatus | 'all', floor?: number): CleaningTask[] {
    return this.cleaningTasks.filter((t) => {
      if (status && status !== 'all' && t.status !== status) return false;
      if (floor !== undefined && floor !== null && String(floor) !== 'all' && t.floor !== floor) return false;
      return true;
    }).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  createCleaningTask(task: Omit<CleaningTask, 'id' | 'createdAt' | 'photos' | 'anomalies' | 'lostItems' | 'reworkCount'>): CleaningTask {
    const newTask: CleaningTask = {
      ...task,
      id: `ct${Date.now()}`,
      photos: [],
      anomalies: [],
      lostItems: [],
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      reworkCount: 0,
    };
    this.cleaningTasks.push(newTask);
    return newTask;
  }

  batchAssignCleaningTasks(roomIds: string[], assigneeId: string, assigneeName: string): CleaningTask[] {
    const createdTasks: CleaningTask[] = [];
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    roomIds.forEach((roomId) => {
      const room = this.rooms.find((r) => r.id === roomId);
      if (room && room.status === 'checkout') {
        const existingTask = this.cleaningTasks.find(
          (t) => t.roomId === roomId && (t.status === 'pending' || t.status === 'inProgress')
        );
        if (!existingTask) {
          const newTask: CleaningTask = {
            id: `ct${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            roomId,
            roomNumber: room.number,
            floor: room.floor,
            assigneeId,
            assigneeName,
            status: 'pending',
            photos: [],
            anomalies: [],
            lostItems: [],
            createdAt: now,
            reworkCount: 0,
          };
          this.cleaningTasks.push(newTask);
          createdTasks.push(newTask);
        }
      }
    });
    return createdTasks;
  }

  updateCleaningTask(id: string, updates: Partial<CleaningTask>): CleaningTask | undefined {
    const task = this.cleaningTasks.find((t) => t.id === id);
    if (task) {
      Object.assign(task, updates);
    }
    return task;
  }

  addLostItem(taskId: string, lostItem: Omit<CleaningTask['lostItems'][0], 'id'>) {
    const task = this.cleaningTasks.find((t) => t.id === taskId);
    if (task) {
      task.lostItems.push({ ...lostItem, id: `li${Date.now()}` });
    }
    return task;
  }

  getMaintenanceOrders(status?: MaintenanceStatus | 'all'): MaintenanceOrder[] {
    return this.maintenanceOrders.filter((t) => {
      if (status && status !== 'all' && t.status !== status) return false;
      return true;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  addMaintenanceTimeline(
    orderId: string,
    action: MaintenanceActionType,
    operatorName: string,
    operatorId?: string,
    note?: string
  ): MaintenanceTimeline | undefined {
    const order = this.maintenanceOrders.find((o) => o.id === orderId);
    if (!order) return undefined;
    const timeline: MaintenanceTimeline = {
      id: `tl${Date.now()}`,
      orderId,
      action,
      operatorName,
      operatorId,
      note,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    if (!order.timeline) {
      order.timeline = [];
    }
    order.timeline.push(timeline);
    return timeline;
  }

  createMaintenanceOrder(order: Omit<MaintenanceOrder, 'id' | 'createdAt' | 'photos' | 'timeline'>): MaintenanceOrder {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const newOrder: MaintenanceOrder = {
      ...order,
      id: `mo${Date.now()}`,
      photos: [],
      createdAt: now,
      timeline: [],
    };
    newOrder.timeline.push({
      id: `tl${Date.now()}`,
      orderId: newOrder.id,
      action: 'created',
      operatorName: order.reporterName,
      createdAt: now,
    });
    this.maintenanceOrders.push(newOrder);
    return newOrder;
  }

  updateMaintenanceOrder(id: string, updates: Partial<MaintenanceOrder>): MaintenanceOrder | undefined {
    const order = this.maintenanceOrders.find((o) => o.id === id);
    if (order) {
      Object.assign(order, updates);
    }
    return order;
  }

  getInventory(): InventoryItem[] {
    return this.inventory;
  }

  getInventoryCombos(): InventoryCombo[] {
    return this.inventoryCombos;
  }

  getInventoryLogs(): InventoryLog[] {
    return this.inventoryLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  restockInventory(itemId: string, quantity: number, operatorName: string, notes?: string): InventoryItem | undefined {
    const item = this.inventory.find((i) => i.id === itemId);
    if (item) {
      item.totalQuantity += quantity;
      item.lastRestockedAt = new Date().toISOString().slice(0, 10);
      this.inventoryLogs.push({
        id: `log${Date.now()}`,
        itemId,
        itemName: item.name,
        type: 'in',
        quantity,
        operatorName,
        notes,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      });
    }
    return item;
  }

  consumeInventory(itemId: string, quantity: number, roomNumber: string, operatorName: string): InventoryItem | undefined {
    const item = this.inventory.find((i) => i.id === itemId);
    if (item && item.totalQuantity >= quantity) {
      item.totalQuantity -= quantity;
      this.inventoryLogs.push({
        id: `log${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        itemId,
        itemName: item.name,
        type: 'out',
        quantity,
        roomNumber,
        operatorName,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      });
      return item;
    }
    return undefined;
  }

  consumeComboInventory(comboId: string, roomNumber: string, operatorName: string): { success: boolean; message: string; items?: { name: string; quantity: number }[] } {
    const combo = this.inventoryCombos.find((c) => c.id === comboId);
    if (!combo) {
      return { success: false, message: '组合包不存在' };
    }
    for (const comboItem of combo.items) {
      const item = this.inventory.find((i) => i.id === comboItem.itemId);
      if (!item || item.totalQuantity < comboItem.quantity) {
        return { success: false, message: `${comboItem.itemName}库存不足，当前库存${item?.totalQuantity || 0}${item?.unit || ''}` };
      }
    }
    const consumedItems: { name: string; quantity: number }[] = [];
    for (const comboItem of combo.items) {
      const item = this.consumeInventory(comboItem.itemId, comboItem.quantity, roomNumber, operatorName);
      if (item) {
        consumedItems.push({ name: comboItem.itemName, quantity: comboItem.quantity });
      }
    }
    return { success: true, message: '领用成功', items: consumedItems };
  }

  getStaff(): Staff[] {
    return this.staff;
  }

  getCleaners(): Staff[] {
    return this.staff.filter((s) => s.role === 'cleaner');
  }

  getRepairStaff(): Staff[] {
    return this.staff.filter((s) => s.role === 'repair');
  }

  getStatistics(dateRange: DateRangeType = 'all'): Statistics {
    const startDate = getDateRangeStart(dateRange);
    const inRange = (d: string) => isInRange(d, startDate);

    const completedTasks = this.cleaningTasks.filter((t) => t.endTime && t.startTime && inRange(t.createdAt));
    const avgCleaningTurnaround = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => {
          const start = new Date(t.startTime!).getTime();
          const end = new Date(t.endTime!).getTime();
          return sum + Math.round((end - start) / 60000);
        }, 0) / completedTasks.length
      : 0;

    const totalRework = this.cleaningTasks.filter((t) => inRange(t.createdAt)).reduce((sum, t) => sum + t.reworkCount, 0);

    const completedRepairs = this.maintenanceOrders.filter((o) => o.repairDurationMinutes && inRange(o.createdAt));
    const avgRepairDuration = completedRepairs.length > 0
      ? completedRepairs.reduce((sum, o) => sum + (o.repairDurationMinutes || 0), 0) / completedRepairs.length
      : 0;

    const roomCount = this.rooms.length;
    const filteredLogs = this.inventoryLogs.filter((l) => l.type === 'out' && inRange(l.createdAt));
    const consumptionPerRoom = this.inventory.map((item) => {
      const totalConsumed = filteredLogs
        .filter((l) => l.itemId === item.id)
        .reduce((sum, l) => sum + l.quantity, 0);
      return {
        itemName: item.name,
        avgQuantity: roomCount > 0 ? Number((totalConsumed / roomCount).toFixed(2)) : 0,
      };
    });

    const cleaningByPerson = this.getCleaners().map((cleaner) => {
      const personTasks = completedTasks.filter((t) => t.assigneeId === cleaner.id);
      const avgMin = personTasks.length > 0
        ? personTasks.reduce((sum, t) => {
            const start = new Date(t.startTime!).getTime();
            const end = new Date(t.endTime!).getTime();
            return sum + Math.round((end - start) / 60000);
          }, 0) / personTasks.length
        : 0;
      return {
        name: cleaner.name,
        count: personTasks.length,
        avgMinutes: Math.round(avgMin),
      };
    });

    const repairsByTypeMap = new Map<string, number>();
    this.maintenanceOrders.filter((o) => inRange(o.createdAt)).forEach((o) => {
      repairsByTypeMap.set(o.location, (repairsByTypeMap.get(o.location) || 0) + 1);
    });
    const repairsByType = Array.from(repairsByTypeMap.entries()).map(([type, count]) => ({ type, count }));

    const monthlyTrend = [
      { month: '1月', cleaningCount: 45, repairCount: 12 },
      { month: '2月', cleaningCount: 52, repairCount: 15 },
      { month: '3月', cleaningCount: 61, repairCount: 10 },
      { month: '4月', cleaningCount: 58, repairCount: 18 },
      { month: '5月', cleaningCount: 72, repairCount: 14 },
      { month: '6月', cleaningCount: this.cleaningTasks.filter((t) => inRange(t.createdAt)).length, repairCount: this.maintenanceOrders.filter((o) => inRange(o.createdAt)).length },
    ];

    return {
      avgCleaningTurnaroundMinutes: Math.round(avgCleaningTurnaround),
      totalReworkCount: totalRework,
      avgRepairDurationMinutes: Math.round(avgRepairDuration),
      consumptionPerRoom,
      cleaningByPerson,
      repairsByType,
      monthlyTrend,
      dateRange,
    };
  }
}

export const dataStore = new DataStore();
