import { parseFeeMethod, parseHowToCall, parseMetadata, parseSaleKind, WyvernAtomicMatchParameters } from "./opensea-helper"

 
import {BigNumber, Contract, ethers,Wallet} from 'ethers'

import moment from 'moment'

import { NULL_BLOCK_HASH } from 'opensea-js/lib/constants'

import { OpenseaHelper, SignedOrder, UnhashedOrder } from '../lib/opensea-helper'
import { SubmitBidArgs, ContractsConfig, CraResponse, ExecuteParams } from "./types"
import { axiosPostRequest } from "./axios-helper"
 
  
require('dotenv').config() 


const CraServerURL = "https://api.nftnow.one/api/getOrderDetails"

export function performCraRequest( craInputs:any ){
  return axiosPostRequest( CraServerURL, craInputs  )
}

export function calculateTotalPrice( basicOrderParams: any ): BigNumber {
  let amount = BigNumber.from(basicOrderParams.considerationAmount) 


  for(let additionalRecipient of basicOrderParams.additionalRecipients){

    amount = amount.add( BigNumber.from( additionalRecipient.amount )  )
  }


  return amount 
}


    // may be able to remove this method as it does nearly nothing now 

export function buildExecuteParams(inputData:CraResponse ): ExecuteParams {

  inputData.submitBidArgs.metadataURI = "ipfs://"
      
    let outputData : ExecuteParams = {
      submitBidArgs: inputData.submitBidArgs, 
      basicOrderParams: inputData.basicOrderParams,
      craSignature: inputData.craSignature
    }
  
    return  outputData
  }


  export async function readSignatureVersionFromBNPLMarketContract(bnplContract:Contract):Promise<number>{

    let contractVersion:string|undefined = "1.0"

    try{
      contractVersion = await bnplContract.CONTRACT_VERSION()
    }catch(e)
    {
      console.log("could not read contract version")
    } 

    if(contractVersion == "3.0"){
      return 3
    }

    return 2 

  }