pragma solidity 0.4.23;

import './ERC20.sol';
import './SafeMath.sol';

// ------------------------------------------------------------------------
// Interface for old MyBitToken 
// ------------------------------------------------------------------------  
interface MyBitToken {

  function totalSupply() external constant returns (uint256);

  function balanceOf(address _owner) external constant returns (uint256);

  function transfer(address _to, uint256 _value) external;

  function transferFrom(address _from, address _to, uint256 _value) external returns (bool);

  function approve(address _spender, uint256 _value) external returns (bool);

  function allowance(address _owner, address _spender) external constant returns (uint256);
}

// ------------------------------------------------------------------------
// This contract is in-charge of receiving old MyBit tokens and returning
// New MyBit tokens to users.
// Note: Old tokens have 8 decimal places, while new tokens have 18 decimals
// 1.00000000 OldMyBit == 36.000000000000000000 NewMyBit
// ------------------------------------------------------------------------  
contract TokenSwap { 
  using SafeMath for uint256; 


  // ------------------------------------------------------------------------
  // Token addresses
  // ------------------------------------------------------------------------  
  address public oldTokenAddress;
  ERC20 public newToken; 

  // ------------------------------------------------------------------------
  // Token Transition Info
  // ------------------------------------------------------------------------  
  uint256 public scalingFactor = 36;          // 1 OldMyBit = 36 NewMyBit
  uint256 public tenDecimalPlaces = 10**10; 


  // ------------------------------------------------------------------------
  // Old Token Supply 
  // ------------------------------------------------------------------------  
  uint256 public oldCirculatingSupply;      // Old MyBit supply in circulation (8 decimals)


  // ------------------------------------------------------------------------
  // New Token Supply
  // ------------------------------------------------------------------------  
  uint256 public totalSupply = 18000000000000000 * tenDecimalPlaces;      // New token supply. (Moving from 8 decimal places to 18)
  uint256 public circulatingSupply = 10123464384447336 * tenDecimalPlaces;   // New user supply. 
  uint256 public foundationSupply = totalSupply - circulatingSupply;      // Foundation supply. 

  // ------------------------------------------------------------------------
  // Distribution numbers 
  // ------------------------------------------------------------------------
  uint256 public tokensRedeemed = 0;    // Total number of new tokens redeemed.


  // ------------------------------------------------------------------------
  // Double check that all variables are set properly before swapping tokens
  // ------------------------------------------------------------------------
  constructor(address _myBitFoundation, address _oldTokenAddress)
  public { 
    oldTokenAddress = _oldTokenAddress; 
    oldCirculatingSupply = ERC20(oldTokenAddress).totalSupply(); 
    assert ((circulatingSupply.div(oldCirculatingSupply.mul(tenDecimalPlaces))) == scalingFactor);
    assert (oldCirculatingSupply.mul(scalingFactor.mul(tenDecimalPlaces)) == circulatingSupply); 
    newToken = new ERC20(totalSupply, "MyBit", 18, "MYB"); 
    newToken.transfer(_myBitFoundation, foundationSupply);
  }

  // ------------------------------------------------------------------------
  // Users can trade old MyBit tokens for new MyBit tokens here 
  // Must approve this contract as spender to swap tokens
  // ------------------------------------------------------------------------
  function swap(uint256 _amount) 
  public 
  noMint
  returns (bool){ 
    require(MyBitToken(oldTokenAddress).transferFrom(msg.sender, this, _amount));
    uint256 newTokenAmount = _amount.mul(scalingFactor).mul(tenDecimalPlaces);   // Add 10 more decimals to number of tokens
    assert(tokensRedeemed.add(newTokenAmount) <= circulatingSupply);       // redeemed tokens should never exceed circulatingSupply
    tokensRedeemed = tokensRedeemed.add(newTokenAmount);
    require(newToken.transfer(msg.sender, newTokenAmount));
    emit LogTokenSwap(msg.sender, _amount, block.timestamp);
    return true;
  }

  // ------------------------------------------------------------------------
  // Alias for swap(). Called by old token contract when approval to transfer 
  // tokens has been given. 
  // ------------------------------------------------------------------------
  function receiveApproval(address _from, uint256 _amount, address _token, bytes _data)
  public 
  noMint
  returns (bool){ 
    require(_token == oldTokenAddress);
    require(MyBitToken(oldTokenAddress).transferFrom(_from, this, _amount));
    uint256 newTokenAmount = _amount.mul(scalingFactor).mul(tenDecimalPlaces);   // Add 10 more decimals to number of tokens
    assert(tokensRedeemed.add(newTokenAmount) <= circulatingSupply);    // redeemed tokens should never exceed circulatingSupply
    tokensRedeemed = tokensRedeemed.add(newTokenAmount);
    require(newToken.transfer(_from, newTokenAmount));
    emit LogTokenSwap(_from, _amount, block.timestamp);
    return true;
  }

  // ------------------------------------------------------------------------
  // Events 
  // ------------------------------------------------------------------------
  event LogTokenSwap(address indexed _sender, uint256 indexed _amount, uint256 indexed _timestamp); 


  // ------------------------------------------------------------------------
  // Modifiers 
  // ------------------------------------------------------------------------


  // ------------------------------------------------------------------------
  // This ensures that the owner of the previous token doesn't mint more 
  // tokens during swap
  // ------------------------------------------------------------------------
  modifier noMint { 
    require(oldCirculatingSupply == MyBitToken(oldTokenAddress).totalSupply());
    _;
  }

}

