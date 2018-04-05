pragma solidity ^0.4.19;

import './SafeMath.sol'; 

// TODO: add emit events
// Standard ERC20 Token Contract With TokenBurning
contract ERC20 {
    using SafeMath for uint256; 

    /// Token supply, balances and allowance
    uint256 public totalSupply;
    mapping (address => uint256) public balances;
    mapping (address => mapping (address => uint256)) public allowed;

    // Token Information
    string public name;                   //Full Token name: MyBit
    uint8 public decimals;                //How many decimals to show.
    string public symbol;                 //An identifier:  MYB


    function ERC20(uint256 _initialAmount, string _tokenName, uint8 _decimalUnits, string _tokenSymbol) 
    public {
        balances[msg.sender] = _initialAmount;               // Give the creator all initial tokens
        totalSupply = _initialAmount;                        // Update total supply
        name = _tokenName;                                   // Set the name for display purposes
        decimals = _decimalUnits;                            // Amount of decimals for display purposes
        symbol = _tokenSymbol;                               // Set the symbol for display purposes
    }

    function transfer(address _to, uint256 _value) 
    public 
    returns (bool success) {
        require(_to != address(0));                        // Don't flush tokens. Use burn() instead
        require(_value <= balances[msg.sender]);            // TODO: SafeMath will throw from this anyways 
        balances[msg.sender] = balances[msg.sender].sub(_value);    // SafeMath will throw if underflow
        balances[_to] = balances[_to].add(_value);
        Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) 
    public 
    returns (bool success) {
        require(_to != address(0));
        require(_value <= balances[_from]);    // TODO: SafeMath will throw 
        require(_value <= allowed[_from][msg.sender]);
        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        Transfer(_from, _to, _value);
        return true;
    }

    // Approve another address to spend tokens on senders behalf
    function approve(address _spender, uint256 _value) 
    public 
    returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    // Remove tokens from circulation
    function burn(uint256 _value) 
    public {
        require(_value <= balances[msg.sender]);
        address burner = msg.sender;
        balances[burner] = balances[burner].sub(_value);
        totalSupply = totalSupply.sub(_value);
        LogBurn(burner, _value);
        Transfer(burner, address(0), _value);
    }

    // // Allow owner to remove accidently transferred tokens
    // function transferAnyERC20Token(address tokenAddress, uint tokens) 
    // public 
    // onlyOwner 
    // returns (bool success) {
    //     return ERC20Interface(tokenAddress).transfer(owner, tokens);
    // }


    // TODO: Backwards compatible? 
    function balanceOf(address _owner) 
    public 
    view 
    returns (uint256 balance) {
        return balances[_owner];
    }

    // TODO: Backwards compatible?
    function allowance(address _owner, address _spender) 
    public 
    view 
    returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }   

    event Transfer(address indexed _from, address indexed _to, uint256 _value); 
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    event LogBurn(address indexed _burner, uint indexed _amountBurned); 
}


