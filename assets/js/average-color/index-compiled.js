'use strict';

// Helpers.


var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

console.log(_slicedToArray)

//exports.default = averageColor;
//exports.averageColorNormalized = averageColorNormalized;
var atan2 = Math.atan2,
    cos = Math.cos,
    sin = Math.sin,
    PI = Math.PI;

var sum = function sum(a, b) {
	return a + b;
};

// Constants.
var PI2 = PI * 2;
var X = 0;
var Y = 1;

/**
 * Returns the average color from a list of HSL arrays.
 *
 * HSL colors are converted from cylindrical coordinates to Cartesian
 * coordinates, averaged, and converted back to HSL.
 *
 * To retain consistent saturation, the Cartesian average is ignored and a
 * simple arithmetic mean is returned. This is an aesthetic choice; both values
 * are valid.
 *
 * For both input and output, the expected range is:  H => [0, 360]
 *                                                    S => [0, 100]
 *                                                    L => [0, 100]
 *
 * @param  {[H, S, L][]} colors   A list of HSL value arrays (colors can also
 *                                be passed in as separate arguments).
 *
 * @return {[H, S, L]}            The average color.
 */
function averageColor() {
	var result = averageColorNormalized.apply(undefined, arguments);
	return [result[0] * 360, result[1] * 100, result[2] * 100];
}

/**
 * Same as above, but with output ranges normalized to [0, 1].
 */
function averageColorNormalized() {
	for (var _len = arguments.length, colors = Array(_len), _key = 0; _key < _len; _key++) {
		colors[_key] = arguments[_key];
	}

	// If a single colors array was provided as opposed to separate arguments
	// for each color, break it out.
	if (colors.length === 1 && Array.isArray(colors[0][0])) colors = colors[0];

	var N = colors.length;

	// Normalize the color components to range [0, 1].
	var normalizedColors = colors.map(function (_ref) {
		var _ref2 = _slicedToArray(_ref, 3),
		    h = _ref2[0],
		    s = _ref2[1],
		    l = _ref2[2];

		return [h / 360, s / 100, l / 100];
	});

	var cartesianAverage = normalizedColors
	// Cylindrical => Cartesian coordinates.
	.map(function (_ref3) {
		var _ref4 = _slicedToArray(_ref3, 3),
		    h = _ref4[0],
		    s = _ref4[1],
		    l = _ref4[2];

		return [s * cos(h * PI2), s * sin(h * PI2), l];
	})
	// Sum the scaled coordinates to find a centerpoint.
	.reduce(function (_ref5, _ref6) {
		var _ref8 = _slicedToArray(_ref5, 3),
		    xA = _ref8[0],
		    yA = _ref8[1],
		    zA = _ref8[2];

		var _ref7 = _slicedToArray(_ref6, 3),
		    x = _ref7[0],
		    y = _ref7[1],
		    z = _ref7[2];

		return [xA + x / N, yA + y / N, zA + z / N];
	}, [0, 0, 0]);

	// Convert the average hue value back to a positive polar angle.
	var H = (atan2(cartesianAverage[Y], cartesianAverage[X]) / PI2 + 1) % 1;

	// Take the arithmetic mean of all saturation values.
	var S = normalizedColors.map(function (_ref9) {
		var _ref10 = _slicedToArray(_ref9, 3),
		    h = _ref10[0],
		    s = _ref10[1],
		    l = _ref10[2];

		return s / N;
	}).reduce(sum);

	// Take the arithmetic mean of all lightness values.
	var L = cartesianAverage[2];

	return [H, S, L];
}
