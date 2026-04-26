import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Check, ArrowLeft, Car, Droplets, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const FullDetail = () => {
  const { i18n } = useTranslation();
  const isGreek = i18n.language === "el";

  const content = {
    exterior: [
      { en: "Touchless Pre-wash & Hand Wash", el: "Προπλύση χωρίς επαφή & πλύσιμο στο χέρι" },
      { en: "Wheel Cleaning & Tire Dressing", el: "Καθαρισμός ζαντών & περιποίηση ελαστικών" },
      { en: "Tar & Resin Removal", el: "Αφαίρεση πίσσας / ρετσινιού" },
      { en: "Deep Cleaning of Inner Rims", el: "Βαθύς καθαρισμός εσωτερικού ζάντας" },
      { en: "Exterior Protective Wax", el: "Προστατευτικό κερί εξωτερικού" },
    ],
    interior: [
      { en: "Interior Vacuum & Surface Wipe", el: "Σκούπισμα εσωτερικού & επιφανειών" },
      { en: "Glass & Window Cleaning", el: "Καθαρισμός τζαμιών" },
      { en: "Full Carpet Vacuum & Deep Cleaning", el: "Πλήρες σκούπισμα & καθαρισμός μοκετών" },
      { en: "Interior Surface Shampooing", el: "Σαπούνισμα εσωτερικών επιφανειών" },
      { en: "Door Jambs & Trunk Cleaning", el: "Καθαρισμός μαρσπιέ & πορτμπαγκάζ" },
      { en: "Leather Deep Cleaning", el: "Καθαρισμός δέρματος" },
    ]
  };

  return (
    <div className="min-h-screen  text-white flex flex-col">
      <main className="flex-grow pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          
          {/* Back Button */}
          <Link to="/services" className="inline-flex items-center text-zinc-500 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isGreek ? "Επιστροφή στις υπηρεσίες" : "Back to Services"}
          </Link>

          {/* Header Section */}
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
              Full Interior & Exterior Detail
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
              {isGreek 
                ? "Η απόλυτη φροντίδα για το όχημα σας. Συνδυάζουμε βαθύ καθαρισμό καμπίνας και εξωτερική απολύμανση για ένα αποτέλεσμα 'σαν καινούργιο'."
                : "The ultimate care for your vehicle. We combine deep cabin cleaning and exterior decontamination for a 'like-new' result."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* EXTERIOR SECTION */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Droplets className="text-blue-500" size={24} />
                </div>
                <h2 className="text-2xl font-bold uppercase tracking-tight">
                  {isGreek ? "Εξωτερική Φροντίδα" : "Exterior Care"}
                </h2>
              </div>
              <ul className="space-y-4">
                {content.exterior.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-zinc-900 bg-zinc-900/30">
                    <Check className="text-green-500 mt-1 flex-shrink-0" size={18} />
                    <div>
                      <p className="font-medium">{item.en}</p>
                      <p className="text-sm text-zinc-500">{item.el}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* INTERIOR SECTION */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Sparkles className="text-purple-500" size={24} />
                </div>
                <h2 className="text-2xl font-bold uppercase tracking-tight">
                  {isGreek ? "Εσωτερική Φροντίδα" : "Interior Restoration"}
                </h2>
              </div>
              <ul className="space-y-4">
                {content.interior.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-zinc-900 bg-zinc-900/30">
                    <Check className="text-green-500 mt-1 flex-shrink-0" size={18} />
                    <div>
                      <p className="font-medium">{item.en}</p>
                      <p className="text-sm text-zinc-500">{item.el}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FullDetail;