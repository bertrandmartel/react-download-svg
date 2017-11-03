import ReactDOM from 'react-dom';
import React from 'react';
import EventEmitter from 'wolfy87-eventemitter';
const ee = new EventEmitter();

const Trigger = React.createClass({
  displayName: 'DownloadSvgTrigger',
  propTypes: {
    component: React.PropTypes.any,
    filename: React.PropTypes.string,
    eventName: React.PropTypes.string,
    width: React.PropTypes.number,
    height: React.PropTypes.number
  },

  getDefaultProps: function () {
    return {
      filename: null,
      width: 400,
      height: 400,
      eventName: 'downloadSvg',
      component: 'button'
    };
  },

  handleExport: function () {
    // Request a PNG with a specific size.
    ee.emit(this.props.eventName, {
      width: this.props.width,
      height: this.props.height,
      filename: this.props.filename
    });
  },

  render: function () {
    return React.createElement(this.props.component, {
      className: this.props.className,
      onClick: this.handleExport
    }, this.props.children);
  }
});

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

const Wrapper = React.createClass({
  displayName: 'DownloadSvgWrapper',
  propTypes: {
    filename: React.PropTypes.string,
    listenFor: React.PropTypes.string
  },

  getInitialState: function () {
    return {
      width: this.props.initialWidth || '100%',
      height: this.props.initialHeight || '100%',
      downloadableOptions: null,
      creatingDownloadable: false
    };
  },

  getDefaultProps: function () {
    return {
      filename: 'untitled.png',
      listenFor: 'downloadSvg'
    }
  },

  componentDidMount: function () {
    ee.addListener(this.props.listenFor, this.startDownload);
    this.isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
  },

  componentDidUpdate: function (prevProps, prevState) {
    if(!this.state.creatingDownloadable) return;

    // Finish creating downloadable data
    const { width, height } = this.state.downloadableOptions;
    var filename = this.state.downloadableOptions.filename;
    if(!filename) filename = this.props.filename;
    const $svg = ReactDOM.findDOMNode(this.wrapperNode).getElementsByTagName('svg')[0];
    //
    const $clone = $svg.cloneNode(true);

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
  },

  /**
   * Expects object with:
   * width: Number
   * height: Number
   * filename: String (optional)
   */
  startDownload: function (data) {
    this.setState({
      width: data.width,
      height: data.height,
      downloadableOptions: data,
      creatingDownloadable: true
    });
  },

  render: function () {
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
});

export {
	Wrapper,
	Trigger
};
