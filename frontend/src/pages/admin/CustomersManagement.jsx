import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Users,
  Search,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  UtensilsCrossed,
  Coins,
  ArrowUpDown,
  ExternalLink,
  MessageCircle,
  Eye,
  X,
  Sparkles,
  Crown,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Receipt,
  UserCheck,
  Smartphone,
  Globe,
  RefreshCw,
  Award,
  Filter,
  DollarSign,
  LayoutGrid,
  List,
  Copy,
  Check
} from "lucide-react";
import API_BASE from "../../lib/config";
import { useToast } from "../../hooks/use-toast";
import { cx, Page, PageHeader, Card, StatCard, Table, Th, Td, Button, Segmented, SearchField, Select, StatusPill, Sheet, FormGroup, EmptyState, LoadingState } from "./ui";

export default function CustomersManagement() {
  const { toast } = useToast();
  const token = localStorage.getItem("admin_token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedUid, setCopiedUid] = useState(null);
  const [dataPayload, setDataPayload] = useState({
    customers: [],
    total_count: 0,
    google_count: 0,
    phone_count: 0,
    total_orders_all: 0,
    total_spent_all: 0,
    total_reservations_all: 0
  });

  // UI Filter / View states
  // 'all' | 'google' | 'phone'
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("spent_desc"); // 'spent_desc' | 'orders_desc' | 'res_desc' | 'newest' | 'coins_desc'
  const [activityFilter, setActivityFilter] = useState("all"); // 'all' | 'has_orders' | 'has_res' | 'vip'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // Modal / Dossier state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dossierTab, setDossierTab] = useState("dishes"); // 'dishes' | 'orders' | 'reservations' | 'coins'

  // Fetch all customers & metrics from backend
  const fetchCustomers = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await axios.get(`${API_BASE}/api/admin/customers`, { headers });
      if (res.data && res.data.success) {
        setDataPayload(res.data);
      } else {
        throw new Error(res.data?.detail || "Could not retrieve customers list");
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      toast({
        title: "Sync Error",
        description: err.response?.data?.detail || err.message || "Failed to load customer records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [headers, toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Keep selectedCustomer updated if data refreshes
  useEffect(() => {
    if (selectedCustomer) {
      const updated = dataPayload.customers.find(
        (c) => c.uid === selectedCustomer.uid || c._id === selectedCustomer._id
      );
      if (updated) setSelectedCustomer(updated);
    }
  }, [dataPayload.customers, selectedCustomer]);

  // Filtered & Sorted Customer list
  const filteredCustomers = useMemo(() => {
    let list = [...(dataPayload.customers || [])];

    // 1. Tab segmentation (Google vs Phone)
    if (activeTab === "google") {
      list = list.filter((c) => c.provider === "google");
    } else if (activeTab === "phone") {
      list = list.filter((c) => c.provider === "phone");
    }

    // 2. Search query filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const nameMatch = (c.name || "").toLowerCase().includes(q);
        const phoneMatch = (c.phone || "").includes(q);
        const emailMatch = (c.email || "").toLowerCase().includes(q);
        const uidMatch = (c.uid || "").toLowerCase().includes(q);
        return nameMatch || phoneMatch || emailMatch || uidMatch;
      });
    }

    // 3. Activity filter
    if (activityFilter === "has_orders") {
      list = list.filter((c) => c.total_orders > 0);
    } else if (activityFilter === "has_res") {
      list = list.filter((c) => c.total_reservations > 0);
    } else if (activityFilter === "vip") {
      list = list.filter((c) => (c.total_spent || 0) >= 1000 || (c.total_orders || 0) >= 3);
    }

    // 4. Sorting
    list.sort((a, b) => {
      if (sortBy === "spent_desc") return (b.total_spent || 0) - (a.total_spent || 0);
      if (sortBy === "orders_desc") return (b.total_orders || 0) - (a.total_orders || 0);
      if (sortBy === "res_desc") return (b.total_reservations || 0) - (a.total_reservations || 0);
      if (sortBy === "coins_desc") return (b.pd_coins || 0) - (a.pd_coins || 0);
      if (sortBy === "newest") {
        const dateA = a.created_at || a.last_active || "";
        const dateB = b.created_at || b.last_active || "";
        return dateB.localeCompare(dateA);
      }
      return 0;
    });

    return list;
  }, [dataPayload.customers, activeTab, searchQuery, activityFilter, sortBy]);

  // Copy helper
  const handleCopy = (text, uid) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  // Format date helpers
  const formatDate = (isoStr) => {
    if (!isoStr) return "N/A";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return isoStr;
    }
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return "N/A";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return isoStr;
    }
  };

  const pct = (n) => (dataPayload.total_count ? Math.round((n / dataPayload.total_count) * 100) : 0);
  const openDossier = (customer) => { setSelectedCustomer(customer); setDossierTab("dishes"); };
  const Avatar = ({ customer, size = "md" }) => {
    const cls = size === "lg" ? "h-14 w-14 text-[20px]" : size === "sm" ? "h-9 w-9 text-[14px]" : "h-11 w-11 text-[16px]";
    return customer.picture ? (
      <img src={customer.picture} alt={customer.name} className={cx(cls, "rounded-full object-cover border border-[var(--a-line)] shrink-0")} />
    ) : (
      <div className={cx(cls, "rounded-full bg-[var(--a-info-tint)] text-[var(--a-info)] font-semibold flex items-center justify-center shrink-0")}>
        {(customer.name || "U").charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <Page>
      <PageHeader
        title="Customers"
        subtitle={<span className="pd-tabular">{dataPayload.total_count} registered customers</span>}
        actions={
          <Button icon={RefreshCw} onClick={() => fetchCustomers(true)} disabled={refreshing} title="Reload customer metrics">
            {refreshing ? "Syncing…" : "Refresh"}
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="All customers" value={dataPayload.total_count} sub="Registered accounts" icon={Users}
          onClick={() => setActiveTab("all")} className={activeTab === "all" ? "ring-2 ring-[var(--a-accent)]/40" : ""} />
        <StatCard label="Google sign-in" value={dataPayload.google_count} sub={`${pct(dataPayload.google_count)}% of customers`} icon={Globe} tone="info"
          onClick={() => setActiveTab("google")} className={activeTab === "google" ? "ring-2 ring-[var(--a-accent)]/40" : ""} />
        <StatCard label="Phone OTP" value={dataPayload.phone_count} sub={`${pct(dataPayload.phone_count)}% of customers`} icon={Smartphone} tone="success"
          onClick={() => setActiveTab("phone")} className={activeTab === "phone" ? "ring-2 ring-[var(--a-accent)]/40" : ""} />
        <StatCard label="Lifetime spend" value={`₹${Number(dataPayload.total_spent_all || 0).toLocaleString("en-IN")}`}
          sub={`${dataPayload.total_orders_all} orders · ${dataPayload.total_reservations_all} bookings`} icon={TrendingUp} tone="gold" />
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <Segmented
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: "all", label: `All (${dataPayload.total_count})`, icon: Users },
              { value: "google", label: `Google (${dataPayload.google_count})`, icon: Globe },
              { value: "phone", label: `Mobile OTP (${dataPayload.phone_count})`, icon: Smartphone },
            ]}
          />
          <Segmented
            size="sm"
            value={activityFilter}
            onChange={setActivityFilter}
            options={[
              { value: "all", label: "Any activity" },
              { value: "has_orders", label: "Has Orders" },
              { value: "has_res", label: "Has Bookings" },
              { value: "vip", label: "VIP", icon: Crown },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Name, phone, email or user ID" className="flex-1" />
          <div className="flex items-center gap-2">
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-9 text-[14px] w-auto" aria-label="Sort customers">
              <option value="spent_desc">Highest lifetime spend</option>
              <option value="orders_desc">Most orders</option>
              <option value="res_desc">Most table bookings</option>
              <option value="newest">Newest registered</option>
              <option value="coins_desc">Most PD Coins</option>
            </Select>
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[{ value: "grid", label: "Cards", icon: LayoutGrid }, { value: "table", label: "Table", icon: List }]}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState rows={6} label="Loading customers" />
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No customers found"
            description={searchQuery ? `No customer matches "${searchQuery}".` : "No customers in this segment."}
            action={(searchQuery || activityFilter !== "all") && (
              <Button onClick={() => { setSearchQuery(""); setActivityFilter("all"); setActiveTab("all"); }}>Reset Filters</Button>
            )}
          />
        </Card>
      ) : viewMode === "grid" ? (
        <div className="space-y-2">
          <p className="px-1 text-[13px] text-[var(--a-text-2)] pd-tabular">{filteredCustomers.length} customers</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredCustomers.map((customer) => {
              const isGoogle = customer.provider === "google";
              const totalSpent = Number(customer.total_spent || 0);
              const isVip = totalSpent >= 2500 || (customer.total_orders || 0) >= 4;
              const topDish = customer.favorite_items && customer.favorite_items.length > 0 ? customer.favorite_items[0] : null;

              return (
                <Card
                  key={customer.uid || customer._id}
                  padded={false}
                  onClick={() => openDossier(customer)}
                  className="flex flex-col cursor-pointer hover:bg-[var(--a-inset)] transition-colors"
                >
                  <div className="flex items-start gap-3 p-4">
                    <Avatar customer={customer} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[15px] font-semibold text-[var(--a-text)] truncate">{customer.name || "Guest"}</span>
                        {isVip && <StatusPill tone="gold" icon={Crown}>VIP</StatusPill>}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <StatusPill tone={isGoogle ? "info" : "success"} icon={isGoogle ? Globe : Smartphone}>{isGoogle ? "Google" : "Phone OTP"}</StatusPill>
                        {customer.is_guest && <StatusPill tone="neutral">Guest</StatusPill>}
                      </div>
                      <div className="mt-1 text-[12px] text-[var(--a-text-3)] pd-tabular">Joined {formatDate(customer.created_at)}</div>
                    </div>
                  </div>

                  {(customer.phone || customer.email) && (
                    <div className="px-4 pb-3 space-y-1 text-[13px]">
                      {customer.phone && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-[var(--a-text)] pd-tabular"><Phone className="h-3.5 w-3.5 text-[var(--a-text-3)]" />+91 {customer.phone}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(`+91${customer.phone}`, customer.uid); }}
                            className="p-1 rounded-[6px] text-[var(--a-text-3)] hover:bg-[var(--a-fill)] cursor-pointer"
                            title="Copy Phone Number"
                          >
                            {copiedUid === customer.uid ? <Check className="h-3.5 w-3.5 text-[var(--a-success)]" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-[var(--a-text-2)] truncate"><Mail className="h-3.5 w-3.5 text-[var(--a-text-3)] shrink-0" /><span className="truncate">{customer.email}</span></div>
                      )}
                    </div>
                  )}

                  <div className="mx-4 grid grid-cols-3 rounded-[12px] bg-[var(--a-inset)] divide-x divide-[var(--a-line)] text-center">
                    <div className="py-2">
                      <div className="text-[12px] text-[var(--a-text-3)]">Orders</div>
                      <div className="text-[15px] font-semibold pd-tabular">{customer.total_orders || 0}</div>
                      <div className="text-[12px] text-[var(--a-text-2)] pd-tabular">₹{totalSpent.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="py-2">
                      <div className="text-[12px] text-[var(--a-text-3)]">Bookings</div>
                      <div className="text-[15px] font-semibold pd-tabular">{customer.total_reservations || 0}</div>
                    </div>
                    <div className="py-2">
                      <div className="text-[12px] text-[var(--a-text-3)]">Coins</div>
                      <div className="text-[15px] font-semibold pd-tabular text-[var(--a-gold)]">{customer.pd_coins || 0}</div>
                    </div>
                  </div>

                  <div className="px-4 pt-3 text-[13px] leading-[18px]">
                    {topDish ? (
                      <span className="text-[var(--a-text-2)]">
                        Favourite: <span className="text-[var(--a-text)] font-medium">{topDish.name}</span>{" "}
                        <span className="pd-tabular">({topDish.count}×, ₹{topDish.total_spent})</span>
                      </span>
                    ) : (
                      <span className="text-[var(--a-text-3)]">No orders placed yet</span>
                    )}
                  </div>

                  <div className="mt-auto px-4 py-3 mt-3 border-t border-[var(--a-line)] flex items-center gap-2">
                    <Button size="sm" variant="tinted" icon={Eye} className="flex-1" onClick={(e) => { e.stopPropagation(); openDossier(customer); }}>
                      View Profile
                    </Button>
                    {customer.phone && (
                      <>
                        <a
                          href={`https://wa.me/91${customer.phone}?text=${encodeURIComponent(`Hello ${customer.name || "Customer"}, greetings from Persian Darbar Camp, Pune!`)}`}
                          target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          className="h-8 w-8 rounded-[10px] flex items-center justify-center bg-[var(--a-success-tint)] text-[var(--a-success)] pd-press"
                          title="Chat on WhatsApp" aria-label="Chat on WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                        <a
                          href={`tel:${customer.phone}`} onClick={(e) => e.stopPropagation()}
                          className="h-8 w-8 rounded-[10px] flex items-center justify-center bg-[var(--a-fill)] text-[var(--a-text-2)] pd-press"
                          title="Call Customer" aria-label="Call Customer"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th>Contact</Th>
              <Th align="right">Orders</Th>
              <Th align="right">Spend</Th>
              <Th align="right">Bookings</Th>
              <Th align="right">Coins</Th>
              <Th>Favourite item</Th>
              <Th align="right"> </Th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer) => {
              const isGoogle = customer.provider === "google";
              const topDish = customer.favorite_items && customer.favorite_items.length > 0 ? customer.favorite_items[0] : null;
              const totalSpent = Number(customer.total_spent || 0);
              return (
                <tr key={customer.uid || customer._id} onClick={() => openDossier(customer)} className="cursor-pointer hover:bg-[var(--a-fill)]">
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar customer={customer} size="sm" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{customer.name || "Guest"}</div>
                        <div className="text-[12px] text-[var(--a-text-3)]">{isGoogle ? "Google" : "Phone OTP"}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    {customer.phone && <div className="pd-tabular">+91 {customer.phone}</div>}
                    {customer.email && <div className="text-[12px] text-[var(--a-text-3)] truncate max-w-[200px]">{customer.email}</div>}
                  </Td>
                  <Td align="right">{customer.total_orders || 0}</Td>
                  <Td align="right">₹{totalSpent.toLocaleString("en-IN")}</Td>
                  <Td align="right">{customer.total_reservations || 0}</Td>
                  <Td align="right">{customer.pd_coins || 0}</Td>
                  <Td>
                    {topDish ? (
                      <div className="max-w-[200px]">
                        <div className="truncate">{topDish.name}</div>
                        <div className="text-[12px] text-[var(--a-text-3)]">{topDish.count}× ordered</div>
                      </div>
                    ) : <span className="text-[var(--a-text-3)]">—</span>}
                  </Td>
                  <Td align="right">
                    <Button size="sm" variant="plain" onClick={(e) => { e.stopPropagation(); openDossier(customer); }}>Profile</Button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* Customer profile */}
      <Sheet
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        size="lg"
        title={selectedCustomer?.name || "Customer profile"}
        subtitle={selectedCustomer ? (selectedCustomer.provider === "google" ? "Google account" : "Mobile phone OTP") : ""}
        footer={selectedCustomer && (
          <>
            {selectedCustomer.phone && (
              <>
                <a
                  href={`https://wa.me/91${selectedCustomer.phone}?text=${encodeURIComponent(`Hello ${selectedCustomer.name || "Customer"}, greetings from Persian Darbar! We appreciate your loyalty with us.`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[10px] text-[14px] font-medium bg-[var(--a-success-tint)] text-[var(--a-success)] pd-press"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <a href={`tel:${selectedCustomer.phone}`} className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[10px] text-[14px] font-medium bg-[var(--a-fill)] text-[var(--a-text)] pd-press">
                  <Phone className="h-4 w-4" /> Call
                </a>
              </>
            )}
            {selectedCustomer.email && (
              <a href={`mailto:${selectedCustomer.email}?subject=Greetings%20from%20Persian%20Darbar`} className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[10px] text-[14px] font-medium bg-[var(--a-fill)] text-[var(--a-text)] pd-press">
                <Mail className="h-4 w-4" /> Email
              </a>
            )}
            <Button variant="secondary" className="ml-auto" onClick={() => setSelectedCustomer(null)}>Close</Button>
          </>
        )}
      >
        {selectedCustomer && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar customer={selectedCustomer} size="lg" />
              <div className="min-w-0 text-[14px] space-y-0.5">
                {selectedCustomer.phone && <div className="flex items-center gap-1.5 pd-tabular"><Phone className="h-3.5 w-3.5 text-[var(--a-text-3)]" />+91 {selectedCustomer.phone}</div>}
                {selectedCustomer.email && <div className="flex items-center gap-1.5 text-[var(--a-text-2)] truncate"><Mail className="h-3.5 w-3.5 text-[var(--a-text-3)]" />{selectedCustomer.email}</div>}
                <div className="text-[12px] text-[var(--a-text-3)] truncate">ID {selectedCustomer.uid}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 rounded-[12px] border border-[var(--a-line)] bg-[var(--a-card)] divide-x divide-y sm:divide-y-0 divide-[var(--a-line)] text-center">
              {[
                ["Orders", selectedCustomer.total_orders || 0],
                ["Lifetime spend", `₹${Number(selectedCustomer.total_spent || 0).toLocaleString("en-IN")}`],
                ["Reservations", selectedCustomer.total_reservations || 0],
                ["PD Coins", selectedCustomer.pd_coins || 0],
              ].map(([l, v]) => (
                <div key={l} className="py-3">
                  <div className="text-[12px] text-[var(--a-text-3)]">{l}</div>
                  <div className="text-[20px] font-semibold pd-tabular">{v}</div>
                </div>
              ))}
            </div>

            <Segmented
              value={dossierTab}
              onChange={setDossierTab}
              options={[
                { value: "dishes", label: `Dishes (${selectedCustomer.favorite_items?.length || 0})`, icon: UtensilsCrossed },
                { value: "orders", label: `Orders (${selectedCustomer.orders?.length || 0})`, icon: ShoppingBag },
                { value: "reservations", label: `Bookings (${selectedCustomer.reservations?.length || 0})`, icon: Calendar },
                { value: "coins", label: "Coins", icon: Coins },
              ]}
            />

            {dossierTab === "dishes" && (
              !selectedCustomer.favorite_items || selectedCustomer.favorite_items.length === 0 ? (
                <EmptyState icon={UtensilsCrossed} title="No food orders recorded" description="This customer has not completed any food orders yet." />
              ) : (
                <FormGroup footer="Lifetime count of every dish this customer has ordered.">
                  {selectedCustomer.favorite_items.map((item, idx) => {
                    const maxCount = selectedCustomer.favorite_items[0].count || 1;
                    const percentage = Math.round((item.count / maxCount) * 100);
                    return (
                      <div key={idx} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-5 text-[13px] text-[var(--a-text-3)] pd-tabular">{idx + 1}</span>
                            <span className="text-[15px] truncate">{item.name}</span>
                          </div>
                          <div className="text-right text-[13px] pd-tabular shrink-0">
                            <span className="text-[var(--a-text)]">{item.count}×</span>
                            <span className="text-[var(--a-text-3)]"> · ₹{Number(item.total_spent || 0).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                        <div className="mt-2 ml-8 h-1 rounded-full bg-[var(--a-chart-soft)] overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--a-chart)]" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </FormGroup>
              )
            )}

            {dossierTab === "orders" && (
              !selectedCustomer.orders || selectedCustomer.orders.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="No orders on record" />
              ) : (
                <div className="space-y-3">
                  {selectedCustomer.orders.map((ord, idx) => {
                    const oid = ord.order_id || ord._id || ord.id || `ORD-${idx + 1}`;
                    const orderTotal = ord.total || ord.total_amount || ord.final_amount || 0;
                    const status = (ord.status || "completed").toLowerCase();
                    const tone = status === "completed" || status === "delivered" ? "success" : status === "cancelled" ? "error" : "warn";
                    return (
                      <div key={oid} className="rounded-[12px] border border-[var(--a-line)] bg-[var(--a-card)]">
                        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[var(--a-line)]">
                          <div className="flex items-center gap-2 flex-wrap text-[13px]">
                            <span className="font-semibold pd-tabular">{oid}</span>
                            <span className="text-[var(--a-text-3)] pd-tabular">{formatDateTime(ord.created_at || ord.timestamp)}</span>
                            {ord.order_type && <StatusPill tone="neutral">{ord.order_type}</StatusPill>}
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusPill tone={tone} dot><span className="capitalize">{status}</span></StatusPill>
                            <span className="text-[14px] font-semibold pd-tabular">₹{Number(orderTotal).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                        <div className="px-4 py-2 divide-y divide-[var(--a-line)]">
                          {ord.items && ord.items.map((it, itemIdx) => (
                            <div key={itemIdx} className="flex items-center justify-between py-1.5 text-[14px]">
                              <span><span className="pd-tabular text-[var(--a-text-3)] mr-1.5">{it.quantity || it.qty || 1}×</span>{it.name || it.title}</span>
                              <span className="pd-tabular text-[var(--a-text-2)]">₹{Number((it.price || 0) * (it.quantity || it.qty || 1)).toLocaleString("en-IN")}</span>
                            </div>
                          ))}
                        </div>
                        {ord.delivery_address && (
                          <div className="px-4 pb-3 text-[13px] text-[var(--a-text-2)]">Delivery address: {ord.delivery_address}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {dossierTab === "reservations" && (
              !selectedCustomer.reservations || selectedCustomer.reservations.length === 0 ? (
                <EmptyState icon={Calendar} title="No table bookings on record" />
              ) : (
                <FormGroup>
                  {selectedCustomer.reservations.map((res, idx) => {
                    const rid = res.id || res._id || `RES-${idx + 1}`;
                    const status = (res.status || "confirmed").toLowerCase();
                    const tone = status === "confirmed" ? "success" : status === "completed" ? "neutral" : status === "cancelled" ? "error" : "warn";
                    return (
                      <div key={rid} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] pd-tabular">{res.date || "Date"} · {res.time || "Time"}</span>
                            <StatusPill tone={tone} dot><span className="capitalize">{status}</span></StatusPill>
                          </div>
                          <div className="text-[13px] text-[var(--a-text-2)] pd-tabular">
                            {res.guests || res.guest_count || 2} guests{res.table_number ? ` · Table ${res.table_number}` : ""} · {rid}
                          </div>
                          {res.special_requests && <div className="text-[13px] text-[var(--a-text-3)] italic">“{res.special_requests}”</div>}
                        </div>
                        <div className="text-[12px] text-[var(--a-text-3)] pd-tabular shrink-0">Booked {formatDateTime(res.created_at)}</div>
                      </div>
                    );
                  })}
                </FormGroup>
              )
            )}

            {dossierTab === "coins" && (
              <div className="space-y-4">
                <div className="rounded-[12px] bg-[var(--a-gold-tint)] px-4 py-3">
                  <div className="text-[13px] text-[var(--a-text-2)]">Wallet balance</div>
                  <div className="text-[24px] font-semibold pd-tabular text-[var(--a-gold)]">{selectedCustomer.pd_coins || 0} PD Coins</div>
                  <div className="text-[13px] text-[var(--a-text-2)] pd-tabular">Worth ₹{selectedCustomer.pd_coins || 0} in discounts</div>
                </div>
                {!selectedCustomer.coins_history || selectedCustomer.coins_history.length === 0 ? (
                  <EmptyState icon={Coins} title="No coin transactions" />
                ) : (
                  <FormGroup title="Transactions">
                    {selectedCustomer.coins_history.map((tx, idx) => {
                      const isCredit = tx.type === "credit" || tx.type === "earned";
                      return (
                        <div key={idx} className="px-4 py-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[15px]">{tx.reason || tx.note || "Coin transaction"}</div>
                            <div className="text-[12px] text-[var(--a-text-3)] pd-tabular">{formatDateTime(tx.timestamp)}</div>
                          </div>
                          <div className={cx("text-[15px] font-semibold pd-tabular", isCredit ? "text-[var(--a-success)]" : "text-[var(--a-error)]")}>
                            {isCredit ? "+" : "−"}{tx.amount || tx.coins}
                          </div>
                        </div>
                      );
                    })}
                  </FormGroup>
                )}
              </div>
            )}
          </div>
        )}
      </Sheet>
    </Page>
  );
}
