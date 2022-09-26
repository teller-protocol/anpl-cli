

export function networkNameFromChainId(chainId:number){

    if(typeof(chainId) != 'number'){
        throw new Error('Chain id must be a number')
    }
    switch(chainId){

        case 1: return 'mainnet'
        case 4: return 'rinkeby'
        case 5: return 'goerli'

        default: return '?'
    }
}


export function getRpcUrlFromNetworkName(networkName:string){

    switch(networkName.toString()){

        case 'mainnet' : return process.env.MAINNET_RPC_URL
        case 'goerli' : return process.env.GOERLI_RPC_URL
        case 'rinkeby' : return process.env.RINKEBY_RPC_URL

        default:  return process.env.GOERLI_RPC_URL

    }
   

}