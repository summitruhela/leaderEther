var Web3 = require('web3');
let func = require('./function.js')
let ethereum = require('./ethereum.js')
let user = require('../models/user.js')
var CircularJSON = require('circular-json')
var async = require('async');
const numberToBN = require('number-to-bn');
let Tx = require('ethereumjs-tx');
var CoinMarketCap = require("node-coinmarketcap");
var coinmarketcap = new CoinMarketCap();
const currencyConvert = require('currency-convert')
var fs = require('fs');
var BigNumber = require('bignumber.js');
let tokenList = require('../models/tokenList.js')
// var abiArray = JSON.parse(fs.readFileSync('abi.json', 'utf-8'));
// var abiTRZA = JSON.parse(fs.readFileSync('abiTRZA.json', 'utf-8'));
// var abi = JSON.parse(fs.readFileSync('abi.json', 'utf-8'));//working
var abiArray = JSON.parse(fs.readFileSync('abi.json', 'utf-8')); //working
// console.log("abiArray====>>", abiArray.KITTOKEN)

/*  ................... ropston infura .....................*/
// var web3 = new Web3(Web3.givenProvider || 'https://ropsten.infura.io/1c7b730f883e44f39134bc8a680efb9f');
var web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/1c7b730f883e44f39134bc8a680efb9f'));
var Accounts = require('web3-eth-accounts');
// var web3 = new Web3(Web3.givenProvider || 'https://mainnet.infura.io');
// var accounts = new Accounts('https://mainnet.infura.io/');
var accounts = new Accounts('https://ropsten.infura.io/');


module.exports = {

    createWallet: (password, cb) => {
        var privateKey = web3.eth.accounts.wallet.create(1, password) //create a wallet with address and privateKey
        var objInfo = privateKey.length - 1;
        func.crypt(privateKey[objInfo].privateKey, (err, result) => {
            console.log("=============>>>>>", privateKey[objInfo].address, privateKey[objInfo].privateKey, )
            if (err) {
                cb(err)
            } else {
                console.log("====>>>=====>>>>", result)
                var obj = {
                    address: privateKey[objInfo].address,
                    privateKey: result
                }
                cb(null, obj);
            }
        })
    },

    getBalance: (req, res) => {
        web3.eth.getBalance(req.query.address).then((data) => {
            // console.log("getBalance function data--->>", data, web3.utils.fromWei(data, 'ether'))
            // console.log("data", data)
            coinmarketcap.multi(coins => {
                var oneDollar = coins.get("ETH").price_usd
                console.log("dollar@@@===>", oneDollar)
                // console.log("===@@@@@===", coins.get("ETH").price_usd); // Print price of ETH in USD
                var dollar = oneDollar * web3.utils.fromWei(data, 'ether')
                console.log("dollar===>>", dollar)
                var obj = {}
                obj.ethereum = web3.utils.fromWei(data, 'ether')
                obj.dollar = "$" + dollar;
                console.log("obj=====>>>", obj)
                return func.responseHandler(res, 200, "Success.", obj)
            });
        }).catch(err => {
            return err
        });
    },

    /***************************************************************************************************************************                             
    /                                            send ERC 20 token to an ethereum address 
    /***************************************************************************************************************************/

    sendToken: (req, res) => {
        // console.log("req.body=22222==>", req.body)
        if (!req.body.walletAddress || !req.body.toAddress || !req.body.amount || !req.body.tokenAddress) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        user.findOne({
            walletAddress: req.body.walletAddress
        }, (err, result_) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error11111.", err)
            } else if (!result_) {
                return func.responseHandler(res, 404, "Invalid Credentials")
            } else {
                tokenList.findOne({
                    tokenAddress: req.body.tokenAddress
                }, (err, result) => {
                    if (err) {
                        return func.responseHandler(res, 400, "Internal server error2222.", err)
                    } else if (!result) {
                        return func.responseHandler(res, 404, "Invalid Contract Address.")
                    } else {
                     
                        func.cryptVerify(result_.privateKey, (errKey, resultKey) => {
                            if (errKey) {
                                return func.responseHandler(res, 404, "Invalid private Key.")
                            } else {
                                // console.log("result===>>", resultKey)
                                // return;
                                var decimal = result.tokenDecimal
                                // var tokenAddress = result.tokenAddress
                                var abi = JSON.parse(result.abi)
                                var walletAddress = req.body.walletAddress
                                var toAddress = req.body.toAddress
                                // var privateKey = resultKey
                                var temp_amount = new BigNumber(req.body.amount);
                                var amount = new BigNumber(req.body.amount).multipliedBy(new BigNumber(Math.pow(10, decimal)))
                                var check_amount = amount;
                                var amount = web3.utils.toHex(amount)
        
                                if (web3.utils.isAddress(req.body.toAddress)) {
                                    web3.eth.getTransactionCount(walletAddress).then(count => {
                                        // console.log("count==>", count)
                                     
                                        var privateKey = resultKey.split("0x")
                                        var privateKey = privateKey[1]
                                        
                                        var privateKey = new Buffer(privateKey, 'hex');
                                        // var contractAddress = tokenAddress; // token address
                                       
                                        var contract = new web3.eth.Contract(abi, result.tokenAddress) //mainnet
                                        // var contract = new web3.eth.Contract(abiArray, contractAddress) //testnet
                                        // console.log("after split=======>",result.tokenAddress,privateKey)
                              
                                        contract.methods.balanceOf(walletAddress).call().then(function (balance) {
                                            // console.log("@@@@@@balance===", balance,check_amount)
                                     
                                            let check_balance = balance;
                                            var finalBalance = new BigNumber(balance).isGreaterThanOrEqualTo(new BigNumber(check_amount));
                                            // console.log('Actual value is========>>>>>>>>', finalBalance)                                      
                                            if (finalBalance) {
                                                var rawTransaction = {
                                                    "from": walletAddress,
                                                    "gasPrice": web3.utils.toHex(10 * 1e9),
                                                    "gasLimit": web3.utils.toHex(210000),
                                                    "to": req.body.tokenAddress,
                                                    "value": "0x0",
                                                    "data": contract.methods.transfer(toAddress, amount).encodeABI(),
                                                    "nonce": web3.utils.toHex(count)
                                                }
                                                var transaction = new Tx(rawTransaction)
                                                transaction.sign(privateKey)
                                                web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'), (err2, hash) => {
                                                    // console.log("========err2===",err,hash)
                                                    if (err2) {
                                                        return func.responseHandler(res, 400, "insufficient funds")
                                                    } else {
                                                        console.log("Successfully send token to user ====>>>>>", hash)
                                                        // return;
                                                        ethereum.sendEther("0x7A60b54356Aa1cb78F58e253833BB515A246392E", walletAddress, "0.0001", resultKey, (err, result) => {
                                                            if (err) {
                                                                console.log("err in sending ethereum to Admin.")
                                                            } else {
                                                                console.log("successfully transfer ether to Admin", hash, result)
                                                                return func.responseHandler(res, 200, "Success", hash)
                                                            }
                                                        })
                                                    }
                                                })
                                            } else {
                                                console.log("Insufficient Token")
                                                return func.responseHandler(res, 400, "Insufficient Token")
                                            }
                                        }).catch(errBalance => {
                                            console.log(errBalance)
                                            return func.responseHandler(res, 400, "Provide valid information.")
                                        })
                                    }).catch(err => {
                                        console.log("err===>>>", err)
                                        return func.responseHandler(res, 400, "Provide valid information.", err)
                                    })
                                } else {
                                    return func.responseHandler(res, 400, "Provide valid receiver address.")
                                }
                            }
                        })
                    }
                })
            }
        })
    },


    test: (req, res) => {
        console.log("req.body===>", req.body)
        if (!req.body.walletAddress || !req.body.toAddress || !req.body.amount || !req.body.tokenAddress) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        user.findOne({
            walletAddress: req.body.walletAddress,
            "ERC.tokenAddress": req.body.tokenAddress
        }, {
            privateKey: 1,
            'ERC.$.tokenAddress': 1,
        }, (err, result) => {
            if (err) {
                return func.responseHandler(res, 400, "Internal server error1.", err)
            } else if (!result) {
                return func.responseHandler(res, 400, "Invalid Credentials")
            } else {
                var decimal = result.ERC[0].tokenDecimal
                var tokenAddress = result.ERC[0].tokenAddress
                var abi = JSON.parse(result.ERC[0].abi)
                var walletAddress = req.body.walletAddress
                var toAddress = req.body.toAddress
                var privateKey = result.privateKey
                var temp_amount = new BigNumber(req.body.amount);
                // console.log('temp amount is======>>>>>>', temp_amount);
                var amount = new BigNumber(req.body.amount).multipliedBy(new BigNumber(Math.pow(10, decimal)))
                var check_amount = amount;
                // console.log("amount===>>", amount)
                var amount = web3.utils.toHex(amount)
                // console.log("amount====>> after converting ===>> ", amount)
                if (web3.utils.isAddress(req.body.toAddress)) {
                    // console.log("check balance is valid or not =======>>>")
                    web3.eth.getTransactionCount(walletAddress).then(count => {
                        console.log("count==>", count)
                        var privateKey = result.privateKey.split("0x")
                        var privateKey = privateKey[1]
                        // console.log("after split=======>", privateKey)
                        var privateKey = new Buffer(privateKey, 'hex');
                        var contractAddress = tokenAddress; // token address
                        // var contract = new web3.eth.Contract(abi, contractAddress) //mainnet
                        var contract = new web3.eth.Contract(abiArray, contractAddress) //testnet
                        contract.methods.balanceOf(walletAddress).call().then(function (balance) {
                            console.log("@@@@@@balance===", balance)
                            let check_balance = balance;
                            var finalBalance = new BigNumber(balance).isGreaterThanOrEqualTo(new BigNumber(check_amount));
                            console.log('Actual value is========>>>>>>>>', finalBalance);
                            if (finalBalance) {
                                var rawTransaction = {
                                    // "from": "0x6f0feb56b2e9ab38f398a2cfcb5b52cf8c293869",
                                    "gasPrice": web3.utils.toHex(1 * 1e9),
                                    "gasLimit": web3.utils.toHex(210000),
                                    "to": contractAddress,
                                    "value": "0x0",
                                    "data": contract.methods.transfer(toAddress, amount).encodeABI(),
                                    "nonce": web3.utils.toHex(count)
                                }
                                var transaction = new Tx(rawTransaction)
                                transaction.sign(privateKey)
                                web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'), (err2, hash) => {
                                    console.log("========err2===", err2, hash)
                                    if (err2) {
                                        return func.responseHandler(res, 400, "insufficient funds")
                                    } else {
                                        return func.responseHandler(res, 400, "Success.", hash)
                                    }
                                })
                            } else {
                                console.log("Insufficient balance")
                                return func.responseHandler(res, 400, "Insufficient Token")
                            }
                        }).catch(errBalance => {
                            console.log(errBalance)
                            return func.responseHandler(res, 400, "Provide valid information.")
                        })
                    }).catch(err => {
                        console.log("err===>>>", err)
                        return func.responseHandler(res, 400, "Provide valid information.", err)
                    })
                } else {
                    return func.responseHandler(res, 400, "Provide valid receiver address.")
                }

            }
        })
    },



    test1: (req, res) => {
        console.log("calling test1 function")
        get_payment(req.body.toAddr, req.body.fromAddr, req.body.value, req.body.privateKey, (err, result) => {
            console.log("result===>>", err, result)
        })
    },
    test2: (req, res) => {
        ethereum.sendEther(req.body.toAddr, req.body.fromAddr, req.body.value, req.body.privateKey, (err, result) => {
            console.log("result")
        })
    },



    get_transfer: (req, res) => {
        console.log("req.body======>>>", req.body)
        if (!req.body.privateKey || !req.body.fromAddr || !req.body.toAddr) {
            return res.send({
                code: 400,
                message: "Parameters Missing!!"
            })
        }
        getBalance1(req.body.fromAddr, (err, result) => {
            // console.log("balance_api---->", result)
            if (err) {
                console.log("err34343", err)
                return res.send({
                    code: 500,
                    message: "Internal server error"
                })
            } else if (result) {
                // console.log("resultt----->", result)
                privateKey = (req.body.privateKey).split('0x')
                privateKey = privateKey[1]
                console.log("=======>>>", privateKey)
                var privateKey = new Buffer(privateKey, 'hex');
                //console.log("=======>>>", privateKey)
                var amount = new BigNumber(result).multipliedBy(new BigNumber(Math.pow(10, 18)));
                console.log("**********", amount)
                signTxn_transfer(req.body.toAddr, req.body.fromAddr, amount, privateKey, (hash) => {
                    if (hash) {
                        console.log("hash=====>>", hash)
                        web3.eth.sendSignedTransaction(hash).then((receipt) => {
                            console.log('Transaction Hash---------->', receipt)
                            var fee_data = new BigNumber(receipt.gasUsed).dividedBy(new BigNumber(Math.pow(10, 9)));
                            console.log("fee_data---->", fee_data)
                            return res.send({
                                code: 200,
                                txid: receipt.transactionHash,
                                fee: fee_data
                            })
                        }).catch(err => {
                            res.send({
                                code: 500,
                                message: "Insufficients Funds!!"
                            })
                        })
                    }
                })
            } else {

                res.send({
                    responseCode: 500,
                    responseMessage: "Insufficients Funds!!"
                })
            }
        })
    }
}

getBalance1 = (address, cb) => {
    web3.eth.getBalance(address).then(amount => {
        console.log("calling get balancce function  amount==>>", amount)
        amount = new BigNumber(amount).dividedBy(new BigNumber(Math.pow(10, 18)))
        //   console.log("amountBigNo.==>>", amount)
        cb(null, amount)
    }).catch(err => {
        cb(null, err)
    })
}