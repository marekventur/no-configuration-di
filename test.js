var assert = require('chai').assert;
var Di = require('./index');
var AlphaDummy = require('./test-src/AlphaDummy')
var BetaDummy = require('./test-src/nested/BetaDummy')

describe('no-configuration-di', function() {
    var di;

    context('when successfully initialised', function() {
        beforeEach(function() {
            di = new Di(__dirname + '/test-src');
        })

        it('initialises one object', function() {
            var alphaDummy = di.load('AlphaDummy');
            assert.instanceOf(alphaDummy, AlphaDummy);
            assert.ok(alphaDummy.isAlpha());
        });

        it('errors if no object is found', function() {
            try {
                di.load('TetaDummy');
                assert.fail();
            } catch(err) {
                assert.match(err.message, /^Cannot find module.*TetaDummy/);
            }
        });

        it('retrieves objects', function() {
            di.load('AlphaDummy');
            assert.ok(di.get('alphaDummy').isAlpha());
        });

        it('injects dependencies', function() {
            di.load('AlphaDummy');
            di.load('nested/BetaDummy');
            assert.instanceOf(di.get('betaDummy'), BetaDummy);
            assert.ok(di.get('betaDummy').getAlpha().isAlpha());
        });

        it('allows instances to be injected directly', function() {
            di.add('alphaDummy', {dummy: true});
            di.load('nested/BetaDummy');
            assert.ok(di.get('betaDummy').getAlpha().dummy);
        });

        it('allows objects to be named manually', function() {
            di.load('AlphaDummy', 'alpha');
            assert.ok(di.get('alpha').isAlpha());
        });

        it('runs on all classes that have a start function', function(done) {
            di.load('AlphaDummy');
            di.load('nested/BetaDummy');

            di.runAll('start')
            .done(function() {
                assert.ok(di.get('alphaDummy').started);
                assert.ok(di.get('betaDummy').started);
                done();
            });
        });

        it('handles erros in start functions that are not promises', function(done) {
            di.load('AlphaDummy');
            di.load('nested/BetaDummy');

            di.get('alphaDummy').canBeStarted = false;

            di.runAll('start')
            .fail(function(err) {
                assert.equal(err.message, "Alpha can't be started");
                done();
            });
        });

        it('handles erros in start functions that are promises', function(done) {
            di.load('AlphaDummy');
            di.load('nested/BetaDummy');

            di.get('betaDummy').canBeStarted = false;

            return di.runAll('start')
            .fail(function(err) {
                assert.equal(err.message, "Beta can't be started");
                done();
            });
        });

        it('runAll works when no object has that function', function(done) {
            di.load('AlphaDummy');
            di.load('nested/BetaDummy');

            di.get('betaDummy').canBeStarted = false;

            di.runAll('foo')
            .done(function() {
                done();
            });

        });
    })


    it('erros when initialised without parameter', function() {
        try {
            new Di();
        } catch(err) {
            assert.match(err.message, /^Please define src path/);
        }
    });

});
