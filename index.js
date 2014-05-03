var Q = require('q');

module.exports = function(srcPath) {
    if (!srcPath) {
        throw new Error('Please define src path');
    }

    var that = this;

    var dependencies = {};
    var dependenciesInOrder = [];

    that.load = function(path, instanceName) {
        if (!instanceName) {
            instanceName = path.split('/').pop();
            instanceName = instanceName.charAt(0).toLowerCase() + instanceName.slice(1);
        }

        var constructor = require(srcPath + '/' + path);

        var constructorString = constructor.toString();
        var matches = constructorString.match(/function *\(([^\)]*)\)/);
        var parameters = matches[1].split(/, */);

        var parametersNotFound = [];
        parameters.forEach(function(parameter) {
            return !dependencies[parameter];
        });

        if (parametersNotFound.length) {
            throw new Error('Dependency for ' + path + ' not found: ' + parametersNotFound.join(', '));
        } else {
            var args = parameters.map(function(parameter) {
                return dependencies[parameter];
            });
            var instance = applyNew(constructor)(args);

            if (!instance) {
                throw new Error('Could not initialise ' + path);
            }

            that.add(instanceName, instance);

            return instance;
        }
    }

    function applyNew(constructor) {
        function F(args) {
            return constructor.apply(this, args);
        }
        F.prototype = constructor.prototype;

        return function(args) {
            return new F(args);
        }
    }

    that.add = function(name, instance) {
        if (!name) {
            throw new Error('Invalid name ' + name);
        }
        dependencies[name] = instance;
        dependenciesInOrder.push(instance);
    }

    // Starts all starters in serial and returns a promise
    that.runAll = function(name) {
        var promise = Q.resolve();
        dependenciesInOrder.forEach(function(instance) {
            if (typeof instance[name] == "function") {
                promise = promise.then(function() {
                    return instance[name]();
                });
            }
        });
        return promise;
    }

    that.get = function(name) {
        return dependencies[name];
    }
};