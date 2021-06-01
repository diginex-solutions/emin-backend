module.exports = {}
const smartContractService = require('../services/smartContract')

async function getBlockChainHistory(req, res, next) {
    const data = await smartContractService.getBlockChainHistory(req.params.id)
    res.json(data)
}

module.exports = {
    getBlockChainHistory,
}
