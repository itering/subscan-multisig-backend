# Subscan Multi Signature Wallet - Backend

This project serves as backend for Subscan Multi Signature Wallet you can find the frontend [here](https://github.com/itering/subscan-multisig-ui), which can be used to work with MultiSig Wallets

Define the URL websocket for the parachain as environment variables or simply save it in a `.env` file inside the main folder:

``` 
NETWORK_WEBSOCKET= 'wss://cc1-1.polkadot.network/' # For Polkadot
```

## Pre-requisites

TBD

## Getting Started

Clone this repo ```git clone https://github.com/nblogist/subscan-multisig-backend.git```

### Installing

To successfully run the backend:

Install dependencies using ```yarn```

```
yarn
```

Run the app in the development mode

```
yarn start:dev
```
Open [http://localhost:9000](http://localhost:9000) to view it in the browser.

To build the app for production:
```
yarn build
```

Builds the app for production to the `./dist` folder.
It correctly bundles the app in production mode and optimizes the build for the best performance.
The build is minified and the filenames include the hashes.
The app is now ready to be deployed!

## Built With

* [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript at Any Scale.
* [ExpressJS](https://expressjs.com/) - Fast, unopinionated, minimalist web framework for Node.js
* [NeDB](https://github.com/louischatriot/nedb) - A Lightweight JavaScript Database

## Contributing

Please submit pull requests to us using the format described while making a pull request.

## Resource

* [ITERING](https://github.com/itering)

## Authors

* **Furqan Ahmed** - [Contact](https://furqan.me)

See also the list of [contributors](https://github.com/nblogist/subscan-multisig-backend/contributors) who participated in this project.
