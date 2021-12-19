
'use strict';

const Ring = function (arr) {
    let i = -1;

    // TODO: Return a Proxy that preserves the Array prototype.
    return {
        next: function() {
            if (arr.length === 0)
                return null;

            if (i < arr.length-1)
                i++;
            else
                i = 0;

            return arr[i];
        },
        forEach: function(callback) {
            return arr.forEach(callback);
        },
        some: function(test) {
            return arr.some(test);
        },
        every: function(test) {
            return arr.some(test);
        },
        reduce: function(callback, initVal) {
            return arr.reduce(callback, initVal);
        },
        get length() {
            return arr.length;
        },
        at: function (i) {
            return arr[i];
        }
    }
};

module.exports = Ring;