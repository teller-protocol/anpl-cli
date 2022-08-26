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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCraResponse = void 0;
const fs_1 = __importDefault(require("fs"));
const axios_helper_1 = require("../lib/axios-helper");
const bnpl_helper_1 = require("../lib/bnpl-helper");
function fetchCraResponse() {
    return __awaiter(this, void 0, void 0, function* () {
        let inputData = require('../data/craParams.json');
        //inputData.lenderAddress = "0xF4dAb24C52b51cB69Ab62cDE672D3c9Df0B39681"
        //let contractsConfig = require('../data/contractsConfig.json')['rinkeby']
        let response = yield (0, axios_helper_1.axiosPostRequest)(inputData.craServerURL, {
            asset_contract_address: inputData.contractAddress,
            token_id: inputData.tokenId,
            chain_id: inputData.chainId
        });
        if (!response.success)
            throw new Error(response.error);
        let outputData = (0, bnpl_helper_1.buildExecuteParams)(response.data);
        try {
            fs_1.default.writeFileSync('data/craResponse.json', JSON.stringify(outputData));
        }
        catch (err) {
            console.error(err);
        }
        console.log('output ', outputData);
        return outputData;
    });
}
exports.fetchCraResponse = fetchCraResponse;
//# sourceMappingURL=fetchCraResponse.js.map