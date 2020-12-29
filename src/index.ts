import './LoadEnv'; // Must be the first import
import app from './Server';
import logger from './shared/Logger';
import { runCrawlers } from '../src/crawler/getPolkadotData';

// Start Crawler here
runCrawlers();

// Start the server
const port = Number(process.env.PORT || 9000);
app.listen(port, () => {
    logger.info('Express server started on port: ' + port);
});
