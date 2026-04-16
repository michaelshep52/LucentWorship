import { Link } from "react-router-dom";

export default function QuickStatCard({ icon: Icon, label, value, to }) {
  return (
    <Link
      to={to}
      className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className="text-3xl font-bold tabular-nums">{value}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-3 group-hover:text-foreground transition-colors">{label}</p>
    </Link>
  );
}