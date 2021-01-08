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
    address: string,
    signature: string,
    signer: string,
    signitories: string[],
    method: string,
    // eventType: string,
    status: string,
    callHash: string,
    maxWeight: string,
    threshold: string,
    tip: string,
    maybeTimePoint: any
}

export interface ICancelAsMulti_MultiSigWallet {
    address: string,
    signature: string,
    signer: string,
    signitories: string[],
    method: string,
    // eventType: string,
    status: string,
    callHash: string,
    threshold: string,
    tip: string,
    timepoint?: any
}

export interface IAsMulti_MultiSigWallet {
    address: string,
    signature: string,
    signer: string,
    signitories: string[],
    method: string,
    // eventType: string,
    status: string,
    callHash: string,
    callData: string,
    threshold: string,
    tip: string,
    maybeTimepoint: any,
    maxWeight: any
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
            status: _wallet.status,
            // eventType: _wallet.eventType,
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
            status: _wallet.status,
            // eventType: _wallet.eventType,
            callHash: _wallet.callHash,
            threshold: _wallet.threshold,
            tip: _wallet.tip,
            timepoint: _wallet.timepoint
        });
        return true;
    }

    async saveAsMulti_NewMultisig_MultisigExecuted(_wallet: IAsMulti_MultiSigWallet) {
        await this._insert({
            address: _wallet.address,
            signature: _wallet.signature,
            signer: _wallet.signer,
            signitories: _wallet.signitories,
            method: _wallet.method,
            status: _wallet.status,
            // eventType: _wallet.eventType,
            callHash: _wallet.callHash,
            threshold: _wallet.threshold,
            tip: _wallet.tip,
            maybeTimepoint: _wallet.maybeTimepoint,
            maxWeight: _wallet.maxWeight
        });
        return true;
    }

    async query(query: any) {
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
