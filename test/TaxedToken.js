const {
  assert,
} = require("hardhat");
const {
  constants,
  expectEvent,
  expectRevert
} = require('@openzeppelin/test-helpers');

const BN = web3.utils.BN;

const TaxedToken = artifacts.require("TaxedToken");

describe("TaxedToken contract", function () {
  let accounts;

  before(async function () {
    accounts = await web3.eth.getAccounts();
    fundAddress = accounts[1];
    transferFeePercentage = 3;
    burnPercentage = 50;
  });

  describe("Deployment", function () {
    before(async function () {
      taxedToken = await TaxedToken.new(transferFeePercentage, burnPercentage, fundAddress);
    });

    it("Should deploy with right parameters", async function () {
      assert.equal(await taxedToken.transferFeePercentage(), transferFeePercentage);
      assert.equal(await taxedToken.burnPercentage(), burnPercentage);
      assert.equal(await taxedToken.fundAddress(), fundAddress);
    });
    it("Should deploy with right name and symbol", async function () {
      assert.equal(await taxedToken.name(), "Taxed Token");
      assert.equal(await taxedToken.symbol(), "TTC");
    });
    it("Should deploy with right totalSupply", async function () {
      assert.equal(await taxedToken.totalSupply(), 100000000000 * 10 ** 18);
    });
  })

  describe("Blacklist", function () {
    before(async function () {
    });
    it("updates blacklist correctly", async function () {
      taxedToken = await TaxedToken.new(transferFeePercentage, burnPercentage, fundAddress);
      await taxedToken.blacklistUpdate(accounts[2], true);
      assert.equal(await taxedToken.isBlackListed(accounts[2]), true);
    });
    it("emits a BlacklistUpdated event", async function () {
      taxedToken = await TaxedToken.new(transferFeePercentage, burnPercentage, fundAddress);
      const tx = await taxedToken.blacklistUpdate(accounts[2], true);
      expectEvent(tx, 'BlacklistUpdated', {
        user: accounts[2],
        value: true,
      });
    });
  })

  describe("Transfer", function () {
    before(async function () {
      amount = 1000000;
    });
    it('emits Transfer events on successful transfers', async function () {
      taxedToken = await TaxedToken.new(transferFeePercentage, burnPercentage, fundAddress);

      const toAddress = accounts[2];

      const receipt = await taxedToken.transfer(toAddress, amount);

      // Event assertions can verify that the arguments are the expected ones
      expectEvent(receipt, 'Transfer', {
        from: accounts[0],
        to: toAddress,
        value: new BN(amount * (100 - transferFeePercentage) / 100),
      });
      expectEvent(receipt, 'Transfer', {
        from: accounts[0],
        to: constants.ZERO_ADDRESS,
        value: new BN(amount * transferFeePercentage / 100 * burnPercentage / 100),
      });

      expectEvent(receipt, 'Transfer', {
        from: accounts[0],
        to: fundAddress,
        value: new BN(amount * transferFeePercentage / 100 * (100 - burnPercentage) / 100),
      });

    });
    it("updates balances on successful transfers", async function () {
      taxedToken = await TaxedToken.new(transferFeePercentage, burnPercentage, fundAddress);

      const toAddress = accounts[2];
      await taxedToken.transfer(toAddress, amount);

      const funds = await taxedToken.balanceOf(fundAddress);
      const taxedAmount = await taxedToken.balanceOf(toAddress);
      const burnAmount = amount - taxedAmount - funds;

      assert.equal(taxedAmount, amount * (100 - transferFeePercentage) / 100);
      assert.equal(funds, amount * transferFeePercentage / 100 * (100 - burnPercentage) / 100);
      assert.equal(burnAmount, amount * transferFeePercentage / 100 * burnPercentage / 100);
    });
  })
  describe("TransferFrom", function () {

    before(async function () {
      amount = 1000000;
    });

    describe("TransferFrom events", function() {
      before(async function () {
        taxedToken = await TaxedToken.new(transferFeePercentage, burnPercentage, fundAddress);
        from = accounts[0];
        spender = accounts[2];
        to = accounts[3];
        await taxedToken.approve(spender, amount, { from, })
      });
      it('emits Transfer events on successful transfers', async function () {
        const receipt = await taxedToken.transferFrom(from, to, amount, { from: spender });
  
        // Event assertions can verify that the arguments are the expected ones
        expectEvent(receipt, 'Transfer', {
          from,
          to,
          value: new BN(amount * (100 - transferFeePercentage) / 100),
        });
        expectEvent(receipt, 'Transfer', {
          from,
          to: constants.ZERO_ADDRESS,
          value: new BN(amount * transferFeePercentage / 100 * burnPercentage / 100),
        });
  
        expectEvent(receipt, 'Transfer', {
          from,
          to: fundAddress,
          value: new BN(amount * transferFeePercentage / 100 * (100 - burnPercentage) / 100),
        });
      });
    });

    describe("TransferFrom balances", function() {
      before(async function () {
        taxedToken = await TaxedToken.new(transferFeePercentage, burnPercentage, fundAddress);
        from = accounts[0];
        spender = accounts[2];
        to = accounts[3];
        await taxedToken.approve(spender, amount, { from, })
      });  
      it('updates balances on successful transfers', async function () {
        const receipt = await taxedToken.transferFrom(from, to, amount, { from: spender });
  
        const funds = await taxedToken.balanceOf(fundAddress);
        const taxedAmount = await taxedToken.balanceOf(to);
        const burnAmount = amount - taxedAmount - funds;

        assert.equal(taxedAmount, amount * (100 - transferFeePercentage) / 100);
        assert.equal(funds, amount * transferFeePercentage / 100 * (100 - burnPercentage) / 100);
        assert.equal(burnAmount, amount * transferFeePercentage / 100 * burnPercentage / 100);
      });
    })
  });
});