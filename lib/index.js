'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Trigger = exports.Wrapper = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _wolfy87Eventemitter = require('wolfy87-eventemitter');

var _wolfy87Eventemitter2 = _interopRequireDefault(_wolfy87Eventemitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ee = new _wolfy87Eventemitter2.default();

var Trigger = function (_React$Component) {
  _inherits(Trigger, _React$Component);

  function Trigger() {
    _classCallCheck(this, Trigger);

    return _possibleConstructorReturn(this, (Trigger.__proto__ || Object.getPrototypeOf(Trigger)).apply(this, arguments));
  }

  _createClass(Trigger, [{
    key: 'handleExport',
    value: function handleExport() {
      // Request a PNG with a specific size.
      ee.emit(this.props.eventName, {
        width: this.props.width,
        height: this.props.height,
        filename: this.props.filename
      });
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(this.props.component, {
        className: this.props.className,
        onClick: this.handleExport
      }, this.props.children);
    }
  }]);

  return Trigger;
}(_react2.default.Component);

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

var Wrapper = function (_React$Component2) {
  _inherits(Wrapper, _React$Component2);

  function Wrapper(props) {
    _classCallCheck(this, Wrapper);

    var _this2 = _possibleConstructorReturn(this, (Wrapper.__proto__ || Object.getPrototypeOf(Wrapper)).call(this, props));

    _this2.state = {
      width: _this2.props.initialWidth || '100%',
      height: _this2.props.initialHeight || '100%',
      downloadableOptions: null,
      creatingDownloadable: false
    };
    return _this2;
  }

  _createClass(Wrapper, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      ee.addListener(this.props.listenFor, this.startDownload);
      this.isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps, prevState) {
      if (!this.state.creatingDownloadable) return;

      // Finish creating downloadable data
      var filename = this.state.downloadableOptions.filename;
      if (!filename) filename = this.props.filename;
      var $svg = _reactDom2.default.findDOMNode(this.wrapperNode).getElementsByTagName('svg')[0];
      //
      var $clone = $svg.cloneNode(true);

      var width = this.state.downloadableOptions.width || $svg.width.baseVal.value;
      var height = this.state.downloadableOptions.height || $svg.height.baseVal.value;

      $clone.setAttribute('width', width);
      $clone.setAttribute('height', height);

      // Reset to original size
      this.setState({
        width: prevState.width,
        height: prevState.height,
        downloadableOptions: null,
        creatingDownloadable: false
      });

      var svgData = new XMLSerializer().serializeToString($clone);

      var canvas = document.createElement('canvas');

      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      var ctx = canvas.getContext('2d');
      var DOMURL = window.URL || window.webkitURL || window;
      var img = new Image();
      var svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      var url = DOMURL.createObjectURL(svgBlob);

      img.onload = function () {
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(url);

        var imgURI = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');

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

  }, {
    key: 'startDownload',
    value: function startDownload(data) {
      this.setState({
        width: data.width,
        height: data.height,
        downloadableOptions: data,
        creatingDownloadable: true
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var _this3 = this;

      var _state = this.state,
          width = _state.width,
          height = _state.height;


      var childrenWithProps = _react2.default.Children.map(this.props.children, function (child) {
        return _react2.default.cloneElement(child, {
          width: width,
          height: height
        });
      });

      return _react2.default.createElement(
        'div',
        { className: this.props.className, ref: function ref(node) {
            return _this3.wrapperNode = node;
          } },
        childrenWithProps
      );
    }
  }]);

  return Wrapper;
}(_react2.default.Component);

Wrapper.propTypes = {
  filename: _propTypes2.default.string,
  listenFor: _propTypes2.default.string,
  className: _propTypes2.default.string
};

Wrapper.defaultProps = {
  filename: 'untitled.png',
  listenFor: 'downloadSvg',
  className: ''
};

exports.Wrapper = Wrapper;
exports.Trigger = Trigger;