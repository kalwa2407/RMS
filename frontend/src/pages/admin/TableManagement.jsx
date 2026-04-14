import React, { useState, useEffect, useCallback, useRef } from "react";
import { Grid3X3, Plus, Trash2, Users, Receipt, RefreshCw, Printer, X } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

const TableManagement = () => {
  const { toast } = useToast();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showTicket, setShowTicket] = useState(null);
  const [newTable, setNewTable] = useState({ table_number: 1, capacity: 4 });
  const [bulkCreate, setBulkCreate] = useState({ count: 10, capacity: 4 });
  const printRef = useRef();

  const API_BASE = process.env.REACT_APP_BACKEND_URL;
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
    try {
      const res = await fetch(`${API_BASE}/api/admin/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newTable),
      });
      if (res.ok) {
        toast({ title: "Success", description: `Table ${newTable.table_number} created` });
        setShowAddModal(false);
        fetchTables();
      } else {
        toast({ title: "Error", description: (await res.json()).detail, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to create table", variant: "destructive" });
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

  const getStatusColor = (status) => {
    switch (status) {
      case "free": return "bg-green-500";
      case "occupied": return "bg-red-500";
      case "reserved": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const stats = {
    total: tables.length,
    free: tables.filter(t => t.status === "free").length,
    occupied: tables.filter(t => t.status === "occupied").length,
    reserved: tables.filter(t => t.status === "reserved").length,
  };

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="h-8 w-8 text-primary animate-spin" /></div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Grid3X3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-primary">Table Management</h1>
            <p className="text-gray-400 text-sm">Manage tables & view KOT tickets</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setShowBulkModal(true)} className="bg-white/[0.03] px-4 py-2 rounded-lg text-primary hover:bg-[#254a58]">Bulk Create</button>
          <button onClick={() => { setNewTable({ table_number: tables.length + 1, capacity: 4 }); setShowAddModal(true); }}
            className="flex items-center space-x-2 bg-primary px-4 py-2 rounded-lg text-black font-bold hover:bg-white">
            <Plus className="h-4 w-4" /><span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white/[0.03] rounded-xl p-4 text-center"><p className="text-gray-400 text-sm">Total</p><p className="text-3xl font-bold text-white">{stats.total}</p></div>
        <div className="bg-white/[0.03] rounded-xl p-4 text-center"><p className="text-gray-400 text-sm">Free</p><p className="text-3xl font-bold text-green-500">{stats.free}</p></div>
        <div className="bg-white/[0.03] rounded-xl p-4 text-center"><p className="text-gray-400 text-sm">Occupied</p><p className="text-3xl font-bold text-red-500">{stats.occupied}</p></div>
        <div className="bg-white/[0.03] rounded-xl p-4 text-center"><p className="text-gray-400 text-sm">Reserved</p><p className="text-3xl font-bold text-yellow-500">{stats.reserved}</p></div>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="bg-white/[0.03] rounded-xl p-12 text-center">
          <Grid3X3 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl text-white mb-2">No Tables Yet</h2>
          <button onClick={() => setShowBulkModal(true)} className="bg-primary text-black px-6 py-2 rounded-lg font-bold">Create Tables</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables.map((table) => (
            <div key={table.table_number} className={`bg-white/[0.03] rounded-xl p-4 border-2 ${table.status === "occupied" ? "border-red-500" : table.status === "reserved" ? "border-yellow-500" : "border-green-500/30"}`}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-2xl font-bold text-white">T{table.table_number}</span>
                <span className={`w-3 h-3 rounded-full ${getStatusColor(table.status)}`}></span>
              </div>
              <div className="flex items-center text-gray-400 text-sm mb-3"><Users className="h-4 w-4 mr-1" /><span>{table.capacity} seats</span></div>

              {table.current_order && (
                <div className="bg-[#050b10] rounded-lg p-2 mb-3">
                  <div className="flex items-center justify-between text-primary text-sm">
                    <div className="flex items-center"><Receipt className="h-3 w-3 mr-1" /><span>{table.current_order.order_id}</span></div>
                    <button onClick={() => fetchTicket(table.current_order.order_id)} className="bg-primary text-black px-2 py-1 rounded text-xs font-bold flex items-center">
                      <Printer className="h-3 w-3 mr-1" />KOT
                    </button>
                  </div>
                  <p className="text-white font-bold">₹{table.current_order.total}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {table.status !== "free" && <button onClick={() => updateTableStatus(table.table_number, "free")} className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">Free</button>}
                {table.status !== "occupied" && <button onClick={() => updateTableStatus(table.table_number, "occupied")} className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded">Occupied</button>}
                {table.status !== "reserved" && <button onClick={() => updateTableStatus(table.table_number, "reserved")} className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">Reserve</button>}
                <button onClick={() => deleteTable(table.table_number)} className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KOT Ticket Modal */}
      {showTicket && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold text-lg">Kitchen Order Ticket</h2>
              <button onClick={() => setShowTicket(null)} className="text-gray-500 hover:text-black"><X className="h-5 w-5" /></button>
            </div>
            <div ref={printRef} className="p-4">
              <h1 style={{textAlign:'center',fontSize:'20px',fontWeight:'bold',borderBottom:'2px dashed #000',paddingBottom:'10px'}}>
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
            <div className="p-4 border-t flex space-x-2">
              <button onClick={() => setShowTicket(null)} className="flex-1 bg-gray-200 py-2 rounded-lg font-medium">Close</button>
              <button onClick={handlePrint} className="flex-1 bg-primary py-2 rounded-lg font-bold flex items-center justify-center"><Printer className="h-4 w-4 mr-2" />Print KOT</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white/[0.03] rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-primary mb-4">Add New Table</h2>
            <div className="space-y-4">
              <div><label className="text-gray-300 text-sm">Table Number</label><input type="number" value={newTable.table_number} onChange={(e) => setNewTable({ ...newTable, table_number: parseInt(e.target.value) })} className="w-full bg-[#050b10] text-white px-4 py-2 rounded-lg mt-1" /></div>
              <div><label className="text-gray-300 text-sm">Capacity</label><input type="number" value={newTable.capacity} onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) })} className="w-full bg-[#050b10] text-white px-4 py-2 rounded-lg mt-1" /></div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-600 text-white py-2 rounded-lg">Cancel</button>
              <button onClick={createTable} className="flex-1 bg-primary text-black py-2 rounded-lg font-bold">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white/[0.03] rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-primary mb-4">Bulk Create Tables</h2>
            <div className="space-y-4">
              <div><label className="text-gray-300 text-sm">Number of Tables</label><input type="number" value={bulkCreate.count} onChange={(e) => setBulkCreate({ ...bulkCreate, count: parseInt(e.target.value) })} className="w-full bg-[#050b10] text-white px-4 py-2 rounded-lg mt-1" /></div>
              <div><label className="text-gray-300 text-sm">Capacity per Table</label><input type="number" value={bulkCreate.capacity} onChange={(e) => setBulkCreate({ ...bulkCreate, capacity: parseInt(e.target.value) })} className="w-full bg-[#050b10] text-white px-4 py-2 rounded-lg mt-1" /></div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowBulkModal(false)} className="flex-1 bg-gray-600 text-white py-2 rounded-lg">Cancel</button>
              <button onClick={bulkCreateTables} className="flex-1 bg-primary text-black py-2 rounded-lg font-bold">Create {bulkCreate.count} Tables</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;


