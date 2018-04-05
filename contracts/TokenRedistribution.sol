pragma solidity ^0.4.19;

import './ERC20.sol';
import './SafeMath.sol';

interface MyBitToken {

  function totalSupply() public constant returns (uint256);

  function balanceOf(address _owner) public constant returns (uint256);

  function transfer(address _to, uint256 _value) public;

  function transferFrom(address _from, address _to, uint256 _value) public returns (bool);

  function approve(address _spender, uint256 _value) public returns (bool);

  function allowance(address _owner, address _spender) public constant returns (uint256);
}

contract Owned {
    address public owner;
    address public newOwner;

    event OwnershipTransferred(address indexed _from, address indexed _to);

    function Owned() public {
        owner = msg.sender;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }

    function acceptOwnership() public {
        require(msg.sender == newOwner);
        OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        newOwner = address(0);
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }
}

contract TokenRedistribution is Owned{ 
  using SafeMath for uint256; 

// Token addresses
address public oldTokenAddress;
ERC20 public newToken; 


// New Token Supply
uint256 public initialSupply = 17800000000000000;
uint256 public circulatingSupply = 10010981446842366;
uint256 public foundationSupply = initialSupply - circulatingSupply; 

// Token Transition Info
uint256 public scalingFactor = 356;
uint256 public circulatingPercentage = 562414688;   // scaled up 10^9

// Distribution numbers 
uint256 public tokensRedeemed = 0;

// Safety Checks 
bool public ready = false;

// TODO: Make this contract owner of ERC20?  (For retrieving lost tokens)
function TokenRedistribution(address _myBitFoundation, address _oldTokenAddress)
public { 
  assert (initialSupply == circulatingSupply + foundationSupply); 
  oldTokenAddress = _oldTokenAddress; 
  newToken = new ERC20(initialSupply, "MyBit", 8, "MYB"); 
  newToken.transfer(_myBitFoundation, foundationSupply);
}

// Double check that all variables are set properly before swapping tokens
function sanityCheck()
public 
onlyOwner { 
  // TODO: check scaling factor
  assert ((circulatingSupply.mul(10**9).div(initialSupply)) == circulatingPercentage); 
  ready = true;
}


function swap(uint256 _amount) 
public 
whenReady
returns (bool){ 
  require(MyBitToken(oldTokenAddress).transferFrom(msg.sender, this, _amount));
  require(tokensRedeemed.add(_amount) <= circulatingSupply);
  uint256 newTokenAmount = _amount.mul(scalingFactor).div(10);
  tokensRedeemed = tokensRedeemed.add(newTokenAmount);
  require(newToken.transfer(msg.sender, newTokenAmount));
  LogTokenSwap(msg.sender, _amount, block.timestamp);
  return true;
}



event LogTokenSwap(address indexed _sender, uint256 indexed _amount, uint256 indexed _timestamp); 

modifier whenReady { 
  require(ready);
  _;
}


}

