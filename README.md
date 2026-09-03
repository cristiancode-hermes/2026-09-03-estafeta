# Estafeta

Correo de barrio (Angular 22 + NestJS). El vecino elige una **saca fechada**, paga al momento y deja el pliego con **QR real**. Staff admite y despacha.

- Demo: `demo@estafeta.dev` / `demo1234`
- Staff: `staff@estafeta.dev` / `demo1234`
- Puerto API: 3083
- Núcleo: envio-cupo (no hueco+hold 15 min)

```bash
export PATH="/opt/data/.local/bin:$PATH"
pnpm install
pnpm --filter ./apps/api run build
pnpm --filter ./apps/web run build
```
