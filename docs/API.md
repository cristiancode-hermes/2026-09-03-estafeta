# API — Estafeta

Prefijo `/api`. Auth JWT `identifier` (username o email).

Checkout 409: `ALREADY_IN_BAG`, `BAG_FULL`, `SALIDA_CLOSED`, `NO_PAPER`, `ROUTE_CLOSED`.

Públicos: `GET /api/shipments/by-code/:code`, `GET /api/arrivals/by-code/:code`.

Staff: `POST /api/staff/scan` `{ codeOrUrl, action: drop|dispatch|pickup }`.
