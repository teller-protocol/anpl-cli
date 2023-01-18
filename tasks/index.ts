 

import { callExecute } from './callExecute'
import { submitDiscrete } from './submitDiscrete'
import { acceptDiscrete } from './acceptDiscrete'
import { fetchCraResponse } from './fetchCraResponse'
import { approveMarket } from './approveMarket'
import {getNFTsOwned} from './getNFTsOwned'
import {callExecuteWithOffchain} from './callExecuteWithOffchain'
import {submitOffchainOffer} from './submitOffchainOffer' 
import {executeReservoirOrder} from './executeReservoirOrder'

const yargs = require('yargs').argv
 
const taskMap: any = {
  callExecuteWithOffchain,
  callExecute,
  submitDiscrete,
  acceptDiscrete,
  fetchCraResponse,
  approveMarket,
  getNFTsOwned,
  submitOffchainOffer,
  executeReservoirOrder
//  matchOrder
}

async function init(): Promise<void> {

 
  const taskName = yargs['_'][0]

  await runTask(taskName)

  
}
 

async function runTask(taskName:string): Promise<void> {
  

  const taskMethod = taskMap[taskName]

  if (typeof taskMethod == 'undefined') throw new Error('unknown task')

  await taskMethod()

  console.log(`Task '${taskName}' complete.`)
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
init()
