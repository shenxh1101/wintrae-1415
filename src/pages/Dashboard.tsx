import { useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { useAppStore } from '../store/useAppStore';
import type { Room, RoomStatus } from '../../shared/types';
import {
  Bed,
  User,
  LogOut,
  Sparkles,
  Ban,
  ChevronDown,
  Wrench,
} from 'lucide-react';
import { cn } from '../lib/utils';

const statusConfig: Record<RoomStatus, { label: string; icon: typeof Bed; bg: string; text: string; dot: string }> = {
  available: { label: '可入住', icon: Bed, bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  pending: { label: '待入住', icon: User, bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  checkout: { label: '已退房', icon: LogOut, bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  cleaning: { label: '清洁中', icon: Sparkles, bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  outOfService: { label: '停用房', icon: Ban, bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-500' },
};

function RoomCard({ room }: { room: Room }) {
  const config = statusConfig[room.status];
  const Icon = config.icon;
  const updateRoomStatus = useAppStore((s) => s.updateRoomStatus);
  const createCleaningTask = useAppStore((s) => s.createCleaningTask);
  const cleaners = useAppStore((s) => s.cleaners);

  const handleStatusChange = async (newStatus: RoomStatus) => {
    await updateRoomStatus(room.id, newStatus);
    if (newStatus === 'checkout') {
      const floorCleaner = cleaners.find((c) => c.floor === room.floor);
      if (floorCleaner) {
        await createCleaningTask({
          roomId: room.id,
          roomNumber: room.number,
          floor: room.floor,
          assigneeId: floorCleaner.id,
          assigneeName: floorCleaner.name,
        });
      }
    }
  };

  return (
    <div
      className={cn(
        'card p-5 relative overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1',
        'before:absolute before:top-0 before:left-0 before:w-1 before:h-full',
        room.status === 'available' && 'before:bg-green-500',
        room.status === 'pending' && 'before:bg-blue-500',
        room.status === 'checkout' && 'before:bg-orange-500',
        room.status === 'cleaning' && 'before:bg-purple-500',
        room.status === 'outOfService' && 'before:bg-gray-500'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-serif text-3xl font-bold text-gray-900">{room.number}</p>
          <p className="text-sm text-gray-500 mt-0.5">{room.type} · {room.floor}楼</p>
        </div>
        <span className={cn('badge', config.bg, config.text, 'flex items-center gap-1')}>
          <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
          {config.label}
        </span>
      </div>

      {room.guestName && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <User className="w-4 h-4" />
          <span>{room.guestName}</span>
        </div>
      )}

      {room.checkInTime && (
        <p className="text-xs text-gray-400">入住: {room.checkInTime}</p>
      )}
      {room.checkOutTime && (
        <p className="text-xs text-gray-400">退房: {room.checkOutTime}</p>
      )}
      {room.notes && (
        <p className="text-xs text-gray-500 mt-2 px-2 py-1 bg-gray-50 rounded">{room.notes}</p>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="relative inline-block">
          <button className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
            快速操作
            <ChevronDown className="w-4 h-4" />
          </button>
          <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-32 z-10 hidden group-hover:block">
            <button
              onClick={() => handleStatusChange('available')}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
            >
              标记可入住
            </button>
            <button
              onClick={() => handleStatusChange('pending')}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
            >
              标记待入住
            </button>
            <button
              onClick={() => handleStatusChange('checkout')}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
            >
              标记已退房
            </button>
            <button
              onClick={() => handleStatusChange('cleaning')}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
            >
              开始清洁
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              创建维修工单
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const rooms = useAppStore((s) => s.rooms);
  const fetchRooms = useAppStore((s) => s.fetchRooms);
  const fetchStaff = useAppStore((s) => s.fetchStaff);
  const roomFilterFloor = useAppStore((s) => s.roomFilterFloor);
  const roomFilterStatus = useAppStore((s) => s.roomFilterStatus);
  const setRoomFilterFloor = useAppStore((s) => s.setRoomFilterFloor);
  const setRoomFilterStatus = useAppStore((s) => s.setRoomFilterStatus);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms, roomFilterFloor, roomFilterStatus]);

  const floors = useMemo(() => {
    const set = new Set(rooms.map((r) => r.floor));
    return Array.from(set).sort((a, b) => a - b);
  }, [rooms]);

  const stats = useMemo(() => {
    const s: Record<RoomStatus, number> = {
      available: 0,
      pending: 0,
      checkout: 0,
      cleaning: 0,
      outOfService: 0,
    };
    rooms.forEach((r) => {
      s[r.status]++;
    });
    return s;
  }, [rooms]);

  const groupedByFloor = useMemo(() => {
    const groups: Record<number, Room[]> = {};
    rooms.forEach((r) => {
      if (!groups[r.floor]) groups[r.floor] = [];
      groups[r.floor].push(r);
    });
    return groups;
  }, [rooms]);

  return (
    <Layout title="房态看板" subtitle="实时掌握所有房间状态">
      <div className="mb-6 grid grid-cols-5 gap-4">
        {(Object.keys(statusConfig) as RoomStatus[]).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <div
              key={status}
              className={cn(
                'card p-4 flex items-center gap-4 cursor-pointer transition-transform hover:scale-105',
                roomFilterStatus === status && 'ring-2 ring-primary-500'
              )}
              onClick={() => setRoomFilterStatus(roomFilterStatus === status ? 'all' : status)}
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', config.bg)}>
                <Icon className={cn('w-6 h-6', config.text)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats[status]}</p>
                <p className="text-sm text-gray-500">{config.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">楼层:</span>
          <button
            onClick={() => setRoomFilterFloor('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm transition-colors',
              roomFilterFloor === 'all' ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            全部
          </button>
          {floors.map((f) => (
            <button
              key={f}
              onClick={() => setRoomFilterFloor(roomFilterFloor === f ? 'all' : f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                roomFilterFloor === f ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {f}楼
            </button>
          ))}
        </div>
        {roomFilterStatus !== 'all' && (
          <button
            onClick={() => setRoomFilterStatus('all')}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            清除状态筛选
          </button>
        )}
      </div>

      <div className="space-y-8">
        {Object.entries(groupedByFloor).map(([floor, floorRooms]) => (
          <div key={floor}>
            <h3 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-accent-400 rounded" />
              {floor}楼
              <span className="text-sm font-normal text-gray-500">({floorRooms.length}间)</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {floorRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
