"use strict";

const gulp       = require("gulp");
const sass       = require("gulp-sass");
const autoprefix = require("gulp-autoprefixer");
const minify     = require("gulp-clean-css");
const rename     = require("gulp-rename");

const sassTask = (gulpSrc) =>
{
    const cssMinOptions = {
        processImport: false,
        processImportFrom: ['!fonts.googleapis.com']
    }
    
    return gulpSrc
        .pipe(sass())
        .pipe(autoprefix())
        .pipe(minify(cssMinOptions))
        .pipe(rename((path) => 
        {
            path.extname = ".min.css";
        }))
        .pipe(gulp.dest('wwwroot/css'));
}

module.exports.task = sassTask;
module.exports.files = ['css/**/*.scss'];