import ReactDOM from 'react-dom';
import React from 'react';
import PropTypes from 'prop-types';
import EventEmitter from 'wolfy87-eventemitter';
const ee = new EventEmitter();

class Trigger extends React.Component {

  handleExport() {
    // Request a PNG with a specific size.
    ee.emit(this.props.eventName, {
      width: this.props.width,
      height: this.props.height,
      filename: this.props.filename
    });
  }

  render() {
    return React.createElement(this.props.component, {
      className: this.props.className,
      onClick: this.handleExport
    }, this.props.children);
  }
}

Trigger.propTypes = {
  component: PropTypes.any,
  filename: PropTypes.string,
  eventName: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number
};

Trigger.defaultProps = {
  filename: null,
  width: 400,
  height: 400,
  eventName: 'downloadSvg',
  component: 'button'
};

//https://stackoverflow.com/a/11277737/2614364
function createObjectURL ( file ) {
    if ( window.webkitURL ) {
        return window.webkitURL.createObjectURL( file );
    } else if ( window.URL && window.URL.createObjectURL ) {
        return window.URL.createObjectURL( file );
    } else {
        return null;
    }
}

class Wrapper extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      width: this.props.initialWidth || '100%',
      height: this.props.initialHeight || '100%',
      downloadableOptions: null,
      creatingDownloadable: false
    };
  }

  componentDidMount() {
    ee.addListener(this.props.listenFor, this.startDownload);
    this.isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
  }

  componentDidUpdate(prevProps, prevState) {
    if(!this.state.creatingDownloadable) return;

    // Finish creating downloadable data
    var filename = this.state.downloadableOptions.filename;
    if(!filename) filename = this.props.filename;
    const $svg = ReactDOM.findDOMNode(this.wrapperNode).getElementsByTagName('svg')[0];
    //
    const $clone = $svg.cloneNode(true);

    const width = this.state.downloadableOptions.width || $svg.width.baseVal.value;
    const height = this.state.downloadableOptions.height || $svg.height.baseVal.value;

    $clone.setAttribute('width', width);
    $clone.setAttribute('height', height);

    // Reset to original size
    this.setState({
      width: prevState.width,
      height: prevState.height,
      downloadableOptions: null,
      creatingDownloadable: false,
    });

    const svgData = new XMLSerializer().serializeToString($clone);

    var canvas = document.createElement('canvas');

    // Image will be scaled to the requested size.
    // var size = data.requestedSize;
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);

    var ctx = canvas.getContext('2d');

    // New window for the image when it's loaded
    if(!this.isChrome) window.open('', 'download');

    var img = document.createElement('img');
    var svg = new Blob([svgData], {type:"image/svg+xml;base64," + btoa(svgData)});

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      // `download` attr is not well supported
      // Will result in a download popup for chrome and the
      // image opening in a new tab for others.

      var a = document.createElement('a');
      a.setAttribute('href', canvas.toDataURL('image/png'))
      a.setAttribute('target', 'download')
      a.setAttribute('download', filename);
      a.click();
    };

    img.src = createObjectURL(svg);
  }

  /**
   * Expects object with:
   * width: Number
   * height: Number
   * filename: String (optional)
   */
  startDownload(data) {
    this.setState({
      width: data.width,
      height: data.height,
      downloadableOptions: data,
      creatingDownloadable: true
    });
  }

  render() {
    const { width, height } = this.state;

    const childrenWithProps = React.Children.map(this.props.children, (child) => {
      return React.cloneElement(child, {
        width: width,
        height: height
      });
    });

    return (
      <div ref={(node) => this.wrapperNode = node}>
        {childrenWithProps}
      </div>
    );
  }
}

Wrapper.propTypes = {
  filename: PropTypes.string,
  listenFor: PropTypes.string
};

Wrapper.defaultProps = {
  filename: 'untitled.png',
  listenFor: 'downloadSvg'
};

export {
	Wrapper,
	Trigger
};
