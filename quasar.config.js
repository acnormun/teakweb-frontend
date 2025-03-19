const { configure } = require('quasar/wrappers');
const path = require('path');

module.exports = configure(function (/* ctx */) {
  return {
    boot: [
      'i18n',
      'axios',
    ],

    css: [
      'app.scss'
    ],

    extras: [
      'roboto-font',
      'material-icons',
    ],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20'
      },

      vueRouterMode: 'hash',

      vitePlugins: [
        ['@intlify/vite-plugin-vue-i18n', {
          include: path.resolve(__dirname, './src/i18n/**')
        }],
        ['vite-plugin-checker', {
          vueTsc: { tsconfigPath: 'tsconfig.vue-tsc.json' },
          eslint: { lintCommand: 'eslint "./**/*.{js,ts,mjs,cjs,vue}"' }
        }, { server: false }]
      ]
    },

    devServer: {
      port: 3131,
      open: true
    },

    framework: {
      config: {
        notify: {
          position: 'bottom',
          timeout: 3000,
          textColor: 'white',
          actions: [{ icon: 'close', color: 'white' }]
        }
      },
      plugins: [
        'Notify'
      ],
    },

    animations: [],

    electron: {
      bundler: 'packager', // Pode ser 'builder' se quiser um instalador

      packager: {
        asar: false, // Para garantir que os arquivos sejam lidos corretamente
        extraResource: ['dist/spa'], // Copia os arquivos do Quasar para o Electron
        dir: './dist/electron/', // Garante que o Electron está no diretório certo
      },

      builder: {
        appId: 'teakweb',
        directories: {
          output: 'dist/electron', // Define a pasta de saída corretamente
        },
      }
    }
  }
});
