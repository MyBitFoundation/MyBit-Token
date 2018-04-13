# MyBitToken
This code is for a token migration, moving from an old ERC20 mintable token to a new ERC20 fixed supply token. The new token is fixed supply and has burning capabilities built into it. The new tokens cannot be bought, but instead must be claimed by transferring old tokens in to the TokenSwap contract. Once old tokens are transferred in the user will be transferred 36 new tokens for every 1 token claimed. The new tokens have 18 decimals and the old tokens have 8 decimals. The new token has no owners. 


# Contracts

## TokenSwap
This contract trades old MyBit tokens for new MyBit tokens. It replaces 1 old token for 36 new tokens. Upon creation the token swap contract is given the initial circulation, which is transferred to any account that can transfers old MyBit tokens using the swap() function. 

## CSTOken
This is the sourcecode of the old MyBit token. It is a mintable ERC20 token. Used for testing [MyBit token](https://etherscan.io/address/0x94298f1e0ab2dfad6eeffb1426846a3c29d98090#code)

## ERC20
Implements the standard erc20 functions, with a function for burning tokens. 

## ERC20Interface 
[Standard ERC20 interface] 
https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md

## SafeMath
Standard [safemath](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/math/SafeMath.sol) library from Zepplin. Help prevent integer overflows/underflows.

# Testing
The code coverage can be found in coverage.json file, or viewed in a browser at coverage/index.html 

Tests can be found in test/tokenSwap.js
