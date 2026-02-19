[![Netlify Status](https://api.netlify.com/api/v1/badges/220acd99-3fa3-4cc8-b99e-b455b28868bb/deploy-status)](https://app.netlify.com/sites/eventory-multisite/deploys)

# Eventory multisite (eventory-multisite)

A project to view multiple eventory oganisations at once

Under Login manager you can add your logins from the different organisations. Calendar is a calendar view that combines the job from all your logins so that you can view them from one place. Inventory is where you can see all inventory items and how many there are in stock at any time.

From the calendar you can now add rentals to a existing packlist, if it comes from the sam organisation as the packlist it will just be added as a rental but if it comes from another organisation it will be added as a external subrental.

Warehouse Checkin lets you check in any checked out item from any job no matter which of your organisation it belongs to. Warehouse Checkout is the opposite to that and let you checkout any job that belongs to any of you organisations. In the checkout you can change the default timerange of what jobs you want to view.

One deployed version exists at [eventory.sj-tech.se](https://eventory.sj-tech.se)

## Optional FastAPI backend

The app ships with an optional Python/FastAPI backend (see [`backend/`](./backend/README.md))
that adds:

- **User management** – register/login with a username and password.
- **Server-side credential storage** – Eventory organisation logins are stored
  per user in a database instead of browser `localStorage`.
- **Eventory proxy** – the backend can forward requests to the Eventory API to
  simplify CORS handling.

The frontend detects whether a backend URL has been configured (via
**Backend Settings** in the side menu) and automatically switches between
browser-only mode and backend mode. **The site works perfectly without the
backend.**

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
