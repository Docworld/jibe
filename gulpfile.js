// Based on  https://travismaynard.com/writing/getting-started-with-gulp

// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var csslint = require('gulp-csslint');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
/*
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
*/

// Lint Task
gulp.task('jshint', function() {
	return gulp.src(['public/**/*.js', 'lib/**/*.js'])
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'));
		//.pipe(jshint.reporter('fail'));
});

gulp.task('csslint', function() {
  return gulp.src('public/styles/editor.css')
    .pipe(csslint())
    .pipe(csslint.reporter());
});

gulp.task('sass', function(){
	gulp.src('scss/**/*.{scss,sass}')
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('public/styles'));
});

gulp.task('watch', function() {
  // Watches the scss folder for all .scss and .sass files
  // If any file changes, run the sass task
  gulp.watch('scss/**/*.{scss,sass}', ['sass'])
})

// Default Task
gulp.task('default', ['jshint', 'sass', 'watch']);
