import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { useAppStore } from '../store/useAppStore';
import type { MaintenanceOrder, MaintenanceStatus, MaintenancePriority } from '../../shared/types';
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Camera,
  Plus,
  Zap,
  CheckSquare,
  Timer,
} from 'lucide-react';
import { cn } from '../lib/utils';

const priorityConfig: Record<MaintenancePriority, { label: string; bg: string; text: string; dot: string; bar: string }> = {
  urgent: { label: '紧急', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', bar: 'bg-red-500' },
  high: { label: '高', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', bar: 'bg-orange-500' },
  medium: { label: '中', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', bar: 'bg-yellow-500' },
  low: { label: '低', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', bar: 'bg-blue-500' },
};

const statusConfig: Record<MaintenanceStatus, { label: string; icon: typeof Clock; bg: string; text: string; dot: string }> = {
  pending: { label: '待处理', icon: Clock, bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
  inProgress: { label: '处理中', icon: Zap, bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  completed: { label: '已完成', icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  cancelled: { label: '已取消', icon: XCircle, bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

function MaintenanceCard({ order }: { order: MaintenanceOrder }) {
  const priorityConf = priorityConfig[order.priority];
  const statusConf = statusConfig[order.status];
  const StatusIcon = statusConf.icon;
  const updateMaintenanceOrder = useAppStore((s) => s.updateMaintenanceOrder);
  const completeMaintenanceOrder = useAppStore((s) => s.completeMaintenanceOrder);
  const repairStaff = useAppStore((s) => s.repairStaff);
  const [showAssign, setShowAssign] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeResult, setCompleteResult] = useState('');
  const [completeDuration, setCompleteDuration] = useState('');

  const handleAssign = async (staffId: string, staffName: string) => {
    await updateMaintenanceOrder(order.id, { assigneeId: staffId, assigneeName: staffName });
    setShowAssign(false);
  };

  const handleStart = async () => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    await updateMaintenanceOrder(order.id, { status: 'inProgress' as MaintenanceStatus, startedAt: now });
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeResult.trim() || !completeDuration || parseInt(completeDuration) < 1) return;

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const updateData: Record<string, unknown> = {
      result: completeResult.trim(),
      repairDurationMinutes: parseInt(completeDuration),
      completedAt: now,
    };
    if (!order.startedAt) {
      updateData.startedAt = now;
    }

    await completeMaintenanceOrder(order.id, updateData);
    setShowCompleteModal(false);
    setCompleteResult('');
    setCompleteDuration('');
  };

  return (
    <div
      className={cn(
        'card p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1',
        'before:absolute before:top-0 before:left-0 before:w-1 before:h-full',
        priorityConf.bar
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={cn('badge', priorityConf.bg, priorityConf.text, 'flex items-center gap-1')}>
            <AlertTriangle className="w-3 h-3" />
            {priorityConf.label}
          </span>
          <span className={cn('badge', statusConf.bg, statusConf.text, 'flex items-center gap-1')}>
            <StatusIcon className="w-3 h-3" />
            {statusConf.label}
          </span>
        </div>
        <p className="text-xs text-gray-400">{order.createdAt}</p>
      </div>

      <div className="mb-2">
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <User className="w-3.5 h-3.5" />
          报修人：{order.reporterName}
        </p>
      </div>

      <div className="mb-3">
        <p className="font-serif text-xl font-bold text-gray-900">{order.roomNumber}</p>
        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
          <Wrench className="w-3.5 h-3.5" />
          {order.location}
        </p>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{order.description}</p>

      {order.status === 'completed' && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="mb-2">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5" />
              处理结果
            </p>
            <p className="text-sm text-gray-700">{order.result}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" />
              实际耗时：{order.repairDurationMinutes} 分钟
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              完成时间：{order.completedAt}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {order.assigneeName ? (
            <>
              <User className="w-4 h-4" />
              <span>{order.assigneeName}</span>
            </>
          ) : (
            <span className="text-gray-400">未指派</span>
          )}
        </div>

        <div className="flex items-center gap-2 relative">
          {order.status === 'pending' && (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowAssign(!showAssign)}
                  className="btn-outline text-xs px-3 py-1.5"
                >
                  指派
                </button>
                {showAssign && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-32 z-20">
                    {repairStaff.map((staff) => (
                      <button
                        key={staff.id}
                        onClick={() => handleAssign(staff.id, staff.name)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5" />
                        {staff.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {order.assigneeId && (
                <button onClick={handleStart} className="btn-primary text-xs px-3 py-1.5">
                  开始
                </button>
              )}
            </>
          )}
          {order.status === 'inProgress' && (
            <button onClick={() => setShowCompleteModal(true)} className="btn-secondary text-xs px-3 py-1.5">
              完成
            </button>
          )}
        </div>
      </div>

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              完成工单
            </h3>
            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="label">处理结果 <span className="text-red-500">*</span></label>
                <textarea
                  value={completeResult}
                  onChange={(e) => setCompleteResult(e.target.value)}
                  className="input"
                  rows={4}
                  placeholder="请详细描述维修处理过程和结果"
                  required
                />
              </div>
              <div>
                <label className="label">实际耗时（分钟） <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={completeDuration}
                  onChange={(e) => setCompleteDuration(e.target.value)}
                  className="input"
                  min={1}
                  placeholder="请输入实际耗时"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompleteModal(false);
                    setCompleteResult('');
                    setCompleteDuration('');
                  }}
                  className="btn-outline"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  确认完成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Maintenance() {
  const maintenanceOrders = useAppStore((s) => s.maintenanceOrders);
  const repairStaff = useAppStore((s) => s.repairStaff);
  const fetchMaintenanceOrders = useAppStore((s) => s.fetchMaintenanceOrders);
  const createMaintenanceOrder = useAppStore((s) => s.createMaintenanceOrder);
  const maintenanceFilterStatus = useAppStore((s) => s.maintenanceFilterStatus);
  const setMaintenanceFilterStatus = useAppStore((s) => s.setMaintenanceFilterStatus);
  const rooms = useAppStore((s) => s.rooms);
  const staff = useAppStore((s) => s.staff);
  const fetchStaff = useAppStore((s) => s.fetchStaff);

  const [showModal, setShowModal] = useState(false);
  const [formRoomId, setFormRoomId] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<MaintenancePriority>('medium');
  const [formReporterName, setFormReporterName] = useState('');

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    fetchMaintenanceOrders();
  }, [fetchMaintenanceOrders, maintenanceFilterStatus]);

  useEffect(() => {
    if (staff.length > 0 && !formReporterName) {
      const receptionist = staff.find((s) => s.role === 'reception') || staff[0];
      setFormReporterName(receptionist.name);
    }
  }, [staff, formReporterName]);

  const stats = useMemo(() => {
    const s: Record<MaintenanceStatus, number> = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    };
    maintenanceOrders.forEach((o) => {
      s[o.status]++;
    });
    return s;
  }, [maintenanceOrders]);

  const filteredOrders = useMemo(() => {
    if (maintenanceFilterStatus === 'all') return maintenanceOrders;
    return maintenanceOrders.filter((o) => o.status === maintenanceFilterStatus);
  }, [maintenanceOrders, maintenanceFilterStatus]);

  const sortedOrders = useMemo(() => {
    const priorityOrder: Record<MaintenancePriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...filteredOrders].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [filteredOrders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const room = rooms.find((r) => r.id === formRoomId);
    if (!room) return;
    if (!formReporterName) return;

    await createMaintenanceOrder({
      roomId: formRoomId,
      roomNumber: room.number,
      location: formLocation,
      description: formDescription,
      priority: formPriority,
      reporterName: formReporterName,
    });

    setShowModal(false);
    setFormRoomId('');
    setFormLocation('');
    setFormDescription('');
    setFormPriority('medium');
    const receptionist = staff.find((s) => s.role === 'reception') || staff[0];
    setFormReporterName(receptionist?.name || '');
  };

  return (
    <Layout title="维修工单" subtitle="处理房间设施故障报修">
      <div className="mb-6 grid grid-cols-4 gap-4">
        {(Object.keys(statusConfig) as MaintenanceStatus[]).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <div
              key={status}
              className={cn(
                'card p-4 flex items-center gap-4 cursor-pointer transition-transform hover:scale-105',
                maintenanceFilterStatus === status && 'ring-2 ring-primary-500'
              )}
              onClick={() => setMaintenanceFilterStatus(maintenanceFilterStatus === status ? 'all' : status)}
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

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">状态筛选:</span>
          <button
            onClick={() => setMaintenanceFilterStatus('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm transition-colors',
              maintenanceFilterStatus === 'all' ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            全部
          </button>
          {(Object.keys(statusConfig) as MaintenanceStatus[]).map((status) => {
            const config = statusConfig[status];
            return (
              <button
                key={status}
                onClick={() => setMaintenanceFilterStatus(maintenanceFilterStatus === status ? 'all' : status)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm transition-colors',
                  maintenanceFilterStatus === status ? 'bg-primary-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                {config.label}
              </button>
            );
          })}
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新建工单
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedOrders.map((order) => (
          <MaintenanceCard key={order.id} order={order} />
        ))}
      </div>

      {sortedOrders.length === 0 && (
        <div className="card p-12 text-center">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无维修工单</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              新建维修工单
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">房间 <span className="text-red-500">*</span></label>
                <select
                  value={formRoomId}
                  onChange={(e) => setFormRoomId(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">请选择房间</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.number} - {room.type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">报修人 <span className="text-red-500">*</span></label>
                <select
                  value={formReporterName}
                  onChange={(e) => setFormReporterName(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">请选择报修人</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}（{s.role === 'reception' ? '前台' : s.role === 'cleaner' ? '清洁阿姨' : s.role === 'repair' ? '维修' : '管理员'}）
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">位置 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="input"
                  placeholder="如：洗手间、空调、灯具"
                  required
                />
              </div>
              <div>
                <label className="label">问题描述 <span className="text-red-500">*</span></label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="请描述故障情况"
                  required
                />
              </div>
              <div>
                <label className="label">紧急程度 <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(priorityConfig) as MaintenancePriority[]).map((priority) => {
                    const config = priorityConfig[priority];
                    return (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setFormPriority(priority)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                          formPriority === priority
                            ? cn(config.bg, config.text, 'border-transparent')
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
