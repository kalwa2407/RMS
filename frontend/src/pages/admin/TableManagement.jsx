import React, { useState, useEffect, useCallback, useRef } from "react";
import { Grid3X3, Plus, Trash2, Users, Receipt, Printer, Edit2, Minus } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import API_BASE from "../../lib/config";
import { Page, PageHeader, Card, StatCard, Button, IconButton, Segmented, StatusPill, Sheet, FormField, Input, Select, EmptyState, LoadingState } from "./ui";

const TableManagement = () => {
  const { toast } = useToast();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showTicket, setShowTicket] = useState(null);
  const [newTable, setNewTable] = useState({ table_number: 1, capacity: 4 });
  const [bulkCreate, setBulkCreate] = useState({ count: 10, capacity: 4 });
  const printRef = useRef();

  const token = localStorage.getItem("admin_token");

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/tables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTables(await res.json());
    } catch (err) {
      console.error("Failed to fetch tables:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, token]);

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 5000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  const createTable = async () => {
    const tableNum = parseInt(newTable.table_number, 10);
    const capacity = parseInt(newTable.capacity, 10);
    if (!tableNum || isNaN(tableNum) || tableNum < 1) {
      toast({ title: "Validation Error", description: "Please enter a valid table number", variant: "destructive" });
      return;
    }
    if (!capacity || isNaN(capacity) || capacity < 1) {
      toast({ title: "Validation Error", description: "Capacity must be at least 1 seat", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ table_number: tableNum, capacity }),
      });
      if (res.ok) {
        toast({ title: "Success", description: `Table ${tableNum} created` });
        setShowAddModal(false);
        fetchTables();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Error", description: err.detail || "Failed to create table", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to connect to backend", variant: "destructive" });
    }
  };

  const openEditModal = (table) => {
    setEditingTable({
      table_number: table.table_number,
      capacity: table.capacity || 4,
      status: table.status || "free"
    });
    setShowEditModal(true);
  };

  const saveTableEdit = async () => {
    if (!editingTable) return;
    const capacity = parseInt(editingTable.capacity, 10);
    if (!capacity || isNaN(capacity) || capacity < 1) {
      toast({ title: "Validation Error", description: "Capacity must be at least 1 seat", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/tables/${editingTable.table_number}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          capacity,
          status: editingTable.status
        }),
      });
      if (res.ok) {
        toast({ title: "Updated", description: `Table ${editingTable.table_number} capacity set to ${capacity} seats` });
        setShowEditModal(false);
        setEditingTable(null);
        fetchTables();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Error", description: err.detail || "Failed to update table", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update table", variant: "destructive" });
    }
  };

  const bulkCreateTables = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/tables/bulk-create?count=${bulkCreate.count}&capacity=${bulkCreate.capacity}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Success", description: (await res.json()).message });
        setShowBulkModal(false);
        fetchTables();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to create tables", variant: "destructive" });
    }
  };

  const updateTableStatus = async (tableNumber, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/tables/${tableNumber}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({ title: "Updated", description: `Table ${tableNumber} marked as ${status}` });
        fetchTables();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update table", variant: "destructive" });
    }
  };

  const deleteTable = async (tableNumber) => {
    if (!window.confirm(`Delete Table ${tableNumber}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/tables/${tableNumber}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Deleted", description: `Table ${tableNumber} removed` });
        fetchTables();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete table", variant: "destructive" });
    }
  };

  const fetchTicket = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders?status=all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const orders = await res.json();
        const order = orders.find(o => o.order_id === orderId);
        if (order && order.kot_number) setShowTicket(order);
        else toast({ title: "No Ticket", description: "Order not yet accepted", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to fetch ticket", variant: "destructive" });
    }
  };

  const handlePrint = () => {
    const content = printRef.current;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>KOT - ${showTicket.kot_number}</title>
      <style>body{font-family:monospace;padding:20px;max-width:300px;margin:0 auto}
      h1{text-align:center;border-bottom:2px dashed #000;padding-bottom:10px}
      .item{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dotted #ccc}
      .total{font-weight:bold;font-size:18px;margin-top:10px;text-align:right}
      .footer{text-align:center;margin-top:20px;font-size:12px}</style></head>
      <body>${content.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const STATUS = {
    free: { label: "Free", tone: "success" },
    occupied: { label: "Occupied", tone: "accent" },
    reserved: { label: "Reserved", tone: "warn" },
  };
  const statusOf = (s) => STATUS[s] || { label: s || "Unknown", tone: "neutral" };

  const stats = {
    total: tables.length,
    free: tables.filter(t => t.status === "free").length,
    occupied: tables.filter(t => t.status === "occupied").length,
    reserved: tables.filter(t => t.status === "reserved").length,
  };

  if (loading) return <LoadingState rows={4} label="Loading tables" />;

  const capacityControl = (value, setValue, presets) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <IconButton icon={Minus} label="Decrease seats" onClick={() => setValue(Math.max(1, (parseInt(value) || 1) - 1))} />
        <Input type="number" min="1" value={value} onChange={(e) => setValue(parseInt(e.target.value) || "")} className="text-center font-semibold pd-tabular w-24" />
        <IconButton icon={Plus} label="Increase seats" onClick={() => setValue((parseInt(value) || 0) + 1)} />
      </div>
      <Segmented
        size="sm"
        value={value}
        onChange={(v) => setValue(v)}
        options={presets.map(c => ({ value: c, label: `${c} seats` }))}
      />
    </div>
  );

  return (
    <Page>
      <PageHeader
        title="Tables"
        subtitle="Manage tables and view KOT tickets"
        actions={
          <>
            <Button onClick={() => setShowBulkModal(true)}>Bulk Create</Button>
            <Button variant="primary" icon={Plus} onClick={() => { setNewTable({ table_number: tables.length + 1, capacity: 4 }); setShowAddModal(true); }}>
              Add Table
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} icon={Grid3X3} />
        <StatCard label="Free" value={stats.free} tone="success" />
        <StatCard label="Occupied" value={stats.occupied} tone="accent" />
        <StatCard label="Reserved" value={stats.reserved} tone="warn" />
      </div>

      {tables.length === 0 ? (
        <Card>
          <EmptyState icon={Grid3X3} title="No tables yet" description="Create your floor's tables to start taking dine-in orders."
            action={<Button variant="primary" onClick={() => setShowBulkModal(true)}>Create Tables</Button>} />
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {tables.map((table) => {
            const st = statusOf(table.status);
            return (
              <Card key={table.table_number} padded={false} className="p-3.5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[22px] leading-7 font-semibold text-[var(--a-text)] pd-tabular">T{table.table_number}</div>
                    <div className="flex items-center gap-1 text-[13px] text-[var(--a-text-2)]">
                      <Users className="h-3.5 w-3.5" /><span className="pd-tabular">{table.capacity} seats</span>
                    </div>
                  </div>
                  <StatusPill tone={st.tone} dot>{st.label}</StatusPill>
                </div>

                {table.current_order && (
                  <div className="rounded-[10px] bg-[var(--a-inset)] px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 text-[12px] text-[var(--a-text-2)] truncate"><Receipt className="h-3 w-3 shrink-0" />{table.current_order.order_id}</span>
                      <Button size="sm" variant="tinted" icon={Printer} className="h-7 px-2" onClick={() => fetchTicket(table.current_order.order_id)}>KOT</Button>
                    </div>
                    <div className="text-[15px] font-semibold text-[var(--a-text)] pd-tabular">₹{table.current_order.total}</div>
                  </div>
                )}

                <div className="mt-auto flex items-center gap-1">
                  <Select
                    aria-label="Table status"
                    value={table.status}
                    onChange={(e) => e.target.value !== table.status && updateTableStatus(table.table_number, e.target.value)}
                    className="h-8 text-[13px] px-2 pr-6 flex-1 min-w-0"
                  >
                    <option value="free">Free</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    {!STATUS[table.status] && <option value={table.status}>{st.label}</option>}
                  </Select>
                  <IconButton icon={Edit2} label="Edit Table" className="h-8 w-8" onClick={() => openEditModal(table)} />
                  <IconButton icon={Trash2} label="Delete Table" variant="destructive" className="h-8 w-8" onClick={() => deleteTable(table.table_number)} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* KOT ticket */}
      <Sheet
        open={!!showTicket}
        onClose={() => setShowTicket(null)}
        title="Kitchen order ticket"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowTicket(null)}>Close</Button>
            <Button variant="primary" icon={Printer} onClick={handlePrint}>Print KOT</Button>
          </>
        }
      >
        {showTicket && (
          <div className="rounded-[12px] border border-[var(--a-line)] overflow-hidden" style={{ background: "#FFFFFF", color: "#0E1A20" }}>
            <div ref={printRef} className="p-4">
              <h1 style={{textAlign:'center',fontSize:'20px',fontWeight:'bold',borderBottom:'2px dashed #000',paddingBottom:'10px',color:'#0E1A20'}}>
                {showTicket.kot_number}<br/><span style={{fontSize:'14px'}}>Table {showTicket.table_number}</span>
              </h1>
              <p style={{textAlign:'center',fontSize:'12px',color:'#666',margin:'10px 0'}}>{new Date(showTicket.created_at).toLocaleString('en-IN')}</p>
              <p style={{fontWeight:'bold',marginBottom:'5px'}}>Customer: {showTicket.customer_name}</p>
              <div style={{borderTop:'1px solid #ccc',paddingTop:'10px'}}>
                {showTicket.items.map((item, i) => (
                  <div key={i} className="item" style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px dotted #ccc'}}>
                    <span>{item.quantity}x {item.name}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="total" style={{fontWeight:'bold',fontSize:'18px',marginTop:'10px',textAlign:'right'}}>Total: ₹{showTicket.total}</div>
              <p className="footer" style={{textAlign:'center',marginTop:'20px',fontSize:'12px',color:'#666'}}>--- Thank You ---</p>
            </div>
          </div>
        )}
      </Sheet>

      {/* Add table */}
      <Sheet
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="New table"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={createTable}>Create Table</Button>
          </>
        }
      >
        <div className="space-y-5">
          <FormField label="Table number">
            <Input type="number" min="1" value={newTable.table_number}
              onChange={(e) => setNewTable({ ...newTable, table_number: parseInt(e.target.value) || "" })} className="pd-tabular w-32" />
          </FormField>
          <FormField label="Capacity (seats)">
            {capacityControl(newTable.capacity, (v) => setNewTable(p => ({ ...p, capacity: v })), [2, 4, 6, 8])}
          </FormField>
        </div>
      </Sheet>

      {/* Edit table */}
      <Sheet
        open={showEditModal && !!editingTable}
        onClose={() => { setShowEditModal(false); setEditingTable(null); }}
        title={editingTable ? `Edit table T${editingTable.table_number}` : "Edit table"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditingTable(null); }}>Cancel</Button>
            <Button variant="primary" onClick={saveTableEdit}>Save Changes</Button>
          </>
        }
      >
        {editingTable && (
          <div className="space-y-5">
            <FormField label="Seat capacity">
              {capacityControl(editingTable.capacity, (v) => setEditingTable(p => ({ ...p, capacity: v })), [2, 4, 6, 8, 10])}
            </FormField>
            <FormField label="Status">
              <Segmented
                stretch
                value={editingTable.status}
                onChange={(v) => setEditingTable(p => ({ ...p, status: v }))}
                options={[{ value: "free", label: "Free" }, { value: "occupied", label: "Occupied" }, { value: "reserved", label: "Reserved" }]}
              />
            </FormField>
          </div>
        )}
      </Sheet>

      {/* Bulk create */}
      <Sheet
        open={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk create tables"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={bulkCreateTables}>Create {bulkCreate.count} Tables</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Number of tables">
            <Input type="number" value={bulkCreate.count} onChange={(e) => setBulkCreate({ ...bulkCreate, count: parseInt(e.target.value) })} className="pd-tabular" />
          </FormField>
          <FormField label="Capacity per table">
            <Input type="number" value={bulkCreate.capacity} onChange={(e) => setBulkCreate({ ...bulkCreate, capacity: parseInt(e.target.value) })} className="pd-tabular" />
          </FormField>
        </div>
      </Sheet>
    </Page>
  );
};

export default TableManagement;
