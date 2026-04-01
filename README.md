# YogaOps MVP

MVP web pour reservation de cours de yoga (FR, EUR) avec:

- pages publiques: accueil, reservation, tarifs
- backoffice: creation cours / creneaux / abonnements
- reservation persistante en base avec blocage des creneaux complets
- structure prete pour integration Stripe + Zoom

## Lancer en local

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

> Si `node` n'est pas reconnu sur Windows dans votre terminal, fermez et rouvrez Cursor, puis verifiez `node -v`.

## Initialiser la base

```bash
npx prisma migrate dev
npx prisma generate
```

## Variables d'environnement

Copiez `.env.example` en `.env.local` et remplissez les cles:

```bash
cp .env.example .env.local
```

## Webhook Stripe (mode test)

Une fois votre domaine ou tunnel disponible:

- endpoint a configurer dans Stripe: `https://votre-domaine/api/stripe/webhook`
- ecouter: `checkout.session.completed`, `checkout.session.expired`

En local, vous pouvez utiliser Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Le flux Stripe implemente:

- reservation avec mode `stripe` -> creation session Checkout
- retour client sur `/confirmation`
- confirmation finale via webhook Stripe

## Zoom API

- les cles Zoom restent cote serveur (jamais cote navigateur)
- les utilisateurs ne voient que le lien Zoom final
- creation du lien Zoom automatique a la confirmation (si cles Zoom presentes)
- sinon fallback: lien a renseigner manuellement dans le backoffice

## Emails de confirmation

Les emails partent automatiquement:

- apres webhook Stripe confirme (paiement en ligne)
- apres reservation sur place (confirmation immediate)

Variables a renseigner:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `ADMIN_EMAIL` (copie prof)

## Prochaines etapes techniques

1. Ajouter edition/suppression dans backoffice
2. Remplacer le code admin par NextAuth
3. Basculer SQLite vers PostgreSQL pour production VPS
