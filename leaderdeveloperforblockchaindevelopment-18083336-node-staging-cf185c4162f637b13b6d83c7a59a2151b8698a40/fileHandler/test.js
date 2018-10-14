const mongoose = require('mongoose')
var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || 'https://ropsten.infura.io/1c7b730f883e44f39134bc8a680efb9f');
// var web3 = new Web3(Web3.givenProvider || 'https://mainnet.infura.io');
var Accounts = require('web3-eth-accounts');
var accounts = new Accounts('https://ropsten.infura.io/');
// var accounts = new Accounts('https://mainnet.infura.io/');
let admin = require('../models/admin.js')
let User = require('../models/user.js')
let staticContent = require('../models/staticContentModel.js')
let tokenList = require('../models/tokenList.js')
let func = require('../fileHandler/function.js')
let eth = require('../fileHandler/eth.js')
let ethereum = require('../fileHandler/ethereum.js')
let Askquery = require('../models/query.js')
let each = require('async-each-series')
var fs = require('fs')
let Tx = require('ethereumjs-tx')
var abiArray = JSON.parse(fs.readFileSync('abi.json', 'utf-8'))
var BigNumber = require('bignumber.js')
const numberToBN = require('number-to-bn')

module.exports = {
    // Dashboard section of add custom token or ERC token by user & Admin .....................................................
    addToken: (req, res) => {
        console.log("req.body===>", req.body)
        if (!req.body.tokenAddress) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        var abi = []
        var tokenAddress = "0x065071F5194763c1BEd69590623f26F2e5EaE6F9"
        var url = "https://ropsten.etherscan.io/getTokenInfo/" + tokenAddress + "?apiKey=freekey"
        func.nodeClient(url, (err, result) => {
            console.log("result=====>>>", result)
            if (result.error) {
                return func.responseHandler(res, 400, result.error)
            } else {
                return func.responseHandler(res, 200, "this is your abi", result)
            }
        })
    },

    /* Check balance of a address ........................................... */
    checkBalance: (req, res) => {
        var walletAddress = req.body.address
        web3.eth.getTransactionCount(walletAddress).then(count => {
            console.log("count==>", count)
            var contractAddress = "0x065071F5194763c1BEd69590623f26F2e5EaE6F9"; // token address
            var contract = new web3.eth.Contract(abiArray, contractAddress)
            contract.methods.balanceOf(walletAddress).call().then(function (balance) {
                // console.log("@@@@@@balance===", balance)
                return func.responseHandler(res, 200, "Token Balance.", balance)
            }).catch(errBalance => {
                console.log(errBalance)
                return func.responseHandler(res, 400, "Provide valid information.")
            })
        })

    },
    //  send Ethereum to any other wallet ...................or to any other user....................................................................
    sendToken: (req, res) => {
        var tokenAddress = "0x065071F5194763c1BEd69590623f26F2e5EaE6F9";
        if (!req.body.address || !req.body.toAddress || !req.body.amount || !tokenAddress) {
            return func.responseHandler(res, 401, "Parameters missing.")
        }
        var walletAddress = req.body.address
        var toAddress = req.body.toAddress
        var temp_amount = new BigNumber(req.body.amount);
        var amount = new BigNumber(req.body.amount).multipliedBy(new BigNumber(Math.pow(10, 5)))
        var check_amount = amount;
        var amount = web3.utils.toHex(amount)
        getAbi(tokenAddress,(err1,result1)=>{
            if(err1){
                return func.responseHandler(res,400,err1);
            }
            else{   
                if (web3.utils.isAddress(req.body.toAddress)) {
                    web3.eth.getTransactionCount(walletAddress).then(count => {
                        var privateKey = new Buffer(req.body.privateKey, 'hex');
                        var contractAddress = tokenAddress; // token address
                        var contract = new web3.eth.Contract(abiArray, contractAddress) //testnet
                        contract.methods.balanceOf(walletAddress).call().then(function (balance) {
                            let check_balance = balance;
                            var finalBalance = new BigNumber(balance).isGreaterThanOrEqualTo(new BigNumber(check_amount));
                            if (finalBalance) {
                                var rawTransaction = {
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
                } 
                else {
                    return func.responseHandler(res, 400, "Provide valid receiver address.")
                }
            }
        })
    }

}
var getAbi = (address, cb) => {
    var abi = []
    var tokenAddress = "0x065071F5194763c1BEd69590623f26F2e5EaE6F9"
    /* To check on mainnet........ */
    // var url = "https://api.ethplorer.io/getTokenInfo/" + tokenAddress + "?apiKey=freekey"   
    /*get abi of contract address on testnet....... */
    var url = "https://ropsten.etherscan.io/getTokenInfo/" + tokenAddress + "?apiKey=freekey"
    func.nodeClient(url, (err, result) => {
        console.log("result=====>>>", result)
        if (result.error) {
            return func.responseHandler(res, 400, result.error)
        } else {
            cb(null,result)
            // return func.responseHandler(res, 200, "this is your abi", result)
        }
    })
}
