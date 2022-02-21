import webpack from 'webpack';
import { WindiPluginUtils, UserOptions } from '@windicss/plugin-utils';

declare module 'virtual:windi.css' { }
declare module 'virtual:windi-base.css' { }
declare module 'virtual:windi-components.css' { }
declare module 'virtual:windi-utilities.css' { }
declare module 'windi.css' { }
declare module 'windi-base.css' { }
declare module 'windi-components.css' { }
declare module 'windi-utilities.css' { }
declare type Compiler = webpack.Compiler & {
    $windi: WindiPluginUtils & {
        dirty: Set<string>;
        root: string;
        virtualModules: Map<string, string>;
        initException?: Error;
    };
};
declare type WindiCSSWebpackPluginOptions = UserOptions & {
    /**
     * Reuse existing utils if exists
     */
    utils?: WindiPluginUtils;
    /**
     * The path where the virtual module should be injected. By default this is the project root but for
     * some projects (such as craco), specifying the directory is needed.
     *
     * @default ''
     */
    virtualModulePath: string;
};

declare class WindiCSSWebpackPlugin {
    options: WindiCSSWebpackPluginOptions;
    constructor(options?: Partial<WindiCSSWebpackPluginOptions>);
    apply(compiler: Compiler): void;
}

export { Compiler, WindiCSSWebpackPluginOptions, WindiCSSWebpackPlugin as default };
