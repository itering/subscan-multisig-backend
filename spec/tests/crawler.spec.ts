import monk from 'monk'
import { config } from 'dotenv'
import { processBlock } from 'src/crawler/getPolkadotData'
import { ApiPromise, WsProvider } from '@polkadot/api'

import { ENDPOINTS_MAP } from 'src/types/networks'

config()

describe('Crawlers', () => {
  let instance: any
  let storage: any
  let api: any
  let chain: string

  beforeAll(async () => {
    instance = monk(String(process.env.MONGODB_URI))
    const crab = ENDPOINTS_MAP.crab
    api = await ApiPromise.create({
      provider: new WsProvider(crab.wss),
      types: crab.types,
    })

    chain = String(await api.rpc.system.chain()).replace(/\s/g, '')
  }, 50000)

  beforeEach(() => {
    storage = instance.get('crawler_test')
  })

  afterEach(() => {
    storage.drop()
  })

  it('should work correctly when process a executed multisig', async () => {
    let multisig = await storage.findOne({
      when: '3643058-2',
      multisig_address: '5Hb3obCBk9Jy7fWhPrTQJzbtx9Pnfv2QpwHYsWSHHXxCSKxA',
      call_hash: '0xfe775adab2d7fd9012b8d8384aa63cbb89bcf391c588095f4bca2f839503b639'
    })
    expect(multisig).toBeNull()

    // NewMultisig
    await processBlock(chain, api, storage, 3643058)
    multisig = await storage.findOne({
      when: '3643058-2',
      multisig_address: '5Hb3obCBk9Jy7fWhPrTQJzbtx9Pnfv2QpwHYsWSHHXxCSKxA',
      call_hash: '0xfe775adab2d7fd9012b8d8384aa63cbb89bcf391c588095f4bca2f839503b639'
    })
    delete multisig._id
    expect(multisig).toEqual(
      {
        multisig_address: '5Hb3obCBk9Jy7fWhPrTQJzbtx9Pnfv2QpwHYsWSHHXxCSKxA',
        call_hash: '0xfe775adab2d7fd9012b8d8384aa63cbb89bcf391c588095f4bca2f839503b639',
        chain: 'DarwiniaCrab',
        call_data: null,
        depositor: '5EkEjCvvGmLtZsebfrqM3oq7yP3cYWmYF1dRPTTUcuuYS9zA',
        approvals: [ '5EkEjCvvGmLtZsebfrqM3oq7yP3cYWmYF1dRPTTUcuuYS9zA' ],
        status: 'approving',
        when: '3643058-2'
      }
    )

    // MultisigApproval
    await processBlock(chain, api, storage, 3643062)
    multisig = await storage.findOne({
      when: '3643058-2',
      multisig_address: '5Hb3obCBk9Jy7fWhPrTQJzbtx9Pnfv2QpwHYsWSHHXxCSKxA',
      call_hash: '0xfe775adab2d7fd9012b8d8384aa63cbb89bcf391c588095f4bca2f839503b639'
    })
    expect(multisig.approvals).toEqual(
      [
        '5EkEjCvvGmLtZsebfrqM3oq7yP3cYWmYF1dRPTTUcuuYS9zA',
        '5H8w4eSJ4oXedZjwNHmUfy3vVckHWzx7Z7v8rzQD4rrJMBu2' 
      ]
    )
    expect(multisig.status).toEqual('approving')

    // MultisigExecuted
    await processBlock(chain, api, storage, 3643065)
    multisig = await storage.findOne({
      when: '3643058-2',
      multisig_address: '5Hb3obCBk9Jy7fWhPrTQJzbtx9Pnfv2QpwHYsWSHHXxCSKxA',
      call_hash: '0xfe775adab2d7fd9012b8d8384aa63cbb89bcf391c588095f4bca2f839503b639'
    })
    expect(multisig.approvals).toEqual(
      [
        '5EkEjCvvGmLtZsebfrqM3oq7yP3cYWmYF1dRPTTUcuuYS9zA',
        '5H8w4eSJ4oXedZjwNHmUfy3vVckHWzx7Z7v8rzQD4rrJMBu2',
        '5F1TfEbDcroBCH2yWVYKNVGNhJBGvAZ27njRCMApnFHfUkrS'
      ]
    )
    expect(multisig.status).toEqual('executed')
    expect(multisig.call_data).toEqual('0x17037e52d3310c6a233d1dd10dac7e1b8ce3236d2bf7c38ca36ccc1c9876f141525c02286bee')
  }, 60000)

  it('should work correctly when process a cancelled multisig', async () => {
    let multisig = await storage.findOne({
      when: '3699990-1',
      multisig_address: '5DZjFWVkTPrrt1SSiSLqU8e882HxWuC4cwPpyvWG3LYCE9UK',
      call_hash: '0xe081d92e55f3843d5f055dbcc4a15a4264bb79d63a2cb2f08fb5b5cce3a2d8b8'
    })
    expect(multisig).toBeNull()

    // NewMultisig
    await processBlock(chain, api, storage, 3699990)
    multisig = await storage.findOne({
      when: '3699990-1',
      multisig_address: '5DZjFWVkTPrrt1SSiSLqU8e882HxWuC4cwPpyvWG3LYCE9UK',
      call_hash: '0xe081d92e55f3843d5f055dbcc4a15a4264bb79d63a2cb2f08fb5b5cce3a2d8b8'
    })
    delete multisig._id
    expect(multisig).toEqual(
      {
        multisig_address: '5DZjFWVkTPrrt1SSiSLqU8e882HxWuC4cwPpyvWG3LYCE9UK',
        call_hash: '0xe081d92e55f3843d5f055dbcc4a15a4264bb79d63a2cb2f08fb5b5cce3a2d8b8',
        chain: 'DarwiniaCrab',
        call_data: '0x17030f998334b356975fd97dc3ae89e3a7ebb2f0b2961d7808a5433aabbff546ac7202286bee',
        depositor: '5DHZb2DQb5M7yMraRdfy4f9hvT5qBnsnBWdYFJgzFfuoxC4L',
        approvals: [ '5DHZb2DQb5M7yMraRdfy4f9hvT5qBnsnBWdYFJgzFfuoxC4L' ],
        status: 'approving',
        when: '3699990-1'
      }
    )

    // MultisigApproval
    await processBlock(chain, api, storage, 3700003)
    multisig = await storage.findOne({
      when: '3699990-1',
      multisig_address: '5DZjFWVkTPrrt1SSiSLqU8e882HxWuC4cwPpyvWG3LYCE9UK',
      call_hash: '0xe081d92e55f3843d5f055dbcc4a15a4264bb79d63a2cb2f08fb5b5cce3a2d8b8'
    })
    expect(multisig.approvals).toEqual(
      [
        '5DHZb2DQb5M7yMraRdfy4f9hvT5qBnsnBWdYFJgzFfuoxC4L',
        '5CRABHds6HQdJnsZUAL8pJbJpGQkDCbxYHH7T9fsHi4pSuHh' 
      ]
    )
    expect(multisig.status).toEqual('approving')

    // MultisigCancelled
    await processBlock(chain, api, storage, 3700021)
    multisig = await storage.findOne({
      when: '3699990-1',
      multisig_address: '5DZjFWVkTPrrt1SSiSLqU8e882HxWuC4cwPpyvWG3LYCE9UK',
      call_hash: '0xe081d92e55f3843d5f055dbcc4a15a4264bb79d63a2cb2f08fb5b5cce3a2d8b8'
    })
    expect(multisig.approvals).toEqual(
      [
        '5DHZb2DQb5M7yMraRdfy4f9hvT5qBnsnBWdYFJgzFfuoxC4L',
        '5CRABHds6HQdJnsZUAL8pJbJpGQkDCbxYHH7T9fsHi4pSuHh' 
      ]
    )
    expect(multisig.status).toEqual('cancelled')
  }, 60000)
})
