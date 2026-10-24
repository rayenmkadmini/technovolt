# TECHNOVOLT — Plateforme Web, Admin & CRM

> **Électricité générale | Domotique & Climatisation — Tataouine, Tunisie**  
> *Plateforme complète : Site Web Public Multilingue (FR / AR / EN), Panneau d'Administration, CRM, Devis, Facturation, Suivi des Chantiers & Gestion Financière en Dinar Tunisien (TND).*

---

## ⚡ Présentation du Projet

**TECHNOVOLT** est une solution logicielle métier intégrée développée pour l'entreprise TECHNOVOLT basée à **Tataouine, Tunisie**.
Ce n'est pas une simple vitrine statique : c'est un véritable progiciel de gestion d'entreprise (ERP/CRM léger) combiné à un site internet public hautement optimisé pour la conversion locale.

### Caractéristiques Majeures

- **Multilingue Intégral (3 langues)** :
  - **Français (`/fr/`)** : Langue principale par défaut.
  - **Arabe (`/ar/`)** : Support complet RTL (Right-to-Left) avec typographie soignée Noto Sans Arabic.
  - **Anglais (`/en/`)** : Support complet LTR.
- **Portail Public Haute Conversion** :
  - Page d'accueil avec identité visuelle officielle de TECHNOVOLT.
  - Catalogue interactif des services (Électricité générale, dépannage, climatisation, chauffe-eau, domotique).
  - Fiches détaillées avec périmètre d'intervention, avantages, et devis indicatifs en **TND**.
  - Galerie de projets récents et chantiers réalisés à Tataouine.
  - Formulaire interactif de demande de devis générant un numéro de référence unique et lien direct WhatsApp.
  - Page de contact avec coordonnées directes, horaires d'ouverture et géolocalisation.
- **Panneau d'Administration Dédié (`/admin` / `/[locale]/admin`)** :
  - **Tableau de Bord Exécutif** : KPIs en direct, chiffre d'affaires facturé, trésorerie réellement encaissée, créances clients à recouvrer et marge opérationnelle.
  - **CRM Prospects (Leads)** : Traitement des demandes reçues depuis le site web, qualification et conversion directe en devis ou intervention.
  - **Fichier Clients** : Suivi des particuliers et professionnels, historiques des chantiers et soldes dus.
  - **Planning & Rendez-vous** : Gestion des interventions avec assignation des techniciens.
  - **Ordres de Travail (Work Orders)** : Suivi des chantiers, heures de main d'œuvre et fournitures.
  - **Devis & Factures** : Éditeur complet de documents avec calcul automatique HT/TVA (19%)/TTC et mise en page imprimable / export PDF.
  - **Règlements & Encaissements** : Gestion des flux d'argent réels (Espèces, Virement bancaire, Chèque).
  - **Dépenses & Fournisseurs** : Enregistrement des achats de matériel, approvisionnements et carburant.
  - **Stock & Matériel** : Gestion des seuils d'alerte de stock bas (disjoncteurs, câbles, gaz R410A).
  - **CMS Intégré** : Modification des coordonnées de contact, horaires, tarifs indicatifs et photos sans toucher au code source.
- **SEO & Référencement Local** :
  - Métadonnées complètes OpenGraph et Twitter Cards.
  - `sitemap.xml` et `robots.txt` dynamiques intégrant toutes les variantes linguistiques.
  - Données structurées Schema.org JSON-LD (Service, LocalBusiness).

---

## 🛠️ Stack Technologique

- **Framework Web** : [Next.js 16](https://nextjs.org/) (App Router, Server Components & Static Site Generation)
- **Langage** : TypeScript avec typage strict
- **Design & Styles** : Tailwind CSS v4, tokens de marque TECHNOVOLT (Bleu Marine `#1B3A6B`, Or Électrique `#F5A623`)
- **Composants d'Interface** : Composants accessibles inspirés de shadcn/ui, icônes Lucide React
- **Internationalisation** : `next-intl` avec routage dynamique et préservation du chemin lors du changement de langue
- **Base de Données & Auth** : Supabase PostgreSQL avec Row Level Security (RLS) sur toutes les tables
- **Gestion des Formulaires** : React Hook Form & Zod
- **Tests Unitaires** : Runner natif `node:test` (Node.js 24)

---

## 🚀 Installation & Démarrage Local

### Prérequis
- Node.js version 20 ou supérieure (testé sous Node v24)
- npm version 10 ou supérieure

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration des variables d'environnement
Copiez le fichier `.env.example` en `.env.local` :
```bash
cp .env.example .env.local
```
Renseignez vos clés Supabase (URL et clé publique `anon`) :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
> *Remarque : Le projet fonctionne immédiatement même sans Supabase connecté grâce aux données de démonstration résilientes intégrées.*

### 3. Lancement du serveur de développement
```bash
npm run dev
```
Accédez au site web :
- **Site public** : [http://localhost:3000](http://localhost:3000) (redirection automatique vers `/fr`)
- **Version Arabe (RTL)** : [http://localhost:3000/ar](http://localhost:3000/ar)
- **Version Anglaise** : [http://localhost:3000/en](http://localhost:3000/en)
- **Portail Administration** : [http://localhost:3000/admin](http://localhost:3000/admin)

### 4. Exécution des tests unitaires
```bash
npm test
```

### 5. Compilation pour la production
```bash
npm run build
```

---

## 🗄️ Schéma de Base de Données Supabase

Le schéma PostgreSQL complet se trouve dans :  
`supabase/migrations/001_initial_schema.sql` (1 950 lignes de SQL normalisé).

Il contient :
- **38 tables relationnelles** (auth, profils, rôles, services, devis, factures, paiements, dépenses, stock, leads).
- **Triggers d'audit et mise à jour automatique** (`updated_at`).
- **Politiques de sécurité RLS (Row Level Security)** étanches sur toutes les tables sensibles.
- **Séquences** pour la numérotation des devis (`DEV-XXXX`), factures (`FAC-XXXX`) et bons d'intervention.

Pour l'appliquer sur votre projet Supabase :
1. Rendez-vous dans votre console Supabase > **SQL Editor**.
2. Copiez le contenu de `supabase/migrations/001_initial_schema.sql` et exécutez-le.

---

## 📁 Architecture des Dossiers

```
technovolt website/
├── public/
│   ├── images/
│   │   └── logo.jpg               # Logo officiel TECHNOVOLT
│   └── logo.jpg
├── src/
│   ├── app/
│   │   ├── [locale]/              # Routes dynamiques multilingues (fr, ar, en)
│   │   │   ├── page.tsx           # Page d'accueil
│   │   │   ├── services/          # Catalogue & fiches services
│   │   │   ├── projects/          # Réalisations & galerie
│   │   │   ├── about/             # À propos de l'entreprise
│   │   │   ├── contact/           # Page de contact
│   │   │   ├── quote/             # Demande de devis en ligne
│   │   │   └── admin/             # Panneau d'administration ERP/CRM
│   │   ├── api/
│   │   │   ├── contact/           # API d'enregistrement des messages
│   │   │   └── quote/             # API d'enregistrement des devis
│   │   ├── globals.css            # Styles globaux & tokens électriques
│   │   ├── robots.ts              # Générateur robots.txt
│   │   └── sitemap.ts             # Générateur sitemap.xml
│   ├── components/
│   │   ├── forms/                 # Formulaires interactifs
│   │   ├── layout/                # Header, Footer, LanguageSwitcher
│   │   └── ui/                    # Boutons, Cartes, Badges, Inputs
│   ├── i18n/                      # Configuration routing et messages next-intl
│   ├── lib/
│   │   ├── data/                  # Données et store opérationnel
│   │   ├── supabase/              # Clients serveur, admin et navigateur
│   │   └── utils.ts               # Utilitaires monétaires (TND) et formats
│   ├── messages/                  # Dictionnaires de traduction (fr, ar, en)
│   ├── tests/                     # Tests unitaires
│   └── types/                     # Définitions TypeScript
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # Schéma PostgreSQL officiel
├── .env.example
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 🔒 Sécurité & Bonnes Pratiques

- **Aucun secret exposé** : Les clés privées (`SUPABASE_SERVICE_ROLE_KEY`) sont strictement isolées côté serveur.
- **Gestion monétaire exacte** : Les valeurs financières utilisent des arrondis à 3 décimales (`DECIMAL(12,3)`) conformes au standard bancaire du Dinar Tunisien (millimes), sans approximations de calcul à virgule flottante.
- **Règles comptables saines** : Les créances clients restent distinctes de la trésorerie disponible tant qu'un paiement n'est pas effectif.
"# technovolt" 
