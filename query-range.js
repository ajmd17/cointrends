const parseDuration = require('parse-duration');

const { serial } = require('./util');

const findTimestampIndex = (data, timestamp) => {
  for (let j = 0; j < data.length; j++) {
    if (data[j].timestamp == timestamp) {
      return j;
    }
  }

  return -1;
};

function getTimestamp(obj) {
  if (typeof obj === 'number') {
    return obj;
  }

  return obj.timestamp;
}

const MAX_LEN = 500;

class QueryRequest {
  constructor(startTime, endTime, index) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.index = index;
  }
}

class QueryRange {
  constructor(interval, fetchHandler) {
    this.interval = interval;
    this.intervalMs = parseDuration(interval);
    this.fetchHandler = fetchHandler;
    this.data = [];
  }

  add(newData) {

  }

  query(startTime, endTime, latest=false) {
    startTime = Math.floor(Number(startTime) / this.intervalMs) * this.intervalMs;
    endTime = (Math.floor(Number(endTime) / this.intervalMs) * this.intervalMs) //+ this.intervalMs;

    if (latest) {
      endTime += this.intervalMs;

      if (this.data.length != 0) {
        if (endTime >= Date.now()) {
          this.data.pop();
        }
      }
    }

    let sections = this._filterSubsections(this._populateSections(startTime, endTime), startTime, endTime);
    let toProcess = sections.map(({ found, values }, index) => {
      if (found) {
        return null;
      }
      
      return new QueryRequest(values[0], values[values.length - 1], index);
    }).filter(x => x instanceof QueryRequest);
    
    return this._processData(sections, toProcess).then(() => {
      let newData = this.data.slice();

      sections.forEach(({ found, values }, index) => {
        if (found || values.length == 0) return;

        values.forEach((value) => {
          console.assert(value instanceof Object && 'timestamp' in value, `value (${value}) should be a Candle with 'timestamp' property`);

          let foundIndex = findTimestampIndex(newData, value.timestamp);

          if (foundIndex !== -1) {
            console.log(`Value ${value.timestamp} should not yet be in main array but was found at index ${foundIndex} (${newData.length - foundIndex})   (duration: ${this.interval})`);
            newData[foundIndex] = value;
          }
        });

        let startIndex = -1;
        let endIndex = -1;

        for (let i = 0; i < newData.length; i++) {
          if (startIndex != -1 && endIndex != -1) break;
          if (newData[i].timestamp < values[0].timestamp) {
            startIndex = i;
          }
          if (newData[i].timestamp > values[values.length - 1].timestamp) {
            endIndex = i;
          }
        }

        if (startIndex != -1) {
          console.assert(newData[startIndex].timestamp < values[0].timestamp, `newData[${startIndex}].timestamp (${newData[startIndex].timestamp}) should be less than ${values[0].timestamp}`);
          if (endIndex != -1) {
            console.assert(newData[endIndex].timestamp > values[values.length - 1].timestamp, `newData[${endIndex}].timestamp (${newData[endIndex].timestamp}) should be greater than ${values[values.length - 1].timestamp}`);
          }
          newData = newData.slice(0, startIndex + 1).concat(values).concat(newData.slice(endIndex));
        } else {
          newData = values.concat(newData);
        }

        sections[index].found = true;
      });

      this.data = newData;
    }).then(() => {
      // compact the array
      return sections.reduce((accum, el) => accum.concat(el.values), []);
    });
  }

  _processData(sections, toProcess) {
    if (toProcess.length == 0) {
      return Promise.resolve([]);
    }

    return serial(toProcess.map((queryRequest) => {
      let duplicates = [];
      for (let i = queryRequest.startTime; i <= queryRequest.endTime; i+=this.intervalMs) {
        let index = this.data.findIndex(x => x.timestamp == i);
        if (index !== -1) {
          duplicates.push(i);
        }
      }
      console.assert(duplicates.length == 0, `Duplicates found: ${duplicates.join(', ')}`);
      return () => this.fetchHandler(queryRequest.startTime, queryRequest.endTime, this.interval).then((result) => {
        sections[queryRequest.index] = { found: false, values: result };
      });
    }));
  }

  _filterSubsections(sections, startTime, endTime) {
    let newSections = [];

    for (let i = 0; i < sections.length; i++) {
      newSections.push(sections[i]);

      let subsections = [{
        found: false,
        values: []
      }];

      if (i == sections.length - 1) {
        for (let j = sections[i].values[sections[i].values.length - 1] + this.intervalMs; j <= endTime; j += this.intervalMs) {
          if (subsections[subsections.length - 1].values.length >= MAX_LEN) {
            subsections.push({ found: false, values: [] });
          }
          subsections[subsections.length - 1].values.push(j);
        }
      } else {
        for (let j = sections[i].values[sections[i].values.length - 1] + this.intervalMs; j < sections[i + 1].values[0]; j += this.intervalMs) {
          if (subsections[subsections.length - 1].values.length >= MAX_LEN) {
            subsections.push({ found: false, values: [] });
          }
          subsections[subsections.length - 1].values.push(j);
        }
      }

      subsections.forEach((ss) => {
        ss.values.forEach((value, index) => {
          for (let j = 0; j < ss.values.length; j++) {
            if (j != index) {
              if (ss.values[j] == value) {
                throw Error(`duplicate of ${value} (index: ${index}) found at index: ${j}`);
              }
            }
          }

          let foundIndex = findTimestampIndex(this.data, value.timestamp);
          console.assert(foundIndex === -1, `'test'   ${value.timestamp}   found at index ${foundIndex}  in : ${ss.values.join(',')}`);
        });
        if (ss.values.length != 0) {
          newSections.push(ss);
        }
      });
    }

    return newSections;
  }

  _populateSections(startTime, endTime) {
    let sections = [];
    let dataCopy = this.data.slice();

    for (let i = startTime; i <= endTime; i += this.intervalMs) {
      //let index = this.data.findIndex(i); // @TODO: use binary search. the data will be sorted.
      let index = findTimestampIndex(dataCopy, i);
      let prevIndex = findTimestampIndex(dataCopy, i - this.intervalMs);

      if (i == startTime || sections[sections.length - 1].values.length >= 500 || Math.sign(index + 1) != Math.sign(prevIndex + 1)) {
        sections.push({
          found: index != -1,
          values: []
        });
      }

      if (index != -1) {
        console.assert(dataCopy[index] != null, 'null check failed');
      }

      sections[sections.length - 1].values.push(index != -1 ? dataCopy[index] : i);
    }

    sections.forEach((section, index) => {
      if (!section.found) {
        section.values.forEach((value, index2) => {
          console.assert(findTimestampIndex(this.data, value.timestamp) == -1);
          for (let j = 0; j < section.values.length; j++) {
            if (j != index2) {
              if (section.values[j] == value) {
                throw Error(`duplicate of ${value} (index: ${index2}) found at index: ${j}`);
              }
            }
          }
        });
      }

      if (index == sections.length - 1) {
        return;
      }

      console.assert(getTimestamp(section.values[section.values.length - 1]) < getTimestamp(sections[index + 1].values[0]), `${JSON.stringify(section)}\n\n${JSON.stringify(sections[index + 1])}`);

      if (index == 0) {
        return;
      }
      
      console.assert(getTimestamp(section.values[0]) > getTimestamp(sections[index - 1].values[sections[index - 1].values.length - 1]));
    });

    return sections;
  }
}

module.exports = QueryRange;