import { Add } from './Add';
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Bool,
} from 'snarkyjs';

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

let proofsEnabled = false;

describe('Add', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    senderAccount: PublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Add;

  beforeAll(async () => {
    if (proofsEnabled) await Add.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Add(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('generates and deploys the `Add` smart contract', async () => {
    await localDeploy();
  });

  it('Set proposal data correctly', async () => {
    await localDeploy();

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.wish(deployerKey, senderAccount);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    const proposer = zkApp.proposer.get();
    const proposed = zkApp.proposerChoice.get();

    expect(proposer).toEqual(deployerAccount);
    expect(proposed).toEqual(senderAccount);
  });

  it('Accept proposal works', async () => {
    await localDeploy();

    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.wish(deployerKey, senderAccount);
    });
    await txn.prove();
    await txn.sign([deployerKey]).send();

    const txn2 = await Mina.transaction(senderAccount, () => {
      zkApp.tryAccept(senderKey);
    });
    await txn2.prove();
    await txn2.sign([senderKey]).send();

    const matched = zkApp.matched.get();

    expect(matched).toEqual(Bool(true));
  });
});
