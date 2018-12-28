const mongoose = require('mongoose');

const durations = require('../durations');

const chartSchema = new mongoose.Schema({
  exchange: { type: String, required: true },
  pair: { type: String, required: true },
  interval: { type: String, required: true, enum: durations },
  pipelines: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomPipeline'
  }]
});

const Chart = mongoose.model('Chart', chartSchema);

module.exports = { Chart, chartSchema };