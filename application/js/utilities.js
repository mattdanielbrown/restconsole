// TODO move to localStorage;
var DATA = {};

var Utilities = {
    processAllForms: function () {
        // cycle through all the individual forms
        $('#editor form').each(function() {
            var form = $(this);

            // initiate grouping
            var name = form.prop('name');

            if (DATA[name] === undefined) {
                DATA[name] = {};
            }

            // create key-value array
            $.each(form.serializeArray(), function(_, input) {
                DATA[name][input.name] = input.value;
            });
        });

        Utilities.constructHTTPRequestText(DATA);
    },

    updateInputData: function(el) {
        var form = el.parents('form').prop('name');
        var name = el.prop('name');

        // only works on enabled elements
        if (el.prop('disabled')) {
            delete DATA[form][name];
        } else {
            DATA[form][name] = el.val();
        }

        Utilities.constructHTTPRequestText(DATA);
    },

    constructHTTPRequestText: function (data) {
        var headers_string = '';

        // construct HAR object
        var HAR = {
            startedDateTime: 0,
            time: 0,
            request: {
                method: data.target.Method,
                url: jQuery.substitute('http://{target.Host}:{target.Port}{target.Path}', data),
                httpVersion: data.target.Protocol,
                headers: [],
                queryString: [],
                cookies: [],
                headersSize: 0,
                bodySize: 0
            }
        };

        // construct headers
        $.each(data.headers, function(name, value) {
            headers_string += name + ': ' + value + '\n';
            HAR.request.headers.push({name: name, value: value});
        });

        // add Authorization header
        if (data.authorization['Authorization']) {
            headers_string += 'Authorization: ' + data.authorization['Authorization'] + '\n';
            HAR.request.headers.push({name: 'Authorization', value: data.authorization['Authorization']});
        }

        // add Proxy-Authorization header
        if (data.authorization['Proxy-Authorization']) {
            headers_string += 'Proxy-Authorization: ' + data.authorization['Proxy-Authorization'] + '\n';
            HAR.request.headers.push({name: 'Proxy-Authorization', value: data.authorization['Proxy-Authorization']});
        }

        // write outputs
        //$('#request-curl code').html(harToCurl(HAR));
        $('#request-har code').html(JSON.stringify(HAR.request));
        $('#request-raw code').html(jQuery.substitute('{target.Method} {target.Path} {target.Protocol}\nHost: {target.Host}\n', data) + headers_string);
    },

    translate: {
        placeholders: function() {
            var message = chrome.i18n.getMessage('placeholder_example_prefix');

            $('[placeholder]').each(function() {
                var element = $(this);
                element.attr('placeholder', message + ' ' + element.prop('placeholder'));
            });
        },

        elements: function() {
            $('[i18n]').each(function() {
                var element = $(this);
                var message = chrome.i18n.getMessage(element.attr('i18n'));

                switch (element.data('i18nTarget')) {
                    case 'value':
                        element.val(message);
                        break;

                    case 'title':
                        element.attr('title', message);
                        break;

                    case 'placeholder':
                        element.attr('placeholder', message);
                        break;

                    default:
                        element.html(message);
                }
            });
        }
    }
};

// jQuery plugins
jQuery.substitute = function (template, data) {
    return template.replace(/\{([\w\.]*)\}/g, function (str, key) {
        var keys = key.split('.'), v = data[keys.shift()];

        for (var i = 0, l = keys.length; i < l; i++) {
            v = v[keys[i]];
        }

        return (typeof v !== 'undefined' && v !== null) ? v : '';
    });
};
