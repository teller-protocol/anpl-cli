import { getRpcUrlFromNetworkName } from "../lib/app-helper";

import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'



const rpcURI = getRpcUrlFromNetworkName('mainnet') 

export async function tenderlyAddBalance(): Promise<any> {

  
  let rpcProvider = new providers.JsonRpcProvider( rpcURI ) 


  let getBalance = await rpcProvider.send("eth_getBalance", ['0x810E096DDa9ae3Ae2b55a9c45068F9FE8eeea6db', "latest"])
    console.log({getBalance})

    const params = [ 
       ['0x810E096DDa9ae3Ae2b55a9c45068F9FE8eeea6db'],
       ethers.utils.hexValue(ethers.utils.parseUnits("100", "ether").toHexString()) // hex encoded wei amount
    ];

    let sent = await rpcProvider.send('tenderly_addBalance', params)

    console.log({sent})
}