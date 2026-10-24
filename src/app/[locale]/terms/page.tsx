import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default async function TermsPage({
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
        <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Conditions Générales</h1>
        <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-4">
          <p>
            Les présentes conditions générales régissent l'utilisation du site TECHNOVOLT et les
            services proposés (installation électrique, dépannage, climatisation, domotique).
          </p>
          <p>
            Tout devis est valable 30 jours. Les interventions sont garanties conformément aux
            normes en vigueur. Pour toute réclamation, contactez-nous à contact@technovolt.tn.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}