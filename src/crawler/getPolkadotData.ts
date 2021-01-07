import { ApiPromise, WsProvider } from '@polkadot/api';
import { config } from 'dotenv';
import Storage from '../storage'
import { IAsMulti_MultiSigWallet, IApproveAsMulti_MultiSigWallet, ICancelAsMulti_MultiSigWallet } from '../storage';

config();
const NETWORK_WEBSOCKET = process.env.NETWORK_WEBSOCKET || 'wss://cc1-1.polkadot.network/';
const provider = new WsProvider(NETWORK_WEBSOCKET);
import { blake2AsHex } from '@polkadot/util-crypto';

export async function runCrawlers() {
    const storage = new Storage();

    const api = await ApiPromise.create({
        provider
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
            let eventType; // Better readiblity of the returned data
            let tempMultiSigRecord = allEventRecords.filter((ex) => {
                switch (ex.event.method) {
                    case 'NewMultisig':
                        eventType = 'NewMultisig';
                        return ex.event.section == 'multisig' && ex.event.data[2] as unknown as string == singleEx.method.args[3].toHuman()?.toString()
                    case 'MultisigApproval':
                        addressIndex = 2;
                        eventType = 'MultisigApproval';
                        return ex.event.section == 'multisig' && ex.event.data[3] as unknown as string == singleEx.method.args[3].toHuman()?.toString()
                    default:
                        return false;
                }
            });

            if (tempMultiSigRecord.length != 0) {
                let multisigDBRecord: IApproveAsMulti_MultiSigWallet = {
                    address: tempMultiSigRecord[0].event.data[addressIndex].toHuman()?.toString()!,
                    signature: singleEx.signature.toHuman()?.toString()!,
                    signer: singleEx.signer.toHuman()?.toString()!,
                    signitories: (singleEx.method.args[1] as any).map((signitory) => {
                        return String(signitory.toHuman())
                    }),
                    method: singleEx.method.method,
                    eventType,
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
            singleEx.events.map((singleEvent) => {
                if (singleEvent.section == 'multisig') {
                    // let hash = blake2AsHex(singleEx.extrinsic.method.args[3].toHuman()?.toString()!);
                    let multisigDBRecord: IAsMulti_MultiSigWallet = {
                        address: singleEvent.method == 'MultisigExecuted' ? singleEvent.data[2].toHuman()?.toString()! : singleEvent.data[1].toHuman()?.toString()!,
                        signature: singleEx.extrinsic.signature.toHuman()?.toString()!,
                        signer: singleEx.extrinsic.signer.toHuman()?.toString()!,
                        signitories: (singleEx.extrinsic.method.args[1] as any).map((signitory) => {
                            return String(signitory.toHuman())
                        }),
                        method: singleEx.extrinsic.method.method,
                        eventType: singleEvent.method == 'MultisigExecuted' ? 'MultisigExecuted' : 'NewMultisig',
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
            let eventType; // Better readiblity of the returned data
            let tempMultiSigRecord = allEventRecords.filter((ex) => {
                switch (ex.event.method) {
                    case 'MultisigCancelled':
                        eventType = 'MultisigCancelled';
                        return ex.event.section == 'multisig' && ex.event.data[3] as unknown as string == singleEx.method.args[3].toHuman()?.toString()
                    default:
                        return false
                }
            });
            if (tempMultiSigRecord.length != 0) {
                let multisigDBRecord: ICancelAsMulti_MultiSigWallet = {
                    address: tempMultiSigRecord[0].event.data[2].toHuman()?.toString()!,
                    signature: singleEx.signature.toHuman()?.toString()!,
                    signer: singleEx.signer.toHuman()?.toString()!,
                    signitories: (singleEx.method.args[1] as any).map((signitory) => {
                        return String(signitory.toHuman())
                    }),
                    method: singleEx.method.method,
                    eventType,
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