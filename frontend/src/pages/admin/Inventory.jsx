import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Minus,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Trash2,
  History,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";

import API_BASE from "../../lib/config";
import { cx, Page, PageHeader, Card, StatCard, Table, Th, Td, Button, IconButton, StatusPill, SearchField, ChipRow, Notice, Sheet, FormField, FormGroup, Input, Select, EmptyState, LoadingState } from "./ui";

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
    return <LoadingState rows={5} label="Loading inventory" />;
  }

  return (
    <Page>
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels and supplies"
        actions={<Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>Add Item</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Items" value={inventory.length} icon={Package} />
        <StatCard label="Low stock" value={lowStockItems.length} icon={TrendingDown} tone="warn" />
        <StatCard label="Out of stock" value={outOfStockItems.length} icon={AlertTriangle} tone="error" />
        <StatCard label="Stock value" value={`₹${totalValue.toLocaleString("en-IN")}`} icon={TrendingUp} tone="success" />
      </div>

      {lowStockItems.length > 0 && (
        <Notice tone="warn" icon={AlertTriangle}>
          <span className="font-semibold">Low stock: </span>
          {lowStockItems.map((item, i) => (
            <span key={item._id} className="pd-tabular">
              {i > 0 && ", "}{item.name} ({item.current_stock} {item.unit})
            </span>
          ))}
        </Notice>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search inventory" className="md:w-72" />
        <ChipRow
          value={filterCategory}
          onChange={setFilterCategory}
          options={categories.map((cat) => ({ value: cat, label: cat }))}
        />
      </div>

      {filteredInventory.length === 0 ? (
        <Card><EmptyState icon={Package} title="No inventory items" description={inventory.length ? "Nothing matches this search or category." : "Add your first stock item."} /></Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Item</Th>
              <Th className="hidden xl:table-cell">Category</Th>
              <Th align="center">Stock</Th>
              <Th align="right" className="hidden sm:table-cell">Min level</Th>
              <Th align="right" className="hidden xl:table-cell">Cost / unit</Th>
              <Th className="hidden sm:table-cell">Status</Th>
              <Th align="right"> </Th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item) => {
              const out = item.current_stock === 0;
              const low = !out && item.current_stock <= item.min_stock;
              return (
                <tr key={item._id} className="hover:bg-[var(--a-fill)]">
                  <Td>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-[12px] text-[var(--a-text-3)]">{item.supplier || "No supplier"}</div>
                    <div className="sm:hidden mt-1">{out ? <StatusPill tone="error" dot>Out</StatusPill> : low ? <StatusPill tone="warn" dot>Low</StatusPill> : <StatusPill tone="success" dot>In stock</StatusPill>}</div>
                  </Td>
                  <Td className="hidden xl:table-cell text-[var(--a-text-2)]">{item.category}</Td>
                  <Td align="center">
                    <div className="inline-flex items-center gap-1.5">
                      <IconButton icon={Minus} label="Use one" className="h-7 w-7 rounded-full" onClick={() => updateStock(item._id, -1, "Used")} />
                      <span className="min-w-[64px] text-center font-semibold">{item.current_stock} {item.unit}</span>
                      <IconButton icon={Plus} label="Restock one" className="h-7 w-7 rounded-full" onClick={() => updateStock(item._id, 1, "Restocked")} />
                    </div>
                  </Td>
                  <Td align="right" className="hidden sm:table-cell text-[var(--a-text-2)]">{item.min_stock} {item.unit}</Td>
                  <Td align="right" className="hidden xl:table-cell">₹{item.cost_per_unit}</Td>
                  <Td className="hidden sm:table-cell">
                    {out
                      ? <StatusPill tone="error" dot>Out of stock</StatusPill>
                      : low ? <StatusPill tone="warn" dot>Low stock</StatusPill>
                      : <StatusPill tone="success" dot>In stock</StatusPill>}
                  </Td>
                  <Td align="right">
                    <div className="inline-flex items-center gap-0.5">
                      <IconButton icon={History} label="View History" variant="plain" className="!text-[var(--a-text-2)]" onClick={() => viewHistory(item)} />
                      <IconButton icon={Trash2} label="Delete" variant="plain" className="!text-[var(--a-error)]" onClick={() => deleteItem(item._id)} />
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <Sheet
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        size="sm"
        title="New inventory item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" icon={Plus} onClick={addItem}>Add Item</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Item name">
            <Input type="text" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <Select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
                {categories.filter(c => c !== "All").map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </Select>
            </FormField>
            <FormField label="Unit">
              <Select value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}>
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Current stock">
              <Input type="number" value={newItem.current_stock} onChange={(e) => setNewItem({ ...newItem, current_stock: Number(e.target.value) })} className="pd-tabular" />
            </FormField>
            <FormField label="Minimum level">
              <Input type="number" value={newItem.min_stock} onChange={(e) => setNewItem({ ...newItem, min_stock: Number(e.target.value) })} className="pd-tabular" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cost per unit (₹)">
              <Input type="number" value={newItem.cost_per_unit} onChange={(e) => setNewItem({ ...newItem, cost_per_unit: Number(e.target.value) })} className="pd-tabular" />
            </FormField>
            <FormField label="Supplier">
              <Input type="text" value={newItem.supplier} onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })} />
            </FormField>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        size="sm"
        title="Stock history"
        subtitle={selectedItem?.name}
      >
        {stockHistory.length === 0 ? (
          <EmptyState icon={History} title="No history yet" />
        ) : (
          <FormGroup>
            {stockHistory.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="text-[15px]">{entry.reason}</div>
                  <div className="text-[12px] text-[var(--a-text-3)] pd-tabular">{new Date(entry.timestamp).toLocaleString("en-IN")}</div>
                </div>
                <span className={cx("text-[15px] font-semibold pd-tabular", entry.change > 0 ? "text-[var(--a-success)]" : "text-[var(--a-error)]")}>
                  {entry.change > 0 ? "+" : ""}{entry.change}
                </span>
              </div>
            ))}
          </FormGroup>
        )}
      </Sheet>
    </Page>
  );
};

export default Inventory;
