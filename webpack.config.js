const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Загрузка переменных окружения
const env = dotenv.config().parsed;

// Создание объекта с переменными окружения для использования в коде
const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = {
    entry: './src/rag-chat-widget.js',
    output: {
        filename: 'rag-chat-widget.bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        library: 'RagChat',
        libraryTarget: 'umd',
        libraryExport: 'default',
        umdNamedDefine: true
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    resolve: {
        fallback: {
            "fs": false,
            "path": false,
            "os": false
        }
    },
    plugins: [
        new webpack.DefinePlugin(envKeys),
        new HtmlWebpackPlugin({
            template: 'index.template.html',
            templateParameters: {
                RAG_CHAT_TOKEN: env.RAG_CHAT_TOKEN,
                RAG_CHAT_URL: env.RAG_CHAT_URL
            }
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 9000,
    },
};
