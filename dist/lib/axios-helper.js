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
exports.axiosPostRequest = exports.axiosGetRequest = void 0;
const axios_1 = __importDefault(require("axios"));
require('dotenv').config();
//const NETWORK_NAME = process.env.NETWORK_NAME!;
function axiosGetRequest(path, inputs, headers) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const response = yield new Promise((resolve, reject) => {
            return axios_1.default
                .get(path, {
                params: inputs,
                headers: headers,
            })
                .then(function (res) {
                resolve({ success: true, data: res.data });
            })
                .catch(function (error) {
                console.error(error);
                resolve({ success: false, error });
            });
        });
        if (response) {
            return response;
        }
        return { success: false, data: 'Unknown axios request error' };
    });
}
exports.axiosGetRequest = axiosGetRequest;
function axiosPostRequest(path, inputs) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const response = yield new Promise((resolve, reject) => {
            axios_1.default
                .post(path, inputs)
                .then(function (res) {
                let body = res.data;
                resolve({ success: true, data: body.data });
            })
                .catch(function (error) {
                console.error(error);
                resolve({ success: false, error });
            });
        });
        if (response) {
            return response;
        }
        return { success: false, data: 'Unknown axios request error' };
    });
}
exports.axiosPostRequest = axiosPostRequest;
//# sourceMappingURL=axios-helper.js.map