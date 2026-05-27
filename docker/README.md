# Docker — environnements MyTDFRIK

Ce dossier rassemble les fichiers de définition des environnements Docker (dev local, staging, prod).

## Fichiers

| Fichier                      | Description                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `docker-compose.yml`         | Environnement de développement local (Postgres + Redis + ClamAV + Traefik + api + web). |
| `.env.example`               | Variables d'environnement à copier en `.env` local.                                     |
| `docker-compose.staging.yml` | (à créer en S8) — Environnement de staging sur VPS.                                     |
| `docker-compose.prod.yml`    | (à créer en S9) — Environnement de production (DB et Redis managed Scaleway externes).  |

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

- **Production** : PostgreSQL et Redis sont managed par Scaleway, **pas** des conteneurs (CDC §11.9.4).
- **Traefik en prod** : configuration Let's Encrypt sera ajoutée dans `docker-compose.prod.yml` au S9.
- **Sécurité dev** : le dashboard Traefik est exposé `--api.insecure=true`. À désactiver en staging et prod.
