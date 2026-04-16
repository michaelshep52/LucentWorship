import { Link } from "react-router-dom";
import { Play, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import moment from "moment";

export default function RecentPresentationCard({ presentation }) {
  const slideCount = presentation.slides?.length || 0;
  const statusColors = {
    draft: "bg-warning/20 text-warning",
    ready: "bg-success/20 text-success",
    archived: "bg-muted-foreground/20 text-muted-foreground",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{presentation.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {moment(presentation.updated_date).fromNow()}
          </p>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColors[presentation.status] || statusColors.draft}`}>
          {presentation.status || "draft"}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Layers className="w-3 h-3" />
        {slideCount} slide{slideCount !== 1 ? "s" : ""}
      </div>

      <div className="flex gap-2">
        <Link to={`/presentations/${presentation.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full text-xs">
            Edit
          </Button>
        </Link>
        {slideCount > 0 && (
          <Link to={`/live/${presentation.id}`}>
            <Button size="sm" className="text-xs gap-1">
              <Play className="w-3 h-3" /> Go Live
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}