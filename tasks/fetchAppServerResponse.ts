

import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'
import fs from 'fs'
import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper';
 
import { buildExecuteParams, readSignatureVersionFromBNPLMarketContract } from '../lib/bnpl-helper';

import { axiosGetRequest } from '../lib/axios-helper';


let tokenInputData = require('../data/tokenInputData.json')
let networkName = networkNameFromChainId( tokenInputData.chainId  )
let contractsConfig = require('../data/contractsConfig.json')[networkName]


const rpcURI = getRpcUrlFromNetworkName(networkName) 



//fork mainnet on tenderly to do this 
 
const bnplConfig = {
    address: contractsConfig.BNPLContract.address,
    abi: require('../abi/BNPLMarket.json')
  }



export async function fetchAppServerResponse(): Promise<any> {

  let rpcProvider = new providers.JsonRpcProvider( rpcURI )
    
 // let tellerV2Instance = new Contract(tellerV2Config.address,tellerV2Config.abi, rpcProvider)
  let bnplContractInstance = new Contract(bnplConfig.address,bnplConfig.abi,rpcProvider)

  
 // let signatureVersion = await readSignatureVersionFromBNPLMarketContract(  bnplContractInstance )
  
  const craServerUrl = `https://staging.api.apenowpaylater.com/v2/asset/listings?slugOrAddress=${tokenInputData.tokenAddress}&tokenId=${tokenInputData.tokenId}`

  let craResponse = await axiosGetRequest( craServerUrl , {} , { 'Accept-Encoding': 'application/json',})

  if(!craResponse.success || !craResponse.data) throw new Error('cra error '.concat(craResponse.error.toString()))
  

  ////this data will have the basicOrderParams inside 
 
  let outputData =   craResponse.data.result
 
  console.log('output ', JSON.stringify(outputData) )


  const basicOrderParams = outputData.basicOrderParams

  const submitBidArgs = {




  }


  //generate the signature(s) -- use them for contract tests -- 




  /*
  try {
    fs.writeFileSync('data/craResponse.json', JSON.stringify(outputData) );
  } catch (err) {
    console.error(err);
  }*/
  
  
 
  return outputData 
}

