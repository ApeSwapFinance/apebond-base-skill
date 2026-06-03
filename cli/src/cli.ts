#!/usr/bin/env node
import { Command } from 'commander'
import { fetchBaseBonds, trackWidgetTransaction } from './apis.js'
import { fetchPositions } from './positions.js'
import {
  prepareBatchRedeem,
  prepareBuy,
  prepareRedeem,
  prepareTransfer,
  prepareZapBuy,
} from './prepare.js'

const program = new Command()

program.name('apebond-base').description('ApeBond Base MCP skill CLI').version('0.1.0')

function printJson(data: unknown) {
  console.log(JSON.stringify(data, null, 2))
}

program
  .command('list-bonds')
  .description('List active bonds on Base from realtime-api')
  .option('--bond <address>', 'Filter by bond contract')
  .action(async (opts: { bond?: string }) => {
    const bonds = await fetchBaseBonds(opts.bond)
    printJson(
      bonds.map((b) => ({
        contract: b.contractAddress?.[8453] ?? b.billAddress,
        earnToken: b.earnToken?.symbol,
        principal: b.lpToken?.symbol,
        soldOut: b.soldOut,
        trueBillPrice: b.trueBillPrice,
        billVersion: b.billVersion,
      })),
    )
  })

program
  .command('positions <address>')
  .description('List bill NFT ids and claimable payout per bond for a wallet')
  .action(async (address: string) => {
    printJson(await fetchPositions(address))
  })

program
  .command('prepare-buy')
  .requiredOption('--bond <address>', 'Bond contract on Base')
  .requiredOption('--amount <decimal>', 'Principal amount in human units')
  .requiredOption('--from <address>', 'Buyer wallet')
  .option('--with-tiers', 'Include V4 tier proof signature from api v2')
  .option('--skip-approve', 'Omit approve step even if allowance is low')
  .action(async (opts) => {
    printJson(await prepareBuy(opts))
  })

program
  .command('prepare-zap-buy')
  .requiredOption('--bond <address>', 'Bond contract on Base')
  .requiredOption('--amount <decimal>', 'Input token amount in human units')
  .requiredOption('--from <address>', 'Buyer wallet')
  .requiredOption('--from-token <address>', 'Input token (use 0x0..0 for native ETH)')
  .option('--with-tiers', 'Include V4 tier proof signature')
  .option('--slippage <percent>', 'Slippage percent for zap', '0.5')
  .action(async (opts) => {
    printJson(
      await prepareZapBuy({
        ...opts,
        slippage: parseFloat(opts.slippage),
      }),
    )
  })

program
  .command('prepare-redeem')
  .requiredOption('--bond <address>', 'Bond contract')
  .requiredOption('--bill-id <id>', 'Bill NFT id')
  .action((opts) => {
    printJson(prepareRedeem(opts.bond, opts.billId))
  })

program
  .command('prepare-batch-redeem')
  .requiredOption('--bond <address>', 'Bond contract')
  .requiredOption('--ids <ids>', 'Comma-separated bill ids')
  .action((opts) => {
    printJson(prepareBatchRedeem(opts.bond, opts.ids.split(',').map((s: string) => s.trim())))
  })

program
  .command('prepare-transfer')
  .requiredOption('--nft <address>', 'Bill NFT contract (billNnftAddress)')
  .requiredOption('--from <address>', 'Current owner')
  .requiredOption('--to <address>', 'Recipient')
  .requiredOption('--token-id <id>', 'Bill NFT token id')
  .action((opts) => {
    printJson(prepareTransfer(opts.nft, opts.from, opts.to, opts.tokenId))
  })

program
  .command('track-widget')
  .description('Mandatory analytics ping after a confirmed purchase')
  .requiredOption('--hash <txHash>', 'Confirmed transaction hash')
  .requiredOption('--bond <address>', 'Bond contract address')
  .option('--reason <reason>', 'Optional reason string')
  .action(async (opts) => {
    await trackWidgetTransaction({
      transactionHash: opts.hash,
      billContract: opts.bond,
      reason: opts.reason,
    })
    printJson({ ok: true, referenceId: 'base-mcp' })
  })

program.parse()
