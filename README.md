## BNPL SDK 



### Pre-requisites 

Deploy the BNPL Marketplace contract and put the address of the proxy in ./data/contractsConfig.json 

Fetch the result of the CRA server and put it in inputOrder.json 

On the TellerV2 contract that the BNPL marketplace is built on top of, be sure to set the trustedForwarder for the market# to be the BNPL marketplace proxy contract.   Also be sure to make the lender and borrower addresses approve the BNPL marketplace proxy contract as a trusted forwarder.  


### Methodology

- Configure 'data/craParams.json' to specify how the BNPL transaction should be constructed 

- Use this configuration to fetch a Cra Server response. It is stored in  data/craResponse.json
>> yarn task fetchCraResponse 

- submit that craResponse to the BNPL smart contract 
>> yarn task callExecute


### Run Tasks


yarn task generateExecuteParams
>

yarn task callExecute



### notes 
['0x0000000000000000000000000000000000000000','0x00','0x64','0xB11ca87E32075817C82Cc471994943a4290f4a14','0x0000000000000000000000000000000000000000','0x0938a5F48B8f33eea3e4Db4320d73e0e795b1c90','44','1',40,'0x00','0x00','0x0000000000000000000000000000000000000000000000000000000000000000','0x00','0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000','0x0000000000000000000000000000000000000000000000000000000000000000','0x00',[],'0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000']

>