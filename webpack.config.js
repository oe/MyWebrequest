var path = require('path')
var webpack = require('webpack')
var CopyWebpackPlugin = require('copy-webpack-plugin')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
var WebpackOnBuildPlugin = require('on-build-webpack')
var chalk = require('chalk')
var zipFolder = require('zip-folder')
var fs = require('fs')

var manifestSrcPath = './src/manifest.json'
var manifestDistPath = './dist/manifest.json'
var manifest = require(manifestSrcPath)
// var PrepackWebpackPlugin = require('prepack-webpack-plugin').default;

var utils = {
  cssLoaders: function (options) {
    options = options || {}

    var cssLoader = {
      loader: 'css-loader',
      options: {
        minimize: process.env.NODE_ENV === 'production',
        sourceMap: options.sourceMap
      }
    }

    // generate loader string to be used with extract text plugin
    function generateLoaders (loader, loaderOptions) {
      var loaders = [cssLoader]
      if (loader) {
        loaders.push({
          loader: loader + '-loader',
          options: Object.assign({}, loaderOptions, {
            sourceMap: options.sourceMap
          })
        })
      }

      // Extract CSS when that option is specified
      // (which is the case during production build)
      if (options.extract) {
        return ExtractTextPlugin.extract({
          use: loaders,
          fallback: 'vue-style-loader'
        })
      } else {
        return ['vue-style-loader'].concat(loaders)
      }
    }

    // http://vuejs.github.io/vue-loader/en/configurations/extract-css.html
    return {
      css: generateLoaders(),
      postcss: generateLoaders(),
      less: generateLoaders('less'),
      sass: generateLoaders('sass', { indentedSyntax: true }),
      scss: generateLoaders('sass'),
      stylus: generateLoaders('stylus'),
      styl: generateLoaders('stylus')
    }
  },

  // Generate loaders for standalone style files (outside of .vue)
  styleLoaders: function (options) {
    var output = []
    var loaders = utils.cssLoaders(options)
    for (var extension in loaders) {
      var loader = loaders[extension]
      output.push({
        test: new RegExp('\\.' + extension + '$'),
        use: loader
      })
    }
    return output
  }
}

// auto increaseVersion of manifest.json
function increaseVersion (package) {
  if (increaseVersion.versionUpdated) return
  increaseVersion.versionUpdated = true

  let version = package.version;
  const max = 20
  const vs = version.split('.').map((i) => +i)
  let len = vs.length
  while (len--) {
    if ((++vs[len]) < max) break
    vs[len] = 0
  }
  package.version = vs.join('.')
}


module.exports = {
  'entry': {
    // your entry file file (entry.ts or entry.js)
    'popup/index': ['./src/popup/index.js'],
    'options/index': ['./src/options/index.js']
    // 'popup': ['./src/popup/index.js']
  },
  'output': {
    'path': path.join(__dirname, './dist/'),
    'filename': '[name].js'
  },
  'module': {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: utils.cssLoaders({
            sourceMap: false,
            extract: true
          })
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  plugins: [
    // copy custom static assets
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, 'src/static/'),
        to: path.resolve(__dirname, 'dist/static/')
      },
      {
        context: path.resolve(__dirname, 'src/'),
        from: '**/index.html',
        to: path.resolve(__dirname, 'dist')
      },
      {
        from: path.resolve(__dirname, 'src/_locales/'),
        to: path.resolve(__dirname, 'dist/_locales/')
      },
      {
        from: path.resolve(__dirname, 'src/manifest.json'),
        to: path.resolve(__dirname, 'dist/manifest.json')
      }
    ], {
      ignore: [
        '**/.*',
        '**/*.map',
        '**/node_modules/*'
      ]
    }),
    // extract css into its own file
    new ExtractTextPlugin({
      filename: '[name].css'
    }),
    new OptimizeCSSPlugin()
  ],
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      // 'vue-i18n$': 'vue-i18n/dist/vue-i18n.min.js',
      '@': path.resolve(__dirname, 'src')
    }
  }
};

if (process.env.NODE_ENV === 'production') {
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: false,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    new WebpackOnBuildPlugin((stats) => {
      increaseVersion(manifest)
      try {
        fs.writeFileSync(manifestSrcPath, JSON.stringify(manifest, null, 2))
        fs.writeFileSync(manifestDistPath, JSON.stringify(manifest, null, 2))
      } catch(e) {
        console.log(chalk.red('\n  update manifest(dist) file error: ' + e.message))
      }
      console.log(chalk.cyan('\n  manifest file updated successfully'))

      zipFolder('./dist/', './ext.zip', (err) =>  {
        if (err) {
          console.log(chalk.red('Failed to zip dist folder ' + err))
        } else {
          console.log(chalk.cyan('An zip of ext is available in ./ext.zip'))
        }
      })
    })
    // new PrepackWebpackPlugin({})
  ])
}

