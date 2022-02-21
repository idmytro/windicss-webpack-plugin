'use strict';

const pluginUtils = require('@windicss/plugin-utils');
const pathe = require('pathe');
const VirtualModulesPlugin = require('webpack-virtual-modules');
const _debug = require('debug');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e["default"] : e; }

const VirtualModulesPlugin__default = /*#__PURE__*/_interopDefaultLegacy(VirtualModulesPlugin);
const _debug__default = /*#__PURE__*/_interopDefaultLegacy(_debug);

const NAME = "windicss-webpack-plugin";
const MODULE_ID = "windi.css";
const MODULE_ID_VIRTUAL_TEST = /virtual:windi-?(.*?)\.css/;
const MODULE_ID_VIRTUAL_PREFIX = "virtual:windi";
const MODULE_ID_VIRTUAL_MODULES = [
  `${MODULE_ID_VIRTUAL_PREFIX}.css`,
  `${MODULE_ID_VIRTUAL_PREFIX}-base.css`,
  `${MODULE_ID_VIRTUAL_PREFIX}-utilities.css`,
  `${MODULE_ID_VIRTUAL_PREFIX}-components.css`
];

const debug = {
  plugin: _debug__default(`${NAME}:plugin`),
  loader: _debug__default(`${NAME}:loader`)
};

const def = (val, def2) => {
  if (val)
    return val;
  return def2;
};

const loadersPath = pathe.resolve(__dirname, "loaders");
const pitcher = pathe.resolve(loadersPath, "windicss-style-pitcher.js");
const transformCSSLoader = pathe.resolve(loadersPath, "windicss-css.js");
const transformTemplateLoader = pathe.resolve(loadersPath, "windicss-template.js");
const virtualModuleLoader = pathe.resolve(loadersPath, "virtual-module.js");
class WindiCSSWebpackPlugin {
  constructor(options = {}) {
    this.options = {
      ...{
        virtualModulePath: ""
      },
      ...options
    };
  }
  apply(compiler) {
    let root = compiler.context;
    if (this.options.root)
      root = this.options.root;
    else if (compiler.options.resolve && compiler.options.resolve.alias && compiler.options.resolve.alias["~"])
      root = compiler.options.resolve.alias["~"];
    if (!compiler.options.module || !compiler.options.module.rules)
      return;
    if (!compiler.options.resolve)
      compiler.options.resolve = {};
    compiler.options.resolve.alias = {
      ...compiler.options.resolve.alias,
      [pathe.join(this.options.virtualModulePath, MODULE_ID)]: pathe.resolve(compiler.context, MODULE_ID_VIRTUAL_MODULES[0]),
      ...MODULE_ID_VIRTUAL_MODULES.reduce((map, key) => {
        map[pathe.join(this.options.virtualModulePath, key)] = pathe.resolve(compiler.context, key);
        return map;
      }, {}),
      ...MODULE_ID_VIRTUAL_MODULES.reduce((map, key) => {
        map[pathe.join(this.options.virtualModulePath, key.replace("virtual:", ""))] = pathe.resolve(compiler.context, key);
        return map;
      }, {})
    };
    debug.plugin("options", this.options);
    compiler.options.module.rules = compiler.options.module.rules.map((rule) => {
      if (!rule.use || !(rule.use instanceof Array))
        return rule;
      rule.use = rule.use.map((use) => {
        if (use === "css-loader") {
          return {
            loader: "css-loader",
            options: {
              importLoaders: 2
            }
          };
        }
        return use;
      });
      return rule;
    });
    const shouldExcludeResource = (resource) => MODULE_ID_VIRTUAL_TEST.test(resource);
    compiler.options.module.rules.push({
      include(resource) {
        if (!compiler.$windi || shouldExcludeResource(resource))
          return false;
        return Boolean(compiler.$windi.isDetectTarget(resource));
      },
      resourceQuery: /type=style/,
      enforce: "post",
      use: [{
        loader: pitcher
      }]
    });
    compiler.options.module.rules.push({
      include(resource) {
        if (!compiler.$windi || shouldExcludeResource(resource))
          return false;
        return Boolean(compiler.$windi.isDetectTarget(resource));
      },
      use: [{
        loader: transformTemplateLoader
      }]
    });
    compiler.options.module.rules.push({
      include(resource) {
        if (!compiler.$windi || shouldExcludeResource(resource))
          return false;
        return Boolean(compiler.$windi.isCssTransformTarget(resource));
      },
      use: [{
        loader: transformCSSLoader
      }]
    });
    compiler.options.module.rules.push({
      include(resource) {
        return MODULE_ID_VIRTUAL_TEST.test(resource);
      },
      enforce: "pre",
      use: [{
        loader: virtualModuleLoader
      }]
    });
    compiler.hooks.afterCompile.tap(NAME, (compilation) => {
      if (!compiler.$windi)
        return;
      if (compiler.$windi.configFilePath) {
        const configFilePath = pathe.resolve(compiler.$windi.configFilePath);
        debug.plugin("config dependency at", configFilePath);
        compilation.fileDependencies.add(configFilePath);
      } else {
        for (const name of ["windi.config.ts", "windi.config.js"]) {
          const path = pathe.resolve(root, name);
          debug.plugin("setting watcher for config creation", path);
          compilation.missingDependencies.add(path);
        }
      }
    });
    const virtualModules = new VirtualModulesPlugin__default(MODULE_ID_VIRTUAL_MODULES.reduce((map, key) => {
      map[pathe.join(this.options.virtualModulePath, key)] = `/* ${key}(boot) */`;
      return map;
    }, {}));
    virtualModules.apply(compiler);
    let hmrId = 0;
    compiler.hooks.invalid.tap(NAME, (resource) => {
      if (!resource)
        resource = "all-modules";
      if (!compiler.$windi || shouldExcludeResource(resource))
        return;
      const skipInvalidation = compiler.$windi.dirty.has(resource) || resource !== "all-modules" && !compiler.$windi.isDetectTarget(resource) && resource !== compiler.$windi.configFilePath;
      debug.plugin("file update", resource, `skip:${skipInvalidation}`);
      if (skipInvalidation)
        return;
      compiler.$windi.dirty.add(resource);
      const moduleUpdateId = hmrId++;
      MODULE_ID_VIRTUAL_MODULES.forEach((virtualModulePath) => {
        let virtualModuleContent = "";
        const match = virtualModulePath.match(MODULE_ID_VIRTUAL_TEST);
        if (match) {
          const layer = match[1] || "all";
          if (compiler.$windi && compiler.$windi.virtualModules.has(layer))
            virtualModuleContent = def(compiler.$windi.virtualModules.get(layer), "");
        }
        virtualModules.writeModule(pathe.join(this.options.virtualModulePath, virtualModulePath), `/* windicss(hmr:${moduleUpdateId}:${resource}) */
${virtualModuleContent}`);
      });
    });
    const initWindyCSSService = async () => {
      if (!compiler.$windi) {
        const utils = def(this.options.utils, pluginUtils.createUtils(this.options, {
          root,
          name: NAME
        }));
        compiler.$windi = Object.assign(utils, {
          root,
          virtualModules: /* @__PURE__ */ new Map(),
          dirty: /* @__PURE__ */ new Set()
        });
        try {
          await compiler.$windi.init();
        } catch (e) {
          compiler.$windi.initException = e;
        }
      }
    };
    compiler.hooks.thisCompilation.tap(NAME, (compilation) => {
      if (!compiler.$windi)
        return;
      if (compiler.$windi.initException) {
        compilation.errors.push(compiler.$windi.initException);
        compiler.$windi.initException = void 0;
      }
      compilation.hooks.childCompiler.tap(NAME, (childCompiler) => {
        childCompiler.$windi = compiler.$windi;
      });
    });
    compiler.hooks.beforeCompile.tapPromise(NAME, async () => {
      await initWindyCSSService();
    });
    compiler.hooks.watchRun.tapPromise(NAME, async () => {
      await initWindyCSSService();
    });
  }
}

module.exports = WindiCSSWebpackPlugin;
