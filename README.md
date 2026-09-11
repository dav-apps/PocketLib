# PocketLib

PocketLib is a simple and modern ebook reader.

📖 Read any epub file\
Add any local epub file to your library. PocketLib automatically saves your reading progress, so you can go directly to the last page you read when you open the app.

📚 Discover a wide range of literature\
The PocketLib Store contains a large collection of literature in the public domain, carefully selected and produced for the true book lover. Just log in to get free access to all these books.

☁ Save your data and read on any device\
Log in with your dav Account to save your library and reading progress in the cloud. Read on any device, wherever and whenever you want.

<img src="https://dav-misc.fra1.cdn.digitaloceanspaces.com/PocketLibScreenshot.png" alt="PocketLib Screenshot" width="320" />

## Getting started
You can find PocketLib on [pocketlib.app](https://pocketlib.app/)

### Local development

Use the Node.js version in `.nvmrc` (`nvm install && nvm use`). Angular 22
requires Node.js 22.22.3+, 24.15.0+, or 26+ within the supported release lines.
Set `FONTAWESOME_NPM_AUTH_TOKEN` for access to the private Font Awesome packages,
then run:

```sh
npm ci
npm run dev
```

Run `npm test` for the regression tests and `npm run build` for the production
browser and SSR bundles. `npm start` serves the production build on port 3001
(override with `PORT`).

SSR accepts `pocketlib.app`, `www.pocketlib.app`, and local loopback hosts by
default. For staging or other deployment domains, set `NG_ALLOWED_HOSTS` to a
comma-separated list of allowed hostnames (without schemes or ports). This
replaces the default list.

<a href='https://pocketlib.app/' target="_blank"><img src='https://dav-misc.fra1.cdn.digitaloceanspaces.com/PWA-white-en.svg' height="48" /></a>

## Contributing

We are currently not accepting any contributions, but if you have any feature requests or ideas for how to improve the app, you can always create an issue.

## Licensing

The code in this project is licensed under MIT license.
