"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/api";
import { toast } from "@/components/ui/toast-store";
import { Loader2, UploadCloud } from "lucide-react";

export function ProductForm({ product, categories, onSaved }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: product?.title || "",
    description: product?.description || "",
    category: product?.category?._id || product?.category || "",
    price: product?.price ?? "",
    stock: product?.stock ?? "",
    commissionPercent: product?.commissionPercent ?? 20,
    status: product?.status || "active",
    sku: product?.sku || "",
  });
  const [images, setImages] = useState(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));
      const data = await api.post("/upload", formData, { isFormData: true });
      setImages((prev) => [...prev, ...data.images]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock), commissionPercent: Number(form.commissionPercent), images };
      let result;
      if (product) {
        result = await api.put(`/products/${product._id}`, payload);
        toast({ title: "Product updated", description: result.product.title });
      } else {
        result = await api.post("/products", payload);
        toast({ title: "Product created", description: result.product.title });
      }
      if (onSaved) onSaved(result.product);
      else router.push("/dashboard/seller/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border bg-card p-6">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>SKU (optional)</Label>
          <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Price (USD)</Label>
          <Input type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Stock quantity</Label>
          <Input type="number" min="0" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Affiliate commission %</Label>
          <Input type="number" min="0" max="90" required value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })} />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <p className="text-sm font-semibold">Product is active</p>
          <p className="text-xs text-muted-foreground">Inactive products won't appear in the marketplace.</p>
        </div>
        <Switch checked={form.status === "active"} onCheckedChange={(v) => setForm({ ...form, status: v ? "active" : "inactive" })} />
      </div>

      <div className="space-y-2">
        <Label>Product images</Label>
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="h-20 w-20 overflow-hidden rounded-md border bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:bg-secondary">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            <span className="text-[10px]">Upload</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Requires CLOUDINARY_* env vars set on the backend. Falls back gracefully with an error if not configured.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="gap-2" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {product ? "Save changes" : "Create product"}
      </Button>
    </form>
  );
}
