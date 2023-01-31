import { BigNumber } from 'ethers'

const FACTOR = 10_000

/*
For ANPL, marketFeePct is 500 (5%) and protocolFeePct is 5 (0.05%)

*/

export function calculatePrincipalRequiredForBorrowerPayout(
  expectedBorrowerPayment: BigNumber, //5000   ///amount of wei THE BORROWER must get out of this loan
  marketFeePct: BigNumber, //500
  protocolFeePct: BigNumber //5
): BigNumber {
  const totalFeesPct = marketFeePct.add(protocolFeePct)

  const principalRequired = expectedBorrowerPayment
    .mul(BigNumber.from(FACTOR))
    .div(BigNumber.from(FACTOR).sub(totalFeesPct)) //rounding UP

  // ---- If we are off by 1,  subtract 1
  const calculatedBorrowerPayment = calculateBorrowerPayoutFromLoanPrincipal(
    principalRequired,
    marketFeePct,
    protocolFeePct
  )
  const offByError = calculatedBorrowerPayment.sub(expectedBorrowerPayment)

  return principalRequired.sub(offByError)
}

//this is how it happens in solidity
export function calculateBorrowerPayoutFromLoanPrincipal(
  loanPrincipal: BigNumber,
  marketFeePct: BigNumber,
  protocolFeePct: BigNumber
): BigNumber {
  const marketFee = loanPrincipal.mul(marketFeePct).div(FACTOR)

  const protocolFee = loanPrincipal.mul(protocolFeePct).div(FACTOR)

  const borrowerPayout = loanPrincipal.sub(marketFee).sub(protocolFee)

  return borrowerPayout
}
