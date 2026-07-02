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
import {
  Calendar as CalendarIcon,
  Check,
  Droplets,
  Shield,
  Crown,
  Lightbulb,
  Wrench,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// OLD time selection UI
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
  slug: string | null;
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

type DayStatus = "normal" | "partial" | "full";

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

function addBlockedRange(blocked: Set<string>, startISO: string, minutes: number) {
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

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function statusFromBlockedCount(blockedCount: number): DayStatus {
  if (blockedCount >= TIMES.length) return "full";
  if (blockedCount > TIMES.length / 2) return "partial";
  return "normal";
}

/* ============================ Component ============================ */

const Booking = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [addons, setAddons] = useState<AddonRow[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(
    new Set(),
  );

  // --- Protection / Ceramic / Extras grouping by slug ---
  const PROTECTION_SLUGS = [
    "spraySealant",
    "exteriorTrimRestoration",
    "trimCoating",
    "windowCoating",
  ] as const;
  const CERAMIC_SLUG = "ceramicCoating12" as const;
  const EXTRA_SLUGS = ["headlightRestoration", "engineBay"] as const;

  // Static addon details (editable here). Uses inline i18n keys.
  const ADDON_DETAILS: Record<string, { name: string; desc: string }> = {
    spraySealant: {
      name: t("booking.addons.spraySealant.name", "Spray Sealant"),
      desc: t(
        "booking.addons.spraySealant.desc",
        "Lightweight spray sealant — lasts up to 3 months.",
      ),
    },
    trimCoating: {
      name: t("booking.addons.trimCoating.name", "Trim Ceramic Coating"),
      desc: t(
        "booking.addons.trimCoating.desc",
        "Protects and restores exterior trim surfaces.",
      ),
    },
    windowCoating: {
      name: t("booking.addons.windowCoating.name", "Window Ceramic Coating"),
      desc: t(
        "booking.addons.windowCoating.desc",
        "Hydrophobic coating for glass — improves visibility in rain.",
      ),
    },
    fullProtection: {
      name: t("booking.addons.fullProtection.name", "Full Protection Package"),
      desc: t(
        "booking.addons.fullProtection.desc",
        "Includes spray sealant, interior dressing for plastics, interior conditioner for leathers, exterior trim restoration.",
      ),
    },
    exteriorTrimRestoration: {
      name: t(
        "booking.addons.exteriorTrimRestoration.name",
        "Exterior Trim Restoration",
      ),
      desc: t(
        "booking.addons.exteriorTrimRestoration.desc",
        "Restores faded exterior plastic trims and protects them from UV.",
      ),
    },
  };

  // Conceptual slugs included in the Full Protection Package.
  const FULL_PROTECTION_SLUGS = [
    "spraySealant",
    "interiorDressing",
    "interiorConditioner",
    "exteriorTrimRestoration",
  ];

  // Full Protection Package duration in minutes (2 hours)
  const FULL_PROTECTION_DURATION = 120;

  // Longevity mapping for protection items (rendered separately, not inside descriptions)
  const PROTECTION_LONGEVITY: Record<string, string> = {
    liquidWax: t("booking.addons.longevity.items.liquidWax", "1 month"),
    spraySealant: t("booking.addons.longevity.items.spraySealant", "3 months"),
    trimCoating: t("booking.addons.longevity.items.trimCoating", "36 months"),
    windowCoating: t("booking.addons.longevity.items.windowCoating", "18 months"),
    exteriorTrimRestoration: t("booking.addons.longevity.items.exteriorTrimRestoration", "6 months"),
  };

  const [fullProtectionSelected, setFullProtectionSelected] = useState(false);
  const [fullProtectionMissing, setFullProtectionMissing] = useState<string[]>([]);

  // Map rows for fast lookup
  const addonBySlug = useMemo(() => {
    const map = new Map<string, AddonRow>();
    for (const a of addons) if (a.slug) map.set(a.slug, a);
    return map;
  }, [addons]);

  const protectionRows = useMemo(
    () =>
      PROTECTION_SLUGS.map((slug) => addonBySlug.get(slug)).filter(
        Boolean,
      ) as AddonRow[],
    [addonBySlug],
  );

  const ceramicRow = useMemo(
    () => addonBySlug.get(CERAMIC_SLUG) ?? null,
    [addonBySlug],
  );

  const fullProtectionRow = useMemo(
    () => addonBySlug.get("fullProtection") ?? null,
    [addonBySlug],
  );

  const extraRows = useMemo(
    () =>
      EXTRA_SLUGS.map((slug) => addonBySlug.get(slug)).filter(
        Boolean,
      ) as AddonRow[],
    [addonBySlug],
  );

  const selectSingleBySlug = useCallback(
    (slug: string) => {
      const row = addonBySlug.get(slug);
      if (!row) return;

      setSelectedAddonIds((prev) => {
        const next = new Set(prev);

        // enforce exclusivity: protection OR ceramic
        for (const s of PROTECTION_SLUGS) {
          const r = addonBySlug.get(s);
          if (r) next.delete(r.id);
        }
        const ceramic = addonBySlug.get(CERAMIC_SLUG);
        if (ceramic) next.delete(ceramic.id);

        next.add(row.id);
        return next;
      });
    },
    [addonBySlug],
  );

  const onToggleCeramic = useCallback(() => {
    if (!ceramicRow?.id || !ceramicRow.slug) return;

    const isSelected = selectedAddonIds.has(ceramicRow.id);

    if (isSelected) {
      setSelectedAddonIds((prev) => {
        const next = new Set(prev);
        next.delete(ceramicRow.id);
        return next;
      });
      setFormData((p) => ({ ...p, time: "" }));
      return;
    }

    // select ceramic and clear protection highlights (selectSingleBySlug enforces exclusivity)
    selectSingleBySlug(ceramicRow.slug);
    setFormData((p) => ({ ...p, time: "" }));
  }, [ceramicRow, selectedAddonIds, selectSingleBySlug]);

  const toggleFullProtection = useCallback(() => {
    if (!fullProtectionRow?.id) return;

    if (selectedAddonIds.has(fullProtectionRow.id)) {
      // Deselect full protection
      setSelectedAddonIds((prev) => {
        const next = new Set(prev);
        next.delete(fullProtectionRow.id);
        return next;
      });
      setFullProtectionSelected(false);
      setFullProtectionMissing([]);
      setFormData((p) => ({ ...p, time: "" }));
      return;
    }

    // Select Full Protection Package, clear only spray sealant and exterior trim restoration
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      // Clear conflicting protections
      const spraySealantRow = addonBySlug.get("spraySealant");
      const exteriorTrimRow = addonBySlug.get("exteriorTrimRestoration");
      if (spraySealantRow?.id) next.delete(spraySealantRow.id);
      if (exteriorTrimRow?.id) next.delete(exteriorTrimRow.id);
      next.add(fullProtectionRow.id);
      return next;
    });

    const protectionMissing: string[] = [];
    for (const s of FULL_PROTECTION_SLUGS) {
      const r = addonBySlug.get(s);
      if (!r) {
        protectionMissing.push(ADDON_DETAILS[s]?.name ?? s);
      }
    }

    setFullProtectionMissing(protectionMissing);
    setFullProtectionSelected(true);
    setFormData((p) => ({ ...p, time: "" }));
  }, [fullProtectionRow, selectedAddonIds, addonBySlug, ADDON_DETAILS]);

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
    vehicleName: "",
    vehicleType: "",
  });

  const [dateObj, setDateObj] = useState<Date | undefined>(undefined);
  const [unavailableTimes, setUnavailableTimes] = useState<Set<string>>(
    new Set(),
  );
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [dayStatusMap, setDayStatusMap] = useState<Record<string, DayStatus>>(
    {},
  );

  // selected service
  const selectedService = useMemo(
    () => services.find((s) => s.id === formData.serviceId),
    [services, formData.serviceId],
  );

  // selected add-ons resolved to objects
  const selectedAddons = useMemo(
    () => addons.filter((a) => selectedAddonIds.has(a.id)),
    [addons, selectedAddonIds],
  );

  // total minutes from selected add-ons
  const totalAddonMinutes = useMemo(
    () =>
      selectedAddons.reduce(
        (sum, a) => sum + (Number(a.duration_min ?? 0) || 0),
        0,
      ),
    [selectedAddons],
  );

  // base service minutes
  const serviceMinutes = useMemo(
    () => Number(selectedService?.duration_min ?? 0) || 0,
    [selectedService],
  );

  // TOTAL minutes for the *new* booking being composed
  const totalSelectedMinutes = useMemo(
    () => serviceMinutes + totalAddonMinutes,
    [serviceMinutes, totalAddonMinutes],
  );

  // --- price helpers ---
  const servicePrice = useMemo(
    () => Number(selectedService?.base_price ?? 0) || 0,
    [selectedService],
  );

  const addonsTotalPrice = useMemo(
    () =>
      selectedAddons
        .filter((a) => fullProtectionRow?.id !== a.id) // Exclude full protection from addons price
        .reduce(
          (sum, a) => sum + (Number(a.base_price ?? 0) || 0),
          0,
        ),
    [selectedAddons, fullProtectionRow],
  );

  const fullProtectionPrice = useMemo(
    () =>
      fullProtectionRow && selectedAddonIds.has(fullProtectionRow.id)
        ? Number(fullProtectionRow.base_price ?? 0) || 0
        : 0,
    [fullProtectionRow, selectedAddonIds],
  );

  const totalSelectedPrice = servicePrice + addonsTotalPrice + fullProtectionPrice;

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

  const loadCalendarMonthStatus = useCallback(async (monthDate: Date) => {
    const previousMonthStart = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() - 1,
      1,
      0,
      0,
      0,
      0,
    );
    const nextNextMonthStart = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 2,
      1,
      0,
      0,
      0,
      0,
    );

    const [availResult, blocksResult] = await Promise.all([
      supabase
        .from("booking_availability")
        .select("preferred_at, status, total_minutes")
        .gte("preferred_at", previousMonthStart.toISOString())
        .lt("preferred_at", nextNextMonthStart.toISOString())
        .returns<AvailabilityRow[]>(),
      supabase
        .from("admin_block")
        .select("start_at, minutes")
        .gte("start_at", previousMonthStart.toISOString())
        .lt("start_at", nextNextMonthStart.toISOString())
        .order("start_at", { ascending: true })
        .returns<AdminBlockRow[]>(),
    ]);

    if (availResult.error) {
      console.warn("calendar availability load error:", availResult.error);
    }
    if (blocksResult.error) {
      console.warn("calendar block load error:", blocksResult.error);
    }

    const blockedByDay = new Map<string, Set<string>>();

    const ensureDay = (yyyyMmDd: string) => {
      const existing = blockedByDay.get(yyyyMmDd);
      if (existing) return existing;
      const created = new Set<string>();
      blockedByDay.set(yyyyMmDd, created);
      return created;
    };

    const markRange = (startISO: string, minutes: number) => {
      const start = new Date(startISO);
      const day = ensureDay(dayKey(start));
      addBlockedRange(day, startISO, Math.max(1, minutes));
    };

    for (const booking of availResult.data ?? []) {
      markRange(
        booking.preferred_at,
        Math.max(1, Number(booking.total_minutes ?? 0)) || 180,
      );
    }

    for (const block of blocksResult.data ?? []) {
      markRange(block.start_at, Math.max(1, Number(block.minutes ?? 0)));
    }

    const nextStatusMap: Record<string, DayStatus> = {};
    for (const [yyyyMmDd, blocked] of blockedByDay.entries()) {
      nextStatusMap[yyyyMmDd] = statusFromBlockedCount(blocked.size);
    }

    setDayStatusMap(nextStatusMap);
  }, []);

  useEffect(() => {
    void loadCalendarMonthStatus(calendarMonth);
  }, [calendarMonth, loadCalendarMonthStatus]);

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
        .select("id,slug,name,base_price,duration_min")
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

  /* ---------------- availability loader (reusable) ---------------- */
  const loadAvailabilityForDate = useCallback(
    async (yyyyMmDd: string) => {
      if (!yyyyMmDd) {
        setUnavailableTimes(new Set());
        return;
      }

      const { start, end } = localDayRange(yyyyMmDd);

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
            "Couldn’t load availability",
          ),
          description: availErr.message,
          variant: "destructive",
        });
        setUnavailableTimes(new Set());
        return;
      }

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

      for (const b of avail ?? []) {
        const mins = Math.max(1, Number(b.total_minutes ?? 0)) || 180;
        blockRange(b.preferred_at, mins);
      }

      for (const blk of blocks ?? []) {
        const mins = Math.max(1, Number(blk.minutes ?? 0));
        blockRange(blk.start_at, mins);
      }

      setUnavailableTimes(blocked);

      if (formData.time && blocked.has(formData.time)) {
        setFormData((p) => ({ ...p, time: "" }));
      }
    },
    [toast, t, formData.time],
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
    if (!formData.date) return true;
    const total = totalSelectedMinutes || 0;
    if (total <= 0) return false;

    const start = localDateTime(formData.date, startTimeHHmm);
    const end = new Date(start.getTime() + total * 60000);

    const iter = new Date(start);
    iter.setMinutes(0, 0, 0);

    while (iter < end) {
      const key = format(iter, "HH:mm");
      if (unavailableTimes.has(key)) return true;
      iter.setHours(iter.getHours() + 1);
    }
    return false;
  };

  const onPickProtection = useCallback(
    (slug: string) => {
      const row = addonBySlug.get(slug);
      if (!row) return;

      setSelectedAddonIds((prev) => {
        const next = new Set(prev);
        if (next.has(row.id)) {
          next.delete(row.id);
        } else {
          // when selecting a protection, ensure ceramic is cleared
          const ceramic = addonBySlug.get(CERAMIC_SLUG);
          if (ceramic) next.delete(ceramic.id);
          // Clear full protection only when selecting spray sealant or exterior trim restoration
          if ((slug === "spraySealant" || slug === "exteriorTrimRestoration") && fullProtectionRow?.id) {
            next.delete(fullProtectionRow.id);
          }
          next.add(row.id);
        }
        return next;
      });

      setFullProtectionSelected(false);
      setFullProtectionMissing([]);
      setFormData((p) => ({ ...p, time: "" }));
    },
    [addonBySlug, fullProtectionRow, selectSingleBySlug],
  );

  /* ---------------- submit ---------------- */
  const handleSubmit = async (e?: React.SyntheticEvent) => {
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
    if (wouldOverlap(time)) {
      toast({
        title: t("booking.toast.unavailable.title"),
        description: t(
          "booking.toast.unavailable.descFull",
          "The selected start time overlaps with another booking.",
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
      if (dateObj) {
        await loadCalendarMonthStatus(dateObj);
      }

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
      }));
      setSelectedAddonIds(new Set());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("booking.toast.fail.desc");
      toast({
        title: t("booking.toast.fail.title"),
        description: message,
        variant: "destructive",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ============================ UI ============================ */

  const pillBase =
    "rounded-2xl border p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/30";
  const pillIdle = "border-border hover:border-secondary-hover/40 bg-card";
  const pillActive =
    "border-secondary bg-secondary/10 ring-1 ring-secondary/40";

  const formatEuro = (val: string | number | null) =>
    (() => {
      const n = Number(val ?? 0) || 0;
      // For English, show amount then euro sign (e.g. "100€").
      if (i18n.language?.startsWith("en")) {
        return `${new Intl.NumberFormat(i18n.language, {
          maximumFractionDigits: 0,
        }).format(n)} €`;
      }
      return new Intl.NumberFormat(i18n.language, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(n);
    })();

  const fmtHours = (minutes: number | null) => {
    const m = Math.max(0, Number(minutes ?? 0) || 0);
    if (!m) return "—";
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (h <= 0) return `${m} ${t("booking.minutes", "min")}`;
    if (r === 0) return `${h}${t("booking.hoursShort", "h")}`;
    return `${h}${t("booking.hoursShort", "h")} ${r}${t(
      "booking.minutesShort",
      "m",
    )}`;
  };

  const sortedServices = useMemo(() => {
  return services
    .filter((s) => {
      const name = s.name.toLowerCase();
      // Excludes "Enhancement" and "Correction" in both English and Greek
      return (
        !name.includes("enhancement") &&
        !name.includes("correction") &&
        !name.includes("βελτίωση") &&
        !name.includes("ολική") &&
        !name.includes("διόρθωση")
      );
    })
    .sort(
      (a, b) =>
        (Number(a.base_price ?? 0) || 0) - (Number(b.base_price ?? 0) || 0),
    );
}, [services]);

  const step1Done = !!formData.serviceId;
  const step2Done = step1Done;
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

  const totalMinutes = totalSelectedMinutes;
  const totalPrice = totalSelectedPrice;

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
              ? "border-secondary/60 bg-secondary/10 text-secondary"
              : "border-border text-muted-foreground",
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

  const arrangementPriceLabel = t(
    "booking.ui.protection.ceramic.priceUponArrangement",
    i18n.language?.startsWith("el")
      ? "Τιμή κατόπιν συνεννοήσεως"
      : "Price upon arrangement",
  );

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

            <div className="grid md:grid-cols-2 gap-4">
              {sortedServices.map((s) => {
                const active = s.id === formData.serviceId;
                const isPriceOnArrangementService =
                  /paint\s*correction|διορθωση\s*βαφη|διόρθωση\s*βαφή|διόρθωσης\s*βαφής/i.test(
                    s.name,
                  );
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setFormData((p) => ({
                        ...p,
                        serviceId: s.id,
                        time: "",
                      }));
                    }}
                    className={cn(pillBase, active ? pillActive : pillIdle)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-lg">{s.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isPriceOnArrangementService
                            ? `${arrangementPriceLabel} · ${t("booking.meta.approx")} ${fmtHours(s.duration_min)}`
                            : `${t("booking.meta.from")} ${formatEuro(s.base_price)} · ${t("booking.meta.approx")} ${fmtHours(s.duration_min)}`}
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

              {/* Protection */}
              <div className="space-y-3">
                <div className="font-semibold">
                  {t("booking.ui.protection.title", "Protection")}
                </div>

                {/* Wax / Sealant (single pick) */}
                {protectionRows.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-3">
                      {protectionRows.map((a) => {
                      const active = Boolean(a.id && selectedAddonIds.has(a.id));
                      const Icon =
                        a.slug === "liquidWax"
                          ? Droplets
                          : a.slug === "spraySealant"
                            ? Shield
                            : a.slug === "exteriorTrimRestoration"
                              ? Shield
                            : Sparkles;

                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => a.slug && onPickProtection(a.slug)}
                          className={cn(
                            "rounded-2xl border p-4 text-left transition hover:border-secondary-hover/40",
                            active
                              ? "border-secondary bg-secondary/10 ring-1 ring-secondary/40"
                              : "border-border",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 font-semibold">
                                <Icon className="h-4 w-4 text-secondary" />
                                {ADDON_DETAILS[a.slug ?? ""]?.name ?? a.name}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {formatEuro(a.base_price)} · {fmtHours(a.duration_min)}
                              </div>
                              {ADDON_DETAILS[a.slug ?? ""]?.desc && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {ADDON_DETAILS[a.slug ?? ""]?.desc}
                                </div>
                              )}
                              {/* Longevity badge (separate from description) */}
                              {a.slug && PROTECTION_LONGEVITY[a.slug] && (
                                <div className="text-xs text-secondary font-medium mt-2">
                                  {t("booking.addons.longevity.title", "Longevity")}:{" "}
                                  {PROTECTION_LONGEVITY[a.slug]}
                                </div>
                              )}
                            </div>
                                  <div className="pt-0.5">
                                    <Checkbox checked={active} />
                                  </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add-ons / Extras (multi select) */}
              <div className="space-y-3 pt-4">
                <div className="font-semibold">
                  {t("booking.ui.extras.title", "Add-ons")}
                </div>

                {/* Full Protection Package (custom option) */}
                {fullProtectionRow && (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleFullProtection()}
                      className={cn(
                        "w-full rounded-2xl border p-4 text-left transition hover:border-secondary-hover/40 mb-3",
                        fullProtectionRow.id && selectedAddonIds.has(fullProtectionRow.id)
                          ? "border-secondary bg-secondary/10 ring-1 ring-secondary/40"
                          : "border-border",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 font-semibold">
                            <Crown className="h-4 w-4 text-secondary" />
                            {fullProtectionRow.name}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {formatEuro(fullProtectionRow.base_price)} · {fmtHours(fullProtectionRow.duration_min)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {ADDON_DETAILS.fullProtection?.desc}
                          </div>
                        </div>
                        <div className="pt-0.5">
                          <Checkbox checked={fullProtectionRow.id ? selectedAddonIds.has(fullProtectionRow.id) : false} />
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {extraRows.length === 0 ? (
                  <div className="rounded-2xl border p-5 text-sm text-muted-foreground">
                    {t("booking.addons.empty", "No extras available.")}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {extraRows.map((a) => {
                      const checked = selectedAddonIds.has(a.id);
                      const Icon =
                        a.slug === "engineBay"
                          ? Wrench
                          : a.slug === "headlightRestoration"
                            ? Lightbulb
                            : Sparkles;

                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setSelectedAddonIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(a.id)) next.delete(a.id);
                              else {
                                // Clear full protection when selecting any extra
                                if (fullProtectionRow?.id) next.delete(fullProtectionRow.id);
                                next.add(a.id);
                              }
                              return next;
                            });
                            setFullProtectionSelected(false);
                            setFullProtectionMissing([]);
                            setFormData((p) => ({ ...p, time: "" }));
                          }}
                          className={cn(
                            "rounded-2xl border p-4 text-left transition hover:border-secondary-hover/40",
                            checked
                              ? "border-secondary bg-secondary/10 ring-1 ring-secondary/40 "
                              : "border-border",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 font-semibold">
                                <Icon className="h-4 w-4 text-secondary" />
                                {ADDON_DETAILS[a.slug ?? ""]?.name ?? a.name}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {formatEuro(a.base_price)} · {fmtHours(a.duration_min)}
                              </div>
                              {ADDON_DETAILS[a.slug ?? ""]?.desc && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {ADDON_DETAILS[a.slug ?? ""]?.desc}
                                </div>
                              )}
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
            </div>
          )}

          {/* STEP 3 */}
          {step1Done && step2Done && (
            <div className="space-y-6">
              <StepHeader
                num={3}
                title={t("booking.steps.datetime.title")}
                done={step3Done}
                hint={t("booking.steps.datetime.hint")}
              />

              <div className="grid md:grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-2">
                  <Popover open={isCalOpen} onOpenChange={setIsCalOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-start w-full bg-background border-border hover:text-white hover:border-secondary"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-secondary" />
                        {dateObj ? (
                          fmtDate(dateObj)
                        ) : (
                          <span>{t("booking.ph.pickDate")}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-popover border-border bg-background"
                      align="start"
                    >
                      <DatePicker
                        month={calendarMonth}
                        onMonthChange={(month) => setCalendarMonth(month)}
                        mode="single"
                        selected={dateObj}
                        onSelect={(d) => {
                          if (!d) return;
                          setDateObj(d);
                          setCalendarMonth(d);
                          setFormData((p) => ({
                            ...p,
                            date: format(d, "yyyy-MM-dd"),
                            time: "",
                          }));
                          setIsCalOpen(false);
                        }}
                        disabled={(d) => {
                          const status = dayStatusMap[dayKey(d)];
                          return d.getDay() === 0 || d < today || status === "full";
                        }}
                        modifiers={{
                          pastDay: (d) => d < today,
                          availableDay: (d) => {
                            const status = dayStatusMap[dayKey(d)];
                            return d.getDay() !== 0 && d >= today && status !== "partial" && status !== "full";
                          },
                          partiallyBooked: (d) => dayStatusMap[dayKey(d)] === "partial",
                          fullyBooked: (d) => dayStatusMap[dayKey(d)] === "full",
                        }}
                        modifiersClassNames={{
                          pastDay:
                            "!bg-transparent !text-muted-foreground/50 !opacity-50 hover:!bg-transparent hover:!text-muted-foreground/50",
                          availableDay:
                            "!bg-green-600 !text-white hover:!bg-green-600 hover:!text-white",
                          partiallyBooked:
                            "!bg-amber-500 !text-white hover:!bg-amber-500 hover:!text-white",
                          fullyBooked:
                            "!bg-red-600 !text-white !opacity-100 hover:!bg-red-600 hover:!text-white",
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <div className="text-sm text-muted-foreground ">
                    {t("booking.meta.estimatedDuration")}{" "}
                    <span className="text-secondary font-medium">
                      {totalMinutes ? fmtHours(totalMinutes) : "—"}
                    </span>
                  </div>
                </div>

                {/* Time */}
                <div className="space-y-2 ">
                  <Select
                    value={formData.time}
                    onValueChange={(v) => {
                      if (wouldOverlap(v)) {
                        toast({
                          title: t("booking.toast.unavailable.title"),
                          description: t(
                            "booking.toast.unavailable.descFull",
                            "The selected start time overlaps with another booking.",
                          ),
                          variant: "destructive",
                        });
                        return;
                      }
                      setFormData((p) => ({ ...p, time: v }));
                    }}
                    disabled={!formData.date}
                  >
                    <SelectTrigger className="bg-background border-border hover:border-secondary">
                      <SelectValue
                        placeholder={
                          formData.date
                            ? t("booking.ph.selectTime")
                            : t("booking.ph.pickDateFirst")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
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
                                    "not enough room",
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

          {/* STEP 4 */}
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
                      vehicleInfo: e.target.value,
                    }))
                  }
                  className="border-secondary/20 focus-visible:ring-secondary/30"
                />
                <Textarea
                  placeholder={t("booking.ph.notes")}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, notes: e.target.value }))
                  }
                  className="min-h-[110px] border-secondary/20 focus-visible:ring-secondary/30"
                />
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step5Done && (
            <div className="space-y-6">
              <StepHeader
                num={5}
                title={t("booking.steps.contact.title")}
                done={canSubmit}
                hint={t("booking.steps.contact.hint")}
              />

              <div className="space-y-3">
                <Input
                  placeholder={t("booking.ph.fullName")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  className="border-secondary/20 focus-visible:ring-secondary/30"
                />
                <Input
                  placeholder={t("booking.ph.phone")}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="border-secondary/20 focus-visible:ring-secondary/30"
                />
                <Input
                  placeholder={t("booking.ph.email")}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                  className="border-secondary/20 focus-visible:ring-secondary/30"
                />

                <Button
                  size="lg"
                  className={cn(
                    "w-full",
                    "bg-secondary text-black hover:bg-secondary-hover",
                    !canSubmit && "opacity-60",
                  )}
                  disabled={loading || !canSubmit}
                  onClick={(e) => void handleSubmit(e)}
                >
                  {loading
                    ? t("booking.btn.submitting")
                    : t("booking.btn.submit")}
                </Button>

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
                <div className="text-xs px-2 py-1 rounded-full border border-secondary/40 text-secondary">
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
                      {fullProtectionRow && selectedAddonIds.has(fullProtectionRow.id) ? (
                        <span className="text-xs rounded-full border border-secondary/30 bg-secondary/5 px-2 py-1">
                          {fullProtectionRow.name}
                        </span>
                      ) : (
                        selectedAddons.map((a) => (
                          <span
                            key={a.id}
                            className="text-xs rounded-full border border-secondary/30 bg-secondary/5 px-2 py-1"
                          >
                            {a.name}
                          </span>
                        ))
                      )}
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
    </section>
  );
};

export default Booking;