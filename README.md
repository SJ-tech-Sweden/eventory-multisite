[![Netlify Status](https://api.netlify.com/api/v1/badges/220acd99-3fa3-4cc8-b99e-b455b28868bb/deploy-status)](https://app.netlify.com/sites/eventory-multisite/deploys)

# Eventory multisite (eventory-multisite)

A project to view multiple eventory oganisations at once

Under Login manager you can add your logins from the different organisations. Calendar is a calendar view that combines the job from all your logins so that you can view them from one place. Inventory is where you can see all inventory items and how many there are in stock at any time.

From the calendar you can now add rentals to a existing packlist, if it comes from the sam organisation as the packlist it will just be added as a rental but if it comes from another organisation it will be added as a external subrental.

One deployed version exists at [eventory.sj-tech.se](https://eventory.sj-tech.se)

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
