import Hero from "@/components/Hero";
import USPIntro from "@/components/USPIntro";
import GoogleReviewsEmbed from "@/components/GoogleReviewsEmbed";
import Footer from "@/components/Footer";
import ReviewsCarousel from "@/components/ReviewsCarousel";
import ContactBand from "@/components/ContactBand";
import FAQ from "@/components/FAQ";
import BeforeAfterStrip from "@/components/BeforeAfterStrip";
import TopNavbar from "@/components/TopNavbar";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Hero />
    {/* <USPIntro /> */}
    <ReviewsCarousel />

    <GoogleReviewsEmbed
      embedSrc="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3144.049742905001!2d23.794233977768958!3d37.99930019919164!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14a1993446e8c7eb%3A0x299bfe2c72a90cd6!2sPrime%20Detailing%20Cholargos!5e0!3m2!1sen!2sgr!4v1758465390716!5m2!1sen!2sgr"
      reviewsLink="https://www.google.com/maps/place/?q=place_id:ChIJ68foRjSZoRQR1gypciz-myk"
    />
    {/* <FAQ /> */}
    {/* <ContactBand /> */}
    <BeforeAfterStrip maxShown={4} galleryUrl="/gallery" />

    <Footer />
  </div>
);

export default Index;
