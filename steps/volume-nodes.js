const Step = require('../step');



class VolumeNodes extends Step {
  constructor(threshold=30) {
    super();

    this.threshold = threshold;
  }

  execute(data, { volume_sma }) {
    let volumeNodes = [];

    // interate through bars, if volume > average,
    // multiply the size / weight of volume node by percent difference 
    // to avg. so a small diff should lead to a tiny node where as a large
    // difference will lead to a larger node
    // colour of node will depend on whether there was more sell volume than
    // buy volume

    for (let i = 0; i < data.length; i++) {
      let current = data[i],
          volume = current.volume,
          currentAvgVolume = volume_sma[current.timestamp];
      
      if (volume > (currentAvgVolume * (1 + (this.threshold * 0.01)))) {
        volumeNodes.push({
          timestamp: current.timestamp,
          volume,
          open: current.open,
          close: current.close,
          weight: volume / currentAvgVolume
        });
      }
    }

    return volumeNodes;
  }
}

VolumeNodes.options = {
  requires: ['volume_sma'],
  configuration: {
    threshold: {
      default: 30,
      text: 'Threshold'
    }
  }
};

module.exports = VolumeNodes;
