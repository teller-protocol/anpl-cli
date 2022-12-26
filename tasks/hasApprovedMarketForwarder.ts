
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'
import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper'
import { axiosPostRequest } from '../lib/axios-helper'
import { buildExecuteParams, calculateTotalPrice, performCraRequest, readSignatureVersionFromBNPLMarketContract } from '../lib/bnpl-helper'
import { BasicOrderParams, SubmitBidArgs } from '../lib/types'

require('dotenv').config()

const borrowerPrivateKey = process.env.BORROWER_PRIVATE_KEY

const lenderPrivateKey = process.env.LENDER_PRIVATE_KEY
 

const executeConfig = {
   
  marketplaceId: 1

} 

 
let networkName = 'mainnet'
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



export async function hasApprovedMarketForwarder(): Promise<any> {
 

    let rpcProvider = new providers.JsonRpcProvider( rpcURI )
    
    let tellerV2Instance = new Contract(tellerV2Config.address,tellerV2Config.abi, rpcProvider)
    let bnplContractInstance = new Contract(bnplConfig.address,bnplConfig.abi,rpcProvider)
 

    if(!borrowerPrivateKey) throw new Error('Missing borrowerPrivateKey')


    if(!lenderPrivateKey) throw new Error('Missing lenderPrivateKey')
  
    let borrowerAddress = "0x810E096DDa9ae3Ae2b55a9c45068F9FE8eeea6db"
    let lenderAddress = "0x810E096DDa9ae3Ae2b55a9c45068F9FE8eeea6db"

 
    let lenderHasApproved = await tellerV2Instance.hasApprovedMarketForwarder(executeConfig.marketplaceId, bnplContractInstance.address, lenderAddress)
    console.log('lender has approved BNPL as forwarder: ',lenderHasApproved, lenderAddress)

    if(!lenderHasApproved) {
        console.error(`ERROR: lender ${lenderAddress} has not approved bnpl as forwarder `)
        return 
    } 
  
    console.log('lenderHasApproved',lenderHasApproved) 

    let borrowerHasApproved = await tellerV2Instance.hasApprovedMarketForwarder(executeConfig.marketplaceId, bnplContractInstance.address, borrowerAddress)
    console.log('lender has approved BNPL as forwarder: ',borrowerHasApproved, borrowerAddress)

    if(!borrowerHasApproved) {
        console.error(`ERROR: lender ${borrowerAddress} has not approved bnpl as forwarder `)
        return 
    }
 
    console.log('borrowerHasApproved',borrowerHasApproved)
      
   
    return true 
  }
  
  

  
