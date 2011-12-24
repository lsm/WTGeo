/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Latitude/longitude spherical geodesy formulae & scripts (c) Chris Veness 2002-2010            */
/*   - www.movable-type.co.uk/scripts/latlong.html                                                */
/*                                                                                                */
/*  Sample usage:                                                                                 */
/*    var p1 = new LngLat(51.5136, -0.0983);                                                      */
/*    var p2 = new LngLat(51.4778, -0.0015);                                                      */
/*    var dist = p1.distanceTo(p2);          // in km                                             */
/*    var brng = p1.bearingTo(p2);           // in degrees clockwise from north                   */
/*    ... etc                                                                                     */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Note that minimal error checking is performed in this example code!                           */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/**
 * Creates a point on the earth's surface at the supplied latitude / longitude
 *
 * @constructor
 * @param {Number} lon: longitude in numeric degrees
 * @param {Number} lat: latitude in numeric degrees
 * @param {Number} [rad=6371]: radius of earth if different value is required from standard 6,371km
 */
function LngLat(lon, lat, rad) {
  if (typeof(rad) == 'undefined') rad = 6371;  // earth's mean radius in km
  // only accept numbers or valid numeric strings
  this._lat = typeof(lat)=='number' ? lat : typeof(lat)=='string' && lat.trim()!='' ? +lat : NaN;
  this._lon = typeof(lat)=='number' ? lon : typeof(lon)=='string' && lon.trim()!='' ? +lon : NaN;
  this._radius = typeof(rad)=='number' ? rad : typeof(rad)=='string' && trim(lon)!='' ? +rad : NaN;
}


/**
 * Returns the distance from this point to the supplied point, in km
 * (using Haversine formula)
 *
 * from: Haversine formula - R. W. Sinnott, "Virtues of the Haversine",
 *       Sky and Telescope, vol 68, no 2, 1984
 *
 * @param   {LngLat} point: Latitude/longitude of destination point
 * @param   {Number} [precision=4]: no of significant digits to use for returned value
 * @returns {Number} Distance in km between this point and destination point
 */
LngLat.prototype.distanceTo = function(point, precision) {
  // default 4 sig figs reflects typical 0.3% accuracy of spherical model
  if (typeof precision == 'undefined') precision = 4;

  var R = this._radius;
  var lat1 = this._lat.toRad(), lon1 = this._lon.toRad();
  var lat2 = point._lat.toRad(), lon2 = point._lon.toRad();
  var dLat = lat2 - lat1;
  var dLon = lon2 - lon1;

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d.toPrecisionFixed(precision);
}


/**
 * Returns the (initial) bearing from this point to the supplied point, in degrees
 *   see http://williams.best.vwh.net/avform.htm#Crs
 *
 * @param   {LngLat} point: Latitude/longitude of destination point
 * @returns {Number} Initial bearing in degrees from North
 */
LngLat.prototype.bearingTo = function(point) {
  var lat1 = this._lat.toRad(), lat2 = point._lat.toRad();
  var dLon = (point._lon-this._lon).toRad();

  var y = Math.sin(dLon) * Math.cos(lat2);
  var x = Math.cos(lat1)*Math.sin(lat2) -
          Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
  var brng = Math.atan2(y, x);

  return (brng.toDeg()+360) % 360;
}


/**
 * Returns final bearing arriving at supplied destination point from this point; the final bearing
 * will differ from the initial bearing by varying degrees according to distance and latitude
 *
 * @param   {LngLat} point: Latitude/longitude of destination point
 * @returns {Number} Final bearing in degrees from North
 */
LngLat.prototype.finalBearingTo = function(point) {
  // get initial bearing from supplied point back to this point...
  var lat1 = point._lat.toRad(), lat2 = this._lat.toRad();
  var dLon = (this._lon-point._lon).toRad();

  var y = Math.sin(dLon) * Math.cos(lat2);
  var x = Math.cos(lat1)*Math.sin(lat2) -
          Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
  var brng = Math.atan2(y, x);

  // ... & reverse it by adding 180°
  return (brng.toDeg()+180) % 360;
}


/**
 * Returns the midpoint between this point and the supplied point.
 *   see http://mathforum.org/library/drmath/view/51822.html for derivation
 *
 * @param   {LngLat} point: Latitude/longitude of destination point
 * @returns {LngLat} Midpoint between this point and the supplied point
 */
LngLat.prototype.midpointTo = function(point) {
  var lat1 = this._lat.toRad(), lon1 = this._lon.toRad(),
  lat2 = point._lat.toRad();
  var dLon = (point._lon-this._lon).toRad();

  var Bx = Math.cos(lat2) * Math.cos(dLon);
  var By = Math.cos(lat2) * Math.sin(dLon);

  var lat3 = Math.atan2(Math.sin(lat1)+Math.sin(lat2),
                    Math.sqrt( (Math.cos(lat1)+Bx)*(Math.cos(lat1)+Bx) + By*By) );
  var lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);

  return new LngLat(lon3.toDeg(), lat3.toDeg());
}


/**
 * Returns the destination point from this point having travelled the given distance (in km) on the
 * given initial bearing (bearing may vary before destination is reached)
 *
 *   see http://williams.best.vwh.net/avform.htm#LL
 *
 * @param   {Number} brng: Initial bearing in degrees
 * @param   {Number} dist: Distance in km
 * @returns {LngLat} Destination point
 */
LngLat.prototype.destinationPoint = function(brng, dist) {
  dist = typeof(dist)=='number' ? dist : typeof(dist)=='string' && dist.trim()!='' ? +dist : NaN;
  dist = dist/this._radius;  // convert dist to angular distance in radians
  brng = brng.toRad();  //
  var lat1 = this._lat.toRad(), lon1 = this._lon.toRad();

  var lat2 = Math.asin( Math.sin(lat1)*Math.cos(dist) +
                        Math.cos(lat1)*Math.sin(dist)*Math.cos(brng) );
  var lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(dist)*Math.cos(lat1),
                               Math.cos(dist)-Math.sin(lat1)*Math.sin(lat2));
  lon2 = (lon2+3*Math.PI)%(2*Math.PI) - Math.PI;  // normalise to -180...+180

  return new LngLat(lon2.toDeg(), lat2.toDeg());
}


/**
 * Returns the point of intersection of two paths defined by point and bearing
 *
 *   see http://williams.best.vwh.net/avform.htm#Intersection
 *
 * @param   {LngLat} p1: First point
 * @param   {Number} brng1: Initial bearing from first point
 * @param   {LngLat} p2: Second point
 * @param   {Number} brng2: Initial bearing from second point
 * @returns {LngLat} Destination point (null if no unique intersection defined)
 */
LngLat.intersection = function(p1, brng1, p2, brng2) {
  brng1 = typeof brng1 == 'number' ? brng1 : typeof brng1 == 'string' && trim(brng1)!='' ? +brng1 : NaN;
  brng2 = typeof brng2 == 'number' ? brng2 : typeof brng2 == 'string' && trim(brng2)!='' ? +brng2 : NaN;
  var lat1 = p1._lat.toRad(), lon1 = p1._lon.toRad(),
  lat2 = p2._lat.toRad(), lon2 = p2._lon.toRad(),
  brng13 = brng1.toRad(), brng23 = brng2.toRad(),
  dLat = lat2-lat1, dLon = lon2-lon1, brng12, brng21;

  var dist12 = 2*Math.asin( Math.sqrt( Math.sin(dLat/2)*Math.sin(dLat/2) +
    Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)*Math.sin(dLon/2) ) );
  if (dist12 == 0) return null;

  // initial/final bearings between points
  var brngA = Math.acos( ( Math.sin(lat2) - Math.sin(lat1)*Math.cos(dist12) ) /
    ( Math.sin(dist12)*Math.cos(lat1) ) );
  if (isNaN(brngA)) brngA = 0;  // protect against rounding
  var brngB = Math.acos( ( Math.sin(lat1) - Math.sin(lat2)*Math.cos(dist12) ) /
    ( Math.sin(dist12)*Math.cos(lat2) ) );

  if (Math.sin(lon2-lon1) > 0) {
    brng12 = brngA;
    brng21 = 2*Math.PI - brngB;
  } else {
    brng12 = 2*Math.PI - brngA;
    brng21 = brngB;
  }

  var alpha1 = (brng13 - brng12 + Math.PI) % (2*Math.PI) - Math.PI,  // angle 2-1-3
  alpha2 = (brng21 - brng23 + Math.PI) % (2*Math.PI) - Math.PI;  // angle 1-2-3

  if (Math.sin(alpha1)==0 && Math.sin(alpha2)==0) return null;  // infinite intersections
  if (Math.sin(alpha1)*Math.sin(alpha2) < 0) return null;       // ambiguous intersection

  //alpha1 = Math.abs(alpha1);
  //alpha2 = Math.abs(alpha2);
  // ... Ed Williams takes abs of alpha1/alpha2, but seems to break calculation?

  var alpha3 = Math.acos( -Math.cos(alpha1)*Math.cos(alpha2) +
                       Math.sin(alpha1)*Math.sin(alpha2)*Math.cos(dist12) ),
  dist13 = Math.atan2( Math.sin(dist12)*Math.sin(alpha1)*Math.sin(alpha2),
                       Math.cos(alpha2)+Math.cos(alpha1)*Math.cos(alpha3) ),
  lat3 = Math.asin( Math.sin(lat1)*Math.cos(dist13) +
                    Math.cos(lat1)*Math.sin(dist13)*Math.cos(brng13) ),
  dLon13 = Math.atan2( Math.sin(brng13)*Math.sin(dist13)*Math.cos(lat1),
                       Math.cos(dist13)-Math.sin(lat1)*Math.sin(lat3) ),
  lon3 = lon1+dLon13;
  lon3 = (lon3+Math.PI) % (2*Math.PI) - Math.PI;  // normalise to -180..180º

  return new LngLat(lon3.toDeg(), lat3.toDeg());
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * Returns the distance from this point to the supplied point, in km, travelling along a rhumb line
 *
 *   see http://williams.best.vwh.net/avform.htm#Rhumb
 *
 * @param   {LngLat} point: Latitude/longitude of destination point
 * @returns {Number} Distance in km between this point and destination point
 */
LngLat.prototype.rhumbDistanceTo = function(point) {
  var R = this._radius;
  var lat1 = this._lat.toRad(), lat2 = point._lat.toRad();
  var dLat = (point._lat-this._lat).toRad();
  var dLon = Math.abs(point._lon-this._lon).toRad();

  var dPhi = Math.log(Math.tan(lat2/2+Math.PI/4)/Math.tan(lat1/2+Math.PI/4));
  var q = (!isNaN(dLat/dPhi)) ? dLat/dPhi : Math.cos(lat1);  // E-W line gives dPhi=0
  // if dLon over 180° take shorter rhumb across 180° meridian:
  if (dLon > Math.PI) dLon = 2*Math.PI - dLon;
  var dist = Math.sqrt(dLat*dLat + q*q*dLon*dLon) * R;

  return dist.toPrecisionFixed(4);  // 4 sig figs reflects typical 0.3% accuracy of spherical model
}

/**
 * Returns the bearing from this point to the supplied point along a rhumb line, in degrees
 *
 * @param   {LngLat} point: Latitude/longitude of destination point
 * @returns {Number} Bearing in degrees from North
 */
LngLat.prototype.rhumbBearingTo = function(point) {
  var lat1 = this._lat.toRad(), lat2 = point._lat.toRad();
  var dLon = (point._lon-this._lon).toRad();

  var dPhi = Math.log(Math.tan(lat2/2+Math.PI/4)/Math.tan(lat1/2+Math.PI/4));
  if (Math.abs(dLon) > Math.PI) dLon = dLon>0 ? -(2*Math.PI-dLon) : (2*Math.PI+dLon);
  var brng = Math.atan2(dLon, dPhi);

  return (brng.toDeg()+360) % 360;
}

/**
 * Returns the destination point from this point having travelled the given distance (in km) on the
 * given bearing along a rhumb line
 *
 * @param   {Number} brng: Bearing in degrees from North
 * @param   {Number} dist: Distance in km
 * @returns {LngLat} Destination point
 */
LngLat.prototype.rhumbDestinationPoint = function(brng, dist) {
  var R = this._radius;
  var d = parseFloat(dist)/R;  // d = angular distance covered on earth's surface
  var lat1 = this._lat.toRad(), lon1 = this._lon.toRad();
  brng = brng.toRad();

  var lat2 = lat1 + d*Math.cos(brng);
  var dLat = lat2-lat1;
  var dPhi = Math.log(Math.tan(lat2/2+Math.PI/4)/Math.tan(lat1/2+Math.PI/4));
  var q = (!isNaN(dLat/dPhi)) ? dLat/dPhi : Math.cos(lat1);  // E-W line gives dPhi=0
  var dLon = d*Math.sin(brng)/q;
  // check for some daft bugger going past the pole
  if (Math.abs(lat2) > Math.PI/2) lat2 = lat2>0 ? Math.PI-lat2 : -(Math.PI-lat2);
  var lon2 = (lon1+dLon+3*Math.PI)%(2*Math.PI) - Math.PI;

  return new LngLat(lon2.toDeg(), lat2.toDeg());
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/**
 * Returns the latitude of this point; signed numeric degrees if no format, otherwise format & dp
 * as per Geo.toLat()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {Number|String} Numeric degrees if no format specified, otherwise deg/min/sec
 *
 * @requires Geo
 */
LngLat.prototype.lat = function(format, dp) {
  if (typeof format == 'undefined') return this._lat;

  return Geo.toLat(this._lat, format, dp);
}

/**
 * Returns the longitude of this point; signed numeric degrees if no format, otherwise format & dp
 * as per Geo.toLng()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {Number|String} Numeric degrees if no format specified, otherwise deg/min/sec
 *
 * @requires Geo
 */
LngLat.prototype.lon = function(format, dp) {
  if (typeof format == 'undefined') return this._lon;

  return Geo.toLng(this._lon, format, dp);
}

/**
 * Returns a string representation of this point; format and dp as per lat()/lon()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {String} Comma-separated latitude/longitude
 *
 * @requires Geo
 */
LngLat.prototype.toString = function(format, dp) {
  if (typeof format == 'undefined') format = 'dms';

  if (isNaN(this._lat) || isNaN(this._lon)) return '-,-';

  return Geo.toLng(this._lon, format, dp) + ', ' + Geo.toLat(this._lat, format, dp);
}

/**
 * Returns the latitude and longtitude of this point;
 *
 * @param   {Number} fix The number of digits to appear after the decimal point
 * @returns {String} Numeric degrees
 */
LngLat.prototype.toLngLat = function(fix) {
    return fix ? this._lon.toFixed(fix) + ',' + this._lat.toFixed(fix)
    : this._lon + ',' + this._lat;
}

/**
 * Returns the latitude and longtitude of this point;
 *
 * @param   {Number} fix The number of digits to appear after the decimal point
 * @returns {Array} Numeric degrees in an array with the order [lat, lon]
 */
LngLat.prototype.toArray = function(fix) {
    return fix ? [Number(this._lon.toFixed(fix)), Number(this._lat.toFixed(fix))]
    : [this._lon, this._lat];
}

/**
 * Returns 8 points from certain distance of this point in 8 directions; signed numeric degrees if no format
 *
 * @param   {Number} distance Distance from the current point in km
 * @param   {Boolean} [format]: if true point would be string `lat,lon`, otherwise `LngLat`
 * @returns {Object} Hash contains 8 points
 *
 * @requires Geo
 */
LngLat.prototype.getSquarePoints = function(distance, format) {
    if (format === true) {
        return {
            n: this.destinationPoint(0, distance).toLngLat(),
            ne: this.destinationPoint(45, distance).toLngLat(),
            e: this.destinationPoint(90, distance).toLngLat(),
            es: this.destinationPoint(135, distance).toLngLat(),
            s: this.destinationPoint(180, distance).toLngLat(),
            sw: this.destinationPoint(225, distance).toLngLat(),
            w: this.destinationPoint(270, distance).toLngLat(),
            wn: this.destinationPoint(315, distance).toLngLat()
        }
    } else {
        return {
            n: this.destinationPoint(0, distance),
            ne: this.destinationPoint(45, distance),
            e: this.destinationPoint(90, distance),
            es: this.destinationPoint(135, distance),
            s: this.destinationPoint(180, distance),
            sw: this.destinationPoint(225, distance),
            w: this.destinationPoint(270, distance),
            wn: this.destinationPoint(315, distance)
        }
    }
}

LngLat.prototype.inSquare = function(sw, ne) {
    return (this._lat >= sw._lat) && (this._lat <= ne._lat)
        && (this._lon >= sw._lon) && (this._lon <= ne._lon);
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

// ---- extend Number object with methods for converting degrees/radians

/** Converts numeric degrees to radians */
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}

/** Converts radians to numeric (signed) degrees */
if (typeof(Number.prototype.toDeg) === "undefined") {
  Number.prototype.toDeg = function() {
    return this * 180 / Math.PI;
  }
}

/**
 * Formats the significant digits of a number, using only fixed-point notation (no exponential)
 *
 * @param   {Number} precision: Number of significant digits to appear in the returned string
 * @returns {String} A string representation of number which contains precision significant digits
 */
if (typeof(Number.prototype.toPrecisionFixed) === "undefined") {
  Number.prototype.toPrecisionFixed = function(precision) {
    if (isNaN(this)) return 'NaN';
    var numb = this < 0 ? -this : this;  // can't take log of -ve number...
    var sign = this < 0 ? '-' : '';

    if (numb == 0) {n = '0.';while (precision--) n += '0';return n};  // can't take log of zero

    var scale = Math.ceil(Math.log(numb)*Math.LOG10E);  // no of digits before decimal
    var n = String(Math.round(numb * Math.pow(10, precision-scale)));
    if (scale > 0) {  // add trailing zeros & insert decimal as required
      var l = scale - n.length;
      while (l-- > 0) n = n + '0';
      if (scale < n.length) n = n.slice(0,scale) + '.' + n.slice(scale);
    } else {          // prefix decimal and leading zeros if required
      while (scale++ < 0) n = '0' + n;
      n = '0.' + n;
    }
    return sign + n;
  }
}

/** Trims whitespace from string (q.v. blog.stevenlevithan.com/archives/faster-trim-javascript) */
if (typeof(String.prototype.trim) === "undefined") {
  String.prototype.trim = function() {
    return String(this).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  }
}

// CommonJS
try {
  if (module && module.exports) {
      var Geo = require('./Geo');
      module.exports = LngLat;
  } else {
    if(Geo) {
        // make the structure in browser same with CommonJS
        Geo.LngLat = LngLat;
    }
  }
} catch(e) {}