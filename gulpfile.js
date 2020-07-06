// 实现这个项目的构建任务
const { src, dest, parallel, series, watch } = require('gulp')
const del = require('del')  // 清楚文件
const browserSync = require('browser-sync') // 开发服务器，热更新

const loadPlugins = require('gulp-load-plugins')  // 插件替换

const plugins = loadPlugins()
const bs = browserSync.create()

const clean = () => {
  return del(['dist'])
}

// src 创建读取流 dest 写入流
// _ 默认为依赖css 不会打包
const style = () => {
  return src('src/assets/styles/*.scss', { base: 'src'}) // base src下文件打包
    // .pipe(sass())  
    .pipe(plugins.sass({ outputStyle: 'expanded' })) // sass 完全展开  
    .pipe(dest('dist'))
    .pipe(bs.reload({stream: true})) // 以流的方式向浏览器中推
}

const script = () => {
  return src('src/assets/scripts/*.js', { base: 'src'})
    // .pipe(babel())  // 唤起过程，需要安装转换模块 @babel
    .pipe(plugins.babel({ presets : ['@babel/preset-env']}))  // 唤起过程，需要安装转换模块 @babel
    .pipe(dest('dist'))
}

const page = () => {
  return src('src/**/*.html', {base: 'src'})  // src下所有子目录中的html文件
    .pipe(plugins.swig({
      defaults: {
        cache: false  // 更改页面后，页面不缓存
      }
    }))
    .pipe(dest('dist'))
}



const image = () => {
  return src('src/assets/images/**', {base: 'src'})  // src下所有文件
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

const font = () => {
  return src('src/assets/fonts/**', {base: 'src'})  // src下所有文件
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

const extra = () => {
  return src('public/**', {base: 'public'})
    .pipe(dest('dist'))
}

const serve = () => {
  // 第一个参数通配符   第二个参数监听执行的任务
  watch('src/assets/styles/*.scss', style)
  watch('src/assets/scripts/*.js', script)
  watch('src/**/*.html', page)
  // watch('src/assets/fonts/**', font)
  // watch('src/assets/images/**', image)
  // watch('public/**', extra)

  // 这些文件变化后，执行bs.reload（browser） 刷新浏览器
  watch([
    'src/assets/fonts/**',
    'src/assets/images/**',
    'public/**'
  ], bs.reload)


  // watch 会自动监听相应通配符下路径的文件，一旦发生变化，就会执行相应的任务
  // 执行相应的任务以后，相应目录的文件夹的文件就会发生变化，
  // browser 就会监听并做出相应的热更新
  bs.init({
    notify: false,  // 页面提示（右上角）
    port: 2080,       // 启动的端口
    open: true,         // 自动打开浏览器
    files: 'dist/**',    // browder 启动监听的文件路径通配符  这里也可以不使用，可以用bs.reload()方式代替其功能，在具体的每个任务后用pipe的方式，把文件流推入浏览器中
    server: {
      // baseDir: 'dist',
      baseDir: ['dist', 'src', 'public'],  // 开发服务器的根目录，入口文件  先去数组中，第一个找不到一个依次往后找
      
      
      routes: {   // 先去routers看，先走routes的配置
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () => {
  return src('dist/*.html', {base: 'dist'})
    .pipe(plugins.useref({ searchPath: ['dist', '.'] })) // 将注释之内的引用安装到本地
    // 文件压缩 html js css
    .pipe(plugins.if(/\.js$/, plugins.uglify())) // 判断以js结尾的文件，执行uglify压缩文件
    .pipe(plugins.if(/\.css$/, plugins.cleanCss())) // 判断以js结尾的文件，执行uglify压缩文件
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
    
    }))) // 判断以js结尾的文件，执行uglify压缩文件
    
    .pipe(dest('dist'))
  }

// const compile = parallel(style, script, page, image, font)
const compile = parallel(style, script, page)
 

// 上线之前执行的任务  将文字 图片转换移动到build中，减少开发监听的开销，每次上线之前再去压缩图片和文字
const build = series(clean, parallel(compile, extra), image, font)

// 开发之前  现将文件转换到相应的dist文件后，再去执行本地开发服务器
const develop = series(compile, serve) 

module.exports = {
  clean,
  compile,
  build,
  serve,
  develop,
  useref
}