import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Check, Circle } from "lucide-react"; // Added Circle for radio effect
import { useTranslation } from "react-i18next";

const PaintCorrectionBooking = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    serviceType: "",
    carModel: "",
    carColor: "",
    fullName: "",
    phone: "",
    email: "",
  });

  // Simplified check: trimmed values are truthy
  const allFieldsCompleted = Object.values(formData).every(val => val.trim() !== "");

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

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
          <Check size={40} />
        </div>
        <h2 className="text-3xl font-bold">{t("success.title")}</h2>
        <p className="text-zinc-400 text-lg">
          {t("success.description") /* Ensure you add this to your translation files */}
        </p>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          {t("common.backHome")}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 min-h-[600px] space-y-12">
      {/* STEP 1: SERVICE SELECTION */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">{t("step1.title")}</h2>
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
                className={`w-full p-6 text-left rounded-xl border transition-all flex justify-between items-center ${
                  isSelected 
                    ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-500"
                }`}
              >
                <span className="text-lg font-medium">{option}</span>
                {isSelected ? (
                  <Check className="text-blue-500" size={24} />
                ) : (
                  <div className="h-6 w-6 rounded-full border border-zinc-700" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: VEHICLE INFO */}
      {formData.serviceType && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
          <h2 className="text-3xl font-bold">{t("step2.title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder={t("step2.carModel")}
              className="bg-zinc-900 border-zinc-800 h-14"
              value={formData.carModel}
              onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
            />
            <Input
              placeholder={t("step2.carColor")}
              className="bg-zinc-900 border-zinc-800 h-14"
              value={formData.carColor}
              onChange={(e) => setFormData({ ...formData, carColor: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* STEP 3: CONTACT INFO */}
      {formData.carModel && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
          <h2 className="text-3xl font-bold">{t("step3.title")}</h2>
          <div className="space-y-4">
            <Input
              placeholder={t("step3.fullName")}
              className="bg-zinc-900 border-zinc-800 h-14"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder={t("step3.phone")}
                type="tel"
                className="bg-zinc-900 border-zinc-800 h-14"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                placeholder={t("step3.email")}
                type="email"
                className="bg-zinc-900 border-zinc-800 h-14"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <Button
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg mt-4 transition-transform active:scale-[0.98]"
              onClick={handleSubmit}
              disabled={!allFieldsCompleted || loading}
            >
              {loading ? t("common.sending") : t("common.requestQuote")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaintCorrectionBooking;