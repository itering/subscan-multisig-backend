import { ApiPromise, WsProvider } from '@polkadot/api';
const provider = new WsProvider("wss://rpc.polkadot.io");

export async function runCrawlers() {

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

        // Approve As Multi
        let approveAsMulti = signedBlock.block.extrinsics.filter((ex) => {
            return ex.method.section == 'multisig' && ex.method.method == 'approveAsMulti'
        });
        approveAsMulti && approveAsMulti.map((singleEx) => {
            console.log('Threshold = ', singleEx.method.args[0].toHuman());
            console.log('Method = ', singleEx.method.method);
            console.log('other_signatories : ', (singleEx.method.args[1] as any).map((signitory) => {
                return signitory.toHuman()
            }));
            console.log('maybe_timepoint = ', singleEx.method.args[2].toHuman());
            console.log('call_hash = ', singleEx.method.args[3].toHuman());
            console.log('max_weight = ', singleEx.method.args[4].toHuman());
            console.log('signature ', singleEx.signature.toHuman());
            console.log('signer ', singleEx.signer.toHuman());
            console.log('tip ', singleEx.tip.toHuman());
        });

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