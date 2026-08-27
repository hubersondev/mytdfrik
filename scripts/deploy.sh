#!/usr/bin/env bash
# ============================================================================
#  Déploiement MyTDFRIK sur VPS (Docker Compose + Traefik)
# ----------------------------------------------------------------------------
#  À exécuter depuis la racine du dépôt, sur le VPS :
#
#      ./scripts/deploy.sh                # build local + démarrage
#      ./scripts/deploy.sh --pull         # utilise les images du registre (GHCR)
#      ./scripts/deploy.sh --seed         # + seeds initiaux (1er déploiement)
#      ./scripts/deploy.sh --no-git       # ne fait pas de git pull
#
#  Le script est idempotent : il peut être rejoué à chaque mise à jour.
# ============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

COMPOSE_FILE="docker/docker-compose.prod.yml"
ENV_FILE="docker/.env.prod"

DO_PULL=false
DO_SEED=false
DO_GIT=true

for arg in "$@"; do
  case "$arg" in
    --pull) DO_PULL=true ;;
    --seed) DO_SEED=true ;;
    --no-git) DO_GIT=false ;;
    -h|--help) sed -n '2,13p' "$0"; exit 0 ;;
    *) echo "Option inconnue : $arg" >&2; exit 1 ;;
  esac
done

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m!!\033[0m %s\n' "$*" >&2; exit 1; }

# --------------------------- Contrôles préalables ---------------------------
command -v docker >/dev/null 2>&1 || fail "Docker n'est pas installé."
docker compose version >/dev/null 2>&1 || fail "Le plugin 'docker compose' est absent."
[ -f "$ENV_FILE" ] || fail "$ENV_FILE introuvable. Copiez docker/.env.prod.example et renseignez-le."

if grep -q 'CHANGE_ME' "$ENV_FILE"; then
  fail "$ENV_FILE contient encore des valeurs 'CHANGE_ME'. Renseignez-les avant de déployer."
fi

# Le fichier contient des secrets : on refuse des droits trop permissifs.
PERMS="$(stat -c '%a' "$ENV_FILE")"
if [ "$PERMS" != "600" ] && [ "$PERMS" != "400" ]; then
  log "Restriction des droits de $ENV_FILE (était $PERMS) -> 600"
  chmod 600 "$ENV_FILE"
fi

# La pile se greffe sur le Traefik du VPS : son réseau doit préexister.
TRAEFIK_NETWORK="$(grep -E '^TRAEFIK_NETWORK=' "$ENV_FILE" | cut -d= -f2-)"
TRAEFIK_NETWORK="${TRAEFIK_NETWORK:-traefik}"
docker network inspect "$TRAEFIK_NETWORK" >/dev/null 2>&1 \
  || fail "Le réseau Docker '$TRAEFIK_NETWORK' est introuvable — Traefik tourne-t-il sur ce serveur ? (docker network ls)"

COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

# Vérifie que l'interpolation aboutit (domaines, mots de passe obligatoires).
"${COMPOSE[@]}" config >/dev/null || fail "Configuration Compose invalide (variables manquantes ?)."

# ------------------------------ Mise à jour ---------------------------------
if [ "$DO_GIT" = true ] && [ -d .git ]; then
  log "Récupération de la dernière version (git pull)"
  git pull --ff-only
fi

if [ "$DO_PULL" = true ]; then
  grep -qE '^API_IMAGE=' "$ENV_FILE" && grep -qE '^WEB_IMAGE=' "$ENV_FILE" \
    || fail "--pull exige API_IMAGE et WEB_IMAGE dans $ENV_FILE (cf. docs/DEPLOIEMENT-VPS.md §7)."
  log "Récupération des images depuis le registre"
  "${COMPOSE[@]}" pull
else
  log "Construction des images (api + web)"
  "${COMPOSE[@]}" build
fi

# ------------------------------ Démarrage -----------------------------------
# Les migrations TypeORM sont jouées par le service `migrate` avant l'API.
log "Démarrage de la pile"
"${COMPOSE[@]}" up -d --remove-orphans

if [ "$DO_SEED" = true ]; then
  log "Exécution des seeds (rôles, permissions, catalogue, admin bootstrap)"
  "${COMPOSE[@]}" run --rm --no-deps \
    -e NODE_ENV=production \
    migrate node dist/database/seeds/run-seed.js
fi

# ------------------------------ Nettoyage -----------------------------------
# Pas de `docker image prune` ici : le VPS héberge d'autres piles, et la purge
# est globale au démon. À lancer manuellement, en connaissance de cause.

# ------------------------------ Rapport -------------------------------------
log "État des services"
"${COMPOSE[@]}" ps

WEB_DOMAIN="$(grep -E '^WEB_DOMAIN=' "$ENV_FILE" | cut -d= -f2-)"
API_DOMAIN="$(grep -E '^API_DOMAIN=' "$ENV_FILE" | cut -d= -f2-)"

echo
log "Déploiement terminé"
echo "    Front  : https://${WEB_DOMAIN}"
echo "    API    : https://${API_DOMAIN}/api/v1"
echo "    Santé  : https://${API_DOMAIN}/api/v1/health"
echo
echo "    Logs   : docker compose --env-file $ENV_FILE -f $COMPOSE_FILE logs -f api web"
