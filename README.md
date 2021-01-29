# Subscan Multi Signature Wallet - Backend

This project serves as backend for Subscan Multi Signature Wallet you can find the frontend [here](https://github.com/itering/subscan-multisig-ui), which can be used to work with MultiSig Wallets

## Getting Started

Clone this repo ```git clone https://github.com/nblogist/subscan-multisig-backend.git```

### Installing

To successfully run the backend locally:

Set MONGODB_URI in env:

```
export MONGODB_URI=mongodb://<host>:<port>/multisig
```

Install dependencies using ```yarn```

```
yarn
```

Run the app in the development mode

```
yarn start:dev
```
If subscribed multisigs, Open `http://localhost:9000/calls?chain=<name>&multisig_address=<address>`  to view result in the browser.

Chain name: `Polkadot`, `Kusama`, `Darwinia`, `DarwiniaCrab`...

To build the app for production:
```
yarn build
```

Builds the app for production to the `./dist` folder.
It correctly bundles the app in production mode and optimizes the build for the best performance.
The build is minified and the filenames include the hashes.
The app is now ready to be deployed!

### Docker

1. ```sudo docker build -t subscan-multisig-backend/node:latest .```
2. ```sudo docker run -p 9000:9000 subscan-multisig-backend/node:latest```

## Built With

* [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript at Any Scale.
* [ExpressJS](https://expressjs.com/) - Fast, unopinionated, minimalist web framework for Node.js
* [MongoDB](https://github.com/mongodb/mongo) - The MongoDB Database
* [Monk](https://github.com/Automattic/monk) - The wise MongoDB API

## Contributing

Please submit pull requests to us using the format described while making a pull request.

## Resource

* [ITERING](https://github.com/itering)

## Authors

* **Furqan Ahmed** - [Contact](https://furqan.me)

See also the list of [contributors](https://github.com/nblogist/subscan-multisig-backend/contributors) who participated in this project.

```

```