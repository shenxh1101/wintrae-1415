import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { useAppStore } from '../store/useAppStore';
import type { CleaningTask, CleaningStatus, LostItem } from '../../shared/types';
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
  Plus,
  X,
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
  onOpenCompleteModal: (task: CleaningTask) => void;
}

function TaskCard({ task, onOpenCompleteModal }: TaskCardProps) {
  const config = statusConfig[task.status];
  const StatusIcon = config.icon;
  const startCleaningTask = useAppStore((s) => s.startCleaningTask);
  const reworkCleaningTask = useAppStore((s) => s.reworkCleaningTask);

  const handleStart = async () => {
    await startCleaningTask(task.id);
  };

  const handleRework = async () => {
    await reworkCleaningTask(task.id);
  };

  const formatDateTime = (time?: string) => {
    if (!time) return '-';
    const date = new Date(time);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
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
          <span>开始: {formatDateTime(task.startTime)}</span>
        </div>
        {task.completedAt && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-gray-400" />
            <span>完成: {formatDateTime(task.completedAt)}</span>
          </div>
        )}
        {!task.completedAt && task.endTime && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-gray-400" />
            <span>完成: {formatTime(task.endTime)}</span>
          </div>
        )}
      </div>

      {(task.anomalies.length > 0 || task.lostItems.length > 0 || task.photos.length > 0) && (
        <div className="space-y-2 mb-4 pt-3 border-t border-gray-100">
          {task.photos.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <Camera className="w-4 h-4 text-primary-500 mt-0.5" />
              <div>
                <span className="text-primary-600 font-medium">照片: {task.photos.length}张</span>
                <ul className="text-gray-600 mt-0.5 space-y-0.5">
                  {task.photos.map((photo, idx) => (
                    <li key={idx} className="list-disc list-inside">{idx + 1}. {photo}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {task.anomalies.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
              <div>
                <span className="text-red-600 font-medium">异常:</span>
                <ul className="text-gray-600 mt-0.5 space-y-0.5">
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
                <span className="text-accent-600 font-medium">遗失物:</span>
                <ul className="text-gray-600 mt-0.5 space-y-0.5">
                  {task.lostItems.map((item) => (
                    <li key={item.id} className="list-disc list-inside">
                      <span className="font-medium">{item.name}</span>
                      {item.description && <span className="text-gray-500"> - {item.description}</span>}
                    </li>
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
              onClick={() => onOpenCompleteModal(task)}
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

interface CompleteModalProps {
  task: CleaningTask | null;
  isOpen: boolean;
  onClose: () => void;
}

function CompleteModal({ task, isOpen, onClose }: CompleteModalProps) {
  const completeCleaningTask = useAppStore((s) => s.completeCleaningTask);
  const [anomalies, setAnomalies] = useState<string[]>(['']);
  const [photos, setPhotos] = useState<string[]>(['']);
  const [lostItems, setLostItems] = useState<{ name: string; description: string }[]>([
    { name: '', description: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setAnomalies(['']);
    setPhotos(['']);
    setLostItems([{ name: '', description: '' }]);
  };

  const handleOpen = () => {
    resetForm();
  };

  useEffect(() => {
    if (isOpen) {
      handleOpen();
    }
  }, [isOpen]);

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!task) return;
    setSubmitting(true);
    try {
      const filteredAnomalies = anomalies.filter((a) => a.trim() !== '');
      const filteredPhotos = photos.filter((p) => p.trim() !== '');
      const now = new Date().toISOString();
      const filteredLostItems: Omit<LostItem, 'id'>[] = lostItems
        .filter((item) => item.name.trim() !== '')
        .map((item) => ({
          name: item.name.trim(),
          description: item.description.trim(),
          foundAt: now,
        }));

      await completeCleaningTask(task.id, {
        anomalies: filteredAnomalies,
        photos: filteredPhotos,
        lostItems: filteredLostItems,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const addAnomaly = () => setAnomalies([...anomalies, '']);
  const removeAnomaly = (idx: number) => {
    if (anomalies.length <= 1) {
      setAnomalies(['']);
    } else {
      setAnomalies(anomalies.filter((_, i) => i !== idx));
    }
  };
  const updateAnomaly = (idx: number, value: string) => {
    const next = [...anomalies];
    next[idx] = value;
    setAnomalies(next);
  };

  const addPhoto = () => setPhotos([...photos, '']);
  const removePhoto = (idx: number) => {
    if (photos.length <= 1) {
      setPhotos(['']);
    } else {
      setPhotos(photos.filter((_, i) => i !== idx));
    }
  };
  const updatePhoto = (idx: number, value: string) => {
    const next = [...photos];
    next[idx] = value;
    setPhotos(next);
  };

  const addLostItem = () => setLostItems([...lostItems, { name: '', description: '' }]);
  const removeLostItem = (idx: number) => {
    if (lostItems.length <= 1) {
      setLostItems([{ name: '', description: '' }]);
    } else {
      setLostItems(lostItems.filter((_, i) => i !== idx));
    }
  };
  const updateLostItem = (idx: number, field: 'name' | 'description', value: string) => {
    const next = [...lostItems];
    next[idx][field] = value;
    setLostItems(next);
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-serif">完成清洁确认</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              房间 {task.roomNumber} - {task.floor}楼
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500" />
                异常说明
              </label>
              <button
                onClick={addAnomaly}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                添加
              </button>
            </div>
            <div className="space-y-2">
              {anomalies.map((anomaly, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-6 text-right">{idx + 1}.</span>
                  <input
                    type="text"
                    value={anomaly}
                    onChange={(e) => updateAnomaly(idx, e.target.value)}
                    placeholder="请输入异常描述..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                  <button
                    onClick={() => removeAnomaly(idx)}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-primary-500" />
                异常照片描述
              </label>
              <button
                onClick={addPhoto}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                添加
              </button>
            </div>
            <div className="space-y-2">
              {photos.map((photo, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-primary-600 w-6 text-right font-medium">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={photo}
                    onChange={(e) => updatePhoto(idx, e.target.value)}
                    placeholder="请输入照片描述..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-accent-500" />
                遗失物录入
              </label>
              <button
                onClick={addLostItem}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                添加
              </button>
            </div>
            <div className="space-y-3">
              {lostItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-accent-600 font-medium">
                      遗失物 #{idx + 1}
                    </span>
                    <button
                      onClick={() => removeLostItem(idx)}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateLostItem(idx, 'name', e.target.value)}
                      placeholder="物品名称"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
                    />
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLostItem(idx, 'description', e.target.value)}
                      placeholder="物品描述（可选）"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="btn-outline px-5 py-2 text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary px-5 py-2 text-sm flex items-center gap-1.5"
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            确认完成
          </button>
        </div>
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
  const [modalTask, setModalTask] = useState<CleaningTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const openCompleteModal = (task: CleaningTask) => {
    setModalTask(task);
    setIsModalOpen(true);
  };

  const closeCompleteModal = () => {
    setIsModalOpen(false);
    setModalTask(null);
  };

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
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpenCompleteModal={openCompleteModal}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <CompleteModal
        task={modalTask}
        isOpen={isModalOpen}
        onClose={closeCompleteModal}
      />
    </Layout>
  );
}
