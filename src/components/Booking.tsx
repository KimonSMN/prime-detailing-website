import { useEffect, useMemo, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Phone, Mail, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type ServiceRow = {
  id: string;
  name: string;
  base_price: string | number | null;
};

const Booking = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    serviceId: "", // service UUID
    date: "",
    time: "",
    vehicleInfo: "",
    notes: "",
  });

  // Load services from DB
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

  const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);
  const handleInputChange = (field: string, value: string) =>
    setFormData((p) => ({ ...p, [field]: value }));

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

    setLoading(true);
    try {
      const preferred_at = new Date(`${date}T${time}:00`);

      // ONE CALL: use RPC to create customer + booking + booking_service
      const { data: bookingId, error } = await supabase.rpc("create_booking", {
        p_full_name: name,
        p_email: email,
        p_phone: phone,
        p_vehicle_info: formData.vehicleInfo || null,
        p_notes: formData.notes || null,
        p_preferred_at: preferred_at.toISOString(),
        p_service_ids: [serviceId], // can pass multiple ids later
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
                        {s.base_price ? ` — from $${s.base_price}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date & Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Preferred Date
                    *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className="bg-background border-border"
                    min={minDate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Preferred Time *
                  </Label>
                  <Select
                    value={formData.time}
                    onValueChange={(v) => handleInputChange("time", v)}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {[
                        "08:00",
                        "09:00",
                        "10:00",
                        "11:00",
                        "12:00",
                        "13:00",
                        "14:00",
                        "15:00",
                        "16:00",
                      ].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vehicle / Notes */}
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle Information</Label>
                <Input
                  id="vehicle"
                  placeholder="e.g., 2020 BMW X5, Silver"
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
