const Step = require('../step');

class SupportResistance extends Step {
  constructor() {
    super({
      requires: ['fractals']
    });
  }

  filter(data) {
  }

  execute(data, { fractals }) {
    console.log('fractals = ', fractals);
  }
}

module.exports = SupportResistance;