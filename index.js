const { BigNumber, utils } = require('ethers');
require('isomorphic-fetch');

const SCALE = BigNumber.from((1e18.toString()))

const main = async () => {
  const request = await fetch('https://api.thegraph.com/subgraphs/name/mstable/mstable-protocol', {
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query: `{
        masset(id: "0x945facb997494cc2570096c74b5f66a3507330a1") {
          invariantStartTime
          invariantCapFactor
          invariantStartingCap
          totalSupply {
            exact
          }
        }
      }`,
      variables: null,
    }),
    method: 'POST',
  });

  const { data: { masset } } = await request.json();

  const invariantStartTime = BigNumber.from(masset.invariantStartTime);
  const invariantStartingCap = BigNumber.from(masset.invariantStartingCap);
  const invariantCapFactor = BigNumber.from(masset.invariantCapFactor);
  const totalSupply = BigNumber.from(masset.totalSupply.exact)

  const currentTime = Math.floor(Date.now() / 1000);
  const weeksSinceLaunch = BigNumber.from(currentTime)
    .sub(invariantStartTime)
    .mul(SCALE)
    .div(604800);

  if (weeksSinceLaunch.gt(SCALE.mul(7))) {
    console.log('TVL cap no longer applies');
    return;
  }

  const tvlCap = invariantStartingCap.add(
    invariantCapFactor.mul(weeksSinceLaunch.pow(2)).div(SCALE.pow(2)),
  );

  const delta = tvlCap.sub(totalSupply);

  console.log(`Total supply: ${utils.formatUnits(totalSupply)} (${totalSupply.toString()} base units)`);

  console.log(`TVL cap: ${utils.formatUnits(tvlCap)} (${tvlCap.toString()} base units)`)

  if (delta.eq(0)) {
    console.log('TVL cap usage 100%');
  } else {
    console.log(`Unused cap: ${utils.formatUnits(delta)} (${delta} base units)`);
  }
}

main().then(() => {
  process.exit(0);
}).catch(error => {
  console.error(error);
  process.exit(1);
});

