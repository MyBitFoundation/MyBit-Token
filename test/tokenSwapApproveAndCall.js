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

 let randomBytes = 0xf1b958bf74d93b0d26522cbe7d3eae2b9056fbabb13b19bfdd891a5a34006a7d; 

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
    await oldTokenInstance.approveAndCall(tokenSwapInstance.address, ownerOldTokenBalance, randomBytes); 
    //Check tokens transferred properly
    assert.equal(await oldTokenInstance.balanceOf(ownerOne), 0, "Old token balance wasn't updated properly");
    assert.equal(await tokenInstance.balanceOf(ownerOne) / 10**10, (ownerOldTokenBalance * scalingFactor), "New token balance does not match expected");
  });

  // Transfer tokens to self
  it("transfer new tokens to self", async () => { 
    let ownerTokenBalance = await tokenInstance.balanceOf(ownerOne); 
    await tokenInstance.transfer(ownerOne, ownerTokenBalance);    // transfer to self
    await tokenInstance.approve(ownerOne, ownerTokenBalance);    // Approve self to transfer
    await tokenInstance.transferFrom(ownerOne, ownerOne, ownerTokenBalance / 2);    // TransferFrom self to self 
    await tokenInstance.transferFrom(ownerOne, ownerOne, ownerTokenBalance / 2);    // TransferFrom self to self 
    assert.equal(await tokenInstance.balanceOf(ownerOne) - ownerTokenBalance, 0);
  }); 

  // Should fail: calling transferFrom without approval
  it("try transferFrom without approval", async () => { 
    let ownerTokenBalance = Number(await tokenInstance.balanceOf(ownerOne)); 
    try {
    await tokenInstance.transferFrom(ownerOne, ownerTwo, ownerTokenBalance / 2);     
    } catch(e) { 
        console.log("EVM error: transferFrom without any allowance");
        return true;
    }  
    finally {
    assert.equal(Number(await tokenInstance.balanceOf(ownerOne)), ownerTokenBalance);
    } 
      
  });

    // Contract should allow transfer of 0 tokens
  it("transfer to address(0)", async () => { 
    let ownerTokenBalance = Number(await tokenInstance.balanceOf(ownerOne));
    let nullAddress = 0x0000000000000000000000000000000000000000;  
    try { 
      await tokenInstance.transfer(nullAddress, ownerTokenBalance);
    } catch(e) { 
        console.log("EVM error: Can't transfer to null address");
    }
    finally { 
      assert.equal(ownerTokenBalance, Number(await tokenInstance.balanceOf(ownerOne)));
    }
  });

      // Contract should allow transfer of 0 tokens
  it("transferFrom to address(0)", async () => { 
    let ownerTokenBalance = Number(await tokenInstance.balanceOf(ownerOne));
    let transferer = web3.eth.accounts[3];
    let nullAddress = 0x0000000000000000000000000000000000000000;  
    await tokenInstance.approve(transferer, ownerTokenBalance); 
    assert.equal(Number(await tokenInstance.allowance(ownerOne, transferer)), ownerTokenBalance); 
    try { 
      await tokenInstance.transferFrom(ownerOne, nullAddress, ownerTokenBalance, {from: transferer});
    } catch(e) { 
        console.log("EVM error: Can't transfer to null address");
    }
    finally { 
      assert.equal(ownerTokenBalance, Number(await tokenInstance.balanceOf(ownerOne)));
    }
  });

  // Contract should allow transfer of 0 tokens
  it("transfer 0 new tokens", async () => { 
    let ownerTokenBalance = Number(await tokenInstance.balanceOf(ownerOne)); 
    await tokenInstance.transfer(ownerOne, 0);    // transfer to self
    await tokenInstance.transfer(myBitFoundation, 0);    // transfer to self
    await tokenInstance.transferFrom(ownerOne, ownerTwo, 0, {from:ownerTwo}); 
    await tokenInstance.transferFrom(ownerTwo, ownerOne, 0, {from:ownerOne});
    assert.equal(await tokenInstance.balanceOf(ownerOne) - ownerTokenBalance, 0);
  });

  // Should fail: Transfer amount exceeds balance
  it("transfer more tokens than ownerOne has", async () => { 
    let ownerTokenBalance = Number(await tokenInstance.balanceOf(ownerOne)); 
    try {
    await tokenInstance.transfer(myBitFoundation, (ownerTokenBalance * 2));   
    } catch(e) { 
        console.log("EVM error: number of tokens being transferred exceeds balance");
        return true;
    }  
    finally {
    assert.equal(await tokenInstance.balanceOf(ownerOne), ownerTokenBalance);
    } 
  });

    // Should fail: TransferFrom amount exceeds balance
  it("transferFrom more tokens than ownerOne has", async () => { 
    let ownerTokenBalance = Number(await tokenInstance.balanceOf(ownerOne)); 
    await tokenInstance.approve(ownerTwo, ownerTokenBalance * 2);
    try {
    await tokenInstance.transferFrom(ownerOne, ownerTwo, (ownerTokenBalance * 2), {from: ownerTwo});  
    } catch(e) { 
        console.log("EVM error: amount being transferredFrom() exceeds balance");
        return true;
    }  
    finally {
    assert.equal(Number(await tokenInstance.balanceOf(ownerOne)), ownerTokenBalance);
    assert.equal(Number(await tokenInstance.allowance(ownerOne, ownerTwo)), ownerTokenBalance * 2); 
  }
  });


  it("try to overflow tokens", async () => { 
    let ownerTokenBalance = await tokenInstance.balanceOf(ownerOne); 
    try {
      await tokenInstance.transfer(ownerOne, (2**256));    
    } catch(e){ 
        console.log("EVM error: max uint attempted on transfer()");
        return true;
    }
    finally { 
    assert.equal(await tokenInstance.balanceOf(ownerOne) - ownerTokenBalance, 0);
    }
  });

  it("transfer all tokens and receive them back", async () => { 
    let ownerTokenBalance = await tokenInstance.balanceOf(ownerOne); 
    let myBitFoundationBalance = await tokenInstance.balanceOf(myBitFoundation);
    let balanceTogether = BigNumber(ownerTokenBalance).plus(myBitFoundationBalance);    // Scaled down due to large numbers
    await tokenInstance.transfer(myBitFoundation, ownerTokenBalance);   
    let newFoundationBalance = await tokenInstance.balanceOf(myBitFoundation); 
    assert.equal(BigNumber(balanceTogether).eq(newFoundationBalance), true);
    await tokenInstance.transfer(ownerOne, ownerTokenBalance, {from: myBitFoundation});  
    assert.equal(BigNumber(myBitFoundationBalance).minus(await tokenInstance.balanceOf(myBitFoundation)), 0); 
    assert.equal(BigNumber(ownerTokenBalance).eq(await tokenInstance.balanceOf(ownerOne)), true);
  });


  it("Swap old tokens in many small transactions", async () => { 
    var thisUser = web3.eth.accounts[1];
    var oldTokensRemaining = await oldTokenInstance.balanceOf(thisUser); 
    let newTokensCreated = await tokenInstance.balanceOf(thisUser);
    var numberOfTransactions = 50;  
    var numberOldTokensSwapped = 0;
    var minimalSwapAmount = 1; 
    // Send 50 transactiosn with the minimum swap amount (0.00000001 MYB) == 0.000000360000000000 (NewMyB)
    for (let i = 0; i < 50; i++) { 
      await oldTokenInstance.approveAndCall(tokenSwapInstance.address, minimalSwapAmount, randomBytes, {from: thisUser}); 
      // await tokenSwapInstance.swap(minimalSwapAmount, {from: thisUser});
      numberOldTokensSwapped += minimalSwapAmount; 
      let updatedNewTokens = Number(await tokenInstance.balanceOf(thisUser));
      let updatedOldTokens = Number(await oldTokenInstance.balanceOf(thisUser));
      assert.equal(Number(numberOldTokensSwapped), oldTokenPerAccount - updatedOldTokens, "Number of old tokens swapped doesn't add up"); 
      assert.equal(Number(oldTokenPerAccount - numberOldTokensSwapped), updatedOldTokens, "Old token balance not updated properly");
      assert.equal(Number((numberOldTokensSwapped * scalingFactor) * 10**10), updatedNewTokens, "Wrong amount of new tokens were given");
      assert.equal(Number(((oldTokensRemaining - updatedOldTokens) * scalingFactor) * 10**10), (updatedNewTokens - newTokensCreated), "Token swap numbers are off"); 
      oldTokensRemaining = updatedOldTokens;
      newTokensCreated = updatedNewTokens;
    }
    oldTokensRemaining = await oldTokenInstance.balanceOf(thisUser); 
    await oldTokenInstance.approveAndCall(tokenSwapInstance.address, oldTokensRemaining, randomBytes, {from: thisUser}); 
    // await tokenSwapInstance.swap(oldTokensRemaining, {from: thisUser}); 
    assert.equal(Number(await oldTokenInstance.balanceOf(thisUser)), 0); 
    assert.equal(Number(await tokenInstance.balanceOf(thisUser)), (oldTokenPerAccount * scalingFactor) * 10**10);
    });


  it("Give someone who already swapped more old tokens to trade in", async () => { 
    let wontSwap = web3.eth.accounts[2]; 
    let thisUser = web3.eth.accounts[1]; 
    assert.equal(Number(await oldTokenInstance.balanceOf(thisUser)), 0, "user should have balance of 0");
    await oldTokenInstance.transfer(thisUser, Number(await oldTokenInstance.balanceOf(wontSwap)), {from: wontSwap}); 
    assert.equal(Number(await oldTokenInstance.balanceOf(wontSwap)), 0, "Transfer of old tokens didn't work"); 
    assert.equal(Number(await oldTokenInstance.balanceOf(thisUser)), oldTokenPerAccount, "Balance of user isn't what was expected");
    let thisUserNewTokenBalance = Number(await tokenInstance.balanceOf(thisUser)); 
    assert.equal(thisUserNewTokenBalance, (oldTokenPerAccount * scalingFactor) * 10**10); 
    await oldTokenInstance.approveAndCall(tokenSwapInstance.address, oldTokenPerAccount, randomBytes, {from: thisUser}); 
    // await tokenSwapInstance.swap(oldTokenPerAccount, {from: thisUser}); 
    assert.equal(Number(await oldTokenInstance.balanceOf(thisUser)), 0); 
    assert.equal(Number(await tokenInstance.balanceOf(thisUser) / 2), (oldTokenPerAccount * scalingFactor) * 10**10);
  });

    // Try to Swap more tokens than available
  it("Swap more tokens than user has", async () => { 
    let thisUser = web3.eth.accounts[3];
    try {
    await oldTokenInstance.approveAndCall(tokenSwapInstance.address, oldTokenPerAccount * 3, randomBytes, {from: thisUser}); 
    } catch(e){ 
        console.log("EVM error as expected, when swapping more tokens than available");
        return true;
    }
    finally { 
    assert.equal(Number(await oldTokenInstance.balanceOf(thisUser)), oldTokenPerAccount); 
    assert.equal(Number(await tokenInstance.balanceOf(thisUser)), 0);
  }
  });

    // Start at account 3 (0, 1 and 2 have already swapped)
  it("Swap the rest of the old tokens", async () => { 
    for (let i = 3; i < web3.eth.accounts.length; i++) { 
      let thisUser = web3.eth.accounts[i]; 
      assert.notEqual(await oldTokenInstance.balanceOf(thisUser), 0); 
      let amountToSwap = await oldTokenInstance.balanceOf(thisUser);
      let preBalance = await tokenInstance.balanceOf(thisUser); 
      let amountNewTokens = BigNumber(amountToSwap).times(scalingFactor).times(10**10);
      await oldTokenInstance.approveAndCall(tokenSwapInstance.address, amountToSwap, randomBytes, {from: thisUser}); 
      assert.equal(await oldTokenInstance.balanceOf(thisUser), 0); 
      assert.equal(BigNumber(await tokenInstance.balanceOf(thisUser)).eq(BigNumber(amountNewTokens).plus(preBalance)), true);
    }
    // All tokens should now be swapped for new ones
    assert.equal(Number(await oldTokenInstance.totalSupply()), Number(await oldTokenInstance.balanceOf(tokenSwapInstance.address)));
    assert.equal(Number(await tokenSwapInstance.circulatingSupply()), ((Number(await oldTokenInstance.totalSupply()) * scalingFactor) * 10**10)); 
  });

  it("Burn owner Tokens ", async () => { 
    let currentSupply = Number(await tokenInstance.totalSupply()); 
    let ownerBalance = await tokenInstance.balanceOf(ownerOne);
    let newSupply = BigNumber(currentSupply).minus(ownerBalance);  
    await tokenInstance.burn(ownerBalance); 
    assert.equal(Number(await tokenInstance.balanceOf(ownerOne)), 0, "User balance should be 0"); 
    assert.equal(BigNumber(newSupply).eq(await tokenInstance.totalSupply()), true); 
  });

  it("Burn Tokens in many small transactions", async () => { 
    let thisUser = web3.eth.accounts[1];
    let beginningSupply = await tokenInstance.totalSupply(); 
    let userBalance = await tokenInstance.balanceOf(thisUser);
    let supplyAfter = BigNumber(beginningSupply).minus(userBalance);  // Take owners balance out of supply
    let numIterations = 20; 
    //  burn 1 New MyB token 'numIterations' times
    for (let i = 1; i < (numIterations + 1); i++) { 
      await tokenInstance.burn(1, {from: thisUser}); 
      let expectedBalance = BigNumber(await tokenInstance.balanceOf(thisUser)).plus(i); 
      let expectedSupply = BigNumber(await tokenInstance.totalSupply()).plus(i); 
      assert.equal(BigNumber(userBalance).eq(expectedBalance), true); 
      assert.equal(BigNumber(beginningSupply).eq(expectedSupply), true);
    }
    let expectedSupply = BigNumber(await tokenInstance.totalSupply()).plus(numIterations);
    let expectedBalance = BigNumber(await tokenInstance.balanceOf(thisUser)).plus(numIterations); 
    assert.equal(expectedSupply.eq(beginningSupply), true); 
    assert.equal(expectedBalance.eq(userBalance), true);
    await tokenInstance.burn(await tokenInstance.balanceOf(thisUser), {from: thisUser});
    assert.equal(BigNumber(await tokenInstance.balanceOf(thisUser)).eq(0), true); 
    assert.equal(supplyAfter.eq(await tokenInstance.totalSupply()), true);
  });
  
// // Note: account[2] didn't swap tokens in

  it("Burn 0 tokens", async () => { 
    let thisUser = web3.eth.accounts[3]; 
    let totalSupply = Number(await tokenInstance.totalSupply());
    let userBalance = Number(await tokenInstance.balanceOf(thisUser)); 
    await tokenInstance.burn(0); 
    assert.equal(userBalance, Number(await tokenInstance.balanceOf(thisUser))); 
    assert.equal(totalSupply, Number(await tokenInstance.totalSupply()));
    await testInstance.burnTokens(tokenInstance.address, thisUser, 0); 
    assert.equal(userBalance, Number(await tokenInstance.balanceOf(thisUser))); 
    assert.equal(totalSupply, Number(await tokenInstance.totalSupply()));
  });

  it("Burn more tokens than user has", async () => { 
    var thisUser = web3.eth.accounts[3]; 
    let totalSupply = Number(await tokenInstance.totalSupply());
    let userBalance = Number(await tokenInstance.balanceOf(thisUser));
    let overflow = userBalance * 1000; 
    assert.notEqual(overflow, userBalance);
    try {
      await tokenInstance.burn(overflow, {from: thisUser});
    } catch (e) { 
      console.log("EVM error: Attempted to burn more tokens than user has");
      return true;
    } 
      finally { 
      console.log(totalSupply);
      console.log(Number(await tokenInstance.totalSupply()));
      assert.equal(userBalance, Number(await tokenInstance.balanceOf(thisUser))); 
      assert.equal(totalSupply, Number(await tokenInstance.totalSupply()));
    }
  });

  // Approve test contract to burn tokens for user 1
  it("Let test contract BurnFrom account 1", async () => { 
    let thisUser = web3.eth.accounts[3]; 
    let totalSupply = await tokenInstance.totalSupply();
    let userBalance = await tokenInstance.balanceOf(thisUser); 
    assert.notEqual(userBalance, 0);
    let supplyAfterBurn = BigNumber(totalSupply).minus(userBalance);
    await tokenInstance.approve(testInstance.address, userBalance, {from: thisUser}); 
    assert.equal(BigNumber(await tokenInstance.allowance(thisUser, testInstance.address)).eq(userBalance), true);
    await testInstance.burnTokens(tokenInstance.address, thisUser, userBalance, {from: thisUser});
    assert.equal(BigNumber(await tokenInstance.allowance(thisUser, testInstance.address)).eq(0), true);
    assert.equal(BigNumber(await tokenInstance.totalSupply()).eq(supplyAfterBurn), true); 
    assert.equal(BigNumber(await tokenInstance.balanceOf(thisUser)).eq(0), true); 
  });


  // Approve test contract to burn tokens for user 1
  it("Let test contract burnFrom more than account balance", async () => { 
    let thisUser = web3.eth.accounts[4]; 
    let totalSupply = Number(await tokenInstance.totalSupply());
    let userBalance = Number(await tokenInstance.balanceOf(thisUser)); 
    let overflowBalance = userBalance * 2;
    assert.notEqual(overflowBalance - userBalance, 0);
    assert.notEqual(userBalance, 0);
    await tokenInstance.approve(testInstance.address, Number(overflowBalance), {from: thisUser}); 
    assert.equal(Number(await tokenInstance.allowance(thisUser, testInstance.address)), Number(overflowBalance));
    try { 
      await testInstance.burnTokens(tokenInstance.address, thisUser, Number(overflowBalance), {from: thisUser});
    } catch(e) {  
        console.log("EVM erorr: Tried to burnFrom more tokens than user has");
        return true;    
    } 
    finally{ 
        assert.equal(Number(await tokenInstance.allowance(thisUser, testInstance.address)), Number(overflowBalance));
        assert.equal(Number(await tokenInstance.totalSupply()), totalSupply); 
        assert.equal(Number(await tokenInstance.balanceOf(thisUser)), userBalance); 
      }
  });

  it("Test approveandcall", async () => { 
    let thisUser = web3.eth.accounts[4];
    let userBalance = Number(await tokenInstance.balanceOf(thisUser));
    let tokenSupply = await tokenInstance.totalSupply(); 
    let txData = await testInstance.stringToData("Person Name");
    let approveID = await testInstance.getCallID(tokenInstance.address, userBalance, txData);
    await tokenInstance.approveAndCall(testInstance.address, userBalance, txData, {from: thisUser}); 
    assert.equal(await testInstance.receivedApproval(approveID), true); 
    assert.equal(await testInstance.data(approveID), txData);
    assert.equal(await testInstance.token(approveID), tokenInstance.address);
    assert.equal(await testInstance.amount(approveID), userBalance);
    assert.equal(await testInstance.from(approveID), thisUser); 
    // Check tokens were burned
    assert.equal(await tokenInstance.balanceOf(thisUser), 0); 
    assert.equal(BigNumber(await tokenInstance.totalSupply()).eq(BigNumber(tokenSupply).minus(userBalance)), true); 
  }); 


  it("Burn rest of the tokens", async () => { 
    for (let i = 0; i < web3.eth.accounts.length; i++) { 
      let thisUser = web3.eth.accounts[i]; 
      let thisUserBalance = Number(await tokenInstance.balanceOf(thisUser));
      let totalSupply = await tokenInstance.totalSupply();
      if (thisUserBalance == 0) {  return;   }
      await tokenInstance.burn(thisUserBalance, {from: thisUser});
      assert.equal(await tokenInstance.balanceOf(thisUser), 0);
      assert.equal(BigNumber(await tokenInstance.totalSupply()).eq(BigNumber(totalSupply).minus(thisUserBalance)), true);
    }
    assert.equal(await tokenInstance.totalSupply(), 0); 
    assert.equal(await tokenSwapInstance.tokensRedeemed(), await tokenSwapInstance.circulatingSupply());
  }); 

});
