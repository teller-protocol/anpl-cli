
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'
import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper'
import { calculateTotalPrice, performCraRequest, readSignatureVersionFromBNPLMarketContract } from '../lib/bnpl-helper'
import { BasicOrderParams, SubmitBidArgs } from '../lib/types'

require('dotenv').config()

const yargs = require('yargs').argv
 


/*

  Borrower needs to approve WETH to the bnpl contract 
  Lender needs to approve WETH to the Tellerv2 contract 

  WETH goerli : 0xffc94fB06B924e6dBA5F0325bbed941807a018CD 

*/

 
const lenderPrivateKey = process.env.LENDER_PRIVATE_KEY


const executeConfig = {
  
  marketplaceId: 1,
  chainId: 1
 
}
 
 
 
let networkName = networkNameFromChainId( executeConfig.chainId  )
let contractsConfig = require('../data/contractsConfig.json')[networkName]


const rpcURI = getRpcUrlFromNetworkName(networkName) 

 
const tellerV2Config = {
    address: contractsConfig.tellerV2.address,
    abi: require('../abi/TellerV2.json')
}

const bnplConfig = {
    address: contractsConfig.BNPLContract.address,
    abi: require('../abi/BNPLMarketV3.json')
  }


  /*
  yarn task acceptDiscrete -- --discreteOrderId=1

  
  */


export async function acceptDiscrete( ): Promise<any> {
   

    const {discreteOrderId} = yargs

    //let executeParams:any  = require('../data/craResponse.json')
    //pushing params check

 
    let rpcProvider = new providers.JsonRpcProvider( rpcURI )



    if(!lenderPrivateKey) throw new Error('Missing lenderPrivateKey')

    let lenderWallet = new Wallet(lenderPrivateKey).connect(rpcProvider)
 
 

    
    let tellerV2Instance = new Contract(tellerV2Config.address,tellerV2Config.abi, rpcProvider)
    let bnplContractInstance = new Contract(bnplConfig.address,bnplConfig.abi,rpcProvider)


    let signatureVersion = await readSignatureVersionFromBNPLMarketContract(  bnplContractInstance )

  

    
    let discreteOrderData = await bnplContractInstance.discreteOrders( discreteOrderId )

    let bidId = discreteOrderData.bidId
  
    console.log({discreteOrderData})


    let craInputs = {
      asset_contract_address: discreteOrderData.assetContractAddress.toString(),
      token_id: discreteOrderData.assetTokenId.toString(),
      quantity: discreteOrderData.quantity.toString(),
 
      chain_id: executeConfig.chainId,    
      signature_version: signatureVersion
    }

    let craResponse = await performCraRequest( craInputs  )
    

    if(!craResponse.success || !craResponse.data) throw new Error('cra error '.concat(craResponse.error.toString()))
  



   let basicOrderParams:BasicOrderParams = craResponse.data.basicOrderParams

   if(!basicOrderParams.offererConduitKey){
     throw new Error('Missing offererConduitKey')
   }
   
   
    //Set price to 1 Gwei
    let gasPrice = utils.hexlify(14_000_000_000);
    //Set max gas limit to 4M
    // var gasLimit = utils.hexlify(10_000_000);  


    if((basicOrderParams.basicOrderType) > 22){
      throw new Error('invalid basic order type')
    } 

    console.log('accepting discrete order using account ',  lenderWallet.address)
  
    
    let unsignedTx = await bnplContractInstance
    .populateTransaction
    .acceptDiscreteOrder(
      discreteOrderId,
      basicOrderParams , 
      {gasPrice} 
      )
 

    let response = await lenderWallet.sendTransaction(unsignedTx);
    console.log('response',response)
      
   
    return true 
  }
  
  

  
