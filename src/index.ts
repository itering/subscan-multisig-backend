import './LoadEnv'; // Must be the first import
import app from './Server';
import logger from './shared/Logger';
import { WsProvider } from '@polkadot/api';
import { runCrawlers } from './crawler/getPolkadotData';
import { ENDPOINTS_MAP } from '../src/types/networks';
import Storage from '../src/storage'


const polkadot = ENDPOINTS_MAP['polkadot']
const darwinia = ENDPOINTS_MAP['darwinia']
const kusama = ENDPOINTS_MAP['kusama']
const crab = ENDPOINTS_MAP['crab']

const storage = new Storage();

// Start Crawlers here
runCrawlers((new WsProvider(polkadot.wss)), polkadot.types, storage);
runCrawlers((new WsProvider(darwinia.wss)), darwinia.types, storage);
runCrawlers((new WsProvider(kusama.wss)), kusama.types, storage);
runCrawlers((new WsProvider(crab.wss)), crab.types, storage);

// Start the server
const port = Number(process.env.PORT || 9000);
app.listen(port, () => {
    logger.info('Express server started on port: ' + port);
});
