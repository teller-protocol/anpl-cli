import { AssertionResponse } from 'degen-route-loader'
import {
  bufferToHex,
  ecrecover,
  ecsign,
  pubToAddress,
  toBuffer,
  toRpcSig,
} from 'ethereumjs-util'
import { BigNumber, utils, Wallet } from 'ethers'
import {
  BasicOrderParams,
  DomainData,
  SubmitBidArgs,
} from 'server/interfaces/types'

require('dotenv').config()

const PRIVATE_KEY = process.env.PRIVATE_KEY!

if (!PRIVATE_KEY) {
  throw new Error('Missing PRIVATE_KEY')
}
 

export async function craSign(
  submitBidArgs: SubmitBidArgs,
  basicOrderParams: BasicOrderParams,
  chainId: number,
  signatureVersion: number,
  implementationContractAddress:string,
  wallet:Wallet,
  verbose?: boolean
): Promise<AssertionResponse> {
  switch (signatureVersion) {
    case 3:
      return await craSignVersion3(
        submitBidArgs,
        basicOrderParams,
        chainId,
        implementationContractAddress,
        wallet,
        verbose
      )
    case 2:
      return await craSignVersion2(
        submitBidArgs,
        basicOrderParams,
        chainId,
        implementationContractAddress,
        wallet,
        verbose
      )
    default:
      return {
        success: false,
        error: `Invalid signature version requested: ${signatureVersion}`,
      }
  }
}

function getDomainData(chainId: number, versionString: string, verifyingContractAddress:string): DomainData {
  //let chainId = (tellerInputs.chainId);
 

  const abiCoder = new utils.AbiCoder()

  const domainString = utils.keccak256(
    utils.toUtf8Bytes(
      'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
    )
  )

  const domainData: DomainData = {
    name: 'Teller_BNPL_Market',
    version: versionString,
    chainId,
    verifyingContract: verifyingContractAddress //networkConfig.bnplContractImplementationAddressV3,
  }
 

  const domainSeparator = utils.keccak256(
    abiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        domainString,
        utils.keccak256(utils.toUtf8Bytes(domainData.name)),
        utils.keccak256(utils.toUtf8Bytes(domainData.version)),
        domainData.chainId,
        domainData.verifyingContract,
      ]
    )
  )

  const TypedDataEncoder = utils._TypedDataEncoder

  const hashDomain = TypedDataEncoder.hashDomain(domainData)

  if (hashDomain != domainSeparator) {
    throw new Error('domainhash mismatch')
  }

  return domainData
}

export async function craSignVersion2(
  submitBidArgs: SubmitBidArgs,
  basicOrderParams: BasicOrderParams,
  chainId: number,
  implementationContractAddress:string,
  wallet:Wallet,
  verbose?: boolean
): Promise<AssertionResponse> {
  
 
  const domainData = getDomainData(chainId,"1.0",implementationContractAddress)

  if (verbose) {
    console.log('about to sign', submitBidArgs, basicOrderParams)
  }

  // The named list of all type definitions
  const types = {
    inputs: [
      { name: 'offerToken', type: 'address' },
      { name: 'offerIdentifier', type: 'uint256' },
      { name: 'offerAmount', type: 'uint256' },
      { name: 'totalPurchasePrice', type: 'uint256' },
      { name: 'considerationToken', type: 'address' },
      { name: 'principal', type: 'uint256' },
      { name: 'downPayment', type: 'uint256' },
      { name: 'duration', type: 'uint32' },
      { name: 'interestRate', type: 'uint16' },
    ],
  }

  // The data to sign
  const values = {
    offerToken: basicOrderParams.offerToken, //nft contract address
    offerIdentifier: basicOrderParams.offerIdentifier, //nft token id

    offerAmount: basicOrderParams.offerAmount, //quantity of nft

    totalPurchasePrice: submitBidArgs.totalPurchasePrice,

    considerationToken: basicOrderParams.considerationToken, //payment token

    principal: submitBidArgs.principal,
    downPayment: submitBidArgs.downPayment,

    duration: submitBidArgs.duration,

    interestRate: submitBidArgs.interestRate,
  }

  const TypedDataEncoder = utils._TypedDataEncoder

  const codedMessage = TypedDataEncoder.encode(domainData, types, values)

  const digest = utils.keccak256(codedMessage)

  const codedHash = TypedDataEncoder.hash(domainData, types, values)

  const hashStruct = TypedDataEncoder.hashStruct('inputs', types, values)

  if (verbose) {
    console.log({ hashStruct })

    console.log({ digest })
  }

  if (digest != codedHash) {
    throw new Error('Digest mismatch')
  }

  const msgBuffer = toBuffer(digest)

  const sig = ecsign(msgBuffer, toBuffer(wallet.privateKey))

  const pubKey = ecrecover(msgBuffer, sig.v, sig.r, sig.s)
  const addrBuf = pubToAddress(pubKey)
  const recoveredSignatureSigner = bufferToHex(addrBuf)

  if (recoveredSignatureSigner.toLowerCase() != wallet.address.toLowerCase()) {
    console.error(
      'recovered sig mismatched ',
      recoveredSignatureSigner,
      wallet.address
    )
    return { success: false, error: 'Signature mismatch.' }
  }

  const craSignature = toRpcSig(sig.v, sig.r, sig.s)

  if (verbose) {
    console.log({ recoveredSignatureSigner })
    console.log({ craSignature })
  }

  //const final_list: CraResponse = Object.assign({}, signature, input);
  return { success: true, data: craSignature }
}

export async function craSignVersion3(
  submitBidArgs: SubmitBidArgs,
  basicOrderParams: BasicOrderParams,
  chainId: number,
  implementationContractAddress:string,
  wallet:Wallet,
  verbose?: boolean
): Promise<AssertionResponse> {
  
 
    console.log({implementationContractAddress})
  const domainData = getDomainData(chainId,"3.0",implementationContractAddress)

  if (verbose) {
    console.log('about to sign', submitBidArgs, basicOrderParams)
  }

  // The named list of all type definitions
  const types = {
    inputs: [
      { name: 'offerToken', type: 'address' },
      { name: 'offerIdentifier', type: 'uint256' },
      { name: 'offerAmount', type: 'uint256' },
      { name: 'totalPurchasePrice', type: 'uint256' },
      { name: 'considerationToken', type: 'address' },
      { name: 'principal', type: 'uint256' },
      { name: 'downPayment', type: 'uint256' },
      { name: 'duration', type: 'uint32' },
      { name: 'interestRate', type: 'uint16' },
      { name: 'signatureExpiration', type: 'uint32' },
    ],
  }

  // The data to sign
  const values = {
    offerToken: basicOrderParams.offerToken, //nft contract address
    offerIdentifier: basicOrderParams.offerIdentifier, //nft token id

    offerAmount: basicOrderParams.offerAmount, //quantity of nft

    totalPurchasePrice: submitBidArgs.totalPurchasePrice,

    considerationToken: basicOrderParams.considerationToken, //payment token

    principal: submitBidArgs.principal,
    downPayment: submitBidArgs.downPayment,

    duration: submitBidArgs.duration,

    interestRate: submitBidArgs.interestRate,

    signatureExpiration: submitBidArgs.signatureExpiration,
  }

  const TypedDataEncoder = utils._TypedDataEncoder

  const codedMessage = TypedDataEncoder.encode(domainData, types, values)

  const digest = utils.keccak256(codedMessage)

  const codedHash = TypedDataEncoder.hash(domainData, types, values)

  const hashStruct = TypedDataEncoder.hashStruct('inputs', types, values)

  if (verbose) {
    console.log({ domainData })
    console.log({ hashStruct })

    console.log({ digest })
  }

  if (digest != codedHash) {
    throw new Error('Digest mismatch')
  }

  const msgBuffer = toBuffer(digest)

  const sig = ecsign(msgBuffer, toBuffer(wallet.privateKey))

  const pubKey = ecrecover(msgBuffer, sig.v, sig.r, sig.s)
  const addrBuf = pubToAddress(pubKey)
  const recoveredSignatureSigner = bufferToHex(addrBuf)

  if (recoveredSignatureSigner.toLowerCase() != wallet.address.toLowerCase()) {
    console.error(
      'recovered sig mismatched ',
      recoveredSignatureSigner,
      wallet.address
    )
    return { success: false, error: 'Signature mismatch.' }
  }

  const craSignature = toRpcSig(sig.v, sig.r, sig.s)

  if (verbose) {
    console.log({ recoveredSignatureSigner })
    console.log({ craSignature })
  }

  //const final_list: CraResponse = Object.assign({}, signature, input);
  return { success: true, data: craSignature }
}
