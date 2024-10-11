const ONE_HOUR = 60 * 60;
const ONE_DAY = ONE_HOUR * 24;
const ONE_WEEK = ONE_DAY * 7;

const poolJoinFee = 30;
const poolCreateFee = 50;
const joinPeriod = 10000;
const maxMaturityPeriod = ONE_WEEK * 12;
const maxPlayersPerPool = 100000;
const minStakeAmount = BigInt(100 * 1e18);
const maxOptionsPerPool = 100;
const minMaturityPeriod = ONE_HOUR;
const maxStaleRetries = 3;
const staleExtensionPeriod = ONE_HOUR;
const feeAddress: string = process.env.FEE_ACCOUNT!;
const balls: string = process.env.BALLS!;
const topicRegistry: string = process.env.MULTI_TOPIC_REGISTRY!;

export default [
  poolJoinFee,
  poolCreateFee,
  joinPeriod,
  maxMaturityPeriod,
  maxPlayersPerPool,
  minStakeAmount,
  maxOptionsPerPool,
  minMaturityPeriod,
  maxStaleRetries,
  staleExtensionPeriod,
  feeAddress,
  topicRegistry,
  balls,
];
