# MyBit Token
This code is for a token migration, moving from our old ERC20 mintable token to a new ERC20 deflationairy supply token. The new token has burning capabilities built into it, which will decrease the totalSupply as users burn tokens to access the network. The new tokens cannot be bought, but instead must be claimed by approving the TokenSwap contract with the wallet that is holding old MyBit tokens. For every 1 old token swapped, the user will receive 36 new tokens. The new token has no owners and contains 10 more decimal places than the old token, giving it 18 decimal places total. 


#### ⚠️ IMPORTANT: Do not transfer tokens to any contract! The contracts will handle all token transfers once they receive approval. 

### Published on Main Net

#### `0x7DC8A6E706dA7c4A77d3710F7B7e621ee0074dC3` TokenSwap
#### `0x5d60d8d7eF6d37E16EBABc324de3bE57f135e0BC` NewToken
#### `0x94298F1e0Ab2DFaD6eEFfB1426846a3c29D98090` OldToken

*Verified proof through Keybase on https://twitter.com/MyBit_DApp/status/993879392433602560*

# How to Swap MyBit token

####For detailed instructions see this [post](https://medium.com/mybit-dapp/before-you-begin-take-a-deep-breath-and-relax-3820e9c8ca03)

## Overview
To swap old MyBit tokens, one must call approveAndCall() on the old MyBit token contract, giving permission to the TokenSwap contract to transfer their old MyBit tokens. 


### Parity & Mist
  1. Click 'watch contract' (Parity/Mist)
  2. Add old MyBit token [address](https://raw.githubusercontent.com/MyBitFoundation/MyBitToken/master/address/OldToken), name and [ABI](https://raw.githubusercontent.com/MyBitFoundation/MyBitToken/master/abis/OldToken.json)
  3. Open old MyBit token contract and click on 'pick a function' and choose the function 'approveAndCall' with the parameters below
    * spender = TokenSwap [address](https://github.com/MyBitFoundation/MyBitToken/blob/master/address/TokenSwap)
    * amount = Amount old MyBit to Swap (last 8 digits are considered decimals)
    * extra data = Any Byte array (can leave blank or put 0x0)
  4. Check new token balance at [etherscan](https://etherscan.io/token/0x5d60d8d7ef6d37e16ebabc324de3be57f135e0bc#readContract) or click 'watch contract' again and add the new token [address](https://github.com/MyBitFoundation/MyBitToken/blob/master/address/NewToken) and [ABI](https://raw.githubusercontent.com/MyBitFoundation/MyBitToken/master/abis/NewToken.json)


### MyEtherWallet 
  1. First open your Ethereum wallet, which contains MyBit. If unsure, see this [guide](https://www.cryptocompare.com/wallets/guides/how-to-use-myetherwallet/)
  2. At the top click on 'contracts', then 'interact with contracts'
  3. Add old MyBit Token [address](https://raw.githubusercontent.com/MyBitFoundation/MyBitToken/master/address/OldToken), name and [ABI](https://raw.githubusercontent.com/MyBitFoundation/MyBitToken/master/abis/OldToken.json)
  4. Click 'select a function' and click approveAndCall
  5. Under _spender, put in the TokenSwap [address](https://github.com/MyBitFoundation/MyBitToken/blob/master/address/TokenSwap)
  6. Under _value, put in the amount of tokens you wish to Swap (last 8 digits are considered decimals)
  7. Leave amountToSend equal to 0 and let MEW automatically generate the Gas Limit, then make transaction
  8. Check new token balance at [etherscan](https://etherscan.io/token/0x5d60d8d7ef6d37e16ebabc324de3be57f135e0bc#readContract) or click 'watch contract' again and add the new token [address](https://github.com/MyBitFoundation/MyBitToken/blob/master/address/NewToken), 18 decimals and any token symbol as long is it is not the same as entered for the old MyBit token. 



### ⚠ IMPORTANT: Do not transfer tokens to any contract. The contracts will handle all transfers themselves. 

#### Decimals and Ethereum: 

 >Ethereum doesn't actually process decimals so when entering token amounts it assumes that the last x digits are decimals. The old MyBit token considers the last 8 integers as decimals. The new token considers the last 18 integers as decimals. When transfering old MyBit tokens you must add 8 zeros to the end as these are considered decimals. ie. If want to transfer 100 old MYB tokens you must enter 10000000000.
 Every 1 old MYB transferred in will be replaced by 36 new MYB + 10 more decimal places. ie. 

`167345892 = 1.67345892 old MYB`
 
`167345892 * 36 * 10^10 = 60244521120000000000`

`60244521120000000000 = 60.24452112 new MYB` 

## Contracts

### [TokenSwap](https://etherscan.io/address/0x7DC8A6E706dA7c4A77d3710F7B7e621ee0074dC3)

This contract trades old MyBit tokens for new MyBit tokens. It replaces 1 old token for 36 new tokens. Upon creation the token swap contract is given the initial circulation, which is transferred to any account that can transfer old MyBit tokens using the swap() function in TokenSwap.sol. Alternatively the user can use approveAndCall() on the old MyBit contract with the TokenSwap contract address as the spender, which will trigger receiveApproval(), swapping the tokens in a single transaction.  The circulating supply of the old token is set in TokenSwap and must be 1/36 of the new circulating supply. 

### [CSToken](https://etherscan.io/address/0x94298f1e0ab2dfad6eeffb1426846a3c29d98090#code) (Old Token)
This is the sourcecode of the old MyBit token. It is a mintable ERC20 token. 

* totalSupply = 5 million
* circulatingSupply = 2,812,073.44012426
* name = MyBit Token
* decimals = 8
* symbol = MyB


### [ERC20](https://etherscan.io/address/0x5d60d8d7eF6d37E16EBABc324de3bE57f135e0BC#code) (New Token)
Standard ERC20 contract with a deflationary supply. This contract inherits from ERC20Interface and contains no owners. Allows for burning of tokens and doesn't allow transfers to address 0x0 or itself. 
  
* totalSupply = 180 million
* circulatingSupply = 101,234,643.84447336
* name = MyBit 
* decimals = 18
* symbol = MYB

### ERC20Interface 
The [Standard ERC20 interface](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) is being inherited by ERC20.

### [SafeMath](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/math/SafeMath.sol)
Standard SafeMath library from Zepplin. Help prevents integer overflows/underflows.

### TokenTest 
This is a helper contract to test ERC20 functions such as approveAndCall() and burnFrom()

## Testing
Tests can be found in test folder
To initiate tests run `truffle develop` and then `test tokenSwap.js`

##### Requirements:
 [BigNumber](https://github.com/MikeMcl/bignumber.js/) library.

### Tests:

* tokenSwap.js 
* tokenSwapApproveAndCall.js
* mint.js


### Code-coverage
The code coverage can be viewed in a browser at localhost/coverage/index.html 
To run code coverage see the guide [here](https://github.com/sc-forks/solidity-coverage) 


