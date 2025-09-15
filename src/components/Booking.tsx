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
          title: "Couldn’t load services",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setServices(data ?? []);
      }
    })();
  }, [toast]);

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
          title: "Couldn’t load availability",
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

        const t = new Date(s); // iterate from the hour of s
        t.setMinutes(0, 0, 0);
        blocked.add(format(t, "HH:mm"));

        while (true) {
          t.setHours(t.getHours() + 1);
          if (t < e) blocked.add(format(t, "HH:mm"));
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
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const preferred_at = localDateTime(date, time);

    if (preferred_at.getDay() === 0) {
      toast({
        title: "Closed on Sundays",
        description: "Please choose a different date.",
        variant: "destructive",
      });
      return;
    }
    if (preferred_at < new Date()) {
      toast({
        title: "Invalid date/time",
        description: "Please choose a future time.",
        variant: "destructive",
      });
      return;
    }
    if (unavailableTimes.has(time)) {
      toast({
        title: "Time already booked",
        description: "Please pick another time slot.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc("create_booking", {
        p_full_name: name,
        p_email: email,
        p_phone: phone,
        p_vehicle_info: formData.vehicleInfo || null,
        p_notes: formData.notes || null,
        p_preferred_at: preferred_at.toISOString(),
        p_service_ids: [serviceId],
      });
      if (error) throw error;

      toast({
        title: "Appointment booked!",
        description: "We’ll contact you within 24 hours to confirm.",
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
        title: "Booking failed",
        description: err?.message ?? "Please try again.",
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Book Your{" "}
            <span className="bg-gold-gradient bg-clip-text text-transparent">
              Appointment
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Schedule your professional car detailing service today
          </p>
        </div>

        <Card className="bg-card border-border shadow-elegant animate-slide-up">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              Schedule Your Service
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Full Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" /> Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(+30) 6939949788"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" /> Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
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
                  <Car className="w-4 h-4 text-primary" /> Select Service *
                </Label>
                <Select
                  value={formData.serviceId}
                  onValueChange={(v) => handleInputChange("serviceId", v)}
                >
                  <SelectTrigger
                    id="service-select"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Choose your service" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                        {s.base_price ? ` — from €${s.base_price}` : ""}
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
                    <CalendarIcon className="w-4 h-4 text-primary" /> Preferred
                    Date *
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
                          format(dateObj, "EEE, dd MMM yyyy")
                        ) : (
                          <span>Pick a date</span>
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
                    <Clock className="w-4 h-4 text-primary" /> Preferred Time *
                  </Label>
                  <Select
                    value={formData.time}
                    onValueChange={(v) => {
                      if (unavailableTimes.has(v)) {
                        toast({
                          title: "Time unavailable",
                          description:
                            "That slot is already booked. Please pick another.",
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
                          formData.date ? "Select time" : "Pick a date first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {TIMES.map((t) => {
                        const taken = unavailableTimes.has(t);
                        return (
                          <SelectItem
                            key={t}
                            value={t}
                            disabled={taken}
                            className={
                              taken ? "opacity-50 pointer-events-none" : ""
                            }
                          >
                            {t} {taken ? "— booked" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vehicle / Notes */}
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle Information</Label>
                <Input
                  id="vehicle"
                  placeholder="e.g., 2015 Toyota Yaris, White"
                  value={formData.vehicleInfo}
                  onChange={(e) =>
                    handleInputChange("vehicleInfo", e.target.value)
                  }
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or concerns..."
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
                {loading ? "Submitting..." : "Book Appointment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Booking;
