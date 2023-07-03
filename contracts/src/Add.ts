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

/**
 * Basic Example
 * See https://docs.minaprotocol.com/zkapps for more info.
 *
 * The Add contract initializes the state variable 'num' to be a Field(1) value by default when deployed.
 * When the 'update' method is called, the Add contract adds Field(2) to its 'num' contract state.
 *
 * This file is safe to delete and replace with your own contract.
 */

export class Add extends SmartContract {
  //@state(Field) num = State<Field>();
  //@state(MyArray3) targets = State<MyArray3>();

  /*   @state(PublicKey) user1 = State<PublicKey>();
  @state(PublicKey) user2 = State<PublicKey>();
  @state(PublicKey) user3 = State<PublicKey>(); */
  @state(PublicKey) proposer = State<PublicKey>();
  @state(PublicKey) proposerChoice = State<PublicKey>();
  //@state(PublicKey) chosen = State<PublicKey>();
  @state(Bool) matched = State<Bool>();

  init() {
    super.init();
    //this.num.set(Field(1));
    // let user1 = users['Bob'].toPublicKey();
    // let user2 = users['SuperBob'].toPublicKey();
    // let user3 = users['MegaBob'].toPublicKey();
    // let user4 = users['Jack'].toPublicKey();

    // let arr: MyArray3 = { value: [user1, user2, user3] };
    // this.targets.set(arr);
    // this.proposer.set(user4);
    /*     this.user1.set();
    this.user2.set(users['SuperBob'].toPublicKey());
    this.user3.set(users['MegaBob'].toPublicKey()); */
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
