// src/components/FAQ.tsx
const QA = [
  {
    q: "How long does a full detail take?",
    a: "Typically 3–4 hours depending on vehicle condition.",
  },
  {
    q: "How long does ceramic coating last?",
    a: "From weeks to months depending on maintenance and exposure.",
  },
  {
    q: "Do you need a deposit?",
    a: "No deposit for standard services; large jobs may require one.",
  },
];

export default function FAQ() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: QA.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  return (
    <section className="px-4 py-14 md:py-20 bg-muted/10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">
          FAQs
        </h2>
        <dl className="space-y-4">
          {QA.map((item, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <dt className="font-medium">{item.q}</dt>
              <dd className="mt-2 text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
