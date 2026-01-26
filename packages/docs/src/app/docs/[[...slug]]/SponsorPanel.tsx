import { cn } from "@/lib/cn";
import { MoveRight } from "lucide-react";
import Image from "next/image";

type SponsorTier = "gold" | "silver" | "bronze";

export type Sponsor = {
  name: string;
  url: string;
  image: string | React.ReactNode;
  tier: SponsorTier;
};

export default async function SponsorPanel() {
  const sponsors: Sponsor[] = [];

  const [fullSizeSponsors, smallSizeSponsors] = sponsors.reduce(
    (acc, sponsor) => {
      if (sponsor.tier === "bronze") {
        acc[1].push(sponsor);
      } else {
        acc[0].push(sponsor);
      }
      return acc;
    },
    [[], []] as [Sponsor[], (Sponsor | undefined)[]],
  );

  if (smallSizeSponsors.length % 2 === 1) {
    smallSizeSponsors.push(undefined);
  }

  return (
    <>
      {sponsors.length > 0 && (
        <div className="space-y-1 mt-5 rounded-xl overflow-hidden">
          {fullSizeSponsors.map(sponsor => (
            <SponsorBlock key={sponsor.name} sponsor={sponsor} />
          ))}
          {smallSizeSponsors.length > 0 && (
            <div className="grid grid-cols-2 gap-1">
              {smallSizeSponsors.map((sponsor, index) => (
                <SponsorBlock key={sponsor?.name ?? index} sponsor={sponsor} />
              ))}
            </div>
          )}
        </div>
      )}
      <a
        href="https://github.com/sponsors/rhinobase"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 mt-5 text-sm font-semibold text-secondary-700 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-secondary-100 transition-colors"
      >
        Become a sponsor <MoveRight className="inline" />
      </a>
    </>
  );
}

function SponsorBlock(props: { sponsor?: Sponsor }) {
  const { sponsor } = props;

  if (!sponsor) return <div className="p-3 bg-neutral-200 dark:bg-neutral-800" />;

  return (
    <a
      title={sponsor.name}
      href={sponsor.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center justify-center group bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 hover:dark:bg-white transition-all",
        sponsor.tier === "gold" ? "p-5" : "p-3",
      )}
    >
      <div
        className={cn(
          "max-w-full m-auto grayscale group-hover:grayscale-0",
          sponsor.tier === "gold" ? "h-16" : sponsor.tier === "silver" ? "h-12" : "h-10",
        )}
      >
        {typeof sponsor.image === "string" ? (
          <Image src={sponsor.image} alt={sponsor.name} className="object-contain" width={150} height={150} />
        ) : (
          sponsor.image
        )}
      </div>
    </a>
  );
}
