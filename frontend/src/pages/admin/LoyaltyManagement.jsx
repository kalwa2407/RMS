import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Coins,
  Search,
  PlusCircle,
  MinusCircle,
  History,
  RotateCw,
  Crown,
  Sparkles,
  User,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  TrendingUp,
  Gift,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  FileText
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import API_BASE from "../../lib/config";
import { cx, Page, PageHeader, Card, SectionTitle, List, ListRow, Table, Th, Td, Button, Segmented, SearchField, StatusPill, Sheet, FormField, FormGroup, FormRow, Input, EmptyState, LoadingState } from "./ui";

const GOLD = "#EAB308";

export default function LoyaltyManagement() {
  const { toast } = useToast();
  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  // Search & Customers
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Global audit logs
  const [globalLogs, setGlobalLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState("search"); // 'search' | 'audit'

  // Modals
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  // Award Form
  const [billAmount, setBillAmount] = useState("");
  const [awardNote, setAwardNote] = useState("");
  const [submittingAward, setSubmittingAward] = useState(false);

  // Redeem Form
  const [redeemCoins, setRedeemCoins] = useState("");
  const [redeemNote, setRedeemNote] = useState("");
  const [submittingRedeem, setSubmittingRedeem] = useState(false);

  // Fetch Global Transactions (Audit Trail)
  const fetchGlobalLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/loyalty/transactions`, { headers });
      setGlobalLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch global transactions", err);
      toast({
        title: "Error",
        description: "Failed to load loyalty audit history",
        variant: "destructive",
      });
    } finally {
      setLoadingLogs(false);
    }
  }, [headers, toast]);

  useEffect(() => {
    fetchGlobalLogs();
  }, []);

  // Search Customers
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query || query.length < 2) {
      toast({
        title: "Input required",
        description: "Please enter at least 2 characters (phone number or name)",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/loyalty/search?q=${encodeURIComponent(query)}`, { headers });
      const results = Array.isArray(data) ? data : [];
      setSearchResults(results);
      if (results.length === 1) {
        setSelectedCustomer(results[0]);
      } else if (results.length === 0) {
        setSelectedCustomer(null);
      }
    } catch (err) {
      console.error("Search failed", err);
      toast({
        title: "Search Error",
        description: "Could not fetch customer data. Check server connection.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  // Re-fetch selected customer after award/redeem
  const refreshCustomer = async (customerId) => {
    if (!customerId) return;
    try {
      const { data } = await axios.get(`${API_BASE}/api/admin/loyalty/search?q=${encodeURIComponent(selectedCustomer.phone || selectedCustomer.name)}`, { headers });
      if (Array.isArray(data)) {
        const updated = data.find((c) => c._id === customerId);
        if (updated) {
          setSelectedCustomer(updated);
          // Also update search results list
          setSearchResults((prev) => prev.map((c) => (c._id === customerId ? updated : c)));
        }
      }
    } catch (err) {
      console.error("Failed to refresh customer", err);
    }
  };

  // Submit Award Coins
  const handleAwardCoins = async (e) => {
    e.preventDefault();
    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Bill Amount",
        description: "Please enter a valid bill amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    const calculatedCoins = Math.floor(amount * 0.10);
    if (calculatedCoins <= 0) {
      toast({
        title: "Amount Too Small",
        description: "Bill amount is too low to earn at least 1 PD Coin (minimum ₹10)",
        variant: "destructive",
      });
      return;
    }

    setSubmittingAward(true);
    try {
      const payload = {
        customer_id: selectedCustomer._id,
        bill_amount: amount,
        note: awardNote.trim() || `Dine-in bill ₹${amount.toLocaleString()}`,
      };
      const { data } = await axios.post(`${API_BASE}/api/admin/loyalty/award`, payload, { headers });

      if (data.success) {
        toast({
          title: "Coins Credited!",
          description: `Successfully awarded ${data.coins_awarded} PD Coins to ${data.customer_name}. New Balance: ${data.new_balance}`,
        });
        setShowAwardModal(false);
        setBillAmount("");
        setAwardNote("");
        await refreshCustomer(selectedCustomer._id);
        fetchGlobalLogs();
      }
    } catch (err) {
      console.error("Award error", err);
      toast({
        title: "Error Crediting Coins",
        description: err.response?.data?.detail || "Failed to award coins. Try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingAward(false);
    }
  };

  // Submit Redeem Coins
  const handleRedeemCoins = async (e) => {
    e.preventDefault();
    const coins = parseInt(redeemCoins, 10);
    const available = selectedCustomer?.pd_coins || 0;

    if (isNaN(coins) || coins <= 0) {
      toast({
        title: "Invalid Coin Count",
        description: "Please enter a positive number of coins to redeem",
        variant: "destructive",
      });
      return;
    }

    if (coins > available) {
      toast({
        title: "Insufficient Coins",
        description: `Customer only has ${available} PD Coins in wallet`,
        variant: "destructive",
      });
      return;
    }

    setSubmittingRedeem(true);
    try {
      const payload = {
        customer_id: selectedCustomer._id,
        coins_to_redeem: coins,
        note: redeemNote.trim() || `Redeemed for ₹${coins} bill discount`,
      };
      const { data } = await axios.post(`${API_BASE}/api/admin/loyalty/redeem`, payload, { headers });

      if (data.success) {
        toast({
          title: "Coins Redeemed!",
          description: `Successfully redeemed ${data.coins_redeemed} PD Coins (₹${data.discount_value} Discount). Remaining: ${data.new_balance}`,
        });
        setShowRedeemModal(false);
        setRedeemCoins("");
        setRedeemNote("");
        await refreshCustomer(selectedCustomer._id);
        fetchGlobalLogs();
      }
    } catch (err) {
      console.error("Redeem error", err);
      toast({
        title: "Error Redeeming Coins",
        description: err.response?.data?.detail || "Failed to redeem coins.",
        variant: "destructive",
      });
    } finally {
      setSubmittingRedeem(false);
    }
  };

  const calculatedAward = Math.floor((parseFloat(billAmount) || 0) * 0.10);
  const redeemDiscount = parseInt(redeemCoins, 10) || 0;

  const txMeta = (t) =>
    t === "earned" ? { tone: "success", sign: "+", Icon: ArrowUpRight, color: "text-[var(--a-success)]" }
    : t === "expired" ? { tone: "error", sign: "-", Icon: X, color: "text-[var(--a-error)]" }
    : { tone: "gold", sign: "-", Icon: ArrowDownRight, color: "text-[var(--a-gold)]" };

  const Avatar = ({ c, size = "h-10 w-10 text-[15px]" }) => (
    <span className={cx(size, "rounded-full bg-[var(--a-gold-tint)] text-[var(--a-gold)] font-semibold flex items-center justify-center shrink-0 overflow-hidden")}>
      {c.picture ? <img src={c.picture} alt={c.name} className="h-full w-full object-cover" /> : (c.name || "C").charAt(0).toUpperCase()}
    </span>
  );

  return (
    <Page>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            <img src="/pd_coin.png" alt="" className="h-9 w-9 object-contain" />
            Loyalty
          </span>
        }
        subtitle="Find a customer by phone or name, credit 10% of the bill as PD Coins, or redeem coins as a bill discount."
        actions={
          <>
            <Button
              icon={RotateCw}
              onClick={() => {
                if (selectedCustomer) refreshCustomer(selectedCustomer._id);
                fetchGlobalLogs();
              }}
              disabled={loadingLogs}
            >
              Refresh
            </Button>
            <Segmented
              value={activeTab}
              onChange={setActiveTab}
              options={[{ value: "search", label: "Lookup & Manage" }, { value: "audit", label: `Audit Log (${globalLogs.length})` }]}
            />
          </>
        }
      />

      {activeTab === "search" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lookup */}
          <div className="lg:col-span-5 space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Phone (e.g. 9876543210) or name" />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setSelectedCustomer(null);
                      setHasSearched(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--a-text-3)] hover:bg-[var(--a-fill-2)] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Button type="submit" variant="primary" disabled={searching}>{searching ? "Searching…" : "Search"}</Button>
            </form>

            <SectionTitle
              title={searching ? "Searching…" : hasSearched ? `Results (${searchResults.length})` : "Customers"}
              subtitle={!hasSearched && !searching ? "Enter the customer's 10-digit mobile number or full name." : undefined}
            />

            {searching ? (
              <LoadingState rows={3} label="Finding customers" />
            ) : hasSearched && searchResults.length === 0 ? (
              <Card>
                <EmptyState icon={AlertCircle} title="No customer found"
                  description={`Nobody matches "${searchQuery}". Ask whether they registered with another phone number or signed in on the app.`} />
              </Card>
            ) : !hasSearched ? (
              <Card><EmptyState icon={User} title="Search for a customer" description="Select a customer to credit coins or redeem a bill discount." /></Card>
            ) : (
              <List className="max-h-[520px] overflow-y-auto">
                {searchResults.map((cust) => {
                  const isSelected = selectedCustomer?._id === cust._id;
                  const coins = cust.pd_coins || 0;
                  return (
                    <ListRow
                      key={cust._id}
                      onClick={() => setSelectedCustomer(cust)}
                      className={isSelected ? "bg-[var(--a-fill-2)]" : ""}
                      leading={<Avatar c={cust} />}
                      title={<span className="flex items-center gap-1.5">{cust.name || "Valued Customer"}{coins > 500 && <Crown className="h-3.5 w-3.5 text-[var(--a-gold)]" />}</span>}
                      subtitle={<span className="pd-tabular">{cust.phone || "No phone listed"}</span>}
                      trailing={
                        <div className="text-right">
                          <div className="text-[15px] font-semibold pd-tabular text-[var(--a-text)]">{coins.toLocaleString()}</div>
                          <div className="text-[12px] text-[var(--a-text-3)] pd-tabular">≈ ₹{coins.toLocaleString()}</div>
                        </div>
                      }
                    />
                  );
                })}
              </List>
            )}
          </div>

          {/* Selected customer */}
          <div className="lg:col-span-7 space-y-4">
            {selectedCustomer ? (
              <>
                <Card className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar c={selectedCustomer} size="h-14 w-14 text-[20px]" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[20px] font-semibold text-[var(--a-text)] truncate">{selectedCustomer.name || "Customer"}</span>
                          <StatusPill tone={(selectedCustomer.pd_coins || 0) > 500 ? "gold" : "neutral"} icon={(selectedCustomer.pd_coins || 0) > 500 ? Crown : undefined}>
                            {(selectedCustomer.pd_coins || 0) > 500 ? "Royal Elite" : "Royal Patron"}
                          </StatusPill>
                        </div>
                        <div className="flex flex-wrap gap-x-3 text-[13px] text-[var(--a-text-2)]">
                          {selectedCustomer.phone && <span className="flex items-center gap-1 pd-tabular"><Phone className="h-3.5 w-3.5" />{selectedCustomer.phone}</span>}
                          {selectedCustomer.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3.5 w-3.5" />{selectedCustomer.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <div className="text-[13px] text-[var(--a-text-2)]">Coin balance</div>
                      <div className="flex items-center sm:justify-end gap-1.5">
                        <img src="/pd_coin.png" alt="" className="h-6 w-6 object-contain" />
                        <span className="text-[32px] leading-[38px] font-semibold pd-tabular">{(selectedCustomer.pd_coins || 0).toLocaleString()}</span>
                      </div>
                      <div className="text-[12px] text-[var(--a-text-3)] pd-tabular">Worth ₹{(selectedCustomer.pd_coins || 0).toLocaleString()} off</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button variant="primary" size="lg" icon={PlusCircle} onClick={() => setShowAwardModal(true)}>Award Coins (10% of Bill)</Button>
                    <Button size="lg" icon={MinusCircle} onClick={() => setShowRedeemModal(true)} disabled={(selectedCustomer.pd_coins || 0) <= 0}>Redeem Coins</Button>
                  </div>
                </Card>

                <section className="space-y-2">
                  <SectionTitle title="Loyalty history" subtitle={`${(selectedCustomer.coins_history || []).length} recorded activities`} />
                  {(!selectedCustomer.coins_history || selectedCustomer.coins_history.length === 0) ? (
                    <Card><EmptyState icon={History} title="No loyalty transactions yet" description="When this customer dines in, award 10% coins with the button above." /></Card>
                  ) : (
                    <List className="max-h-[420px] overflow-y-auto">
                      {[...selectedCustomer.coins_history].reverse().map((item, idx) => {
                        const isEarned = item.type === "earned";
                        const isExpired = item.type === "expired";
                        const m = txMeta(item.type);
                        return (
                          <div key={idx} className="flex items-center gap-3 px-4 py-3">
                            <span className="h-8 w-8 rounded-full bg-[var(--a-fill)] flex items-center justify-center shrink-0">
                              <m.Icon className={cx("h-4 w-4", m.color)} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-[15px] text-[var(--a-text)]">
                                {isEarned
                                  ? (item.note?.includes("online") ? "Online order cashback (10%)" : "Dine-in cashback (10%)")
                                  : isExpired ? "Expired (45-day policy)" : "Bill discount redemption"}
                              </div>
                              <div className="text-[13px] text-[var(--a-text-2)] truncate">
                                {item.note || (isEarned ? `Bill: ₹${item.bill_amount}` : isExpired ? "45-day auto expiry" : `Redeemed ${item.coins} coins`)}
                              </div>
                              <div className="text-[12px] text-[var(--a-text-3)] pd-tabular">
                                {item.timestamp ? new Date(item.timestamp).toLocaleString("en-IN") : "Just now"}
                                {item.awarded_by && ` · by @${item.awarded_by}`}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={cx("text-[15px] font-semibold pd-tabular", m.color)}>{m.sign}{item.coins}</div>
                              <div className="text-[12px] text-[var(--a-text-3)] pd-tabular">Bal {item.balance_after}</div>
                            </div>
                          </div>
                        );
                      })}
                    </List>
                  )}
                </section>
              </>
            ) : (
              <Card>
                <EmptyState
                  icon={Coins}
                  title="Select a customer to begin"
                  description="Search by mobile number, select the customer, then award 10% cashback on their bill or redeem their coins as an instant discount."
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-lg mx-auto pb-4">
                  {["Search the customer's mobile", "Enter the dine-in bill total", "10% is credited instantly"].map((t, i) => (
                    <div key={t} className="rounded-[10px] bg-[var(--a-inset)] px-3 py-2">
                      <div className="text-[12px] text-[var(--a-text-3)]">Step {i + 1}</div>
                      <div className="text-[13px] text-[var(--a-text)]">{t}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <section className="space-y-2">
          <SectionTitle title="Loyalty audit trail" subtitle="Last 50 coin awards and redemptions across all customers" />
          {loadingLogs ? (
            <LoadingState rows={5} label="Loading audit logs" />
          ) : globalLogs.length === 0 ? (
            <Card><EmptyState icon={Receipt} title="No loyalty transactions yet" description="Transactions appear here whenever an admin awards or redeems coins." /></Card>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th><Th>Customer</Th><Th>Type</Th><Th align="right">Coins</Th>
                  <Th align="right" className="hidden md:table-cell">Bill / discount</Th>
                  <Th className="hidden lg:table-cell">Staff</Th><Th className="hidden xl:table-cell">Note</Th>
                </tr>
              </thead>
              <tbody>
                {globalLogs.map((log, idx) => {
                  const isEarned = log.type === "earned";
                  const isExpired = log.type === "expired";
                  const m = txMeta(log.type);
                  return (
                    <tr key={idx} className="hover:bg-[var(--a-fill)]">
                      <Td className="text-[var(--a-text-2)] whitespace-nowrap">{log.timestamp ? new Date(log.timestamp).toLocaleString("en-IN") : "—"}</Td>
                      <Td>
                        <div className="font-medium">{log.customer_name || "Customer"}</div>
                        <div className="text-[12px] text-[var(--a-text-3)]">{log.customer_phone || "—"}</div>
                      </Td>
                      <Td><StatusPill tone={m.tone}>{isEarned ? "Awarded (10%)" : isExpired ? "Expired (45d)" : "Redeemed"}</StatusPill></Td>
                      <Td align="right" className={cx("font-semibold", m.color)}>{m.sign}{log.coins}</Td>
                      <Td align="right" className="hidden md:table-cell text-[var(--a-text-2)]">
                        {isEarned && log.bill_amount
                          ? `₹${Number(log.bill_amount).toLocaleString()}`
                          : log.discount_value
                          ? `₹${Number(log.discount_value).toLocaleString()} discount`
                          : isExpired ? "Auto expired" : "—"}
                      </Td>
                      <Td className="hidden lg:table-cell text-[var(--a-text-2)]">{isExpired ? "System (auto)" : `@${log.awarded_by || log.redeemed_by || "admin"}`}</Td>
                      <Td className="hidden xl:table-cell text-[var(--a-text-3)] max-w-xs truncate">{log.note || "—"}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </section>
      )}

      {/* Award */}
      <Sheet
        open={showAwardModal && !!selectedCustomer}
        onClose={() => setShowAwardModal(false)}
        size="sm"
        title="Award PD Coins"
        subtitle={selectedCustomer ? `To ${selectedCustomer.name} (${selectedCustomer.phone || "no phone"})` : ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAwardModal(false)}>Cancel</Button>
            <Button variant="primary" icon={CheckCircle2} type="submit" form="award-form" disabled={submittingAward || calculatedAward <= 0}>
              {submittingAward ? "Crediting…" : `Credit +${calculatedAward} Coins`}
            </Button>
          </>
        }
      >
        {selectedCustomer && (
          <form id="award-form" onSubmit={handleAwardCoins} className="space-y-4">
            <FormField label="Dine-in bill amount (₹)">
              <Input type="number" min="1" step="any" value={billAmount} onChange={(e) => setBillAmount(e.target.value)}
                placeholder="e.g. 2500" autoFocus required className="h-12 text-[20px] font-semibold pd-tabular" />
            </FormField>
            <div className="flex flex-wrap gap-1.5">
              {[500, 1000, 2000, 3500, 5000].map((preset) => (
                <Button key={preset} size="sm" variant="tinted" onClick={() => setBillAmount(preset.toString())}>₹{preset}</Button>
              ))}
            </div>
            <FormGroup>
              <FormRow label="Bill amount"><span className="text-[15px] pd-tabular">₹{parseFloat(billAmount || 0).toLocaleString()}</span></FormRow>
              <FormRow label="Reward rate"><span className="text-[15px] text-[var(--a-text-2)]">10% of bill</span></FormRow>
              <FormRow label="Coins to credit"><span className="text-[20px] font-semibold pd-tabular text-[var(--a-success)]">+{calculatedAward}</span></FormRow>
              <FormRow label="New balance"><span className="text-[15px] pd-tabular">{((selectedCustomer.pd_coins || 0) + calculatedAward).toLocaleString()} coins</span></FormRow>
            </FormGroup>
            <FormField label="Internal note (optional)">
              <Input type="text" value={awardNote} onChange={(e) => setAwardNote(e.target.value)} placeholder="e.g. Table #4 family dinner" />
            </FormField>
          </form>
        )}
      </Sheet>

      {/* Redeem */}
      <Sheet
        open={showRedeemModal && !!selectedCustomer}
        onClose={() => setShowRedeemModal(false)}
        size="sm"
        title="Redeem coins"
        subtitle={selectedCustomer ? `${selectedCustomer.name} · ${(selectedCustomer.pd_coins || 0).toLocaleString()} coins available` : ""}
        footer={selectedCustomer && (
          <>
            <Button variant="secondary" onClick={() => setShowRedeemModal(false)}>Cancel</Button>
            <Button variant="primary" icon={CheckCircle2} type="submit" form="redeem-form"
              disabled={submittingRedeem || redeemDiscount <= 0 || redeemDiscount > (selectedCustomer.pd_coins || 0)}>
              {submittingRedeem ? "Applying…" : `Apply ₹${redeemDiscount} Discount`}
            </Button>
          </>
        )}
      >
        {selectedCustomer && (
          <form id="redeem-form" onSubmit={handleRedeemCoins} className="space-y-4">
            <FormField label="Coins to redeem" hint="1 PD Coin = ₹1 discount">
              <Input type="number" min="1" max={selectedCustomer.pd_coins || 0} value={redeemCoins} onChange={(e) => setRedeemCoins(e.target.value)}
                placeholder={`Up to ${selectedCustomer.pd_coins || 0} coins`} autoFocus required className="h-12 text-[20px] font-semibold pd-tabular" />
            </FormField>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "25%", val: Math.floor((selectedCustomer.pd_coins || 0) * 0.25) },
                { label: "50%", val: Math.floor((selectedCustomer.pd_coins || 0) * 0.50) },
                { label: "75%", val: Math.floor((selectedCustomer.pd_coins || 0) * 0.75) },
                { label: "All", val: selectedCustomer.pd_coins || 0 },
              ].filter((p) => p.val > 0).map((preset) => (
                <Button key={preset.label} size="sm" variant="tinted" onClick={() => setRedeemCoins(preset.val.toString())}>{preset.label} ({preset.val})</Button>
              ))}
            </div>
            <FormGroup>
              <FormRow label="Coins deducted"><span className="text-[15px] pd-tabular text-[var(--a-error)]">-{redeemDiscount}</span></FormRow>
              <FormRow label="Bill discount"><span className="text-[20px] font-semibold pd-tabular">₹{redeemDiscount.toLocaleString()} off</span></FormRow>
              <FormRow label="Remaining balance"><span className="text-[15px] pd-tabular">{Math.max(0, (selectedCustomer.pd_coins || 0) - redeemDiscount).toLocaleString()} coins</span></FormRow>
            </FormGroup>
            <FormField label="Internal note (optional)">
              <Input type="text" value={redeemNote} onChange={(e) => setRedeemNote(e.target.value)} placeholder="e.g. Applied to Bill #1042" />
            </FormField>
          </form>
        )}
      </Sheet>
    </Page>
  );
}
