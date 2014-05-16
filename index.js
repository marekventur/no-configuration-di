var Q = require('q');

module.exports = function(srcPaths) {
    if (typeof srcPaths === 'string') {
        srcPaths = [srcPaths];
    } else if (!srcPaths instanceof Array) {
        throw new Error('Please define at least one src path');
    }

    var that = this;

    var instances = {};
    var instancesInOrder = [];

    that.require = function(path) {
        var result = null;
        var i = 0;
        var len = srcPaths.length;

        while (!result && i < len) {
            var srcPath = srcPaths[i];
            try {
                result = require(srcPath + '/' + path);
            } catch(e) {
                if (e.code !== 'MODULE_NOT_FOUND') {
                    throw e;
                }
            }
            i++;
        }
        if (result) {
            return result;
        }
        throw new Error("Cannot find dependency " + path)
    }

    that.load = function(path, instanceName) {
        if (!instanceName) {
            instanceName = path.split('/').pop();
            instanceName = instanceName.charAt(0).toLowerCase() + instanceName.slice(1);
        }

        var constructor = that.require(path);

        var parameterNames = getParameterNames(constructor, path);
        var dependencies = getDependenciesByParameterNames(parameterNames, path, instances);
        var instance = applyNew(constructor)(dependencies);

        if (!instance) {
            throw new Error('Could not initialise ' + path);
        }

        that.add(instanceName, instance);
        return instance;
    }

    this.loadDecorator = function(path, decoratorName) {
        if (!decoratorName) {
            decoratorName = path.split('/').pop();
            decoratorName = decoratorName.charAt(0).toLowerCase() + decoratorName.slice(1) + 'Decorator';
        }

        var decoratorFunction = that.require(path);

        var parameterNames = getParameterNames(decoratorFunction, path);
        parameterNames.shift();
        var dependencies = getDependenciesByParameterNames(parameterNames, path, instances);
        dependencies.unshift(null);

        // Allow multiple Decorators to be chained
        var superDecorator = that.get(decoratorName);
        var decorator = {
            decorate: function(subject) {
                if (superDecorator && typeof superDecorator.decorate == 'function') {
                    superDecorator.decorate(subject);
                }

                dependencies[0] = subject;
                decoratorFunction.apply(that, dependencies);
                return subject;
            }
        }

        that.add(decoratorName, decorator);
    }


    that.add = function(name, instance) {
        if (!name) {
            throw new Error('Invalid name ' + name);
        }
        instances[name] = instance;
        instancesInOrder.push(instance);
    }

    // Starts all starters in serial and returns a promise
    that.runAll = function(name) {
        var promise = Q.resolve();
        instancesInOrder.forEach(function(instance) {
            if (typeof instance[name] == "function") {
                promise = promise.then(function() {
                    return instance[name]();
                });
            }
        });
        return promise;
    }

    that.get = function(name) {
        return instances[name];
    }

    /********************
     * Private interface
     ********************/

    function getParameterNames(func, path) {
        var functionAsString = func.toString();
        var matches = functionAsString.match(/function *\(([^\)]*)\)/);
        if (matches.length === 0) {
            throw new Error('Could not understand "' + path);
        }
        var parameterNamesWithSpaces = matches[1].split(/, */);
        var parameterNames = [];
        parameterNamesWithSpaces.forEach(function(parameterName) {
            if (parameterName) {
                parameterNames.push(parameterName);
            }
        })
        return parameterNames;
    }

    function getDependenciesByParameterNames(parameterNames, path, instances) {
        var parameters = [];
        var parametersNotFound = [];

        parameterNames.forEach(function(parameterName) {
            var parameter = instances[parameterName];
            if (!parameter) {
                parametersNotFound.push(parameterName)
            } else {
                parameters.push(parameter);
            }

        });

        if (parametersNotFound.length) {
            throw new Error('Dependency for ' + path + ' not found: ' + parametersNotFound.join(', '));
        }

        return parameters;
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
};