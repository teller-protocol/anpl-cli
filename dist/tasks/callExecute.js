"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callExecute = void 0;
const ethers_1 = require("ethers");
require('dotenv').config();
const rpcURI = process.env.GOERLI_RPC_URL;
const privateKey = process.env.WALLET_PRIVATE_KEY;
const executeConfig = {
    networkName: "goerli",
    marketplaceId: 2
};
//const networkName = "goerli"
//const marketplaceId = 2
let contractsConfig = require('../data/contractsConfig.json')[executeConfig.networkName];
//was 0x519b957ecaa80C5aEd4C5547Ff2Eac3ff5dE229c
const tellerV2Config = {
    address: contractsConfig.tellerV2.address,
    abi: require('../abi/TellerV2.json')
};
const bnplConfig = {
    address: contractsConfig.BNPLContract.address,
    abi: require('../abi/BNPLMarket.json')
};
function callExecute() {
    return __awaiter(this, void 0, void 0, function* () {
        let executeParams = require('../data/craResponse.json');
        let rpcProvider = new ethers_1.providers.JsonRpcProvider(rpcURI);
        let tellerV2Instance = new ethers_1.Contract(tellerV2Config.address, tellerV2Config.abi, rpcProvider);
        let bnplContractInstance = new ethers_1.Contract(bnplConfig.address, bnplConfig.abi, rpcProvider);
        if (!privateKey)
            throw new Error('Missing privateKey');
        let wallet = new ethers_1.Wallet(privateKey).connect(rpcProvider);
        console.log(`calling execute using account ${wallet.address}`);
        const submitBidArgs = executeParams.submitBidArgs;
        let value = ethers_1.BigNumber.from(submitBidArgs.downPayment); //calculateTotalPrice( executeParams.basicOrderParams )
        let lenderAddress = submitBidArgs.lender;
        let basicOrderParams = executeParams.basicOrderParams;
        if (!basicOrderParams.offererConduitKey) {
            throw new Error('Missing offererConduitKey');
        }
        //let borrowerAddress = wallet.address
        let isApproved = yield tellerV2Instance.hasApprovedMarketForwarder(executeConfig.marketplaceId, bnplContractInstance.address, lenderAddress);
        console.log('lender has approved BNPL as forwarder: ', isApproved);
        if (!isApproved) {
            console.error(`ERROR: lender ${lenderAddress} has not approved bnpl as forwarder `);
            return;
        }
        let domainSeparator = yield bnplContractInstance.DOMAIN_SEPARATOR();
        console.log({ domainSeparator });
        if (domainSeparator != contractsConfig.BNPLContract.domainSeparator) {
            throw new Error('Invalid domain separator');
        }
        /* let typeHash = await bnplContractInstance.getTypeHash(
           submitBidArgs,
           basicOrderParams.offerToken,
           basicOrderParams.offerIdentifier,
           basicOrderParams.offerAmount,
           submitBidArgs.totalPurchasePrice,
           basicOrderParams.considerationToken
         ) */
        // executeParams.basicOrderParams.additionalRecipients = [ ]
        //fix it for now to remove referral and sig expir
        let formattedSubmitBidArgs = {
            lender: submitBidArgs.lender,
            totalPurchasePrice: submitBidArgs.totalPurchasePrice,
            principal: submitBidArgs.principal,
            downPayment: submitBidArgs.downPayment,
            duration: submitBidArgs.duration,
            signatureExpiration: submitBidArgs.signatureExpiration,
            interestRate: submitBidArgs.interestRate,
            metadataURI: submitBidArgs.metadataURI,
            //   referralAddress:"0x0000000000000000000000000000000000000000"
        };
        console.log('passing in params', formattedSubmitBidArgs, basicOrderParams, executeParams.craSignature);
        basicOrderParams.additionalRecipients = [];
        //this address needs to approve the forwarder on tellerv2
        //  lenderAddress =  "0xF4dAb24C52b51cB69Ab62cDE672D3c9Df0B39681"
        //Set price to 1 Gwei
        let gasPrice = ethers_1.utils.hexlify(8000000000);
        //Set max gas limit to 4M
        var gasLimit = ethers_1.utils.hexlify(25000000);
        console.log('meep1', value);
        let unsignedTx = yield bnplContractInstance
            .populateTransaction
            .execute(formattedSubmitBidArgs, basicOrderParams, executeParams.craSignature, { value, gasLimit, gasPrice });
        console.log('meep2');
        console.log({ unsignedTx });
        let response = yield wallet.sendTransaction(unsignedTx);
        console.log('response', response);
        //erc20 low level call failed (weth approval )->sending weth from lender 
        return true;
    });
}
exports.callExecute = callExecute;
//# sourceMappingURL=callExecute.js.map