
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'
import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper'
import { axiosPostRequest } from '../lib/axios-helper'
import { calculateTotalPrice, performCraRequest, readSignatureVersionFromBNPLMarketContract } from '../lib/bnpl-helper'
import { BasicOrderParams, SubmitBidArgs } from '../lib/types'

require('dotenv').config()

 
const borrowerPrivateKey = process.env.BORROWER_PRIVATE_KEY


 
 

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



export async function submitDiscrete(): Promise<any> {

    const marketId = 2;

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
  

    const executeParams = craResponse.data 



    if(!borrowerPrivateKey) throw new Error('Missing privateKey')

    let wallet = new Wallet(borrowerPrivateKey).connect(rpcProvider)
 
    console.log(`calling execute using account ${wallet.address}`)
 
    const submitBidArgs = executeParams.submitBidArgs
 

    const currentTimeSeconds = Math.floor(Date.now() / 1000)


    const ONE_WEEK_IN_SECONDS = 60*60*24*7 

    //Cra server might not give us the right signature expiration 
    submitBidArgs.signatureExpiration =(
      currentTimeSeconds + ONE_WEEK_IN_SECONDS
    ).toString()

    //must be zero 
    submitBidArgs.lender = ethers.constants.AddressZero
   

    let basicOrderParams:BasicOrderParams = executeParams.basicOrderParams

    if(!basicOrderParams.offererConduitKey){
      throw new Error('Missing offererConduitKey')
    }
 
  
      //fix it for now to remove referral and sig expir
      let formattedSubmitBidArgs:SubmitBidArgs = {
        lender: submitBidArgs.lender,
        totalPurchasePrice: submitBidArgs.totalPurchasePrice,
        principal: submitBidArgs.principal,
        downPayment: submitBidArgs.downPayment,       
        duration: submitBidArgs.duration,       
        signatureExpiration: submitBidArgs.signatureExpiration,
        interestRate:submitBidArgs.interestRate,
        referralAddress: submitBidArgs.referralAddress,
        metadataURI: submitBidArgs.metadataURI ,
        marketId
      }


    console.log('passing in params',
      formattedSubmitBidArgs, 
      basicOrderParams, 
      executeParams.craSignature 
    )
  
    //Set price to 1 Gwei
    let gasPrice = utils.hexlify(8_000_000_000);
    //Set max gas limit to 4M
    var gasLimit = utils.hexlify(10_000_000);  


    if((basicOrderParams.basicOrderType) > 22){
      throw new Error('invalid basic order type')
    }


    let assetContractAddress = basicOrderParams.offerToken 
    let assetTokenId = basicOrderParams.offerIdentifier
    let assetQuantity = basicOrderParams.offerAmount

    let unsignedTx = await bnplContractInstance
    .populateTransaction
    .submitDiscreteOrder(
      formattedSubmitBidArgs, 
      assetContractAddress,
      assetTokenId,
      assetQuantity , {gasLimit, gasPrice} )

  

    let response = await wallet.sendTransaction(unsignedTx);
    console.log('response',response)
      
   
    return true 
  }
  
  

  
