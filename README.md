# SSM · Frontend

Frontend del **Sistema de Seguimiento de Mejora (SSM)** de la FES Acatlán, UNAM. Proyecto de Algorix.

- **Stack:** Next.js (App Router), React y TypeScript. Usa CSS propio con los tokens del Design System de Figma. No tiene más dependencias.
- **Backend:** [`ssm-backend`](https://github.com/AntonioChYngon/ssm-backend). Está hecho con NestJS, TypeORM y MariaDB.
- **Diseño:** https://www.figma.com/design/yjeMb9h1VCWejHPEk4RYqK

> **Equipo:** la guía de trabajo (reparto de historias, ramas, pruebas y CI) está en [`ssm-backend/CONTRIBUTING.md`](https://github.com/AntonioChYngon/ssm-backend/blob/main/CONTRIBUTING.md). Los contratos de cada historia están al final de `src/lib/types.ts` y `src/lib/api.ts`.

## Arranque

```bash
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run build
```

Mientras `NEXT_PUBLIC_USE_MOCKS=true`, la app usa los datos de `src/lib/mock-data.ts` y funciona sin backend.

Para entrar en modo demostración:
- Con `maria.gonzalez@acatlan.unam.mx` entras como **Administradora**.
- Con cualquier otro correo `@acatlan.unam.mx` entras como **Capturista**.

## Estructura

```
src/
  app/
    (publico)/          login, recuperar, aviso-privacidad
    admin/              dashboard, usuarios, planes/[id], informes/[id],
                        reportes/incumplimiento, reportes/atencion,
                        historico, transversales, bitacora
    licenciatura/       dashboard, plan, metas, evidencias, observaciones
    perfil/
  components/
    ui/                 Icon, Button, Field, Display, Interactive, Charts
    layout/             AppShell (header + sidebar), NotificationPanel, PublicLayout
  lib/
    types.ts            contrato de datos compartido con ssm-backend
    api.ts              cliente HTTP; cada función indica su endpoint
    mock-data.ts        datos de ejemplo de Figma
    nav.ts              menú por rol (Administrador / Capturista / Auxiliar)
```

## Pantallas e historias de usuario

| Pantalla | Ruta | HU |
|---|---|---|
| 01 Login | `/login` | HU-01 |
| 02 Recuperación de contraseña | `/recuperar` | HU-02 |
| 03 Aviso de privacidad | `/aviso-privacidad` | RNF Privacidad |
| 04 Dashboard global | `/admin/dashboard` | HU-13 |
| 05 Gestión de usuarios | `/admin/usuarios` | HU-02 |
| 06 Lista de planes | `/admin/planes` | HU-05 |
| 07 Validación de plan (y su modal) | `/admin/planes/[id]` | HU-05 |
| 08 Lista de informes | `/admin/informes` | HU-08 |
| 09 Validación de informe (visor PDF) | `/admin/informes/[id]` | HU-08 |
| 10 Reporte de incumplimiento | `/admin/reportes/incumplimiento` | HU-15 |
| 11 Resumen de atención | `/admin/reportes/atencion` | HU-14 |
| 12 Histórico por ciclo | `/admin/historico` | HU-16 |
| 13 Recomendaciones transversales | `/admin/transversales` | HU-17 |
| 14 Bitácora de auditoría | `/admin/bitacora` | HU-03 |
| 15 Dashboard de licenciatura | `/licenciatura/dashboard` | HU-13 |
| 16 Captura de plan | `/licenciatura/plan` | HU-04 |
| 17 Configuración de metas | `/licenciatura/metas` | HU-12 |
| 18 Carga de evidencias | `/licenciatura/evidencias` | HU-07 |
| 19 Consulta de observaciones | `/licenciatura/observaciones` | HU-05 / HU-08 |
| 20 Perfil | `/perfil` | HU-01 |
| 21 Centro de notificaciones | panel desde la campana | HU-10, HU-11 |

## Conectar con el backend

1. Levanta `ssm-backend`. Por defecto escucha en `http://localhost:3001/api`.
2. En `.env.local`, pon `NEXT_PUBLIC_USE_MOCKS=false`.
3. Las funciones de `src/lib/api.ts` ya apuntan a los endpoints del backend. Pendiente: reemplazar en cada página la lectura directa de `mock-data` por la función de `api.ts` correspondiente.
4. El perfil del header (`AppShell`) todavía es fijo por sección. Debe leerse de `GET /auth/me`.

## Reglas de UI

Son las mismas del diseño:
- Texto base de 16 px.
- Controles de al menos 44 px de alto.
- Contraste AA.
- Mensajes de error en lenguaje claro.
- Breadcrumbs en las pantallas profundas.
- Confirmación antes de Validar o Devolver.

## Despliegue con Podman

```bash
podman build -t ssm-frontend -f Containerfile .
podman run -p 3000:3000 --env-file .env.local ssm-frontend
```
