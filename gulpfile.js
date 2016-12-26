const gulp = require('gulp');
const sass = require('gulp-sass');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const imagemin = require('gulp-imagemin');
const autoprefixer = require('gulp-autoprefixer');
const spriter = require('gulp-css-spriter');
const jshint = require('gulp-jshint');
const stylish = require('jshint-stylish');
const del = require('del');
const mkdirp = require('mkdirp');
const connect = require('gulp-connect');
const opn = require('opn');
const zip = require('gulp-zip');
const sftp = require('gulp-sftp');
const crossspriter = require('gulp-cross-spriter');
const rev = require('gulp-rev');
const revCollector = require('gulp-rev-collector');
const minifyHTML   = require('gulp-minify-html');
var _r='./demo6'//更改开发的文件夹名称
var dirPaths = {
    devPath: _r+'/src',
    proPath: _r+'/dist',
    onlinePath:{//替换上线之后js css img文件的路径
       online:_r+'/online',
       css:'http://static.58.com/topic/fangchan/css/',
       js:'http://static.58.com/topic/fangchan/js/',
       img:'http://pic2.58.com/topic/fangchan/img/'
    },
    revPath:{
       rev:_r+'/rev',
       css:_r+'/rev/css',
       js:_r+'/rev/js',
       img:_r+'/rev/img'
    },
    zip: {
        cprPath:_r+'/dist/**/*.*',
        outpath: _r+'/zip',
        name: 'dist.zip'
    },
    html: _r+'/html/',
    css: {
        src: _r+'/src/css',
        dist: _r+'/dist/css'
    },
    js: {
        src: _r+'/src/js',
        dist: _r+'/dist/js'
    },
    img: {
        src: _r+'/src/img',
        dist: _r+'/dist/img'
    },
    mock: _r+'/mock',
    doc: _r+'/doc',
    tool: _r+'/tool'
};

var serverConfig = {
    root: './', //设置根目录
    livereload: true, //启动实施监控
    port: 8081, //设置端口
    name: 'Dev App', //设置服务器名字
    domain: 'localhost'
};

var uploadConfig = {
    proPath:'',
    host: 'website.com',
    user: 'johndoe',
    pass: '1234',
    port: 22,
    remotePath: '/'
    // timeout:''
}

//创建开发目录
gulp.task('g-init', function() {
    var dirs = [dirPaths.html, dirPaths.css.src, dirPaths.js.src, dirPaths.doc, dirPaths.img.src, dirPaths.tool];
    dirs.forEach(function(dir) {
        mkdirp.sync(dir);
})
});

//处理css文件
gulp.task('g-css', function() {
    return gulp.src(dirPaths.css.src + '/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
            // outputStyle: 'compressed'
        }).on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write())
        .pipe(rename({}))
        .pipe(rev())
        .pipe(gulp.dest(dirPaths.css.dist))
        .pipe(rev.manifest())
        .pipe(gulp.dest(dirPaths.revPath.css));
});


//处理图片
gulp.task('g-image', function() {
    return gulp.src(dirPaths.img.src + '/**/*')
        .pipe(imagemin())
        .pipe(rev())
        .pipe(gulp.dest(dirPaths.img.dist))
        .pipe(rev.manifest())
        .pipe(gulp.dest(dirPaths.revPath.img));
});

//处理css和img
// gulp.task('g-style', ['g-css', 'g-image'], function() {
//     gulp.src(dirPaths.css.dist + '/**/*.css')
//         .pipe(spriter({
//             'spriteSheet': dirPaths.img.dist + '/spritesheet.png',
//             'pathToSpriteSheetFromCSS': '../img/spritesheet.png'
//         }))
//         .pipe(gulp.dest(dirPaths.css.dist));
// });
gulp.task('g-dist',['g-css','g-image','g-js']);
//雪碧图
gulp.task('crossspriter',['g-css', 'g-image'], function() {
    return gulp.src('./dist/css/**.css')//源文件的路径，可以是多文件
        .pipe(crossspriter({
            //以上面的css为例，合成后的雪碧图名字分别为index和main，插件会自动拼接到下面的路径
            'spriteSheet': './dist/img',//生成雪碧图存放的路径

            'pathToSpriteSheetFromCSS': '../img',//替换原来图片的路径后的雪碧图在css中的路径

            'cssPath': './dist/build',//生成css文件的路径，会把多个文件放在一个目录下

            'spritesmithOptions': {
                'algorithm': "top-down",
                'padding': 50
            }//参考spritesmith的配置

        }))
});

//处理js文件
gulp.task('g-js', function() {
    gulp.src(dirPaths.js.src + '/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(uglify()) //有一定的语法检测能力，如果语法错的太离谱，这里可能会报错
        .pipe(rev())
        .pipe(gulp.dest(dirPaths.js.dist))
        .pipe(rev.manifest())
        .pipe(gulp.dest(dirPaths.revPath.js));
});

//删除生成文件
gulp.task('g-del', function() {
    del(['./demo5/dist','./demo5/online','./demo5/rev']).then(function() {
        console.info('delete success!');
    })
});

gulp.task('g-openbrowser', function() {
    opn('http://' + serverConfig.domain + ':' + serverConfig.port);
});

gulp.task('g-connect', function() {
    connect.server({
        root: serverConfig.root, //设置根目录
        livereload: serverConfig.livereload, //启动实施监控
        port: serverConfig.port, //设置端口
        name: serverConfig.name //设置服务器名字
    });
});

gulp.task('g-reload', function() {
    gulp.src(dirPaths.devPath + '/**/*.*')
        .pipe(connect.reload())
})

//监听
gulp.task('g-watch', function() {
    //watch 只能监听现存的文件对于新建文件 无法监听
    gulp.watch(dirPaths.html + '/**/*.html', ['g-reload']);
    gulp.watch(dirPaths.js.src + '/**/*.js', ['g-reload', 'g-js']);
    gulp.watch(dirPaths.css.src + '/**/*.scss', ['g-reload', 'g-style']);
});


gulp.task('default', ['g-connect', 'g-watch', 'g-openbrowser']);

gulp.task('g-zip', function() {
    return gulp.src(dirPaths.zip.cprPath)
        .pipe(zip(dirPaths.zip.name))
        .pipe(gulp.dest(dirPaths.zip.path));
});

gulp.task('g-upload', function() {
    return gulp.src(uploadConfig.proPath)
        .pipe(sftp(uploadConfig));
});
// 将dist文件导入最终上线路径
// gulp.task('g-onlineHtml',function(){
//     return gulp.src(dirPaths.html+'*.html')
//         .pipe(gulp.dest(dirPaths.onlinePath))
// })
// gulp.task('g-onlineCssJsImg',function(){
//     return gulp.src(dirPaths.proPath+'/**/**')
//         .pipe(gulp.dest(dirPaths.onlinePath))
// })
// gulp.task('g-online',['g-onlineHtml','g-onlineCssJsImg']);
// gulp.task('g-online',function(){
//     return gulp.src([dirPaths.html+'*.html',dirPaths.proPath+'/**/**'])
//         .pipe(gulp.dest(dirPaths.onlinePath))
// })
//替换文件目录
gulp.task('rev', function () {
    return gulp.src([dirPaths.revPath.rev+'/**/*.json',dirPaths.html+'*.html',dirPaths.proPath+'/**/**'])
        .pipe( revCollector({
            replaceReved: true,
            dirReplacements: {
                '../dist/css/': dirPaths.onlinePath.css,
                '../dist/js/': dirPaths.onlinePath.js,
                '../dist/img/':dirPaths.onlinePath.img
            }
        }) )
        .pipe(gulp.dest(dirPaths.onlinePath.online));
});