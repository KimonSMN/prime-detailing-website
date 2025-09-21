// src/components/ContactBand.tsx
import { Phone, MessageCircle, MapPinned, Clock } from "lucide-react";

export default function ContactBand() {
  return (
    <section className="px-4 py-10 bg-card border-t">
      <div className="max-w-6xl mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href="tel:+306939949788"
          className="rounded-xl border p-4 bg-background hover:bg-card transition"
        >
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Call us</p>
              <p className="text-sm text-muted-foreground">
                (+30) 693 994 9788
              </p>
            </div>
          </div>
        </a>
        <a
          href="https://wa.me/306939949788"
          target="_blank"
          rel="noopener"
          className="rounded-xl border p-4 bg-background hover:bg-card transition"
        >
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">WhatsApp</p>
              <p className="text-sm text-muted-foreground">Message us now</p>
            </div>
          </div>
        </a>
        <a
          href="https://maps.google.com/?q=place_id:ChIJ68foRjSZoRQR1gypciz-myk"
          target="_blank"
          rel="noopener"
          className="rounded-xl border p-4 bg-background hover:bg-card transition"
        >
          <div className="flex items-center gap-3">
            <MapPinned className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Kleious 39 & Aetideon 46</p>
              <p className="text-sm text-muted-foreground">
                Cholargos 15561, Athens
              </p>
            </div>
          </div>
        </a>
        <div className="rounded-xl border p-4 bg-background">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Hours</p>
              <p className="text-sm text-muted-foreground">
                Mon–Sat: 08:00–16:00 · Sun: Closed
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
