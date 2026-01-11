import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldCheck } from "lucide-react";

type SpecialistServiceCardProps = {
  bookingPath?: string;
};

const SpecialistServiceCard = ({
  bookingPath = "/booking?service=paintCorrection",
}: SpecialistServiceCardProps) => {
  const { t } = useTranslation();

  return (
    <Card
      className="
        relative
        overflow-hidden
        border border-yellow-500/30
        bg-gradient-to-br
        from-zinc-900
        via-zinc-900
        to-zinc-950
        shadow-xl
      "
    >
      {/* subtle premium glow */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent" />

      <CardHeader className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Sparkles className="h-6 w-6 text-yellow-400" />
          </div>

          <CardTitle className="text-2xl font-bold">
            {t("special.paintCorrection.title")}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6">
        {/* Description */}
        <p className="text-zinc-400 leading-relaxed">
          {t("special.paintCorrection.description")}
        </p>

        {/* Features */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {(
            t("special.paintCorrection.features", {
              returnObjects: true,
            }) as string[]
          ).map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-zinc-300">
              <ShieldCheck className="h-4 w-4 text-yellow-400" />
              {feature}
            </li>
          ))}
        </ul>

        {/* Price & Duration (larger + unified format) */}
        <div className="text-left pl-2  ">
          <div className="text-2xl font-semibold text-zinc-300">
            {t("special.paintCorrection.meta")}
          </div>
        </div>

        {/* CTA – centered */}
        <div className="flex justify-left ">
          <NavLink to={bookingPath}>
            <Button
              size="lg"
              className="bg-yellow-500 text-black hover:bg-yellow-400 px-10"
            >
              {t("special.paintCorrection.cta")}
            </Button>
          </NavLink>
        </div>

        {/* Fine note */}
        <p className="text-center text-xs text-zinc-500">
          {t("special.paintCorrection.note")}
        </p>
      </CardContent>
    </Card>
  );
};

export default SpecialistServiceCard;
