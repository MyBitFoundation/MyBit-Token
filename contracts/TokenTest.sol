pragma solidity 0.4.23;

import './ERC20.sol';

// ----------------------------------------------------------------------------
// Contract to test
// ----------------------------------------------------------------------------
contract TokenTest {

    // ----------------------------------------------------------------------------
    // Approval variables
    // ----------------------------------------------------------------------------
    mapping (bytes32 => bytes) public data; 
    mapping (bytes32 => address) public token; 
    mapping (bytes32 => uint) public amount; 
    mapping (bytes32 => address) public from; 

    mapping (bytes32 => bool) public receivedApproval; 


    // ----------------------------------------------------------------------------
    // Burn tokens for user (simulates burnFrom())
    // ----------------------------------------------------------------------------
    function burnTokens(address _erc20Contract, address _from, uint _amount)
    public { 
      ERC20 tokenContract = ERC20(_erc20Contract);
      require(tokenContract.burnFrom(_from, _amount));
      emit LogBurnFrom(_erc20Contract, _amount, _from); 
    }

    // ----------------------------------------------------------------------------
    // Receive callback from approveAndCall() and store variables
    // ----------------------------------------------------------------------------
    function receiveApproval(address _from, uint _tokens, address _token, bytes _data) 
    public { 
      bytes32 ID = keccak256(_token, _tokens, _data); 
      receivedApproval[ID] = true; 
      data[ID] = _data; 
      token[ID] = _token; 
      amount[ID] = _tokens; 
      from[ID] = _from; 
      burnTokens(_token, _from, _tokens);
      emit LogApprovalReceived(_token, _tokens, _data, ID); 
    }

    // ----------------------------------------------------------------------------
    // To help with testing. Returns ID of a approval callback
    // ----------------------------------------------------------------------------
    function getCallID(address _contract, uint _amount, bytes _data) 
    public 
    pure
    returns (bytes32) { 
      return keccak256(_contract, _amount, _data); 
    }

    // ----------------------------------------------------------------------------
    // Helper to create a bytes data for receiving approval
    // ----------------------------------------------------------------------------
    function stringToData(string _stringParam)
    public 
    pure 
    returns (bytes){ 
      return bytes(_stringParam);
    }

    // ----------------------------------------------------------------------------
    // Approval variables
    // ----------------------------------------------------------------------------
    event LogApprovalReceived(address _erc20Contract, uint _amount, bytes _data, bytes32 _ID);
    event LogBurnFrom(address _erc20Contract, uint _amount, address _burner); 
}
