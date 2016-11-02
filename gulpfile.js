"use strict";

const gulp            = require("gulp");
const chokidar        = require("chokidar");
const shell           = require("gulp-shell");
const server          = require("gulp-develop-server");
const gearworksConfig = require("./gearworks.private.json");

//Tasks
const sassTask = require("./gulp/sass");
const tsTask = require("./gulp/typescript");

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
    server.listen({path: "bin/server.js", env: gearworksConfig});
    
    // Gulp.watch in 3.x is broken, watching more files than it should. Using chokidar instead.
    // https://github.com/gulpjs/gulp/issues/651
    chokidar.watch(["bin/**/*.js"], {ignoreInitial: true}).on("all", (event, path) =>
    {
        server.restart();
    });

    chokidar.watch(sassTask.files, {ignoreInitial: true}).on("all", (event, path) =>
    {
        console.log(`${event}: Sass file ${path}`);
        
        if (path.indexOf("_variables.scss") > -1)
        {
            //Recompile all sass files with updated variables.
            return sassTask.task(gulp.src(sassFiles));
        }
        
        return sassTask.task(gulp.src(path));
    })
    
    chokidar.watch(tsTask.serverFiles, {ignoreInitial: true}).on("all", (event, path) =>
    {
        console.log(`${event}: TS server file ${path}`);
        
        return tsTask.task("server", gulp.src(path), path);
    })
    
    chokidar.watch(tsTask.browserFiles, {ignoreInitial: true}).on("all", (event, path) =>
    {
        console.log(`${event}: TS browser file ${path}`);
        
        return tsTask.task("browser", gulp.src(path), path);
    })
    
    shell.task("pouchdb-server -n --dir pouchdb --port 5984")();
})