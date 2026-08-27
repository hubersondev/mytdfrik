# Docker — environnements MyTDFRIK

Ce dossier rassemble les fichiers de définition des environnements Docker (dev local, staging, prod).

## Fichiers

| Fichier                      | Description                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| `docker-compose.yml`         | Environnement de développement local (Postgres + Redis + ClamAV + Traefik + api + web).   |
| `.env.example`               | Variables d'environnement à copier en `.env` local.                                       |
| `docker-compose.prod.yml`    | Production sur VPS : Traefik + Let's Encrypt, migrations automatiques, réseau data privé. |
| `.env.prod.example`          | Variables de production à copier en `.env.prod` **sur le VPS** (jamais commité).          |
| `docker-compose.staging.yml` | (à créer) — Environnement de staging, dérivé du compose de production.                    |

> **Déploiement en production :** procédure complète dans
> [`docs/DEPLOIEMENT-VPS.md`](../docs/DEPLOIEMENT-VPS.md). Résumé :
>
> ```bash
> cp docker/.env.prod.example docker/.env.prod   # renseigner domaines et secrets
> ./scripts/deploy.sh --seed                     # premier déploiement
> ./scripts/deploy.sh                            # mises à jour suivantes
> ```

## Démarrage rapide

```bash
# Depuis la racine du dépôt
cp docker/.env.example docker/.env

# Démarrer la pile complète
docker compose -f docker/docker-compose.yml up -d

# Suivre les logs
docker compose -f docker/docker-compose.yml logs -f api web

# Arrêter et nettoyer
docker compose -f docker/docker-compose.yml down

# Réinitialiser les volumes (perte de données)
docker compose -f docker/docker-compose.yml down -v
```

## URLs locales (via Traefik)

| Service            | URL                                      |
| ------------------ | ---------------------------------------- |
| Web                | http://localhost ou http://web.localhost |
| API                | http://api.localhost/api/v1              |
| API health         | http://api.localhost/api/v1/health       |
| API docs (Swagger) | http://api.localhost/api/v1/docs         |
| Traefik dashboard  | http://localhost:8080                    |
| PostgreSQL         | localhost:5432 (mytdfrik / changeme)     |
| Redis              | localhost:6379                           |

> Sous Windows / macOS, ajouter les entrées à votre fichier `hosts` si la résolution `*.localhost` n'est pas automatique :
>
> ```
> 127.0.0.1   api.localhost web.localhost
> ```

## ClamAV

Le premier démarrage de ClamAV télécharge ~250 Mo de signatures. Le healthcheck a un `start_period` de 6 minutes pour absorber ce délai. Surveillez les logs avec `docker compose logs -f clamav`.

## Notes

- **Production sur VPS** : `docker-compose.prod.yml` embarque PostgreSQL et Redis en conteneurs sur un réseau `internal`. Pour des bases managées (Scaleway, CDC §11.9.4), renseigner `DATABASE_URL` / `REDIS_URL` dans `.env.prod` et commenter les services correspondants.
- **Traefik en prod** : Let's Encrypt (challenge HTTP-01), redirection HTTP → HTTPS, dashboard désactivé.
- **Sécurité dev** : le dashboard Traefik est exposé `--api.insecure=true` — uniquement en local.
