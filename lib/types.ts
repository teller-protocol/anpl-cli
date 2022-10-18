import { BigNumber } from "ethers";


export interface DomainData {
  name: string
  version: string
  chainId: number
  verifyingContract: string
}


export interface SubmitBidArgs {
  lender: string
  totalPurchasePrice: string
  principal: string
  downPayment: string
  duration: string
  signatureExpiration: string
  interestRate: string
  referralAddress: string
  metadataURI: string 
}
 

/*
         address lender;
        uint256 totalPurchasePrice;
        uint256 principal;
        uint256 downPayment;
        uint32 duration;
        uint32 signatureExpiration;
        uint16 interestRate;
        address referralAddress;
        string metadataURI;    
*/


export interface CraResponse {
  craSignature: string;
  openSeaResponse: OpenseaResponse;
  submitBidArgs: SubmitBidArgs;
  basicOrderParams: BasicOrderParams
}




export interface OpenseaResponse {
  //nftPrice: string;
  parameters: OpenseaResponseParameters
  signature: string;
}

export interface OpenseaResponseParameters {
  //nftPrice: string;
  consideration: Consideration[];
  parameterOrderType: number;
  offerer: string;
  zone: string;
  offer: Consideration[];
  startTime: string;
  endTime: string;
  orderType: number;
  zoneHash: string;
  salt: string;
  totalOriginalConsiderationItems?: string,
  offererConduitKey: string;
}

export interface Consideration {
  token:string,
  identifierOrCriteria: string,
  startAmount: string,
  endAmount: string,
  itemType: number

}
  
/*
export interface TellerInputs {
  assetContractAddress: string;
  assetTokenId: string;

  lenderAddress: string;
  downPayment: string;
  loanRequired: string;
  interestRate: string;
  duration: string;
  chainId: number;
}

*/

  export interface ContractsConfig {

    BNPLContract: {
        address:string

    }

  }

  export interface BasicOrderParams {
    considerationToken: string,
    considerationIdentifier: BigNumber,
    considerationAmount: BigNumber,
    offerer: string,
    zone: string,
    offerToken: string,
    offerIdentifier:BigNumber,
    offerAmount: string,
    basicOrderType: number,
    startTime: BigNumber,
    endTime: BigNumber,
    zoneHash: string,
    salt: string,
    offererConduitKey: string,
    fulfillerConduitKey: string,
    totalOriginalAdditionalRecipients: BigNumber,
    additionalRecipients:object[],
    signature: string
 }


 export interface ExecuteParams {

    submitBidArgs: SubmitBidArgs,
    basicOrderParams: BasicOrderParams,
    craSignature: string 

 }
 