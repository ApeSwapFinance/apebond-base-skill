# Calldata encoding

Matches [apebond-bonds-sdk](https://github.com/ApeSwapFinance/apebond-bonds-sdk) `BuyComponent` behavior on EVM.

## Principal buy

1. `amount` = human input × 10^decimals (principal / lp token decimals from bond payload).
2. `trueBondPrice` from realtime bond (`trueBillPrice` or best entry in `trueBondPrices`).
3. `maxPrice = floor(trueBondPrice × 1.02)` (2% slippage buffer).
4. `deposit(amount, maxPrice, depositor)` on **bond contract**.
5. **V4 + tiers:** `deposit(amount, maxPrice, depositor, tierProofSignature)` — signature from `POST /tier-signature`.

## Approval

- Principal buy: `approve(bondContract, amount)` on principal ERC-20.
- Zap buy: `approve(SoulZapTokenManager, amount)` on input ERC-20 (not native).

## Claim

- `redeem(billId)` on bond contract.
- `batchRedeem(uint256[] ids)` on bond contract.

## Transfer

- `safeTransferFrom(from, to, tokenId)` on **billNnftAddress** (from bond list metadata), not the bond market contract.

## CLI

Prefer the bundled CLI to avoid encoding mistakes:

```bash
node dist/cli.js prepare-buy --bond 0x... --amount 100 --from 0x... --with-tiers
```

Output `transactions[]` maps 1:1 to `send_calls.calls`.
