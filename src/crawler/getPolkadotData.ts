import { ApiPromise, WsProvider } from '@polkadot/api';
const provider = new WsProvider("wss://cc1-1.polkadot.network/");
import Storage from '../storage'
import { MultiSigWallet } from '../storage'

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
            let tempMultiSigRecord = allEventRecords.filter((ex) => {
                // TODO: TO be done later when catering for other methods in the multisig module
                switch (ex.event.method) {
                    case 'NewMultisig':
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

            if (tempMultiSigRecord.length != 0) {
                let multisigDBRecord: MultiSigWallet = {
                    address: tempMultiSigRecord[0].event.data[1].toHuman()?.toString(),
                    signature: singleEx.signature.toHuman()?.toString(),
                    signer: singleEx.signer.toHuman()?.toString(),
                    signitories: (singleEx.method.args[1] as any).map((signitory) => {
                        return String(signitory.toHuman())
                    }),
                    method: singleEx.method.method,
                    callHash: singleEx.method.args[3].toHuman()?.toString(),
                    maxWeight: singleEx.method.args[4].toHuman()?.toString(),
                    threshold: singleEx.method.args[0].toHuman()?.toString(),
                    tip: singleEx.tip.toHuman()?.toString(),
                    maybeTimePoint: singleEx.method.args[2].toHuman()
                };
                // console.log(multisigDBRecord)
                storage.saveApproveAsMulti_NewMultisig(multisigDBRecord);
                console.log(await storage.queryApproveAsMulti_NewMultisig(multisigDBRecord.address))
            }
            else {
                console.log('No NewMultisig method found in the event')
            }
        });











        // This is still work in progress please the ignore a horrible number of console.logs 🙏

        // As Multi
        let asMulti = signedBlock.block.extrinsics.filter((ex) => {
            return ex.method.section == 'multisig' && ex.method.method == 'asMulti'
        });
        asMulti && asMulti.map((singleEx) => {
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
        cancelAsMulti && cancelAsMulti.map((singleEx) => {
            console.log(singleEx.toHuman())
            console.log('Threshold = ', singleEx.method.args[0].toHuman())
            console.log('Method = ', singleEx.method.method)
            console.log('other_signatories : ', (singleEx.method.args[1] as any).map((signitory) => {
                return signitory.toHuman()
            }));
            console.log('maybe_timepoint = ', singleEx.method.args[2].toHuman())
            console.log('call_hash = ', singleEx.method.args[3].toHuman())
            console.log('signature ', singleEx.signature.toHuman());
            console.log('signer ', singleEx.signer.toHuman());
            console.log('tip ', singleEx.tip.toHuman());
        });

        // As Multi Threshold
        let asMultiThreshold1 = signedBlock.block.extrinsics.filter((ex) => {
            return ex.method.section == 'multisig' && ex.method.method == 'asMultiThreshold1'
        });
        asMultiThreshold1 && asMultiThreshold1.map((singleEx) => {
            console.log('Method = ', singleEx.method.method)
            console.log('other_signatories : ', (singleEx.method.args[1] as any).map((signitory) => {
                return signitory.toHuman()
            }));
            console.log('call = ', JSON.stringify(singleEx.method.args[1]))
            console.log('signature ', singleEx.signature.toHuman());
            console.log('signer ', singleEx.signer.toHuman());
            console.log('tip ', singleEx.tip.toHuman());
        });
    });
}

// runCrawler().catch(console.error);