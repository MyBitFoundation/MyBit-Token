const Token = artifacts.require("./ERC20.sol");
const TokenRedistribution = artifacts.require("./TokenRedistribution.sol");
const OldToken = artifacts.require("./CSToken.sol");

contract('TokenSale', async (accounts) => {
  const ownerOne = web3.eth.accounts[0];
  const ownerTwo = web3.eth.accounts[1];
  const myBitFoundation = web3.eth.accounts[2];



  let tokenInstance;
  let trInstance;
  let oldTokenInstance;



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
 const decimals = 10**8;

 // Token numbers
 const tokenSupply = 178000000;
 const circulatingSupply = 10010981446842366;
 const foundationSupply = (tokenSupply * decimals) - circulatingSupply; 
 const scalingFactor = 35;   // 1 OldToken = 35.6 New Tokens

  it("deploy redistribution contract", async () => { 
    trInstance = await TokenRedistribution.new(myBitFoundation, oldTokenInstance.address);    // Constructor deploys new token
    tokenAddress = await trInstance.newToken();    
    tokenInstance = Token.at(tokenAddress);
    assert.equal(tokenAddress, tokenInstance.address);      // Make sure instance is working

    // Check distribution variables are correct
    assert.equal(await trInstance.initialSupply(), (tokenSupply * decimals));
    assert.equal(await trInstance.numDecimals(), 1e8);
    assert.equal(await trInstance.scalingFactor(), scalingFactor * 10);  // Scaling factor is moved up 10, due to lack of decimals in solidity
    assert.equal(await trInstance.ready(), false);    // Verify that distribution hasn't been initialized

    // Check Token variables are correct
    assert.equal(await tokenInstance.balanceOf(myBitFoundation), foundationSupply, "Verify that foundation received tokens"); 
    assert.equal(await tokenInstance.balanceOf(trInstance.address), circulatingSupply, "Verify that Distribution contract has all new tokens");  
    assert.equal(await tokenInstance.decimals(), 8, "New Token should have 8 decimal places");
    assert.equal(await tokenInstance.totalSupply(), (tokenSupply * decimals));
    assert.equal(await tokenInstance.name(), name);
    assert.equal(await tokenInstance.symbol(), symbol);

  });

  // // TODO: Catch EVM errors and continue
  // it("Will reject any token swaps until a sanity check is made", async () => { 
  //   let ownerOldTokenBalance = await oldTokenInstance.balanceOf(ownerOne); 
  //   // Approve transfer
  //   await oldTokenInstance.approve(trInstance.address, ownerOldTokenBalance); 
  //   await trInstance.swap(ownerOldTokenBalance); 
  // });

  it("Verify that numbers add up", async () => { 
    await trInstance.sanityCheck()
    assert.equal(await trInstance.ready(), true);
  });


  it("Swap Old tokens for new ones account one", async () => { 
    let ownerOldTokenBalance = await oldTokenInstance.balanceOf(ownerOne); 
    console.log(ownerOldTokenBalance);
    // Approve transfer
    await oldTokenInstance.approve(trInstance.address, ownerOldTokenBalance); 
    await trInstance.swap(ownerOldTokenBalance); 
    //Check tokens transferred properly
    assert.equal(await oldTokenInstance.balanceOf(ownerOne), 0, "Old token balance wasn't updated properly");
    console.log(await tokenInstance.balanceOf(ownerOne));
    console.log(ownerOldTokenBalance * scalingFactor);  
    assert.equal(await tokenInstance.balanceOf(ownerOne), (ownerOldTokenBalance * scalingFactor), "New token balance does not match expected");
  });

  const acc = 1;

  it("Swap old tokens in many transactions", async () => { 


  });
});
