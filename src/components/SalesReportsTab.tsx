import { useMemo, useState } from 'react';
import { Download, Printer, RotateCcw, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Order, Product } from '../types';
import {
  buildSalesReportCsv,
  buildSalesReportFilename,
  calculateSalesReport,
  formatBDT,
  formatSalesPeriodLabel,
  type SalesDateRange,
  type SalesOrderTypeFilter,
} from '../utils/commerce';

interface SalesReportsTabProps {
  orders: Order[];
  products: Product[];
}

type DailyChartMetric = 'revenue' | 'aov' | 'units';

function formatCompactBDT(value: number): string {
  if (value >= 100_000) return `৳${(value / 1000).toFixed(0)}k`;
  if (value >= 1_000) return `৳${(value / 1000).toFixed(1)}k`;
  return `৳${value}`;
}

export function SalesReportsTab({ orders, products }: SalesReportsTabProps) {
  const [dateRange, setDateRange] = useState<SalesDateRange>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [orderType, setOrderType] = useState<SalesOrderTypeFilter>('all');
  const [dailyMetric, setDailyMetric] = useState<DailyChartMetric>('revenue');

  const report = useMemo(
    () =>
      calculateSalesReport(orders, products, {
        dateRange,
        startDate: dateRange === 'custom' ? startDate : undefined,
        endDate: dateRange === 'custom' ? endDate : undefined,
        orderType,
      }),
    [orders, products, dateRange, startDate, endDate, orderType]
  );

  const handleResetFilters = () => {
    setDateRange('all');
    setStartDate('');
    setEndDate('');
    setOrderType('all');
  };

  const periodLabel = useMemo(
    () =>
      formatSalesPeriodLabel({
        dateRange,
        startDate: dateRange === 'custom' ? startDate : undefined,
        endDate: dateRange === 'custom' ? endDate : undefined,
      }),
    [dateRange, startDate, endDate]
  );

  const handleExportCsv = () => {
    const csv = buildSalesReportCsv(report, {
      periodLabel,
      orderType,
    });
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildSalesReportFilename(dateRange, 'csv', startDate, endDate);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    const previousTitle = document.title;
    document.title = `GoPlay Sales Report — ${periodLabel}`;
    const restoreTitle = () => {
      document.title = previousTitle;
    };
    window.addEventListener('afterprint', restoreTitle, { once: true });
    window.print();
    window.setTimeout(restoreTitle, 1000);
  };

  const dateRanges: { id: SalesDateRange; label: string }[] = [
    { id: 'all', label: 'All Time' },
    { id: '7d', label: 'Weekly (7D)' },
    { id: '30d', label: 'Monthly (30D)' },
    { id: 'custom', label: 'Custom' },
  ];

  const metricLabel =
    dailyMetric === 'revenue'
      ? 'Revenue'
      : dailyMetric === 'aov'
      ? 'Average Order Value'
      : 'Units Sold';

  const generatedDisplay = new Date().toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Executive Print-Only Header */}
      <div className="hidden print:block border-b-2 border-[#111111] pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#525252]">
              GoPlay Bangladesh · Gear Up. Get Out. Go Play.
            </p>
            <h1 className="font-display text-2xl font-extrabold text-[#111111] mt-1">
              Business Sales Performance Report
            </h1>
          </div>
          <div className="text-right text-xs text-[#292929] space-y-0.5">
            <p>
              <span className="font-semibold">Period:</span> {periodLabel}
            </p>
            <p>
              <span className="font-semibold">Order Type:</span>{' '}
              {orderType === 'all' ? 'All Order Types' : orderType}
            </p>
            <p className="font-mono-num text-[11px] text-[#525252]">
              Generated: {generatedDisplay}
            </p>
          </div>
        </div>
      </div>

      {/* Header & Filter Bar */}
      <div className="border border-[#E5E5E5] rounded-lg bg-white p-5 space-y-4 print:hidden">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-extrabold text-[#111111]">
              Sales &amp; Category Performance
            </h2>
            <p className="text-xs text-[#525252] mt-0.5">
              Live order aggregation excluding cancelled and refunded orders from active sales and AOV.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              role="group"
              aria-label="Date range filter"
              className="inline-flex rounded-md border border-[#D4D4D4] bg-[#F4F4F4] p-0.5"
            >
              {dateRanges.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDateRange(item.id)}
                  className={`px-2.5 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                    dateRange === item.id
                      ? 'bg-[#111111] text-white'
                      : 'text-[#525252] hover:text-[#111111]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <select
              aria-label="Filter by order type"
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as SalesOrderTypeFilter)}
              className="border border-[#D4D4D4] bg-white rounded-md px-3 py-2 text-xs font-semibold text-[#111111]"
            >
              <option value="all">All Order Types</option>
              <option value="Ready Stock">Ready Stock</option>
              <option value="Pre-order">Pre-order</option>
              <option value="Mixed">Mixed</option>
            </select>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={report.totalMatchingOrders === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#111111] bg-[#111111] text-white text-xs font-semibold hover:bg-[#292929] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-[#B7F500]" />
              Export to CSV
            </button>

            <button
              type="button"
              onClick={handlePrintReport}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#D4D4D4] bg-white text-[#111111] text-xs font-semibold hover:bg-[#F4F4F4] whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </button>
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="pt-3 border-t border-[#F4F4F4] flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <label htmlFor="sales-start-date" className="font-semibold text-[#525252]">
                From:
              </label>
              <input
                id="sales-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-[#D4D4D4] rounded px-2.5 py-1.5 text-xs font-mono-num"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="sales-end-date" className="font-semibold text-[#525252]">
                To:
              </label>
              <input
                id="sales-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-[#D4D4D4] rounded px-2.5 py-1.5 text-xs font-mono-num"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3 print:break-inside-avoid">
        <div className="p-5 border border-[#E5E5E5] rounded-lg bg-white print:p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#525252]">
            Gross Order Volume
          </p>
          <p className="font-mono-num text-2xl font-extrabold text-[#111111] mt-2 print:text-lg">
            {formatBDT(report.grossOrderVolume)}
          </p>
          <p className="font-mono-num text-xs text-[#525252] mt-1 print:text-[11px]">
            Earned {formatBDT(report.earnedRevenue)} · Held {formatBDT(report.heldPreOrderAdvances)}
          </p>
        </div>

        <div className="p-5 border border-[#E5E5E5] rounded-lg bg-white print:p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#525252]">
            Average Order Value (AOV)
          </p>
          <p className="font-mono-num text-2xl font-extrabold text-[#111111] mt-2 print:text-lg">
            {formatBDT(report.averageOrderValue)}
          </p>
          <p className="font-mono-num text-xs text-[#525252] mt-1 print:text-[11px]">
            Across {report.activeOrderCount} active order{report.activeOrderCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="p-5 border border-[#E5E5E5] rounded-lg bg-white print:p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#525252]">
            Units Sold &amp; Buyers
          </p>
          <p className="font-mono-num text-2xl font-extrabold text-[#111111] mt-2 print:text-lg">
            {report.totalUnitsSold.toLocaleString('en-US')}
          </p>
          <p className="font-mono-num text-xs text-[#525252] mt-1 print:text-[11px]">
            {report.uniqueCustomerCount} buyer{report.uniqueCustomerCount === 1 ? '' : 's'} ·{' '}
            {report.repeatCustomerRatePct}% repeat
          </p>
        </div>

        <div className="p-5 border border-[#E5E5E5] rounded-lg bg-white print:p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#525252]">
            Cancellation / Refund Rate
          </p>
          <p className="font-mono-num text-2xl font-extrabold text-[#111111] mt-2 print:text-lg">
            {report.cancellationRatePct}%
          </p>
          <p className="font-mono-num text-xs text-[#525252] mt-1 print:text-[11px]">
            {report.cancelledOrRefundedCount} of {report.totalMatchingOrders} matching orders
          </p>
        </div>
      </div>

      {/* Empty State or Visualizations */}
      {report.activeOrderCount === 0 ? (
        <div className="border border-[#E5E5E5] rounded-lg bg-white p-10 text-center space-y-3">
          <TrendingUp className="w-8 h-8 text-[#525252] mx-auto" />
          <h3 className="font-display text-base font-bold text-[#111111]">
            No active orders match these filters
          </h3>
          <p className="text-xs text-[#525252] max-w-md mx-auto">
            {report.cancelledOrRefundedCount > 0
              ? `${report.cancelledOrRefundedCount} cancelled/refunded order(s) exist in this filter range and are excluded from active revenue charts.`
              : 'Try broadening the date window or switching back to all order types.'}
          </p>
          {(dateRange !== 'all' || orderType !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#111111] text-white text-xs font-semibold hover:bg-[#292929] print:hidden"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#B7F500]" />
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
            {/* Daily Revenue & Orders Chart */}
            <div className="border border-[#E5E5E5] rounded-lg bg-white p-5 space-y-4 print:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm font-bold text-[#111111]">
                    Daily {metricLabel} &amp; Order Volume
                  </h3>
                  <p className="text-xs text-[#525252]">
                    Chronological daily bars vs active order count
                  </p>
                </div>
                <div
                  role="group"
                  aria-label="Daily chart metric"
                  className="inline-flex rounded border border-[#D4D4D4] bg-[#F4F4F4] p-0.5 text-[11px] print:hidden"
                >
                  {(
                    [
                      { id: 'revenue', label: 'Revenue' },
                      { id: 'aov', label: 'AOV' },
                      { id: 'units', label: 'Units' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setDailyMetric(m.id)}
                      className={`px-2 py-1 rounded font-semibold transition-colors ${
                        dailyMetric === m.id
                          ? 'bg-[#111111] text-white'
                          : 'text-[#525252] hover:text-[#111111]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height={280} initialDimension={{ width: 480, height: 280 }}>
                  <ComposedChart
                    data={report.dailySeries}
                    margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid stroke="#F0F0F0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#525252' }}
                      axisLine={{ stroke: '#E5E5E5' }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="primary"
                      allowDecimals={dailyMetric !== 'units'}
                      tickFormatter={(v: number) =>
                        dailyMetric === 'units' ? String(v) : formatCompactBDT(v)
                      }
                      tick={{ fontSize: 11, fill: '#525252' }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                    />
                    <YAxis
                      yAxisId="orders"
                      orientation="right"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#525252' }}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip
                      cursor={{ fill: '#F4F4F4' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const point = payload[0].payload as (typeof report.dailySeries)[number];
                        return (
                          <div className="rounded-md border border-[#111111] bg-white px-3 py-2 text-xs shadow-sm space-y-1">
                            <p className="font-bold text-[#111111]">{point.date}</p>
                            <p className="font-mono-num text-[#292929]">
                              Revenue: <span className="font-bold">{formatBDT(point.revenue)}</span>
                            </p>
                            <p className="font-mono-num text-[#292929]">
                              Orders: <span className="font-bold">{point.orders}</span> · Units{' '}
                              <span className="font-bold">{point.units}</span> · AOV{' '}
                              <span className="font-bold">{formatBDT(point.aov)}</span>
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      yAxisId="primary"
                      dataKey={dailyMetric}
                      name={metricLabel}
                      fill="#111111"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                      isAnimationActive={false}
                    />
                    <Line
                      yAxisId="orders"
                      type="monotone"
                      dataKey="orders"
                      name="Orders"
                      stroke="#65A30D"
                      strokeWidth={2}
                      dot={{ fill: '#B7F500', stroke: '#111111', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 5, fill: '#B7F500', stroke: '#111111', strokeWidth: 2 }}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top-Selling Categories Chart */}
            <div className="border border-[#E5E5E5] rounded-lg bg-white p-5 space-y-4 print:p-4">
              <div>
                <h3 className="font-display text-sm font-bold text-[#111111]">
                  Top-Selling Categories
                </h3>
                <p className="text-xs text-[#525252]">
                  Merchandise revenue by sport category (leading category highlighted)
                </p>
              </div>

              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height={280} initialDimension={{ width: 480, height: 280 }}>
                  <BarChart
                    data={report.topCategories.slice(0, 8)}
                    layout="vertical"
                    margin={{ top: 6, right: 20, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid stroke="#F0F0F0" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={formatCompactBDT}
                      tick={{ fontSize: 11, fill: '#525252' }}
                      axisLine={{ stroke: '#E5E5E5' }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="categoryLabel"
                      width={132}
                      tick={{ fontSize: 11, fill: '#111111', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#F4F4F4' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const cat = payload[0].payload as (typeof report.topCategories)[number];
                        return (
                          <div className="rounded-md border border-[#111111] bg-white px-3 py-2 text-xs shadow-sm space-y-1">
                            <p className="font-bold text-[#111111]">{cat.categoryLabel}</p>
                            <p className="font-mono-num text-[#292929]">
                              Sales: <span className="font-bold">{formatBDT(cat.revenue)}</span> (
                              {cat.sharePct}%)
                            </p>
                            <p className="font-mono-num text-[#292929]">
                              Units Sold: <span className="font-bold">{cat.unitsSold}</span> · Orders{' '}
                              <span className="font-bold">{cat.orderCount}</span>
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={28} isAnimationActive={false}>
                      {report.topCategories.slice(0, 8).map((entry, idx) => (
                        <Cell
                          key={entry.categoryLabel}
                          fill={idx === 0 ? '#111111' : '#525252'}
                          stroke={idx === 0 ? '#B7F500' : 'none'}
                          strokeWidth={idx === 0 ? 1.5 : 0}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Print-Only Daily Performance Ledger */}
          <div className="hidden print:block border border-[#E5E5E5] rounded-lg bg-white p-4 space-y-2 print:break-inside-avoid">
            <h3 className="font-display text-sm font-bold text-[#111111]">
              Daily Performance Ledger
            </h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E5E5] text-[#525252]">
                  <th className="py-1.5 pr-3 font-semibold">Date</th>
                  <th className="py-1.5 px-2 font-semibold text-right">Active Orders</th>
                  <th className="py-1.5 px-2 font-semibold text-right">Units Sold</th>
                  <th className="py-1.5 px-2 font-semibold text-right">Revenue</th>
                  <th className="py-1.5 pl-2 font-semibold text-right">AOV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F4]">
                {report.dailySeries.map((day) => (
                  <tr key={day.date}>
                    <td className="py-1.5 pr-3 font-mono-num font-semibold text-[#111111]">
                      {day.date}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono-num text-[#292929]">
                      {day.orders}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono-num text-[#292929]">
                      {day.units}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono-num font-bold text-[#111111]">
                      {formatBDT(day.revenue)}
                    </td>
                    <td className="py-1.5 pl-2 text-right font-mono-num text-[#292929]">
                      {formatBDT(day.aov)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tables Row: Category Breakdown + Top-Selling SKUs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
            <div className="border border-[#E5E5E5] rounded-lg bg-white p-5 space-y-3 print:p-4">
              <h3 className="font-display text-sm font-bold text-[#111111]">
                Category Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] text-[#525252]">
                      <th className="py-2 pr-3 font-semibold">Category</th>
                      <th className="py-2 px-2 font-semibold text-right">Orders</th>
                      <th className="py-2 px-2 font-semibold text-right">Units</th>
                      <th className="py-2 px-2 font-semibold text-right">Sales</th>
                      <th className="py-2 pl-2 font-semibold text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F4F4]">
                    {report.topCategories.map((cat) => (
                      <tr key={cat.categoryLabel}>
                        <td className="py-2.5 pr-3 font-semibold text-[#111111]">
                          {cat.categoryLabel}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num text-[#292929]">
                          {cat.orderCount}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num text-[#292929]">
                          {cat.unitsSold}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono-num font-bold text-[#111111]">
                          {formatBDT(cat.revenue)}
                        </td>
                        <td className="py-2.5 pl-2 text-right font-mono-num text-[#525252]">
                          {cat.sharePct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-[#E5E5E5] rounded-lg bg-white p-5 space-y-3 print:p-4">
              <h3 className="font-display text-sm font-bold text-[#111111]">
                Top-Selling Products
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E5E5] text-[#525252]">
                      <th className="py-2 pr-3 font-semibold">Product</th>
                      <th className="py-2 px-2 font-semibold">Category</th>
                      <th className="py-2 px-2 font-semibold text-right">Units</th>
                      <th className="py-2 pl-2 font-semibold text-right">Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F4F4]">
                    {report.topProducts.map((item) => (
                      <tr key={item.sku}>
                        <td className="py-2.5 pr-3">
                          <p className="font-semibold text-[#111111]">{item.name}</p>
                          <p className="font-mono-num text-[11px] text-[#525252]">{item.sku}</p>
                        </td>
                        <td className="py-2.5 px-2 text-[#525252]">{item.categoryLabel}</td>
                        <td className="py-2.5 px-2 text-right font-mono-num text-[#292929]">
                          {item.unitsSold}
                        </td>
                        <td className="py-2.5 pl-2 text-right font-mono-num font-bold text-[#111111]">
                          {formatBDT(item.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Division, Payment, Order Type & Fulfillment Breakdown Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
            <div className="border border-[#E5E5E5] rounded-lg bg-white p-5 space-y-3 print:p-4">
              <h3 className="font-display text-sm font-bold text-[#111111]">
                Sales by Bangladesh Division
              </h3>
              <div className="divide-y divide-[#F4F4F4] text-xs">
                {report.byDivision.map((div) => (
                  <div key={div.division} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#111111]">{div.division}</p>
                      <p className="font-mono-num text-[#525252]">
                        {div.orders} order{div.orders === 1 ? '' : 's'} · {div.sharePct}% share
                      </p>
                    </div>
                    <span className="font-mono-num font-bold text-[#111111]">
                      {formatBDT(div.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#E5E5E5] rounded-lg bg-white p-5 space-y-5 print:p-4">
              <div className="space-y-2.5">
                <h3 className="font-display text-sm font-bold text-[#111111]">
                  Order Model &amp; Payment Split
                </h3>
                <div className="divide-y divide-[#F4F4F4] text-xs">
                  {report.orderTypeBreakdown.map((ot) => (
                    <div key={ot.orderType} className="py-2 flex items-center justify-between gap-3">
                      <span className="font-semibold text-[#111111]">{ot.orderType}</span>
                      <span className="font-mono-num text-[#525252]">
                        {ot.orders} order{ot.orders === 1 ? '' : 's'} · {ot.sharePct}% ·{' '}
                        <strong className="text-[#111111]">{formatBDT(ot.revenue)}</strong>
                      </span>
                    </div>
                  ))}
                  {report.paymentBreakdown.map((pm) => (
                    <div key={pm.method} className="py-2 flex items-center justify-between gap-3">
                      <span className="font-semibold text-[#111111]">{pm.method}</span>
                      <span className="font-mono-num text-[#525252]">
                        {pm.orders} order{pm.orders === 1 ? '' : 's'} · {pm.sharePct}% ·{' '}
                        <strong className="text-[#111111]">{formatBDT(pm.revenue)}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5E5E5] space-y-2">
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#525252]">
                  Fulfillment Status Distribution
                </h4>
                <div className="divide-y divide-[#F4F4F4] text-xs">
                  {report.statusBreakdown.map((st) => (
                    <div key={st.status} className="py-1.5 flex items-center justify-between gap-3">
                      <span className="text-[#292929] font-medium">{st.status}</span>
                      <span className="font-mono-num text-[#111111] font-semibold">
                        {st.orders} ({formatBDT(st.revenue)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Print-Only Document Footer */}
      <div className="hidden print:flex items-center justify-between border-t border-[#D4D4D4] pt-3 text-[10px] text-[#525252]">
        <span>GoPlay Bangladesh · Business Control Centre · Internal Sales Summary</span>
        <span className="font-mono-num">Currency: BDT (৳) · {periodLabel}</span>
      </div>
    </div>
  );
}
