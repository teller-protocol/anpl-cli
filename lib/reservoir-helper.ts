
import axios from 'axios'
import { BigNumber, Signer } from 'ethers'
import { AdditionalRecipient, BasicOrderParams, BasicOrderParamsResponse, ReservoirOrder, SeaportProtocolData, SeaportProtocolParameters } from './types'

require('dotenv').config()

const RESERVOIR_API_KEY = process.env.RESERVOIR_API_KEY!

const BLANK_SIGNATURE =
  '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

  

  export async function createReservoirOrder(
    {chainId, maker, currency, tokenAddress, tokenId, weiPrice }:
    {chainId?:number,
     maker:string,
     currency:string,
     tokenAddress:string,
     tokenId:string,
     weiPrice:string
    }
  ): Promise<any> {
 
 
    const apiUrl = chainId==5 ? new URL('https://api-goerli.reservoir.tools/execute/list/v4') : new URL('https://api.reservoir.tools/execute/list/v4')

    const currentSeconds = Math.floor(Date.now() / 1000)
 
    const data = {
      maker,
      params: [
        {
          orderKind:'seaport',
          orderbook:'reservoir',
          automatedRoyalties: false,
          currency:currency.toString(),
          token:`${tokenAddress}:${tokenId}`,
          weiPrice,
          fees:[],
          listingTime: currentSeconds.toString(),
          expirationTime: (currentSeconds+1000000).toString(),
    
        
        }
  
        ]

    }
  
    const headers = {
      'x-api-key': RESERVOIR_API_KEY, 
      'accept':'*/*',
     
    }

    const response = await axios.post(apiUrl.toString(), data, { headers })
   

    console.log({response})

    const stepsArray = response.data.steps

    let steps:any = {}

    stepsArray.map((step:any)=> steps[step.id] = step )

    console.log({steps})

    return {success:true, data: {steps}} 
  }

export async function fetchReservoirOrderById(
    {orderId,chainId}:{orderId:string,chainId?:number}
    ) : Promise<any> {
    
    
 
    const apiUrl = chainId==5 ? new URL('https://api-goerli.reservoir.tools/orders/asks/v4') : new URL('https://api.reservoir.tools/orders/asks/v4')

    apiUrl.searchParams.set('ids', `${orderId}`) 
    apiUrl.searchParams.set('includeRawData', 'true')
  
    const headers = {
      'x-api-key': RESERVOIR_API_KEY, 
      'accept':'*/*',
     
    }
  
    console.log(apiUrl.toString())
    const response = await axios.get(apiUrl.toString(), { headers })
   

    const orders = response.data.orders

    if(!orders || orders.length == 0) return undefined 

    return orders[0]

}

export async function submitSignedReservoirOrder(
  {orderData,chainId}:{orderData:any,chainId?:number}

){
  

  const apiUrl = chainId==5 ? new URL('https://api-goerli.reservoir.tools/order/v3') : new URL('https://api.reservoir.tools/order/v3')

  apiUrl.searchParams.set('signature', `${orderData.signature}`) 

  const order = orderData.post.body.order

  const data = {
     order,
     orderbook:"reservoir"
  }

  const headers = {
    'x-api-key': RESERVOIR_API_KEY, 
    'accept':'*/*'   
  }

  const response = await axios.post(apiUrl.toString(), data, { headers })
 

  console.log({response})

  return {success:true, data:response.data} 

}

export async function signReservoirOrder(orderData:{domain:any,types:any,value:any}, signer:Signer) : Promise<string> {

  //@ts-expect-error
  const sig = await signer._signTypedData(orderData.domain, orderData.types, orderData.value);

  return sig 
}

export function formatReservoirOrder(order: ReservoirOrder): {
    order: ReservoirOrder
    basicOrderParams?: BasicOrderParamsResponse
  } {
 

    if(!order.rawData.consideration){       
        console.error("No consideration within raw data")
        return {order}
    }

    const protocolData: SeaportProtocolData = {
      parameters: {
        consideration: order.rawData.consideration,
        offerer: order.rawData.offerer,
        zone: order.rawData.zone,
        offer: order.rawData.offer,
        startTime: order.rawData.startTime,
        endTime: order.rawData.endTime,
        orderType: order.rawData.orderType,
        zoneHash: order.rawData.zoneHash,
        salt: order.rawData.salt,
        totalOriginalConsiderationItems:
          order.rawData.consideration.length.toString(),
        conduitKey: order.rawData.conduitKey,
  
        parameterOrderType: order.rawData.orderType, //is this correct ? probably.
      },
      signature: order.rawData.signature,
    }
  
    const generatedOrderParams: BasicOrderParams =
      generateBasicOrderParamsFromSeaport(protocolData)
  
    return {
      order: order,
      basicOrderParams: formatBasicOrderParams(generatedOrderParams),
    }
  }


export function generateBasicOrderParamsFromSeaport(
    orderData: SeaportProtocolData
  ): BasicOrderParams {
    const orderParameters: SeaportProtocolParameters = orderData.parameters
  
    const basicOrderParams: BasicOrderParams = {
      considerationToken: orderParameters.consideration[0].token, //payment token
      considerationIdentifier: BigNumber.from(
        orderParameters.consideration[0].identifierOrCriteria
      ), // not sure what significance this has
      considerationAmount: BigNumber.from(
        orderParameters.consideration[0].endAmount
      ), // using the first element in the consideration array as per Andy's suggestion
      offerer: orderParameters.offerer,
      zone: orderParameters.zone,
      offerToken: orderParameters.offer[0].token, //nft_contract
      offerIdentifier: BigNumber.from(
        orderParameters.offer[0].identifierOrCriteria
      ), //token id
      offerAmount: orderParameters.offer[0].endAmount, //quantity
      basicOrderType: getBasicOrderType(
        orderParameters.orderType,
        orderParameters.consideration[0].itemType,
        orderParameters.offer[0].itemType
      ),
  
      startTime: BigNumber.from(orderParameters.startTime),
      endTime: BigNumber.from(orderParameters.endTime),
      zoneHash: orderParameters.zoneHash,
      salt: BigNumber.from(orderParameters.salt).toHexString(),
      offererConduitKey: orderParameters.conduitKey,
      fulfillerConduitKey:
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      totalOriginalAdditionalRecipients: BigNumber.from(
        orderParameters.totalOriginalConsiderationItems
      ).sub(1),
      additionalRecipients: getAdditionalRecipients(orderParameters),
      signature: orderData.signature ? orderData.signature : BLANK_SIGNATURE,
    }
    return basicOrderParams
  }
  


function getAdditionalRecipients(parameters: SeaportProtocolParameters): any[] {
    const recipientsArray: object[] = []
  
    for (let i = 1; i < parameters.consideration.length; i++) {
      const additionalRecipient = {
        amount: BigNumber.from(parameters.consideration[i].endAmount),
        recipient: parameters.consideration[i].recipient,
      }
  
      recipientsArray.push(additionalRecipient)
    }
    return recipientsArray
  }


export function formatBasicOrderParams(
    basicOrderParams: any
  ): BasicOrderParamsResponse {
    return {
      considerationToken: basicOrderParams.considerationToken,
      considerationIdentifier: BigNumber.from(
        basicOrderParams.considerationIdentifier
      ).toString(),
      considerationAmount: BigNumber.from(
        basicOrderParams.considerationAmount
      ).toString(),
      offerer: basicOrderParams.offerer,
      zone: basicOrderParams.zone,
      offerToken: basicOrderParams.offerToken,
      offerIdentifier: BigNumber.from(
        basicOrderParams.offerIdentifier
      ).toString(),
      offerAmount: BigNumber.from(basicOrderParams.offerAmount).toString(),
      basicOrderType: basicOrderParams.basicOrderType,
      startTime: BigNumber.from(basicOrderParams.startTime).toString(),
      endTime: BigNumber.from(basicOrderParams.endTime).toString(),
      zoneHash: basicOrderParams.zoneHash,
      salt: basicOrderParams.salt,
      offererConduitKey: basicOrderParams.offererConduitKey,
      fulfillerConduitKey: basicOrderParams.fulfillerConduitKey,
      totalOriginalAdditionalRecipients: BigNumber.from(
        basicOrderParams.totalOriginalAdditionalRecipients
      ).toString(),
      additionalRecipients: basicOrderParams.additionalRecipients.map(
        (r: AdditionalRecipient) => {
          return {
            amount: BigNumber.from(r.amount).toString(),
            recipient: r.recipient,
          }
        }
      ),
      signature: basicOrderParams.signature,
    }
  }


function getBasicOrderType(
    orderType: number,
    considerationItemType: number,
    offerItemType: number
  ): number {
    let basicOrderRouteType = 10
    //refer to the above enums to understand if else statements
    if (considerationItemType == 0 && offerItemType == 2) {
      basicOrderRouteType = 0
    } else if (
      considerationItemType == 0 &&
      (offerItemType == 3 || offerItemType == 5)
    ) {
      basicOrderRouteType = 1
    } else if (
      considerationItemType == 1 &&
      (offerItemType == 2 || offerItemType == 4)
    ) {
      basicOrderRouteType = 2
    } else if (
      considerationItemType == 1 &&
      (offerItemType == 3 || offerItemType == 5)
    ) {
      basicOrderRouteType = 3
    } else if (
      (considerationItemType == 2 || considerationItemType == 4) &&
      offerItemType == 1
    ) {
      basicOrderRouteType = 4
    } else if (
      (considerationItemType == 3 || considerationItemType == 5) &&
      offerItemType == 1
    ) {
      basicOrderRouteType = 5
    }


const basicOrderType = orderType + 4 * basicOrderRouteType

return basicOrderType
}