import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<string, string> = {
    fr: "TECHNOVOLT — Électricité générale & Domotique à Tataouine, Tunisie",
    ar: "تكنوفولت — كهرباء عامة وأنظمة تحكم ذكي بتطاوين، تونس",
    en: "TECHNOVOLT — Electrical Services & Home Automation in Tataouine, Tunisia",
  };

  const descriptions: Record<string, string> = {
    fr: "Installation électrique, dépannage rapide, climatisation, chauffe-eau et domotique à Tataouine et environs. Devis gratuit et intervention professionnelle.",
    ar: "تركيب وصيانة كهربائية، كشف الأعطال، مكيفات هواء، سخانات مياه وأنظمة ذكية في تطاوين وضواحيها. خدمات موثوقة وفريق فني محترف.",
    en: "General electrical installation, troubleshooting, air conditioning, water heaters and smart home automation in Tataouine, Tunisia. Free quotes and reliable service.",
  };

  return {
    title: {
      default: titles[locale] || titles.fr,
      template: "%s | TECHNOVOLT",
    },
    description: descriptions[locale] || descriptions.fr,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://technovolt.tn"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        fr: "/fr",
        ar: "/ar",
        en: "/en",
      },
    },
    openGraph: {
      title: titles[locale] || titles.fr,
      description: descriptions[locale] || descriptions.fr,
      url: `/${locale}`,
      siteName: "TECHNOVOLT",
      images: [
        {
          url: "/logo.jpg",
          width: 1200,
          height: 630,
          alt: "TECHNOVOLT Logo",
        },
      ],
      locale: locale === "ar" ? "ar_TN" : locale === "en" ? "en_US" : "fr_TN",
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className="h-full scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-[#F5A623] selection:text-[#1B3A6B]"
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
