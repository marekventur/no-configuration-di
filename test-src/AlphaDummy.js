Q = require('q');

// A simple test class with no dependencies and a start function
module.exports = function() {
    var that = this;
    this.started = false;
    this.canBeStarted = true;

    this.start = function() {
        if (that.canBeStarted) {
            that.started = true;
        } else {
            throw new Error("Alpha can't be started");
        }
    }

    this.isAlpha = function() {
        return true;
    }
}