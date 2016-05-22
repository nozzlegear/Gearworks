"use strict";

const gulp        = require("gulp");
const path        = require("path");
const mergeTasks  = require("merge2");
const sass        = require('gulp-sass');
const gutil       = require("gulp-util");
const minifyJs    = require("gulp-uglify");
const rename      = require("gulp-rename");
const concat      = require("gulp-concat");
const gulpForeach = require('gulp-foreach');
const webpack     = require('webpack-stream');
const minifyCss   = require("gulp-clean-css");
const ts          = require("gulp-typescript");
const autoprefix  = require("gulp-autoprefixer");
const server      = require("gulp-develop-server");
const map         = require("lodash").map;
const merge       = require("lodash").merge;

gulp.task("default", []);

gulp.task("watch", ["default"], (cb) =>
{
    
})