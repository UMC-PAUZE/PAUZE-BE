#!/bin/bash
set -euo pipefail
cd /var/app/staging
npx prisma migrate deploy
