import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { useAppStore } from '../store/useAppStore';
import type { MaintenanceOrder, MaintenanceStatus, MaintenancePriority, MaintenanceTimeline, MaintenanceActionType } from '../../shared/types';
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
  X,
  MessageSquare,
  History,
  FileText,
  Play,
  UserPlus,
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

const actionConfig: Record<MaintenanceActionType, { label: string; icon: typeof FileText; bg: string; text: string }> = {
  created: { label: '创建工单', icon: FileText, bg: 'bg-gray-100', text: 'text-gray-700' },
  assigned: { label: '指派人员', icon: UserPlus, bg: 'bg-purple-100', text: 'text-purple-700' },
  started: { label: '开始处理', icon: Play, bg: 'bg-blue-100', text: 'text-blue-700' },
  note: { label: '补充说明', icon: MessageSquare, bg: 'bg-amber-100', text: 'text-amber-700' },
  completed: { label: '工单完成', icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { label: '取消工单', icon: XCircle, bg: 'bg-red-100', text: 'text-red-700' },
};

interface DetailModalProps {
  order: MaintenanceOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

function DetailModal({ order, isOpen, onClose }: DetailModalProps) {
  const updateMaintenanceOrder = useAppStore((s) => s.updateMaintenanceOrder);
  const completeMaintenanceOrder = useAppStore((s) => s.completeMaintenanceOrder);
  const addMaintenanceTimeline = useAppStore((s) => s.addMaintenanceTimeline);
  const repairStaff = useAppStore((s) => s.repairStaff);
  const staff = useAppStore((s) => s.staff);

  const [noteText, setNoteText] = useState('');
  const [completeResult, setCompleteResult] = useState('');
  const [completeDuration, setCompleteDuration] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNoteText('');
      setCompleteResult('');
      setCompleteDuration('');
      setShowAssign(false);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const priorityConf = priorityConfig[order.priority];
  const statusConf = statusConfig[order.status];
  const StatusIcon = statusConf.icon;

  const currentOperator = staff.find((s) => s.role === 'reception') || staff[0];

  const handleAssign = async (staffId: string, staffName: string) => {
    setSubmitting(true);
    try {
      await updateMaintenanceOrder(order.id, { assigneeId: staffId, assigneeName: staffName });
      if (currentOperator) {
        await addMaintenanceTimeline(order.id, 'assigned', currentOperator.name, currentOperator.id, `指派给 ${staffName}`);
      }
      setShowAssign(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async () => {
    setSubmitting(true);
    try {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      await updateMaintenanceOrder(order.id, { status: 'inProgress' as MaintenanceStatus, startedAt: now });
      const operatorName = order.assigneeName || currentOperator?.name || '系统';
      const operatorId = order.assigneeId || currentOperator?.id;
      await addMaintenanceTimeline(order.id, 'started', operatorName, operatorId);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !currentOperator) return;
    setSubmitting(true);
    try {
      await addMaintenanceTimeline(order.id, 'note', currentOperator.name, currentOperator.id, noteText.trim());
      setNoteText('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeResult.trim() || !completeDuration || parseInt(completeDuration) < 1) return;
    setSubmitting(true);
    try {
      const operatorName = order.assigneeName || currentOperator?.name || '系统';
      const operatorId = order.assigneeId || currentOperator?.id;
      await completeMaintenanceOrder(order.id, {
        result: completeResult.trim(),
        repairDurationMinutes: parseInt(completeDuration),
        operatorName,
        operatorId,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const sortedTimeline = useMemo(() => {
    const timeline = order.timeline || [];
    return [...timeline].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [order.timeline]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-serif flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary-600" />
              工单详情 - {order.roomNumber}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn('badge', priorityConf.bg, priorityConf.text, 'flex items-center gap-1')}>
                <AlertTriangle className="w-3 h-3" />
                {priorityConf.label}
              </span>
              <span className={cn('badge', statusConf.bg, statusConf.text, 'flex items-center gap-1')}>
                <StatusIcon className="w-3 h-3" />
                {statusConf.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="card p-4">
                <h3 className="font-serif text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  基本信息
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">房间</span>
                    <span className="font-medium text-gray-900">{order.roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">位置</span>
                    <span className="font-medium text-gray-900">{order.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">报修人</span>
                    <span className="font-medium text-gray-900">{order.reporterName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">创建时间</span>
                    <span className="font-medium text-gray-900">{order.createdAt}</span>
                  </div>
                  {order.assigneeName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">处理人</span>
                      <span className="font-medium text-gray-900">{order.assigneeName}</span>
                    </div>
                  )}
                  {order.startedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">开始时间</span>
                      <span className="font-medium text-gray-900">{order.startedAt}</span>
                    </div>
                  )}
                  {order.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">完成时间</span>
                      <span className="font-medium text-gray-900">{order.completedAt}</span>
                    </div>
                  )}
                  {order.repairDurationMinutes && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">处理耗时</span>
                      <span className="font-medium text-gray-900">{order.repairDurationMinutes} 分钟</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card p-4">
                <h3 className="font-serif text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary-600" />
                  问题描述
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.description}</p>
              </div>

              {order.result && (
                <div className="card p-4 bg-green-50 border border-green-100">
                  <h3 className="font-serif text-base font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    处理结果
                  </h3>
                  <p className="text-sm text-green-700 whitespace-pre-wrap">{order.result}</p>
                </div>
              )}

              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <div className="card p-4">
                  <h3 className="font-serif text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary-600" />
                    操作
                  </h3>
                  <div className="space-y-3">
                    {order.status === 'pending' && (
                      <div className="relative">
                        <button
                          onClick={() => setShowAssign(!showAssign)}
                          className="btn-outline w-full flex items-center justify-center gap-2"
                          disabled={submitting}
                        >
                          <UserPlus className="w-4 h-4" />
                          {order.assigneeName ? '重新指派' : '指派处理人'}
                        </button>
                        {showAssign && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 mb-2">选择维修人员：</p>
                            <div className="grid grid-cols-2 gap-2">
                              {repairStaff.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => handleAssign(s.id, s.name)}
                                  className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-primary-50 hover:border-primary-300 transition-colors text-left flex items-center gap-2"
                                  disabled={submitting}
                                >
                                  <User className="w-3.5 h-3.5 text-gray-400" />
                                  {s.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {order.status === 'pending' && order.assigneeId && (
                      <button
                        onClick={handleStart}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                        disabled={submitting}
                      >
                        <Play className="w-4 h-4" />
                        开始处理
                      </button>
                    )}

                    {order.status === 'inProgress' && (
                      <form onSubmit={handleCompleteSubmit} className="space-y-3">
                        <div>
                          <label className="label">处理结果 <span className="text-red-500">*</span></label>
                          <textarea
                            value={completeResult}
                            onChange={(e) => setCompleteResult(e.target.value)}
                            className="input"
                            rows={3}
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
                        <button
                          type="submit"
                          className="btn-secondary w-full flex items-center justify-center gap-2"
                          disabled={submitting}
                        >
                          <CheckCircle className="w-4 h-4" />
                          完成工单
                        </button>
                      </form>
                    )}

                    <div>
                      <label className="label">补充说明</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="input flex-1"
                          placeholder="添加备注说明..."
                        />
                        <button
                          type="button"
                          onClick={handleAddNote}
                          className="btn-outline flex items-center gap-1"
                          disabled={submitting || !noteText.trim()}
                        >
                          <MessageSquare className="w-4 h-4" />
                          添加
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card p-4 h-fit">
              <h3 className="font-serif text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-primary-600" />
                处理时间线
              </h3>
              {sortedTimeline.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">暂无时间线记录</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
                  <div className="space-y-4">
                    {sortedTimeline.map((tl) => {
                      const ac = actionConfig[tl.action];
                      const ActionIcon = ac.icon;
                      return (
                        <div key={tl.id} className="relative pl-8">
                          <div className={cn('absolute left-0 w-6 h-6 rounded-full flex items-center justify-center', ac.bg)}>
                            <ActionIcon className={cn('w-3 h-3', ac.text)} />
                          </div>
                          <div className={cn('p-3 rounded-lg', ac.bg, 'bg-opacity-50')}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={cn('text-sm font-medium', ac.text)}>{ac.label}</span>
                              <span className="text-xs text-gray-500">{tl.createdAt}</span>
                            </div>
                            <p className="text-xs text-gray-600 mb-0.5">操作人：{tl.operatorName}</p>
                            {tl.note && (
                              <p className="text-sm text-gray-700 mt-1 bg-white bg-opacity-50 rounded px-2 py-1">
                                {tl.note}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-end bg-gray-50">
          <button onClick={onClose} className="btn-outline px-5 py-2 text-sm">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function MaintenanceCard({ order, onOpenDetail }: { order: MaintenanceOrder; onOpenDetail: (order: MaintenanceOrder) => void }) {
  const priorityConf = priorityConfig[order.priority];
  const statusConf = statusConfig[order.status];
  const StatusIcon = statusConf.icon;
  const updateMaintenanceOrder = useAppStore((s) => s.updateMaintenanceOrder);
  const completeMaintenanceOrder = useAppStore((s) => s.completeMaintenanceOrder);
  const addMaintenanceTimeline = useAppStore((s) => s.addMaintenanceTimeline);
  const repairStaff = useAppStore((s) => s.repairStaff);
  const staff = useAppStore((s) => s.staff);
  const [showAssign, setShowAssign] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeResult, setCompleteResult] = useState('');
  const [completeDuration, setCompleteDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentOperator = staff.find((s) => s.role === 'reception') || staff[0];

  const handleAssign = async (staffId: string, staffName: string) => {
    setSubmitting(true);
    try {
      await updateMaintenanceOrder(order.id, { assigneeId: staffId, assigneeName: staffName });
      if (currentOperator) {
        await addMaintenanceTimeline(order.id, 'assigned', currentOperator.name, currentOperator.id, `指派给 ${staffName}`);
      }
      setShowAssign(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStart = async () => {
    setSubmitting(true);
    try {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
      await updateMaintenanceOrder(order.id, { status: 'inProgress' as MaintenanceStatus, startedAt: now });
      const operatorName = order.assigneeName || currentOperator?.name || '系统';
      const operatorId = order.assigneeId || currentOperator?.id;
      await addMaintenanceTimeline(order.id, 'started', operatorName, operatorId);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeResult.trim() || !completeDuration || parseInt(completeDuration) < 1) return;
    setSubmitting(true);
    try {
      const operatorName = order.assigneeName || currentOperator?.name || '系统';
      const operatorId = order.assigneeId || currentOperator?.id;
      await completeMaintenanceOrder(order.id, {
        result: completeResult.trim(),
        repairDurationMinutes: parseInt(completeDuration),
        operatorName,
        operatorId,
      });
      setShowCompleteModal(false);
      setCompleteResult('');
      setCompleteDuration('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        'card p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 cursor-pointer',
        'before:absolute before:top-0 before:left-0 before:w-1 before:h-full',
        priorityConf.bar
      )}
      onClick={() => onOpenDetail(order)}
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
            <p className="text-sm text-gray-700 line-clamp-2">{order.result}</p>
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

      {(order.timeline?.length || 0) > 0 && (
        <div className="mb-4 flex items-center gap-1 text-xs text-gray-500">
          <History className="w-3.5 h-3.5" />
          已记录 {order.timeline?.length || 0} 条操作
        </div>
      )}

      <div
        className="flex items-center justify-between pt-3 border-t border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
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
                  disabled={submitting}
                >
                  指派
                </button>
                {showAssign && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-32 z-20">
                    {repairStaff.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleAssign(s.id, s.name)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                        disabled={submitting}
                      >
                        <User className="w-3.5 h-3.5" />
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {order.assigneeId && (
                <button onClick={handleStart} className="btn-primary text-xs px-3 py-1.5" disabled={submitting}>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
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
                <button type="submit" className="btn-primary" disabled={submitting}>
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
  const fetchRooms = useAppStore((s) => s.fetchRooms);

  const [showModal, setShowModal] = useState(false);
  const [formRoomId, setFormRoomId] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<MaintenancePriority>('medium');
  const [formReporterName, setFormReporterName] = useState('');
  const [detailOrder, setDetailOrder] = useState<MaintenanceOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchStaff();
    fetchRooms();
  }, [fetchStaff, fetchRooms]);

  useEffect(() => {
    fetchMaintenanceOrders();
  }, [fetchMaintenanceOrders, maintenanceFilterStatus]);

  useEffect(() => {
    if (staff.length > 0 && !formReporterName) {
      const receptionist = staff.find((s) => s.role === 'reception') || staff[0];
      if (receptionist) {
        setFormReporterName(receptionist.name);
      }
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

  const handleOpenDetail = (order: MaintenanceOrder) => {
    setDetailOrder(order);
    setShowDetail(true);
  };

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
          <MaintenanceCard key={order.id} order={order} onOpenDetail={handleOpenDetail} />
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

      <DetailModal
        order={detailOrder}
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false);
          setDetailOrder(null);
        }}
      />
    </Layout>
  );
}
