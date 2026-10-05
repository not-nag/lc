import { notFound } from "next/navigation";
import { listDecks, loadDeck } from "@/lib/decks";
import { DeckStudio } from "./DeckStudio";

export function generateStaticParams() {
  return listDecks().map((d) => ({ slug: d.meta.slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const deck = loadDeck(slug);
  if (!deck) notFound();
  return <DeckStudio initial={deck} />;
}
