import Datastore from 'nedb';
import crypto from 'crypto';
import { config } from 'dotenv';


config();

const SECOND = 1000;
const MIN = 60 * SECOND;
const HOUR = 60 * MIN
const DAY = 24 * HOUR;

const CompactionTimeout = 10 * SECOND;

export interface IApproveAsMulti_MultiSigWallet {
    address: string | undefined,
    signature: string | undefined,
    signer: string | undefined,
    signitories: string[],
    method: string,
    eventType: string,
    callHash: string | undefined,
    maxWeight: string | undefined,
    threshold: string | undefined,
    tip: string | undefined,
    maybeTimePoint: any
}

export interface ICancelAsMulti_MultiSigWallet {
    address: string | undefined,
    signature: string | undefined,
    signer: string | undefined,
    signitories: string[],
    method: string,
    eventType: string,
    callHash: string | undefined,
    threshold: string | undefined,
    tip: string | undefined,
    timepoint: any
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

    //NOTE: callName_EventName
    async saveApproveAsMulti_NewMultisig(_wallet: IApproveAsMulti_MultiSigWallet) {
        await this._insert({
            address: _wallet.address,
            signature: _wallet.signature,
            signer: _wallet.signer,
            signitories: _wallet.signitories,
            method: _wallet.method,
            eventType: _wallet.eventType,
            callHash: _wallet.callHash,
            maxWeight: _wallet.maxWeight,
            threshold: _wallet.threshold,
            tip: _wallet.tip,
            maybeTimePoint: _wallet.maybeTimePoint
        });
        return true;
    }

    async saveCancelAsMulti_MultisigCancelled(_wallet: ICancelAsMulti_MultiSigWallet) {
        await this._insert({
            address: _wallet.address,
            signature: _wallet.signature,
            signer: _wallet.signer,
            signitories: _wallet.signitories,
            method: _wallet.method,
            eventType: _wallet.eventType,
            callHash: _wallet.callHash,
            threshold: _wallet.threshold,
            tip: _wallet.tip,
            timepoint: _wallet.timepoint
        });
        return true;
    }

    async query(address: any) {
        const query = { "item.address": address };

        return new Promise((resolve, reject) => {
            this._db.find(query, (err: any, docs: string | any[]) => {
                if (err) reject();
                resolve(docs);
            });
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
