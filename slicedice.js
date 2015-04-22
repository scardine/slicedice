var SliceDice = function(config) {
    var self = this;

    this.config = {
        sample: [],
        normalize: parseFloat,
        slices: 5
    };
    for (var attr in config) { this.config[attr] = config[attr];}

    this.config.sample = _.map(this.config.sample, this.normalize).sort(function (x, y) {return x - y;});
    this.unique = _.unique(this.config.sample);

    this.max = d3.max(this.config.sample);
    this.min = d3.min(this.config.sample);

    if (this.unique.length <= this.config.slices) {
        this.config.slices = this.unique.length;
        this.ranges = _.map(this.unique, function(v, i) {
            return {index: i, start: v, end: v};
        });
    } else {
        var scale = this.config.scale;
        if (scale === undefined) {
            scale = d3.scale.quantile().range(_.range(this.config.slices)).domain(this.config.sample);
        }
        this.ranges = _.map(_.range(this.config.slices), function(v, i) {
            return {index: i, start: self.min, end: self.min};
        });

        _.each(this.config.sample, function(v, i) {
            var range = scale(v);
            self.ranges[range].end = v;
            if (range > 0) {
                self.ranges[range].start = self.ranges[range - 1].end;
            }
        });
    }
};

SliceDice.prototype.getRange = function(v) {
    for(var i=0; i < this.ranges.length; i++) {
        if(v >= this.ranges[i].start && v < this.ranges[i].end) return this.ranges[i];
    }
    if (v < this.min) return this.ranges[0];
    return this.ranges[this.ranges.length-1];
};
