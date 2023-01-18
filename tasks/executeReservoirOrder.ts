





import axios from 'axios'
import { toChecksumAddress } from 'ethereumjs-util'
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'

import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper'
 
import { buildExecuteParams, calculateTotalPrice, generateBNPLOrderSignature, performCraRequest, readSignatureVersionFromBNPLMarketContract } from '../lib/bnpl-helper'
import { fetchReservoirOrderById, formatReservoirOrder } from '../lib/reservoir-helper'
import { calculatePrincipalRequiredForBorrowerPayout } from '../lib/teller-v2-lending-helper'

import { AdditionalRecipient, BasicOrderParams, DomainData, ReservoirOrder, ReservoirOrderRawData, SubmitBidArgs } from '../lib/types'

require('dotenv').config()

const borrowerPrivateKey = process.env.BORROWER_PRIVATE_KEY!

const lenderPrivateKey = process.env.LENDER_PRIVATE_KEY!
  


const networkName = 'mainnet'
 
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

const chainId = "1"
const marketId = "6"

/*

const executeConfig = {
   
  marketplaceId: 2

} 

const craResponseSample = require('../test/data/sampleCraOutput.json')

let tokenInputData = require('../data/tokenInputData.json')
let networkName = networkNameFromChainId( tokenInputData.chainId  )
let contractsConfig = require('../data/contractsConfig.json')[networkName]

const ProxyAdminInterface = require('../abi/OpenZeppelinTransparentProxyAdmin.abi.json')
 
*/

/*

Test w tenderly test RPC  ?

*/



export async function executeReservoirOrder(): Promise<any> {

    const orderId = "0x36676cd9406a187400fc3154d3e1e214374e4c907e31eef963b0dcef366cb15b"

    const orderResponse:ReservoirOrder|undefined = await fetchReservoirOrderById({orderId})

    console.log({orderResponse})

    if(!orderResponse){
        throw new Error('No matching order from reservoir')
    }
 
    const {basicOrderParams}  = formatReservoirOrder( orderResponse )



    if(!basicOrderParams){
        throw new Error('Unable to build basic order params')
    }


    const additionalRecipientsFormatted:AdditionalRecipient[] = basicOrderParams.additionalRecipients.map( (r:any) =>  {return {
        amount: BigNumber.from(r.amount),
        recipient: r.recipient
        }}) 

    const basicOrderParamsFormatted:BasicOrderParams = {
        considerationToken: basicOrderParams.considerationToken,
        considerationIdentifier: BigNumber.from(basicOrderParams.considerationIdentifier),
        considerationAmount: BigNumber.from(basicOrderParams.considerationAmount),
        offerer: basicOrderParams.offerer,
        zone: basicOrderParams.zone,
        offerToken: basicOrderParams.offerToken,
        offerIdentifier: BigNumber.from(basicOrderParams.offerIdentifier),
        offerAmount: basicOrderParams.offerAmount,
        basicOrderType: basicOrderParams.basicOrderType,
        startTime: BigNumber.from(basicOrderParams.startTime),
        endTime: BigNumber.from(basicOrderParams.endTime),
        zoneHash: basicOrderParams.zoneHash,
        salt: basicOrderParams.salt,
        offererConduitKey: basicOrderParams.offererConduitKey,
        fulfillerConduitKey: basicOrderParams.fulfillerConduitKey,
        totalOriginalAdditionalRecipients: BigNumber.from(basicOrderParams.totalOriginalAdditionalRecipients),
        additionalRecipients: additionalRecipientsFormatted,
        signature: basicOrderParams.signature
    }
 

    console.log({bnplConfig})

    let rpcProvider = new providers.JsonRpcProvider( rpcURI )
    
    let tellerV2Instance = new Contract(tellerV2Config.address,tellerV2Config.abi, rpcProvider)
    let bnplContractInstance = new Contract(bnplConfig.address,bnplConfig.abi,rpcProvider)



    const borrowerWallet = new Wallet(borrowerPrivateKey, rpcProvider)


    const borrowerAddress = borrowerWallet.address

    
    const lenderWallet = new Wallet(lenderPrivateKey)

    const lenderAddress = lenderWallet.address



    const totalPurchasePrice = basicOrderParams.considerationAmount

    const downPayment = BigNumber.from(totalPurchasePrice).div(2).toString()

    const amountRequiredForLoan = BigNumber.from(totalPurchasePrice).sub( downPayment )

    const principal = calculatePrincipalRequiredForBorrowerPayout(
         amountRequiredForLoan, 
         BigNumber.from(0),  //market fee for market 6 
         BigNumber.from(5) //protocol fee 
         ).toString()


    const secondsNow = Math.floor(Date.now()/1000)

    const signatureExpiration = secondsNow + 90*60*1000

    let submitBidArgs:SubmitBidArgs = {
        borrower: borrowerAddress,
        lender: lenderAddress, 
      

        totalPurchasePrice,
        principal,
        downPayment,

        duration: '28000',
        signatureExpiration: signatureExpiration.toString(),
        interestRate: '300',
      
        metadataURI: 'ipfs://',
        referralAddress: ethers.constants.AddressZero,
        marketId
    }

    const implementationContractAddress = "0x3bf7f0d0fa47f2101f67bd530f1be7ad05d90321"

    const domainData:DomainData = {
        name: 'Teller_BNPL_Market',
        version: '3.5',
        chainId: parseInt(chainId),
        verifyingContract: implementationContractAddress
    }

    let borrowerSignature = await generateBNPLOrderSignature( 
        submitBidArgs,
        basicOrderParamsFormatted,  
        domainData, 
        borrowerWallet,      
       ) 

    let lenderSignature = await generateBNPLOrderSignature( 
        submitBidArgs,
        basicOrderParamsFormatted,   
        domainData,
        lenderWallet,       
        ) 


        //fix it for now to remove referral and sig expir
      let formattedSubmitBidArgs:SubmitBidArgs = {
        borrower: borrowerAddress,
        lender: lenderAddress,
        totalPurchasePrice: submitBidArgs.totalPurchasePrice,
        principal: submitBidArgs.principal,
        downPayment: submitBidArgs.downPayment,       
        duration: submitBidArgs.duration,       
        signatureExpiration: submitBidArgs.signatureExpiration,
        interestRate:submitBidArgs.interestRate,
        metadataURI: submitBidArgs.metadataURI ,
        referralAddress: submitBidArgs.referralAddress,      
        marketId
      }



    console.log(JSON.stringify(basicOrderParamsFormatted))
    console.log(JSON.stringify(formattedSubmitBidArgs))


    //Set price to 1 Gwei
    let gasPrice = utils.hexlify(8_000_000_000);
    //Set max gas limit to 4M
    var gasLimit = utils.hexlify(10_000_000);  


 
    console.log({borrowerSignature})

    let unsignedTx = await bnplContractInstance
    .populateTransaction
    .executeUsingOffchainSignatures(
      formattedSubmitBidArgs, 
      basicOrderParamsFormatted, 
      borrowerSignature,
      lenderSignature      
      , {   gasLimit, gasPrice} )

  
      console.log('made unsigned tx')

    let response = await borrowerWallet.sendTransaction(unsignedTx);
    console.log('response',response)



  /*

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

   // let craResponse = await performCraRequest( craInputs  )
    let craResponse = {success:true, data: craResponseSample , error:'none'}

    console.log('meep', craResponse)
    

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
  
 
    const submitBidArgs:SubmitBidArgs = executeParams.submitBidArgs


    submitBidArgs.borrower = borrowerWallet.address
    submitBidArgs.lender = borrowerWallet.address

    let value:BigNumber = BigNumber.from(submitBidArgs.downPayment)      

    let lenderAddress = lenderWallet.address

    let basicOrderParams:BasicOrderParams = executeParams.basicOrderParams

    if(!basicOrderParams.offererConduitKey){
      throw new Error('Missing offererConduitKey')
    }

    */


    /*
    const chainId = tokenInputData.chainId



    // find implementation address via proxy admin 

    let bnplContractProxyAddress = contractsConfig.BNPLContract.address

    const proxyAdminContract = new Contract( contractsConfig.proxyAdmin.address, ProxyAdminInterface, rpcProvider )
    let implementationContractAddress = await proxyAdminContract.getProxyImplementation( bnplContractProxyAddress )

    implementationContractAddress = toChecksumAddress(implementationContractAddress)

    if(typeof(implementationContractAddress) == 'undefined'){
      return {success:false, error:"Could not get implementation address"}
    }
 


      let lenderSignature = await generateBNPLOrderSignature( 
        submitBidArgs,
        basicOrderParams,   
        lenderWallet,
        chainId,
        implementationContractAddress
       ) 

       let borrowerSignature = await generateBNPLOrderSignature( 
        submitBidArgs,
        basicOrderParams,   
        borrowerWallet,
        chainId,
        implementationContractAddress
       ) 



 
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
      }


    console.log('passing in params',
      formattedSubmitBidArgs, 
      basicOrderParams ,
      borrowerSignature,
      lenderSignature
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
 

     */

   /* let unsignedTx = await bnplContractInstance
    .populateTransaction
    .executeWithOffchainSignatures(
      formattedSubmitBidArgs, 
      basicOrderParams, 
      borrowerSignature,
      lenderSignature
      
      , {value, gasLimit, gasPrice} )

  

    let response = await borrowerWallet.sendTransaction(unsignedTx);
    console.log('response',response)*/
     
   
    return true 
  }
  
  

  
