A simple, configuration-free dependency injection framework
===========================================================

Given a bunch of classes of the form
```Javascript
Namer.js:

module.exports = function() {
    this.getName = function() {
       return 'World';
    }
}
```

```Javascript
Greeter.js:

module.exports = function(namer) {
    this.great = function() {
        console.log('Hello %s', namer.getName());
    }
}
```

This module allows you to start them all simply by
```Javascript
var Di = require('no-configuration-di');
var di = new Di(__dirname + '/src');

di.load('Namer');
var greeter = di.load('Greeter');
greeter.greet();
```

To make this work the following rules have to be followed:
* The filename is the class name and should be CamelCased. Instances will be lowerCameCased. ```FooBar.js``` will instanciate as an instance with the name ```fooBar```
* Files can be nested in folders, but only the actual filename counts as class name. ```db/UserDao.js``` needs to be instanciated as ```di.load('db/UserDao')``` but will be injected in all classes asking for ```userDao```
* The only place to define your dependencies for a certain class is in the parameter list of the constructor function
* ```load()``` has to be called in the right order.
* This libary doesn't supports lazy loading

API
====

load(path, [instanceName])
----------------------
Loads a class, resolves dependencies and initialises it. If no ```instanceName``` is given it will be implied from the filename (```db/Query``` would become an instance of ```query```)
```Javascript
di.load('db/Query', 'userQuery');
```

add(instance, instanceName)
---------------------------------
Adds an instance of an object
```Javascript
di.add('config', {port: 1234});
```


get(instanceName)
-----------------------
Retrieves an instance of a given name. Returns ```undefined``` if nothing for that name is found.
```Javascript
app.listen(di.get('config').port);
```

runAll(functionName)
--------------------------
Checks all instances for the existence of a function called ```functionName``` and runs them in the order they have been imported in. Asynchronous functions are supported via https://www.npmjs.org/package/q . Should any of them throw an error no other function will be called.
```Javascript
di.load('DatabaseManager');
di.add('HttpServer', {
  start: function() {
    var deferred = Q.defer();
    server.listen(8080, deferred.makeNodeResolver());
    return deferred.promise;
  }
});
di.runAll('start')
.done(function() {
  console.log('Database and Server have been successfully started');
});
```

loadDecorator(path, [decoratorName])
--------------------------
See chapter about "Decorators". ```path``` has to be a path to a function, decorators won't be "newed", but just called. Decorator can have multiple dependencies, but the first parameter has to be the subject which is going to be decorated. No return value is expected, the subject should be decorated in place.

if no ```decoratorName``` is defined it will be implied from the filename: ```loadDecorator('decorators/UserDbAccess.js')``` will add an instance of ```userDbAccessDecorator``` that can be now be injected in other classes.

If multiple decorators share the same ```decoratorName``` those decorators will be chained.

Decorators
====

Decorators are useful for turning simple objects into objects with methods. Here's an example that uses multiple decorators chained together:

```Javascript
Advertiser.js:

module.exports = function(userDecorator) {

    this.advertiseToUser = function(userId) {
        database.getUserById(userId)
        .then(function(user) {
            userDecorator.decorate(user);
            user.sendEmail('Please come back to our site, your friend ' + user.getRandomFriend() + " is missing you.");
        });
    };
}
```

```Javascript
decorators/UserEmail.js:

module.exports = function(user, emailer) {
    user.sendEmail = function(text) {
        emailer.send(user.email, text);
    }
}
```

```Javascript
decorators/UserFriends.js:

module.exports = function(user) {
    user.getRandomFriend = function() {
        return 'Fred'
    }
}
```


```Javascript
app.js

di.load('Database');
di.load('Emailer');
di.loadDecorator('decorators/UserEmail', 'userDecorator');
di.loadDecorator('decorators/UserFriends', 'userDecorator');
di.load('Advertiser');

di.get('advertiser').advertiseToUser(14);

```