

import { Network, Alchemy, NftTokenType } from 'alchemy-sdk'
​
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY




// Optional Config object, but defaults to demo api-key and eth-mainnet.
const settings = {
  apiKey: ALCHEMY_API_KEY, // Replace with your Alchemy API Key.
  network: Network.ETH_MAINNET, // Replace with your network.
}
​
const alchemy = new Alchemy(settings)
​
enum TokenType {
  ERC721,
  ERC1155,
  PUNK,
  UNKNOWN
}

​
export type NftArray = [Array<string>, Array<string>, Array<TokenType>, Array<number>]


/*
yarn task getNFTsOwned -- --bnplMarketAddress=0x260C32eB38D1403bd51B83B5b7047812C70B7845 --punksAddress=0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB



*/

export async function getNFTsOwned( ): Promise<any> {
    

const yargs = require('yargs')
.option('bnplMarketAddress', { 
    default: null,
    type: 'string'
})
.option('punksAddress', { 
    default: null,
    type: 'string'
})
.argv
 
 

    const {bnplMarketAddress,punksAddress} = yargs

    console.log([bnplMarketAddress,punksAddress])

    let response = await getTokensToMigrate( bnplMarketAddress, punksAddress )

    console.log(JSON.stringify(response))

}

​
export async function getTokensToMigrate(bnplMarketAddress: string, punksAddress: string) {
  const nfts = await alchemy.nft.getNftsForOwner(bnplMarketAddress)
  return nfts
    .ownedNfts
    .reduce<NftArray>((arr:any, nft:any) => {
      const addrs   = arr[0]
      const ids     = arr[1]
      const types   = arr[2]
      const amounts = arr[3]
​
      const newArr = (): NftArray => [addrs, ids, types, amounts]
​
      const address = nft.contract.address
      let type: TokenType
      switch (nft.tokenType) {
        case NftTokenType.ERC721:
          type = TokenType.ERC721
          break
        case NftTokenType.ERC1155:
          type = TokenType.ERC1155
          break
        case NftTokenType.UNKNOWN:
          if (address === punksAddress) {
            type = TokenType.PUNK
          } else {
            // unknown
            return newArr()
          }
          break
        default:
            type = TokenType.UNKNOWN
      }
​
      addrs.push(address)
      ids.push(nft.tokenId)
      types.push(type)
      amounts.push(nft.balance)
​
      return newArr()
    }, [[], [], [], []])
}
