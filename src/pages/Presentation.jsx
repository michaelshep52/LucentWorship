import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Presentation as PresentationEntity } from "@/api/entities";
import { Presentation, Plus, Search, Trash2, Edit2, Radio, Calendar, Layers } from "lucide-react";

const STATUS_COLORS = {
  draft: "bg-yellow-500/15 text-yellow-400",
  ready: "bg-green-500/15 text-green-400",
  archived: "bg-secondary text-muted-foreground",
};

export default function Presentations() {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);

  useEffect(() => {
    loadPresentations();
    if (urlParams.get('new') === '1') handleNew();
  }, []);

  async function loadPresentations() {
    setLoading(true);
    const data = await PresentationEntity.list('-updated_date');
    setPresentations(data);
    setLoading(false);
  }

  async function handleNew() {
    const p = await PresentationEntity.create({ title: "New Presentation", status: "draft", slides: [] });
    navigate(`/presentations/${p.id}`);
  }

  async function deletePresentation(id, e) {
    e.stopPropagation();
    if (!confirm("Delete this presentation?")) return;
    await PresentationEntity.delete(id);
    setPresentations(p => p.filter(x => x.id !== id));
  }

  const filtered = presentations.filter(p => !search || p.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-playfair">Presentations</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{presentations.length} presentations</p>
        </div>
        <button onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Presentation
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search presentations..."
          className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-36 bg-card rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Presentation className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No presentations found</p>
          <button onClick={handleNew} className="mt-3 text-primary text-sm hover:underline flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Create one
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(p => (
            <div key={p.id} onClick={() => navigate(`/presentations/${p.id}`)}
              className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status] || STATUS_COLORS.draft}`}>
                      {p.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-lg leading-tight truncate">{p.title}</h3>
                  {p.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3 flex-shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/live?presentation=${p.id}`); }}
                    className="p-1.5 rounded-md hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors" title="Go Live">
                    <Radio className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => deletePresentation(p.id, e)}
                    className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" /> {p.slides?.length || 0} slides
                </span>
                {p.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.date}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}