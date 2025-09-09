import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

/* -------------------- Sign-in box -------------------- */
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
              if (error) {
                toast({
                  title: "Sign in failed",
                  description: error.message,
                  variant: "destructive",
                });
              } else {
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

/* -------------------- Types -------------------- */
type BookingRow = {
  id: string;
  created_at: string;
  preferred_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  vehicle_info: string | null;
  notes: string | null;
  customer: { full_name: string; email: string | null; phone: string | null };
  booking_service: {
    quantity: number;
    price_at_booking: string | null;
    service: {
      name: string;
      base_price: string | null;
      min_minutes: number | null;
    }; // <-- includes min_minutes
  }[];
};

const TIMES = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

export default function AdminBookings() {
  const { toast } = useToast();
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    BookingRow["status"] | "all"
  >("pending");

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reschedule dialog state
  const [resOpen, setResOpen] = useState(false);
  const [resBooking, setResBooking] = useState<BookingRow | null>(null);
  const [resDate, setResDate] = useState<Date | undefined>(undefined);
  const [resTime, setResTime] = useState<string>("");
  const [resBusy, setResBusy] = useState(false);
  const [unavailableTimes, setUnavailableTimes] = useState<Set<string>>(
    new Set()
  );

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
    const query = supabase
      .from("booking")
      .select(
        `
        id, created_at, preferred_at, status, vehicle_info, notes,
        customer:customer_id ( full_name, email, phone ),
        booking_service (
          quantity,
          price_at_booking,
          service:service_id ( name, base_price, min_minutes )
        )
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
    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: `Marked ${status}` });
      load();
    }
  }

  async function deleteBooking(id: string) {
    try {
      setDeletingId(id);
      await supabase.from("booking_service").delete().eq("booking_id", id);
      const { error } = await supabase.from("booking").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Booking deleted" });
      await load();
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  // ---- Reschedule helpers ----
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Build a set of hourly HH:mm slots covered by [start, start + minutes)
  function expandBlockedHours(
    startISO: string,
    minutes: number,
    acc: Set<string>
  ) {
    const s = new Date(startISO);
    const e = new Date(s);
    e.setMinutes(e.getMinutes() + minutes);

    // snap to the hour of s
    const t = new Date(s);
    t.setMinutes(0, 0, 0);
    acc.add(format(t, "HH:mm"));
    while (true) {
      t.setHours(t.getHours() + 1);
      if (t < e) acc.add(format(t, "HH:mm"));
      else break;
    }
  }

  // For a given date, compute blocked slots from OTHER bookings (exclude current)
  async function fetchUnavailableForDate(
    date: Date,
    excludeBookingId?: string
  ) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    type DayRow = {
      id: string;
      preferred_at: string;
      status: BookingRow["status"];
      booking_service: {
        quantity: number | null;
        service: { min_minutes: number | null } | null;
      }[];
    };

    const { data, error } = await supabase
      .from("booking")
      .select(
        `
        id, preferred_at, status,
        booking_service (
          quantity,
          service:service_id ( min_minutes )
        )
      `
      )
      .gte("preferred_at", start.toISOString())
      .lt("preferred_at", end.toISOString())
      .in("status", ["pending", "confirmed"])
      .returns<DayRow[]>();

    if (error) {
      console.error(error);
      setUnavailableTimes(new Set());
      return;
    }

    const set = new Set<string>();
    for (const b of data ?? []) {
      if (b.id === excludeBookingId) continue; // free the current booking's window
      const mins = Math.max(
        1,
        (b.booking_service ?? []).reduce((sum, bs) => {
          const qty = Number(bs?.quantity ?? 1);
          const m = Number(bs?.service?.min_minutes ?? 0);
          return sum + qty * m;
        }, 0)
      );
      expandBlockedHours(b.preferred_at, mins, set);
    }

    setUnavailableTimes(set);

    // If currently picked time is now blocked by others, keep it (we allow selecting blocked),
    // but warn once so it's obvious.
    if (resTime && set.has(resTime)) {
      toast({
        title: "Heads up",
        description:
          "That time overlaps another booking. You can pick it, but saving will fail.",
      });
    }
  }

  function openReschedule(r: BookingRow) {
    const d = new Date(r.preferred_at);
    setResBooking(r);
    setResDate(d);
    setResTime(format(d, "HH:mm"));
    setResOpen(true);
    fetchUnavailableForDate(d, r.id);
  }

  useEffect(() => {
    if (resOpen && resDate && resBooking) {
      fetchUnavailableForDate(resDate, resBooking.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resDate]);

  // Compute this booking's own minimal minutes
  function currentBookingMinMinutes(r: BookingRow | null) {
    if (!r) return 180;
    const total = (r.booking_service ?? []).reduce((sum, bs) => {
      const qty = Number(bs?.quantity ?? 1);
      const m = Number(bs?.service?.min_minutes ?? 0);
      return sum + qty * m;
    }, 0);
    return total > 0 ? total : 180;
  }

  // Check overlap of [aStart, aEnd) vs [bStart, bEnd)
  function windowsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart < bEnd && bStart < aEnd;
  }

  async function saveReschedule() {
    if (!resBooking || !resDate || !resTime) {
      toast({ title: "Missing date/time", variant: "destructive" });
      return;
    }
    if (resDate.getDay() === 0) {
      toast({ title: "Closed on Sundays", variant: "destructive" });
      return;
    }

    const myMin = currentBookingMinMinutes(resBooking);
    const newStart = new Date(`${format(resDate, "yyyy-MM-dd")}T${resTime}:00`);
    const newEnd = newStart
      ? new Date(newStart.getTime() + myMin * 60000)
      : null;

    // Re-validate against live data: fetch other bookings on that day with durations
    const dayStart = new Date(resDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(resDate);
    dayEnd.setHours(23, 59, 59, 999);

    type DayRow = {
      id: string;
      preferred_at: string;
      booking_service: {
        quantity: number | null;
        service: { min_minutes: number | null } | null;
      }[];
    };

    const { data: others, error: othersErr } = await supabase
      .from("booking")
      .select(
        `
        id, preferred_at,
        booking_service (
          quantity,
          service:service_id ( min_minutes )
        )
      `
      )
      .gte("preferred_at", dayStart.toISOString())
      .lt("preferred_at", dayEnd.toISOString())
      .in("status", ["pending", "confirmed"])
      .neq("id", resBooking.id)
      .returns<DayRow[]>();

    if (othersErr) {
      console.warn(othersErr);
    }

    let conflict = false;
    for (const b of others ?? []) {
      const mins = Math.max(
        1,
        (b.booking_service ?? []).reduce((sum, bs) => {
          const qty = Number(bs?.quantity ?? 1);
          const m = Number(bs?.service?.min_minutes ?? 0);
          return sum + qty * m;
        }, 0)
      );
      const bStart = new Date(b.preferred_at);
      const bEnd = new Date(bStart.getTime() + mins * 60000);
      if (windowsOverlap(newStart, newEnd!, bStart, bEnd)) {
        conflict = true;
        break;
      }
    }

    if (conflict) {
      toast({
        title: "Overlapping window",
        description:
          "This time overlaps another booking. Choose a different slot or reschedule the other booking first.",
        variant: "destructive",
      });
      return;
    }

    setResBusy(true);
    const { error } = await supabase
      .from("booking")
      .update({ preferred_at: newStart.toISOString() })
      .eq("id", resBooking.id);
    setResBusy(false);

    if (error) {
      toast({
        title: "Reschedule failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Booking rescheduled" });
      setResOpen(false);
      setResBooking(null);
      await load();
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

                <div className="flex flex-wrap gap-2 pt-3">
                  <Button onClick={() => setStatus(r.id, "confirmed")}>
                    Confirm
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

                  {/* Reschedule */}
                  <Dialog
                    open={resOpen && resBooking?.id === r.id}
                    onOpenChange={(o) => {
                      if (!o) {
                        setResOpen(false);
                        setResBooking(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => openReschedule(r)}
                      >
                        Reschedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Reschedule booking</DialogTitle>
                        <DialogDescription>
                          Pick a new date and time. Sundays blocked; booked
                          slots are dimmed (you can still select them).
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-primary" />{" "}
                            New Date
                          </Label>
                          <DatePicker
                            mode="single"
                            selected={resDate}
                            onSelect={(d) => d && setResDate(d)}
                            disabled={(d) => d.getDay() === 0 || d < today}
                            classNames={{
                              day_today:
                                "bg-primary/15 text-primary font-semibold",
                              day_selected: "bg-primary/20 text-foreground",
                            }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>New Time</Label>
                          <Select
                            value={resTime}
                            onValueChange={(v) => {
                              setResTime(v);
                              if (unavailableTimes.has(v)) {
                                toast({
                                  title: "Potential conflict",
                                  description:
                                    "This slot overlaps another booking. Saving will prevent overlaps.",
                                });
                              }
                            }}
                            disabled={!resDate}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  resDate ? "Select time" : "Pick date first"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {TIMES.map((t) => {
                                const taken = unavailableTimes.has(t);
                                return (
                                  <SelectItem
                                    key={t}
                                    value={t}
                                    // not disabling; just dim + label
                                    className={
                                      taken
                                        ? "opacity-60 data-[state=checked]:opacity-60"
                                        : ""
                                    }
                                  >
                                    <div className="flex w-full items-center justify-between">
                                      <span>{t}</span>
                                      {taken && (
                                        <span className="text-xs text-muted-foreground">
                                          booked
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Booked slots are dimmed. You can select them, but
                            you’ll need to move the conflicting booking first.
                          </p>
                        </div>
                      </div>

                      <DialogFooter className="gap-2 sm:justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setResOpen(false);
                            setResBooking(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={saveReschedule}
                          disabled={resBusy || !resDate || !resTime}
                        >
                          {resBusy ? "Saving..." : "Save"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="ml-auto"
                        disabled={deletingId === r.id}
                      >
                        {deletingId === r.id ? "Deleting..." : "Delete"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete this booking?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the booking and its
                          services. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteBooking(r.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
