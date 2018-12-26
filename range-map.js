class RangeMap {
  constructor() {
    this._start = NaN;
    this._obj = {};
  }

  get(startKey, endKey) {
    let ary = new Array(endKey - startKey + 1);

    for (let i = 0; i < endKey - startKey + 1; i++) {
      ary[i] = this._obj[startKey + i];
    }

    return ary;
  }

  set(startKey, endKey, values) {
    if (typeof startKey !== 'number' || Math.floor(startKey) !== startKey) {
      throw Error('startKey must be an integer');
    }

    if (typeof endKey !== 'number' || Math.floor(endKey) !== endKey) {
      throw Error('endKey must be an integer');
    }

    if (startKey > endKey) {
      throw Error('startKey must not be greater than endKey');
    }

    if (isNaN(this._start) || startKey < this._start) {
      this._start = startKey;
    }

    if (values.length != (endKey - startKey + 1)) {
      throw Error('values.length should be == (endKey - startKey + 1)');
    }

    for (let i = 0; i < endKey - startKey + 1; i++) {
      this._obj[startKey + i] = values[i];
    }
  }

  delete(startKey, endKey) {
    for (let i = 0; i < endKey - startKey + 1; i++) {
      delete this._obj[startKey + i];
    }

    this._start = NaN;

    Object.keys(this._obj).forEach((key) => {
      let num = Number.parseInt(key);

      if (isNaN(this._start) || num < this._start) {
        this._start = num;
      }
    });
  }

  toArray() {
    let numKeys = Object.keys(this._obj).length;
    let ary = new Array(numKeys);

    if (isNaN(this._start)) {
      return ary;
    }

    for (let key = this._start, counter = 0; key < this._start + numKeys; key++, counter++) {
      ary[counter] = this._obj[key];
    }

    return ary;
  }
}

module.exports = RangeMap;