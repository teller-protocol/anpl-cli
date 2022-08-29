
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'
import { calculateTotalPrice } from '../lib/bnpl-helper'
import { BasicOrderParams } from '../lib/types'

require('dotenv').config()


const rpcURI = process.env.GOERLI_RPC_URL
const privateKey = process.env.WALLET_PRIVATE_KEY
const lenderKey = process.env.LENDER_PRIVATE_KEY


const executeConfig = {
  networkName: "goerli",
  marketplaceId: 2
} 

const marketId = 2

let contractsConfig = require('../data/contractsConfig.json')[executeConfig.networkName]

 
const tellerV2Config = {
    address: contractsConfig.tellerV2.address,
    abi: require('../abi/TellerV2.json')
}

const bnplConfig = {
    address: contractsConfig.BNPLContract.address,
    abi: require('../abi/BNPLMarket.json')
  }



export async function approveMarket(): Promise<any> {

    let executeParams:any  = require('../data/craResponse.json')


    let rpcProvider = new providers.JsonRpcProvider( rpcURI )
    
    let tellerV2Instance = new Contract(tellerV2Config.address,tellerV2Config.abi, rpcProvider)
    let bnplContractInstance = new Contract(bnplConfig.address,bnplConfig.abi,rpcProvider)

    if(!privateKey) throw new Error('Missing privateKey')
    if(!lenderKey) throw new Error('Missing lenderKey')

    let wallet = new Wallet(privateKey).connect(rpcProvider)
 
   console.log(`calling approveMarket using account ${wallet.address}`)
 
    let lender = new Wallet(lenderKey).connect(rpcProvider)
 

    console.log('setting trusted market forwarder ')

    let setTrusted = await tellerV2Instance.connect(wallet).setTrustedMarketForwarder(marketId,bnplConfig.address)
    await setTrusted.wait()

    
    
    let ownerApproveMarket = await tellerV2Instance.connect(wallet).approveMarketForwarder(marketId,bnplConfig.address)
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
  
  

  
