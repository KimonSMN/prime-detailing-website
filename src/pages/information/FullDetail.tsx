import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

const FullDetail = () => {
  const { t, i18n } = useTranslation();
  const isGreek = i18n.language === "el";

  return (
    <div className="min-h-screen flex flex-col text-white">
      <main className="flex-1 container mx-auto px-6 py-12 max-w-3xl">
        
        {/* Navigation */}
        <Link 
          to="/services" 
          className="inline-flex items-center text-sm text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          {isGreek ? "Πίσω στις Υπηρεσίες" : "Back to Services"}
        </Link>

        {/* Header */}
        <header className="border-b border-zinc-800 pb-4 mb-4">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {isGreek ? "Full Interior & Exterior Detail" : "Full Interior & Exterior Detail"}
          </h1>
        </header>

        {/* Description */}
        <div className="space-y-6 mb-12">
          <p className="text-lg leading-relaxed text-zinc-300">
            {isGreek 
              ? "Ένας ολοκληρωμένος βαθύς καθαρισμός που επαναφέρει την εμφάνιση του οχήματος σας. Περιλαμβάνει λεπτομερή φροντίδα τόσο στο εσωτερικό όσο και στο εξωτερικό, αφαιρώντας συσσωρευμένους ρύπους και προσφέροντας προστασία σε όλες τις εξωτερικές επιφάνειες."
              : "A comprehensive deep clean that restores your vehicle's appearance. It includes detailed care for both the interior and exterior, removing accumulated dirt and providing protection to on the exterior surfaces."
            }
          </p>
        </div>

        {/* Sections */}
        <div className="grid md:grid-cols-2 gap-10 mb-12">
          {/* Exterior */}
          <section>
            <h2 className="font-semibold text-white mb-4 border-b border-zinc-800 pb-2 uppercase text-lg tracking-widest">
              {isGreek ? "Εξωτερικό" : "Exterior"}
            </h2>
            <ul className="space-y-3 text-zinc-300 text-md">
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Προπλύση χωρίς επαφή" : "Contactless pre-wash"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Πλύσιμο στο χέρι" : "Detailed hand wash"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Καθαρισμός ζαντών" : "Wheel cleaning"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Προστασία ελαστικών" : "Tire dressing/protection"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Αφαίρεση πίσσας / ρετσινιού" : "Tar & resin removal"}</li>
            </ul>
          </section>

          {/* Interior */}
          <section>
            <h2 className="font-semibold text-white mb-4 border-b border-zinc-800 pb-2 uppercase text-lg tracking-widest">
              {isGreek ? "Εσωτερικό" : "Interior"}
            </h2>
            <ul className="space-y-3 text-zinc-300 text-md">
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Σκούπισμα εσωτερικού & επιφανειών" : "Interior & surface vacuuming"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Καθαρισμός τζαμιών" : "Glass cleaning"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Πλήρες σκούπισμα μοκετών με σκούπα ξυρού τύπου" : "Full carpet vacuum"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Σαπούνισμα εσωτερικών επιφανειών" : "Deep cleaning of interior surfaces"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Καθαρισμός μαρσπιέ & πορτμπαγκάζ" : "Door sills & trunk cleaning"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Καθαρισμός δέρματος" : "Leather cleaning"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Αρωματισμός καμπίνας" : "Deodorizing"}</li>

            </ul>
          </section>
        </div>

        {/* Protection Footer Section */}
        <div className="mb-4">
          <h2 className="font-semibold text-white mb-2 border-b border-zinc-800 pb-2 uppercase text-lg tracking-widest">
            {isGreek ? "Προστασία" : "Protection"}
          </h2>
          <ul className="space-y-3 text-zinc-300 text-md mt-4">
            <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Προστατευτικό κερί εξωτερικού με διάρκεια έως και 1 μήνα" : "1-Month lasting protective exterior wax"}</li>
            
          </ul>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800">
          <Link
              to={`/booking`}
              className="flex-1 flex items-center justify-center rounded-lg bg-white text-black py-3 px-2 text-sm font-semibold hover:bg-zinc-200 transition"
            >
              {t("servicesNew.book", "Book Now")}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FullDetail;