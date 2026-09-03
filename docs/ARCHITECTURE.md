# Architecture — Estafeta

Monorepo pnpm: `apps/api` NestJS 11 + TypeORM (SQLite/Neon) y `apps/web` Angular 22 zoneless.

**Capa de verdad:** cupo de saca (`remainingPliegos`) + cobro atómico en `POST /api/shipments/checkout` (mutex + transacción). Estados `confirmed → dropped → dispatched`. Puntos = COUNT dispatched. Llegadas con `pickupExpiresAt` servidor y sweeper 30s.

QR: paquete `qrcode`, payload `WEB_ORIGIN/envio/:code`.
