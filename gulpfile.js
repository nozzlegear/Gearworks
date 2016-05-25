"use strict";

const gulp        = require("gulp");
const server      = require("gulp-develop-server");

//Tasks
const tsTask = require("./gulp/typescript");
const sassTask = require("./gulp/sass");

gulp.task("sass", () =>
{
    return sassTask.task(gulp.src(sassTask.files));
})

gulp.task("ts:server", () =>
{
    return tsTask.task("server", gulp.src(tsTask.serverFiles));
});

gulp.task("ts:browser", () =>
{
    return tsTask.task("browser", gulp.src(tsTask.browserFiles));
})

gulp.task("ts", ["ts:server", "ts:browser"]);

gulp.task("default", ["ts", "sass"]);

gulp.task("watch", ["default"], (cb) =>
{
    server.listen({path: "bin/server.js"});
    
    gulp.watch(["bin/**/*.js", "gearworks.private.json"], server.restart);
    
    gulp.watch(sassTask.files, (event) =>
    {
        console.log('Sass file ' + event.path + ' was changed.');
        
        if (event.path.indexOf("_variables.scss") > -1)
        {
            //Recompile all sass files with updated variables.
            return sassTask.task(gulp.src(sassFiles));
        }
        
        return sassTask.task(gulp.src(event.path));
    })
    
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