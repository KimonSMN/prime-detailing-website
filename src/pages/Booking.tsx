import { useEffect, useMemo, useState, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  Car as CarIcon,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Checkbox } from "@/components/ui/checkbox";

import Footer from "../components/Footer";
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

  /* ---------------- Add-on toggle helper ---------------- */
  const toggleAddon = (id: string, checked: boolean) => {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          vehicleInfo: formData.vehicleInfo || null,
          notes: formData.notes || null,
          preferred_at: preferred_at.toISOString(),
          serviceId, // backend/view keeps computing authoritative total
          addonIds: Array.from(selectedAddonIds),
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Booking failed");
      }

      // Immediately refresh availability for the same date so the slot appears as booked
      await loadAvailabilityForDate(date);

      toast({
        title: t("booking.toast.ok.title"),
        description: t("booking.toast.ok.desc"),
      });

      // Clear user fields but KEEP the chosen date (and dateObj) so the user sees the updated day
      setFormData((p) => ({
        ...p,
        name: "",
        email: "",
        phone: "",
        serviceId: "",
        time: "",
        vehicleInfo: "",
        notes: "",
        // keep date as-is
      }));
      setSelectedAddonIds(new Set());
      // keep dateObj as-is
      // keep unavailableTimes as refreshed
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

  /* ---------------- UI ---------------- */
  return (
    <section
      id="booking"
      className="min-h-screen flex flex-col bg-secondary/20"
    >
      <div className="flex-grow py-20 px-4 max-w-6xl mx-auto">
        <Helmet>
          <title>Book an Appointment | Prime Detailing Cholargos</title>
          <meta
            name="description"
            content="Book your car detailing appointment in Cholargos — choose service, add-ons, date, and time online."
          />
        </Helmet>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t("booking.titlePrefix")}{" "}
              <span className="bg-gold-gradient bg-clip-text text-transparent">
                {t("booking.titleAccent")}
              </span>
            </h2>
          </div>

          <Card className="bg-card border-border shadow-elegant animate-slide-up">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-foreground">
                {t("booking.card.title")}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />{" "}
                      {t("booking.fullName")} *
                    </Label>
                    <Input
                      id="name"
                      placeholder={t("booking.ph.fullName")}
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />{" "}
                      {t("booking.phone")} *
                    </Label>
                    <Input
                      id="phone"
                      placeholder={t("booking.ph.phone")}
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />{" "}
                    {t("booking.email")} *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("booking.ph.email")}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-background border-border"
                  />
                </div>

                {/* Service */}
                <div className="space-y-2">
                  <Label
                    htmlFor="service-select"
                    className="flex items-center gap-2"
                  >
                    <CarIcon className="w-4 h-4 text-primary" />{" "}
                    {t("booking.selectService")} *
                  </Label>
                  <Select
                    value={formData.serviceId}
                    onValueChange={(v) => handleInputChange("serviceId", v)}
                  >
                    <SelectTrigger
                      id="service-select"
                      className="bg-background border-border"
                    >
                      <SelectValue
                        placeholder={t("booking.ph.chooseService")}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                          {s.base_price
                            ? ` — ${t("booking.fromPrice", {
                                price: s.base_price,
                              })}`
                            : ""}
                          {s.duration_min
                            ? ` • ~${s.duration_min} ${t(
                                "booking.minutes",
                                "min"
                              )}`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Add-ons */}
                {addons.length > 0 && (
                  <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      {t(
                        "booking.selectAddons",
                        "Add-ons (optional): protection & extras"
                      )}
                    </Label>

                    {(() => {
                      const prot = addons
                        .filter(
                          (a) =>
                            a.name.toLowerCase().includes("protect") ||
                            a.name.toLowerCase().includes("coating") ||
                            a.name.toLowerCase().includes("wax")
                        )
                        .sort(
                          (a, b) =>
                            Number(a.base_price ?? 0) -
                            Number(b.base_price ?? 0)
                        );

                      const extras = addons
                        .filter((a) => !prot.includes(a))
                        .sort(
                          (a, b) =>
                            Number(a.base_price ?? 0) -
                            Number(b.base_price ?? 0)
                        );

                      const renderAddon = (a: AddonRow) => {
                        const checked = selectedAddonIds.has(a.id);
                        const checkboxId = `addon-${a.id}`;
                        const minutes = Number(a.duration_min ?? 0) || 0;
                        return (
                          <div
                            key={a.id}
                            className={`rounded-xl border p-3 bg-background transition ${
                              checked
                                ? "border-primary/70 ring-1 ring-primary/40"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={checkboxId}
                                checked={checked}
                                onCheckedChange={(val) =>
                                  toggleAddon(a.id, val === true)
                                }
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={checkboxId}
                                  className="font-medium cursor-pointer"
                                >
                                  {a.name}
                                </label>

                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {a.base_price != null && (
                                    <div className="text-sm text-muted-foreground">
                                      {t("booking.fromPrice", {
                                        price: a.base_price,
                                      })}
                                    </div>
                                  )}
                                  {minutes > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                                      ≈ {minutes} {t("booking.minutes", "min")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      };

                      return (
                        <div className="grid sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-lg">
                              Protection
                            </h4>
                            <p className="text-sm text-muted-foreground italic">
                              Great to lock in the look of your freshly detailed
                              car.
                            </p>
                            {prot.length > 0 ? (
                              prot.map(renderAddon)
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                None available
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-semibold text-lg">Extras</h4>
                            <p className="text-sm text-muted-foreground italic">
                              Optional upgrades to take your detail to the next
                              level.
                            </p>
                            {extras.length > 0 ? (
                              extras.map(renderAddon)
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                None available
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {(serviceMinutes > 0 || selectedAddons.length > 0) && (
                      <div className="rounded-lg border p-3 bg-secondary/10 text-left">
                        <div className="text-sm text-muted-foreground">
                          {t("booking.estimatedTotal", "Estimated total time")}:{" "}
                          <strong>
                            {(totalSelectedMinutes / 60).toFixed(1)}{" "}
                            {t("booking.hours", "hours")}
                          </strong>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {t("booking.estimatedPrice", "Estimated price")}:{" "}
                          <strong>{formatPrice(totalSelectedPrice)}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Date & Time */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary" />{" "}
                      {t("booking.preferredDate")} *
                    </Label>
                    <Popover open={isCalOpen} onOpenChange={setIsCalOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="justify-start w-full bg-background border-border"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
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
                            handleInputChange("date", format(d, "yyyy-MM-dd"));
                            setIsCalOpen(false);
                          }}
                          disabled={(d) => d.getDay() === 0 || d < today}
                          initialFocus
                          classNames={{
                            day_today:
                              "bg-primary/15 text-primary font-semibold",
                            day_selected:
                              "bg-transparent text-foreground hover:bg-transparent focus:bg-transparent",
                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-primary/10",
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time */}
                  <div className="space-y-2">
                    <Label htmlFor="time" className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />{" "}
                      {t("booking.preferredTime")} *
                    </Label>
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
                        handleInputChange("time", v);
                      }}
                      disabled={!formData.date}
                    >
                      <SelectTrigger className="bg-background border-border">
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

                {/* Vehicle / Notes */}
                <div className="space-y-2">
                  <Label htmlFor="vehicle">{t("booking.vehicleInfo")}</Label>
                  <Input
                    id="vehicle"
                    placeholder={t("booking.ph.vehicle")}
                    value={formData.vehicleInfo}
                    onChange={(e) =>
                      handleInputChange("vehicleInfo", e.target.value)
                    }
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t("booking.notes")}</Label>
                  <Textarea
                    id="notes"
                    placeholder={t("booking.ph.notes")}
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="bg-background border-border min-h-[100px]"
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full text-lg py-6 h-auto"
                  disabled={loading}
                >
                  {loading
                    ? t("booking.btn.submitting")
                    : t("booking.btn.submit")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </section>
  );
};

export default Booking;
