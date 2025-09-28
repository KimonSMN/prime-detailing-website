import { useEffect, useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
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
import {
  Calendar as CalendarIcon,
  Trash2,
  EllipsisVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    };
  }[];
};

type DayRow = {
  id: string;
  preferred_at: string;
  status: BookingRow["status"];
  booking_service: {
    quantity: number | null;
    service: { min_minutes: number | null } | null;
  }[];
};

type AdminBlock = {
  id: string;
  start_at: string; // ISO
  minutes: number;
  note: string | null;
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

// WHOLE-HOUR options (1–8 hours)
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

// Reason a specific HH:mm slot is unavailable
type UnavailKind = "booking" | "block" | "both";

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

  // unavailable slots for currently selected date: HH:mm -> kind
  const [unavailableMap, setUnavailableMap] = useState<
    Map<string, UnavailKind>
  >(new Map());

  // Block-time dialog state
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockDate, setBlockDate] = useState<Date | undefined>(undefined);
  const [blockTime, setBlockTime] = useState<string>("");
  const [blockMinutes, setBlockMinutes] = useState<number>(60); // default 1 hour
  const [blockNote, setBlockNote] = useState<string>("");
  const [blockBusy, setBlockBusy] = useState(false);
  const [blockFullDay, setBlockFullDay] = useState(false); // NEW: full-day toggle
  const [dayBlocks, setDayBlocks] = useState<AdminBlock[]>([]); // for manage/undo

  // Month-level blocks for coloring the calendar days (admin-only UI)
  const [monthWithBlocks, setMonthWithBlocks] = useState<Set<string>>(
    new Set()
  );
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

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
    if (authed) {
      load();
      // prime calendar month blocks
      refreshMonthBlocks(new Date());
    }
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

  // ---- Helpers ----
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
    const e = new Date(s.getTime() + minutes * 60000);

    const t = new Date(s);
    t.setMinutes(0, 0, 0);
    acc.add(format(t, "HH:mm"));
    while (true) {
      t.setHours(t.getHours() + 1);
      if (t < e) acc.add(format(t, "HH:mm"));
      else break;
    }
  }

  async function fetchDayBlocks(date: Date): Promise<AdminBlock[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("admin_block")
      .select("id,start_at,minutes,note")
      .gte("start_at", start.toISOString())
      .lt("start_at", end.toISOString())
      .order("start_at", { ascending: true })
      .returns<AdminBlock[]>();

    if (error) {
      console.warn(error);
      return [];
    }
    return data ?? [];
  }

  async function refreshMonthBlocks(month: Date) {
    const from = startOfMonth(month);
    const to = endOfMonth(month);

    const { data, error } = await supabase
      .from("admin_block")
      .select("start_at")
      .gte("start_at", from.toISOString())
      .lte("start_at", to.toISOString());

    if (error) {
      console.warn(error);
      setMonthWithBlocks(new Set());
      return;
    }
    const set = new Set<string>();
    (data ?? []).forEach((r: { start_at: string }) => {
      set.add(format(new Date(r.start_at), "yyyy-MM-dd"));
    });
    setMonthWithBlocks(set);
  }

  // For a given date, compute unavailable slots + kind map
  async function fetchUnavailableForDate(
    date: Date,
    excludeBookingId?: string
  ) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const { data: bookings, error } = await supabase
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
      setUnavailableMap(new Map());
      return;
    }

    // collect hours separately to tag reason
    const bookedSet = new Set<string>();
    for (const b of bookings ?? []) {
      if (b.id === excludeBookingId) continue;
      const mins = Math.max(
        1,
        (b.booking_service ?? []).reduce((sum, bs) => {
          const qty = Number(bs?.quantity ?? 1);
          const m = Number(
            // default service min to 0 if null
            bs?.service?.min_minutes ?? 0
          );
          return sum + qty * m;
        }, 0)
      );
      expandBlockedHours(b.preferred_at, mins, bookedSet);
    }

    const blocks = await fetchDayBlocks(date);
    setDayBlocks(blocks);
    const blockSet = new Set<string>();
    for (const blk of blocks) {
      expandBlockedHours(blk.start_at, blk.minutes, blockSet);
    }

    // merge with reasons
    const map = new Map<string, UnavailKind>();
    for (const t of bookedSet) map.set(t, "booking");
    for (const t of blockSet) {
      if (map.has(t)) map.set(t, "both");
      else map.set(t, "block");
    }
    setUnavailableMap(map);
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

  function currentBookingMinMinutes(r: BookingRow | null) {
    if (!r) return 180;
    const total = (r.booking_service ?? []).reduce((sum, bs) => {
      const qty = Number(bs?.quantity ?? 1);
      const m = Number(bs?.service?.min_minutes ?? 0);
      return sum + qty * m;
    }, 0);
    return total > 0 ? total : 180;
  }

  function windowsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart < bEnd && bStart < aEnd;
  }

  async function hasConflictOnDay(
    date: Date,
    start: Date,
    minutes: number,
    excludeBookingId?: string
  ): Promise<boolean> {
    const end = new Date(start.getTime() + minutes * 60000);

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

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
      .returns<DayRow[]>();

    if (othersErr) console.warn(othersErr);

    for (const b of others ?? []) {
      if (b.id === excludeBookingId) continue;
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
      if (windowsOverlap(start, end, bStart, bEnd)) return true;
    }

    const blocks = await fetchDayBlocks(date);
    for (const blk of blocks) {
      const bStart = new Date(blk.start_at);
      const bEnd = new Date(bStart.getTime() + blk.minutes * 60000);
      if (windowsOverlap(start, end, bStart, bEnd)) return true;
    }

    return false;
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

    const conflict = await hasConflictOnDay(
      resDate,
      newStart,
      myMin,
      resBooking.id
    );

    if (conflict) {
      toast({
        title: "Overlapping window",
        description:
          "This time overlaps another booking or an admin block. Choose a different slot.",
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

  async function openBlockDialog() {
    const base = new Date();
    setBlockDate(base);
    setBlockTime("");
    setBlockMinutes(60);
    setBlockNote("");
    setBlockFullDay(false);
    setBlockOpen(true);
    await fetchUnavailableForDate(base);
  }

  useEffect(() => {
    if (blockOpen && blockDate) {
      fetchUnavailableForDate(blockDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockDate, blockOpen]);

  async function saveBlock() {
    if (!blockDate) {
      toast({ title: "Missing date", variant: "destructive" });
      return;
    }
    if (blockDate.getDay() === 0) {
      toast({ title: "Closed on Sundays", variant: "destructive" });
      return;
    }

    let start: Date;
    let minutes: number;

    if (blockFullDay) {
      // Full-day: 00:00 for 24h
      start = new Date(format(blockDate, "yyyy-MM-dd") + "T00:00:00");
      minutes = 1440;
    } else {
      if (!blockTime || !blockMinutes) {
        toast({ title: "Missing time / hours", variant: "destructive" });
        return;
      }
      start = new Date(`${format(blockDate, "yyyy-MM-dd")}T${blockTime}:00`);
      minutes = blockMinutes; // already hours*60 from the Select
    }

    const conflict = await hasConflictOnDay(blockDate, start, minutes);
    if (conflict) {
      toast({
        title: "Overlapping window",
        description:
          "This block overlaps an existing booking or block. Pick a different time.",
        variant: "destructive",
      });
      return;
    }

    setBlockBusy(true);
    const { error } = await supabase.from("admin_block").insert({
      start_at: start.toISOString(),
      minutes,
      note: blockNote || null,
    });
    setBlockBusy(false);

    if (error) {
      toast({
        title: "Create block failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: blockFullDay ? "Day blocked" : "Time blocked" });
      setBlockOpen(false);
      await load();
      await refreshMonthBlocks(calendarMonth);
    }
  }

  async function deleteBlock(id: string) {
    const { error } = await supabase.from("admin_block").delete().eq("id", id);
    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Block removed" });
      if (blockDate) await fetchUnavailableForDate(blockDate);
      await refreshMonthBlocks(calendarMonth);
    }
  }

  // helpers for DayPicker modifiers
  const dayHasBlocks = (date: Date) =>
    monthWithBlocks.has(format(date, "yyyy-MM-dd"));

  if (!authed) return <AdminSignIn onSignedIn={() => setAuthed(true)} />;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold">Bookings</h1>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as any)}
          >
            <SelectTrigger className="w-40 sm:w-44">
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

          {/* Desktop buttons */}
          <div className="hidden sm:flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
            <Button variant="secondary" onClick={openBlockDialog}>
              Block time
            </Button>
            <Button
              variant="destructive"
              onClick={() => supabase.auth.signOut()}
            >
              Sign out
            </Button>
          </div>

          {/* Mobile dropdown */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Actions">
                  <EllipsisVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    if (!loading) load();
                  }}
                  className={loading ? "opacity-50 pointer-events-none" : ""}
                >
                  {loading ? "Loading..." : "Refresh"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    openBlockDialog();
                  }}
                >
                  Block time
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    supabase.auth.signOut();
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Block time dialog */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Block time (admin)</DialogTitle>
            <DialogDescription>
              Create a personal block; these appear in{" "}
              <span className="font-semibold">amber</span> on the calendar and
              as “block” in the time list.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" /> Date
              </Label>
              <DatePicker
                mode="single"
                selected={blockDate}
                onSelect={(d) => d && setBlockDate(d)}
                disabled={(d) => d.getDay() === 0 || d < today}
                onMonthChange={(m) => {
                  setCalendarMonth(m);
                  refreshMonthBlocks(m);
                }}
                modifiers={{ adminBlocked: (d) => dayHasBlocks(d) }}
                modifiersClassNames={{
                  adminBlocked:
                    "relative after:absolute after:inset-0 after:rounded-md after:ring-1 ",
                }}
                classNames={{
                  day_today: "bg-primary/15 text-primary font-semibold",
                  day_selected: "bg-primary/20 text-foreground",
                }}
              />
              <p className="text-xs text-muted-foreground">
                Amber days contain one or more admin blocks.
              </p>
            </div>

            {/* Full-day toggle */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={blockFullDay}
                  onChange={(e) => setBlockFullDay(e.target.checked)}
                />
                Block entire day
              </Label>
              <p className="text-xs text-muted-foreground">
                When enabled, the selected date will be fully unavailable.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Start time</Label>
              <Select
                value={blockTime}
                onValueChange={setBlockTime}
                disabled={!blockDate || blockFullDay}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      blockFullDay
                        ? "Disabled (full day)"
                        : blockDate
                        ? "Select time"
                        : "Pick date first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {TIMES.map((t) => {
                    const kind = unavailableMap.get(t); // booking | block | both | undefined
                    const isUnavailable = !!kind;
                    const badge =
                      kind === "both"
                        ? "both"
                        : kind === "booking"
                        ? "booked"
                        : kind === "block"
                        ? "block"
                        : "";
                    return (
                      <SelectItem
                        key={t}
                        value={t}
                        className={isUnavailable ? "opacity-80" : ""}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span>{t}</span>
                          {badge && (
                            <span
                              className={
                                badge === "block"
                                  ? "text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900"
                                  : badge === "booked"
                                  ? "text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-900"
                                  : "text-[10px] px-1.5 py-0.5 rounded bg-purple-200 text-purple-900"
                              }
                            >
                              {badge}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hours</Label>
              <Select
                value={String(blockMinutes / 60)}
                onValueChange={(v) => setBlockMinutes(Number(v) * 60)}
                disabled={!blockDate || blockFullDay}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      blockFullDay ? "Disabled (full day)" : "Select hours"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h} {h === 1 ? "hour" : "hours"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input
                placeholder="e.g., Supply run / Personal"
                value={blockNote}
                onChange={(e) => setBlockNote(e.target.value)}
              />
            </div>

            {/* Manage / Undo blocks for selected day */}
            <div className="space-y-2">
              <Label>Existing blocks for this day</Label>
              {dayBlocks.length === 0 ? (
                <p className="text-sm text-muted-foreground">None</p>
              ) : (
                <ul className="space-y-2">
                  {dayBlocks.map((b) => {
                    const start = new Date(b.start_at);
                    const end = new Date(start.getTime() + b.minutes * 60000);
                    const full = Number(b.minutes) >= 1440;
                    return (
                      <li
                        key={b.id}
                        className="flex items-center justify-between rounded border px-2 py-1 text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {full
                              ? "Full day"
                              : `${format(start, "HH:mm")} – ${format(
                                  end,
                                  "HH:mm"
                                )}`}
                          </span>
                          {b.note && (
                            <span className="text-xs text-muted-foreground">
                              {b.note}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteBlock(b.id)}
                          title="Remove block"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                Click the trash icon to undo a block.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setBlockOpen(false)}>
              Close
            </Button>
            <Button
              onClick={saveBlock}
              disabled={
                blockBusy ||
                !blockDate ||
                (!blockFullDay && (!blockTime || !blockMinutes))
              }
            >
              {blockBusy
                ? "Saving..."
                : blockFullDay
                ? "Save full-day block"
                : "Save block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                          slots are dimmed. Admin blocks are shown in{" "}
                          <span className="font-semibold">amber</span>.
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
                            onMonthChange={(m) => {
                              setCalendarMonth(m);
                              refreshMonthBlocks(m);
                            }}
                            /* mark days that have admin blocks */
                            modifiers={{ adminBlocked: (d) => dayHasBlocks(d) }}
                            /* style the custom modifier */
                            modifiersClassNames={{
                              adminBlocked:
                                "relative after:absolute after:inset-0 after:rounded-md after:ring-1",
                            }}
                            /* keep your usual built-in classNames */
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
                              const kind = unavailableMap.get(v);
                              if (kind) {
                                toast({
                                  title: "Potential conflict",
                                  description:
                                    kind === "block"
                                      ? "This slot has an admin block."
                                      : kind === "booking"
                                      ? "This slot overlaps a booking."
                                      : "This slot overlaps booking + block.",
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
                                const kind = unavailableMap.get(t);
                                const badge =
                                  kind === "both"
                                    ? "both"
                                    : kind === "booking"
                                    ? "booked"
                                    : kind === "block"
                                    ? "block"
                                    : "";
                                return (
                                  <SelectItem
                                    key={t}
                                    value={t}
                                    className={kind ? "opacity-80" : ""}
                                  >
                                    <div className="flex w-full items-center justify-between">
                                      <span>{t}</span>
                                      {badge && (
                                        <span
                                          className={
                                            badge === "block"
                                              ? "text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900"
                                              : badge === "booked"
                                              ? "text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-900"
                                              : "text-[10px] px-1.5 py-0.5 rounded bg-purple-200 text-purple-900"
                                          }
                                        >
                                          {badge}
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            “booked” = customer booking, “block” = admin block,
                            “both” = overlap.
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
