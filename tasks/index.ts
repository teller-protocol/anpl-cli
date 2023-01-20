 

import { callExecute } from './callExecute'
 
import { fetchCraResponse } from './fetchCraResponse'
import { approveMarket } from './approveMarket'
import {getNFTsOwned} from './getNFTsOwned'
import {callExecuteWithOffchain} from './callExecuteWithOffchain'
import {submitOffchainOffer} from './submitOffchainOffer' 
import {executeReservoirOrder} from './executeReservoirOrder'
import {tenderlyAddBalance} from './tenderlyAddBalance'
import {signOffer} from './signOffer'

const yargs = require('yargs').argv
 
const taskMap: any = {
  callExecuteWithOffchain,
  callExecute, 
  fetchCraResponse,
  approveMarket,
  getNFTsOwned,
  submitOffchainOffer,
  executeReservoirOrder,
  tenderlyAddBalance,
  signOffer
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
