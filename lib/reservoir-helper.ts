
import axios from 'axios'

require('dotenv').config()

const RESERVOIR_API_KEY = process.env.RESERVOIR_API_KEY!

export async function fetchReservoirOrderById(
    {orderId}:{orderId:string}
    ) : Promise<any> {
    
 
    const apiUrl = new URL('https://api.reservoir.tools/orders/asks/v4')

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

    return orders

}