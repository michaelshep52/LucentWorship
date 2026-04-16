import { useState, useEffect, useRef } from "react";
import { MediaAsset, uploadFile } from "@/api/entities";
import { Image, Plus, Trash2, Upload, Search, Loader2, X } from "lucide-react";

export default function MediaLibrary() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  useEffect(() => { loadAssets(); }, []);

  async function loadAssets() {
    setLoading(true);
    const data = await MediaAsset.list('-created_date');
    setAssets(data);
    setLoading(false);
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await uploadFile({ file });
      const type = file.type.startsWith("video") ? "video" : "image";
      await MediaAsset.create({
        name: file.name.replace(/\.[^.]+$/, ""),
        type,
        file_url,
        thumbnail_url: type === "image" ? file_url : "",
        tags: []
      });
    }
    await loadAssets();
    setUploading(false);
    e.target.value = "";
  }

  async function deleteAsset(id) {
    if (!confirm("Delete this asset?")) return;
    await MediaAsset.delete(id);
    setAssets(a => a.filter(x => x.id !== id));
    if (preview?.id === id) setPreview(null);
  }

  const filtered = assets.filter(a => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || a.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-playfair">Media Library</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{assets.length} assets</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" ref={fileRef} onChange={handleUpload} multiple accept="image/*,video/*" className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        {["image", "video", "background"].map(t => (
          <button key={t} onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="aspect-video bg-card rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Image className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No media assets</p>
            <button onClick={() => fileRef.current?.click()} className="mt-3 text-primary text-sm hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Upload your first asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map(asset => (
              <div key={asset.id} className="group relative aspect-video bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/40 transition-all"
                onClick={() => setPreview(asset)}>
                {asset.file_url ? (
                  <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <button onClick={(e) => { e.stopPropagation(); deleteAsset(asset.id); }}
                    className="self-end p-1 bg-red-600/80 rounded text-white hover:bg-red-600">
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <p className="text-xs text-white truncate">{asset.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setPreview(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreview(null)} className="absolute -top-10 right-0 text-white/60 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <img src={preview.file_url} alt={preview.name} className="w-full rounded-xl" />
            <p className="text-white/60 text-sm mt-2 text-center">{preview.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}