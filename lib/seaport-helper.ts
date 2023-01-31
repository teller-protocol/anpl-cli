import { BigNumber } from "ethers"
import { AdditionalRecipient, BasicOrderParams, BasicOrderParamsResponse, SeaportProtocolData, SeaportProtocolParameters } from "./types"


const BLANK_SIGNATURE =
  '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

  
  

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