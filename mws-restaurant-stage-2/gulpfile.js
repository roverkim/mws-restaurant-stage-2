const gulp = require('gulp'); // Task runner
// Minfication
const concat = require('gulp-concat'); // Join files together
const uglify = require("gulp-uglify-es").default; // Minmizes files
const autoprefixer = require('gulp-autoprefixer'); // Adds Auto Prefix for CSS styles such as webkits in css
const cleanCSS = require('gulp-clean-css');
const gzip = require('gulp-gzip');
const compress = require('compression'); // browserSync Gzip Support
// Sever
const browserSync = require('browser-sync').create();
// Transpiler
const babel = require('gulp-babel'); // Transform latest ES code to ES5
// const browserify = require("browserify"); // Allows for require to be used in browser files
// const source = require("vinyl-source-stream"); // Convert to vinyl streams for browserify
// const buffer = require("vinyl-buffer"); // Convery vinyl streams to buffered object
// Utlilities
const sourcemaps = require('gulp-sourcemaps'); // Creates a source map for minimized code that points back to the preminized version
const gutil = require('gulp-util');
const order = require('gulp-order');
// Images
const imagemin = require('gulp-imagemin'); // Minify images
const imageminPngquant = require('imagemin-pngquant'); // Quantization algorithm for images
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminWebp = require('imagemin-webp');

//gulp gulp-concat gulp-uglify-es browser-sync gulp-babel gulp-sourcemaps gulp-util gulp-order gulp-imagemin imagemin-pngquant

let indexJs = ['js/lazyloader.js', 'js/idb.js', 'js/dbhelper.js', 'js/main.js', 'js/registersw.js'];
let restaurantJs = ['js/lazyloader.js', 'js/idb.js', 'js/dbhelper.js', 'js/restaurant_info.js', 'js/registersw.js'];


function distribute(sourceArray, fileName, dest) {
  return gulp.src(sourceArray)
    .pipe(order(sourceArray))
    .pipe(babel({
      presets: ['@babel/env']
    })) // Transpiler ES6 Code to ES5
    .pipe(sourcemaps.init()) // Initialize Source Map
    .pipe(concat(fileName+'.js')) // Concatinate Javascript
    .pipe(uglify())
    .on('error', function(err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(sourcemaps.write()) // Write to Source Map
    .pipe(gulp.dest(dest))
    .pipe(browserSync.reload({
      stream: true
     }));
};

gulp.task('indexJs', () => {
  return distribute(indexJs, 'indexJs', 'dist/js');
});

gulp.task('restaurantJs', () => {
  return distribute(restaurantJs, 'restaurantJs', 'dist/js');
});

gulp.task('swJs', () => {
  return gulp.src('sw.js')
    .pipe(babel({
      presets: ['@babel/env']
    })) // Transpiler ES6 Code to ES5
    .pipe(sourcemaps.init()) // Initialize Source Map
    .pipe(concat('sw.js')) // Concatinate Javascript
    .pipe(uglify())
    .on('error', function(err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(sourcemaps.write()) // Write to Source Map
    .pipe(gzip())
    .pipe(gulp.dest('dist/'))
    .pipe(browserSync.reload({
      stream: true
     }));
});

gulp.task('copyCSS', () => {
  return gulp.src('css/**/*.css')
    .pipe(sourcemaps.init()) // Initialize Source Map
      .pipe(autoprefixer({
        browsers: ['last 2 versions']
        })
      )
        .pipe(cleanCSS())
          .pipe(sourcemaps.write()) // Write to Source Map
            .pipe(gulp.dest('dist/css'))
              .pipe(browserSync.reload({
                stream: true
                 }));
});

// Task for copying files
gulp.task('copyHtml', () => { // Copy html file into the distribition folder
  return gulp.src('./*.html')
    .pipe(gulp.dest('./dist'));
});

gulp.task('copyManifestSW', () => { // Copy html file into the distribition folder
  return gulp.src(['./site.webmanifest', './sw.js', './browserconfig.xml'])
    .pipe(gulp.dest('./dist'));
});

gulp.task('copyData', () => { // Copy html file into the distribition folder
  return gulp.src('data/*')
    .pipe(gulp.dest('./dist/data'));
});

gulp.task('copyImages', () => { // Copy all image file into the distribition image folder
  return gulp.src('img/*')
  // .pipe(imagemin([imageminMozjpeg({
  //     quality: 85
  // })]))
  .pipe(imagemin([ imageminWebp({quality: 85})]))

    .pipe(gulp.dest('./dist/img'));
});

gulp.task('watching', function(){
  browserSync.init({
    server: {
      baseDir: './dist',
      middleware: [compress()]
    }
  });
  gulp.watch('./js/**/*.js', gulp.parallel(['indexJs', 'restaurantJs']));
  gulp.watch('./*.html', browserSync.reload);
  gulp.watch('./*.css', browserSync.reload);
});



gulp.task('default', gulp.series(['indexJs', 'copyManifestSW', 'restaurantJs', 'copyImages', 'copyHtml', 'copyCSS', 'copyData', 'watching']));
