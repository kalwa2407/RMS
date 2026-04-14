import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Edit,
  Trash2,
  Save,
  X,
  History,
  Filter,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const Inventory = () => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockHistory, setStockHistory] = useState([]);

  const [newItem, setNewItem] = useState({
    name: "",
    category: "Vegetables",
    unit: "kg",
    current_stock: 0,
    min_stock: 5,
    cost_per_unit: 0,
    supplier: "",
  });

  const token = localStorage.getItem("admin_token");

  const categories = ["All", "Vegetables", "Meat", "Dairy", "Spices", "Grains", "Beverages", "Other"];
  const units = ["kg", "g", "L", "ml", "pcs", "dozen", "box"];

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInventory(data);
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const addItem = async () => {
    if (!newItem.name.trim()) {
      return toast({ title: "Error", description: "Name is required", variant: "destructive" });
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newItem),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Item added to inventory" });
        setShowAddModal(false);
        setNewItem({
          name: "",
          category: "Vegetables",
          unit: "kg",
          current_stock: 0,
          min_stock: 5,
          cost_per_unit: 0,
          supplier: "",
        });
        fetchInventory();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    }
  };

  const updateStock = async (itemId, change, reason = "Manual adjustment") => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/inventory/${itemId}/stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ change, reason }),
      });

      if (res.ok) {
        toast({ title: "Stock Updated" });
        fetchInventory();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update stock", variant: "destructive" });
    }
  };

  const deleteItem = async (itemId) => {
    if (!window.confirm("Delete this inventory item?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/inventory/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast({ title: "Item Deleted" });
        fetchInventory();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
  };

  const viewHistory = async (item) => {
    setSelectedItem(item);
    try {
      const res = await fetch(`${API_BASE}/api/admin/inventory/${item._id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStockHistory(data);
        setShowHistoryModal(true);
      }
    } catch (err) {
      setStockHistory([]);
      setShowHistoryModal(true);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "All" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockItems = inventory.filter((item) => item.current_stock <= item.min_stock);
  const outOfStockItems = inventory.filter((item) => item.current_stock === 0);
  const totalValue = inventory.reduce((sum, item) => sum + item.current_stock * item.cost_per_unit, 0);

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
          <Package className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-primary">Inventory Management</h1>
            <p className="text-gray-400 text-sm">Track stock levels & supplies</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-black px-4 py-2 rounded-lg font-bold flex items-center space-x-2 hover:bg-white transition"
        >
          <Plus className="h-5 w-5" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/[0.03] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Items</p>
              <p className="text-2xl font-bold text-white">{inventory.length}</p>
            </div>
            <Package className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div className="bg-white/[0.03] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-500">{lowStockItems.length}</p>
            </div>
            <TrendingDown className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white/[0.03] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Out of Stock</p>
              <p className="text-2xl font-bold text-red-500">{outOfStockItems.length}</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white/[0.03] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-green-500">₹{totalValue.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-500" />
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span className="text-yellow-500 font-bold">Low Stock Alert!</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <span key={item._id} className="bg-yellow-500/30 text-yellow-200 px-3 py-1 rounded-full text-sm">
                {item.name}: {item.current_stock} {item.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] text-white pl-10 pr-4 py-2 rounded-lg border border-white/5 focus:border-primary/50 outline-none"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white/[0.03] text-white px-4 py-2 rounded-lg border border-white/5 focus:border-primary/50 outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white/[0.03] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#050b10]">
            <tr>
              <th className="text-left py-4 px-4 text-primary font-bold">Item</th>
              <th className="text-left py-4 px-4 text-primary font-bold">Category</th>
              <th className="text-center py-4 px-4 text-primary font-bold">Stock</th>
              <th className="text-center py-4 px-4 text-primary font-bold">Min Level</th>
              <th className="text-right py-4 px-4 text-primary font-bold">Cost/Unit</th>
              <th className="text-center py-4 px-4 text-primary font-bold">Status</th>
              <th className="text-center py-4 px-4 text-primary font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  No inventory items found
                </td>
              </tr>
            ) : (
              filteredInventory.map((item) => (
                <tr key={item._id} className="border-t border-white/5 hover:bg-[#050b10]/50">
                  <td className="py-3 px-4">
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-gray-400 text-xs">{item.supplier || "No supplier"}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-[#050b10] text-gray-300 px-2 py-1 rounded text-sm">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => updateStock(item._id, -1, "Used")}
                        className="w-7 h-7 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500/30"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="text-white font-bold w-16 text-center">
                        {item.current_stock} {item.unit}
                      </span>
                      <button
                        onClick={() => updateStock(item._id, 1, "Restocked")}
                        className="w-7 h-7 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center hover:bg-green-500/30"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-400">
                    {item.min_stock} {item.unit}
                  </td>
                  <td className="py-3 px-4 text-right text-white">
                    ₹{item.cost_per_unit}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.current_stock === 0 ? (
                      <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs font-bold">
                        OUT OF STOCK
                      </span>
                    ) : item.current_stock <= item.min_stock ? (
                      <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-bold">
                        LOW STOCK
                      </span>
                    ) : (
                      <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-bold">
                        IN STOCK
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => viewHistory(item)}
                        className="text-blue-400 hover:text-blue-300"
                        title="View History"
                      >
                        <History className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deleteItem(item._id)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white/[0.03] rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">Add Inventory Item</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm block mb-1">Item Name *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full bg-[#050b10] text-white px-4 py-2 rounded-lg border border-white/5 focus:border-primary/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-[#050b10] text-white px-4 py-2 rounded-lg border border-white/5 focus:border-primary/50 outline-none"
                  >
                    {categories.filter(c => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Unit</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full bg-[#050b10] text-white px-4 py-2 rounded-lg border border-white/5 focus:border-primary/50 outline-none"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={newItem.current_stock}
                    onChange={(e) => setNewItem({ ...newItem, current_stock: Number(e.target.value) })}
                    className="w-full bg-[#050b10] text-white px-4 py-2 rounded-lg border border-white/5 focus:border-primary/50 outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Min Stock Level</label>
                  <input
                    type="number"
                    value={newItem.min_stock}
                    onChange={(e) => setNewItem({ ...newItem, min_stock: Number(e.target.value) })}
                    className="w-full bg-[#050b10] text-white px-4 py-2 rounded-lg border border-white/5 focus:border-primary/50 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Cost per Unit (₹)</label>
                  <input
                    type="number"
                    value={newItem.cost_per_unit}
                    onChange={(e) => setNewItem({ ...newItem, cost_per_unit: Number(e.target.value) })}
                    className="w-full bg-[#050b10] text-white px-4 py-2 rounded-lg border border-white/5 focus:border-primary/50 outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Supplier</label>
                  <input
                    type="text"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                    className="w-full bg-[#050b10] text-white px-4 py-2 rounded-lg border border-white/5 focus:border-primary/50 outline-none"
                  />
                </div>
              </div>

              <button
                onClick={addItem}
                className="w-full bg-primary text-black py-3 rounded-lg font-bold hover:bg-white transition"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white/[0.03] rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary">
                Stock History: {selectedItem?.name}
              </h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            {stockHistory.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No history available</p>
            ) : (
              <div className="space-y-2">
                {stockHistory.map((entry, idx) => (
                  <div key={idx} className="bg-[#050b10] rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm">{entry.reason}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className={`font-bold ${entry.change > 0 ? "text-green-500" : "text-red-500"}`}>
                      {entry.change > 0 ? "+" : ""}{entry.change}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;


