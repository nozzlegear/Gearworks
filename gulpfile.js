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

//Tasks
const tsTask = require("./gulp/typescript");
const sassTask = require("./gulp/sass");

gulp.task("ts:server", () =>
{
    return tsTask.task("server", gulp.src(tsTask.serverFiles));
});

gulp.task("ts:browser", () =>
{
    return tsTask.task("browser", gulp.src(tsTask.browserFiles));
})

gulp.task("ts", ["ts:server", "ts:browser"]);

gulp.task("default", ["ts"]);

gulp.task("watch", ["default"], (cb) =>
{
    server.listen({path: "bin/server.js"});
    
    gulp.watch("bin/**/*.js", server.restart);
    
    gulp.watch(tsTask.serverFiles, (event) =>
    {
        console.log(`TS server file ${event.path} changed.`)
        
        return tsTask.task("server", gulp.src(event.path), event.path);
    })
    
    gulp.watch(tsTask.browserFiles, (event) =>
    {
        console.log(`TS browser file ${event.path} changed.`)
        
        return tsTask.task("browser", gulp.src(event.path), event.path);
    })
})