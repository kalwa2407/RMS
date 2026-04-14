import React, { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "");

const GalleryManagement = () => {
  const { toast } = useToast();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    image_url: "",
    caption: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  // Fetch all images
  const fetchImages = async () => {
    try {
      const token = localStorage.getItem("admin_token");

      const res = await axios.get(`${API_BASE}/api/gallery`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setImages(res.data || []);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load gallery images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // UPLOAD IMAGE FILE
  const handleImageUpload = async (file) => {
    if (!file) return;

    setUploadingImage(true);
    try {
      const token = localStorage.getItem("admin_token");
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await axios.post(
        `${API_BASE}/api/admin/upload/image`,
        formDataUpload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        const imageUrl = `${API_BASE}${response.data.url}`;
        setFormData({ ...formData, image_url: imageUrl });
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.detail || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Add new image
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");

    try {
      await axios.post(`${API_BASE}/api/gallery`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "Success",
        description: "Image added successfully!",
      });

      setFormData({ image_url: "", caption: "" });
      setShowAddForm(false);
      fetchImages();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add image",
        variant: "destructive",
      });
    }
  };

  // Delete image
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this image permanently?")) return;

    try {
      const token = localStorage.getItem("admin_token");

      await axios.delete(`${API_BASE}/api/gallery/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "Deleted",
        description: "Image removed successfully",
      });

      fetchImages();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-primary">Loading gallery...</div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2
            className="text-4xl font-bold text-primary"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Gallery Management
          </h2>
          <p className="text-gray-300 mt-2">Total Images: {images.length}</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary hover:bg-[#CA8A04] text-black px-6 py-3 rounded-full font-bold flex items-center space-x-2"
        >
          {showAddForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          <span>{showAddForm ? "Cancel" : "Add New Image"}</span>
        </button>
      </div>

      {/* Add Image Form */}
      {showAddForm && (
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 mb-8">
          <h3 className="text-2xl font-bold text-primary mb-4">
            Add New Image
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-primary font-semibold mb-2">
                Image *
              </label>
              
              {/* File Upload Option */}
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

              {/* OR divider */}
              <div className="flex items-center my-3">
                <div className="flex-1 border-t border-white/5"></div>
                <span className="px-3 text-gray-500 text-sm">OR</span>
                <div className="flex-1 border-t border-white/5"></div>
              </div>

              {/* URL Input Option */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Enter image URL:
                </label>
                <input
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 bg-[#050b10] border border-white/5 rounded-lg text-white focus:border-primary/50 focus:outline-none"
                />
              </div>

              {/* Image Preview */}
              {formData.image_url && (
                <div className="mt-3">
                  <p className="text-sm text-gray-400 mb-2">Preview:</p>
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-white/5"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/150?text=Invalid+Image";
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-primary font-semibold mb-2">
                Caption *
              </label>
              <input
                required
                value={formData.caption}
                onChange={(e) =>
                  setFormData({ ...formData, caption: e.target.value })
                }
                placeholder="Short description"
                className="w-full px-4 py-2 bg-[#050b10] border border-white/5 rounded-lg text-white focus:border-primary/50 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-[#CA8A04] text-black py-3 rounded-full font-bold"
            >
              Add Image
            </button>
          </form>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div
            key={image._id}
            className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden group hover:border-primary/20 transition-all duration-300"
          >
            <div className="relative h-64">
              <img
                src={image.image_url}
                alt={image.caption}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center">
                <button
                  onClick={() => handleDelete(image._id)}
                  className="opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-all duration-300"
                >
                  <Trash2 className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-4">
              <p className="text-white font-semibold">{image.caption}</p>
              <p className="text-gray-400 text-sm mt-1">
                Added: {image.created_at
                  ? new Date(image.created_at).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryManagement;


