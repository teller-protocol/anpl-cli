
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'
import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper'
import { calculateTotalPrice } from '../lib/bnpl-helper'
import { BasicOrderParams } from '../lib/types'

require('dotenv').config()

 
const borrowerPrivateKey = process.env.BORROWER_PRIVATE_KEY
const lenderKey = process.env.LENDER_PRIVATE_KEY


const executeConfig = {
  chainId: 5, //goerli 
  marketplaceId: 3
} 


let networkName = networkNameFromChainId( executeConfig.chainId  )
let contractsConfig = require('../data/contractsConfig.json')[networkName]

 
const tellerV2Config = {
    address: contractsConfig.tellerV2.address,
    abi: require('../abi/TellerV2.json')
}

const bnplConfig = {
    address: contractsConfig.BNPLContract.address,
    abi: require('../abi/BNPLMarket.json')
  }



export async function approveMarket(): Promise<any> {

    //let executeParams:any  = require('../data/craResponse.json')

    const marketId = executeConfig.marketplaceId


    const rpcURI = getRpcUrlFromNetworkName(networkName) 

    let rpcProvider = new providers.JsonRpcProvider( rpcURI )
    
    let tellerV2Instance = new Contract(tellerV2Config.address,tellerV2Config.abi, rpcProvider)
    let bnplContractInstance = new Contract(bnplConfig.address,bnplConfig.abi,rpcProvider)

    if(!borrowerPrivateKey) throw new Error('Missing borrowerPrivateKey')
    if(!lenderKey) throw new Error('Missing lenderKey')

    let marketOwnerWallet = new Wallet(borrowerPrivateKey).connect(rpcProvider)
 
   console.log(`calling approveMarket using account ${marketOwnerWallet.address}`)
 
    let lender = new Wallet(lenderKey).connect(rpcProvider)
 

    console.log('setting trusted market forwarder ')

    let setTrusted = await tellerV2Instance.connect(marketOwnerWallet).setTrustedMarketForwarder(marketId,bnplConfig.address)
    await setTrusted.wait()    
    
    let ownerApproveMarket = await tellerV2Instance.connect(marketOwnerWallet).approveMarketForwarder(marketId,bnplConfig.address)
    await ownerApproveMarket.wait()

    let lenderApproveMarket = await tellerV2Instance.connect(lender).approveMarketForwarder(marketId,bnplConfig.address)
    await lenderApproveMarket.wait()



    let isApproved = await tellerV2Instance.hasApprovedMarketForwarder(executeConfig.marketplaceId, bnplContractInstance.address, lender.address)
    console.log('lender has approved BNPL as forwarder: ',isApproved)

    if(!isApproved) {
        console.error(`ERROR: lender ${lender.address} has not approved bnpl as forwarder `)
        return 
    }

  
    return true 
  }
  
  

  
