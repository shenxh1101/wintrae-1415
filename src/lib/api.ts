import type { ApiResponse, DateRangeType } from '../../shared/types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const data = (await response.json()) as ApiResponse<T>;
  if (!data.success) {
    throw new Error(data.message || '请求失败');
  }
  return data.data as T;
}

export const api = {
  getRooms: (floor?: number, status?: string) =>
    request(`/rooms?${floor ? `floor=${floor}&` : ''}${status ? `status=${status}` : ''}`),
  getCheckoutRooms: () =>
    request('/cleaning/checkout-rooms'),
  updateRoomStatus: (id: string, status: string) =>
    request(`/rooms/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  getCleaningTasks: (status?: string, floor?: number) =>
    request(`/cleaning?${status ? `status=${status}&` : ''}${floor ? `floor=${floor}` : ''}`),
  createCleaningTask: (data: Record<string, unknown>) =>
    request('/cleaning', { method: 'POST', body: JSON.stringify(data) }),
  batchAssignCleaningTasks: (data: Record<string, unknown>) =>
    request('/cleaning/batch-assign', { method: 'POST', body: JSON.stringify(data) }),
  updateCleaningTask: (id: string, data: Record<string, unknown>) =>
    request(`/cleaning/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addLostItem: (taskId: string, data: Record<string, unknown>) =>
    request(`/cleaning/${taskId}/lost-items`, { method: 'POST', body: JSON.stringify(data) }),

  getMaintenanceOrders: (status?: string) =>
    request(`/maintenance${status ? `?status=${status}` : ''}`),
  createMaintenanceOrder: (data: Record<string, unknown>) =>
    request('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  updateMaintenanceOrder: (id: string, data: Record<string, unknown>) =>
    request(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addMaintenanceTimeline: (id: string, data: Record<string, unknown>) =>
    request(`/maintenance/${id}/timeline`, { method: 'POST', body: JSON.stringify(data) }),
  completeMaintenanceOrder: (id: string, data: Record<string, unknown>) =>
    request(`/maintenance/${id}/complete`, { method: 'PUT', body: JSON.stringify(data) }),

  getInventory: () => request('/inventory'),
  getInventoryCombos: () => request('/inventory/combos'),
  getInventoryLogs: () => request('/inventory/logs'),
  restockInventory: (id: string, data: Record<string, unknown>) =>
    request(`/inventory/${id}/restock`, { method: 'POST', body: JSON.stringify(data) }),
  consumeInventory: (id: string, data: Record<string, unknown>) =>
    request(`/inventory/${id}/consume`, { method: 'POST', body: JSON.stringify(data) }),
  consumeComboInventory: (comboId: string, data: Record<string, unknown>) =>
    request(`/inventory/combos/${comboId}/consume`, { method: 'POST', body: JSON.stringify(data) }),

  getStatistics: (dateRange: DateRangeType = 'all') =>
    request(`/statistics?dateRange=${dateRange}`),
  getStaff: () => request('/staff'),
  getCleaners: () => request('/staff/cleaners'),
  getRepairStaff: () => request('/staff/repair'),
};
