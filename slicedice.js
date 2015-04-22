var SliceDice = function(config) {
    var self = this;

    this.config = {
        sample: [],
        normalize: parseFloat,
        slices: 5
    };
    _.assign(this.config, config);

    this.config.sample = _.map(this.config.sample, this.normalize).sort(function (x, y) {return x - y;});
    this.unique = _.unique(this.config.sample);

    this.max = d3.max(this.config.sample);
    this.min = d3.min(this.config.sample);

    var getScale = function(name) {
        var config = self.config;

        switch (name) {
            case 'quantile': {
                return d3.scale.quantile().range(_.range(config.slices)).domain(config.sample);
            }
            case 'linear': {
                return function(v) {
                    if (v < self.min) return 0;
                    if (v >= self.max) return self.config.slices - 1;
                    var slice_size = Math.round((self.max - self.min) / config.slices);
                    return Math.floor(v / slice_size);
                }
            }
            case 'custom': {
                return function(v) {
                    if (v < self.min) return 0;
                    if (v >= self.max) return self.config.slices - 1;
                    if (self.config.ranges === undefined) throw 'For custom scales you must provide a "ranges" parameter.';
                    for (var i = 0; i < config.slices; i++) {
                        if (v >= self.config.ranges[i].start && v < self.config.ranges[i].end) return i;
                    }
                }
            }
            case 'log': {
                return d3.scale.log().range(_.range(config.slices)).domain(config.sample);
            }
        }

        throw "Unknown scale";
    };

    if (this.unique.length <= this.config.slices) {
        this.config.slices = this.unique.length;
        this.ranges = _.map(this.unique, function(v, i) {
            return {index: i, start: v, end: v};
        });
    } else {
        var scale;
        if (this.config.scale === undefined) {
            scale = getScale('quantile');
        } else if (typeof this.config.scale == 'string') {
            scale = getScale(scale);
        } else if (typeof this.config.scale == 'function') {
            scale = this.config.scale;
        } else {
            throw "invalid scale";
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


SliceDice.prototype.getColors = function(type) {
    switch (type) {
        case 'degrade': {
            var range = _.range(this.config.slices);
            var start = arguments[1] || '#009900';
            var end = arguments[2] || '#003300';
            return _.map(range, d3.scale.linear().range([start, end]).domain([0, range.length - 1]));
        }
        default: {   // 'palette'
            return _.map(_.range(this.config.slices), d3.scale[arguments[1] || 'category20']())
        }
    }
};
