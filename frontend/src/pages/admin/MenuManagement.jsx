import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";

// Environment variable setup
const API_BASE = import.meta.env.VITE_API_BASE_URL || process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const categories = [
  "Biryani",
  "Kebabs",
  "Mughlai",
  "Starters",
  "Main Course",
  "Breads",
  "Desserts",
  "Beverages",
];

const MenuManagement = () => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "Biryani",
    description: "",
    price: "",
    image: "",
    popular: false,
    available: true,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await axios.get(`${API_BASE}/api/admin/menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMenuItems(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔥 UPDATED FUNCTION: Using fetch instead of axios for Image Upload
  const handleImageUpload = async (file) => {
    if (!file) return;

    setUploadingImage(true);
    try {
      const token = localStorage.getItem("admin_token");
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      // Using fetch with 'omit' credentials to bypass strict CORS issues
      const response = await fetch(`${API_BASE}/api/admin/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, 
          // Do NOT set Content-Type here; fetch sets it automatically for FormData
        },
        body: formDataUpload,
        credentials: "omit", 
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = await response.json();

      if (data.success) {
        const imageUrl = `${API_BASE}${data.url}`;
        setFormData({ ...formData, image: imageUrl });
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");

    try {
      if (editingItem) {
        await axios.put(
          `${API_BASE}/api/admin/menu/${editingItem._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast({
          title: "Success",
          description: "Menu item updated successfully",
        });
      } else {
        await axios.post(
          `${API_BASE}/api/admin/menu`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      fetchMenuItems();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save menu item",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(`${API_BASE}/api/admin/menu/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });

      fetchMenuItems();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      image: item.image,
      popular: item.popular,
      available: item.available,
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "Biryani",
      description: "",
      price: "",
      image: "",
      popular: false,
      available: true,
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-primary">
        Loading menu items...
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2
          className="text-4xl font-bold text-primary"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          Menu Management
        </h2>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary hover:bg-[#CA8A04] text-black px-6 py-3 rounded-full font-bold flex items-center space-x-2 transition-all duration-300"
        >
          {showAddForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          <span>{showAddForm ? "Cancel" : "Add New Item"}</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 mb-8">
          <h3 className="text-2xl font-bold text-primary mb-4">
            {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-primary font-semibold mb-2">
                  Item Name *
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-[#050b10] border border-white/5 rounded-lg text-white focus:border-primary/50"
                />
              </div>

              <div>
                <label className="block text-primary font-semibold mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-[#050b10] border border-white/5 rounded-lg text-white focus:border-primary/50"
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-primary font-semibold mb-2">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#050b10] border border-white/5 rounded-lg text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-primary font-semibold mb-2">
                  Price (₹) *
                </label>
                <input
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-[#050b10] border border-white/5 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-primary font-semibold mb-2">
                  Image *
                </label>
                
                <div className="mb-3">
                  <label className="block text-sm text-gray-400 mb-2">
                    Upload from your device:
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        handleImageUpload(file);
                      }
                    }}
                    className="w-full px-4 py-2 bg-[#050b10] border border-white/5 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-black file:cursor-pointer hover:file:bg-[#d4a406]"
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <p className="text-sm text-primary mt-1">Uploading image...</p>
                  )}
                </div>

                <div className="flex items-center my-3">
                  <div className="flex-1 border-t border-white/5"></div>
                  <span className="px-3 text-gray-500 text-sm">OR</span>
                  <div className="flex-1 border-t border-white/5"></div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Enter image URL:
                  </label>
                  <input
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 bg-[#050b10] border border-white/5 rounded-lg text-white"
                  />
                </div>

                {formData.image && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-400 mb-2">Preview:</p>
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border border-white/5"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/150?text=Invalid+Image";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-6">
              <label className="flex items-center text-white space-x-2">
                <input
                  type="checkbox"
                  checked={formData.popular}
                  onChange={(e) =>
                    setFormData({ ...formData, popular: e.target.checked })
                  }
                />
                <span>Popular</span>
              </label>

              <label className="flex items-center text-white space-x-2">
                <input
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) =>
                    setFormData({ ...formData, available: e.target.checked })
                  }
                />
                <span>Available</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-[#CA8A04] text-black py-3 rounded-full font-bold flex items-center justify-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>{editingItem ? "Update Item" : "Add Item"}</span>
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div
            key={item._id}
            className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:border-primary/20"
          >
            <div className="relative h-48">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />

              <div className="absolute top-3 right-3 bg-primary text-black px-3 py-1 rounded-full font-bold text-sm">
                ₹{item.price}
              </div>

              {item.popular && (
                <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Popular
                </div>
              )}

              {!item.available && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    Unavailable
                  </span>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
              <p className="text-primary text-sm mb-2">{item.category}</p>
              <p className="text-gray-300 text-sm mb-4">{item.description}</p>

              <div className="flex space-x-2">
                <button
                  onClick={() => startEdit(item)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center space-x-1"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDelete(item._id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg flex items-center justify-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuManagement;


