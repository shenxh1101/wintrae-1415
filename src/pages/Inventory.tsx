import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { useAppStore } from '../store/useAppStore';
import type { InventoryItem, InventoryLog, InventoryCategory } from '../../shared/types';
import {
  Package,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Minus,
  History,
  Droplets,
  Footprints,
  FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';

const categoryConfig: Record<InventoryCategory, { label: string; icon: typeof Package; bg: string; text: string; border: string }> = {
  toiletries: { label: '牙具沐浴用品', icon: Droplets, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  footwear: { label: '拖鞋', icon: Footprints, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  tissue: { label: '纸巾', icon: FileText, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  water: { label: '饮用水', icon: Droplets, bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
};

interface ModalState {
  open: boolean;
  type: 'restock' | 'consume';
  item: InventoryItem | null;
}

function InventoryCard({ item, onRestock, onConsume }: { item: InventoryItem; onRestock: (item: InventoryItem) => void; onConsume: (item: InventoryItem) => void }) {
  const config = categoryConfig[item.category];
  const Icon = config.icon;
  const isLow = item.totalQuantity <= item.warningThreshold;
  const percentage = Math.min(100, (item.totalQuantity / (item.warningThreshold * 3)) * 100);

  return (
    <div
      className={cn(
        'card p-5 relative overflow-hidden transition-all duration-300',
        isLow && 'ring-2 ring-red-400 animate-pulse'
      )}
    >
      {isLow && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-red-500">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-medium">库存预警</span>
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', config.bg)}>
          <Icon className={cn('w-6 h-6', config.text)} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{item.name}</h3>
          <span className={cn('badge', config.bg, config.text)}>{config.label}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">当前库存</span>
          <span className={cn('text-lg font-bold', isLow ? 'text-red-600' : 'text-gray-900')}>
            {item.totalQuantity} {item.unit}
          </span>
        </div>
        <div className="relative w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              percentage <= 33 ? 'bg-red-500' : percentage <= 66 ? 'bg-amber-500' : 'bg-green-500'
            )}
            style={{ width: `${Math.max(percentage, 5)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1.5">预警值: {item.warningThreshold} {item.unit}</p>
      </div>

      {item.lastRestockedAt && (
        <p className="text-xs text-gray-400 mb-4">上次补货: {item.lastRestockedAt}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onRestock(item)}
          className="flex-1 flex items-center justify-center gap-1.5 btn-outline text-sm"
        >
          <Plus className="w-4 h-4" />
          入库
        </button>
        <button
          onClick={() => onConsume(item)}
          className="flex-1 flex items-center justify-center gap-1.5 btn-primary text-sm"
        >
          <Minus className="w-4 h-4" />
          领用
        </button>
      </div>
    </div>
  );
}

function OperationModal({
  modal,
  rooms,
  onClose,
  onSubmit,
}: {
  modal: ModalState;
  rooms: { number: string }[];
  onClose: () => void;
  onSubmit: (data: { quantity: number; roomNumber?: string; notes?: string }) => void;
}) {
  const [quantity, setQuantity] = useState<number>(1);
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const isRestock = modal.type === 'restock';

  useEffect(() => {
    if (modal.open) {
      setQuantity(1);
      setRoomNumber('');
      setNotes('');
    }
  }, [modal.open]);

  if (!modal.open || !modal.item) return null;

  const handleSubmit = () => {
    if (quantity <= 0) return;
    const data: { quantity: number; roomNumber?: string; notes?: string } = { quantity };
    if (!isRestock && roomNumber) {
      data.roomNumber = roomNumber;
    }
    if (notes) {
      data.notes = notes;
    }
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn('px-6 py-4 flex items-center gap-3', isRestock ? 'bg-green-50' : 'bg-primary-50')}>
          {isRestock ? (
            <ArrowUpCircle className="w-6 h-6 text-green-600" />
          ) : (
            <ArrowDownCircle className="w-6 h-6 text-primary-600" />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {isRestock ? '入库登记' : '领用登记'} - {modal.item.name}
            </h3>
            <p className="text-sm text-gray-500">当前库存: {modal.item.totalQuantity} {modal.item.unit}</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="label">数量 <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="input text-center flex-1"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500 w-12">{modal.item.unit}</span>
            </div>
          </div>

          {!isRestock && (
            <div>
              <label className="label">房号 <span className="text-red-500">*</span></label>
              <select
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="input"
              >
                <option value="">请选择房号</option>
                {rooms.map((room) => (
                  <option key={room.number} value={room.number}>
                    {room.number}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="请输入备注信息（可选）"
              rows={3}
              className="input resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isRestock && !roomNumber}
            className={cn(isRestock ? 'btn-secondary' : 'btn-primary', !isRestock && !roomNumber && 'opacity-50 cursor-not-allowed')}
          >
            确认{isRestock ? '入库' : '领用'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LogsTable({ logs }: { logs: InventoryLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="card p-12 text-center text-gray-500">
        <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>暂无出入库记录</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">时间</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">类型</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">物资</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">数量</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">房号</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">操作人</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">备注</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{log.createdAt}</td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span
                    className={cn(
                      'badge flex items-center gap-1 w-fit',
                      log.type === 'in' ? 'bg-green-50 text-green-700' : 'bg-primary-50 text-primary-700'
                    )}
                  >
                    {log.type === 'in' ? (
                      <><ArrowUpCircle className="w-3 h-3" /> 入库</>
                    ) : (
                      <><ArrowDownCircle className="w-3 h-3" /> 出库</>
                    )}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-900 font-medium">{log.itemName}</td>
                <td className="px-5 py-3.5 text-sm">
                  <span className={cn('font-semibold', log.type === 'in' ? 'text-green-600' : 'text-primary-600')}>
                    {log.type === 'in' ? '+' : '-'}{log.quantity}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{log.roomNumber || '-'}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600">{log.operatorName}</td>
                <td className="px-5 py-3.5 text-sm text-gray-500 max-w-xs truncate">{log.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Inventory() {
  const inventory = useAppStore((s) => s.inventory);
  const inventoryLogs = useAppStore((s) => s.inventoryLogs);
  const fetchInventory = useAppStore((s) => s.fetchInventory);
  const fetchInventoryLogs = useAppStore((s) => s.fetchInventoryLogs);
  const restockInventory = useAppStore((s) => s.restockInventory);
  const consumeInventory = useAppStore((s) => s.consumeInventory);
  const rooms = useAppStore((s) => s.rooms);

  const [modal, setModal] = useState<ModalState>({ open: false, type: 'restock', item: null });
  const [activeCategory, setActiveCategory] = useState<InventoryCategory | 'all'>('all');

  useEffect(() => {
    fetchInventory();
    fetchInventoryLogs();
  }, [fetchInventory, fetchInventoryLogs]);

  const filteredInventory = useMemo(() => {
    if (activeCategory === 'all') return inventory;
    return inventory.filter((item) => item.category === activeCategory);
  }, [inventory, activeCategory]);

  const sortedLogs = useMemo(() => {
    return [...inventoryLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [inventoryLogs]);

  const stats = useMemo(() => {
    const totalItems = inventory.reduce((sum, item) => sum + item.totalQuantity, 0);
    const lowStockCount = inventory.filter((item) => item.totalQuantity <= item.warningThreshold).length;
    const todayIn = inventoryLogs
      .filter((log) => log.type === 'in')
      .reduce((sum, log) => sum + log.quantity, 0);
    const todayOut = inventoryLogs
      .filter((log) => log.type === 'out')
      .reduce((sum, log) => sum + log.quantity, 0);
    return { totalItems, lowStockCount, todayIn, todayOut };
  }, [inventory, inventoryLogs]);

  const handleRestock = (item: InventoryItem) => {
    setModal({ open: true, type: 'restock', item });
  };

  const handleConsume = (item: InventoryItem) => {
    setModal({ open: true, type: 'consume', item });
  };

  const handleCloseModal = () => {
    setModal({ open: false, type: 'restock', item: null });
  };

  const handleSubmit = async (data: { quantity: number; roomNumber?: string; notes?: string }) => {
    if (!modal.item) return;
    const operatorName = '管理员';
    if (modal.type === 'restock') {
      await restockInventory(modal.item.id, { quantity: data.quantity, operatorName, notes: data.notes });
    } else {
      await consumeInventory(modal.item.id, { quantity: data.quantity, roomNumber: data.roomNumber, operatorName });
    }
    handleCloseModal();
  };

  return (
    <Layout title="库存补给" subtitle="管理客用品库存、领用与预警">
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            <p className="text-sm text-gray-500">物资总数</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.lowStockCount}</p>
            <p className="text-sm text-gray-500">库存预警</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <ArrowUpCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.todayIn}</p>
            <p className="text-sm text-gray-500">累计入库</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <ArrowDownCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.todayOut}</p>
            <p className="text-sm text-gray-500">累计出库</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            activeCategory === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          )}
        >
          全部
        </button>
        {(Object.keys(categoryConfig) as InventoryCategory[]).map((category) => {
          const config = categoryConfig[category];
          const Icon = config.icon;
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(activeCategory === category ? 'all' : category)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                activeCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              <Icon className="w-4 h-4" />
              {config.label}
            </button>
          );
        })}
      </div>

      <div className="mb-10">
        <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-accent-400 rounded" />
          物资清单
          <span className="text-sm font-normal text-gray-500">({filteredInventory.length}项)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInventory.map((item) => (
            <InventoryCard
              key={item.id}
              item={item}
              onRestock={handleRestock}
              onConsume={handleConsume}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-accent-400 rounded" />
          <History className="w-5 h-5 text-gray-600" />
          出入库记录
          <span className="text-sm font-normal text-gray-500">({inventoryLogs.length}条)</span>
        </h2>
        <LogsTable logs={sortedLogs} />
      </div>

      <OperationModal
        modal={modal}
        rooms={rooms}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />
    </Layout>
  );
}
