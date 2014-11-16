module.exports = function(grunt) {
  // 临时文件夹
  var _EXP_TEMP_PATH = '../_IA_/';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // 复制文件
    copy: {
      main: {
        files: [
          {
            expand: true,
            src: [
              './**',
              '!./**/*.js',
              './common/jquery.min.js',
              '!./**/*.tpl',
              '!./**/*.coffee',
              '!./**/*.less',
              '!./**/*.map',
              '!./**/*.command',
              '!./**/*.jade',
              '!./**/.svn/**',
              '!./node_modules/**',
              '!./**/*.zip',
              '!./GruntFile*',
              '!./package.json',
              '!./config.codekit',
              '!./**/tpl2js*',
              '!./**/*.cmd',
              '!./**/*.md'
            ],
            dest: _EXP_TEMP_PATH,
            filter: 'isFile'
          }
        ]
      },
    },
    // 压缩JS代码
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        // 移除console打印的日志
        compress: {
          // drop_console: true
        },
        // 设置不压缩的关键字
        mangle: {
          // except: ['require']
        }
      },
      min: {
        files: [{
          expand: true,
          src: ['./**/*.js','!./common/jquery.min.js','!./*.js','!./node_modules/**'],
          dest: _EXP_TEMP_PATH
        }]
      }
    },
    // 压缩至文件夹
    compress: {
      main: {
        options: {
          archive: './app.zip',
          mode: 'zip'
        },
        files: [
          {
            expand: true,
            src: '**',
            cwd: _EXP_TEMP_PATH
          }
        ]
      }
    },
    // 清理临时文件夹
    clean: {
      options: {
        // 强制清理
        force: true
      },
      main: [ _EXP_TEMP_PATH ]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['copy', 'uglify' ,'compress','clean']);

};