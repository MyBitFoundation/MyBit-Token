# MyBit Token
This code is for a token migration, moving from our old ERC20 mintable token to a new ERC20 deflationairy supply token. The new token has burning capabilities built into it, which will decrease the totalSupply as users burn tokens to access the network. The new tokens cannot be bought, but instead must be claimed by approving the TokenSwap contract with the wallet that is holding old MyBit tokens (DO NOT MANUALLY TRANSFER TOKENS TO THE CONTRACT). For every 1 old token swapped, the user will receive 36 new tokens. The new token has no owners and contains 10 more decimal places than the old token, giving it 18 decimal places total. 

## Contracts

#### ⚠️ IMPORTANT: Do not transfer tokens to any contract! The contracts will handle all token transfers once they receive approval. 

### Published on Main Net

#### `0x7DC8A6E706dA7c4A77d3710F7B7e621ee0074dC3` TokenSwap
#### `0x5d60d8d7eF6d37E16EBABc324de3bE57f135e0BC` NewToken
#### `0x94298F1e0Ab2DFaD6eEFfB1426846a3c29D98090` OldToken

*Verified proof through Keybase on https://twitter.com/MyBit_DApp/status/993879392433602560*

### TokenSwap
This contract trades old MyBit tokens for new MyBit tokens. It replaces 1 old token for 36 new tokens. Upon creation the token swap contract is given the initial circulation, which is transferred to any account that can transfer old MyBit tokens using the swap() function in TokenSwap.sol. Alternatively the user can use approveAndCall() on the old MyBit contract with the TokenSwap contract address as the spender, which will trigger receiveApproval(), swapping the tokens in a single transaction.  The circulating supply of the old token is set in TokenSwap and must be 1/36 of the new circulating supply. 

### CSToken (Old Token)
This is the sourcecode of the old MyBit token. It is a mintable ERC20 token. Used for testing [MyBit token](https://etherscan.io/address/0x94298f1e0ab2dfad6eeffb1426846a3c29d98090#code)

* totalSupply = 5 million
* circulatingSupply = 2,812,073.44012426
* name = MyBit Token
* decimals = 8
* symbol = MyB


### ERC20 (New Token)
Standard ERC20 contract with a deflationary supply. This contract inherits from ERC20Interface and contains no owners. Allows for burning of tokens and doesn't allow transfers to address 0x0 or itself. 
  
* totalSupply = 180 million
* circulatingSupply = 101,234,643.84447336
* name = MyBit 
* decimals = 18
* symbol = MYB

### ERC20Interface 
The [Standard ERC20 interface](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) is being inherited by ERC20.

### SafeMath
Standard [safemath](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/math/SafeMath.sol) library from Zepplin. Help prevent integer overflows/underflows.

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


