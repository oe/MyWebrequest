const path = require('path')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const tsImportPluginFactory = require('ts-import-plugin')
const UglifyJsPlugin = require('terser-webpack-plugin')
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
const PAGES = ['background/index', 'popup/index', 'options/index']

// auto increaseVersion of manifest.json
function increaseVersion(pkg) {
  if (increaseVersion.versionUpdated) return
  increaseVersion.versionUpdated = true

  let version = pkg.version
  const max = 20
  const vs = version.split('.').map(i => +i)
  let len = vs.length
  while (len--) {
    if (++vs[len] < max) break
    vs[len] = 0
  }
  pkg.version = vs.join('.')
}

const config = {
  entry: {
    // your entry file file (entry.ts or entry.js)
    'background/index': ['./src/background/index.ts'],
    'popup/index': ['./src/popup/index.tsx'],
    'options/index': ['./src/options/index.tsx'],
    'content-scripts/qr': ['./src/content-scripts/qr.ts'],
    'content-scripts/change-ua': ['./src/content-scripts/change-ua.ts'],
    'content-scripts/page-excerpt': ['./src/content-scripts/page-excerpt.ts'],
    'content-scripts/remove-referrer': [
      './src/content-scripts/remove-referrer.ts'
    ]
  },
  notHotReload: [],
  mode: process.env.NODE_ENV,
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    alias: {
      // 'vue-i18n$': 'vue-i18n/dist/vue-i18n.min.js',
      '@': path.resolve(__dirname, 'src')
    }
  },
  output: {
    path: path.join(__dirname, './dist/'),
    filename: '[name].js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
        options: {
          getCustomTransformers: () => ({
            before: [
              tsImportPluginFactory({
                libraryDirectory: 'es',
                libraryName: 'antd',
                style: 'css'
              })
            ]
          })
        }
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        loader: 'source-map-loader'
      },
      // {
      //   test: /\.js$/,
      //   loader: 'babel-loader',
      //   exclude: /node_modules/
      // },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          use: 'css-loader',
          fallback: 'style-loader'
        })
      },
      {
        // preprocess markdown file
        test: /\.md$/,
        loader: 'vue-markdown-loader',
        options: {
          wrapper: 'article'
        }
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
    ...PAGES.map(pn => {
      return new HtmlWebpackPlugin({
        filename: pn + '.html',
        chunks: [pn],
        template: path.resolve(__dirname, './src/index.ejs'),
        pageTitle: manifest.name,
        minify: {
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeComments: true
        }
      })
    }),
    // autoprefixer({ remove: false, browsers: ['last 7 versions'] }),
    new CleanWebpackPlugin(['dist', 'ext.zip']),
    // copy custom static assets
    new CopyWebpackPlugin(
      [
        {
          from: path.resolve(__dirname, 'src/static/'),
          to: path.resolve(__dirname, 'dist/static/')
        },
        {
          from: path.resolve(__dirname, 'src/_locales/'),
          to: path.resolve(__dirname, 'dist/_locales/')
        },
        {
          from: path.resolve(__dirname, 'src/manifest.json'),
          to: path.resolve(__dirname, 'dist/manifest.json')
        }
      ],
      {
        ignore: ['**/.*', '**/*.map', '**/node_modules/*']
      }
    ),
    // extract css into its own file
    new ExtractTextPlugin({
      filename: '[name].css'
    }),
    new OptimizeCSSPlugin({
      cssProcessorOptions: {
        // prevent autoprefix removing prefixes
        // ref https://github.com/ben-eb/cssnano/issues/357
        autoprefixer: {
          remove: false
        }
      }
    })
  ]
}

if (process.env.NODE_ENV === 'production') {
  delete config.notHotReload
  config.optimization = {
    sideEffects: false,
    // minimize: false,
    minimizer: [
      // we specify a custom UglifyJsPlugin here to get source maps in production
      new UglifyJsPlugin({
        cache: true,
        parallel: true
        // uglifyOptions: {
        //   compress: false,
        //   // ecma: 6,
        //   mangle: true
        // }
      })
    ]
  }
  // http://vue-loader.vuejs.org/en/workflow/production.html
  config.plugins = (config.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    new WebpackOnBuildPlugin(stats => {
      increaseVersion(manifest)
      try {
        fs.writeFileSync(manifestSrcPath, JSON.stringify(manifest, null, 2))
        fs.writeFileSync(manifestDistPath, JSON.stringify(manifest, null, 2))
      } catch (e) {
        console.log(
          chalk.red('\n  update manifest(dist) file error: ' + e.message)
        )
      }
      console.log(chalk.cyan('\n  manifest file updated successfully'))

      zipFolder('./dist/', './ext.zip', err => {
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
  config.devtool = 'sourcemap'
  config.plugins = [new webpack.HotModuleReplacementPlugin()].concat(
    config.plugins || []
  )
  config.plugins.push(new WriteFilePlugin())
  config.plugins.push(new FriendlyErrorsPlugin())

  const notHotReload = config.notHotReload || []
  for (let entryName in config.entry) {
    if (
      config.entry.hasOwnProperty(entryName) &&
      notHotReload.indexOf(entryName) === -1
    ) {
      config.entry[entryName] = [
        'webpack-dev-server/client?http://localhost:' + serverPort,
        'webpack/hot/dev-server'
      ].concat(config.entry[entryName])
    }
  }
  delete config.notHotReload
  const compiler = webpack(config)
  const server = new WebpackDevServer(compiler, {
    hot: true,
    stats: { colors: true },
    contentBase: path.join(__dirname, 'dist'),
    headers: { 'Access-Control-Allow-Origin': '*' }
  })
  server.listen(serverPort)
}
