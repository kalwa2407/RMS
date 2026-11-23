import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, EyeOff, AlertCircle, Star, Search } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";
import API_BASE from "../../lib/config";
import { cx, Page, PageHeader, Card, List, Button, IconButton, Segmented, SearchField, StatusPill, Switch, Sheet, FormField, FormGroup, FormRow, Input, Select, Textarea, EmptyState, LoadingState, ChipRow, Notice, FileInput } from "./ui";

const categories = ["Biryani", "Kebabs", "Mughlai", "Starters", "Main Course", "Breads", "Desserts", "Beverages", "Mocktails"];

const MenuManagement = () => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [filterAvail, setFilterAvail] = useState("all"); // all | available | unavailable
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

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
        // Firebase Storage returns full URL (https://...), local fallback returns relative path (/static/...)
        const imageUrl = data.url.startsWith("http") ? data.url : `${API_BASE}${data.url}`;
        setFormData(prev => ({ ...prev, image: imageUrl }));
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
        title: res.data.available ? "Available" : "Unavailable",
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
  };

  const resetForm = () => {
    setFormData({ name: "", category: "Biryani", description: "", price: "", image: "", popular: false, available: true });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const filteredItems = menuItems
    .filter(item => {
      if (filterAvail === "available") return item.available !== false;
      if (filterAvail === "unavailable") return item.available === false;
      return true;
    })
    .filter(item => filterCategory === "All" || item.category === filterCategory)
    .filter(item => {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const unavailableCount = menuItems.filter(i => i.available === false).length;
  const signatureCount = menuItems.filter(i => i.popular === true).length;

  if (loading) {
    return <LoadingState rows={6} label="Loading menu" />;
  }

  return (
    <Page>
      <PageHeader
        title="Menu"
        subtitle={
          <span className="pd-tabular">
            {menuItems.length} items
            {signatureCount > 0 && <> · {signatureCount} signature</>}
            {unavailableCount > 0 && <> · {unavailableCount} unavailable</>}
          </span>
        }
        actions={
          <Button variant="primary" icon={Plus} onClick={() => { if (showAddForm) resetForm(); else setShowAddForm(true); }}>
            Add Item
          </Button>
        }
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search dishes" className="md:w-72" />
          <Segmented
            value={filterAvail}
            onChange={setFilterAvail}
            options={[
              { label: "All", value: "all" },
              { label: "Available", value: "available" },
              { label: "Unavailable", value: "unavailable", count: unavailableCount },
            ]}
          />
        </div>
        <ChipRow
          value={filterCategory}
          onChange={setFilterCategory}
          options={["All", ...categories].map(c => ({ value: c, label: c }))}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Notice tone="gold" icon={Star}>
          <span className="font-semibold">Signature dishes</span> appear in the Signature section on the Home page (first 3 are shown).{" "}
          {signatureCount > 0 ? <span className="pd-tabular">{signatureCount} marked now.</span> : "None marked yet."}
        </Notice>
        {unavailableCount > 0 && (
          <Notice tone="warn" icon={AlertCircle}>
            <span className="font-semibold pd-tabular">{unavailableCount} items</span> are hidden from the public menu. Use the switch on a row to change availability.
          </Notice>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <EmptyState icon={Search} title="No dishes found" description="Try another search, category or availability filter." />
        </Card>
      ) : (
        <List>
          {filteredItems.map(item => {
            const unavailable = item.available === false;
            return (
              <div key={item._id} className="flex items-center gap-3 px-3 sm:px-4 py-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className={cx("h-14 w-14 rounded-[10px] object-cover shrink-0 bg-[var(--a-inset)] border border-[var(--a-line)]", unavailable && "opacity-50 grayscale")}
                  onError={e => { e.target.onerror = null; e.target.src = "/no-image.png"; }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cx("text-[15px] font-medium truncate", unavailable ? "text-[var(--a-text-3)]" : "text-[var(--a-text)]")}>{item.name}</span>
                    {item.popular && <StatusPill tone="gold" icon={Star}>Signature</StatusPill>}
                    {unavailable && <StatusPill tone="warn" icon={EyeOff}>Hidden</StatusPill>}
                  </div>
                  <div className="text-[13px] leading-[18px] text-[var(--a-text-2)] truncate">
                    {item.category}{item.description ? ` · ${item.description}` : ""}
                  </div>
                </div>
                <div className="hidden sm:block w-20 text-right text-[15px] font-medium text-[var(--a-text)] pd-tabular">₹{item.price}</div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="sm:hidden text-[14px] font-medium text-[var(--a-text)] pd-tabular mr-1">₹{item.price}</span>
                  <Switch
                    checked={!unavailable}
                    disabled={togglingId === item._id}
                    onChange={() => handleToggleAvailability(item)}
                    label={unavailable ? "Make Available" : "Mark Unavailable"}
                  />
                  <IconButton icon={Edit2} label="Edit" variant="plain" onClick={() => startEdit(item)} className="!text-[var(--a-text-2)]" />
                  <IconButton icon={Trash2} label="Delete" variant="plain" onClick={() => handleDelete(item._id)} className="!text-[var(--a-error)] hidden sm:inline-flex" />
                </div>
              </div>
            );
          })}
        </List>
      )}

      <Sheet
        open={showAddForm}
        onClose={resetForm}
        title={editingItem ? "Edit menu item" : "New menu item"}
        subtitle={editingItem ? editingItem.name : "Add a dish to the menu"}
        footer={
          <>
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button variant="primary" icon={Save} type="submit" form="menu-item-form">{editingItem ? "Update Item" : "Add Item"}</Button>
          </>
        }
      >
        <form id="menu-item-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Item name">
              <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </FormField>
            <FormField label="Category">
              <Select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </Select>
            </FormField>
          </div>
          <FormField label="Description">
            <Textarea required rows={2} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </FormField>
          <FormField label="Price (₹)">
            <Input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="pd-tabular sm:w-48" />
          </FormField>
          <FormField label="Image" hint={uploadingImage ? "Uploading…" : "Upload a photo or paste an image URL"}>
            <div className="flex items-start gap-3">
              {formData.image ? (
                <img src={formData.image} alt="Preview" className="h-20 w-20 rounded-[12px] object-cover border border-[var(--a-line)] shrink-0"
                  onError={e => { e.target.style.display = "none"; }} />
              ) : (
                <div className="h-20 w-20 rounded-[12px] bg-[var(--a-fill)] shrink-0" />
              )}
              <div className="flex-1 space-y-2 min-w-0">
                <FileInput accept="image/*" disabled={uploadingImage} onChange={e => { const f = e.target.files[0]; if (f) handleImageUpload(f); }} />
                <Input value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="Or paste image URL" />
              </div>
            </div>
          </FormField>
          <FormGroup>
            <FormRow label="Signature dish" hint="Shows in the Signature section on the Home page">
              <Switch checked={formData.popular} onChange={(v) => setFormData({ ...formData, popular: v })} label="Signature dish" />
            </FormRow>
            <FormRow label="Available" hint={formData.available ? "Visible on the public menu" : "Hidden from the public menu"}>
              <Switch checked={formData.available} onChange={(v) => setFormData({ ...formData, available: v })} label="Available" />
            </FormRow>
          </FormGroup>
        </form>
      </Sheet>
    </Page>
  );
};

export default MenuManagement;
