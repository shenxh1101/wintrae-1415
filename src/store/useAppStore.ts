import { create } from 'zustand';
import type {
  Room,
  CleaningTask,
  MaintenanceOrder,
  InventoryItem,
  InventoryLog,
  InventoryCombo,
  Staff,
  Statistics,
  RoomStatus,
  CleaningStatus,
  MaintenanceStatus,
  MaintenanceActionType,
  DateRangeType,
} from '../../shared/types';
import { api } from '../lib/api';

interface AppState {
  rooms: Room[];
  checkoutRooms: Room[];
  cleaningTasks: CleaningTask[];
  maintenanceOrders: MaintenanceOrder[];
  inventory: InventoryItem[];
  inventoryCombos: InventoryCombo[];
  inventoryLogs: InventoryLog[];
  staff: Staff[];
  cleaners: Staff[];
  repairStaff: Staff[];
  statistics: Statistics | null;
  statisticsDateRange: DateRangeType;
  loading: boolean;
  error: string | null;

  roomFilterFloor: number | 'all';
  roomFilterStatus: RoomStatus | 'all';
  cleaningFilterStatus: CleaningStatus | 'all';
  maintenanceFilterStatus: MaintenanceStatus | 'all';

  setRoomFilterFloor: (floor: number | 'all') => void;
  setRoomFilterStatus: (status: RoomStatus | 'all') => void;
  setCleaningFilterStatus: (status: CleaningStatus | 'all') => void;
  setMaintenanceFilterStatus: (status: MaintenanceStatus | 'all') => void;
  setStatisticsDateRange: (range: DateRangeType) => void;

  fetchRooms: () => Promise<void>;
  fetchCheckoutRooms: () => Promise<void>;
  fetchCleaningTasks: () => Promise<void>;
  fetchMaintenanceOrders: () => Promise<void>;
  fetchInventory: () => Promise<void>;
  fetchInventoryCombos: () => Promise<void>;
  fetchInventoryLogs: () => Promise<void>;
  fetchStaff: () => Promise<void>;
  fetchStatistics: () => Promise<void>;
  fetchAll: () => Promise<void>;

  updateRoomStatus: (id: string, status: RoomStatus) => Promise<void>;
  createCleaningTask: (data: Record<string, unknown>) => Promise<void>;
  batchAssignCleaningTasks: (roomIds: string[], assigneeId: string, assigneeName: string) => Promise<void>;
  startCleaningTask: (id: string) => Promise<void>;
  completeCleaningTask: (id: string, data: Record<string, unknown>) => Promise<void>;
  reworkCleaningTask: (id: string) => Promise<void>;
  updateCleaningTask: (id: string, data: Record<string, unknown>) => Promise<void>;
  createMaintenanceOrder: (data: Record<string, unknown>) => Promise<void>;
  updateMaintenanceOrder: (id: string, data: Record<string, unknown>) => Promise<void>;
  addMaintenanceTimeline: (id: string, action: MaintenanceActionType, operatorName: string, operatorId?: string, note?: string) => Promise<void>;
  completeMaintenanceOrder: (id: string, data: Record<string, unknown>) => Promise<void>;
  restockInventory: (id: string, data: Record<string, unknown>) => Promise<void>;
  consumeInventory: (id: string, data: Record<string, unknown>) => Promise<boolean>;
  consumeComboInventory: (comboId: string, roomNumber: string, operatorName: string) => Promise<boolean>;
}

export const useAppStore = create<AppState>((set, get) => ({
  rooms: [],
  checkoutRooms: [],
  cleaningTasks: [],
  maintenanceOrders: [],
  inventory: [],
  inventoryCombos: [],
  inventoryLogs: [],
  staff: [],
  cleaners: [],
  repairStaff: [],
  statistics: null,
  statisticsDateRange: 'all',
  loading: false,
  error: null,

  roomFilterFloor: 'all',
  roomFilterStatus: 'all',
  cleaningFilterStatus: 'all',
  maintenanceFilterStatus: 'all',

  setRoomFilterFloor: (floor) => set({ roomFilterFloor: floor }),
  setRoomFilterStatus: (status) => set({ roomFilterStatus: status }),
  setCleaningFilterStatus: (status) => set({ cleaningFilterStatus: status }),
  setMaintenanceFilterStatus: (status) => set({ maintenanceFilterStatus: status }),
  setStatisticsDateRange: (range) => set({ statisticsDateRange: range }),

  fetchRooms: async () => {
    const { roomFilterFloor, roomFilterStatus } = get();
    set({ loading: true, error: null });
    try {
      const floor = roomFilterFloor === 'all' ? undefined : roomFilterFloor;
      const status = roomFilterStatus === 'all' ? undefined : roomFilterStatus;
      const rooms = await api.getRooms(floor, status);
      set({ rooms: rooms as Room[] });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchCheckoutRooms: async () => {
    set({ loading: true, error: null });
    try {
      const rooms = await api.getCheckoutRooms();
      set({ checkoutRooms: rooms as Room[] });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchCleaningTasks: async () => {
    const { cleaningFilterStatus } = get();
    set({ loading: true, error: null });
    try {
      const status = cleaningFilterStatus === 'all' ? undefined : cleaningFilterStatus;
      const tasks = await api.getCleaningTasks(status);
      set({ cleaningTasks: tasks as CleaningTask[] });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchMaintenanceOrders: async () => {
    const { maintenanceFilterStatus } = get();
    set({ loading: true, error: null });
    try {
      const status = maintenanceFilterStatus === 'all' ? undefined : maintenanceFilterStatus;
      const orders = await api.getMaintenanceOrders(status);
      set({ maintenanceOrders: orders as MaintenanceOrder[] });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchInventory: async () => {
    set({ loading: true, error: null });
    try {
      const items = await api.getInventory();
      set({ inventory: items as InventoryItem[] });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchInventoryCombos: async () => {
    set({ loading: true, error: null });
    try {
      const combos = await api.getInventoryCombos();
      set({ inventoryCombos: combos as InventoryCombo[] });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchInventoryLogs: async () => {
    set({ loading: true, error: null });
    try {
      const logs = await api.getInventoryLogs();
      set({ inventoryLogs: logs as InventoryLog[] });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchStaff: async () => {
    set({ loading: true, error: null });
    try {
      const [staff, cleaners, repairStaff] = await Promise.all([
        api.getStaff(),
        api.getCleaners(),
        api.getRepairStaff(),
      ]);
      set({
        staff: staff as Staff[],
        cleaners: cleaners as Staff[],
        repairStaff: repairStaff as Staff[],
      });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchStatistics: async () => {
    const { statisticsDateRange } = get();
    set({ loading: true, error: null });
    try {
      const stats = await api.getStatistics(statisticsDateRange);
      set({ statistics: stats as Statistics });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchAll: async () => {
    await Promise.all([
      get().fetchRooms(),
      get().fetchCleaningTasks(),
      get().fetchMaintenanceOrders(),
      get().fetchInventory(),
      get().fetchInventoryCombos(),
      get().fetchInventoryLogs(),
      get().fetchStaff(),
    ]);
  },

  updateRoomStatus: async (id, status) => {
    await api.updateRoomStatus(id, status);
    await Promise.all([get().fetchRooms(), get().fetchCheckoutRooms()]);
  },

  createCleaningTask: async (data) => {
    await api.createCleaningTask(data);
    await Promise.all([get().fetchCleaningTasks(), get().fetchRooms()]);
  },

  batchAssignCleaningTasks: async (roomIds, assigneeId, assigneeName) => {
    await api.batchAssignCleaningTasks({ roomIds, assigneeId, assigneeName });
    await Promise.all([get().fetchCleaningTasks(), get().fetchRooms(), get().fetchCheckoutRooms()]);
  },

  startCleaningTask: async (id) => {
    const task = get().cleaningTasks.find((t) => t.id === id);
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    await api.updateCleaningTask(id, {
      status: 'inProgress',
      startTime: now,
    });
    if (task) {
      await api.updateRoomStatus(task.roomId, 'cleaning');
    }
    await Promise.all([get().fetchCleaningTasks(), get().fetchRooms()]);
  },

  completeCleaningTask: async (id, data) => {
    const task = get().cleaningTasks.find((t) => t.id === id);
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    await api.updateCleaningTask(id, {
      status: 'completed',
      endTime: now,
      completedAt: now,
      ...data,
    });
    if (task) {
      await api.updateRoomStatus(task.roomId, 'available');
    }
    await Promise.all([get().fetchCleaningTasks(), get().fetchRooms()]);
  },

  reworkCleaningTask: async (id) => {
    const task = get().cleaningTasks.find((t) => t.id === id);
    await api.updateCleaningTask(id, {
      status: 'rework',
      reworkCount: (task?.reworkCount || 0) + 1,
    });
    if (task) {
      await api.updateRoomStatus(task.roomId, 'cleaning');
    }
    await Promise.all([get().fetchCleaningTasks(), get().fetchRooms()]);
  },

  updateCleaningTask: async (id, data) => {
    await api.updateCleaningTask(id, data);
    await get().fetchCleaningTasks();
  },

  createMaintenanceOrder: async (data) => {
    await api.createMaintenanceOrder(data);
    await get().fetchMaintenanceOrders();
  },

  updateMaintenanceOrder: async (id, data) => {
    await api.updateMaintenanceOrder(id, data);
    await get().fetchMaintenanceOrders();
  },

  addMaintenanceTimeline: async (id, action, operatorName, operatorId, note) => {
    await api.addMaintenanceTimeline(id, { action, operatorName, operatorId, note });
    await get().fetchMaintenanceOrders();
  },

  completeMaintenanceOrder: async (id, data) => {
    await api.completeMaintenanceOrder(id, data);
    await Promise.all([get().fetchMaintenanceOrders(), get().fetchStatistics()]);
  },

  restockInventory: async (id, data) => {
    await api.restockInventory(id, data);
    await Promise.all([get().fetchInventory(), get().fetchInventoryLogs()]);
  },

  consumeInventory: async (id, data) => {
    const item = get().inventory.find((i) => i.id === id);
    if (!item || item.totalQuantity < (data.quantity as number)) {
      return false;
    }
    try {
      await api.consumeInventory(id, data);
      await Promise.all([get().fetchInventory(), get().fetchInventoryLogs()]);
      return true;
    } catch {
      return false;
    }
  },

  consumeComboInventory: async (comboId, roomNumber, operatorName) => {
    try {
      await api.consumeComboInventory(comboId, { roomNumber, operatorName });
      await Promise.all([get().fetchInventory(), get().fetchInventoryLogs()]);
      return true;
    } catch {
      return false;
    }
  },
}));
