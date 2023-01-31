


/*

This calls executeUsingOffchainSignatures on ANPL using a reservoir order as an input 


*/


import { recoverSignerOfOffchainOffer } from '@clarity-credit/anpl-sdk'
import axios from 'axios'
import { toChecksumAddress } from 'ethereumjs-util'
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'

import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper'
 
import { buildExecuteParams, calculateTotalPrice, generateBNPLOrderSignature, performCraRequest, readSignatureVersionFromBNPLMarketContract } from '../lib/bnpl-helper'
import { fetchReservoirOrderById, formatReservoirOrder } from '../lib/reservoir-helper'
import { calculatePrincipalRequiredForBorrowerPayout } from '../lib/teller-v2-lending-helper'

import { AdditionalRecipient, AdditionalRecipientResponse, BasicOrderParams, DomainData, ReservoirOrder, ReservoirOrderRawData, SubmitBidArgs } from '../lib/types'

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

Test w tenderly test RPC  

*/



export async function executeReservoirOrder(): Promise<any> {

    
    const orderId = "0x7ec099689d676e4ccc8ba7e7d1fe68eb4b56eb9d7bf81f86db5c4c5ec2958350"
   
    const orderResponse:ReservoirOrder|undefined = await fetchReservoirOrderById({orderId, chainId:parseInt(chainId)})

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
 
    console.log({rpcURI})
    console.log({bnplConfig})

    let rpcProvider = new providers.JsonRpcProvider( rpcURI )
    
    let tellerV2Instance = new Contract(tellerV2Config.address,tellerV2Config.abi, rpcProvider)
    let bnplContractInstance = new Contract(bnplConfig.address,bnplConfig.abi,rpcProvider)



    const borrowerWallet = new Wallet(borrowerPrivateKey, rpcProvider)


    const borrowerAddress = borrowerWallet.address

    
    const lenderWallet = new Wallet(lenderPrivateKey,rpcProvider)

    const lenderAddress = lenderWallet.address




    const considerationAmount = BigNumber.from( basicOrderParams.considerationAmount )
    const additionalAmount = calculateTotalAdditionalAmount( basicOrderParams.additionalRecipients ) 
    const totalPurchasePrice = considerationAmount.add(additionalAmount).toString()

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

        duration: '1604800',
        signatureExpiration: signatureExpiration.toString(),
        interestRate: '300',
      
        metadataURI: 'ipfs://',
        referralAddress: ethers.constants.AddressZero,
        marketId
    }

    const implementationContractAddress = bnplConfig.address
    //"0x3bf7F0D0FA47F2101f67bd530F1bE7aD05D90321"

    const domainData:DomainData = {
        name: 'Teller_BNPL_Market',
        version: '3.6',
        chainId: parseInt(chainId),
        verifyingContract: implementationContractAddress
    }

  

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



      let borrowerSignature = await generateBNPLOrderSignature( 
        formattedSubmitBidArgs,
        basicOrderParamsFormatted,  
        domainData, 
        borrowerWallet,      
       ) 

    let lenderSignature = await generateBNPLOrderSignature( 
        formattedSubmitBidArgs,
        basicOrderParamsFormatted,   
        domainData,
        lenderWallet,       
        ) 


    let recoveredSigner = recoverSignerOfOffchainOffer(
        formattedSubmitBidArgs,
        basicOrderParamsFormatted,   
        domainData,
        lenderSignature
    )

    console.log({recoveredSigner})

    console.log(JSON.stringify(basicOrderParamsFormatted))
    console.log(JSON.stringify(formattedSubmitBidArgs))


    //Set price to 1 Gwei
    let gasPrice = utils.hexlify(8_000_000_000);
    //Set max gas limit to 4M
    var gasLimit = utils.hexlify(10_000_000);  


 
    console.log({borrowerSignature},{lenderSignature})

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

 
   
    return true 
  }
  
  

  



  function calculateTotalAdditionalAmount( additionalRecipients: AdditionalRecipientResponse[] ) : BigNumber {

    let result = BigNumber.from(0)

    additionalRecipients.map( (r:any) => result = result.add(r.amount))

    return result


  }