const ethers = require('ethers')
var log = require('./logger.js').log
const config = require('../config')
var mongoose = require('mongoose')
var Nonce = mongoose.model('Nonce')
const Redis = require('ioredis')
const rootSet = 'merkleroots.ready'
const privateKey = '0x' + process.env.OTS_ETH_PRIVATE_KEY
const network = process.env.OTS_ETH_NETWORK
const Tezos = require('@taquito/taquito').Tezos
const InMemorySigner = require('@taquito/signer').InMemorySigner
const assert = require('assert')
const axios = require('axios')

async function tezosGetCurrentBlock(network) {
  if (lastBlockFetch && lastBlock && new Date() - lastBlockFetchTime < blockUpdateInterval) {
    return lastBlock
  }

  assert(network === 'testnet' || network === 'mainnet', `Unknown Tezos network '${network}'`)

  const url = {
    testnet: 'https://conseil-dev.cryptonomic-infra.tech/v2/data/tezos/babylonnet/blocks',
    mainnet: 'https://conseil-prod.cryptonomic-infra.tech/v2/data/tezos/mainnet/blocks',
  }[network]

  const apiKey = {
    testnet: 'hooman',
    mainnet: 'galleon',
  }[network]

  const resp = await axios.post(
    url,
    { limit: 1, orderBy: [{ direction: 'desc', field: 'level' }], predicates: [] },
    { headers: { apiKey } }
  )

  if (resp.status === 200) {
    lastBlock = resp.data[0]
    lastBlockFetchTime = new Date()

    log.debug(`[rootTezosSender]: Fetched block ${lastBlock.level} at ${lastBlockFetchTime}`)

    return lastBlock
  }

  throw new Error(`Failed to fetch block: ${resp}`)
}

async function tezosGetTransactionReceipt(opHash, network) {
  assert(network === 'testnet' || network === 'mainnet', `Unknown Tezos network '${network}'`)

  const url = {
    testnet: 'https://conseil-dev.cryptonomic-infra.tech/v2/data/tezos/babylonnet/operations',
    mainnet: 'https://conseil-prod.cryptonomic-infra.tech/v2/data/tezos/mainnet/operations',
  }[network]

  const apiKey = {
    testnet: 'hooman',
    mainnet: 'galleon',
  }[network]

  const resp = await axios.post(
    url,
    { predicates: [{ field: 'operation_group_hash', operation: 'eq', set: [opHash] }], limit: 1 },
    { headers: { apiKey } }
  )

  if (resp.status !== 200) {
    throw new Error(`Failed to fetch operation ${opHash}: ${resp}`)
  }

  const currentBlock = await tezosGetCurrentBlock(network)

  const confirmations = currentBlock.level - resp.data[0].level
  const status = confirmations > 30 ? 1 : 0

  return { confirmations, status }
}

function getTransactionReceipt(txHash, network) {
  let provider = ethers.getDefaultProvider(network)
  return provider.getTransactionReceipt(txHash)
}

async function syncRootThenCache(roots) {
  const redis = new Redis(config.redisUrl)
  await Promise.all(
    roots.map(async (root) => {
      let txHash = await redis.get(`root:${root}:tx`)
      if (!txHash) {
        redis.sadd(rootSet, root)
      }
    })
  )

  let rootsUniq = await redis.smembers(rootSet)

  if (config.tezos.enable) {
    const tezosNetwork = config.tezos.network
    const tezosSecretKey = config.tezos.secretKey

    const rpcEndpoints = {
      testnet: 'https://rpcalpha.tzbeta.net/',
      mainnet: 'https://rpc.tzbeta.net',
    }

    assert(Object.keys(rpcEndpoints).includes(tezosNetwork), `Unknown Tezos network '${tezosNetwork}'`)

    Tezos.setProvider({
      rpc: rpcEndpoints[tezosNetwork],
      signer: new InMemorySigner(tezosSecretKey),
    })
  }

  const w = new ethers.Wallet(privateKey, ethers.getDefaultProvider(network))
  let nonce = await w.getTransactionCount()
  await Nonce.set(nonce) //TODO: Nonce use redis instead
  let result = []
  for (const root of rootsUniq) {
    // TODO [1]: check hash is valid, dont send.
    let nonce = await Nonce.use()
    log.info('nonce:', nonce.nonce, 'root:', root)
    let txHash = (
      await w.sendTransaction({
        to: await w.getAddress(),
        data: root,
        nonce: nonce.nonce,
      })
    ).hash
    log.info('txHash:', txHash)

    let tezosOpHash = null
    if (config.tezos.enable) {
      tezosOpHash = (
        await Tezos.contract.transfer({
          amount: 0,
          parameter: {
            entrypoint: 'default',
            value: { string: root },
          },
          to: config.tezos.contractAddress,
        })
      ).hash
      log.info(`tezosOpHash: ${tezosOpHash}`)
    }

    let pipeline = redis.pipeline();
    pipeline.set(`root:${root}:tx`, `${txHash}:${network}`, 'EX', 604800)

    if (tezosOpHash) {
      await pipeline.set(`root:${root}:tezos_tx`, tezosOpHash, 'EX', 604800)
    }

    pipeline.srem(rootSet, root)
    await pipeline.exec()

    result.push(txHash)
  }
  redis.disconnect()
  return result
}

async function getTxHash(roots) {
  if (roots.length > 0) {
    const redis = new Redis(config.redisUrl)
    let mResult = await redis.mget(roots.map((r) => `root:${r}:tx`))
    redis.disconnect()
    return mResult
  }
  return []
}

async function getTezosOpHash(roots) {
  if (roots.length > 0) {
    const redis = new Redis(config.redisUrl)
    let mResult = await redis.mget(roots.map((r) => `root:${r}:tezos_tx`))
    redis.disconnect()
    return mResult
  }
  return []
}

module.exports = {
  getTransactionReceipt,
  tezosGetTransactionReceipt,
  syncRootThenCache,
  getTxHash,
  getTezosOpHash,
}
