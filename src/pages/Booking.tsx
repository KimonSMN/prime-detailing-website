import { useEffect, useMemo, useState } from "react";
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
  Car,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";

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
};

type AvailabilityRow = {
  preferred_at: string; // ISO
  status: "pending" | "confirmed";
  total_minutes: number | null; // aggregated duration from the view
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

const Booking = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceRow[]>([]);
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

  // localized date label for the button
  const fmtDate = (d?: Date) =>
    d
      ? new Intl.DateTimeFormat(i18n.language, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(d)
      : "";

  // local today for disabling past days in the calendar
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  /* ---------------- load services ---------------- */
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("service")
        .select("id,name,base_price")
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

  const handleInputChange = (field: string, value: string) =>
    setFormData((p) => ({ ...p, [field]: value }));

  /* ---------------- availability (reads from booking_availability view) ---------------- */
  useEffect(() => {
    (async () => {
      if (!formData.date) {
        setUnavailableTimes(new Set());
        return;
      }

      const { start, end } = localDayRange(formData.date);

      const { data, error } = await supabase
        .from("booking_availability")
        .select("preferred_at, status, total_minutes")
        .gte("preferred_at", start.toISOString())
        .lt("preferred_at", end.toISOString())
        .returns<AvailabilityRow[]>();

      if (error) {
        console.error("availability error:", error);
        toast({
          title: t(
            "booking.toast.availabilityFailTitle",
            "Couldn’t load availability"
          ),
          description: error.message,
          variant: "destructive",
        });
        setUnavailableTimes(new Set());
        return;
      }

      const blocked = new Set<string>();

      // Block each hour touched by [start, start+minutes)
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

      for (const b of data ?? []) {
        const mins = Math.max(1, Number(b.total_minutes ?? 0)) || 180;
        blockRange(b.preferred_at, mins);
      }

      setUnavailableTimes(blocked);

      // Clear chosen time if it became blocked
      if (formData.time && blocked.has(formData.time)) {
        setFormData((p) => ({ ...p, time: "" }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date]);

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
    if (unavailableTimes.has(time)) {
      toast({
        title: t("booking.toast.unavailable.title"),
        description: t("booking.toast.unavailable.desc"),
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
          serviceId, // for linking booking → service
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Booking failed");
      }

      toast({
        title: t("booking.toast.ok.title"),
        description: t("booking.toast.ok.desc"),
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        serviceId: "",
        date: "",
        time: "",
        vehicleInfo: "",
        notes: "",
      });
      setDateObj(undefined);
      setUnavailableTimes(new Set());
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
    <section id="booking" className="py-20 px-4 bg-secondary/20">
      <Helmet>
        <title>Book an Appointment | Prime Detailing Cholargos</title>
        <meta
          name="description"
          content="Book your car detailing appointment in Cholargos — choose service, date, and time online."
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
          <p className="text-xl text-muted-foreground">
            {t("booking.subtitle")}
          </p>
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
                    onChange={(e) => handleInputChange("name", e.target.value)}
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
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" /> {t("booking.email")}{" "}
                  *
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
                  <Car className="w-4 h-4 text-primary" />{" "}
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
                    <SelectValue placeholder={t("booking.ph.chooseService")} />
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
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                          day_today: "bg-primary/15 text-primary font-semibold",
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
                      if (unavailableTimes.has(v)) {
                        toast({
                          title: t("booking.toast.unavailable.title"),
                          description: t("booking.toast.unavailable.desc"),
                          variant: "destructive",
                        });
                        return; // hard stop on mobile webviews
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
                        const taken = unavailableTimes.has(tm);
                        return (
                          <SelectItem
                            key={tm}
                            value={tm}
                            disabled={taken}
                            className={
                              taken ? "opacity-50 pointer-events-none" : ""
                            }
                          >
                            {tm} {taken ? `— ${t("booking.booked")}` : ""}
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
    </section>
  );
};

export default Booking;
