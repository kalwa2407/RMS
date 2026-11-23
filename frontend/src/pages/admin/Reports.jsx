import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  DollarSign,
  ShoppingBag,
  Clock,
  RefreshCw,
  Bike,
  TrendingUp,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import API_BASE from "../../lib/config";
import { cx, Page, PageHeader, Toolbar, Card, CardHeader, StatCard, SectionTitle, Table, Th, Td, Button, Segmented, Input, FormField, EmptyState, ErrorState, LoadingState } from "./ui";

const Reports = () => {
  const { toast } = useToast();
  const [dailyReport, setDailyReport] = useState(null);
  const [periodReport, setPeriodReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [activeTab, setActiveTab] = useState("daily");
  const [riderStats, setRiderStats] = useState([]);
  const [loadingRiders, setLoadingRiders] = useState(false);

  const token = localStorage.getItem("admin_token");

  const fetchDailyReport = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/reports/daily?date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setDailyReport(data);
      }
    } catch (err) {
      console.error("Failed to fetch daily report:", err);
    }
  }, [token, selectedDate]);

  const fetchPeriodReport = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/reports/period?start_date=${dateRange.start}&end_date=${dateRange.end}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setPeriodReport(data);
      }
    } catch (err) {
      console.error("Failed to fetch period report:", err);
    }
  }, [token, dateRange]);

  const fetchRiderStats = useCallback(async () => {
    setLoadingRiders(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/delivery-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRiderStats(await res.json());
    } catch (err) {
      console.error("Failed to fetch rider stats:", err);
    } finally {
      setLoadingRiders(false);
    }
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchDailyReport(), fetchPeriodReport(), fetchRiderStats()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchDailyReport, fetchPeriodReport, fetchRiderStats]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return <LoadingState rows={5} label="Loading reports" />;
  }

  const fmtHour = (h) => {
    const n = Number(h);
    if (Number.isNaN(n)) return `${h}:00`;
    const ampm = n >= 12 ? "PM" : "AM";
    return `${n % 12 || 12} ${ampm}`;
  };

  /* Horizontal bars: one hue, the top value in the accent colour */
  const HBars = ({ rows, valueKey, label, value, sub }) => {
    const max = Math.max(1, ...rows.map((r) => Number(r[valueKey]) || 0));
    const top = rows.reduce((best, r, i) => ((Number(r[valueKey]) || 0) > (Number(rows[best]?.[valueKey]) || 0) ? i : best), 0);
    return (
      <div className="space-y-3">
        {rows.map((r, i) => {
          const pct = Math.round(((Number(r[valueKey]) || 0) / max) * 100);
          return (
            <div key={i}>
              <div className="flex items-baseline justify-between gap-3 text-[14px]">
                <span className="text-[var(--a-text)] truncate">{label(r, i)}</span>
                <span className="pd-tabular text-[var(--a-text)] shrink-0">
                  {value(r)}{sub && <span className="text-[var(--a-text-3)]"> · {sub(r)}</span>}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-[var(--a-chart-soft)] overflow-hidden">
                <div className={cx("h-full rounded-full", i === top ? "bg-[var(--a-accent)]" : "bg-[var(--a-chart)]")} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* Vertical column chart for the period's daily revenue */
  const Columns = ({ rows }) => {
    const max = Math.max(1, ...rows.map((d) => Number(d.revenue) || 0));
    const topIdx = rows.reduce((best, d, i) => ((Number(d.revenue) || 0) > (Number(rows[best]?.revenue) || 0) ? i : best), 0);
    return (
      <div className="flex items-end gap-2 h-44 pt-4">
        {rows.map((d, i) => {
          const h = Math.max(2, Math.round(((Number(d.revenue) || 0) / max) * 100));
          const dt = new Date(d.date);
          const lbl = Number.isNaN(dt.getTime()) ? d.date : dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          return (
            <div key={i} className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1.5" title={`${lbl}: ${formatCurrency(d.revenue)}`}>
              <div className={cx("w-full max-w-[40px] rounded-t-[6px]", i === topIdx ? "bg-[var(--a-accent)]" : "bg-[var(--a-chart)]")} style={{ height: `${h}%` }} />
              <span className="text-[11px] text-[var(--a-text-3)] pd-tabular truncate w-full text-center">{lbl}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const typeTotal = dailyReport
    ? (dailyReport.order_types.dine_in || 0) + (dailyReport.order_types.delivery || 0) + (dailyReport.order_types.takeaway || 0)
    : 0;

  return (
    <Page>
      <PageHeader
        title="Reports"
        subtitle="Business insights and performance"
        actions={
          <Segmented
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: "daily", label: "Daily" },
              { value: "period", label: "Period" },
              { value: "riders", label: "Riders", icon: Bike },
            ]}
          />
        }
      />

      {/* DAILY */}
      {activeTab === "daily" && (
        <>
          <Toolbar>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="!w-auto h-9 text-[14px]" aria-label="Report date" />
            <Button icon={RefreshCw} onClick={fetchDailyReport}>Load</Button>
          </Toolbar>

          {!dailyReport ? (
            <Card><ErrorState title="No report for this date" description="The daily report could not be loaded." onRetry={fetchDailyReport} /></Card>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Total sales" value={formatCurrency(dailyReport.summary.total_sales)} icon={DollarSign} tone="success" />
                <StatCard label="Orders" value={dailyReport.summary.total_orders} sub={`${dailyReport.summary.completed_orders} completed`} icon={ShoppingBag} />
                <StatCard label="Average order" value={formatCurrency(dailyReport.summary.average_order_value)} icon={TrendingUp} />
                <Card>
                  <div className="text-[13px] font-medium text-[var(--a-text-2)]">Order mix</div>
                  <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-[var(--a-chart-soft)]">
                    {typeTotal > 0 && [
                      ["dine_in", 1], ["delivery", 0.6], ["takeaway", 0.3],
                    ].map(([k, o]) => (
                      <div key={k} className="h-full bg-[var(--a-chart)]" style={{ width: `${(dailyReport.order_types[k] / typeTotal) * 100}%`, opacity: o }} />
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-3 text-[12px] text-[var(--a-text-2)]">
                    <div><div>Dine-in</div><div className="text-[15px] font-semibold text-[var(--a-text)] pd-tabular">{dailyReport.order_types.dine_in}</div></div>
                    <div><div>Delivery</div><div className="text-[15px] font-semibold text-[var(--a-text)] pd-tabular">{dailyReport.order_types.delivery}</div></div>
                    <div><div>Takeaway</div><div className="text-[15px] font-semibold text-[var(--a-text)] pd-tabular">{dailyReport.order_types.takeaway}</div></div>
                  </div>
                </Card>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Best selling items" subtitle="Top 5 by quantity" />
                  {dailyReport.best_selling_items.length === 0 ? (
                    <EmptyState icon={BarChart3} title="No sales data" className="py-8" />
                  ) : (
                    <HBars
                      rows={dailyReport.best_selling_items.slice(0, 5)}
                      valueKey="quantity"
                      label={(r, i) => <><span className="pd-tabular text-[var(--a-text-3)] mr-2">{i + 1}</span>{r.name}</>}
                      value={(r) => `${r.quantity} sold`}
                      sub={(r) => formatCurrency(r.revenue)}
                    />
                  )}
                </Card>
                <Card>
                  <CardHeader title="Peak hours" subtitle="Orders by hour" />
                  {dailyReport.peak_hours.length === 0 ? (
                    <EmptyState icon={Clock} title="No data" className="py-8" />
                  ) : (
                    <HBars
                      rows={dailyReport.peak_hours}
                      valueKey="orders"
                      label={(r) => `${fmtHour(r.hour)} – ${fmtHour(Number(r.hour) + 1)}`}
                      value={(r) => `${r.orders} orders`}
                      sub={r => (r.revenue !== undefined ? formatCurrency(r.revenue) : null)}
                    />
                  )}
                </Card>
              </div>

              {dailyReport.orders_per_table.length > 0 && (
                <section className="space-y-2">
                  <SectionTitle title="Orders per table" />
                  <Table>
                    <thead>
                      <tr><Th>Table</Th><Th align="right">Orders</Th><Th align="right">Revenue</Th></tr>
                    </thead>
                    <tbody>
                      {dailyReport.orders_per_table.map((table, idx) => (
                        <tr key={idx}>
                          <Td>Table {table.table}</Td>
                          <Td align="right">{table.orders}</Td>
                          <Td align="right">{formatCurrency(table.revenue)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </section>
              )}
            </>
          )}
        </>
      )}

      {/* PERIOD */}
      {activeTab === "period" && (
        <>
          <Toolbar>
            <FormField label="From" className="space-y-1">
              <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="!w-auto h-9 text-[14px]" />
            </FormField>
            <FormField label="To" className="space-y-1">
              <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="!w-auto h-9 text-[14px]" />
            </FormField>
            <Button variant="primary" className="self-end" onClick={fetchPeriodReport}>Generate Report</Button>
          </Toolbar>

          {!periodReport ? (
            <Card><ErrorState title="No report for this period" description="The period report could not be loaded." onRetry={fetchPeriodReport} /></Card>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <StatCard label="Total sales" value={formatCurrency(periodReport.summary.total_sales)} icon={DollarSign} tone="success" />
                <StatCard label="Orders" value={periodReport.summary.total_orders} icon={ShoppingBag} />
                <StatCard label="Daily average" value={formatCurrency(periodReport.summary.average_daily_revenue)} icon={TrendingUp} />
              </div>

              {periodReport.daily_breakdown.length > 0 && (
                <Card>
                  <CardHeader title="Revenue by day" subtitle="Highest day highlighted" />
                  <Columns rows={periodReport.daily_breakdown} />
                </Card>
              )}

              <section className="space-y-2">
                <SectionTitle title="Daily breakdown" />
                <Table>
                  <thead>
                    <tr>
                      <Th>Date</Th><Th align="right">Orders</Th><Th align="right">Dine-in</Th>
                      <Th align="right">Delivery</Th><Th align="right">Takeaway</Th><Th align="right">Revenue</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodReport.daily_breakdown.map((day, idx) => (
                      <tr key={idx}>
                        <Td>{day.date}</Td>
                        <Td align="right">{day.orders}</Td>
                        <Td align="right" className="text-[var(--a-text-2)]">{day.dine_in ?? "—"}</Td>
                        <Td align="right" className="text-[var(--a-text-2)]">{day.delivery ?? "—"}</Td>
                        <Td align="right" className="text-[var(--a-text-2)]">{day.takeaway ?? "—"}</Td>
                        <Td align="right" className="font-medium">{formatCurrency(day.revenue)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </section>

              <Card>
                <CardHeader title="Top selling items" subtitle="Top 10 by quantity" />
                {periodReport.best_selling_items.length === 0 ? (
                  <EmptyState icon={BarChart3} title="No sales data" className="py-8" />
                ) : (
                  <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
                    <HBars
                      rows={periodReport.best_selling_items.slice(0, 10)}
                      valueKey="quantity"
                      label={(r, i) => <><span className="pd-tabular text-[var(--a-text-3)] mr-2">{i + 1}</span>{r.name}</>}
                      value={(r) => `${r.quantity} sold`}
                      sub={(r) => formatCurrency(r.revenue)}
                    />
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {/* RIDERS */}
      {activeTab === "riders" && (
        <>
          <SectionTitle
            title="Rider delivery performance"
            action={<Button icon={RefreshCw} onClick={fetchRiderStats}>Refresh</Button>}
          />
          {loadingRiders ? (
            <LoadingState rows={3} label="Loading rider stats" />
          ) : riderStats.length === 0 ? (
            <Card><EmptyState icon={Bike} title="No delivery data yet" description="Stats appear once orders are delivered." /></Card>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Riders" value={riderStats.length} icon={Bike} />
                <StatCard label="Deliveries" value={riderStats.reduce((sum, r) => sum + r.deliveries, 0)} icon={ShoppingBag} />
                <StatCard label="Total value" value={formatCurrency(riderStats.reduce((sum, r) => sum + r.total_value, 0))} icon={TrendingUp} tone="success" />
              </div>
              <Table>
                <thead>
                  <tr><Th>#</Th><Th>Rider</Th><Th align="right">Deliveries</Th><Th align="right">Total value</Th><Th align="right">Last active</Th></tr>
                </thead>
                <tbody>
                  {riderStats.map((rider, idx) => (
                    <tr key={rider.rider_id || idx}>
                      <Td className="text-[var(--a-text-3)] w-10">{idx + 1}</Td>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <span className="h-8 w-8 rounded-full bg-[var(--a-fill)] flex items-center justify-center"><Bike className="h-4 w-4 text-[var(--a-text-2)]" /></span>
                          <span className="font-medium">{rider.rider_name || rider.name}</span>
                        </div>
                      </Td>
                      <Td align="right">{rider.deliveries}</Td>
                      <Td align="right">{formatCurrency(rider.total_value)}</Td>
                      <Td align="right" className="text-[var(--a-text-2)]">
                        {rider.last_delivered
                          ? new Date(rider.last_delivered).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </>
      )}
    </Page>
  );
};

export default Reports;
