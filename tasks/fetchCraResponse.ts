

import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'
import fs from 'fs'
import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper';
import { axiosPostRequest } from '../lib/axios-helper';
import { buildExecuteParams, performCraRequest, readSignatureVersionFromBNPLMarketContract } from '../lib/bnpl-helper';




let tokenInputData = require('../data/tokenInputData.json')
let networkName = networkNameFromChainId( tokenInputData.chainId  )
let contractsConfig = require('../data/contractsConfig.json')[networkName]


const rpcURI = getRpcUrlFromNetworkName(networkName) 


//was 0x519b957ecaa80C5aEd4C5547Ff2Eac3ff5dE229c
const tellerV2Config = {
    address: contractsConfig.tellerV2.address,
    abi: require('../abi/TellerV2.json')
}

const bnplConfig = {
    address: contractsConfig.BNPLContract.address,
    abi: require('../abi/BNPLMarket.json')
  }



export async function fetchCraResponse(): Promise<any> {

  let rpcProvider = new providers.JsonRpcProvider( rpcURI )
    
 // let tellerV2Instance = new Contract(tellerV2Config.address,tellerV2Config.abi, rpcProvider)
  let bnplContractInstance = new Contract(bnplConfig.address,bnplConfig.abi,rpcProvider)

  
  let signatureVersion = await readSignatureVersionFromBNPLMarketContract(  bnplContractInstance )

  let craInputs = {
    asset_contract_address:tokenInputData.tokenAddress,
    token_id:tokenInputData.tokenId,
    quantity: tokenInputData.tokenQuantity,

    chain_id:tokenInputData.chainId,    
    signature_version: signatureVersion
  }

  let craResponse = await performCraRequest( craInputs  )

  if(!craResponse.success || !craResponse.data) throw new Error('cra error '.concat(craResponse.error.toString()))
 

  let outputData = buildExecuteParams( craResponse.data  )


  try {
    fs.writeFileSync('data/craResponse.json', JSON.stringify(outputData) );
  } catch (err) {
    console.error(err);
  }
    console.log('output ', outputData )
  
 
  return outputData 
}

