

import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'
import fs from 'fs'
import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper';
 
import { buildExecuteParams, readSignatureVersionFromBNPLMarketContract } from '../lib/bnpl-helper';

import { axiosGetRequest } from '../lib/axios-helper';
import { BasicOrderParams, SubmitBidArgs } from '../lib/types';
import { signOffchainOffer } from '@clarity-credit/anpl-sdk';


 

//fork mainnet on tenderly to do this 
 
 



  //use with _recoverSignature_test 

export async function generateMockSignature(): Promise<any> {

  
  /*  
  

   submitBidArgs.principal = 526592943654555;
        submitBidArgs.downPayment = 500000000000000;
        submitBidArgs.duration = 7776000;
        submitBidArgs.interestRate = 1000;
        submitBidArgs.signatureExpiration = 1659383735;
        submitBidArgs.metadataURI = "ipfs://";

        address assetContractAddress = address(
            0x51546677935B48c598Ab1a2D259229C5Edb7Ff9c
        );
        uint256 assetTokenId = 0;
        uint256 assetQuantity = 1;
        uint256 totalPurchasePrice = 1000000000000000;
        address paymentToken = ETH_ADDRESS;

        bytes32 typeHash = borrower.getTypeHash(
            submitBidArgs,
            assetContractAddress,
            assetTokenId,
            assetQuantity,
            totalPurchasePrice,
            paymentToken
        );



            */

  let borrowerWallet = Wallet.createRandom() 
  let lenderWallet = Wallet.createRandom() 


  const submitBidArgs:SubmitBidArgs = {
    borrower: borrowerWallet.address,
    lender: lenderWallet.address,
    totalPurchasePrice: '100000000000000000',
    principal: '526592943654555',
    downPayment: '50000000000000000',
    duration: '7776000',
    interestRate: '1000',
    signatureExpiration: '1659383735',    
    referralAddress: '0x0000000000000000000000000000000000000000',
    metadataURI: 'ipfs://',
    marketId: '2'
  }


  const basicOrderParams:BasicOrderParams =  {




  }
  
  const borrowerSignature = await signOffchainOffer({
    submitBidArgs,
    basicOrderParams,
    domainData
  })

  const outputData = {
    basicOrderParams,
    submitBidArgs,
    borrowerSignature //maybe this isnt here ? 
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

