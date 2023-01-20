





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

const chainId = "31337"
const marketId = "6"
 

/*

Test w tenderly test RPC  

*/



export async function signOffer(): Promise<any> {
 


    const basicOrderParamsFormatted:BasicOrderParams = {
        considerationToken:"0x0000000000000000000000000000000000000000",
        considerationIdentifier: BigNumber.from("0x00"),
        considerationAmount: BigNumber.from("0x0376c1e0a7f000"),
        offerer: "0xb11ca87e32075817c82cc471994943a4290f4a14",
        zone: "0x0000000000000000000000000000000000000000",
        offerToken: "0x305305c40D3DE1c32F4C3D356ABc72BCc6dCf9Dc",
        offerIdentifier: BigNumber.from("0x09"),
        offerAmount: "1",
        basicOrderType: 0,
        startTime: BigNumber.from("0x6331e209"),
        endTime: BigNumber.from("0x63596f09"),
        zoneHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        salt: "0x360c6ebe0000000000000000000000000000000000000000528e98fff5358fba",
        offererConduitKey: "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
        fulfillerConduitKey: "0x0000000000000000000000000000000000000000000000000000000000000000",
        totalOriginalAdditionalRecipients: BigNumber.from("0x01"),
        additionalRecipients: [{amount:BigNumber.from("0x16bcc41e9000"), recipient:"0x0000a26b00c1F0DF003000390027140000fAa719"}],
        signature: "0x64ce208b5f5eabed00bf3d81f9684c964cb95439ab0d1330542cee4f5e3acf5a64308b84aa24d126fd440f6ec170fd454be0f2202a7bd1b4b0e11ac7e9918d7d1c"
    }
 
    console.log({rpcURI})
    console.log({bnplConfig})

   

    const borrowerWallet = new Wallet(borrowerPrivateKey)

    const borrowerAddress = borrowerWallet.address
    
    console.log({borrowerAddress})

    const considerationAmount = BigNumber.from( basicOrderParamsFormatted.considerationAmount )
    const additionalAmount = calculateTotalAdditionalAmount( basicOrderParamsFormatted.additionalRecipients ) 
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
        lender: undefined,  

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

    const implementationContractAddress = '0xb891A2F71f14Bd88271903926eB155a65B5b0A8C' //bnplConfig.address
    
    const domainData:DomainData = {
        name: 'Teller_BNPL_Market',
        version: '3.5',
        chainId: parseInt(chainId),
        verifyingContract: implementationContractAddress
    } 

   
      let formattedSubmitBidArgs:SubmitBidArgs = {
        borrower: submitBidArgs.borrower,
        lender: submitBidArgs.lender,
        totalPurchasePrice: submitBidArgs.totalPurchasePrice,
        principal: submitBidArgs.principal,
        downPayment: submitBidArgs.downPayment,       
        duration: submitBidArgs.duration,       
        signatureExpiration: submitBidArgs.signatureExpiration,
        interestRate:submitBidArgs.interestRate,
        metadataURI: submitBidArgs.metadataURI ,
        referralAddress: submitBidArgs.referralAddress,      
        marketId: submitBidArgs.marketId
      }



      let borrowerSignature = await generateBNPLOrderSignature( 
        formattedSubmitBidArgs,
        basicOrderParamsFormatted,  
        domainData, 
        borrowerWallet,      
       ) 



    console.log({borrowerSignature})

      
    let recoveredSigner = recoverSignerOfOffchainOffer(
        formattedSubmitBidArgs,
        basicOrderParamsFormatted,   
        domainData,
        borrowerSignature
    )

    console.log({recoveredSigner})

    console.log(JSON.stringify(basicOrderParamsFormatted))
    console.log(JSON.stringify(formattedSubmitBidArgs))

 
 
   
    return true 
  }
  
  

  



  function calculateTotalAdditionalAmount( additionalRecipients: AdditionalRecipient[] ) : BigNumber {

    let result = BigNumber.from(0)

    additionalRecipients.map( (r:any) => result = result.add(r.amount))

    return result


  }