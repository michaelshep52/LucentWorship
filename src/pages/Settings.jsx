import { useAuth } from "@/lib/AuthContext";
import { Settings as SettingsIcon, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" /> Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">App configuration</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="w-4 h-4" /> Account
        </h2>
        {user && (
          <div className="space-y-2">
            <p className="text-sm"><span className="text-muted-foreground">Email:</span> {user.email}</p>
          </div>
        )}
        <Button
          variant="outline"
          className="gap-2 text-destructive"
          onClick={logout}
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-2">About LucentWorship</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          LucentWorship is a worship presentation studio for creating and managing
          church service presentations with lyrics, scripture, and media. Use the live mode
          to present slides during worship services.
        </p>
        <div className="mt-4 space-y-1 text-xs text-muted-foreground">
          <p>Keyboard shortcuts in Live Mode:</p>
          <p>→ / Space / PageDown — Next slide</p>
          <p>← / PageUp — Previous slide</p>
          <p>B / . — Black screen toggle</p>
          <p>Esc — Exit live mode</p>
        </div>
      </div>
    </div>
  );
}
