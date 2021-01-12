import Datastore from 'nedb';
import crypto from 'crypto';
import { config } from 'dotenv';


config();

const SECOND = 1000;
const MIN = 60 * SECOND;
const HOUR = 60 * MIN
const DAY = 24 * HOUR;

const CompactionTimeout = 10 * SECOND;

export interface multisig_calls {
    multisig_address: string,
    call_hash: string,
    call_data: string,
    status: string,
    approvals: string[],
    depositor: string,
    deposit: string,
    when: string,
}

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

    async saveMultiSigCalls(_wallet: multisig_calls) {
        await this._insert({
            multisig_address: _wallet.multisig_address,
            call_hash: _wallet.call_hash,
            call_data: _wallet.call_data,
            status: _wallet.status,
            approvals: _wallet.approvals,
            depositor: _wallet.depositor,
            deposit: _wallet.deposit,
            when: _wallet.when,
        });
        return true;
    }

    async query(multisig_address: any) {
        const query = { "item.multisig_address": multisig_address };

        return new Promise((resolve, reject) => {
            this._db.find(query, (err: any, docs: string | any[]) => {
                if (err) reject();
                resolve(docs);
            })?.sort({ "created_at": -1 }); // sort from newest to oldest
        });
    }

    async _insert(item: any) {
        const created_at = now();
        return new Promise<void>((resolve, reject) => {
            this._db.insert({ item, created_at }, (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    async _query(sender: any, address: any, chain: any, span: number) {
        const created_at = now();
        const item = { sender, address, chain }
        const query = {
            $and: [
                { item },
                { created_at: { $gt: created_at - span } },
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
