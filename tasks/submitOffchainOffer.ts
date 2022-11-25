
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
      }

      let borrowerSignature = await signOffchainOffer({
        submitBidArgs:formattedSubmitBidArgs,
        basicOrderParams,   
        domainData,
        //@ts-ignore
        wallet: borrowerWallet,
         }) 

    console.log('passing in params',
      formattedSubmitBidArgs, 
      basicOrderParams ,
      borrowerSignature,
      domainData
    )
 
   // basicOrderParams.offererConduitKey = "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000"
  //basicOrderParams.signature= "0x5c8a6fd29db37f9b53fcf1cce21c62e68ca0684c28e0320cb27e8568210baf37644e1258430b698cfe533334621ddd82a12e46dd184823ab318b8ee6ff0fa2dd1c"

    //this address needs to approve the forwarder on tellerv2
  //  lenderAddress =  "0xF4dAb24C52b51cB69Ab62cDE672D3c9Df0B39681"
  

    if((basicOrderParams.basicOrderType) > 22){
      throw new Error('invalid basic order type')
    }


    let url = "http://localhost:8000/v2/offers"
    let data = {
      submitBidArgs: formattedSubmitBidArgs,
      basicOrderParams,
      domainData,
      borrowerSignature
    }


      const recoveredSigner = recoverSignerOfOffchainOffer(
      formattedSubmitBidArgs,
      basicOrderParams,
      domainData,
      borrowerSignature
    );
 

    let postResponse = await axios.post( url, data )
 
  
   
    return true 
  }
  
  

  
