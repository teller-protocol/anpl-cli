
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'
import { calculateTotalPrice } from '../lib/bnpl-helper'
import { BasicOrderParams } from '../lib/types'

require('dotenv').config()


const rpcURI = process.env.GOERLI_RPC_URL
const privateKey = process.env.WALLET_PRIVATE_KEY


const executeConfig = {
  networkName: "goerli",
  marketplaceId: 2

}
//const networkName = "goerli"

//const marketplaceId = 2



let contractsConfig = require('../data/contractsConfig.json')[executeConfig.networkName]


//was 0x519b957ecaa80C5aEd4C5547Ff2Eac3ff5dE229c
const tellerV2Config = {
    address: contractsConfig.tellerV2.address,
    abi: require('../abi/TellerV2.json')
}

const bnplConfig = {
    address: contractsConfig.BNPLContract.address,
    abi: require('../abi/BNPLMarket.json')
  }



export async function callExecute(): Promise<any> {

    let executeParams:any  = require('../data/craResponse.json')


    let rpcProvider = new providers.JsonRpcProvider( rpcURI )
    
    let tellerV2Instance = new Contract(tellerV2Config.address,tellerV2Config.abi, rpcProvider)
    let bnplContractInstance = new Contract(bnplConfig.address,bnplConfig.abi,rpcProvider)

    if(!privateKey) throw new Error('Missing privateKey')

    let wallet = new Wallet(privateKey).connect(rpcProvider)
 
  console.log(`calling execute using account ${wallet.address}`)
 

 
   const submitBidArgs = executeParams.submitBidArgs



   let value:BigNumber = BigNumber.from(submitBidArgs.downPayment)  //calculateTotalPrice( executeParams.basicOrderParams )

     

   let lenderAddress = submitBidArgs.lender

   let basicOrderParams:BasicOrderParams = executeParams.basicOrderParams

   if(!basicOrderParams.offererConduitKey){
     throw new Error('Missing offererConduitKey')
   }

    //let borrowerAddress = wallet.address

    let isApproved = await tellerV2Instance.hasApprovedMarketForwarder(executeConfig.marketplaceId, bnplContractInstance.address, lenderAddress)
    console.log('lender has approved BNPL as forwarder: ',isApproved)

    if(!isApproved) {
        console.error(`ERROR: lender ${lenderAddress} has not approved bnpl as forwarder `)
        return 
    }


    let domainSeparator = await bnplContractInstance.DOMAIN_SEPARATOR()
    console.log({domainSeparator})
 


    if( domainSeparator !=  contractsConfig.BNPLContract.domainSeparator){
      throw new Error('Invalid domain separator')
  }

   /* let typeHash = await bnplContractInstance.getTypeHash(
      submitBidArgs,
      basicOrderParams.offerToken,
      basicOrderParams.offerIdentifier,
      basicOrderParams.offerAmount,
      submitBidArgs.totalPurchasePrice,
      basicOrderParams.considerationToken
    ) */



   // executeParams.basicOrderParams.additionalRecipients = [ ]


      //fix it for now to remove referral and sig expir
      let formattedSubmitBidArgs = {
        lender: submitBidArgs.lender,
        totalPurchasePrice: submitBidArgs.totalPurchasePrice,
        principal: submitBidArgs.principal,
        downPayment: submitBidArgs.downPayment,
        duration: submitBidArgs.duration,
        signatureExpiration: submitBidArgs.signatureExpiration,
        interestRate:submitBidArgs.interestRate,
        metadataURI: submitBidArgs.metadataURI ,
     //   referralAddress:"0x0000000000000000000000000000000000000000"
      }


    console.log('passing in params',
    formattedSubmitBidArgs, 
    basicOrderParams, 
    executeParams.craSignature 
  )

      /*
       address lender;
        uint256 totalPurchasePrice;
        uint256 principal;
        uint256 downPayment;
        uint32 duration;
        uint32 signatureExpiration;
        uint16 interestRate;
        string metadataURI;
      */

    //this address needs to approve the forwarder on tellerv2
  //  lenderAddress =  "0xF4dAb24C52b51cB69Ab62cDE672D3c9Df0B39681"

    //Set price to 1 Gwei
    let gasPrice = utils.hexlify(8000000000);
    //Set max gas limit to 4M
    var gasLimit = utils.hexlify(25000000);


    console.log('meep1',value)

    let unsignedTx = await bnplContractInstance
    .populateTransaction
    .execute(
      formattedSubmitBidArgs, 
      basicOrderParams, 
      executeParams.craSignature , {value, gasLimit, gasPrice} )


    console.log('meep2')

    console.log({unsignedTx})

    let response = await wallet.sendTransaction(unsignedTx);
    console.log('response',response)
         //erc20 low level call failed (weth approval )->sending weth from lender 
    
   
    return true 
  }
  
  

  
