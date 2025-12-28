import { useEffect, useMemo, useState, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// ADDED: needed for OLD time selection UI
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ---------------- helpers (Safari-safe local time) ---------------- */

function localDayRange(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0); // local 00:00
  const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0); // next local 00:00 (exclusive)
  return { start, end };
}

function localDateTime(yyyyMmDd: string, hhmm: string) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0); // local hh:mm
}

/* ---------------- types & constants ---------------- */

type ServiceRow = {
  id: string;
  name: string;
  base_price: string | number | null;
  duration_min: number | null;
};

type AddonRow = {
  id: string;
  name: string;
  base_price: string | number | null;
  duration_min: number | null;
};

type AvailabilityRow = {
  preferred_at: string; // ISO
  status: "pending" | "confirmed";
  total_minutes: number | null; // aggregated duration from the view
};

type AdminBlockRow = {
  start_at: string; // ISO
  minutes: number;
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

/* ============================ Component ============================ */

const Booking = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [addons, setAddons] = useState<AddonRow[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(
    new Set()
  );

  const [isCalOpen, setIsCalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    serviceId: "",
    date: "", // yyyy-MM-dd
    time: "",
    vehicleInfo: "",
    notes: "",
    // ADDED: UI fields referenced in the new layout
    vehicleName: "",
    vehicleType: "",
  });

  const [dateObj, setDateObj] = useState<Date | undefined>(undefined);
  const [unavailableTimes, setUnavailableTimes] = useState<Set<string>>(
    new Set()
  );

  // selected service
  const selectedService = useMemo(
    () => services.find((s) => s.id === formData.serviceId),
    [services, formData.serviceId]
  );

  // selected add-ons resolved to objects
  const selectedAddons = useMemo(
    () => addons.filter((a) => selectedAddonIds.has(a.id)),
    [addons, selectedAddonIds]
  );

  // total minutes from selected add-ons
  const totalAddonMinutes = useMemo(
    () =>
      selectedAddons.reduce(
        (sum, a) => sum + (Number(a.duration_min ?? 0) || 0),
        0
      ),
    [selectedAddons]
  );

  // base service minutes
  const serviceMinutes = useMemo(
    () => Number(selectedService?.duration_min ?? 0) || 0,
    [selectedService]
  );

  // TOTAL minutes for the *new* booking being composed
  const totalSelectedMinutes = useMemo(
    () => serviceMinutes + totalAddonMinutes,
    [serviceMinutes, totalAddonMinutes]
  );

  // --- price helpers ---
  const servicePrice = useMemo(
    () => Number(selectedService?.base_price ?? 0) || 0,
    [selectedService]
  );

  const addonsTotalPrice = useMemo(
    () =>
      selectedAddons.reduce(
        (sum, a) => sum + (Number(a.base_price ?? 0) || 0),
        0
      ),
    [selectedAddons]
  );

  const totalSelectedPrice = servicePrice + addonsTotalPrice;

  const formatPrice = (val: number) =>
    new Intl.NumberFormat(i18n.language, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(val);

  // localized date label
  const fmtDate = (d?: Date) =>
    d
      ? new Intl.DateTimeFormat(i18n.language, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(d)
      : "";

  // local today for disabling past days
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  /* ---------------- load services (WITH duration_min) ---------------- */
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("service")
        .select("id,name,base_price,duration_min")
        .eq("active", true)
        .order("name");

      if (error) {
        toast({
          title: t("booking.toast.servicesFailTitle", "Couldn’t load services"),
          description: error.message,
          variant: "destructive",
        });
      } else {
        setServices(data ?? []);
      }
    })();
  }, [toast, t]);

  /* ---------------- load addons (WITH duration_min) ---------------- */
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("addon")
        .select("id,name,base_price,duration_min")
        .eq("active", true)
        .order("name");

      if (error) {
        toast({
          title: t("booking.toast.addonsFailTitle", "Couldn’t load add-ons"),
          description: error.message,
          variant: "destructive",
        });
      } else {
        setAddons(data ?? []);
      }
    })();
  }, [toast, t]);

  const handleInputChange = (field: string, value: string) =>
    setFormData((p) => ({ ...p, [field]: value }));

  /* ---------------- availability loader (reusable) ---------------- */
  const loadAvailabilityForDate = useCallback(
    async (yyyyMmDd: string) => {
      if (!yyyyMmDd) {
        setUnavailableTimes(new Set());
        return;
      }

      const { start, end } = localDayRange(yyyyMmDd);

      // 1) Load bookings for that local day from availability view
      const { data: avail, error: availErr } = await supabase
        .from("booking_availability")
        .select("preferred_at, status, total_minutes")
        .gte("preferred_at", start.toISOString())
        .lt("preferred_at", end.toISOString())
        .returns<AvailabilityRow[]>();

      if (availErr) {
        console.error("availability error:", availErr);
        toast({
          title: t(
            "booking.toast.availabilityFailTitle",
            "Couldn’t load availability"
          ),
          description: availErr.message,
          variant: "destructive",
        });
        setUnavailableTimes(new Set());
        return;
      }

      // 2) Load admin blocks
      const { data: blocks, error: blocksErr } = await supabase
        .from("admin_block")
        .select("start_at, minutes")
        .gte("start_at", start.toISOString())
        .lt("start_at", end.toISOString())
        .order("start_at", { ascending: true })
        .returns<AdminBlockRow[]>();

      if (blocksErr) {
        console.warn("admin_block fetch error:", blocksErr);
      }

      // Build the blocked set (hours) from bookings and blocks
      const blocked = new Set<string>();

      function blockRange(startISO: string, minutes: number) {
        const s = new Date(startISO);
        const e = new Date(s.getTime() + minutes * 60000);

        const iter = new Date(s);
        iter.setMinutes(0, 0, 0);
        blocked.add(format(iter, "HH:mm"));

        while (true) {
          iter.setHours(iter.getHours() + 1);
          if (iter < e) blocked.add(format(iter, "HH:mm"));
          else break;
        }
      }

      // From bookings (view)
      for (const b of avail ?? []) {
        const mins = Math.max(1, Number(b.total_minutes ?? 0)) || 180;
        blockRange(b.preferred_at, mins);
      }

      // From admin blocks
      for (const blk of blocks ?? []) {
        const mins = Math.max(1, Number(blk.minutes ?? 0));
        blockRange(blk.start_at, mins);
      }

      setUnavailableTimes(blocked);

      // If currently selected time became blocked, clear it
      if (formData.time && blocked.has(formData.time)) {
        setFormData((p) => ({ ...p, time: "" }));
      }
    },
    [toast, t, formData.time]
  );

  /* ---------------- availability (load when date changes) ---------------- */
  useEffect(() => {
    if (!formData.date) {
      setUnavailableTimes(new Set());
      return;
    }
    loadAvailabilityForDate(formData.date);
  }, [formData.date, loadAvailabilityForDate]);

  /* ---------------- overlap check for the current selection ---------------- */
  const wouldOverlap = (startTimeHHmm: string) => {
    if (!formData.date) return true; // cannot evaluate
    const total = totalSelectedMinutes || 0;
    if (total <= 0) return false; // no duration info, allow

    const start = localDateTime(formData.date, startTimeHHmm);
    const end = new Date(start.getTime() + total * 60000);

    const iter = new Date(start);
    iter.setMinutes(0, 0, 0);

    // walk hour-by-hour; if *any* occupied hour is blocked, it overlaps
    while (iter < end) {
      const key = format(iter, "HH:mm");
      if (unavailableTimes.has(key)) return true;
      iter.setHours(iter.getHours() + 1);
    }
    return false;
  };

  /* ---------------- submit ---------------- */
  const handleSubmit = async (e?: React.SyntheticEvent) => {
    // ADDED: allow onClick usage (no <form>) while keeping behavior
    e?.preventDefault?.();

    const { name, email, phone, serviceId, date, time } = formData;

    if (!name || !email || !phone || !serviceId || !date || !time) {
      toast({
        title: t("booking.toast.missing.title"),
        description: t("booking.toast.missing.desc"),
        variant: "destructive",
      });
      return;
    }

    const preferred_at = localDateTime(date, time);

    if (preferred_at.getDay() === 0) {
      toast({
        title: t("booking.toast.sunday.title"),
        description: t("booking.toast.sunday.desc"),
        variant: "destructive",
      });
      return;
    }
    if (preferred_at < new Date()) {
      toast({
        title: t("booking.toast.past.title"),
        description: t("booking.toast.past.desc"),
        variant: "destructive",
      });
      return;
    }
    // Check overlap with *current* total selection (service + add-ons)
    if (wouldOverlap(time)) {
      toast({
        title: t("booking.toast.unavailable.title"),
        description: t(
          "booking.toast.unavailable.descFull",
          "The selected start time overlaps with another booking."
        ),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          vehicleInfo:
            formData.vehicleInfo ||
            formData.vehicleName ||
            (formData.vehicleType ? formData.vehicleType : null) ||
            null,
          notes: formData.notes || null,
          preferred_at: preferred_at.toISOString(),
          serviceId,
          addonIds: Array.from(selectedAddonIds),
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Booking failed");
      }

      await loadAvailabilityForDate(date);

      toast({ title: t("booking.toast.ok.title") });

      setFormData((p) => ({
        ...p,
        name: "",
        email: "",
        phone: "",
        serviceId: "",
        time: "",
        vehicleInfo: "",
        notes: "",
        vehicleName: "",
        vehicleType: "",
        // keep date as-is
      }));
      setSelectedAddonIds(new Set());
    } catch (err: any) {
      toast({
        title: t("booking.toast.fail.title"),
        description: err?.message ?? t("booking.toast.fail.desc"),
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ============================ UI (ADDED) ============================ */

  // ADDED: UI style tokens
  const pillBase =
    "rounded-2xl border p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30";
  const pillIdle = "border-border hover:border-amber-400/40 bg-card";
  const pillActive =
    "border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/40";

  // ADDED: formatters used by the new layout
  const formatEuro = (val: string | number | null) =>
    formatPrice(Number(val ?? 0) || 0);

  const fmtHours = (minutes: number | null) => {
    const m = Math.max(0, Number(minutes ?? 0) || 0);
    if (!m) return "—";
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (h <= 0) return `${m} ${t("booking.minutes", "min")}`;
    if (r === 0) return `${h}${t("booking.hoursShort", "h")}`;
    return `${h}${t("booking.hoursShort", "h")} ${r}${t(
      "booking.minutesShort",
      "m"
    )}`;
  };

  // ADDED: sorted services for cards
  const sortedServices = useMemo(() => {
    const copy = [...services];
    copy.sort((a, b) => a.name.localeCompare(b.name));
    return copy;
  }, [services]);

  // ADDED: step gating flags (minimal)
  const step1Done = !!formData.serviceId;
  const step2Done = step1Done; // add-ons optional
  const step3Done = !!formData.date && !!formData.time;
  const step4Done = step3Done;
  const step5Done = step4Done && !!formData.vehicleName.trim();
  const canSubmit =
    !!formData.name &&
    !!formData.email &&
    !!formData.phone &&
    !!formData.serviceId &&
    !!formData.date &&
    !!formData.time;
  const step6Done = canSubmit;

  // ADDED: totals for summary
  const totalMinutes = totalSelectedMinutes;
  const totalPrice = totalSelectedPrice;

  // ADDED: StepHeader component
  const StepHeader = ({
    num,
    title,
    done,
    hint,
  }: {
    num: number;
    title: string;
    done: boolean;
    hint?: string;
  }) => (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 h-8 w-8 rounded-full border flex items-center justify-center text-sm",
            done
              ? "border-amber-400/60 bg-amber-400/10 text-amber-200"
              : "border-border text-muted-foreground"
          )}
        >
          {done ? <Check className="h-4 w-4" /> : num}
        </div>
        <div>
          <div className="font-semibold">{title}</div>
          {hint ? (
            <div className="text-sm text-muted-foreground mt-1">{hint}</div>
          ) : null}
        </div>
      </div>
    </div>
  );

  // ADDED: AmberButton (simple wrapper)
  const AmberButton = Button;

  return (
    <section className="min-h-screen bg-secondary/20">
      <Helmet>
        <title>{t("seo.booking.title")}</title>
        <meta name="description" content={t("seo.booking.description")} />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-20 grid lg:grid-cols-[1fr_360px] gap-12">
        {/* MAIN FLOW */}
        <div className="space-y-14">
          {/* STEP 1 */}
          <div className="space-y-6">
            <StepHeader
              num={1}
              title={t("booking.steps.package.title")}
              done={step1Done}
              hint={t("booking.steps.package.hint")}
            />

            <div className="grid md:grid-cols-3 gap-4">
              {sortedServices.map((s) => {
                const active = s.id === formData.serviceId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setFormData((p) => ({
                        ...p,
                        serviceId: s.id,
                        time: "",
                        date: p.date,
                      }));
                    }}
                    className={cn(pillBase, active ? pillActive : pillIdle)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-lg">{s.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("booking.meta.from")} {formatEuro(s.base_price)} ·{" "}
                          {t("booking.meta.approx")} {fmtHours(s.duration_min)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2 */}
          {step1Done && (
            <div className="space-y-6">
              <StepHeader
                num={2}
                title={t("booking.steps.addons.title")}
                done={step2Done}
                hint={t("booking.steps.addons.hint")}
              />

              {addons.length === 0 ? (
                <div className="rounded-2xl border p-5 text-sm text-muted-foreground">
                  {t("booking.addons.empty")}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {addons.map((a) => {
                    const checked = selectedAddonIds.has(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setSelectedAddonIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(a.id)) next.delete(a.id);
                            else next.add(a.id);
                            return next;
                          });
                          setFormData((p) => ({ ...p, time: "" }));
                        }}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition hover:border-amber-400/40",
                          checked
                            ? "border-amber-400 bg-amber-400/10 ring-1 ring-amber-400/40"
                            : "border-border"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{a.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatEuro(a.base_price)} +{"\u00A0"}
                              {a.duration_min ?? 0} {t("booking.meta.minutes")}
                            </div>
                          </div>
                          <div className="pt-0.5">
                            <Checkbox checked={checked} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 (KEEP OLD DATE & TIME UI) */}
          {step1Done && step2Done && (
            <div className="space-y-6">
              <StepHeader
                num={3}
                title={t("booking.steps.datetime.title")}
                done={step3Done}
                hint={t("booking.steps.datetime.hint")}
              />

              <div className="grid md:grid-cols-2 gap-4">
                {/* Date (OLD) */}
                <div className="space-y-2">
                  <Popover open={isCalOpen} onOpenChange={setIsCalOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-start w-full bg-background border-border hover:border-amber-400/40"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-amber-200" />
                        {dateObj ? (
                          fmtDate(dateObj)
                        ) : (
                          <span>{t("booking.ph.pickDate")}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-popover border-border"
                      align="start"
                    >
                      <DatePicker
                        mode="single"
                        selected={dateObj}
                        onSelect={(d) => {
                          if (!d) return;
                          setDateObj(d);
                          // keep old behavior
                          setFormData((p) => ({
                            ...p,
                            date: format(d, "yyyy-MM-dd"),
                            time: "",
                          }));
                          setIsCalOpen(false);
                        }}
                        disabled={(d) => d.getDay() === 0 || d < today}
                        initialFocus
                        classNames={{
                          day_today: "bg-primary/15 text-primary font-semibold",
                          day_selected:
                            "bg-transparent text-foreground hover:bg-transparent focus:bg-transparent",
                          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10",
                        }}
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="text-sm text-muted-foreground">
                    {t("booking.meta.estimatedDuration")}{" "}
                    <span className="text-amber-200 font-medium">
                      {totalMinutes ? fmtHours(totalMinutes) : "—"}
                    </span>
                  </div>
                </div>

                {/* Time (OLD) */}
                <div className="space-y-2">
                  <Select
                    value={formData.time}
                    onValueChange={(v) => {
                      if (wouldOverlap(v)) {
                        toast({
                          title: t("booking.toast.unavailable.title"),
                          description: t(
                            "booking.toast.unavailable.descFull",
                            "The selected start time overlaps with another booking."
                          ),
                          variant: "destructive",
                        });
                        return;
                      }
                      setFormData((p) => ({ ...p, time: v }));
                    }}
                    disabled={!formData.date}
                  >
                    <SelectTrigger className="bg-background border-border hover:border-amber-400/40">
                      <SelectValue
                        placeholder={
                          formData.date
                            ? t("booking.ph.selectTime")
                            : t("booking.ph.pickDateFirst")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {TIMES.map((tm) => {
                        const takenByStart = unavailableTimes.has(tm);
                        const overlap = !takenByStart && wouldOverlap(tm);
                        const disabled = takenByStart || overlap;
                        return (
                          <SelectItem
                            key={tm}
                            value={tm}
                            disabled={disabled}
                            className={disabled ? "opacity-50" : ""}
                          >
                            {tm}{" "}
                            {takenByStart
                              ? `— ${t("booking.booked")}`
                              : overlap
                                ? `— ${t(
                                    "booking.notEnoughRoom",
                                    "not enough room"
                                  )}`
                                : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 (Vehicle details) */}
          {step4Done && (
            <div className="space-y-6">
              <StepHeader
                num={4}
                title={t("booking.steps.vehicleDetails.title")}
                done={step5Done}
                hint={t("booking.steps.vehicleDetails.hint")}
              />

              <div className="space-y-3">
                <Input
                  placeholder={t("booking.ph.vehicleName")}
                  value={formData.vehicleName}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      vehicleName: e.target.value,
                      vehicleInfo: e.target.value, // ADDED: keep existing payload field populated
                    }))
                  }
                  className="border-amber-400/20 focus-visible:ring-amber-400/30"
                />
                <Textarea
                  placeholder={t("booking.ph.notes")}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, notes: e.target.value }))
                  }
                  className="min-h-[110px] border-amber-400/20 focus-visible:ring-amber-400/30"
                />
              </div>
            </div>
          )}

          {/* STEP 5 (Contact) */}
          {step5Done && (
            <div className="space-y-6">
              <StepHeader
                num={5}
                title={t("booking.steps.contact.title")}
                done={step6Done}
                hint={t("booking.steps.contact.hint")}
              />

              <div className="space-y-3">
                <Input
                  placeholder={t("booking.ph.fullName")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  className="border-amber-400/20 focus-visible:ring-amber-400/30"
                />
                <Input
                  placeholder={t("booking.ph.phone")}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="border-amber-400/20 focus-visible:ring-amber-400/30"
                />
                <Input
                  placeholder={t("booking.ph.email")}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  className="border-amber-400/20 focus-visible:ring-amber-400/30"
                />

                <AmberButton
                  size="lg"
                  className={cn(
                    "w-full",
                    "bg-amber-400 text-black hover:bg-amber-300",
                    !canSubmit && "opacity-60"
                  )}
                  disabled={loading || !canSubmit}
                  onClick={(e) => void handleSubmit(e)}
                >
                  {loading
                    ? t("booking.btn.submitting")
                    : t("booking.btn.submit")}
                </AmberButton>

                {!canSubmit && (
                  <p className="text-xs text-muted-foreground">
                    {t("booking.validation.completeSteps")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SUMMARY */}
        {selectedService && (
          <aside className="sticky top-24 h-fit rounded-2xl border bg-card overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{t("booking.summary.title")}</h3>
                <div className="text-xs px-2 py-1 rounded-full border border-amber-400/40 text-amber-200">
                  {formatEuro(totalPrice)}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t("booking.summary.package")}
                  </span>
                  <span className="font-medium text-right">
                    {selectedService.name}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t("booking.summary.duration")}
                  </span>
                  <span className="font-medium">
                    {totalMinutes ? fmtHours(totalMinutes) : "—"}
                  </span>
                </div>

                {selectedAddons.length > 0 && (
                  <div className="pt-2">
                    <div className="text-muted-foreground mb-2">
                      {t("booking.summary.addons")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedAddons.map((a) => (
                        <span
                          key={a.id}
                          className="text-xs rounded-full border border-amber-400/30 bg-amber-400/5 px-2 py-1"
                        >
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">
                  {t("booking.summary.dateTime")}
                </span>
                <span className="font-medium text-right">
                  {formData.date ? formData.date : "—"}
                  {formData.time ? ` · ${formData.time}` : ""}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">
                  {t("booking.summary.vehicle")}
                </span>
                <span className="font-medium text-right">
                  {formData.vehicleType
                    ? t(`booking.vehicleTypes.${formData.vehicleType}`)
                    : "—"}
                  {formData.vehicleName ? ` · ${formData.vehicleName}` : ""}
                </span>
              </div>

              {formData.notes && (
                <div className="pt-2">
                  <div className="text-muted-foreground mb-1">
                    {t("booking.summary.notes")}
                  </div>
                  <div className="rounded-xl border p-3 text-muted-foreground">
                    {formData.notes}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <div className="text-muted-foreground mb-1">
                  {t("booking.summary.contact")}
                </div>
                <div className="rounded-xl border p-3">
                  <div className="font-medium">{formData.name || "—"}</div>
                  <div className="text-muted-foreground">
                    {formData.phone || "—"}
                  </div>
                  <div className="text-muted-foreground">
                    {formData.email || "—"}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* <Footer /> */}
    </section>
  );
};

export default Booking;
