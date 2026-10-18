# Despliegue en Azure (rama `deploy`)

Cada push a la rama `deploy` compila el frontend con la URL de la API de Azure y lo publica en Azure Static Web Apps (plan Free) con `.github/workflows/deploy.yml`.

## 1. Static Web App

```bash
az staticwebapp create -g igf115-project -n <nombre-frontend> -l westus2 --sku Free
az staticwebapp secrets list -g igf115-project -n <nombre-frontend> --query properties.apiKey -o tsv
```

Static Web Apps no está disponible en West US 3; `westus2` es la región cercana. El contenido se sirve desde una CDN global, así que la región casi no afecta.

## 2. GitHub

En el repositorio (*Settings → Secrets and variables → Actions*):

| Tipo | Nombre | Valor |
|---|---|---|
| Secret | `AZURE_STATIC_WEB_APPS_API_TOKEN` | token del paso anterior |
| Variable | `API_URL` | `https://<nombre-api>.azurewebsites.net/api` |

En la API, `CORS_ORIGIN` debe ser `https://<nombre-frontend>.azurestaticapps.net` (la URL que muestra el portal).

## Notas

- `src/environments/environment.ts` tiene `__API_URL__`, que el workflow reemplaza al compilar. En local, `ng serve` usa `environment.development.ts` (localhost).
- `public/staticwebapp.config.json` redirige todas las rutas a `index.html`, para que recargar una pantalla como `/estados/balance` no dé 404.
- La aplicación no usa SSR: el build genera solo archivos estáticos.
