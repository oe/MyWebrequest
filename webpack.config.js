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
          loaders: {
            css: ExtractTextPlugin.extract({
              use: 'css-loader',
              fallback: 'vue-style-loader'
            }),
            scss: ExtractTextPlugin.extract({
              use: ['css-loader','sass-loader'],
              fallback: 'vue-style-loader'
            }),
            sass: ExtractTextPlugin.extract({
              use: ['css-loader','sass-loader'],
              fallback: 'vue-style-loader'
            }),
            less: ExtractTextPlugin.extract({
              use: ['css-loader','less-loader'],
              fallback: 'vue-style-loader'
            })
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          use: "css-loader",
          fallbackLoader: 'style-loader'
        })
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
        // loader: 'file-loader'
        loader: 'file-loader?name=/static/[name].[ext]'
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

