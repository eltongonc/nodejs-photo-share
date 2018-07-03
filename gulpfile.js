const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const plumber = require('gulp-plumber');
const livereload = require('gulp-livereload');
const sass = require('gulp-sass');
const eslint = require('gulp-eslint');

const esConfig = require('./.eslintrc.js');

/**
 * Compile scss files to css
 */
gulp.task('sass', () => {
  gulp.src('./public/sass/*.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(gulp.dest('./public/css'))
    .pipe(livereload());
});

/**
 * Watch all scss files and compile them to css
 */
gulp.task('watch', () => {
  gulp.watch('./public/css/*.scss', ['sass']);
});

/**
 * Build a live dev server
 */
gulp.task('develop', () => {
  livereload.listen();
  nodemon({
    script: './lib/app.js',
    ext: 'js handlebars coffee',
    stdout: false
  }).on('readable', function () {
    this.stdout.on('data', (chunk) => {
      if (/^Express server listening on port/.test(chunk)) {
        livereload.changed(__dirname);
      }
    });
    this.stdout.pipe(process.stdout);
    this.stderr.pipe(process.stderr);
  });
});

/**
 * Lint the files
 */
gulp.task('lint', () => {
  return gulp.src(['**/*.js','!node_modules/**'])
  .pipe(eslint(esConfig))
  .pipe(eslint.format())
  .pipe(eslint.failAfterError());
});

gulp.task('default', [
  'sass',
  'develop',
  'watch'
]);
