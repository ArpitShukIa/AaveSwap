import {ethers, network} from "hardhat"
import {AMOUNT, getWeth} from "./getWeth"
import {networkConfig} from "../helper-hardhat-config"
import {ILendingPool, ILendingPoolAddressesProvider} from "../typechain-types"
import {BigNumber, Signer} from "ethers"

async function main() {
    // Get some WETH to deposit in the lending pool
    await getWeth()
    const [deployer] = await ethers.getSigners()
    const lendingPool: ILendingPool = await getLendingPool(deployer)
    const wethTokenAddress = networkConfig[network.config!.chainId!].wethToken!

    // Approve the lendingPool contract to transfer WETH on our behalf
    await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)

    // Deposit some WETH into the protocol
    console.log("Depositing WETH...")
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer.address, 0)
    console.log("Deposited!")

    // Get the borrowing power left of the deployer
    let borrowReturnData = await getBorrowUserData(lendingPool, deployer)
    let availableBorrowsETH = borrowReturnData[0]

    // Get current DAI price (in terms of ETH)
    const daiPrice = await getDaiPrice()
    const amountDaiToBorrow = availableBorrowsETH.div(daiPrice)
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
    console.log(`You can borrow ${amountDaiToBorrow.toString()} DAI`)

    await borrowDai(
        networkConfig[network.config!.chainId!].daiToken!,
        lendingPool,
        amountDaiToBorrowWei.toString(),
        deployer
    )

    await getBorrowUserData(lendingPool, deployer)

    // Repay debt
    await repay(
        amountDaiToBorrowWei.toString(),
        networkConfig[network.config!.chainId!].daiToken!,
        lendingPool,
        deployer
    )

    await getBorrowUserData(lendingPool, deployer)
}

async function repay(amount: string, daiAddress: string, lendingPool: ILendingPool, account: Signer) {
    await approveErc20(daiAddress, lendingPool.address, amount, account)
    const repayTx = await lendingPool.repay(daiAddress, amount, 1, account.getAddress())
    await repayTx.wait(1)
    console.log("Repaid!")
}

async function borrowDai(daiAddress: string, lendingPool: ILendingPool, amountDaiToBorrow: string, account: Signer) {
    const borrowTx = await lendingPool.borrow(daiAddress, amountDaiToBorrow, 1, 0, account.getAddress())
    await borrowTx.wait(1)
    console.log("Borrowed!")
}

async function getDaiPrice() {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        networkConfig[network.config!.chainId!].daiEthPriceFeed!
    )
    const price = (await daiEthPriceFeed.latestRoundData())[1]
    console.log(`The DAI/ETH price is ${price.toString()}`)
    return price
}

async function approveErc20(erc20Address: string, spenderAddress: string, amount: string, signer: Signer) {
    const erc20Token = await ethers.getContractAt("IERC20", erc20Address, signer)
    const txResponse = await erc20Token.approve(spenderAddress, amount)
    await txResponse.wait(1)
    console.log("Approved!")
}

async function getLendingPool(account: Signer): Promise<ILendingPool> {
    const lendingPoolAddressesProvider: ILendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        networkConfig[network.config!.chainId!].lendingPoolAddressesProvider!,
        account
    )
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
    return await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)
}

async function getBorrowUserData(lendingPool: ILendingPool, account: Signer): Promise<[BigNumber, BigNumber]> {
    const {
        totalCollateralETH,
        totalDebtETH,
        availableBorrowsETH
    } = await lendingPool.getUserAccountData(account.getAddress())
    console.log(`You have ${totalCollateralETH} worth of ETH deposited.`)
    console.log(`You have ${totalDebtETH} worth of ETH borrowed.`)
    console.log(`You can borrow ${availableBorrowsETH} worth of ETH.`)
    return [availableBorrowsETH, totalDebtETH]
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
