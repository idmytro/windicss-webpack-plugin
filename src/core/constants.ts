export const NAME = 'windicss-webpack-plugin'
export const MODULE_ID = 'windi.css'
export const MODULE_ID_VIRTUAL_TEST = /virtual:windi-?(.*?)\.css/
export const MODULE_ID_VIRTUAL_PREFIX = 'virtual:windi'
export const MODULE_ID_VIRTUAL_MODULES = [
  `${MODULE_ID_VIRTUAL_PREFIX}.css`,
  `${MODULE_ID_VIRTUAL_PREFIX}-base.css`,
  `${MODULE_ID_VIRTUAL_PREFIX}-utilities.css`,
  `${MODULE_ID_VIRTUAL_PREFIX}-components.css`,
]

export const HAS_DIRECTIVE_TEST = /@(apply|variants|screen|layer)\s/
export const HAS_THEME_FUNCTION_TEST = /theme\(.*?\)/
