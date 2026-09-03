# QA Report — 2026-09-03 Estafeta

**Project:** Correo de barrio — saca fechada con cupo, cobro atómico y QR de pliego  
**Stack:** Angular 22 (zoneless) + NestJS 11 + TypeORM/better-sqlite3 + pnpm  
**Author:** Hermes Daily Builder  
**Slug / port:** `estafeta` · **3083**  
**QR real:** sí · url `/envio/:code` (paquete `qrcode`, payload `WEB_ORIGIN` + `/envio/:code`)

## ✅ 1. Build Verification

| Target | Status | Details |
|--------|--------|---------|
| API `tsc --incremental false` | PASS | `apps/api/dist/main.js` |
| Web `ng build` production | PASS | `apps/web/dist/web/browser/index.html`, `baseHref=/` |
| pnpm workspace | PASS | lock + `.npmrc` shamefully-hoist |

## ✅ 2. Test Results

17/17 Jest (`apps/api/src/estafeta.spec.ts`) — ALL PASSED

Cubre: login email/username, `min(priceCents)`, remaining lista↔detalle, checkout+QR URL, ALREADY_IN_BAG, BAG_FULL, SALIDA_CLOSED, NO_PAPER, GET público, puntos derivados de `dispatched`, scan duplicado, sweeper, stats 14d, líneas=totalCents.

## ✅ 3. Binary / Runtime Verification

API `http://localhost:3083` · seed demo/staff/admin · Swagger `/api/docs`

Endpoint smoke (script, sin pipes a intérprete): **15/15 curl + 13/13 extra = 28 PASS**

| Check | Result |
|-------|--------|
| GET `/api/health` | 200 |
| GET `/api/routes` `fromPriceCents=250` | 200 |
| remaining lista = detalle | 7=7 |
| login/register 201 `accessToken` | PASS |
| `/api/auth/me` 200 / sin token 401 | PASS |
| staff 200 / customer 403 | PASS |
| QR SVG contiene URL absoluta `/envio/X5F4W26J` | PASS |
| totalCents lista = líneas = público | 330 |
| POST checkout 409 ALREADY_IN_BAG humano | PASS |
| stats 14 puntos con `date`+`value` | PASS |

Browser Puppeteer (Chrome for Testing): 19 rutas 200, 0 errores de consola, 0 overflow 1280 y 390px. Login split **640px 640px**, inputs vacíos, demo cliente **y** `staff@estafeta.dev · demo1234`. Submit → `/` + `estafeta.jwt`. Rutas dinámicas `/rutas/:id`, `/salidas/:id`, `/envio/:code`, `/llegada/:code`, `/mis-envios/:code` con contenido (no blanco). QR real visible. Chart staff con ejes, fechas Madrid y tooltips.

## ✅ 4. Quality Audit

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Capa de verdad | PASS | envio-cupo: cupo saca + cobro atómico + estados + puntos `dispatched` |
| Sin hold TTL | PASS | checkout atómico; `pickupExpiresAt` servidor + sweeper 30s |
| QR real | PASS | `qrcode` SVG + URL absoluta; GET público 200 |
| `desde` = min(priceCents) | PASS | 2,50 € de rutas abiertas; cero literales `money(N)` |
| Caption SVG | PASS | figcaption HTML; SVGs sin `<text>` recortable |
| Login split 50/50 | PASS | auth ANTES del `**`; `/entrar` alias |
| contraste-hover | PASS | `a:hover:not(.btn)`; primary hover fija `on-primary`; AA light 11.53 / dark 6.32 |
| Totales lista↔detalle | PASS | |
| Empty/error pantalla | PASS | checkout sin saca = título+CTA |
| 409 junto al CTA | PASS | `#pay-action` + `humanizeApiError` |
| Auth username o email | PASS | |
| pnpm only | PASS | |

### Minor Issues

| Issue | Severity | Suggestion |
|-------|----------|------------|
| Eje Y del gráfico con max=1 pinta 1,1,1,0 | menor | ticks únicos cuando max es pequeño |

## ✅ 5. Security Scan

| Check | Result |
|-------|--------|
| JWT Bearer interceptor | PASS (`'Bearer ' + token`) |
| TOKEN_KEY | `estafeta.jwt` (añadido a prod-capture) |
| APP_GUARD global | ausente (correcto) |
| ValidationPipe whitelist | PASS |
| Staff/Admin + JwtAuthGuard | PASS |
| .env no commiteado | PASS |

## ✅ 6. Deployment

| Target | Result | Details |
|--------|--------|---------|
| Caddy | DONE | `estafeta.proyectos.cristiancode.dev` → dist + `/api*` :3083 |
| manage-apis.sh | DONE | 3083 / estafeta / 2026-09-03-estafeta ALIGNED 68 |
| GitHub | DONE | https://github.com/cristiancode-hermes/2026-09-03-estafeta (README 200) |
| Landing | DONE | `name:'estafeta'` live en proyectos.cristiancode.dev |
| Excel | DONE | fila 100 |
| Portfolio locales es/en/pt | DONE | slug `estafeta` heading-259 · commit `ea721cc` |
| Capture config | DONE | tokenField accessToken, loginField identifier, `estafeta.jwt` |
| href / link2 / link3 | 200 / 200 / 200 | |
| Assets `/assets/estafeta.png` | 200 | `-m` 200 |

## Summary

**OVERALL: PASS ✅**

Decision Record: `QR real: sí | url: /envio/:code`  
isFinalDesign: DESIGN_FREE (proyecto nuevo)
