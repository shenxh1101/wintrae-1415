import { useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { useAppStore } from '../store/useAppStore';
import type { CleaningTask, CleaningStatus } from '../../shared/types';
import {
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Camera,
  Package,
  Play,
  XCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';

const statusConfig: Record<CleaningStatus | 'all', { label: string; icon: typeof Sparkles; bg: string; text: string; dot: string; border: string }> = {
  all: { label: '全部', icon: Sparkles, bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500', border: 'border-gray-200' },
  pending: { label: '待处理', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' },
  inProgress: { label: '进行中', icon: Sparkles, bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' },
  completed: { label: '已完成', icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', border: 'border-green-200' },
  rework: { label: '返工', icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200' },
};

const statCards: { status: CleaningStatus; label: string; icon: typeof Sparkles; bg: string; text: string; dot: string }[] = [
  { status: 'pending', label: '待处理', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  { status: 'inProgress', label: '进行中', icon: Sparkles, bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  { status: 'completed', label: '已完成', icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  { status: 'rework', label: '返工', icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
];

interface TaskCardProps {
  task: CleaningTask;
}

function TaskCard({ task }: TaskCardProps) {
  const config = statusConfig[task.status];
  const StatusIcon = config.icon;
  const updateCleaningTask = useAppStore((s) => s.updateCleaningTask);

  const handleStart = async () => {
    await updateCleaningTask(task.id, {
      status: 'inProgress',
      startTime: new Date().toISOString(),
    });
  };

  const handleComplete = async () => {
    await updateCleaningTask(task.id, {
      status: 'completed',
      endTime: new Date().toISOString(),
    });
  };

  const handleRework = async () => {
    await updateCleaningTask(task.id, {
      status: 'rework',
      reworkCount: task.reworkCount + 1,
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return '-';
    const date = new Date(time);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'card p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1',
        'before:absolute before:top-0 before:left-0 before:w-1 before:h-full',
        task.status === 'pending' && 'before:bg-amber-500',
        task.status === 'inProgress' && 'before:bg-blue-500',
        task.status === 'completed' && 'before:bg-green-500',
        task.status === 'rework' && 'before:bg-red-500'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-serif text-2xl font-bold text-gray-900">{task.roomNumber}</p>
          <p className="text-sm text-gray-500 mt-0.5">{task.floor}楼</p>
        </div>
        <span className={cn('badge', config.bg, config.text, 'flex items-center gap-1')}>
          <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4 text-gray-400" />
          <span>{task.assigneeName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>开始: {formatTime(task.startTime)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle className="w-4 h-4 text-gray-400" />
          <span>完成: {formatTime(task.endTime)}</span>
        </div>
      </div>

      {(task.anomalies.length > 0 || task.lostItems.length > 0 || task.photos.length > 0) && (
        <div className="space-y-2 mb-4 pt-3 border-t border-gray-100">
          {task.photos.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4 text-primary-500" />
              <span className="text-gray-600">照片: {task.photos.length}张</span>
            </div>
          )}
          {task.anomalies.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
              <div>
                <span className="text-red-600">异常:</span>
                <ul className="text-gray-600 mt-0.5">
                  {task.anomalies.map((a, idx) => (
                    <li key={idx} className="list-disc list-inside">{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {task.lostItems.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <Package className="w-4 h-4 text-accent-500 mt-0.5" />
              <div>
                <span className="text-accent-600">遗失物:</span>
                <ul className="text-gray-600 mt-0.5">
                  {task.lostItems.map((item) => (
                    <li key={item.id} className="list-disc list-inside">{item.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {task.reworkCount > 0 && (
        <div className="mb-4">
          <span className="badge bg-red-50 text-red-600">
          <XCircle className="w-3 h-3 inline mr-1" />
          返工 {task.reworkCount} 次
        </span>
        </div>
      )}

      <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
        {task.status === 'pending' && (
          <button
            onClick={handleStart}
            className="btn-primary flex items-center gap-1 text-sm py-1.5 px-3"
          >
            <Play className="w-4 h-4" />
            开始
          </button>
        )}
        {task.status === 'inProgress' && (
          <>
            <button
              onClick={handleComplete}
              className="btn-primary flex items-center gap-1 text-sm py-1.5 px-3"
            >
              <CheckCircle className="w-4 h-4" />
              完成
            </button>
            <button
              onClick={handleRework}
              className="btn-outline flex items-center gap-1 text-sm py-1.5 px-3"
            >
              <XCircle className="w-4 h-4" />
              返工
            </button>
          </>
        )}
        {task.status === 'completed' && (
          <button
            onClick={handleRework}
            className="btn-outline flex items-center gap-1 text-sm py-1.5 px-3"
          >
            <XCircle className="w-4 h-4" />
            返工
          </button>
        )}
        {task.status === 'rework' && (
          <button
            onClick={handleStart}
            className="btn-primary flex items-center gap-1 text-sm py-1.5 px-3"
          >
            <Play className="w-4 h-4" />
            重新开始
          </button>
        )}
      </div>
    </div>
  );
}

export default function Cleaning() {
  const cleaningTasks = useAppStore((s) => s.cleaningTasks);
  const cleaners = useAppStore((s) => s.cleaners);
  const fetchCleaningTasks = useAppStore((s) => s.fetchCleaningTasks);
  const cleaningFilterStatus = useAppStore((s) => s.cleaningFilterStatus);
  const setCleaningFilterStatus = useAppStore((s) => s.setCleaningFilterStatus);

  useEffect(() => {
    fetchCleaningTasks();
  }, [fetchCleaningTasks, cleaningFilterStatus]);

  const stats = useMemo(() => {
    const s: Record<CleaningStatus, number> = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      rework: 0,
    };
    cleaningTasks.forEach((t) => {
      s[t.status]++;
    });
    return s;
  }, [cleaningTasks]);

  const groupedByFloor = useMemo(() => {
    const groups: Record<number, CleaningTask[]> = {};
    cleaningTasks.forEach((t) => {
      if (!groups[t.floor]) groups[t.floor] = [];
      groups[t.floor].push(t);
    });
    return groups;
  }, [cleaningTasks]);

  const floors = useMemo(() => {
    return Object.keys(groupedByFloor)
      .map(Number)
      .sort((a, b) => a - b);
  }, [groupedByFloor]);

  return (
    <Layout title="清洁任务" subtitle="管理客房清洁任务分配与执行">
      <div className="mb-6 grid grid-cols-4 gap-4">
        {statCards.map(({ status, label, icon: Icon, bg, text, dot }) => (
          <div
            key={status}
            className={cn(
              'card p-4 flex items-center gap-4 cursor-pointer transition-transform hover:scale-105',
              cleaningFilterStatus === status && 'ring-2 ring-primary-500'
            )}
            onClick={() => setCleaningFilterStatus(cleaningFilterStatus === status ? 'all' : status)}
          >
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bg)}>
              <Icon className={cn('w-6 h-6', text)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats[status]}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600 mr-2">状态筛选:</span>
        {(Object.keys(statusConfig) as (CleaningStatus | 'all')[]).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const isActive = cleaningFilterStatus === status;
          return (
            <button
              key={status}
              onClick={() => setCleaningFilterStatus(status)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                isActive
                  ? cn('bg-primary-500 text-white')
                  : cn('bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')
              )}
            >
              <Icon className="w-4 h-4" />
              {config.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-8">
        {floors.length === 0 ? (
          <div className="card p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无清洁任务</p>
          </div>
        ) : (
          floors.map((floor) => (
            <div key={floor}>
              <h3 className="font-serif text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-accent-400 rounded" />
                {floor}楼
                <span className="text-sm font-normal text-gray-500">
                  ({groupedByFloor[floor].length}个任务)
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedByFloor[floor].map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
