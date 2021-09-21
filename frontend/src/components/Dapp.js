import React from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import Caretaker from "../contracts/RarityCaretaker.json";
import Rarity from "../contracts/rarity.json";


// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { ApproveForAll } from "./ApproveForAll";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoTokensMessage } from "./NoTokensMessage";

// This is the Hardhat Network id, you might change it in the hardhat.config.js
// Here's a list of network ids https://docs.metamask.io/guide/ethereum-provider.html#properties
// to use when deploying to other networks.

const axios = require('axios');

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;
const FTMSCAN_API = "https://api.ftmscan.com/api";

// Dapp Status Section

// This component is in charge of doing these things:
//   1. It connects to the user's wallet
//   2. Initializes ethers and the Token contract
//   3. Polls the user balance to keep it updated.
//   4. Transfers tokens by sending transactions
//   5. Renders the whole application
//
// Note that (3) and (4) are specific of this sample application, but they show
// you how to keep your Dapp and contract's state in sync,  and how to send a
// transaction.
export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    // We store multiple things in Dapp's state.
    // You don't need to follow this pattern, but it's an useful example.
    this.initialState = {
      // The user's address and balance
      selectedAddress: undefined,
      balance: 0,
      // network configuration
      rarity_address: "0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb",
      caretaker_address: "0x9217727cbd2d3017FE83601006e8Be1fa8D6282F",
      FTMSCAN_API_KEY: undefined,

      // rarity related stuff
      summoners: [],
      approved: [],
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
    };
    this.state = this.initialState;
  }

  render() {
    // Ethereum wallets inject the window.ethereum object. If it hasn't been
    // injected, we instruct the user to install MetaMask.
    if (!this.isMetaMaskInstalled()) {
      return <NoWalletDetected />;
    }

    // The next thing we need to do, is to ask the user to connect their wallet.
    // When the wallet gets connected, we are going to save the users's address
    // in the component's state. So, if it hasn't been saved yet, we have
    // to show the ConnectWallet component.
    //
    // Note that we pass it a callback that is going to be called when the user
    // clicks a button. This callback just calls the _connectWallet method.
    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <p>
              Welcome <b>{this.state.selectedAddress}</b>, you have{" "}
              <b>
                {this.state.balance.toString()}
              </b>
              .
            </p>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-12">
            {/* 
              Sending a transaction isn't an immidiate action. You have to wait
              for it to be mined.
              If we are waiting for one, we show a message here.
            */}
            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}

            {/* 
              Sending a transaction can fail in multiple ways. 
              If that happened, we show a message here.
            */}
            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-12">

            {/*
              This component displays a form that the user can use to send a 
              transaction and transfer some tokens.
              The component doesn't have logic, it just calls the transferTokens
              callback.
            */}
            {(
              <ApproveForAll
                approveCaretaker={(caretaker, tokens) =>
                  this._approveCaretaker(caretaker, tokens)
                }
                doDaily={(tokens) => this._doDaily(tokens)
                }
                tokenIds={this.state.summoners}
                address={this.state.caretaker_address}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  isMetaMaskInstalled() {
    const { ethereum } = window
    return Boolean(ethereum && ethereum.isMetaMask)
  }

  componentWillUnmount() {
    // We poll the user's balance, so we have to stop doing that when Dapp
    // gets unmounted
    this._stopPollingData();
  }

  async _connectWallet() {
    // This method is run when the user clicks the Connect. It connects the
    // dapp to the user's wallet, and initializes it.
    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.
    try {
      const [selectedAddress] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      // First we check the network
      if (!this._checkNetwork()) {
        return;
      }

      // Once we have the address, we can initialize the application.
      this._initialize(selectedAddress);
    } catch (error) {
      console.error(error)
    }

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state 
      if (newAddress === undefined) {
        return this._resetState();
      }

      this._initialize(newAddress);
    });

    // We reset the dapp state if the network is changed
    window.ethereum.on("networkChanged", ([networkId]) => {
      this._stopPollingData();
      this._resetState();
    });
  }

  _initialize(userAddress) {
    // This method initializes the dapp
    // We first store the user's address in the component's state
    this.setState({
      selectedAddress: userAddress
    });

    this._initializeEthers();
    this._getSummoners();
    this._startPollingData();
  }

  // TODO : Repurpose to interact with caretaker contract
  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);
    console.log(this._provider);


    this._rarity = new ethers.Contract(
      this.state.rarity_address,
      Rarity.abi,
      this._provider.getSigner(0)
    );

    this._caretaker = new ethers.Contract(
      this.state.caretaker_address,
      Caretaker.abi,
      this._provider.getSigner(0)
    );

    console.log("initialized ethers caretaker contract at", this._rarity.address);
  }

  // The next two methods are needed to start and stop polling data. While
  // the data being polled here is specific to this example, you can use this
  // pattern to read any data from your contracts.
  //
  // Note that if you don't need it to update in near real time, you probably
  // don't need to poll it. If that's the case, you can just fetch it when you
  // initialize the app, as we do with the token data.
  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._getBalance(), 3000);

    // We run it once immediately so we don't have to wait for it
    this._getBalance();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  // The next two methods just read from the contract and store the results
  // in the component state.

  async _getSummoners() {
    // https://api.ftmscan.com/api?module=account&action=tokennfts&contractaddress=<rarityaddress>&address=ADDRESS&tag=latest&apikey=APIkey
    const address = this.state.selectedAddress;
    const contract = this.state.rarity_address;
    const apikey = this.state.FTMSCAN_API_KEY;
    console.log(address, contract, apikey);

    let response;
    if (apikey !== undefined) {
      response = await axios({
        method: 'get',
        url: `${FTMSCAN_API}?module=account&action=tokennfttx&contractaddress=${contract}&address=${address}&tag=latest&apikey=${apikey}`,
      });
    } else {
      console.log("Rate limited scan");
      response = await axios({
        method: 'get',
        url: `${FTMSCAN_API}?module=account&action=tokennfttx&contractaddress=${contract}&address=${address}&tag=latest`,
      });
    }

    let summoners;
    if (response.data.message.startsWith('OK')) {
      summoners = response.data.result.map(a => a.tokenID);
      console.log(summoners);
    } else {
      summoners = [];
    }
    this.setState({ summoners });
  }

  async _getBalance() {
    try {
      const balance = ethers.utils.formatEther(await this._provider.getBalance(this.state.selectedAddress));
      console.log("Balance", balance);

      this.setState({ balance: balance });
    } catch (e) {
      console.log(e);
    }
  }

  async _approval(id, addr) {
    try {
      const approved = await this._rarity.getApproved(id);
      console.log("Approved", id, approved);

      if (approved !== addr) {
        const txn = await this._rarity.approve(addr, id);
        this.setState({ txBeingSent: txn.hash });
        const receipt = txn.wait();
        // The receipt, contains a status flag, which is 0 to indicate an error.
        if (receipt.status === 0) {
          // We can't know the exact error that made the transaction fail when it
          // was mined, so we throw this generic one.
          throw new Error("Transaction failed");
        }
        const approved = await this._rarity.getApproved(id);
        console.log("Approved", id, approved);
      }
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }
      else if (error.message === 'Internal JSON-RPC error.') {
        // Metamask glitches out too frequently. This reruns the command
        await this._approval(id, addr);
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      // If we leave the try/catch, we aren't sending a tx anymore, so we clear
      // this part of the state.
      this.setState({ txBeingSent: undefined });
    }
  }

  async _get_ready_for_adventure(id) {
    console.log(id);
    const timenow = Math.floor(Date.now() / 1000);
    try {
      const approved = await this._rarity.getApproved(id);
      if (approved === this._caretaker.address) {
        const adventureLog = await this._rarity.adventurers_log(id);
        if (adventureLog <= timenow) {
          console.log("Adding to list");
          return id;
        } else {
          console.log("Already done for today", id);
          return -1;
        }
      } else {
        console.log("Not approved", id);
        return -1;
      }
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return -1;
      } else if (error.message === 'Internal JSON-RPC error.') {
        // Metamask glitches out too frequently. This reruns the command
        return this._get_ready_for_adventure(id);
      }
    }
  }

  async _doDaily(checked_tokens) {
    const tokens = []
    // First get eligible tokens
    for (let i = 0; i < checked_tokens.length; i++) {
      const val = await this._get_ready_for_adventure(checked_tokens[i]);
      console.log(val);
      if (val !== -1) {
        tokens.push(val);
      }

    }
    // Call doAll for eligible tokens
    if (tokens.length > 0) {
      try {
        console.log("Approved and valid", tokens);
        const txn3 = await this._caretaker.doAll(tokens);
        const receipt3 = await txn3.wait();
        console.log(receipt3.events);
      } catch (error) {
        // We check the error code to see if this error was produced because the
        // user rejected a tx. If that's the case, we do nothing.
        if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
          return;
        }
        // Other errors are logged and stored in the Dapp's state. This is used to
        // show them to the user, and for debugging.
        console.error(error);
        this.setState({ transactionError: error });
      } finally {
        // If we leave the try/catch, we aren't sending a tx anymore, so we clear
        // this part of the state.
        this.setState({ txBeingSent: undefined });
      }
    }

  }


  // This method sends an ethereum transaction to transfer tokens.
  // While this action is specific to this application, it illustrates how to
  // send a transaction.
  async _approveCaretaker(addr, tokens) {
    // Sending a transaction is a complex operation:
    //   - The user can reject it
    //   - It can fail before reaching the ethereum network (i.e. if the user
    //     doesn't have ETH for paying for the tx's gas)
    //   - It has to be mined, so it isn't immediately confirmed.
    //     Note that some testing networks, like Hardhat Network, do mine
    //     transactions immediately, but your dapp should be prepared for
    //     other networks.
    //   - It can fail once mined.
    //
    // This method handles all of those things, so keep reading to learn how to
    // do it.
    console.log("Approving Caretaker at", addr);
    // When, we initialize the contract using that provider and the token's
    // artifact. You can do this same thing with your contracts.

    // If a transaction fails, we save that error in the component's state.
    // We only save one such error, so before sending a second transaction, we
    // clear it.
    this._dismissTransactionError();

    // We send the transaction, and save its hash in the Dapp's state. This
    // way we can indicate that we are waiting for it to be mined.
    console.log(Object.keys(tokens[0]));
    for (let i = 0; i < tokens.length; i++) {
      await this._approval(tokens[i], addr);
    }
    // If we got here, the transaction was successful, so you may want to
    // update your state. Here, we update the user's balance.
    await this._getBalance();
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask selected network is Localhost:8545 
  _checkNetwork() {
    console.log(window.ethereum.networkVersion)
    // 250 : Fantom Chain id
    if (window.ethereum.networkVersion === `250`) {
      return true;
    }

    this.setState({
      networkError: 'Please connect Metamask to correct chain'
    });

    return false;
  }
}
