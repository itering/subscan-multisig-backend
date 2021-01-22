import Storage from '../../src/storage';
import { multisig_calls } from '../../src/storage';


describe('Storage', () => {
  let instance: Storage;
  let fakeFilename: string;
  let fakeAutoload: boolean;
  let fakepayload: multisig_calls;

  function createInstance() {
    instance = new Storage(
      fakeFilename,
      fakeAutoload,
    );
  }

  beforeEach(() => {
    fakeFilename = 'spec/tests/fakeStorage.db';
    fakeAutoload = true;

    createInstance();
  });

  it('should create', () => {
    expect(instance).toBeTruthy();
  });
  it('should create', async () => {
    fakepayload = {
      multisig_address: "5Hb3obCBk9Jy7fWhPrTQJzbtx9Pnfv2QpwHYsWSHHXxCSKxA",
      call_hash: "0xb5cc308efdc7305c77f7e4164a8ec4f84d4c62231036ac1655f64c516b1e0caa",
      call_data: "0x17037e52d3310c6a233d1dd10dac7e1b8ce3236d2bf7c38ca36ccc1c9876f141525c0700f2052a01",
      status: "approving",
      approvals: [
        "5F1TfEbDcroBCH2yWVYKNVGNhJBGvAZ27njRCMApnFHfUkrS",
        "5H8w4eSJ4oXedZjwNHmUfy3vVckHWzx7Z7v8rzQD4rrJMBu2"
      ],
      depositor: "5F1TfEbDcroBCH2yWVYKNVGNhJBGvAZ27njRCMApnFHfUkrS",
      deposit: "",
      when: {
        "height": "3,519,383",
        "index": "2"
      },
      chain: 'Darwinia Crab'
    }
    instance.saveMultiSigCalls(fakepayload);
    expect(fakepayload).toBeTruthy((await instance.query({ "item.multisig_address": "5Hb3obCBk9Jy7fWhPrTQJzbtx9Pnfv2QpwHYsWSHHXxCSKxA" }) as Array<any>)[0]?.item);
  });

});
