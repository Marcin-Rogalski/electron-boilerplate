import { resolve } from 'path'
import { readdirSync } from 'fs'
import { Configuration } from 'webpack'
import CopyPlugin from 'copy-webpack-plugin'

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
    const templatePath = resolve(__dirname, 'resources/view_template.html')
    const windowsPath = resolve(__dirname, 'src/windows')

    return readdirSync(windowsPath)
        .flatMap(window => {
            const viewPath = resolve(
                __dirname,
                `dist/windows/${window}/view.html`
            )
            const path = resolve(__dirname, `src/windows/${window}`)
            const files = readdirSync(path)

            if (files.includes('renderer.tsx')) {
                const configs: Configuration[] = [
                    {
                        name: `window-${window}-renderer`,
                        mode,
                        target: 'electron-renderer',
                        entry: {
                            renderer: `./src/windows/${window}/renderer.tsx`
                        },
                        output: {
                            filename: '[name].js',
                            path: resolve(__dirname, `dist/windows/${window}`)
                        },
                        module: {
                            rules: [
                                {
                                    test: /\.ts(x)?$/,
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
                                patterns: [{ from: templatePath, to: viewPath }]
                            })
                        ]
                    }
                ]

                if (files.includes('preload.ts')) {
                    configs.push({
                        name: `window-${window}-preload`,
                        mode,
                        target: 'electron-main',
                        entry: {
                            preload: `./src/windows/${window}/preload.ts`
                        },
                        output: {
                            filename: '[name].js',
                            path: resolve(__dirname, `dist/windows/${window}`)
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
                    })
                }

                return configs
            }
        })
        .filter(configs => !!configs) as Configuration[]
}
