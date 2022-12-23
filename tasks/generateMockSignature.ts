

import {Contract, Wallet, providers, utils, BigNumber, ethers} from 'ethers'
import fs from 'fs'
import { getRpcUrlFromNetworkName, networkNameFromChainId } from '../lib/app-helper';
 
import { buildExecuteParams, readSignatureVersionFromBNPLMarketContract } from '../lib/bnpl-helper';

import { axiosGetRequest } from '../lib/axios-helper';
import { BasicOrderParams, DomainData, SubmitBidArgs } from '../lib/types';
import { signOffchainOffer } from '@clarity-credit/anpl-sdk';
import { AdditionalRecipient } from '@clarity-credit/anpl-sdk/types/types';


 

//fork mainnet on tenderly to do this 
 
 



  //use with _recoverSignature_test 

export async function generateMockSignature(): Promise<any> {


  const chainId = 1;
  const implementationContractAddress = "0x5F96A3cc1b95a3F521f2CB89d20F06D2F48c2477"

  

  let borrowerWallet = Wallet.createRandom() 
  let lenderWallet = Wallet.createRandom() 

  /*

      _submitBidArgs,
      _basicOrderParameters.offerToken, // token contract address
      _basicOrderParameters.offerIdentifier, // token ID
      _basicOrderParameters.offerAmount, // quantity
      _submitBidArgs.totalPurchasePrice, // base price
      paymentToken
      
  */

  const submitBidArgs:SubmitBidArgs = {
    borrower: borrowerWallet.address,
    lender: lenderWallet.address,
    totalPurchasePrice: '1000000000000000',
    principal: '526592943654555',
    downPayment: '500000000000000',
    duration: '7776000',
    interestRate: '1000',
    signatureExpiration: '1659383735',    
    referralAddress: '0x0000000000000000000000000000000000000000',
    metadataURI: 'ipfs://',
    marketId: '2'
  }


  const additionalRecipients:AdditionalRecipient[] = [

    {
      amount: BigNumber.from('0x2d79883d2000'),
      recipient:"0x8De9C5A032463C561423387a9648c5C7BCC5BC90"
    },
    {
        amount:BigNumber.from('0xb5e620f48000'), 
        recipient:"0xC2A6DD3003C630295a37aB2d265608638009b6D1"
    }

  ]

  const basicOrderParams:BasicOrderParams =  {
    considerationToken: '0x0000000000000000000000000000000000000000',  //eth - payment token 
    considerationIdentifier: BigNumber.from(0),
    considerationAmount: BigNumber.from(1750000000000000),
    offerer: '0xddcf8980a9e133f4c545669b4ead5e9c718d0100',
    zone: '0x004C00500000aD104D7DBd00e3ae0A5C00560C00',
    offerToken: '0x51546677935B48c598Ab1a2D259229C5Edb7Ff9c',
    offerIdentifier: BigNumber.from('0'),
    offerAmount: '1',
    basicOrderType: 7,
    startTime: BigNumber.from(1659551731),
    endTime: BigNumber.from(1659638131),
    zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    salt: '0x16e7a576e11f0e',
    offererConduitKey: '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000',
    fulfillerConduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
    totalOriginalAdditionalRecipients: BigNumber.from(2),
    additionalRecipients ,
    signature: '0xcab4b0d9ceab25e9db883fdcf9957e3d5b43f00ced22b0e164ce65b1786208be6826c58f58f94a0c90392208edd799e015a1073eeffcf8d87f51ceeb510a145d1b'
  }

 
  let domainData:DomainData = {
    name: "Teller_BNPL_Market",
    version: "3.4",
    chainId,
    verifyingContract: implementationContractAddress
  }

  

  //a method from the sdk 
  const borrowerSignature = await signOffchainOffer({
    submitBidArgs,
    //@ts-ignore
    basicOrderParams,
    domainData,
    signer: borrowerWallet
  })

  //output domain hash 

  const outputData = {
    basicOrderParams,
    submitBidArgs,
    borrowerSignature //maybe this isnt here ? 
  }


 

  const TypedDataEncoder = utils._TypedDataEncoder;

  const hashDomain = TypedDataEncoder.hashDomain(domainData);


  console.log({outputData})
  console.log({hashDomain})
  //generate the signature(s) -- use them for contract tests -- 
  // use this for _recoverSignature_test() on BNPLMarket_Test.sol 




  /*
  try {
    fs.writeFileSync('data/craResponse.json', JSON.stringify(outputData) );
  } catch (err) {
    console.error(err);
  }*/
  
  
 
  return outputData 
}

