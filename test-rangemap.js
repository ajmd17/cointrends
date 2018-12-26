const RangeMap = require('./range-map');

const rm = new RangeMap();
rm.set(112234, 112238, [1,2,3,4,5]);
console.log('rm.toArray() = ', rm.toArray());

console.log('rm.get(12, 15) = ', rm.get(12, 15));
console.log('rm.get(112236, 112238) = ', rm.get(112236, 112238));