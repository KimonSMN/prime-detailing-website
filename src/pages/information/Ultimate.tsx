import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

const Ultimate = () => {
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
          <div className="text-blue-400 font-bold tracking-widest text-xs uppercase mb-2">
            {isGreek ? "Κορυφαια Επιλογη" : "Top Choice"}
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase">
            Ultimate Detail
          </h1>
        </header>

        {/* Description */}
        <div className="space-y-6 mb-12">
          <p className="text-lg leading-relaxed text-zinc-300">
            {isGreek 
              ? "Το απόλυτο πακέτο περιποίησης που συνδυάζει τον βαθύ καθαρισμό του Full Detail με αναβαθμισμένη προστασία. Περιλαμβάνει πλήρη σφράγιση εσωτερικών και εξωτερικών επιφανειών για μέγιστη διάρκεια και λάμψη."
              : "The ultimate detailing package combining deep cleaning with upgraded protection. It includes full sealing of interior and exterior surfaces for maximum durability and gloss."
            }
          </p>
        </div>

        {/* Sections Grid */}
        <div className="grid md:grid-cols-2 gap-10 mb-12">
          {/* Exterior */}
          <section>
            <h2 className="font-semibold text-white mb-4 border-b border-zinc-800 pb-2 uppercase text-lg tracking-widest">
              {isGreek ? "Εξωτερικό" : "Exterior"}
            </h2>
            <ul className="space-y-3 text-zinc-300 text-md">
              <li><span className="text-blue-400 text-lg">•</span> {isGreek ? "Προπλύση χωρίς επαφή" : "Contactless pre-wash"}</li>
              <li><span className="text-blue-400 text-lg">•</span> {isGreek ? "Πλύσιμο στο χέρι" : "Detailed hand wash"}</li>
              <li><span className="text-blue-400 text-lg">•</span> {isGreek ? "Καθαρισμός ζαντών (μέσα & έξω)" : "Deep wheel cleaning (in & out)"}</li>
              <li><span className="text-blue-400 text-lg">•</span> {isGreek ? "Αφαίρεση πίσσας / ρετσινιού" : "Tar & resin removal"}</li>
              <li><span className="text-blue-400 text-lg">•</span> {isGreek ? "Προστασία ελαστικών" : "Tire protection"}</li>
            </ul>
          </section>

          {/* Interior */}
          <section>
            <h2 className="font-semibold text-white mb-4 border-b border-zinc-800 pb-2 uppercase text-lg tracking-widest">
              {isGreek ? "Εσωτερικό" : "Interior"}
            </h2>
            <ul className="space-y-3 text-zinc-300 text-md">
              <li><span className="text-blue-400 text-lg">•</span> {isGreek ? "Βαθύς καθαρισμός μοκετών & καθισμάτων" : "Deep carpet & seat cleaning"}</li>
              <li><span className="text-blue-400 text-lg">•</span> {isGreek ? "Σαπούνισμα όλων των επιφανειών" : "Interior surface scrubbing"}</li>
              <li><span className="text-blue-400 text-lg">•</span> {isGreek ? "Καθαρισμός & φροντίδα δέρματος" : "Leather cleaning & care"}</li>
              <li><span className="text-blue-400 text-lg">•</span> {isGreek ? "Καθαρισμός μαρσπιέ & πορτμπαγκάζ" : "Door sills & trunk cleaning"}</li>
              <li><span className="text-blue-400 text-lg">•</span> {isGreek ? "Καθαρισμός τζαμιών" : "Glass cleaning"}</li>
              <li><span className="text-blue-400 text-lg">•</span> {isGreek ? "Αρωματισμός καμπίνας" : "Interior deodorizing"}</li>
            </ul>
          </section>
        </div>

        {/* Ultimate Protection Upgrade */}
        <div className="mb-12 p-6 bg-blue-400/5 border border-blue-400/20 rounded-xl">
          <h2 className="font-bold text-blue-400 mb-4 uppercase text-lg tracking-widest">
            {isGreek ? "Αναβαθμισμενη Προστασια" : "Upgraded Protection"}
          </h2>
          <ul className="space-y-3 text-zinc-300 text-md">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              {isGreek 
                ? "Προστατευτικό spray sealant εξωτερικού" 
                : "Exterior spray sealant protection"}
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              {isGreek 
                ? "Προστατευτικό για εσωτερικές πλαστικές επιφάνειες" 
                : "Interior plastic protectant"}
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              {isGreek 
                ? "Συντηρητικό εξωτερικών πλαστικών" 
                : "Exterior plastics dressing"}
            </li>

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

export default Ultimate;