// LICENSE: MIT

import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Struct,
  Provable,
  PrivateKey,
  PublicKey,
  Bool,
} from 'snarkyjs';

export class Propose extends SmartContract {
  @state(PublicKey) proposer = State<PublicKey>();
  @state(PublicKey) proposerChoice = State<PublicKey>();
  @state(Bool) matched = State<Bool>();

  init() {
    super.init();

    this.matched.set(Bool(false));
  }

  @method wish(privateKey: PrivateKey, target: PublicKey) {
    //privateKey.toPublicKey().assertEquals(this.proposer.get());

    this.proposer.set(privateKey.toPublicKey());
    this.proposerChoice.set(target);
  }

  @method tryAccept(privateKey: PrivateKey) {
    const choice = this.proposerChoice.get();
    this.proposerChoice.assertEquals(choice);
    privateKey.toPublicKey().assertEquals(choice);

    this.matched.set(Bool(true));
  }
}
