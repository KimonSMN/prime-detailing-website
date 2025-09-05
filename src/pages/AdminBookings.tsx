import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// ---- Sign-in box ----
function AdminSignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="max-w-sm mx-auto mt-24">
      <Card>
        <CardHeader>
          <CardTitle>Admin Sign In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              if (error)
                toast({
                  title: "Sign in failed",
                  description: error.message,
                  variant: "destructive",
                });
              else {
                toast({ title: "Signed in" });
                onSignedIn();
              }
            }}
          >
            Sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Types for the nested select ----
type BookingRow = {
  id: string;
  created_at: string;
  preferred_at: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  vehicle_info: string | null;
  notes: string | null;
  customer: { full_name: string; email: string | null; phone: string | null };
  booking_service: {
    quantity: number;
    price_at_booking: string | null;
    service: { name: string; base_price: string | null };
  }[];
};

export default function AdminBookings() {
  const { toast } = useToast();
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    BookingRow["status"] | "all"
  >("pending");
  const [loading, setLoading] = useState(false);

  // keep auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setAuthed(!!s)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  async function load() {
    setLoading(true);
    // Read bookings + customer + services (works because we defined foreign keys)
    const query = supabase
      .from("booking")
      .select(
        `
        id, created_at, preferred_at, status, vehicle_info, notes,
        customer:customer_id ( full_name, email, phone ),
        booking_service ( quantity, price_at_booking, service:service_id ( name, base_price ) )
      `
      )
      .order("preferred_at", { ascending: true })
      .limit(200);

    const { data, error } = await query;
    setLoading(false);
    if (error) {
      toast({
        title: "Load failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setRows((data as any) || []);
    }
  }

  useEffect(() => {
    if (authed) load();
  }, [authed]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  async function setStatus(id: string, status: BookingRow["status"]) {
    const { error } = await supabase
      .from("booking")
      .update({ status })
      .eq("id", id);
    if (error)
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    else {
      toast({ title: `Marked ${status}` });
      load();
    }
  }

  if (!authed) return <AdminSignIn onSignedIn={() => setAuthed(true)} />;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bookings</h1>
        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as any)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
          <Button variant="destructive" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground">
            No bookings to show.
          </CardContent>
        </Card>
      ) : (
        filtered.map((r) => {
          const total = (r.booking_service || []).reduce((sum, bs) => {
            const price = Number(
              bs.price_at_booking ?? bs.service?.base_price ?? 0
            );
            return sum + price * (bs.quantity ?? 1);
          }, 0);
          return (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="flex justify-between flex-wrap gap-2">
                  <span>
                    {r.customer?.full_name ?? "Unknown"} —{" "}
                    {new Date(r.preferred_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <span className="text-sm opacity-70">Status: {r.status}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  Email: {r.customer?.email ?? "—"} · Phone:{" "}
                  {r.customer?.phone ?? "—"}
                </div>
                <div className="text-sm">Vehicle: {r.vehicle_info ?? "—"}</div>
                <div className="text-sm">Notes: {r.notes ?? "—"}</div>
                <div className="text-sm">
                  Services:{" "}
                  {(r.booking_service || [])
                    .map((bs) => bs.service?.name)
                    .filter(Boolean)
                    .join(", ") || "—"}
                </div>
                <div className="text-sm font-medium">
                  Estimate: ${total.toFixed(2)}
                </div>
                <div className="flex gap-2 pt-3">
                  <Button onClick={() => setStatus(r.id, "confirmed")}>
                    Confirm
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setStatus(r.id, "in_progress")}
                  >
                    Start
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStatus(r.id, "completed")}
                  >
                    Complete
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setStatus(r.id, "cancelled")}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
