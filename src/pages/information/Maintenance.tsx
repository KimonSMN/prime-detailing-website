import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

const Maintenance = () => {
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
            Maintenance Wash
          </h1>
          {/* <p className="text-xl text-zinc-400">
            {isGreek ? "Πλύσιμο Συντήρησης" : "Professional Upkeep Service"}
          </p> */}
        </header>

        {/* Description */}
        <div className="space-y-6 mb-12">
          <p className="text-lg leading-relaxed text-zinc-300">
            {isGreek 
              ? "Το πλύσιμο συντήρησης διατηρεί το αυτοκίνητό σας σε άριστη κατάσταση και συστήνεται ανά 2 εβδομάδες, ώστε να διατηρείται η καθαριότητα και η προστασία του οχήματος χωρίς να συσσωρεύονται ρύποι."
              : "A maintenance wash keeps your vehicle in excellent condition and is recommended every 2 weeks to maintain cleanliness and protection without allowing dirt buildup."
            }
          </p>

          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <p className="text-sm font-medium">
              <span className="text-red-400 mr-2 uppercase text-xs tracking-wider">
                {isGreek ? "Προϋπόθεση:" : "Requirement:"}
              </span>
              <span className="text-zinc-300">
                {isGreek 
                  ? "Προσφέρεται σε οχήματα που έχουν πλυθεί εντός των τελευταίων 30 ημερών." 
                  : "Only for vehicles washed within the last 30 days."
                }
              </span>
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="grid md:grid-cols-2 gap-10 mb-12">
          <section>
            <h2 className="font-semibold text-white mb-4 border-b border-zinc-800 pb-2 uppercase text-lg tracking-widest">
              {isGreek ? "Εξωτερικό" : "Exterior"}
            </h2>
            <ul className="space-y-3 text-zinc-300 text-md">
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Ανέπαφη προ-πλύση" : "Contactless pre-wash"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Πλύσιμο στο χέρι" : "Detailed hand wash"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Καθαρισμός πρόσοψης ζαντών" : "Wheel face cleaning"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Προστατευτικό κερί διάρκειας 1 μήνα" : "1-Month lasting protective wax"}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-white mb-4 border-b border-zinc-800 pb-2 uppercase text-lg tracking-widest">
              {isGreek ? "Εσωτερικό" : "Interior"}
            </h2>
            <ul className="space-y-3 text-zinc-300 text-md">
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Σκούπισμα μοκέτας με σκούπα ξυρού τύπου" : "Full interior vacuum of the carpets"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Καθαρισμός επιφανειών" : "Surface wipe-down"}</li>
              <li> <span className="text-blue-400 text-lg">•</span> {isGreek ? "Καθαρισμός τζαμιών" : "Glass cleaning"}</li>
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
        <div className="flex flex-col sm:flex-row gap-3 pt-8 border-t border-zinc-800">
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

export default Maintenance;
