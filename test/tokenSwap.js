const Token = artifacts.require("./ERC20.sol");
const TokenSwap = artifacts.require("./TokenSwap.sol");
const OldToken = artifacts.require("./CSToken.sol");


contract('TokenSale', async (accounts) => {
  const ownerOne = web3.eth.accounts[0];
  const ownerTwo = web3.eth.accounts[1];
  const myBitFoundation = web3.eth.accounts[2];



  let tokenInstance;
  let tokenSwapInstance;
  let oldTokenInstance;
  let mathInstance;


   // Distribute old token 
  const oldTokenSupply = 281207344012426;  
  const tokenDecimals = 1e8; 
  const oldTokenPerAccount = 1000 * tokenDecimals; 

  it("deploy old mybit token", async () => { 
    oldTokenInstance = await OldToken.new(oldTokenSupply, "MyBit Token", 8, "MyB");
    assert.equal(await oldTokenInstance.owner(), ownerOne);
    assert.equal(await oldTokenInstance.totalSupply(), oldTokenSupply);
    assert.equal(await oldTokenInstance.balanceOf(ownerOne), oldTokenSupply);
  }); 

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
 const scalingFactor = 36;   // 1 OldToken = 35.6 New Tokens

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
    assert.equal(await tokenSwapInstance.ready(), false);    // Verify that distribution hasn't been initialized

    // Check Token variables are correct
    assert.equal(await tokenInstance.balanceOf(myBitFoundation), foundationSupply * tenDecimals, "Verify that foundation received tokens"); 
    assert.equal(await tokenInstance.balanceOf(tokenSwapInstance.address), circulatingSupply * tenDecimals, "Verify that Distribution contract has all new tokens");  
    assert.equal(await tokenInstance.decimals(), 18, "New Token should have 18 decimal places");
    assert.equal(await tokenInstance.totalSupply(), tokenSupply * tenDecimals);
    assert.equal(await tokenInstance.name(), name);
    assert.equal(await tokenInstance.symbol(), symbol);

  });

  // // TODO: Catch EVM errors and continue
  // it("Will reject any token swaps until a sanity check is made", async () => { 
  //   let ownerOldTokenBalance = await oldTokenInstance.balanceOf(ownerOne); 
  //   // Approve transfer
  //   await oldTokenInstance.approve(tokenSwapInstance.address, ownerOldTokenBalance); 
  //   await tokenSwapInstance.swap(ownerOldTokenBalance); 
  // });

  it("Verify that numbers add up", async () => { 
    await tokenSwapInstance.sanityCheck()
    assert.equal(await tokenSwapInstance.ready(), true);
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

  it("transfer new tokens to self", async () => { 
    let ownerTokenBalance = await tokenInstance.balanceOf(ownerOne); 
    await tokenInstance.transfer(ownerOne, ownerTokenBalance);    // transfer to self
    await tokenInstance.approve(ownerOne, ownerTokenBalance);    // Approve self to transfer
    await tokenInstance.transferFrom(ownerOne, ownerOne, ownerTokenBalance / 2);    // TransferFrom self to self 
    await tokenInstance.transferFrom(ownerOne, ownerOne, ownerTokenBalance / 2);    // TransferFrom self to self 
    assert.equal(await tokenInstance.balanceOf(ownerOne) - ownerTokenBalance, 0);
  }); 

  // // TODO: catch EVM error and continue
  // it("try transferFrom without approval", async () => { 
  //   let ownerTokenBalance = await tokenInstance.balanceOf(ownerOne); 
  //   await tokenInstance.transferFrom(ownerOne, ownerTwo, ownerTokenBalance / 2);    
  // });

  it("transfer 0 new tokens", async () => { 
    let ownerTokenBalance = await tokenInstance.balanceOf(ownerOne); 
    await tokenInstance.transfer(ownerOne, 0);    // transfer to self
    await tokenInstance.transfer(myBitFoundation, 0);    // transfer to self
    await tokenInstance.transferFrom(ownerOne, ownerTwo, 0, {from:ownerTwo}); 
    assert.equal(await tokenInstance.balanceOf(ownerOne) - ownerTokenBalance, 0);
  });

  // // TODO: catch EVM error and continue
  // it("transfer more tokens than ownerOne has", async () => { 
  //   let ownerTokenBalance = await tokenInstance.balanceOf(ownerOne); 
  //   await tokenInstance.transfer(myBitFoundation, (ownerTokenBalance * 2));    
  //   assert.equal(await tokenInstance.balanceOf(ownerOne), ownerTokenBalance);
  // });

  //   // TODO: catch EVM error and continue
  // it("transferFrom more tokens than ownerOne has", async () => { 
  //   let ownerTokenBalance = await tokenInstance.balanceOf(ownerOne); 
  //   await tokenInstance.approve(ownerTwo, ownerTokenBalance * 2);
  //   await tokenInstance.transferFrom(ownerOne, ownerTwo, (ownerTokenBalance * 2), {from: ownerTwo});    
  //   // assert.equal(await tokenInstance.balanceOf(ownerOne), ownerTokenBalance);
  // });

  // // TODO: catch EVM error and continue
  // it("try to overflow tokens", async () => { 
  //   let ownerTokenBalance = await tokenInstance.balanceOf(ownerOne); 
  //   await tokenInstance.transfer(ownerOne, (2**256));    
  //   assert.equal(await tokenInstance.balanceOf(ownerOne) - ownerTokenBalance, 0);
  // });

  it("transfer all tokens and receive them back", async () => { 
    let ownerTokenBalance = await tokenInstance.balanceOf(ownerOne); 
    let myBitFoundationBalance = await tokenInstance.balanceOf(myBitFoundation);
    let balanceTogether = (ownerTokenBalance / tenDecimals) + (myBitFoundationBalance / tenDecimals);    // Scaled down due to large numbers
    await tokenInstance.transfer(myBitFoundation, ownerTokenBalance);   
    let newFoundationBalance = await tokenInstance.balanceOf(myBitFoundation); 
    assert.equal(balanceTogether - (newFoundationBalance / tenDecimals), 0);
    await tokenInstance.transfer(ownerOne, ownerTokenBalance, {from: myBitFoundation});  
    assert.equal(myBitFoundationBalance - await tokenInstance.balanceOf(myBitFoundation), 0); 
    assert.equal(await tokenInstance.balanceOf(ownerOne) - ownerTokenBalance, 0);
  });


  it("Swap old tokens in many transactions", async () => { 
    var thisUser = web3.eth.accounts[1];
    var oldTokensRemaining = await oldTokenInstance.balanceOf(thisUser); 
    let newTokensCreated = await tokenInstance.balanceOf(thisUser);
    var numberOfTransactions = 50;  
    var numberOldTokensSwapped = 0;
    var minimalSwapAmount = 1; 
    // Send 50 transactiosn with the minimum swap amount (0.00000001 MYB) == 0.000000360000000000 (NewMyB)
    for (let i = 0; i < 50; i++) { 
      await oldTokenInstance.approve(tokenSwapInstance.address, minimalSwapAmount, {from: thisUser}); 
      await tokenSwapInstance.swap(minimalSwapAmount, {from: thisUser});
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
    await oldTokenInstance.approve(tokenSwapInstance.address, oldTokensRemaining, {from: thisUser}); 
    await tokenSwapInstance.swap(oldTokensRemaining, {from: thisUser}); 
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
    await oldTokenInstance.approve(tokenSwapInstance.address, oldTokenPerAccount, {from: thisUser}); 
    await tokenSwapInstance.swap(oldTokenPerAccount, {from: thisUser}); 
    assert.equal(Number(await oldTokenInstance.balanceOf(thisUser)), 0); 
    assert.equal(Number(await tokenInstance.balanceOf(thisUser) / 2), (oldTokenPerAccount * scalingFactor) * 10**10);
  });

  it("Swap the rest of the old tokens", async () => { 
    for (let i = 3; i < web3.eth.accounts.length; i++) { 
      let thisUser = web3.eth.accounts[i]; 
      assert.equal(Number(await oldTokenInstance.balanceOf(thisUser)), oldTokenPerAccount); 
      await oldTokenInstance.approve(tokenSwapInstance.address, oldTokenPerAccount, {from: thisUser}); 
      await tokenSwapInstance.swap(oldTokenPerAccount, {from: thisUser});
      assert.equal(Number(await oldTokenInstance.balanceOf(thisUser)), 0); 
      assert.equal(Number(await tokenInstance.balanceOf(thisUser)), (oldTokenPerAccount * scalingFactor) * 10**10);
    }
    // All tokens should now be swapped for new ones
    assert.equal(Number(await oldTokenInstance.totalSupply()), Number(await oldTokenInstance.balanceOf(tokenSwapInstance.address)));
    assert.equal(Number(await tokenSwapInstance.circulatingSupply()), (Number(await oldTokenInstance.totalSupply()) * scalingFactor) * 10**10); 
  });

  it("Burn Tokens ", async () => { 


  });

  // TODO: test approveandcall()


  // it("Swap old tokens in many transactions", async () => { 


  // });

});
