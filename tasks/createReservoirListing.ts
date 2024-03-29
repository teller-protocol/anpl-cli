

 
import axios from 'axios'
import { toChecksumAddress } from 'ethereumjs-util'
import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'

import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper'
import { createReservoirOrder, signReservoirOrder, submitSignedReservoirOrder } from '../lib/reservoir-helper'
 
 
import { AdditionalRecipient, AdditionalRecipientResponse, BasicOrderParams, DomainData, ReservoirOrder, ReservoirOrderRawData, SubmitBidArgs } from '../lib/types'

require('dotenv').config()

const ERC721ABI = require('../abi/ERC721.abi.json')
 
const sellerPrivateKey = process.env.SELLER_PRIVATE_KEY!
  

const networkName = 'mainnet'
 
const chainId = "1"
 

let contractsConfig = require('../data/contractsConfig.json')[networkName]

const rpcURI = getRpcUrlFromNetworkName(networkName) 

const WETH_ADDRESS = contractsConfig.weth.address
const USDC_ADDRESS = contractsConfig.usdc.address

const reservoirMarketConduit = "0x1e0049783f008a0085193e00003d00cd54003c71"

export async function createReservoirListing(): Promise<any> {




    //---------------------

    const nftTokenAddress="0xf8b0a49da21e6381f1cd3cf43445800abe852179"

    const nftTokenId="3439"

    const listingPriceUsdcRaw = (50 * 1000000).toString()

    //---------------------



    
    let rpcProvider = new providers.JsonRpcProvider( rpcURI )
   
    const sellerWallet = new Wallet(sellerPrivateKey, rpcProvider)

    const sellerAddress = sellerWallet.address


    console.log({USDC_ADDRESS})

    const orderResponse:any = await createReservoirOrder(
        {chainId:parseInt(chainId),
         maker: sellerAddress,
         currency: USDC_ADDRESS,
         tokenAddress: nftTokenAddress,
         tokenId: nftTokenId,
         priceRaw: listingPriceUsdcRaw         
        })

    console.log({orderResponse})
 
    const steps = orderResponse.data.steps


    let signatureStep = steps['order-signature'] 
    console.log(JSON.stringify(signatureStep))
    
    const orderData = signatureStep.items[0].data
        
    //eip712 sign with wallet
    const signature = await signReservoirOrder( orderData.sign , sellerWallet )

    orderData.signature = signature 

    console.log({signature})
    

    const signatureResponse:any = await submitSignedReservoirOrder(
        {orderData}
    )

    const orderId = signatureResponse.data.orderId
    console.log({orderId}) 

    let approvalStep = steps['nft-approval']  

    console.log({approvalStep})
    console.log(JSON.stringify(approvalStep))

    const hasBeenApproved = approvalStep.items[0].status == 'complete'
        //use rpc 
    if(!hasBeenApproved){

        let nftContract = new Contract(nftTokenAddress,ERC721ABI,sellerWallet)
    
        let approval = await nftContract.setApprovalForAll(reservoirMarketConduit, true)
    
        console.log({approval}) 

    }



    return orderResponse

// orderid 0x8439ab6c7391d8d5d97aa79a496e44afcd7ad4e3a0b7d9b7e18502918b63033e
  }