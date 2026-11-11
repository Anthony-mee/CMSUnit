import { siDirectus, siPocketbase, siSupabase } from "simple-icons/icons";
import type { SimpleIcon } from "simple-icons";

export type PlatformBrand = "supabase" | "directus" | "pocketbase";

export function resolvePlatformBrand(name: string): PlatformBrand | undefined {
  const brand = name.trim().toLowerCase();
  return brand === "supabase" || brand === "directus" || brand === "pocketbase"
    ? brand
    : undefined;
}

const platformIcons: Record<PlatformBrand, SimpleIcon> = {
  supabase: siSupabase,
  directus: siDirectus,
  pocketbase: siPocketbase,
};

type PlatformLogoProps = {
  platform: PlatformBrand;
  className?: string;
};

export default function PlatformLogo({ platform, className }: PlatformLogoProps) {
  const icon = platformIcons[platform];

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      role="img"
      viewBox="0 0 24 24"
    >
      <path d={icon.path} />
    </svg>
  );
}
