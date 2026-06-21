import { useEffect } from 'react';
import Layout from '../components/Layout';
import { useAppStore } from '../store/useAppStore';
import type { Statistics as StatisticsType, DateRangeType, RoomConsumption } from '../../shared/types';
import {
  BarChart3,
  Clock,
  RefreshCw,
  Wrench,
  Package,
  TrendingUp,
  Users,
  PieChart,
  Calendar,
  Building2,
  ListTodo,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '../lib/utils';

const COLORS = ['#1e3a5f', '#c8993e', '#5279aa', '#dab75b', '#a9bcd4', '#e6cf92'];

const dateRangeOptions: { value: DateRangeType; label: string; icon: typeof Calendar }[] = [
  { value: 'today', label: '今天', icon: Calendar },
  { value: 'week', label: '本周', icon: Calendar },
  { value: 'month', label: '本月', icon: Calendar },
  { value: 'all', label: '全部', icon: Calendar },
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: typeof Clock;
  iconBg: string;
  iconColor: string;
  unit?: string;
  trend?: { value: string; positive: boolean };
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, unit, trend }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900 font-serif">{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {trend && (
            <div className={cn(
              'mt-2 flex items-center gap-1 text-xs',
              trend.positive ? 'text-green-600' : 'text-red-600'
            )}>
              <TrendingUp className={cn('w-3 h-3', !trend.positive && 'rotate-180')} />
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <RefreshCw className="w-8 h-8 text-primary-500 animate-spin mb-4" />
      <p className="text-gray-500">加载统计数据中...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <BarChart3 className="w-12 h-12 text-gray-300 mb-4" />
      <p className="text-gray-500">暂无统计数据</p>
    </div>
  );
}

function RoomConsumptionCard({ room }: { room: RoomConsumption }) {
  return (
    <div className="card p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="w-4 h-4 text-primary-600" />
        <h4 className="font-semibold text-gray-900">{room.roomNumber}</h4>
      </div>
      <div className="space-y-1.5">
        {room.items.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{item.name}</span>
            <span className="font-medium text-gray-900">{item.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  const statistics = useAppStore((s) => s.statistics);
  const fetchStatistics = useAppStore((s) => s.fetchStatistics);
  const loading = useAppStore((s) => s.loading);
  const statisticsDateRange = useAppStore((s) => s.statisticsDateRange);
  const setStatisticsDateRange = useAppStore((s) => s.setStatisticsDateRange);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics, statisticsDateRange]);

  const handleDateRangeChange = (range: DateRangeType) => {
    setStatisticsDateRange(range);
  };

  if (loading && !statistics) {
    return (
      <Layout title="统计分析" subtitle="运营数据概览与趋势分析">
        <LoadingState />
      </Layout>
    );
  }

  if (!statistics) {
    return (
      <Layout title="统计分析" subtitle="运营数据概览与趋势分析">
        <EmptyState />
      </Layout>
    );
  }

  const stats: StatisticsType = statistics;

  const consumptionPerRoomStr = stats.consumptionPerRoom
    .map((c) => `${c.itemName}: ${c.avgQuantity.toFixed(1)}`)
    .join(' · ');

  const rangeLabel = dateRangeOptions.find((o) => o.value === statisticsDateRange)?.label || '全部';

  return (
    <Layout title="统计分析" subtitle={`运营数据概览与趋势分析 · ${rangeLabel}数据`}>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            时间范围:
          </span>
          {dateRangeOptions.map((option) => {
            const OptionIcon = option.icon;
            const isActive = statisticsDateRange === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleDateRangeChange(option.value)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                  isActive
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                <OptionIcon className="w-4 h-4" />
                {option.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => fetchStatistics()}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
            loading && 'opacity-50 cursor-not-allowed'
          )}
          disabled={loading}
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="平均周转时间"
          value={stats.avgCleaningTurnaroundMinutes}
          icon={Clock}
          iconBg="bg-primary-50"
          iconColor="text-primary-600"
          unit="分钟"
        />
        <StatCard
          title="返工次数"
          value={stats.totalReworkCount}
          icon={RefreshCw}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          unit="次"
        />
        <StatCard
          title="平均维修耗时"
          value={stats.avgRepairDurationMinutes}
          icon={Wrench}
          iconBg="bg-accent-50"
          iconColor="text-accent-600"
          unit="分钟"
        />
        <StatCard
          title="每间房平均消耗"
          value={consumptionPerRoomStr || '-'}
          icon={Package}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-primary-600" />
            <h3 className="font-serif text-lg font-semibold text-gray-800">清洁阿姨清洁数量对比</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.cleaningByPerson} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
                <Bar dataKey="count" name="清洁数量" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgMinutes" name="平均耗时(分钟)" fill="#c8993e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-accent-600" />
            <h3 className="font-serif text-lg font-semibold text-gray-800">故障类型分布</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={stats.repairsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="type"
                >
                  {stats.repairsByType.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h3 className="font-serif text-lg font-semibold text-gray-800">月度清洁/维修趋势</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.monthlyTrend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="cleaningCount"
                name="清洁任务数"
                stroke="#1e3a5f"
                strokeWidth={2}
                dot={{ fill: '#1e3a5f', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="repairCount"
                name="维修工单"
                stroke="#c8993e"
                strokeWidth={2}
                dot={{ fill: '#c8993e', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <ListTodo className="w-5 h-5 text-primary-600" />
          <h3 className="font-serif text-lg font-semibold text-gray-800">按房间消耗统计</h3>
          <span className="text-sm text-gray-500 font-normal">（{stats.consumptionByRoom.length} 间房）</span>
        </div>
        {stats.consumptionByRoom.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">暂无房间消耗数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {stats.consumptionByRoom.map((room) => (
              <RoomConsumptionCard key={room.roomNumber} room={room} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
