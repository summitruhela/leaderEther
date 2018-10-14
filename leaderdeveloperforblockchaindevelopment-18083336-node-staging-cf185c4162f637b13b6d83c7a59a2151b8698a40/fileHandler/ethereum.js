var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/1c7b730f883e44f39134bc8a680efb9f'));
var Accounts = require('web3-eth-accounts');
// var web3 = new Web3(Web3.givenProvider || 'https://mainnet.infura.io');
// var accounts = new Accounts('https://mainnet.infura.io/');
var accounts = new Accounts('https://ropsten.infura.io/')
var BigNumber = require('bignumber.js')
let Tx = require('ethereumjs-tx')
var demo = ""
module.exports = {
    
    sendEther: (toAddr, fromAddr, value, privateKey, cb) => {
        // console.log("========calling send ether function========")
        var myKey = privateKey
        console.log("hi i am sending ether", toAddr, fromAddr, value, privateKey)
        getBalance(fromAddr, (err, result) => {
            //   console.log(" err nd result ==>>",err,result)
            if (err) {
                // console.log("err in get balance function=====")
            } else {
                // console.log("=======>>>", myKey)
                myKey = myKey.split('0x')
                myKey = myKey[1]
                // console.log("=======>>>", myKey)
                myKey = new Buffer(myKey, 'hex');
                demo = new Buffer(myKey, 'hex');
                // console.log("=======>>>", myKey , value)
                var amount = new BigNumber(value).multipliedBy(new BigNumber(Math.pow(10, 18)));
                // console.log("amount===>>", amount)
                signTxn(toAddr, fromAddr, amount, myKey, (err, result) => {
                    if (err) {
                        // console.log("err in SIGNTXN function===", err)
                        cb(err)
                    } else {
                        // console.log("hi bro ", result)
                        web3.eth.sendSignedTransaction(result).then((receipt) => {
                            console.log("In sendSigned Transaction======>>>", receipt.transactionHash)
                            cb(null,receipt.transactionHash)
                        }).catch(err => {
                            console.log("err=====>>",err)
                            cb(err)
                        })
                    }
                })
            }
        })
    }
}


getBalance = (address, cb) => {
    web3.eth.getBalance(address).then(amount => {
        console.log("calling get balancce function  amount==>>", amount)
        amount = new BigNumber(amount).dividedBy(new BigNumber(Math.pow(10, 18)))
        //   console.log("amountBigNo.==>>", amount)
        cb(null, amount)
    }).catch(err => {
        cb(null, err)
    })
}

signTxn = (toAddr, fromAddr, value, privateKey, cb) => {
    // console.log("private key is 111111====>>",privateKey)
    estGas(toAddr, fromAddr, value, (estmdGas) => {
        console.log("private key is 222222====>>",estmdGas)
        getCurrentGasPrice((err,currentGasPrice) => {
            console.log("private key is33333 ====>>",currentGasPrice)
            getTxnCountForNonce(fromAddr, (hardCount) => {
                // console.log("private key is444444 ====>>", demo)
                let rawTx = {
                    nonce: web3.utils.toHex(hardCount),
                    from: web3.utils.toHex(fromAddr),
                    gasPrice: web3.utils.toHex(20 * 1e9),
                    gas: web3.utils.toHex(21000),
                    to: web3.utils.toHex(toAddr),
                    value: web3.utils.toHex(value)
                }
                //   console.log("Gas used==>>", estmdGas, currentGasPrice, estmdGas * currentGasPrice)
                //   console.log("---------------------->>", rawTx)
                var tx = new Tx(rawTx);
                // console.log("this is my private key===>>", demo)
                // var privateKey = new Buffer('21fad1820c8fc28a00752880ab99d70fa743ed89a94d75714eea8654d13017e7', 'hex');
                tx.sign(demo);
                let serializedTx = tx.serialize();
                console.log("serializedTx", serializedTx)
                let cbData = '0x' + serializedTx.toString('hex')
                // console.log("cb Data is ", cbData)
                cb(null, cbData)
            })
        })
    })
}


estGas = (toAddr, fromAddr, value, cb) => {
    web3.eth.estimateGas({
        from: fromAddr,
        to: toAddr,
        value: value
    }).then((estmdGas) => {
        console.log(" Your estmdGas is ==>>", estmdGas)
        return cb(estmdGas)
    }).catch(err => {
        console.log("in err==>>", err)
    })
}

getCurrentGasPrice = (cb) => {
    web3.eth.getGasPrice().then((currentGasPrice) => {
        console.log("currentGasPrice===>>", currentGasPrice)
       cb(null,currentGasPrice)
    }).catch(err => {
        console.log("err in get current gas price")
        cb(err)
    })
}

getTxnCountForNonce = (addr, cb) => {
    web3.eth.getTransactionCount(addr)
        .then((count) => {
            return cb(count)
        }).catch(err => {
            console.log("err in get TXN for NONCE function")
            cb(null, err)
        });
}