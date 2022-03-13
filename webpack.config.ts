import { resolve } from 'path'
import { readdirSync, readFileSync } from 'fs'
import { Configuration } from 'webpack'
import CopyPlugin from 'copy-webpack-plugin'
import nodeExternals from 'webpack-node-externals'
import 'webpack-dev-server'
import { env } from 'process'

export default (env: any, args: any) => {
    const mode: Configuration['mode'] = args.mode ?? 'development'

    const configurations: Configuration[] = [
        // main
        {
            name: 'main',
            mode,
            target: 'electron-main',
            entry: {
                main: './src/main.ts'
            },
            output: {
                filename: '[name].js',
                path: resolve(__dirname, 'dist')
            },
            module: {
                rules: [
                    {
                        test: /\.ts$/,
                        loader: 'ts-loader'
                    }
                ]
            },
            resolve: {
                extensions: ['.js', '.ts', '.json']
            }
        },

        // windows
        ...windows(mode)
    ]

    return configurations
}

const windows = (mode: Configuration['mode']): Configuration[] => {
    const templatePath = resolve(__dirname, 'resources/view_template.prod.html')
    const windowsPath = resolve(__dirname, 'src/windows')
    const windows: { name: string; preload: boolean }[] = []

    readdirSync(windowsPath).flatMap(window => {
        const path = resolve(__dirname, `src/windows/${window}`)
        const files = readdirSync(path)

        if (files.includes('renderer.tsx')) {
            windows.push({
                name: window,
                preload: files.includes('preload.ts')
            })
        }
    })

    const renderer: Configuration = {
        name: `renderer`,
        mode,
        target: 'electron-renderer',
        entry: windows.reduce(
            (entry, window) => ({
                ...entry,
                [window.name]: {
                    import: `./src/windows/${window.name}/renderer.tsx`,
                    filename: `${window.name}/renderer.js`
                }
            }),
            {}
        ),
        output: {
            filename: '[name].js',
            path: resolve(__dirname, `dist/windows`),
            libraryTarget: 'commonjs'
        },
        module: {
            rules: [
                {
                    test: /\.ts(x)?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            plugins: [
                                '@babel/plugin-proposal-class-properties'
                            ],
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-react',
                                '@babel/preset-typescript'
                            ]
                        }
                    }
                }
            ]
        },
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
        },
        plugins: [
            new CopyPlugin({
                patterns: windows.map(window => ({
                    from: templatePath,
                    to: resolve(
                        __dirname,
                        `dist/windows/${window.name}/view.html`
                    )
                }))
            })
        ],
        devServer: {
            static: resolve(__dirname, 'resources/public'),
            onAfterSetupMiddleware: function (devServer) {
                if (!devServer?.app) {
                    throw new Error('webpack-dev-server is not defined')
                }

                const view_template = readFileSync(
                    resolve(__dirname, 'resources/view_template.dev.html'),
                    'utf-8'
                )

                devServer.app.get('/:window', (req, res) =>
                    res.send(
                        view_template.replace('<<window>>', req.params.window)
                    )
                )
            }
        },
        externals: [
            nodeExternals({
                importType: 'commonjs'
            })
        ]
    }

    const preload: Configuration = {
        name: `preload`,
        mode,
        target: 'electron-main',
        entry: windows
            .filter(({ preload }) => preload)
            .reduce(
                (entry, { name }) => ({
                    ...entry,
                    [name]: {
                        import: `./src/windows/${name}/preload.ts`,
                        filename: `${name}/preload.js`
                    }
                }),
                {}
            ),
        output: {
            filename: '[name].js',
            path: resolve(__dirname, `dist/windows`)
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader'
                }
            ]
        },
        resolve: {
            extensions: ['.js', '.ts', '.json']
        }
    }

    return [renderer, preload]
}
