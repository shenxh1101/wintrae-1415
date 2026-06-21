import type {
  Room,
  CleaningTask,
  MaintenanceOrder,
  InventoryItem,
  InventoryLog,
  Staff,
  Statistics,
  RoomStatus,
  CleaningStatus,
  MaintenanceStatus,
} from '../../shared/types';
import {
  roomsSeed,
  cleaningTasksSeed,
  maintenanceOrdersSeed,
  inventorySeed,
  inventoryLogsSeed,
  staffSeed,
} from './seed';

class DataStore {
  private rooms: Room[] = [...roomsSeed];
  private cleaningTasks: CleaningTask[] = [...cleaningTasksSeed];
  private maintenanceOrders: MaintenanceOrder[] = [...maintenanceOrdersSeed];
  private inventory: InventoryItem[] = [...inventorySeed];
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

  createMaintenanceOrder(order: Omit<MaintenanceOrder, 'id' | 'createdAt' | 'photos'>): MaintenanceOrder {
    const newOrder: MaintenanceOrder = {
      ...order,
      id: `mo${Date.now()}`,
      photos: [],
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
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
        id: `log${Date.now()}`,
        itemId,
        itemName: item.name,
        type: 'out',
        quantity,
        roomNumber,
        operatorName,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      });
    }
    return item;
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

  getStatistics(): Statistics {
    const completedTasks = this.cleaningTasks.filter((t) => t.endTime && t.startTime);
    const avgCleaningTurnaround = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => {
          const start = new Date(t.startTime!).getTime();
          const end = new Date(t.endTime!).getTime();
          return sum + Math.round((end - start) / 60000);
        }, 0) / completedTasks.length
      : 0;

    const totalRework = this.cleaningTasks.reduce((sum, t) => sum + t.reworkCount, 0);

    const completedRepairs = this.maintenanceOrders.filter((o) => o.repairDurationMinutes);
    const avgRepairDuration = completedRepairs.length > 0
      ? completedRepairs.reduce((sum, o) => sum + (o.repairDurationMinutes || 0), 0) / completedRepairs.length
      : 0;

    const roomCount = this.rooms.length;
    const consumptionPerRoom = this.inventory.map((item) => {
      const totalConsumed = this.inventoryLogs
        .filter((l) => l.itemId === item.id && l.type === 'out')
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
    this.maintenanceOrders.forEach((o) => {
      repairsByTypeMap.set(o.location, (repairsByTypeMap.get(o.location) || 0) + 1);
    });
    const repairsByType = Array.from(repairsByTypeMap.entries()).map(([type, count]) => ({ type, count }));

    const monthlyTrend = [
      { month: '1月', cleaningCount: 45, repairCount: 12 },
      { month: '2月', cleaningCount: 52, repairCount: 15 },
      { month: '3月', cleaningCount: 61, repairCount: 10 },
      { month: '4月', cleaningCount: 58, repairCount: 18 },
      { month: '5月', cleaningCount: 72, repairCount: 14 },
      { month: '6月', cleaningCount: this.cleaningTasks.length, repairCount: this.maintenanceOrders.length },
    ];

    return {
      avgCleaningTurnaroundMinutes: Math.round(avgCleaningTurnaround),
      totalReworkCount: totalRework,
      avgRepairDurationMinutes: Math.round(avgRepairDuration),
      consumptionPerRoom,
      cleaningByPerson,
      repairsByType,
      monthlyTrend,
    };
  }
}

export const dataStore = new DataStore();
