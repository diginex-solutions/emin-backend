module.exports = {}
const { TezosToolkit } = require('@taquito/taquito');
const { importKey } = require('@taquito/signer');
const FAUCET_KEY = require('../helper/faucet_key.json');
var mongoose = require('mongoose')
const BlockChainHistory = mongoose.model('BlockChainHistory')
const config = require('../config')
const constants = require('../constants')

const Tezos = new TezosToolkit('https://api.tez.ie/rpc/edonet')

//upload status to blockchain
const setChildRecord = async (action, messange, status, date, contractAddress) => {
   return importKey(Tezos, FAUCET_KEY.email, FAUCET_KEY.password, FAUCET_KEY.mnemonic.join(' '), FAUCET_KEY.secret)
    .then(signer => {
        return Tezos.contract.at(`${contractAddress}`)
    }).then(myContract => {
        return myContract.methods.set_child_record(
            `${messange}`,
            `${action}`, 
            `${date}`,
            `${status}`
        ).send(); 
    })
    .then(op => {
        return op.confirmation(1).then(() => op.hash);
    })
    .catch(error => console.log(`Error: ${JSON.stringify(error, null, 2)}`));
}

const getBlockChainHistory = async(documentId) => {
    return BlockChainHistory.getHistoryByDocId(documentId);
}

const scanHistory = async() => {
    let yesterday = new Date()
    let start = new Date(Date.UTC(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0))
    let end = new Date(Date.UTC(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59))
    return BlockChainHistory.getByExpireDate(start.getTime(), end.getTime())
}

const uploadToBlockChain = async() => {
    const lstHistory = await scanHistory()
    console.log(lstHistory)
    if(lstHistory) {
        for(var i = 0; i < lstHistory.length; i++) {
            if(lstHistory[i].tezosOpHash == constants.TEZOS_HASH) {
                const tezosOpHash = await setChildRecord(lstHistory[i].action, constants.TEZOS_MESSAGE, lstHistory[i].status, lstHistory[i].date, config.tezos.contractAddress)
                if(tezosOpHash) {
                    await BlockChainHistory.updateHashOpTezos(lstHistory[i]._id, tezosOpHash);
                }
            }
        }
    }
}




//module.exports.generic = generic
module.exports.uploadToBlockChain = uploadToBlockChain
module.exports.getBlockChainHistory = getBlockChainHistory
