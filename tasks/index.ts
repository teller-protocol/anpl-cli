 

import { callExecute } from './callExecute'
import { submitDiscrete } from './submitDiscrete'
import { acceptDiscrete } from './acceptDiscrete'
import { fetchCraResponse } from './fetchCraResponse'
import { approveMarket } from './approveMarket'
//import { matchOrder } from './matchOrder'

const yargs = require('yargs').argv
 
const taskMap: any = {
  
  callExecute,
  submitDiscrete,
  acceptDiscrete,
  fetchCraResponse,
  approveMarket
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
