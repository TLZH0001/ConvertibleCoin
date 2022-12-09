import {
    DebondERC3475Instance, ProgressCalculatorInstance
} from "../types/truffle-contracts";

const DebondBond = artifacts.require("DebondERC3475");
const ProgressCalculator = artifacts.require("ProgressCalculator");


interface Transaction {
    classId: number | BN | string;
    nonceId: number | BN | string;
    amount: number | BN | string;
}

interface Metadata {
    title: string;
    types: string;
    description: string;
}

interface Value {
    stringValue: string;
    uintValue: number | BN | string;
    addressValue: string;
    boolValue: boolean;
}

const defaultValue: Value = {
    stringValue: "",
    uintValue: 0,
    addressValue: "0x0000000000000000000000000000000000000000",
    boolValue: false
}

contract('Bond', async (accounts: string[]) => {

    let bondContract: DebondERC3475Instance
    let progressCalculatorContract: ProgressCalculatorInstance

    const SHARE = 1;
    const COMPANY1=2;
    const [governance, bondManager, user1, user2, operator, spender, DBITAddress] = accounts;

    const now = parseInt(Date.now().toString().substring(-3));
    const shareMetadatas: Metadata[] = []

    const classMetadatas: Metadata[] = [
        {title: "company_name", types: "string", description: "company_name"},
        {title: "company_address", types: "address", description: "company_address"},
    ]

    const nonceMetadatas: Metadata[] = [
        {title: "symbol", types: "string", description: "the collateral token's symbol"},
        {title: "token_address", types: "address", description: "the collateral token's address"},
        {title: "interests_rate", types: "int", description: "the interest rate type"},
        {title: "interests_period", types: "int", description: "the base period for the class"},
        {title: "convert_rate", types: "int", description: "convert rate"},
        {title: "issuance Date", types: "int", description: "the issuance date"},
        {title: "maturity Date", types: "int", description: "the maturity date"}
    ]

    it('Initialisation', async () => {
        bondContract = await DebondBond.deployed();
        progressCalculatorContract = await ProgressCalculator.deployed();

    })

    it('add address to dict', async () => {
        await bondContract.add_bondmanager(governance);
        const Id = await bondContract.get_bondmanager(governance);
        assert.isTrue(Id.toNumber() == 0);

    })

    it('add address to dict', async () => {
        await bondContract.add_bondmanager(bondManager);
        const Id = await bondContract.get_bondmanager(bondManager);
        assert.isTrue(Id.toNumber() == 1);
    })

    // it('remove address to dict', async () => {
    //     await bondContract.remove_bondmanager(bondManager);
    // })

    it('Should create set of metadatas for classes, only the Bank can do that action', async () => {
        let metadataIds: number[] = [];
        for (const metadata of classMetadatas) {
            const index = classMetadatas.indexOf(metadata);
            metadataIds.push(index)
        }
        await bondContract.createClassMetadataBatch(metadataIds, classMetadatas, {from: bondManager})
        const metadata = await bondContract.classMetadata(0);
        assert.isTrue(metadata.title == classMetadatas[0].title);
        assert.isTrue(metadata.types == classMetadatas[0].types);
        assert.isTrue(metadata.description == classMetadatas[0].description);
    })

    it('Should create share class, only the Bank can do that action', async () => {

        const values: Value[] = [
            {...defaultValue, stringValue: "CONCOIN"},
            {...defaultValue, addressValue: bondManager},
        ]
        await bondContract.createClass(SHARE, classMetadatas.map(metadata => classMetadatas.indexOf(metadata)), values, {from: bondManager});
        const classExists = await bondContract.classExists(SHARE)
        const classCompanyName = (await bondContract.classValues(SHARE, 0)).stringValue
        assert.isTrue(classExists);
        assert.isTrue(classCompanyName == "CONCOIN");
    })

    it('Should create a new class, only the Bank can do that action', async () => {
        const values: Value[] = [
            {...defaultValue, stringValue: "DBIT"},
            {...defaultValue, addressValue: bondManager},
        ]
        await bondContract.createClass(COMPANY1, classMetadatas.map(metadata => classMetadatas.indexOf(metadata)), values, {from: bondManager});
        const classExists = await bondContract.classExists(COMPANY1)
        const classCompanyName = (await bondContract.classValues(COMPANY1, 0)).stringValue
        assert.isTrue(classExists);
        assert.isTrue(classCompanyName == "DBIT");
    })

    it('Should create set of metadatas for a class nonces, only the Bank can do that action', async () => {
        let metadataIds: number[] = [];
        for (const metadata of nonceMetadatas) {
            const index = nonceMetadatas.indexOf(metadata);
            metadataIds.push(index)
        }
        await bondContract.createNonceMetadataBatch(COMPANY1, metadataIds, nonceMetadatas, {from: bondManager})
        const metadata = await bondContract.nonceMetadata(COMPANY1, 0);
        assert.isTrue(metadata.title == nonceMetadatas[0].title);
        assert.isTrue(metadata.types == nonceMetadatas[0].types);
        assert.isTrue(metadata.description == nonceMetadatas[0].description);
    })

    // initiate share for company1
    it('Should create a new share for class0, only the Bank can do that action', async () => {
        // const values: Value[] = []
        const values: Value[] = [
            {...defaultValue},
            {...defaultValue},
            {...defaultValue},
            {...defaultValue}, // 1day
            {...defaultValue},
            {...defaultValue},
            {...defaultValue}, // 6 months
        ]
        await bondContract.createNonce(SHARE, COMPANY1, nonceMetadatas.map(metadata => nonceMetadatas.indexOf(metadata)), values, {from: bondManager});
        const nonceExists = await bondContract.nonceExists(SHARE, COMPANY1)
        assert.isTrue(nonceExists);
    })


    // initiate nonce for user 1
    it('Should create a new nonce for a given class, only the Bank can do that action', async () => {
        const values: Value[] = [
            {...defaultValue, stringValue: "mysymbol"},
            {...defaultValue, addressValue: DBITAddress},
            {...defaultValue, uintValue: 11000000},
            {...defaultValue, uintValue: 3600 * 24 * 1 }, // 1day
            {...defaultValue, uintValue: 11000000},
            {...defaultValue, uintValue: 0},
            {...defaultValue, uintValue: 0+3600 * 24 * 10}, // 6 months
        ]
        await bondContract.createNonce(COMPANY1, 0, nonceMetadatas.map(metadata => nonceMetadatas.indexOf(metadata)), values, {from: bondManager});
        const nonceExists = await bondContract.nonceExists(COMPANY1, 0)
        assert.isTrue(nonceExists);


        // const noncesymbol = (await bondContract.nonceValues(DBIT_FIX_6MTH_CLASS_ID, 0, 0)).stringValue
        // const nonceAddress = (await bondContract.nonceValues(DBIT_FIX_6MTH_CLASS_ID, 0, 1)).addressValue
        // const nonceir = (await bondContract.nonceValues(DBIT_FIX_6MTH_CLASS_ID, 0, 2)).uintValue
        // const nonceip = (await bondContract.nonceValues(DBIT_FIX_6MTH_CLASS_ID, 0, 3)).uintValue
        // const noncecr = (await bondContract.nonceValues(DBIT_FIX_6MTH_CLASS_ID, 0, 4)).uintValue
        // const nonceid = (await bondContract.nonceValues(DBIT_FIX_6MTH_CLASS_ID, 0, 5)).uintValue
        // const noncemd = (await bondContract.nonceValues(DBIT_FIX_6MTH_CLASS_ID, 0, 6)).uintValue

        // assert.isTrue(noncesymbol == "mysymbol");
        // assert.isTrue(nonceAddress == DBITAddress);
        // assert.isTrue(nonceir == 1000000);
        // assert.isTrue(nonceip == 3600 * 24 * 180);
        // assert.isTrue(noncecr == 1000000);
        // assert.isTrue(nonceid == now);
        // assert.isTrue(noncemd == now);
    })

    it('Should Issue share to company1(user1), only the Bank can do that action', async () => {
        const transactions: Transaction[] = [
            {classId: SHARE, nonceId: COMPANY1, amount: web3.utils.toWei('5000')}
        ]
        await bondContract.issue(bondManager, transactions, {from: bondManager});
        const buyerBalance = await bondContract.balanceOf(bondManager, SHARE, COMPANY1);
        assert.isTrue(web3.utils.toWei('5000') == buyerBalance.toString())
    })

    it('Should Issue bonds to an account(user2), only the Bank can do that action', async () => {
        const transactions: Transaction[] = [
            {classId: COMPANY1, nonceId: 0, amount: web3.utils.toWei('5000')}
        ]
        await bondContract.issue(user2, transactions, {from: bondManager});
        const buyerBalance = await bondContract.balanceOf(user2, COMPANY1, 0);
        assert.isTrue(web3.utils.toWei('5000') == buyerBalance.toString())

    })


    it('Should convert bonds', async () => {
        const transactions: Transaction[] = [
            {classId: COMPANY1, nonceId: 0, amount: web3.utils.toWei('2000')}
        ]
        await bondContract.convert(user2, transactions, {from: user2});
        const user2BondBalance = await bondContract.balanceOf(user2, COMPANY1, 0);
        const user2ShareBalance = await bondContract.balanceOf(user2, SHARE, COMPANY1);
        assert.isTrue(web3.utils.toWei('3000') == user2BondBalance.toString())
        assert.isTrue(web3.utils.toWei('2200') == user2ShareBalance.toString())
    })

    // it('Should setApproval for an operator', async () => {
    //     await bondContract.setApprovalFor(operator, true,{from: user1});
    //     await bondContract.setApprovalFor(operator, true,{from: user2});
    //     const isApproved = await bondContract.isApprovedFor(user1, operator);
    //     assert.isTrue(isApproved)
    // })
    //
    // it('Should be able for operator to transfer bonds from user to an other', async () => {
    //     const transactions: Transaction[] = [
    //         {classId: DBIT_FIX_6MTH_CLASS_ID, nonceId: 0, amount: web3.utils.toWei('500')}
    //     ]
    //     const transactions_haha: Transaction[] = [
    //         {classId: DBIT_FIX_6MTH_CLASS_ID, nonceId: 1, amount: web3.utils.toWei('500')}
    //     ]
    //
    //     await bondContract.convert(user1, user2, transactions, transactions_haha, {from: operator});
    //     const user1Balance = await bondContract.balanceOf(user1, DBIT_FIX_6MTH_CLASS_ID, 0);
    //     const user2Balance = await bondContract.balanceOf(user2, DBIT_FIX_6MTH_CLASS_ID, 1);
    //     assert.isTrue(web3.utils.toWei('3000') == user1Balance.toString())
    //     assert.isTrue(web3.utils.toWei('7000') == user2Balance.toString())
    // })
    //
    // it('Should add allowance for a spender', async () => {
    //     const transactions: Transaction[] = [
    //         {classId: DBIT_FIX_6MTH_CLASS_ID, nonceId: 0, amount: web3.utils.toWei('2000')}
    //     ]
    //     await bondContract.approve(spender, transactions,{from: user1});
    //     await bondContract.approve(spender, transactions,{from: user2});
    //     const spenderAllowanceOnUser1 = await bondContract.allowance(user1, spender, DBIT_FIX_6MTH_CLASS_ID, 0);
    //     const spenderAllowanceOnUser2 = await bondContract.allowance(user2, spender, DBIT_FIX_6MTH_CLASS_ID, 0);
    //     assert.isTrue(spenderAllowanceOnUser1.toString() == web3.utils.toWei('2000'))
    //     assert.isTrue(spenderAllowanceOnUser2.toString() == web3.utils.toWei('2000'))
    // })
    //
    // // it('Should be able for spender to transfer allowance bonds from a user to an other', async () => {
    // //     const transactions: Transaction[] = [
    // //         {classId: DBIT_FIX_6MTH_CLASS_ID, nonceId: 0, amount: web3.utils.toWei('2000')}
    // //     ]
    // //     await bondContract.transferAllowanceFrom(user1, user2, transactions, {from: spender});
    // //     const user1Balance = await bondContract.balanceOf(user1, DBIT_FIX_6MTH_CLASS_ID, 0);
    // //     const user2Balance = await bondContract.balanceOf(user2, DBIT_FIX_6MTH_CLASS_ID, 0);
    // //     assert.isTrue('0' == user1Balance.toString())
    // //     assert.isTrue(web3.utils.toWei('5000') == user2Balance.toString())
    // // })
    //
    // it('Should be able to burn bonds from user, only bank can do this action', async () => {
    //
    //     // we need to set bank as operator for user
    //     await bondContract.setApprovalFor(bondManager, true,{from: user2});
    //
    //     const transactions: Transaction[] = [
    //         {classId: DBIT_FIX_6MTH_CLASS_ID, nonceId: 1, amount: web3.utils.toWei('1000')}
    //     ]
    //     await bondContract.burn(user2, transactions, {from: bondManager});
    //     const user2Balance = await bondContract.balanceOf(user2, DBIT_FIX_6MTH_CLASS_ID, 1);
    //     const burnedSupply = await bondContract.burnedSupply(DBIT_FIX_6MTH_CLASS_ID, 1);
    //     assert.isTrue(web3.utils.toWei('6000') == user2Balance.toString())
    //     assert.isTrue(web3.utils.toWei('1000') == burnedSupply.toString())
    //     // const executableAddress = await bondContract.getExecutableAddress();
    //     // console.log("ExecutableAddress: ", executableAddress);
    //     // console.log("BankAddress: ", bondContract.getBankAddress());
    // })


    // till here

    // it('Should be able to redeem bonds from user', async () => {

    //     const transactions: Transaction[] = [
    //         {classId: DBIT_FIX_6MTH_CLASS_ID, nonceId: 0, amount: web3.utils.toWei('1000')}
    //     ]
    //     // progressCalculator is bank
    //     await bondContract.updateBondManagerAddress(progressCalculatorContract.address);
    //     await bondContract.redeem(user2, transactions);
    //     const user2Balance = await bondContract.balanceOf(user2, DBIT_FIX_6MTH_CLASS_ID, 0);
    //     const redeemedSupply = await bondContract.redeemedSupply(DBIT_FIX_6MTH_CLASS_ID, 0);
    //     assert.isTrue(web3.utils.toWei('3000') == user2Balance.toString())
    //     assert.isTrue(web3.utils.toWei('1000') == redeemedSupply.toString())
    //     await bondContract.updateBondManagerAddress(bondManager);

    // })

    // it('Should get the liquidity at nonce for a class given', async () => {
    //     const classValues: Value[] = [
    //         {...defaultValue, stringValue: "DBIT"},
    //         {...defaultValue, addressValue: DBITAddress},
    //         {...defaultValue, uintValue: 0},
    //         {...defaultValue, uintValue: 3600 * 24 * 180 }, // 6 months
    //     ]
    //     await bondContract.createClass(8, classMetadatas.map(metadata => classMetadatas.indexOf(metadata)), classValues, {from: bondManager});

    //     const nonceValues: Value[] = [
    //         {...defaultValue, uintValue: now},
    //         {...defaultValue, uintValue: now }, // 6 months
    //     ]
    //     const transaction0: Transaction[] = [{classId: 8, nonceId: 1, amount: web3.utils.toWei('5000')},]
    //     const transaction1: Transaction[] = [{classId: 8, nonceId: 2, amount: web3.utils.toWei('5000')},]
    //     const transaction2: Transaction[] = [{classId: 8, nonceId: 6, amount: web3.utils.toWei('5000')},]
    //     const transaction3: Transaction[] = [{classId: 8, nonceId: 9, amount: web3.utils.toWei('5000')}]
    //     await bondContract.createNonce(8, 1, nonceMetadatas.map(metadata => nonceMetadatas.indexOf(metadata)), nonceValues, {from: bondManager});
    //     await bondContract.issue(user1, transaction0, {from: bondManager});

    //     await bondContract.createNonce(8, 2, nonceMetadatas.map(metadata => nonceMetadatas.indexOf(metadata)), nonceValues, {from: bondManager});
    //     await bondContract.issue(user1, transaction1, {from: bondManager});

    //     await bondContract.createNonce(8, 6, nonceMetadatas.map(metadata => nonceMetadatas.indexOf(metadata)), nonceValues, {from: bondManager});
    //     await bondContract.issue(user1, transaction2, {from: bondManager});

    //     await bondContract.createNonce(8, 9, nonceMetadatas.map(metadata => nonceMetadatas.indexOf(metadata)), nonceValues, {from: bondManager});
    //     await bondContract.issue(user1, transaction3, {from: bondManager});


    //     const liq0 = await bondContract.classLiquidityAtNonce(8, 0, 0)
    //     const liq1 = await bondContract.classLiquidityAtNonce(8, 1, 0)
    //     const liq4 = await bondContract.classLiquidityAtNonce(8, 4, 0)
    //     const liq7 = await bondContract.classLiquidityAtNonce(8, 7, 0)
    //     const liq30 = await bondContract.classLiquidityAtNonce(8, 30, 0)

    //     assert.equal(liq0.toString(), web3.utils.toWei('0'))
    //     assert.equal(liq1.toString(), web3.utils.toWei('5000'))
    //     assert.equal(liq4.toString(), web3.utils.toWei('10000'))
    //     assert.equal(liq7.toString(), web3.utils.toWei('15000'))
    //     assert.equal(liq30.toString(), web3.utils.toWei('20000'))
    // })

    // it('Should get the liquidity class', async () => {
    //   const liquidities = await bondContract.classLiquidityBatch([0, 8]);
    //   console.log(liquidities.map(l => l.toString()));
    //   assert.equal(liquidities[0].toString(), web3.utils.toWei('5000'));
    //   assert.equal(liquidities[1].toString(), web3.utils.toWei('20000'));
    // })
});

