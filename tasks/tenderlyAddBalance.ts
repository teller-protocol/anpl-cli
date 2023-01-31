




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

 

const networkName = 'mainnet'
 
let contractsConfig = require('../data/contractsConfig.json')[networkName]


const rpcURI = getRpcUrlFromNetworkName(networkName) 
 
 

export async function tenderlyAddBalance(): Promise<any> {

    const walletAddress ="0xB11ca87E32075817C82Cc471994943a4290f4a14"

    let provider = new providers.JsonRpcProvider( rpcURI )

    const params = [
        [walletAddress],
        ethers.utils.hexValue(100) // hex encoded wei amount
    ];
    
    const addBalance = await provider.send('tenderly_addBalance', params)

    console.log({addBalance})

    
}

