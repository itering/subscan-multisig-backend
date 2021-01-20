import { ApiPromise, WsProvider } from '@polkadot/api';
import { blake2AsHex } from '@polkadot/util-crypto';
import { config } from 'dotenv';
import { multisig_calls } from '../interfaces/multisigCalls';
config();

export async function runCrawlers(provider, types, storage) {

    const api = await ApiPromise.create({
        provider,
        types
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
        console.log(`Block Number is ${header.number}`)

        const blockData = await api.derive.chain.getBlock(blockHash);
        let filteredData = blockData?.extrinsics.filter((ex) => {
            return ex.extrinsic.method.section == 'multisig';
        });

        filteredData && filteredData.map(async (_datumPair) => {
            _datumPair.events.map(async (event) => {
                if (event.section == 'multisig') {
                    let payload: multisig_calls = {} as multisig_calls;

                    payload.multisig_address = event.method == 'NewMultisig' ? event.data[1].toHuman()?.toString()! : event.data[2].toHuman()?.toString()!;

                    payload.call_hash = _datumPair.extrinsic.method.method == 'asMulti' ? blake2AsHex(_datumPair.extrinsic.method.args[3].toHuman()?.toString()!) : _datumPair.extrinsic.method.args[3].toHuman()?.toString()!; // only as_multi will have actual call_data other calls will only have the call_hash
                    // for final approval we send full call data instead of the hash

                    payload.call_data = _datumPair.extrinsic.method.method == 'asMulti' ? _datumPair.extrinsic.method.args[3].toHuman()?.toString()! : (await storage.find({ "call_hash": _datumPair.extrinsic.method.args[3].toHuman()?.toString()! }) as Array<any>)[0]?.call_data; // We don't get call_data until the final approval call (as_multi), so I think the call_data for other calls would be empty. but in case we had a call_data in DB before from some other final call of as_multi then we'd have its data and we'd add it here.

                    payload.status = event.method == 'NewMultisig' && (_datumPair.extrinsic.method.method == 'approveAsMulti' || _datumPair.extrinsic.method.method == 'asMulti') ? 'created' : event.method == 'MultisigApproval' && _datumPair.extrinsic.method.method == 'approveAsMulti' ? 'approving' : event.method == 'MultisigExecuted' && _datumPair.extrinsic.method.method == 'asMulti' ? 'executed' : event.method == 'MultisigCancelled' && _datumPair.extrinsic.method.method == 'cancelAsMulti' ? 'cancelled' : '';

                    // payload.approvals
                    if (event.method == 'NewMultisig' && (_datumPair.extrinsic.method.method == 'approveAsMulti' || _datumPair.extrinsic.method.method == 'asMulti')) {
                        payload.approvals = [event.data[0].toHuman()?.toString()!];
                    } else {
                        let multisig_addressIndex = 2;
                        let call_hash = _datumPair.extrinsic.method.args[3].toHuman()?.toString()!;
                        if (event.method == 'NewMultisig') { multisig_addressIndex = 1 };
                        if (_datumPair.extrinsic.method.method == 'asMulti') { call_hash = blake2AsHex(call_hash) }

                        let temparray = (await storage.find({
                            $and: [
                                { "multisig_address": event.data[multisig_addressIndex].toHuman()?.toString()! },
                                { "call_hash": call_hash },
                            ],
                        }) as Array<any>)[0]?.approvals;
                        temparray?.push(event.data[0].toHuman()?.toString()!)
                        payload.approvals = temparray;
                    };

                    // depositor
                    if (event.method == 'NewMultisig' && (_datumPair.extrinsic.method.method == 'approveAsMulti' || _datumPair.extrinsic.method.method == 'asMulti')) {
                        payload.depositor = event.data[0].toHuman()?.toString()!;
                    } else {
                        let multisig_addressIndex = 2;
                        let call_hash = _datumPair.extrinsic.method.args[3].toHuman()?.toString()!;
                        if (event.method == 'NewMultisig') { multisig_addressIndex = 1 };
                        if (_datumPair.extrinsic.method.method == 'asMulti') { call_hash = blake2AsHex(call_hash) }

                        payload.depositor = (await storage.find({
                            $and: [
                                { "multisig_address": event.data[multisig_addressIndex].toHuman()?.toString()! },
                                { "call_hash": call_hash },
                            ],
                        }) as Array<any>)[0]?.approvals?.[0]
                    };/*getting depositor from the first element of the approvals array if its not a NewMultisig*/

                    payload.deposit = ''; // Leaving it out for now

                    payload.when = _datumPair.extrinsic.method.args[2].toHuman(); // if this is the first approval, then this will be `None`
                    payload.chain = String(chain).replace(/\s/g, "");
                    console.log('Saving in DB: ', payload)
                    storage.insert(payload)
                }
            })
        })
    });
}
