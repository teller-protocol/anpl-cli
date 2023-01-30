







import { recoverSignerOfOffchainOffer } from '@clarity-credit/anpl-sdk'
import axios from 'axios'
import { toChecksumAddress } from 'ethereumjs-util'
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'

import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper'
 
 
import { AdditionalRecipient, AdditionalRecipientResponse, BasicOrderParams, DomainData, ReservoirOrder, ReservoirOrderRawData, SubmitBidArgs } from '../lib/types'

require('dotenv').config()

 
const sellerPrivateKey = process.env.SELLER_PRIVATE_KEY!
  


const networkName = 'goerli'
 
let contractsConfig = require('../data/contractsConfig.json')[networkName]


const rpcURI = getRpcUrlFromNetworkName(networkName) 
 
 
const chainId = "5"
 
 

/*

Test w tenderly test RPC  

*/

const WETH_ADDRESS = ""

export async function createReservoirListing(): Promise<any> {

    
    let rpcProvider = new providers.JsonRpcProvider( rpcURI )
   
    const sellerWallet = new Wallet(sellerPrivateKey, rpcProvider)

    const sellerAddress = sellerWallet.address

    

    //---------------------

    const nftTokenAddress=""

    const nftTokenId=""

    const listingPriceWei="1000"

    //---------------------




    const orderResponse:ReservoirOrder|undefined = await createReservoirOrder(
        {chainId:parseInt(chainId),
         maker: sellerAddress,
         currency: WETH_ADDRESS,
         tokenAddress: nftTokenAddress,
         tokenId: nftTokenId,
         weiPrice: listingPriceWei       
        
        }
        )

    console.log({orderResponse})
 



    return orderResponse


  }