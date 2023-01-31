
import axios from 'axios'
import { BigNumber, Signer } from 'ethers'
import { AdditionalRecipient, BasicOrderParams, BasicOrderParamsResponse, ReservoirOrder, SeaportProtocolData, SeaportProtocolParameters } from './types'

require('dotenv').config()

const RESERVOIR_API_KEY = process.env.RESERVOIR_API_KEY!



  export async function createReservoirOrder(
    {chainId, maker, currency, tokenAddress, tokenId, priceRaw }:
    {chainId?:number,
     maker:string,
     currency:string,
     tokenAddress:string,
     tokenId:string,
     priceRaw:string
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
          weiPrice: priceRaw,
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
    {orderId,
      chainId,
      customEndpointUrl
    }:{
      orderId:string,
      chainId?:number,
      customEndpointUrl?:string
    }
    ) : Promise<any> {
    
    let reservoirApiUrl = chainId==5 ? new URL('https://api-goerli.reservoir.tools/orders/asks/v4') : new URL('https://api.reservoir.tools/orders/asks/v4')
 
    const apiUrl  = customEndpointUrl ? new URL(customEndpointUrl) : new URL(reservoirApiUrl)

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
