pragma solidity ^0.4.19;

import './ERC20.sol';
import './SafeMath.sol';

// ------------------------------------------------------------------------
// Interface for old MyBitToken 
// ------------------------------------------------------------------------  
interface MyBitToken {

  function totalSupply() public constant returns (uint256);

  function balanceOf(address _owner) public constant returns (uint256);

  function transfer(address _to, uint256 _value) public;

  function transferFrom(address _from, address _to, uint256 _value) public returns (bool);

  function approve(address _spender, uint256 _value) public returns (bool);

  function allowance(address _owner, address _spender) public constant returns (uint256);
}

// ------------------------------------------------------------------------
// Ownership controls. 
// ------------------------------------------------------------------------  
contract Owned {
    address public owner;

    function Owned() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
}

// ------------------------------------------------------------------------
// This contract is in-charge of receiving old MyBit tokens and returning
// New MyBit tokens to users.
// Note: Old tokens have 8 decimal places, while new tokens have 18 decimals
// 1.00000000 OldMyBit == 36.000000000000000000 NewMyBit
// ------------------------------------------------------------------------  
contract TokenSwap is Owned{ 
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
  uint256 public circulatingPercentage = 56241468802;   // The percentage of totalsupply previously released. floating point 10^11
  uint256 public tenDecimalPlaces = 10**10; 


  // ------------------------------------------------------------------------
  // Old Token Supply 
  // ------------------------------------------------------------------------  
  uint256 public oldCirculatingSupply = 281207344012426;      // Old MyBit supply in circulation (8 decimals)
  uint256 public oldTotalSupply = 500000000000000;          // Old MyBit supply not yet released (8 decimals)


  // ------------------------------------------------------------------------
  // New Token Supply
  // ------------------------------------------------------------------------  
  uint256 public totalSupply = 18000000000000000 * tenDecimalPlaces;      // New token supply. Move from 8 decimal places to 18
  uint256 public circulatingSupply = 10123464384447336 * tenDecimalPlaces;   // New user supply. 
  uint256 public foundationSupply = totalSupply - circulatingSupply;      // Foundation supply. 

  // ------------------------------------------------------------------------
  // Distribution numbers 
  // ------------------------------------------------------------------------
  uint256 public tokensRedeemed = 0;    // Total number of new tokens redeemed.

  // ------------------------------------------------------------------------
  // Safety Checks 
  // ------------------------------------------------------------------------
  bool public ready = false;     // Have all the supply numbers been properly calculated? 


  // ------------------------------------------------------------------------
  // Double check that all variables are set properly before swapping tokens
  // TODO: Make this contract owner of ERC20?  (For retrieving lost tokens)
  // ------------------------------------------------------------------------
  function TokenSwap(address _myBitFoundation, address _oldTokenAddress)
  public { 
    assert (totalSupply == circulatingSupply + foundationSupply); 
    oldTokenAddress = _oldTokenAddress; 
    newToken = new ERC20(totalSupply, "MyBit", 18, "MYB"); 
    newToken.transfer(_myBitFoundation, foundationSupply);
  }

  // ------------------------------------------------------------------------
  // Double check that all variables are set properly before swapping tokens
  // ------------------------------------------------------------------------
  function sanityCheck()
  public 
  onlyOwner { 
    require (ready == false);
    assert ((circulatingSupply.div(oldCirculatingSupply.mul(tenDecimalPlaces))) == scalingFactor);
    assert (totalSupply.div(oldTotalSupply.mul(tenDecimalPlaces)) == scalingFactor);
    assert ((circulatingSupply.mul(10**11).div(totalSupply)) == circulatingPercentage); 
    ready = true;
  }

  // ------------------------------------------------------------------------
  // Users can trade old MyBit tokens for new MyBit tokens here 
  // Must approve this contract to transfer in tokens
  // TODO: Re-entrancy?
  // ------------------------------------------------------------------------
  function swap(uint256 _amount) 
  public 
  whenReady
  returns (bool){ 
    require(MyBitToken(oldTokenAddress).transferFrom(msg.sender, this, _amount));
    require(tokensRedeemed.add(_amount) <= circulatingSupply);
    uint256 newTokenAmount = _amount.mul(scalingFactor).mul(tenDecimalPlaces);   // Add 10 more decimals to number of tokens
    tokensRedeemed = tokensRedeemed.add(newTokenAmount);
    require(newToken.transfer(msg.sender, newTokenAmount));
    LogTokenSwap(msg.sender, _amount, block.timestamp);
    return true;
  }

  // ------------------------------------------------------------------------
  // Events 
  // ------------------------------------------------------------------------
  event LogTokenSwap(address indexed _sender, uint256 indexed _amount, uint256 indexed _timestamp); 


  // ------------------------------------------------------------------------
  // modifiers 
  // ------------------------------------------------------------------------
  modifier whenReady { 
    require(ready);
    _;
  }


}

