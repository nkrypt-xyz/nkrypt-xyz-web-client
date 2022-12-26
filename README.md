# nkrypt-xyz-web-client

User deployable browser client for nkrypt.xyz community edition.

## To run locally (dockerized)

1. Make sure you have docker installed.
2. Make a copy of the `.env` file in the same directory called `.env.local` and update the `VITE_DEFAULT_SERVER_URL` value to your web-server's address. (optional)
3. Run `npm run docker-dev`.
4. Browse to http://localhost:3000/

## To run (directly on development machine, with livereload)

1. Have nodejs 16 (LTS) or newer installed.
2. Then run `npm i`
3. Make a copy of the `.env` file in the same directory called `.env.local` and update the `VITE_DEFAULT_SERVER_URL` value to your web-server's address. (optional)
4. Run `npm run dev`.
5. Browse to http://localhost:3000/

## Author and License

License: [GNU General Public License v3.0](LICENSE)

2022 © [Sayem Shafayet](https://ishafayet.me)
