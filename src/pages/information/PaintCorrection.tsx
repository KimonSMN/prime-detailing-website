// src/pages/PaintCorrection.tsx
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const PaintCorrection = () => {
  return (
    <section className="bg-background text-white min-h-screen">

      {/* HERO */}
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Paint Correction & Ceramic Coating
        </h1>

        <p className="text-zinc-400 max-w-2xl mx-auto text-lg mb-6">
          Restore your car’s paint to a deep, glossy finish and protect it for years.
        </p>

        
      </div>

      {/* PROBLEM */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold mb-4">
          Why Your Paint Looks Dull
        </h2>

        <p className="text-zinc-400 leading-relaxed">
          Over time, every car develops swirl marks, micro-scratches, oxidation and
          imperfections caused by improper washing, sun exposure and daily use.
          These defects scatter light, making your paint look faded and lifeless.
        </p>
      </div>

      {/* SOLUTION */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-semibold mb-4">
          The Solution
        </h2>

        <p className="text-zinc-400 leading-relaxed">
          Paint correction is a multi-stage machine polishing process that removes
          these imperfections safely, restoring clarity, depth and gloss to your
          vehicle’s paint.  
          Once corrected, a ceramic coating is applied to lock in the result and
          protect the surface long-term.
        </p>
      </div>

      {/* PROCESS */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold mb-8 text-center">
          Our Process
        </h2>

        <div className="grid md:grid-cols-2 gap-6 text-zinc-400">

          <div>
            <h3 className="font-semibold text-white mb-2">1. Inspection</h3>
            <p>
              We evaluate the paint condition and measure clear coat thickness to
              determine the safest correction approach.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">2. Deep Preparation</h3>
            <p>
              Thorough wash and decontamination remove dirt, iron particles and
              bonded contaminants.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">3. Paint Correction</h3>
            <p>
              Multi-stage machine polishing removes swirl marks, scratches and
              restores clarity and gloss.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">4. Surface Refinement</h3>
            <p>
              Final polishing enhances depth and ensures a flawless finish under
              proper lighting.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">5. Ceramic Coating</h3>
            <p>
              A professional-grade ceramic coating is applied to protect the paint
              and maintain the finish.
            </p>
          </div>

        </div>
      </div>

      {/* BENEFITS */}
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-8">
          What You Get
        </h2>

        <div className="grid md:grid-cols-3 gap-6 text-zinc-400">

          <div>
            <h3 className="text-white font-semibold mb-2">
              Deep Gloss Finish
            </h3>
            <p>
              Your paint regains a mirror-like shine with enhanced color depth.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2">
              Easier Maintenance
            </h3>
            <p>
              Dirt and water slide off easily, reducing washing time and effort.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2">
              Long-Term Protection
            </h3>
            <p>
              Protection against UV rays, chemicals and environmental damage.
            </p>
          </div>
        </div>
      </div>

      {/* CERAMIC EXPLAINED */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold mb-4">
          What is Ceramic Coating?
        </h2>

        <p className="text-zinc-400 leading-relaxed">
          Ceramic coating is a liquid polymer that bonds with your car’s paint,
          creating a durable protective layer.  
          It enhances gloss, provides hydrophobic properties, and protects against
          UV damage, dirt, and chemical contaminants.
        </p>

        
      </div>

      {/* EXPECTATIONS */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold mb-4">
          Important Notes
        </h2>

        <ul className="text-zinc-400 space-y-3">
          <li>• Not all scratches can be safely removed.</li>
          <li>• Results depend on paint condition and thickness.</li>
          <li>• This is a multi-day process requiring precision and time.</li>
        </ul>
      </div>

      {/* CTA */}
      <div className="text-center py-20 border-t border-border">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Transform Your Car?
        </h2>

        <p className="text-zinc-400 mb-6">
          Contact us for a personalized quote based on your vehicle.
        </p>

        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Link to="/booking">Request a Quote</Link>
        </Button>
      </div>

      <Footer />
    </section>
  );
};

export default PaintCorrection;