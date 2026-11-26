import React, { useEffect, useState } from "react";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import axios from "axios";

import API_BASE from "../../lib/config";
import { Page, PageHeader, Card, Button, IconButton, StatusPill, Sheet, FormField, Input, Select, FileInput, EmptyState, LoadingState } from "./ui";

const GalleryManagement = () => {
  const { toast } = useToast();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    image_url: "",
    caption: "",
    category: "Ambience"
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Helper to format image URLs for admin preview
  const getAdminImageUrl = (image) => {
    const raw = image?.image_url || image?.url || "";
    if (!raw) return "/signature_persian_kabab_platter_1776082069527.png";
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) return raw;
    if (raw.startsWith("/static/")) return `${API_BASE}${raw}`;
    return raw;
  };

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
        const imageUrl = response.data.url.startsWith("http") ? response.data.url : `${API_BASE}${response.data.url}`;
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
      await axios.post(`${API_BASE}/api/admin/gallery`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "Success",
        description: "Image added successfully!",
      });

      setFormData({ image_url: "", caption: "", category: "Ambience" });
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

      await axios.delete(`${API_BASE}/api/admin/gallery/${id}`, {
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
    return <LoadingState rows={3} label="Loading gallery" />;
  }

  return (
    <Page>
      <PageHeader
        title="Gallery"
        subtitle={<span className="pd-tabular">{images.length} images</span>}
        actions={<Button variant="primary" icon={Plus} onClick={() => setShowAddForm(true)}>Add Image</Button>}
      />

      {images.length === 0 ? (
        <Card>
          <EmptyState icon={ImageIcon} title="No images yet" description="Add photos of the food and dining room for the website gallery."
            action={<Button variant="primary" icon={Plus} onClick={() => setShowAddForm(true)}>Add Image</Button>} />
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {images.map((image, idx) => (
            <Card key={image._id || image.id || `img-${idx}`} padded={false} className="overflow-hidden flex flex-col">
              <div className="relative aspect-[4/3] bg-[var(--a-inset)]">
                <img
                  src={getAdminImageUrl(image)}
                  alt={image.caption}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/signature_persian_kabab_platter_1776082069527.png";
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-start gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-[var(--a-text)] truncate">{image.caption}</div>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <StatusPill tone="neutral">{image.category || "Ambience"}</StatusPill>
                    <span className="text-[12px] text-[var(--a-text-3)] pd-tabular">
                      {image.created_at ? new Date(image.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recently"}
                    </span>
                  </div>
                </div>
                <IconButton icon={Trash2} label="Delete image" variant="plain" className="!text-[var(--a-error)] h-8 w-8 shrink-0" onClick={() => handleDelete(image._id || image.id)} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add image"
        subtitle="Shown in the website gallery"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button variant="primary" type="submit" form="gallery-form">Add Image to Gallery</Button>
          </>
        }
      >
        <form id="gallery-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Image" hint={uploadingImage ? "Uploading image…" : "Upload from your device or paste an image URL"}>
            <div className="flex items-start gap-3">
              {formData.image_url ? (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="h-24 w-24 rounded-[12px] object-cover border border-[var(--a-line)] shrink-0"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/150?text=Invalid+Image";
                  }}
                />
              ) : (
                <div className="h-24 w-24 rounded-[12px] bg-[var(--a-fill)] flex items-center justify-center shrink-0">
                  <ImageIcon className="h-6 w-6 text-[var(--a-text-3)]" />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-2">
                <FileInput
                  accept="image/*"
                  disabled={uploadingImage}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                  }}
                />
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </FormField>
          <FormField label="Caption">
            <Input
              required
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              placeholder="e.g. Royal Raan Biryani or The Grand Darbar Hall"
            />
          </FormField>
          <FormField label="Category">
            <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              <option value="Ambience">Ambience (dining hall, seating, décor)</option>
              <option value="Food">Food (signature dishes, platters, biryani)</option>
              <option value="Royal">Royal (archways, art, mocktails, chandeliers)</option>
              <option value="Events">Events (banquets, family dastarkhwan, celebrations)</option>
            </Select>
          </FormField>
        </form>
      </Sheet>
    </Page>
  );
};

export default GalleryManagement;
