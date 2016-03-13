var template = require('../templates/osm-feature-details.hbs'),
    Handlebars = require('hbsfy/runtime'),
    tagI18n = require('./tag-i18n'),
    initialUpperCase = function(s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    },
    i18n = function(f) {
        var result;
        for (var k in tagI18n) {
            if (f[k]) {
                result = tagI18n[k][0][f[k]] || tagI18n[k][1];
                if (result) {
                    return typeof result === 'string' || result instanceof String ? result : result(f);
                } else {
                    return f[k];
                }
            }
        }
    },
    moment,
    openingHours;

$.getScript = function(src, func) {
    var script = document.createElement('script');
    script.async = 'async';
    script.src = src;
    if (func) {
        script.onload = func;
    }
    document.getElementsByTagName('head')[0].appendChild( script );
};

Handlebars.registerHelper('osmFeatureDescription', function(f) {
    var result = i18n(f) || '';

    return initialUpperCase(result.replace('_', ' '));
});

Handlebars.registerHelper('osmOpeningHours', function(f) {
    if (!f.opening_hours) return '';

    var oh = new openingHours(f.opening_hours),
        from = new Date(),
        to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000),
        intervals = oh.getOpenIntervals(from, to),
        rows = [],
        i;

    for (i in intervals) {
        var start = moment(intervals[i][0]),
            end = moment(intervals[i][1]);
        rows.push('<li><em>' + start.calendar(null, {
            sameDay: '[idag]',
            nextDay: '[imorgon]',
            nextWeek: 'dddd',
            sameElse: 'DD/MM/YYYY'
        }) + '</em>:&nbsp;' + (intervals[i][3] ? '("' + intervals[i][3] + '") ' : '') +
            start.format('HH:mm') + '&nbsp;-&nbsp;' + end.format('HH:mm'));
    }

    return new Handlebars.SafeString('<h5>Öppettider:</h5><ul>' + rows.join('\n') + '</ul>');
});

module.exports = function(osmFeature, cb) {
    if (!openingHours || !moment) {
        $.getScript('module-osm-feature-details.js', function() {
            openingHours = require('opening_hours');
            moment = require('moment');

            require('moment/locale/sv');
            moment.locale('sv');

            cb($(template(osmFeature)));
        });
    } else {
        cb($(template(osmFeature)));
    }
};
