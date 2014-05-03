Q = require('q');

var BetaDummy = function(alphaDummy) {
    var that = this;
    this.started = false;
    this.canBeStarted = true;

    // async start function
    this.start = function() {
        return Q.delay(100)
        .then(function() {
            if (that.canBeStarted) {
                that.started = true;
            } else {
                throw new Error("Beta can't be started");
            }
        });
    }

    this.getAlpha = function() {
        return alphaDummy;
    }
}

module.exports = BetaDummy;