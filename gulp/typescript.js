"use strict";

const process      = require("process");
const gulp         = require("gulp");
const path         = require("path");
const gutil        = require("gulp-util");
const ts           = require("gulp-typescript");
const gulpForEach  = require("gulp-foreach");
const webpack      = require("webpack-stream");
const minifyJs     = require("gulp-uglify");
const rename       = require("gulp-rename");
const gulpIf       = require("gulp-if");
const lazypipe     = require("lazypipe");
const lodash       = require("lodash");
const gulpCallback = require("gulp-callback");
const cwd          = path.resolve(process.cwd()).toLowerCase();

const findTsDir = (outputPath, isSingleFilePath) =>
{
    if (!isSingleFilePath) return path.resolve(cwd, outputPath);
    
    let singlePath = path.resolve(path.parse(outputPath).dir).toLowerCase();
    
    if (singlePath === cwd)
    {
        //If the file was in the root folder, send it to the bin root
        return path.resolve(cwd, "bin");
    }
    
    singlePath = singlePath.split(cwd)[1]; 
    
    // Support multiple source directories:
    const patterns = [
        {
            startsWith: "modules",
            replaceWith: `bin${path.sep}modules`  
        },
        {
            startsWith: "routes",
            replaceWith: `bin${path.sep}routes`
        },
        {
            startsWith: "views",
            replaceWith: `bin${path.sep}views`
        },
        {
            startsWith: "js",
            replaceWith: `wwwroot${path.sep}js`,
        }
    ]
    
    const pattern = lodash.find(patterns, p => singlePath.startsWith(p.startsWith) || singlePath.startsWith(`${path.sep}${p.startsWith}`));
    
    if (!pattern)
    {
        const message = `Failed to find target dir for TS file ${outputPath}. No matching patterns.`;
        
        gutil.beep();
        console.error(message);
        
        throw new Error(message);
    }
    
    singlePath = singlePath.replace(pattern.startsWith, pattern.replaceWith);

    return path.resolve(path.join(cwd, singlePath)); 
}

const tsTask = (type, gulpSrc, singleFileSrcPath) =>
{
    const isServer = type === "server";
    const outputPath = findTsDir(singleFileSrcPath || (isServer ? "bin" :  "wwwroot"), !!singleFileSrcPath);
    const project = ts.createProject(path.resolve(cwd, isServer ? "tsconfig.json" : "js/tsconfig.json"));

    const webpackAndMinify = lazypipe()
        .pipe(gulpForEach, (stream, file) =>
        {
            // Using gulp-foreach to modify webpack options and prevent webpack from renaming all files
            // to its rando hashes.
            
            const filepath = path.parse(file.path);
            const options = {
                module: {
                    loaders: [
                        {
                            test: /\.css$/,
                            loaders: ["style", "css"]
                        },
                        {
                            test: /\.scss$/,
                            loaders: ["style", "css", "sass"]
                        }
                    ]
                },
                output: {
                    filename: filepath.name + ".min.js",
                }
            };
            
            return stream
                .pipe(webpack(options))
                .pipe(minifyJs({mangle: true}).on("error", gutil.log))
                .pipe(gulp.dest(filepath.dir));
        })
    
    return gulpSrc
        .pipe(ts(project))
        .js
        .pipe(gulpIf(!!singleFileSrcPath, rename(path =>
        {
            //Single files need their directories replaced, else they'll output in "folder/1/2/1/2" instead of "folder/1/2"
            path.dirname = "";
        })))
        .pipe(gulp.dest(outputPath)) //webpack-stream bug, files must exist on disk: https://github.com/shama/webpack-stream/issues/72
        .pipe(gulpIf(!isServer, webpackAndMinify()));
}

module.exports.task         = tsTask;
module.exports.browserFiles = ["./js/**/*.ts"];
module.exports.serverFiles  = ["./server.ts", "./modules/**/*.ts", "./routes/**/*.ts", "./views/**/*.{ts,tsx}"];