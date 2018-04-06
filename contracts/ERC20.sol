pragma solidity ^0.4.19;

// https://theethereum.wiki/w/index.php/ERC20_Token_Standard

import './SafeMath.sol'; 
import './ERC20Interface.sol';


// ----------------------------------------------------------------------------
// Receive approval and then execute function
// ----------------------------------------------------------------------------
contract ApproveAndCallFallBack {
    function receiveApproval(address from, uint256 tokens, address token, bytes data) public;
}


// TODO: add emit events + inherit ERC20Interface
// Standard ERC20 Token Contract With TokenBurning
contract ERC20 {
    using SafeMath for uint256; 

    // ------------------------------------------------------------------------
    /// Token supply, balances and allowance
    // ------------------------------------------------------------------------
    uint256 public totalSupply;
    mapping (address => uint256) public balances;
    mapping (address => mapping (address => uint256)) public allowed;

    // ------------------------------------------------------------------------
    // Token Information
    // ------------------------------------------------------------------------
    string public name;                   //Full Token name: MyBit
    uint8 public decimals;                //How many decimals to show.
    string public symbol;                 //An identifier:  MYB


    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    function ERC20(uint256 _initialAmount, string _tokenName, uint8 _decimalUnits, string _tokenSymbol) 
    public {
        balances[msg.sender] = _initialAmount;               // Give the creator all initial tokens
        totalSupply = _initialAmount;                        // Update total supply
        name = _tokenName;                                   // Set the name for display purposes
        decimals = _decimalUnits;                            // Amount of decimals for display purposes
        symbol = _tokenSymbol;                               // Set the symbol for display purposes
    }


    // ------------------------------------------------------------------------
    // Transfer _amount tokens to address _to 
    // Sender mus have enough tokens. Cannot send to 0x0 
    // ------------------------------------------------------------------------
    function transfer(address _to, uint _amount) 
    public 
    returns (bool success) {
        require(_to != address(0));
        require(_amount <= balances[msg.sender]);        // TODO:  superfluous
        balances[msg.sender] = balances[msg.sender].sub(_amount);
        balances[_to] = balances[_to].add(_amount);
        Transfer(msg.sender, _to, _amount);
        return true;
    }

    // ------------------------------------------------------------------------
    // Transfer _amount of tokens if _from has allowed msg.sender to do so
    //  _from must have enough tokens + must have approved msg.sender 
    // ------------------------------------------------------------------------
    function transferFrom(address _from, address _to, uint _amount) 
    public 
    returns (bool success) {
        require(_to != address(0)); 
        require(_amount <= balances[msg.sender]);
        balances[_from] = balances[_from].sub(_amount);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_amount);
        balances[_to] = balances[_to].add(_amount);
        Transfer(_from, _to, _amount);
        return true;
    }

    // ------------------------------------------------------------------------
    // Token owner can approve for `spender` to transferFrom(...) `tokens`
    // from the token owner's account
    // ------------------------------------------------------------------------
    function approve(address spender, uint tokens) 
    public 
    returns (bool success) {
        allowed[msg.sender][spender] = tokens;
        Approval(msg.sender, spender, tokens);
        return true;
    }


    // ------------------------------------------------------------------------
    // Token holder can notify a contract that it has been approved
    // to spend _amount of tokens
    // ------------------------------------------------------------------------
    function approveAndCall(address spender, uint tokens, bytes data) public returns (bool success) {
        allowed[msg.sender][spender] = tokens;
        Approval(msg.sender, spender, tokens);
        ApproveAndCallFallBack(spender).receiveApproval(msg.sender, tokens, this, data);
        return true;
    }

    // ------------------------------------------------------------------------
    // User can burn tokens here
    // ------------------------------------------------------------------------   
    function burn(uint256 _amount) 
    public 
    returns (bool success) {
        require(_amount <= balances[msg.sender]);    // TODO: superfluous with safemath
        address burner = msg.sender;
        balances[burner] = balances[burner].sub(_amount);
        totalSupply = totalSupply.sub(_amount);
        LogBurn(msg.sender, _amount);
        Transfer(msg.sender, address(0), _amount);
        return true;
    }

    // ------------------------------------------------------------------------
    // An account approved to spend a users tokens can burn them here
    // ------------------------------------------------------------------------    
    function burnFrom(address _from, uint256 _amount) 
    public 
    returns (bool success) {
        require(balances[_from] >= _amount);                // TODO: superfluous
        require(_amount <= allowed[_from][msg.sender]);    // TODO: superfluous
        balances[_from] = balances[_from].sub(_amount);                         // Subtract from the targeted balance
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_amount);             // Subtract from the sender's allowance
        totalSupply = totalSupply.sub(_amount);                              // Update totalSupply
        LogBurn(_from, _amount);
        Transfer(_from, address(0), _amount);
        return true;
    }


    // ------------------------------------------------------------------------
    // Returns the token balance of user
    // ------------------------------------------------------------------------
    function balanceOf(address _tokenHolder) 
    public 
    view 
    returns (uint balance) {
        return balances[_tokenHolder];
    }

    // ------------------------------------------------------------------------
    // Returns amount of tokens _spender is allowed to transfer/burn
    // ------------------------------------------------------------------------
    function allowance(address _tokenHolder, address _spender) 
    public 
    view 
    returns (uint remaining) {
        return allowed[_tokenHolder][_spender];
    }


    // ------------------------------------------------------------------------
    // Don't accept ETH
    // ------------------------------------------------------------------------
    function () 
    public 
    payable {
        revert();
    }

    // ------------------------------------------------------------------------
    // Token Events
    // ------------------------------------------------------------------------
    event Transfer(address indexed from, address indexed to, uint256 tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint256 tokens);
    event LogBurn(address indexed _burner, uint indexed _amountBurned); 
}


