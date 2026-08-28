# Déploiement MyTDFRIK sur VPS (Docker Compose + Traefik)

Procédure complète de mise en production sur le VPS, derrière le Traefik
mutualisé du serveur, avec certificats Let's Encrypt automatiques.

---

## 1. Prérequis

> **Serveur mutualisé.** MyTDFRIK est déployé sur un VPS qui héberge déjà
> d'autres applications (GitLab, n8n, Hyperion, Komodo) derrière un **Traefik
> commun**. Cette pile ne démarre donc pas son propre reverse proxy et ne publie
> aucun port : elle rejoint le réseau du Traefik existant. Détails en
> [§2](#2-traefik-mutualisé).

### 1.1 Serveur

| Ressource | Minimum                  | Recommandé                     |
| --------- | ------------------------ | ------------------------------ |
| CPU       | 2 vCPU                   | 4 vCPU                         |
| RAM       | 4 Go **disponibles**     | 8 Go (build Next.js sur place) |
| Disque    | 40 Go SSD                | 80 Go SSD                      |
| OS        | Ubuntu 22.04 / Debian 12 | idem                           |

> **RAM et build.** Le build de l'image `web` (Next.js) consomme ~2 Go, en plus
> de ce que consomment les piles déjà en place. Vérifier `free -h` avant de
> lancer un build sur le serveur ; à défaut, utiliser les images pré-construites
> par la CI (`--pull`, cf. §7) ou ajouter temporairement un fichier d'échange.

### 1.2 DNS

Deux enregistrements `A` (et `AAAA` si IPv6) doivent pointer sur l'IP du VPS
**avant** le premier démarrage — le resolver ACME du serveur valide en TLS-ALPN,
donc sur le port 443 :

```
support.techdifrik.com.   A   203.0.113.10
api.techdifrik.com.       A   203.0.113.10
```

Vérification : `dig +short support.techdifrik.com`

Le domaine `techdifrik.com` est géré chez Hostinger : marche à suivre détaillée en
[annexe A](#annexe-a--créer-les-enregistrements-dns-chez-hostinger).

### 1.3 Logiciels sur le VPS

Docker Engine et le plugin Compose sont déjà installés sur ce serveur. Contrôle :

```bash
docker --version
docker compose version
```

Sur une machine vierge : `curl -fsSL https://get.docker.com | sh`, puis
`sudo usermod -aG docker "$USER"` et reconnexion.

### 1.4 Pare-feu

Les ports 80 et 443 sont **déjà ouverts et occupés par le Traefik du serveur** :
il n'y a rien à modifier. Postgres et Redis de MyTDFRIK ne sont jamais exposés,
ils vivent sur un réseau Docker `internal`.

Sur une machine vierge uniquement :

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 2. Traefik mutualisé

Le VPS fait tourner un Traefik commun à toutes les applications hébergées. La
pile MyTDFRIK s'y raccorde au lieu d'en démarrer un second : deux reverse
proxies ne peuvent pas écouter les mêmes ports 80 et 443.

Configuration du Traefik en place, à laquelle `docker-compose.prod.yml` se
conforme :

| Élément                  | Valeur                                       | Variable correspondante     |
| ------------------------ | -------------------------------------------- | --------------------------- |
| Réseau Docker            | `traefik`                                    | `TRAEFIK_NETWORK`           |
| Entrypoint HTTP          | `web` (:80)                                  | `TRAEFIK_ENTRYPOINT_HTTP`   |
| Entrypoint HTTPS         | `websecure` (:443)                           | `TRAEFIK_ENTRYPOINT_HTTPS`  |
| Resolver ACME            | `letsencrypt`, challenge TLS-ALPN            | `TRAEFIK_CERTRESOLVER`      |
| Stockage des certificats | `/root/traefik/letsencrypt/acme.json` (hôte) | —                           |
| Découverte des services  | provider Docker, `exposedByDefault=false`    | label `traefik.enable=true` |

Relever cette configuration, ici ou sur un autre serveur :

```bash
docker inspect traefik --format '{{range .Config.Cmd}}{{println .}}{{end}}'
docker inspect traefik --format '{{range $k,$v := .NetworkSettings.Networks}}{{println $k}}{{end}}'
```

### 2.1 Conventions respectées

- **Pas de redirection HTTP → HTTPS globale** sur ce Traefik : chaque service
  déclare un routeur `<nom>-http` sur l'entrypoint `web` associé à un middleware
  `redirectscheme`. MyTDFRIK suit la même convention, avec ses propres
  middlewares plutôt qu'en réutilisant le `redirect-to-https` d'une autre pile —
  qui disparaîtrait si celle-ci était arrêtée.
- **Les noms de routeurs, services et middlewares sont globaux** à l'instance
  Traefik. Tous ceux de cette pile sont préfixés `mytdfrik-`, ce qui évite
  d'écraser le routeur d'une autre application et la collision avec
  `api@internal`, le dashboard interne de Traefik.
- **Aucun port publié** : `docker compose ... ps` ne doit afficher aucun mapping
  pour cette pile. Postgres et Redis restent sur le réseau `backend`, déclaré
  `internal`, donc sans route vers l'extérieur.

### 2.2 Ce que la pile ne fait pas

Elle ne démarre ni ne redémarre Traefik, ne modifie pas sa configuration et ne
touche pas à `acme.json`. Les certificats des deux sous-domaines sont demandés
par Traefik lorsqu'il découvre les nouveaux routeurs, et s'ajoutent à ceux des
autres applications.

---

## 3. Récupération du code

Le VPS se sert du dépôt de déploiement `git.digitechafricaltd.com`, dont la
branche `main` porte la version à mettre en production. Le développement, lui,
continue sur GitHub (`hubersondev/mytdfrik`) : une branche y est revue par PR,
puis publiée ici.

```bash
sudo mkdir -p /opt/mytdfrik && sudo chown "$USER:$USER" /opt/mytdfrik
git clone https://git.digitechafricaltd.com/others/mytdfrik.git /opt/mytdfrik
cd /opt/mytdfrik
```

`scripts/deploy.sh` fait un `git pull --ff-only` sur la branche courante : le
clone doit donc rester sur `main`.

Dépôt privé : utilisez un déploiement par clé SSH (`ssh-keygen -t ed25519`, puis
ajout de la clé publique dans les _Deploy keys_ du dépôt).

Publication d'une nouvelle version depuis votre poste :

```bash
git push deploy <branche-validée>:main
```

---

## 4. Configuration

```bash
cp docker/.env.prod.example docker/.env.prod
chmod 600 docker/.env.prod
nano docker/.env.prod
```

Valeurs **obligatoires** à renseigner :

| Variable            | Rôle                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `WEB_DOMAIN`        | Domaine du front (ex. `support.techdifrik.com`)                                              |
| `API_DOMAIN`        | Domaine de l'API (ex. `api.techdifrik.com`)                                                  |
| `POSTGRES_PASSWORD` | Mot de passe Postgres — `openssl rand -hex 24`                                               |
| `REDIS_PASSWORD`    | Mot de passe Redis — `openssl rand -hex 24`                                                  |
| `JWT_SECRET`        | ≥ 32 caractères — `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `RESEND_API_KEY`    | Clé API Resend — envoi réel des courriels (cf. annexe B)                                     |
| `ADMIN_BOOTSTRAP_*` | Premier compte administrateur                                                                |

Le script de déploiement refuse de démarrer tant qu'un `CHANGE_ME` subsiste
dans le fichier.

> **Courriels.** Le transport retenu est Resend ; seule `RESEND_API_KEY` reste à
> renseigner. Vérification du domaine et enregistrements DNS en
> [annexe B](#annexe-b--transport-des-courriels-via-resend). `SMTP_HOST` doit
> rester vide : le code donne la priorité au SMTP, une valeur ici court-circuite
> Resend.
> Sans `SMTP_HOST` ni `RESEND_API_KEY`, l'API se contente de journaliser les
> messages : aucun utilisateur ne pourra activer son compte ni réinitialiser son
> mot de passe.

---

## 5. Premier déploiement

```bash
chmod +x scripts/*.sh
./scripts/deploy.sh --seed
```

Le script enchaîne : contrôles (env, secrets, validité Compose) → `git pull` →
build des images → `docker compose up -d` → seeds → état des services.

Séquence de démarrage orchestrée par Compose :

```
postgres (healthy) ─┐
                    ├─> migrate (migrations TypeORM, one-shot) ─> api ─> web
redis    (healthy) ─┘
```

Vérifications :

```bash
curl -I https://support.techdifrik.com          # 200, certificat valide
curl  https://api.techdifrik.com/api/v1/health
curl -I http://support.techdifrik.com           # 308 vers https
```

L'obtention des certificats prend 10 à 60 secondes au premier lancement. En cas
d'échec : `docker logs traefik | grep -i acme`.

---

## 6. Mises à jour

```bash
cd /opt/mytdfrik
./scripts/deploy.sh
```

Les nouvelles migrations sont jouées automatiquement par le service `migrate`
avant le redémarrage de l'API. Les seeds sont idempotents mais ne sont rejoués
qu'avec `--seed`.

Options disponibles :

| Commande                       | Effet                                        |
| ------------------------------ | -------------------------------------------- |
| `./scripts/deploy.sh`          | `git pull` + build local + redémarrage       |
| `./scripts/deploy.sh --pull`   | Images du registre au lieu du build local    |
| `./scripts/deploy.sh --seed`   | Rejoue les seeds après le démarrage          |
| `./scripts/deploy.sh --no-git` | Déploie l'état local sans récupérer le dépôt |

---

## 7. Images pré-construites (GHCR)

La CI publie `api` et `web` sur GitHub Container Registry à chaque merge sur
`main`. Pour les consommer plutôt que de construire sur le VPS :

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u <utilisateur> --password-stdin

# docker/.env.prod
API_IMAGE=ghcr.io/hubersondev/mytdfrik/api:latest
WEB_IMAGE=ghcr.io/hubersondev/mytdfrik/web:latest

./scripts/deploy.sh --pull
```

> **Point d'attention — image `web`.** `NEXT_PUBLIC_API_URL` est _figée dans le
> bundle JavaScript au moment du build_. L'image publiée par la CI n'est
> utilisable en production que si la variable de dépôt GitHub
> `NEXT_PUBLIC_API_URL` est définie (_Settings → Secrets and variables →
> Actions → Variables_) avec la valeur `https://api.techdifrik.com/api/v1`.
> Sinon, construisez l'image `web` sur le VPS (mode par défaut du script).

---

## 8. Exploitation

```bash
C="docker compose --env-file docker/.env.prod -f docker/docker-compose.prod.yml"

$C ps                       # état des services
$C logs -f api web          # logs applicatifs
$C logs -f traefik          # accès HTTP, ACME
$C restart api              # redémarrage ciblé
$C down                     # arrêt (les volumes sont conservés)
```

### Base de données

```bash
docker exec -it mytdfrik-postgres-prod psql -U mytdfrik -d mytdfrik -c "\dt"
```

### Sauvegardes

```bash
./scripts/backup-db.sh                       # dump compressé dans ./backups

# Automatisation quotidienne (crontab -e)
0 3 * * * cd /opt/mytdfrik && BACKUP_DIR=/var/backups/mytdfrik ./scripts/backup-db.sh >> /var/log/mytdfrik-backup.log 2>&1
```

Restauration :

```bash
gunzip -c backups/mytdfrik-20260826-030000.sql.gz \
  | docker exec -i mytdfrik-postgres-prod psql -U mytdfrik -d mytdfrik
```

> **Pièces jointes.** Avec `STORAGE_DRIVER=local`, les fichiers vivent dans le
> volume Docker `mytdfrik-prod_api_storage`. À sauvegarder également :
> `docker run --rm -v mytdfrik-prod_api_storage:/data -v "$PWD/backups:/backup" alpine tar czf /backup/storage-$(date +%F).tar.gz -C /data .`

### Retour arrière

```bash
git checkout <sha-precedent>
./scripts/deploy.sh --no-git
# Migration à annuler :
docker compose --env-file docker/.env.prod -f docker/docker-compose.prod.yml \
  run --rm --no-deps migrate node node_modules/typeorm/cli.js migration:revert -d dist/database/data-source.js
```

---

## 9. Architecture réseau

```
                         Internet
                            │  :80 / :443
                    ┌───────▼────────┐
                    │    traefik     │  conteneur partagé du VPS
                    │  (hors pile)   │  TLS Let's Encrypt (TLS-ALPN)
                    └──┬──────────┬──┘
      réseau « traefik »│         │      … et les autres applications
                        │         │        (GitLab, n8n, Hyperion…)
              ┌─────────▼┐   ┌────▼─────┐
              │   web    │   │   api    │
              │ Next.js  │   │  NestJS  │
              │  :3001   │   │  :3000   │
              └──────────┘   └────┬─────┘
                                  │ réseau « backend » (internal)
                           ┌──────┴──────┐
                      ┌────▼────┐   ┌────▼────┐
                      │ postgres│   │  redis  │
                      └─────────┘   └─────────┘
```

Choix de sécurité appliqués :

- Postgres et Redis sur un réseau `internal`, aucun port publié sur l'hôte ; ils
  ne sont joignables que par `api` et `migrate`.
- Redis protégé par mot de passe (`requirepass`).
- Conteneurs applicatifs en utilisateur non root (`app`).
- HSTS, `X-Content-Type-Options`, `X-Frame-Options` et `Referrer-Policy` posés
  par les middlewares `mytdfrik-api-secure` et `mytdfrik-web-secure`, en
  complément de Helmet côté API.
- Swagger automatiquement désactivé quand `NODE_ENV=production`.
- CORS restreint à `https://$WEB_DOMAIN`.
- `trust proxy` activé côté NestJS : le rate limiting et les journaux voient
  l'IP réelle du client, et non celle de Traefik.

Le rendu serveur de Next.js appelle l'API par son URL publique
(`https://$API_DOMAIN`), donc par l'IP publique du VPS. Si cette boucle ne passe
pas — NAT sans hairpin —, décommenter `extra_hosts` sur le service `web` dans
`docker-compose.prod.yml` : la résolution se fera alors vers la passerelle de
l'hôte, où Traefik écoute.

---

## 10. Diagnostic

| Symptôme                                                                  | Piste                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 404 alors que les labels et le réseau sont bons, **et aucun log Traefik** | Le conteneur est `unhealthy` : le provider Docker n'expose que les conteneurs sains, et ne le signale qu'en niveau `debug`. `docker ps` pour l'état, puis `docker inspect <conteneur> --format '{{json .State.Health}}'` pour la sonde en échec                              |
| `migrate` : `Unable to open file … URI malformed`                         | Caractère réservé (`%`, `@`, `/`, `:`) dans `POSTGRES_PASSWORD` : TypeORM ne sait plus analyser `DATABASE_URL`. Régénérer en `openssl rand -hex 24`, **puis supprimer le volume** `mytdfrik-prod_postgres_data` — le mot de passe est figé par `initdb` au premier démarrage |
| Certificat invalide / `TRAEFIK DEFAULT CERT`                              | DNS non propagé ou port 443 injoignable — `docker logs traefik \| grep -i acme`                                                                                                                                                                                              |
| 404 sur les deux domaines                                                 | Labels non lus : vérifier que `api` et `web` sont bien sur le réseau `traefik` (`docker network inspect traefik`)                                                                                                                                                            |
| Un autre site du VPS devient inaccessible                                 | Collision de noms de routeurs : tous les nôtres doivent être préfixés `mytdfrik-`                                                                                                                                                                                            |
| API en `restarting`                                                       | Validation Joi en échec (`JWT_SECRET` trop court, `DATABASE_URL` absent) — `docker logs mytdfrik-api-prod`                                                                                                                                                                   |
| `migrate` en erreur                                                       | Postgres injoignable ou migration en conflit — `docker logs mytdfrik-migrate-prod`                                                                                                                                                                                           |
| Front chargé mais appels API en échec                                     | `NEXT_PUBLIC_API_URL` figée sur `localhost` : reconstruire l'image `web`                                                                                                                                                                                                     |
| Erreur CORS dans la console navigateur                                    | `CORS_ORIGINS` ≠ `https://$WEB_DOMAIN`                                                                                                                                                                                                                                       |
| `429 Too Many Requests`                                                   | Throttler NestJS (60 req/min/IP)                                                                                                                                                                                                                                             |

Le dashboard Traefik du serveur (`http://<IP>:8080`) liste les routeurs
découverts : c'est le moyen le plus rapide de vérifier que `mytdfrik-web` et
`mytdfrik-api` sont bien enregistrés et sans erreur.

Limite ACME : 5 échecs par heure et par domaine. Le resolver `letsencrypt` est
partagé avec les autres applications du VPS — épuiser son quota les affecterait
lors d'un renouvellement. D'où la règle : ne déployer qu'une fois les DNS
propagés et vérifiés.

---

## 11. Points ouverts

- **ClamAV** n'est pas déployé : le scan antivirus des pièces jointes est
  simulé (`ANTIVIRUS_SIMULATED_DELAY_MS`). Le conteneur consomme ~1,5 Go de RAM ;
  à réintroduire avec le vrai driver, cf. CDC §11.4.
- **`STORAGE_DRIVER=s3`** n'est pas câblé dans ce build : rester sur `local`.
- **Instance unique** : l'API porte des jobs planifiés et des WebSockets
  in-process, elle ne doit pas être répliquée en l'état.

---

## Annexe A — Créer les enregistrements DNS chez Hostinger

Le domaine `techdifrik.com` est délégué aux serveurs de noms Hostinger
(`hyperion.dns-parking.com`, `atlas.dns-parking.com`) : la zone se modifie donc
dans hPanel, et nulle part ailleurs.

### A.1 État de la zone à préserver

Relevé au 2026-08-27, avant l'ajout des sous-domaines de MyTDFRIK :

| Entrée                         | Destination               | À ne pas toucher                                |
| ------------------------------ | ------------------------- | ----------------------------------------------- |
| `techdifrik.com` (apex), `www` | `216.198.79.1` (Vercel)   | Site vitrine — sa suppression le met hors ligne |
| `MX`                           | `mx.zoho.com` et suivants | Messagerie Zoho — réception des courriels       |
| `TXT` (SPF, DKIM)              | Zoho                      | Authentification des courriels envoyés          |

Aucun enregistrement générique (`*`) n'existe : `support` et `api` sont libres.

### A.2 Adresse IP du VPS

hPanel → **VPS** → sélectionner le serveur → l'adresse IP figure dans l'encadré
d'aperçu. Si le VPS n'est pas encore créé : **VPS → Configurer**, avec Ubuntu
24.04 **sans** panneau d'administration (CyberPanel, Plesk, aaPanel occuperaient
les ports 80 et 443 dont Traefik a besoin).

### A.3 Ajout des enregistrements

hPanel → **Domaines** → `techdifrik.com` → **DNS / Serveurs de noms**
(accès direct : `https://hpanel.hostinger.com/domain/techdifrik.com/dns`).

Dans « Gérer les enregistrements DNS », ajouter les deux entrées suivantes :

| Type | Nom       | Pointe vers | TTL |
| ---- | --------- | ----------- | --- |
| `A`  | `support` | _IP du VPS_ | 300 |
| `A`  | `api`     | _IP du VPS_ | 300 |

Deux précautions :

- Le champ **Nom** attend `support`, pas `support.techdifrik.com` : Hostinger
  suffixe le domaine automatiquement, sinon l'entrée créée est
  `support.techdifrik.com.techdifrik.com`.
- TTL à 300 s pendant la mise en place — une erreur d'IP se corrige en cinq
  minutes au lieu de quatre heures. Le remonter à 14400 une fois en production.

### A.4 Variante en ligne de commande

Le CLI officiel Hostinger permet de tracer l'opération. `--overwrite=false` est
**impératif** : sans lui, la commande remplace l'intégralité de la zone (donc
les entrées Vercel et Zoho).

```bash
hostinger dns records update techdifrik.com --overwrite=false \
  --zone='[{"name":"support","type":"A","ttl":300,"records":[{"content":"<IP_DU_VPS>"}]},
           {"name":"api","type":"A","ttl":300,"records":[{"content":"<IP_DU_VPS>"}]}]'

hostinger dns records list techdifrik.com
```

### A.5 Contrôle avant déploiement

```bash
nslookup support.techdifrik.com 8.8.8.8
nslookup api.techdifrik.com 8.8.8.8
```

Les deux doivent renvoyer l'IP du VPS (compter 1 à 10 minutes). **Ne lancer
`./scripts/deploy.sh` qu'après ce contrôle** : Let's Encrypt limite à 5 échecs
par heure et par domaine, et un déploiement lancé trop tôt consomme ce quota.

---

## Annexe B — Transport des courriels via Resend

L'API choisit son transport dans cet ordre : **SMTP** si `SMTP_HOST` est défini,
sinon **Resend** si `RESEND_API_KEY` l'est, sinon **journalisation seule**.
Resend étant retenu, `SMTP_HOST` doit rester vide — une valeur, même héritée
d'un ancien `.env.prod`, le court-circuiterait silencieusement.

### B.1 Vérification du domaine dans Resend

Dans le tableau de bord Resend : **Domains → Add Domain**, saisir
`techdifrik.com`. Resend affiche alors les enregistrements à créer. Ils portent
tous sur le sous-domaine `send` ou sur `*._domainkey` :

| Type    | Nom (chez Hostinger)     | Valeur                                               |
| ------- | ------------------------ | ---------------------------------------------------- |
| `MX`    | `send`                   | `feedback-smtp.<région>.amazonses.com` (priorité 10) |
| `TXT`   | `send`                   | `v=spf1 include:amazonses.com ~all`                  |
| `CNAME` | `<sélecteur>._domainkey` | `<sélecteur>.dkim.amazonses.com`                     |

Les valeurs exactes, dont les trois sélecteurs DKIM, sont propres à votre
domaine : les recopier depuis l'écran Resend, sans les modifier.

> **Aucun conflit avec Zoho.** Le SPF de la racine
> (`v=spf1 include:zohomail.com ~all`) et les MX `mx.zoho.com` ne sont pas
> touchés : Resend pose son SPF et son MX de retour sur `send.techdifrik.com`.
> La réception des courriels continue de passer par Zoho. Ne jamais ajouter un
> second enregistrement SPF à la racine — deux SPF sur un même nom invalident
> l'authentification.

La marche à suivre pour créer ces entrées chez Hostinger est la même qu'en
[annexe A](#annexe-a--créer-les-enregistrements-dns-chez-hostinger) : champ
**Nom** sans le domaine (`send`, pas `send.techdifrik.com`).

Une fois le statut passé à **Verified** dans Resend, générer une clé API
(**API Keys → Create**, permission _Sending access_) et la reporter dans
`docker/.env.prod`.

### B.2 Configuration dans `docker/.env.prod`

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
MAIL_FROM_ADDRESS=no-reply@techdifrik.com
MAIL_FROM_NAME=MyTDFRIK · TECHDIFRIK
# SMTP_HOST doit rester vide ou commenté
```

`MAIL_FROM_ADDRESS` doit appartenir au domaine vérifié. Tant que la
vérification n'est pas terminée, seule `onboarding@resend.dev` fonctionne, et
uniquement vers l'adresse du compte Resend — inutilisable en production.

### B.3 Vérification après déploiement

```bash
# Le transport retenu est annoncé au démarrage de l'API
docker logs mytdfrik-api-prod | grep MailService
# Attendu : MailService prêt en mode Resend (from "MyTDFRIK · TECHDIFRIK" <no-reply@techdifrik.com>)
```

Si la ligne indique `mode SMTP`, c'est qu'un `SMTP_HOST` traîne dans le fichier
d'environnement. Si elle indique `mode DEV (log only)`, ni l'un ni l'autre n'est
défini et aucun courriel ne partira.

Test de bout en bout : déclencher un « mot de passe oublié » depuis le portail,
puis contrôler la livraison dans **Resend → Emails**, qui journalise chaque
envoi avec son statut (`delivered`, `bounced`, `complained`).

| Erreur Resend                    | Cause                                                                      |
| -------------------------------- | -------------------------------------------------------------------------- |
| `403 The domain is not verified` | Vérification DNS inachevée, ou `MAIL_FROM_ADDRESS` hors du domaine vérifié |
| `422 Invalid from field`         | Format d'expéditeur incorrect                                              |
| `401 API key is invalid`         | Clé révoquée, tronquée, ou sans permission d'envoi                         |
| Aucun envoi, aucune erreur       | Transport en mode DEV ou SMTP — vérifier la ligne `MailService`            |

### B.4 Repli sur le SMTP Zoho

Le domaine étant déjà authentifié chez Zoho, ce repli ne demande aucune
configuration DNS. Renseigner dans `docker/.env.prod` :

```bash
SMTP_HOST=smtp.zoho.com
SMTP_PORT=465
SMTP_USER=no-reply@techdifrik.com
SMTP_PASSWORD=<mot de passe d'application>
MAIL_FROM_ADDRESS=no-reply@techdifrik.com   # doit être identique à SMTP_USER
```

Le SMTP prend automatiquement le pas sur Resend. Prérequis côté Zoho : une
véritable boîte `no-reply@techdifrik.com` (un alias est refusé à l'expédition),
l'accès SMTP activé, et un mot de passe d'application si la double
authentification est en place. Le port 465 correspond au TLS implicite, activé
automatiquement par l'API ; 587 fonctionne aussi, en STARTTLS.
