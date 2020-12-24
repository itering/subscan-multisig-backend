import Datastore from 'nedb';
import crypto from 'crypto';
import { config } from 'dotenv';

config();

const SECOND = 1000;
const MIN = 60 * SECOND;
const HOUR = 60 * MIN
const DAY = 24 * HOUR;

const CompactionTimeout = 10 * SECOND;

const limitUnit = eval(String(process.env.LIMIT_UNIT)) || DAY;

const now = () => new Date().getTime();
const sha256 = (x: any) =>
    crypto
        .createHash('sha256')
        .update(x, 'utf8')
        .digest('hex');

class Storage {
    _db: Datastore<any>;
    constructor(filename = './storage.db', autoload = true) {
        this._db = new Datastore({ filename, autoload });
    }

    async close() {
        this._db.persistence.compactDatafile();

        return new Promise<void>((resolve, reject) => {
            this._db.on('compaction.done', () => {
                this._db.removeAllListeners('compaction.done');
                resolve();
            });

            setTimeout(() => {
                resolve();
            }, CompactionTimeout);
        });
    }

    async isValid(sender: any, address: any, chain: any, limit = 2, span = limitUnit) { // defaults to 2 per day limit
        sender = sha256(sender);
        address = sha256(address);
        chain = sha256(chain);

        const totalUsername: any = await this._query(sender, address, chain, span);
        if (totalUsername < limit) {
            return true;
        }

        return false;
    }

    async saveData(_sender: any, _address: any, _chain: any) {
        _sender = sha256(_sender);
        _address = sha256(_address);
        _chain = sha256(_chain);

        await this._insert({ sender: _sender, address: _address, chain: _chain });
        return true;
    }

    async _insert(item: any) {
        const timestamp = now();

        return new Promise<void>((resolve, reject) => {
            this._db.insert({ item, timestamp }, (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    async _query(sender: any, address: any, chain: any, span: number) {
        const timestamp = now();
        const item = { sender, address, chain }
        const query = {
            $and: [
                { item },
                { timestamp: { $gt: timestamp - span } },
            ],
        };

        return new Promise((resolve, reject) => {
            this._db.find(query, (err: any, docs: string | any[]) => {
                if (err) reject();
                resolve(docs.length);
            });
        });
    }
}

export default Storage;
