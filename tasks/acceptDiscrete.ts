
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'
import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper'
import { calculateTotalPrice, performCraRequest, readSignatureVersionFromBNPLMarketContract } from '../lib/bnpl-helper'
import { BasicOrderParams, SubmitBidArgs } from '../lib/types'

require('dotenv').config()


 
const lenderPrivateKey = process.env.LENDER_PRIVATE_KEY


const executeConfig = {
  
  marketplaceId: 3,
  bidId: 3
}
 



let tokenInputData = require('../data/tokenInputData.json')
let networkName = networkNameFromChainId( tokenInputData.chainId  )
let contractsConfig = require('../data/contractsConfig.json')[networkName]


const rpcURI = getRpcUrlFromNetworkName(networkName) 

 
const tellerV2Config = {
    address: contractsConfig.tellerV2.address,
    abi: require('../abi/TellerV2.json')
}

const bnplConfig = {
    address: contractsConfig.BNPLContract.address,
    abi: require('../abi/BNPLMarket.json')
  }



export async function acceptDiscrete(): Promise<any> {

    //let executeParams:any  = require('../data/craResponse.json')

 
    let rpcProvider = new providers.JsonRpcProvider( rpcURI )



    if(!lenderPrivateKey) throw new Error('Missing lenderPrivateKey')

    let wallet = new Wallet(lenderPrivateKey).connect(rpcProvider)
 
 

    
    let tellerV2Instance = new Contract(tellerV2Config.address,tellerV2Config.abi, rpcProvider)
    let bnplContractInstance = new Contract(bnplConfig.address,bnplConfig.abi,rpcProvider)


    let signatureVersion = await readSignatureVersionFromBNPLMarketContract(  bnplContractInstance )


    let bidId = executeConfig.bidId
  
    
    let discreteOrderData = await bnplContractInstance.discreteOrders( bidId )

    console.log({discreteOrderData})


    let craInputs = {
      asset_contract_address: discreteOrderData.assetContractAddress,
      token_id: discreteOrderData.assetTokenId,
      quantity: discreteOrderData.quantity,
 
      chain_id:tokenInputData.chainId,    
      signature_version: signatureVersion
    }

    let craResponse = await performCraRequest( craInputs  )
    

    if(!craResponse.success || !craResponse.data) throw new Error('cra error '.concat(craResponse.error.toString()))
  



   let basicOrderParams:BasicOrderParams = craResponse.data.basicOrderParams

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
  
  

  
