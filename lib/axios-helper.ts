import axios from 'axios'
 
require('dotenv').config()

//const NETWORK_NAME = process.env.NETWORK_NAME!;

export async function axiosGetRequest(
  path: string,
  inputs: any,
  headers?: any
): Promise<{ success: boolean; data?: any; error?: any }> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const response: any = await new Promise((resolve, reject) => {
    return axios
      .get(path, {
        params: inputs,
        headers: headers,
      })
      .then(function (res) {
        resolve({ success: true, data: res.data })
      })
      .catch(function (error) {
        console.error(error)
        resolve({ success: false, error })
      })
  })

  if (response) {
    return response
  }

  return { success: false, error: 'Unknown axios request error' }
}

export async function axiosPostRequest(
  path: string,
  inputs: any
): Promise<{ success: boolean; data?: any; error?: any }> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const response: any = await new Promise((resolve, reject) => {
    axios
      .post(path, inputs)
      .then(function (res) {

        let body = res.data 

        if(body){
          resolve({ success: true, data: body.data, error:body.error })
        }else{
          resolve({ success: false, error:"no response from server" })
        }

       
      })
      .catch(function (error) {
        console.error(error)
        resolve({ success: false, error })
      })
  })

  if (response ) {
    return response
  }

  return { success: false, error: 'Unknown axios request error' }
}
