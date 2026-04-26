import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";
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

  const allFieldsCompleted =
    formData.serviceType.trim() !== "" &&
    formData.carModel.trim() !== "" &&
    formData.carColor.trim() !== "" &&
    formData.fullName.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.email.trim() !== "";

  const handleSubmit = async () => {
    if (!allFieldsCompleted) {
      toast({
        title: t("error.title"),
        description: "Please complete all fields before submitting.",
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

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
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
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
          <Check size={40} />
        </div>
        <h2 className="text-3xl font-bold italic">{t("success.title")}</h2>
        <p className="text-zinc-400 text-lg">
          {"We have received your request. We will contact you within the next 24 hours."}
        </p>
        <Button variant="outline" onClick={() => (window.location.href = "/") }>
          {t("common.backHome")}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 min-h-[600px] space-y-10">

      {/* STEP 1 */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">{t("step1.title")}</h2>
        <div className="grid gap-4">
          {[
            t("servicesPaint.enhancement"),
            t("servicesPaint.fullCorrection"),
          ].map((option) => (
            <button
              key={option}
              onClick={() => setFormData({ ...formData, serviceType: option })}
              className="w-full p-6 text-left rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-500 transition-all flex justify-between items-center"
            >
              <span className="text-lg font-medium">{option}</span>
              <div className="h-6 w-6 rounded-full border border-zinc-700" />
            </button>
          ))}
        </div>
      </div>

      {/* STEP 2 */}
      {formData.serviceType && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-3xl font-bold">{t("step2.title")}</h2>
          <div className="space-y-4">
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

      {/* STEP 3 */}
      {formData.carModel && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-3xl font-bold">{t("step3.title")}</h2>
          <div className="space-y-4">
            <Input
              placeholder={t("step3.fullName")}
              className="bg-zinc-900 border-zinc-800 h-14"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            <Input
              placeholder={t("step3.phone")}
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

            <Button
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white"
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
