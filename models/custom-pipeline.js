const mongoose = require('mongoose');

const durations = require('../durations');

const customPipelineSchema = new mongoose.Schema({
  exchange: {
    type: String,
    required: true
  },
  pair: {
    type: String,
    required: true
  },
  interval: {
    type: String,
    required: true,
    enum: durations
  },
  indicators: mongoose.Schema.Types.Mixed,
  expires: {
    type: Date,
    default: () => new Date(Date.now() + 60 * 60 * 24 * 1000)
  }
});

const CustomPipeline = mongoose.model('CustomPipeline', customPipelineSchema);

module.exports = { CustomPipeline, customPipelineSchema };