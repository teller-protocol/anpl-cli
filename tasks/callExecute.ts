
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'
import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper'
import { axiosPostRequest } from '../lib/axios-helper'
import { buildExecuteParams, calculateTotalPrice, performCraRequest, readSignatureVersionFromBNPLMarketContract } from '../lib/bnpl-helper'
import { BasicOrderParams, SubmitBidArgs } from '../lib/types'

require('dotenv').config()

const borrowerPrivateKey = process.env.BORROWER_PRIVATE_KEY

const lenderPrivateKey = process.env.LENDER_PRIVATE_KEY
 

const executeConfig = {
   
  marketplaceId: 2

} 


let tokenInputData = require('../data/tokenInputData.json')
let networkName = networkNameFromChainId( tokenInputData.chainId  )
let contractsConfig = require('../data/contractsConfig.json')[networkName]



const rpcURI = getRpcUrlFromNetworkName(networkName) 

//was 0x519b957ecaa80C5aEd4C5547Ff2Eac3ff5dE229c
const tellerV2Config = {
    address: contractsConfig.tellerV2.address,
    abi: require('../abi/TellerV2.json')
}

const bnplConfig = {
    address: contractsConfig.BNPLContract.address,
    abi: require('../abi/BNPLMarketV3.json')
  }



export async function callExecute(): Promise<any> {


    
 

    let rpcProvider = new providers.JsonRpcProvider( rpcURI )
    
    let tellerV2Instance = new Contract(tellerV2Config.address,tellerV2Config.abi, rpcProvider)
    let bnplContractInstance = new Contract(bnplConfig.address,bnplConfig.abi,rpcProvider)


    let signatureVersion = await readSignatureVersionFromBNPLMarketContract(  bnplContractInstance )

    let craInputs = {
      asset_contract_address:tokenInputData.tokenAddress,
      token_id:tokenInputData.tokenId,
      quantity: tokenInputData.tokenQuantity,
 
      chain_id:tokenInputData.chainId,    
      signature_version: signatureVersion
    }

    let craResponse = await performCraRequest( craInputs  )
    

    if(!craResponse.success || !craResponse.data) throw new Error('cra error '.concat(craResponse.error.toString()))
  

    let executeParams = craResponse.data 

    if(typeof(executeParams.submitBidArgs.metadataURI) == 'undefined'){
      executeParams.submitBidArgs.metadataURI = "ipfs://"
    }




    if(!borrowerPrivateKey) throw new Error('Missing borrowerPrivateKey')


    if(!lenderPrivateKey) throw new Error('Missing lenderPrivateKey')

    let borrowerWallet = new Wallet(borrowerPrivateKey).connect(rpcProvider)

    let lenderWallet = new Wallet(lenderPrivateKey).connect(rpcProvider)
 
    console.log(`calling execute using account ${borrowerWallet.address}`)
  

 
   const submitBidArgs = executeParams.submitBidArgs



   let value:BigNumber = BigNumber.from(submitBidArgs.downPayment)      

   let lenderAddress = lenderWallet.address

   let basicOrderParams:BasicOrderParams = executeParams.basicOrderParams

   if(!basicOrderParams.offererConduitKey){
     throw new Error('Missing offererConduitKey')
   }

 
    let lenderHasApproved = await tellerV2Instance.hasApprovedMarketForwarder(executeConfig.marketplaceId, bnplContractInstance.address, lenderAddress)
    console.log('lender has approved BNPL as forwarder: ',lenderHasApproved, lenderAddress)

    if(!lenderHasApproved) {
        console.error(`ERROR: lender ${lenderAddress} has not approved bnpl as forwarder `)
        return 
    }


    let borrowerHasApproved = await tellerV2Instance.hasApprovedMarketForwarder(executeConfig.marketplaceId, bnplContractInstance.address, lenderAddress)
    console.log('lender has approved BNPL as forwarder: ',borrowerHasApproved, lenderAddress)

    if(!borrowerHasApproved) {
        console.error(`ERROR: lender ${lenderAddress} has not approved bnpl as forwarder `)
        return 
    }

 
 


      //fix it for now to remove referral and sig expir
      let formattedSubmitBidArgs:SubmitBidArgs = {
        lender: lenderAddress,
        totalPurchasePrice: submitBidArgs.totalPurchasePrice,
        principal: submitBidArgs.principal,
        downPayment: submitBidArgs.downPayment,       
        duration: submitBidArgs.duration,       
        signatureExpiration: submitBidArgs.signatureExpiration,
        interestRate:submitBidArgs.interestRate,
        referralAddress: submitBidArgs.referralAddress,
        metadataURI: submitBidArgs.metadataURI ,
        marketId: "2"
      }


    console.log('passing in params',
      formattedSubmitBidArgs, 
      basicOrderParams, 
      executeParams.craSignature 
    )
 
   // basicOrderParams.offererConduitKey = "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000"
  //basicOrderParams.signature= "0x5c8a6fd29db37f9b53fcf1cce21c62e68ca0684c28e0320cb27e8568210baf37644e1258430b698cfe533334621ddd82a12e46dd184823ab318b8ee6ff0fa2dd1c"

    //this address needs to approve the forwarder on tellerv2
  //  lenderAddress =  "0xF4dAb24C52b51cB69Ab62cDE672D3c9Df0B39681"

    //Set price to 1 Gwei
    let gasPrice = utils.hexlify(8_000_000_000);
    //Set max gas limit to 4M
    var gasLimit = utils.hexlify(10_000_000);  


    if((basicOrderParams.basicOrderType) > 22){
      throw new Error('invalid basic order type')
    }
 
    let unsignedTx = await bnplContractInstance
    .populateTransaction
    .execute(
      formattedSubmitBidArgs, 
      basicOrderParams, 
      executeParams.craSignature , {value, gasLimit, gasPrice} )

  

    let response = await borrowerWallet.sendTransaction(unsignedTx);
    console.log('response',response)
      
   
    return true 
  }
  
  

  
