pragma solidity ^0.4.19;

import './ERC20.sol';

// ----------------------------------------------------------------------------
// Receive approval and then execute function
// ----------------------------------------------------------------------------
contract TestApprovalAndCall {

 
    mapping (bytes32 => bytes) public data; 
    mapping (bytes32 => address) public token; 
    mapping (bytes32 => uint) public amount; 
    mapping (bytes32 => address) public from; 

    mapping (bytes32 => bool) public sentToContract; 
    mapping (bytes32 => bool) public receivedApproval; 


    function receiveApproval(address _from, uint _tokens, address _token, bytes _data) 
    public { 
      bytes32 ID = keccak256(_token, _tokens, _data); 
      receivedApproval[ID] = true; 
      data[ID] = _data; 
      token[ID] = _token; 
      amount[ID] = _tokens; 
      from[ID] = _from; 
      LogApprovalReceived(_token, _tokens, _data, ID); 
    }

    function testApproveAndCall(address _erc20Contract, address _spender, uint _amount, bytes _data)
    public { 
      ERC20 thisTokenContract = ERC20(_erc20Contract); 
      thisTokenContract.approveAndCall(_spender, _amount, _data);
      sentToContract[keccak256(_erc20Contract, _amount, _data)] = true; 
      LogApproveAndCall(_erc20Contract, _amount, _data, keccak256(_erc20Contract, _amount, _data)); 
    }

    function getCallID(address _contract, uint _amount, bytes _data) 
    public 
    returns (bytes32) { 
      return keccak256(_contract, _amount, _data); 
    }

    function stringToData(string _stringParam)
    public 
    pure 
    returns (bytes){ 
      return bytes(_stringParam);
    }

    event LogApproveAndCall(address _erc20Contract, uint _amount, bytes _data, bytes32 _ID); 
    event LogApprovalReceived(address _erc20Contract, uint _amount, bytes _data, bytes32 _ID);
}
