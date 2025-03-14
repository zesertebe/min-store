const path = require("path");

const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  return {
    mode: "production",
    entry: path.resolve(__dirname, "src") + "/index.ts",
    output: {
      filename: "store.js",
      path: path.resolve(__dirname, "./dist"),
      globalObject: "this",
      library: "store",
      libraryTarget: "umd",
      clean: true,
    },
    externals: {
      lodash: {
        commonjs: "lodash",
        commonjs2: "lodash",
        amd: "lodash",
        root: "_",
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: "ts-loader",
        },
      ],
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: "src/store.d.ts", to: "store.d.ts" }, // Copia la carpeta 'img' a 'dist/img'
        ],
      }),
    ],
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      alias: {
        "@": path.resolve(__dirname, "src"), // Agrega esta línea para que webpack resuelva `@` como `src`
      },
    },
    devServer: {
      //contentBase: path.join(__dirname, "./dist"),
      compress: true,
      liveReload: true,
      port: 8000,
      watchFiles: ["src/**/*"],
    },
    optimization: {
      moduleIds: "deterministic",
    },
  };
};
