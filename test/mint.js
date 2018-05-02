// ---------------------------------------------------------------------------------------------------
//  Requiresat least 9 accounts
// ---------------------------------------------------------------------------------------------------

var BigInteger = require('./biginteger.js').BigInteger;
var BigNumber = require('bignumber.js');

// Initiate contract artifacts
const Token = artifacts.require("./ERC20.sol");
const TokenSwap = artifacts.require("./TokenSwap.sol");
const OldToken = artifacts.require("./CSToken.sol");
const TokenTest = artifacts.require("./TokenTest.sol");


contract('TokenSwap', async (accounts) => {
  const ownerOne = web3.eth.accounts[0];
  const ownerTwo = web3.eth.accounts[1];
  const myBitFoundation = web3.eth.accounts[8];


  // Initiate contract instances
  let tokenInstance;
  let tokenSwapInstance;
  let oldTokenInstance;
  let testInstance;


   // Distribute old token 
  const oldTokenSupply = 281207344012426;  
  const oldTokenDecimals = 10**8; 
  const oldTokenPerAccount = 1000 * oldTokenDecimals; 


  // Deploy contract used to test token
  it("deploy tester contract", async () => { 
    // Deploy testing contract 
    testInstance = await TokenTest.new();
  });

  // Deploy old MyBitToken contract
  it("deploy old mybit token", async () => { 
    oldTokenInstance = await OldToken.new(oldTokenSupply, "MyBit Token", 8, "MyB");
    assert.equal(await oldTokenInstance.totalSupply(), oldTokenSupply);
    assert.equal(await oldTokenInstance.balanceOf(ownerOne), oldTokenSupply);
  }); 

  // Give every user oldTokenPerAccount amount of old mybit tokens
  it("spread old tokens to users", async () => {
    for (var i = 1; i < web3.eth.accounts.length; i++) { 
      await oldTokenInstance.transfer(web3.eth.accounts[i], oldTokenPerAccount); 
      let userBalance = await oldTokenInstance.balanceOf(web3.eth.accounts[i]);
      assert.equal(userBalance, oldTokenPerAccount);
    }
    // Check token ledger is correct
    const totalOldTokensCirculating = (web3.eth.accounts.length - 1) * (oldTokenPerAccount);
    const remainingTokens = oldTokenSupply - totalOldTokensCirculating;
    assert.equal(await oldTokenInstance.balanceOf(ownerOne), remainingTokens); 
  });


 // -------------------Begin distribution of new token ------------------------------


 // Initialize token information
 const name = "MyBit";
 const symbol = "MYB"; 
 const decimals = 10**18;
 const tenDecimals = 10**10; 



 // Token numbers
 const tokenSupply = 18000000000000000;      // Scaled up by 10^8 to match old tokens 
 const circulatingSupply = 10123464384447336;   // This is scaled up by 10^8 to match old tokens 10123464384447336
 const foundationSupply = tokenSupply - circulatingSupply; 
 const scalingFactor = 36;   // 1 OldToken = 36 New Tokens

  it("deploy swap contract", async () => { 
    assert.equal(tokenSupply, (circulatingSupply + foundationSupply));   
    tokenSwapInstance = await TokenSwap.new(myBitFoundation, oldTokenInstance.address);    // Constructor deploys new token
    tokenAddress = await tokenSwapInstance.newToken();    
    tokenInstance = Token.at(tokenAddress);
    assert.equal(tokenAddress, tokenInstance.address);      // Make sure instance is working

    // Check distribution variables are correct
    assert.equal(await tokenSwapInstance.totalSupply(), tokenSupply * tenDecimals);
    assert.equal(await tokenSwapInstance.tenDecimalPlaces(), tenDecimals);
    assert.equal(await tokenSwapInstance.scalingFactor(), scalingFactor);  // Scaling factor is moved up 10, due to lack of decimals in solidity
    assert.equal(await tokenSwapInstance.circulatingSupply(), circulatingSupply * tenDecimals);
    assert.equal(await tokenSwapInstance.foundationSupply(), foundationSupply * tenDecimals);

    // Check Token variables are correct
    assert.equal(await tokenInstance.balanceOf(myBitFoundation), foundationSupply * tenDecimals, "Verify that foundation received tokens"); 
    assert.equal(await tokenInstance.balanceOf(tokenSwapInstance.address), circulatingSupply * tenDecimals, "Verify that Distribution contract has all new tokens");  
    assert.equal(await tokenInstance.decimals(), 18, "New Token should have 18 decimal places");
    assert.equal(await tokenInstance.totalSupply(), tokenSupply * tenDecimals);
    assert.equal(await tokenInstance.name(), name);
    assert.equal(await tokenInstance.symbol(), symbol);

  });

  it("Try swapping 0 tokens", async () => { 
    let ownerOldTokenBalance = await oldTokenInstance.balanceOf(ownerOne); 
    let oldTotalSupply = await oldTokenInstance.totalSupply();
    let newTotalSupply = await tokenInstance.totalSupply(); 
    // Approve transfer
    await tokenSwapInstance.swap(0); 
    //Check tokens transferred properly
    console.log(ownerOldTokenBalance);
    console.log(await oldTokenInstance.balanceOf(ownerOne)); 
    assert.equal(BigNumber(await oldTokenInstance.balanceOf(ownerOne)).eq(ownerOldTokenBalance), true, "Old token balance wasn't updated properly");
    assert.equal(BigNumber(oldTotalSupply).eq(await oldTokenInstance.totalSupply()), true); 
    assert.equal(BigNumber(await tokenInstance.totalSupply()).eq(newTotalSupply), true);
  });

  it("Swap Old tokens for new tokens... account one", async () => { 
    let ownerOldTokenBalance = await oldTokenInstance.balanceOf(ownerOne); 
    // Approve transfer
    await oldTokenInstance.approve(tokenSwapInstance.address, ownerOldTokenBalance); 
    await tokenSwapInstance.swap(ownerOldTokenBalance); 
    //Check tokens transferred properly
    assert.equal(await oldTokenInstance.balanceOf(ownerOne), 0, "Old token balance wasn't updated properly");
    assert.equal(await tokenInstance.balanceOf(ownerOne) / 10**10, (ownerOldTokenBalance * scalingFactor), "New token balance does not match expected");
  });

  it("Mint old tokens and try to continue swap", async () => { 
     let thisUser = web3.eth.accounts[1];
     let oldSupply = await oldTokenInstance.totalSupply(); 
     let oldUserBalance = await oldTokenInstance.balanceOf(thisUser); 
     let swapExecution = null;
     // Mint more tokens 
     await oldTokenInstance.mintToken(ownerOne, 1, {from: ownerOne}); 
     assert.equal(BigNumber(oldSupply).eq(await oldTokenInstance.totalSupply()), false); 
     await oldTokenInstance.approve(tokenSwapInstance.address, oldUserBalance, {from: thisUser}); 
     try {await tokenSwapInstance.swap(oldUserBalance,{from:thisUser});}
     catch (error) {swapExecution = error}
     assert.notEqual(swapExecution, null);
  });


  it("Burn rest of the tokens", async () => { 
    for (let i = 0; i < web3.eth.accounts.length; i++) { 
      let thisUser = web3.eth.accounts[i]; 
      let thisUserBalance = await tokenInstance.balanceOf(thisUser);
      let totalSupply = await tokenInstance.totalSupply();
      if (thisUserBalance == 0) {  return;   }
      await tokenInstance.burn(thisUserBalance, {from: thisUser});
      assert.equal(Number(await tokenInstance.balanceOf(thisUser)), 0);
      assert.equal(Number(await tokenInstance.totalSupply()), BigInteger(totalSupply).subtract(thisUserBalance));
    }
    assert.equal(await tokenInstance.totalSupply(), 0); 
    assert.equal(await tokenSwapInstance.tokensRedeemed(), await tokenSwapInstance.circulatingSupply());
  }); 

});

// Will input old supply wrong
contract('TokenSwap with wrong supply numbers for previous token', async (accounts) => {
  const ownerOne = web3.eth.accounts[0];
  const ownerTwo = web3.eth.accounts[1];
  const myBitFoundation = web3.eth.accounts[8];


  // Initiate contract instances
  let tokenInstance;
  let tokenSwapInstance;
  let oldTokenInstance;
  let testInstance;


   // Distribute old token 
  const oldTokenSupply = 281207344012427;    // ADDED 1 to the token supply
  const oldTokenDecimals = 10**8; 
  const oldTokenPerAccount = 1000 * oldTokenDecimals; 


  // Deploy contract used to test token
  it("deploy tester contract", async () => { 
    // Deploy testing contract 
    testInstance = await TokenTest.new();
  });

  // Deploy old MyBitToken contract
  it("deploy old mybit token", async () => { 
    oldTokenInstance = await OldToken.new(oldTokenSupply, "MyBit Token", 8, "MyB");
    assert.equal(await oldTokenInstance.totalSupply(), oldTokenSupply);
    assert.equal(await oldTokenInstance.balanceOf(ownerOne), oldTokenSupply);
  }); 

  // Give every user oldTokenPerAccount amount of old mybit tokens
  it("spread old tokens to users", async () => {
    for (var i = 1; i < web3.eth.accounts.length; i++) { 
      await oldTokenInstance.transfer(web3.eth.accounts[i], oldTokenPerAccount); 
      let userBalance = await oldTokenInstance.balanceOf(web3.eth.accounts[i]);
      assert.equal(userBalance, oldTokenPerAccount);
    }
    // Check token ledger is correct
    const totalOldTokensCirculating = (web3.eth.accounts.length - 1) * (oldTokenPerAccount);
    const remainingTokens = BigNumber(oldTokenSupply).minus(totalOldTokensCirculating);
    assert.equal(BigNumber(await oldTokenInstance.balanceOf(ownerOne)).eq(remainingTokens), true); 
  });


 // -------------------Begin distribution of new token ------------------------------


  // Initialize token information
  const name = "MyBit";
  const symbol = "MYB"; 
  const decimals = 10**18;
  const tenDecimals = 10**10; 



  // Token numbers
  const tokenSupply = 18000000000000000;      // Scaled up by 10^8 to match old tokens 
  const circulatingSupply = 10123464384447336;   // This is scaled up by 10^8 to match old tokens 10123464384447336
  const foundationSupply = tokenSupply - circulatingSupply; 
  const scalingFactor = 36;   // 1 OldToken = 36 New Tokens



  it("swap contract should not deploy with incorrect old token supply numbers", async () => { 
    assert.equal(tokenSupply, (circulatingSupply + foundationSupply));   
    let swapDeployExecution = null;
    try { await TokenSwap.new(myBitFoundation, oldTokenInstance.address);  }  // Constructor deploys new token
    catch (error) {swapDeployExecution = error; }
    assert.notEqual(swapDeployExecution, null); 
  });


});


// Will input old supply wrong
contract('Recover lost tokens', async (accounts) => {
  const ownerOne = web3.eth.accounts[0];
  const ownerTwo = web3.eth.accounts[1];
  const myBitFoundation = web3.eth.accounts[8];


  // Initiate contract instances
  let tokenInstance;
  let tokenSwapInstance;
  let oldTokenInstance;
  let testInstance;


   // Distribute old token 
  const oldTokenSupply = 281207344012426;  
  const oldTokenDecimals = 10**8; 
  const oldTokenPerAccount = 1000 * oldTokenDecimals; 


  // Deploy contract used to test token
  it("deploy tester contract", async () => { 
    // Deploy testing contract 
    testInstance = await TokenTest.new();
  });

  // Deploy old MyBitToken contract
  it("deploy old mybit token", async () => { 
    oldTokenInstance = await OldToken.new(oldTokenSupply, "MyBit Token", 8, "MyB");
    assert.equal(await oldTokenInstance.totalSupply(), oldTokenSupply);
    assert.equal(await oldTokenInstance.balanceOf(ownerOne), oldTokenSupply);
  }); 

  // Give every user oldTokenPerAccount amount of old mybit tokens
  it("spread old tokens to users", async () => {
    for (var i = 1; i < web3.eth.accounts.length; i++) { 
      await oldTokenInstance.transfer(web3.eth.accounts[i], oldTokenPerAccount); 
      let userBalance = await oldTokenInstance.balanceOf(web3.eth.accounts[i]);
      assert.equal(userBalance, oldTokenPerAccount);
    }
    // Check token ledger is correct
    const totalOldTokensCirculating = (web3.eth.accounts.length - 1) * (oldTokenPerAccount);
    const remainingTokens = BigNumber(oldTokenSupply).minus(totalOldTokensCirculating);
    assert.equal(BigNumber(await oldTokenInstance.balanceOf(ownerOne)).eq(remainingTokens), true); 
  });


 // -------------------Begin distribution of new token ------------------------------


  // Initialize token information
  const name = "MyBit";
  const symbol = "MYB"; 
  const decimals = 10**18;
  const tenDecimals = 10**10; 



  // Token numbers
  const tokenSupply = 18000000000000000;      // Scaled up by 10^8 to match old tokens 
  const circulatingSupply = 10123464384447336;   // This is scaled up by 10^8 to match old tokens 10123464384447336
  const foundationSupply = tokenSupply - circulatingSupply; 
  const scalingFactor = 36;   // 1 OldToken = 36 New Tokens



  it("deploy swap contract", async () => { 
    assert.equal(tokenSupply, (circulatingSupply + foundationSupply));   
    tokenSwapInstance = await TokenSwap.new(myBitFoundation, oldTokenInstance.address);    // Constructor deploys new token
    tokenAddress = await tokenSwapInstance.newToken();    
    tokenInstance = Token.at(tokenAddress);
    assert.equal(tokenAddress, tokenInstance.address);      // Make sure instance is working

    // Check distribution variables are correct
    assert.equal(await tokenSwapInstance.totalSupply(), tokenSupply * tenDecimals);
    assert.equal(await tokenSwapInstance.tenDecimalPlaces(), tenDecimals);
    assert.equal(await tokenSwapInstance.scalingFactor(), scalingFactor);  // Scaling factor is moved up 10, due to lack of decimals in solidity
    assert.equal(await tokenSwapInstance.circulatingSupply(), circulatingSupply * tenDecimals);
    assert.equal(await tokenSwapInstance.foundationSupply(), foundationSupply * tenDecimals);

    // Check Token variables are correct
    assert.equal(await tokenInstance.balanceOf(myBitFoundation), foundationSupply * tenDecimals, "Verify that foundation received tokens"); 
    assert.equal(await tokenInstance.balanceOf(tokenSwapInstance.address), circulatingSupply * tenDecimals, "Verify that Distribution contract has all new tokens");  
    assert.equal(await tokenInstance.decimals(), 18, "New Token should have 18 decimal places");
    assert.equal(await tokenInstance.totalSupply(), tokenSupply * tenDecimals);
    assert.equal(await tokenInstance.name(), name);
    assert.equal(await tokenInstance.symbol(), symbol);
  });

  it("Swap Old tokens for new tokens... account one", async () => { 
    let ownerOldTokenBalance = await oldTokenInstance.balanceOf(ownerOne); 
    // Approve transfer
    await oldTokenInstance.approve(tokenSwapInstance.address, ownerOldTokenBalance); 
    await tokenSwapInstance.swap(ownerOldTokenBalance); 
    //Check tokens transferred properly
    assert.equal(await oldTokenInstance.balanceOf(ownerOne), 0, "Old token balance wasn't updated properly");
    assert.equal(await tokenInstance.balanceOf(ownerOne) / 10**10, (ownerOldTokenBalance * scalingFactor), "New token balance does not match expected");
  });


});
