import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, EllipsisVertical, Trash2 } from "lucide-react";
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

type AdminBlockRow = {
  start_at: string;
  minutes: number;
};

function localDayRange(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  return { start, end };
}

export default function AdminBookings() {
  const { toast } = useToast();
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<BookingRow["status"] | "all">("pending");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [blockedRows, setBlockedRows] = useState<AdminBlockRow[]>([]);
  const [blockedSelection, setBlockedSelection] = useState<Date[]>([]);
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockPanelOpen, setBlockPanelOpen] = useState(false);

  // Sorting: ascending/descending
  const [ascending, setAscending] = useState(true);

  // Reschedule dialog state
  const [resOpen, setResOpen] = useState(false);
  const [resBooking, setResBooking] = useState<BookingRow | null>(null);
  const [resDate, setResDate] = useState<Date | undefined>(undefined);
  const [resTime, setResTime] = useState<string>("");
  const [resBusy, setResBusy] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const ensureActiveSession = useCallback(async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    if (!sessionData.session) {
      setAuthed(false);
      return false;
    }

    const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn("Admin session refresh failed:", refreshError);
      await supabase.auth.signOut();
      setAuthed(false);
      return false;
    }

    const hasValidSession = !!(refreshedData.session ?? sessionData.session);
    setAuthed(hasValidSession);
    return hasValidSession;
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    void supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));

    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    try {
      const hasValidSession = await ensureActiveSession();
      if (!hasValidSession) {
        setRows([]);
        return;
      }

      setLoading(true);

      const primaryQuery = supabase
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

      let { data, error } = await primaryQuery;

      if (error) {
        const fallbackBase = await supabase
          .from("booking")
          .select("id, created_at, preferred_at, status, vehicle_info, notes, customer_id")
          .order("preferred_at", { ascending: true })
          .limit(200);

        if (fallbackBase.error) throw fallbackBase.error;

        const baseRows = (fallbackBase.data ?? []) as Array<{
          id: string;
          created_at: string;
          preferred_at: string;
          status: BookingRow["status"];
          vehicle_info: string | null;
          notes: string | null;
          customer_id: string | null;
        }>;

        const bookingIds = baseRows.map((row) => row.id);
        const customerIds = Array.from(new Set(baseRows.map((row) => row.customer_id).filter(Boolean) as string[]));

        const [customerResult, serviceResult, addonResult] = await Promise.all([
          customerIds.length
            ? supabase.from("customer").select("id, full_name, email, phone").in("id", customerIds)
            : Promise.resolve({ data: [], error: null }),
          bookingIds.length
            ? supabase.from("booking_service").select("booking_id, quantity, price_at_booking, service_id").in("booking_id", bookingIds)
            : Promise.resolve({ data: [], error: null }),
          bookingIds.length
            ? supabase.from("booking_addon").select("booking_id, quantity, addon_id").in("booking_id", bookingIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (customerResult.error) throw customerResult.error;
        if (serviceResult.error) throw serviceResult.error;
        if (addonResult.error) throw addonResult.error;

        const serviceIds = Array.from(
          new Set((serviceResult.data ?? []).map((row: any) => row.service_id).filter(Boolean)),
        );
        const addonIds = Array.from(
          new Set((addonResult.data ?? []).map((row: any) => row.addon_id).filter(Boolean)),
        );

        const [serviceMetaResult, addonMetaResult] = await Promise.all([
          serviceIds.length
            ? supabase.from("service").select("id, name, base_price, duration_min").in("id", serviceIds)
            : Promise.resolve({ data: [], error: null }),
          addonIds.length
            ? supabase.from("addon").select("id, name, base_price, duration_min").in("id", addonIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (serviceMetaResult.error) throw serviceMetaResult.error;
        if (addonMetaResult.error) throw addonMetaResult.error;

        const customerById = new Map((customerResult.data ?? []).map((row: any) => [row.id, row]));
        const serviceById = new Map((serviceMetaResult.data ?? []).map((row: any) => [row.id, row]));
        const addonById = new Map((addonMetaResult.data ?? []).map((row: any) => [row.id, row]));

        const hydratedRows = baseRows.map((row) => {
          const customer = customerById.get(row.customer_id ?? "") ?? null;

          const bookingServices = (serviceResult.data ?? []).filter((svc: any) => svc.booking_id === row.id).map((svc: any) => ({
            quantity: svc.quantity,
            price_at_booking: svc.price_at_booking,
            service: serviceById.get(svc.service_id) ?? null,
          }));

          const bookingAddons = (addonResult.data ?? []).filter((ba: any) => ba.booking_id === row.id).map((ba: any) => ({
            quantity: ba.quantity,
            addon: addonById.get(ba.addon_id) ?? null,
          }));

          return {
            ...row,
            customer: customer
              ? {
                  full_name: customer.full_name,
                  email: customer.email,
                  phone: customer.phone,
                }
              : { full_name: "Unknown", email: null, phone: null },
            booking_service: bookingServices,
            booking_addon: bookingAddons,
          } as BookingRow;
        });

        setRows(hydratedRows);
        return;
      }

      setRows((data as BookingRow[]) ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({
        title: "Load failed",
        description: message,
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [ensureActiveSession, toast]);

  const loadBlockedDates = useCallback(async () => {
    try {
      const hasValidSession = await ensureActiveSession();
      if (!hasValidSession) {
        setBlockedRows([]);
        return;
      }

      const { data, error } = await supabase
        .from("admin_block")
        .select("start_at, minutes")
        .order("start_at", { ascending: true })
        .returns<AdminBlockRow[]>();

      if (error) {
        throw error;
      }

      setBlockedRows(data ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({
        title: "Blocked dates failed",
        description: message,
        variant: "destructive",
      });
      setBlockedRows([]);
    }
  }, [ensureActiveSession, toast]);

  useEffect(() => {
    if (authed) {
      load();
      loadBlockedDates();
    }
  }, [authed, load, loadBlockedDates]);

  const blockedDateObjects = useMemo(
    () => blockedRows.map((row) => parseISO(row.start_at)),
    [blockedRows],
  );

  const blockedDateLabels = useMemo(
    () =>
      blockedRows.map((row) => format(parseISO(row.start_at), "yyyy-MM-dd")),
    [blockedRows],
  );

  const blockSelectedDates = useCallback(async () => {
    if (blockedSelection.length === 0) {
      toast({ title: "Select one or more dates", variant: "destructive" });
      return;
    }

    setBlockLoading(true);
    try {
      const uniqueDates = Array.from(
        new Set(blockedSelection.map((date) => format(date, "yyyy-MM-dd"))),
      );

      for (const yyyyMmDd of uniqueDates) {
        const { start, end } = localDayRange(yyyyMmDd);
        const { error: deleteError } = await supabase
          .from("admin_block")
          .delete()
          .gte("start_at", start.toISOString())
          .lt("start_at", end.toISOString());

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase.from("admin_block").insert(
          {
            start_at: start.toISOString(),
            minutes: 24 * 60,
          },
        );

        if (insertError) throw insertError;
      }

      setBlockedSelection([]);
      await loadBlockedDates();
      toast({ title: "Selected dates marked as booked" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({
        title: "Could not save blocked dates",
        description: message,
        variant: "destructive",
      });
    } finally {
      setBlockLoading(false);
    }
  }, [blockedSelection, loadBlockedDates, toast]);

  const clearSelectedDates = useCallback(async () => {
    if (blockedSelection.length === 0) {
      toast({ title: "Select one or more dates", variant: "destructive" });
      return;
    }

    setBlockLoading(true);
    try {
      const uniqueDates = Array.from(
        new Set(blockedSelection.map((date) => format(date, "yyyy-MM-dd"))),
      );

      for (const yyyyMmDd of uniqueDates) {
        const { start, end } = localDayRange(yyyyMmDd);
        const { error } = await supabase
          .from("admin_block")
          .delete()
          .gte("start_at", start.toISOString())
          .lt("start_at", end.toISOString());

        if (error) throw error;
      }

      setBlockedSelection([]);
      await loadBlockedDates();
      toast({ title: "Selected dates cleared" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast({
        title: "Could not clear blocked dates",
        description: message,
        variant: "destructive",
      });
    } finally {
      setBlockLoading(false);
    }
  }, [blockedSelection, loadBlockedDates, toast]);

  const filtered = useMemo(() => {
    let data = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);
    data = data.sort((a, b) => {
      const aTime = new Date(a.preferred_at).getTime();
      const bTime = new Date(b.preferred_at).getTime();
      return ascending ? aTime - bTime : bTime - aTime;
    });
    return data;
  }, [rows, statusFilter, ascending]);

  const setStatus = useCallback(
    async (id: string, status: BookingRow["status"]) => {
      const { error } = await supabase.from("booking").update({ status }).eq("id", id);
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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Please try again.";
        toast({
          title: "Delete failed",
          description: message,
          variant: "destructive",
        });
        console.error(err);
      } finally {
        setDeletingId(null);
      }
    },
    [toast, load],
  );

  const openReschedule = useCallback((r: BookingRow) => {
    const d = parseISO(r.preferred_at);
    setResBooking(r);
    setResDate(d);
    setResTime(d.toISOString().slice(11, 16));
    setResOpen(true);
  }, []);

  async function saveReschedule() {
    if (!resBooking || !resDate || !resTime) {
      toast({ title: "Missing date/time", variant: "destructive" });
      return;
    }

    const [h, m] = resTime.split(":").map(Number);
    const newStart = new Date(resDate);
    newStart.setHours(h, m, 0, 0);

    setResBusy(true);
    const { error } = await supabase.from("booking").update({ preferred_at: newStart.toISOString() }).eq("id", resBooking.id);
    setResBusy(false);

    if (error) {
      toast({ title: "Reschedule failed", description: error.message, variant: "destructive" });
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
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold">Bookings</h1>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as BookingRow["status"] | "all")}
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

          <Button variant="outline" onClick={() => setAscending(!ascending)}>
            Sort: {ascending ? "Asc" : "Desc"}
          </Button>

          {/* Desktop buttons */}
          <div className="hidden sm:flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </Button>
            <Button variant="destructive" onClick={() => supabase.auth.signOut()}>
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
                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); if (!loading) load(); }} className={loading ? "opacity-50 pointer-events-none" : ""}>
                  {loading ? "Loading..." : "Refresh"}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => supabase.auth.signOut()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Collapsible open={blockPanelOpen} onOpenChange={setBlockPanelOpen}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Block dates</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                {blockPanelOpen ? "Hide" : "Show"}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start">
                <div className="rounded-xl border bg-background p-2">
                  <DatePickerCalendar
                    mode="multiple"
                    selected={blockedSelection}
                    onSelect={(dates) => setBlockedSelection(dates ?? [])}
                    modifiers={{ booked: blockedDateObjects }}
                    modifiersClassNames={{
                      booked:
                        "!bg-red-600 !text-white !opacity-100 hover:!bg-red-600 hover:!text-white",
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border bg-background px-2.5 py-1 text-muted-foreground">
                      Select dates to block
                    </span>
                    <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-red-700">
                      Booked / blocked dates show red
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={blockSelectedDates} disabled={blockLoading}>
                      {blockLoading ? "Saving..." : "Mark selected as booked"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearSelectedDates}
                      disabled={blockLoading}
                    >
                      Clear selected dates
                    </Button>
                  </div>

                  <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                    <div className="font-medium mb-2">Current blocked dates</div>
                    {blockedDateLabels.length === 0 ? (
                      <div className="text-muted-foreground">No dates are blocked.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {blockedDateLabels.map((label) => (
                          <span
                            key={label}
                            className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-red-700"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-muted-foreground">No bookings to show.</CardContent>
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
      <Dialog open={resOpen} onOpenChange={(o) => { if (!o) { setResOpen(false); setResBooking(null); } }}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Reschedule booking</DialogTitle>
            <DialogDescription>Pick a new date and time.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 text-[16px] sm:text-base">
            <div className="space-y-2">
              <Label>New Date</Label>
              <Input type="date" value={resDate?.toISOString().slice(0, 10)} onChange={(e) => setResDate(e.target.value ? new Date(e.target.value) : undefined)} />
            </div>

            <div className="space-y-2">
              <Label>New Time</Label>
              <Input type="time" value={resTime} onChange={(e) => setResTime(e.target.value)} />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { setResOpen(false); setResBooking(null); }}>Cancel</Button>
              <Button onClick={saveReschedule} disabled={resBusy || !resDate || !resTime}>
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
            ? `${ba.addon.name}${ba.quantity && ba.quantity > 1 ? ` × ${ba.quantity}` : ""}`
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
          Email: {row.customer?.email ?? "—"} · Phone: {row.customer?.phone ?? "—"}
        </div>
        <div className="text-sm">Vehicle: {row.vehicle_info ?? "—"}</div>
        <div className="text-sm">Notes: {row.notes ?? "—"}</div>
        <div className="text-sm">
          Services: {(row.booking_service || []).map((bs) => bs.service?.name).filter(Boolean).join(", ") || "—"}
        </div>
        <div className="text-sm">Add-ons: <span className="opacity-90">{addonsList}</span></div>
        <div className="text-sm font-medium">Estimate: €{total.toFixed(2)}</div>

        <div className="flex flex-wrap gap-2 pt-3">
          <Button onClick={onConfirm}>Confirm</Button>
          <Button variant="outline" onClick={onComplete}>Complete</Button>
          <Button variant="destructive" onClick={onCancel}>Cancel</Button>
          <Button variant="outline" onClick={onOpenReschedule}>Reschedule</Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="ml-auto" disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this booking?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the booking and its services/add-ons. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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