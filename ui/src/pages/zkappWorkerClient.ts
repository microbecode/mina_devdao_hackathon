import { fetchAccount, PublicKey, PrivateKey, Field } from "snarkyjs";

import type {
  ZkappWorkerRequest,
  ZkappWorkerReponse,
  WorkerFunctions,
} from "./zkappWorker";

export default class ZkappWorkerClient {
  // ---------------------------------------------------------------------------------------

  loadSnarkyJS() {
    return this._call("loadSnarkyJS", {});
  }

  setActiveInstanceToBerkeley() {
    return this._call("setActiveInstanceToBerkeley", {});
  }

  loadContract() {
    return this._call("loadContract", {});
  }

  compileContract() {
    return this._call("compileContract", {});
  }

  fetchAccount({ publicKey }: { publicKey: PublicKey }) {
    const result = this._call("fetchAccount", {
      publicKey58: publicKey.toBase58(),
    });
    console.log("fetched", result);
    return result as ReturnType<typeof fetchAccount>;
    //return result;
  }

  initZkappInstance(publicKey: PublicKey) {
    console.log("zero");
    return this._call("initZkappInstance", {
      publicKey58: publicKey.toBase58(),
    });
  }

  // async getNum(): Promise<Field> {
  //   const result = await this._call("getNum", {});
  //   return Field.fromJSON(JSON.parse(result as string));
  // }

  createWishTransaction(privateKey: PrivateKey, target: PublicKey) {
    return this._call("createWishTransaction", { privateKey, target });
  }

  proveWishTransaction() {
    return this._call("proveWishTransaction", {});
  }

  async getTransactionJSON() {
    const result = await this._call("getTransactionJSON", {});
    return result;
  }

  // ---------------------------------------------------------------------------------------

  worker: Worker;

  promises: {
    [id: number]: { resolve: (res: any) => void; reject: (err: any) => void };
  };

  nextId: number;

  constructor() {
    this.worker = new Worker(new URL("./zkappWorker.ts", import.meta.url));
    this.promises = {};
    this.nextId = 0;

    this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
      this.promises[event.data.id].resolve(event.data.data);
      delete this.promises[event.data.id];
    };
  }

  _call(fn: WorkerFunctions, args: any) {
    return new Promise((resolve, reject) => {
      this.promises[this.nextId] = { resolve, reject };

      const message: ZkappWorkerRequest = {
        id: this.nextId,
        fn,
        args,
      };

      this.worker.postMessage(message);

      this.nextId++;
    });
  }
}
