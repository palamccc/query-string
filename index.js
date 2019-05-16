"use strict";

function _slicedToArray(arr, i) {
  return (
    _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest()
  );
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;
  try {
    for (
      var _i = arr[Symbol.iterator](), _s;
      !(_n = (_s = _i.next()).done);
      _n = true
    ) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj &&
        typeof Symbol === "function" &&
        obj.constructor === Symbol &&
        obj !== Symbol.prototype
        ? "symbol"
        : typeof obj;
    };
  }
  return _typeof(obj);
}

function _toConsumableArray(arr) {
  return (
    _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread()
  );
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

function _iterableToArray(iter) {
  if (
    Symbol.iterator in Object(iter) ||
    Object.prototype.toString.call(iter) === "[object Arguments]"
  )
    return Array.from(iter);
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  }
}

var strictUriEncode = require("strict-uri-encode");

var decodeComponent = require("decode-uri-component");

var splitOnFirst = require("split-on-first");

function encoderForArrayFormat(options) {
  switch (options.arrayFormat) {
    case "index":
      return function(key) {
        return function(result, value) {
          var index = result.length;

          if (value === undefined) {
            return result;
          }

          if (value === null) {
            return [].concat(_toConsumableArray(result), [
              [encode(key, options), "[", index, "]"].join("")
            ]);
          }

          return [].concat(_toConsumableArray(result), [
            [
              encode(key, options),
              "[",
              encode(index, options),
              "]=",
              encode(value, options)
            ].join("")
          ]);
        };
      };

    case "bracket":
      return function(key) {
        return function(result, value) {
          if (value === undefined) {
            return result;
          }

          if (value === null) {
            return [].concat(_toConsumableArray(result), [
              [encode(key, options), "[]"].join("")
            ]);
          }

          return [].concat(_toConsumableArray(result), [
            [encode(key, options), "[]=", encode(value, options)].join("")
          ]);
        };
      };

    case "comma":
      return function(key) {
        return function(result, value, index) {
          if (value === null || value === undefined || value.length === 0) {
            return result;
          }

          if (index === 0) {
            return [
              [encode(key, options), "=", encode(value, options)].join("")
            ];
          }

          return [[result, encode(value, options)].join(",")];
        };
      };

    default:
      return function(key) {
        return function(result, value) {
          if (value === undefined) {
            return result;
          }

          if (value === null) {
            return [].concat(_toConsumableArray(result), [
              encode(key, options)
            ]);
          }

          return [].concat(_toConsumableArray(result), [
            [encode(key, options), "=", encode(value, options)].join("")
          ]);
        };
      };
  }
}

function parserForArrayFormat(options) {
  var result;

  switch (options.arrayFormat) {
    case "index":
      return function(key, value, accumulator) {
        result = /\[(\d*)\]$/.exec(key);
        key = key.replace(/\[\d*\]$/, "");

        if (!result) {
          accumulator[key] = value;
          return;
        }

        if (accumulator[key] === undefined) {
          accumulator[key] = {};
        }

        accumulator[key][result[1]] = value;
      };

    case "bracket":
      return function(key, value, accumulator) {
        result = /(\[\])$/.exec(key);
        key = key.replace(/\[\]$/, "");

        if (!result) {
          accumulator[key] = value;
          return;
        }

        if (accumulator[key] === undefined) {
          accumulator[key] = [value];
          return;
        }

        accumulator[key] = [].concat(accumulator[key], value);
      };

    case "comma":
      return function(key, value, accumulator) {
        var isArray =
          typeof value === "string" && value.split("").indexOf(",") > -1;
        var newValue = isArray ? value.split(",") : value;
        accumulator[key] = newValue;
      };

    default:
      return function(key, value, accumulator) {
        if (accumulator[key] === undefined) {
          accumulator[key] = value;
          return;
        }

        accumulator[key] = [].concat(accumulator[key], value);
      };
  }
}

function encode(value, options) {
  if (options.encode) {
    return options.strict ? strictUriEncode(value) : encodeURIComponent(value);
  }

  return value;
}

function decode(value, options) {
  if (options.decode) {
    return decodeComponent(value);
  }

  return value;
}

function keysSorter(input) {
  if (Array.isArray(input)) {
    return input.sort();
  }

  if (_typeof(input) === "object") {
    return keysSorter(Object.keys(input))
      .sort(function(a, b) {
        return Number(a) - Number(b);
      })
      .map(function(key) {
        return input[key];
      });
  }

  return input;
}

function removeHash(input) {
  var hashStart = input.indexOf("#");

  if (hashStart !== -1) {
    input = input.slice(0, hashStart);
  }

  return input;
}

function extract(input) {
  input = removeHash(input);
  var queryStart = input.indexOf("?");

  if (queryStart === -1) {
    return "";
  }

  return input.slice(queryStart + 1);
}

function parse(input, options) {
  options = Object.assign(
    {
      decode: true,
      arrayFormat: "none"
    },
    options
  );
  var formatter = parserForArrayFormat(options); // Create an object with no prototype

  var ret = Object.create(null);

  if (typeof input !== "string") {
    return ret;
  }

  input = input.trim().replace(/^[?#&]/, "");

  if (!input) {
    return ret;
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (
      var _iterator = input.split("&")[Symbol.iterator](), _step;
      !(_iteratorNormalCompletion = (_step = _iterator.next()).done);
      _iteratorNormalCompletion = true
    ) {
      var param = _step.value;

      var _splitOnFirst = splitOnFirst(param.replace(/\+/g, " "), "="),
        _splitOnFirst2 = _slicedToArray(_splitOnFirst, 2),
        key = _splitOnFirst2[0],
        value = _splitOnFirst2[1]; // Missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters

      value = value === undefined ? null : decode(value, options);
      formatter(decode(key, options), value, ret);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return Object.keys(ret)
    .sort()
    .reduce(function(result, key) {
      var value = ret[key];

      if (
        Boolean(value) &&
        _typeof(value) === "object" &&
        !Array.isArray(value)
      ) {
        // Sort object keys, not values
        result[key] = keysSorter(value);
      } else {
        result[key] = value;
      }

      return result;
    }, Object.create(null));
}

exports.extract = extract;
exports.parse = parse;

exports.stringify = function(object, options) {
  if (!object) {
    return "";
  }

  options = Object.assign(
    {
      encode: true,
      strict: true,
      arrayFormat: "none"
    },
    options
  );
  var formatter = encoderForArrayFormat(options);
  var keys = Object.keys(object);

  if (options.sort !== false) {
    keys.sort(options.sort);
  }

  return keys
    .map(function(key) {
      var value = object[key];

      if (value === undefined) {
        return "";
      }

      if (value === null) {
        return encode(key, options);
      }

      if (Array.isArray(value)) {
        return value.reduce(formatter(key), []).join("&");
      }

      return encode(key, options) + "=" + encode(value, options);
    })
    .filter(function(x) {
      return x.length > 0;
    })
    .join("&");
};

exports.parseUrl = function(input, options) {
  return {
    url: removeHash(input).split("?")[0] || "",
    query: parse(extract(input), options)
  };
};
