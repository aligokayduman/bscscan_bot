'use strict';

import {bscApiKey, PancakeAddress, covalentApiKey, covalentBinanceId, BscBurnAddress, excludeAddress} from './config.js';
import fetch from 'node-fetch';

let lastBlockNumber = 1;

let hashs = [];
let addresses = [];
let ruleHolders = [];
let ruleLiquid = [];
let ruleSource = [];

let tokens = [];
let unApprovedTokens = [];
let approvedTokens = [];

const fetchHash = () => {
    if(hashs.length > 0) return; //return if the next queue is not empty

    const url = 'https://api.bscscan.com/api?module=account&action=txlist&address=' + PancakeAddress + '&startblock=' + lastBlockNumber + '&endblock=99999999&page=1&offset=1000&sort=desc&apikey=' + bscApiKey;
    fetch(url)
    .then(res => res.json())
    .then(
        res => {
            if (typeof res === 'object' && res !== null && res.message === "OK" && res.status === "1"){
                res.result.forEach(trn => {
                    if (trn.to.toLowerCase() === PancakeAddress.toLowerCase() && trn.txreceipt_status === "1" && trn.isError === "0" && trn.input !== "0x") {
                        if (hashs.findIndex(i=> {i === trn.hash}) === -1) hashs.push(trn.hash);
                        lastBlockNumber = trn.blockNumer;
                    }
                  });
            }
        },
        err => {
            console.log(err);
        }
    )
    .catch(err => {
        console.log(err);
    });
}

const fetchAddress = () => {
    if(hashs.length === 0) return; //return if the queue is empty
    if(addresses.length > 0) return; //return if the next queue is not empty

    const hash = hashs[0];
    hashs.shift();
    const url = 'https://api.bscscan.com/api?module=proxy&action=eth_getTransactionReceipt&txhash=' + hash + '&apikey=' + bscApiKey;
    fetch(url)
      .then(res => res.json())
      .then(
        (res) => {
          if (typeof res === 'object' && res !== null) {
            if (Array.isArray(res.result.logs)) {
                res.result.logs.forEach(i => {
                    if (
                        addresses.findIndex(i => {i === i.address}) === -1 &&
                        tokens.findIndex(i => {i === i.address}) === -1 &&
                        excludeAddress.findIndex(i=> {i === i.address}) === -1
                        ) addresses.push(i.address);
                });
            }
          }
        },
        (err) => {
          console.log('There was an error : ' + err);
        })
      .catch(err => {
        console.log('There was an error : ' + err);
      });      
  }

  const fetchToken = () => {
    if(addresses.length === 0) return; //return if the queue is empty
    if(ruleHolders.length > 0) return; //return if the next queue is not empty

    const address = addresses[0];
    addresses.shift();
    const url = 'https://api.pancakeswap.info/api/v2/tokens/' + address;
    fetch(url)
      .then(res => res.json())
      .then(
        (res) => {
          if (typeof res === 'object' && res !== null) {
            if (typeof res.data != "undefined") {
                tokens.push(address);
                ruleHolders.push(address);
            }
          }
        },
        (err) => {
          console.log('There was an error : ' + err);
        })
      .catch(err => {
        console.log('There was an error : ' + err);
      });    
  }
  
  const fetchHolder = () => {
    if(ruleHolders.length === 0) return; //return if the queue is empty
    if(ruleLiquid.length > 0) return; //return if the next queue is not empty

    const address = ruleHolders[0];
    ruleHolders.shift();
    const url = 'https://api.covalenthq.com/v1/'+covalentBinanceId+'/tokens/'+address+'/token_holders/?key='+covalentApiKey;
    fetch(url)
      .then(res => res.json())
      .then(
        (res) => {
          if (typeof res === 'object' && res !== null) {
            if (typeof res.data != "undefined") {
              const count=0;
              let percentage=0;
              res.data.items.forEach(item =>{
                if(item.address !== BscBurnAddress) {
                  if(count<3) percentage+=(item.balance/item.total_supply);
                  count++;
                }
              });
              if(percentage<0.5) ruleLiquid.push(address);
              else unApprovedTokens.push(address);
            }
          }
        },
        (err) => {
          console.log('There was an error : ' + err);
        })
      .catch(err => {
        console.log('There was an error : ' + err);
      });    
      
  }  

  const fetchLiquid = () => {
    if(ruleLiquid.length === 0) return; //return if the queue is empty
    if(ruleSource.length > 0) return; //return if the next queue is not empty

    const address = ruleLiquid[0];
    ruleLiquid.shift();
    
    ruleSource.push(address);      
  }
  
  const fetchSource = () => {
    if(ruleSource.length === 0) return; //return if the queue is empty

    const address = ruleSource[0];
    ruleLiquid.shift();
    const url = 'https://api.bscscan.com/api?module=contract&action=getsourcecode&address='+address+'&apikey='+bscApiKey;
    fetch(url)
      .then(res => res.json())
      .then(
        (res) => {
          if (typeof res === 'object' && res !== null) {
            if (Array.isArray(res.result)) {
              res.result.forEach(i => {
                  if (sourceCheck(i.SourceCode)) approvedTokens.push(address);
                  else unApprovedTokens(address);
              });
          }
          }
        },
        (err) => {
          console.log('There was an error : ' + err);
        })
      .catch(err => {
        console.log('There was an error : ' + err);
      });    
    ruleSource.push(address);      
  }
  
  const sourceCheck = (source) => {
    if(source.toLowerCase().indexof("mint") > 0) return false;

    return true;
  }

export {
    fetchHash as default,
    fetchAddress,
    fetchToken,
    fetchHolder,
    fetchLiquid,
    fetchSource
}