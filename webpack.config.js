const path = require('path')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const WebpackOnBuildPlugin = require('on-build-webpack')
const WriteFilePlugin = require('write-file-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const chalk = require('chalk')
const zipFolder = require('zip-folder')
const fs = require('fs')

const manifestSrcPath = './src/manifest.json'
const manifestDistPath = './dist/manifest.json'
const manifest = require(manifestSrcPath)

const serverPort = 3031
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


const config = {
  entry: {
    // your entry file file (entry.ts or entry.js)
    'popup/index': ['./src/popup/index.js'],
    'options/index': ['./src/options/index.js']
  },
  notHotReload: [],
  devServer: { inline: true, progress: true },
  output: {
    'path': path.join(__dirname, './dist/'),
    'filename': '[name].js',
    publicPath: '/'
  },
  module: {
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
              use: ['css-loader','sass-loader?indentedSyntax=1'],
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
          fallback: 'style-loader'
        })
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
        // loader: 'file-loader'
        loader: 'file-loader',
        options: {
          name: 'static/[name].[ext]?[hash]'
        }
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
    new CleanWebpackPlugin(['dist', 'ext.zip']),
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
  delete config.notHotReload
  // http://vue-loader.vuejs.org/en/workflow/production.html
  config.plugins = (config.plugins || []).concat([
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
  module.exports = config
  // webpack(config, (err) => { if (err) throw err})
  

} else {
  // config.devtool = "#cheap-module-eval-source-map"
  config.devtool = "sourcemap"
  config.plugins =
    [new webpack.HotModuleReplacementPlugin()].concat(config.plugins || []);
  config.plugins.push(new WriteFilePlugin())
  config.plugins.push(new FriendlyErrorsPlugin())

  const notHotReload = config.notHotReload || []
  for (let entryName in config.entry) {
    if (config.entry.hasOwnProperty(entryName) && notHotReload.indexOf(entryName) === -1) {
      config.entry[entryName] = [
        ("webpack-dev-server/client?http://localhost:" + serverPort),
        "webpack/hot/dev-server"
      ].concat(config.entry[entryName]);
    }
  }
  delete config.notHotReload
  const compiler = webpack(config)
  const server = new WebpackDevServer(compiler, {
    hot: true,
    contentBase: path.join(__dirname, "dist"),
    headers: { "Access-Control-Allow-Origin": "*" }
  });
  server.listen(serverPort)
}

