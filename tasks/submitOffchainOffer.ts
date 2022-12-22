
import { toChecksumAddress } from 'ethereumjs-util'
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'

import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper'
 
import { readSignatureVersionFromBNPLMarketContract } from '../lib/bnpl-helper'

import {  DomainData, SubmitBidArgs } from '../lib/types'

import axios from 'axios'

import { recoverSignerOfOffchainOffer, signOffchainOffer } from '@clarity-credit/anpl-sdk'
import { BasicOrderParams } from '@clarity-credit/anpl-sdk/types/types'

require('dotenv').config()

const borrowerPrivateKey = process.env.BORROWER_PRIVATE_KEY

const lenderPrivateKey = process.env.LENDER_PRIVATE_KEY


 

const executeConfig = {
   
  marketplaceId: 2

} 


const craResponseSample = require('../test/data/sampleCraOutput.json')


let tokenInputData = require('../data/tokenInputData.json')
let networkName = networkNameFromChainId( tokenInputData.chainId  )
let contractsConfig = require('../data/contractsConfig.json')[networkName]

const ProxyAdminInterface = require('../abi/OpenZeppelinTransparentProxyAdmin.abi.json')

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



export async function submitOffchainOffer(): Promise<any> {


    const marketId = "2"

    let rpcProvider = new providers.JsonRpcProvider( rpcURI )
    
    let tellerV2Instance = new Contract(tellerV2Config.address,tellerV2Config.abi, rpcProvider)
    let bnplContractInstance = new Contract(bnplConfig.address,bnplConfig.abi,rpcProvider)


    let signatureVersion = await readSignatureVersionFromBNPLMarketContract(  bnplContractInstance )

    

   // let craResponse = await performCraRequest( craInputs  )
    let craResponse = {success:true, data: craResponseSample , error:'none'}
 
    

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
    submitBidArgs.lender = undefined   // borrowerWallet.address

    let value:BigNumber = BigNumber.from(submitBidArgs.downPayment)      

    let lenderAddress = lenderWallet.address

    let basicOrderParams:BasicOrderParams = executeParams.basicOrderParams

    if(!basicOrderParams.offererConduitKey){
      throw new Error('Missing offererConduitKey')
    }

    const chainId = 1 // tokenInputData.chainId



    // find implementation address via proxy admin 

    let bnplContractProxyAddress = contractsConfig.BNPLContract.address

    const proxyAdminContract = new Contract( contractsConfig.proxyAdmin.address, ProxyAdminInterface, rpcProvider )
    let implementationContractAddress = await proxyAdminContract.getProxyImplementation( bnplContractProxyAddress )

    implementationContractAddress = toChecksumAddress(implementationContractAddress)

    if(typeof(implementationContractAddress) == 'undefined'){
      return {success:false, error:"Could not get implementation address"}
    }


    let domainData:DomainData = {
      name: "Teller_BNPL_Market",
      version: "3.2",
      chainId,
      verifyingContract: implementationContractAddress
    }

 
  

      //fix it for now to remove referral and sig expir
      let formattedSubmitBidArgs:SubmitBidArgs = {
        borrower: borrowerWallet.address,
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

      let borrowerSignature = await signOffchainOffer({
        submitBidArgs:formattedSubmitBidArgs,
        basicOrderParams,   
        domainData,
        //@ts-ignore
        wallet: borrowerWallet,
         }) 
 

    if((basicOrderParams.basicOrderType) > 22){
      throw new Error('invalid basic order type')
    }


    let url = "http://localhost:8000/v2/offers"
    //let url = "https://development.api.apenowpaylater.com/v2/offers"

    let offer = {
      submitBidArgs: formattedSubmitBidArgs,
      basicOrderParams,
      domainData,
      borrowerSignature
    }
 
    let data = {offers:[offer]}



    const recoveredSigner = recoverSignerOfOffchainOffer(
      formattedSubmitBidArgs,
      basicOrderParams,
      domainData,
      borrowerSignature
    );
 


    let postResponse = await axios.post( url, data )
      
    console.log({postResponse})
  
   
    return true 
  }
  
  

  
