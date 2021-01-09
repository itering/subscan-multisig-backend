import { ApiPromise, WsProvider } from '@polkadot/api';
import { blake2AsHex } from '@polkadot/util-crypto';
import { config } from 'dotenv';
import Storage from '../storage'
import { IAsMulti_MultiSigWallet, IApproveAsMulti_MultiSigWallet, ICancelAsMulti_MultiSigWallet } from '../storage';
import { ENDPOINTS_MAP } from '../types/networks'
config();
const NETWORK = process.env.NETWORK || 'polkadot';
const provider = new WsProvider(ENDPOINTS_MAP[NETWORK].wss);

export async function runCrawlers() {
    const storage = new Storage();

    const api = await ApiPromise.create({
        provider,
        types: ENDPOINTS_MAP[NETWORK].types
    });

    const [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version()
    ]);

    console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

    await api.rpc.chain.subscribeFinalizedHeads(async (header) => {
        console.log(`${chain} is at block: #${header.number}`);

        const blockHash = await api.rpc.chain.getBlockHash(header.number as unknown as number);
        const signedBlock = await api.rpc.chain.getBlock(blockHash);
        console.log(`Block Number is ${header.number}`)
        const allEventRecords = await api.query.system.events.at(signedBlock.block.header.hash);

        // Approve As Multi
        let approveAsMulti = signedBlock.block.extrinsics.filter((ex) => {
            return ex.method.section == 'multisig' && ex.method.method == 'approveAsMulti'
        });

        approveAsMulti && approveAsMulti.map(async (singleEx) => {
            let addressIndex = 1; // To handle address present on different index in data returned
            // let eventType;
            let status; // Better readiblity of the returned data
            let tempMultiSigRecord = allEventRecords.filter((ex) => {
                switch (ex.event.method) {
                    case 'NewMultisig':
                        // eventType = 'NewMultisig';
                        status = 'created';
                        return ex.event.section == 'multisig' && ex.event.data[2] as unknown as string == singleEx.method.args[3].toHuman()?.toString()
                    case 'MultisigApproval':
                        // eventType = 'MultisigApproval';
                        status = 'approving';
                        addressIndex = 2;
                        return ex.event.section == 'multisig' && ex.event.data[3] as unknown as string == singleEx.method.args[3].toHuman()?.toString()
                    default:
                        return false;
                }
            });
            if (tempMultiSigRecord.length != 0) {
                let query = {
                    $and: [
                        { "item.address": tempMultiSigRecord[0].event.data[addressIndex].toHuman()?.toString()! },
                        { "item.callHash": singleEx.method.args[3].toHuman()?.toString()! },
                    ],
                };
                let approving = tempMultiSigRecord[0].event.data[0].toHuman()?.toString()!;
                let result = await storage.query(query) as Array<any>;
                if (result.length > 0) { await storage._db.update(query, { $set: { "item.status": status, "item.approving": approving } }); return; }

                let multisigDBRecord: IApproveAsMulti_MultiSigWallet = {
                    address: tempMultiSigRecord[0].event.data[addressIndex].toHuman()?.toString()!,
                    signature: singleEx.signature.toHuman()?.toString()!,
                    signer: singleEx.signer.toHuman()?.toString()!,
                    signitories: (singleEx.method.args[1] as any).map((signitory) => {
                        return String(signitory.toHuman())
                    }),
                    method: singleEx.method.method,
                    // eventType,
                    status: status,
                    approving,
                    callHash: singleEx.method.args[3].toHuman()?.toString()!,
                    maxWeight: singleEx.method.args[4].toHuman()?.toString()!,
                    threshold: singleEx.method.args[0].toHuman()?.toString()!,
                    tip: singleEx.tip.toHuman()?.toString()!,
                    maybeTimePoint: singleEx.method.args[2].toHuman()
                };
                console.log('Saving in DB: ', multisigDBRecord)
                storage.saveApproveAsMulti_NewMultisig(multisigDBRecord);
            }
            else {
                console.log('No NewMultisig method found in the event')
            }
        });

        // As Multi
        const asMultiBlock = await api.derive.chain.getBlock(blockHash);
        let asMulti = asMultiBlock?.extrinsics.filter((ex) => {
            return ex.extrinsic.method.section == 'multisig' && ex.extrinsic.method.method == 'asMulti';
        });
        asMulti && asMulti.map(async (singleEx) => {
            singleEx.events.map(async (singleEvent) => {
                if (singleEvent.section == 'multisig') {
                    let addressIndex = 1;
                    // let eventType;
                    let status;
                    switch (singleEvent.method) {
                        case 'NewMultisig':
                            // eventType = 'NewMultisig';
                            status = 'created';
                            break;
                        case 'MultisigExecuted':
                            // eventType = 'MultisigExecuted';
                            status = 'executed';
                            addressIndex = 2;
                            break;
                    }
                    let query = {
                        $and: [
                            { "item.address": singleEvent.data[addressIndex].toHuman()?.toString()! },
                            { "item.callHash": blake2AsHex(singleEx.extrinsic.method.args[3].toHuman()?.toString()!) },
                        ],
                    };

                    let approving = singleEvent.data[0].toHuman()?.toString()!;
                    let result = await storage.query(query) as Array<any>;
                    if (result.length > 0) { await storage._db.update(query, { $set: { "item.status": status, "item.approving": approving } }); return; }

                    let multisigDBRecord: IAsMulti_MultiSigWallet = {
                        address: singleEvent.data[addressIndex].toHuman()?.toString()!,
                        signature: singleEx.extrinsic.signature.toHuman()?.toString()!,
                        signer: singleEx.extrinsic.signer.toHuman()?.toString()!,
                        signitories: (singleEx.extrinsic.method.args[1] as any).map((signitory) => {
                            return String(signitory.toHuman())
                        }),
                        method: singleEx.extrinsic.method.method,
                        // eventType,
                        status,
                        approving,
                        callHash: blake2AsHex(singleEx.extrinsic.method.args[3].toHuman()?.toString()!),
                        callData: singleEx.extrinsic.method.args[3].toHuman()?.toString()!,
                        threshold: singleEx.extrinsic.method.args[0].toHuman()?.toString()!,
                        tip: singleEx.extrinsic.tip.toHuman()?.toString()!,
                        maybeTimepoint: singleEx.extrinsic.method.args[2].toHuman(),
                        maxWeight: singleEx.extrinsic.method.args[5].toHuman()
                    };
                    console.log('Saving in DB: ', multisigDBRecord)
                    storage.saveAsMulti_NewMultisig_MultisigExecuted(multisigDBRecord);
                }
            })
        });

        // Cancel As Multi
        let cancelAsMulti = signedBlock.block.extrinsics.filter((ex) => {
            return ex.method.section == 'multisig' && ex.method.method == 'cancelAsMulti'
        });
        cancelAsMulti && cancelAsMulti.map(async (singleEx) => {
            // let eventType; // Better readiblity of the returned data
            let status;
            let tempMultiSigRecord = allEventRecords.filter((ex) => {
                switch (ex.event.method) {
                    case 'MultisigCancelled':
                        status = 'cancelled';
                        // eventType = 'MultisigCancelled';
                        return ex.event.section == 'multisig' && ex.event.data[3] as unknown as string == singleEx.method.args[3].toHuman()?.toString()
                    default:
                        return false
                }
            });
            let query = {
                $and: [
                    { "item.address": tempMultiSigRecord[0].event.data[2].toHuman()?.toString()! },
                    { "item.callHash": singleEx.method.args[3].toHuman()?.toString()! },
                ],
            };
            let cancelling = tempMultiSigRecord[0].event.data[0].toHuman()?.toString()!;
            let result = await storage.query(query) as Array<any>;
            if (result.length > 0) { await storage._db.update(query, { $set: { "item.status": status, "item.cancelling": cancelling } }); return; }

            if (tempMultiSigRecord.length != 0) {
                let multisigDBRecord: ICancelAsMulti_MultiSigWallet = {
                    address: tempMultiSigRecord[0].event.data[2].toHuman()?.toString()!,
                    signature: singleEx.signature.toHuman()?.toString()!,
                    signer: singleEx.signer.toHuman()?.toString()!,
                    signitories: (singleEx.method.args[1] as any).map((signitory) => {
                        return String(signitory.toHuman())
                    }),
                    method: singleEx.method.method,
                    // eventType,
                    status,
                    cancelling,
                    callHash: singleEx.method.args[3].toHuman()?.toString()!,
                    threshold: singleEx.method.args[0].toHuman()?.toString()!,
                    tip: singleEx.tip.toHuman()?.toString()!,
                    timepoint: singleEx.method.args[2].toHuman()
                };
                console.log('Saving in DB: ', multisigDBRecord)
                storage.saveCancelAsMulti_MultisigCancelled(multisigDBRecord);
            }
            else {
                console.log('No cancelAsMulti method found in the event')
            }
        });

        //NOTE: Not supporting the call asMultiThreshol1 for now
    });
}