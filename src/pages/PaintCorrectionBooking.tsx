import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const PaintCorrectionBooking = () => {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    serviceType: "",
    carVehicleInfo: "", // Brand, Model, Year combined
    carColor: "",
    fullName: "",
    phone: "",
    email: "",
  });

  // Step completion checks
  const step1Done = !!formData.serviceType;
  const step2Done = step1Done && !!formData.carVehicleInfo && !!formData.carColor;
  const step3Done = step2Done && !!formData.fullName && !!formData.phone && !!formData.email;

  // All fields completed check
  const allFieldsCompleted = step3Done;

  const handleSubmit = async () => {
    if (!allFieldsCompleted) {
      toast({
        title: t("error.title"),
        description: t("error.allFieldsRequired") || "Please complete all fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/paint-correction-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || t("error.submitFailed"));
      }

      setSubmitted(true);
    } catch (error: any) {
      toast({
        title: t("error.title"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // StepHeader component (matching Booking.tsx pattern)
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

  // Styling constants (matching Booking.tsx)
  const pillBase =
    "rounded-2xl border p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/30";
  const pillIdle = "border-border hover:border-secondary-hover/40 bg-card";
  const pillActive =
    "border-secondary bg-secondary/10 ring-1 ring-secondary/40";

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
          <Check size={40} />
        </div>
        <h2 className="text-3xl font-bold">{t("success.title")}</h2>
        <p className="text-zinc-400 text-lg">
          {t("success.description")}
        </p>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          {t("common.backHome")}
        </Button>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-secondary/20">
      <div className="max-w-2xl mx-auto px-4 py-20 space-y-14">
        {/* STEP 1: SERVICE SELECTION */}
        <div className="space-y-6">
          <StepHeader
            num={1}
            title={t("step1.title")}
            done={step1Done}
            hint={t("paintCorrection.step1.hint", "Choose your service")}
          />

          <div className="grid gap-4">
            {[
              t("servicesPaint.enhancement"),
              t("servicesPaint.fullCorrection"),
            ].map((option) => {
              const isSelected = formData.serviceType === option;
              return (
                <button
                  key={option}
                  onClick={() => setFormData({ ...formData, serviceType: option })}
                  className={cn(pillBase, isSelected ? pillActive : pillIdle)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-lg font-medium">{option}</span>
                    <div className="pt-0.5">
                      {isSelected ? (
                        <Check className="h-4 w-4 text-secondary" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border border-border" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: VEHICLE INFO */}
        {step1Done && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <StepHeader
              num={2}
              title={t("step2.title")}
              done={step2Done}
              hint={t("paintCorrection.step2.hint", "Provide vehicle details")}
            />

            <div className="space-y-4">
              {/* Vehicle Info (Brand, Model, Year combined) */}
              <Input
                placeholder={t("step2.carVehicleInfo", "e.g., BMW 320i 2018")}
                className="border-secondary/20 focus-visible:ring-secondary/30"
                value={formData.carVehicleInfo}
                onChange={(e) => setFormData({ ...formData, carVehicleInfo: e.target.value })}
              />

              {/* Color */}
              <Input
                placeholder={t("step2.carColor")}
                className="border-secondary/20 focus-visible:ring-secondary/30"
                value={formData.carColor}
                onChange={(e) => setFormData({ ...formData, carColor: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* STEP 3: CONTACT INFO */}
        {step2Done && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <StepHeader
              num={3}
              title={t("step3.title")}
              done={step3Done}
              hint={t("paintCorrection.step3.hint", "Your contact information")}
            />

            <div className="space-y-4">
              <Input
                placeholder={t("step3.fullName")}
                className="border-secondary/20 focus-visible:ring-secondary/30"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
              <Input
                placeholder={t("step3.email")}
                type="email"
                className="border-secondary/20 focus-visible:ring-secondary/30"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                placeholder={t("step3.phone")}
                type="tel"
                className="border-secondary/20 focus-visible:ring-secondary/30"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <Button
                size="lg"
                className="w-full bg-secondary text-black hover:bg-secondary-hover mt-4"
                onClick={handleSubmit}
                disabled={!allFieldsCompleted || loading}
              >
                {loading ? t("common.sending") : t("common.requestQuote")}
              </Button>

              {!allFieldsCompleted && step2Done && (
                <p className="text-xs text-muted-foreground">
                  {t("booking.validation.completeSteps")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PaintCorrectionBooking;