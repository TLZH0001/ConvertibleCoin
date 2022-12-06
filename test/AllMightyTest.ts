import {
    DebondERC3475Instance, ProgressCalculatorInstance
} from "../types/truffle-contracts";

const DebondBond = artifacts.require("DebondERC3475");
const ProgressCalculator = artifacts.require("ProgressCalculator");


interface Transaction {
    classId: number | BN | string;
    nonceId: number | BN | string;
    amount: number | BN | string;
    nonceId2: number | BN | string;
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

    const DBIT_FIX_6MTH_CLASS_ID = 0;
    const [governance, bondManager, user1, user2, operator, spender, DBITAddress] = accounts;

    const now = parseInt(Date.now().toString().substring(-3));
    const classMetadatas: Metadata[] = [
        {title: "symbol", types: "string", description: "the collateral token's symbol"},
        {title: "token address", types: "address", description: "the collateral token's address"},
        {title: "interest rate type", types: "int", description: "the interest rate type"},
        {title: "period", types: "int", description: "the base period for the class"},
    ]

    const nonceMetadatas: Metadata[] = [
        {title: "issuance Date", types: "int", description: "the issuance date"},
        {title: "maturity Date", types: "int", description: "the maturity date"}
    ]

    it('Initialisation', async () => {
        bondContract = await DebondBond.deployed();
        progressCalculatorContract = await ProgressCalculator.deployed();

    })

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
});