import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

const REVIEWS = [
  {
    author: "Edward Papageorgiou",
    text: "Γνώση, μεράκι, εργατικότητα, συνέπεια, καλή διάθεση και φροντίδα του οχήματος σαν να ήταν δικό τους! Τους συνιστώ ανεπιφύλακτα, τόσο για τον απλό καθαρισμό όσο και τ..",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/T44NLqJe1VYSj4ja9",
  },
    {
    author: "Nik Bn",
    text: "Παρα πολύ καλός στη δουλειά του , συνίσταται  ανεπιφύλακτα.",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/fbwQgcWufrEmi4qf8",
  },
    {
    author: "Manos Aggelikakis",
    text: "Επαγγελματική δουλειά με εξαιρετικό αποτέλεσμα σε κάθε λεπτομέρεια. Ένας πολύ ευγενικός επαγγελματίας με μεγάλη διάθεση και γνώση στο κομμάτι του detailing. Παραλαμβά...",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/Daa7Pz7z1ceYmykS6",
  },
    {
    author: "Burcu Ozdemir",
    text: "Today I had an appointment at Prime Detailing for the interior and exterior cleaning, detailing, and care of my car, and I received an absolutely outstanding service—far...",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/zVzcCh7QZNab5xqd6",
  },
    {
    author: "Αδάμ Καρτελιάς",
    text: "Είμαι πολύ ευχαριστημένος από το αποτέλεσμα. Το αυτοκίνητο παραδόθηκε σε άψογη κατάσταση, με προσοχή στη λεπτομέρεια. Η τιμή είναι απολύτως λογική για την ποιότητα της δουλειάς ...",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/h36t5XuYSH8hU7wV6",
  },
  {
    author: "adonis smirlianos",
    text: "Went for a deep clean and he also fixed some paint scratches, amazing",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/yRER9tgD6ri1iQhs6",
  },
  {
    author: "Edward Papageorgiou",
    text: "Γνώση, μεράκι, εργατικότητα, συνέπεια, καλή διάθεση και φροντίδα του οχήματος σαν να ήταν δικό τους! Τους συνιστώ ανεπιφύλακτα, τόσο για τον απλό καθαρισμό όσο και τ..",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/T44NLqJe1VYSj4ja9",
  },
  {
    author: "Theophilos Chrysoulis",
    text: "Πολύ προσεκτικοί στη δουλειά τους. Άφησα το αυτοκίνητο μου το πρωί γεμάτο χώμα κουτσουλιές και σκόνη. Μεσημέρι το είχα πεντακάθ...",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/mv2zVisf9tUpBz7n6",
  },
  {
    author: "Αναστάσης Τακάς",
    text: "Έκανε το μηχανάκι μου σαν καινούργιο, για πολυ καλη τιμή. Ειναι και ωραίο παιδί",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/AhskH7Jgg95neHPy7",
  },
  {
    author: "Giorgos Athanassiou",
    text: "Εξαιρετική και λεπτομερείς δουλειά",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/aDK5UgVssvB97hoN9",
  },
  {
    author: "ΘΟΔΩΡΗΣ ΤΣΙΠΛΑΚΟΣ",
    text: "Άψογη εξυπηρέτηση! Πήγα το αμάξι μου για βαθύ καθαρισμό και έμεινα έκπληκτος με το αποτελέσμα. Να τους προτιμήσετε!",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/r1bdcJ6xbeedsG4E7",
  },
  {
    author: "Tessie Tsitsani",
    text: "Καταπληκτική δουλειά!",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/9BewizNhoMg93HEp7",
  },
  {
    author: "Petros G",
    text: "Αν θέλετε να μη μυρίζει το αυτοκινητο, να σιχτιριζετε με τις λεπτομέρειες και τα πλυσιματα ξεπετα, να είστε ευχαριστημένοι και να αμοιβεται δίκαια …",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/hQhBjWBVBewmUvJ76",
  },
  {
    author: "Σοφία Τρεσσου",
    text: "Άψογη εξυπηρέτηση! Ο Κίμωνας ήταν πολύ επεξηγηματικός και με βοήθησε να κατανοήσω τις ανάγκες του αυτοκινήτου μου. Το αποτέλεσμα ήταν απίστευτο!",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/uosTjMNmNyqxWnjC7",
  },
  {
    author: "ΧΑΡΑΛΑΜΠΟΣ ΛΙΓΚΑΣ",
    text: "Πολυ καλό παιδί και εξυπηρετικό. Εξαιρετικη δουλειά.",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/48FMGrW1Bc15GzPX9",
  },
  {
    author: "kwstas pnt",
    text: "Ευγένεια, επαγγελματισμός και άψογα αποτελέσματα. Τι άλλο να ζητήσει κανείς!!",
    rating: 5,
    authorUrl: "https://maps.app.goo.gl/zifv5dWf2qapX4Hg9",
  },
];

const ReviewsCarousel = () => {
  const { t } = useTranslation();
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start", skipSnaps: false },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );

  return (
    <section
      id="reviews"
      className="px-4 py-14 pb-0 md:py-20 md:pb-0 bg-muted/20"
      aria-label={t("reviews.aria", "Google reviews")}
    >
      {/* Headings can be centered on mobile, left on md+ */}
      <div className="max-w-6xl mx-auto text-center md:text-left">
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {t("reviews.heading", "What Clients Say on Google")}
          </h2>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <ul className="flex gap-4">
            {REVIEWS.map((r, idx) => (
              <li
                key={idx}
                className="
                  min-w-0 flex-[0_0_100%] md:flex-[0_0_48%] lg:flex-[0_0_31%]
                  rounded-2xl border bg-card p-6
                "
              >
                {/* Force ALL review card content to be left-aligned on every breakpoint */}
                <div className="text-left">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-foreground">{r.author}</p>
                  </div>

                  {/* Stars left on both mobile + desktop */}
                  <div className="flex items-center gap-1 mb-2 justify-start">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < r.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground"
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  <p className="text-foreground leading-relaxed">{r.text}</p>

                  {r.authorUrl && (
                    <a
                      href={r.authorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm text-zinc-400 underline"
                    >
                      {t("reviews.viewOnGoogle", "View on Google")}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Attribution can follow the heading alignment (center on mobile, left on md+) */}
        <p className="mt-4 text-center md:text-left text-xs text-zinc-400">
          {t(
            "reviews.attribution",
            "These reviews are taken from our Google Business Profile"
          )}
        </p>
      </div>
    </section>
  );
};

export default ReviewsCarousel;
