/*!
 * Module dependencies.
 */

var soundwave = require('../lib'),
    middleware = require('../lib/middleware'),
    http = require('http'),
    events = require('events'),
    serverSpy,
    options;

/*!
 * Specification: soundwave
 */

describe('soundwave', function() {
    it('should be the middleware generator function', function() {
        expect(soundwave).toEqual(middleware);
    });
});

/*!
 * Specification: soundwave.serve(options, [callback])
 */

describe('soundwave.serve(options, [callback])', function() {
    beforeEach(function() {
        options = {};
        spyOn(http, 'createServer').andCallFake(function() {
            serverSpy = new events.EventEmitter();
            serverSpy.listen = jasmine.createSpy('listen');
            return serverSpy;
        });
    });

    it('should require options', function() {
        expect(function() {
            options = undefined;
            soundwave.serve(options, function(e) {});
        }).toThrow();
    });

    it('should not require options.port', function() {
        expect(function() {
            options.port = undefined;
            soundwave.serve(options, function(e) {});
        }).not.toThrow();
    });

    it('should not require callback', function() {
        expect(function() {
            soundwave.serve(options);
        }).not.toThrow();
    });

    it('should try to create the server', function() {
        soundwave.serve(options);
        expect(serverSpy.listen).toHaveBeenCalled();
    });

    describe('when successfully created server', function() {
        it('should listen on the default port (3000)', function() {
            soundwave.serve(options);
            expect(serverSpy.listen).toHaveBeenCalledWith(3000);
        });

        it('should listen on the specified port', function() {
            options.port = 1337;
            soundwave.serve(options);
            expect(serverSpy.listen).toHaveBeenCalledWith(1337);
        });

        it('should trigger callback with data object', function(done) {
            soundwave.serve(options, function(e, data) {
                expect(data).toEqual({
                    server: serverSpy,
                    address: '127.0.0.1',
                    port: 3000
                });
                done();
            });
            serverSpy.emit('listening');
        });

        describe('on request', function() {
            it('should emit a "log" event', function(done) {
                soundwave.on('log', function(statusCode, url) {
                    expect(statusCode).toEqual(200);
                    expect(url).toEqual('/a/file');
                    done();
                });
                soundwave.serve(options);
                serverSpy.emit('request', { url: '/a/file' }, { statusCode: 200 });
            });
        });
    });

    describe('when failed to create server', function() {
        it('should trigger callback with an error', function(done) {
            soundwave.serve(options, function(e) {
                expect(e).toEqual(jasmine.any(Error));
                done();
            });
            serverSpy.emit('error', new Error('port in use'));
        });

        it('should fire "error" event', function(done) {
            soundwave.on('error', function(e) {
                expect(e).toEqual(jasmine.any(Error));
                done();
            });
            soundwave.serve(options);
            serverSpy.emit('error', new Error('port in use'));
        });
    });
});
