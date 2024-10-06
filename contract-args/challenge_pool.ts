const ONE_HOUR = 60 * 60;
const ONE_DAY = ONE_HOUR * 24;
const ONE_WEEK = ONE_DAY * 7;

const poolFee = 10;
const poolJoinFee = 30;
const poolCreateFee = 50;
const joinPeriod = 10000;
const maxMaturityPeriod = ONE_WEEK * 12;
const maxPlayersPerPool = 100;
const minStakeAmount = BigInt(100 * 1e18);
const maxEventsPerChallenge = 10;
const minMaturityPeriod = ONE_HOUR;
const maxStaleRetries = 3;
const staleExtensionPeriod = ONE_HOUR;
const feeAddress: string = process.env.FEE_ACCOUNT!;
const balls: string = process.env.BALLS!;
const trophies: string = process.env.TROPHIES!;
const topicRegistry: string = process.env.TOPIC_REGISTRY!;

export default [
  poolFee,
  joinPeriod,
  maxMaturityPeriod,
  maxPlayersPerPool,
  minStakeAmount,
  maxEventsPerChallenge,
  minMaturityPeriod,
  maxStaleRetries,
  staleExtensionPeriod,
  feeAddress,
  topicRegistry,
  trophies,
  balls,
];
