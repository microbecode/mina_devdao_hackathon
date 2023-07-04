import { Mina, isReady, PublicKey, fetchAccount, PrivateKey } from "snarkyjs";

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------

import { Propose } from "../../../contracts/build/src/Propose";
import { ZK_APP_ADDRESS } from ".";

const state = {
  Propose: null as null | typeof Propose,
  zkapp: null as null | Propose,
  transaction: null as null | Transaction,
};

// ---------------------------------------------------------------------------------------

const functions = {
  loadSnarkyJS: async (args: {}) => {
    //await isReady;
  },
  setActiveInstanceToBerkeley: async (args: {}) => {
    const Berkeley = Mina.Network(
      "https://proxy.berkeley.minaexplorer.com/graphql"
    );
    console.log("setting");
    Mina.setActiveInstance(Berkeley);
    console.log("set");
  },
  loadContract: async (args: {}) => {
    const { Propose } = await import("../../../contracts/build/src/Propose");
    state.Propose = Propose;
  },
  compileContract: async (args: {}) => {
    await state.Propose!.compile();
  },
  fetchAccount: async (args: { publicKey58: string }) => {
    console.log("in worker fetch");
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    const zkappPublicKey = PublicKey.fromBase58(ZK_APP_ADDRESS);
    state.zkapp = new Propose(zkappPublicKey);

    console.log("calling snarky fetch");

    return await fetchAccount({ publicKey });
  },
  initZkappInstance: async (args: { publicKey58: string }) => {
    console.log("start");
    const publicKey = PublicKey.fromBase58(args.publicKey58);
    console.log("second");
    //    state.zkapp = new state.Propose!(publicKey);
    state.zkapp = new Propose(publicKey);
  },
  // getNum: async (args: {}) => {
  //   const currentNum = await state.zkapp!.num.get();
  //   return JSON.stringify(currentNum.toJSON());
  // },
  createWishTransaction: async (args: {
    privateKey: PrivateKey;
    target: PublicKey;
  }) => {
    const transaction = await Mina.transaction(() => {
      state.zkapp!.wish(args.privateKey, args.target);
    });
    state.transaction = transaction;
  },
  proveWishTransaction: async (args: {}) => {
    await state.transaction!.prove();
  },
  getTransactionJSON: async (args: {}) => {
    return state.transaction!.toJSON();
  },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
  id: number;
  fn: WorkerFunctions;
  args: any;
};

export type ZkappWorkerReponse = {
  id: number;
  data: any;
};
if (process.browser) {
  addEventListener(
    "message",
    async (event: MessageEvent<ZkappWorkerRequest>) => {
      const returnData = await functions[event.data.fn](event.data.args);

      const message: ZkappWorkerReponse = {
        id: event.data.id,
        data: returnData,
      };
      postMessage(message);
    }
  );
}
