import React from 'react';

import StraightLine from 'react-stockcharts/lib/interactive/components/StraightLine';

function hashCode(str) { // java String#hashCode
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
     hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
} 

function intToRGB(i){
  var c = (i & 0x00FFFFFF)
      .toString(16)
      .toUpperCase();

  return "00000".substring(0, 6 - c.length) + c;
}

class Trendlines extends React.Component {
  static propTypes = {
    trendlines: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
  };

  render() {
    /* @TODO */
    const { xAccessor, xScale } = this.props;

    const getData = (timestamp) => {
      return this.props.data.find(x => x.timestamp == timestamp);
    };

    return (
      <div>
        {this.props.trendlines.map((line, i) => {
          const { a, b, pt, bPt, strength, contactPoints, direction } = line;
          let timestamps = contactPoints.map(x => x.timestamp).join('_');
          let colorRgb = `#${intToRGB(hashCode(timestamps))}`;
          let lastDataIndex = this.props.data.findIndex(x => x.timestamp == contactPoints[contactPoints.length - 1].timestamp);
          
          return (
            <div key={i}>
              <StraightLine stroke={colorRgb}//{ up: '#00CC00', down: '#CC0000' }[direction]}
                type={this.props.data.length - lastDataIndex < 15 ? 'RAY' : 'LINE' /* lookback to detect if we should chop end of line */}
                x1Value={xScale(xAccessor(getData(contactPoints[0].timestamp)))}
                x2Value={xScale(xAccessor(getData(contactPoints[contactPoints.length - 1].timestamp)))}
                y1Value={pt}
                y2Value={bPt}
                strokeWidth={1}
                strokeOpacity={1}
              />
              
            </div>
          );
        })}
      </div>
    );
  }
}

export default Trendlines;