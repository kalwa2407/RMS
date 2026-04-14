import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  DollarSign,
  ShoppingBag,
  Clock,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";

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

  const API_BASE = (process.env.REACT_APP_BACKEND_URL || "");
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
  }, [API_BASE, token, selectedDate]);

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
  }, [API_BASE, token, dateRange]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchDailyReport(), fetchPeriodReport()]);
      setLoading(false);
    };
    fetchData();
  }, [fetchDailyReport, fetchPeriodReport]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-primary">Reports & Analytics</h1>
            <p className="text-gray-400 text-sm">Business insights and performance</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setActiveTab("daily")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === "daily"
              ? "bg-primary text-black"
              : "bg-white/[0.03] text-gray-300 hover:text-white"
          }`}
        >
          Daily Report
        </button>
        <button
          onClick={() => setActiveTab("period")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === "period"
              ? "bg-primary text-black"
              : "bg-white/[0.03] text-gray-300 hover:text-white"
          }`}
        >
          Period Report
        </button>
      </div>

      {/* Daily Report */}
      {activeTab === "daily" && dailyReport && (
        <div>
          {/* Date Selector */}
          <div className="flex items-center space-x-4 mb-6">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/[0.03] text-white px-4 py-2 rounded-lg border border-white/5"
            />
            <button
              onClick={fetchDailyReport}
              className="bg-primary text-black px-4 py-2 rounded-lg font-bold"
            >
              Load
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/[0.03] rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-400 mb-2">
                <DollarSign className="h-5 w-5" />
                <span>Total Sales</span>
              </div>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(dailyReport.summary.total_sales)}
              </p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-400 mb-2">
                <ShoppingBag className="h-5 w-5" />
                <span>Total Orders</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {dailyReport.summary.total_orders}
              </p>
              <p className="text-sm text-green-500">
                {dailyReport.summary.completed_orders} completed
              </p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-400 mb-2">
                <DollarSign className="h-5 w-5" />
                <span>Avg Order Value</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(dailyReport.summary.average_order_value)}
              </p>
            </div>
          </div>

          {/* Order Types */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/[0.03] rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm">Dine-in</p>
              <p className="text-3xl font-bold text-primary">
                {dailyReport.order_types.dine_in}
              </p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm">Delivery</p>
              <p className="text-3xl font-bold text-blue-500">
                {dailyReport.order_types.delivery}
              </p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm">Takeaway</p>
              <p className="text-3xl font-bold text-purple-500">
                {dailyReport.order_types.takeaway}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Best Selling Items */}
            <div className="bg-white/[0.03] rounded-xl p-4">
              <h3 className="text-lg font-bold text-primary mb-4">Best Selling Items</h3>
              {dailyReport.best_selling_items.length === 0 ? (
                <p className="text-gray-400">No sales data</p>
              ) : (
                <div className="space-y-3">
                  {dailyReport.best_selling_items.slice(0, 5).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-[#050b10] rounded-lg p-3"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-primary text-black rounded-full flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-white">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-bold">{item.quantity} sold</p>
                        <p className="text-gray-400 text-sm">
                          {formatCurrency(item.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Peak Hours */}
            <div className="bg-white/[0.03] rounded-xl p-4">
              <h3 className="text-lg font-bold text-primary mb-4">Peak Hours</h3>
              {dailyReport.peak_hours.length === 0 ? (
                <p className="text-gray-400">No data</p>
              ) : (
                <div className="space-y-3">
                  {dailyReport.peak_hours.map((hour, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-[#050b10] rounded-lg p-3"
                    >
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <span className="text-white">
                          {hour.hour}:00 - {hour.hour}:59
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{hour.orders} orders</p>
                        <p className="text-gray-400 text-sm">
                          {formatCurrency(hour.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Orders per Table */}
          {dailyReport.orders_per_table.length > 0 && (
            <div className="bg-white/[0.03] rounded-xl p-4 mt-6">
              <h3 className="text-lg font-bold text-primary mb-4">Orders per Table</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {dailyReport.orders_per_table.map((table, idx) => (
                  <div
                    key={idx}
                    className="bg-[#050b10] rounded-lg p-3 text-center"
                  >
                    <p className="text-primary font-bold">Table {table.table}</p>
                    <p className="text-white">{table.orders} orders</p>
                    <p className="text-gray-400 text-sm">
                      {formatCurrency(table.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Period Report */}
      {activeTab === "period" && periodReport && (
        <div>
          {/* Date Range Selector */}
          <div className="flex items-center space-x-4 mb-6 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">From:</span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="bg-white/[0.03] text-white px-4 py-2 rounded-lg border border-white/5"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">To:</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="bg-white/[0.03] text-white px-4 py-2 rounded-lg border border-white/5"
              />
            </div>
            <button
              onClick={fetchPeriodReport}
              className="bg-primary text-black px-4 py-2 rounded-lg font-bold"
            >
              Generate Report
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/[0.03] rounded-xl p-4">
              <p className="text-gray-400 text-sm">Total Sales</p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(periodReport.summary.total_sales)}
              </p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4">
              <p className="text-gray-400 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-white">
                {periodReport.summary.total_orders}
              </p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4">
              <p className="text-gray-400 text-sm">Daily Avg Revenue</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(periodReport.summary.average_daily_revenue)}
              </p>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="bg-white/[0.03] rounded-xl p-4 mb-6">
            <h3 className="text-lg font-bold text-primary mb-4">Daily Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-white/5">
                    <th className="text-left py-2">Date</th>
                    <th className="text-center py-2">Orders</th>
                    <th className="text-center py-2">Dine-in</th>
                    <th className="text-center py-2">Delivery</th>
                    <th className="text-center py-2">Takeaway</th>
                    <th className="text-right py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {periodReport.daily_breakdown.map((day, idx) => (
                    <tr key={idx} className="border-b border-white/5">
                      <td className="py-3 text-white">{day.date}</td>
                      <td className="py-3 text-center text-white">{day.orders}</td>
                      <td className="py-3 text-center text-primary">{day.dine_in}</td>
                      <td className="py-3 text-center text-blue-500">{day.delivery}</td>
                      <td className="py-3 text-center text-purple-500">{day.takeaway}</td>
                      <td className="py-3 text-right text-green-500">
                        {formatCurrency(day.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Best Selling */}
          <div className="bg-white/[0.03] rounded-xl p-4">
            <h3 className="text-lg font-bold text-primary mb-4">Top Selling Items</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {periodReport.best_selling_items.slice(0, 10).map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-[#050b10] rounded-lg p-3"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-primary text-black rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-white">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-bold">{item.quantity} sold</p>
                    <p className="text-gray-400 text-sm">
                      {formatCurrency(item.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;


