var _ = require('underscore'),
    REQUIRED = '!',
    ProteanConfigurable;
/**
 * A mix-in module that adds a `_configure` function and a `properties` object
 * used for defining optional and required properties to be merged over to an
 * instance.
 *
 * The constructor that is going to have ProteanConfigurable mixed into it should
 * define a `properties` property (array of strings) on its prototype. At
 * instantiation time, it then calls the `_configure(spec)` method to pull
 * properties out of the `spec` object and apply them to the instance.
 *
 * @mixin ProteanConfigurable
 * @see ProteanConfigurable~Properties
 */
/**
 * The `properties` property of a ProteanConfigurable instance.
 *
 * The original `properties` property will be transformed from a single array,
 * to an array of plain strings, with two non-enumerable properties: `required`
 * and `optional`.
 *
 * Denote required properties with a leading '!' (this will be removed at Class
 * creation time).
 *
 * @example properties: ['!type', 'category']
 * becomes:
 *      properties: ['type', 'category']
 *      properties.required: ['type']
 *      properties.optional: ['category']
 * @typedef ProteanConfigurable~Properties
 * @type {Array<String>}
 * @property {Array<String>} required
 * @property {Array<String>} optional
 */
ProteanConfigurable = _.extend(exports,
    /** @lends ProteanConfigurable */{
    /**
     * @param {Function} constructor The constructor to mix-into
     * @returns {Function} The constructor function
     */
    augment: function (constructor) {
        var extended = this.extended.bind(constructor),
            proto = constructor.prototype;
        
        proto._configure = this._configure;

        constructor.extended = _.isFunction(constructor.extended) ?
            _.wrap(constructor.extended.bind(constructor), extended) :
            _.wrap(_.noop, extended);

        proto.properties =
            ProteanConfigurable.properties(proto.properties || []);

        return constructor;
    },
    /**
     * @param {Function} fn the classes original extended function, if any
     * @param {Function} subclass the constructor function that is the subject
     * of the extend operation
     */
    extended: function (fn, subclass) {
        var superproto = this.prototype,
            subproto = subclass.prototype,
            superprops,
            subprops;

        (fn !== _.noop) && fn(subclass);

        superprops = superproto.properties ? superproto.properties : [];
        subprops = subproto.properties ? subproto.properties : [];

        subproto.properties =
            ProteanConfigurable.
            properties(superprops.concat(subprops));

        subclass.extended = this.extended;
    },
    /**
     * @param {Array<String>} list list of property names
     * @returns {ProteanConfigurable~Properties}
     */
    properties: function (list) {
        var partition = _.partition(list, function (name) {
                return name.indexOf(REQUIRED) === 0;
            }),
            required = partition[0].map(function (name) {
                return name.slice(1);
            }),
            optional = partition[1],
            properties = required.concat(optional);

        Object.defineProperties(properties, {
            required: { value: required },
            optional: { value: optional }
        });

        return properties;
    },
    /**
     * @param {Object} spec
     */
    _configure: function (spec) {
        var self = this;

        spec = spec || {};

        _.without.apply(_, [this.properties.required].concat(_.keys(spec))).
        forEach(function (key) {
            var value = self[key],
                msg;

            if (value === undefined || value === null) {
                msg = (self.constructor.name || 'Resource') +
                    ' requires property \'' + key +
                    '\' to be defined!';
                throw new Error(msg);
            }
        });

        _.extend(this, _.pick(spec, this.properties));

        this._configure = _.noop;
    }
});
