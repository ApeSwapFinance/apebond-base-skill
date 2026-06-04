# Base chain constants

| Item | Value |
| --- | --- |
| Chain ID | `8453` (`0x2105`) |
| Base MCP `chain` name | `base` |
| Multicall3 | `0xDF845ff2dA2325Df9C6CC3DDF7418C54E16bbFDF` |
| SoulZap TokenManager (approve for zaps) | `0x0B750790dCa8f289fAB5eFd1a48EfAb969e51D16` |
| Widget `referenceId` | `base-mcp` |
| Base Bill NFT (V3) | `0xD8C7fe06E24A2862d78D0F1BF040bA79463d9351` |

**Positions:** `positions <wallet>` reads `allTokensDataOfOwner` on the Bill NFT, then `claimablePayout(billId)` on each bond contract — same discovery model as SDK Your Bonds (EVM), not `GET /bonds` (active bonds only).

Map every prepared transaction `chainId: 8453` to `send_calls({ chain: "base", calls: [...] })`.
