import { notFound } from "next/navigation";
import { Shell } from "../../components/Shell";
import { StudioClient } from "../../components/StudioClient";
import { ALL_STORYBOARDS } from "@/lib/storyboards";

export function generateStaticParams() {
  return ALL_STORYBOARDS.map((sb) => ({ slug: sb.meta.slug }));
}

export default async function Studio({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = ALL_STORYBOARDS.find((s) => s.meta.slug === slug);
  if (!sb) notFound();
  return (
    <Shell>
      <StudioClient storyboard={sb} />
    </Shell>
  );
}
