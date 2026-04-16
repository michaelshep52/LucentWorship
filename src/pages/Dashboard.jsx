import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Song, Presentation as PresentationEntity, ScriptureBookmark, MediaAsset } from "@/api/entities";
import { Music, Presentation, BookOpen, Image, Plus, Radio, Clock, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({ songs: 0, presentations: 0, scripture: 0, media: 0 });
  const [recentPresentations, setRecentPresentations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [songs, presentations, scripture, media] = await Promise.all([
        Song.list(),
        PresentationEntity.list('-updated_date', 5),
        ScriptureBookmark.list(),
        MediaAsset.list(),
      ]);
      setStats({ songs: songs.length, presentations: presentations.length, scripture: scripture.length, media: media.length });
      setRecentPresentations(presentations);
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { label: "Songs", value: stats.songs, icon: Music, color: "text-purple-400", bg: "bg-purple-500/10", link: "/songs" },
    { label: "Presentations", value: stats.presentations, icon: Presentation, color: "text-blue-400", bg: "bg-blue-500/10", link: "/presentations" },
    { label: "Scripture", value: stats.scripture, icon: BookOpen, color: "text-gold", bg: "bg-yellow-500/10", link: "/scripture" },
    { label: "Media Assets", value: stats.media, icon: Image, color: "text-teal", bg: "bg-teal-500/10", link: "/media" },
  ];

  const quickActions = [
    { label: "New Song", icon: Music, link: "/songs?new=1", color: "bg-purple-600 hover:bg-purple-500" },
    { label: "New Presentation", icon: Presentation, link: "/presentations?new=1", color: "bg-blue-600 hover:bg-blue-500" },
    { label: "Browse Scripture", icon: BookOpen, link: "/scripture", color: "bg-yellow-600 hover:bg-yellow-500" },
    { label: "Go Live", icon: Radio, link: "/live", color: "bg-primary hover:bg-primary/80" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground font-playfair">Good morning</h1>
        <p className="text-muted-foreground mt-1">Ready for worship? Everything is set up and waiting.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg, link }) => (
          <Link key={label} to={link} className="group">
            <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Presentations */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Recent Presentations</h2>
            <Link to="/presentations" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : recentPresentations.length === 0 ? (
            <div className="text-center py-10">
              <Presentation className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No presentations yet</p>
              <Link to="/presentations?new=1" className="inline-flex items-center gap-1 text-primary text-sm mt-2 hover:underline">
                <Plus className="w-3 h-3" /> Create one
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPresentations.map(p => (
                <Link key={p.id} to={`/presentations/${p.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="w-9 h-9 rounded-md bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                    <Presentation className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.slides?.length || 0} slides · {p.status}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {p.date || "No date"}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-2.5">
            {quickActions.map(({ label, icon: Icon, link, color }) => (
              <Link key={label} to={link}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-white text-sm font-medium transition-all duration-150 ${color}`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Service info */}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Today</p>
            <p className="text-sm text-foreground font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <p className="text-xs text-muted-foreground mt-1">Sunday Service</p>
          </div>
        </div>
      </div>
    </div>
  );
}