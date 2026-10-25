import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Politique de Confidentialité</h1>
        <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-4">
          <p>
            TECHNOVOLT s'engage à protéger la confidentialité de vos données personnelles. Les
            informations collectées via le site (formulaires de devis, contact) sont utilisées
            uniquement pour répondre à vos demandes et ne sont jamais vendues à des tiers.
          </p>
          <p>
            Vous disposez d'un droit d'accès, de rectification et de suppression de vos données
            en nous contactant à contact@technovolt.tn.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}