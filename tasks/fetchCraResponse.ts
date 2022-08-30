
import fs from 'fs'
import { axiosPostRequest } from '../lib/axios-helper';
import { buildExecuteParams } from '../lib/bnpl-helper';

export async function fetchCraResponse(): Promise<any> {

  let inputData = require('../data/craParams.json')

  //inputData.lenderAddress = "0xF4dAb24C52b51cB69Ab62cDE672D3c9Df0B39681"

  //let contractsConfig = require('../data/contractsConfig.json')['rinkeby']

  let response = await axiosPostRequest(inputData.craServerURL,{
    asset_contract_address:inputData.contractAddress,
    token_id:inputData.tokenId,
    chain_id:inputData.chainId,
    signature_version: 3
  })

  if(!response.success || !response.data) throw new Error('cra error '.concat(response.error.toString()))
 

  let outputData = buildExecuteParams( response.data  )


  try {
    fs.writeFileSync('data/craResponse.json', JSON.stringify(outputData) );
  } catch (err) {
    console.error(err);
  }
    console.log('output ', outputData )
  
 
  return outputData 
}

