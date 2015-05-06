var SliceDice = function(config) {
    var self = this;

    this.config = {
        sample: [],
        normalize: parseFloat,
        slices: 5,
        decimals: 0
    };
    _.assign(this.config, config);

    this.config.sample = _.map(this.config.sample, this.normalize).sort(function (x, y) {return x - y;});
    this.unique = _.unique(this.config.sample);

    this.max = d3.max(this.config.sample);
    this.min = d3.min(this.config.sample);

    var getScale = function(name) {
        var config = self.config,
            ranges = _.map(_.range(config.slices), function(v, i) {
                return {
                    index: i,
                    start: NaN,
                    end: NaN,
                    data: []
                };
            });

        switch (name) {
            case 'quantile': {
                self.scale = d3.scale.quantile().range(_.range(config.slices)).domain(config.sample);
                _.each(ranges, function(range, i) {
                    range.data = _.filter(config.sample, function(v) { return self.scale(v) == i; });
                    range.start = _.min(range.data);
                    if (i > 0) {
                        ranges[i - 1].end = range.start;
                    }
                    range.end = _.max(range.data);
                });
                return ranges;
            }
            case 'linear': {
                _.each(ranges, function(range, i) {
                    if (i == 0) {
                        range.start = self.min.toFixed(config.decimals);
                    } else {
                        range.start = ranges[i - 1].end;
                    }
                    if (i == (ranges.length - 1)) {
                        range.end = self.max.toFixed(config.decimals);
                    } else {
                        range.end = ((self.max / config.slices) * (i + 1)).toFixed(config.decimals);
                    }
                    range.data = _.filter(config.sample, function(v) {
                        if (range.end == self.max && v == range.end) return v;
                        return v >= range.start && v < range.end;
                    });
                });
                self.scale = function(v) {
                    return _.findIndex(ranges, function (range) {
                        if (range.end == self.max && v == range.end) return true;
                        if (v >= range.start && v < range.end) return true;
                    });
                };
                return ranges;
            }
            case 'custom': {
                if (config.ranges === undefined) throw 'For custom scales you must provide a "ranges" parameter.';
                ranges = _.map(config.ranges, function(range, i) {
                    return {
                        index: i,
                        start: range.start,
                        end: range.end,
                        data: _.filter(config.sample, function(v) {
                                   if (range.end == self.max && v == range.end) return v;
                                   return v >= range.start && v < range.end;
                             })
                    }
                });
                self.scale = function(v) {
                    return _.findIndex(ranges, function (range) {
                        if (range.end == self.max && v == range.end) return true;
                        if (v >= range.start && v < range.end) return true;
                    });
                };
                return ranges;
            }
            case 'log': {
                throw "Log scales are unimplemented";
            }
        }

        throw "Unknown scale";
    };

    this.ranges = getScale(this.config.scale);
};


SliceDice.prototype.getRange = function(v) {
    if (v <= this.min) return this.ranges[0];
    if (v >= this.max) return _.last(this.ranges);
    return this.ranges[this.scale(v)];
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
