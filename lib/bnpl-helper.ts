import { parseFeeMethod, parseHowToCall, parseMetadata, parseSaleKind, WyvernAtomicMatchParameters } from "./opensea-helper"

 
import {BigNumber, Contract, ethers,Signer,Wallet} from 'ethers'

import moment from 'moment'

import { NULL_BLOCK_HASH } from 'opensea-js/lib/constants'

import { OpenseaHelper, SignedOrder, UnhashedOrder } from '../lib/opensea-helper'
import { SubmitBidArgs, ContractsConfig, CraResponse, ExecuteParams, BasicOrderParams } from "./types"
import { axiosPostRequest } from "./axios-helper"
import { craSign } from "./cra-signer"
 
  
require('dotenv').config() 


 
 

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

    if(contractVersion == "1.0"){
      return 2
    }

    return 3

  }

  export async function generateBNPLOrderSignature( 
    submitBidArgs:SubmitBidArgs,
    basicOrderParams:BasicOrderParams,
    wallet: Wallet,
    chainId: number,
    implementationContractAddress: string
    ){

      let signatureVersion = 3

      let signatureResponse = await craSign( 
        submitBidArgs, 
        basicOrderParams, 
        chainId, 
        signatureVersion, 
        implementationContractAddress, 
        wallet, 
        true)


        if(signatureResponse.success){
          return signatureResponse.data 
        }

        return undefined 
    }