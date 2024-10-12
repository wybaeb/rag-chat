const path = require('path');

module.exports = {
    entry: './src/rag-chat-widget.js',
    output: {
        filename: 'rag-chat-widget.bundle.js',
        path: path.resolve(__dirname, 'dist'),
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
    }
};
