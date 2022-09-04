import { ethers, network } from "hardhat"
import { networkConfig } from "../helper-hardhat-config"

export const AMOUNT = (ethers.utils.parseEther("0.01")).toString()

export async function getWeth() {
    const [deployer] = await ethers.getSigners()
    const iWeth = await ethers.getContractAt(
        "IWeth",
        networkConfig[network.config!.chainId!].wethToken!,
        deployer
    )
    const txResponse = await iWeth.deposit({
        value: AMOUNT,
    })
    await txResponse.wait(1)
    const wethBalance = await iWeth.balanceOf(deployer.address)
    console.log(`Got ${wethBalance.toString()} WETH`)
}
