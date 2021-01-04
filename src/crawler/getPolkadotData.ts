import { ApiPromise, WsProvider } from '@polkadot/api';
const provider = new WsProvider("wss://cc1-1.polkadot.network/");
import Storage from '../storage'
import { IApproveAsMulti_MultiSigWallet, ICancelAsMulti_MultiSigWallet } from '../storage'

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
                    address: tempMultiSigRecord[0].event.data[addressIndex].toHuman()?.toString(),
                    signature: singleEx.signature.toHuman()?.toString(),
                    signer: singleEx.signer.toHuman()?.toString(),
                    signitories: (singleEx.method.args[1] as any).map((signitory) => {
                        return String(signitory.toHuman())
                    }),
                    method: singleEx.method.method,
                    eventType,
                    callHash: singleEx.method.args[3].toHuman()?.toString(),
                    maxWeight: singleEx.method.args[4].toHuman()?.toString(),
                    threshold: singleEx.method.args[0].toHuman()?.toString(),
                    tip: singleEx.tip.toHuman()?.toString(),
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
        let asMulti = signedBlock.block.extrinsics.filter((ex) => {
            return ex.method.section == 'multisig' && ex.method.method == 'asMulti'
        });
        asMulti && asMulti.map((singleEx) => {
            let tempMultiSigRecord = allEventRecords.filter((ex) => {
                // TODO: TO be done later when catering for other methods in the multisig module
                switch (ex.event.method) {
                    case 'NewMultisig':
                        console.log(ex.event.data.toHuman())
                        return ex.event.section == 'multisig' && ex.event.data[2] as unknown as string == singleEx.method.args[3].toHuman()?.toString()
                    case 'MultisigExecuted':
                        return false;
                    case 'MultisigCancelled':
                        return false;
                    case 'MultisigApproval':
                        return false;
                    // return ex.event.section == 'multisig' &&  ex.event.data[3] as unknown as string == singleEx.method.args[3].toHuman()?.toString()
                    default:
                        return ex.event.section == 'multisig'
                }
            });
            console.log(tempMultiSigRecord)
            console.log('Method = ', singleEx.method.method);
            console.log('Threshold = ', singleEx.method.args[0].toHuman())
            console.log('other_signatories : ', (singleEx.method.args[1] as any).map((signitory) => {
                return signitory.toHuman()
            }));
            console.log('maybe_timepoint = ', singleEx.method.args[2].toHuman());
            console.log('call = ', JSON.stringify(singleEx.method.args[3])) // Not getting details in call like in subscan including the call_args, call_index etc.
            console.log('store_call = ', singleEx.method.args[4].toHuman());
            console.log('max_weight = ', singleEx.method.args[5].toHuman());
            console.log('signature ', singleEx.signature.toHuman());
            console.log('signer ', singleEx.signer.toHuman());
            console.log('tip ', singleEx.tip.toHuman());
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
                        return ex.event.section == 'multisig' && ex.event.data[3] as unknown as string == singleEx.method.args[3].toHuman()?.toString()
                    default:
                        return false
                }
            });
            if (tempMultiSigRecord.length != 0) {
                let multisigDBRecord: ICancelAsMulti_MultiSigWallet = {
                    address: tempMultiSigRecord[0].event.data[2].toHuman()?.toString(),
                    signature: singleEx.signature.toHuman()?.toString(),
                    signer: singleEx.signer.toHuman()?.toString(),
                    signitories: (singleEx.method.args[1] as any).map((signitory) => {
                        return String(signitory.toHuman())
                    }),
                    method: singleEx.method.method,
                    eventType,
                    callHash: singleEx.method.args[3].toHuman()?.toString(),
                    threshold: singleEx.method.args[0].toHuman()?.toString(),
                    tip: singleEx.tip.toHuman()?.toString(),
                    timepoint: singleEx.method.args[2].toHuman()
                };
                console.log('Saving in DB: ', multisigDBRecord)
                storage.saveCancelAsMulti_MultisigCancelled(multisigDBRecord);
            }
            else {
                console.log('No NewMultisig method found in the event')
            }
        });

        //NOTE: Not supporting the call asMultiThreshol1 for now
        
        // As Multi Threshold
        // let asMultiThreshold1 = signedBlock.block.extrinsics.filter((ex) => {
        //     return ex.method.section == 'multisig' && ex.method.method == 'asMultiThreshold1'
        // });
        // asMultiThreshold1 && asMultiThreshold1.map((singleEx) => {
        //     console.log('Method = ', singleEx.method.method)
        //     console.log('other_signatories : ', (singleEx.method.args[1] as any).map((signitory) => {
        //         return signitory.toHuman()
        //     }));
        //     console.log('call = ', JSON.stringify(singleEx.method.args[1]))
        //     console.log('signature ', singleEx.signature.toHuman());
        //     console.log('signer ', singleEx.signer.toHuman());
        //     console.log('tip ', singleEx.tip.toHuman());
        // });
    });
}
