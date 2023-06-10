// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IInstaYieldTokenFactory.sol";
import "./InstaYieldFToken.sol";

contract InstaYieldFTokenFactory is Ownable, IInstaYieldTokenFactory {
    event FTokenCreated(address _tokenAddress);

    constructor() public {}

    function createFToken(string calldata _fTokenName, string calldata _fTokenSymbol)
        external
        onlyOwner
        returns (address)
    {
        InstaYieldFToken InstaYieldFToken = new InstaYieldFToken(_fTokenName, _fTokenSymbol);
        InstaYieldFToken.transferOwnership(msg.sender);

        emit FTokenCreated(address(InstaYieldFToken));
        return address(InstaYieldFToken);
    }
}
