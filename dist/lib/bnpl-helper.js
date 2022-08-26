"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExecuteParams = exports.calculateTotalPrice = void 0;
const ethers_1 = require("ethers");
require('dotenv').config();
function calculateTotalPrice(basicOrderParams) {
    let amount = ethers_1.BigNumber.from(basicOrderParams.considerationAmount);
    for (let additionalRecipient of basicOrderParams.additionalRecipients) {
        amount = amount.add(ethers_1.BigNumber.from(additionalRecipient.amount));
    }
    return amount;
}
exports.calculateTotalPrice = calculateTotalPrice;
function buildExecuteParams(inputData) {
    inputData.submitBidArgs.metadataURI = "ipfs://";
    // may be able to remove this method as it does nearly nothing now 
    let outputData = {
        submitBidArgs: inputData.submitBidArgs,
        basicOrderParams: inputData.basicOrderParams,
        craSignature: inputData.craSignature
    };
    return outputData;
}
exports.buildExecuteParams = buildExecuteParams;
//# sourceMappingURL=bnpl-helper.js.map