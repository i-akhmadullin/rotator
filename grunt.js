module.exports = function( grunt ) {
  'use strict';
  grunt.initConfig({

    watch: {
      scripts: {
        files: '<config:lint.files>',
        tasks: 'closure-compiler'
      }
      // css: {
      //   files: [
      //     'css/**/*.css'
      //   ],
      //   tasks: 'reload'
      // },
      // reload: {
      //   files: [
      //     '../*.html'
      //   ],
      //   tasks: 'reload'
      // }
    },
    lint: {
      files: [
        'Gruntfile.js',
        'js/**/*.js'
      ]
    },
    'closure-compiler': {
      release: {
        closurePath: 'closure',
        js: 'js/jquery.rotator2.js',
        jsOutputFile: 'js/jquery.rotator2.min.js',
        maxBuffer: 500,
        options: {
          // compilation_level: 'ADVANCED_OPTIMIZATIONS',
          externs: '<config:closure-compiler.release.closurePath>/contrib/externs/jquery-1.7.js'
        }
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {
        jQuery: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-closure-compiler');

  grunt.registerTask('default', 'watch');
  grunt.registerTask('publish', 'closure-compiler watch');
};
