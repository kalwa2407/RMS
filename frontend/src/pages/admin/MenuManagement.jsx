import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";

const categories = ["Biryani", "Kebabs", "Mughlai", "Starters", "Main Course", "Breads", "Desserts", "Beverages"];

const MenuManagement = () => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [filterAvail, setFilterAvail] = useState("all"); // all | available | unavailable

  const [formData, setFormData] = useState({
    name: "", category: "Biryani", description: "", price: "", image: "", popular: false, available: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => { fetchMenuItems(); }, []);

  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      // admin endpoint now returns ALL items (including unavailable)
      const response = await axios.get(`${API_BASE}/api/admin/menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMenuItems(response.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to fetch menu items", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const token = localStorage.getItem("admin_token");
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      const response = await fetch(`${API_BASE}/api/admin/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
        credentials: "omit",
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, image: `${API_BASE}${data.url}` }));
        toast({ title: "Uploaded!", description: "Image uploaded successfully" });
      }
    } catch {
      toast({ title: "Upload Failed", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    try {
      if (editingItem) {
        await axios.put(`${API_BASE}/api/admin/menu/${editingItem._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Updated!", description: "Menu item updated successfully" });
      } else {
        await axios.post(`${API_BASE}/api/admin/menu`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast({ title: "Added!", description: "New item added to menu" });
      }
      fetchMenuItems();
      resetForm();
    } catch {
      toast({ title: "Error", description: "Failed to save menu item", variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently DELETE this item?")) return;
    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(`${API_BASE}/api/admin/menu/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: "Deleted", description: "Menu item deleted" });
      fetchMenuItems();
    } catch {
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
  };

  // Quick toggle availability without opening full edit form
  const handleToggleAvailability = async (item) => {
    setTogglingId(item._id);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await axios.put(`${API_BASE}/api/admin/menu/${item._id}/toggle-availability`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: res.data.available ? "✅ Available" : "⚠️ Unavailable",
        description: `${item.name} is now ${res.data.available ? "available" : "hidden from menu"}`,
      });
      fetchMenuItems();
    } catch {
      toast({ title: "Error", description: "Failed to toggle availability", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name, category: item.category, description: item.description,
      price: item.price, image: item.image, popular: item.popular, available: item.available,
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setFormData({ name: "", category: "Biryani", description: "", price: "", image: "", popular: false, available: true });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const filteredItems = menuItems.filter(item => {
    if (filterAvail === "available") return item.available !== false;
    if (filterAvail === "unavailable") return item.available === false;
    return true;
  });

  const unavailableCount = menuItems.filter(i => i.available === false).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
        <div>
          <h2 className="text-2xl sm:text-4xl font-bold text-primary" style={{ fontFamily: "Playfair Display, serif" }}>
            Menu Management
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {menuItems.length} total items
            {unavailableCount > 0 && (
              <span className="ml-2 text-orange-400">· {unavailableCount} unavailable</span>
            )}
          </p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary hover:bg-[#CA8A04] text-black px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all self-start sm:self-auto text-sm">
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? "Cancel" : "+ Add Item"}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { label: "All Items", value: "all" },
          { label: "Available", value: "available" },
          { label: `Unavailable (${unavailableCount})`, value: "unavailable" },
        ].map(f => (
          <button key={f.value} onClick={() => setFilterAvail(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterAvail === f.value ? "bg-primary text-black" : "bg-[#1a4855] text-gray-300 hover:bg-[#2a5865]"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Unavailable notice */}
      {unavailableCount > 0 && (
        <div className="flex items-start gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-5">
          <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-orange-300 text-sm">
            <strong>{unavailableCount} item(s)</strong> are marked unavailable and hidden from the public menu.
            Click the <strong>eye icon</strong> on any card to toggle availability instantly.
          </p>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-[#1a4855] border border-[#EAB308]/20 rounded-2xl p-5 mb-8 shadow-2xl">
          <h3 className="text-xl font-bold text-primary mb-4" style={{ fontFamily: "Playfair Display, serif" }}>
            {editingItem ? "✏️ Edit Menu Item" : "➕ Add New Menu Item"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-primary font-semibold mb-1 text-sm">Item Name *</label>
                <input required value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white focus:outline-none focus:border-primary/60 text-sm" />
              </div>
              <div>
                <label className="block text-primary font-semibold mb-1 text-sm">Category *</label>
                <select required value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white focus:outline-none focus:border-primary/60 text-sm">
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-primary font-semibold mb-1 text-sm">Description *</label>
              <textarea required rows={2} value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white focus:outline-none focus:border-primary/60 text-sm resize-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-primary font-semibold mb-1 text-sm">Price (₹) *</label>
                <input required type="number" value={formData.price}
                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white focus:outline-none focus:border-primary/60 text-sm" />
              </div>
              <div>
                <label className="block text-primary font-semibold mb-1 text-sm">Image</label>
                <input type="file" accept="image/*"
                  onChange={e => { const f = e.target.files[0]; if (f) handleImageUpload(f); }}
                  disabled={uploadingImage}
                  className="w-full px-3 py-2 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-black file:text-sm file:cursor-pointer" />
                {uploadingImage && <p className="text-xs text-primary mt-1">Uploading...</p>}
                <input value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })}
                  placeholder="Or paste image URL"
                  className="w-full px-4 py-2.5 bg-[#0f2933] border border-[#EAB308]/20 rounded-xl text-white mt-2 focus:outline-none text-sm" />
              </div>
            </div>
            {formData.image && (
              <img src={formData.image} alt="Preview"
                className="w-24 h-24 object-cover rounded-xl border border-[#EAB308]/20"
                onError={e => { e.target.style.display = "none"; }} />
            )}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                <input type="checkbox" checked={formData.popular} onChange={e => setFormData({ ...formData, popular: e.target.checked })}
                  className="accent-primary" />
                Popular
              </label>
              <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                <input type="checkbox" checked={formData.available} onChange={e => setFormData({ ...formData, available: e.target.checked })}
                  className="accent-primary" />
                Available
              </label>
            </div>
            <div className="flex gap-3">
              <button type="submit"
                className="flex-1 bg-primary hover:bg-[#CA8A04] text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                <Save className="h-4 w-4" />
                {editingItem ? "Update Item" : "Add Item"}
              </button>
              <button type="button" onClick={resetForm}
                className="bg-[#0f2933] border border-white/10 text-gray-400 hover:text-white px-5 py-3 rounded-xl font-medium transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map(item => (
            <div key={item._id}
              className={`bg-[#1a4855] border rounded-2xl overflow-hidden transition-all hover:shadow-lg group ${
                item.available === false
                  ? "border-red-500/30 opacity-75"
                  : "border-[#EAB308]/15 hover:border-[#EAB308]/30"
              }`}>
              {/* Image */}
              <div className="relative h-44">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />

                {/* Price badge */}
                <div className="absolute top-3 right-3 bg-primary text-black px-3 py-1 rounded-full font-bold text-sm shadow-lg">
                  ₹{item.price}
                </div>

                {/* Popular badge */}
                {item.popular && (
                  <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                    🔥 Popular
                  </div>
                )}

                {/* Unavailable overlay */}
                {item.available === false && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                    <EyeOff className="w-8 h-8 text-red-400" />
                    <span className="text-red-300 font-bold text-sm uppercase tracking-wider">Unavailable</span>
                    <span className="text-gray-400 text-xs">Hidden from public menu</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-bold text-base mb-0.5 truncate">{item.name}</h3>
                <p className="text-primary text-xs font-medium mb-1">{item.category}</p>
                <p className="text-gray-400 text-xs mb-4 line-clamp-2">{item.description}</p>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {/* Toggle Availability — primary quick action */}
                  <button onClick={() => handleToggleAvailability(item)}
                    disabled={togglingId === item._id}
                    title={item.available === false ? "Make Available" : "Mark Unavailable"}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                      item.available === false
                        ? "bg-green-600/20 border border-green-500/40 text-green-400 hover:bg-green-600/40"
                        : "bg-orange-600/20 border border-orange-500/40 text-orange-400 hover:bg-orange-600/40"
                    }`}>
                    {togglingId === item._id ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : item.available === false ? (
                      <><Eye className="w-3 h-3" /> Show</>
                    ) : (
                      <><EyeOff className="w-3 h-3" /> Hide</>
                    )}
                  </button>

                  {/* Edit */}
                  <button onClick={() => startEdit(item)}
                    className="flex-1 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/40 text-blue-400 py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold transition-all">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>

                  {/* Delete */}
                  <button onClick={() => handleDelete(item._id)}
                    className="bg-red-600/20 border border-red-500/30 hover:bg-red-600/40 text-red-400 px-3 py-2 rounded-lg flex items-center justify-center transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
