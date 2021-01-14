import Storage from '../../src/storage';

describe('Storage', () => {
  let instance: Storage;
  let fakeFilename: string;
  let fakeAutoload: boolean;

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

});
