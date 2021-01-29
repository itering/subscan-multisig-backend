/* eslint-disable eqeqeq */
import { ApiPromise } from '@polkadot/api'
import { config } from 'dotenv'
import { multisig_calls } from '../interfaces/multisigCalls'
config()

export async function runCrawlers (provider, types, storage) {
  const api = await ApiPromise.create({
    provider,
    types,
  })

  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ])

  console.log(
    `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
  )

  await api.rpc.chain.subscribeNewHeads(async (header) => {
    console.log(`${chain} is at block: #${header.number}`)

    const chain_name = String(chain).replace(/\s/g, '')
    processBlock(chain_name, api, storage, header.number)
  })
}

async function processBlock(chain, api, storage, blockNumber) {
  const blockHash = await api.rpc.chain.getBlockHash(
    (blockNumber as unknown) as number
  )

  const blockData = await api.derive.chain.getBlock(blockHash)

  blockData?.extrinsics.forEach(async (rawEx, i) => {
    if(rawEx.extrinsic.method.section == 'multisig') {
      const exTimepoint = `${blockNumber}-${i}`
      const ex = rawEx.extrinsic.toHuman().method
      const events = rawEx.events

      if(ex.section == 'multisig') {
        events.forEach(async (event) => {
          if(event.section == 'multisig') {
            await onEvent(chain, storage, ex, exTimepoint, event.toHuman())
          }
        })
      }
    }
  })
}

async function onEvent(chain, storage, ex, exTimepoint, event) {
  console.log(`ex: ${exTimepoint}, event: ${event.method}`)
  if(event.method == 'NewMultisig') {
    await onNewMultisig(chain, storage, ex, exTimepoint, event.data)
  } else if(event.method == 'MultisigApproval') {
    await onMultisigApproval(chain, storage, ex, exTimepoint, event.data)
  } else if(event.method == 'MultisigExecuted') {
    await onMultisigExecuted(chain, storage, ex, exTimepoint, event.data)
  } else if(event.method == 'MultisigCancelled') {
    await onMultisigCancelled(chain, storage, ex, exTimepoint, event.data)
  }  else {
    console.error(`Unsupported multisig event: ${event.method}`)
  }
}

// data: approving, multisig, call_hash
async function onNewMultisig(chain, storage, ex, exTimepoint, data) {
  const approving = data[0]
  const multisig_address = data[1]
  const callHash = data[2]

  // find the multisig from db
  const not_exists = await storage.findOne({
    when: exTimepoint,
    multisig_address: multisig_address,
    call_hash: callHash
  }) == null

  if(not_exists) {
    // create a new multisig call
    const multisig: multisig_calls = {} as multisig_calls
    multisig.multisig_address = multisig_address
    multisig.call_hash = callHash
    multisig.chain = chain
    multisig.call_data = ex.method == 'asMulti' ? ex.args[3] : null
    multisig.depositor = approving
    multisig.approvals = [approving]
    multisig.status = 'approving'
    multisig.when = exTimepoint

    // insert into db
    await storage.insert(multisig)
  }
}

// data: approving, timepoint, multisig, call_hash
async function onMultisigApproval(chain, storage, ex, exTimepoint, data) {
  const approving = data[0]
  const timepoint = buildTimepoint(data[1])
  const multisig_address = data[2]
  const callHash = data[3]

  // find the multisig from db
  const multisig = await storage.findOne({
    when: timepoint,
    multisig_address: multisig_address,
    call_hash: callHash
  })

  // if not exists, it should be in previous unscribed block, so skip it
  if(multisig != null) {
    // update the multisig
    multisig.approvals.push(approving)
    await storage.update({
      when: timepoint,
      multisig_address: multisig_address,
      call_hash: callHash
    },{
      $set: {
        approvals: multisig.approvals,
        call_data: multisig.call_data || (ex.method == 'asMulti' ? ex.args[3] : null)
      }
    })
  }
}

// data: approving, timepoint, multisig, call_hash
async function onMultisigExecuted(chain, storage, ex, exTimepoint, data) {
  const approving = data[0]
  const timepoint = buildTimepoint(data[1])
  const multisig_address = data[2]
  const callHash = data[3]

  // find the multisig from db
  const multisig = await storage.findOne({
    when: timepoint,
    multisig_address: multisig_address,
    call_hash: callHash
  })

  // if not exists, it should be in previous unscribed block, so skip it
  if(multisig != null) {
    // update the multisig
    multisig.approvals.push(approving)
    await storage.update({
      when: timepoint,
      multisig_address: multisig_address,
      call_hash: callHash
    },{
      $set: {
        approvals: multisig.approvals,
        call_data: multisig.call_data || (ex.method == 'asMulti' ? ex.args[3] : null),
        status: 'executed'
      }
    })
  }
}

// data: cancelling, timepoint, multisig, call_hash
async function onMultisigCancelled(chain, storage, ex, exTimepoint, data) {
  const _cancelling = data[0]
  const timepoint = buildTimepoint(data[1])
  const multisig_address = data[2]
  const callHash = data[3]

  // update the multisig. what will happen if not exists?
  await storage.update({
    when: timepoint,
    multisig_address: multisig_address,
    call_hash: callHash
  },{
    $set: {
      status: 'cancelled'
    }
  })
}

function buildTimepoint(data) {
  return `${parseInt(data.height.replace(/,/g, ''))}-${parseInt(data.index.replace(/,/g, ''))}`
}
