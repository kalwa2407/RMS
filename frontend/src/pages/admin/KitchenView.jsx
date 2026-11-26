import React, { useState, useEffect, useCallback } from "react";
import { ChefHat, Clock, RefreshCw, CheckCircle, AlertCircle, Printer } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import API_BASE from "../../lib/config";
import { Page, PageHeader, Card, Button, StatusPill, EmptyState, LoadingState } from "./ui";
import { printKOT } from "../../lib/PrintService";

const KitchenView = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // API_BASE is a module-level constant — no need in deps
  const fetchKitchenOrders = useCallback(async () => {
    // Always read token fresh to avoid stale closure
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${API_BASE}/api/admin/kitchen/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch kitchen orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchKitchenOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    const token = localStorage.getItem("admin_token");
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast({
          title: "Status Updated",
          description: `Order ${orderId} marked as ${newStatus}`,
        });
        fetchKitchenOrders();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getTimeSinceOrder = (createdAt) => {
    const diff = Math.floor((new Date() - new Date(createdAt)) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  };

  if (loading) {
    return <LoadingState rows={4} label="Loading kitchen orders" />;
  }

  return (
    <Page>
      <PageHeader
        title="Kitchen"
        subtitle={<span>Updated <span className="pd-tabular">{lastRefresh.toLocaleTimeString()}</span> · refreshes every 10 s</span>}
        actions={<Button icon={RefreshCw} onClick={fetchKitchenOrders}>Refresh</Button>}
      />

      {orders.length === 0 ? (
        <Card>
          <EmptyState icon={CheckCircle} title="All caught up" description="No pending orders in the kitchen." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {orders.map((order) => {
            const preparing = order.status === "preparing";
            return (
              <Card key={order.order_id} padded={false} className="flex flex-col">
                <div className="flex items-start justify-between gap-3 px-4 pt-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[17px] font-semibold pd-tabular text-[var(--a-text)]">{order.kot_number || order.order_id}</span>
                      {order.order_type === "DINE_IN" && order.table_number && (
                        <StatusPill tone="neutral">Table {order.table_number}</StatusPill>
                      )}
                    </div>
                    <div className="text-[13px] text-[var(--a-text-2)] truncate">{order.customer_name}</div>
                  </div>
                  <StatusPill tone={preparing ? "warn" : "info"} dot>
                    <span className="capitalize">{order.status}</span>
                  </StatusPill>
                </div>

                <div className="px-4 pt-1 flex items-center gap-1.5 text-[13px] text-[var(--a-text-2)]">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="pd-tabular">{getTimeSinceOrder(order.created_at)}</span>
                  {order.created_at && (
                    <span className="text-[var(--a-text-3)] pd-tabular">
                      · {new Date(order.created_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, day: "2-digit", month: "short" })}
                    </span>
                  )}
                </div>

                <div className="mx-4 mt-3 rounded-[12px] bg-[var(--a-inset)] divide-y divide-[var(--a-line)]">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="px-3 py-2 text-[15px]">
                      <div className="text-[var(--a-text)]">
                        <span className="pd-tabular font-semibold mr-2">{item.quantity}×</span>
                        {item.name}
                      </div>
                      {item.variant && <div className="pl-7 text-[13px] text-[var(--a-text-2)]">{item.variant}</div>}
                      {item.addons && item.addons.length > 0 && (
                        <div className="pl-7 text-[13px] text-[var(--a-text-2)]">+ {item.addons.join(", ")}</div>
                      )}
                      {item.special_instructions && (
                        <div className="pl-7 mt-0.5 flex items-center gap-1 text-[13px] text-[var(--a-warn)]">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {item.special_instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-auto p-4 flex gap-2">
                  <Button variant="tinted" icon={Printer} onClick={() => printKOT(order)} title="Print Kitchen Order Ticket (80mm Thermal)">KOT</Button>
                  {order.status === "accepted" && (
                    <Button variant="primary" className="flex-1" onClick={() => updateOrderStatus(order.order_id, "preparing")}>Start Preparing</Button>
                  )}
                  {preparing && (
                    <Button variant="success" className="flex-1" onClick={() => updateOrderStatus(order.order_id, "ready")}>Mark Ready</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
};

export default KitchenView;
