import { encodePacked, encodeAbiParameters, decodeAbiParameters } from "viem";

const proposal = 25888 * 1e8; // alway multiply proposal by 1e8

const param = "BTC";

const encodedProposal = encodePacked(["int"], [BigInt(proposal)]);

const encodedParam = encodePacked(["string"], [param]);

console.log('encodedProposal', encodedProposal);

console.log('encodedParam', encodedParam);