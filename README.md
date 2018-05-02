# MyBitToken
This code is for a token migration, moving from an old ERC20 mintable token to a new ERC20 deflationairy supply token. The new token is fixed supply and has burning capabilities built into it. The new tokens cannot be bought, but instead must be claimed by transferring old tokens in to the TokenSwap contract. Once old tokens are transferred in the user will be transferred 36 new tokens for every 1 token claimed. The new tokens have 18 decimals and the old tokens have 8 decimals. The new token has no owners. 


## Contracts

### TokenSwap
This contract trades old MyBit tokens for new MyBit tokens. It replaces 1 old token for 36 new tokens. Upon creation the token swap contract is given the initial circulation, which is transferred to any account that can transfer old MyBit tokens using the swap() function in TokenSwap.sol. Alternatively the user can use approveAndCall() on the old MyBit contract with the TokenSwap contract address as the spender, which will trigger receiveApproval(), swapping the tokens in a single transaction.  The circulating supply of the old token is set in TokenSwap and must be 1/36 of the new circulating supply. 

### CSToken
This is the sourcecode of the old MyBit token. It is a mintable ERC20 token. Used for testing [MyBit token](https://etherscan.io/address/0x94298f1e0ab2dfad6eeffb1426846a3c29d98090#code)

* totalSupply = 5 million
* name = MyBit Token
* decimals = 8
* symbol = MyB


### ERC20
Standard ERC20 contract with a deflationary supply. This contract inherits from ERC20Interface and contains no owners.
  
* totalSupply = 180 million
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
Tests can be found in test/tokenSwap.js
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


