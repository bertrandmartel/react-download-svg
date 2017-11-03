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

Trigger.defaultProps = {
  filename: null,
  width: 400,
  height: 400,
  eventName: 'downloadSvg',
  component: 'button'
};

//https://stackoverflow.com/a/28226736/2614364 by Ciro Costa
function triggerDownload(imgURI, filename) {
  console.log(filename);
  var evt = new MouseEvent('click', {
    view: window,
    bubbles: false,
    cancelable: true
  });

  var a = document.createElement('a');
  a.setAttribute('download', filename);
  a.setAttribute('href', imgURI);
  a.setAttribute('target', '_blank');

  a.dispatchEvent(evt);
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

    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    var ctx = canvas.getContext('2d');
    var DOMURL = window.URL || window.webkitURL || window;
    var img = new Image();
    var svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    var url = DOMURL.createObjectURL(svgBlob);

    img.onload = function () {
      ctx.drawImage(img, 0, 0);
      DOMURL.revokeObjectURL(url);

      var imgURI = canvas
          .toDataURL('image/png')
          .replace('image/png', 'image/octet-stream');

      triggerDownload(imgURI, filename);
    };
    img.src = url;
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
      <div className={this.props.className} ref={(node) => this.wrapperNode = node}>
        {childrenWithProps}
      </div>
    );
  }
}

Wrapper.propTypes = {
  filename: PropTypes.string,
  listenFor: PropTypes.string,
  className: PropTypes.string
};

Wrapper.defaultProps = {
  filename: 'untitled.png',
  listenFor: 'downloadSvg',
  className: ''
};

export {
	Wrapper,
	Trigger
};
