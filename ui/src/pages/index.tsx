import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import GradientBG from "../components/GradientBG.js";
import styles from "../styles/Home.module.css";
import { Field, Mina, PrivateKey, PublicKey, fetchAccount } from "snarkyjs";
import ZkappWorkerClient from "./zkappWorkerClient";
//import { Propose } from "../../../contracts/build/src/Propose.js";

const USER1 = PublicKey.fromBase58(
  "B62qkUHaJUHERZuCHQhXCQ8xsGBqyYSgjQsKnKN5HhSJecakuJ4pYyk"
);
const USER2 = PublicKey.fromBase58(
  "B62qoeik6jNZapnxHeYaF4sJMEq6LccCJ6cscm2ZoHNmX5UcQREF7H3"
);
const USER3 = PublicKey.fromBase58(
  "B62qmnZga2fbt5mf9hrMDctjxBXzzQs3UztCn3ecgzhiDUff7JEwFF3"
);

export const ZK_APP_ADDRESS =
  "B62qpHJ1XKAJFuubmiMXeTzSGGViDnQtmJ8cvJMRWh6Z2VAiRQfGPZK";

//let PROPOSER : Propose;

let transactionFee = 0.1;

export default function Home() {
  let [state, setState] = useState({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    hasBeenSetup: false,
    accountExists: false,
    // currentNum: null as null | Field,
    publicKey: null as null | PublicKey,
    zkappPublicKey: null as null | PublicKey,
    creatingTransaction: false,
  });

  useEffect(() => {
    (async () => {
      if (!state.hasBeenSetup) {
        const zkappWorkerClient = new ZkappWorkerClient();

        console.log("Loading SnarkyJS...");
        //await zkappWorkerClient.loadSnarkyJS();
        console.log("done");

        //await zkappWorkerClient.setActiveInstanceToBerkeley();

        const mina = (window as any).mina;

        if (mina == null) {
          setState({ ...state, hasWallet: false });
          return;
        }

        const publicKeyBase58: string = (await mina.requestAccounts())[0];
        const publicKey = PublicKey.fromBase58(publicKeyBase58);

        console.log("using key", publicKey.toBase58());

        console.log("checking if account exists...");
        /*   const res = await zkappWorkerClient.fetchAccount({
          publicKey: publicKey!,
        }); */
        const res = await fetchAccount({ publicKey });
        console.log("got fetch");
        const accountExists = res.error == null;

        console.log("checked");

        //await zkappWorkerClient.loadContract();

        console.log("compiling zkApp");
        //await zkappWorkerClient.compileContract();
        console.log("zkApp compiled");

        const zkappPublicKey = PublicKey.fromBase58(ZK_APP_ADDRESS);

        console.log("ffs");

        //await zkappWorkerClient.initZkappInstance(zkappPublicKey);

        console.log("getting zkApp state...");
        //await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey });
        //const currentNum = await zkappWorkerClient.getNum();
        //console.log('current state:', currentNum.toString());
        console.log("setting client", zkappWorkerClient);
        setState({
          ...state,
          zkappWorkerClient,
          hasWallet: true,
          hasBeenSetup: true,
          publicKey,
          zkappPublicKey,
          accountExists,
          //   currentNum
        });
      }
    })();
  }, []);

  // -------------------------------------------------------
  // Wait for account to exist, if it didn't

  useEffect(() => {
    (async () => {
      if (state.hasBeenSetup && !state.accountExists) {
        for (;;) {
          console.log("checking if account exists...");
          const res = await state.zkappWorkerClient!.fetchAccount({
            publicKey: state.publicKey!,
          });
          console.log("account result", res);
          const accountExists = res.error == null;
          if (accountExists) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        setState({ ...state, accountExists: true });
      }
    })();
  }, [state.hasBeenSetup]);

  // useEffect(() => {
  //   (async () => {
  //     const { Mina, PublicKey } = await import("snarkyjs");
  //     const { Propose } = await import("../../../contracts/build/src/");

  //     console.log("START");
  //     // Update this to use the address (public key) for your zkApp account.
  //     // To try it out, you can try this address for an example "Add" smart contract that we've deployed to
  //     // Berkeley Testnet B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA.

  //     // This should be removed once the zkAppAddress is updated.
  //     if (!ZK_APP_ADDRESS) {
  //       console.error(
  //         'The following error is caused because the zkAppAddress has an empty string as the public key. Update the zkAppAddress with the public key for your zkApp account, or try this address for an example "Add" smart contract that we deployed to Berkeley Testnet: B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA'
  //       );
  //     }

  //     //console.log("Addr,", zkApp.address.toBase58());

  //     // await zkappWorkerClient.setActiveInstanceToBerkeley();

  //     //const zkApp = new Propose(publicKey);

  //     // const res = await zkappWorkerClient.fetchAccount({
  //     //   publicKey: publicKey!
  //     // });
  //     // const accountExists = res.error == null;
  //     // TODO
  //   })();
  // }, []);

  //const [a, setA] = useState()

  const clickA = async () => {
    setState({ ...state, creatingTransaction: true });
    console.log("sending a transaction...");

    await state.zkappWorkerClient!.fetchAccount({
      publicKey: state.publicKey!,
    });

    await state.zkappWorkerClient!.createWishTransaction(
      PrivateKey.random(),
      USER1
    );

    console.log("creating proof...");
    await state.zkappWorkerClient!.proveWishTransaction();

    console.log("getting Transaction JSON...");
    const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON();

    console.log("requesting send transaction...");
    const { hash } = await (window as any).mina.sendTransaction({
      transaction: transactionJSON,
      feePayer: {
        fee: transactionFee,
        memo: "",
      },
    });

    console.log(
      "See transaction at https://berkeley.minaexplorer.com/transaction/" + hash
    );

    setState({ ...state, creatingTransaction: false });
  };

  return (
    <>
      <Head>
        <title>Mina zkApp UI</title>
        <meta name="description" content="built with SnarkyJS" />
        <link rel="icon" href="/assets/favicon.ico" />
      </Head>
      <GradientBG>
        <main className={styles.main}>
          <h1>Foxy company</h1>
          <div>
            <img src="/assets/fox1.jpg" width="300"></img>&nbsp;&nbsp;
            <img src="/assets/fox2.jpg" width="300"></img>&nbsp;&nbsp;
            <img src="/assets/fox3.jpg" width="300"></img>
            <br />
            <div>
              <div>Fox 1 address: {USER1.toBase58()}</div>
              <div>Fox 2 address: {USER2.toBase58()}</div>
              <div>Fox 3 address: {USER3.toBase58()}</div>
            </div>
          </div>
          <div>
            <span>Address to hook up with:</span>&nbsp;&nbsp;
            <input type="text"></input>&nbsp;&nbsp;
            <button
              onClick={() => {
                clickA();
                return false;
              }}
            >
              Hook up!
            </button>
          </div>
          <div>&nbsp;</div>
          <div>&nbsp;</div>
          <div>
            More details at{" "}
            <a href="https://github.com/microbecode/mina_devdao_hackathon">
              GitHub
            </a>
            .
          </div>
        </main>
      </GradientBG>
    </>
  );
}
