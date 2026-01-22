import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
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
  booking_addon: {
    quantity: number | null;
    addon: {
      name: string;
      base_price: string | null;
      duration_min: number | null;
    } | null;
  }[];
};
// test commit
type DayRow = {
  id: string;
  preferred_at: string;
  status: BookingRow["status"];
  booking_service: {
    quantity: number | null;
    service: { min_minutes: number | null } | null;
  }[];
  booking_addon?: {
    quantity: number | null;
    addon: { duration_min: number | null } | null;
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

  // Reschedule dialog state (single instance)
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
  const [blockFullDay, setBlockFullDay] = useState(false);
  const [dayBlocks, setDayBlocks] = useState<AdminBlock[]>([]);

  // Month-level blocks for coloring the calendar days
  const [monthWithBlocks, setMonthWithBlocks] = useState<Set<string>>(
    new Set(),
  );
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // keep auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setAuthed(!!s),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
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
    ),
    booking_addon (
      quantity,
      addon:addon_id ( name, base_price, duration_min )
    )
  `,
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
  }, [toast]);

  useEffect(() => {
    if (authed) {
      load();
      refreshMonthBlocks(new Date());
    }
  }, [authed, load]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const setStatus = useCallback(
    async (id: string, status: BookingRow["status"]) => {
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
    },
    [toast, load],
  );

  const deleteBooking = useCallback(
    async (id: string) => {
      try {
        setDeletingId(id);
        await supabase.from("booking_service").delete().eq("booking_id", id);
        await supabase.from("booking_addon").delete().eq("booking_id", id);
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
    },
    [toast, load],
  );

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
    acc: Set<string>,
  ) {
    const s = parseISO(startISO);
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

  function buildLocalDate(base: Date, hhmm: string) {
    const [h, m] = hhmm.split(":").map(Number);
    return new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      h,
      m,
      0,
      0,
    );
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

  const refreshMonthBlocks = useCallback(async (month: Date) => {
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
      set.add(format(parseISO(r.start_at), "yyyy-MM-dd"));
    });
    setMonthWithBlocks(set);
  }, []);

  // For a given date, compute unavailable slots + kind map
  async function fetchUnavailableForDate(
    date: Date,
    excludeBookingId?: string,
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
        ),
        booking_addon (
          quantity,
          addon:addon_id ( duration_min )
        )
      `,
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

    const bookedSet = new Set<string>();
    for (const b of bookings ?? []) {
      if (b.id === excludeBookingId) continue;

      const serviceMins = (b.booking_service ?? []).reduce((sum, bs) => {
        const qty = Number(bs?.quantity ?? 1);
        const m = Number(bs?.service?.min_minutes ?? 0);
        return sum + qty * m;
      }, 0);

      const addonMins = (b.booking_addon ?? []).reduce((sum, ba) => {
        const qty = Number(ba?.quantity ?? 1);
        const m = Number(ba?.addon?.duration_min ?? 0);
        return sum + qty * m;
      }, 0);

      const mins = Math.max(1, serviceMins + addonMins);
      expandBlockedHours(b.preferred_at, mins, bookedSet);
    }

    const blocks = await fetchDayBlocks(date);
    setDayBlocks(blocks);
    const blockSet = new Set<string>();
    for (const blk of blocks) {
      expandBlockedHours(blk.start_at, blk.minutes, blockSet);
    }

    const map = new Map<string, UnavailKind>();
    for (const t of bookedSet) map.set(t, "booking");
    for (const t of blockSet) {
      if (map.has(t)) map.set(t, "both");
      else map.set(t, "block");
    }
    setUnavailableMap(map);
  }

  const openReschedule = useCallback((r: BookingRow) => {
    const d = parseISO(r.preferred_at);
    setResBooking(r);
    setResDate(d);
    setResTime(format(d, "HH:mm"));
    setResOpen(true);
    fetchUnavailableForDate(d, r.id);
  }, []);

  useEffect(() => {
    if (resOpen && resDate && resBooking) {
      fetchUnavailableForDate(resDate, resBooking.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resDate]);

  function currentBookingMinMinutes(r: BookingRow | null) {
    if (!r) return 180;
    const services = (r.booking_service ?? []).reduce((sum, bs) => {
      const qty = Number(bs?.quantity ?? 1);
      const m = Number(bs?.service?.min_minutes ?? 0);
      return sum + qty * m;
    }, 0);
    const addons = (r.booking_addon ?? []).reduce((sum, ba) => {
      const qty = Number(ba?.quantity ?? 1);
      const m = Number(ba?.addon?.duration_min ?? 0);
      return sum + qty * m;
    }, 0);
    const total = services + addons;
    return total > 0 ? total : 180;
  }

  function windowsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart < bEnd && bStart < aEnd;
  }

  async function hasConflictOnDay(
    date: Date,
    start: Date,
    minutes: number,
    excludeBookingId?: string,
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
        ),
        booking_addon (
          quantity,
          addon:addon_id ( duration_min )
        )
      `,
      )
      .gte("preferred_at", dayStart.toISOString())
      .lt("preferred_at", dayEnd.toISOString())
      .in("status", ["pending", "confirmed"])
      .returns<DayRow[]>();

    if (othersErr) console.warn(othersErr);

    for (const b of others ?? []) {
      if (b.id === excludeBookingId) continue;

      const serviceMins = (b.booking_service ?? []).reduce((sum, bs) => {
        const qty = Number(bs?.quantity ?? 1);
        const m = Number(bs?.service?.min_minutes ?? 0);
        return sum + qty * m;
      }, 0);
      const addonMins = (b.booking_addon ?? []).reduce((sum, ba) => {
        const qty = Number(ba?.quantity ?? 1);
        const m = Number(ba?.addon?.duration_min ?? 0);
        return sum + qty * m;
      }, 0);

      const mins = Math.max(1, serviceMins + addonMins);
      const bStart = parseISO(b.preferred_at);
      const bEnd = new Date(bStart.getTime() + mins * 60000);
      if (windowsOverlap(start, end, bStart, bEnd)) return true;
    }

    const blocks = await fetchDayBlocks(date);
    for (const blk of blocks) {
      const bStart = parseISO(blk.start_at);
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
    const newStart = buildLocalDate(resDate, resTime);

    const conflict = await hasConflictOnDay(
      resDate,
      newStart,
      myMin,
      resBooking.id,
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
      start = buildLocalDate(blockDate, "00:00");
      minutes = 1440;
    } else {
      if (!blockTime || !blockMinutes) {
        toast({ title: "Missing time / hours", variant: "destructive" });
        return;
      }
      start = buildLocalDate(blockDate, blockTime);
      minutes = blockMinutes;
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
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] sm:max-h-none overflow-y-auto sm:overflow-visible p-6">
          <DialogHeader>
            <DialogTitle>Block time (admin)</DialogTitle>
            <DialogDescription>
              Create a personal block; these appear in{" "}
              <span className="font-semibold">amber</span> on the calendar and
              as “block” in the time list.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 text-[16px] sm:text-base">
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
                    const kind = unavailableMap.get(t);
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
                                  ? "text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary"
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
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
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

            <div className="space-y-2">
              <Label>Existing blocks for this day</Label>
              {dayBlocks.length === 0 ? (
                <p className="text-sm text-muted-foreground">None</p>
              ) : (
                <ul className="space-y-2">
                  {dayBlocks.map((b) => {
                    const start = parseISO(b.start_at);
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
                                  "HH:mm",
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

            <div className="flex gap-2 justify-end pt-2">
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground">
            No bookings to show.
          </CardContent>
        </Card>
      ) : (
        filtered.map((r) => (
          <BookingCard
            key={r.id}
            row={r}
            onConfirm={() => setStatus(r.id, "confirmed")}
            onComplete={() => setStatus(r.id, "completed")}
            onCancel={() => setStatus(r.id, "cancelled")}
            onDelete={() => deleteBooking(r.id)}
            onOpenReschedule={() => openReschedule(r)}
            deleting={deletingId === r.id}
          />
        ))
      )}

      {/* Reschedule dialog */}
      <Dialog
        open={resOpen}
        onOpenChange={(o) => {
          if (!o) {
            setResOpen(false);
            setResBooking(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] sm:max-h-none overflow-y-auto sm:overflow-visible p-6">
          <DialogHeader>
            <DialogTitle>Reschedule booking</DialogTitle>
            <DialogDescription>
              Pick a new date and time. Sundays blocked; booked slots are
              dimmed. Admin blocks are shown in{" "}
              <span className="font-semibold">amber</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 text-[16px] sm:text-base">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary" /> New Date
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
                modifiers={{ adminBlocked: (d) => dayHasBlocks(d) }}
                modifiersClassNames={{
                  adminBlocked:
                    "relative after:absolute after:inset-0 after:rounded-md after:ring-1",
                }}
                classNames={{
                  day_today: "bg-primary/15 text-primary font-semibold",
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
                    placeholder={resDate ? "Select time" : "Pick date first"}
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
                                  ? "text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary"
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
                “booked” = customer booking, “block” = admin block, “both” =
                overlap.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------- Booking card (memoized) -------------------- */
const BookingCard = memo(function BookingCard({
  row,
  onConfirm,
  onComplete,
  onCancel,
  onDelete,
  onOpenReschedule,
  deleting,
}: {
  row: BookingRow;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onOpenReschedule: () => void;
  deleting: boolean;
}) {
  const total = useMemo(() => {
    const svc = (row.booking_service || []).reduce((sum, bs) => {
      const price = Number(bs.price_at_booking ?? bs.service?.base_price ?? 0);
      return sum + price * (bs.quantity ?? 1);
    }, 0);

    const addons = (row.booking_addon || []).reduce((sum, ba) => {
      const price = Number(ba.addon?.base_price ?? 0);
      const qty = Number(ba.quantity ?? 1);
      return sum + price * qty;
    }, 0);

    return svc + addons;
  }, [row.booking_service, row.booking_addon]);

  const addonsList = useMemo(() => {
    const items =
      row.booking_addon
        ?.map((ba) =>
          ba.addon?.name
            ? `${ba.addon.name}${
                ba.quantity && ba.quantity > 1 ? ` × ${ba.quantity}` : ""
              }`
            : null,
        )
        .filter(Boolean) || [];
    return items.length ? items.join(", ") : "—";
  }, [row.booking_addon]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between flex-wrap gap-2">
          <span>
            {row.customer?.full_name ?? "Unknown"} —{" "}
            {parseISO(row.preferred_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
          <span className="text-sm opacity-70">Status: {row.status}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm">
          Email: {row.customer?.email ?? "—"} · Phone:{" "}
          {row.customer?.phone ?? "—"}
        </div>
        <div className="text-sm">Vehicle: {row.vehicle_info ?? "—"}</div>
        <div className="text-sm">Notes: {row.notes ?? "—"}</div>

        <div className="text-sm">
          Services:{" "}
          {(row.booking_service || [])
            .map((bs) => bs.service?.name)
            .filter(Boolean)
            .join(", ") || "—"}
        </div>

        <div className="text-sm">
          Add-ons: <span className="opacity-90">{addonsList}</span>
        </div>

        <div className="text-sm font-medium">Estimate: €{total.toFixed(2)}</div>

        <div className="flex flex-wrap gap-2 pt-3">
          <Button onClick={onConfirm}>Confirm</Button>
          <Button variant="outline" onClick={onComplete}>
            Complete
          </Button>
          <Button variant="destructive" onClick={onCancel}>
            Cancel
          </Button>

          <Button variant="outline" onClick={onOpenReschedule}>
            Reschedule
          </Button>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="ml-auto"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this booking?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the booking and its
                  services/add-ons. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
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
});
