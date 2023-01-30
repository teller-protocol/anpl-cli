







import { recoverSignerOfOffchainOffer } from '@clarity-credit/anpl-sdk'
import axios from 'axios'
import { toChecksumAddress } from 'ethereumjs-util'
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'

import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper'
import { createReservoirOrder } from '../lib/reservoir-helper'
 
 
import { AdditionalRecipient, AdditionalRecipientResponse, BasicOrderParams, DomainData, ReservoirOrder, ReservoirOrderRawData, SubmitBidArgs } from '../lib/types'

require('dotenv').config()

 
const sellerPrivateKey = process.env.SELLER_PRIVATE_KEY!
  


let contractsConfig = require('../data/contractsConfig.json')[networkName]


const rpcURI = getRpcUrlFromNetworkName(networkName) 
 
 
const networkName = 'goerli'
 
const chainId = "5"
 
  

const WETH_ADDRESS = ""

export async function createReservoirListing(): Promise<any> {




    //---------------------

    const nftTokenAddress=""

    const nftTokenId=""

    const listingPriceWei="1000"

    //---------------------



    
    let rpcProvider = new providers.JsonRpcProvider( rpcURI )
   
    const sellerWallet = new Wallet(sellerPrivateKey, rpcProvider)

    const sellerAddress = sellerWallet.address

    


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