'use strict';

/**
 * - require "index.js" from a module source folder
 * - follow the require graph and build the dependency tree
 * - bundle all the dependencies in one file
 * - minify the bundle and write it to public path, under the name of "{moduleName}.js"
 */

module.exports = (function() {
	var vinyl, multipipe, browserify, sourceMap, concat, uglify, path, gulpSrcOptions, _initialized;

	function init() {
		if (_initialized) return;

		vinyl = require('vinyl-fs');
		multipipe = require('multipipe');
		browserify = require('gulp-browserify');
		sourceMap = require('gulp-sourcemaps');
		concat = require('gulp-concat');
		uglify = require('gulp-uglify');
		path = require('path');

		gulpSrcOptions = {
			read: false
		};

		_initialized = true;
	}

	function run(context, options, next) {
		if (options === false) return next();

		init();

		var modulePath = context.modulePath,
			moduleName = context.moduleName,
			publicPath = context.public,
			includePaths = context.libraries;

		if (typeof includePaths === 'string') {
			includePaths = [includePaths];
		}

		var browserifyOptions = {
			insertGlobals: false,
			debug: false,
			paths: includePaths,
			detectGlobals: false,
			fullPaths: false,
			builtins: options.builtins || []
		};

		var pipe = multipipe(
			vinyl.src(path.join(modulePath, 'index.js'), gulpSrcOptions),
			browserify(browserifyOptions),
			sourceMap.init(),
			concat(moduleName + '.js'),
			uglify(),
			sourceMap.write('.')
		);


		function done(err) {
			pipe.removeListener('error', done);
			pipe.removeListener('end', done);
			next(err);
		}

		pipe.on('error', done);
		pipe.on('end', done);

		pipe.pipe(vinyl.dest(publicPath));
	}

	return {
		name: 'browserify',
		run: run
	};
})();