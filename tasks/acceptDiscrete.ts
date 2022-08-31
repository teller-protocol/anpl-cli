
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'
import { calculateTotalPrice } from '../lib/bnpl-helper'
import { BasicOrderParams, SubmitBidArgs } from '../lib/types'

require('dotenv').config()


const rpcURI = process.env.GOERLI_RPC_URL
const privateKey = process.env.WALLET_PRIVATE_KEY


const executeConfig = {
  networkName: "goerli",
  marketplaceId: 2,
  bidId: 3
}
 



let contractsConfig = require('../data/contractsConfig.json')[executeConfig.networkName]

 
const tellerV2Config = {
    address: contractsConfig.tellerV2.address,
    abi: require('../abi/TellerV2.json')
}

const bnplConfig = {
    address: contractsConfig.BNPLContract.address,
    abi: require('../abi/BNPLMarket.json')
  }



export async function acceptDiscrete(): Promise<any> {

    let executeParams:any  = require('../data/craResponse.json')

    let rpcProvider = new providers.JsonRpcProvider( rpcURI )
    
    let tellerV2Instance = new Contract(tellerV2Config.address,tellerV2Config.abi, rpcProvider)
    let bnplContractInstance = new Contract(bnplConfig.address,bnplConfig.abi,rpcProvider)

    if(!privateKey) throw new Error('Missing privateKey')

    let wallet = new Wallet(privateKey).connect(rpcProvider)
 
 

   let basicOrderParams:BasicOrderParams = executeParams.basicOrderParams

   if(!basicOrderParams.offererConduitKey){
     throw new Error('Missing offererConduitKey')
   }
  
 

    //Set price to 1 Gwei
    let gasPrice = utils.hexlify(8_000_000_000);
    //Set max gas limit to 4M
    var gasLimit = utils.hexlify(10_000_000);  


    if((basicOrderParams.basicOrderType) > 22){
      throw new Error('invalid basic order type')
    }


    let bidId = executeConfig.bidId
 

    let unsignedTx = await bnplContractInstance
    .populateTransaction
    .acceptDiscreteOrder(
      bidId,
      basicOrderParams , 
      { gasLimit, gasPrice} )

  

    let response = await wallet.sendTransaction(unsignedTx);
    console.log('response',response)
      
   
    return true 
  }
  
  

  
